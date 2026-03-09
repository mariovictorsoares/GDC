/**
 * GET /api/cron/lembretes-contagem
 *
 * Rota para ser chamada por um cron job (a cada 1 min via pg_cron no Supabase).
 * Verifica quais contagens precisam de lembrete AGORA (minuto exato) e envia via WhatsApp.
 *
 * Precisão: match exato de hora:minuto (sem janela de tolerância).
 * Deduplicação: coluna `ultimo_lembrete_enviado` impede envio duplicado.
 * Timezone: Intl.DateTimeFormat.formatToParts() — confiável em qualquer runtime.
 */
import { createClient } from '@supabase/supabase-js'

/**
 * Obtém data/hora atual em Brasília usando Intl.DateTimeFormat.formatToParts()
 * Método mais confiável — funciona em Node.js, Deno, Cloudflare Workers, Vercel Edge, etc.
 */
function getHorarioBrasilia(): {
  hora: number
  minuto: number
  diaSemana: string
  diaDoMes: number
  mes: number
  ano: number
  diaDaSemanaNum: number
} {
  const agora = new Date()

  // formatToParts com todas as partes que precisamos
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour12: false
  }).formatToParts(agora)

  const get = (type: string) => partes.find(p => p.type === type)?.value || ''

  const hora = Number(get('hour'))
  const minuto = Number(get('minute'))
  const diaDoMes = Number(get('day'))
  const mes = Number(get('month'))
  const ano = Number(get('year'))

  // Mapear weekday short (en-US) → nosso formato
  const weekdayMap: Record<string, string> = {
    Sun: 'dom', Mon: 'seg', Tue: 'ter', Wed: 'qua',
    Thu: 'qui', Fri: 'sex', Sat: 'sab'
  }
  const weekdayNumMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
  }
  const weekdayShort = get('weekday')
  const diaSemana = weekdayMap[weekdayShort] || 'seg'
  const diaDaSemanaNum = weekdayNumMap[weekdayShort] ?? 1

  return { hora, minuto, diaSemana, diaDoMes, mes, ano, diaDaSemanaNum }
}

/**
 * Calcula o minuto anterior (para retry em caso de falha no envio).
 * Ex: 15:00 → 14:59, 00:00 → 23:59
 */
