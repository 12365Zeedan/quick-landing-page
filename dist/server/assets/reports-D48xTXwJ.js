import { jsxs, jsx } from "react/jsx-runtime";
import { w as useApp, z as useOrgStorage, g as cn, c as DatePickerInput } from "./router-CH3R9Cfm.js";
import { useMemo, useState } from "react";
import { Layers, TrendingUp, BarChart3, Package, Users, Percent, ShieldCheck, Search, Receipt, Wallet, Scale, FileSpreadsheet, History, PieChart, Building2, Eye, Download, FileText, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { u as useFinancials } from "./use-financials-CxOuTKIn.js";
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
const buildReports = (fin, suppliers) => [{
  id: "pl",
  titleKey: "rptPL",
  descKey: "rptPLDesc",
  category: "catFinancial",
  icon: TrendingUp,
  accent: "success",
  rows: () => {
    const purchases = fin.purchasesTotal;
    const netRevenueExVat = fin.netRevenue - fin.outputVat;
    return [{
      line: "Gross Revenue",
      amount: fin.grossRevenue
    }, {
      line: "Discounts",
      amount: -fin.totalDiscount
    }, {
      line: "Output VAT",
      amount: -fin.outputVat
    }, {
      line: "Net Revenue (Ex-VAT)",
      amount: netRevenueExVat
    }, {
      line: "Expenses",
      amount: -fin.totalExpenses
    }, {
      line: "Purchases",
      amount: -purchases
    }, {
      line: "Net Profit",
      amount: netRevenueExVat - fin.totalExpenses - purchases
    }];
  }
}, {
  id: "bs",
  titleKey: "rptBS",
  descKey: "rptBSDesc",
  category: "catFinancial",
  icon: Scale,
  accent: "info",
  rows: () => {
    const receivables = fin.debts.filter((d) => d.kind === "receivable").reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0);
    const payables = fin.debts.filter((d) => d.kind === "payable").reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0) + fin.purchasesOutstanding;
    const cashAndBank = fin.cashBalance + fin.bankRevenue - fin.expensesBank;
    const assets = cashAndBank + receivables + fin.purchasesSubtotal + fin.inputVat;
    const equity = assets - payables;
    return [{
      line: "Cash & Bank",
      amount: cashAndBank
    }, {
      line: "Accounts Receivable",
      amount: receivables
    }, {
      line: "Inventory / Purchases",
      amount: fin.purchasesSubtotal
    }, {
      line: "Input VAT",
      amount: fin.inputVat
    }, {
      line: "Total Assets",
      amount: assets
    }, {
      line: "Accounts Payable",
      amount: payables
    }, {
      line: "Total Equity",
      amount: equity
    }];
  }
}, {
  id: "cf",
  titleKey: "rptCF",
  descKey: "rptCFDesc",
  category: "catFinancial",
  icon: Wallet,
  accent: "primary",
  rows: () => [{
    line: "Cash Revenue",
    amount: fin.cashRevenue
  }, {
    line: "Bank Revenue",
    amount: fin.bankRevenue
  }, {
    line: "Expenses Paid",
    amount: -fin.totalExpenses
  }, {
    line: "Purchases Paid",
    amount: -fin.purchasesPaid
  }, {
    line: "Net Cash Flow",
    amount: fin.cashRevenue + fin.bankRevenue - fin.totalExpenses - fin.purchasesPaid
  }]
}, {
  id: "sales",
  titleKey: "rptSales",
  descKey: "rptSalesDesc",
  category: "catSales",
  icon: BarChart3,
  accent: "success",
  rows: () => fin.revenues.map((e) => ({
    id: e.id,
    date: e.date.slice(0, 10),
    customers: e.customers,
    cash: e.cash,
    bank: e.bank,
    discount: e.discount,
    wasfaty: e.wasfaty || 0,
    gross: e.cash + e.bank + e.discount,
    net: e.cash + e.bank
  }))
}, {
  id: "topProducts",
  titleKey: "rptTopProducts",
  descKey: "rptTopProductsDesc",
  category: "catSales",
  icon: PieChart,
  accent: "warning",
  rows: () => {
    const map = /* @__PURE__ */ new Map();
    for (const e of fin.revenues) {
      const day = e.date.slice(0, 10);
      const prev = map.get(day) ?? {
        gross: 0,
        net: 0
      };
      map.set(day, {
        gross: prev.gross + e.cash + e.bank + e.discount,
        net: prev.net + e.cash + e.bank
      });
    }
    return Array.from(map.entries()).sort((a, b) => b[1].net - a[1].net).map(([date, v]) => ({
      date,
      gross: v.gross,
      net: v.net
    }));
  }
}, {
  id: "purchases",
  titleKey: "rptPurchases",
  descKey: "rptPurchasesDesc",
  category: "catInventory",
  icon: Package,
  accent: "info",
  rows: () => fin.purchases.map((p) => ({
    id: p.id,
    date: p.date.slice(0, 10),
    invoice: p.invoiceNumber,
    vendorReference: p.vendorReference ?? "",
    supplier: p.supplier.en,
    subtotal: p.subtotal,
    vat: p.vat,
    status: p.status,
    paid: p.paid,
    amount: p.total
  }))
}, {
  id: "suppliers",
  titleKey: "rptSuppliers",
  descKey: "rptSuppliersDesc",
  category: "catInventory",
  icon: Building2,
  accent: "primary",
  rows: () => suppliers.map((s) => ({
    id: s.id,
    name: s.name.en,
    invoices: s.invoicesCount,
    spend: s.totalPurchases,
    balance: s.balance,
    active: s.active ? "active" : "inactive"
  }))
}, {
  id: "staff",
  titleKey: "rptStaff",
  descKey: "rptStaffDesc",
  category: "catHr",
  icon: Users,
  accent: "info",
  rows: () => fin.staff.map((m) => ({
    id: m.id,
    name: m.name.en,
    role: m.role,
    hours: m.hoursThisMonth,
    salary: m.salary
  }))
}, {
  id: "vat",
  titleKey: "rptVat",
  descKey: "rptVatDesc",
  category: "catTax",
  icon: Percent,
  accent: "warning",
  rows: () => {
    const outputTaxable = fin.netRevenue - fin.outputVat;
    const inputTaxable = fin.expensesSubtotal + fin.purchasesSubtotal;
    const inputVat = fin.expensesVat + fin.purchasesVat;
    return [{
      line: "Output Taxable",
      amount: outputTaxable
    }, {
      line: "Output VAT",
      amount: fin.outputVat
    }, {
      line: "Input Taxable",
      amount: inputTaxable
    }, {
      line: "Input VAT",
      amount: inputVat
    }, {
      line: "Net VAT",
      amount: fin.outputVat - inputVat
    }];
  }
}, {
  id: "debts",
  titleKey: "rptDebts",
  descKey: "rptDebtsDesc",
  category: "catFinancial",
  icon: Receipt,
  accent: "destructive",
  rows: () => fin.debts.map((d) => ({
    id: d.id,
    kind: d.kind,
    party: d.party.en,
    balance: d.amount - d.paid,
    dueDate: d.dueAt.slice(0, 10),
    status: d.status
  }))
}, {
  id: "audit",
  titleKey: "rptAudit",
  descKey: "rptAuditDesc",
  category: "catCompliance",
  icon: ShieldCheck,
  accent: "primary",
  rows: () => [{
    event: "user.login",
    actor: "admin",
    at: "2026-05-13T08:12:00Z"
  }, {
    event: "invoice.create",
    actor: "cashier-2",
    at: "2026-05-13T09:01:00Z"
  }, {
    event: "stock.adjust",
    actor: "manager",
    at: "2026-05-12T17:45:00Z"
  }]
}];
function deriveFinForRange(base, from, to) {
  if (!from && !to) return base;
  const inRange = (s) => {
    if (!s) return false;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };
  const revenues = base.revenues.filter((r) => inRange(r.date));
  const expenses = base.expenses.filter((e) => inRange(e.date));
  const purchases = base.purchases.filter((p) => inRange(p.date));
  const debts = base.debts.filter((d) => inRange(d.dueAt));
  const n = (v) => Number(v) || 0;
  const cashRevenue = revenues.reduce((s, r) => s + n(r.cash), 0);
  const bankRevenue = revenues.reduce((s, r) => s + n(r.bank), 0);
  const wasfatyRevenue = revenues.reduce((s, r) => s + n(r.wasfaty), 0);
  const totalDiscount = revenues.reduce((s, r) => s + n(r.discount), 0);
  const netRevenue = cashRevenue + bankRevenue;
  const grossRevenue = netRevenue + totalDiscount;
  const outputVat = Math.round(revenues.reduce((s, r) => s + n(r.vat), 0) * 100) / 100;
  const netRevenueExVat = netRevenue - outputVat;
  const expensesSubtotal = expenses.reduce((s, e) => s + n(e.subtotal), 0);
  const expensesVat = expenses.reduce((s, e) => s + n(e.vat), 0);
  const totalExpenses = expenses.reduce((s, e) => s + n(e.amount), 0);
  const expensesCash = expenses.filter((e) => e.method === "cash").reduce((s, e) => s + n(e.amount), 0);
  const expensesBank = expenses.filter((e) => e.method !== "cash").reduce((s, e) => s + n(e.amount), 0);
  const purchasesSubtotal = purchases.reduce((s, p) => s + n(p.subtotal), 0);
  const purchasesVat = purchases.reduce((s, p) => s + n(p.vat), 0);
  const purchasesTotal = purchases.reduce((s, p) => s + n(p.total), 0);
  const purchasesPaid = purchases.reduce((s, p) => s + n(p.paid), 0);
  const purchasesOutstanding = purchasesTotal - purchasesPaid;
  const purchasesPaidCash = purchases.filter((p) => p.method === "cash").reduce((s, p) => s + n(p.paid), 0);
  const inputVat = expensesVat + purchasesVat;
  const netVat = outputVat - inputVat;
  const netProfit = netRevenueExVat - totalExpenses;
  const cashBalance = cashRevenue - expensesCash - purchasesPaidCash;
  const outstandingDebts = debts.filter((d) => d.status !== "settled").reduce((s, d) => s + (n(d.amount) - n(d.paid)), 0);
  return {
    ...base,
    revenues,
    expenses,
    purchases,
    debts,
    cashRevenue,
    bankRevenue,
    wasfatyRevenue,
    totalDiscount,
    netRevenue,
    netRevenueExVat,
    grossRevenue,
    outputVat,
    inputVat,
    netVat,
    expensesSubtotal,
    expensesVat,
    totalExpenses,
    expensesCash,
    expensesBank,
    purchasesSubtotal,
    purchasesVat,
    purchasesTotal,
    purchasesPaid,
    purchasesOutstanding,
    netProfit,
    cashBalance,
    outstandingDebts
  };
}
function ReportsPage() {
  const {
    t,
    fmt,
    dir,
    lang
  } = useApp();
  const fin = useFinancials();
  const [suppliers] = useOrgStorage("suppliers.records.v1", []);
  const reports = useMemo(() => buildReports(fin, suppliers), [fin, suppliers]);
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [previewId, setPreviewId] = useState(null);
  const previewReport = previewId ? reports.find((r) => r.id === previewId) ?? null : null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (!q) return true;
      return t(r.titleKey).toLowerCase().includes(q) || t(r.descKey).toLowerCase().includes(q);
    });
  }, [cat, query, reports, t]);
  const grossRevenue = fin.grossRevenue;
  const totalRevenue = fin.netRevenue;
  const totalExpenses = fin.totalExpenses;
  const netRevenueExVat = fin.netRevenue - fin.outputVat;
  const netProfit = netRevenueExVat - fin.totalExpenses - fin.purchasesTotal;
  const fmtCell = (v) => {
    if (typeof v === "number" && Number.isFinite(v)) {
      return (Math.round(v * 100) / 100).toFixed(2);
    }
    return String(v ?? "");
  };
  const runReport = async (r, format, overrideRows) => {
    const rows = overrideRows ?? r.rows();
    const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (rows.length > 0 && typeof window !== "undefined") {
      if (format === "csv") {
        const header = Object.keys(rows[0]).join(",");
        const body = rows.map((row) => Object.values(row).map(fmtCell).join(",")).join("\n");
        const blob = new Blob([`\uFEFF${header}
${body}`], {
          type: "text/csv;charset=utf-8;"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${r.id}-${date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === "pdf") {
        const {
          exportHtmlAsPdf,
          buildReportTableHtml
        } = await import("./pdf-export-yIcOFHks.js");
        const title = String(t(r.titleKey));
        const subtitle = String(t(r.descKey));
        const headers = Object.keys(rows[0]);
        const body = rows.map((row) => headers.map((h) => fmtCell(row[h])));
        const html = buildReportTableHtml({
          title,
          subtitle,
          date,
          headers,
          rows: body,
          lang,
          footerText: `PharmLedger — ${date}`
        });
        await exportHtmlAsPdf({
          html,
          filename: `${r.id}-${date}.pdf`,
          orientation: "landscape"
        });
      }
    }
    setRecent((prev) => [{
      id: `${r.id}-${Date.now()}`,
      reportId: r.id,
      format,
      at: (/* @__PURE__ */ new Date()).toISOString()
    }, ...prev].slice(0, 8));
    toast.success(`${t(r.titleKey)} — ${format.toUpperCase()}`);
  };
  const cats = [{
    id: "all",
    label: t("filterAll"),
    icon: Layers
  }, {
    id: "catFinancial",
    label: t("catFinancial"),
    icon: TrendingUp
  }, {
    id: "catSales",
    label: t("catSales"),
    icon: BarChart3
  }, {
    id: "catInventory",
    label: t("catInventory"),
    icon: Package
  }, {
    id: "catHr",
    label: t("catHr"),
    icon: Users
  }, {
    id: "catTax",
    label: t("catTax"),
    icon: Percent
  }, {
    id: "catCompliance",
    label: t("catCompliance"),
    icon: ShieldCheck
  }];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex", dir, children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 p-6 space-y-6 overflow-x-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: t("reportsTitle") }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: t("reportsSubtitle") })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "size-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" }),
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("search"), className: "ps-9 pe-3 py-2.5 rounded-xl bg-card/60 border border-border/60 text-sm focus:outline-none focus:border-primary/50 transition-colors w-64" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-5 gap-4", children: [
          /* @__PURE__ */ jsx(MiniKpi, { icon: TrendingUp, accent: "primary", label: t("grossRevenue"), value: fmt(grossRevenue) }),
          /* @__PURE__ */ jsx(MiniKpi, { icon: Receipt, accent: "success", label: t("netRevenue"), value: fmt(totalRevenue) }),
          /* @__PURE__ */ jsx(MiniKpi, { icon: Wallet, accent: "warning", label: t("totalExpenses"), value: fmt(totalExpenses) }),
          /* @__PURE__ */ jsx(MiniKpi, { icon: Scale, accent: netProfit >= 0 ? "primary" : "destructive", label: t("netIncome"), value: fmt(netProfit) }),
          /* @__PURE__ */ jsx(MiniKpi, { icon: FileSpreadsheet, accent: "info", label: t("reportCatalog"), value: String(reports.length), suffix: "" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: cats.map((c) => /* @__PURE__ */ jsxs("button", { onClick: () => setCat(c.id), className: cn("inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all", cat === c.id ? "bg-primary text-primary-foreground border-primary shadow-glow" : "bg-card/40 text-muted-foreground border-border/60 hover:text-foreground hover:border-border"), children: [
          /* @__PURE__ */ jsx(c.icon, { className: "size-4" }),
          c.label
        ] }, c.id)) }),
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 xl:grid-cols-3 gap-4", children: [
          filtered.map((r) => /* @__PURE__ */ jsx(ReportCard, { report: r, onRun: runReport, onPreview: () => setPreviewId(r.id) }, r.id)),
          filtered.length === 0 && /* @__PURE__ */ jsx("div", { className: "sm:col-span-2 xl:col-span-3 glass-card rounded-2xl p-12 text-center text-muted-foreground", children: t("noResults") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(History, { className: "size-5 text-primary" }),
              t("recentReports")
            ] }),
            recent.length > 0 && /* @__PURE__ */ jsx("button", { onClick: () => setRecent([]), className: "text-xs text-muted-foreground hover:text-foreground transition-colors", children: t("clear") || "Clear" })
          ] }),
          recent.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground py-6 text-center", children: t("noRecentReports") }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/60", children: [
              /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-start font-medium", children: t("reportName") }),
              /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-start font-medium", children: t("category") }),
              /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-start font-medium", children: t("format") }),
              /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-start font-medium", children: t("generatedAt") })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: recent.map((row) => {
              const def = reports.find((x) => x.id === row.reportId);
              if (!def) return null;
              return /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/40 hover:bg-muted/20 transition-colors", children: [
                /* @__PURE__ */ jsxs("td", { className: "px-3 py-2.5 font-medium flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(def.icon, { className: "size-4 text-muted-foreground" }),
                  t(def.titleKey)
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-3 py-2.5 text-muted-foreground", children: t(def.category) }),
                /* @__PURE__ */ jsx("td", { className: "px-3 py-2.5", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-md text-xs font-mono bg-muted/50 border border-border/40", children: row.format.toUpperCase() }) }),
                /* @__PURE__ */ jsx("td", { className: "px-3 py-2.5 tabular text-muted-foreground", children: new Date(row.at).toLocaleString(lang === "ar" ? "ar-SA" : "en-GB") })
              ] }, row.id);
            }) })
          ] }) })
        ] })
      ] })
    ] }),
    previewReport && /* @__PURE__ */ jsx(PreviewModal, { report: previewReport, fin, suppliers, onClose: () => setPreviewId(null), onExport: (fmt2, filteredRows) => {
      runReport(previewReport, fmt2, filteredRows);
      setPreviewId(null);
    } })
  ] });
}
function getPeriodRange(p, from, to) {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (p) {
    case "all":
      return {
        from: null,
        to: null
      };
    case "month":
      return {
        from: new Date(y, m, 1),
        to: new Date(y, m + 1, 0, 23, 59, 59, 999)
      };
    case "quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return {
        from: new Date(y, qStart, 1),
        to: new Date(y, qStart + 3, 0, 23, 59, 59, 999)
      };
    }
    case "half": {
      const hStart = m < 6 ? 0 : 6;
      return {
        from: new Date(y, hStart, 1),
        to: new Date(y, hStart + 6, 0, 23, 59, 59, 999)
      };
    }
    case "year":
      return {
        from: new Date(y, 0, 1),
        to: new Date(y, 11, 31, 23, 59, 59, 999)
      };
    case "custom":
      return {
        from: from ? new Date(from) : null,
        to: to ? /* @__PURE__ */ new Date(`${to}T23:59:59.999`) : null
      };
  }
}
function PreviewModal({
  report,
  fin,
  suppliers,
  onClose,
  onExport
}) {
  const {
    t,
    fmt: fmtNum,
    lang
  } = useApp();
  const [period, setPeriod] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const periodFilteredRows = useMemo(() => {
    const {
      from,
      to
    } = getPeriodRange(period, customFrom, customTo);
    const scopedFin = deriveFinForRange(fin, from, to);
    const scoped = buildReports(scopedFin, suppliers).find((r) => r.id === report.id);
    return scoped ? scoped.rows() : [];
  }, [fin, suppliers, report.id, period, customFrom, customTo]);
  const rawRows = periodFilteredRows;
  const columns = rawRows[0] ? Object.keys(rawRows[0]) : [];
  const isNumericCol = (c) => rawRows.length > 0 && typeof rawRows[0][c] === "number";
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const rows = useMemo(() => {
    if (!sortCol) return periodFilteredRows;
    const sorted = [...periodFilteredRows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av ?? "").localeCompare(String(bv ?? ""), void 0, {
        numeric: true
      });
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [periodFilteredRows, sortCol, sortDir]);
  const toggleSort = (c) => {
    if (sortCol === c) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(c);
      setSortDir("asc");
    }
    setPage(1);
  };
  const PAGE_SIZES = [10, 25, 50, 100];
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, rows.length);
  const pageRows = useMemo(() => rows.slice(startIdx, endIdx), [rows, startIdx, endIdx]);
  const isAr = lang === "ar";
  const periodOptions = [{
    id: "all",
    label: isAr ? "كامل الفترة" : "All time"
  }, {
    id: "month",
    label: isAr ? "شهري" : "Monthly"
  }, {
    id: "quarter",
    label: isAr ? "ربع سنوي" : "Quarterly"
  }, {
    id: "half",
    label: isAr ? "نصف سنوي" : "Semi-annual"
  }, {
    id: "year",
    label: isAr ? "سنوي" : "Annual"
  }, {
    id: "custom",
    label: isAr ? "من - إلى" : "Custom"
  }];
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-border/60 shadow-2xl", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 p-5 border-b border-border/60", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "size-11 rounded-xl grid place-items-center bg-primary/15 text-primary border border-primary/30 shrink-0", children: /* @__PURE__ */ jsx(report.icon, { className: "size-5" }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: t("reportPreview") }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold truncate", children: t(report.titleKey) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5 line-clamp-1", children: t(report.descKey) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "size-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0", "aria-label": t("closePreview"), children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-border/60 text-xs text-muted-foreground bg-muted/20", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        t("rowsCount"),
        ":",
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-foreground font-semibold tabular", children: rows.length })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-border", children: "•" }),
      /* @__PURE__ */ jsxs("span", { children: [
        t("category"),
        ": ",
        /* @__PURE__ */ jsx("span", { className: "text-foreground", children: t(report.category) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border/60 bg-card/30", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-muted-foreground me-1", children: [
        isAr ? "الفترة" : "Period",
        ":"
      ] }),
      periodOptions.map((opt) => /* @__PURE__ */ jsx("button", { onClick: () => {
        setPeriod(opt.id);
        setPage(1);
      }, className: cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", period === opt.id ? "bg-primary text-primary-foreground border-primary shadow-glow" : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:border-border"), children: opt.label }, opt.id)),
      period === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 ms-1", children: [
        /* @__PURE__ */ jsx(DatePickerInput, { value: customFrom, onChange: (v) => {
          setCustomFrom(v);
          setPage(1);
        }, className: "px-2 py-1 rounded-md bg-card/60 border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" }),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "—" }),
        /* @__PURE__ */ jsx(DatePickerInput, { value: customTo, onChange: (v) => {
          setCustomTo(v);
          setPage(1);
        }, className: "px-2 py-1 rounded-md bg-card/60 border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-auto flex-1", children: rows.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-muted-foreground text-sm", children: t("noResults") }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/30 border-b border-border/60 sticky top-0 backdrop-blur-sm", children: /* @__PURE__ */ jsx("tr", { children: columns.map((c) => {
        const active = sortCol === c;
        const SortIcon = active ? sortDir === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;
        const numeric = isNumericCol(c);
        return /* @__PURE__ */ jsx("th", { className: cn("px-4 py-2.5 font-medium text-xs uppercase tracking-wide select-none cursor-pointer transition-colors hover:text-foreground", active ? "text-foreground" : "text-muted-foreground", numeric ? "text-end" : "text-start"), onClick: () => toggleSort(c), "aria-sort": active ? sortDir === "asc" ? "ascending" : "descending" : "none", children: /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-1.5", numeric && "flex-row-reverse"), children: [
          c,
          /* @__PURE__ */ jsx(SortIcon, { className: cn("size-3", active ? "opacity-100" : "opacity-40") })
        ] }) }, c);
      }) }) }),
      /* @__PURE__ */ jsx("tbody", { children: pageRows.map((row, i) => /* @__PURE__ */ jsx("tr", { className: "border-b border-border/40 hover:bg-muted/20 transition-colors", children: columns.map((c) => {
        const v = row[c];
        const numeric = typeof v === "number";
        return /* @__PURE__ */ jsx("td", { className: cn("px-4 py-2.5", numeric ? "text-end tabular font-medium" : "text-start"), children: numeric ? fmtNum(v) : String(v) }, c);
      }) }, i)) })
    ] }) }),
    rows.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-t border-border/60 bg-muted/10 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          startIdx + 1,
          "–",
          endIdx,
          " / ",
          rows.length
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-border", children: "•" }),
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { children: "Rows:" }),
          /* @__PURE__ */ jsx("select", { value: pageSize, onChange: (e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }, className: "bg-card/60 border border-border/60 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring", children: PAGE_SIZES.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: s }, s)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setPage(1), disabled: currentPage === 1, className: "size-7 grid place-items-center rounded-md hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", "aria-label": "First page", children: "«" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: currentPage === 1, className: "size-7 grid place-items-center rounded-md hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", "aria-label": "Previous page", children: "‹" }),
        /* @__PURE__ */ jsxs("span", { className: "px-2 text-foreground tabular", children: [
          currentPage,
          " / ",
          totalPages
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages, className: "size-7 grid place-items-center rounded-md hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", "aria-label": "Next page", children: "›" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setPage(totalPages), disabled: currentPage === totalPages, className: "size-7 grid place-items-center rounded-md hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", "aria-label": "Last page", children: "»" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-end gap-2 p-4 border-t border-border/60 bg-card/40", children: [
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors", children: t("closePreview") }),
      /* @__PURE__ */ jsxs("button", { onClick: () => onExport("pdf", periodFilteredRows), className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card/60 border border-border/60 text-sm font-medium hover:bg-muted/40 transition-all", children: [
        /* @__PURE__ */ jsx(FileText, { className: "size-4" }),
        t("exportPdf")
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => onExport("csv", periodFilteredRows), className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all", children: [
        /* @__PURE__ */ jsx(Download, { className: "size-4" }),
        t("exportCsv")
      ] })
    ] })
  ] }) });
}
function ReportCard({
  report,
  onRun,
  onPreview
}) {
  const {
    t
  } = useApp();
  const accentMap = {
    primary: "from-primary/20 to-primary/0 text-primary border-primary/30",
    success: "from-success/20 to-success/0 text-success border-success/30",
    info: "from-info/20 to-info/0 text-info border-info/30",
    warning: "from-warning/20 to-warning/0 text-warning border-warning/30",
    destructive: "from-destructive/20 to-destructive/0 text-destructive border-destructive/30"
  };
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 relative overflow-hidden hover:shadow-glow transition-all flex flex-col", children: [
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none", accentMap[report.accent]) }),
    /* @__PURE__ */ jsxs("div", { className: "relative flex-1 flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
        /* @__PURE__ */ jsx("div", { className: cn("size-11 rounded-xl grid place-items-center bg-background/60 backdrop-blur-sm border", accentMap[report.accent]), children: /* @__PURE__ */ jsx(report.icon, { className: "size-5" }) }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wide text-muted-foreground px-2 py-0.5 rounded-md border border-border/50 bg-card/40", children: t(report.category) })
      ] }),
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base leading-tight", children: t(report.titleKey) }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1.5 leading-relaxed flex-1", children: t(report.descKey) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: onPreview, className: "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all", children: [
          /* @__PURE__ */ jsx(Eye, { className: "size-3.5" }),
          t("preview")
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => onRun(report, "csv"), className: "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs font-medium hover:bg-muted/40 transition-all", title: "CSV", children: [
          /* @__PURE__ */ jsx(Download, { className: "size-3.5" }),
          "CSV"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => onRun(report, "pdf"), className: "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs font-medium hover:bg-muted/40 transition-all", title: "PDF", children: [
          /* @__PURE__ */ jsx(FileText, { className: "size-3.5" }),
          "PDF"
        ] })
      ] })
    ] })
  ] });
}
function MiniKpi({
  icon: Icon,
  label,
  value,
  accent,
  suffix
}) {
  const {
    t
  } = useApp();
  const map = {
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    primary: "from-primary/20 to-primary/0 text-primary",
    warning: "from-warning/20 to-warning/0 text-warning",
    destructive: "from-destructive/20 to-destructive/0 text-destructive"
  };
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", map[accent]) }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: label }),
        /* @__PURE__ */ jsx("div", { className: cn("size-10 rounded-xl grid place-items-center bg-background/40 backdrop-blur-sm border border-border/50", map[accent].split(" ").pop()), children: /* @__PURE__ */ jsx(Icon, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tabular tracking-tight", children: value }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: suffix ?? t("currency") })
      ] })
    ] })
  ] });
}
export {
  ReportsPage as component
};
