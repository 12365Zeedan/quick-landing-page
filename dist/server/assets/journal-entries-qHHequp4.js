import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useMemo, Fragment } from "react";
import { toast } from "sonner";
import { BookOpenCheck, RefreshCw, Filter } from "lucide-react";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { w as useApp, y as useOrg, e as buildJournal, n as loadChartFor, i as findAccount, g as cn, A as AccountPicker, c as DatePickerInput } from "./router-CH3R9Cfm.js";
import { u as usePagination, P as PaginationBar } from "./use-pagination-DIgFAfhb.js";
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
const sourceLabel = {
  revenue: {
    ar: "إيرادات",
    en: "Revenue",
    tone: "bg-sky-500/10 text-sky-500 border-sky-500/30"
  },
  expense: {
    ar: "مصروفات",
    en: "Expense",
    tone: "bg-violet-500/10 text-violet-500 border-violet-500/30"
  },
  purchase: {
    ar: "مشتريات",
    en: "Purchase",
    tone: "bg-amber-500/10 text-amber-500 border-amber-500/30"
  },
  debt: {
    ar: "ديون",
    en: "Debt",
    tone: "bg-rose-500/10 text-rose-500 border-rose-500/30"
  }
};
function JournalPage() {
  const {
    t,
    lang,
    fmt,
    dir
  } = useApp();
  const {
    currentOrg
  } = useOrg();
  const [tab, setTab] = useState("journal");
  const [lines, setLines] = useState([]);
  const [chart, setChart] = useState([]);
  const [account, setAccount] = useState();
  const [source, setSource] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stamp, setStamp] = useState(0);
  const reload = useCallback(() => {
    const next = buildJournal(currentOrg?.id);
    setLines(next);
    setChart(loadChartFor(currentOrg?.id));
    return next.length;
  }, [currentOrg?.id]);
  useEffect(() => {
    reload();
  }, [reload, stamp]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key.startsWith("pharmledger.revenue.") || e.key.startsWith("pharmledger.expenses.") || e.key.startsWith("pharmledger.purchases.") || e.key.startsWith("pharmledger.debts.") || e.key.startsWith("pl_chart_of_accounts.")) {
        reload();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reload]);
  const handleRefresh = () => {
    const n = reload();
    setStamp((s) => s + 1);
    toast.success(`${t("refresh")} — ${n} ${t("entriesCount")}`);
  };
  const filtered = useMemo(() => {
    const fromTs = from ? (/* @__PURE__ */ new Date(from + "T00:00:00")).getTime() : -Infinity;
    const toTs = to ? (/* @__PURE__ */ new Date(to + "T23:59:59")).getTime() : Infinity;
    return lines.filter((l) => {
      if (source !== "all" && l.source !== source) return false;
      if (account && l.accountCode !== account) return false;
      const ts = new Date(l.date).getTime();
      if (ts < fromTs || ts > toTs) return false;
      return true;
    });
  }, [lines, source, account, from, to]);
  const grouped = useMemo(() => {
    const groups = /* @__PURE__ */ new Map();
    for (const l of filtered) {
      if (!groups.has(l.entryId)) groups.set(l.entryId, []);
      groups.get(l.entryId).push(l);
    }
    return Array.from(groups.values()).sort((a, b) => new Date(b[0].date).getTime() - new Date(a[0].date).getTime());
  }, [filtered]);
  const ledger = useMemo(() => {
    if (!account) return {
      rows: [],
      totalD: 0,
      totalC: 0
    };
    const acct = findAccount(chart, account);
    const sign = acct?.nature === "debit" ? 1 : -1;
    const sorted = filtered.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let bal = 0;
    let td = 0, tc = 0;
    const rows = sorted.map((l) => {
      bal += sign * (l.debit - l.credit);
      td += l.debit;
      tc += l.credit;
      return {
        ...l,
        balance: bal
      };
    });
    return {
      rows: rows.reverse(),
      totalD: td,
      totalC: tc
    };
  }, [filtered, account, chart]);
  const totals = useMemo(() => {
    let d = 0, c = 0;
    filtered.forEach((l) => {
      d += l.debit;
      c += l.credit;
    });
    return {
      d,
      c
    };
  }, [filtered]);
  const sourceCounts = useMemo(() => {
    const c = {
      revenue: 0,
      expense: 0,
      purchase: 0,
      debt: 0,
      total: lines.length
    };
    for (const l of lines) c[l.source]++;
    return c;
  }, [lines]);
  const pgJournal = usePagination(grouped);
  const pgLedger = usePagination(ledger.rows);
  const accountName = (code) => {
    const a = findAccount(chart, code);
    if (!a) return code;
    return lang === "ar" ? a.nameAr : a.nameEn;
  };
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB");
    } catch {
      return iso.slice(0, 10);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen w-full", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 p-6 lg:p-8 space-y-6", children: [
        /* @__PURE__ */ jsxs("header", { className: "flex items-start justify-between gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "size-12 rounded-xl gradient-primary grid place-items-center glow-primary", children: /* @__PURE__ */ jsx(BookOpenCheck, { className: "size-6 text-primary-foreground" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: t("journalAndLedger") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("journalSubtitle") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: handleRefresh, className: "h-10 px-3 rounded-lg bg-card border border-border text-sm flex items-center gap-2 hover:bg-muted", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "size-4" }),
            " ",
            t("refresh")
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setTab("journal"), className: cn("h-9 px-4 rounded-lg text-sm font-semibold transition", tab === "journal" ? "gradient-primary text-primary-foreground glow-primary" : "bg-card border border-border text-muted-foreground hover:text-foreground"), children: t("journal") }),
          /* @__PURE__ */ jsx("button", { onClick: () => setTab("ledger"), className: cn("h-9 px-4 rounded-lg text-sm font-semibold transition", tab === "ledger" ? "gradient-primary text-primary-foreground glow-primary" : "bg-card border border-border text-muted-foreground hover:text-foreground"), children: t("ledger") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-xs text-muted-foreground space-y-1", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Filter, { className: "size-3" }),
              " ",
              t("account")
            ] }),
            /* @__PURE__ */ jsx(AccountPicker, { value: account, onChange: setAccount, placeholder: tab === "ledger" ? t("selectAccount") : t("allAccounts") })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "text-xs text-muted-foreground space-y-1", children: [
            /* @__PURE__ */ jsx("span", { children: t("source") }),
            /* @__PURE__ */ jsxs("select", { value: source, onChange: (e) => setSource(e.target.value), className: "w-full h-10 px-3 rounded-xl bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
              /* @__PURE__ */ jsx("option", { value: "all", children: t("all") }),
              /* @__PURE__ */ jsx("option", { value: "revenue", children: sourceLabel.revenue[lang] }),
              /* @__PURE__ */ jsx("option", { value: "expense", children: sourceLabel.expense[lang] }),
              /* @__PURE__ */ jsx("option", { value: "purchase", children: sourceLabel.purchase[lang] }),
              /* @__PURE__ */ jsx("option", { value: "debt", children: sourceLabel.debt[lang] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "text-xs text-muted-foreground space-y-1", children: [
            /* @__PURE__ */ jsx("span", { children: t("dateFrom") }),
            /* @__PURE__ */ jsx(DatePickerInput, { value: from, onChange: setFrom, className: "w-full h-10 px-3 rounded-xl bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "text-xs text-muted-foreground space-y-1", children: [
            /* @__PURE__ */ jsx("span", { children: t("dateTo") }),
            /* @__PURE__ */ jsx(DatePickerInput, { value: to, onChange: setTo, className: "w-full h-10 px-3 rounded-xl bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [
          /* @__PURE__ */ jsx(Stat, { label: t("totalDebit"), value: fmt(tab === "ledger" ? ledger.totalD : totals.d), tone: "text-emerald-500" }),
          /* @__PURE__ */ jsx(Stat, { label: t("totalCredit"), value: fmt(tab === "ledger" ? ledger.totalC : totals.c), tone: "text-rose-500" }),
          /* @__PURE__ */ jsx(Stat, { label: t("difference"), value: fmt(Math.abs((tab === "ledger" ? ledger.totalD : totals.d) - (tab === "ledger" ? ledger.totalC : totals.c))), tone: "text-amber-500" }),
          /* @__PURE__ */ jsx(Stat, { label: t("entriesCount"), value: String(tab === "ledger" ? ledger.rows.length : grouped.length), tone: "text-primary" })
        ] }),
        tab === "journal" ? /* @__PURE__ */ jsx("div", { className: "glass-card rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto", children: [
          /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/30 text-muted-foreground text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: t("dateLabel") }),
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: t("source") }),
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: t("reference") }),
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: t("account") }),
              /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("debit") }),
              /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("credit") })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: grouped.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 6, className: "text-center py-12 text-muted-foreground", children: [
              /* @__PURE__ */ jsx("div", { children: t("noJournalLines") }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 text-[11px] opacity-70 tabular", children: [
                sourceCounts.total,
                " ",
                t("entriesCount"),
                " · ",
                sourceLabel.revenue[lang],
                ": ",
                sourceCounts.revenue,
                " · ",
                sourceLabel.expense[lang],
                ": ",
                sourceCounts.expense,
                " · ",
                sourceLabel.purchase[lang],
                ": ",
                sourceCounts.purchase,
                " · ",
                sourceLabel.debt[lang],
                ": ",
                sourceCounts.debt
              ] })
            ] }) }) : grouped.length > 0 && pgJournal.pageItems.map((group, gi) => /* @__PURE__ */ jsx(Fragment, { children: group.map((l, i) => /* @__PURE__ */ jsxs("tr", { className: cn("border-t border-border/60 hover:bg-muted/30", i === 0 && gi > 0 && "border-t-2 border-t-border"), children: [
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-muted-foreground tabular text-xs", children: i === 0 ? formatDate(l.date) : "" }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3", children: i === 0 && /* @__PURE__ */ jsx("span", { className: cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", sourceLabel[l.source].tone), children: sourceLabel[l.source][lang] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-muted-foreground text-xs font-mono", children: i === 0 ? l.reference : "" }),
              /* @__PURE__ */ jsxs("td", { className: cn("py-2.5 px-3", dir === "rtl" ? "pr-6" : "pl-6"), children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-muted-foreground", children: l.accountCode }),
                  /* @__PURE__ */ jsx("span", { children: accountName(l.accountCode) })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: l.description })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-end tabular", children: l.debit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-emerald-500 font-semibold", children: fmt(l.debit) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/50", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-end tabular", children: l.credit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-rose-500 font-semibold", children: fmt(l.credit) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/50", children: "—" }) })
            ] }, l.id)) }, group[0].entryId)) })
          ] }),
          /* @__PURE__ */ jsx(PaginationBar, { page: pgJournal.page, totalPages: pgJournal.totalPages, total: pgJournal.total, from: pgJournal.from, to: pgJournal.to, onPageChange: pgJournal.setPage, showAll: pgJournal.showAll, onToggleShowAll: pgJournal.toggleShowAll })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "glass-card rounded-2xl overflow-hidden", children: !account ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center text-muted-foreground text-sm", children: [
          /* @__PURE__ */ jsx("div", { children: t("ledgerPickAccount") }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 text-[11px] opacity-70 tabular", children: [
            sourceCounts.total,
            " ",
            t("entriesCount"),
            " · ",
            sourceLabel.revenue[lang],
            ": ",
            sourceCounts.revenue,
            " · ",
            sourceLabel.expense[lang],
            ": ",
            sourceCounts.expense,
            " · ",
            sourceLabel.purchase[lang],
            ": ",
            sourceCounts.purchase,
            " · ",
            sourceLabel.debt[lang],
            ": ",
            sourceCounts.debt
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto", children: [
          /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-muted/30 text-muted-foreground text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: t("dateLabel") }),
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: t("source") }),
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: t("reference") }),
              /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-3 px-3", children: t("description") }),
              /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("debit") }),
              /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("credit") }),
              /* @__PURE__ */ jsx("th", { className: "text-end font-medium py-3 px-3", children: t("balance") })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: ledger.rows.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 7, className: "text-center py-12 text-muted-foreground", children: [
              /* @__PURE__ */ jsx("div", { children: t("noJournalLines") }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 text-[11px] opacity-70 tabular", children: [
                sourceCounts.total,
                " ",
                t("entriesCount"),
                " · ",
                sourceLabel.revenue[lang],
                ": ",
                sourceCounts.revenue,
                " · ",
                sourceLabel.expense[lang],
                ": ",
                sourceCounts.expense,
                " · ",
                sourceLabel.purchase[lang],
                ": ",
                sourceCounts.purchase,
                " · ",
                sourceLabel.debt[lang],
                ": ",
                sourceCounts.debt
              ] })
            ] }) }) : ledger.rows.length > 0 && pgLedger.pageItems.map((l) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border/60 hover:bg-muted/30", children: [
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-muted-foreground tabular text-xs", children: formatDate(l.date) }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3", children: /* @__PURE__ */ jsx("span", { className: cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", sourceLabel[l.source].tone), children: sourceLabel[l.source][lang] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-xs font-mono text-muted-foreground", children: l.reference }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3", children: l.description }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-end tabular", children: l.debit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-emerald-500 font-semibold", children: fmt(l.debit) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/50", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-end tabular", children: l.credit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-rose-500 font-semibold", children: fmt(l.credit) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/50", children: "—" }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-end tabular font-semibold", children: fmt(l.balance) })
            ] }, l.id)) })
          ] }),
          /* @__PURE__ */ jsx(PaginationBar, { page: pgLedger.page, totalPages: pgLedger.totalPages, total: pgLedger.total, from: pgLedger.from, to: pgLedger.to, onPageChange: pgLedger.setPage, showAll: pgLedger.showAll, onToggleShowAll: pgLedger.toggleShowAll })
        ] }) })
      ] })
    ] })
  ] });
}
function Stat({
  label,
  value,
  tone
}) {
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: cn("text-2xl font-bold tabular mt-1", tone), children: value })
  ] });
}
export {
  JournalPage as component
};
