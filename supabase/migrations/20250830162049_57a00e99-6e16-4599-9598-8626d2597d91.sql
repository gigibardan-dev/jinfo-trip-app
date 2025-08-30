-- Fix security warnings by adding SET search_path to functions

-- Update get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update user_in_group function
CREATE OR REPLACE FUNCTION public.user_in_group(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nume, prenume, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'nume', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'prenume', 'Name'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'tourist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;