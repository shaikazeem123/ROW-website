-- FIX TRIPS VISIBILITY
-- Run this in Supabase SQL Editor to ensure all users (Admin, Manager, Staff) can view all trips
-- and that Permissions are correctly set.

-- 1. Enable RLS on trips (if not already)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Trips are viewable by authenticated users." ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can insert trips." ON public.trips;
DROP POLICY IF EXISTS "Users can update their own trips." ON public.trips;
DROP POLICY IF EXISTS "Users can delete their own trips." ON public.trips;

-- 3. Re-create Policy: VIEW (SELECT) - ALLOW ALL AUTHENTICATED USERS
-- This ensures that Admins, Managers, and Staff can ALL see everyone's trips on the tracking dashboard.
CREATE POLICY "Trips are viewable by authenticated users." 
ON public.trips FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Re-create Policy: INSERT - ALLOW ALL AUTHENTICATED USERS
CREATE POLICY "Authenticated users can insert trips." 
ON public.trips FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 5. Re-create Policy: UPDATE/DELETE - ALLOW ONLY ADMINS OR CREATOR
-- Enhanced policy: Admins can edit/delete ANY trip. Users can only edit/delete their OWN.
CREATE POLICY "Users can update their own trips or Admins can update all" 
ON public.trips FOR UPDATE 
USING (
    auth.uid() = created_by 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Users can delete their own trips or Admins can delete all" 
ON public.trips FOR DELETE 
USING (
    auth.uid() = created_by 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- 6. Grant basic permissions to the database roles
GRANT ALL ON public.trips TO postgres;
GRANT ALL ON public.trips TO anon;
GRANT ALL ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
