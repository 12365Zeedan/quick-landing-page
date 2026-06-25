-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'branch_manager', 'pharmacist', 'pos_supervisor', 'pos_cashier');
CREATE TYPE public.session_status AS ENUM ('open', 'closed', 'discrepancy');
CREATE TYPE public.transaction_status AS ENUM ('completed', 'voided', 'refunded', 'held');
CREATE TYPE public.payment_method AS ENUM ('cash', 'mada', 'visa', 'apple_pay', 'insurance', 'store_credit', 'loyalty');
CREATE TYPE public.zatca_status AS ENUM ('pending', 'submitted', 'cleared', 'failed', 'not_required');

-- =========================================
-- PROFILES (linked to auth.users)
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  pin_hash TEXT, -- bcrypt of 6-digit PIN (set later)
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- USER ROLES (separate to prevent privilege escalation)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =========================================
-- BRANCHES
-- =========================================
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  address TEXT,
  manager_name TEXT,
  vat_number TEXT, -- 15-digit Saudi VAT
  cr_number TEXT,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- =========================================
-- MEDICINES (master)
-- =========================================
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_name_ar TEXT NOT NULL,
  trade_name_en TEXT NOT NULL,
  scientific_name TEXT,
  sfda_registration_no TEXT,
  manufacturer TEXT,
  dosage_form TEXT, -- tablet, syrup, injection...
  strength TEXT,    -- 500mg, 5ml...
  unit_of_measure TEXT NOT NULL DEFAULT 'unit',
  barcode TEXT UNIQUE,
  default_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,4) NOT NULL DEFAULT 0.15, -- 15%
  category TEXT,
  controlled_substance_flag BOOLEAN NOT NULL DEFAULT FALSE,
  prescription_required_flag BOOLEAN NOT NULL DEFAULT FALSE,
  narcotic_flag BOOLEAN NOT NULL DEFAULT FALSE,
  storage_conditions TEXT,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_medicines_barcode ON public.medicines(barcode) WHERE active;
CREATE INDEX idx_medicines_search ON public.medicines USING gin(to_tsvector('simple', trade_name_ar || ' ' || trade_name_en || ' ' || COALESCE(scientific_name,'')));

-- =========================================
-- MEDICINE BATCHES
-- =========================================
CREATE TABLE public.medicine_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  manufacture_date DATE,
  supplier_name TEXT,
  received_qty INTEGER NOT NULL CHECK (received_qty >= 0),
  remaining_qty INTEGER NOT NULL CHECK (remaining_qty >= 0),
  unit_cost NUMERIC(12,4) NOT NULL DEFAULT 0,
  quarantined BOOLEAN NOT NULL DEFAULT FALSE,
  quarantine_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(medicine_id, batch_number, branch_id)
);
ALTER TABLE public.medicine_batches ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_batches_fefo ON public.medicine_batches(medicine_id, branch_id, expiry_date) WHERE remaining_qty > 0 AND NOT quarantined;
CREATE INDEX idx_batches_expiry ON public.medicine_batches(expiry_date) WHERE remaining_qty > 0;

-- =========================================
-- POS SESSIONS (shifts)
-- =========================================
CREATE TABLE public.pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  cashier_id UUID NOT NULL REFERENCES auth.users(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_float NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_count NUMERIC(12,2),
  system_expected NUMERIC(12,2),
  variance NUMERIC(12,2),
  status public.session_status NOT NULL DEFAULT 'open',
  notes TEXT
);
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sessions_active ON public.pos_sessions(cashier_id) WHERE status = 'open';

-- =========================================
-- POS TRANSACTIONS (invoices)
-- =========================================
CREATE SEQUENCE public.invoice_counter_seq START 1;

CREATE TABLE public.pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.pos_sessions(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  cashier_id UUID NOT NULL REFERENCES auth.users(id),
  invoice_no TEXT NOT NULL UNIQUE, -- e.g. INV-000001
  invoice_counter BIGINT NOT NULL DEFAULT nextval('public.invoice_counter_seq'),
  customer_id UUID, -- FK added in later phase
  prescription_id UUID,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.transaction_status NOT NULL DEFAULT 'completed',
  zatca_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  zatca_status public.zatca_status NOT NULL DEFAULT 'pending',
  invoice_hash TEXT,
  previous_invoice_hash TEXT,
  qr_code_data TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES auth.users(id),
  void_reason TEXT
);
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tx_session ON public.pos_transactions(session_id);
CREATE INDEX idx_tx_created ON public.pos_transactions(created_at DESC);

