# GovRoll Premium Features Documentation

## Overview

GovRoll Premium extends the base MVP with advanced features for enterprise payroll management, automation, and compliance. This document outlines all premium features and their implementation.

## Subscription Tiers

- **Free**: Basic payroll features
- **Pro**: Enhanced features (future tier)
- **Premium**: All features unlocked (RM79/month)

## Premium Features

### 1. Multi-Company & Multi-User Support

**Location**: `/dashboard/multi-company`

**Features**:
- Manage multiple companies under one account
- Switch between companies via dropdown
- Invite team members with role-based access:
  - **Admin**: Full access, can manage users
  - **Accountant**: Can manage payroll and employees
  - **Staff**: Read-only access

**Database Tables**:
- `company_users`: Links users to companies with roles
- Updated `companies` RLS policies for multi-user access

**Usage**:
1. Navigate to Multi-Company page
2. Click "Add Company" to create a new company
3. Use "Invite User" to add team members
4. Switch companies using the dropdown in sidebar

---

### 2. Auto Payroll Scheduling

**Location**: `/dashboard/scheduled-payroll`

**Features**:
- Schedule monthly payroll runs automatically
- Set day of month for automatic execution
- Auto-generate compliance files (EPF, SOCSO, PCB)
- Auto-send payslips via email
- Pause/resume schedules

**Database Tables**:
- `scheduled_payrolls`: Stores schedule configuration

**Edge Function**: `scheduled-payroll-run`
- Runs via cron job (configure in Supabase)
- Creates payroll runs automatically
- Generates files if enabled
- Sends payslips if enabled

**Setup**:
1. Create a schedule with run month pattern and day
2. Enable auto-generate files and/or auto-send payslips
3. Schedule runs automatically on the specified day

**Cron Configuration** (Supabase):
```sql
-- Set up cron job to run daily
SELECT cron.schedule(
  'scheduled-payroll-run',
  '0 9 * * *', -- 9 AM daily
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scheduled-payroll-run',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

### 3. Bulk Payslip Distribution

**Location**: `/dashboard/bulk-payslips`

**Features**:
- Generate payslips for all employees in a payroll run
- Preview before sending
- Send all payslips via email automatically
- Track sent/unsent status

**Edge Function**: `send-bulk-payslips`
- Generates PDF payslips for each employee
- Uploads to Supabase Storage
- Creates email notifications
- Sends emails (requires email provider integration)

**Usage**:
1. Select a payroll run
2. Review the list of employees
3. Click "Send All Payslips"
4. System generates and emails all payslips

---

### 4. Anomaly Detection

**Location**: `/dashboard/anomaly-detection`

**Features**:
- Automatic detection of payroll calculation errors
- Detects:
  - EPF miscalculations
  - Missing EPF/SOCSO contributions
  - PCB calculation errors
  - Unusual salary amounts
- Severity levels: Low, Medium, High, Critical
- Mark anomalies as resolved

**Edge Function**: `detect-anomalies`
- Runs heuristics on payroll data
- Compares expected vs actual calculations
- Flags discrepancies
- Stores results in `anomaly_detections` table

**Usage**:
1. Select a payroll run
2. Click "Run Detection"
3. Review detected anomalies
4. Mark as resolved when fixed

---

### 5. Custom Report Generator

**Location**: `/dashboard/reports`

**Features**:
- Filter payroll data by:
  - Date range
  - Salary range
  - Department (future)
- Export to CSV
- Real-time filtering

**Usage**:
1. Set filters (date range, salary range)
2. View filtered results in table
3. Click "Export CSV" to download

---

### 6. Overtime & Bonus Automation

**Location**: `/dashboard/automation`

**Features**:
- Create rules for automatic payroll calculations
- Rule types:
  - Overtime (e.g., 1.5x for weekends)
  - Bonus (performance-based)
  - Allowance (travel, meal)
  - Deduction (loans, advances)
- JSON-based conditions and actions
- Enable/disable rules

**Database Tables**:
- `payroll_automation_rules`: Stores rule configurations

**Usage**:
1. Create a new rule
2. Define conditions (JSON format)
3. Define actions (JSON format)
4. Enable the rule
5. Rules apply automatically to payroll runs

**Example Rule**:
```json
{
  "conditions": {
    "hours": ">40",
    "day": "weekend"
  },
  "actions": {
    "multiplier": 1.5,
    "base_rate": "hourly"
  }
}
```

---

### 7. Audit Logs & Versioned Payroll History

**Location**: `/dashboard/audit-logs`

**Features**:
- Complete audit trail of all system actions
- Track changes to:
  - Companies
  - Employees
  - Payroll runs
  - Payroll items
- View old vs new values
- Search and filter logs
- Payroll run snapshots for versioning

**Database Tables**:
- `audit_logs`: Stores all audit events
- `payroll_run_snapshots`: Stores versioned payroll data

**Usage**:
1. Navigate to Audit Logs
2. Search by action or entity type
3. View detailed change history
4. Expand "View Changes" to see old/new values

**Integration**:
Use `createAuditLog()` from `@/lib/audit-log` throughout the app:
```typescript
import { createAuditLog } from '@/lib/audit-log'

