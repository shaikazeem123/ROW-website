-- EXTENSION FOR RBAC (Role Based Access Control)
-- Run this in Supabase SQL Editor

-- 1. Add Role and Status columns to profiles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'Staff';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
        ALTER TABLE public.profiles ADD COLUMN department TEXT;
    END IF;
END $$;

-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies for RLS
-- Allow Admins to View/Edit ALL profiles
-- We define specific policies. Note: You need to insert your first Admin manually or via this script check.

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  )
);

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  )
);

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Admin'
  )
);

-- Policy: Everyone can insert audit logs (for their own actions)
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Set initial Admin (Optional: Updates the user running this query to Admin if needed)
-- UPDATE public.profiles SET role = 'Admin' WHERE id = auth.uid();
