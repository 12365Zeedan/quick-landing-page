import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CreditCard,
  Plus,
  Receipt,
  ShoppingCart,
  Timer,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calculator,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { KPICard } from "@/components/kpi-card";
import { DatePickerInput } from "@/components/date-picker-input";
import {
  CashFlowChart,
  MonthlyProfitChart,
  PaymentMixChart,
  RevenueExpenseChart,
} from "@/components/dashboard-charts";
import { useApp } from "@/lib/app-context";
import { useFinancials, type FinancialsRange } from "@/lib/use-financials";
import { useOrg } from "@/lib/org-context";
import { useOrgStorage } from "@/lib/use-org-storage";
import { cn } from "@/lib/utils";
import { RevenueDialog, nextReference } from "./revenue";
import { AddExpenseDialog } from "./expenses";
import { AddPurchaseDialog } from "./purchases";
import { LogShiftDialog, type ShiftLog } from "./staff";
import type { RevenueEntry, ExpenseEntry, PurchaseEntry, StaffMember } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PharmLedger — Pharmacy Financial Management" },
      {
        name: "description",
        content:
          "Modern financial management SaaS for pharmacies. Track revenue, expenses, VAT, payroll and statements in Arabic and English.",
      },
      { property: "og:title", content: "PharmLedger — Pharmacy Financial Management" },
      {
        property: "og:description",
        content: "Modern financial management for pharmacies. Built for Arabic-speaking owners.",
      },
    ],
  }),
  component: DashboardPage,
});

function readArr<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(key); const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function writeArr<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {}
}

type PeriodPreset = "all" | "month" | "quarter" | "half" | "year" | "custom";

