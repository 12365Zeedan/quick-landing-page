
-- Enum for org roles
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'accountant', 'cashier');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'pharmacy',
  currency TEXT NOT NULL DEFAULT 'SAR',
  tax_number TEXT,
  commercial_register TEXT,
  logo_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Members
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.org_role NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);

-- Security definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org_id UUID, _user_id UUID, _roles public.org_role[])
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id AND user_id = _user_id AND role = ANY(_roles)
  );
$$;

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Members view their organizations"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id, auth.uid()));

CREATE POLICY "Authenticated users create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners and admins update their organizations"
  ON public.organizations FOR UPDATE
  USING (public.has_org_role(id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));

CREATE POLICY "Owners delete their organizations"
  ON public.organizations FOR DELETE
  USING (public.has_org_role(id, auth.uid(), ARRAY['owner']::public.org_role[]));

-- Members policies
CREATE POLICY "Members view co-members"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Owners and admins add members"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));

CREATE POLICY "Owners and admins update members"
  ON public.organization_members FOR UPDATE
  USING (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));

CREATE POLICY "Owners and admins remove members"
  ON public.organization_members FOR DELETE
  USING (public.has_org_role(organization_id, auth.uid(), ARRAY['owner','admin']::public.org_role[]));

-- Trigger: auto-add creator as owner
CREATE OR REPLACE FUNCTION public.add_organization_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_add_organization_owner
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.add_organization_owner();

-- Updated_at trigger
CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
