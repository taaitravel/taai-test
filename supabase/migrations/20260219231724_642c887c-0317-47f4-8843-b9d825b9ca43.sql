
-- Update the itinerary UPDATE policy to include collaborator role
DROP POLICY IF EXISTS "Owners and editors can update itineraries" ON public.itinerary;
CREATE POLICY "Owners and collaborators can update itineraries"
ON public.itinerary FOR UPDATE
USING (
  auth.uid() = userid
  OR get_itinerary_role(id, auth.uid()) IN ('owner', 'editor', 'collaborator')
);
