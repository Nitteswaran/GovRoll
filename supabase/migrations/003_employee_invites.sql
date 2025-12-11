-- 003_employee_invites.sql
-- Link auth users to employees and add employee_invites for self-signup via invite codes

-- Link auth users to employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Allow employees to view and update their own profile
CREATE POLICY "Employees can view their own profile"
  ON employees FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Employees can update their own profile"
  ON employees FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Employee invites table
CREATE TABLE IF NOT EXISTS employee_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  name TEXT,
  position TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

ALTER TABLE employee_invites ENABLE ROW LEVEL SECURITY;

-- Employers (company owners) can manage invites for their companies
CREATE POLICY "Employers can manage employee invites for their companies"
  ON employee_invites
  FOR ALL
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );
