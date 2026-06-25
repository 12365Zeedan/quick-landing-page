
-- Drop POS-related tables and types
DROP TABLE IF EXISTS public.rasd_log CASCADE;
DROP TABLE IF EXISTS public.zatca_submissions CASCADE;
DROP TABLE IF EXISTS public.pos_payments CASCADE;
DROP TABLE IF EXISTS public.pos_transaction_items CASCADE;
DROP TABLE IF EXISTS public.pos_transactions CASCADE;
DROP TABLE IF EXISTS public.pos_holds CASCADE;
DROP TABLE IF EXISTS public.pos_audit_log CASCADE;
DROP TABLE IF EXISTS public.pos_sessions CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.medicine_batches CASCADE;
DROP TABLE IF EXISTS public.medicines CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;

DROP SEQUENCE IF EXISTS public.invoice_counter_seq CASCADE;
DROP SEQUENCE IF EXISTS public.pos_audit_log_id_seq CASCADE;

DROP FUNCTION IF EXISTS public.block_audit_changes() CASCADE;

DROP TYPE IF EXISTS public.session_status CASCADE;
DROP TYPE IF EXISTS public.transaction_status CASCADE;
DROP TYPE IF EXISTS public.zatca_status CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;
