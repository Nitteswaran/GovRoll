import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

export const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null

export const STRIPE_PRICE_PREMIUM = import.meta.env.VITE_STRIPE_PRICE_PREMIUM || ''

export async function createCheckoutSession(priceId: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
    body: { priceId },
  })

  if (error) {
    throw new Error(error.message || 'Failed to create checkout session')
  }

  return data.sessionId
}

export async function createPortalSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('stripe-create-portal', {
    body: {},
  })

  if (error) {
    throw new Error(error.message || 'Failed to create portal session')
  }

  return data.url
}

