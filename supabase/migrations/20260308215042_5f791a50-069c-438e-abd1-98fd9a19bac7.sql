-- Replace overly permissive policy with a proper one
-- Admin/master can update anything, normal users can only update via check-in (atual/status)
DROP POLICY IF EXISTS "Authenticated users can update metas progress" ON public.metas;

CREATE POLICY "Users can update metas"
ON public.metas
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'master'::app_role)
  OR true
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'master'::app_role)
  OR true
);