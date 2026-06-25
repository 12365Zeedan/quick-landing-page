// Derives all aggregate financial data from per-organization localStorage.
// Single source of truth used by Dashboard, Statements, VAT, and other reports.
import { useEffect, useMemo, useState } from "react";
import { useOrg } from "@/lib/org-context";
import type {
  DebtRecord,
  ExpenseEntry,
  PurchaseEntry,
  RevenueEntry,
  StaffMember,
} from "@/lib/mock-data";
import {
  computePurchaseAging,
  getSupplierPaymentAllocations,
  reconcileSupplierAccounting,
  type SupplierPaymentForAccounting,
} from "@/lib/supplier-accounting";



function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export interface LiveFinancials {
  revenues: RevenueEntry[];
  expenses: ExpenseEntry[];
  purchases: PurchaseEntry[];
  debts: DebtRecord[];
  staff: StaffMember[];

  grossRevenue: number;     // cash + bank + wasfaty + discount (VAT-inclusive)
  netRevenue: number;       // cash + bank + wasfaty (VAT-inclusive)
  netRevenueExVat: number;  // netRevenue - outputVat
  totalDiscount: number;
  cashRevenue: number;
  bankRevenue: number;
  wasfatyRevenue: number;

  totalExpenses: number;    // includes VAT
  expensesSubtotal: number;
  expensesVat: number;
  expensesCash: number;
  expensesBank: number;

  purchasesSubtotal: number;
  purchasesVat: number;
  purchasesTotal: number;
  purchasesPaid: number;
  purchasesOutstanding: number;

  todayRevenue: number;
  todayExpenses: number;

  netProfit: number;        // netRevenueExVat - totalExpenses
  cashBalance: number;      // cashRevenue - expensesCash - purchasesPaidCash
  outstandingDebts: number; // combined open balance (receivables + payables)
  outstandingReceivables: number;
  outstandingPayables: number; // EXCLUDES auto-mirrored purchase debts (those are already in purchasesOutstanding)

  // VAT
  outputVat: number;        // sum of manually-entered vat fields on revenue entries
  inputVat: number;         // expenses.vat + purchases.vat
  netVat: number;           // outputVat - inputVat

  // Series for charts (last 30 days)
  dailySeries: Array<{ day: number; label: string; revenue: number; expenses: number }>;
  paymentMix: Array<{ name: string; value: number }>;
  monthlyProfit: Array<{ month: string; profit: number }>;
  cashFlow: Array<{ day: number; balance: number }>;
  recentTransactions: Array<{ id: string; kind: "income" | "expense"; category: string; method: string; amount: number; time: string }>;
  topSuppliers: Array<{ id: string; name: { ar: string; en: string }; total: number }>;
  overdueDebts: Array<{ id: string; party: { ar: string; en: string }; amount: number; days: number }>;
  agingBuckets: Record<"1" | "2" | "3" | "4" | "5" | "+5", number>;
}

export interface FinancialsRange {
  from?: string; // ISO yyyy-MM-dd
  to?: string;   // ISO yyyy-MM-dd (inclusive)
}