-- =========================================
-- POS TRANSACTION ITEMS
-- =========================================
CREATE TABLE public.pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.pos_transactions(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  batch_id UUID NOT NULL REFERENCES public.medicine_batches(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,4) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,4) NOT NULL DEFAULT 0.15,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL,
  serial_number TEXT
);
ALTER TABLE public.pos_transaction_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tx_items_tx ON public.pos_transaction_items(transaction_id);

-- =========================================
-- POS PAYMENTS
-- =========================================
CREATE TABLE public.pos_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.pos_transactions(id) ON DELETE CASCADE,
  method public.payment_method NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reference TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_payments ENABLE ROW LEVEL SECURITY;

-- =========================================
-- POS HOLDS (parked carts)
-- =========================================
CREATE TABLE public.pos_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.pos_sessions(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES auth.users(id),
  label TEXT,
  cart_snapshot JSONB NOT NULL,
  held_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recalled_at TIMESTAMPTZ
);
ALTER TABLE public.pos_holds ENABLE ROW LEVEL SECURITY;

-- =========================================
-- AUDIT LOG (append-only)
-- =========================================
CREATE TABLE public.pos_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address TEXT,
  terminal_id TEXT,
  supervisor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_audit_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_created ON public.pos_audit_log(created_at DESC);

-- Enforce append-only
CREATE OR REPLACE FUNCTION public.block_audit_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'pos_audit_log is append-only';
END; $$;
CREATE TRIGGER trg_block_audit_update BEFORE UPDATE OR DELETE ON public.pos_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.block_audit_changes();

-- =========================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- Default role: cashier
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'pos_cashier');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- updated_at trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_medicines_touch BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- RLS POLICIES
-- =========================================
-- Profiles: users see/edit own; admins see all
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles: only admins manage; users see their own
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Branches: any authenticated user reads; managers/admins write
CREATE POLICY "Authenticated read branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers manage branches" ON public.branches FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'branch_manager'));

-- Medicines: any authenticated user reads; managers/pharmacists write
CREATE POLICY "Authenticated read medicines" ON public.medicines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pharmacists manage medicines" ON public.medicines FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'pharmacist'));

-- Batches: same as medicines
CREATE POLICY "Authenticated read batches" ON public.medicine_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pharmacists manage batches" ON public.medicine_batches FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'pharmacist'));

-- Sessions: cashier sees own; managers see all in branch
CREATE POLICY "Cashiers view own sessions" ON public.pos_sessions FOR SELECT TO authenticated
  USING (cashier_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'pos_supervisor'));
CREATE POLICY "Cashiers create own sessions" ON public.pos_sessions FOR INSERT TO authenticated
  WITH CHECK (cashier_id = auth.uid());
CREATE POLICY "Cashiers update own sessions" ON public.pos_sessions FOR UPDATE TO authenticated
  USING (cashier_id = auth.uid() OR public.has_role(auth.uid(),'pos_supervisor') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'admin'));

-- Transactions: cashier sees own session; managers see all
CREATE POLICY "View transactions" ON public.pos_transactions FOR SELECT TO authenticated
  USING (cashier_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'pos_supervisor'));
CREATE POLICY "Create transactions" ON public.pos_transactions FOR INSERT TO authenticated
  WITH CHECK (cashier_id = auth.uid());
CREATE POLICY "Void transactions" ON public.pos_transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'pos_supervisor') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'admin'));

-- Tx items: follow parent
CREATE POLICY "View tx items" ON public.pos_transaction_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pos_transactions t WHERE t.id = transaction_id
    AND (t.cashier_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'pos_supervisor'))));
CREATE POLICY "Insert tx items" ON public.pos_transaction_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.pos_transactions t WHERE t.id = transaction_id AND t.cashier_id = auth.uid()));

-- Payments
CREATE POLICY "View payments" ON public.pos_payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pos_transactions t WHERE t.id = transaction_id
    AND (t.cashier_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'pos_supervisor'))));
CREATE POLICY "Insert payments" ON public.pos_payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.pos_transactions t WHERE t.id = transaction_id AND t.cashier_id = auth.uid()));

-- Holds
CREATE POLICY "Manage own holds" ON public.pos_holds FOR ALL TO authenticated
  USING (cashier_id = auth.uid() OR public.has_role(auth.uid(),'pos_supervisor') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'admin'));

-- Audit log: insert only by authenticated; read by managers
CREATE POLICY "Insert audit" ON public.pos_audit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "View audit" ON public.pos_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'branch_manager') OR public.has_role(auth.uid(),'pos_supervisor'));

