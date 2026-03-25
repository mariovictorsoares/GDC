/**
 * POST /api/producao/concluir
 * Conclui uma ordem de produção com backward flush:
 * - Cria N saídas tipo='producao' (uma por ingrediente consumido)
 * - Cria 1 entrada para o produto acabado
 * - Atualiza status da OP para 'concluida'
 * - Calcula custo real
 *
 * Usa rollback compensatório: se qualquer passo falhar,
 * deleta registros já criados para manter consistência.
 */
import { serverSupabaseUser } from '#supabase/server'
import { getSupabaseAdmin } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  // Autenticação obrigatória
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const body = await readBody(event)

  // Validação de entrada
  if (!body?.ordem_id) {
    throw createError({ statusCode: 400, message: 'ordem_id é obrigatório' })
  }
  if (!body?.quantidade_produzida || body.quantidade_produzida <= 0) {
    throw createError({ statusCode: 400, message: 'quantidade_produzida deve ser maior que zero' })
  }
  if (!Array.isArray(body?.ingredientes) || body.ingredientes.length === 0) {
    throw createError({ statusCode: 400, message: 'ingredientes[] é obrigatório' })
  }

  const supabase = getSupabaseAdmin()

  // 1. Buscar OP e validar status
  const { data: op, error: errOP } = await supabase
    .from('ordens_producao')
    .select('id, empresa_id, codigo, produto_id, status, quantidade_planejada')
    .eq('id', body.ordem_id)
    .single()

  if (errOP || !op) {
    throw createError({ statusCode: 404, message: 'Ordem de produção não encontrada' })
  }

  if (op.status !== 'em_producao') {
    throw createError({ statusCode: 400, message: `OP não pode ser concluída (status atual: ${op.status})` })
  }

  // Verificar que o usuário pertence à empresa da OP
  const { data: vinculo } = await supabase
    .from('usuarios_empresas')
    .select('id')
    .eq('user_id', user.id)
    .eq('empresa_id', op.empresa_id)
    .single()

  if (!vinculo) {
    throw createError({ statusCode: 403, message: 'Sem permissão para esta empresa' })
  }

  // 2. Buscar ingredientes da OP para validar
  const { data: opIngredientes, error: errIng } = await supabase
    .from('op_ingredientes')
    .select('id, produto_id, quantidade_planejada, custo_unitario')
    .eq('ordem_id', op.id)

  if (errIng || !opIngredientes?.length) {
    throw createError({ statusCode: 400, message: 'OP não possui ingredientes' })
  }

  // Mapear ingredientes do body por produto_id
  const ingredientesMap = new Map(
    body.ingredientes.map((i: any) => [i.produto_id, Number(i.quantidade_real)])
  )

  // IDs criados para rollback + mapeamento saída→ingrediente
  const saidasCriadas: string[] = []
  const saidaIngMap: { saidaId: string; ingId: string; produtoId: string; quantidadeReal: number }[] = []
  let entradaCriada: string | null = null
  let custoTotalReal = 0

  try {
    // 3. Criar saídas para cada ingrediente (backward flush)
    for (const ing of opIngredientes) {
      const quantidadeReal = ingredientesMap.get(ing.produto_id) ?? ing.quantidade_planejada

      if (quantidadeReal <= 0) continue

      // Criar saída tipo='producao'
      // O trigger trigger_set_semana_saida calcula custo_saida automaticamente (UEPS)
      const { data: saida, error: errSaida } = await supabase
        .from('saidas')
        .insert({
          empresa_id: op.empresa_id,
          produto_id: ing.produto_id,
          tipo: 'producao',
          data: new Date().toISOString().split('T')[0],
          quantidade: quantidadeReal,
          ordem_producao_id: op.id,
          observacao: `OP ${op.codigo} - Consumo produção`
        })
        .select('id')
        .single()

      if (errSaida || !saida) {
        throw new Error(`Erro ao criar saída para ingrediente ${ing.produto_id}: ${errSaida?.message}`)
      }

      saidasCriadas.push(saida.id)
      saidaIngMap.push({ saidaId: saida.id, ingId: ing.id, produtoId: ing.produto_id, quantidadeReal })
    }

    // 3.5. Re-consultar saídas para pegar custo_saida confirmado pelo trigger
    // O .select() após .insert() nem sempre retorna valores setados por BEFORE triggers
    if (saidasCriadas.length > 0) {
      const { data: saidasConfirmadas, error: errRequery } = await supabase
        .from('saidas')
        .select('id, custo_saida')
        .in('id', saidasCriadas)

      if (errRequery || !saidasConfirmadas) {
        throw new Error(`Erro ao consultar custos das saídas: ${errRequery?.message}`)
      }

      const custoMap = new Map(saidasConfirmadas.map(s => [s.id, Number(s.custo_saida) || 0]))

      // Acumular custo total e atualizar op_ingredientes
      for (const item of saidaIngMap) {
        const custoSaida = custoMap.get(item.saidaId) || 0
        custoTotalReal += custoSaida

        const { error: errIngUpdate } = await supabase
          .from('op_ingredientes')
          .update({
            quantidade_real: item.quantidadeReal,
            custo_unitario: item.quantidadeReal > 0
              ? Number((custoSaida / item.quantidadeReal).toFixed(4))
              : 0
          })
          .eq('id', item.ingId)

        if (errIngUpdate) {
          throw new Error(`Erro ao atualizar ingrediente ${item.produtoId}: ${errIngUpdate.message}`)
        }
      }
    }

    // 4. Criar entrada para o produto acabado
    const custoUnitarioProduzido = body.quantidade_produzida > 0
      ? Number((custoTotalReal / body.quantidade_produzida).toFixed(4))
      : 0

    const { data: entrada, error: errEntrada } = await supabase
      .from('entradas')
      .insert({
        empresa_id: op.empresa_id,
        produto_id: op.produto_id,
        data: new Date().toISOString().split('T')[0],
        quantidade: body.quantidade_produzida,
        custo_unitario: custoUnitarioProduzido,
        valor_total: Number((custoUnitarioProduzido * body.quantidade_produzida).toFixed(4)),
        origem_producao: true,
        ordem_producao_id: op.id,
        observacao: `Produção OP ${op.codigo}`
      })
      .select('id')
      .single()

    if (errEntrada || !entrada) {
      throw new Error(`Erro ao criar entrada do produto acabado: ${errEntrada?.message}`)
    }

    entradaCriada = entrada.id

    // 5. Atualizar OP como concluída
    const { error: errUpdate } = await supabase
      .from('ordens_producao')
      .update({
        status: 'concluida',
        quantidade_produzida: body.quantidade_produzida,
        custo_real: Number(custoTotalReal.toFixed(4)),
        data_conclusao: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', op.id)

    if (errUpdate) {
      throw new Error(`Erro ao atualizar status da OP: ${errUpdate.message}`)
    }

    // Sucesso
    return {
      success: true,
      ordem_id: op.id,
      codigo: op.codigo,
      saidas_criadas: saidasCriadas.length,
      entrada_criada: entradaCriada,
      custo_real: custoTotalReal,
      quantidade_produzida: body.quantidade_produzida
    }

  } catch (error: any) {
    // ROLLBACK compensatório: deletar registros criados e reverter op_ingredientes
    console.error('Erro no backward flush, iniciando rollback:', error.message)

    // Deletar entrada criada
    if (entradaCriada) {
      await supabase.from('entradas').delete().eq('id', entradaCriada)
    }

    // Deletar saídas criadas
    for (const saidaId of saidasCriadas) {
      await supabase.from('saidas').delete().eq('id', saidaId)
    }

    // Reverter op_ingredientes (limpar quantidade_real preenchida parcialmente)
    await supabase
      .from('op_ingredientes')
      .update({ quantidade_real: null })
      .eq('ordem_id', op.id)

    throw createError({
      statusCode: 500,
      message: `Erro ao concluir produção: ${error.message}. Nenhuma alteração foi persistida.`
    })
  }
})
