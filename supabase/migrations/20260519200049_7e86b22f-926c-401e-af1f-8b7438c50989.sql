
CREATE OR REPLACE FUNCTION public.create_organization(
  _name text,
  _business_type text DEFAULT 'pharmacy',
  _currency text DEFAULT 'SAR',
  _tax_number text DEFAULT NULL,
  _commercial_register text DEFAULT NULL,
  _national_address text DEFAULT NULL,
  _logo_url text DEFAULT NULL
)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _org public.organizations;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.organizations (name, business_type, currency, tax_number, commercial_register, national_address, logo_url, created_by)
  VALUES (_name, COALESCE(_business_type,'pharmacy'), COALESCE(_currency,'SAR'), _tax_number, _commercial_register, _national_address, _logo_url, _uid)
  RETURNING * INTO _org;

  RETURN _org;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organization(text,text,text,text,text,text,text) TO authenticated;
