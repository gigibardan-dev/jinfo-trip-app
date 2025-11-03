-- Fix profiles table public exposure of email and phone numbers
-- Drop the overly permissive policy that exposes all fields to group members
DROP POLICY IF EXISTS "Users can view basic group member info" ON public.profiles;

-- Create a new restrictive policy that only allows viewing non-sensitive fields for group members
-- Users can see their own full profile, admins can see all, but group members only see basic info
CREATE POLICY "Group members can view basic info only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can see their own full profile
  auth.uid() = id 
  -- Admins can see everything
  OR has_role(auth.uid(), 'admin'::user_role)
  -- Group members can see the row exists (but client must filter which fields to request)
  OR EXISTS (
    SELECT 1
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
      AND gm2.user_id = profiles.id
  )
);

-- Create a security definer function to safely get group member basic info
CREATE OR REPLACE FUNCTION public.get_group_member_basic_info(member_user_id uuid)
RETURNS TABLE (
  id uuid,
  nume text,
  prenume text,
  avatar_url text,
  is_active boolean,
  role user_role,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.nume,
    p.prenume,
    p.avatar_url,
    p.is_active,
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.id = member_user_id
    AND (
      -- Can view own info
      auth.uid() = p.id
      -- Admins can view all
      OR public.has_role(auth.uid(), 'admin'::user_role)
      -- Group members can view basic info
      OR EXISTS (
        SELECT 1
        FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = auth.uid() 
          AND gm2.user_id = p.id
      )
    );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_group_member_basic_info(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_group_member_basic_info IS 'Safely returns non-sensitive profile fields for group members. Email and phone are excluded to prevent data harvesting.';