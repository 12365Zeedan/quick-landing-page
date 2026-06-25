import { jsx, jsxs } from "react/jsx-runtime";
import { w as useApp, z as useOrgStorage, c as DatePickerInput, g as cn } from "./router-CH3R9Cfm.js";
import { useMemo, useState, useEffect, useRef, Fragment } from "react";
import * as XLSX from "xlsx";
import { X, Boxes, Upload, FileSpreadsheet, Download, FileText, Plus, ShoppingCart, Package, CalendarClock, Search, ShieldCheck, Wallet, CreditCard, Banknote, Truck, Pencil, Trash2 } from "lucide-react";
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
const STATUSES = ["paid", "partial", "unpaid"];
const METHODS = ["cash", "card", "transfer", "insurance"];
const methodIcon = {
  cash: Banknote,
  card: CreditCard,
  transfer: Wallet,
  insurance: ShieldCheck
};
const statusTone = {
  paid: "bg-success/15 text-success border-success/30",
  partial: "bg-warning/15 text-warning border-warning/30",
  unpaid: "bg-destructive/15 text-destructive border-destructive/30"
};
function PurchasesPage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const [entries, setEntries] = useOrgStorage("pharmledger.purchases.v1", []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [periodBy, setPeriodBy] = useState("none");
  const [specificDate, setSpecificDate] = useState("");
  const [openSuppliers, setOpenSuppliers] = useState({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("pharmledger.open.newPurchase") === "1") {
        sessionStorage.removeItem("pharmledger.open.newPurchase");
        setOpen(true);
      }
      const editId = sessionStorage.getItem("pharmledger.open.editPurchase");
      if (editId) {
        const target = entries.find((e) => e.id === editId);
        if (target) {
          sessionStorage.removeItem("pharmledger.open.editPurchase");
          setEditing(target);
        }
      }
    } catch {
    }
  }, [entries]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (method !== "all" && e.method !== method) return false;
      if (specificDate) {
        const d = new Date(e.date);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (iso !== specificDate) return false;
      }
      if (!q) return true;
      return e.id.toLowerCase().includes(q) || e.invoiceNumber.toLowerCase().includes(q) || e.supplier.ar.includes(q) || e.supplier.en.toLowerCase().includes(q) || String(e.total).includes(q);
    });
  }, [entries, query, status, method, specificDate]);
  const sortable = useSortable(filtered, {
    invoiceNumber: (e) => e.invoiceNumber,
    vendorReference: (e) => e.vendorReference ?? "",
    supplier: (e) => e.supplier.en || e.supplier.ar,
    date: (e) => new Date(e.date),
    dueDate: (e) => new Date(e.dueDate),
    subtotal: (e) => e.subtotal,
    vat: (e) => e.vat,
    total: (e) => e.total,
    paid: (e) => e.paid,
    status: (e) => e.status
  });
  const sortedRows = sortable.sorted;
  const supplierGroups = useMemo(() => {
    if (groupBy !== "supplier") return [];
    const periodKey = (e) => {
      if (periodBy === "none") return null;
      const d = new Date(e.date);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (periodBy === "day") {
        const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return {
          key: iso,
          label: d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })
        };
      }
      if (periodBy === "month") {
        const k = `${y}-${String(m + 1).padStart(2, "0")}`;
        return {
          key: k,
          label: new Date(y, m, 1).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
            month: "long",
            year: "numeric"
          })
        };
      }
      const q = Math.floor(m / 3) + 1;
      return {
        key: `${y}-Q${q}`,
        label: `Q${q} ${y}`
      };
    };
    const map = /* @__PURE__ */ new Map();
    for (const e of sortedRows) {
      const k = e.supplier.en || e.supplier.ar || "—";
      const prev = map.get(k) ?? {
        label: e.supplier[lang] || k,
        rows: []
      };
      prev.rows.push(e);
      map.set(k, prev);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([key, v]) => {
      let periods = [];
      if (periodBy !== "none") {
        const pmap = /* @__PURE__ */ new Map();
        for (const e of v.rows) {
          const pk = periodKey(e);
          if (!pk) continue;
          const prev = pmap.get(pk.key) ?? {
            label: pk.label,
            rows: []
          };
          prev.rows.push(e);
          pmap.set(pk.key, prev);
        }
        periods = Array.from(pmap.entries()).sort((a, b) => a[0] < b[0] ? 1 : -1).map(([pk, pv]) => ({
          key: pk,
          label: pv.label,
          rows: pv.rows,
          sum: pv.rows.reduce((s, e) => s + e.total, 0),
          vatSum: pv.rows.reduce((s, e) => s + e.vat, 0),
          paidSum: pv.rows.reduce((s, e) => s + e.paid, 0),
          outstanding: pv.rows.reduce((s, e) => s + (e.total - e.paid), 0),
          count: pv.rows.length
        }));
      }
      return {
        key,
        label: v.label,
        rows: v.rows,
        sum: v.rows.reduce((s, e) => s + e.total, 0),
        vatSum: v.rows.reduce((s, e) => s + e.vat, 0),
        paidSum: v.rows.reduce((s, e) => s + e.paid, 0),
        outstanding: v.rows.reduce((s, e) => s + (e.total - e.paid), 0),
        count: v.rows.length,
        periods
      };
    });
  }, [sortedRows, groupBy, periodBy, lang]);
  const totals = useMemo(() => {
    const sum = filtered.reduce((s, e) => s + e.total, 0);
    const vatSum = filtered.reduce((s, e) => s + e.vat, 0);
    const outstanding = filtered.reduce((s, e) => s + (e.total - e.paid), 0);
    const items = filtered.reduce((s, e) => s + e.itemsCount, 0);
    const count = filtered.length;
    const avg = count ? Math.round(sum / count) : 0;
    return {
      sum,
      vatSum,
      outstanding,
      items,
      count,
      avg
    };
  }, [filtered]);
  const buildExport = () => {
    const headers = ["date", "invoiceNumber", "vendorReference", "supplier", "subtotal", "vat", "total", "paid", "status", "method", "dueOption", "dueDate"];
    const rows = filtered.map((e) => {
      const methodLabel = e.method === "transfer" ? "bank" : e.method;
      return {
        date: new Date(e.date).toISOString().slice(0, 10),
        invoiceNumber: e.invoiceNumber,
        vendorReference: e.vendorReference ?? "",
        supplier: e.supplier.en,
        subtotal: e.subtotal,
        vat: e.vat,
        total: e.total,
        paid: e.paid,
        status: e.status,
        method: methodLabel,
        dueOption: e.dueOption ?? "",
        dueDate: new Date(e.dueDate).toISOString().slice(0, 10)
      };
    });
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
      filename: `pharmledger-purchases-${Date.now()}`,
      sheetName: "Purchases",
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
      filename: `pharmledger-purchases-${Date.now()}`,
      title: String(t("purchasesTitle") || "Purchases"),
      headers,
      rows,
      lang
    });
  };
  const addEntry = (e) => {
    const id = `PO-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    setEntries((prev) => [{
      ...e,
      id
    }, ...prev]);
    toast.success(t("addedPurchase"));
    setOpen(false);
  };
  const updateEntry = (id, patch) => {
    setEntries((prev) => prev.map((x) => x.id === id ? {
      ...x,
      ...patch
    } : x));
    toast.success(t("updatedPurchase"));
    setEditing(null);
  };
  const deleteEntry = (id) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRow"))) return;
    setEntries((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("deletedRow"));
  };
  const pg = usePagination(sortable.sorted);
  const pgGroups = usePagination(supplierGroups);
  const visibleIds = useMemo(() => groupBy === "none" ? pg.pageItems.map((e) => e.id) : [], [pg.pageItems, groupBy]);
  const sel = useSelection(visibleIds);
  const deleteSelected = () => {
    if (sel.count === 0) return;
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteSelected"))) return;
    const ids = new Set(sel.ids);
    const removed = entries.filter((x) => ids.has(x.id));
    setEntries((prev) => prev.filter((x) => !ids.has(x.id)));
    sel.clear();
    toast.success(t("deletedSelected"), {
      action: {
        label: t("undo"),
        onClick: () => {
          setEntries((prev) => [...removed, ...prev.filter((x) => !ids.has(x.id))]);
          toast.success(t("restoredSelected"));
        }
      }
    });
  };
  const fileRef = useRef(null);
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      date: "2025-01-15",
      invoiceNumber: "SINV-12345",
      vendorReference: "REF-001",
      supplier: "Supplier Name",
      subtotal: 1e3,
      vat: 150,
      total: 1150,
      paid: 1150,
      status: "paid",
      method: "cash",
      dueOption: "30"
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, "purchases-template.xlsx");
  };
  const handleImportFile = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, {
        type: "array",
        cellDates: false
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
        if (typeof v === "number" && isFinite(v) && v > 0 && v < 8e4) {
          const d2 = XLSX.SSF.parse_date_code(v);
          if (d2) return new Date(Date.UTC(d2.y, d2.m - 1, d2.d)).toISOString();
        }
        if (v instanceof Date && !isNaN(v.getTime())) {
          return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate())).toISOString();
        }
        const s = String(v).trim();
        if (!s) return (/* @__PURE__ */ new Date()).toISOString();
        const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
        if (dmy) {
          let [, d2, m, y] = dmy;
          let yr = parseInt(y, 10);
          if (yr < 100) yr += 2e3;
          const dn = parseInt(d2, 10);
          const mn = parseInt(m, 10);
          if (mn >= 1 && mn <= 12 && dn >= 1 && dn <= 31) {
            const dt = new Date(Date.UTC(yr, mn - 1, dn));
            if (dt.getUTCDate() === dn && dt.getUTCMonth() === mn - 1) return dt.toISOString();
          }
        }
        const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (iso) {
          const dt = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
          if (!isNaN(dt.getTime())) return dt.toISOString();
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? (/* @__PURE__ */ new Date()).toISOString() : new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
      };
      const mapStatus = (v) => {
        const s = String(v).toLowerCase().trim();
        if (["paid", "مدفوع", "مدفوعة"].includes(s)) return "paid";
        if (["partial", "partially paid", "جزئي", "جزئية"].includes(s)) return "partial";
        return "unpaid";
      };
      const mapMethod = (v) => {
        const s = String(v).toLowerCase().trim();
        if (["bank", "transfer", "بنك", "تحويل"].includes(s)) return "transfer";
        return "cash";
      };
      const mapDueOption = (v) => {
        const s = String(v).toLowerCase().trim();
        if (["overdue", "over due", "متأخر"].includes(s)) return "overdue";
        const n = parseInt(s, 10);
        if ([0, 30, 60, 90, 120, 150].includes(n)) return String(n);
        return "30";
      };
      const extractSeq = (s, prefix) => {
        const m = new RegExp(`^${prefix}-(\\d+)$`).exec(s || "");
        return m ? parseInt(m[1], 10) : 0;
      };
      let maxInvSeq = entries.reduce((m, e) => Math.max(m, extractSeq(e.invoiceNumber, "SINV")), 0);
      let maxPoSeq = entries.reduce((m, e) => Math.max(m, extractSeq(e.id, "PO")), 0);
      const parsed = rows.map((r) => {
        const supplier = String(pick(r, ["supplier", "المورد", "اسم المورد"]) || "—");
        const subtotal = toNum(pick(r, ["subtotal", "بدون الضريبة", "بدون ضريبة", "صافي"]));
        const vat = toNum(pick(r, ["vat", "tax", "الضريبة", "ضريبة"]));
        const total = toNum(pick(r, ["total", "الإجمالي", "اجمالي", "grandtotal"]));
        const paid = toNum(pick(r, ["paid", "المدفوع", "المبلغ المدفوع"]));
        const status2 = mapStatus(pick(r, ["status", "paid status", "paidstatus", "الحالة"]) || (paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid"));
        const method2 = mapMethod(pick(r, ["method", "طريقة الدفع", "payment"]));
        const date = toIso(pick(r, ["date", "التاريخ", "تاريخ"]));
        const dueOption = mapDueOption(pick(r, ["dueOption", "due", "due date", "duedate", "تاريخ الاستحقاق", "الاستحقاق"]));
        const dueDate = computeDueDate(date, dueOption);
        const providedInv = String(pick(r, ["invoiceNumber", "invoice", "invoice no", "invoice no.", "رقم الفاتورة"]) || "").trim();
        const vendorReference = String(pick(r, ["vendorReference", "vendor reference", "vendor ref", "vendorref", "مرجع المورد"]) || "");
        return {
          _providedInv: providedInv,
          date,
          dueDate,
          dueOption,
          supplier: {
            ar: supplier,
            en: supplier
          },
          vendorReference: vendorReference || void 0,
          itemsCount: 1,
          subtotal,
          vat,
          total: total || subtotal + vat,
          paid,
          status: status2,
          method: method2
        };
      }).filter((e) => e.subtotal !== 0 || e.total !== 0).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((e) => {
        const {
          _providedInv: _ignored,
          ...rest
        } = e;
        maxPoSeq += 1;
        const invoiceNumber = `SINV-${String(++maxInvSeq).padStart(5, "0")}`;
        return {
          id: `PO-${String(maxPoSeq).padStart(5, "0")}`,
          invoiceNumber,
          ...rest
        };
      });
      if (!parsed.length) {
        toast.error(t("importFailed"));
      } else {
        setEntries((prev) => [...parsed.slice().reverse(), ...prev]);
        toast.success(`${parsed.length} ✓`);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("importFailed"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "px-4 lg:px-8 py-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-bold tracking-tight", children: /* @__PURE__ */ jsx("span", { className: "text-gradient", children: t("purchasesTitle") }) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("purchasesSubtitle") })
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
              t("newPurchaseInvoice")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsx(Stat, { icon: ShoppingCart, label: t("totalPurchasesValue"), value: fmt(totals.sum), suffix: t("currency"), accent: "primary" }),
          /* @__PURE__ */ jsx(Stat, { icon: FileText, label: t("invoicesCount"), value: fmt(totals.count), accent: "info" }),
          /* @__PURE__ */ jsx(Stat, { icon: Package, label: t("itemsPurchased"), value: fmt(totals.items), accent: "secondary" }),
          /* @__PURE__ */ jsx(Stat, { icon: CalendarClock, label: t("outstanding"), value: fmt(totals.outstanding), suffix: t("currency"), accent: totals.outstanding > 0 ? "warning" : "success" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
            /* @__PURE__ */ jsx(Search, { className: cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3") }),
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("searchPurchases"), className: cn("w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition", dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4") })
          ] }),
          /* @__PURE__ */ jsx(FilterSelect, { label: t("paymentStatus"), value: status, onChange: (v) => setStatus(v), options: [{
            value: "all",
            label: t("filterAll")
          }, ...STATUSES.map((s) => ({
            value: s,
            label: t(s)
          }))] }),
          /* @__PURE__ */ jsx(FilterSelect, { label: t("paymentMethod"), value: method, onChange: (v) => setMethod(v), options: [{
            value: "all",
            label: t("filterAll")
          }, ...METHODS.map((m) => ({
            value: m,
            label: t(m)
          }))] }),
          /* @__PURE__ */ jsx(FilterSelect, { label: lang === "ar" ? "تجميع" : "Group by", value: groupBy, onChange: (v) => setGroupBy(v), options: [{
            value: "none",
            label: lang === "ar" ? "بدون تجميع" : "No grouping"
          }, {
            value: "supplier",
            label: lang === "ar" ? "اسم المورد" : "Supplier"
          }] }),
          groupBy === "supplier" && /* @__PURE__ */ jsx(FilterSelect, { label: lang === "ar" ? "الفترة" : "Period", value: periodBy, onChange: (v) => setPeriodBy(v), options: [{
            value: "none",
            label: lang === "ar" ? "بدون فترة" : "No period"
          }, {
            value: "day",
            label: lang === "ar" ? "يومي" : "Day"
          }, {
            value: "month",
            label: lang === "ar" ? "شهري" : "Month"
          }, {
            value: "quarter",
            label: lang === "ar" ? "ربع سنوي" : "Quarter"
          }] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium uppercase tracking-wide", children: lang === "ar" ? "تاريخ" : "Date" }),
            /* @__PURE__ */ jsx(DatePickerInput, { value: specificDate, onChange: setSpecificDate, className: "h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }),
            specificDate && /* @__PURE__ */ jsx("button", { onClick: () => setSpecificDate(""), className: "h-9 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition", title: lang === "ar" ? "مسح" : "Clear", children: "×" })
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
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "invoiceNumber", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("invoiceNumber") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3 hidden md:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "vendorReference", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: "Vendor Ref" }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "supplier", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("supplier") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3 hidden md:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "date", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("date") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3 hidden lg:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "dueDate", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("dueDate") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3 hidden md:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "subtotal", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("subtotal") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3 hidden lg:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "vat", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("vatAmount") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "total", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("grandTotal") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "paid", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("paidAmount") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-center font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "status", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "center", children: t("paymentStatus") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("actions") })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border/60", children: [
                groupBy === "none" && pg.pageItems.map((e) => {
                  const MIcon = methodIcon[e.method];
                  const d = new Date(e.date);
                  const due = new Date(e.dueDate);
                  const overdue = e.status !== "paid" && due.getTime() < Date.now();
                  return /* @__PURE__ */ jsxs("tr", { className: cn("hover:bg-muted/30 transition", sel.isSelected(e.id) && "bg-primary/5"), children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": t("selectAll"), checked: sel.isSelected(e.id), onChange: () => sel.toggle(e.id), className: "size-4 rounded border-border accent-primary cursor-pointer" }) }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "font-semibold tabular text-xs", children: e.invoiceNumber }),
                      /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground tabular flex items-center gap-1", children: [
                        /* @__PURE__ */ jsx(MIcon, { className: "size-3" }),
                        e.id
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 hidden md:table-cell tabular text-xs text-muted-foreground", children: e.vendorReference || "—" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("div", { className: "size-7 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0", children: /* @__PURE__ */ jsx(Truck, { className: "size-3.5" }) }),
                      /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground/90 truncate max-w-[180px]", children: e.supplier[lang] })
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 hidden md:table-cell tabular text-muted-foreground", children: d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                      day: "2-digit",
                      month: "short"
                    }) }),
                    /* @__PURE__ */ jsx("td", { className: cn("py-3 px-3 hidden lg:table-cell tabular", overdue ? "text-destructive font-semibold" : "text-muted-foreground"), children: due.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                      day: "2-digit",
                      month: "short"
                    }) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end hidden md:table-cell tabular text-muted-foreground", children: fmt(e.subtotal) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end hidden lg:table-cell tabular text-muted-foreground", children: fmt(e.vat) }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular", children: [
                      fmt(e.total),
                      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal ms-1", children: t("currency") })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-muted-foreground", children: fmt(e.paid) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-center", children: /* @__PURE__ */ jsx("span", { className: cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", statusTone[e.status]), children: t(e.status) }) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEditing(e), className: "size-8 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center", title: t("edit"), "aria-label": t("edit"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }) }),
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => deleteEntry(e.id), className: "size-8 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center", title: t("delete"), "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }) })
                    ] }) })
                  ] }, e.id);
                }),
                groupBy === "supplier" && pgGroups.pageItems.map((g) => {
                  const expanded = openSuppliers[g.key] ?? false;
                  return /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsxs("tr", { onClick: () => setOpenSuppliers((s) => ({
                      ...s,
                      [g.key]: !expanded
                    })), className: "hover:bg-muted/40 transition cursor-pointer bg-muted/20", children: [
                      /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-center text-muted-foreground", children: expanded ? "−" : "+" }),
                      /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-semibold text-foreground/90", colSpan: 3, children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx(Truck, { className: "size-3.5 text-primary" }),
                        g.label
                      ] }) }),
                      /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-xs text-muted-foreground tabular hidden md:table-cell", children: [
                        fmt(g.count),
                        " ",
                        lang === "ar" ? "فاتورة" : "invoices"
                      ] }),
                      /* @__PURE__ */ jsx("td", { className: "py-3 px-3 hidden lg:table-cell" }),
                      /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end hidden md:table-cell tabular text-muted-foreground", children: "—" }),
                      /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end hidden lg:table-cell tabular text-muted-foreground", children: fmt(g.vatSum) }),
                      /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular", children: [
                        fmt(g.sum),
                        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal ms-1", children: t("currency") })
                      ] }),
                      /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-muted-foreground", children: fmt(g.paidSum) }),
                      /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-center text-xs text-warning tabular", children: fmt(g.outstanding) }),
                      /* @__PURE__ */ jsx("td", {})
                    ] }),
                    expanded && periodBy !== "none" && g.periods.map((p) => /* @__PURE__ */ jsxs("tr", { className: "bg-background/40", children: [
                      /* @__PURE__ */ jsx("td", {}),
                      /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-xs text-muted-foreground", colSpan: 3, children: /* @__PURE__ */ jsx("span", { className: "ps-6", children: p.label }) }),
                      /* @__PURE__ */ jsxs("td", { className: "py-2 px-3 text-xs text-muted-foreground tabular hidden md:table-cell", children: [
                        fmt(p.count),
                        " ",
                        lang === "ar" ? "فاتورة" : "invoices"
                      ] }),
                      /* @__PURE__ */ jsx("td", { className: "py-2 px-3 hidden lg:table-cell" }),
                      /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end hidden md:table-cell tabular text-muted-foreground", children: "—" }),
                      /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end hidden lg:table-cell tabular text-muted-foreground", children: fmt(p.vatSum) }),
                      /* @__PURE__ */ jsxs("td", { className: "py-2 px-3 text-end font-semibold tabular", children: [
                        fmt(p.sum),
                        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal ms-1", children: t("currency") })
                      ] }),
                      /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end tabular text-muted-foreground text-xs", children: fmt(p.paidSum) }),
                      /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-center text-xs text-warning tabular", children: fmt(p.outstanding) }),
                      /* @__PURE__ */ jsx("td", {})
                    ] }, `${g.key}::${p.key}`)),
                    expanded && periodBy === "none" && g.rows.map((e) => {
                      const d = new Date(e.date);
                      return /* @__PURE__ */ jsxs("tr", { className: "bg-background/40 hover:bg-muted/30 transition", children: [
                        /* @__PURE__ */ jsx("td", {}),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-xs ps-6 font-medium tabular", children: e.invoiceNumber }),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-xs text-muted-foreground hidden md:table-cell tabular", children: e.vendorReference || "—" }),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-xs text-muted-foreground", children: e.id }),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 hidden md:table-cell tabular text-muted-foreground text-xs", children: d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                          day: "2-digit",
                          month: "short"
                        }) }),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 hidden lg:table-cell" }),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end hidden md:table-cell tabular text-muted-foreground text-xs", children: fmt(e.subtotal) }),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end hidden lg:table-cell tabular text-muted-foreground text-xs", children: fmt(e.vat) }),
                        /* @__PURE__ */ jsxs("td", { className: "py-2 px-3 text-end font-semibold tabular text-xs", children: [
                          fmt(e.total),
                          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal ms-1", children: t("currency") })
                        ] }),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end tabular text-muted-foreground text-xs", children: fmt(e.paid) }),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-center", children: /* @__PURE__ */ jsx("span", { className: cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border", statusTone[e.status]), children: t(e.status) }) }),
                        /* @__PURE__ */ jsx("td", { className: "py-2 px-3 text-end", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1", children: [
                          /* @__PURE__ */ jsx("button", { type: "button", onClick: (ev) => {
                            ev.stopPropagation();
                            setEditing(e);
                          }, className: "size-7 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center", title: t("edit"), "aria-label": t("edit"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-3" }) }),
                          /* @__PURE__ */ jsx("button", { type: "button", onClick: (ev) => {
                            ev.stopPropagation();
                            deleteEntry(e.id);
                          }, className: "size-7 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center", title: t("delete"), "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3" }) })
                        ] }) })
                      ] }, `${g.key}::${e.id}`);
                    })
                  ] }, g.key);
                }),
                filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 12, className: "py-12 text-center text-sm text-muted-foreground", children: t("noResults") }) })
              ] }),
              filtered.length > 0 && /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
                /* @__PURE__ */ jsxs("td", { colSpan: 6, className: "py-3 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium", children: [
                  t("totalSelected"),
                  " · ",
                  fmt(totals.count)
                ] }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-muted-foreground text-xs", children: fmt(totals.vatSum) }),
                /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular text-base text-primary", children: [
                  fmt(totals.sum),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-muted-foreground text-xs", children: fmt(totals.sum - totals.outstanding) }),
                /* @__PURE__ */ jsx("td", {}),
                /* @__PURE__ */ jsx("td", {})
              ] }) })
            ] }),
            groupBy === "none" ? /* @__PURE__ */ jsx(PaginationBar, { page: pg.page, totalPages: pg.totalPages, total: pg.total, from: pg.from, to: pg.to, onPageChange: pg.setPage, showAll: pg.showAll, onToggleShowAll: pg.toggleShowAll }) : /* @__PURE__ */ jsx(PaginationBar, { page: pgGroups.page, totalPages: pgGroups.totalPages, total: pgGroups.total, from: pgGroups.from, to: pgGroups.to, onPageChange: pgGroups.setPage, showAll: pgGroups.showAll, onToggleShowAll: pgGroups.toggleShowAll })
          ] })
        ] })
      ] })
    ] }),
    open && /* @__PURE__ */ jsx(AddPurchaseDialog, { onClose: () => setOpen(false), onSubmit: addEntry }),
    editing && /* @__PURE__ */ jsx(AddPurchaseDialog, { initial: editing, onClose: () => setEditing(null), onSubmit: (patch) => updateEntry(editing.id, patch) })
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
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tabular tracking-tight", children: value }),
        suffix && /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: suffix })
      ] })
    ] })
  ] });
}
function FilterSelect({
  label,
  value,
  onChange,
  options
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium uppercase tracking-wide", children: label }),
    /* @__PURE__ */ jsxs(Select, { value, onValueChange: onChange, children: [
      /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 min-w-[10rem] bg-muted/50 border-border text-sm", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
      /* @__PURE__ */ jsx(SelectContent, { children: options.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
    ] })
  ] });
}
const DUE_OPTIONS = [{
  value: "0",
  label: "0 days",
  days: 0
}, {
  value: "30",
  label: "30 days",
  days: 30
}, {
  value: "60",
  label: "60 days",
  days: 60
}, {
  value: "90",
  label: "90 days",
  days: 90
}, {
  value: "120",
  label: "120 days",
  days: 120
}, {
  value: "150",
  label: "150 days",
  days: 150
}, {
  value: "overdue",
  label: "Over Due",
  days: "overdue"
}];
function computeDueDate(baseIso, opt) {
  const base = new Date(baseIso);
  const cfg = DUE_OPTIONS.find((d2) => d2.value === opt) ?? DUE_OPTIONS[1];
  if (cfg.days === "overdue") {
    const d2 = /* @__PURE__ */ new Date();
    d2.setDate(d2.getDate() - 1);
    return d2.toISOString();
  }
  const d = new Date(base);
  d.setDate(d.getDate() + cfg.days);
  return d.toISOString();
}
function AddPurchaseDialog({
  onClose,
  onSubmit,
  initial
}) {
  const {
    t,
    lang
  } = useApp();
  const [suppliersList] = useOrgStorage("suppliers.records.v1", []);
  const supplierOptions = useMemo(() => {
    const seen = /* @__PURE__ */ new Set();
    const opts = [];
    for (const s of suppliersList) {
      const name = (s.name?.[lang] || s.name?.en || s.name?.ar || "").trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        opts.push(name);
      }
    }
    return opts.sort((a, b) => a.localeCompare(b, lang === "ar" ? "ar" : "en"));
  }, [suppliersList, lang]);
  const toDateInput = (iso) => {
    const d = iso ? new Date(iso) : /* @__PURE__ */ new Date();
    return d.toISOString().slice(0, 10);
  };
  const [date, setDate] = useState(toDateInput(initial?.date));
  const [invoiceNumber, setInvoiceNumber] = useState(initial?.invoiceNumber ?? "");
  const [vendorReference, setVendorReference] = useState(initial?.vendorReference ?? "");
  const [supplier, setSupplier] = useState(initial?.supplier[lang] ?? initial?.supplier.en ?? "");
  const [subtotal, setSubtotal] = useState(initial ? String(initial.subtotal) : "");
  const [vatInput, setVatInput] = useState(initial ? String(initial.vat) : "");
  const [totalInput, setTotalInput] = useState(initial ? String(initial.total) : "");
  const [paidAmount, setPaidAmount] = useState(initial ? String(initial.paid) : "");
  const [status, setStatus] = useState(initial?.status ?? "unpaid");
  const [payMethod, setPayMethod] = useState(initial?.method === "transfer" ? "bank" : "cash");
  const [dueOption, setDueOption] = useState(initial?.dueOption ?? "30");
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const sub = Number(subtotal) || 0;
  const vat = Number(vatInput) || 0;
  const total = totalInput !== "" ? Number(totalInput) || 0 : sub + vat;
  const submit = (ev) => {
    ev.preventDefault();
    const rawPaid = Number(paidAmount) || 0;
    const paid = status === "paid" ? total : status === "partial" ? total < 0 ? Math.max(rawPaid, total) : Math.min(rawPaid, total) : 0;
    if (status === "partial" && paid === 0) return toast.error(t("paidAmount"));
    const method = payMethod === "bank" ? "transfer" : "cash";
    const dateIso = new Date(date).toISOString();
    onSubmit({
      date: dateIso,
      dueDate: computeDueDate(dateIso, dueOption),
      dueOption,
      supplier: (() => {
        const rec = suppliersList.find((s) => s.name?.ar === supplier || s.name?.en === supplier);
        if (rec) return {
          ar: rec.name.ar || supplier,
          en: rec.name.en || supplier
        };
        return {
          ar: supplier || "—",
          en: supplier || "—"
        };
      })(),
      invoiceNumber: invoiceNumber || `SINV-${Math.floor(Math.random() * 9e4) + 1e4}`,
      vendorReference: vendorReference || void 0,
      itemsCount: initial?.itemsCount ?? 1,
      subtotal: round2(sub),
      vat: round2(vat),
      total: round2(total),
      paid: round2(paid),
      status,
      method
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-2xl p-6 space-y-5 my-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: t("newPurchaseInvoice") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("purchasesSubtitle") })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: t("date"), children: /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("invoiceNumber"), children: /* @__PURE__ */ jsx("input", { value: invoiceNumber, onChange: (e) => setInvoiceNumber(e.target.value), placeholder: "SINV-xxxxx", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: "Vendor reference", children: /* @__PURE__ */ jsx("input", { value: vendorReference, onChange: (e) => setVendorReference(e.target.value), placeholder: "REF-...", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("supplier"), children: /* @__PURE__ */ jsxs("select", { value: supplier, onChange: (e) => setSupplier(e.target.value), required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
        /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: supplierOptions.length === 0 ? lang === "ar" ? "لا يوجد موردين — أضف من شاشة الموردين" : "No suppliers — add from Suppliers page" : lang === "ar" ? "اختر مورد" : "Select supplier" }),
        supplier && !supplierOptions.includes(supplier) && /* @__PURE__ */ jsx("option", { value: supplier, children: supplier }),
        supplierOptions.map((name) => /* @__PURE__ */ jsx("option", { value: name, children: name }, name))
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("subtotal")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: subtotal, onChange: (e) => setSubtotal(e.target.value), required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("vatAmount")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: vatInput, onChange: (e) => setVatInput(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("grandTotal")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: totalInput, onChange: (e) => setTotalInput(e.target.value), placeholder: (sub + vat).toFixed(2), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("paidAmount")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", value: status === "paid" ? total || "" : status === "unpaid" ? 0 : paidAmount, onChange: (e) => setPaidAmount(e.target.value), readOnly: status === "paid" || status === "unpaid", className: cn("w-full h-10 rounded-xl border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40", status === "paid" || status === "unpaid" ? "bg-muted/60 font-semibold" : "bg-input/40") }) }),
      /* @__PURE__ */ jsx(Field, { label: t("paymentStatus"), children: /* @__PURE__ */ jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
        /* @__PURE__ */ jsx("option", { value: "paid", children: t("paid") }),
        /* @__PURE__ */ jsx("option", { value: "partial", children: t("partial") }),
        /* @__PURE__ */ jsx("option", { value: "unpaid", children: t("unpaid") })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: t("paymentMethod"), children: /* @__PURE__ */ jsxs("select", { value: payMethod, onChange: (e) => setPayMethod(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
        /* @__PURE__ */ jsx("option", { value: "cash", children: t("cash") }),
        /* @__PURE__ */ jsx("option", { value: "bank", children: t("bank") })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: t("dueDate"), children: /* @__PURE__ */ jsx("select", { value: dueOption, onChange: (e) => setDueOption(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: DUE_OPTIONS.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, children: o.label }, o.value)) }) })
    ] }),
    (sub !== 0 || vat !== 0 || total !== 0) && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5 tabular", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("subtotal") }),
        /* @__PURE__ */ jsxs("span", { children: [
          sub.toLocaleString(),
          " ",
          t("currency")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("vatAmount") }),
        /* @__PURE__ */ jsxs("span", { children: [
          vat.toLocaleString(),
          " ",
          t("currency")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-sm pt-1.5 border-t border-border/60", children: [
        /* @__PURE__ */ jsx("span", { children: t("grandTotal") }),
        /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
          total.toLocaleString(),
          " ",
          t("currency")
        ] })
      ] }),
      status !== "unpaid" && /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-1.5 border-t border-border/60", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("outstanding") }),
        /* @__PURE__ */ jsxs("span", { children: [
          (total - (status === "paid" ? total : Number(paidAmount) || 0)).toLocaleString(),
          " ",
          t("currency")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Boxes, { className: "size-4" }),
        t("save")
      ] })
    ] })
  ] }) });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "space-y-1.5 block", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: label }),
    children
  ] });
}
export {
  AddPurchaseDialog,
  PurchasesPage as component
};
