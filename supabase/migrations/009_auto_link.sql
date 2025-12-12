-- 009_auto_link.sql
-- Function to automatically link an auth user to their employee record if found by email

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
  -- Get the current user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF v_user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Check if already linked
  IF EXISTS (SELECT 1 FROM employees WHERE auth_user_id = auth.uid()) THEN
    RETURN true;
  END IF;

  -- Attempt to find an unlinked employee record with matching email
  UPDATE employees
  SET auth_user_id = auth.uid()
  WHERE LOWER(email) = LOWER(v_user_email)
    AND auth_user_id IS NULL
  RETURNING id INTO v_employee_id;

  RETURN v_employee_id IS NOT NULL;
END;
$$;
