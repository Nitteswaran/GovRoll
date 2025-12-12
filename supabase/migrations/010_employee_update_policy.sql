-- 010_employee_update_policy.sql
-- Allow employees to update their own profile information

DROP POLICY IF EXISTS "Employees can update their own profile" ON employees;

CREATE POLICY "Employees can update their own profile"
ON employees FOR UPDATE
USING (
  auth_user_id = auth.uid()
)
WITH CHECK (
  auth_user_id = auth.uid()
);
