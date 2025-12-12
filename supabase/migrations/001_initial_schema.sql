-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  epf_number TEXT,
  socso_number TEXT,
  income_tax_number TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ic_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account TEXT NOT NULL,
  base_salary DECIMAL(10, 2) NOT NULL,
  allowance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  epf_rate_employee INTEGER DEFAULT 11,
  epf_rate_employer INTEGER DEFAULT 12,
  socso_category TEXT DEFAULT '1',
  pcb_category TEXT DEFAULT '1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll runs table
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll items table
CREATE TABLE IF NOT EXISTS payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  overtime DECIMAL(10, 2),
  bonus DECIMAL(10, 2),
  deductions DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payroll_run_id, employee_id)
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
CREATE POLICY "Users can view their own companies"
  ON companies FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
CREATE POLICY "Users can insert their own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own companies" ON companies;
CREATE POLICY "Users can update their own companies"
  ON companies FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for employees
DROP POLICY IF EXISTS "Users can view employees of their companies" ON employees;
CREATE POLICY "Users can view employees of their companies"
  ON employees FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert employees to their companies" ON employees;
CREATE POLICY "Users can insert employees to their companies"
  ON employees FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update employees of their companies" ON employees;
CREATE POLICY "Users can update employees of their companies"
  ON employees FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete employees of their companies" ON employees;
CREATE POLICY "Users can delete employees of their companies"
  ON employees FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for payroll_runs
DROP POLICY IF EXISTS "Users can view payroll runs of their companies" ON payroll_runs;
CREATE POLICY "Users can view payroll runs of their companies"
  ON payroll_runs FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert payroll runs to their companies" ON payroll_runs;
CREATE POLICY "Users can insert payroll runs to their companies"
  ON payroll_runs FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update payroll runs of their companies" ON payroll_runs;
CREATE POLICY "Users can update payroll runs of their companies"
  ON payroll_runs FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for payroll_items
DROP POLICY IF EXISTS "Users can view payroll items of their companies" ON payroll_items;
CREATE POLICY "Users can view payroll items of their companies"
  ON payroll_items FOR SELECT
  USING (
    payroll_run_id IN (
      SELECT pr.id FROM payroll_runs pr
      JOIN companies c ON pr.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert payroll items to their companies" ON payroll_items;
CREATE POLICY "Users can insert payroll items to their companies"
  ON payroll_items FOR INSERT
  WITH CHECK (
    payroll_run_id IN (
      SELECT pr.id FROM payroll_runs pr
      JOIN companies c ON pr.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update payroll items of their companies" ON payroll_items;
CREATE POLICY "Users can update payroll items of their companies"
  ON payroll_items FOR UPDATE
  USING (
    payroll_run_id IN (
      SELECT pr.id FROM payroll_runs pr
      JOIN companies c ON pr.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete payroll items of their companies" ON payroll_items;
CREATE POLICY "Users can delete payroll items of their companies"
  ON payroll_items FOR DELETE
  USING (
    payroll_run_id IN (
      SELECT pr.id FROM payroll_runs pr
      JOIN companies c ON pr.company_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

