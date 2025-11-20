-- Add explicit deny policies for contact_inquiries to improve security clarity
-- These prevent any UPDATE or DELETE operations on contact submissions

CREATE POLICY "contact_inquiries_no_update"
  ON public.contact_inquiries
  FOR UPDATE
  USING (false);

CREATE POLICY "contact_inquiries_no_delete"
  ON public.contact_inquiries
  FOR DELETE
  USING (false);