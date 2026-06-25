-- Phase 2A: Returns/Void support
ALTER TABLE public.pos_transactions
  ADD COLUMN IF NOT EXISTS is_return BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_transaction_id UUID;

CREATE INDEX IF NOT EXISTS idx_pos_transactions_original ON public.pos_transactions(original_transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_session ON public.pos_transactions(session_id);

-- Need supervisor reason on holds
ALTER TABLE public.pos_holds
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0;

-- Phase 2B: Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_national_id TEXT,
  patient_phone TEXT,
  doctor_name TEXT,
  doctor_license_no TEXT,
  facility_name TEXT,
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID NOT NULL,
  branch_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pharmacists create prescriptions" ON public.prescriptions
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Rasd dispensing log (mock)
CREATE TABLE IF NOT EXISTS public.rasd_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  medicine_id UUID NOT NULL,
  batch_number TEXT,
  qty INTEGER NOT NULL,
  patient_national_id TEXT,
  prescription_id UUID,
  rasd_status TEXT NOT NULL DEFAULT 'pending',
  rasd_reference TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rasd_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read rasd" ON public.rasd_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert rasd" ON public.rasd_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Phase 2C: ZATCA submissions log
CREATE TABLE IF NOT EXISTS public.zatca_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  invoice_xml TEXT,
  invoice_hash TEXT,
  qr_code TEXT,
  zatca_status TEXT NOT NULL DEFAULT 'pending',
  zatca_response JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.zatca_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read zatca" ON public.zatca_submissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert zatca" ON public.zatca_submissions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow refund creation by cashier; widen INSERT policy for return tx (still must be cashier_id = auth.uid())
-- Existing "Create transactions" policy already allows this.