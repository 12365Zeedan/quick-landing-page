import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Download, FileText, Plus, Truck, CheckCircle2, Wallet, Building2, Search, Phone, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { u as useSelection, S as ShowAllToggle, B as BulkActionsBar } from "./use-selection-COp7jQzX.js";
import { u as usePagination, P as PaginationBar } from "./use-pagination-DIgFAfhb.js";
import { w as useApp, z as useOrgStorage, g as cn } from "./router-CH3R9Cfm.js";
import { u as useSortable, S as SortHeader } from "./sort-header-ASVt2fVo.js";
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
function SuppliersPage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const [records, setRecords] = useOrgStorage("suppliers.records.v1", []);
  const [purchases] = useOrgStorage("pharmledger.purchases.v1", []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  useEffect(() => {
    if (!records.length) return;
    const norm = (s) => s.trim().toLowerCase();
    const agg = /* @__PURE__ */ new Map();
    for (const p of purchases) {
      const keys = [norm(p.supplier?.ar ?? ""), norm(p.supplier?.en ?? "")].filter(Boolean);
      const total = Number(p.total) || 0;
      const owed = total - (Number(p.paid) || 0);
      for (const k of keys) {
        const cur = agg.get(k) ?? {
          total: 0,
          balance: 0,
          count: 0,
          last: ""
        };
        cur.total += total;
        cur.balance += owed;
        cur.count += 1;
        if (!cur.last || new Date(p.date) > new Date(cur.last)) cur.last = p.date;
        agg.set(k, cur);
      }
    }
    let changed = false;
    const next = records.map((s) => {
      const a = agg.get(norm(s.name.ar)) ?? agg.get(norm(s.name.en));
      if (!a) {
        if (s.totalPurchases === 0 && s.balance === 0 && s.invoicesCount === 0) return s;
        changed = true;
        return {
          ...s,
          totalPurchases: 0,
          balance: 0,
          invoicesCount: 0
        };
      }
      if (s.totalPurchases === a.total && s.balance === a.balance && s.invoicesCount === a.count && s.lastPurchase === a.last) return s;
      changed = true;
      return {
        ...s,
        totalPurchases: a.total,
        balance: a.balance,
        invoicesCount: a.count,
        lastPurchase: a.last || s.lastPurchase
      };
    });
    if (changed) setRecords(next);
  }, [purchases, records, setRecords]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((s) => {
      if (filter === "active" && !s.active) return false;
      if (filter === "inactive" && s.active) return false;
      if (filter === "owed" && s.balance <= 0) return false;
      if (!q) return true;
      return s.id.toLowerCase().includes(q) || s.name.ar.includes(q) || s.name.en.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q) || s.phone.includes(q) || s.email.toLowerCase().includes(q) || s.city.ar.includes(q) || s.city.en.toLowerCase().includes(q) || (s.gln ?? "").toLowerCase().includes(q);
    });
  }, [records, query, filter]);
  const totals = useMemo(() => {
    const count = records.length;
    const active = records.filter((s) => s.active).length;
    const payables = records.reduce((s, r) => s + r.balance, 0);
    const top = [...records].sort((a, b) => b.totalPurchases - a.totalPurchases)[0];
    return {
      count,
      active,
      payables,
      topName: top?.name[lang] ?? "—"
    };
  }, [records, lang]);
  const buildExport = () => {
    const headers = ["id", "name", "contact", "phone", "email", "city", "tax", "cr", "gln", "nationalAddress", "totalPurchases", "balance", "invoicesCount", "lastPurchase", "active"];
    const rows = filtered.map((s) => ({
      id: s.id,
      name: s.name.en,
      contact: s.contact,
      phone: s.phone,
      email: s.email,
      city: s.city.en,
      tax: s.taxNumber,
      cr: s.crNumber,
      gln: s.gln ?? "",
      nationalAddress: s.nationalAddress.en,
      totalPurchases: s.totalPurchases,
      balance: s.balance,
      invoicesCount: s.invoicesCount,
      lastPurchase: s.lastPurchase,
      active: String(s.active)
    }));
    return {
      headers,
      rows
    };
  };
  const exportXlsx = async () => {
    const {
      headers,
      rows
    } = buildExport();
    const {
      exportRowsAsXlsx
    } = await import("./data-export-tC_sT3ic.js");
    await exportRowsAsXlsx({
      filename: `pharmledger-suppliers-${Date.now()}`,
      sheetName: "Suppliers",
      headers,
      rows
    });
  };
  const exportPdf = async () => {
    const {
      headers,
      rows
    } = buildExport();
    const {
      exportRowsAsPdf
    } = await import("./data-export-tC_sT3ic.js");
    await exportRowsAsPdf({
      filename: `pharmledger-suppliers-${Date.now()}`,
      title: String(t("suppliersTitle") || "Suppliers"),
      headers,
      rows,
      lang
    });
  };
  const fileRef = useRef(null);
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      name: "Supplier Name",
      contact: "Contact Person",
      phone: "+966500000000",
      email: "supplier@example.com",
      city: "Riyadh",
      taxNumber: "300000000000003",
      crNumber: "1010000000",
      gln: "1234567890123",
      nationalAddress: "RRRD1234, Riyadh",
      totalPurchases: 0,
      balance: 0,
      invoicesCount: 0,
      lastPurchase: "2025-01-15",
      active: "yes"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
    XLSX.writeFile(wb, "suppliers-template.xlsx");
  };
  const handleImportFile = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, {
        type: "array",
        cellDates: true
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {
        defval: ""
      });
      const pick = (r, keys) => {
        const lower = {};
        for (const k of Object.keys(r)) lower[k.toLowerCase().trim()] = r[k];
        for (const k of keys) {
          const v = lower[k.toLowerCase()];
          if (v !== void 0 && v !== "") return v;
        }
        return "";
      };
      const toNum = (v) => {
        if (typeof v === "number") return v;
        const n = parseFloat(String(v).replace(/[^\d.-]/g, ""));
        return isNaN(n) ? 0 : n;
      };
      const toIso = (v) => {
        if (v instanceof Date) return v.toISOString();
        const s = String(v).trim();
        if (!s) return (/* @__PURE__ */ new Date()).toISOString();
        const d = new Date(s);
        return isNaN(d.getTime()) ? (/* @__PURE__ */ new Date()).toISOString() : d.toISOString();
      };
      const toBool = (v) => {
        const s = String(v).toLowerCase().trim();
        if (["false", "no", "0", "inactive", "غير نشط", "لا"].includes(s)) return false;
        if (["true", "yes", "1", "active", "نشط", "نعم"].includes(s)) return true;
        return true;
      };
      const parsed = rows.map((r) => {
        const name = String(pick(r, ["name", "supplier", "اسم المورد", "المورد"]) || "").trim();
        if (!name) return null;
        const contact = String(pick(r, ["contact", "contact person", "جهة الاتصال", "المسؤول"]) || "");
        const phone = String(pick(r, ["phone", "mobile", "tel", "الهاتف", "الجوال"]) || "");
        const email = String(pick(r, ["email", "البريد", "البريد الإلكتروني"]) || "");
        const city = String(pick(r, ["city", "المدينة"]) || "");
        const taxNumber = String(pick(r, ["taxNumber", "tax", "tax number", "الرقم الضريبي"]) || "");
        const crNumber = String(pick(r, ["crNumber", "cr", "cr number", "السجل التجاري"]) || "");
        const gln = String(pick(r, ["gln", "GLN", "glnNumber", "رقم GLN", "GLN #"]) || "");
        const nationalAddress = String(pick(r, ["nationalAddress", "national address", "address", "العنوان الوطني", "العنوان"]) || "");
        return {
          id: `SUP-${String(Math.floor(Math.random() * 9e4) + 1e4)}`,
          name: {
            ar: name,
            en: name
          },
          contact,
          phone,
          email,
          city: {
            ar: city,
            en: city
          },
          taxNumber,
          crNumber,
          ...gln ? {
            gln
          } : {},
          nationalAddress: {
            ar: nationalAddress,
            en: nationalAddress
          },
          totalPurchases: toNum(pick(r, ["totalPurchases", "total purchases", "إجمالي المشتريات"])),
          balance: toNum(pick(r, ["balance", "الرصيد"])),
          lastPurchase: toIso(pick(r, ["lastPurchase", "last purchase", "آخر شراء"])),
          invoicesCount: toNum(pick(r, ["invoicesCount", "invoices", "عدد الفواتير"])),
          active: toBool(pick(r, ["active", "status", "الحالة"]))
        };
      }).filter((e) => e !== null);
      if (!parsed.length) {
        toast.error(t("importFailed"));
      } else {
        setRecords((prev) => [...parsed, ...prev]);
        toast.success(`${parsed.length} ✓`);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("importFailed"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const addRecord = (r) => {
    const id = `SUP-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    setRecords((prev) => [{
      ...r,
      id
    }, ...prev]);
    toast.success(t("addedSupplier"));
    setOpen(false);
  };
  const editRecord = (updated) => {
    setRecords((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    toast.success(t("savedChanges"));
    setEditSupplier(null);
    setView(null);
  };
  const sortable = useSortable(filtered, {
    name: (s) => s.name.en || s.name.ar,
    contact: (s) => s.contact,
    phone: (s) => s.phone,
    balance: (s) => s.balance,
    status: (s) => s.active ? 1 : 0
  });
  const pg = usePagination(sortable.sorted);
  const visibleIds = useMemo(() => pg.pageItems.map((s) => s.id), [pg.pageItems]);
  const sel = useSelection(visibleIds);
  const deleteSelected = () => {
    if (sel.count === 0) return;
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteSelected"))) return;
    const ids = new Set(sel.ids);
    const removed = records.filter((s) => ids.has(s.id));
    setRecords((prev) => prev.filter((s) => !ids.has(s.id)));
    sel.clear();
    toast.success(t("deletedSelected"), {
      action: {
        label: t("undo"),
        onClick: () => {
          setRecords((prev) => [...removed, ...prev.filter((s) => !ids.has(s.id))]);
          toast.success(t("restoredSelected"));
        }
      }
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "px-4 lg:px-8 py-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-bold tracking-tight", children: /* @__PURE__ */ jsx("span", { className: "text-gradient", children: t("suppliersTitle") }) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("suppliersSubtitle") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: ".xlsx,.xls,.csv", onChange: handleImportFile, className: "hidden" }),
            /* @__PURE__ */ jsxs("button", { onClick: () => fileRef.current?.click(), className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-info/15 text-info border border-info/30 hover:bg-info/25 transition", children: [
              /* @__PURE__ */ jsx(Upload, { className: "size-4" }),
              t("importExcel")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: downloadTemplate, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(FileSpreadsheet, { className: "size-4" }),
              t("downloadTemplate")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: exportXlsx, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(Download, { className: "size-4" }),
              t("exportExcel")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: exportPdf, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(FileText, { className: "size-4" }),
              t("exportPdf")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setOpen(true), className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition", children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              t("newSupplier")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsx(Stat, { icon: Truck, label: t("suppliersCount"), value: fmt(totals.count), accent: "primary" }),
          /* @__PURE__ */ jsx(Stat, { icon: CheckCircle2, label: t("activeSuppliers"), value: fmt(totals.active), accent: "success" }),
          /* @__PURE__ */ jsx(Stat, { icon: Wallet, label: t("totalPayables"), value: fmt(totals.payables), suffix: t("currency"), accent: totals.payables > 0 ? "warning" : "success" }),
          /* @__PURE__ */ jsx(Stat, { icon: Building2, label: t("topSupplier"), value: totals.topName, accent: "info" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
            /* @__PURE__ */ jsx(Search, { className: cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3") }),
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("searchSuppliers"), className: cn("w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition", dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4") })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: ["all", "active", "inactive", "owed"].map((o) => /* @__PURE__ */ jsx("button", { onClick: () => setFilter(o), className: cn("h-9 px-3 rounded-lg text-xs font-semibold transition border", filter === o ? "gradient-primary text-primary-foreground border-transparent" : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"), children: o === "all" ? t("filterAll") : o === "owed" ? t("outstanding") : t(o) }, o)) })
        ] }),
        /* @__PURE__ */ jsx(ShowAllToggle, { showAll: pg.showAll, total: pg.total, onToggle: pg.toggleShowAll }),
        /* @__PURE__ */ jsx(BulkActionsBar, { count: sel.count, total: filtered.length, allSelected: sel.allSelected, onSelectAll: sel.toggleAll, onClear: sel.clear, onDelete: deleteSelected }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl overflow-hidden divide-y divide-border/60", children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-muted/30 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children: [
            /* @__PURE__ */ jsx("div", { className: "col-span-4", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "name", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("supplierName") }) }),
            /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "contact", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("contactPerson") }) }),
            /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "phone", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("phone") }) }),
            /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "balance", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("balance") }) }),
            /* @__PURE__ */ jsx("div", { className: "col-span-1 text-center", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "status", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "center", children: t("status") }) }),
            /* @__PURE__ */ jsx("div", { className: "col-span-1 text-center", children: t("selectAll") })
          ] }),
          pg.pageItems.map((s) => {
            const last = new Date(s.lastPurchase);
            return /* @__PURE__ */ jsxs("div", { className: cn("group relative grid grid-cols-1 lg:grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-muted/30 transition", sel.isSelected(s.id) && "bg-primary/5"), children: [
              /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setView(s), className: "col-span-1 lg:col-span-4 flex items-center gap-3 min-w-0 text-start", children: [
                /* @__PURE__ */ jsx("div", { className: "size-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0 glow-primary", children: /* @__PURE__ */ jsx(Truck, { className: "size-4" }) }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm truncate", children: s.name[lang] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground tabular flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx("span", { children: s.id }),
                    s.gln && /* @__PURE__ */ jsxs("span", { className: "px-1.5 py-0.5 rounded bg-muted text-[10px]", children: [
                      "GLN: ",
                      s.gln
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-2 min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm truncate", children: s.contact }),
                /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground truncate", children: s.city[lang] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-2 min-w-0 space-y-0.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-sm tabular truncate flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Phone, { className: "size-3 text-muted-foreground" }),
                  s.phone
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground truncate flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Mail, { className: "size-3" }),
                  s.email
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-2 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: cn("font-bold tabular text-sm", s.balance > 0 ? "text-warning" : "text-success"), children: [
                  fmt(s.balance),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground tabular", children: [
                  t("totalPurchases"),
                  ": ",
                  fmt(s.totalPurchases),
                  " ",
                  t("currency")
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "col-span-1 lg:col-span-1 text-center", children: /* @__PURE__ */ jsx("span", { className: cn("text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block", s.active ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground border-border"), children: s.active ? t("active") : t("inactive") }) }),
              /* @__PURE__ */ jsx("label", { className: "col-span-1 lg:col-span-1 flex items-center justify-center cursor-pointer", children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": t("selectAll"), checked: sel.isSelected(s.id), onChange: () => sel.toggle(s.id), onClick: (e) => e.stopPropagation(), className: "size-4 rounded border-border accent-primary cursor-pointer" }) }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-12 lg:hidden text-[11px] text-muted-foreground tabular", children: [
                t("lastPurchase"),
                ": ",
                last.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })
              ] })
            ] }, s.id);
          }),
          filtered.length === 0 && /* @__PURE__ */ jsx("div", { className: "py-16 text-center text-sm text-muted-foreground", children: t("noResults") }),
          /* @__PURE__ */ jsx(PaginationBar, { page: pg.page, totalPages: pg.totalPages, total: pg.total, from: pg.from, to: pg.to, onPageChange: pg.setPage, showAll: pg.showAll, onToggleShowAll: pg.toggleShowAll })
        ] })
      ] })
    ] }),
    open && /* @__PURE__ */ jsx(AddSupplierDialog, { onClose: () => setOpen(false), onSubmit: addRecord }),
    view && /* @__PURE__ */ jsx(ViewSupplierDialog, { supplier: view, onClose: () => setView(null), onEdit: () => setEditSupplier(view) }),
    editSupplier && /* @__PURE__ */ jsx(EditSupplierDialog, { supplier: editSupplier, onClose: () => setEditSupplier(null), onSubmit: editRecord })
  ] });
}
function Stat({
  icon: Icon,
  label,
  value,
  suffix,
  accent = "primary"
}) {
  const tone = {
    primary: "from-primary/20 to-primary/0 text-primary",
    secondary: "from-secondary/20 to-secondary/0 text-secondary",
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    warning: "from-warning/20 to-warning/0 text-warning",
    destructive: "from-destructive/20 to-destructive/0 text-destructive"
  };
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in", children: [
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", tone[accent]) }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: label }),
        /* @__PURE__ */ jsx("div", { className: cn("size-9 rounded-xl grid place-items-center bg-background/40 border border-border/50", tone[accent].split(" ").pop()), children: /* @__PURE__ */ jsx(Icon, { className: "size-4" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tabular tracking-tight truncate", children: value }),
        suffix && /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: suffix })
      ] })
    ] })
  ] });
}
function ViewSupplierDialog({
  supplier,
  onClose,
  onEdit
}) {
  const {
    t,
    fmt,
    lang
  } = useApp();
  const last = new Date(supplier.lastPurchase);
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "size-12 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0 glow-primary", children: /* @__PURE__ */ jsx(Truck, { className: "size-6" }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold truncate", children: supplier.name[lang] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground tabular", children: [
            supplier.id,
            " · ",
            supplier.taxNumber
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [
      /* @__PURE__ */ jsx(Info, { label: t("contactPerson"), value: supplier.contact }),
      /* @__PURE__ */ jsx(Info, { label: t("city"), value: supplier.city[lang] }),
      /* @__PURE__ */ jsx(Info, { label: t("phone"), value: supplier.phone, mono: true }),
      /* @__PURE__ */ jsx(Info, { label: t("email"), value: supplier.email }),
      /* @__PURE__ */ jsx(Info, { label: t("crNumber"), value: supplier.crNumber, mono: true }),
      /* @__PURE__ */ jsx(Info, { label: t("taxNumber"), value: supplier.taxNumber, mono: true }),
      /* @__PURE__ */ jsx(Info, { label: t("glnNumber"), value: supplier.gln ?? "—", mono: true }),
      /* @__PURE__ */ jsx(Info, { label: t("invoicesCount"), value: fmt(supplier.invoicesCount), mono: true }),
      /* @__PURE__ */ jsx(Info, { label: t("lastPurchase"), value: last.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }), mono: true })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-muted/20 p-3 text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1", children: t("nationalAddress") }),
      /* @__PURE__ */ jsx("div", { className: "font-medium", children: supplier.nationalAddress[lang] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-muted/30 p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: t("totalPurchases") }),
        /* @__PURE__ */ jsxs("div", { className: "font-bold tabular text-xl mt-1", children: [
          fmt(supplier.totalPurchases),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: cn("rounded-xl border p-4", supplier.balance > 0 ? "border-warning/40 bg-warning/10" : "border-success/40 bg-success/10"), children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: t("balance") }),
        /* @__PURE__ */ jsxs("div", { className: cn("font-bold tabular text-xl mt-1", supplier.balance > 0 ? "text-warning" : "text-success"), children: [
          fmt(supplier.balance),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("close") }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
        onClose();
        onEdit();
      }, className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2", children: t("edit") })
    ] })
  ] }) });
}
function Info({
  label,
  value,
  mono
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground font-medium", children: label }),
    /* @__PURE__ */ jsx("div", { className: cn("text-sm font-medium truncate", mono && "tabular"), children: value })
  ] });
}
function AddSupplierDialog({
  onClose,
  onSubmit
}) {
  const {
    t
  } = useApp();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [gln, setGln] = useState("");
  const [nationalAddress, setNationalAddress] = useState("");
  const submit = (ev) => {
    ev.preventDefault();
    if (!name.trim()) return toast.error("Name required");
    if (crNumber && !/^\d{10}$/.test(crNumber.trim())) {
      return toast.error("CR / Unified # must be 10 digits");
    }
    onSubmit({
      name: {
        ar: name,
        en: name
      },
      contact: contact || "—",
      phone: phone || "—",
      email: email || "—",
      city: {
        ar: city || "—",
        en: city || "—"
      },
      taxNumber: taxNumber || "—",
      crNumber: crNumber.trim() || "—",
      ...gln.trim() ? {
        gln: gln.trim()
      } : {},
      nationalAddress: {
        ar: nationalAddress || "—",
        en: nationalAddress || "—"
      },
      totalPurchases: 0,
      balance: 0,
      lastPurchase: (/* @__PURE__ */ new Date()).toISOString(),
      invoicesCount: 0,
      active: true
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: t("newSupplier") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("suppliersSubtitle") })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: t("supplierName"), full: true, children: /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), required: true, autoFocus: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("contactPerson"), children: /* @__PURE__ */ jsx("input", { value: contact, onChange: (e) => setContact(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("phone"), children: /* @__PURE__ */ jsx("input", { value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+9665…", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("email"), children: /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("city"), children: /* @__PURE__ */ jsx("input", { value: city, onChange: (e) => setCity(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("crNumber"), children: /* @__PURE__ */ jsx("input", { value: crNumber, onChange: (e) => setCrNumber(e.target.value), inputMode: "numeric", maxLength: 10, placeholder: "1010xxxxxx", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("taxNumber"), full: true, children: /* @__PURE__ */ jsx("input", { value: taxNumber, onChange: (e) => setTaxNumber(e.target.value), placeholder: "3xxxxxxxxx00003", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("glnNumber"), full: true, children: /* @__PURE__ */ jsx("input", { value: gln, onChange: (e) => setGln(e.target.value), placeholder: "1234567890123", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("nationalAddress"), full: true, children: /* @__PURE__ */ jsx("input", { value: nationalAddress, onChange: (e) => setNationalAddress(e.target.value), placeholder: t("nationalAddress"), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
        t("save")
      ] })
    ] })
  ] }) });
}
function Field({
  label,
  children,
  full
}) {
  return /* @__PURE__ */ jsxs("label", { className: cn("space-y-1.5 block", full && "col-span-2"), children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: label }),
    children
  ] });
}
function EditSupplierDialog({
  supplier,
  onClose,
  onSubmit
}) {
  const {
    t,
    lang
  } = useApp();
  const [name, setName] = useState(supplier.name[lang] || "");
  const [contact, setContact] = useState(supplier.contact === "—" ? "" : supplier.contact);
  const [phone, setPhone] = useState(supplier.phone === "—" ? "" : supplier.phone);
  const [email, setEmail] = useState(supplier.email === "—" ? "" : supplier.email);
  const [city, setCity] = useState(supplier.city[lang] === "—" ? "" : supplier.city[lang]);
  const [taxNumber, setTaxNumber] = useState(supplier.taxNumber === "—" ? "" : supplier.taxNumber);
  const [crNumber, setCrNumber] = useState(supplier.crNumber === "—" ? "" : supplier.crNumber);
  const [gln, setGln] = useState(supplier.gln ?? "");
  const [nationalAddress, setNationalAddress] = useState(supplier.nationalAddress[lang] === "—" ? "" : supplier.nationalAddress[lang]);
  const [active, setActive] = useState(supplier.active);
  const submit = (ev) => {
    ev.preventDefault();
    if (!name.trim()) return toast.error("Name required");
    if (crNumber && !/^\d{10}$/.test(crNumber.trim())) {
      return toast.error("CR / Unified # must be 10 digits");
    }
    onSubmit({
      ...supplier,
      name: {
        ar: name,
        en: name
      },
      contact: contact || "—",
      phone: phone || "—",
      email: email || "—",
      city: {
        ar: city || "—",
        en: city || "—"
      },
      taxNumber: taxNumber || "—",
      crNumber: crNumber.trim() || "—",
      ...gln.trim() ? {
        gln: gln.trim()
      } : {},
      nationalAddress: {
        ar: nationalAddress || "—",
        en: nationalAddress || "—"
      },
      active
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: t("editSupplier") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: supplier.id })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: t("supplierName"), full: true, children: /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), required: true, autoFocus: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("contactPerson"), children: /* @__PURE__ */ jsx("input", { value: contact, onChange: (e) => setContact(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("phone"), children: /* @__PURE__ */ jsx("input", { value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+9665…", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("email"), children: /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("city"), children: /* @__PURE__ */ jsx("input", { value: city, onChange: (e) => setCity(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("crNumber"), children: /* @__PURE__ */ jsx("input", { value: crNumber, onChange: (e) => setCrNumber(e.target.value), inputMode: "numeric", maxLength: 10, placeholder: "1010xxxxxx", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("taxNumber"), full: true, children: /* @__PURE__ */ jsx("input", { value: taxNumber, onChange: (e) => setTaxNumber(e.target.value), placeholder: "3xxxxxxxxx00003", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("glnNumber"), full: true, children: /* @__PURE__ */ jsx("input", { value: gln, onChange: (e) => setGln(e.target.value), placeholder: "1234567890123", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("nationalAddress"), full: true, children: /* @__PURE__ */ jsx("input", { value: nationalAddress, onChange: (e) => setNationalAddress(e.target.value), placeholder: t("nationalAddress"), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", children: [
      /* @__PURE__ */ jsx("input", { type: "checkbox", checked: active, onChange: (e) => setActive(e.target.checked), className: "size-4 rounded border-border accent-primary cursor-pointer" }),
      /* @__PURE__ */ jsx("span", { children: active ? t("active") : t("inactive") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "size-4" }),
        t("saveChanges")
      ] })
    ] })
  ] }) });
}
export {
  SuppliersPage as component
};
