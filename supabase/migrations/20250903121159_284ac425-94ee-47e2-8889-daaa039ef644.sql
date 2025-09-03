-- Add guide permissions for existing tables

-- Guides can view trips they are assigned to
CREATE POLICY "Guides can view assigned trips" 
ON public.trips 
FOR SELECT 
USING (guide_assigned_to_trip(id));

-- Guides can view itinerary for assigned trips
CREATE POLICY "Guides can view itinerary for assigned trips" 
ON public.itinerary_days 
FOR SELECT 
USING (guide_assigned_to_trip(trip_id));

CREATE POLICY "Guides can view activities for assigned trips" 
ON public.itinerary_activities 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM itinerary_days id
  WHERE (id.id = itinerary_activities.day_id AND guide_assigned_to_trip(id.trip_id))));

-- Guides can update future itinerary activities for assigned trips
CREATE POLICY "Guides can update future activities for assigned trips" 
ON public.itinerary_activities 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM itinerary_days id
  WHERE (id.id = itinerary_activities.day_id 
         AND guide_assigned_to_trip(id.trip_id) 
         AND id.date >= CURRENT_DATE)));

-- Guides can insert activities for assigned trips (future dates only)
CREATE POLICY "Guides can insert activities for assigned trips" 
ON public.itinerary_activities 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM itinerary_days id
  WHERE (id.id = itinerary_activities.day_id 
         AND guide_assigned_to_trip(id.trip_id) 
         AND id.date >= CURRENT_DATE)));

-- Guides can update future itinerary days for assigned trips
CREATE POLICY "Guides can update future itinerary days for assigned trips" 
ON public.itinerary_days 
FOR UPDATE 
USING (guide_assigned_to_trip(trip_id) AND date >= CURRENT_DATE);

-- Guides can view documents for assigned trips
CREATE POLICY "Guides can view documents for assigned trips" 
ON public.documents 
FOR SELECT 
USING (guide_assigned_to_trip(trip_id));

-- Guides can insert documents for assigned trips
CREATE POLICY "Guides can insert documents for assigned trips" 
ON public.documents 
FOR INSERT 
WITH CHECK (guide_assigned_to_trip(trip_id));

-- Guides can delete documents they uploaded
CREATE POLICY "Guides can delete their uploaded documents" 
ON public.documents 
FOR DELETE 
USING (guide_assigned_to_trip(trip_id));

-- Guides can view group members for their assigned trips
CREATE POLICY "Guides can view group members for assigned trips" 
ON public.group_members 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.trips t 
  WHERE t.group_id = group_members.group_id 
  AND guide_assigned_to_trip(t.id)
));