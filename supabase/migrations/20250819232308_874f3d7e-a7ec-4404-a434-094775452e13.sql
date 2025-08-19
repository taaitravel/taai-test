-- Enhanced booking tracking tables for TAAI Travel financial management
-- This creates tables for comprehensive booking management, financial tracking, and KPI analytics

-- Create enhanced booking management table
CREATE TABLE IF NOT EXISTS public.expedia_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  itinerary_id BIGINT NOT NULL,
  expedia_property_id TEXT,
  booking_reference TEXT UNIQUE NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('hotel', 'flight', 'activity', 'car_rental')),
  
  -- Financial tracking
  base_cost NUMERIC NOT NULL DEFAULT 0,
  taxes NUMERIC NOT NULL DEFAULT 0,
  fees NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0.10, -- 10% default agent commission
  commission_amount NUMERIC GENERATED ALWAYS AS (total_amount * commission_rate) STORED,
  currency TEXT DEFAULT 'USD',
  
  -- Booking details
  booking_details JSONB NOT NULL DEFAULT '{}',
  images JSONB DEFAULT '[]', -- Array of image URLs
  expedia_data JSONB DEFAULT '{}', -- Raw Expedia API response
  
  -- Status tracking
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  
  -- Dates
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  service_start_date DATE,
  service_end_date DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  FOREIGN KEY (itinerary_id) REFERENCES public.itinerary(id) ON DELETE CASCADE
);

-- Create commission tracking table for agent performance
CREATE TABLE IF NOT EXISTS public.agent_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.expedia_bookings(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL, -- References user who made the booking
  commission_amount NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL,
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'earned', 'paid')),
  earned_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment tracking table
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.expedia_bookings(id) ON DELETE CASCADE,
  payment_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit trail table for booking changes
CREATE TABLE IF NOT EXISTS public.booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.expedia_bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business metrics table for KPI tracking
CREATE TABLE IF NOT EXISTS public.business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(metric_date, metric_type)
);

-- Enable RLS on all new tables
ALTER TABLE public.expedia_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expedia_bookings
CREATE POLICY "Users can view their own bookings" ON public.expedia_bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bookings" ON public.expedia_bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON public.expedia_bookings
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for agent_commissions  
CREATE POLICY "Agents can view their own commissions" ON public.agent_commissions
  FOR SELECT USING (agent_id = auth.uid());

-- RLS Policies for booking_payments
CREATE POLICY "Users can view payments for their bookings" ON public.booking_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expedia_bookings 
      WHERE id = booking_payments.booking_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for booking_audit_log
CREATE POLICY "Users can view audit logs for their bookings" ON public.booking_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expedia_bookings 
      WHERE id = booking_audit_log.booking_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for business_metrics (admin only)
CREATE POLICY "Only admins can view business metrics" ON public.business_metrics
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_expedia_bookings_user_id ON public.expedia_bookings(user_id);
CREATE INDEX idx_expedia_bookings_itinerary_id ON public.expedia_bookings(itinerary_id);
CREATE INDEX idx_expedia_bookings_status ON public.expedia_bookings(booking_status);
CREATE INDEX idx_expedia_bookings_dates ON public.expedia_bookings(service_start_date, service_end_date);
CREATE INDEX idx_agent_commissions_agent_id ON public.agent_commissions(agent_id);
CREATE INDEX idx_business_metrics_date_type ON public.business_metrics(metric_date, metric_type);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_expedia_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expedia_bookings_updated_at
  BEFORE UPDATE ON public.expedia_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_expedia_bookings_updated_at();

-- Function to create booking audit log entries
CREATE OR REPLACE FUNCTION public.log_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.booking_audit_log (booking_id, user_id, action, old_values, new_values)
    VALUES (NEW.id, auth.uid(), 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_audit_log (booking_id, user_id, action, new_values)
    VALUES (NEW.id, auth.uid(), 'INSERT', to_jsonb(NEW));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_expedia_booking_changes
  AFTER INSERT OR UPDATE ON public.expedia_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_changes();