-- 007_employee_policies.sql
-- RLS policies for employee portal access

-- Helper policy logic:
-- Users can access rows if they are the employee linked to the row

-- Employees table policies (already had view own profile, adding update if missing)
-- Checking if "Employees can update their own profile" exists in 003, it likely does.
-- But let's ensure we have policies for related tables.

-- Payslips
DROP POLICY IF EXISTS "Employees can view their own payslips" ON payslips;
CREATE POLICY "Employees can view their own payslips"
ON payslips FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  )
);

-- Leave Requests
DROP POLICY IF EXISTS "Employees can view their own leave requests" ON leave_requests;
CREATE POLICY "Employees can view their own leave requests"
ON leave_requests FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Employees can create leave requests" ON leave_requests;
CREATE POLICY "Employees can create leave requests"
ON leave_requests FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  )
);

-- Attendance
DROP POLICY IF EXISTS "Employees can view their own attendance" ON attendance;
CREATE POLICY "Employees can view their own attendance"
ON attendance FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Employees can clock in/out" ON attendance;
CREATE POLICY "Employees can clock in/out"
ON attendance FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  )
);

