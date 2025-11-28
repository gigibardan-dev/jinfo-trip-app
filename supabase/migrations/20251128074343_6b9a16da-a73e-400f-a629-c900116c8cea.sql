-- Create offline map configurations table
CREATE TABLE public.offline_map_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  
  -- Auto-calculated bounds
  bounds_north DECIMAL(10, 8),
  bounds_south DECIMAL(10, 8),
  bounds_east DECIMAL(11, 8),
  bounds_west DECIMAL(11, 8),
  
  -- Zoom settings
  zoom_min INTEGER DEFAULT 5,
  zoom_max INTEGER DEFAULT 13,
  
  -- Metadata
  estimated_size_mb DECIMAL(5, 2),
  tile_count INTEGER,
  
  -- Detected locations (JSON array)
  locations JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(trip_id)
);

-- Enable RLS
ALTER TABLE public.offline_map_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage offline map configs"
ON public.offline_map_configs FOR ALL
USING (public.is_admin());

CREATE POLICY "Users can view offline map configs for their trips"
ON public.offline_map_configs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    JOIN public.group_members gm ON t.group_id = gm.group_id
    WHERE t.id = offline_map_configs.trip_id
    AND gm.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- Update trigger
CREATE TRIGGER update_offline_map_configs_updated_at
BEFORE UPDATE ON public.offline_map_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Track downloaded tiles per user
CREATE TABLE public.offline_map_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  config_id UUID REFERENCES public.offline_map_configs(id) ON DELETE CASCADE NOT NULL,
  
  downloaded_at TIMESTAMPTZ DEFAULT now(),
  tiles_downloaded INTEGER,
  size_mb DECIMAL(5, 2),
  
  UNIQUE(user_id, trip_id)
);

ALTER TABLE public.offline_map_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own downloads"
ON public.offline_map_downloads FOR ALL
USING (auth.uid() = user_id);