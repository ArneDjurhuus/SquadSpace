-- Add user status fields to profiles table
-- Run this in Supabase SQL Editor

-- Add status columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status_emoji text,
ADD COLUMN IF NOT EXISTS status_text text,
ADD COLUMN IF NOT EXISTS status_expires_at timestamp with time zone;

-- Add index for status expiration cleanup (optional, for scheduled cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_profiles_status_expires_at 
ON public.profiles(status_expires_at) 
WHERE status_expires_at IS NOT NULL;

-- Function to clear expired statuses (can be called via pg_cron or manually)
CREATE OR REPLACE FUNCTION public.clear_expired_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    status_emoji = NULL,
    status_text = NULL,
    status_expires_at = NULL
  WHERE status_expires_at IS NOT NULL 
    AND status_expires_at < NOW();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.clear_expired_statuses TO authenticated;

COMMENT ON COLUMN public.profiles.status_emoji IS 'User status emoji (e.g., 🔴, 🟢, 💼)';
COMMENT ON COLUMN public.profiles.status_text IS 'User status message (e.g., "In a meeting", "Working from home")';
COMMENT ON COLUMN public.profiles.status_expires_at IS 'When the status should automatically clear';
