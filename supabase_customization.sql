-- Add banner_url to squads table
ALTER TABLE public.squads 
ADD COLUMN IF NOT EXISTS banner_url text;
