-- 002_employee_extension.sql
-- Extend employees and add employee_accounts, payslips, leave_requests, attendance

-- Extend employees table with employee-portal related fields
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Employee accounts table (for employee portal auth)
CREATE TABLE IF NOT EXISTS employee_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employee_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can manage employee accounts for their companies" ON employee_accounts;
CREATE POLICY "Employers can manage employee accounts for their companies"
ON employee_accounts
FOR ALL
USING (
  employee_id IN (
    SELECT e.id
    FROM employees e
    JOIN companies c ON e.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
)
WITH CHECK (
  employee_id IN (
    SELECT e.id
    FROM employees e
    JOIN companies c ON e.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Payslips table
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  salary_breakdown JSONB NOT NULL,
  epf DECIMAL(10, 2) NOT NULL,
  socso DECIMAL(10, 2) NOT NULL,
  eis DECIMAL(10, 2) NOT NULL,
  pcb DECIMAL(10, 2) NOT NULL,
  net_pay DECIMAL(10, 2) NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can manage payslips for their companies" ON payslips;
CREATE POLICY "Employers can manage payslips for their companies"
ON payslips
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

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can manage leave requests for their companies" ON leave_requests;
CREATE POLICY "Employers can manage leave requests for their companies"
ON leave_requests
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

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('clock_in', 'clock_out')),
  gps_location TEXT,
  device_info TEXT
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employers can view attendance for their companies" ON attendance;
CREATE POLICY "Employers can view attendance for their companies"
ON attendance
FOR SELECT
USING (
  company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  )
);