function getMinutoAnterior(hora: number, minuto: number): string {
  let minAnt = minuto - 1
  let horaAnt = hora
  if (minAnt < 0) {
    minAnt = 59
    horaAnt = horaAnt - 1
    if (horaAnt < 0) horaAnt = 23
  }
  return `${String(horaAnt).padStart(2, '0')}:${String(minAnt).padStart(2, '0')}`
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Segurança: verificar CRON_SECRET (fail-closed)
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    throw createError({ statusCode: 500, message: 'CRON_SECRET não configurado' })
  }
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Não autorizado' })
  }

  // Validar configuração
  if (!config.zapiInstanceId || !config.zapiToken) {
    throw createError({ statusCode: 500, message: 'Z-API não configurada' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Obter horário de Brasília com precisão
  const brasilia = getHorarioBrasilia()
  const horaAtualStr = `${String(brasilia.hora).padStart(2, '0')}:${String(brasilia.minuto).padStart(2, '0')}`
  // Minuto anterior para retry: se falhou às 15:00, tenta de novo às 15:01
  const horaAnteriorStr = getMinutoAnterior(brasilia.hora, brasilia.minuto)

  console.log(`[Cron] Brasília: ${horaAtualStr} | Dia: ${brasilia.diaSemana} | ${brasilia.diaDoMes}/${brasilia.mes}/${brasilia.ano}`)

  // Buscar contagens que devem notificar AGORA ou que falharam no minuto anterior
  const { data: contagens, error } = await supabase
    .from('contagens')
    .select(`
      id, nome, recorrencia, horario_notificacao, dias_semana,
      mensal_posicao, mensal_dia, responsavel_nome, responsavel_telefone,
      status, ultima_contagem, data, ultimo_lembrete_enviado,
      contagem_setores ( setor_id, setores ( nome ) )
    `)
    .neq('recorrencia', 'nenhuma')
    .in('status', ['aguardando', 'pendente', 'atrasada'])
    .in('horario_notificacao', [horaAtualStr, horaAnteriorStr])

  if (error) {
    console.error('[Cron] Erro ao buscar contagens:', error.message)
    throw createError({ statusCode: 500, message: error.message })
  }

  if (!contagens || contagens.length === 0) {
    return { enviados: 0, mensagem: `Nenhuma contagem agendada para ${horaAtualStr}` }
  }

  console.log(`[Cron] ${contagens.length} contagem(ns) candidata(s) para ${horaAtualStr}`)

  // Data de hoje em Brasília no formato YYYY-MM-DD para deduplicação
  const hojeBrasilia = `${brasilia.ano}-${String(brasilia.mes).padStart(2, '0')}-${String(brasilia.diaDoMes).padStart(2, '0')}`
  // Timestamp completo para marcar o envio
  const timestampEnvio = `${hojeBrasilia}T${horaAtualStr}:00-03:00`

  const resultados: { contagem: string; sucesso: boolean; erro?: string; motivo?: string }[] = []

  for (const contagem of contagens) {
    // Verificar se tem responsável com telefone
    if (!contagem.responsavel_telefone || !contagem.responsavel_nome) continue

    // Verificar dia da semana para recorrência semanal/quinzenal
    if (contagem.recorrencia === 'semanal' || contagem.recorrencia === 'quinzenal') {
      const diasConfig = contagem.dias_semana || []
      if (diasConfig.length > 0 && !diasConfig.includes(brasilia.diaSemana)) continue
    }

    // Verificar dia do mês para recorrência mensal (usando data de Brasília)
    if (contagem.recorrencia === 'mensal') {
      if (!verificarDiaMensal(brasilia, contagem.mensal_posicao, contagem.mensal_dia)) continue
    }

    // ═══════════════════════════════════════════════════════════════════
    // DEDUPLICAÇÃO ATÔMICA (claim pattern)
    //
    // UPDATE ... WHERE garante que apenas UMA requisição consegue "clamar"
    // o envio. Se duas requests chegam ao mesmo tempo, o PostgreSQL executa
    // os UPDATEs sequencialmente — só a primeira vai casar o WHERE.
    //
    // Condição: ultimo_lembrete_enviado é NULL ou é de um dia anterior a hoje
    // ═══════════════════════════════════════════════════════════════════
    const { data: claimed, error: claimError } = await supabase
      .from('contagens')
      .update({ ultimo_lembrete_enviado: timestampEnvio })
      .eq('id', contagem.id)
      .or(`ultimo_lembrete_enviado.is.null,ultimo_lembrete_enviado.lt.${hojeBrasilia}T00:00:00-03:00`)
      .select('id')

    if (claimError) {
      console.error(`[Cron] Erro ao clamar "${contagem.nome}":`, claimError.message)
      resultados.push({ contagem: contagem.nome, sucesso: false, erro: claimError.message })
      continue
    }

    if (!claimed || claimed.length === 0) {
      // Outro processo já clamou — não envia de novo
      console.log(`[Cron] "${contagem.nome}" já foi clamado por outro processo, pulando`)
      resultados.push({ contagem: contagem.nome, sucesso: true, motivo: 'já enviado hoje' })
      continue
    }

    // Claim obtido com sucesso — somos os únicos que vão enviar
    console.log(`[Cron] Claim obtido para "${contagem.nome}", enviando...`)

    // Montar nomes dos setores
    const setores = (contagem.contagem_setores || [])
      .map((cs: any) => cs.setores?.nome)
      .filter(Boolean)

    // Montar e enviar mensagem
    const horario = contagem.horario_notificacao || '07:00'
    const mensagem = montarMensagemLembrete({
      nomeContagem: contagem.nome,
      responsavelNome: contagem.responsavel_nome,
      setores,
      recorrencia: contagem.recorrencia,
      horario
    })

    const result = await sendWhatsAppText(
      {
        instanceId: config.zapiInstanceId,
        token: config.zapiToken,
        clientToken: config.zapiClientToken,
        baseUrl: config.zapiBaseUrl
      },
      {
        phone: contagem.responsavel_telefone,
        message: mensagem
      }
    )

    if (!result.success) {
      // Envio falhou — LIBERAR o claim para retry no próximo minuto
      console.error(`[Cron] Falha ao enviar "${contagem.nome}", liberando claim para retry`)
      await supabase
        .from('contagens')
        .update({ ultimo_lembrete_enviado: null })
        .eq('id', contagem.id)
    }

    resultados.push({
      contagem: contagem.nome,
      sucesso: result.success,
      erro: result.error
    })

    // Pequeno delay entre envios para não sobrecarregar Z-API
    if (contagens.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const enviados = resultados.filter(r => r.sucesso && !r.motivo).length
  const falhas = resultados.filter(r => !r.sucesso).length
  const duplicados = resultados.filter(r => r.motivo === 'já enviado hoje').length

  console.log(`[Cron] Enviados: ${enviados} | Falhas: ${falhas} | Já enviados: ${duplicados}`)

  return {
    enviados,
    falhas,
    duplicados,
    total: resultados.length,
    horaBrasilia: horaAtualStr,
    detalhes: resultados
  }
})

/**
 * Verifica se hoje é o dia correto para a recorrência mensal.
 * Recebe dados já convertidos para Brasília (sem depender de Date UTC).
 */
function verificarDiaMensal(
  brasilia: { diaDoMes: number; mes: number; ano: number; diaDaSemanaNum: number },
  posicao?: string | null,
  diaSemana?: string | null
): boolean {
  if (!posicao || !diaSemana) return false

  const { diaDoMes, mes, ano, diaDaSemanaNum } = brasilia

  // "dia do mês" = primeiro ou último dia do mês
  if (diaSemana === 'dia') {
    if (posicao === 'primeira') return diaDoMes === 1
    if (posicao === 'ultima') {
      const ultimoDia = new Date(ano, mes, 0).getDate() // mes já é 1-based do Intl
      return diaDoMes === ultimoDia
    }
    return false
  }

  // Mapear nome para número do dia da semana
  const diaMap: Record<string, number> = {
    domingo: 0, segunda: 1, terca: 2, quarta: 3,
    quinta: 4, sexta: 5, sabado: 6
  }
  const diaAlvo = diaMap[diaSemana]
  if (diaAlvo === undefined) return false

  // Verificar se hoje é o dia da semana correto
  if (diaDaSemanaNum !== diaAlvo) return false

  if (posicao === 'primeira') {
    // Primeira ocorrência: dia 1-7
    return diaDoMes <= 7
  }

  if (posicao === 'ultima') {
    // Última ocorrência: últimos 7 dias do mês
    const ultimoDia = new Date(ano, mes, 0).getDate()
    return diaDoMes > ultimoDia - 7
  }

  return false
}
