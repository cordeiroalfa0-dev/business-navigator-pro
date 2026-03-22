-- Allow all authenticated users to update metas atual and status (for check-in value updates)
DROP POLICY IF EXISTS "Admin and master can update metas" ON public.metas;

CREATE POLICY "Authenticated users can update metas progress"
ON public.metas
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);