/**
 * GET /api/whatsapp/teste?phone=5511999999999
 * Rota de teste — envia uma mensagem de teste para verificar se a Z-API está funcionando
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const phone = query.phone as string
  if (!phone) {
    throw createError({ statusCode: 400, message: 'Parâmetro "phone" é obrigatório (ex: ?phone=5511999999999)' })
  }

  if (!config.zapiInstanceId || !config.zapiToken) {
    throw createError({ statusCode: 500, message: 'Z-API não configurada' })
  }

  const result = await sendWhatsAppText(
    {
      instanceId: config.zapiInstanceId,
      token: config.zapiToken,
      clientToken: config.zapiClientToken,
      baseUrl: config.zapiBaseUrl
    },
    {
      phone,
      message: '✅ *Teste Z-API*\n\nSe você recebeu esta mensagem, a integração com WhatsApp está funcionando corretamente!\n\n_Guardião do Estoque_'
    }
  )

  return result
})
