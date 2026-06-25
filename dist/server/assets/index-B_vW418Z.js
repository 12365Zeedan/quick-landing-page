import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ArrowUpRight, ArrowDownRight, Plus, Receipt, ShoppingCart, Timer, TrendingUp, TrendingDown, Banknote, CreditCard, Wallet, Calculator } from "lucide-react";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { w as useApp, g as cn, y as useOrg, z as useOrgStorage, o as nextReference, R as RevenueDialog, a as AddExpenseDialog, b as AddPurchaseDialog, L as LogShiftDialog, c as DatePickerInput } from "./router-CH3R9Cfm.js";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ResponsiveContainer } from "recharts";
import { u as useFinancials } from "./use-financials-CxOuTKIn.js";
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
const accentMap = {
  primary: "from-primary/20 to-primary/0 text-primary",
  secondary: "from-secondary/20 to-secondary/0 text-secondary",
  success: "from-success/20 to-success/0 text-success",
  warning: "from-warning/20 to-warning/0 text-warning",
  destructive: "from-destructive/20 to-destructive/0 text-destructive",
  info: "from-info/20 to-info/0 text-info"
};
function KPICard({
  title,
  value,
  change,
  icon: Icon,
  accent = "primary",
  suffix,
  delay = 0
}) {
  const { fmt, t } = useApp();
  const positive = change >= 0;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in group hover:shadow-glow transition-all duration-300",
      style: { animationDelay: `${delay}ms`, animationFillMode: "both" },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none",
              accentMap[accent]
            )
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: title }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "size-10 rounded-xl grid place-items-center bg-background/40 backdrop-blur-sm border border-border/50",
                  accentMap[accent].split(" ").pop()
                ),
                children: /* @__PURE__ */ jsx(Icon, { className: "size-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5 mb-2", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold tabular tracking-tight animate-count-up", children: fmt(value) }),
            /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: suffix ?? t("currency") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
            /* @__PURE__ */ jsxs(
              "span",
              {
                className: cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold tabular",
                  positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                ),
                children: [
                  positive ? /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-3" }) : /* @__PURE__ */ jsx(ArrowDownRight, { className: "size-3" }),
                  Math.abs(change).toFixed(1),
                  "%"
                ]
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("vsYesterday") })
          ] })
        ] })
      ]
    }
  );
}
function useFin(fin) {
  const live = useFinancials();
  return fin ?? live;
}
function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
const chartTooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "var(--shadow-elegant)",
  color: "var(--color-popover-foreground)"
};
function ChartShell({ children, height = 260 }) {
  const mounted = useMounted();
  if (!mounted) return /* @__PURE__ */ jsx("div", { style: { height }, className: "rounded-xl bg-muted/30 animate-pulse" });
  return /* @__PURE__ */ jsx("div", { style: { width: "100%", height }, children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children }) });
}
function RevenueExpenseChart({ fin } = {}) {
  const { dailySeries } = useFin(fin);
  return /* @__PURE__ */ jsx(ChartShell, { height: 280, children: /* @__PURE__ */ jsxs(LineChart, { data: dailySeries, margin: { top: 10, right: 12, left: -10, bottom: 0 }, children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "revLine", x1: "0", y1: "0", x2: "1", y2: "0", children: [
      /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "var(--color-chart-1)" }),
      /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "var(--color-chart-2)" })
    ] }) }),
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "label", tick: { fontSize: 11, fill: "var(--color-muted-foreground)" }, axisLine: false, tickLine: false }),
    /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 11, fill: "var(--color-muted-foreground)" }, axisLine: false, tickLine: false, width: 50 }),
    /* @__PURE__ */ jsx(Tooltip, { contentStyle: chartTooltipStyle, cursor: { stroke: "var(--color-primary)", strokeWidth: 1, strokeDasharray: "3 3" } }),
    /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "revenue", stroke: "url(#revLine)", strokeWidth: 2.5, dot: false, activeDot: { r: 5 } }),
    /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "expenses", stroke: "var(--color-warning)", strokeWidth: 2, dot: false, strokeDasharray: "4 4", activeDot: { r: 4 } })
  ] }) });
}
function PaymentMixChart({ fin } = {}) {
  const { t } = useApp();
  const { paymentMix } = useFin(fin);
  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];
  const data = paymentMix.map((p) => ({ ...p, label: t(p.name) }));
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx(ChartShell, { height: 200, children: /* @__PURE__ */ jsxs(PieChart, { children: [
      /* @__PURE__ */ jsx(Pie, { data, dataKey: "value", innerRadius: 55, outerRadius: 85, paddingAngle: 3, stroke: "none", children: data.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: colors[i % colors.length] }, i)) }),
      /* @__PURE__ */ jsx(Tooltip, { contentStyle: chartTooltipStyle })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2 shrink-0", children: data.map((d, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
      /* @__PURE__ */ jsx("span", { className: "size-2.5 rounded-sm", style: { background: colors[i] } }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: d.label }),
      /* @__PURE__ */ jsxs("span", { className: "font-semibold tabular", children: [
        d.value,
        "%"
      ] })
    ] }, d.name)) })
  ] });
}
function MonthlyProfitChart({ fin } = {}) {
  const { monthlyProfit } = useFin(fin);
  return /* @__PURE__ */ jsx(ChartShell, { height: 240, children: /* @__PURE__ */ jsxs(BarChart, { data: monthlyProfit, margin: { top: 10, right: 12, left: -10, bottom: 0 }, children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "barFill", x1: "0", y1: "0", x2: "0", y2: "1", children: [
      /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "var(--color-chart-1)", stopOpacity: 1 }),
      /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "var(--color-chart-2)", stopOpacity: 0.4 })
    ] }) }),
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "month", tick: { fontSize: 11, fill: "var(--color-muted-foreground)" }, axisLine: false, tickLine: false }),
    /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 11, fill: "var(--color-muted-foreground)" }, axisLine: false, tickLine: false, width: 50 }),
    /* @__PURE__ */ jsx(Tooltip, { contentStyle: chartTooltipStyle, cursor: { fill: "var(--color-muted)", opacity: 0.3 } }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "profit", fill: "url(#barFill)", radius: [6, 6, 0, 0] })
  ] }) });
}
function CashFlowChart({ fin } = {}) {
  const { cashFlow } = useFin(fin);
  return /* @__PURE__ */ jsx(ChartShell, { height: 220, children: /* @__PURE__ */ jsxs(AreaChart, { data: cashFlow, margin: { top: 10, right: 12, left: -10, bottom: 0 }, children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "areaFill", x1: "0", y1: "0", x2: "0", y2: "1", children: [
      /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "var(--color-chart-2)", stopOpacity: 0.5 }),
      /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "var(--color-chart-2)", stopOpacity: 0 })
    ] }) }),
    /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--color-border)", vertical: false }),
    /* @__PURE__ */ jsx(XAxis, { dataKey: "day", tick: { fontSize: 11, fill: "var(--color-muted-foreground)" }, axisLine: false, tickLine: false }),
    /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 11, fill: "var(--color-muted-foreground)" }, axisLine: false, tickLine: false, width: 50 }),
    /* @__PURE__ */ jsx(Tooltip, { contentStyle: chartTooltipStyle }),
    /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "balance", stroke: "var(--color-chart-2)", strokeWidth: 2.5, fill: "url(#areaFill)" })
  ] }) });
}
function readArr(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeArr(key, items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new StorageEvent("storage", {
      key
    }));
  } catch {
  }
}
function isoDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function rangeForPreset(preset) {
  const today = /* @__PURE__ */ new Date();
  const to = isoDay(today);
  if (preset === "all" || preset === "custom") return {};
  const months = preset === "month" ? 1 : preset === "quarter" ? 3 : preset === "half" ? 6 : 12;
  const from = new Date(today);
  from.setMonth(from.getMonth() - months);
  from.setDate(from.getDate() + 1);
  return {
    from: isoDay(from),
    to
  };
}
function DashboardPage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const {
    currentOrg
  } = useOrg();
  const orgId = currentOrg?.id ?? "__none__";
  const [preset, setPreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const range = useMemo(() => {
    if (preset === "custom") return {
      from: customFrom || void 0,
      to: customTo || void 0
    };
    return rangeForPreset(preset);
  }, [preset, customFrom, customTo]);
  const fin = useFinancials(range);
  const liveKpis = {
    ...fin,
    vatDue: fin.netVat
  };
  const recentTransactions = fin.recentTransactions;
  const topSuppliers = fin.topSuppliers;
  fin.overdueDebts;
  const kpis = {
    todayRevenueChange: 0,
    todayExpensesChange: 0,
    netProfitChange: 0,
    outstandingDebts: fin.outstandingDebts,
    outstandingDebtsChange: 0,
    cashBalanceChange: 0,
    vatDueChange: 0
  };
  const [openRev, setOpenRev] = useState(false);
  const [openExp, setOpenExp] = useState(false);
  const [openPur, setOpenPur] = useState(false);
  const [openShift, setOpenShift] = useState(false);
  const [members] = useOrgStorage("staff.members", []);
  const [, setShifts] = useOrgStorage("staff.shifts", []);
  const revKey = `pharmledger.revenue.entries.v2.${orgId}`;
  const expKey = `pharmledger.expenses.v1.${orgId}`;
  const purKey = `pharmledger.purchases.v1.${orgId}`;
  const addRevenue = (e) => {
    const list = readArr(revKey);
    const id = nextReference(list);
    const reference = `INV-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    writeArr(revKey, [{
      ...e,
      id,
      reference
    }, ...list]);
    toast.success(t("addedRevenue"));
    setOpenRev(false);
  };
  const addExpense = (e) => {
    const list = readArr(expKey);
    const id = `EX-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    writeArr(expKey, [{
      ...e,
      id,
      reference: id
    }, ...list]);
    toast.success(t("addedExpense"));
    setOpenExp(false);
  };
  const addPurchase = (e) => {
    const list = readArr(purKey);
    const id = `PO-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    writeArr(purKey, [{
      ...e,
      id
    }, ...list]);
    toast.success(t("addedPurchase"));
    setOpenPur(false);
  };
  const nextRevId = nextReference(readArr(revKey));
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "px-4 lg:px-8 py-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-2xl lg:text-3xl font-bold tracking-tight", children: [
              t("welcome"),
              ", ",
              /* @__PURE__ */ jsx("span", { className: "text-gradient", children: t("admin") })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("overview") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx(QuickAction, { icon: Plus, label: t("addRevenue"), variant: "primary", onClick: () => setOpenRev(true) }),
            /* @__PURE__ */ jsx(QuickAction, { icon: Receipt, label: t("addExpense"), onClick: () => setOpenExp(true) }),
            /* @__PURE__ */ jsx(QuickAction, { icon: ShoppingCart, label: t("newPurchase"), onClick: () => setOpenPur(true) }),
            /* @__PURE__ */ jsx(QuickAction, { icon: Timer, label: t("logShift"), onClick: () => setOpenShift(true) })
          ] })
        ] }),
        /* @__PURE__ */ jsx(PeriodFilter, { lang, preset, onPresetChange: setPreset, customFrom, customTo, onCustomFromChange: setCustomFrom, onCustomToChange: setCustomTo }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4", children: [
          /* @__PURE__ */ jsx(KPICard, { title: t("todayRevenue"), value: liveKpis.todayRevenue, change: kpis.todayRevenueChange, icon: TrendingUp, accent: "primary", delay: 0 }),
          /* @__PURE__ */ jsx(KPICard, { title: t("todayExpenses"), value: liveKpis.todayExpenses, change: kpis.todayExpensesChange, icon: TrendingDown, accent: "warning", delay: 60 }),
          /* @__PURE__ */ jsx(KPICard, { title: t("netProfit"), value: liveKpis.netProfit, change: kpis.netProfitChange, icon: Banknote, accent: "success", delay: 120 }),
          /* @__PURE__ */ jsx(KPICard, { title: t("outstandingDebts"), value: kpis.outstandingDebts, change: kpis.outstandingDebtsChange, icon: CreditCard, accent: "destructive", delay: 180 }),
          /* @__PURE__ */ jsx(KPICard, { title: t("cashBalance"), value: liveKpis.cashBalance, change: kpis.cashBalanceChange, icon: Wallet, accent: "info", delay: 240 }),
          /* @__PURE__ */ jsx(KPICard, { title: t("vatDue"), value: liveKpis.vatDue, change: kpis.vatDueChange, icon: Calculator, accent: "secondary", delay: 300 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsx(Card, { className: "xl:col-span-2", title: t("revenueVsExpenses"), subtitle: periodLabel(lang, preset), children: /* @__PURE__ */ jsx(RevenueExpenseChart, { fin }) }),
          /* @__PURE__ */ jsx(Card, { title: t("paymentMix"), subtitle: periodLabel(lang, preset), children: /* @__PURE__ */ jsx(PaymentMixChart, { fin }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(Card, { title: t("monthlyProfit"), subtitle: periodLabel(lang, preset), children: /* @__PURE__ */ jsx(MonthlyProfitChart, { fin }) }),
          /* @__PURE__ */ jsx(Card, { title: t("cashFlow"), subtitle: periodLabel(lang, preset), children: /* @__PURE__ */ jsx(CashFlowChart, { fin }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsx(Card, { title: t("recentTransactions"), className: "xl:col-span-2", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto -mx-5 px-5", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-xs text-muted-foreground uppercase tracking-wide", children: [
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-2.5", children: t("type") }),
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium", children: t("category") }),
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium hidden sm:table-cell", children: t("date") }),
              /* @__PURE__ */ jsx("th", { className: "text-end font-medium", children: t("amount") })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/60", children: recentTransactions.map((tx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition", children: [
              /* @__PURE__ */ jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold", tx.kind === "income" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"), children: [
                tx.kind === "income" ? "↑" : "↓",
                " ",
                t(tx.kind === "income" ? "income" : "expense")
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 capitalize text-foreground/90", children: tx.category }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-muted-foreground tabular hidden sm:table-cell", children: tx.time }),
              /* @__PURE__ */ jsxs("td", { className: cn("py-3 text-end font-semibold tabular", tx.kind === "income" ? "text-success" : "text-warning"), children: [
                tx.kind === "income" ? "+" : "−",
                fmt(tx.amount),
                " ",
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
              ] })
            ] }, tx.id)) })
          ] }) }) }),
          /* @__PURE__ */ jsx(Card, { title: t("topSuppliers"), children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: topSuppliers.map((s, i) => {
            const max = topSuppliers[0].total;
            const pct = s.total / max * 100;
            return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                  /* @__PURE__ */ jsx("span", { className: "size-6 rounded-md bg-muted text-xs grid place-items-center font-bold text-muted-foreground shrink-0", children: i + 1 }),
                  /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: s.name[lang] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "font-semibold tabular text-xs shrink-0", children: fmt(s.total) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full gradient-primary rounded-full transition-all", style: {
                width: `${pct}%`
              } }) })
            ] }, s.id);
          }) }) })
        ] }),
        /* @__PURE__ */ jsx(Card, { title: t("agingBuckets"), children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 lg:grid-cols-3 gap-3", children: [["1", "bucket1", "info"], ["2", "bucket2", "info"], ["3", "bucket3", "warning"], ["4", "bucket4", "warning"], ["5", "bucket5", "destructive"], ["+5", "bucket5plus", "destructive"]].map(([k, label, tone]) => {
          const toneCls = {
            info: "text-info border-info/30 bg-info/5",
            warning: "text-warning border-warning/30 bg-warning/5",
            destructive: "text-destructive border-destructive/30 bg-destructive/5"
          };
          return /* @__PURE__ */ jsxs("div", { className: cn("rounded-xl border p-4", toneCls[tone]), children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground font-medium", children: t(label) }),
            /* @__PURE__ */ jsxs("div", { className: "font-bold tabular text-xl mt-1", children: [
              fmt(fin.agingBuckets[k]),
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
            ] })
          ] }, k);
        }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "text-center text-xs text-muted-foreground py-4", children: [
          t("appName"),
          " · © 2026"
        ] })
      ] })
    ] }),
    openRev && /* @__PURE__ */ jsx(RevenueDialog, { onClose: () => setOpenRev(false), onSubmit: addRevenue, nextId: nextRevId }),
    openExp && /* @__PURE__ */ jsx(AddExpenseDialog, { onClose: () => setOpenExp(false), onSubmit: addExpense }),
    openPur && /* @__PURE__ */ jsx(AddPurchaseDialog, { onClose: () => setOpenPur(false), onSubmit: addPurchase }),
    openShift && /* @__PURE__ */ jsx(LogShiftDialog, { members, lang, dir, onClose: () => setOpenShift(false), onSubmit: (entries) => {
      const withIds = entries.map((entry) => ({
        ...entry,
        id: `SH-${String(Math.floor(Math.random() * 9e4) + 1e4)}`
      }));
      setShifts((prev) => [...withIds, ...prev]);
      toast.success(lang === "ar" ? "تم تسجيل المناوبة" : "Shift logged");
      setOpenShift(false);
    } })
  ] });
}
function QuickAction({
  icon: Icon,
  label,
  variant = "default",
  onClick
}) {
  return /* @__PURE__ */ jsxs("button", { onClick, className: cn("h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all border", variant === "primary" ? "gradient-primary text-primary-foreground border-transparent hover:opacity-90 glow-primary" : "bg-card hover:bg-muted border-border"), children: [
    /* @__PURE__ */ jsx(Icon, { className: "size-4" }),
    /* @__PURE__ */ jsx("span", { children: label })
  ] });
}
function Card({
  title,
  subtitle,
  children,
  className
}) {
  return /* @__PURE__ */ jsxs("div", { className: cn("glass-card rounded-2xl p-5 animate-fade-in", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between mb-4 gap-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base", children: title }),
      subtitle && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground uppercase tracking-wide", children: subtitle })
    ] }),
    children
  ] });
}
const PRESET_LABELS = {
  all: {
    ar: "كل الفترة",
    en: "All time"
  },
  month: {
    ar: "آخر شهر",
    en: "Last month"
  },
  quarter: {
    ar: "آخر ربع سنة",
    en: "Last quarter"
  },
  half: {
    ar: "آخر نصف سنة",
    en: "Last 6 months"
  },
  year: {
    ar: "آخر سنة",
    en: "Last year"
  },
  custom: {
    ar: "فترة مخصصة",
    en: "Custom range"
  }
};
function periodLabel(lang, preset) {
  return PRESET_LABELS[preset][lang];
}
function PeriodFilter({
  lang,
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange
}) {
  const presets = ["all", "month", "quarter", "half", "year", "custom"];
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 flex flex-wrap items-center gap-2 animate-fade-in", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide me-2", children: lang === "ar" ? "الفترة" : "Period" }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: presets.map((p) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onPresetChange(p), className: cn("h-8 px-3 rounded-lg text-xs font-semibold border transition-all", preset === p ? "gradient-primary text-primary-foreground border-transparent glow-primary" : "bg-card hover:bg-muted border-border text-foreground/80"), children: PRESET_LABELS[p][lang] }, p)) }),
    preset === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 ms-auto", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: lang === "ar" ? "من" : "From" }),
      /* @__PURE__ */ jsx("div", { className: "w-40", children: /* @__PURE__ */ jsx(DatePickerInput, { value: customFrom, onChange: onCustomFromChange }) }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: lang === "ar" ? "إلى" : "To" }),
      /* @__PURE__ */ jsx("div", { className: "w-40", children: /* @__PURE__ */ jsx(DatePickerInput, { value: customTo, onChange: onCustomToChange }) })
    ] })
  ] });
}
export {
  DashboardPage as component
};
