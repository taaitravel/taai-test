-- Add theme preference column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark';

-- Add check constraint for valid values
ALTER TABLE public.users 
ADD CONSTRAINT users_theme_preference_check 
CHECK (theme_preference IN ('light', 'dark', 'system'));