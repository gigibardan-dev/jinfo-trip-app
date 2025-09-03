-- Create security definer functions
CREATE OR REPLACE FUNCTION public.is_guide()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE((SELECT role = 'guide' FROM public.profiles WHERE id = auth.uid()), false);
$function$;

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
$function$;

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