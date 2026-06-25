import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useState } from "react";
import { Plus, Loader2, Building2, Check, Settings, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { l as Sidebar, T as Topbar, D as Dialog, a as DialogContent, d as DialogHeader, e as DialogTitle, b as DialogDescription, L as Label, g as LogoPicker, I as Input, S as Select, j as SelectTrigger, k as SelectValue, h as SelectContent, i as SelectItem, c as DialogFooter } from "./topbar-CywcAnz-.js";
import { R as RequireAuth } from "./require-auth-0pnMuVtp.js";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { g as cn, f as buttonVariants, w as useApp, y as useOrg } from "./router-CH3R9Cfm.js";
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
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
  /* @__PURE__ */ jsx(AlertDialogOverlay, {}),
  /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props
    }
  )
] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
const AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-2 text-center sm:text-left", className), ...props });
AlertDialogHeader.displayName = "AlertDialogHeader";
const AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
    ...props
  }
);
AlertDialogFooter.displayName = "AlertDialogFooter";
const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold", className),
    ...props
  }
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(AlertDialogPrimitive.Action, { ref, className: cn(buttonVariants(), className), ...props }));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Cancel,
  {
    ref,
    className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
    ...props
  }
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
function OrganizationsPage() {
  const {
    t,
    dir
  } = useApp();
  const {
    organizations,
    currentOrg,
    switchOrg,
    loading,
    createOrg,
    updateOrg,
    deleteOrg
  } = useOrg();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex bg-background", dir, children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 px-4 lg:px-8 py-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: t("organizations") }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("manageOrganizations") })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => setCreateOpen(true), className: "inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold glow-primary", children: [
            /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
            t("createOrganization")
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsx("div", { className: "grid place-items-center py-20", children: /* @__PURE__ */ jsx(Loader2, { className: "size-6 animate-spin text-primary" }) }) : organizations.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Building2, { className: "size-10 mx-auto mb-3 opacity-50" }),
          /* @__PURE__ */ jsx("p", { children: t("noOrganizations") })
        ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: organizations.map((o) => {
          const isCurrent = currentOrg?.id === o.id;
          const isOwner = o.role === "owner";
          return /* @__PURE__ */ jsxs("div", { className: `rounded-2xl border p-5 bg-card transition ${isCurrent ? "border-primary/60 shadow-md" : "border-border hover:border-primary/40"}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "size-11 rounded-xl gradient-primary grid place-items-center shrink-0 overflow-hidden", children: o.logo_url ? /* @__PURE__ */ jsx("img", { src: o.logo_url, alt: "", className: "size-full object-cover" }) : /* @__PURE__ */ jsx(Building2, { className: "size-5 text-primary-foreground" }) }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-semibold truncate", children: o.name }),
                  /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
                    t(`role${(o.role ?? "cashier").charAt(0).toUpperCase()}${(o.role ?? "cashier").slice(1)}`),
                    " · ",
                    o.currency
                  ] })
                ] })
              ] }),
              isCurrent && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium", children: [
                /* @__PURE__ */ jsx(Check, { className: "size-3" }),
                t("currentOrganization")
              ] })
            ] }),
            /* @__PURE__ */ jsxs("dl", { className: "mt-4 space-y-1.5 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: t("businessType") }),
                /* @__PURE__ */ jsx("dd", { children: t(`${o.business_type}Type`) || o.business_type })
              ] }),
              o.tax_number && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: t("taxNumber") }),
                /* @__PURE__ */ jsx("dd", { className: "font-mono", children: o.tax_number })
              ] }),
              o.commercial_register && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground", children: t("commercialRegister") }),
                /* @__PURE__ */ jsx("dd", { className: "font-mono", children: o.commercial_register })
              ] }),
              o.national_address && /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-3", children: [
                /* @__PURE__ */ jsx("dt", { className: "text-muted-foreground shrink-0", children: t("nationalAddress") }),
                /* @__PURE__ */ jsx("dd", { className: "text-end break-words", children: o.national_address })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2", children: [
              !isCurrent && /* @__PURE__ */ jsx("button", { onClick: () => {
                switchOrg(o.id);
                toast.success(t("switchOrganization"));
              }, className: "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium gradient-primary text-primary-foreground", children: t("switchOrganization") }),
              /* @__PURE__ */ jsx("button", { onClick: async () => {
                if (!isCurrent) await switchOrg(o.id);
                navigate({
                  to: "/settings"
                });
              }, className: "size-8 grid place-items-center rounded-lg border border-border hover:bg-accent", "aria-label": t("settingsTitle"), title: t("settingsTitle"), children: /* @__PURE__ */ jsx(Settings, { className: "size-3.5" }) }),
              isOwner && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("button", { onClick: () => setEditing(o), className: "size-8 grid place-items-center rounded-lg border border-border hover:bg-accent", "aria-label": t("editOrganization"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => setDeleting(o), className: "size-8 grid place-items-center rounded-lg border border-border hover:bg-destructive hover:text-destructive-foreground text-destructive", "aria-label": t("deleteOrganization"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }) })
              ] })
            ] })
          ] }, o.id);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(OrgFormDialog, { open: createOpen, onOpenChange: setCreateOpen, onSubmit: async (input) => {
      await createOrg(input);
      toast.success(t("organizationCreated"));
    } }),
    /* @__PURE__ */ jsx(OrgFormDialog, { open: !!editing, org: editing ?? void 0, onOpenChange: (v) => !v && setEditing(null), onSubmit: async (input) => {
      if (!editing) return;
      await updateOrg(editing.id, input);
      toast.success(t("organizationUpdated"));
      setEditing(null);
    } }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!deleting, onOpenChange: (v) => !v && setDeleting(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: t("deleteOrganization") }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: t("confirmDeleteOrg") })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: t("cancel") }),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: async () => {
          if (!deleting) return;
          try {
            await deleteOrg(deleting.id);
            toast.success(t("organizationDeleted"));
            setDeleting(null);
          } catch (e) {
            toast.error(e.message);
          }
        }, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: t("deleteOrganization") })
      ] })
    ] }) })
  ] });
}
function OrgFormDialog({
  open,
  onOpenChange,
  org,
  onSubmit
}) {
  const {
    t
  } = useApp();
  const [name, setName] = useState(org?.name ?? "");
  const [bizType, setBizType] = useState(org?.business_type ?? "pharmacy");
  const [currency, setCurrency] = useState(org?.currency ?? "SAR");
  const [taxNum, setTaxNum] = useState(org?.tax_number ?? "");
  const [cr, setCr] = useState(org?.commercial_register ?? "");
  const [nationalAddr, setNationalAddr] = useState(org?.national_address ?? "");
  const [logoUrl, setLogoUrl] = useState(org?.logo_url ?? null);
  const [saving, setSaving] = useState(false);
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
        logo_url: logoUrl
      });
      onOpenChange(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: org ? t("editOrganization") : t("createOrganization") }),
      /* @__PURE__ */ jsx(DialogDescription, { children: t("organizationName") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: t("organizationLogo") }),
        /* @__PURE__ */ jsx(LogoPicker, { value: logoUrl, onChange: setLogoUrl })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: t("organizationName") }),
        /* @__PURE__ */ jsx(Input, { value: name, onChange: (e) => setName(e.target.value), autoFocus: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: t("businessType") }),
          /* @__PURE__ */ jsxs(Select, { value: bizType, onValueChange: setBizType, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "pharmacy", children: t("pharmacyType") }),
              /* @__PURE__ */ jsx(SelectItem, { value: "clinic", children: t("clinicType") }),
              /* @__PURE__ */ jsx(SelectItem, { value: "company", children: t("companyType") }),
              /* @__PURE__ */ jsx(SelectItem, { value: "retail", children: t("retailType") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: t("currency") }),
          /* @__PURE__ */ jsxs(Select, { value: currency, onValueChange: setCurrency, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "SAR", children: "SAR" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "AED", children: "AED" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "EGP", children: "EGP" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "USD", children: "USD" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "EUR", children: "EUR" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: t("taxNumber") }),
        /* @__PURE__ */ jsx(Input, { value: taxNum, onChange: (e) => setTaxNum(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: t("commercialRegister") }),
        /* @__PURE__ */ jsx(Input, { value: cr, onChange: (e) => setCr(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx(Label, { children: t("nationalAddress") }),
        /* @__PURE__ */ jsx(Input, { value: nationalAddr, onChange: (e) => setNationalAddr(e.target.value) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx("button", { onClick: () => onOpenChange(false), className: "px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent", children: t("cancel") }),
      /* @__PURE__ */ jsx("button", { onClick: handleSave, disabled: saving, className: "px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60", children: saving ? /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }) : org ? t("save") : t("create") })
    ] })
  ] }) });
}
const SplitComponent = () => /* @__PURE__ */ jsx(RequireAuth, { children: /* @__PURE__ */ jsx(OrganizationsPage, {}) });
export {
  SplitComponent as component
};
