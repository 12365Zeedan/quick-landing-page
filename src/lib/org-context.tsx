import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type OrgRole = "owner" | "admin" | "accountant" | "cashier";

export interface Organization {
  id: string;
  name: string;
  business_type: string;
  currency: string;
  tax_number: string | null;
  commercial_register: string | null;
  national_address: string | null;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  role?: OrgRole;
}

interface OrgCtx {
  organizations: Organization[];
  currentOrg: Organization | null;
  loading: boolean;
  switchOrg: (id: string) => void;
  refresh: () => Promise<void>;
  createOrg: (input: {
    name: string;
    business_type?: string;
    currency?: string;
    tax_number?: string | null;
    commercial_register?: string | null;
    national_address?: string | null;
    logo_url?: string | null;
  }) => Promise<Organization>;
  uploadLogo: (file: File) => Promise<string>;
  updateOrg: (id: string, patch: Partial<Organization>) => Promise<void>;
  deleteOrg: (id: string) => Promise<void>;
}

const Ctx = createContext<OrgCtx | null>(null);
const STORAGE_KEY = "pl_current_org";

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: memberships, error } = await supabase
      .from("organization_members")
      .select("role, organization:organizations(*)")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[orgs] fetch error", error);
      setOrganizations([]);
      setLoading(false);
      return;
    }
    const orgs: Organization[] = (memberships ?? [])
      .map((m: any) => m.organization && { ...m.organization, role: m.role as OrgRole })
      .filter(Boolean);
    setOrganizations(orgs);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchOrgs();
  }, [authLoading, fetchOrgs]);

  // Hydrate current org id from storage
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setCurrentOrgId(saved);
  }, []);

  // Ensure current org id is valid
  useEffect(() => {
    if (!organizations.length) {
      setCurrentOrgId(null);
      return;
    }
    const exists = currentOrgId && organizations.some((o) => o.id === currentOrgId);
    if (!exists) {
      const next = organizations[0].id;
      setCurrentOrgId(next);
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, next);
    }
  }, [organizations, currentOrgId]);

  const switchOrg = useCallback((id: string) => {
    setCurrentOrgId(id);
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const createOrg: OrgCtx["createOrg"] = useCallback(
    async (input) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("create_organization", {
        _name: input.name,
        _business_type: input.business_type ?? "pharmacy",
        _currency: input.currency ?? "SAR",
        _tax_number: input.tax_number ?? undefined,
        _commercial_register: input.commercial_register ?? undefined,
        _national_address: input.national_address ?? undefined,
        _logo_url: input.logo_url ?? undefined,
      });
      if (error) throw error;
      await fetchOrgs();
      switchOrg((data as any).id);
      return { ...(data as any), role: "owner" as OrgRole };
    },
    [user, fetchOrgs, switchOrg],
  );

  const updateOrg: OrgCtx["updateOrg"] = useCallback(
    async (id, patch) => {
      const { role, ...rest } = patch;
      const { error } = await supabase.from("organizations").update(rest as any).eq("id", id);
      if (error) throw error;
      await fetchOrgs();
    },
    [fetchOrgs],
  );

  const uploadLogo: OrgCtx["uploadLogo"] = useCallback(
    async (file) => {
      if (!user) throw new Error("Not authenticated");
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("org-logos")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
      return data.publicUrl;
    },
    [user],
  );

  const deleteOrg: OrgCtx["deleteOrg"] = useCallback(
    async (id) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
      await fetchOrgs();
    },
    [fetchOrgs],
  );

  const currentOrg = useMemo(
    () => organizations.find((o) => o.id === currentOrgId) ?? null,
    [organizations, currentOrgId],
  );

  return (
    <Ctx.Provider
      value={{
        organizations,
        currentOrg,
        loading,
        switchOrg,
        refresh: fetchOrgs,
        createOrg,
        updateOrg,
        deleteOrg,
        uploadLogo,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useOrg() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOrg must be used within OrgProvider");
  return v;
}
