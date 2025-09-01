-- Make group_id nullable in trips table to allow creation without group assignment
ALTER TABLE public.trips ALTER COLUMN group_id DROP NOT NULL;

-- Add comment to clarify this change
COMMENT ON COLUMN public.trips.group_id IS 'Can be null initially, must be assigned before trip becomes active';