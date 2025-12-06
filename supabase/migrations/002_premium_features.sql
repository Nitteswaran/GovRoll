-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company users (multi-user support)
CREATE TABLE IF NOT EXISTS company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'accountant', 'staff')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Scheduled payrolls
CREATE TABLE IF NOT EXISTS scheduled_payrolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  run_month TEXT NOT NULL,
  day_of_month INTEGER NOT NULL DEFAULT 25 CHECK (day_of_month BETWEEN 1 AND 31),
  auto_generate_files BOOLEAN DEFAULT true,
  auto_send_payslips BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll run snapshots (versioning)
CREATE TABLE IF NOT EXISTS payroll_run_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anomaly detection results
CREATE TABLE IF NOT EXISTS anomaly_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  affected_employee_id UUID REFERENCES employees(id),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Payroll automation rules
CREATE TABLE IF NOT EXISTS payroll_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('overtime', 'bonus', 'allowance', 'deduction')),
  rule_name TEXT NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email notifications queue
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_run_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for company_users
CREATE POLICY "Users can view company_users of their companies"
  ON company_users FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Admins can manage company_users"
  ON company_users FOR ALL
  USING (
    company_id IN (
      SELECT cu.company_id FROM company_users cu
      WHERE cu.user_id = auth.uid() AND cu.role = 'admin'
    )
  );

-- RLS Policies for scheduled_payrolls
CREATE POLICY "Users can manage scheduled_payrolls of their companies"
  ON scheduled_payrolls FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    ) OR company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Users can view audit_logs of their companies"
  ON audit_logs FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    ) OR company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for payroll_run_snapshots
CREATE POLICY "Users can view snapshots of their companies"
  ON payroll_run_snapshots FOR SELECT
  USING (
    payroll_run_id IN (
      SELECT pr.id FROM payroll_runs pr
      JOIN companies c ON pr.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- RLS Policies for anomaly_detections
CREATE POLICY "Users can view anomalies of their companies"
  ON anomaly_detections FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    ) OR company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update anomalies of their companies"
  ON anomaly_detections FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    ) OR company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for payroll_automation_rules
CREATE POLICY "Users can manage automation rules of their companies"
  ON payroll_automation_rules FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    ) OR company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('admin', 'accountant')
    )
  );

-- RLS Policies for email_notifications
CREATE POLICY "Users can view their email notifications"
  ON email_notifications FOR SELECT
  USING (user_id = auth.uid() OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payrolls_company_id ON scheduled_payrolls(company_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payrolls_next_run_at ON scheduled_payrolls(next_run_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_payroll_run_id ON anomaly_detections(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_resolved_at ON anomaly_detections(resolved_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);

