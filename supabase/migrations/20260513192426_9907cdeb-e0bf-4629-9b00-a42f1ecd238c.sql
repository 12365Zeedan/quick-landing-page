-- 1. Add stable search_path to all SECURITY DEFINER / trigger functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'pos_cashier');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.block_audit_changes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'pos_audit_log is append-only';
END; $$;

-- 2. Lock down SECURITY DEFINER function execution to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- handle_new_user runs only via trigger, not direct call

-- 3. Tighten audit log insert: must reference current user
DROP POLICY IF EXISTS "Insert audit" ON public.pos_audit_log;
CREATE POLICY "Insert own audit" ON public.pos_audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());