-- ═══════════════════════════════════════════════════════════════
-- POI STAMPS COLLECTION SYSTEM - Database Schema
-- Auto-generare stamps din itinerariu + gamification pentru turiști
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Create enums pentru rarity și collection method
CREATE TYPE public.stamp_rarity AS ENUM ('common', 'rare', 'legendary');
CREATE TYPE public.collection_method AS ENUM ('manual', 'auto', 'guide_activated');

-- STEP 2: Create poi_stamps table
-- Stochează stamps generate automat din itinerariu
CREATE TABLE public.poi_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  itinerary_day_id UUID REFERENCES public.itinerary_days(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  stamp_icon TEXT NOT NULL DEFAULT '📍',
  rarity public.stamp_rarity NOT NULL DEFAULT 'common',
  points_value INTEGER NOT NULL DEFAULT 10,
  location_lat NUMERIC(10, 8),
  location_lng NUMERIC(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- STEP 3: Create tourist_collected_stamps table
-- Tracking ce stamps a colectat fiecare turist
CREATE TABLE public.tourist_collected_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stamp_id UUID NOT NULL REFERENCES public.poi_stamps(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  collection_method public.collection_method NOT NULL DEFAULT 'manual',
  UNIQUE(tourist_id, stamp_id)
);

-- STEP 4: Create tourist_badges table (pentru Phase 2)
CREATE TABLE public.tourist_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL DEFAULT '🏆',
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- STEP 5: Create indexes pentru performance
CREATE INDEX idx_poi_stamps_trip_id ON public.poi_stamps(trip_id);
CREATE INDEX idx_poi_stamps_itinerary_day_id ON public.poi_stamps(itinerary_day_id);
CREATE INDEX idx_tourist_collected_stamps_tourist_id ON public.tourist_collected_stamps(tourist_id);
CREATE INDEX idx_tourist_collected_stamps_stamp_id ON public.tourist_collected_stamps(stamp_id);
CREATE INDEX idx_tourist_collected_stamps_trip_id ON public.tourist_collected_stamps(trip_id);
CREATE INDEX idx_tourist_badges_tourist_id ON public.tourist_badges(tourist_id);

-- STEP 6: Create trigger pentru updated_at
CREATE TRIGGER update_poi_stamps_updated_at
  BEFORE UPDATE ON public.poi_stamps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- STEP 7: Enable RLS pe toate tabelele
ALTER TABLE public.poi_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourist_collected_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourist_badges ENABLE ROW LEVEL SECURITY;

-- STEP 8: RLS Policies pentru poi_stamps
-- Adminii pot manage toate stamps
CREATE POLICY "Admins can manage all stamps"
  ON public.poi_stamps
  FOR ALL
  USING (is_admin());

-- Turiștii și ghizii pot vedea stamps pentru trip-urile lor
CREATE POLICY "Users can view stamps for their trips"
  ON public.poi_stamps
  FOR SELECT
  USING (
    -- Tourist: membru în grupul trip-ului
    EXISTS (
      SELECT 1 FROM trips t
      JOIN group_members gm ON gm.group_id = t.group_id
      WHERE t.id = poi_stamps.trip_id
        AND gm.user_id = auth.uid()
    )
    OR
    -- Guide: asignat la trip
    guide_assigned_to_trip(trip_id)
    OR
    -- Admin: vede tot
    is_admin()
  );

-- STEP 9: RLS Policies pentru tourist_collected_stamps
-- Adminii pot manage toate collected stamps
CREATE POLICY "Admins can manage all collected stamps"
  ON public.tourist_collected_stamps
  FOR ALL
  USING (is_admin());

-- Turiștii pot vedea propriile stamps + ghizii pot vedea stamps pentru trip-urile lor
CREATE POLICY "Users can view collected stamps"
  ON public.tourist_collected_stamps
  FOR SELECT
  USING (
    tourist_id = auth.uid()
    OR
    guide_assigned_to_trip(trip_id)
    OR
    is_admin()
  );

-- Turiștii pot insera propriile stamps
CREATE POLICY "Tourists can insert own stamps"
  ON public.tourist_collected_stamps
  FOR INSERT
  WITH CHECK (
    tourist_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM trips t
      JOIN group_members gm ON gm.group_id = t.group_id
      WHERE t.id = tourist_collected_stamps.trip_id
        AND gm.user_id = auth.uid()
    )
  );

-- Turiștii pot șterge propriile stamps
CREATE POLICY "Tourists can delete own stamps"
  ON public.tourist_collected_stamps
  FOR DELETE
  USING (tourist_id = auth.uid());

-- STEP 10: RLS Policies pentru tourist_badges
-- Adminii pot manage toate badges
CREATE POLICY "Admins can manage all badges"
  ON public.tourist_badges
  FOR ALL
  USING (is_admin());

-- Turiștii pot vedea propriile badges
CREATE POLICY "Tourists can view own badges"
  ON public.tourist_badges
  FOR SELECT
  USING (
    tourist_id = auth.uid()
    OR
    is_admin()
  );

-- Ghizii pot vedea badges pentru trip-urile lor
CREATE POLICY "Guides can view badges for their trips"
  ON public.tourist_badges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = tourist_badges.trip_id
        AND guide_assigned_to_trip(t.id)
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- SUCCESS! Database schema created pentru POI Stamps System
-- ═══════════════════════════════════════════════════════════════