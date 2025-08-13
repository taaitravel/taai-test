-- 1) Ensure roles enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'support');
  END IF;
END
$$;

-- 2) Create user_roles table for staff authorization
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3) Enable RLS on user_roles and allow users to view their own roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- 4) Security definer function to check roles (prevents recursive policy issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 5) Tighten contact_inquiries access
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive public SELECT policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_inquiries' AND policyname = 'Users can view contact inquiries'
  ) THEN
    DROP POLICY "Users can view contact inquiries" ON public.contact_inquiries;
  END IF;
END $$;

-- Allow only staff to view inquiries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_inquiries' AND policyname = 'Only staff can view contact inquiries'
  ) THEN
    CREATE POLICY "Only staff can view contact inquiries"
    ON public.contact_inquiries
    FOR SELECT
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support')
    );
  END IF;
END $$;

-- Keep INSERT open to all (for public contact form submissions); ensure it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_inquiries' AND policyname = 'Anyone can submit contact inquiries'
  ) THEN
    CREATE POLICY "Anyone can submit contact inquiries"
    ON public.contact_inquiries
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;