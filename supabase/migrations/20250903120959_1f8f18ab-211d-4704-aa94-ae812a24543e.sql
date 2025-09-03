-- Add 'guide' to user_role enum
ALTER TYPE user_role ADD VALUE 'guide';

-- Create guide_assignments table
CREATE TABLE public.guide_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_user_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  assigned_by_admin_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(guide_user_id, trip_id)
);

-- Create daily_reports table
CREATE TABLE public.daily_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL,
  guide_user_id UUID NOT NULL,
  report_date DATE NOT NULL,
  activities_completed TEXT[],
  issues_encountered TEXT,
  solutions_applied TEXT,
  notes_for_admin TEXT,
  participant_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, guide_user_id, report_date)
);

-- Enable RLS on new tables
ALTER TABLE public.guide_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is a guide
CREATE OR REPLACE FUNCTION public.is_guide()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE((SELECT role = 'guide' FROM public.profiles WHERE id = auth.uid()), false);
$function$

-- Create function to check if guide is assigned to trip
CREATE OR REPLACE FUNCTION public.guide_assigned_to_trip(trip_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.guide_assignments 
    WHERE trip_id = trip_uuid AND guide_user_id = auth.uid() AND is_active = true
  );
$function$

-- RLS Policies for guide_assignments
CREATE POLICY "Admins can manage all guide assignments" 
ON public.guide_assignments 
FOR ALL 
USING (is_admin());

CREATE POLICY "Guides can view their assignments" 
ON public.guide_assignments 
FOR SELECT 
USING (guide_user_id = auth.uid());

-- RLS Policies for daily_reports
CREATE POLICY "Admins can view all daily reports" 
ON public.daily_reports 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Guides can manage their own reports" 
ON public.daily_reports 
FOR ALL 
USING (guide_user_id = auth.uid());

-- Add trigger for daily_reports updated_at
CREATE TRIGGER update_daily_reports_updated_at
BEFORE UPDATE ON public.daily_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing RLS policies to include guide permissions

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