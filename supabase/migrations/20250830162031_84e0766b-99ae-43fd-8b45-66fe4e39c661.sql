-- Create custom types
CREATE TYPE public.user_role AS ENUM ('admin', 'tourist');
CREATE TYPE public.trip_status AS ENUM ('draft', 'confirmed', 'active', 'completed', 'cancelled');
CREATE TYPE public.document_category AS ENUM ('identity', 'transport', 'accommodation', 'insurance', 'itinerary', 'custom');
CREATE TYPE public.visibility_type AS ENUM ('group', 'individual');
CREATE TYPE public.activity_type AS ENUM ('transport', 'meal', 'attraction', 'accommodation', 'free_time', 'custom');
CREATE TYPE public.message_type AS ENUM ('info', 'urgent', 'reminder', 'update');
CREATE TYPE public.target_type AS ENUM ('broadcast', 'group', 'individual');
CREATE TYPE public.resource_type AS ENUM ('documents', 'itinerary', 'maps', 'images');
CREATE TYPE public.group_role AS ENUM ('primary', 'member');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nume TEXT NOT NULL,
  prenume TEXT NOT NULL,
  telefon TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'tourist',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tourist_groups table
CREATE TABLE public.tourist_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nume_grup TEXT NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  group_id UUID NOT NULL REFERENCES public.tourist_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_group public.group_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.tourist_groups(id) ON DELETE CASCADE,
  nume TEXT NOT NULL,
  destinatie TEXT NOT NULL,
  tara TEXT NOT NULL,
  oras TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status public.trip_status NOT NULL DEFAULT 'draft',
  created_by_admin_id UUID NOT NULL REFERENCES public.profiles(id),
  descriere TEXT,
  cover_image_url TEXT,
  budget_estimat NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  nume TEXT NOT NULL,
  descriere TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  document_category public.document_category NOT NULL,
  visibility_type public.visibility_type NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id),
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  is_offline_priority BOOLEAN NOT NULL DEFAULT false,
  uploaded_by_admin_id UUID NOT NULL REFERENCES public.profiles(id),
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date DATE,
  metadata JSONB DEFAULT '{}'
);

-- Create itinerary_days table
CREATE TABLE public.itinerary_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  overview TEXT,
  UNIQUE(trip_id, day_number)
);

-- Create itinerary_activities table
CREATE TABLE public.itinerary_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  start_time TIME,
  end_time TIME,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  activity_type public.activity_type NOT NULL,
  cost_estimate NUMERIC,
  images TEXT[] DEFAULT '{}',
  tips_and_notes TEXT,
  booking_reference TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Create communications table
CREATE TABLE public.communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_admin_id UUID NOT NULL REFERENCES public.profiles(id),
  trip_id UUID REFERENCES public.trips(id),
  target_type public.target_type NOT NULL,
  target_group_id UUID REFERENCES public.tourist_groups(id),
  target_user_id UUID REFERENCES public.profiles(id),
  message_type public.message_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_send_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communication_reads table
CREATE TABLE public.communication_reads (
  communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (communication_id, user_id)
);

-- Create offline_cache_status table
CREATE TABLE public.offline_cache_status (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  resource_type public.resource_type NOT NULL,
  resource_id TEXT NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cache_size INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, resource_type, resource_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourist_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_cache_status ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user is in group
CREATE OR REPLACE FUNCTION public.user_in_group(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- RLS Policies for tourist_groups
CREATE POLICY "Admins can manage all groups" ON public.tourist_groups
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view their groups" ON public.tourist_groups
  FOR SELECT USING (public.user_in_group(id));

-- RLS Policies for group_members
CREATE POLICY "Admins can manage group members" ON public.group_members
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view group members in their groups" ON public.group_members
  FOR SELECT USING (public.user_in_group(group_id));

-- RLS Policies for trips
CREATE POLICY "Admins can manage all trips" ON public.trips
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view trips for their groups" ON public.trips
  FOR SELECT USING (public.user_in_group(group_id));

-- RLS Policies for documents
CREATE POLICY "Admins can manage all documents" ON public.documents
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view documents for their trips" ON public.documents
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.trips t
      JOIN public.group_members gm ON gm.group_id = t.group_id
      WHERE t.id = documents.trip_id AND gm.user_id = auth.uid()
    )
  );

-- RLS Policies for itinerary_days
CREATE POLICY "Admins can manage itinerary days" ON public.itinerary_days
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view itinerary for their trips" ON public.itinerary_days
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.trips t
      JOIN public.group_members gm ON gm.group_id = t.group_id
      WHERE t.id = itinerary_days.trip_id AND gm.user_id = auth.uid()
    )
  );

-- RLS Policies for itinerary_activities
CREATE POLICY "Admins can manage activities" ON public.itinerary_activities
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view activities for their trips" ON public.itinerary_activities
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.itinerary_days id
      JOIN public.trips t ON t.id = id.trip_id
      JOIN public.group_members gm ON gm.group_id = t.group_id
      WHERE id.id = itinerary_activities.day_id AND gm.user_id = auth.uid()
    )
  );

-- RLS Policies for communications
CREATE POLICY "Admins can manage communications" ON public.communications
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view their communications" ON public.communications
  FOR SELECT USING (
    target_type = 'broadcast' OR
    (target_type = 'individual' AND target_user_id = auth.uid()) OR
    (target_type = 'group' AND public.user_in_group(target_group_id))
  );

-- RLS Policies for communication_reads
CREATE POLICY "Users can manage their read status" ON public.communication_reads
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for offline_cache_status
CREATE POLICY "Users can manage their cache status" ON public.offline_cache_status
  FOR ALL USING (auth.uid() = user_id);

-- Create function to handle new user registration
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tourist_groups_updated_at
  BEFORE UPDATE ON public.tourist_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_tourist_groups_admin ON public.tourist_groups(admin_user_id);
CREATE INDEX idx_tourist_groups_invite ON public.tourist_groups(invite_code);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_trips_group ON public.trips(group_id);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_dates ON public.trips(start_date, end_date);
CREATE INDEX idx_documents_trip ON public.documents(trip_id);
CREATE INDEX idx_documents_category ON public.documents(document_category);
CREATE INDEX idx_itinerary_days_trip ON public.itinerary_days(trip_id);
CREATE INDEX idx_itinerary_activities_day ON public.itinerary_activities(day_id);
CREATE INDEX idx_communications_target ON public.communications(target_type, target_group_id, target_user_id);
CREATE INDEX idx_communication_reads_user ON public.communication_reads(user_id);