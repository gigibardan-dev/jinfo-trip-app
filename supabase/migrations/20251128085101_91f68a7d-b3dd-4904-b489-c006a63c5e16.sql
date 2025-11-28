-- Create map_points_of_interest table
CREATE TABLE public.map_points_of_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Location
  lat NUMERIC(10, 8) NOT NULL,
  lng NUMERIC(11, 8) NOT NULL,
  
  -- Category
  category TEXT NOT NULL,
  
  -- Display
  icon TEXT,
  color TEXT DEFAULT 'blue',
  
  -- Additional info
  phone TEXT,
  address TEXT,
  website TEXT,
  notes TEXT,
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_map_poi_trip ON public.map_points_of_interest(trip_id);
CREATE INDEX idx_map_poi_category ON public.map_points_of_interest(category);

-- Enable RLS
ALTER TABLE public.map_points_of_interest ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage POIs"
ON public.map_points_of_interest FOR ALL
USING (public.is_admin());

CREATE POLICY "Users can view POIs for their trips"
ON public.map_points_of_interest FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    JOIN public.group_members gm ON t.group_id = gm.group_id
    WHERE t.id = map_points_of_interest.trip_id
    AND gm.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- Update trigger
CREATE TRIGGER update_map_poi_updated_at
BEFORE UPDATE ON public.map_points_of_interest
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();