-- Update RLS policy for offline_map_configs to include guides
DROP POLICY IF EXISTS "Users can view offline map configs for their trips" ON public.offline_map_configs;

CREATE POLICY "Users can view offline map configs for their trips"
ON public.offline_map_configs FOR SELECT
USING (
  -- Group members (tourists)
  (EXISTS (
    SELECT 1
    FROM trips t
    JOIN group_members gm ON t.group_id = gm.group_id
    WHERE t.id = offline_map_configs.trip_id
    AND gm.user_id = auth.uid()
  ))
  OR
  -- Assigned guides
  (EXISTS (
    SELECT 1
    FROM guide_assignments ga
    WHERE ga.trip_id = offline_map_configs.trip_id
    AND ga.guide_user_id = auth.uid()
    AND ga.is_active = true
  ))
  OR
  -- Admins
  public.is_admin()
);

-- Update RLS policy for map_points_of_interest to include guides
DROP POLICY IF EXISTS "Users can view POIs for their trips" ON public.map_points_of_interest;

CREATE POLICY "Users can view POIs for their trips"
ON public.map_points_of_interest FOR SELECT
USING (
  -- Group members (tourists)
  (EXISTS (
    SELECT 1
    FROM trips t
    JOIN group_members gm ON t.group_id = gm.group_id
    WHERE t.id = map_points_of_interest.trip_id
    AND gm.user_id = auth.uid()
  ))
  OR
  -- Assigned guides
  (EXISTS (
    SELECT 1
    FROM guide_assignments ga
    WHERE ga.trip_id = map_points_of_interest.trip_id
    AND ga.guide_user_id = auth.uid()
    AND ga.is_active = true
  ))
  OR
  -- Admins
  public.is_admin()
);