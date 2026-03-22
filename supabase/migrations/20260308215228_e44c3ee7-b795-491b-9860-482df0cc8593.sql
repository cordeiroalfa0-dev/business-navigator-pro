-- Allow users to update their own check-ins
CREATE POLICY "Users can update own checkins"
ON public.meta_checkins
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own check-ins (admin/master already can via existing policy)
CREATE POLICY "Users can delete own checkins"
ON public.meta_checkins
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to delete their own contributions (acoes they created)
CREATE POLICY "Users can delete own acoes"
ON public.acoes_meta
FOR DELETE
TO authenticated
USING (created_by = auth.uid());