import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Building2,
  Database,
  Globe,
  Languages,
  Mail,
  Palette,
  Plug,
  Receipt,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Calculator,
  Check,
  Download,
  Upload,
  AlertTriangle,
  Pill,
  Smartphone,
  MessageSquare,
  CloudUpload,
  Sun,
  Moon,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Per-field validation schemas for integration credentials.
// Keyed by IntegrationField.id — keep in sync with INTEGRATION_DEFS.
const INTEGRATION_FIELD_SCHEMAS: Record<string, z.ZodType<string>> = {
  // ZATCA VAT number: Saudi 15-digit, starts with 3, ends with 3
  vatNumber: z
    .string()
    .trim()
    .regex(/^3\d{13}3$/, "Must be a 15-digit VAT number starting and ending with 3"),
  // Mada merchant id: MID- prefix + 6-12 alphanumerics
  merchantId: z
    .string()
    .trim()
    .regex(/^MID-[A-Z0-9]{6,12}$/i, "Format: MID-XXXXXX (6–12 letters/digits)"),
  // WhatsApp / phone: E.164-ish, allow spaces, 8–15 digits total
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{8,20}$/, "Enter a valid phone number, e.g. +966 5x xxx xxxx")
    .refine((v) => v.replace(/\D/g, "").length >= 8 && v.replace(/\D/g, "").length <= 15, {
      message: "Phone must contain 8–15 digits",
    }),
  // Google Drive account: email
  account: z.string().trim().email("Enter a valid email address").max(255),
  // Generic API key: 16–128 chars, no whitespace
  apiKey: z
    .string()
    .trim()
    .min(16, "API key must be at least 16 characters")
    .max(128, "API key is too long")
    .regex(/^\S+$/, "API key cannot contain whitespace"),
};

function validateIntegrationField(fieldId: string, value: string): string | null {
  const schema = INTEGRATION_FIELD_SCHEMAS[fieldId];
  if (!schema) return (value ?? "").trim().length > 0 ? null : "Required";
  const result = schema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? "Invalid value");
}
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useApp } from "@/lib/app-context";
import { useOrg } from "@/lib/org-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

// ---------------- Types & defaults ----------------

interface SettingsState {
  business: {
    name: string;
    legalName: string;
    crNumber: string;
    vatNumber: string;
    phone: string;
    email: string;
    address: string;
    website: string;
    logoUrl: string;
  };
  localization: {
    timezone: string;
    dateFormat: string;
    numberFormat: string;
  };
  appearance: {
    density: "comfortable" | "compact";
    sidebarCollapsed: boolean;
  };
  tax: {
    defaultRate: number;
    filingFrequency: "monthly" | "quarterly" | "yearly";
    inclusive: boolean;
  };
  invoicing: {
    prefix: string;
    nextNumber: number;
    paymentTermsDays: number;
    notes: string;
  };
  notifications: {
    lowStock: boolean;
    overdue: boolean;
    vatFiling: boolean;
    dailySummary: boolean;
    channels: { email: boolean; sms: boolean; push: boolean };
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
  backup: {
    auto: "daily" | "weekly" | "never";
  };
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "roleAdmin" | "roleAccountant" | "rolePharmacist" | "roleViewer";
  status: "active" | "invitePending";
  lastSignIn: string;
}

interface IntegrationField {
  id: string;
  labelKey: string;
  type?: "text" | "password";
  placeholder?: string;
}

interface IntegrationDef {
  id: string;
  titleKey: string;
  descKey: string;
  icon: typeof Plug;
  fields: IntegrationField[];
}

interface IntegrationConnection {
  connected: boolean;
  account?: string;
  connectedAt?: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  business: {
    name: "صيدلية الحياة",
    legalName: "Al-Hayat Pharmacy Co.",
    crNumber: "1010234567",
    vatNumber: "300123456700003",
    phone: "+966 11 234 5678",
    email: "info@alhayat-pharmacy.sa",
    address: "Riyadh, Olaya St. 47",
    website: "https://alhayat-pharmacy.sa",
    logoUrl: "",
  },
  localization: {
    timezone: "Asia/Riyadh",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1,234.56",
  },
  appearance: {
    density: "comfortable",
    sidebarCollapsed: false,
  },
  tax: {
    defaultRate: 15,
    filingFrequency: "quarterly",
    inclusive: true,
  },
  invoicing: {
    prefix: "INV-",
    nextNumber: 1042,
    paymentTermsDays: 30,
    notes: "شكراً لتعاملكم معنا. الدفع خلال 30 يوماً من تاريخ الفاتورة.",
  },
  notifications: {
    lowStock: true,
    overdue: true,
    vatFiling: true,
    dailySummary: false,
    channels: { email: true, sms: false, push: true },
  },
  security: {
    twoFactor: false,
    sessionTimeout: 60,
    loginAlerts: true,
  },
  backup: {
    auto: "daily",
  },
};

const INITIAL_USERS: UserRow[] = [
  { id: "u1", name: "خالد العتيبي", email: "khalid@alhayat-pharmacy.sa", role: "roleAdmin", status: "active", lastSignIn: "2026-05-13" },
  { id: "u2", name: "Sara Al-Qahtani", email: "sara@alhayat-pharmacy.sa", role: "roleAccountant", status: "active", lastSignIn: "2026-05-12" },
  { id: "u3", name: "د. محمد الحربي", email: "mohammed@alhayat-pharmacy.sa", role: "rolePharmacist", status: "active", lastSignIn: "2026-05-11" },
  { id: "u4", name: "Layla Mansour", email: "layla@alhayat-pharmacy.sa", role: "roleViewer", status: "invitePending", lastSignIn: "—" },
];

const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    id: "zatca",
    titleKey: "intZatca",
    descKey: "intZatcaDesc",
    icon: Receipt,
    fields: [
      { id: "vatNumber", labelKey: "vatNumber", placeholder: "300xxxxxxxxxxxx" },
      { id: "apiKey", labelKey: "apiKey", type: "password" },
    ],
  },
  {
    id: "mada",
    titleKey: "intMada",
    descKey: "intMadaDesc",
    icon: Smartphone,
    fields: [
      { id: "merchantId", labelKey: "merchantId", placeholder: "MID-XXXXXX" },
      { id: "apiKey", labelKey: "apiKey", type: "password" },
    ],
  },
  {
    id: "whatsapp",
    titleKey: "intWhatsapp",
    descKey: "intWhatsappDesc",
    icon: MessageSquare,
    fields: [
      { id: "phoneNumber", labelKey: "phoneNumber", placeholder: "+966 5x xxx xxxx" },
      { id: "apiKey", labelKey: "apiKey", type: "password" },
    ],
  },
  {
    id: "drive",
    titleKey: "intDrive",
    descKey: "intDriveDesc",
    icon: CloudUpload,
    fields: [
      { id: "account", labelKey: "account", placeholder: "you@gmail.com" },
    ],
  },
];

