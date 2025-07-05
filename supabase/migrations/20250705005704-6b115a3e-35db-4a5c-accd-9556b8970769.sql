-- Create users table for storing user profile data
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  userid UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  comp_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  cell BIGINT,
  user_type TEXT DEFAULT 'individual',
  countries_visited JSONB,
  flight_freq JSONB,
  p_airlines JSONB,
  p_hotels JSONB,
  p_car_rentals JSONB,
  avg_spending DECIMAL,
  taai_rating INTEGER,
  taai_rating_text TEXT,
  itineraries JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = userid);

CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = userid);

CREATE POLICY "Users can insert their own data" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = userid);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    userid,
    email,
    first_name,
    last_name,
    username,
    comp_name,
    address,
    cell,
    user_type
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'registered_address',
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'phone' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'phone')::BIGINT
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'individual')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();