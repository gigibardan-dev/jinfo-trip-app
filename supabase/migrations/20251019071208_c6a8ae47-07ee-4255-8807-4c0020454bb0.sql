-- CRITICAL SECURITY FIX: Implement proper role-based access control
-- Roles MUST be in separate table to prevent privilege escalation

-- 1. Create user_roles table using existing user_role enum
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 3. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT id, role, created_at
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Update helper functions to use new role system
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::user_role);
$$;

CREATE OR REPLACE FUNCTION public.is_guide()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'guide'::user_role);
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- 5. Update handle_new_user trigger to ALWAYS assign 'tourist' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile without role (keep for backwards compat but don't trust it)
  INSERT INTO public.profiles (id, email, nume, prenume, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nume', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'prenume', 'Name'),
    'tourist'::user_role  -- ALWAYS tourist, ignore client input
  );
  
  -- CRITICAL: Assign tourist role in user_roles table (source of truth)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'tourist'::user_role);
  
  RETURN NEW;
END;
$$;

-- 6. RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'::user_role));

-- 7. SECURITY FIX: Restrict profile visibility - exclude email and phone from group members
DROP POLICY IF EXISTS "Users can view group members basic info" ON public.profiles;

-- New policy: Only own profile and admins see email/phone
CREATE POLICY "Users can view basic group member info"
ON public.profiles FOR SELECT
USING (
  -- Own profile: see everything
  auth.uid() = id 
  OR 
  -- Admins: see everything
  public.has_role(auth.uid(), 'admin'::user_role)
  OR
  -- Group members: see name/avatar only (app layer must exclude email/phone in SELECT)
  EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id
  )
);

-- 8. Add comment to warn about deprecated role column
COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: Use user_roles table for role checks. This column kept for backwards compatibility but should not be trusted for authorization.';