/**
 * POST /api/whatsapp/enviar
 * Envia uma mensagem de WhatsApp via Z-API
 *
 * Body: { phone: string, message: string }
 */
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Auth: apenas usuários autenticados
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Não autenticado' })
  }

  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body?.phone || !body?.message) {
    throw createError({
      statusCode: 400,
      message: 'Campos "phone" e "message" são obrigatórios'
    })
  }

  if (!config.zapiInstanceId || !config.zapiToken) {
    throw createError({
      statusCode: 500,
      message: 'Z-API não configurada. Verifique as variáveis de ambiente.'
    })
  }

  const result = await sendWhatsAppText(
    {
      instanceId: config.zapiInstanceId,
      token: config.zapiToken,
      clientToken: config.zapiClientToken,
      baseUrl: config.zapiBaseUrl
    },
    {
      phone: body.phone,
      message: body.message
    }
  )

  if (!result.success) {
    throw createError({
      statusCode: 502,
      message: result.error || 'Erro ao enviar mensagem via Z-API'
    })
  }

  return {
    success: true,
    messageId: result.messageId
  }
})