-- =========================================
-- SEED DATA
-- =========================================
-- Main branch
INSERT INTO public.branches (id, code, name_ar, name_en, address, manager_name, vat_number, cr_number, is_main) VALUES
  ('00000000-0000-0000-0000-000000000001', 'BR-001', 'الفرع الرئيسي - الرياض', 'Main Branch - Riyadh',
   'شارع الملك فهد، الرياض', 'أحمد المحمد', '300123456700003', '1010123456', TRUE);

-- Common Saudi pharmacy medicines
INSERT INTO public.medicines (trade_name_ar, trade_name_en, scientific_name, sfda_registration_no, manufacturer, dosage_form, strength, barcode, default_price, category, controlled_substance_flag, prescription_required_flag) VALUES
  ('بانادول 500', 'Panadol 500', 'Paracetamol', 'SFDA-12345', 'GSK', 'tablet', '500mg', '6281234500011', 12.00, 'Analgesics', FALSE, FALSE),
  ('أوجمنتين 625', 'Augmentin 625', 'Amoxicillin/Clavulanate', 'SFDA-12346', 'GSK', 'tablet', '625mg', '6281234500028', 45.00, 'Antibiotics', FALSE, TRUE),
  ('فولتارين جل', 'Voltaren Gel', 'Diclofenac', 'SFDA-12347', 'Novartis', 'gel', '1%', '6281234500035', 28.50, 'Topical', FALSE, FALSE),
  ('كونكور 5', 'Concor 5', 'Bisoprolol', 'SFDA-12348', 'Merck', 'tablet', '5mg', '6281234500042', 35.00, 'Cardiovascular', FALSE, TRUE),
  ('غلوكوفاج 500', 'Glucophage 500', 'Metformin', 'SFDA-12349', 'Merck', 'tablet', '500mg', '6281234500059', 22.00, 'Diabetes', FALSE, TRUE),
  ('فيتامين د 50000', 'Vitamin D 50000', 'Cholecalciferol', 'SFDA-12350', 'SPIMACO', 'capsule', '50000IU', '6281234500066', 18.00, 'Vitamins', FALSE, FALSE),
  ('زيرتك', 'Zyrtec', 'Cetirizine', 'SFDA-12351', 'UCB', 'tablet', '10mg', '6281234500073', 24.00, 'Antihistamines', FALSE, FALSE),
  ('نكسيوم 40', 'Nexium 40', 'Esomeprazole', 'SFDA-12352', 'AstraZeneca', 'tablet', '40mg', '6281234500080', 65.00, 'Gastro', FALSE, TRUE),
  ('كلاريتين', 'Claritine', 'Loratadine', 'SFDA-12353', 'Bayer', 'tablet', '10mg', '6281234500097', 21.00, 'Antihistamines', FALSE, FALSE),
  ('بروفين 400', 'Brufen 400', 'Ibuprofen', 'SFDA-12354', 'Abbott', 'tablet', '400mg', '6281234500103', 14.00, 'Analgesics', FALSE, FALSE),
  ('ترامادول 50', 'Tramadol 50', 'Tramadol HCl', 'SFDA-12355', 'Grunenthal', 'capsule', '50mg', '6281234500110', 55.00, 'Analgesics', TRUE, TRUE),
  ('ريفوتريل 2', 'Rivotril 2', 'Clonazepam', 'SFDA-12356', 'Roche', 'tablet', '2mg', '6281234500127', 75.00, 'Neurology', TRUE, TRUE);

-- Batches with varied expiries (FEFO test data)
INSERT INTO public.medicine_batches (medicine_id, branch_id, batch_number, expiry_date, manufacture_date, supplier_name, received_qty, remaining_qty, unit_cost)
SELECT m.id, '00000000-0000-0000-0000-000000000001', 'B' || LPAD((row_number() OVER ())::text, 5, '0'),
       (CURRENT_DATE + ((random()*900 + 60)::int))::date,
       (CURRENT_DATE - INTERVAL '180 days')::date,
       'United Pharma Co.',
       200, 150 + (random()*50)::int,
       m.default_price * 0.6
FROM public.medicines m;

-- Add a near-expiry batch to one item to test warnings
INSERT INTO public.medicine_batches (medicine_id, branch_id, batch_number, expiry_date, manufacture_date, supplier_name, received_qty, remaining_qty, unit_cost)
SELECT id, '00000000-0000-0000-0000-000000000001', 'B-NEAR-001',
       (CURRENT_DATE + INTERVAL '25 days')::date,
       (CURRENT_DATE - INTERVAL '700 days')::date,
       'United Pharma Co.', 50, 30, default_price * 0.55
FROM public.medicines WHERE trade_name_en = 'Panadol 500';