const DEFAULT_INTEGRATIONS: Record<string, IntegrationConnection> = {
  zatca: { connected: true, account: "300123456700003", connectedAt: "2026-03-12" },
  mada: { connected: false },
  whatsapp: { connected: false },
  drive: { connected: true, account: "backup@alhayat-pharmacy.sa", connectedAt: "2026-04-28" },
};

const STORAGE_PREFIX = "pl_settings";
const INTEGRATIONS_PREFIX = "pl_integrations";
const BRANCHES_PREFIX = "pl_branches";
const USERS_PREFIX = "pl_users";

const scopedKey = (prefix: string, orgId: string | null | undefined) =>
  `${prefix}.${orgId ?? "__none__"}`;

// ---------------- Page ----------------

type SectionId =
  | "business"
  | "branches"
  | "localization"
  | "appearance"
  | "tax"
  | "invoicing"
  | "notifications"
  | "users"
  | "integrations"
  | "security"
  | "backup";

interface BranchRow {
  id: string;
  name: string;
  code: string;
  manager: string;
  address: string;
  isMain: boolean;
}

const INITIAL_BRANCHES: BranchRow[] = [
  { id: "br-1", name: "Riyadh — King Fahd", code: "RUH-01", manager: "Mohammed Al-Salem", address: "King Fahd Rd, Riyadh", isMain: true },
  { id: "br-2", name: "Jeddah — Tahlia", code: "JED-01", manager: "Sara Al-Harbi", address: "Tahlia St, Jeddah", isMain: false },
  { id: "br-3", name: "Dammam — Corniche", code: "DMM-01", manager: "Khalid Al-Otaibi", address: "Corniche Rd, Dammam", isMain: false },
];