await createAuditLog({
  company_id: company.id,
  user_id: user.id,
  action: 'update',
  entity_type: 'employee',
  entity_id: employee.id,
  old_values: oldData,
  new_values: newData,
})
```

---

## Stripe Integration

### Setup

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)
   - Create account and get API keys

2. **Create Premium Price**
   - In Stripe Dashboard, create a product "GovRoll Premium"
   - Create a recurring price: RM79/month
   - Copy the Price ID

3. **Environment Variables**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_STRIPE_PRICE_PREMIUM=price_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. **Webhook Configuration**
   - In Stripe Dashboard, create webhook endpoint
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events to listen:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

### Subscription Flow

1. User clicks "Upgrade to Premium"
2. Frontend calls `createCheckoutSession()`
3. User redirected to Stripe Checkout
4. After payment, webhook updates `subscriptions` table
5. User gains access to premium features

### Subscription Management

- Users can manage subscription in Settings
- Click "Manage Subscription" to open Stripe Customer Portal
- Can cancel, update payment method, view invoices

---

## Feature Gating

All premium features are protected by the `FeatureGate` component:

```tsx
import { FeatureGate } from '@/hooks/use-feature-gate'

<FeatureGate feature="multi-company">
  <YourPremiumComponent />
</FeatureGate>
```

Non-premium users see a locked screen with upgrade prompt.

---

## Database Schema Updates

Run the migration file:
```sql
-- Run in Supabase SQL Editor
\i supabase/migrations/002_premium_features.sql
```

This creates:
- `subscriptions` table
- `company_users` table
- `scheduled_payrolls` table
- `audit_logs` table
- `payroll_run_snapshots` table
- `anomaly_detections` table
- `payroll_automation_rules` table
- `email_notifications` table

---

## Edge Functions

### Deploy Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy scheduled-payroll-run
supabase functions deploy send-bulk-payslips
supabase functions deploy detect-anomalies
supabase functions deploy stripe-webhook
```

### Function Secrets

Set secrets in Supabase Dashboard:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Email Integration

For bulk payslip distribution, integrate an email provider:

1. **SendGrid** (recommended)
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Get API key
   - Add to Edge Function environment

2. **Update `send-bulk-payslips` function**
   - Add SendGrid SDK
   - Send emails with PDF attachments

---

## Testing Premium Features

1. **Create Test Subscription**:
   ```sql
   INSERT INTO subscriptions (user_id, subscription_tier, status)
   VALUES ('user-id', 'premium', 'active');
   ```

2. **Test Feature Access**:
   - Navigate to premium pages
   - Verify access is granted
   - Test feature functionality

3. **Test Stripe Flow**:
   - Use Stripe test mode
   - Use test card: `4242 4242 4242 4242`
   - Verify webhook updates subscription

---

## Troubleshooting

### Premium features not accessible
- Check subscription status in `subscriptions` table
- Verify `subscription_tier` is 'premium'
- Check `status` is 'active'

### Stripe webhook not working
- Verify webhook URL is correct
- Check webhook secret matches
- Review Supabase function logs

### Scheduled payroll not running
- Verify cron job is configured
- Check `scheduled_payrolls` table has active schedules
- Review Edge Function logs

---

## Future Enhancements

- SMS notifications
- Slack integration
- Advanced reporting with charts
- Department management
- Custom payroll fields
- API access for integrations

---

## Support

For issues or questions:
1. Check this documentation
2. Review Supabase logs
3. Check Edge Function logs
4. Contact support

