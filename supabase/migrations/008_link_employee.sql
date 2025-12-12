-- 008_link_employee.sql
-- Update accept_company_invitation to also link the auth user to the employees table

CREATE OR REPLACE FUNCTION accept_company_invitation(target_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Get the current user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- Update the invitation to accepted in company_users
  UPDATE company_users
  SET accepted_at = NOW()
  WHERE company_id = target_company_id
    AND user_id = auth.uid()
    AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already accepted';
  END IF;

  -- Attempt to link to an existing employee record if one exists with the same email
  -- This is crucial for the employee portal to work
  UPDATE employees
  SET auth_user_id = auth.uid()
  WHERE company_id = target_company_id
    AND LOWER(email) = LOWER(v_user_email)
    AND auth_user_id IS NULL;
    
END;
$$;
