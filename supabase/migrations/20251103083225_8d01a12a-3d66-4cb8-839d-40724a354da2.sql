-- First drop both existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Group members can view basic info only" ON public.profiles;

-- Create a single comprehensive policy that handles all SELECT scenarios
-- IMPORTANT: This policy allows row visibility but client code MUST select only safe fields for group members
CREATE POLICY "Users can view profiles with restrictions"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users see their own full profile (all fields)
  auth.uid() = id 
  -- Admins see all profiles (all fields)
  OR has_role(auth.uid(), 'admin'::user_role)
  -- Group members can see basic info only (row is visible, but client filters fields)
  OR EXISTS (
    SELECT 1
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
      AND gm2.user_id = profiles.id
  )
);

-- Create a security definer function to safely get group member basic info
-- This function returns ONLY non-sensitive fields
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
      auth.uid() = p.id
      OR public.has_role(auth.uid(), 'admin'::user_role)
      OR EXISTS (
        SELECT 1
        FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = auth.uid() AND gm2.user_id = p.id
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_group_member_basic_info(uuid) TO authenticated;

COMMENT ON POLICY "Users can view profiles with restrictions" ON public.profiles IS 
'Allows row-level access but clients MUST use get_group_member_basic_info() for group members to avoid exposing email/phone';

COMMENT ON FUNCTION public.get_group_member_basic_info IS 
'Returns only non-sensitive profile fields (nume, prenume, avatar). Excludes email and telefon to prevent data harvesting.';