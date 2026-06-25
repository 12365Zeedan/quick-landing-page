DROP POLICY IF EXISTS "Authenticated insert rasd" ON public.rasd_log;
CREATE POLICY "Insert rasd for own tx" ON public.rasd_log
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pos_transactions t
    WHERE t.id = rasd_log.transaction_id
      AND (t.cashier_id = auth.uid()
           OR public.has_role(auth.uid(),'admin')
           OR public.has_role(auth.uid(),'branch_manager')
           OR public.has_role(auth.uid(),'pos_supervisor'))
  ));

DROP POLICY IF EXISTS "Authenticated insert zatca" ON public.zatca_submissions;
CREATE POLICY "Insert zatca for own tx" ON public.zatca_submissions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pos_transactions t
    WHERE t.id = zatca_submissions.transaction_id
      AND (t.cashier_id = auth.uid()
           OR public.has_role(auth.uid(),'admin')
           OR public.has_role(auth.uid(),'branch_manager')
           OR public.has_role(auth.uid(),'pos_supervisor'))
  ));