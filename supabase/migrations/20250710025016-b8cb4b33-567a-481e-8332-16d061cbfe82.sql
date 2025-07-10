-- Add country coordinates storage for better Mapbox integration
-- This will allow us to store geocoded coordinates for faster map rendering

-- Create a table to store country information with coordinates
CREATE TABLE IF NOT EXISTS public.country_coordinates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name TEXT NOT NULL UNIQUE,
  country_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on country_coordinates table
ALTER TABLE public.country_coordinates ENABLE ROW LEVEL SECURITY;

-- Create policy for country_coordinates (read-only for all users)
CREATE POLICY "Anyone can view country coordinates" 
ON public.country_coordinates 
FOR SELECT 
USING (true);

-- Insert common countries with their coordinates for better Mapbox integration
INSERT INTO public.country_coordinates (country_name, country_code, latitude, longitude) VALUES
('United States', 'US', 39.8283, -98.5795),
('Canada', 'CA', 56.1304, -106.3468),
('Mexico', 'MX', 23.6345, -102.5528),
('Costa Rica', 'CR', 9.7489, -83.7534),
('Panama', 'PA', 8.5380, -80.7821),
('United Kingdom', 'GB', 55.3781, -3.4360),
('France', 'FR', 46.2276, 2.2137),
('Germany', 'DE', 51.1657, 10.4515),
('Italy', 'IT', 41.8719, 12.5674),
('Spain', 'ES', 40.4637, -3.7492),
('Netherlands', 'NL', 52.1326, 5.2913),
('Switzerland', 'CH', 46.8182, 8.2275),
('Austria', 'AT', 47.5162, 14.5501),
('Norway', 'NO', 60.4720, 8.4689),
('Japan', 'JP', 36.2048, 138.2529),
('China', 'CN', 35.8617, 104.1954),
('Thailand', 'TH', 15.8700, 100.9925),
('Singapore', 'SG', 1.3521, 103.8198),
('South Korea', 'KR', 35.9078, 127.7669),
('India', 'IN', 20.5937, 78.9629),
('Indonesia', 'ID', -0.7893, 113.9213),
('Malaysia', 'MY', 4.2105, 101.9758),
('Philippines', 'PH', 12.8797, 121.7740),
('Brazil', 'BR', -14.2350, -51.9253),
('Argentina', 'AR', -38.4161, -63.6167),
('Chile', 'CL', -35.6751, -71.5430),
('Peru', 'PE', -9.1900, -75.0152),
('Colombia', 'CO', 4.5709, -74.2973),
('Ecuador', 'EC', -1.8312, -78.1834),
('Uruguay', 'UY', -32.5228, -55.7658),
('South Africa', 'ZA', -30.5595, 22.9375),
('Morocco', 'MA', 31.7917, -7.0926),
('Egypt', 'EG', 26.0975, 30.0444),
('Kenya', 'KE', -0.0236, 37.9062),
('Tanzania', 'TZ', -6.3690, 34.8888),
('Ghana', 'GH', 7.9465, -1.0232),
('Nigeria', 'NG', 9.0820, 8.6753),
('Australia', 'AU', -25.2744, 133.7751),
('New Zealand', 'NZ', -40.9006, 174.8860),
('Fiji', 'FJ', -16.5789, 179.4146),
('Tahiti', 'PF', -17.6797, -149.4068),
('Samoa', 'WS', -13.7590, -172.1046)
ON CONFLICT (country_name) DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_country_coordinates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_country_coordinates_updated_at
BEFORE UPDATE ON public.country_coordinates
FOR EACH ROW
EXECUTE FUNCTION public.update_country_coordinates_updated_at();