function SettingsPage() {
  const { t, lang, theme, toggleLang, toggleTheme, dir } = useApp();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const settingsKey = scopedKey(STORAGE_PREFIX, orgId);
  const integrationsKey = scopedKey(INTEGRATIONS_PREFIX, orgId);
  const branchesKey = scopedKey(BRANCHES_PREFIX, orgId);
  const usersKey = scopedKey(USERS_PREFIX, orgId);

  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<UserRow[]>(INITIAL_USERS);
  const [integrations, setIntegrations] =
    useState<Record<string, IntegrationConnection>>(DEFAULT_INTEGRATIONS);
  const [pendingIntegration, setPendingIntegration] = useState<
    { def: IntegrationDef; mode: "connect" | "disconnect" } | null
  >(null);
  const [activeSection, setActiveSection] = useState<SectionId>("business");
  const [branches, setBranches] = useState<BranchRow[]>(INITIAL_BRANCHES);
  const [newBranch, setNewBranch] = useState({ name: "", code: "", manager: "", address: "" });
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Hydrate per-organization from localStorage whenever the active org changes
  useEffect(() => {
    if (typeof localStorage === "undefined") {
      setHydratedFor(orgId);
      return;
    }
    const rawS = localStorage.getItem(settingsKey);
    if (rawS) {
      try {
        const parsed = JSON.parse(rawS) as SettingsState;
        setSettings(parsed);
        setSavedSettings(parsed);
      } catch {
        setSettings(DEFAULT_SETTINGS);
        setSavedSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
      setSavedSettings(DEFAULT_SETTINGS);
    }
    const rawInt = localStorage.getItem(integrationsKey);
    if (rawInt) {
      try {
        setIntegrations(JSON.parse(rawInt));
      } catch {
        setIntegrations(DEFAULT_INTEGRATIONS);
      }
    } else {
      setIntegrations(DEFAULT_INTEGRATIONS);
    }
    const rawBr = localStorage.getItem(branchesKey);
    if (rawBr) {
      try {
        const arr = JSON.parse(rawBr);
        setBranches(Array.isArray(arr) ? arr : INITIAL_BRANCHES);
      } catch {
        setBranches(INITIAL_BRANCHES);
      }
    } else {
      setBranches(INITIAL_BRANCHES);
    }
    const rawU = localStorage.getItem(usersKey);
    if (rawU) {
      try {
        const arr = JSON.parse(rawU);
        setUsers(Array.isArray(arr) ? arr : INITIAL_USERS);
      } catch {
        setUsers(INITIAL_USERS);
      }
    } else {
      setUsers(INITIAL_USERS);
    }
    setHydratedFor(orgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Persist branches & users automatically (once hydrated for current org)
  useEffect(() => {
    if (hydratedFor !== orgId || typeof localStorage === "undefined") return;
    localStorage.setItem(branchesKey, JSON.stringify(branches));
  }, [branches, hydratedFor, orgId, branchesKey]);
  useEffect(() => {
    if (hydratedFor !== orgId || typeof localStorage === "undefined") return;
    localStorage.setItem(usersKey, JSON.stringify(users));
  }, [users, hydratedFor, orgId, usersKey]);

  const persistIntegrations = (next: Record<string, IntegrationConnection>) => {
    setIntegrations(next);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(integrationsKey, JSON.stringify(next));
    }
  };

  const handleConnectIntegration = (id: string, account: string) => {
    persistIntegrations({
      ...integrations,
      [id]: {
        connected: true,
        account,
        connectedAt: new Date().toISOString().slice(0, 10),
      },
    });
    setPendingIntegration(null);
    toast.success(t("intConnectedToast"));
  };

  const handleDisconnectIntegration = (id: string) => {
    persistIntegrations({ ...integrations, [id]: { connected: false } });
    setPendingIntegration(null);
    toast.success(t("intDisconnectedToast"));
  };

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  );

  const handleSave = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    }
    setSavedSettings(settings);
    toast.success(t("settingsSaved"));
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSavedSettings(DEFAULT_SETTINGS);
    if (typeof localStorage !== "undefined") localStorage.removeItem(settingsKey);
    toast.success(t("settingsReset"));
  };

  const update = <K extends keyof SettingsState>(
    key: K,
    patch: Partial<SettingsState[K]>,
  ) => {
    setSettings((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  };

  const sections: { id: SectionId; titleKey: string; descKey: string; icon: typeof Building2 }[] = [
    { id: "business", titleKey: "secBusiness", descKey: "secBusinessDesc", icon: Building2 },
    { id: "branches", titleKey: "secBranches", descKey: "secBranchesDesc", icon: Building2 },
    { id: "localization", titleKey: "secLocalization", descKey: "secLocalizationDesc", icon: Globe },
    { id: "appearance", titleKey: "secAppearance", descKey: "secAppearanceDesc", icon: Palette },
    { id: "tax", titleKey: "secTax", descKey: "secTaxDesc", icon: Calculator },
    { id: "invoicing", titleKey: "secInvoicing", descKey: "secInvoicingDesc", icon: Receipt },
    { id: "notifications", titleKey: "secNotifications", descKey: "secNotificationsDesc", icon: Bell },
    { id: "users", titleKey: "secUsers", descKey: "secUsersDesc", icon: Users },
    { id: "integrations", titleKey: "secIntegrations", descKey: "secIntegrationsDesc", icon: Plug },
    { id: "security", titleKey: "secSecurity", descKey: "secSecurityDesc", icon: ShieldCheck },
    { id: "backup", titleKey: "secBackup", descKey: "secBackupDesc", icon: Database },
  ];

  return (
    <div className="min-h-screen flex bg-background" dir={dir}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-4 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{t("settingsTitle")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("settingsSubtitle")}</p>
              {currentOrg && (
                <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary">
                  <Building2 className="size-3.5" />
                  <span className="font-medium">{currentOrg.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card/60 border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
              >
                <RotateCcw className="size-4" />
                {t("resetDefaults")}
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="size-4" />
                {t("saveChanges")}
              </button>
            </div>
          </div>

          {dirty && (
            <div className="glass-card rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 flex items-center gap-2 text-sm text-amber-200">
              <AlertTriangle className="size-4 shrink-0" />
              {t("unsavedChanges")}
            </div>
          )}

          <div className="grid lg:grid-cols-[260px_1fr] gap-6">
            {/* Section nav */}
            <nav className="glass-card rounded-2xl border border-border/60 p-2 h-fit lg:sticky lg:top-20">
              {sections.map((s) => {
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent",
                    )}
                  >
                    <s.icon className="size-4 shrink-0" />
                    <span className="truncate text-start">{t(s.titleKey as never)}</span>
                  </button>
                );
              })}
            </nav>

            {/* Section content */}
            <div className="space-y-6">
              {activeSection === "business" && (
                <SectionCard
                  icon={<Building2 className="size-5" />}
                  title={t("secBusiness")}
                  description={t("secBusinessDesc")}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={t("businessName")}>
                      <TextInput
                        value={settings.business.name}
                        onChange={(v) => update("business", { name: v })}
                      />
                    </Field>
                    <Field label={t("legalName")}>
                      <TextInput
                        value={settings.business.legalName}
                        onChange={(v) => update("business", { legalName: v })}
                      />
                    </Field>
                    <Field label={t("crNumber")}>
                      <TextInput
                        value={settings.business.crNumber}
                        onChange={(v) => update("business", { crNumber: v })}
                      />
                    </Field>
                    <Field label={t("vatNumber")}>
                      <TextInput
                        value={settings.business.vatNumber}
                        onChange={(v) => update("business", { vatNumber: v })}
                      />
                    </Field>
                    <Field label={t("phone")}>
                      <TextInput
                        value={settings.business.phone}
                        onChange={(v) => update("business", { phone: v })}
                      />
                    </Field>
                    <Field label={t("email")}>
                      <TextInput
                        type="email"
                        value={settings.business.email}
                        onChange={(v) => update("business", { email: v })}
                      />
                    </Field>
                    <Field label={t("address")} className="sm:col-span-2">
                      <TextInput
                        value={settings.business.address}
                        onChange={(v) => update("business", { address: v })}
                      />
                    </Field>
                    <Field label={t("website")}>
                      <TextInput
                        value={settings.business.website}
                        onChange={(v) => update("business", { website: v })}
                      />
                    </Field>
                    <Field label={t("logoUrl")}>
                      <TextInput
                        value={settings.business.logoUrl}
                        onChange={(v) => update("business", { logoUrl: v })}
                        placeholder="https://..."
                      />
                    </Field>
                  </div>

                  <div className="mt-5 flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20">
                    <div className="size-12 rounded-xl grid place-items-center bg-primary/15 border border-primary/30 text-primary overflow-hidden">
                      {settings.business.logoUrl ? (
                        <img
                          src={settings.business.logoUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Pill className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {settings.business.name || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {settings.business.legalName || "—"}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {activeSection === "branches" && (
                <SectionCard
                  icon={<Building2 className="size-5" />}
                  title={t("secBranches")}
                  description={t("secBranchesDesc")}
                >
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/40">
                      <input
                        value={newBranch.name}
                        onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                        placeholder={t("branchName")}
                        className="md:col-span-2 bg-card border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <input
                        value={newBranch.code}
                        onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })}
                        placeholder={t("branchCode")}
                        className="bg-card border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <input
                        value={newBranch.manager}
                        onChange={(e) => setNewBranch({ ...newBranch, manager: e.target.value })}
                        placeholder={t("branchManager")}
                        className="bg-card border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        onClick={() => {
                          if (!newBranch.name.trim() || !newBranch.code.trim()) {
                            toast.error(t("required"));
                            return;
                          }
                          setBranches((rows) => [
                            ...rows,
                            {
                              id: `br-${Date.now()}`,
                              name: newBranch.name.trim(),
                              code: newBranch.code.trim(),
                              manager: newBranch.manager.trim() || "—",
                              address: newBranch.address.trim() || "—",
                              isMain: false,
                            },
                          ]);
                          setNewBranch({ name: "", code: "", manager: "", address: "" });
                          toast.success(t("addedBranch"));
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                      >
                        <Building2 className="size-4" />
                        {t("newBranch")}
                      </button>
                    </div>

                    <div className="overflow-auto rounded-xl border border-border/60">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2.5 text-start font-medium">{t("branchName")}</th>
                            <th className="px-4 py-2.5 text-start font-medium">{t("branchCode")}</th>
                            <th className="px-4 py-2.5 text-start font-medium">{t("branchManager")}</th>
                            <th className="px-4 py-2.5 text-start font-medium">{t("branchAddress")}</th>
                            <th className="px-4 py-2.5 text-end font-medium">{t("status")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branches.map((b) => (
                            <tr key={b.id} className="border-t border-border/40">
                              <td className="px-4 py-2.5 font-medium">{b.name}</td>
                              <td className="px-4 py-2.5 text-muted-foreground tabular text-xs">{b.code}</td>
                              <td className="px-4 py-2.5">{b.manager}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{b.address}</td>
                              <td className="px-4 py-2.5 text-end">
                                <div className="inline-flex items-center gap-2 justify-end">
                                  {b.isMain ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">
                                      <Check className="size-3" />
                                      {t("mainBranch")}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setBranches((rows) =>
                                          rows.map((r) => ({ ...r, isMain: r.id === b.id })),
                                        )
                                      }
                                      className="px-2 py-1 rounded-md text-xs border border-border/60 hover:bg-accent transition-colors"
                                    >
                                      {t("setMain")}
                                    </button>
                                  )}
                                  {!b.isMain && (
                                    <button
                                      onClick={() => {
                                        setBranches((rows) => rows.filter((r) => r.id !== b.id));
                                        toast.success(t("removedBranch"));
                                      }}
                                      className="size-7 grid place-items-center rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                                      aria-label={t("remove")}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </SectionCard>
              )}

              {activeSection === "localization" && (
                <SectionCard
                  icon={<Globe className="size-5" />}
                  title={t("secLocalization")}
                  description={t("secLocalizationDesc")}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={t("language")}>
                      <button
                        onClick={toggleLang}
                        className="w-full h-10 px-3 rounded-lg bg-card/60 border border-border/60 text-sm flex items-center justify-between hover:bg-muted/40 transition-colors"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Languages className="size-4" />
                          {lang === "ar" ? t("arabic") : t("english")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {lang === "ar" ? "EN ↔" : "AR ↔"}
                        </span>
                      </button>
                    </Field>
                    <Field label={t("currency")}>
                      <SelectInput
                        value="SAR"
                        onChange={() => undefined}
                        options={[
                          { value: "SAR", label: "SAR — ر.س" },
                          { value: "USD", label: "USD — $" },
                          { value: "AED", label: "AED — د.إ" },
                          { value: "EUR", label: "EUR — €" },
                        ]}
                      />
                    </Field>
                    <Field label={t("timezone")}>
                      <SelectInput
                        value={settings.localization.timezone}
                        onChange={(v) => update("localization", { timezone: v })}
                        options={[
                          { value: "Asia/Riyadh", label: "Asia/Riyadh (GMT+3)" },
                          { value: "Asia/Dubai", label: "Asia/Dubai (GMT+4)" },
                          { value: "Africa/Cairo", label: "Africa/Cairo (GMT+2)" },
                          { value: "Europe/London", label: "Europe/London (GMT+0)" },
                        ]}
                      />
                    </Field>
                    <Field label={t("dateFormat")}>
                      <SelectInput
                        value={settings.localization.dateFormat}
                        onChange={(v) => update("localization", { dateFormat: v })}
                        options={[
                          { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                          { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                          { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                        ]}
                      />
                    </Field>
                    <Field label={t("numberFormat")}>
                      <SelectInput
                        value={settings.localization.numberFormat}
                        onChange={(v) => update("localization", { numberFormat: v })}
                        options={[
                          { value: "1,234.56", label: "1,234.56" },
                          { value: "1.234,56", label: "1.234,56" },
                          { value: "1 234.56", label: "1 234.56" },
                        ]}
                      />
                    </Field>
                  </div>
                </SectionCard>
              )}

              {activeSection === "appearance" && (
                <SectionCard
                  icon={<Palette className="size-5" />}
                  title={t("secAppearance")}
                  description={t("secAppearanceDesc")}
                >
                  <Field label={t("theme")}>
                    <div className="grid grid-cols-2 gap-2">
                      <ChoiceTile
                        active={theme === "dark"}
                        onClick={() => theme !== "dark" && toggleTheme()}
                        icon={<Moon className="size-4" />}
                        label={t("themeDark")}
                      />
                      <ChoiceTile
                        active={theme === "light"}
                        onClick={() => theme !== "light" && toggleTheme()}
                        icon={<Sun className="size-4" />}
                        label={t("themeLight")}
                      />
                    </div>
                  </Field>

                  <Field label={t("density")} className="mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <ChoiceTile
                        active={settings.appearance.density === "comfortable"}
                        onClick={() => update("appearance", { density: "comfortable" })}
                        label={t("comfortable")}
                      />
                      <ChoiceTile
                        active={settings.appearance.density === "compact"}
                        onClick={() => update("appearance", { density: "compact" })}
                        label={t("compact")}
                      />
                    </div>
                  </Field>

                  <ToggleRow
                    label={t("sidebarCollapsed")}
                    checked={settings.appearance.sidebarCollapsed}
                    onChange={(v) => update("appearance", { sidebarCollapsed: v })}
                  />
                </SectionCard>
              )}

              {activeSection === "tax" && (
                <SectionCard
                  icon={<Calculator className="size-5" />}
                  title={t("secTax")}
                  description={t("secTaxDesc")}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={t("defaultVatRate")}>
                      <NumberInput
                        value={settings.tax.defaultRate}
                        onChange={(v) => update("tax", { defaultRate: v })}
                        min={0}
                        max={100}
                        suffix="%"
                      />
                    </Field>
                    <Field label={t("filingFrequency")}>
                      <SelectInput
                        value={settings.tax.filingFrequency}
                        onChange={(v) =>
                          update("tax", {
                            filingFrequency: v as SettingsState["tax"]["filingFrequency"],
                          })
                        }
                        options={[
                          { value: "monthly", label: t("monthly") },
                          { value: "quarterly", label: t("quarterly") },
                          { value: "yearly", label: t("yearly") },
                        ]}
                      />
                    </Field>
                  </div>
                  <ToggleRow
                    label={t("taxInclusive")}
                    checked={settings.tax.inclusive}
                    onChange={(v) => update("tax", { inclusive: v })}
                  />
                </SectionCard>
              )}

              {activeSection === "invoicing" && (
                <SectionCard
                  icon={<Receipt className="size-5" />}
                  title={t("secInvoicing")}
                  description={t("secInvoicingDesc")}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={t("invoicePrefix")}>
                      <TextInput
                        value={settings.invoicing.prefix}
                        onChange={(v) => update("invoicing", { prefix: v })}
                      />
                    </Field>
                    <Field label={t("nextInvoiceNumber")}>
                      <NumberInput
                        value={settings.invoicing.nextNumber}
                        onChange={(v) => update("invoicing", { nextNumber: v })}
                        min={1}
                      />
                    </Field>
                    <Field label={t("paymentTermsDays")}>
                      <NumberInput
                        value={settings.invoicing.paymentTermsDays}
                        onChange={(v) => update("invoicing", { paymentTermsDays: v })}
                        min={0}
                        max={365}
                      />
                    </Field>
                    <Field label="Preview" className="sm:col-span-1">
                      <div className="h-10 px-3 rounded-lg bg-muted/30 border border-border/60 flex items-center text-sm tabular text-muted-foreground">
                        {settings.invoicing.prefix}
                        {String(settings.invoicing.nextNumber).padStart(5, "0")}
                      </div>
                    </Field>
                    <Field label={t("defaultNotes")} className="sm:col-span-2">
                      <textarea
                        value={settings.invoicing.notes}
                        onChange={(e) => update("invoicing", { notes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      />
                    </Field>
                  </div>
                </SectionCard>
              )}

              {activeSection === "notifications" && (
                <SectionCard
                  icon={<Bell className="size-5" />}
                  title={t("secNotifications")}
                  description={t("secNotificationsDesc")}
                >
                  <div className="space-y-1">
                    <ToggleRow
                      label={t("notifyLowStock")}
                      checked={settings.notifications.lowStock}
                      onChange={(v) => update("notifications", { lowStock: v })}
                    />
                    <ToggleRow
                      label={t("notifyOverdue")}
                      checked={settings.notifications.overdue}
                      onChange={(v) => update("notifications", { overdue: v })}
                    />
                    <ToggleRow
                      label={t("notifyVat")}
                      checked={settings.notifications.vatFiling}
                      onChange={(v) => update("notifications", { vatFiling: v })}
                    />
                    <ToggleRow
                      label={t("notifyDailySummary")}
                      checked={settings.notifications.dailySummary}
                      onChange={(v) => update("notifications", { dailySummary: v })}
                    />
                  </div>

                  <div className="mt-5 pt-5 border-t border-border/60">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                      Channels
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <ChannelTile
                        icon={<Mail className="size-4" />}
                        label={t("emailChannel")}
                        active={settings.notifications.channels.email}
                        onToggle={() =>
                          update("notifications", {
                            channels: {
                              ...settings.notifications.channels,
                              email: !settings.notifications.channels.email,
                            },
                          })
                        }
                      />
                      <ChannelTile
                        icon={<Smartphone className="size-4" />}
                        label={t("smsChannel")}
                        active={settings.notifications.channels.sms}
                        onToggle={() =>
                          update("notifications", {
                            channels: {
                              ...settings.notifications.channels,
                              sms: !settings.notifications.channels.sms,
                            },
                          })
                        }
                      />
                      <ChannelTile
                        icon={<Bell className="size-4" />}
                        label={t("pushChannel")}
                        active={settings.notifications.channels.push}
                        onToggle={() =>
                          update("notifications", {
                            channels: {
                              ...settings.notifications.channels,
                              push: !settings.notifications.channels.push,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </SectionCard>
              )}

              {activeSection === "users" && (
                <SectionCard
                  icon={<Users className="size-5" />}
                  title={t("secUsers")}
                  description={t("secUsersDesc")}
                  action={
                    <button
                      onClick={() => toast.info(t("inviteUser"))}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                    >
                      <UserPlus className="size-4" />
                      {t("inviteUser")}
                    </button>
                  }
                >
                  <div className="overflow-auto rounded-xl border border-border/60">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5 text-start font-medium">{t("userName")}</th>
                          <th className="px-4 py-2.5 text-start font-medium">{t("email")}</th>
                          <th className="px-4 py-2.5 text-start font-medium">{t("userRole")}</th>
                          <th className="px-4 py-2.5 text-start font-medium">{t("userStatus")}</th>
                          <th className="px-4 py-2.5 text-start font-medium">{t("lastSignIn")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-t border-border/40">
                            <td className="px-4 py-2.5 font-medium">{u.name}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                            <td className="px-4 py-2.5">
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  setUsers((rows) =>
                                    rows.map((r) =>
                                      r.id === u.id
                                        ? { ...r, role: e.target.value as UserRow["role"] }
                                        : r,
                                    ),
                                  )
                                }
                                className="bg-card/60 border border-border/60 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                              >
                                <option value="roleAdmin">{t("roleAdmin")}</option>
                                <option value="roleAccountant">{t("roleAccountant")}</option>
                                <option value="rolePharmacist">{t("rolePharmacist")}</option>
                                <option value="roleViewer">{t("roleViewer")}</option>
                              </select>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                                  u.status === "active"
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-300 border border-amber-500/30",
                                )}
                              >
                                <span className="size-1.5 rounded-full bg-current" />
                                {u.status === "active" ? t("active") : t("invitePending")}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground tabular text-xs">
                              {u.lastSignIn}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              )}

              {activeSection === "integrations" && (
                <SectionCard
                  icon={<Plug className="size-5" />}
                  title={t("secIntegrations")}
                  description={t("secIntegrationsDesc")}
                >
                  <div className="grid sm:grid-cols-2 gap-3">
                    {INTEGRATION_DEFS.map((def) => {
                      const conn = integrations[def.id] ?? { connected: false };
                      return (
                        <div
                          key={def.id}
                          className="rounded-xl border border-border/60 bg-card/40 p-4 flex items-start gap-3"
                        >
                          <div
                            className={cn(
                              "size-10 rounded-lg grid place-items-center shrink-0 border",
                              conn.connected
                                ? "bg-primary/15 text-primary border-primary/30"
                                : "bg-muted/30 text-muted-foreground border-border/60",
                            )}
                          >
                            <def.icon className="size-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-sm truncate">
                                {t(def.titleKey as never)}
                              </h4>
                              {conn.connected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  <Check className="size-2.5" />
                                  {t("connected")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border/60">
                                  {t("notConnected")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {t(def.descKey as never)}
                            </p>
                            {conn.connected && conn.account && (
                              <div className="mt-2 text-[11px] text-muted-foreground tabular truncate">
                                <span className="text-foreground font-medium">{conn.account}</span>
                                {conn.connectedAt && (
                                  <>
                                    {" · "}
                                    {t("connectedSince")} {conn.connectedAt}
                                  </>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() =>
                                setPendingIntegration({
                                  def,
                                  mode: conn.connected ? "disconnect" : "connect",
                                })
                              }
                              className={cn(
                                "mt-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                conn.connected
                                  ? "bg-muted/40 hover:bg-muted/60 text-muted-foreground border border-border/60"
                                  : "bg-primary text-primary-foreground hover:opacity-90",
                              )}
                            >
                              {conn.connected ? t("disconnect") : t("connect")}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              )}

              {activeSection === "security" && (
                <SectionCard
                  icon={<ShieldCheck className="size-5" />}
                  title={t("secSecurity")}
                  description={t("secSecurityDesc")}
                >
                  <ToggleRow
                    label={t("twoFactor")}
                    checked={settings.security.twoFactor}
                    onChange={(v) => update("security", { twoFactor: v })}
                  />
                  <ToggleRow
                    label={t("loginAlerts")}
                    checked={settings.security.loginAlerts}
                    onChange={(v) => update("security", { loginAlerts: v })}
                  />
                  <Field label={t("sessionTimeout")} className="mt-4 max-w-xs">
                    <NumberInput
                      value={settings.security.sessionTimeout}
                      onChange={(v) => update("security", { sessionTimeout: v })}
                      min={5}
                      max={480}
                    />
                  </Field>
                  <button
                    onClick={() => toast.info(t("changePassword"))}
                    className="mt-4 px-4 py-2 rounded-lg bg-card/60 border border-border/60 text-sm font-medium hover:bg-muted/40 transition-colors"
                  >
                    {t("changePassword")}
                  </button>
                </SectionCard>
              )}

              {activeSection === "backup" && (
                <SectionCard
                  icon={<Database className="size-5" />}
                  title={t("secBackup")}
                  description={t("secBackupDesc")}
                >
                  <Field label={t("autoBackup")} className="max-w-xs">
                    <SelectInput
                      value={settings.backup.auto}
                      onChange={(v) =>
                        update("backup", { auto: v as SettingsState["backup"]["auto"] })
                      }
                      options={[
                        { value: "daily", label: t("daily") },
                        { value: "weekly", label: t("weekly") },
                        { value: "never", label: t("never") },
                      ]}
                    />
                  </Field>

                  <div className="mt-5 grid sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => toast.success(t("exportAll"))}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card/60 border border-border/60 text-sm font-medium hover:bg-muted/40 transition-colors"
                    >
                      <Download className="size-4" />
                      {t("exportAll")}
                    </button>
                    <button
                      onClick={() => toast.info(t("importData"))}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card/60 border border-border/60 text-sm font-medium hover:bg-muted/40 transition-colors"
                    >
                      <Upload className="size-4" />
                      {t("importData")}
                    </button>
                  </div>

                  <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-destructive">
                          {t("clearData")}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">{t("clearDataWarn")}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (!orgId) return;
                          const msg = lang === "ar"
                            ? "سيتم حذف جميع المشتريات والإيرادات والمصروفات والديون وسندات السداد والأرصدة الافتتاحية لهذه المنظمة. لا يمكن التراجع. هل أنت متأكد؟"
                            : "All purchases, revenues, expenses, debts, supplier payments and opening balances for this organization will be deleted. This cannot be undone. Continue?";
                          if (!window.confirm(msg)) return;
                          const keys = [
                            `pharmledger.revenue.entries.v2.${orgId}`,
                            `pharmledger.expenses.v1.${orgId}`,
                            `pharmledger.purchases.v1.${orgId}`,
                            `pharmledger.debts.v1.${orgId}`,
                            `pharmledger.supplier-payments.v1.${orgId}`,
                            `pharmledger.openings.v1.${orgId}`,
                          ];
                          try {
                            for (const k of keys) localStorage.setItem(k, JSON.stringify([]));
                            window.dispatchEvent(new StorageEvent("storage", { key: keys[0] }));
                            toast.success(lang === "ar" ? "تم تصفير السيستم" : "System cleared");
                            setTimeout(() => window.location.reload(), 600);
                          } catch (e) {
                            console.error(e);
                            toast.error(lang === "ar" ? "تعذّر الحذف" : "Failed to clear");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 text-sm font-medium hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="size-4" />
                        {t("clearData")}
                      </button>
                    </div>
                  </div>
                </SectionCard>
              )}
            </div>
          </div>

          {pendingIntegration && (
            <IntegrationModal
              key={`${pendingIntegration.def.id}-${pendingIntegration.mode}`}
              def={pendingIntegration.def}
              mode={pendingIntegration.mode}
              currentAccount={integrations[pendingIntegration.def.id]?.account}
              onClose={() => setPendingIntegration(null)}
              onConfirmConnect={(account: string) =>
                handleConnectIntegration(pendingIntegration.def.id, account)
              }
              onConfirmDisconnect={() =>
                handleDisconnectIntegration(pendingIntegration.def.id)
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ---------------- Subcomponents ----------------

function SectionCard({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="glass-card rounded-2xl border border-border/60 p-5">
      <header className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl grid place-items-center bg-primary/15 text-primary border border-primary/30 shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-lg bg-card/60 border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary/50 transition"
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "w-full h-10 px-3 rounded-lg bg-card/60 border border-border/60 text-sm tabular focus:outline-none focus:ring-1 focus:ring-ring",
          suffix && "pe-9",
        )}
      />
      {suffix && (
        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 rounded-lg bg-card/60 border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 py-3 border-b border-border/40 last:border-0 text-start"
    >
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0",
          checked ? "bg-primary" : "bg-muted/60",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-background shadow transition-all",
            checked ? "start-[18px]" : "start-0.5",
          )}
        />
      </span>
    </button>
  );
}

function ChoiceTile({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 px-3 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors",
        active
          ? "bg-primary/15 text-primary border-primary/40"
          : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ChannelTile({
  icon,
  label,
  active,
  onToggle,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary border-primary/40"
          : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "size-7 rounded-md grid place-items-center",
          active ? "bg-primary/20" : "bg-muted/40",
        )}
      >
        {icon}
      </span>
      <span className="flex-1 text-start">{label}</span>
      {active && <Check className="size-4" />}
    </button>
  );
}

function IntegrationModal({
  def,
  mode,
  currentAccount,
  onClose,
  onConfirmConnect,
  onConfirmDisconnect,
}: {
  def: IntegrationDef;
  mode: "connect" | "disconnect";
  currentAccount?: string;
  onClose: () => void;
  onConfirmConnect: (account: string) => void;
  onConfirmDisconnect: () => void;
}) {
  const { t } = useApp();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);

  const fieldErrors = useMemo(
    () =>
      Object.fromEntries(
        def.fields.map((f) => [f.id, validateIntegrationField(f.id, values[f.id] ?? "")]),
      ) as Record<string, string | null>,
    [def.fields, values],
  );
  const isValid = def.fields.every((f) => fieldErrors[f.id] === null);

  const handleSubmit = () => {
    if (mode === "connect") {
      // Reveal validation errors on submit attempt
      setErrors(fieldErrors);
      if (!isValid) {
        toast.error(t("invalidInput") ?? "Please fix the highlighted fields");
        return;
      }
    }
    setSubmitting(true);
    // Simulate async authentication round-trip
    setTimeout(() => {
      if (mode === "connect") {
        const accountField =
          values.account ||
          values.phoneNumber ||
          values.merchantId ||
          values.vatNumber ||
          def.id;
        onConfirmConnect(accountField.trim());
      } else {
        onConfirmDisconnect();
      }
      setSubmitting(false);
    }, 900);
  };

  const isDisconnect = mode === "disconnect";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="glass-card rounded-2xl w-full max-w-md border border-border/60 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border/60">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "size-11 rounded-xl grid place-items-center shrink-0 border",
                isDisconnect
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : "bg-primary/15 text-primary border-primary/30",
              )}
            >
              <def.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {isDisconnect ? t("disconnectTitle") : t("connectTitle")}
              </div>
              <h3 className="text-base font-semibold truncate">
                {t(def.titleKey as never)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {t(def.descKey as never)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="size-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isDisconnect ? (
            <>
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5">
                <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/90">{t("disconnectWarn")}</p>
              </div>
              {currentAccount && (
                <div className="text-xs text-muted-foreground">
                  {t("account")}:{" "}
                  <span className="text-foreground font-medium tabular">
                    {currentAccount}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t("connectIntro")}</p>
              <div className="space-y-3">
                {def.fields.map((f) => {
                  const err = errors[f.id];
                  return (
                    <label key={f.id} className="block">
                      <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                        {t(f.labelKey as never)}{" "}
                        <span className="text-destructive/80">*</span>
                      </span>
                      <input
                        type={f.type ?? "text"}
                        value={values[f.id] ?? ""}
                        placeholder={f.placeholder}
                        aria-invalid={!!err}
                        onChange={(e) => {
                          const v = e.target.value;
                          setValues((s) => ({ ...s, [f.id]: v }));
                          // Clear error as the user types; re-validates on submit
                          if (errors[f.id]) {
                            setErrors((s) => ({ ...s, [f.id]: null }));
                          }
                        }}
                        onBlur={() =>
                          setErrors((s) => ({
                            ...s,
                            [f.id]: validateIntegrationField(f.id, values[f.id] ?? ""),
                          }))
                        }
                        className={cn(
                          "w-full h-10 px-3 rounded-lg bg-card/60 border text-sm focus:outline-none focus:ring-1 transition",
                          err
                            ? "border-destructive/60 focus:ring-destructive/40"
                            : "border-border/60 focus:ring-ring focus:border-primary/50",
                        )}
                      />
                      {err && (
                        <span className="block text-[11px] text-destructive mt-1">{err}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-card/40">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-40"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!isDisconnect && !isValid)}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
              isDisconnect
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : "bg-primary text-primary-foreground hover:opacity-90",
            )}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting
              ? isDisconnect
                ? t("disconnecting")
                : t("connecting")
              : isDisconnect
                ? t("confirmDisconnect")
                : t("confirmConnect")}
          </button>
        </div>
      </div>
    </div>
  );
}
