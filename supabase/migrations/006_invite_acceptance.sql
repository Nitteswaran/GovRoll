-- 006_invite_acceptance.sql
-- RPC functions for employee invitation acceptance

-- Function to get invitations for the current user
CREATE OR REPLACE FUNCTION get_my_invitations()
RETURNS TABLE (
  company_id uuid,
  company_name text,
  role text,
  invited_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    c.company_name,
    cu.role,
    cu.invited_at
  FROM company_users cu
  JOIN companies c ON cu.company_id = c.id
  WHERE cu.user_id = auth.uid()
    AND cu.accepted_at IS NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_my_invitations TO authenticated;

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION accept_company_invitation(target_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the invitation to accepted
  UPDATE company_users
  SET accepted_at = NOW()
  WHERE company_id = target_company_id
    AND user_id = auth.uid()
    AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already accepted';
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_company_invitation TO authenticated;
