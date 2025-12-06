# Troubleshooting Stripe Edge Function Errors

## Error: "Edge function returned a non-2xx status code"

This error means the `stripe-create-checkout` Edge Function is failing. Here's how to fix it:

### Step 1: Check if Edge Function is Deployed

1. Go to Supabase Dashboard → Edge Functions
2. Look for `stripe-create-checkout` in the list
3. If it's not there, you need to deploy it

**To Deploy:**
- Option A: Via Dashboard (Easier)
  1. Click "Create a new function"
  2. Name it: `stripe-create-checkout`
  3. Copy code from `supabase/functions/stripe-create-checkout/index.ts`
  4. Paste and save

- Option B: Via CLI
  ```bash
  supabase functions deploy stripe-create-checkout
  ```

### Step 2: Check Environment Variables/Secrets

The Edge Function needs these secrets set in Supabase:

1. Go to Supabase Dashboard → Settings → Edge Functions → Secrets
2. Add these secrets:
   - `STRIPE_SECRET_KEY` = `sk_test_...` (from Stripe Dashboard)
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_ANON_KEY` = Your Supabase anon key

**How to get Stripe Secret Key:**
1. Go to https://dashboard.stripe.com
2. Developers → API Keys
3. Copy "Secret key" (starts with `sk_test_` for test mode)

### Step 3: Check Function Logs

1. Go to Supabase Dashboard → Edge Functions
2. Click on `stripe-create-checkout`
3. Go to "Logs" tab
4. Look for error messages

Common errors you might see:
- `STRIPE_SECRET_KEY is not configured` → Missing secret
- `No authorization header` → Auth issue
- `Invalid user` → User not authenticated
- `Stripe API returned 401` → Invalid Stripe key
- `Stripe API returned 400` → Invalid price ID

### Step 4: Verify Frontend Environment Variables

Check your `.env` file has:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_PREMIUM=price_...
```

**How to get these:**
1. Stripe Dashboard → Developers → API Keys → Copy "Publishable key"
2. Stripe Dashboard → Products → Your Premium Product → Copy "Price ID"

### Step 5: Test the Function Manually

You can test the Edge Function directly:

1. Go to Supabase Dashboard → Edge Functions → `stripe-create-checkout`
2. Click "Invoke"
3. Use this test payload:
```json
{
  "priceId": "price_xxxxx"
}
```
4. Check the response

### Step 6: Common Issues & Fixes

#### Issue: "STRIPE_SECRET_KEY is not configured"
**Fix:** Add the secret in Supabase Dashboard → Settings → Edge Functions → Secrets

#### Issue: "No authorization header"
**Fix:** Make sure you're logged in. The function needs your auth token.

#### Issue: "Invalid price ID"
**Fix:** 
- Check `VITE_STRIPE_PRICE_PREMIUM` in your `.env`
- Make sure the price ID starts with `price_`
- Verify it exists in Stripe Dashboard

#### Issue: "Stripe API returned 401"
**Fix:**
- Check your Stripe Secret Key is correct
- Make sure you're using test keys in test mode
- Verify the key hasn't been revoked

#### Issue: Function not found (404)
**Fix:**
- Deploy the function first
- Check the function name matches exactly: `stripe-create-checkout`

### Step 7: Debug Checklist

- [ ] Edge Function is deployed
- [ ] `STRIPE_SECRET_KEY` secret is set
- [ ] `SUPABASE_URL` secret is set (or use Deno.env.get)
- [ ] `SUPABASE_ANON_KEY` secret is set (or use Deno.env.get)
- [ ] Frontend `.env` has `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Frontend `.env` has `VITE_STRIPE_PRICE_PREMIUM`
- [ ] User is logged in
- [ ] Stripe account is in test mode (for development)
- [ ] Price ID exists in Stripe Dashboard

### Quick Test

1. Open browser console (F12)
2. Click "Upgrade to Premium"
3. Check console for error messages
4. Check Network tab → Look for the Edge Function call
5. Check the response for error details

### Still Not Working?

1. Check Supabase Edge Function logs
2. Check browser console for detailed errors
3. Verify all environment variables are set
4. Make sure you're using test mode keys (for development)
5. Try redeploying the function

### Production Checklist

Before going live:
- [ ] Switch to Stripe Live Mode
- [ ] Update all keys to live keys
- [ ] Test complete checkout flow
- [ ] Verify webhook is configured
- [ ] Test subscription cancellation

