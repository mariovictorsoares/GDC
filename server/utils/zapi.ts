/**
 * Utilitário Z-API — envia mensagens pelo WhatsApp
 */

interface ZApiConfig {
  instanceId: string
  token: string
  clientToken: string
  baseUrl: string
}

interface SendTextPayload {
  phone: string
  message: string
}

/**
 * Formata número de telefone brasileiro para o padrão Z-API
 * Aceita: (11) 99999-9999, 11999999999, +5511999999999
 * Retorna: 5511999999999
 */
export function formatPhoneNumber(phone: string): string {
  // Remove tudo que não é dígito
  let digits = phone.replace(/\D/g, '')

  // Se começa com +55 ou 55 e tem 12-13 dígitos, já está no formato
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits
  }

  // Se tem 10-11 dígitos (DDD + número), adiciona 55
  if (digits.length >= 10 && digits.length <= 11) {
    return `55${digits}`
  }

  // Fallback: retorna como está
  return digits
}

/**
 * Envia mensagem de texto via Z-API
 */
export async function sendWhatsAppText(
  config: ZApiConfig,
  payload: SendTextPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const url = `${config.baseUrl}/instances/${config.instanceId}/token/${config.token}/send-text`

  const formattedPhone = formatPhoneNumber(payload.phone)

  try {
    const response = await $fetch<any>(url, {
      method: 'POST',
      headers: {
        'Client-Token': config.clientToken
      },
      body: {
        phone: formattedPhone,
        message: payload.message
      }
    })

    return {
      success: true,
      messageId: response?.messageId || response?.id
    }
  } catch (error: any) {
    console.error('[Z-API] Erro ao enviar mensagem:', error?.data || error?.message)
    return {
      success: false,
      error: error?.data?.message || error?.message || 'Erro desconhecido ao enviar WhatsApp'
    }
  }
}

/**
 * Monta a mensagem de lembrete de contagem
 */
export function montarMensagemLembrete(dados: {
  nomeContagem: string
  contagemId?: string
  responsavelNome: string
  setores: string[]
  recorrencia: string
  horario: string
  baseUrl?: string
}): string {
  const setoresTexto = dados.setores.length > 0
    ? dados.setores.map(s => `  • ${s}`).join('\n')
    : '  • Todos os setores'

  const recorrenciaLabel: Record<string, string> = {
    diaria: 'Diária',
    semanal: 'Semanal',
    quinzenal: 'Quinzenal',
    mensal: 'Mensal'
  }

  const appUrl = dados.baseUrl || 'https://gdcnew.vercel.app'
  const link = `${appUrl}/movimentos/ajustes`

  return [
    `📋 *Lembrete de Contagem*`,
    ``,
    `Olá, *${dados.responsavelNome}*!`,
    `Está na hora de realizar a contagem:`,
    ``,
    `📌 *${dados.nomeContagem}*`,
    `🔄 Recorrência: ${recorrenciaLabel[dados.recorrencia] || dados.recorrencia}`,
    `⏰ Horário: ${dados.horario}`,
    ``,
    `📍 *Setores:*`,
    setoresTexto,
    ``,
    `👉 *Acesse e inicie a contagem:*`,
    link
  ].join('\n')
}
