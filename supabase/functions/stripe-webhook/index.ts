import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.19.0?target=deno&deno-std=0.168.0'

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') || ''
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
const PREMIUM_PRICE_ID = Deno.env.get('STRIPE_PRICE_PREMIUM')

console.log('Stripe webhook function initialized.')
if (!STRIPE_SECRET) console.error('STRIPE_SECRET_KEY is not set.')
if (!STRIPE_WEBHOOK_SECRET) console.error('STRIPE_WEBHOOK_SECRET is not set.')
if (!PREMIUM_PRICE_ID) console.error('STRIPE_PRICE_PREMIUM is not set.')

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('Webhook received with no signature.')
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    
    // It is highly recommended to use webhook signature verification in production.
    // const event = await stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    const event: Stripe.Event = JSON.parse(body)
    console.log(`Received Stripe event: ${event.type} (${event.id})`)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('Handling checkout.session.completed.')
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (!userId) {
          console.error('Webhook error: No user_id in checkout session metadata.', session)
          break
        }
        console.log(`Processing checkout for user_id: ${userId}`)

        console.log('Retrieving full session from Stripe...')
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items.data.price.product', 'subscription'],
        });
        console.log('Successfully retrieved full session.')

        if (!fullSession.line_items || !fullSession.subscription) {
            throw new Error('Could not expand line_items or subscription from session');
        }

        const priceId = fullSession.line_items?.data[0]?.price?.id
        const subscriptionDetails = fullSession.subscription as Stripe.Subscription;
        console.log(`Retrieved price ID: ${priceId}`)
        console.log(`Premium price ID from env: ${PREMIUM_PRICE_ID}`)

        let tier: 'free' | 'premium' = 'free'
        if (priceId === PREMIUM_PRICE_ID) {
          tier = 'premium'
          console.log('Price ID matches premium. Setting tier to premium.')
        } else {
          console.warn(`Price ID ${priceId} does not match premium price. Defaulting to free.`)
        }

        const subscriptionData = {
          user_id: userId,
          subscription_tier: tier,
          stripe_customer_id: fullSession.customer,
          stripe_subscription_id: fullSession.subscription.id,
          stripe_price_id: priceId,
          status: subscriptionDetails.status,
          current_period_start: new Date(subscriptionDetails.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscriptionDetails.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscriptionDetails.cancel_at_period_end,
        }

        console.log('Upserting subscription data into Supabase:', subscriptionData)
        const { error } = await supabaseClient
          .from('subscriptions')
          .upsert(subscriptionData, { onConflict: 'user_id' })

        if (error) {
          console.error('Supabase upsert error:', error)
          throw error
        }

        console.log(`Successfully updated subscription for user ${userId} to ${tier}.`)
        break
      }

      // ... (other cases remain the same)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: sub } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!sub) {
          console.warn(`Subscription update for unknown customer: ${customerId}`)
          break
        }

        let tier: 'free' | 'premium' = 'free'
        const priceId = subscription.items?.data[0]?.price?.id
        if (priceId === Deno.env.get('STRIPE_PRICE_PREMIUM')) {
          tier = 'premium'
        }

        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            subscription_tier: tier,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            stripe_price_id: priceId,
          })
          .eq('user_id', sub.user_id)
        
        if (error) throw error

        console.log(`Successfully updated subscription for user ${sub.user_id} via webhook`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer

        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            subscription_tier: 'free',
            cancel_at_period_end: true,
          })
          .eq('stripe_customer_id', customerId)
        
        if (error) throw error
        
        console.log(`Canceled subscription for customer ${customerId}`)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Stripe webhook error:', error.message, error.stack)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

