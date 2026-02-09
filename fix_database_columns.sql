-- Fix User Status and Role Columns
-- Run this in your Supabase SQL Editor to fix the "Database columns might be missing" error.

-- 1. Add 'is_active' column if it's missing (controls user enable/disable)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Add 'role' column if it's missing (controls Admin/Staff access)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Staff';

-- 3. Add 'department' column if it's missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department TEXT;

-- 4. Verify the columns were added
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        RAISE NOTICE 'Column is_active confirms to exist.';
    ELSE
        RAISE NOTICE 'WARNING: Column is_active was NOT added.';
    END IF;
END $$;