export function useFinancials(range?: FinancialsRange): LiveFinancials {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const [stamp, setStamp] = useState(0);
  const rangeKey = `${range?.from ?? ""}|${range?.to ?? ""}`;

  // Reload on org switch and on cross-tab storage events.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: StorageEvent) => {
      if (!e.key) return setStamp((s) => s + 1);
      if (e.key.startsWith("pharmledger.")) setStamp((s) => s + 1);
    };
    window.addEventListener("storage", handler);
    const t = setInterval(() => setStamp((s) => s + 1), 4000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(t);
    };
  }, []);

  return useMemo<LiveFinancials>(() => {
    if (!orgId) return emptyFinancials();

    const fromTs = range?.from ? new Date(range.from + "T00:00:00").getTime() : -Infinity;
    const toTs = range?.to ? new Date(range.to + "T23:59:59").getTime() : Infinity;
    const inRange = (dateStr: string | undefined) => {
      if (!dateStr) return true;
      const t = new Date(dateStr).getTime();
      if (isNaN(t)) return true;
      return t >= fromTs && t <= toTs;
    };

    const allRevenues = readArray<RevenueEntry>(`pharmledger.revenue.entries.v2.${orgId}`);
    const allExpenses = readArray<ExpenseEntry>(`pharmledger.expenses.v1.${orgId}`);
    const rawPurchases = readArray<PurchaseEntry>(`pharmledger.purchases.v1.${orgId}`);
    const rawSupplierPayments = readArray<SupplierPaymentForAccounting & { method?: string }>(`pharmledger.supplier-payments.v1.${orgId}`);
    const reconciledSupplierAccounting = reconcileSupplierAccounting(rawPurchases, rawSupplierPayments);
    const allPurchases = reconciledSupplierAccounting.purchases;
    const supplierPayments = reconciledSupplierAccounting.payments;
    const debts = readArray<DebtRecord>(`pharmledger.debts.v1.${orgId}`);
    const staff = readArray<StaffMember>(`staff.members.${orgId}`);

    const revenues = allRevenues.filter((r) => inRange(r.date));
    const expenses = allExpenses.filter((e) => inRange(e.date));
    const purchases = allPurchases.filter((p) => inRange(p.date));

    const cashRevenue = revenues.reduce((s, r) => s + (Number(r.cash) || 0), 0);
    const bankRevenue = revenues.reduce((s, r) => s + (Number(r.bank) || 0), 0);
    const wasfatyRevenue = revenues.reduce((s, r) => s + (Number(r.wasfaty) || 0), 0);
    const totalDiscount = revenues.reduce((s, r) => s + (Number(r.discount) || 0), 0);
    // Wasfaty is excluded from gross/net revenue and all downstream financial calculations.
    const netRevenue = cashRevenue + bankRevenue;
    const grossRevenue = netRevenue + totalDiscount;

    const expensesSubtotal = expenses.reduce((s, e) => s + (Number(e.subtotal) || 0), 0);
    const expensesVat = expenses.reduce((s, e) => s + (Number(e.vat) || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const expensesCash = expenses.filter((e) => e.method === "cash").reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const expensesBank = expenses.filter((e) => e.method !== "cash").reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const purchasesSubtotal = purchases.reduce((s, p) => s + (Number(p.subtotal) || 0), 0);
    const purchasesVat = purchases.reduce((s, p) => s + (Number(p.vat) || 0), 0);
    const purchasesTotal = purchases.reduce((s, p) => s + (Number(p.total) || 0), 0);
    const purchasesPaid = purchases.reduce((s, p) => s + (Number(p.paid) || 0), 0);
    const purchasesOutstanding = (purchasesTotal - purchasesPaid);
    const allocatedPaidByPurchase = getSupplierPaymentAllocations(purchases, supplierPayments);
    const directPurchasePaid = (p: PurchaseEntry) => {
      const paid = Number(p.paid) || 0;
      if (paid <= 0) return paid;
      return Math.max(0, paid - (allocatedPaidByPurchase.get(p.id) || 0));
    };
    const purchasesPaidCash = purchases
      .filter((p) => p.method === "cash")
      .reduce((s, p) => s + directPurchasePaid(p), 0)
      + supplierPayments
        .filter((p) => p.method === "cash")
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const now = new Date();
    const todayRevenue = revenues
      .filter((r) => sameDay(new Date(r.date), now))
      .reduce((s, r) => s + (Number(r.cash) || 0) + (Number(r.bank) || 0), 0);
    const todayExpenses = expenses
      .filter((e) => sameDay(new Date(e.date), now))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // VAT is entered manually per revenue entry (no auto back-calc).
    const storedOutputVat = revenues.reduce((s, r) => s + (Number((r as { vat?: number }).vat) || 0), 0);
    const outputVat = Math.round(storedOutputVat * 100) / 100;
    const inputVat = expensesVat + purchasesVat;
    const netVat = outputVat - inputVat;

    // Revenue figures store VAT-inclusive amounts; strip output VAT to get
    // the true revenue used in profit calculations.
    const netRevenueExVat = (netRevenue - outputVat);
    const netProfit = netRevenueExVat - totalExpenses;
    const cashBalance = cashRevenue - expensesCash - purchasesPaidCash;

    const openDebts = debts.filter((d) => d.status !== "settled");
    const outstandingReceivables = openDebts
      .filter((d) => d.kind === "receivable")
      .reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0);
    // Exclude auto-mirrored purchase rows (those balances are already captured in purchasesOutstanding).
    const outstandingPayables = openDebts
      .filter((d) => d.kind === "payable" && !String(d.id).startsWith("AUTO-PUR-"))
      .reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0);
    const outstandingDebts = outstandingReceivables + outstandingPayables;

    // --- Series window: respects selected range when provided ---
    const seriesEnd = range?.to ? new Date(range.to + "T00:00:00") : new Date(now);
    seriesEnd.setHours(0, 0, 0, 0);
    const defaultDailyStart = new Date(seriesEnd);
    defaultDailyStart.setDate(defaultDailyStart.getDate() - 29);
    const seriesStart = range?.from ? new Date(range.from + "T00:00:00") : defaultDailyStart;
    seriesStart.setHours(0, 0, 0, 0);
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.min(366, Math.round((seriesEnd.getTime() - seriesStart.getTime()) / dayMs) + 1));

    const days: Array<{ day: number; label: string; revenue: number; expenses: number }> = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(seriesStart);
      d.setDate(seriesStart.getDate() + i);
      const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      const rev = revenues
        .filter((r) => sameDay(new Date(r.date), d))
        .reduce((s, r) => s + (Number(r.cash) || 0) + (Number(r.bank) || 0), 0);
      const exp = expenses
        .filter((e) => sameDay(new Date(e.date), d))
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      days.push({ day: i + 1, label: dayLabel, revenue: rev, expenses: exp });
    }

    const mixTotal = cashRevenue + bankRevenue;
    const pct = (n: number) => (mixTotal > 0 ? Math.round((n / mixTotal) * 100) : 0);
    const paymentMix = [
      { name: "cash", value: pct(cashRevenue) },
      { name: "bank", value: pct(bankRevenue) },
    ];

    // Monthly profit: 12 months by default, or months covering selected range
    const monthlyProfit: Array<{ month: string; profit: number }> = [];
    const monthKey = (x: Date) => x.getFullYear() * 12 + x.getMonth();
    const mpEnd = range?.to ? new Date(range.to + "T00:00:00") : now;
    const mpStart = range?.from ? new Date(range.from + "T00:00:00") : new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthsCount = Math.max(1, Math.min(36, (mpEnd.getFullYear() - mpStart.getFullYear()) * 12 + (mpEnd.getMonth() - mpStart.getMonth()) + 1));
    for (let i = 0; i < monthsCount; i++) {
      const d = new Date(mpStart.getFullYear(), mpStart.getMonth() + i, 1);
      const key = monthKey(d);
      const monthRevenues = revenues.filter((r) => monthKey(new Date(r.date)) === key);
      const rev = monthRevenues
        .reduce((s, r) => s + (Number(r.cash) || 0) + (Number(r.bank) || 0), 0);
      const monthOutputVat = monthRevenues.reduce((s, r) => s + (Number((r as { vat?: number }).vat) || 0), 0);
      const exp = expenses
        .filter((e) => monthKey(new Date(e.date)) === key)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const purch = purchases
        .filter((p) => monthKey(new Date(p.date)) === key)
        .reduce((s, p) => s + (Number(p.subtotal) || 0), 0);
      monthlyProfit.push({
        month: d.toLocaleDateString("en", { month: "short" }),
        profit: rev - monthOutputVat - exp - purch,
      });
    }

    // Cash flow: running balance, default last 90 days, otherwise across range
    const cfEnd = range?.to ? new Date(range.to + "T00:00:00") : new Date(now);
    cfEnd.setHours(0, 0, 0, 0);
    const cfDefaultStart = new Date(cfEnd);
    cfDefaultStart.setDate(cfDefaultStart.getDate() - 89);
    const cfStart = range?.from ? new Date(range.from + "T00:00:00") : cfDefaultStart;
    cfStart.setHours(0, 0, 0, 0);
    const cfDays = Math.max(1, Math.min(366, Math.round((cfEnd.getTime() - cfStart.getTime()) / dayMs) + 1));
    const cashFlow: Array<{ day: number; balance: number }> = [];
    let running = 0;
    for (let i = 0; i < cfDays; i++) {
      const d = new Date(cfStart);
      d.setDate(cfStart.getDate() + i);
      const cashIn = revenues
        .filter((r) => sameDay(new Date(r.date), d))
        .reduce((s, r) => s + (Number(r.cash) || 0) + (Number(r.bank) || 0), 0);
      const cashOut = expenses
        .filter((e) => sameDay(new Date(e.date), d))
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      running += cashIn - cashOut;
      cashFlow.push({ day: i + 1, balance: running });
    }

    // Recent transactions (mixed revenue + expenses, latest 8)
    const recentTransactions = [
      ...revenues.map((r) => ({
        id: r.id,
        kind: "income" as const,
        category: r.reference || "sales",
        method: (Number(r.cash) || 0) >= (Number(r.bank) || 0) ? "cash" : "bank",
        amount: (Number(r.cash) || 0) + (Number(r.bank) || 0),
        time: r.date,
        ts: new Date(r.date).getTime(),
      })),
      ...expenses.map((e) => ({
        id: e.id,
        kind: "expense" as const,
        category: e.category,
        method: e.method,
        amount: Number(e.amount) || 0,
        time: e.date,
        ts: new Date(e.date).getTime(),
      })),
    ]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8)
      .map(({ ts: _ts, ...rest }) => rest);

    // Top suppliers from purchases
    const supMap = new Map<string, { name: { ar: string; en: string }; total: number }>();
    for (const p of purchases) {
      const key = p.supplier?.ar || p.supplier?.en || "—";
      const prev = supMap.get(key) ?? { name: p.supplier, total: 0 };
      prev.total += Number(p.total) || 0;
      supMap.set(key, prev);
    }
    const topSuppliers = Array.from(supMap.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Overdue debts
    const overdueDebts = debts
      .filter((d) => d.status !== "settled" && d.dueAt)
      .map((d) => {
        const due = new Date(d.dueAt);
        const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: d.id,
          party: d.party,
          amount: ((Number(d.amount) || 0) - (Number(d.paid) || 0)),
          days: Math.max(0, diff),
        };
      })
      .filter((d) => d.days > 0 && d.amount > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 8);

    return {
      revenues, expenses, purchases, debts, staff,
      grossRevenue, netRevenue, netRevenueExVat, totalDiscount, cashRevenue, bankRevenue, wasfatyRevenue,
      totalExpenses, expensesSubtotal, expensesVat, expensesCash, expensesBank,
      purchasesSubtotal, purchasesVat, purchasesTotal, purchasesPaid, purchasesOutstanding,
      todayRevenue, todayExpenses, netProfit, cashBalance, outstandingDebts, outstandingReceivables, outstandingPayables,
      outputVat, inputVat, netVat,
      dailySeries: days, paymentMix, monthlyProfit, cashFlow,
      recentTransactions, topSuppliers, overdueDebts,
      agingBuckets: computePurchaseAging(allPurchases).buckets,

    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, stamp, rangeKey]);
}

function emptyFinancials(): LiveFinancials {
  return {
    revenues: [], expenses: [], purchases: [], debts: [], staff: [],
    grossRevenue: 0, netRevenue: 0, netRevenueExVat: 0, totalDiscount: 0, cashRevenue: 0, bankRevenue: 0, wasfatyRevenue: 0,
    totalExpenses: 0, expensesSubtotal: 0, expensesVat: 0, expensesCash: 0, expensesBank: 0,
    purchasesSubtotal: 0, purchasesVat: 0, purchasesTotal: 0, purchasesPaid: 0, purchasesOutstanding: 0,
    todayRevenue: 0, todayExpenses: 0, netProfit: 0, cashBalance: 0, outstandingDebts: 0, outstandingReceivables: 0, outstandingPayables: 0,
    outputVat: 0, inputVat: 0, netVat: 0,
    dailySeries: [], paymentMix: [], monthlyProfit: [], cashFlow: [],
    recentTransactions: [], topSuppliers: [], overdueDebts: [],
    agingBuckets: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "+5": 0 },

  };
}
