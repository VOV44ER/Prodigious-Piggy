-- First, find and drop all RLS policies that depend on has_role function
-- This query will help you find all policies (run it first to see what needs to be dropped):
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE definition LIKE '%has_role%';

-- Drop known policy on places table
DROP POLICY IF EXISTS "Admins can manage places" ON public.places;

-- Drop any other policies that might use has_role
-- Add more DROP POLICY statements here if you find other policies using has_role

-- Now remove has_role function
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(text, app_role) CASCADE;

-- If user_roles table still exists, drop it (shouldn't be needed, but just in case)
DROP TABLE IF EXISTS public.user_roles CASCADE;

