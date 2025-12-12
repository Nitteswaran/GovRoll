-- 004_user_lookup.sql
-- Secure RPC function to look up user ID by email

CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Allows accessing auth.users
SET search_path = public -- Secure search path
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Check if the requesting user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = email_input;

  RETURN target_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_by_email TO authenticated;
