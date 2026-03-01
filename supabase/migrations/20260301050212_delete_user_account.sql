-- Function to delete the currently authenticated user's account.
-- Runs as SECURITY DEFINER (postgres superuser) so it can delete from auth.users.
-- RLS still applies: only the authenticated user can call this for their own id.
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calling_user_id uuid;
BEGIN
  -- Get the current user's id from the JWT
  calling_user_id := auth.uid();

  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Deleting from auth.users cascades to public.profiles which cascades
  -- to all other user tables (diary_entries, pastures, herd_groups, etc.)
  DELETE FROM auth.users WHERE id = calling_user_id;
END;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
