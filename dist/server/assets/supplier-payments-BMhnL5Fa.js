import { jsxs, jsx } from "react/jsx-runtime";
import { w as useApp, z as useOrgStorage, u as supplierIdentity, g as cn, c as DatePickerInput, p as normalizeSupplierName, d as allocatePaymentToPurchases } from "./router-CH3R9Cfm.js";
import { useState, useRef, useMemo } from "react";
import { Download, FileText, Upload, Trash2, Plus, Search, Pencil, Wallet, X } from "lucide-react";
import * as XLSX from "xlsx";
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
const normName = (s) => normalizeSupplierName(s);
function rollbackPurchases(purchases, allocations) {
  if (!allocations?.length) return purchases;
  const byId = new Map(allocations.map((a) => [a.purchaseId, a.amount]));
  return purchases.map((p) => {
    const rb = byId.get(p.id);
    if (!rb) return p;
    const total = Number(p.total) || 0;
    const paid = Math.max(0, (Number(p.paid) || 0) - rb);
    const status = total > 0 ? paid >= total - 0.01 ? "paid" : paid > 0 ? "partial" : "unpaid" : p.status;
    return {
      ...p,
      paid,
      status
    };
  });
}
function SupplierPaymentsPage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const [payments, setPayments] = useOrgStorage("pharmledger.supplier-payments.v1", []);
  const [purchases, setPurchases] = useOrgStorage("pharmledger.purchases.v1", []);
  const [suppliersDir] = useOrgStorage("suppliers.records.v1", []);
  const [query, setQuery] = useState("");
  const [supplier, setSupplier] = useState("all");
  const [method, setMethod] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const importRef = useRef(null);
  const supplierOptions = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    const add = (s) => {
      const key = normName(s.en || s.ar);
      if (key && !map.has(key)) map.set(key, s);
    };
    suppliersDir.forEach((s) => add(s.name));
    purchases.forEach((p) => add(p.supplier));
    payments.forEach((p) => add(p.supplier));
    return Array.from(map.values()).sort((a, b) => (a.en || a.ar).localeCompare(b.en || b.ar));
  }, [suppliersDir, purchases, payments]);
  const supplierFilters = useMemo(() => {
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
  const nextVoucherNo = useMemo(() => {
    const max = payments.reduce((m, p) => {
      const n = parseInt((p.voucherNo || "").replace(/\D/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `PAY-${String(max + 1).padStart(5, "0")}`;
  }, [payments]);
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
    return payments.filter((p) => {
      if (supplier !== "all" && ![p.supplier.en, p.supplier.ar].map(normName).includes(supplier)) return false;
      if (method !== "all" && p.method !== method) return false;
      const ts = new Date(p.date).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (!q) return true;
      return (p.voucherNo || "").toLowerCase().includes(q) || p.supplier.en.toLowerCase().includes(q) || p.supplier.ar.includes(q) || String(p.amount).includes(q) || (p.note || "").toLowerCase().includes(q);
    });
  }, [payments, query, supplier, method, datePreset, dateFrom, dateTo]);
  const sortable = useSortable(filtered, {
    voucherNo: (p) => p.voucherNo || "",
    date: (p) => p.date ? new Date(p.date) : null,
    supplier: (p) => p.supplier.en || p.supplier.ar,
    amount: (p) => p.amount,
    method: (p) => p.method
  });
  const pg = usePagination(sortable.sorted);
  const visibleIds = useMemo(() => pg.pageItems.map((p) => p.id), [pg.pageItems]);
  const sel = useSelection(visibleIds);
  const upsertPayment = (id, payload) => {
    const old = id ? payments.find((p) => p.id === id) : null;
    let working = purchases;
    if (old) working = rollbackPurchases(working, old.allocations);
    const allocation = allocatePaymentToPurchases(working, supplierIdentity(payload.supplier), payload.amount);
    working = allocation.purchases;
    const voucherNo = payload.voucherNo?.trim() || old?.voucherNo || nextVoucherNo;
    const rec = {
      id: id || `SP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      voucherNo,
      date: payload.date,
      supplier: payload.supplier,
      amount: payload.amount,
      method: payload.method,
      note: payload.note,
      allocations: allocation.allocations
    };
    setPurchases(working);
    setPayments((prev) => id ? prev.map((p) => p.id === id ? rec : p) : [rec, ...prev]);
    toast.success(lang === "ar" ? id ? "تم تحديث السند" : `تم تسجيل السند ${voucherNo}` : id ? "Voucher updated" : `Voucher ${voucherNo} saved`);
    if (allocation.leftover > 0.01) {
      toast.warning(lang === "ar" ? `لم يتم تخصيص ${fmt(allocation.leftover)} لعدم وجود فواتير غير مسددة كافية` : `${fmt(allocation.leftover)} not allocated (no open invoices)`);
    }
    setEditing(null);
    setAddOpen(false);
  };
  const deletePayment = (id) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRow"))) return;
    const pay = payments.find((p) => p.id === id);
    if (pay) setPurchases((prev) => rollbackPurchases(prev, pay.allocations));
    setPayments((prev) => prev.filter((p) => p.id !== id));
    toast.success(t("deletedRow"));
  };
  const deleteSelected = () => {
    if (sel.count === 0) return;
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteSelected"))) return;
    const ids = new Set(sel.ids);
    const toRemove = payments.filter((p) => ids.has(p.id));
    let working = purchases;
    for (const p of toRemove) working = rollbackPurchases(working, p.allocations);
    setPurchases(working);
    setPayments((prev) => prev.filter((p) => !ids.has(p.id)));
    sel.clear();
    toast.success(t("deletedSelected"));
  };
  const deleteAll = () => {
    if (!payments.length) {
      toast.info(lang === "ar" ? "لا توجد سندات للحذف" : "No vouchers to delete");
      return;
    }
    if (!window.confirm(lang === "ar" ? `سيتم حذف جميع سندات السداد (${payments.length}). هل تريد المتابعة؟` : `Delete all ${payments.length} supplier payment vouchers?`)) return;
    let working = purchases;
    for (const p of payments) working = rollbackPurchases(working, p.allocations);
    setPurchases(working);
    setPayments([]);
    toast.success(lang === "ar" ? "تم حذف جميع سندات السداد" : "All supplier payment vouchers deleted");
  };
  const buildExport = () => {
    const headers = ["voucherNo", "date", "supplier", "amount", "method", "note"];
    const rows = filtered.map((p) => ({
      voucherNo: p.voucherNo,
      date: p.date.slice(0, 10),
      supplier: p.supplier.en || p.supplier.ar,
      amount: p.amount,
      method: p.method,
      note: p.note || ""
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
      filename: `supplier-payments-${Date.now()}`,
      sheetName: "Payments",
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
      filename: `supplier-payments-${Date.now()}`,
      title: lang === "ar" ? "سندات سداد الموردين" : "Supplier Payments",
      headers,
      rows,
      lang
    });
  };
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      date: "2025-01-15",
      voucherNo: "PAY-00001",
      supplier: "Supplier Name",
      amount: 1e3,
      method: "bank",
      note: ""
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "supplier-payments-template.xlsx");
  };
  const handleImport = async (ev) => {
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
        const low = {};
        for (const k of Object.keys(r)) low[k.toLowerCase().trim()] = r[k];
        for (const k of keys) {
          const v = low[k.toLowerCase()];
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
      let counter = payments.reduce((m, p) => {
        const n = parseInt((p.voucherNo || "").replace(/\D/g, ""), 10);
        return Number.isFinite(n) && n > m ? n : m;
      }, 0);
      let leftoverTotal = 0;
      const created = [];
      let workingPurchases = purchases;
      for (const r of rows) {
        const supplierName = String(pick(r, ["supplier", "المورد", "اسم المورد"]) || "").trim();
        const amount = toNum(pick(r, ["amount", "المبلغ", "القيمة"]));
        if (!supplierName || !(amount > 0)) continue;
        const methodRaw = String(pick(r, ["method", "طريقة السداد", "طريقة"]) || "bank").toLowerCase().trim();
        const m = ["cash", "نقد", "نقدا", "نقداً"].includes(methodRaw) ? "cash" : "bank";
        const vGiven = String(pick(r, ["voucherNo", "voucher", "رقم السند", "السند"]) || "").trim();
        const voucherNo = vGiven || `PAY-${String(++counter).padStart(5, "0")}`;
        if (vGiven) counter = Math.max(counter, parseInt(vGiven.replace(/\D/g, ""), 10) || counter);
        const allocation = allocatePaymentToPurchases(workingPurchases, normName(supplierName), amount);
        workingPurchases = allocation.purchases;
        const rec = {
          id: `SP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}-${created.length}`,
          voucherNo,
          date: toIso(pick(r, ["date", "التاريخ"])),
          supplier: {
            ar: supplierName,
            en: supplierName
          },
          amount,
          method: m,
          note: String(pick(r, ["note", "notes", "ملاحظات"]) || "") || void 0,
          allocations: allocation.allocations
        };
        created.push(rec);
        leftoverTotal += allocation.leftover;
      }
      if (!created.length) {
        toast.error(lang === "ar" ? "لا توجد سندات صالحة في الملف" : "No valid payments in file");
        return;
      }
      setPurchases(workingPurchases);
      setPayments((prev) => [...created, ...prev]);
      toast.success((lang === "ar" ? `تم استيراد ${created.length} سند` : `${created.length} payments imported`) + (leftoverTotal > 0.01 ? ` — ${fmt(leftoverTotal)} ${lang === "ar" ? "غير مخصص" : "unallocated"}` : ""));
    } catch (err) {
      console.error(err);
      toast.error(t("importFailed"));
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };
  const totals = useMemo(() => {
    const sum = filtered.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const bank = filtered.filter((p) => p.method === "bank").reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const cash = filtered.filter((p) => p.method === "cash").reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return {
      sum,
      bank,
      cash,
      count: filtered.length
    };
  }, [filtered]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "px-4 lg:px-8 py-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-bold tracking-tight", children: /* @__PURE__ */ jsx("span", { className: "text-gradient", children: lang === "ar" ? "سندات سداد الموردين" : "Supplier Payment Vouchers" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: lang === "ar" ? "إدارة وتعديل سندات السداد المسجلة للموردين" : "Manage and edit recorded supplier payment vouchers" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("button", { onClick: exportXlsx, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(Download, { className: "size-4" }),
              t("exportExcel")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: exportPdf, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(FileText, { className: "size-4" }),
              t("exportPdf")
            ] }),
            /* @__PURE__ */ jsx("input", { ref: importRef, type: "file", accept: ".xlsx,.xls", className: "hidden", onChange: handleImport }),
            /* @__PURE__ */ jsxs("button", { onClick: () => importRef.current?.click(), className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(Upload, { className: "size-4" }),
              lang === "ar" ? "استيراد Excel" : "Import Excel"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: downloadTemplate, className: "h-10 px-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(FileText, { className: "size-4" }),
              lang === "ar" ? "قالب" : "Template"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: deleteAll, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-destructive/40 text-destructive hover:bg-destructive/10 transition", children: [
              /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
              lang === "ar" ? "حذف الكل" : "Clear All"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setAddOpen(true), className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition", children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              lang === "ar" ? "سند جديد" : "New Voucher"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsx(KpiBox, { label: lang === "ar" ? "عدد السندات" : "Vouchers", value: String(totals.count), tone: "primary" }),
          /* @__PURE__ */ jsx(KpiBox, { label: lang === "ar" ? "إجمالي السداد" : "Total Paid", value: `${fmt(totals.sum)} ${t("currency")}`, tone: "success" }),
          /* @__PURE__ */ jsx(KpiBox, { label: lang === "ar" ? "بنك" : "Bank", value: `${fmt(totals.bank)} ${t("currency")}`, tone: "info" }),
          /* @__PURE__ */ jsx(KpiBox, { label: lang === "ar" ? "نقدا" : "Cash", value: `${fmt(totals.cash)} ${t("currency")}`, tone: "warning" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
            /* @__PURE__ */ jsx(Search, { className: cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3") }),
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: lang === "ar" ? "بحث برقم السند، المورد، المبلغ..." : "Search by voucher, supplier, amount...", className: cn("w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition", dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap", children: t("supplier") }),
            /* @__PURE__ */ jsxs(Select, { value: supplier, onValueChange: setSupplier, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 w-48 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: t("filterAll") }) }),
              /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-xl max-h-72", children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: t("filterAll") }),
                supplierFilters.map((s) => /* @__PURE__ */ jsx(SelectItem, { value: s.value, className: "text-xs", children: s.label }, s.value))
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap", children: lang === "ar" ? "الطريقة" : "Method" }),
            /* @__PURE__ */ jsxs(Select, { value: method, onValueChange: (v) => setMethod(v), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 w-32 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-xl", children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", className: "text-xs", children: t("filterAll") }),
                /* @__PURE__ */ jsx(SelectItem, { value: "bank", className: "text-xs", children: lang === "ar" ? "بنك" : "Bank" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "cash", className: "text-xs", children: lang === "ar" ? "نقدا" : "Cash" })
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
            /* @__PURE__ */ jsx(DatePickerInput, { value: dateFrom, onChange: setDateFrom, className: "h-9 px-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring/40" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "→" }),
            /* @__PURE__ */ jsx(DatePickerInput, { value: dateTo, onChange: setDateTo, className: "h-9 px-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring/40" })
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
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "voucherNo", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: lang === "ar" ? "رقم السند" : "Voucher No." }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "date", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: lang === "ar" ? "التاريخ" : "Date" }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "supplier", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("supplier") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "amount", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: lang === "ar" ? "المبلغ" : "Amount" }) }),
                /* @__PURE__ */ jsx("th", { className: "text-center font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "method", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "center", children: lang === "ar" ? "الطريقة" : "Method" }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3 hidden md:table-cell", children: lang === "ar" ? "ملاحظات" : "Notes" }),
                /* @__PURE__ */ jsx("th", {})
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border/60", children: [
                pg.pageItems.map((p) => /* @__PURE__ */ jsxs("tr", { className: cn("hover:bg-muted/30 transition", sel.isSelected(p.id) && "bg-primary/5"), children: [
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": t("selectAll"), checked: sel.isSelected(p.id), onChange: () => sel.toggle(p.id), className: "size-4 rounded border-border accent-primary cursor-pointer" }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-semibold tabular text-xs", children: p.voucherNo }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 tabular text-muted-foreground", children: new Date(p.date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 truncate max-w-[220px]", children: p.supplier[lang] || p.supplier.en || p.supplier.ar }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-bold text-primary", children: fmt(p.amount) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-center", children: /* @__PURE__ */ jsx("span", { className: cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", p.method === "bank" ? "bg-info/15 text-info border-info/30" : "bg-warning/15 text-warning border-warning/30"), children: p.method === "bank" ? lang === "ar" ? "بنك" : "Bank" : lang === "ar" ? "نقدا" : "Cash" }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 hidden md:table-cell text-muted-foreground text-xs truncate max-w-[200px]", children: p.note || "—" }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-2 text-end", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEditing(p), className: "size-8 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center", title: t("edit"), "aria-label": t("edit"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }) }),
                    /* @__PURE__ */ jsx("button", { type: "button", onClick: () => deletePayment(p.id), className: "size-8 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center", title: t("delete"), "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }) })
                  ] }) })
                ] }, p.id)),
                filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "py-12 text-center text-sm text-muted-foreground", children: t("noResults") }) })
              ] })
            ] }),
            /* @__PURE__ */ jsx(PaginationBar, { page: pg.page, totalPages: pg.totalPages, total: pg.total, from: pg.from, to: pg.to, onPageChange: pg.setPage, showAll: pg.showAll, onToggleShowAll: pg.toggleShowAll })
          ] })
        ] })
      ] })
    ] }),
    (addOpen || editing) && /* @__PURE__ */ jsx(PaymentDialog, { initial: editing, suppliers: supplierOptions, nextVoucherNo, onClose: () => {
      setEditing(null);
      setAddOpen(false);
    }, onSubmit: (payload) => upsertPayment(editing?.id || null, payload) })
  ] });
}
function KpiBox({
  label,
  value,
  tone = "primary"
}) {
  const toneCls = {
    primary: "text-primary border-primary/30 bg-primary/5",
    success: "text-success border-success/30 bg-success/5",
    info: "text-info border-info/30 bg-info/5",
    warning: "text-warning border-warning/30 bg-warning/5"
  };
  return /* @__PURE__ */ jsxs("div", { className: cn("glass-card rounded-2xl p-5 border", toneCls[tone]), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-2", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: label }),
      /* @__PURE__ */ jsx(Wallet, { className: "size-4 opacity-70" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tabular tracking-tight", children: value })
  ] });
}
function PaymentDialog({
  initial,
  suppliers,
  nextVoucherNo,
  onClose,
  onSubmit
}) {
  const {
    t,
    lang
  } = useApp();
  const [date, setDate] = useState((initial?.date || (/* @__PURE__ */ new Date()).toISOString()).slice(0, 10));
  const [voucherNo, setVoucherNo] = useState(initial?.voucherNo || nextVoucherNo);
  const [supplierKey, setSupplierKey] = useState(initial ? initial.supplier.en || initial.supplier.ar : "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [method, setMethod] = useState(initial?.method || "bank");
  const [note, setNote] = useState(initial?.note || "");
  const submit = (ev) => {
    ev.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return toast.error(lang === "ar" ? "أدخل قيمة صحيحة" : "Enter a valid amount");
    const supplier = suppliers.find((s) => (s.en || s.ar) === supplierKey) || (supplierKey ? {
      ar: supplierKey,
      en: supplierKey
    } : null);
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
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: initial ? lang === "ar" ? "تعديل سند سداد" : "Edit Payment Voucher" : lang === "ar" ? "سند سداد جديد" : "New Payment Voucher" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: lang === "ar" ? "سيتم تخصيص المبلغ تلقائياً على فواتير المورد غير المسددة (الأقدم أولاً)" : "Amount auto-allocated to supplier's unpaid invoices (oldest first)" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("label", { className: "space-y-1.5 block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: lang === "ar" ? "التاريخ" : "Date" }),
        /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "space-y-1.5 block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: lang === "ar" ? "رقم السند" : "Voucher No." }),
        /* @__PURE__ */ jsx("input", { value: voucherNo, onChange: (e) => setVoucherNo(e.target.value), placeholder: nextVoucherNo, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "space-y-1.5 block col-span-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: lang === "ar" ? "المورد" : "Supplier" }),
        /* @__PURE__ */ jsxs(Select, { value: supplierKey, onValueChange: setSupplierKey, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-10 rounded-xl bg-input/40 border-border text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: lang === "ar" ? "اختر المورد" : "Select supplier" }) }),
          /* @__PURE__ */ jsxs(SelectContent, { className: "rounded-xl max-h-72", children: [
            suppliers.length === 0 && /* @__PURE__ */ jsx(SelectItem, { value: "__none", disabled: true, className: "text-xs", children: lang === "ar" ? "لا يوجد موردون" : "No suppliers" }),
            suppliers.map((s) => {
              const v = s.en || s.ar;
              return /* @__PURE__ */ jsx(SelectItem, { value: v, className: "text-xs", children: lang === "ar" ? s.ar || s.en : s.en || s.ar }, v);
            })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "space-y-1.5 block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: `${lang === "ar" ? "المبلغ" : "Amount"} (${t("currency")})` }),
        /* @__PURE__ */ jsx("input", { type: "number", value: amount, onChange: (e) => setAmount(e.target.value), min: 0.01, step: "0.01", required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "space-y-1.5 block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: lang === "ar" ? "طريقة السداد" : "Payment Method" }),
        /* @__PURE__ */ jsxs("select", { value: method, onChange: (e) => setMethod(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
          /* @__PURE__ */ jsx("option", { value: "bank", children: lang === "ar" ? "بنك" : "Bank" }),
          /* @__PURE__ */ jsx("option", { value: "cash", children: lang === "ar" ? "نقدا" : "Cash" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "space-y-1.5 block col-span-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: lang === "ar" ? "ملاحظات" : "Notes" }),
        /* @__PURE__ */ jsx("input", { value: note, onChange: (e) => setNote(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] })
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
export {
  SupplierPaymentsPage as component
};
