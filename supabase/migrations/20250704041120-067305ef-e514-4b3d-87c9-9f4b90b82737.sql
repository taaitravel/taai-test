-- Create trigger to sync auth.users with public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS trigger
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
    CASE WHEN NEW.raw_user_meta_data ->> 'phone' IS NOT NULL 
         THEN (NEW.raw_user_meta_data ->> 'phone')::numeric 
         ELSE NULL END,
    NEW.raw_user_meta_data ->> 'user_type'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_sync ON auth.users;
CREATE TRIGGER on_auth_user_created_sync
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_sync();

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

-- Create policy for inserting (only via trigger for new auth users)
CREATE POLICY "Users can be created via auth trigger" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = userid);