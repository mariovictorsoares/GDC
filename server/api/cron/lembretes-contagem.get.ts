/**
 * GET /api/cron/lembretes-contagem
 *
 * Rota para ser chamada por um cron job (ex: a cada 15 min).
 * Verifica quais contagens precisam de lembrete agora e envia via WhatsApp.
 *
 * Pode ser acionado por:
 * - Vercel Cron Jobs (vercel.json)
 * - cron-job.org (serviço gratuito)
 * - Supabase Edge Functions com pg_cron
 * - Qualquer scheduler externo
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Segurança: verificar CRON_SECRET se estiver configurado (Vercel Cron envia no header)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = getHeader(event, 'authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      throw createError({ statusCode: 401, message: 'Não autorizado' })
    }
  }

  // Validar configuração
  if (!config.zapiInstanceId || !config.zapiToken) {
    throw createError({ statusCode: 500, message: 'Z-API não configurada' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: 'Supabase não configurado' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Buscar contagens ativas com recorrência definida
  const { data: contagens, error } = await supabase
    .from('contagens')
    .select(`
      id, nome, recorrencia, horario_notificacao, dias_semana,
      mensal_posicao, mensal_dia, responsavel_nome, responsavel_telefone,
      status, ultima_contagem, data,
      contagem_setores ( setor_id, setores ( nome ) )
    `)
    .neq('recorrencia', 'nenhuma')
    .in('status', ['aguardando', 'pendente', 'atrasada'])

  if (error) {
    console.error('[Cron] Erro ao buscar contagens:', error.message)
    throw createError({ statusCode: 500, message: error.message })
  }

  if (!contagens || contagens.length === 0) {
    return { enviados: 0, mensagem: 'Nenhuma contagem pendente de lembrete' }
  }

  const agora = new Date()
  const horaAtual = agora.getHours()
  const minutoAtual = agora.getMinutes()
  const diaSemanaAtual = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][agora.getDay()]

  const resultados: { contagem: string; sucesso: boolean; erro?: string }[] = []

  for (const contagem of contagens) {
    // Verificar se tem responsável com telefone
    if (!contagem.responsavel_telefone || !contagem.responsavel_nome) continue

    // Verificar horário de notificação
    const horario = contagem.horario_notificacao || '07:00'
    const [horaNotif, minNotif] = horario.split(':').map(Number)

    // Só envia se estiver na janela de horário (±15 min)
    const diffMinutos = Math.abs((horaAtual * 60 + minutoAtual) - (horaNotif * 60 + (minNotif || 0)))
    if (diffMinutos > 15) continue

    // Verificar dia da semana para recorrência semanal/quinzenal
    if (contagem.recorrencia === 'semanal' || contagem.recorrencia === 'quinzenal') {
      const diasConfig = contagem.dias_semana || []
      if (diasConfig.length > 0 && !diasConfig.includes(diaSemanaAtual)) continue
    }

    // Verificar dia do mês para recorrência mensal
    if (contagem.recorrencia === 'mensal') {
      if (!verificarDiaMensal(agora, contagem.mensal_posicao, contagem.mensal_dia)) continue
    }

    // Montar nomes dos setores
    const setores = (contagem.contagem_setores || [])
      .map((cs: any) => cs.setores?.nome)
      .filter(Boolean)

    // Montar e enviar mensagem
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

    resultados.push({
      contagem: contagem.nome,
      sucesso: result.success,
      erro: result.error
    })

    // Pequeno delay entre envios para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const enviados = resultados.filter(r => r.sucesso).length
  const falhas = resultados.filter(r => !r.sucesso).length

  console.log(`[Cron] Lembretes enviados: ${enviados} | Falhas: ${falhas}`)

  return {
    enviados,
    falhas,
    total: resultados.length,
    detalhes: resultados
  }
})

/**
 * Verifica se hoje é o dia correto para a recorrência mensal
 */
function verificarDiaMensal(
  hoje: Date,
  posicao?: string | null,
  diaSemana?: string | null
): boolean {
  if (!posicao || !diaSemana) return false

  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const diaDoMes = hoje.getDate()
  const diaDaSemana = hoje.getDay() // 0=dom, 1=seg...

  // "dia do mês" = primeiro ou último dia do mês
  if (diaSemana === 'dia') {
    if (posicao === 'primeira') return diaDoMes === 1
    if (posicao === 'ultima') {
      const ultimoDia = new Date(ano, mes + 1, 0).getDate()
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
  if (diaDaSemana !== diaAlvo) return false

  if (posicao === 'primeira') {
    // Primeira ocorrência: dia 1-7
    return diaDoMes <= 7
  }

  if (posicao === 'ultima') {
    // Última ocorrência: últimos 7 dias do mês
    const ultimoDia = new Date(ano, mes + 1, 0).getDate()
    return diaDoMes > ultimoDia - 7
  }

  return false
}
