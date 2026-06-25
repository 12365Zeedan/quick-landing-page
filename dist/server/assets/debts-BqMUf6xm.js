import { jsxs, jsx } from "react/jsx-runtime";
import { w as useApp, z as useOrgStorage, r as reconcileSupplierAccounting, u as supplierIdentity, h as computePurchaseAging, g as cn, c as DatePickerInput, p as normalizeSupplierName, d as allocatePaymentToPurchases } from "./router-CH3R9Cfm.js";
import { useEffect, useState, useRef, useMemo } from "react";
import { Download, FileText, ArrowDownLeft, ArrowUpRight, Scale, AlertTriangle, Search, CheckCircle2, Pencil, Trash2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { l as Sidebar, T as Topbar, S as Select, j as SelectTrigger, k as SelectValue, h as SelectContent, i as SelectItem } from "./topbar-CywcAnz-.js";
import { u as useSelection, S as ShowAllToggle, B as BulkActionsBar } from "./use-selection-COp7jQzX.js";
import { u as usePagination, P as PaginationBar } from "./use-pagination-DIgFAfhb.js";
import { u as useSortable, S as SortHeader } from "./sort-header-ASVt2fVo.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "./client-bowce4Dj.js";
import "@supabase/supabase-js";
import "date-fns";
import "date-fns/locale/ar";
import "clsx";
import "tailwind-merge";
import "react-day-picker";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "@radix-ui/react-popover";
import "react-dom";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
function normName(s) {
  return normalizeSupplierName(s);
}
const KINDS = ["receivable", "payable"];
const STATUSES = ["current", "overdue", "settled"];
const statusTone = {
  current: "bg-info/15 text-info border-info/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
  settled: "bg-success/15 text-success border-success/30"
};
function DebtsPage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const [records, setRecords] = useOrgStorage("pharmledger.debts.v1", []);
  const [purchases, setPurchases] = useOrgStorage("pharmledger.purchases.v1", []);
  const [suppliersDir] = useOrgStorage("suppliers.records.v1", []);
  const [payments, setPayments] = useOrgStorage("pharmledger.supplier-payments.v1", []);
  useEffect(() => {
    const reconciled = reconcileSupplierAccounting(purchases, payments);
    const purchasesChanged = JSON.stringify(reconciled.purchases) !== JSON.stringify(purchases);
    const paymentsChanged = JSON.stringify(reconciled.payments) !== JSON.stringify(payments);
    if (purchasesChanged) setPurchases(reconciled.purchases);
    if (paymentsChanged) setPayments(reconciled.payments);
  }, [purchases, payments, setPurchases, setPayments]);
  useEffect(() => {
    setRecords((prev) => {
      const byId = new Map(prev.map((d) => [d.id, d]));
      let changed = false;
      const validAutoIds = /* @__PURE__ */ new Set();
      for (const p of purchases) {
        const autoId = `AUTO-PUR-${p.id}`;
        validAutoIds.add(autoId);
        const amount = Number(p.total) || 0;
        const paid = Math.min(amount, Number(p.paid) || 0);
        const outstanding = amount - paid;
        const dueAt = p.dueDate || p.date;
        const overdueDays = Math.floor((Date.now() - new Date(dueAt).getTime()) / 864e5);
        const status2 = outstanding <= 0 ? "settled" : overdueDays > 0 ? "overdue" : "current";
        const auto = {
          id: autoId,
          kind: "payable",
          party: p.supplier,
          reference: p.invoiceNumber || p.id,
          amount,
          paid,
          issuedAt: p.date,
          dueAt,
          status: status2
        };
        const existing = byId.get(autoId);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(auto)) {
          byId.set(autoId, auto);
          changed = true;
        }
      }
      for (const id of Array.from(byId.keys())) {
        if (id.startsWith("AUTO-PUR-") && !validAutoIds.has(id)) {
          byId.delete(id);
          changed = true;
        }
      }
      return changed ? Array.from(byId.values()) : prev;
    });
  }, [purchases, setRecords]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [supplier, setSupplier] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  useRef(null);
  const supplierOptions = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    const add = (s) => {
      const key = normName(s.en || s.ar);
      if (key && !map.has(key)) map.set(key, s);
    };
    suppliersDir.forEach((s) => add(s.name));
    purchases.forEach((p) => add(p.supplier));
    records.filter((d) => d.kind === "payable").forEach((d) => add(d.party));
    return Array.from(map.values()).sort((a, b) => (a.en || a.ar).localeCompare(b.en || b.ar));
  }, [suppliersDir, purchases, records]);
  const nextVoucherNo = useMemo(() => {
    const max = payments.reduce((m, p) => {
      const n = parseInt((p.voucherNo || "").replace(/\D/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `PAY-${String(max + 1).padStart(5, "0")}`;
  }, [payments]);
  const suppliers = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    supplierOptions.forEach((s) => {
      const key = supplierIdentity(s);
      if (key && !map.has(key)) map.set(key, s[lang] || s.en || s.ar);
    });
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label
    }));
  }, [supplierOptions, lang]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    let fromTs = null;
    let toTs = null;
    if (datePreset === "custom") {
      if (dateFrom) fromTs = new Date(dateFrom).getTime();
      if (dateTo) toTs = new Date(dateTo).getTime() + 864e5 - 1;
    } else if (datePreset !== "all") {
      fromTs = now - Number(datePreset) * 864e5;
    }
    return records.filter((d) => {
      if (kind !== "all" && d.kind !== kind) return false;
      if (status !== "all" && d.status !== status) return false;
      if (supplier !== "all" && ![d.party.en, d.party.ar].map(normName).includes(supplier)) return false;
      const ts = new Date(d.issuedAt).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (!q) return true;
      return d.id.toLowerCase().includes(q) || d.reference.toLowerCase().includes(q) || d.party.ar.includes(q) || d.party.en.toLowerCase().includes(q) || String(d.amount).includes(q);
    });
  }, [records, query, kind, status, supplier, datePreset, dateFrom, dateTo, lang]);
  const totals = useMemo(() => {
    const open2 = records.filter((d) => d.status !== "settled" && !String(d.id).startsWith("AUTO-PUR-"));
    const receivables = open2.filter((d) => d.kind === "receivable").reduce((s, d) => s + (d.amount - d.paid), 0);
    const manualPayables = open2.filter((d) => d.kind === "payable").reduce((s, d) => s + (d.amount - d.paid), 0);
    const purchasePayables = computePurchaseAging(purchases).total;
    const payables = manualPayables + purchasePayables;
    const overdueCount = open2.filter((d) => d.status === "overdue").length;
    return {
      receivables,
      payables,
      net: receivables - payables,
      overdueCount
    };
  }, [records, purchases]);
  const agingResult = useMemo(() => {
    const now = Date.now();
    let from = null;
    let to = null;
    if (datePreset === "custom") {
      if (dateFrom) from = /* @__PURE__ */ new Date(dateFrom + "T00:00:00");
      if (dateTo) to = /* @__PURE__ */ new Date(dateTo + "T23:59:59");
    } else if (datePreset !== "all") {
      from = new Date(now - Number(datePreset) * 864e5);
    }
    return computePurchaseAging(purchases, {
      supplierKey: supplier === "all" ? "" : supplier,
      from,
      to,
      now
    });
  }, [purchases, supplier, datePreset, dateFrom, dateTo]);
  const aging = agingResult.buckets;
  const [bucketDetail, setBucketDetail] = useState(null);
  const lotsByBucket = useMemo(() => {
    const now = Date.now();
    const map = {
      "1": [],
      "2": [],
      "3": [],
      "4": [],
      "5": [],
      "+5": []
    };
    for (const lot of agingResult.lots) {
      const monthStr = lot.purchase.month;
      const src = monthStr ? (() => {
        const [y, m] = monthStr.split("-").map(Number);
        return new Date(y, m - 1, 1);
      })() : new Date(lot.purchase.date);
      const end = new Date(now);
      const months = Math.max(0, (end.getFullYear() - src.getFullYear()) * 12 + (end.getMonth() - src.getMonth()));
      const key = months <= 1 ? "1" : months <= 2 ? "2" : months <= 3 ? "3" : months <= 4 ? "4" : months <= 5 ? "5" : "+5";
      map[key].push(lot);
    }
    return map;
  }, [agingResult.lots]);
  const buildExport = () => {
    const headers = ["id", "kind", "party", "reference", "amount", "paid", "balance", "issued", "due", "status"];
    const rows = filtered.map((d) => ({
      id: d.id,
      kind: d.kind,
      party: d.party.en,
      reference: d.reference,
      amount: d.amount,
      paid: d.paid,
      balance: d.amount - d.paid,
      issued: d.issuedAt,
      due: d.dueAt,
      status: d.status
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
      filename: `pharmledger-debts-${Date.now()}`,
      sheetName: "Debts",
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
      filename: `pharmledger-debts-${Date.now()}`,
      title: String(t("debtsTitle") || "Debts"),
      headers,
      rows,
      lang
    });
  };
  const allocateToPurchases = (supplierKey, amount) => {
    const allocated = allocatePaymentToPurchases(purchases, supplierKey, amount);
    setPurchases(allocated.purchases);
    return {
      allocations: allocated.allocations,
      leftover: allocated.leftover
    };
  };
  const addPayment = (payload) => {
    const id = `SP-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    const voucherNo = payload.voucherNo?.trim() || nextVoucherNo;
    const candidate = {
      ...payload,
      id,
      voucherNo
    };
    const allocation = allocateToPurchases(supplierIdentity(payload.supplier), payload.amount);
    const rec = {
      ...candidate,
      allocations: allocation.allocations
    };
    setPayments((prev) => [rec, ...prev]);
    const leftover = allocation.leftover;
    if (leftover > 0.01) {
      toast.warning(lang === "ar" ? `تم تسجيل السند ${voucherNo} — لم يتم تخصيص ${fmt(leftover)} لعدم وجود فواتير غير مسددة كافية` : `Voucher ${voucherNo} saved — ${fmt(leftover)} not allocated (no open invoices)`);
    } else {
      toast.success(lang === "ar" ? `تم تسجيل السند ${voucherNo}` : `Voucher ${voucherNo} saved`);
    }
    setPayOpen(false);
  };
  const addDebt = (d) => {
    const id = `DBT-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    setRecords((prev) => [{
      ...d,
      id
    }, ...prev]);
    toast.success(t("addedDebt"));
    setOpen(false);
  };
  const settle = (id) => {
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    setRecords((prev) => prev.map((d) => d.id === id ? {
      ...d,
      status: "settled",
      paid: d.amount,
      paidAt: d.paidAt || nowIso
    } : d));
    toast.success(t("addedDebt"));
  };
  const updateDebt = (id, patch) => {
    setRecords((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      const prevPaid = Number(d.paid) || 0;
      const nextPaid = Number(patch.paid) || 0;
      const paidAt = patch.paidAt || (nextPaid > prevPaid ? (/* @__PURE__ */ new Date()).toISOString() : d.paidAt);
      return {
        ...d,
        ...patch,
        paidAt
      };
    }));
    toast.success(t("updatedDebt"));
    setEditing(null);
  };
  const deleteDebt = (id) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRow"))) return;
    setRecords((prev) => prev.filter((d) => d.id !== id));
    toast.success(t("deletedRow"));
  };
  const sortable = useSortable(filtered, {
    reference: (d) => d.reference || d.id,
    party: (d) => d.party.en || d.party.ar,
    kind: (d) => d.kind,
    issueDate: (d) => d.issuedAt ? new Date(d.issuedAt) : null,
    dueDate: (d) => d.dueAt ? new Date(d.dueAt) : null,
    amount: (d) => d.amount,
    balance: (d) => d.amount - d.paid,
    status: (d) => d.status
  });
  const pg = usePagination(sortable.sorted);
  const visibleIds = useMemo(() => pg.pageItems.map((d) => d.id), [pg.pageItems]);
  const sel = useSelection(visibleIds);
  const deleteSelected = () => {
    if (sel.count === 0) return;
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteSelected"))) return;
    const ids = new Set(sel.ids);
    const removed = records.filter((d) => ids.has(d.id));
    setRecords((prev) => prev.filter((d) => !ids.has(d.id)));
    sel.clear();
    toast.success(t("deletedSelected"), {
      action: {
        label: t("undo"),
        onClick: () => {
          setRecords((prev) => [...removed, ...prev.filter((d) => !ids.has(d.id))]);
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
            /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-bold tracking-tight", children: /* @__PURE__ */ jsx("span", { className: "text-gradient", children: t("debtsTitle") }) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("debtsSubtitle") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("button", { onClick: exportXlsx, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(Download, { className: "size-4" }),
              t("exportExcel")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: exportPdf, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(FileText, { className: "size-4" }),
              t("exportPdf")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsx(Stat, { icon: ArrowDownLeft, label: t("receivables"), value: fmt(totals.receivables), suffix: t("currency"), accent: "success" }),
          /* @__PURE__ */ jsx(Stat, { icon: ArrowUpRight, label: t("payables"), value: fmt(totals.payables), suffix: t("currency"), accent: "warning" }),
          /* @__PURE__ */ jsx(Stat, { icon: Scale, label: t("netPosition"), value: fmt(totals.net), suffix: t("currency"), accent: totals.net >= 0 ? "primary" : "destructive" }),
          /* @__PURE__ */ jsx(Stat, { icon: AlertTriangle, label: t("overdueCount"), value: fmt(totals.overdueCount), accent: "destructive" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 animate-fade-in", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-4", children: t("agingBuckets") }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 lg:grid-cols-3 gap-3", children: [["1", "bucket1", "info"], ["2", "bucket2", "info"], ["3", "bucket3", "warning"], ["4", "bucket4", "warning"], ["5", "bucket5", "destructive"], ["+5", "bucket5plus", "destructive"]].map(([k, label, tone]) => /* @__PURE__ */ jsx(AgingCard, { label: t(label), value: aging[k], count: lotsByBucket[k].length, tone, fmt, t, onClick: () => setBucketDetail(k) }, k)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
            /* @__PURE__ */ jsx(Search, { className: cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3") }),
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("searchDebts"), className: cn("w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition", dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4") })
          ] }),
          /* @__PURE__ */ jsx(FilterSelect, { label: t("debtType"), value: kind, options: KINDS, onChange: (v) => setKind(v), t }),
          /* @__PURE__ */ jsx(FilterSelect, { label: t("status"), value: status, options: STATUSES, onChange: (v) => setStatus(v), t }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap", children: t("supplier") }),
            /* @__PURE__ */ jsxs(Select, { value: supplier, onValueChange: setSupplier, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 w-48 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("filterAll") }) }),
              /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-xl max-h-72", children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: t("filterAll") }),
                suppliers.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s.value, className: "text-xs", children: s.label }, s.value))
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap", children: lang === "ar" ? "الفترة" : "Period" }),
            /* @__PURE__ */ jsxs(Select, { value: datePreset, onValueChange: (v) => setDatePreset(v), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 w-44 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-xl", children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: t("filterAllTime") }),
                /* @__PURE__ */ jsx(SelectItem, { value: "30", className: "text-xs", children: lang === "ar" ? "آخر 30 يوماً" : "Last 30 days" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "60", className: "text-xs", children: lang === "ar" ? "آخر 60 يوماً" : "Last 60 days" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "90", className: "text-xs", children: lang === "ar" ? "آخر 90 يوماً" : "Last 90 days" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "120", className: "text-xs", children: lang === "ar" ? "آخر 120 يوماً" : "Last 120 days" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "150", className: "text-xs", children: lang === "ar" ? "آخر 150 يوماً" : "Last 150 days" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "custom", className: "text-xs", children: lang === "ar" ? "فترة مخصصة" : "Custom range" })
              ] })
            ] })
          ] }),
          datePreset === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(DatePickerInput, { value: dateFrom, onChange: setDateFrom, "aria-label": t("dateFrom"), className: "h-9 px-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring/40" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "→" }),
            /* @__PURE__ */ jsx(DatePickerInput, { value: dateTo, onChange: setDateTo, "aria-label": t("dateTo"), className: "h-9 px-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring/40" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-2 sm:p-4 animate-fade-in space-y-3", children: [
          /* @__PURE__ */ jsx(ShowAllToggle, { showAll: pg.showAll, total: pg.total, onToggle: pg.toggleShowAll }),
          /* @__PURE__ */ jsx(BulkActionsBar, { count: sel.count, total: filtered.length, allSelected: sel.allSelected, onSelectAll: sel.toggleAll, onClear: sel.clear, onDelete: deleteSelected }),
          /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto", children: [
            /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-xs text-muted-foreground uppercase tracking-wide border-b border-border", children: [
                /* @__PURE__ */ jsx("th", { className: "py-3 px-3 w-8", children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": t("selectAll"), checked: sel.allSelected, ref: (el) => {
                  if (el) el.indeterminate = sel.someSelected;
                }, onChange: sel.toggleAll, className: "size-4 rounded border-border accent-primary cursor-pointer" }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "reference", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("reference") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "party", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("party") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "kind", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("debtType") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3 hidden md:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "issueDate", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: lang === "ar" ? "تاريخ الإصدار" : "Issue Date" }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3 hidden md:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "dueDate", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("dueDate") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "amount", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("amount") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3 hidden lg:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "balance", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("balance") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-center font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "status", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "center", children: t("status") }) }),
                /* @__PURE__ */ jsx("th", {})
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border/60", children: [
                pg.pageItems.map((d) => {
                  const due = new Date(d.dueAt);
                  const days = Math.floor((Date.now() - due.getTime()) / 864e5);
                  const balance = d.amount - d.paid;
                  return /* @__PURE__ */ jsxs("tr", { className: cn("hover:bg-muted/30 transition", sel.isSelected(d.id) && "bg-primary/5"), children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": t("selectAll"), checked: sel.isSelected(d.id), onChange: () => sel.toggle(d.id), className: "size-4 rounded border-border accent-primary cursor-pointer" }) }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "font-semibold tabular text-xs", children: d.reference }),
                      /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground tabular", children: d.id })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-foreground/90 truncate max-w-[200px]", children: d.party[lang] }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border", d.kind === "receivable" ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"), children: [
                      d.kind === "receivable" ? /* @__PURE__ */ jsx(ArrowDownLeft, { className: "size-3" }) : /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-3" }),
                      t(d.kind)
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 hidden md:table-cell tabular text-muted-foreground", children: d.issuedAt ? new Date(d.issuedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    }) : "—" }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 hidden md:table-cell tabular", children: [
                      /* @__PURE__ */ jsx("div", { className: cn(d.status === "overdue" ? "text-destructive font-semibold" : "text-muted-foreground"), children: due.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      }) }),
                      d.status === "overdue" && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-destructive/80", children: [
                        "+",
                        days,
                        "d"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-muted-foreground", children: fmt(d.amount) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end hidden lg:table-cell font-bold tabular", children: /* @__PURE__ */ jsx("span", { className: d.kind === "receivable" ? "text-success" : "text-warning", children: fmt(balance) }) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-center", children: /* @__PURE__ */ jsx("span", { className: cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", statusTone[d.status]), children: t(d.status) }) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-2 text-end", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1", children: [
                      d.status !== "settled" && /* @__PURE__ */ jsxs("button", { onClick: () => settle(d.id), className: "h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-success/15 text-success border border-success/30 hover:bg-success/25 transition inline-flex items-center gap-1", children: [
                        /* @__PURE__ */ jsx(CheckCircle2, { className: "size-3" }),
                        t("markSettled")
                      ] }),
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEditing(d), className: "size-8 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center", title: t("edit"), "aria-label": t("edit"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }) }),
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => deleteDebt(d.id), className: "size-8 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center", title: t("delete"), "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }) })
                    ] }) })
                  ] }, d.id);
                }),
                filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 10, className: "py-12 text-center text-sm text-muted-foreground", children: t("noResults") }) })
              ] })
            ] }),
            /* @__PURE__ */ jsx(PaginationBar, { page: pg.page, totalPages: pg.totalPages, total: pg.total, from: pg.from, to: pg.to, onPageChange: pg.setPage, showAll: pg.showAll, onToggleShowAll: pg.toggleShowAll })
          ] }),
          filtered.length > 0 && /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 sm:p-5 animate-fade-in", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide", children: t("totals") }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [
              /* @__PURE__ */ jsx(SummaryBox, { label: t("count"), value: String(filtered.length) }),
              /* @__PURE__ */ jsx(SummaryBox, { label: t("totalAmount"), value: fmt(filtered.reduce((s, d) => s + d.amount, 0)), tone: "primary" }),
              /* @__PURE__ */ jsx(SummaryBox, { label: t("totalPaid"), value: fmt(filtered.reduce((s, d) => s + d.paid, 0)), tone: "success" }),
              /* @__PURE__ */ jsx(SummaryBox, { label: t("totalBalance"), value: fmt(filtered.reduce((s, d) => s + (d.amount - d.paid), 0)), tone: "warning" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    open && /* @__PURE__ */ jsx(AddDebtDialog, { onClose: () => setOpen(false), onSubmit: addDebt }),
    payOpen && /* @__PURE__ */ jsx(SupplierPaymentDialog, { onClose: () => setPayOpen(false), onSubmit: addPayment, suppliers: supplierOptions, nextVoucherNo }),
    editing && /* @__PURE__ */ jsx(AddDebtDialog, { initial: editing, onClose: () => setEditing(null), onSubmit: (patch) => updateDebt(editing.id, patch) }),
    bucketDetail && /* @__PURE__ */ jsx(AgingDetailsDialog, { bucketKey: bucketDetail, label: t({
      "1": "bucket1",
      "2": "bucket2",
      "3": "bucket3",
      "4": "bucket4",
      "5": "bucket5",
      "+5": "bucket5plus"
    }[bucketDetail]), lots: lotsByBucket[bucketDetail], onClose: () => setBucketDetail(null) })
  ] });
}
function AgingCard({
  label,
  value,
  count,
  tone,
  fmt,
  t,
  onClick
}) {
  const toneCls = {
    info: "text-info border-info/30 bg-info/5 hover:bg-info/10",
    warning: "text-warning border-warning/30 bg-warning/5 hover:bg-warning/10",
    destructive: "text-destructive border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
  };
  return /* @__PURE__ */ jsxs("button", { type: "button", onClick, className: cn("text-start rounded-xl border p-4 transition cursor-pointer w-full", toneCls[tone]), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground font-medium", children: label }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold tabular bg-background/40 border border-border/50 rounded-md px-1.5 py-0.5", children: count })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "font-bold tabular text-xl mt-1", children: [
      fmt(value),
      " ",
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
    ] })
  ] });
}
function AgingDetailsDialog({
  bucketKey,
  label,
  lots,
  onClose
}) {
  const {
    t,
    fmt,
    lang
  } = useApp();
  const monthOf = (p) => {
    if (p.month) return p.month;
    const d = new Date(p.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const total = lots.reduce((s, l) => s + l.remaining, 0);
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-4xl p-6 space-y-4 max-h-[85vh] flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold", children: [
          lang === "ar" ? "فواتير الفئة العمرية" : "Invoices in aging bucket",
          " — ",
          label
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
          lots.length,
          " ",
          lang === "ar" ? "فاتورة" : "invoices",
          " · ",
          fmt(total),
          " ",
          t("currency")
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-auto flex-1 -mx-2", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-card/95 backdrop-blur", children: /* @__PURE__ */ jsxs("tr", { className: "text-xs text-muted-foreground uppercase tracking-wide border-b border-border", children: [
        /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-2 px-3", children: t("invoiceNumber") || (lang === "ar" ? "رقم الفاتورة" : "Invoice #") }),
        /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-2 px-3", children: lang === "ar" ? "المورد" : "Supplier" }),
        /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-2 px-3", children: lang === "ar" ? "التاريخ" : "Date" }),
        /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-2 px-3", children: lang === "ar" ? "الشهر المحسوب" : "Computed Month" }),
        /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-2 px-3", children: lang === "ar" ? "الإجمالي" : "Total" }),
        /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-2 px-3", children: lang === "ar" ? "المسدد" : "Paid" }),
        /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-2 px-3", children: lang === "ar" ? "المتبقي" : "Remaining" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border/60", children: [
        lots.map((l) => {
          const p = l.purchase;
          const paid = (Number(p.total) || 0) - l.remaining;
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2 px-3 font-semibold tabular text-xs", children: p.invoiceNumber || p.id }),
            /* @__PURE__ */ jsx("td", { className: "py-2 px-3 truncate max-w-[180px]", children: p.supplier[lang] || p.supplier.en || p.supplier.ar }),
            /* @__PURE__ */ jsx("td", { className: "py-2 px-3 tabular text-muted-foreground", children: new Date(p.date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }) }),
            /* @__PURE__ */ jsx("td", { className: "py-2 px-3 tabular font-semibold text-primary", children: monthOf(p) }),
            /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end tabular", children: fmt(Number(p.total) || 0) }),
            /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end tabular text-success", children: fmt(Math.max(0, paid)) }),
            /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end tabular font-bold text-warning", children: fmt(l.remaining) })
          ] }, p.id);
        }),
        lots.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "py-10 text-center text-sm text-muted-foreground", children: t("noResults") }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-2 border-t border-border/40", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-5 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("close") || (lang === "ar" ? "إغلاق" : "Close") }) }),
    /* @__PURE__ */ jsx("span", { className: "hidden", children: bucketKey })
  ] }) });
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
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tabular tracking-tight", children: value }),
        suffix && /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: suffix })
      ] })
    ] })
  ] });
}
function FilterSelect({
  label,
  value,
  options,
  onChange,
  t
}) {
  const all = ["all", ...options];
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap", children: label }),
    /* @__PURE__ */ jsxs(Select, { value, onValueChange: onChange, children: [
      /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 w-40 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("filterAll") }) }),
      /* @__PURE__ */ jsx(SelectContent, { className: "rounded-xl", children: all.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o, className: "text-xs", children: o === "all" ? t("filterAll") : t(o) }, o)) })
    ] })
  ] });
}
function AddDebtDialog({
  onClose,
  onSubmit,
  initial
}) {
  const {
    t
  } = useApp();
  const [kind, setKind] = useState(initial?.kind ?? "receivable");
  const [party, setParty] = useState(initial?.party.en ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [days, setDays] = useState(initial ? String(Math.round((new Date(initial.dueAt).getTime() - new Date(initial.issuedAt).getTime()) / 864e5)) : "30");
  const [reference, setReference] = useState(initial?.reference ?? "");
  const submit = (ev) => {
    ev.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Amount must be > 0");
    if (!party.trim()) return toast.error("Party required");
    const issued = initial ? new Date(initial.issuedAt) : /* @__PURE__ */ new Date();
    const due = new Date(issued);
    due.setDate(due.getDate() + (Number(days) || 30));
    onSubmit({
      kind,
      party: {
        ar: party,
        en: party
      },
      reference: reference || `${kind === "receivable" ? "AR" : "AP"}-${Math.floor(Math.random() * 9e4) + 1e4}`,
      amount: n,
      paid: initial?.paid ?? 0,
      issuedAt: issued.toISOString(),
      dueAt: due.toISOString(),
      status: initial?.status ?? "current"
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: t("newDebt") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("debtsSubtitle") })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: t("debtType"), children: /* @__PURE__ */ jsx("select", { value: kind, onChange: (e) => setKind(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: KINDS.map((k) => /* @__PURE__ */ jsx("option", { value: k, children: t(k) }, k)) }) }),
      /* @__PURE__ */ jsx(Field, { label: t("party"), children: /* @__PURE__ */ jsx("input", { value: party, onChange: (e) => setParty(e.target.value), required: true, autoFocus: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("amount")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: amount, onChange: (e) => setAmount(e.target.value), min: 1, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("dueDate")} (${t("daysOverdue")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: days, onChange: (e) => setDays(e.target.value), min: 1, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("reference"), full: true, children: /* @__PURE__ */ jsx("input", { value: reference, onChange: (e) => setReference(e.target.value), placeholder: "AR/AP-xxxxx", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) })
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
function SummaryBox({
  label,
  value,
  tone = "primary"
}) {
  const toneCls = {
    primary: "text-primary border-primary/30 bg-primary/5",
    success: "text-success border-success/30 bg-success/5",
    warning: "text-warning border-warning/30 bg-warning/5",
    destructive: "text-destructive border-destructive/30 bg-destructive/5",
    info: "text-info border-info/30 bg-info/5"
  };
  return /* @__PURE__ */ jsxs("div", { className: cn("rounded-xl border p-4", toneCls[tone]), children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground font-medium", children: label }),
    /* @__PURE__ */ jsx("div", { className: "font-bold tabular text-xl mt-1", children: value })
  ] });
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
function SupplierPaymentDialog({
  onClose,
  onSubmit,
  suppliers,
  nextVoucherNo
}) {
  const {
    t,
    lang
  } = useApp();
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [voucherNo, setVoucherNo] = useState(nextVoucherNo);
  const [supplierKey, setSupplierKey] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [note, setNote] = useState("");
  const submit = (ev) => {
    ev.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return toast.error(lang === "ar" ? "أدخل قيمة صحيحة" : "Enter a valid amount");
    const supplier = suppliers.find((s) => (s.en || s.ar) === supplierKey);
    if (!supplier) return toast.error(lang === "ar" ? "اختر المورد" : "Select a supplier");
    onSubmit({
      voucherNo: voucherNo.trim() || void 0,
      date: new Date(date).toISOString(),
      supplier,
      amount: n,
      method,
      note: note.trim() || void 0
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: lang === "ar" ? "تسديد مورد" : "Supplier Payment" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: lang === "ar" ? "سيتم تخصيص المبلغ تلقائياً على فواتير المورد غير المسددة (الأقدم أولاً)" : "Amount auto-allocated to supplier's unpaid invoices (oldest first)" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: lang === "ar" ? "التاريخ" : "Date", children: /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: lang === "ar" ? "رقم السند" : "Voucher No.", children: /* @__PURE__ */ jsx("input", { value: voucherNo, onChange: (e) => setVoucherNo(e.target.value), placeholder: nextVoucherNo, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: lang === "ar" ? "المورد" : "Supplier", full: true, children: /* @__PURE__ */ jsxs(Select, { value: supplierKey, onValueChange: setSupplierKey, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "h-10 rounded-xl bg-input/40 border-border text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: lang === "ar" ? "اختر المورد" : "Select supplier" }) }),
        /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-xl max-h-72", children: [
          suppliers.length === 0 && /* @__PURE__ */ jsx(SelectItem, { value: "__none", disabled: true, className: "text-xs", children: lang === "ar" ? "لا يوجد موردون" : "No suppliers" }),
          suppliers.map((s) => {
            const v = s.en || s.ar;
            return /* @__PURE__ */ jsx(SelectItem, { value: v, className: "text-xs", children: lang === "ar" ? s.ar || s.en : s.en || s.ar }, v);
          })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: `${lang === "ar" ? "المبلغ" : "Amount"} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: amount, onChange: (e) => setAmount(e.target.value), min: 0.01, step: "0.01", required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: lang === "ar" ? "طريقة السداد" : "Payment Method", children: /* @__PURE__ */ jsxs("select", { value: method, onChange: (e) => setMethod(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
        /* @__PURE__ */ jsx("option", { value: "bank", children: lang === "ar" ? "بنك" : "Bank" }),
        /* @__PURE__ */ jsx("option", { value: "cash", children: lang === "ar" ? "نقدا" : "Cash" })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: lang === "ar" ? "ملاحظات" : "Notes", full: true, children: /* @__PURE__ */ jsx("input", { value: note, onChange: (e) => setNote(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "size-4" }),
        t("save")
      ] })
    ] })
  ] }) });
}
export {
  DebtsPage as component
};
