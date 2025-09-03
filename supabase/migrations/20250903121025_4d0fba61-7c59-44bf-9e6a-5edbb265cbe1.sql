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
$function$;