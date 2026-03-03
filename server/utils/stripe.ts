/**
 * Utilitário Stripe — gerencia instância do cliente Stripe
 */

import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const config = useRuntimeConfig()
    if (!config.stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada')
    }
    _stripe = new Stripe(config.stripeSecretKey)
  }
  return _stripe
}

/**
 * Verifica se o Stripe está configurado (tem chave)
 */
export function isStripeConfigured(): boolean {
  const config = useRuntimeConfig()
  return !!config.stripeSecretKey
}
