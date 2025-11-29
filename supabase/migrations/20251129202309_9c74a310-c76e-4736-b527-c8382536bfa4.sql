-- Add DELETE policies for stamp management

-- Policy: Admins can delete stamps
CREATE POLICY "Admins can delete stamps"
ON public.poi_stamps
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Policy: Tourists can delete their own collected stamps
CREATE POLICY "Tourists can delete own collected stamps"
ON public.tourist_collected_stamps
FOR DELETE
TO authenticated
USING (tourist_id = auth.uid());