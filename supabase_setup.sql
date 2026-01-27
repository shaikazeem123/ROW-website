-- Rehab on Wheels (ROW) Supabase Schema Setup
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. PROFILES TABLE
-- This stores additional user information linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TRIPS TABLE
-- This stores daily bus journey data
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  bus_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  assistant_name TEXT,
  odometer_start NUMERIC,
  odometer_end NUMERIC,
  final_distance NUMERIC NOT NULL,
  location TEXT NOT NULL,
  departure_time TIME NOT NULL,
  return_time TIME NOT NULL,
  duration_hours NUMERIC NOT NULL,
  purpose TEXT NOT NULL,
  beneficiaries_served INTEGER NOT NULL DEFAULT 0,
  fuel_liters NUMERIC,
  fuel_cost NUMERIC,
  fuel_efficiency NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users DEFAULT auth.uid()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 4. PROFILES POLICIES
-- Anyone authenticated can see profiles, users can only edit theirs
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. TRIPS POLICIES
-- Authenticated users can view all trips, but only edit/delete their own
DROP POLICY IF EXISTS "Trips are viewable by authenticated users." ON public.trips;
CREATE POLICY "Trips are viewable by authenticated users." ON public.trips FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert trips." ON public.trips;
CREATE POLICY "Authenticated users can insert trips." ON public.trips FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own trips." ON public.trips;
CREATE POLICY "Users can update their own trips." ON public.trips FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own trips." ON public.trips;
CREATE POLICY "Users can delete their own trips." ON public.trips FOR DELETE USING (auth.uid() = created_by);

-- 6. AUTOMATIC PROFILE CREATION (Optional but recommended)
-- This function automatically creates a profile entry when a new user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. BENEFICIARIES TABLE
-- This stores individual patient/beneficiary details
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  date_of_registration DATE DEFAULT CURRENT_DATE,
  parent_guardian TEXT,
  relationship TEXT,
  beneficiary_type TEXT,
  status TEXT DEFAULT 'Active',
  address TEXT,
  address_type TEXT,
  country TEXT DEFAULT 'India',
  state TEXT,
  district TEXT,
  city TEXT,
  pincode TEXT,
  mobile_no TEXT,
  purpose_of_visit TEXT,
  disability_type TEXT,
  program TEXT,
  donor TEXT,
  economic_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users DEFAULT auth.uid()
);

-- ENABLE RLS
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Beneficiaries are viewable by authenticated users." ON public.beneficiaries;
CREATE POLICY "Beneficiaries are viewable by authenticated users." ON public.beneficiaries FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert beneficiaries." ON public.beneficiaries;
CREATE POLICY "Authenticated users can insert beneficiaries." ON public.beneficiaries FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own beneficiaries." ON public.beneficiaries;
CREATE POLICY "Users can update their own beneficiaries." ON public.beneficiaries FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own beneficiaries." ON public.beneficiaries;
CREATE POLICY "Users can delete their own beneficiaries." ON public.beneficiaries FOR DELETE USING (auth.uid() = created_by);

-- 8. SERVICES TABLE
-- Tracks individual service sessions provided to beneficiaries
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beneficiary_id UUID REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  service_type TEXT NOT NULL,
  provider_name TEXT,
  venue TEXT,
  notes TEXT,
  outcome TEXT,
  fee_charged NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users DEFAULT auth.uid()
);

-- ENABLE RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Services are viewable by authenticated users." ON public.services;
CREATE POLICY "Services are viewable by authenticated users." ON public.services FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert services." ON public.services;
CREATE POLICY "Authenticated users can insert services." ON public.services FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own services." ON public.services;
CREATE POLICY "Users can update their own services." ON public.services FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own services." ON public.services;
CREATE POLICY "Users can delete their own services." ON public.services FOR DELETE USING (auth.uid() = created_by);
