import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') || ''

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!STRIPE_SECRET) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }

    const { priceId } = await req.json()
    if (!priceId) {
      throw new Error('priceId is required')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': authHeader,
        'apikey': supabaseKey,
      },
    })

    const user = await userResponse.json()
    if (!user.id) {
      throw new Error('Invalid user')
    }

    // Create Stripe checkout session
    const origin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:5173'
    const baseUrl = origin.replace(/\/$/, '')
    
    const stripeParams = new URLSearchParams()
    stripeParams.append('mode', 'subscription')
    stripeParams.append('payment_method_types[0]', 'card')
    stripeParams.append('line_items[0][price]', priceId)
    stripeParams.append('line_items[0][quantity]', '1')
    stripeParams.append('success_url', `${baseUrl}/dashboard/settings?success=true`)
    stripeParams.append('cancel_url', `${baseUrl}/dashboard/settings?canceled=true`)
    stripeParams.append('metadata[user_id]', user.id)

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeParams.toString(),
    })

    const session = await stripeResponse.json()

    if (!stripeResponse.ok) {
      console.error('Stripe API error:', session)
      throw new Error(session.error?.message || `Stripe API returned ${stripeResponse.status}`)
    }

    if (session.error) {
      throw new Error(session.error.message)
    }

    if (!session.id) {
      throw new Error('No session ID returned from Stripe')
    }

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('not configured') ? 500 : 400,
      }
    )
  }
})

