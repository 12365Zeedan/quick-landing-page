import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { BookOpenCheck, Filter, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { AccountPicker } from "@/components/account-picker";
import { PaginationBar } from "@/components/pagination-bar";
import { DatePickerInput } from "@/components/date-picker-input";
import { useApp } from "@/lib/app-context";
import { useOrg } from "@/lib/org-context";
import { usePagination } from "@/lib/use-pagination";
import { buildJournal, findAccount, loadChartFor, type JournalLine, type Account } from "@/lib/journal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journal-entries")({
  head: () => ({
    meta: [
      { title: "Journal & Ledger — PharmLedger" },
      { name: "description", content: "Double-entry journal and per-account ledger." },
    ],
  }),
  component: JournalPage,
});

const sourceLabel: Record<JournalLine["source"], { ar: string; en: string; tone: string }> = {
  revenue: { ar: "إيرادات", en: "Revenue", tone: "bg-sky-500/10 text-sky-500 border-sky-500/30" },
  expense: { ar: "مصروفات", en: "Expense", tone: "bg-violet-500/10 text-violet-500 border-violet-500/30" },
  purchase: { ar: "مشتريات", en: "Purchase", tone: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  debt: { ar: "ديون", en: "Debt", tone: "bg-rose-500/10 text-rose-500 border-rose-500/30" },
};

function JournalPage() {
  const { t, lang, fmt, dir } = useApp();
  const { currentOrg } = useOrg();
  const [tab, setTab] = useState<"journal" | "ledger">("journal");
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [chart, setChart] = useState<Account[]>([]);
  const [account, setAccount] = useState<string | undefined>();
  const [source, setSource] = useState<"all" | JournalLine["source"]>("all");
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

  // Auto-refresh when underlying data changes (e.g. revenue/expenses edited in another tab).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (
        e.key.startsWith("pharmledger.revenue.") ||
        e.key.startsWith("pharmledger.expenses.") ||
        e.key.startsWith("pharmledger.purchases.") ||
        e.key.startsWith("pharmledger.debts.") ||
        e.key.startsWith("pl_chart_of_accounts.")
      ) {
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
    const fromTs = from ? new Date(from + "T00:00:00").getTime() : -Infinity;
    const toTs = to ? new Date(to + "T23:59:59").getTime() : Infinity;
    return lines.filter((l) => {
      if (source !== "all" && l.source !== source) return false;
      if (account && l.accountCode !== account) return false;
      const ts = new Date(l.date).getTime();
      if (ts < fromTs || ts > toTs) return false;
      return true;
    });
  }, [lines, source, account, from, to]);

  // Group journal lines by entryId for the journal view
  const grouped = useMemo(() => {
    const groups = new Map<string, JournalLine[]>();
    for (const l of filtered) {
      if (!groups.has(l.entryId)) groups.set(l.entryId, []);
      groups.get(l.entryId)!.push(l);
    }
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b[0].date).getTime() - new Date(a[0].date).getTime(),
    );
  }, [filtered]);

  // Ledger: sort by date asc and compute running balance
  const ledger = useMemo(() => {
    if (!account) return { rows: [] as Array<JournalLine & { balance: number }>, totalD: 0, totalC: 0 };
    const acct = findAccount(chart, account);
    const sign = acct?.nature === "debit" ? 1 : -1;
    const sorted = filtered.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let bal = 0;
    let td = 0, tc = 0;
    const rows = sorted.map((l) => {
      bal += sign * (l.debit - l.credit);
      td += l.debit;
      tc += l.credit;
      return { ...l, balance: bal };
    });
    return { rows: rows.reverse(), totalD: td, totalC: tc };
  }, [filtered, account, chart]);

  const totals = useMemo(() => {
    let d = 0, c = 0;
    filtered.forEach((l) => { d += l.debit; c += l.credit; });
    return { d, c };
  }, [filtered]);

  const sourceCounts = useMemo(() => {
    const c = { revenue: 0, expense: 0, purchase: 0, debt: 0, total: lines.length };
    for (const l of lines) c[l.source]++;
    return c;
  }, [lines]);

  const pgJournal = usePagination(grouped);
  const pgLedger = usePagination(ledger.rows);




  const accountName = (code: string) => {
    const a = findAccount(chart, code);
    if (!a) return code;
    return lang === "ar" ? a.nameAr : a.nameEn;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB");
    } catch {
      return iso.slice(0, 10);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl gradient-primary grid place-items-center glow-primary">
                <BookOpenCheck className="size-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t("journalAndLedger")}</h1>
                <p className="text-sm text-muted-foreground">{t("journalSubtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="h-10 px-3 rounded-lg bg-card border border-border text-sm flex items-center gap-2 hover:bg-muted"
            >
              <RefreshCw className="size-4" /> {t("refresh")}
            </button>
          </header>

          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("journal")}
              className={cn(
                "h-9 px-4 rounded-lg text-sm font-semibold transition",
                tab === "journal"
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t("journal")}
            </button>
            <button
              onClick={() => setTab("ledger")}
              className={cn(
                "h-9 px-4 rounded-lg text-sm font-semibold transition",
                tab === "ledger"
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t("ledger")}
            </button>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-xs text-muted-foreground space-y-1">
              <span className="flex items-center gap-1"><Filter className="size-3" /> {t("account")}</span>
              <AccountPicker value={account} onChange={setAccount} placeholder={tab === "ledger" ? t("selectAccount") : t("allAccounts")} />
            </label>
            <label className="text-xs text-muted-foreground space-y-1">
              <span>{t("source")}</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="all">{t("all")}</option>
                <option value="revenue">{sourceLabel.revenue[lang]}</option>
                <option value="expense">{sourceLabel.expense[lang]}</option>
                <option value="purchase">{sourceLabel.purchase[lang]}</option>
                <option value="debt">{sourceLabel.debt[lang]}</option>
              </select>
            </label>
            <label className="text-xs text-muted-foreground space-y-1">
              <span>{t("dateFrom")}</span>
              <DatePickerInput
                value={from}
                onChange={setFrom}
                className="w-full h-10 px-3 rounded-xl bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label className="text-xs text-muted-foreground space-y-1">
              <span>{t("dateTo")}</span>
              <DatePickerInput
                value={to}
                onChange={setTo}
                className="w-full h-10 px-3 rounded-xl bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label={t("totalDebit")} value={fmt(tab === "ledger" ? ledger.totalD : totals.d)} tone="text-emerald-500" />
            <Stat label={t("totalCredit")} value={fmt(tab === "ledger" ? ledger.totalC : totals.c)} tone="text-rose-500" />
            <Stat label={t("difference")} value={fmt(Math.abs((tab === "ledger" ? ledger.totalD : totals.d) - (tab === "ledger" ? ledger.totalC : totals.c)))} tone="text-amber-500" />
            <Stat label={t("entriesCount")} value={String(tab === "ledger" ? ledger.rows.length : grouped.length)} tone="text-primary" />
          </div>

          {/* Content */}
          {tab === "journal" ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground text-xs">
                    <tr>
                      <th className="text-start font-medium py-3 px-3">{t("dateLabel")}</th>
                      <th className="text-start font-medium py-3 px-3">{t("source")}</th>
                      <th className="text-start font-medium py-3 px-3">{t("reference")}</th>
                      <th className="text-start font-medium py-3 px-3">{t("account")}</th>
                      <th className="text-end font-medium py-3 px-3">{t("debit")}</th>
                      <th className="text-end font-medium py-3 px-3">{t("credit")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                          <div>{t("noJournalLines")}</div>
                          <div className="mt-2 text-[11px] opacity-70 tabular">
                            {sourceCounts.total} {t("entriesCount")} · {sourceLabel.revenue[lang]}: {sourceCounts.revenue} · {sourceLabel.expense[lang]}: {sourceCounts.expense} · {sourceLabel.purchase[lang]}: {sourceCounts.purchase} · {sourceLabel.debt[lang]}: {sourceCounts.debt}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      grouped.length > 0 && pgJournal.pageItems.map((group, gi) => (
                        <Fragment key={group[0].entryId}>
                          {group.map((l, i) => (
                            <tr
                              key={l.id}
                              className={cn(
                                "border-t border-border/60 hover:bg-muted/30",
                                i === 0 && gi > 0 && "border-t-2 border-t-border",
                              )}
                            >
                              <td className="py-2.5 px-3 text-muted-foreground tabular text-xs">
                                {i === 0 ? formatDate(l.date) : ""}
                              </td>
                              <td className="py-2.5 px-3">
                                {i === 0 && (
                                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", sourceLabel[l.source].tone)}>
                                    {sourceLabel[l.source][lang]}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground text-xs font-mono">
                                {i === 0 ? l.reference : ""}
                              </td>
                              <td className={cn("py-2.5 px-3", dir === "rtl" ? "pr-6" : "pl-6")}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-muted-foreground">{l.accountCode}</span>
                                  <span>{accountName(l.accountCode)}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground">{l.description}</div>
                              </td>
                              <td className="py-2.5 px-3 text-end tabular">
                                {l.debit > 0 ? <span className="text-emerald-500 font-semibold">{fmt(l.debit)}</span> : <span className="text-muted-foreground/50">—</span>}
                              </td>
                              <td className="py-2.5 px-3 text-end tabular">
                                {l.credit > 0 ? <span className="text-rose-500 font-semibold">{fmt(l.credit)}</span> : <span className="text-muted-foreground/50">—</span>}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
                <PaginationBar page={pgJournal.page} totalPages={pgJournal.totalPages} total={pgJournal.total} from={pgJournal.from} to={pgJournal.to} onPageChange={pgJournal.setPage} showAll={pgJournal.showAll} onToggleShowAll={pgJournal.toggleShowAll} />
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              {!account ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  <div>{t("ledgerPickAccount")}</div>
                  <div className="mt-2 text-[11px] opacity-70 tabular">
                    {sourceCounts.total} {t("entriesCount")} · {sourceLabel.revenue[lang]}: {sourceCounts.revenue} · {sourceLabel.expense[lang]}: {sourceCounts.expense} · {sourceLabel.purchase[lang]}: {sourceCounts.purchase} · {sourceLabel.debt[lang]}: {sourceCounts.debt}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 text-muted-foreground text-xs">
                      <tr>
                        <th className="text-start font-medium py-3 px-3">{t("dateLabel")}</th>
                        <th className="text-start font-medium py-3 px-3">{t("source")}</th>
                        <th className="text-start font-medium py-3 px-3">{t("reference")}</th>
                        <th className="text-start font-medium py-3 px-3">{t("description")}</th>
                        <th className="text-end font-medium py-3 px-3">{t("debit")}</th>
                        <th className="text-end font-medium py-3 px-3">{t("credit")}</th>
                        <th className="text-end font-medium py-3 px-3">{t("balance")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-muted-foreground">
                            <div>{t("noJournalLines")}</div>
                            <div className="mt-2 text-[11px] opacity-70 tabular">
                              {sourceCounts.total} {t("entriesCount")} · {sourceLabel.revenue[lang]}: {sourceCounts.revenue} · {sourceLabel.expense[lang]}: {sourceCounts.expense} · {sourceLabel.purchase[lang]}: {sourceCounts.purchase} · {sourceLabel.debt[lang]}: {sourceCounts.debt}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        ledger.rows.length > 0 && pgLedger.pageItems.map((l) => (
                          <tr key={l.id} className="border-t border-border/60 hover:bg-muted/30">
                            <td className="py-2.5 px-3 text-muted-foreground tabular text-xs">{formatDate(l.date)}</td>
                            <td className="py-2.5 px-3">
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", sourceLabel[l.source].tone)}>
                                {sourceLabel[l.source][lang]}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs font-mono text-muted-foreground">{l.reference}</td>
                            <td className="py-2.5 px-3">{l.description}</td>
                            <td className="py-2.5 px-3 text-end tabular">
                              {l.debit > 0 ? <span className="text-emerald-500 font-semibold">{fmt(l.debit)}</span> : <span className="text-muted-foreground/50">—</span>}
                            </td>
                            <td className="py-2.5 px-3 text-end tabular">
                              {l.credit > 0 ? <span className="text-rose-500 font-semibold">{fmt(l.credit)}</span> : <span className="text-muted-foreground/50">—</span>}
                            </td>
                            <td className="py-2.5 px-3 text-end tabular font-semibold">{fmt(l.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <PaginationBar page={pgLedger.page} totalPages={pgLedger.totalPages} total={pgLedger.total} from={pgLedger.from} to={pgLedger.to} onPageChange={pgLedger.setPage} showAll={pgLedger.showAll} onToggleShowAll={pgLedger.toggleShowAll} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-bold tabular mt-1", tone)}>{value}</div>
    </div>
  );
}
