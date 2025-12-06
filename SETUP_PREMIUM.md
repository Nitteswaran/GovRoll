# Premium Features Setup Guide

## Quick Setup Checklist

- [ ] Run database migration `002_premium_features.sql`
- [ ] Set up Stripe account and get API keys
- [ ] Add Stripe environment variables
- [ ] Deploy Edge Functions
- [ ] Configure Stripe webhook
- [ ] Set up cron job for scheduled payroll (optional)
- [ ] Configure email provider for bulk payslips (optional)

## Step-by-Step Setup

### 1. Database Migration

Run in Supabase SQL Editor:

```sql
-- Copy and paste contents of:
-- supabase/migrations/002_premium_features.sql
```

This creates all premium feature tables and RLS policies.

### 2. Stripe Setup

1. **Create Stripe Account**
   - Go to https://stripe.com
   - Sign up and verify account
   - Switch to Test Mode for development

2. **Create Premium Product**
   - Products → Add Product
   - Name: "GovRoll Premium"
   - Pricing: Recurring, RM79/month
   - Copy the Price ID (starts with `price_`)

3. **Get API Keys**
   - Developers → API Keys
   - Copy Publishable Key (starts with `pk_`)
   - Copy Secret Key (starts with `sk_`)

4. **Create Webhook**
   - Developers → Webhooks
   - Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy Webhook Signing Secret (starts with `whsec_`)

### 3. Environment Variables

Add to your `.env` file:

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_PREMIUM=price_...

# Supabase (already have these)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

Add to Supabase Dashboard → Settings → Edge Functions → Secrets:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Deploy Edge Functions

Using Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy stripe-create-checkout
supabase functions deploy stripe-create-portal
supabase functions deploy stripe-webhook
supabase functions deploy scheduled-payroll-run
supabase functions deploy send-bulk-payslips
supabase functions deploy detect-anomalies
```

Or deploy via Supabase Dashboard:
1. Go to Edge Functions
2. Create new function
3. Copy-paste code from `supabase/functions/[function-name]/index.ts`
4. Set secrets in function settings

### 5. Test Stripe Integration

1. **Test Checkout**:
   - Login to app
   - Go to Settings
   - Click "Upgrade to Premium"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

2. **Verify Webhook**:
   - Check Stripe Dashboard → Webhooks → Recent events
   - Should see `checkout.session.completed` event
   - Check `subscriptions` table in Supabase
   - Should see subscription with `subscription_tier = 'premium'`

3. **Test Feature Access**:
   - Navigate to premium pages
   - Should have access (no lock screen)

### 6. Optional: Scheduled Payroll Cron

Set up cron job in Supabase:

```sql
-- Run in SQL Editor
SELECT cron.schedule(
  'scheduled-payroll-run',
  '0 9 * * *', -- 9 AM daily
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-payroll-run',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 7. Optional: Email Provider Setup

For bulk payslip distribution:

1. **SendGrid** (recommended):
   - Sign up at https://sendgrid.com
   - Get API key
   - Add to Edge Function secrets: `SENDGRID_API_KEY`

2. **Update `send-bulk-payslips` function**:
   - Add SendGrid SDK
   - Implement email sending with PDF attachments

## Verification

After setup, verify:

1. ✅ Can create subscription in Stripe
2. ✅ Webhook updates `subscriptions` table
3. ✅ Premium features are accessible
4. ✅ Settings page shows subscription status
5. ✅ Can manage subscription via Stripe portal
6. ✅ Feature gates work (lock non-premium users)

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is correct
- Verify webhook secret matches
- Check Supabase function logs
- Ensure function is deployed

### Subscription not updating
- Check webhook events in Stripe Dashboard
- Review Edge Function logs
- Verify RLS policies allow updates
- Check `subscriptions` table structure

### Premium features still locked
- Verify `subscription_tier = 'premium'` in database
- Check `status = 'active'`
- Refresh subscription store: `fetchSubscription(userId)`
- Clear browser cache

### Edge Functions failing
- Check function logs in Supabase Dashboard
- Verify secrets are set correctly
- Check function code for errors
- Ensure proper CORS headers

## Production Checklist

Before going live:

- [ ] Switch Stripe to Live Mode
- [ ] Update environment variables with live keys
- [ ] Test complete subscription flow
- [ ] Verify webhook in production
- [ ] Set up monitoring for Edge Functions
- [ ] Configure email provider for production
- [ ] Set up error alerting
- [ ] Document support process

## Support

For issues:
1. Check function logs
2. Review Stripe Dashboard events
3. Check Supabase logs
4. Verify database state
5. Review this documentation

