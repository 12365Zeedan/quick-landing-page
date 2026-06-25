import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Check, Loader2, Pencil, Plus, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { RequireAuth } from "@/components/require-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/app-context";
import { useOrg, type Organization } from "@/lib/org-context";
import { LogoPicker } from "@/components/logo-picker";

export const Route = createFileRoute("/organizations")({
  head: () => ({
    meta: [
      { title: "Organizations — PharmLedger" },
      { name: "description", content: "Manage your organizations and switch between them." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OrganizationsPage />
    </RequireAuth>
  ),
});

function OrganizationsPage() {
  const { t, dir } = useApp();
  const { organizations, currentOrg, switchOrg, loading, createOrg, updateOrg, deleteOrg } = useOrg();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);

  return (
    <div className="min-h-screen flex bg-background" dir={dir}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-4 lg:px-8 py-6 space-y-6">
          <header className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("organizations")}</h1>
              <p className="text-sm text-muted-foreground">{t("manageOrganizations")}</p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold glow-primary"
            >
              <Plus className="size-4" />
              {t("createOrganization")}
            </button>
          </header>

          {loading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              <Building2 className="size-10 mx-auto mb-3 opacity-50" />
              <p>{t("noOrganizations")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {organizations.map((o) => {
                const isCurrent = currentOrg?.id === o.id;
                const isOwner = o.role === "owner";
                return (
                  <div
                    key={o.id}
                    className={`rounded-2xl border p-5 bg-card transition ${
                      isCurrent ? "border-primary/60 shadow-md" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-11 rounded-xl gradient-primary grid place-items-center shrink-0 overflow-hidden">
                          {o.logo_url ? (
                            <img src={o.logo_url} alt="" className="size-full object-cover" />
                          ) : (
                            <Building2 className="size-5 text-primary-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{o.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {t(`role${(o.role ?? "cashier").charAt(0).toUpperCase()}${(o.role ?? "cashier").slice(1)}` as any)}
                            {" · "}
                            {o.currency}
                          </div>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                          <Check className="size-3" />
                          {t("currentOrganization")}
                        </span>
                      )}
                    </div>

                    <dl className="mt-4 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{t("businessType")}</dt>
                        <dd>{t(`${o.business_type}Type` as any) || o.business_type}</dd>
                      </div>
                      {o.tax_number && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">{t("taxNumber")}</dt>
                          <dd className="font-mono">{o.tax_number}</dd>
                        </div>
                      )}
                      {o.commercial_register && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">{t("commercialRegister")}</dt>
                          <dd className="font-mono">{o.commercial_register}</dd>
                        </div>
                      )}
                      {o.national_address && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground shrink-0">{t("nationalAddress")}</dt>
                          <dd className="text-end break-words">{o.national_address}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-4 flex items-center gap-2">
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            switchOrg(o.id);
                            toast.success(t("switchOrganization"));
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium gradient-primary text-primary-foreground"
                        >
                          {t("switchOrganization")}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!isCurrent) await switchOrg(o.id);
                          navigate({ to: "/settings" });
                        }}
                        className="size-8 grid place-items-center rounded-lg border border-border hover:bg-accent"
                        aria-label={t("settingsTitle")}
                        title={t("settingsTitle")}
                      >
                        <SettingsIcon className="size-3.5" />
                      </button>
                      {isOwner && (
                        <>
                          <button
                            onClick={() => setEditing(o)}
                            className="size-8 grid place-items-center rounded-lg border border-border hover:bg-accent"
                            aria-label={t("editOrganization")}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(o)}
                            className="size-8 grid place-items-center rounded-lg border border-border hover:bg-destructive hover:text-destructive-foreground text-destructive"
                            aria-label={t("deleteOrganization")}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <OrgFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (input) => {
          await createOrg(input);
          toast.success(t("organizationCreated"));
        }}
      />

      <OrgFormDialog
        open={!!editing}
        org={editing ?? undefined}
        onOpenChange={(v) => !v && setEditing(null)}
        onSubmit={async (input) => {
          if (!editing) return;
          await updateOrg(editing.id, input);
          toast.success(t("organizationUpdated"));
          setEditing(null);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteOrganization")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmDeleteOrg")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteOrg(deleting.id);
                  toast.success(t("organizationDeleted"));
                  setDeleting(null);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteOrganization")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OrgFormDialog({
  open,
  onOpenChange,
  org,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  org?: Organization;
  onSubmit: (input: {
    name: string;
    business_type: string;
    currency: string;
    tax_number: string | null;
    commercial_register: string | null;
    national_address: string | null;
    logo_url: string | null;
  }) => Promise<void>;
}) {
  const { t } = useApp();
  const [name, setName] = useState(org?.name ?? "");
  const [bizType, setBizType] = useState(org?.business_type ?? "pharmacy");
  const [currency, setCurrency] = useState(org?.currency ?? "SAR");
  const [taxNum, setTaxNum] = useState(org?.tax_number ?? "");
  const [cr, setCr] = useState(org?.commercial_register ?? "");
  const [nationalAddr, setNationalAddr] = useState(org?.national_address ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(org?.logo_url ?? null);
  const [saving, setSaving] = useState(false);

  // reset when opening
  useState(() => {
    setName(org?.name ?? "");
    setBizType(org?.business_type ?? "pharmacy");
    setCurrency(org?.currency ?? "SAR");
    setTaxNum(org?.tax_number ?? "");
    setCr(org?.commercial_register ?? "");
    setNationalAddr(org?.national_address ?? "");
    setLogoUrl(org?.logo_url ?? null);
  });

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("organizationName"));
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        business_type: bizType,
        currency,
        tax_number: taxNum.trim() || null,
        commercial_register: cr.trim() || null,
        national_address: nationalAddr.trim() || null,
        logo_url: logoUrl,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{org ? t("editOrganization") : t("createOrganization")}</DialogTitle>
          <DialogDescription>{t("organizationName")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("organizationLogo")}</Label>
            <LogoPicker value={logoUrl} onChange={setLogoUrl} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("organizationName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("businessType")}</Label>
              <Select value={bizType} onValueChange={setBizType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pharmacy">{t("pharmacyType")}</SelectItem>
                  <SelectItem value="clinic">{t("clinicType")}</SelectItem>
                  <SelectItem value="company">{t("companyType")}</SelectItem>
                  <SelectItem value="retail">{t("retailType")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="EGP">EGP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("taxNumber")}</Label>
            <Input value={taxNum} onChange={(e) => setTaxNum(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("commercialRegister")}</Label>
            <Input value={cr} onChange={(e) => setCr(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("nationalAddress")}</Label>
            <Input value={nationalAddr} onChange={(e) => setNationalAddr(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : org ? t("save") : t("create")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
