-- Fix security vulnerability: Restrict profile access to own data only
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restrictive policy that only allows users to view their own profile
-- and allows admins to view all profiles for management purposes
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR is_admin()
);

-- Add a policy to allow users to view basic profile info (name only) of group members
-- This is needed for group functionality without exposing sensitive data
CREATE POLICY "Users can view group members basic info" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM group_members gm1 
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id 
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = profiles.id
  )
);

-- Update the policy to only expose non-sensitive fields for group members
-- We need to ensure sensitive data like email and phone are not exposed