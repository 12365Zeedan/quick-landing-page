import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { w as useApp, c as DatePickerInput, y as useOrg, C as vatOf, g as cn, o as nextReference } from "./router-CH3R9Cfm.js";
import { useState, useRef, useEffect, useMemo } from "react";
import { X, Users, Banknote, Building2, TicketPercent, Receipt, TrendingUp, FileSpreadsheet, Plus, Upload, Download, FileText, Search, Layers, RotateCcw, Calendar, Pencil, Trash2 } from "lucide-react";
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
const startOfWeek = (d) => {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};
const groupKeyOf = (iso, mode) => {
  const d = new Date(iso);
  if (mode === "day") return iso.slice(0, 10);
  if (mode === "week") return startOfWeek(d).toISOString().slice(0, 10);
  if (mode === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (mode === "year") return String(d.getFullYear());
  return "";
};
const net = (e) => e.cash + e.bank;
const gross = (e) => e.cash + e.bank + e.discount;
const STORAGE_PREFIX = "pharmledger.revenue.entries.v2";
const storageKeyFor = (orgId) => orgId ? `${STORAGE_PREFIX}.${orgId}` : `${STORAGE_PREFIX}.__none__`;
function loadEntriesFor(orgId) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKeyFor(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.warn("Failed to load revenue entries", e);
  }
  return [];
}
function RevenuePage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const {
    currentOrg
  } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const [entries, setEntries] = useState([]);
  const [hydratedFor, setHydratedFor] = useState(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("pharmledger.open.newRevenue") === "1") {
        sessionStorage.removeItem("pharmledger.open.newRevenue");
        setOpen(true);
      }
    } catch {
    }
  }, []);
  useEffect(() => {
    setEntries(loadEntriesFor(orgId));
    setHydratedFor(orgId);
  }, [orgId]);
  useEffect(() => {
    if (hydratedFor !== orgId) return;
    try {
      localStorage.setItem(storageKeyFor(orgId), JSON.stringify(entries));
    } catch (e) {
      console.warn("Failed to save revenue entries", e);
    }
  }, [entries, hydratedFor, orgId]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [groupMode, setGroupMode] = useState("none");
  const resetFilters = () => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setMinAmt("");
    setMaxAmt("");
    setPayFilter("all");
  };
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateFrom ? (/* @__PURE__ */ new Date(dateFrom + "T00:00:00")).getTime() : -Infinity;
    const to = dateTo ? (/* @__PURE__ */ new Date(dateTo + "T23:59:59")).getTime() : Infinity;
    const minN = minAmt === "" ? -Infinity : Number(minAmt);
    const maxN = maxAmt === "" ? Infinity : Number(maxAmt);
    return entries.filter((e) => {
      if (q) {
        const hay = e.id.toLowerCase() + " " + e.reference.toLowerCase() + " " + e.date.toLowerCase() + " " + String(net(e));
        if (!hay.includes(q)) return false;
      }
      const ts = new Date(e.date).getTime();
      if (ts < from || ts > to) return false;
      if (payFilter === "cash" && e.cash <= 0) return false;
      if (payFilter === "bank" && e.bank <= 0) return false;
      if (payFilter === "wasfaty" && (e.wasfaty || 0) <= 0) return false;
      const n = net(e);
      if (n < minN || n > maxN) return false;
      return true;
    });
  }, [entries, query, dateFrom, dateTo, minAmt, maxAmt, payFilter]);
  const totals = useMemo(() => {
    const cash = filtered.reduce((s, e) => s + e.cash, 0);
    const bank = filtered.reduce((s, e) => s + e.bank, 0);
    const discount = filtered.reduce((s, e) => s + e.discount, 0);
    const wasfaty = filtered.reduce((s, e) => s + (e.wasfaty || 0), 0);
    const customers = filtered.reduce((s, e) => s + e.customers, 0);
    const vat = filtered.reduce((s, e) => s + (e.vat ?? vatOf(e)), 0);
    const netSum = cash + bank;
    const grossSum = netSum + discount;
    const avg = customers ? Math.round(netSum / customers) : 0;
    return {
      netSum,
      grossSum,
      cash,
      bank,
      discount,
      wasfaty,
      customers,
      count: filtered.length,
      avg,
      vat
    };
  }, [filtered]);
  const groups = useMemo(() => {
    if (groupMode === "none") return [];
    const map = /* @__PURE__ */ new Map();
    for (const e of filtered) {
      const k = groupKeyOf(e.date, groupMode);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    const formatLabel = (k) => {
      if (groupMode === "year") return k;
      if (groupMode === "month") {
        const [y, m] = k.split("-").map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
          month: "long",
          year: "numeric"
        });
      }
      const d = new Date(k);
      if (groupMode === "week") {
        const end = new Date(d);
        end.setDate(end.getDate() + 6);
        const opts = {
          day: "2-digit",
          month: "short"
        };
        return `${d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", opts)} — ${end.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", opts)}`;
      }
      return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    };
    return Array.from(map.entries()).sort((a, b) => a[0] < b[0] ? 1 : -1).map(([key, rows]) => {
      const cash = rows.reduce((s, e) => s + e.cash, 0);
      const bank = rows.reduce((s, e) => s + e.bank, 0);
      const discount = rows.reduce((s, e) => s + e.discount, 0);
      const wasfaty = rows.reduce((s, e) => s + (e.wasfaty || 0), 0);
      const vat = rows.reduce((s, e) => s + (e.vat ?? vatOf(e)), 0);
      const customers = rows.reduce((s, e) => s + e.customers, 0);
      return {
        key,
        label: formatLabel(key),
        rows,
        cash,
        bank,
        discount,
        wasfaty,
        vat,
        customers,
        gross: cash + bank + discount,
        net: cash + bank
      };
    });
  }, [filtered, groupMode, lang]);
  const buildExport = () => {
    const headers = ["id", "date", "customers", "cash", "bank", "discount", "wasfaty", "vat", "gross", "net", "reference", "notes"];
    const rows = filtered.map((e) => ({
      id: e.id,
      date: e.date.slice(0, 10),
      customers: e.customers,
      cash: e.cash,
      bank: e.bank,
      discount: e.discount,
      wasfaty: e.wasfaty || 0,
      vat: e.vat ?? vatOf(e),
      gross: gross(e),
      net: net(e),
      reference: e.reference,
      notes: (e.notes ?? "").replace(/\n/g, " ")
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
      filename: `pharmledger-revenue-${Date.now()}`,
      sheetName: "Revenue",
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
      filename: `pharmledger-revenue-${Date.now()}`,
      title: String(t("revenueTitle") || "Revenue"),
      headers,
      rows,
      lang
    });
  };
  const addEntry = (e) => {
    const id = nextReference(entries);
    const reference = `INV-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    setEntries((prev) => [{
      ...e,
      id,
      reference
    }, ...prev]);
    toast.success(t("addedRevenue"));
    setOpen(false);
  };
  const updateEntry = (id, patch) => {
    setEntries((prev) => prev.map((x) => x.id === id ? {
      ...x,
      ...patch
    } : x));
    toast.success(t("updatedRevenue"));
    setEditing(null);
  };
  const deleteEntry = (id) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRevenue"))) return;
    setEntries((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("deletedRevenue"));
  };
  const sortable = useSortable(filtered, {
    reference: (e) => e.reference || e.id,
    date: (e) => new Date(e.date),
    customers: (e) => e.customers,
    cash: (e) => e.cash,
    bank: (e) => e.bank,
    discount: (e) => e.discount,
    gross: (e) => gross(e),
    net: (e) => net(e),
    wasfaty: (e) => e.wasfaty || 0,
    vat: (e) => e.vat ?? vatOf(e)
  });
  const pgRows = usePagination(sortable.sorted);
  const pgGroups = usePagination(groups);
  const visibleIds = useMemo(() => groupMode === "none" ? pgRows.pageItems.map((e) => e.id) : [], [pgRows.pageItems, groupMode]);
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
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["date", "customers", "cash", "bank", "discount", "wasfaty", "vat", "notes"], ["2026-05-19", 45, 1200, 1800, 50, 600, 0, "Amounts are pre-VAT; enter vat manually"], ["2026-05-18", 38, 950, 1400, 0, 0, "", ""]]);
    ws["!cols"] = [{
      wch: 12
    }, {
      wch: 12
    }, {
      wch: 10
    }, {
      wch: 10
    }, {
      wch: 10
    }, {
      wch: 12
    }, {
      wch: 10
    }, {
      wch: 28
    }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue");
    XLSX.writeFile(wb, "revenue-template.xlsx");
  };
  const handleImportFile = async (file) => {
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
      const norm = (k) => k.toString().trim().toLowerCase();
      const pick = (row, keys) => {
        for (const k of Object.keys(row)) {
          if (keys.includes(norm(k))) return row[k];
        }
        return void 0;
      };
      const toNum = (v) => {
        if (v === null || v === void 0 || v === "") return 0;
        const n = Number(String(v).replace(/[,\s]/g, ""));
        return Number.isFinite(n) ? n : 0;
      };
      const toIsoDate = (v) => {
        if (typeof v === "number" && isFinite(v)) {
          const d = XLSX.SSF.parse_date_code(v);
          if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString();
        }
        if (v instanceof Date && !isNaN(v.getTime())) {
          return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate())).toISOString();
        }
        if (typeof v === "string" && v.trim()) {
          const s = v.trim();
          const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
          if (dmy) {
            let [, dd, mm, yy] = dmy;
            let y = parseInt(yy, 10);
            if (y < 100) y += 2e3;
            const m = parseInt(mm, 10);
            const d2 = parseInt(dd, 10);
            if (m >= 1 && m <= 12 && d2 >= 1 && d2 <= 31) {
              const dt = new Date(Date.UTC(y, m - 1, d2));
              if (dt.getUTCDate() === d2 && dt.getUTCMonth() === m - 1) return dt.toISOString();
            }
          }
          const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (iso) {
            return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3])).toISOString();
          }
          const d = new Date(s);
          if (!isNaN(d.getTime())) {
            return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
          }
        }
        return null;
      };
      const parsed = [];
      let counter = entries.reduce((m, e) => {
        const n = Number(e.id.replace(/\D/g, "")) || 0;
        return n > m ? n : m;
      }, 0);
      for (const row of rows) {
        const iso = toIsoDate(pick(row, ["date", "التاريخ", "تاريخ"]));
        if (!iso) continue;
        const cash = toNum(pick(row, ["cash", "نقدي", "نقد"]));
        const bank = toNum(pick(row, ["bank", "بنك", "تحويل"]));
        const discount = toNum(pick(row, ["discount", "خصم", "خصومات"]));
        const wasfaty = toNum(pick(row, ["wasfaty", "وصفتي", "مبيعات وصفتي"]));
        const customers = toNum(pick(row, ["customers", "عملاء", "عدد العملاء"]));
        if (cash + bank + wasfaty <= 0) continue;
        counter += 1;
        const notesVal = pick(row, ["notes", "ملاحظات", "ملاحظة"]);
        const refVal = pick(row, ["reference", "مرجع", "المرجع"]);
        const vatVal = toNum(pick(row, ["vat", "ضريبة", "ضريبة القيمة المضافة"]));
        parsed.push({
          id: `RV-${String(counter).padStart(5, "0")}`,
          date: iso,
          customers: Math.max(0, Math.round(customers)),
          cash,
          bank,
          discount,
          wasfaty,
          vat: vatVal,
          reference: refVal ? String(refVal) : `INV-${String(Math.floor(Math.random() * 9e4) + 1e4)}`,
          notes: notesVal ? String(notesVal) : void 0
        });
      }
      if (parsed.length === 0) {
        toast.error(t("importNoRows"));
        return;
      }
      setEntries((prev) => [...parsed, ...prev]);
      toast.success(t("importedRevenue").replace("{n}", String(parsed.length)));
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
            /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-bold tracking-tight", children: /* @__PURE__ */ jsx("span", { className: "text-gradient", children: t("revenueTitle") }) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("revenueSubtitle") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: ".xlsx,.xls,.csv", className: "hidden", onChange: (e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
            } }),
            /* @__PURE__ */ jsxs("button", { onClick: downloadTemplate, className: "h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", title: t("downloadTemplate"), children: [
              /* @__PURE__ */ jsx(FileSpreadsheet, { className: "size-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("downloadTemplate") })
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => fileRef.current?.click(), className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-info/10 text-info border border-info/30 hover:bg-info/20 transition", children: [
              /* @__PURE__ */ jsx(Upload, { className: "size-4" }),
              t("importExcel")
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
              t("newRevenue")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-6 gap-4", children: [
          /* @__PURE__ */ jsx(Stat, { icon: TrendingUp, label: t("grossRevenue"), value: fmt(totals.grossSum), suffix: t("currency"), accent: "primary" }),
          /* @__PURE__ */ jsx(Stat, { icon: Receipt, label: t("netRevenue"), value: fmt(totals.netSum), suffix: t("currency"), accent: "success" }),
          /* @__PURE__ */ jsx(Stat, { icon: Receipt, label: t("vatAmount"), value: fmt(totals.vat), suffix: t("currency"), accent: "warning" }),
          /* @__PURE__ */ jsx(Stat, { icon: FileSpreadsheet, label: t("wasfatySales"), value: fmt(totals.wasfaty), suffix: t("currency"), accent: "warning" }),
          /* @__PURE__ */ jsx(Stat, { icon: Users, label: t("customersCount"), value: fmt(totals.customers), accent: "info" }),
          /* @__PURE__ */ jsx(Stat, { icon: TicketPercent, label: t("totalDiscounts"), value: fmt(totals.discount), suffix: t("currency"), accent: "secondary" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 space-y-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
              /* @__PURE__ */ jsx(Search, { className: cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3") }),
              /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("searchRevenue"), className: cn("w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition", dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-muted/50 border border-border text-sm", children: [
              /* @__PURE__ */ jsx(Layers, { className: "size-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                t("groupBy"),
                ":"
              ] }),
              /* @__PURE__ */ jsxs(Select, { value: groupMode, onValueChange: (v) => setGroupMode(v), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-7 min-w-[100px] border-0 bg-transparent shadow-none focus:ring-0 px-0 text-sm font-medium", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "none", children: t("groupNone") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "day", children: t("groupDay") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "week", children: t("groupWeek") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "month", children: t("groupMonth") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "year", children: t("groupYear") })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: resetFilters, className: "h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", title: t("resetFilters"), children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "size-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("resetFilters") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-5 gap-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground", children: t("dateFrom") }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Calendar, { className: cn("absolute top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground", dir === "rtl" ? "right-2" : "left-2") }),
                /* @__PURE__ */ jsx(DatePickerInput, { value: dateFrom, onChange: setDateFrom, className: cn("w-full h-9 rounded-lg bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", dir === "rtl" ? "pr-7 pl-2" : "pl-7 pr-2") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground", children: t("dateTo") }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Calendar, { className: cn("absolute top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground", dir === "rtl" ? "right-2" : "left-2") }),
                /* @__PURE__ */ jsx(DatePickerInput, { value: dateTo, onChange: setDateTo, className: cn("w-full h-9 rounded-lg bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", dir === "rtl" ? "pr-7 pl-2" : "pl-7 pr-2") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground", children: t("amountMin") }),
              /* @__PURE__ */ jsx("input", { type: "number", inputMode: "decimal", value: minAmt, onChange: (e) => setMinAmt(e.target.value), placeholder: "0", className: "w-full h-9 rounded-lg bg-muted/40 border border-border text-sm px-2 focus:outline-none focus:ring-2 focus:ring-ring/40 tabular" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground", children: t("amountMax") }),
              /* @__PURE__ */ jsx("input", { type: "number", inputMode: "decimal", value: maxAmt, onChange: (e) => setMaxAmt(e.target.value), placeholder: "∞", className: "w-full h-9 rounded-lg bg-muted/40 border border-border text-sm px-2 focus:outline-none focus:ring-2 focus:ring-ring/40 tabular" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground", children: t("paymentMethod") }),
              /* @__PURE__ */ jsxs(Select, { value: payFilter, onValueChange: (v) => setPayFilter(v), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 w-full bg-muted/40 border-border text-sm focus:ring-2 focus:ring-ring/40", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "all", children: t("paymentAny") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "cash", children: t("cashOnly") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "bank", children: t("bankOnly") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "wasfaty", children: t("wasfatyOnly") })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-2 sm:p-4 animate-fade-in space-y-3", children: [
          /* @__PURE__ */ jsx(ShowAllToggle, { showAll: pgRows.showAll, total: pgRows.total, onToggle: pgRows.toggleShowAll }),
          groupMode === "none" && /* @__PURE__ */ jsx(BulkActionsBar, { count: sel.count, total: filtered.length, allSelected: sel.allSelected, onSelectAll: sel.toggleAll, onClear: sel.clear, onDelete: deleteSelected }),
          /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto", children: [
            /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-xs text-muted-foreground uppercase tracking-wide border-b border-border", children: [
                groupMode === "none" && /* @__PURE__ */ jsx("th", { className: "py-3 px-3 w-8", children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": t("selectAll"), checked: sel.allSelected, ref: (el) => {
                  if (el) el.indeterminate = sel.someSelected;
                }, onChange: sel.toggleAll, className: "size-4 rounded border-border accent-primary cursor-pointer" }) }),
                groupMode === "none" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "reference", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("reference") }) }),
                  /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "date", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("dateLabel") }) })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: t("groupBy") }),
                  /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("entriesCount") })
                ] }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: groupMode === "none" ? /* @__PURE__ */ jsx(SortHeader, { sortKey: "customers", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("customers") }) : t("customers") }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: groupMode === "none" ? /* @__PURE__ */ jsx(SortHeader, { sortKey: "cash", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("cash") }) : t("cash") }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: groupMode === "none" ? /* @__PURE__ */ jsx(SortHeader, { sortKey: "bank", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("bank") }) : t("bank") }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: groupMode === "none" ? /* @__PURE__ */ jsx(SortHeader, { sortKey: "discount", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("discount") }) : t("discount") }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: groupMode === "none" ? /* @__PURE__ */ jsx(SortHeader, { sortKey: "gross", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("grossRevenue") }) : t("grossRevenue") }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: groupMode === "none" ? /* @__PURE__ */ jsx(SortHeader, { sortKey: "net", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("netRevenue") }) : t("netRevenue") }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: groupMode === "none" ? /* @__PURE__ */ jsx(SortHeader, { sortKey: "wasfaty", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("wasfatySales") }) : t("wasfatySales") }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: groupMode === "none" ? /* @__PURE__ */ jsx(SortHeader, { sortKey: "vat", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("vatAmount") }) : t("vatAmount") }),
                groupMode === "none" && /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("actions") })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border/60", children: [
                groupMode === "none" && pgRows.pageItems.map((e) => {
                  const d = new Date(e.date);
                  return /* @__PURE__ */ jsxs("tr", { className: cn("hover:bg-muted/30 transition", sel.isSelected(e.id) && "bg-primary/5"), children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": t("selectAll"), checked: sel.isSelected(e.id), onChange: () => sel.toggle(e.id), className: "size-4 rounded border-border accent-primary cursor-pointer" }) }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "font-semibold tabular text-xs", children: e.id }),
                      /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground tabular", children: e.reference })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 tabular text-muted-foreground", children: d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    }) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular", children: fmt(e.customers) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-success", children: fmt(e.cash) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-info", children: fmt(e.bank) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-destructive", children: e.discount ? fmt(e.discount) : fmt(0) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-semibold", children: fmt(gross(e)) }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular", children: [
                      fmt(net(e)),
                      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal ms-1", children: t("currency") })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-warning", children: fmt(e.wasfaty || 0) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-muted-foreground", children: fmt(e.vat ?? vatOf(e)) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEditing(e), className: "size-8 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center", title: t("edit"), "aria-label": t("edit"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }) }),
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => deleteEntry(e.id), className: "size-8 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center", title: t("delete"), "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }) })
                    ] }) })
                  ] }, e.id);
                }),
                groupMode !== "none" && pgGroups.pageItems.map((g) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition", children: [
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-semibold", children: g.label }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-muted-foreground", children: fmt(g.rows.length) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular", children: fmt(g.customers) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-success", children: fmt(g.cash) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-info", children: fmt(g.bank) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-destructive", children: fmt(g.discount) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-semibold", children: fmt(g.gross) }),
                  /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular", children: [
                    fmt(g.net),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal ms-1", children: t("currency") })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-warning", children: fmt(g.wasfaty) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular text-muted-foreground", children: fmt(g.vat) })
                ] }, g.key)),
                filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: groupMode === "none" ? 12 : 10, className: "py-12 text-center text-sm text-muted-foreground", children: t("noResults") }) })
              ] }),
              filtered.length > 0 && /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
                /* @__PURE__ */ jsxs("td", { colSpan: groupMode === "none" ? 3 : 2, className: "py-3 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium", children: [
                  t("totalSelected"),
                  " · ",
                  fmt(groupMode === "none" ? totals.count : groups.length)
                ] }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-semibold", children: fmt(totals.customers) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-semibold text-success", children: fmt(totals.cash) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-semibold text-info", children: fmt(totals.bank) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-semibold text-destructive", children: fmt(totals.discount) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-bold", children: fmt(totals.grossSum) }),
                /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular text-base text-gradient", children: [
                  fmt(totals.netSum),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-bold text-warning", children: fmt(totals.wasfaty) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular font-bold text-muted-foreground", children: fmt(totals.vat) }),
                groupMode === "none" && /* @__PURE__ */ jsx("td", { className: "py-3 px-3" })
              ] }) })
            ] }),
            groupMode === "none" ? /* @__PURE__ */ jsx(PaginationBar, { page: pgRows.page, totalPages: pgRows.totalPages, total: pgRows.total, from: pgRows.from, to: pgRows.to, onPageChange: pgRows.setPage, showAll: pgRows.showAll, onToggleShowAll: pgRows.toggleShowAll }) : /* @__PURE__ */ jsx(PaginationBar, { page: pgGroups.page, totalPages: pgGroups.totalPages, total: pgGroups.total, from: pgGroups.from, to: pgGroups.to, onPageChange: pgGroups.setPage, showAll: pgGroups.showAll, onToggleShowAll: pgGroups.toggleShowAll })
          ] })
        ] })
      ] })
    ] }),
    open && /* @__PURE__ */ jsx(RevenueDialog, { mode: "create", onClose: () => setOpen(false), onSubmit: addEntry, nextId: nextReference(entries) }),
    editing && /* @__PURE__ */ jsx(RevenueDialog, { mode: "edit", initial: editing, onClose: () => setEditing(null), onSubmit: (patch) => updateEntry(editing.id, patch), nextId: editing.id })
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
    warning: "from-warning/20 to-warning/0 text-warning"
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
function RevenueDialog({
  mode = "create",
  initial,
  onClose,
  onSubmit,
  nextId
}) {
  const {
    t,
    fmt
  } = useApp();
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [date, setDate] = useState(initial ? initial.date.slice(0, 10) : today);
  const [customers, setCustomers] = useState(initial ? String(initial.customers) : "");
  const [cash, setCash] = useState(initial ? String(initial.cash) : "");
  const [bank, setBank] = useState(initial ? String(initial.bank) : "");
  const [discount, setDiscount] = useState(initial ? String(initial.discount) : "");
  const [wasfaty, setWasfaty] = useState(initial ? String(initial.wasfaty || 0) : "");
  const [vat, setVat] = useState(initial ? String(initial.vat || 0) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const cashN = round2(Number(cash) || 0);
  const bankN = round2(Number(bank) || 0);
  const discountN = round2(Number(discount) || 0);
  const wasfatyN = round2(Number(wasfaty) || 0);
  const vatN = round2(Number(vat) || 0);
  const totalIncVat = cashN + bankN + wasfatyN;
  const subtotalExVat = totalIncVat - vatN;
  const netTotal = cashN + bankN;
  const grossTotal = cashN + bankN + discountN;
  const submit = (ev) => {
    ev.preventDefault();
    const c = Number(customers);
    if (!c || c <= 0) {
      toast.error(t("customers"));
      return;
    }
    if (cashN + bankN <= 0) {
      toast.error(t("netTotal"));
      return;
    }
    onSubmit({
      date: new Date(date).toISOString(),
      customers: c,
      cash: cashN,
      bank: bankN,
      discount: discountN,
      wasfaty: wasfatyN,
      vat: vatN,
      notes: notes || void 0
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: mode === "edit" ? t("editRevenue") : t("newRevenue") }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          t("reference"),
          ": ",
          /* @__PURE__ */ jsx("span", { className: "tabular font-semibold text-foreground", children: nextId }),
          mode === "create" && /* @__PURE__ */ jsxs("span", { className: "ms-2 text-muted-foreground", children: [
            "(",
            t("autoGenerated"),
            ")"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: t("dateLabel"), children: /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("customers"), children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Users, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: customers, onChange: (e) => setCustomers(e.target.value), min: 1, required: true, autoFocus: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("cash")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Banknote, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-success end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: cash, onChange: (e) => setCash(e.target.value), step: "0.01", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("bank")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Building2, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-info end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: bank, onChange: (e) => setBank(e.target.value), step: "0.01", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("discount")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(TicketPercent, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-destructive end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: discount, onChange: (e) => setDiscount(e.target.value), step: "0.01", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: t("grossRevenue"), children: /* @__PURE__ */ jsxs("div", { className: "h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm tabular font-semibold flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Receipt, { className: "size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxs("span", { children: [
          fmt(grossTotal),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: t("netRevenue"), children: /* @__PURE__ */ jsxs("div", { className: "h-10 rounded-xl bg-primary/10 border border-primary/30 px-3 text-sm tabular font-bold flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxs("span", { className: "text-gradient", children: [
          fmt(netTotal),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("wasfatySales")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(FileSpreadsheet, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-warning end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: wasfaty, onChange: (e) => setWasfaty(e.target.value), step: "0.01", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("subtotal")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm tabular font-semibold flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Receipt, { className: "size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxs("span", { children: [
          fmt(subtotalExVat),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("vatAmount")} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Receipt, { className: "absolute top-1/2 -translate-y-1/2 size-4 text-warning end-3 pointer-events-none" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: vat, onChange: (e) => setVat(e.target.value), step: "0.01", placeholder: "0.00", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" })
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("totalAmount") || "Total"} (${t("currency")})`, children: /* @__PURE__ */ jsxs("div", { className: "h-10 rounded-xl bg-primary/10 border border-primary/30 px-3 text-sm tabular font-bold flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxs("span", { className: "text-gradient", children: [
          fmt(totalIncVat),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: t("notes"), children: /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: "w-full rounded-xl bg-input/40 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
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
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block space-y-1.5", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: label }),
    children
  ] });
}
export {
  RevenueDialog,
  RevenuePage as component
};
