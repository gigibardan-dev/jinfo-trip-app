-- Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create storage policies for documents bucket
-- Admins can manage all documents
CREATE POLICY "Admins can manage all documents" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'documents' AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Users can view documents for their trips
CREATE POLICY "Users can view documents for their trips" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.trips t ON d.trip_id = t.id
    JOIN public.group_members gm ON gm.group_id = t.group_id
    WHERE d.file_url LIKE '%' || name || '%' 
    AND gm.user_id = auth.uid()
    AND (
      d.visibility_type = 'group' OR 
      (d.visibility_type = 'individual' AND d.target_user_id = auth.uid())
    )
  )
);