-- 1. Fix Idempotency for Update Policy: FIXED SYNTAX "ON employees"
DROP POLICY IF EXISTS "Employees can update their own profile" ON employees;

CREATE POLICY "Employees can update their own profile"
ON employees FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- 2. Update Link Function (Case Insensitive)
CREATE OR REPLACE FUNCTION accept_company_invitation(target_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  UPDATE company_users
  SET accepted_at = NOW()
  WHERE company_id = target_company_id AND user_id = auth.uid() AND accepted_at IS NULL;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found or already accepted'; END IF;

  UPDATE employees
  SET auth_user_id = auth.uid()
  WHERE company_id = target_company_id
    AND LOWER(email) = LOWER(v_user_email)
    AND auth_user_id IS NULL;
END;
$$;

-- 3. Update Sync Function (Case Insensitive)
CREATE OR REPLACE FUNCTION sync_employee_identity()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_employee_id uuid;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM employees WHERE auth_user_id = auth.uid()) THEN RETURN true; END IF;

  UPDATE employees
  SET auth_user_id = auth.uid()
  WHERE LOWER(email) = LOWER(v_user_email)
    AND auth_user_id IS NULL
  RETURNING id INTO v_employee_id;

  RETURN v_employee_id IS NOT NULL;
END;
$$;