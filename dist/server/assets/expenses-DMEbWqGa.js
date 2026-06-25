import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { w as useApp, c as DatePickerInput, A as AccountPicker, z as useOrgStorage, g as cn } from "./router-CH3R9Cfm.js";
import { useState, useRef, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { X, Plus, FileSpreadsheet, Upload, Download, FileText, TrendingDown, Receipt, Wallet, Boxes, Search, ShoppingBag, Coins, HandCoins, Milk, Sparkles, Pill, Users, Building2, Landmark, Zap, Phone, Megaphone, Pencil, Briefcase, Calendar, Banknote, Trash2 } from "lucide-react";
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
function groupKey(d, mode) {
  const y = d.getFullYear();
  const m = d.getMonth();
  if (mode === "day") {
    const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      key: k,
      label: k
    };
  }
  if (mode === "month") {
    const k = `${y}-${String(m + 1).padStart(2, "0")}`;
    return {
      key: k,
      label: k
    };
  }
  if (mode === "quarter") {
    const q = Math.floor(m / 3) + 1;
    return {
      key: `${y}-Q${q}`,
      label: `${y} Q${q}`
    };
  }
  return {
    key: `${y}`,
    label: `${y}`
  };
}
const CATEGORIES = ["annual", "founding", "office", "marketing", "phones", "electricity", "bankFees", "rent", "salaries", "medsPurchase", "cosmeticsPurchase", "milkPurchase", "ownerDrawings", "depreciation", "zakat", "misc", "other"];
const METHODS = ["cash", "bank"];
const VAT_RATE = 0.15;
const catIcon = {
  annual: Calendar,
  founding: Briefcase,
  office: Pencil,
  marketing: Megaphone,
  phones: Phone,
  electricity: Zap,
  bankFees: Landmark,
  rent: Building2,
  salaries: Users,
  medsPurchase: Pill,
  cosmeticsPurchase: Sparkles,
  milkPurchase: Milk,
  ownerDrawings: HandCoins,
  depreciation: TrendingDown,
  zakat: Coins,
  misc: ShoppingBag,
  other: Wallet
};
const methodIcon = {
  cash: Banknote,
  bank: Landmark
};
const methodTone = {
  cash: "bg-success/15 text-success border-success/30",
  bank: "bg-info/15 text-info border-info/30"
};
function ExpensesPage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const [entries, setEntries] = useOrgStorage("pharmledger.expenses.v1", []);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [method, setMethod] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("pharmledger.open.newExpense") === "1") {
        sessionStorage.removeItem("pharmledger.open.newExpense");
        setOpen(true);
      }
    } catch {
    }
  }, []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (method !== "all" && e.method !== method) return false;
      if (!q) return true;
      return e.id.toLowerCase().includes(q) || e.reference.toLowerCase().includes(q) || e.vendor.ar.includes(q) || e.vendor.en.toLowerCase().includes(q) || String(e.amount).includes(q);
    });
  }, [entries, query, cat, method]);
  const grouped = useMemo(() => {
    if (groupBy === "none") return [];
    const map = /* @__PURE__ */ new Map();
    for (const e of filtered) {
      const {
        key,
        label
      } = groupKey(new Date(e.date), groupBy);
      const prev = map.get(key) ?? {
        key,
        label,
        count: 0,
        sum: 0,
        vat: 0,
        subtotal: 0
      };
      prev.count += 1;
      prev.sum += Number(e.amount) || 0;
      prev.vat += Number(e.vat) || 0;
      prev.subtotal += Number(e.subtotal) || 0;
      map.set(key, prev);
    }
    return Array.from(map.values()).sort((a, b) => a.key < b.key ? 1 : -1);
  }, [filtered, groupBy]);
  const totals = useMemo(() => {
    const sum = filtered.reduce((s, e) => s + e.amount, 0);
    const count = filtered.length;
    const avg = count ? Math.round(sum / count) : 0;
    const byCat = {};
    filtered.forEach((e) => byCat[e.category] = (byCat[e.category] || 0) + e.amount);
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return {
      sum,
      count,
      avg,
      top
    };
  }, [filtered]);
  const buildExport = () => {
    const headers = ["id", "date", "category", "vendor", "method", "amount", "reference"];
    const rows = filtered.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      vendor: e.vendor.en,
      method: e.method,
      amount: e.amount,
      reference: e.reference
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
      filename: `pharmledger-expenses-${Date.now()}`,
      sheetName: "Expenses",
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
      filename: `pharmledger-expenses-${Date.now()}`,
      title: String(t("expensesTitle") || "Expenses"),
      headers,
      rows,
      lang
    });
  };
  const addEntry = (e) => {
    const id = `EX-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    setEntries((prev) => [{
      ...e,
      id,
      reference: id
    }, ...prev]);
    toast.success(t("addedExpense"));
    setOpen(false);
  };
  const updateEntry = (id, patch) => {
    setEntries((prev) => prev.map((x) => x.id === id ? {
      ...x,
      ...patch,
      reference: x.reference
    } : x));
    toast.success(t("updatedExpense"));
    setEditing(null);
  };
  const deleteEntry = (id) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRow"))) return;
    setEntries((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("deletedRow"));
  };
  const sortable = useSortable(filtered, {
    reference: (e) => e.reference || e.id,
    date: (e) => new Date(e.date),
    category: (e) => e.category,
    vendor: (e) => e.vendor?.en || e.vendor?.ar || "",
    method: (e) => e.method,
    amount: (e) => e.amount
  });
  const pg = usePagination(sortable.sorted);
  const visibleIds = useMemo(() => pg.pageItems.map((e) => e.id), [pg.pageItems]);
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
    const ws = XLSX.utils.aoa_to_sheet([["date", "category", "method", "vendor", "subtotal", "vat", "total", "receiptNo", "notes"], ["2026-05-19", "rent", "bank", "Landlord", 5e3, 750, 5750, "R-1001", "Monthly rent"], ["2026-05-18", "electricity", "cash", "SEC", 800, 120, 920, "R-1002", ""]]);
    ws["!cols"] = [{
      wch: 12
    }, {
      wch: 16
    }, {
      wch: 10
    }, {
      wch: 18
    }, {
      wch: 12
    }, {
      wch: 10
    }, {
      wch: 12
    }, {
      wch: 12
    }, {
      wch: 24
    }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses-template.xlsx");
  };
  const handleImportFile = async (file) => {
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
        if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
        if (typeof v === "number") {
          const d = XLSX.SSF.parse_date_code(v);
          if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString();
        }
        if (typeof v === "string" && v.trim()) {
          const d = new Date(v);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        return null;
      };
      const catAliases = {
        annual: "annual",
        "مصروفات سنوية": "annual",
        "سنوية": "annual",
        founding: "founding",
        "تأسيس": "founding",
        "مصروفات تأسيس": "founding",
        "تاسيس": "founding",
        office: "office",
        "أدوات مكتبية": "office",
        "مكتبية": "office",
        marketing: "marketing",
        "تسويق": "marketing",
        phones: "phones",
        "تليفونات": "phones",
        "هاتف": "phones",
        electricity: "electricity",
        "كهرباء": "electricity",
        bankfees: "bankFees",
        "bank fees": "bankFees",
        "رسوم بنكية": "bankFees",
        rent: "rent",
        "إيجار": "rent",
        "ايجار": "rent",
        salaries: "salaries",
        "رواتب": "salaries",
        "رواتب شهرية": "salaries",
        medspurchase: "medsPurchase",
        "meds": "medsPurchase",
        "مشتريات أدوية": "medsPurchase",
        "أدوية": "medsPurchase",
        cosmeticspurchase: "cosmeticsPurchase",
        "cosmetics": "cosmeticsPurchase",
        "مشتريات كماليات": "cosmeticsPurchase",
        "كماليات": "cosmeticsPurchase",
        milkpurchase: "milkPurchase",
        "milk": "milkPurchase",
        "مشتريات حليب": "milkPurchase",
        "حليب": "milkPurchase",
        ownerdrawings: "ownerDrawings",
        "owner drawings": "ownerDrawings",
        "drawings": "ownerDrawings",
        "مسحوبات": "ownerDrawings",
        "مسحوبات شخصية": "ownerDrawings",
        "جاري الملاك": "ownerDrawings",
        "جاري الشركاء": "ownerDrawings",
        depreciation: "depreciation",
        "إهلاك": "depreciation",
        "اهلاك": "depreciation",
        "استهلاك": "depreciation",
        zakat: "zakat",
        "زكاة": "zakat",
        "زكاة سنوية": "zakat",
        "الزكاة": "zakat",
        "zakah": "zakat",
        misc: "misc",
        "نثريات": "misc",
        other: "other",
        "أخرى": "other",
        "اخرى": "other"
      };
      const mapCat = (v) => {
        const k = String(v ?? "").trim().toLowerCase();
        return catAliases[k] ?? "other";
      };
      const mapMethod = (v) => {
        const k = String(v ?? "").trim().toLowerCase();
        if (["bank", "بنك", "تحويل"].includes(k)) return "bank";
        return "cash";
      };
      const parsed = [];
      let counter = entries.reduce((m, e) => {
        const n = Number(e.id.replace(/\D/g, "")) || 0;
        return n > m ? n : m;
      }, 1e4);
      for (const row of rows) {
        const iso = toIsoDate(pick(row, ["date", "التاريخ", "تاريخ", "تاريخ المصروف"]));
        if (!iso) continue;
        const subtotal = toNum(pick(row, ["subtotal", "amount", "المبلغ بدون ضريبة", "بدون ضريبة", "المبلغ"]));
        const vat = toNum(pick(row, ["vat", "tax", "ضريبة", "الضريبة", "ضريبة القيمة المضافة"]));
        const totalIn = toNum(pick(row, ["total", "الإجمالي", "اجمالي", "المبلغ الإجمالي"]));
        const sub = subtotal;
        const v = vat;
        const amount = totalIn > 0 ? totalIn : sub + v;
        if (amount <= 0) continue;
        const vendorVal = String(pick(row, ["vendor", "المورد", "مورد", "اسم المورد"]) ?? "—");
        const receiptVal = pick(row, ["receiptno", "receipt", "رقم الإيصال", "ايصال", "إيصال"]);
        const notesVal = pick(row, ["notes", "ملاحظات", "ملاحظة"]);
        counter += 1;
        const id = `EX-${counter}`;
        parsed.push({
          id,
          date: iso,
          category: mapCat(pick(row, ["category", "التصنيف", "تصنيف", "النوع"])),
          method: mapMethod(pick(row, ["method", "payment", "طريقة الدفع", "الدفع"])),
          vendor: {
            ar: vendorVal,
            en: vendorVal
          },
          subtotal: sub,
          vat: v,
          amount,
          reference: id,
          receiptNo: receiptVal ? String(receiptVal) : void 0,
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
            /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-bold tracking-tight", children: /* @__PURE__ */ jsx("span", { className: "text-gradient", children: t("expensesTitle") }) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("expensesSubtitle") })
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
              t("newExpense")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsx(Stat, { icon: TrendingDown, label: t("totalExpenses"), value: fmt(totals.sum), suffix: t("currency"), accent: "warning" }),
          /* @__PURE__ */ jsx(Stat, { icon: Receipt, label: t("transactionsCount"), value: fmt(totals.count), accent: "info" }),
          /* @__PURE__ */ jsx(Stat, { icon: Wallet, label: t("avgExpense"), value: fmt(totals.avg), suffix: t("currency"), accent: "secondary" }),
          /* @__PURE__ */ jsx(Stat, { icon: Boxes, label: t("topCategory"), value: t(totals.top) || "—", accent: "destructive" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 animate-fade-in", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-4", children: t("category") }),
          /* @__PURE__ */ jsx(CategoryBars, { entries: filtered })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
            /* @__PURE__ */ jsx(Search, { className: cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3") }),
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("searchExpenses"), className: cn("w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition", dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4") })
          ] }),
          /* @__PURE__ */ jsx(FilterSelect, { label: t("category"), value: cat, onChange: (v) => setCat(v), options: [{
            value: "all",
            label: t("filterAll")
          }, ...CATEGORIES.map((c) => ({
            value: c,
            label: t(c)
          }))] }),
          /* @__PURE__ */ jsx(FilterSelect, { label: t("paymentMethod"), value: method, onChange: (v) => setMethod(v), options: [{
            value: "all",
            label: t("filterAll")
          }, ...METHODS.map((m) => ({
            value: m,
            label: t(m)
          }))] }),
          /* @__PURE__ */ jsx(FilterSelect, { label: lang === "ar" ? "تجميع حسب" : "Group by", value: groupBy, onChange: (v) => setGroupBy(v), options: [{
            value: "none",
            label: lang === "ar" ? "بدون تجميع" : "No grouping"
          }, {
            value: "day",
            label: lang === "ar" ? "يومي" : "Daily"
          }, {
            value: "month",
            label: lang === "ar" ? "شهري" : "Monthly"
          }, {
            value: "quarter",
            label: lang === "ar" ? "ربع سنوي" : "Quarterly"
          }, {
            value: "year",
            label: lang === "ar" ? "سنوي" : "Yearly"
          }] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "glass-card rounded-2xl p-2 sm:p-4 animate-fade-in space-y-3", children: groupBy === "none" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(ShowAllToggle, { showAll: pg.showAll, total: pg.total, onToggle: pg.toggleShowAll }),
          /* @__PURE__ */ jsx(BulkActionsBar, { count: sel.count, total: filtered.length, allSelected: sel.allSelected, onSelectAll: sel.toggleAll, onClear: sel.clear, onDelete: deleteSelected }),
          /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto", children: [
            /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-xs text-muted-foreground uppercase tracking-wide border-b border-border", children: [
                /* @__PURE__ */ jsx("th", { className: "py-3 px-3 w-8", children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": t("selectAll"), checked: sel.allSelected, ref: (el) => {
                  if (el) el.indeterminate = sel.someSelected;
                }, onChange: sel.toggleAll, className: "size-4 rounded border-border accent-primary cursor-pointer" }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "reference", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("reference") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "date", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("date") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "category", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("category") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3 hidden lg:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "vendor", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("vendor") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3 hidden md:table-cell", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "method", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, children: t("paymentMethod") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "amount", currentKey: sortable.sortKey, currentDir: sortable.sortDir, onSort: sortable.toggle, align: "end", children: t("amount") }) }),
                /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("actions") })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border/60", children: [
                pg.pageItems.map((e) => {
                  const Icon = catIcon[e.category];
                  const MIcon = methodIcon[e.method];
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
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-accent text-accent-foreground", children: [
                      /* @__PURE__ */ jsx(Icon, { className: "size-3" }),
                      t(e.category)
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 hidden lg:table-cell text-foreground/90", children: e.vendor[lang] }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 hidden md:table-cell", children: /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border", methodTone[e.method]), children: [
                      /* @__PURE__ */ jsx(MIcon, { className: "size-3" }),
                      t(e.method)
                    ] }) }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular text-warning", children: [
                      "−",
                      fmt(e.amount),
                      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal ms-1", children: t("currency") })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEditing(e), className: "size-8 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center", title: t("edit"), "aria-label": t("edit"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }) }),
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => deleteEntry(e.id), className: "size-8 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center", title: t("delete"), "aria-label": t("delete"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }) })
                    ] }) })
                  ] }, e.id);
                }),
                filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "py-12 text-center text-sm text-muted-foreground", children: t("noResults") }) })
              ] }),
              filtered.length > 0 && /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
                /* @__PURE__ */ jsxs("td", { colSpan: 6, className: "py-3 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium", children: [
                  t("totalSelected"),
                  " · ",
                  fmt(totals.count)
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular text-base text-warning", children: [
                  "−",
                  fmt(totals.sum),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
                ] }),
                /* @__PURE__ */ jsx("td", {})
              ] }) })
            ] }),
            /* @__PURE__ */ jsx(PaginationBar, { page: pg.page, totalPages: pg.totalPages, total: pg.total, from: pg.from, to: pg.to, onPageChange: pg.setPage, showAll: pg.showAll, onToggleShowAll: pg.toggleShowAll })
          ] })
        ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-xs text-muted-foreground uppercase tracking-wide border-b border-border", children: [
            /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: lang === "ar" ? "الفترة" : "Period" }),
            /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("transactionsCount") }),
            /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3 hidden md:table-cell", children: lang === "ar" ? "بدون ضريبة" : "Subtotal" }),
            /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3 hidden md:table-cell", children: lang === "ar" ? "الضريبة" : "VAT" }),
            /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("amount") })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border/60", children: [
            grouped.map((g) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition", children: [
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-semibold tabular", children: g.label }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular", children: fmt(g.count) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular hidden md:table-cell", children: fmt(g.subtotal) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-end tabular hidden md:table-cell", children: fmt(g.vat) }),
              /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular text-warning", children: [
                "−",
                fmt(g.sum),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal ms-1", children: t("currency") })
              ] })
            ] }, g.key)),
            grouped.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "py-12 text-center text-sm text-muted-foreground", children: t("noResults") }) })
          ] }),
          grouped.length > 0 && /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium", children: [
              t("totalSelected"),
              " · ",
              fmt(totals.count)
            ] }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3" }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 hidden md:table-cell" }),
            /* @__PURE__ */ jsx("td", { className: "py-3 px-3 hidden md:table-cell" }),
            /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-end font-bold tabular text-base text-warning", children: [
              "−",
              fmt(totals.sum),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
            ] })
          ] }) })
        ] }) }) })
      ] })
    ] }),
    open && /* @__PURE__ */ jsx(AddExpenseDialog, { onClose: () => setOpen(false), onSubmit: addEntry }),
    editing && /* @__PURE__ */ jsx(AddExpenseDialog, { initial: editing, onClose: () => setEditing(null), onSubmit: (patch) => updateEntry(editing.id, patch) })
  ] });
}
function CategoryBars({
  entries
}) {
  const {
    t,
    fmt
  } = useApp();
  const totals = useMemo(() => {
    const m = {};
    entries.forEach((e) => m[e.category] = (m[e.category] || 0) + e.amount);
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [entries]);
  if (!totals.length) return /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground py-6 text-center", children: t("noResults") });
  const max = totals[0][1];
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3", children: totals.map(([k, v]) => {
    const Icon = catIcon[k] ?? Wallet;
    const pct = v / max * 100;
    return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ jsx(Icon, { className: "size-3.5 text-muted-foreground shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium truncate", children: t(k) })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold tabular text-xs", children: fmt(v) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full gradient-primary rounded-full", style: {
        width: `${pct}%`
      } }) })
    ] }, k);
  }) });
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
      /* @__PURE__ */ jsx(SelectTrigger, { className: "h-9 min-w-[150px] bg-muted/40 border-border text-sm focus:ring-2 focus:ring-ring/40", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
      /* @__PURE__ */ jsx(SelectContent, { children: options.map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value)) })
    ] })
  ] });
}
function AddExpenseDialog({
  onClose,
  onSubmit,
  initial
}) {
  const {
    t,
    fmt
  } = useApp();
  const [date, setDate] = useState(() => initial ? initial.date.slice(0, 10) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [category, setCategory] = useState(initial?.category ?? "annual");
  const [method, setMethod] = useState(initial?.method ?? "cash");
  const [subtotalStr, setSubtotalStr] = useState(initial ? String(initial.subtotal) : "");
  const [vatStr, setVatStr] = useState(initial ? String(initial.vat) : "");
  const [vendor, setVendor] = useState(initial?.vendor.en ?? "");
  const [receiptNo, setReceiptNo] = useState(initial?.receiptNo ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [accountCode, setAccountCode] = useState(initial?.accountCode);
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const subtotal = Number(subtotalStr) || 0;
  const vat = vatStr === "" ? round2(subtotal * VAT_RATE) : Number(vatStr) || 0;
  const total = subtotal + vat;
  const submit = (ev) => {
    ev.preventDefault();
    if (subtotal <= 0) return toast.error("Subtotal must be > 0");
    onSubmit({
      date: new Date(date).toISOString(),
      category,
      method,
      subtotal: round2(subtotal),
      vat: round2(vat),
      amount: round2(total),
      vendor: {
        ar: vendor || "—",
        en: vendor || "—"
      },
      receiptNo: receiptNo || void 0,
      notes: notes || void 0,
      accountCode: accountCode || void 0
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-xl p-6 space-y-5 max-h-[92vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: t("newExpense") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("expensesSubtitle") })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: t("dateLabel"), children: /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("category"), children: /* @__PURE__ */ jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: t(c) }, c)) }) }),
      /* @__PURE__ */ jsx(Field, { label: t("paymentMethod"), children: /* @__PURE__ */ jsx("select", { value: method, onChange: (e) => setMethod(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: METHODS.map((m) => /* @__PURE__ */ jsx("option", { value: m, children: t(m) }, m)) }) }),
      /* @__PURE__ */ jsx(Field, { label: t("vendor"), children: /* @__PURE__ */ jsx("input", { value: vendor, onChange: (e) => setVendor(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("subtotal")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: subtotalStr, onChange: (e) => setSubtotalStr(e.target.value), step: "0.01", required: true, autoFocus: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("vatAmount")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: vatStr, onChange: (e) => setVatStr(e.target.value), step: "0.01", placeholder: (subtotal * VAT_RATE).toFixed(2), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("receiptNo"), children: /* @__PURE__ */ jsx("input", { value: receiptNo, onChange: (e) => setReceiptNo(e.target.value), placeholder: "R-00000", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("reference"), children: /* @__PURE__ */ jsx("input", { value: t("autoGenerated"), disabled: true, className: "w-full h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm text-muted-foreground" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: t("totalAmount") }),
      /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold tabular text-warning", children: [
        fmt(total),
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: t("linkedAccount"), children: /* @__PURE__ */ jsx(AccountPicker, { value: accountCode, onChange: setAccountCode, filterTypes: ["expenses", "assets"], placeholder: t("selectAccount") }) }),
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
  AddExpenseDialog,
  ExpensesPage as component
};
