import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Download, ArrowUpRight, ArrowDownLeft, Scale, Percent, FileText, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { u as usePagination, P as PaginationBar } from "./use-pagination-DIgFAfhb.js";
import { w as useApp, y as useOrg, g as cn } from "./router-CH3R9Cfm.js";
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
function readOpeningInventoryVat(orgId) {
  if (!orgId || typeof window === "undefined") return {
    opening: 0,
    closing: 0
  };
  try {
    const raw = localStorage.getItem(`pharmledger.openings.v1.${orgId}`);
    if (!raw) return {
      opening: 0,
      closing: 0
    };
    const v = JSON.parse(raw);
    return {
      opening: Number(v.inventoryVat) || 0,
      closing: Number(v.closingInventoryVat) || 0
    };
  } catch {
    return {
      opening: 0,
      closing: 0
    };
  }
}
const QUARTERS = {
  q1: [0, 2],
  q2: [3, 5]
};
function inPeriod(d, period) {
  const now = new Date(2026, 4, 13);
  if (period === "all") return true;
  if (period === "ytd") return d.getFullYear() === now.getFullYear();
  if (period === "thisMonth") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const [from, to] = QUARTERS[period];
  return d.getFullYear() === now.getFullYear() && d.getMonth() >= from && d.getMonth() <= to;
}
function VatPage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const fin = useFinancials();
  const {
    currentOrg
  } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const [tab, setTab] = useState("summary");
  const [period, setPeriod] = useState("ytd");
  const [query, setQuery] = useState("");
  const inventoryVatOpenings = useMemo(
    () => readOpeningInventoryVat(orgId),
    // re-read when financials refresh (storage stamp) or org changes
    [orgId, fin.revenues, fin.expenses, fin.purchases]
  );
  const vatEntries = useMemo(() => {
    const VAT_RATE = 0.15;
    const out = [];
    const openInvVat = inventoryVatOpenings.opening;
    if (openInvVat > 0) {
      const now = /* @__PURE__ */ new Date();
      const openingDate = new Date(now.getFullYear(), 0, 1).toISOString();
      const taxable = openInvVat / VAT_RATE;
      out.push({
        id: "opening-inventory-vat",
        date: openingDate,
        direction: "input",
        party: {
          ar: "رصيد افتتاحي — مخزون بداية المدة",
          en: "Opening Balance — Opening Inventory"
        },
        reference: "OPENING-INV-VAT",
        category: "openingInventoryVat",
        taxable,
        rate: VAT_RATE,
        vat: openInvVat
      });
    }
    for (const r of fin.revenues) {
      const vat = Number(r.vat) || 0;
      if (vat <= 0) continue;
      const totalInc = (Number(r.cash) || 0) + (Number(r.bank) || 0);
      const taxable = totalInc - vat;
      out.push({
        id: r.id,
        date: r.date,
        direction: "output",
        party: {
          ar: "مبيعات",
          en: "Sales"
        },
        reference: r.reference || r.id,
        category: "sales",
        taxable,
        rate: VAT_RATE,
        vat
      });
    }
    for (const e of fin.expenses) {
      const vat = Number(e.vat) || 0;
      if (vat <= 0) continue;
      const subtotal = Number(e.subtotal) || (Number(e.amount) || 0) - vat;
      const rate = subtotal > 0 ? vat / subtotal : VAT_RATE;
      out.push({
        id: e.id,
        date: e.date,
        direction: "input",
        party: e.vendor || {
          ar: "—",
          en: "—"
        },
        reference: e.reference || e.id,
        category: e.category,
        taxable: subtotal,
        rate,
        vat
      });
    }
    for (const p of fin.purchases) {
      const vat = Number(p.vat) || 0;
      if (vat <= 0) continue;
      const subtotal = Number(p.subtotal) || (Number(p.total) || 0) - vat;
      const rate = subtotal > 0 ? vat / subtotal : VAT_RATE;
      out.push({
        id: p.id,
        date: p.date,
        direction: "input",
        party: p.supplier || {
          ar: "—",
          en: "—"
        },
        reference: p.invoiceNumber || p.id,
        category: "purchases",
        taxable: subtotal,
        rate,
        vat
      });
    }
    return out;
  }, [fin.revenues, fin.expenses, fin.purchases, inventoryVatOpenings.opening]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vatEntries.filter((e) => {
      if (!inPeriod(new Date(e.date), period)) return false;
      if (!q) return true;
      return e.id.toLowerCase().includes(q) || e.reference.toLowerCase().includes(q) || e.party.ar.toLowerCase().includes(q) || e.party.en.toLowerCase().includes(q);
    });
  }, [vatEntries, period, query]);
  const outputs = filtered.filter((e) => e.direction === "output");
  const inputs = filtered.filter((e) => e.direction === "input");
  const sum = (xs, k) => xs.reduce((s, x) => s + x[k], 0);
  const outputTaxable = sum(outputs, "taxable");
  const inputTaxable = sum(inputs, "taxable");
  const outputVat = sum(outputs, "vat");
  const inputVat = sum(inputs, "vat");
  const netVat = outputVat - inputVat;
  const effectiveRate = outputTaxable > 0 ? outputVat / outputTaxable * 100 : 0;
  const exportCsv = () => {
    const rows = filtered.map((e) => ({
      id: e.id,
      date: e.date.slice(0, 10),
      direction: e.direction,
      party: e.party[lang],
      reference: e.reference,
      category: e.category,
      taxable: e.taxable,
      rate: e.rate,
      vat: e.vat
    }));
    const header = Object.keys(rows[0] ?? {
      id: ""
    }).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).join(","))].join("\n");
    if (typeof window !== "undefined") {
      const blob = new Blob([csv], {
        type: "text/csv"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vat-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(t("exportCsv"));
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex", dir, children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 p-6 space-y-6 overflow-x-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: t("vatTitle") }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: t("vatSubtitle") })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: exportCsv, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-sm font-medium transition-all", children: [
            /* @__PURE__ */ jsx(Download, { className: "size-4" }),
            t("exportCsv")
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsx(KpiTile, { icon: ArrowUpRight, accent: "success", title: t("outputVat"), value: fmt(outputVat), caption: `${outputs.length} ${t("invoiceCount")}` }),
          /* @__PURE__ */ jsx(KpiTile, { icon: ArrowDownLeft, accent: "info", title: t("inputVat"), value: fmt(inputVat), caption: `${inputs.length} ${t("invoiceCount")}` }),
          /* @__PURE__ */ jsx(KpiTile, { icon: Scale, accent: netVat >= 0 ? "primary" : "destructive", title: netVat >= 0 ? t("netVat") : t("vatRefundable"), value: fmt(Math.abs(netVat)), caption: netVat >= 0 ? t("vatDue") : t("vatRefundable") }),
          /* @__PURE__ */ jsx(KpiTile, { icon: Percent, accent: "warning", title: t("effectiveRate"), value: `${effectiveRate.toFixed(1)}%`, caption: `${t("vatRate")} 15%`, suffix: "" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-xl border border-border/60 bg-card/40 p-1 backdrop-blur-sm", children: [{
            id: "summary",
            label: t("vatReturn"),
            icon: FileText
          }, {
            id: "output",
            label: t("salesVat"),
            icon: ArrowUpRight
          }, {
            id: "input",
            label: t("purchasesVat"),
            icon: ArrowDownLeft
          }].map((x) => /* @__PURE__ */ jsxs("button", { onClick: () => setTab(x.id), className: cn("inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", tab === x.id ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"), children: [
            /* @__PURE__ */ jsx(x.icon, { className: "size-4" }),
            x.label
          ] }, x.id)) }),
          /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-xl border border-border/60 bg-card/40 p-1 backdrop-blur-sm", children: [{
            id: "thisMonth",
            label: t("thisMonth")
          }, {
            id: "q1",
            label: t("q1")
          }, {
            id: "q2",
            label: t("q2")
          }, {
            id: "ytd",
            label: t("ytd")
          }, {
            id: "all",
            label: t("filterAll")
          }].map((p) => /* @__PURE__ */ jsx("button", { onClick: () => setPeriod(p.id), className: cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", period === p.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"), children: p.label }, p.id)) })
        ] }),
        tab === "summary" && /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-6 animate-fade-in", children: [
          /* @__PURE__ */ jsx(ReturnSummary, { title: t("salesVat"), accent: "success", taxable: outputTaxable, vat: outputVat, count: outputs.length }),
          /* @__PURE__ */ jsx(ReturnSummary, { title: t("purchasesVat"), accent: "info", taxable: inputTaxable, vat: inputVat, count: inputs.length }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 glass-card rounded-2xl p-6", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold mb-5 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Receipt, { className: "size-5 text-primary" }),
              t("vatReturn")
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(SummaryLine, { label: t("outputVat"), value: fmt(outputVat), positive: true }),
              /* @__PURE__ */ jsx(SummaryLine, { label: t("inputVat"), value: `(${fmt(inputVat)})`, muted: true }),
              /* @__PURE__ */ jsx("div", { className: "border-t border-border/60 pt-3 mt-3", children: /* @__PURE__ */ jsx(SummaryLine, { label: netVat >= 0 ? t("netVat") : t("vatRefundable"), value: fmt(Math.abs(netVat)), total: true, tone: netVat >= 0 ? "primary" : "success" }) }),
              inventoryVatOpenings.closing > 0 && /* @__PURE__ */ jsxs("div", { className: "border-t border-border/60 pt-3 mt-3 text-xs text-muted-foreground flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: t("closingInventoryVatMemo") }),
                /* @__PURE__ */ jsxs("span", { className: "tabular", children: [
                  fmt(inventoryVatOpenings.closing),
                  " ",
                  t("currency")
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(BreakdownPanel, { title: `${t("salesVat")} — ${t("vatBreakdown")}`, accent: "success", entries: vatEntries.filter((e) => e.direction === "output") }),
          /* @__PURE__ */ jsx(BreakdownPanel, { title: `${t("purchasesVat")} — ${t("vatBreakdown")}`, accent: "info", entries: vatEntries.filter((e) => e.direction === "input") })
        ] }),
        tab !== "summary" && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-fade-in", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 max-w-md", children: /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsx(Search, { className: "size-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" }),
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("search"), className: "w-full ps-9 pe-3 py-2.5 rounded-xl bg-card/60 border border-border/60 text-sm focus:outline-none focus:border-primary/50 transition-colors" })
          ] }) }),
          /* @__PURE__ */ jsx(VatTable, { entries: tab === "output" ? outputs : inputs, direction: tab })
        ] })
      ] })
    ] })
  ] });
}
function KpiTile({
  icon: Icon,
  title,
  value,
  caption,
  accent,
  suffix
}) {
  const {
    t
  } = useApp();
  const accentMap = {
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    primary: "from-primary/20 to-primary/0 text-primary",
    destructive: "from-destructive/20 to-destructive/0 text-destructive",
    warning: "from-warning/20 to-warning/0 text-warning"
  };
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 relative overflow-hidden hover:shadow-glow transition-all", children: [
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", accentMap[accent]) }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: title }),
        /* @__PURE__ */ jsx("div", { className: cn("size-10 rounded-xl grid place-items-center bg-background/40 backdrop-blur-sm border border-border/50", accentMap[accent].split(" ").pop()), children: /* @__PURE__ */ jsx(Icon, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tabular tracking-tight", children: value }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: suffix ?? t("currency") })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: caption })
    ] })
  ] });
}
function ReturnSummary({
  title,
  accent,
  taxable,
  vat,
  count
}) {
  const {
    t,
    fmt
  } = useApp();
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-5", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: title }),
      /* @__PURE__ */ jsxs("span", { className: cn("px-2.5 py-1 rounded-md text-xs font-semibold border", accent === "success" ? "bg-success/15 text-success border-success/30" : "bg-info/15 text-info border-info/30"), children: [
        count,
        " ",
        t("invoiceCount")
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(SummaryLine, { label: t("taxableAmount"), value: fmt(taxable), muted: true }),
      /* @__PURE__ */ jsx(SummaryLine, { label: t("vatAmount"), value: fmt(vat) }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-border/60 pt-3 mt-3", children: /* @__PURE__ */ jsx(SummaryLine, { label: t("totalWithVat"), value: fmt(taxable + vat), total: true }) })
    ] })
  ] });
}
function SummaryLine({
  label,
  value,
  muted,
  positive,
  total,
  tone
}) {
  const {
    t
  } = useApp();
  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-center justify-between py-2", total && "px-3 -mx-3 rounded-lg", total && tone === "primary" && "bg-primary/10", total && tone === "success" && "bg-success/10"), children: [
    /* @__PURE__ */ jsx("span", { className: cn("text-sm", muted && "text-muted-foreground", total && "font-semibold"), children: label }),
    /* @__PURE__ */ jsxs("span", { className: cn("tabular text-sm", positive && "text-success", total && "text-lg font-bold", total && tone === "primary" && "text-primary", total && tone === "success" && "text-success"), children: [
      value,
      " ",
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-normal", children: t("currency") })
    ] })
  ] });
}
function VatTable({
  entries,
  direction
}) {
  const {
    t,
    fmt,
    lang
  } = useApp();
  const pg = usePagination(entries);
  if (entries.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "glass-card rounded-2xl p-12 text-center text-muted-foreground", children: t("noResults") });
  }
  const totalTaxable = entries.reduce((s, e) => s + e.taxable, 0);
  const totalVat = entries.reduce((s, e) => s + e.vat, 0);
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-muted/30 border-b border-border/60", children: /* @__PURE__ */ jsxs("tr", { className: "text-start", children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium text-muted-foreground text-xs uppercase tracking-wide", children: t("date") }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium text-muted-foreground text-xs uppercase tracking-wide", children: t("reference") }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium text-muted-foreground text-xs uppercase tracking-wide", children: direction === "output" ? t("party") : t("supplier") }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-start font-medium text-muted-foreground text-xs uppercase tracking-wide", children: t("category") }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium text-muted-foreground text-xs uppercase tracking-wide", children: t("taxableAmount") }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium text-muted-foreground text-xs uppercase tracking-wide", children: t("vatRate") }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium text-muted-foreground text-xs uppercase tracking-wide", children: t("vatAmount") }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-end font-medium text-muted-foreground text-xs uppercase tracking-wide", children: t("totalWithVat") })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: pg.pageItems.map((e) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/40 hover:bg-muted/20 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 tabular text-muted-foreground", children: new Date(e.date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB") }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-mono text-xs", children: e.reference }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: e.party[lang] }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-md text-xs bg-muted/50 border border-border/40", children: t(e.category) }) }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular", children: fmt(e.taxable) }),
        /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-end tabular text-muted-foreground", children: [
          (e.rate * 100).toFixed(0),
          "%"
        ] }),
        /* @__PURE__ */ jsx("td", { className: cn("px-4 py-3 text-end tabular font-semibold", direction === "output" ? "text-success" : "text-info"), children: fmt(e.vat) }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular font-medium", children: fmt(e.taxable + e.vat) })
      ] }, e.id)) }),
      /* @__PURE__ */ jsx("tfoot", { className: "bg-muted/40 border-t-2 border-border", children: /* @__PURE__ */ jsxs("tr", { className: "font-semibold", children: [
        /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-4 py-3 text-end uppercase text-xs tracking-wide", children: t("totalSelected") }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular", children: fmt(totalTaxable) }),
        /* @__PURE__ */ jsx("td", {}),
        /* @__PURE__ */ jsx("td", { className: cn("px-4 py-3 text-end tabular", direction === "output" ? "text-success" : "text-info"), children: fmt(totalVat) }),
        /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-end tabular", children: fmt(totalTaxable + totalVat) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx(PaginationBar, { page: pg.page, totalPages: pg.totalPages, total: pg.total, from: pg.from, to: pg.to, onPageChange: pg.setPage, showAll: pg.showAll, onToggleShowAll: pg.toggleShowAll })
  ] });
}
function BreakdownPanel({
  title,
  accent,
  entries
}) {
  const {
    t,
    fmt,
    lang
  } = useApp();
  const [granularity, setGranularity] = useState("month");
  const [bucket, setBucket] = useState("all");
  const buckets = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    for (const e of entries) {
      const d = new Date(e.date);
      if (granularity === "month") {
        set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      } else {
        const q = Math.floor(d.getMonth() / 3) + 1;
        set.add(`${d.getFullYear()}-Q${q}`);
      }
    }
    return Array.from(set).sort().reverse();
  }, [entries, granularity]);
  const filtered = useMemo(() => {
    if (bucket === "all") return entries;
    return entries.filter((e) => {
      const d = new Date(e.date);
      if (granularity === "month") {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === bucket;
      }
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${q}` === bucket;
    });
  }, [entries, granularity, bucket]);
  const formatBucketLabel = (b) => {
    if (b === "all") return t("filterAll");
    if (granularity === "month") {
      const [y, m] = b.split("-");
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
        month: "short",
        year: "numeric"
      });
    }
    return b;
  };
  const totalTaxable = filtered.reduce((s, e) => s + e.taxable, 0);
  const totalVat = filtered.reduce((s, e) => s + e.vat, 0);
  const byRateMap = /* @__PURE__ */ new Map();
  for (const e of filtered) {
    const k = e.rate;
    const r = byRateMap.get(k) ?? {
      taxable: 0,
      vat: 0,
      count: 0
    };
    r.taxable += e.taxable;
    r.vat += e.vat;
    r.count += 1;
    byRateMap.set(k, r);
  }
  const byRate = Array.from(byRateMap.entries()).sort((a, b) => b[0] - a[0]);
  const byCatMap = /* @__PURE__ */ new Map();
  for (const e of filtered) {
    const r = byCatMap.get(e.category) ?? {
      taxable: 0,
      vat: 0,
      count: 0
    };
    r.taxable += e.taxable;
    r.vat += e.vat;
    r.count += 1;
    byCatMap.set(e.category, r);
  }
  const byCategory = Array.from(byCatMap.entries()).sort((a, b) => b[1].vat - a[1].vat);
  const barColor = accent === "success" ? "bg-success" : "bg-info";
  const accentText = accent === "success" ? "text-success" : "text-info";
  return /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 glass-card rounded-2xl p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 mb-5", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: title }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-lg border border-border/60 bg-card/40 p-0.5", children: ["month", "quarter"].map((g) => /* @__PURE__ */ jsx("button", { onClick: () => {
          setGranularity(g);
          setBucket("all");
        }, className: cn("px-3 py-1 rounded-md text-xs font-medium transition-all", granularity === g ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"), children: t(g) }, g)) }),
        /* @__PURE__ */ jsxs("select", { value: bucket, onChange: (e) => setBucket(e.target.value), className: "px-3 py-1.5 rounded-lg bg-card/60 border border-border/60 text-xs focus:outline-none focus:border-primary/50 transition-colors min-w-[8rem]", children: [
          /* @__PURE__ */ jsx("option", { value: "all", children: t("filterAll") }),
          buckets.map((b) => /* @__PURE__ */ jsx("option", { value: b, children: formatBucketLabel(b) }, b))
        ] })
      ] })
    ] }),
    filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-muted-foreground text-sm", children: t("noResults") }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5", children: [
        /* @__PURE__ */ jsx(SummaryStat, { label: t("invoiceCount"), value: String(filtered.length) }),
        /* @__PURE__ */ jsx(SummaryStat, { label: t("taxableAmount"), value: fmt(totalTaxable), suffix: t("currency") }),
        /* @__PURE__ */ jsx(SummaryStat, { label: t("vatAmount"), value: fmt(totalVat), suffix: t("currency"), tone: accent }),
        /* @__PURE__ */ jsx(SummaryStat, { label: t("totalWithVat"), value: fmt(totalTaxable + totalVat), suffix: t("currency") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3", children: t("breakdownByRate") }),
          /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-xl border border-border/50", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/30", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-start font-medium text-muted-foreground text-xs", children: t("vatRate") }),
              /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-end font-medium text-muted-foreground text-xs", children: t("invoiceCount") }),
              /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-end font-medium text-muted-foreground text-xs", children: t("taxableAmount") }),
              /* @__PURE__ */ jsx("th", { className: "px-3 py-2 text-end font-medium text-muted-foreground text-xs", children: t("vatAmount") })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: byRate.map(([rate, v]) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border/40", children: [
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("span", { className: cn("px-2 py-0.5 rounded-md text-xs font-semibold border", rate === 0 ? "bg-muted/50 text-muted-foreground border-border/40" : accent === "success" ? "bg-success/15 text-success border-success/30" : "bg-info/15 text-info border-info/30"), children: rate === 0 ? t("zeroRated") : t("standardRate") }) }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-end tabular text-muted-foreground", children: v.count }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-end tabular", children: fmt(v.taxable) }),
              /* @__PURE__ */ jsx("td", { className: cn("px-3 py-2 text-end tabular font-semibold", accentText), children: fmt(v.vat) })
            ] }, rate)) }),
            /* @__PURE__ */ jsx("tfoot", { className: "bg-muted/40 border-t-2 border-border", children: /* @__PURE__ */ jsxs("tr", { className: "font-semibold text-xs", children: [
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 uppercase tracking-wide text-muted-foreground", children: t("totalSelected") }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-end tabular", children: filtered.length }),
              /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-end tabular", children: fmt(totalTaxable) }),
              /* @__PURE__ */ jsx("td", { className: cn("px-3 py-2 text-end tabular", accentText), children: fmt(totalVat) })
            ] }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3", children: t("breakdownByCategory") }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: byCategory.map(([cat, v]) => {
            const share = totalVat > 0 ? v.vat / totalVat * 100 : 0;
            return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border/50 bg-card/40 px-3 py-2.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium truncate", children: t(cat) }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground whitespace-nowrap", children: [
                    "(",
                    v.count,
                    ")"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2 whitespace-nowrap", children: [
                  /* @__PURE__ */ jsx("span", { className: cn("tabular text-sm font-semibold", accentText), children: fmt(v.vat) }),
                  /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-muted-foreground tabular", children: [
                    share.toFixed(1),
                    "%"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 h-1.5 rounded-full bg-muted/40 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: cn("h-full rounded-full transition-all", barColor), style: {
                width: `${Math.max(share, 2)}%`
              } }) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  t("taxableAmount"),
                  ": ",
                  /* @__PURE__ */ jsx("span", { className: "tabular", children: fmt(v.taxable) })
                ] }),
                /* @__PURE__ */ jsx("span", { children: t("shareOfTotal") })
              ] })
            ] }, cat);
          }) })
        ] })
      ] })
    ] })
  ] });
}
function SummaryStat({
  label,
  value,
  suffix,
  tone
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "info" ? "text-info" : "text-foreground";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border/50 bg-card/40 px-3 py-2.5", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wide", children: label }),
    /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-baseline gap-1", children: [
      /* @__PURE__ */ jsx("span", { className: cn("tabular text-lg font-bold leading-none", toneClass), children: value }),
      suffix && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: suffix })
    ] })
  ] });
}
export {
  VatPage as component
};
