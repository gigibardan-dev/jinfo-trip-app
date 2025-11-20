-- Fix trigger pentru a respecta intended_role din metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  intended_role user_role;
BEGIN
  -- Extract intended role from metadata, default to tourist
  intended_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'intended_role')::user_role,
    'tourist'::user_role
  );
  
  -- Create profile
  INSERT INTO public.profiles (id, email, nume, prenume, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nume', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'prenume', 'Name'),
    intended_role
  );
  
  -- Assign role in user_roles table (source of truth)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, intended_role);
  
  RETURN NEW;
END;
$$;