function isoDay(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function rangeForPreset(preset: PeriodPreset): FinancialsRange {
  const today = new Date();
  const to = isoDay(today);
  if (preset === "all" || preset === "custom") return {};
  const months = preset === "month" ? 1 : preset === "quarter" ? 3 : preset === "half" ? 6 : 12;
  const from = new Date(today);
  from.setMonth(from.getMonth() - months);
  from.setDate(from.getDate() + 1);
  return { from: isoDay(from), to };
}

function DashboardPage() {
  const { t, fmt, lang, dir } = useApp();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id ?? "__none__";

  const [preset, setPreset] = useState<PeriodPreset>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const range = useMemo<FinancialsRange>(() => {
    if (preset === "custom") return { from: customFrom || undefined, to: customTo || undefined };
    return rangeForPreset(preset);
  }, [preset, customFrom, customTo]);

  const fin = useFinancials(range);
  const liveKpis = { ...fin, vatDue: fin.netVat };
  const recentTransactions = fin.recentTransactions;
  const topSuppliers = fin.topSuppliers;
  const overdueDebts = fin.overdueDebts;
  const kpis = {
    todayRevenueChange: 0, todayExpensesChange: 0, netProfitChange: 0,
    outstandingDebts: fin.outstandingDebts, outstandingDebtsChange: 0,
    cashBalanceChange: 0, vatDueChange: 0,
  };

  const [openRev, setOpenRev] = useState(false);
  const [openExp, setOpenExp] = useState(false);
  const [openPur, setOpenPur] = useState(false);
  const [openShift, setOpenShift] = useState(false);
  const [members] = useOrgStorage<StaffMember>("staff.members", []);
  const [, setShifts] = useOrgStorage<ShiftLog>("staff.shifts", []);

  const revKey = `pharmledger.revenue.entries.v2.${orgId}`;
  const expKey = `pharmledger.expenses.v1.${orgId}`;
  const purKey = `pharmledger.purchases.v1.${orgId}`;

  const addRevenue = (e: Omit<RevenueEntry, "id" | "reference">) => {
    const list = readArr<RevenueEntry>(revKey);
    const id = nextReference(list);
    const reference = `INV-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    writeArr(revKey, [{ ...e, id, reference } as RevenueEntry, ...list]);
    toast.success(t("addedRevenue"));
    setOpenRev(false);
  };
  const addExpense = (e: Omit<ExpenseEntry, "id" | "reference">) => {
    const list = readArr<ExpenseEntry>(expKey);
    const id = `EX-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    writeArr(expKey, [{ ...e, id, reference: id } as ExpenseEntry, ...list]);
    toast.success(t("addedExpense"));
    setOpenExp(false);
  };
  const addPurchase = (e: Omit<PurchaseEntry, "id">) => {
    const list = readArr<PurchaseEntry>(purKey);
    const id = `PO-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    writeArr(purKey, [{ ...e, id } as PurchaseEntry, ...list]);
    toast.success(t("addedPurchase"));
    setOpenPur(false);
  };
  const nextRevId = nextReference(readArr<RevenueEntry>(revKey));

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="px-4 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                {t("welcome")}, <span className="text-gradient">{t("admin")}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("overview")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <QuickAction icon={Plus} label={t("addRevenue")} variant="primary" onClick={() => setOpenRev(true)} />
              <QuickAction icon={Receipt} label={t("addExpense")} onClick={() => setOpenExp(true)} />
              <QuickAction icon={ShoppingCart} label={t("newPurchase")} onClick={() => setOpenPur(true)} />
              <QuickAction icon={Timer} label={t("logShift")} onClick={() => setOpenShift(true)} />
            </div>
          </div>

          {/* Period filter */}
          <PeriodFilter
            lang={lang}
            preset={preset}
            onPresetChange={setPreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />

          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard title={t("todayRevenue")} value={liveKpis.todayRevenue} change={kpis.todayRevenueChange} icon={TrendingUp} accent="primary" delay={0} />
            <KPICard title={t("todayExpenses")} value={liveKpis.todayExpenses} change={kpis.todayExpensesChange} icon={TrendingDown} accent="warning" delay={60} />
            <KPICard title={t("netProfit")} value={liveKpis.netProfit} change={kpis.netProfitChange} icon={Banknote} accent="success" delay={120} />
            <KPICard title={t("outstandingDebts")} value={kpis.outstandingDebts} change={kpis.outstandingDebtsChange} icon={CreditCard} accent="destructive" delay={180} />
            <KPICard title={t("cashBalance")} value={liveKpis.cashBalance} change={kpis.cashBalanceChange} icon={Wallet} accent="info" delay={240} />
            <KPICard title={t("vatDue")} value={liveKpis.vatDue} change={kpis.vatDueChange} icon={Calculator} accent="secondary" delay={300} />

          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2" title={t("revenueVsExpenses")} subtitle={periodLabel(lang, preset)}>
              <RevenueExpenseChart fin={fin} />
            </Card>
            <Card title={t("paymentMix")} subtitle={periodLabel(lang, preset)}>
              <PaymentMixChart fin={fin} />
            </Card>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card title={t("monthlyProfit")} subtitle={periodLabel(lang, preset)}>
              <MonthlyProfitChart fin={fin} />
            </Card>
            <Card title={t("cashFlow")} subtitle={periodLabel(lang, preset)}>
              <CashFlowChart fin={fin} />
            </Card>
          </div>


          {/* Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card title={t("recentTransactions")} className="xl:col-span-2">
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="text-start font-medium py-2.5">{t("type")}</th>
                      <th className="text-start font-medium">{t("category")}</th>
                      <th className="text-start font-medium hidden sm:table-cell">{t("date")}</th>
                      <th className="text-end font-medium">{t("amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/30 transition">
                        <td className="py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold",
                              tx.kind === "income"
                                ? "bg-success/15 text-success"
                                : "bg-warning/15 text-warning",
                            )}
                          >
                            {tx.kind === "income" ? "↑" : "↓"} {t(tx.kind === "income" ? "income" : "expense")}
                          </span>
                        </td>
                        <td className="py-3 capitalize text-foreground/90">{tx.category}</td>
                        <td className="py-3 text-muted-foreground tabular hidden sm:table-cell">{tx.time}</td>
                        <td className={cn("py-3 text-end font-semibold tabular", tx.kind === "income" ? "text-success" : "text-warning")}>
                          {tx.kind === "income" ? "+" : "−"}{fmt(tx.amount)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title={t("topSuppliers")}>
              <div className="space-y-3">
                {topSuppliers.map((s, i) => {
                  const max = topSuppliers[0].total;
                  const pct = (s.total / max) * 100;
                  return (
                    <div key={s.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="size-6 rounded-md bg-muted text-xs grid place-items-center font-bold text-muted-foreground shrink-0">
                            {i + 1}
                          </span>
                          <span className="truncate font-medium">{s.name[lang]}</span>
                        </div>
                        <span className="font-semibold tabular text-xs shrink-0">{fmt(s.total)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Debt aging buckets */}
          <Card title={t("agingBuckets")}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {([
                ["1", "bucket1", "info"],
                ["2", "bucket2", "info"],
                ["3", "bucket3", "warning"],
                ["4", "bucket4", "warning"],
                ["5", "bucket5", "destructive"],
                ["+5", "bucket5plus", "destructive"],
              ] as const).map(([k, label, tone]) => {
                const toneCls: Record<string, string> = {
                  info: "text-info border-info/30 bg-info/5",
                  warning: "text-warning border-warning/30 bg-warning/5",
                  destructive: "text-destructive border-destructive/30 bg-destructive/5",
                };
                return (
                  <div key={k} className={cn("rounded-xl border p-4", toneCls[tone])}>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{t(label)}</div>
                    <div className="font-bold tabular text-xl mt-1">
                      {fmt(fin.agingBuckets[k])} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>


          <div className="text-center text-xs text-muted-foreground py-4">
            {t("appName")} · © 2026
          </div>
        </main>
      </div>

      {openRev && (
        <RevenueDialog
          onClose={() => setOpenRev(false)}
          onSubmit={addRevenue}
          nextId={nextRevId}
        />
      )}
      {openExp && (
        <AddExpenseDialog onClose={() => setOpenExp(false)} onSubmit={addExpense} />
      )}
      {openPur && (
        <AddPurchaseDialog onClose={() => setOpenPur(false)} onSubmit={addPurchase} />
      )}
      {openShift && (
        <LogShiftDialog
          members={members}
          lang={lang}
          dir={dir}
          onClose={() => setOpenShift(false)}
          onSubmit={(entries) => {
            const withIds: ShiftLog[] = entries.map((entry) => ({
              ...entry,
              id: `SH-${String(Math.floor(Math.random() * 90000) + 10000)}`,
            }));
            setShifts((prev) => [...withIds, ...prev]);
            toast.success(lang === "ar" ? "تم تسجيل المناوبة" : "Shift logged");
            setOpenShift(false);
          }}
        />
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  variant = "default",
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  variant?: "default" | "primary";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-all border",
        variant === "primary"
          ? "gradient-primary text-primary-foreground border-transparent hover:opacity-90 glow-primary"
          : "bg-card hover:bg-muted border-border",
      )}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </button>
  );
}

function Card({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass-card rounded-2xl p-5 animate-fade-in", className)}>
      <div className="flex items-baseline justify-between mb-4 gap-2">
        <h3 className="font-semibold text-base">{title}</h3>
        {subtitle && (
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}

const PRESET_LABELS: Record<PeriodPreset, { ar: string; en: string }> = {
  all: { ar: "كل الفترة", en: "All time" },
  month: { ar: "آخر شهر", en: "Last month" },
  quarter: { ar: "آخر ربع سنة", en: "Last quarter" },
  half: { ar: "آخر نصف سنة", en: "Last 6 months" },
  year: { ar: "آخر سنة", en: "Last year" },
  custom: { ar: "فترة مخصصة", en: "Custom range" },
};

function periodLabel(lang: "ar" | "en", preset: PeriodPreset): string {
  return PRESET_LABELS[preset][lang];
}

function PeriodFilter({
  lang,
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  lang: "ar" | "en";
  preset: PeriodPreset;
  onPresetChange: (p: PeriodPreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
}) {
  const presets: PeriodPreset[] = ["all", "month", "quarter", "half", "year", "custom"];
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-2 animate-fade-in">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide me-2">
        {lang === "ar" ? "الفترة" : "Period"}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPresetChange(p)}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-semibold border transition-all",
              preset === p
                ? "gradient-primary text-primary-foreground border-transparent glow-primary"
                : "bg-card hover:bg-muted border-border text-foreground/80",
            )}
          >
            {PRESET_LABELS[p][lang]}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2 ms-auto">
          <span className="text-xs text-muted-foreground">{lang === "ar" ? "من" : "From"}</span>
          <div className="w-40">
            <DatePickerInput value={customFrom} onChange={onCustomFromChange} />
          </div>
          <span className="text-xs text-muted-foreground">{lang === "ar" ? "إلى" : "To"}</span>
          <div className="w-40">
            <DatePickerInput value={customTo} onChange={onCustomToChange} />
          </div>
        </div>
      )}
    </div>
  );
}
