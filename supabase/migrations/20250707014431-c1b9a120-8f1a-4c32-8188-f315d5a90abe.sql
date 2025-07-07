-- Add terms acceptance tracking to users table
ALTER TABLE public.users 
ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN privacy_accepted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN terms_version VARCHAR(10) DEFAULT '1.0';

-- Create index for better performance on terms checks
CREATE INDEX idx_users_terms_acceptance ON public.users(userid, terms_accepted_at, privacy_accepted_at);