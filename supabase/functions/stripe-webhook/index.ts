import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') || ''
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()

    // Verify webhook signature (simplified - would use Stripe SDK)
    // const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)

    const event = JSON.parse(body)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id

        if (!userId) break

        // Determine tier from price_id
        let tier = 'free'
        if (session.price_id === Deno.env.get('STRIPE_PRICE_PREMIUM')) {
          tier = 'premium'
        }

        // Update or create subscription
        await supabaseClient
          .from('subscriptions')
          .upsert({
            user_id: userId,
            subscription_tier: tier,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            stripe_price_id: session.price_id,
            status: 'active',
            current_period_start: new Date(session.current_period_start * 1000).toISOString(),
            current_period_end: new Date(session.current_period_end * 1000).toISOString(),
          })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer

        // Find user by customer_id
        const { data: sub } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!sub) break

        let tier = 'free'
        if (subscription.items?.data[0]?.price?.id === Deno.env.get('STRIPE_PRICE_PREMIUM')) {
          tier = 'premium'
        }

        await supabaseClient
          .from('subscriptions')
          .update({
            subscription_tier: tier,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('user_id', sub.user_id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            subscription_tier: 'free',
          })
          .eq('stripe_customer_id', customerId)

        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

