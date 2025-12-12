-- 005_fix_recursion.sql
-- Fix infinite recursion in company_users policies

-- Create a helper function to check if a user is an admin or owner of a company
-- This evades the recursion by not querying the table directly in the policy using the same policy
CREATE OR REPLACE FUNCTION is_company_admin_or_owner(check_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is owner of the company
  IF EXISTS (
    SELECT 1 FROM companies
    WHERE id = check_company_id AND user_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  -- Check if user is an admin in company_users
  -- We query the table directly here, bypassing RLS recursion because this is a SECURITY DEFINER function
  IF EXISTS (
    SELECT 1 FROM company_users
    WHERE company_id = check_company_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can manage company_users" ON company_users;

-- Create new non-recursive policy
DROP POLICY IF EXISTS "Admins and owners can manage company_users" ON company_users;
CREATE POLICY "Admins and owners can manage company_users"
  ON company_users
  FOR ALL
  USING (
    is_company_admin_or_owner(company_id)
  );
