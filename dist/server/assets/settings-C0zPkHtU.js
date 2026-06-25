import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { Building2, RotateCcw, Save, AlertTriangle, Globe, Palette, Calculator, Receipt, Bell, Users, Plug, ShieldCheck, Database, Pill, Check, Trash2, Languages, Moon, Sun, Mail, Smartphone, UserPlus, MessageSquare, CloudUpload, Download, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { w as useApp, y as useOrg, g as cn } from "./router-CH3R9Cfm.js";
import "@tanstack/react-router";
import "./client-bowce4Dj.js";
import "@supabase/supabase-js";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "class-variance-authority";
import "@radix-ui/react-select";
import "@tanstack/react-query";
import "date-fns";
import "date-fns/locale/ar";
import "clsx";
import "tailwind-merge";
import "react-day-picker";
import "@radix-ui/react-slot";
import "@radix-ui/react-popover";
import "react-dom";
const INTEGRATION_FIELD_SCHEMAS = {
  // ZATCA VAT number: Saudi 15-digit, starts with 3, ends with 3
  vatNumber: z.string().trim().regex(/^3\d{13}3$/, "Must be a 15-digit VAT number starting and ending with 3"),
  // Mada merchant id: MID- prefix + 6-12 alphanumerics
  merchantId: z.string().trim().regex(/^MID-[A-Z0-9]{6,12}$/i, "Format: MID-XXXXXX (6–12 letters/digits)"),
  // WhatsApp / phone: E.164-ish, allow spaces, 8–15 digits total
  phoneNumber: z.string().trim().regex(/^\+?[0-9\s-]{8,20}$/, "Enter a valid phone number, e.g. +966 5x xxx xxxx").refine((v) => v.replace(/\D/g, "").length >= 8 && v.replace(/\D/g, "").length <= 15, {
    message: "Phone must contain 8–15 digits"
  }),
  // Google Drive account: email
  account: z.string().trim().email("Enter a valid email address").max(255),
  // Generic API key: 16–128 chars, no whitespace
  apiKey: z.string().trim().min(16, "API key must be at least 16 characters").max(128, "API key is too long").regex(/^\S+$/, "API key cannot contain whitespace")
};
function validateIntegrationField(fieldId, value) {
  const schema = INTEGRATION_FIELD_SCHEMAS[fieldId];
  if (!schema) return (value ?? "").trim().length > 0 ? null : "Required";
  const result = schema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message ?? "Invalid value";
}
const DEFAULT_SETTINGS = {
  business: {
    name: "صيدلية الحياة",
    legalName: "Al-Hayat Pharmacy Co.",
    crNumber: "1010234567",
    vatNumber: "300123456700003",
    phone: "+966 11 234 5678",
    email: "info@alhayat-pharmacy.sa",
    address: "Riyadh, Olaya St. 47",
    website: "https://alhayat-pharmacy.sa",
    logoUrl: ""
  },
  localization: {
    timezone: "Asia/Riyadh",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1,234.56"
  },
  appearance: {
    density: "comfortable",
    sidebarCollapsed: false
  },
  tax: {
    defaultRate: 15,
    filingFrequency: "quarterly",
    inclusive: true
  },
  invoicing: {
    prefix: "INV-",
    nextNumber: 1042,
    paymentTermsDays: 30,
    notes: "شكراً لتعاملكم معنا. الدفع خلال 30 يوماً من تاريخ الفاتورة."
  },
  notifications: {
    lowStock: true,
    overdue: true,
    vatFiling: true,
    dailySummary: false,
    channels: {
      email: true,
      sms: false,
      push: true
    }
  },
  security: {
    twoFactor: false,
    sessionTimeout: 60,
    loginAlerts: true
  },
  backup: {
    auto: "daily"
  }
};
const INITIAL_USERS = [{
  id: "u1",
  name: "خالد العتيبي",
  email: "khalid@alhayat-pharmacy.sa",
  role: "roleAdmin",
  status: "active",
  lastSignIn: "2026-05-13"
}, {
  id: "u2",
  name: "Sara Al-Qahtani",
  email: "sara@alhayat-pharmacy.sa",
  role: "roleAccountant",
  status: "active",
  lastSignIn: "2026-05-12"
}, {
  id: "u3",
  name: "د. محمد الحربي",
  email: "mohammed@alhayat-pharmacy.sa",
  role: "rolePharmacist",
  status: "active",
  lastSignIn: "2026-05-11"
}, {
  id: "u4",
  name: "Layla Mansour",
  email: "layla@alhayat-pharmacy.sa",
  role: "roleViewer",
  status: "invitePending",
  lastSignIn: "—"
}];
const INTEGRATION_DEFS = [{
  id: "zatca",
  titleKey: "intZatca",
  descKey: "intZatcaDesc",
  icon: Receipt,
  fields: [{
    id: "vatNumber",
    labelKey: "vatNumber",
    placeholder: "300xxxxxxxxxxxx"
  }, {
    id: "apiKey",
    labelKey: "apiKey",
    type: "password"
  }]
}, {
  id: "mada",
  titleKey: "intMada",
  descKey: "intMadaDesc",
  icon: Smartphone,
  fields: [{
    id: "merchantId",
    labelKey: "merchantId",
    placeholder: "MID-XXXXXX"
  }, {
    id: "apiKey",
    labelKey: "apiKey",
    type: "password"
  }]
}, {
  id: "whatsapp",
  titleKey: "intWhatsapp",
  descKey: "intWhatsappDesc",
  icon: MessageSquare,
  fields: [{
    id: "phoneNumber",
    labelKey: "phoneNumber",
    placeholder: "+966 5x xxx xxxx"
  }, {
    id: "apiKey",
    labelKey: "apiKey",
    type: "password"
  }]
}, {
  id: "drive",
  titleKey: "intDrive",
  descKey: "intDriveDesc",
  icon: CloudUpload,
  fields: [{
    id: "account",
    labelKey: "account",
    placeholder: "you@gmail.com"
  }]
}];
const DEFAULT_INTEGRATIONS = {
  zatca: {
    connected: true,
    account: "300123456700003",
    connectedAt: "2026-03-12"
  },
  mada: {
    connected: false
  },
  whatsapp: {
    connected: false
  },
  drive: {
    connected: true,
    account: "backup@alhayat-pharmacy.sa",
    connectedAt: "2026-04-28"
  }
};
const STORAGE_PREFIX = "pl_settings";
const INTEGRATIONS_PREFIX = "pl_integrations";
const BRANCHES_PREFIX = "pl_branches";
const USERS_PREFIX = "pl_users";
const scopedKey = (prefix, orgId) => `${prefix}.${orgId ?? "__none__"}`;
const INITIAL_BRANCHES = [{
  id: "br-1",
  name: "Riyadh — King Fahd",
  code: "RUH-01",
  manager: "Mohammed Al-Salem",
  address: "King Fahd Rd, Riyadh",
  isMain: true
}, {
  id: "br-2",
  name: "Jeddah — Tahlia",
  code: "JED-01",
  manager: "Sara Al-Harbi",
  address: "Tahlia St, Jeddah",
  isMain: false
}, {
  id: "br-3",
  name: "Dammam — Corniche",
  code: "DMM-01",
  manager: "Khalid Al-Otaibi",
  address: "Corniche Rd, Dammam",
  isMain: false
}];
function SettingsPage() {
  const {
    t,
    lang,
    theme,
    toggleLang,
    toggleTheme,
    dir
  } = useApp();
  const {
    currentOrg
  } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const settingsKey = scopedKey(STORAGE_PREFIX, orgId);
  const integrationsKey = scopedKey(INTEGRATIONS_PREFIX, orgId);
  const branchesKey = scopedKey(BRANCHES_PREFIX, orgId);
  const usersKey = scopedKey(USERS_PREFIX, orgId);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [pendingIntegration, setPendingIntegration] = useState(null);
  const [activeSection, setActiveSection] = useState("business");
  const [branches, setBranches] = useState(INITIAL_BRANCHES);
  const [newBranch, setNewBranch] = useState({
    name: "",
    code: "",
    manager: "",
    address: ""
  });
  const [hydratedFor, setHydratedFor] = useState(null);
  useEffect(() => {
    if (typeof localStorage === "undefined") {
      setHydratedFor(orgId);
      return;
    }
    const rawS = localStorage.getItem(settingsKey);
    if (rawS) {
      try {
        const parsed = JSON.parse(rawS);
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
  }, [orgId]);
  useEffect(() => {
    if (hydratedFor !== orgId || typeof localStorage === "undefined") return;
    localStorage.setItem(branchesKey, JSON.stringify(branches));
  }, [branches, hydratedFor, orgId, branchesKey]);
  useEffect(() => {
    if (hydratedFor !== orgId || typeof localStorage === "undefined") return;
    localStorage.setItem(usersKey, JSON.stringify(users));
  }, [users, hydratedFor, orgId, usersKey]);
  const persistIntegrations = (next) => {
    setIntegrations(next);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(integrationsKey, JSON.stringify(next));
    }
  };
  const handleConnectIntegration = (id, account) => {
    persistIntegrations({
      ...integrations,
      [id]: {
        connected: true,
        account,
        connectedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      }
    });
    setPendingIntegration(null);
    toast.success(t("intConnectedToast"));
  };
  const handleDisconnectIntegration = (id) => {
    persistIntegrations({
      ...integrations,
      [id]: {
        connected: false
      }
    });
    setPendingIntegration(null);
    toast.success(t("intDisconnectedToast"));
  };
  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);
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
  const update = (key, patch) => {
    setSettings((s) => ({
      ...s,
      [key]: {
        ...s[key],
        ...patch
      }
    }));
  };
  const sections = [{
    id: "business",
    titleKey: "secBusiness",
    descKey: "secBusinessDesc",
    icon: Building2
  }, {
    id: "branches",
    titleKey: "secBranches",
    descKey: "secBranchesDesc",
    icon: Building2
  }, {
    id: "localization",
    titleKey: "secLocalization",
    descKey: "secLocalizationDesc",
    icon: Globe
  }, {
    id: "appearance",
    titleKey: "secAppearance",
    descKey: "secAppearanceDesc",
    icon: Palette
  }, {
    id: "tax",
    titleKey: "secTax",
    descKey: "secTaxDesc",
    icon: Calculator
  }, {
    id: "invoicing",
    titleKey: "secInvoicing",
    descKey: "secInvoicingDesc",
    icon: Receipt
  }, {
    id: "notifications",
    titleKey: "secNotifications",
    descKey: "secNotificationsDesc",
    icon: Bell
  }, {
    id: "users",
    titleKey: "secUsers",
    descKey: "secUsersDesc",
    icon: Users
  }, {
    id: "integrations",
    titleKey: "secIntegrations",
    descKey: "secIntegrationsDesc",
    icon: Plug
  }, {
    id: "security",
    titleKey: "secSecurity",
    descKey: "secSecurityDesc",
    icon: ShieldCheck
  }, {
    id: "backup",
    titleKey: "secBackup",
    descKey: "secBackupDesc",
    icon: Database
  }];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex bg-background", dir, children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 px-4 lg:px-8 py-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: t("settingsTitle") }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("settingsSubtitle") }),
            currentOrg && /* @__PURE__ */ jsxs("div", { className: "mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary", children: [
              /* @__PURE__ */ jsx(Building2, { className: "size-3.5" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: currentOrg.name })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("button", { onClick: handleReset, className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card/60 border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all", children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "size-4" }),
              t("resetDefaults")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: handleSave, disabled: !dirty, className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed", children: [
              /* @__PURE__ */ jsx(Save, { className: "size-4" }),
              t("saveChanges")
            ] })
          ] })
        ] }),
        dirty && /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 flex items-center gap-2 text-sm text-amber-200", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "size-4 shrink-0" }),
          t("unsavedChanges")
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-[260px_1fr] gap-6", children: [
          /* @__PURE__ */ jsx("nav", { className: "glass-card rounded-2xl border border-border/60 p-2 h-fit lg:sticky lg:top-20", children: sections.map((s) => {
            const active = activeSection === s.id;
            return /* @__PURE__ */ jsxs("button", { onClick: () => setActiveSection(s.id), className: cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", active ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"), children: [
              /* @__PURE__ */ jsx(s.icon, { className: "size-4 shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "truncate text-start", children: t(s.titleKey) })
            ] }, s.id);
          }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            activeSection === "business" && /* @__PURE__ */ jsxs(SectionCard, { icon: /* @__PURE__ */ jsx(Building2, { className: "size-5" }), title: t("secBusiness"), description: t("secBusinessDesc"), children: [
              /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsx(Field, { label: t("businessName"), children: /* @__PURE__ */ jsx(TextInput, { value: settings.business.name, onChange: (v) => update("business", {
                  name: v
                }) }) }),
                /* @__PURE__ */ jsx(Field, { label: t("legalName"), children: /* @__PURE__ */ jsx(TextInput, { value: settings.business.legalName, onChange: (v) => update("business", {
                  legalName: v
                }) }) }),
                /* @__PURE__ */ jsx(Field, { label: t("crNumber"), children: /* @__PURE__ */ jsx(TextInput, { value: settings.business.crNumber, onChange: (v) => update("business", {
                  crNumber: v
                }) }) }),
                /* @__PURE__ */ jsx(Field, { label: t("vatNumber"), children: /* @__PURE__ */ jsx(TextInput, { value: settings.business.vatNumber, onChange: (v) => update("business", {
                  vatNumber: v
                }) }) }),
                /* @__PURE__ */ jsx(Field, { label: t("phone"), children: /* @__PURE__ */ jsx(TextInput, { value: settings.business.phone, onChange: (v) => update("business", {
                  phone: v
                }) }) }),
                /* @__PURE__ */ jsx(Field, { label: t("email"), children: /* @__PURE__ */ jsx(TextInput, { type: "email", value: settings.business.email, onChange: (v) => update("business", {
                  email: v
                }) }) }),
                /* @__PURE__ */ jsx(Field, { label: t("address"), className: "sm:col-span-2", children: /* @__PURE__ */ jsx(TextInput, { value: settings.business.address, onChange: (v) => update("business", {
                  address: v
                }) }) }),
                /* @__PURE__ */ jsx(Field, { label: t("website"), children: /* @__PURE__ */ jsx(TextInput, { value: settings.business.website, onChange: (v) => update("business", {
                  website: v
                }) }) }),
                /* @__PURE__ */ jsx(Field, { label: t("logoUrl"), children: /* @__PURE__ */ jsx(TextInput, { value: settings.business.logoUrl, onChange: (v) => update("business", {
                  logoUrl: v
                }), placeholder: "https://..." }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-5 flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20", children: [
                /* @__PURE__ */ jsx("div", { className: "size-12 rounded-xl grid place-items-center bg-primary/15 border border-primary/30 text-primary overflow-hidden", children: settings.business.logoUrl ? /* @__PURE__ */ jsx("img", { src: settings.business.logoUrl, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Pill, { className: "size-5" }) }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold truncate", children: settings.business.name || "—" }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: settings.business.legalName || "—" })
                ] })
              ] })
            ] }),
            activeSection === "branches" && /* @__PURE__ */ jsx(SectionCard, { icon: /* @__PURE__ */ jsx(Building2, { className: "size-5" }), title: t("secBranches"), description: t("secBranchesDesc"), children: /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/40", children: [
                /* @__PURE__ */ jsx("input", { value: newBranch.name, onChange: (e) => setNewBranch({
                  ...newBranch,
                  name: e.target.value
                }), placeholder: t("branchName"), className: "md:col-span-2 bg-card border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" }),
                /* @__PURE__ */ jsx("input", { value: newBranch.code, onChange: (e) => setNewBranch({
                  ...newBranch,
                  code: e.target.value.toUpperCase()
                }), placeholder: t("branchCode"), className: "bg-card border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" }),
                /* @__PURE__ */ jsx("input", { value: newBranch.manager, onChange: (e) => setNewBranch({
                  ...newBranch,
                  manager: e.target.value
                }), placeholder: t("branchManager"), className: "bg-card border border-border/60 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" }),
                /* @__PURE__ */ jsxs("button", { onClick: () => {
                  if (!newBranch.name.trim() || !newBranch.code.trim()) {
                    toast.error(t("required"));
                    return;
                  }
                  setBranches((rows) => [...rows, {
                    id: `br-${Date.now()}`,
                    name: newBranch.name.trim(),
                    code: newBranch.code.trim(),
                    manager: newBranch.manager.trim() || "—",
                    address: newBranch.address.trim() || "—",
                    isMain: false
                  }]);
                  setNewBranch({
                    name: "",
                    code: "",
                    manager: "",
                    address: ""
                  });
                  toast.success(t("addedBranch"));
                }, className: "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all", children: [
                  /* @__PURE__ */ jsx(Building2, { className: "size-4" }),
                  t("newBranch")
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "overflow-auto rounded-xl border border-border/60", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-start font-medium", children: t("branchName") }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-start font-medium", children: t("branchCode") }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-start font-medium", children: t("branchManager") }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-start font-medium", children: t("branchAddress") }),
                  /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-end font-medium", children: t("status") })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { children: branches.map((b) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border/40", children: [
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 font-medium", children: b.name }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-muted-foreground tabular text-xs", children: b.code }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5", children: b.manager }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-muted-foreground", children: b.address }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-end", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 justify-end", children: [
                    b.isMain ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30", children: [
                      /* @__PURE__ */ jsx(Check, { className: "size-3" }),
                      t("mainBranch")
                    ] }) : /* @__PURE__ */ jsx("button", { onClick: () => setBranches((rows) => rows.map((r) => ({
                      ...r,
                      isMain: r.id === b.id
                    }))), className: "px-2 py-1 rounded-md text-xs border border-border/60 hover:bg-accent transition-colors", children: t("setMain") }),
                    !b.isMain && /* @__PURE__ */ jsx("button", { onClick: () => {
                      setBranches((rows) => rows.filter((r) => r.id !== b.id));
                      toast.success(t("removedBranch"));
                    }, className: "size-7 grid place-items-center rounded-md text-destructive hover:bg-destructive/10 transition-colors", "aria-label": t("remove"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }) })
                  ] }) })
                ] }, b.id)) })
              ] }) })
            ] }) }),
            activeSection === "localization" && /* @__PURE__ */ jsx(SectionCard, { icon: /* @__PURE__ */ jsx(Globe, { className: "size-5" }), title: t("secLocalization"), description: t("secLocalizationDesc"), children: /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsx(Field, { label: t("language"), children: /* @__PURE__ */ jsxs("button", { onClick: toggleLang, className: "w-full h-10 px-3 rounded-lg bg-card/60 border border-border/60 text-sm flex items-center justify-between hover:bg-muted/40 transition-colors", children: [
                /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Languages, { className: "size-4" }),
                  lang === "ar" ? t("arabic") : t("english")
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: lang === "ar" ? "EN ↔" : "AR ↔" })
              ] }) }),
              /* @__PURE__ */ jsx(Field, { label: t("currency"), children: /* @__PURE__ */ jsx(SelectInput, { value: "SAR", onChange: () => void 0, options: [{
                value: "SAR",
                label: "SAR — ر.س"
              }, {
                value: "USD",
                label: "USD — $"
              }, {
                value: "AED",
                label: "AED — د.إ"
              }, {
                value: "EUR",
                label: "EUR — €"
              }] }) }),
              /* @__PURE__ */ jsx(Field, { label: t("timezone"), children: /* @__PURE__ */ jsx(SelectInput, { value: settings.localization.timezone, onChange: (v) => update("localization", {
                timezone: v
              }), options: [{
                value: "Asia/Riyadh",
                label: "Asia/Riyadh (GMT+3)"
              }, {
                value: "Asia/Dubai",
                label: "Asia/Dubai (GMT+4)"
              }, {
                value: "Africa/Cairo",
                label: "Africa/Cairo (GMT+2)"
              }, {
                value: "Europe/London",
                label: "Europe/London (GMT+0)"
              }] }) }),
              /* @__PURE__ */ jsx(Field, { label: t("dateFormat"), children: /* @__PURE__ */ jsx(SelectInput, { value: settings.localization.dateFormat, onChange: (v) => update("localization", {
                dateFormat: v
              }), options: [{
                value: "DD/MM/YYYY",
                label: "DD/MM/YYYY"
              }, {
                value: "MM/DD/YYYY",
                label: "MM/DD/YYYY"
              }, {
                value: "YYYY-MM-DD",
                label: "YYYY-MM-DD"
              }] }) }),
              /* @__PURE__ */ jsx(Field, { label: t("numberFormat"), children: /* @__PURE__ */ jsx(SelectInput, { value: settings.localization.numberFormat, onChange: (v) => update("localization", {
                numberFormat: v
              }), options: [{
                value: "1,234.56",
                label: "1,234.56"
              }, {
                value: "1.234,56",
                label: "1.234,56"
              }, {
                value: "1 234.56",
                label: "1 234.56"
              }] }) })
            ] }) }),
            activeSection === "appearance" && /* @__PURE__ */ jsxs(SectionCard, { icon: /* @__PURE__ */ jsx(Palette, { className: "size-5" }), title: t("secAppearance"), description: t("secAppearanceDesc"), children: [
              /* @__PURE__ */ jsx(Field, { label: t("theme"), children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsx(ChoiceTile, { active: theme === "dark", onClick: () => theme !== "dark" && toggleTheme(), icon: /* @__PURE__ */ jsx(Moon, { className: "size-4" }), label: t("themeDark") }),
                /* @__PURE__ */ jsx(ChoiceTile, { active: theme === "light", onClick: () => theme !== "light" && toggleTheme(), icon: /* @__PURE__ */ jsx(Sun, { className: "size-4" }), label: t("themeLight") })
              ] }) }),
              /* @__PURE__ */ jsx(Field, { label: t("density"), className: "mt-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsx(ChoiceTile, { active: settings.appearance.density === "comfortable", onClick: () => update("appearance", {
                  density: "comfortable"
                }), label: t("comfortable") }),
                /* @__PURE__ */ jsx(ChoiceTile, { active: settings.appearance.density === "compact", onClick: () => update("appearance", {
                  density: "compact"
                }), label: t("compact") })
              ] }) }),
              /* @__PURE__ */ jsx(ToggleRow, { label: t("sidebarCollapsed"), checked: settings.appearance.sidebarCollapsed, onChange: (v) => update("appearance", {
                sidebarCollapsed: v
              }) })
            ] }),
            activeSection === "tax" && /* @__PURE__ */ jsxs(SectionCard, { icon: /* @__PURE__ */ jsx(Calculator, { className: "size-5" }), title: t("secTax"), description: t("secTaxDesc"), children: [
              /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsx(Field, { label: t("defaultVatRate"), children: /* @__PURE__ */ jsx(NumberInput, { value: settings.tax.defaultRate, onChange: (v) => update("tax", {
                  defaultRate: v
                }), min: 0, max: 100, suffix: "%" }) }),
                /* @__PURE__ */ jsx(Field, { label: t("filingFrequency"), children: /* @__PURE__ */ jsx(SelectInput, { value: settings.tax.filingFrequency, onChange: (v) => update("tax", {
                  filingFrequency: v
                }), options: [{
                  value: "monthly",
                  label: t("monthly")
                }, {
                  value: "quarterly",
                  label: t("quarterly")
                }, {
                  value: "yearly",
                  label: t("yearly")
                }] }) })
              ] }),
              /* @__PURE__ */ jsx(ToggleRow, { label: t("taxInclusive"), checked: settings.tax.inclusive, onChange: (v) => update("tax", {
                inclusive: v
              }) })
            ] }),
            activeSection === "invoicing" && /* @__PURE__ */ jsx(SectionCard, { icon: /* @__PURE__ */ jsx(Receipt, { className: "size-5" }), title: t("secInvoicing"), description: t("secInvoicingDesc"), children: /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsx(Field, { label: t("invoicePrefix"), children: /* @__PURE__ */ jsx(TextInput, { value: settings.invoicing.prefix, onChange: (v) => update("invoicing", {
                prefix: v
              }) }) }),
              /* @__PURE__ */ jsx(Field, { label: t("nextInvoiceNumber"), children: /* @__PURE__ */ jsx(NumberInput, { value: settings.invoicing.nextNumber, onChange: (v) => update("invoicing", {
                nextNumber: v
              }), min: 1 }) }),
              /* @__PURE__ */ jsx(Field, { label: t("paymentTermsDays"), children: /* @__PURE__ */ jsx(NumberInput, { value: settings.invoicing.paymentTermsDays, onChange: (v) => update("invoicing", {
                paymentTermsDays: v
              }), min: 0, max: 365 }) }),
              /* @__PURE__ */ jsx(Field, { label: "Preview", className: "sm:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "h-10 px-3 rounded-lg bg-muted/30 border border-border/60 flex items-center text-sm tabular text-muted-foreground", children: [
                settings.invoicing.prefix,
                String(settings.invoicing.nextNumber).padStart(5, "0")
              ] }) }),
              /* @__PURE__ */ jsx(Field, { label: t("defaultNotes"), className: "sm:col-span-2", children: /* @__PURE__ */ jsx("textarea", { value: settings.invoicing.notes, onChange: (e) => update("invoicing", {
                notes: e.target.value
              }), rows: 3, className: "w-full px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" }) })
            ] }) }),
            activeSection === "notifications" && /* @__PURE__ */ jsxs(SectionCard, { icon: /* @__PURE__ */ jsx(Bell, { className: "size-5" }), title: t("secNotifications"), description: t("secNotificationsDesc"), children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx(ToggleRow, { label: t("notifyLowStock"), checked: settings.notifications.lowStock, onChange: (v) => update("notifications", {
                  lowStock: v
                }) }),
                /* @__PURE__ */ jsx(ToggleRow, { label: t("notifyOverdue"), checked: settings.notifications.overdue, onChange: (v) => update("notifications", {
                  overdue: v
                }) }),
                /* @__PURE__ */ jsx(ToggleRow, { label: t("notifyVat"), checked: settings.notifications.vatFiling, onChange: (v) => update("notifications", {
                  vatFiling: v
                }) }),
                /* @__PURE__ */ jsx(ToggleRow, { label: t("notifyDailySummary"), checked: settings.notifications.dailySummary, onChange: (v) => update("notifications", {
                  dailySummary: v
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-5 pt-5 border-t border-border/60", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground mb-3", children: "Channels" }),
                /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-2", children: [
                  /* @__PURE__ */ jsx(ChannelTile, { icon: /* @__PURE__ */ jsx(Mail, { className: "size-4" }), label: t("emailChannel"), active: settings.notifications.channels.email, onToggle: () => update("notifications", {
                    channels: {
                      ...settings.notifications.channels,
                      email: !settings.notifications.channels.email
                    }
                  }) }),
                  /* @__PURE__ */ jsx(ChannelTile, { icon: /* @__PURE__ */ jsx(Smartphone, { className: "size-4" }), label: t("smsChannel"), active: settings.notifications.channels.sms, onToggle: () => update("notifications", {
                    channels: {
                      ...settings.notifications.channels,
                      sms: !settings.notifications.channels.sms
                    }
                  }) }),
                  /* @__PURE__ */ jsx(ChannelTile, { icon: /* @__PURE__ */ jsx(Bell, { className: "size-4" }), label: t("pushChannel"), active: settings.notifications.channels.push, onToggle: () => update("notifications", {
                    channels: {
                      ...settings.notifications.channels,
                      push: !settings.notifications.channels.push
                    }
                  }) })
                ] })
              ] })
            ] }),
            activeSection === "users" && /* @__PURE__ */ jsx(SectionCard, { icon: /* @__PURE__ */ jsx(Users, { className: "size-5" }), title: t("secUsers"), description: t("secUsersDesc"), action: /* @__PURE__ */ jsxs("button", { onClick: () => toast.info(t("inviteUser")), className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all", children: [
              /* @__PURE__ */ jsx(UserPlus, { className: "size-4" }),
              t("inviteUser")
            ] }), children: /* @__PURE__ */ jsx("div", { className: "overflow-auto rounded-xl border border-border/60", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-start font-medium", children: t("userName") }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-start font-medium", children: t("email") }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-start font-medium", children: t("userRole") }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-start font-medium", children: t("userStatus") }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-start font-medium", children: t("lastSignIn") })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: users.map((u) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border/40", children: [
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 font-medium", children: u.name }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-muted-foreground", children: u.email }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5", children: /* @__PURE__ */ jsxs("select", { value: u.role, onChange: (e) => setUsers((rows) => rows.map((r) => r.id === u.id ? {
                  ...r,
                  role: e.target.value
                } : r)), className: "bg-card/60 border border-border/60 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring", children: [
                  /* @__PURE__ */ jsx("option", { value: "roleAdmin", children: t("roleAdmin") }),
                  /* @__PURE__ */ jsx("option", { value: "roleAccountant", children: t("roleAccountant") }),
                  /* @__PURE__ */ jsx("option", { value: "rolePharmacist", children: t("rolePharmacist") }),
                  /* @__PURE__ */ jsx("option", { value: "roleViewer", children: t("roleViewer") })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5", children: /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", u.status === "active" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/15 text-amber-300 border border-amber-500/30"), children: [
                  /* @__PURE__ */ jsx("span", { className: "size-1.5 rounded-full bg-current" }),
                  u.status === "active" ? t("active") : t("invitePending")
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-muted-foreground tabular text-xs", children: u.lastSignIn })
              ] }, u.id)) })
            ] }) }) }),
            activeSection === "integrations" && /* @__PURE__ */ jsx(SectionCard, { icon: /* @__PURE__ */ jsx(Plug, { className: "size-5" }), title: t("secIntegrations"), description: t("secIntegrationsDesc"), children: /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: INTEGRATION_DEFS.map((def) => {
              const conn = integrations[def.id] ?? {
                connected: false
              };
              return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border/60 bg-card/40 p-4 flex items-start gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: cn("size-10 rounded-lg grid place-items-center shrink-0 border", conn.connected ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border/60"), children: /* @__PURE__ */ jsx(def.icon, { className: "size-5" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm truncate", children: t(def.titleKey) }),
                    conn.connected ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30", children: [
                      /* @__PURE__ */ jsx(Check, { className: "size-2.5" }),
                      t("connected")
                    ] }) : /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border/60", children: t("notConnected") })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5 line-clamp-2", children: t(def.descKey) }),
                  conn.connected && conn.account && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-[11px] text-muted-foreground tabular truncate", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: conn.account }),
                    conn.connectedAt && /* @__PURE__ */ jsxs(Fragment, { children: [
                      " · ",
                      t("connectedSince"),
                      " ",
                      conn.connectedAt
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("button", { onClick: () => setPendingIntegration({
                    def,
                    mode: conn.connected ? "disconnect" : "connect"
                  }), className: cn("mt-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", conn.connected ? "bg-muted/40 hover:bg-muted/60 text-muted-foreground border border-border/60" : "bg-primary text-primary-foreground hover:opacity-90"), children: conn.connected ? t("disconnect") : t("connect") })
                ] })
              ] }, def.id);
            }) }) }),
            activeSection === "security" && /* @__PURE__ */ jsxs(SectionCard, { icon: /* @__PURE__ */ jsx(ShieldCheck, { className: "size-5" }), title: t("secSecurity"), description: t("secSecurityDesc"), children: [
              /* @__PURE__ */ jsx(ToggleRow, { label: t("twoFactor"), checked: settings.security.twoFactor, onChange: (v) => update("security", {
                twoFactor: v
              }) }),
              /* @__PURE__ */ jsx(ToggleRow, { label: t("loginAlerts"), checked: settings.security.loginAlerts, onChange: (v) => update("security", {
                loginAlerts: v
              }) }),
              /* @__PURE__ */ jsx(Field, { label: t("sessionTimeout"), className: "mt-4 max-w-xs", children: /* @__PURE__ */ jsx(NumberInput, { value: settings.security.sessionTimeout, onChange: (v) => update("security", {
                sessionTimeout: v
              }), min: 5, max: 480 }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => toast.info(t("changePassword")), className: "mt-4 px-4 py-2 rounded-lg bg-card/60 border border-border/60 text-sm font-medium hover:bg-muted/40 transition-colors", children: t("changePassword") })
            ] }),
            activeSection === "backup" && /* @__PURE__ */ jsxs(SectionCard, { icon: /* @__PURE__ */ jsx(Database, { className: "size-5" }), title: t("secBackup"), description: t("secBackupDesc"), children: [
              /* @__PURE__ */ jsx(Field, { label: t("autoBackup"), className: "max-w-xs", children: /* @__PURE__ */ jsx(SelectInput, { value: settings.backup.auto, onChange: (v) => update("backup", {
                auto: v
              }), options: [{
                value: "daily",
                label: t("daily")
              }, {
                value: "weekly",
                label: t("weekly")
              }, {
                value: "never",
                label: t("never")
              }] }) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-5 grid sm:grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs("button", { onClick: () => toast.success(t("exportAll")), className: "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card/60 border border-border/60 text-sm font-medium hover:bg-muted/40 transition-colors", children: [
                  /* @__PURE__ */ jsx(Download, { className: "size-4" }),
                  t("exportAll")
                ] }),
                /* @__PURE__ */ jsxs("button", { onClick: () => toast.info(t("importData")), className: "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card/60 border border-border/60 text-sm font-medium hover:bg-muted/40 transition-colors", children: [
                  /* @__PURE__ */ jsx(Upload, { className: "size-4" }),
                  t("importData")
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { className: "size-5 text-destructive shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-destructive", children: t("clearData") }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("clearDataWarn") })
                ] }),
                /* @__PURE__ */ jsxs("button", { onClick: () => {
                  if (!orgId) return;
                  const msg = lang === "ar" ? "سيتم حذف جميع المشتريات والإيرادات والمصروفات والديون وسندات السداد والأرصدة الافتتاحية لهذه المنظمة. لا يمكن التراجع. هل أنت متأكد؟" : "All purchases, revenues, expenses, debts, supplier payments and opening balances for this organization will be deleted. This cannot be undone. Continue?";
                  if (!window.confirm(msg)) return;
                  const keys = [`pharmledger.revenue.entries.v2.${orgId}`, `pharmledger.expenses.v1.${orgId}`, `pharmledger.purchases.v1.${orgId}`, `pharmledger.debts.v1.${orgId}`, `pharmledger.supplier-payments.v1.${orgId}`, `pharmledger.openings.v1.${orgId}`];
                  try {
                    for (const k of keys) localStorage.setItem(k, JSON.stringify([]));
                    window.dispatchEvent(new StorageEvent("storage", {
                      key: keys[0]
                    }));
                    toast.success(lang === "ar" ? "تم تصفير السيستم" : "System cleared");
                    setTimeout(() => window.location.reload(), 600);
                  } catch (e) {
                    console.error(e);
                    toast.error(lang === "ar" ? "تعذّر الحذف" : "Failed to clear");
                  }
                }, className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 text-sm font-medium hover:bg-destructive/20 transition-colors", children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
                  t("clearData")
                ] })
              ] }) })
            ] })
          ] })
        ] }),
        pendingIntegration && /* @__PURE__ */ jsx(IntegrationModal, { def: pendingIntegration.def, mode: pendingIntegration.mode, currentAccount: integrations[pendingIntegration.def.id]?.account, onClose: () => setPendingIntegration(null), onConfirmConnect: (account) => handleConnectIntegration(pendingIntegration.def.id, account), onConfirmDisconnect: () => handleDisconnectIntegration(pendingIntegration.def.id) }, `${pendingIntegration.def.id}-${pendingIntegration.mode}`)
      ] })
    ] })
  ] });
}
function SectionCard({
  icon,
  title,
  description,
  action,
  children
}) {
  return /* @__PURE__ */ jsxs("section", { className: "glass-card rounded-2xl border border-border/60 p-5", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-start justify-between gap-3 mb-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "size-10 rounded-xl grid place-items-center bg-primary/15 text-primary border border-primary/30 shrink-0", children: icon }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold", children: title }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: description })
        ] })
      ] }),
      action
    ] }),
    /* @__PURE__ */ jsx("div", { children })
  ] });
}
function Field({
  label,
  children,
  className
}) {
  return /* @__PURE__ */ jsxs("label", { className: cn("block", className), children: [
    /* @__PURE__ */ jsx("span", { className: "block text-xs font-medium text-muted-foreground mb-1.5", children: label }),
    children
  ] });
}
function TextInput({
  value,
  onChange,
  type = "text",
  placeholder
}) {
  return /* @__PURE__ */ jsx("input", { type, value, placeholder, onChange: (e) => onChange(e.target.value), className: "w-full h-10 px-3 rounded-lg bg-card/60 border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary/50 transition" });
}
function NumberInput({
  value,
  onChange,
  min,
  max,
  suffix
}) {
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsx("input", { type: "number", value, min, max, onChange: (e) => onChange(Number(e.target.value)), className: cn("w-full h-10 px-3 rounded-lg bg-card/60 border border-border/60 text-sm tabular focus:outline-none focus:ring-1 focus:ring-ring", suffix && "pe-9") }),
    suffix && /* @__PURE__ */ jsx("span", { className: "absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground", children: suffix })
  ] });
}
function SelectInput({
  value,
  onChange,
  options
}) {
  return /* @__PURE__ */ jsx("select", { value, onChange: (e) => onChange(e.target.value), className: "w-full h-10 px-3 rounded-lg bg-card/60 border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-ring", children: options.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, children: o.label }, o.value)) });
}
function ToggleRow({
  label,
  checked,
  onChange
}) {
  return /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => onChange(!checked), className: "w-full flex items-center justify-between gap-3 py-3 border-b border-border/40 last:border-0 text-start", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm", children: label }),
    /* @__PURE__ */ jsx("span", { className: cn("relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0", checked ? "bg-primary" : "bg-muted/60"), children: /* @__PURE__ */ jsx("span", { className: cn("absolute top-0.5 size-4 rounded-full bg-background shadow transition-all", checked ? "start-[18px]" : "start-0.5") }) })
  ] });
}
function ChoiceTile({
  active,
  onClick,
  icon,
  label
}) {
  return /* @__PURE__ */ jsxs("button", { type: "button", onClick, className: cn("h-10 px-3 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors", active ? "bg-primary/15 text-primary border-primary/40" : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40"), children: [
    icon,
    label
  ] });
}
function ChannelTile({
  icon,
  label,
  active,
  onToggle
}) {
  return /* @__PURE__ */ jsxs("button", { type: "button", onClick: onToggle, className: cn("flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors", active ? "bg-primary/15 text-primary border-primary/40" : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40"), children: [
    /* @__PURE__ */ jsx("span", { className: cn("size-7 rounded-md grid place-items-center", active ? "bg-primary/20" : "bg-muted/40"), children: icon }),
    /* @__PURE__ */ jsx("span", { className: "flex-1 text-start", children: label }),
    active && /* @__PURE__ */ jsx(Check, { className: "size-4" })
  ] });
}
function IntegrationModal({
  def,
  mode,
  currentAccount,
  onClose,
  onConfirmConnect,
  onConfirmDisconnect
}) {
  const {
    t
  } = useApp();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fieldErrors = useMemo(() => Object.fromEntries(def.fields.map((f) => [f.id, validateIntegrationField(f.id, values[f.id] ?? "")])), [def.fields, values]);
  const isValid = def.fields.every((f) => fieldErrors[f.id] === null);
  const handleSubmit = () => {
    if (mode === "connect") {
      setErrors(fieldErrors);
      if (!isValid) {
        toast.error(t("invalidInput") ?? "Please fix the highlighted fields");
        return;
      }
    }
    setSubmitting(true);
    setTimeout(() => {
      if (mode === "connect") {
        const accountField = values.account || values.phoneNumber || values.merchantId || values.vatNumber || def.id;
        onConfirmConnect(accountField.trim());
      } else {
        onConfirmDisconnect();
      }
      setSubmitting(false);
    }, 900);
  };
  const isDisconnect = mode === "disconnect";
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: () => !submitting && onClose(), children: /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl w-full max-w-md border border-border/60 shadow-2xl overflow-hidden", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 p-5 border-b border-border/60", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: cn("size-11 rounded-xl grid place-items-center shrink-0 border", isDisconnect ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-primary/15 text-primary border-primary/30"), children: /* @__PURE__ */ jsx(def.icon, { className: "size-5" }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: isDisconnect ? t("disconnectTitle") : t("connectTitle") }),
          /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold truncate", children: t(def.titleKey) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5 line-clamp-2", children: t(def.descKey) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, disabled: submitting, className: "size-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0 disabled:opacity-40", "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-5 space-y-4", children: isDisconnect ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "size-4 text-destructive shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground/90", children: t("disconnectWarn") })
      ] }),
      currentAccount && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
        t("account"),
        ":",
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium tabular", children: currentAccount })
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("connectIntro") }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: def.fields.map((f) => {
        const err = errors[f.id];
        return /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsxs("span", { className: "block text-xs font-medium text-muted-foreground mb-1.5", children: [
            t(f.labelKey),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive/80", children: "*" })
          ] }),
          /* @__PURE__ */ jsx("input", { type: f.type ?? "text", value: values[f.id] ?? "", placeholder: f.placeholder, "aria-invalid": !!err, onChange: (e) => {
            const v = e.target.value;
            setValues((s) => ({
              ...s,
              [f.id]: v
            }));
            if (errors[f.id]) {
              setErrors((s) => ({
                ...s,
                [f.id]: null
              }));
            }
          }, onBlur: () => setErrors((s) => ({
            ...s,
            [f.id]: validateIntegrationField(f.id, values[f.id] ?? "")
          })), className: cn("w-full h-10 px-3 rounded-lg bg-card/60 border text-sm focus:outline-none focus:ring-1 transition", err ? "border-destructive/60 focus:ring-destructive/40" : "border-border/60 focus:ring-ring focus:border-primary/50") }),
          err && /* @__PURE__ */ jsx("span", { className: "block text-[11px] text-destructive mt-1", children: err })
        ] }, f.id);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 p-4 border-t border-border/60 bg-card/40", children: [
      /* @__PURE__ */ jsx("button", { onClick: onClose, disabled: submitting, className: "px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-40", children: t("cancel") }),
      /* @__PURE__ */ jsxs("button", { onClick: handleSubmit, disabled: submitting || !isDisconnect && !isValid, className: cn("inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed", isDisconnect ? "bg-destructive text-destructive-foreground hover:opacity-90" : "bg-primary text-primary-foreground hover:opacity-90"), children: [
        submitting && /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }),
        submitting ? isDisconnect ? t("disconnecting") : t("connecting") : isDisconnect ? t("confirmDisconnect") : t("confirmConnect")
      ] })
    ] })
  ] }) });
}
export {
  SettingsPage as component
};
