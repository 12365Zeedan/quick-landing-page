import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DatePickerInput } from "@/components/date-picker-input";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Download,
  FileBarChart2,
  Pencil,
  Printer,
    Scale,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useApp } from "@/lib/app-context";
import { useOrg } from "@/lib/org-context";
import { useFinancials } from "@/lib/use-financials";
import type { SupplierRecord } from "@/lib/mock-data";
import {
  getSupplierPaymentAllocations,
  supplierMatches,
  type SupplierPaymentForAccounting,
} from "@/lib/supplier-accounting";
import { cn } from "@/lib/utils";
import { useSortable } from "@/lib/use-sortable";
import { SortHeader } from "@/components/sort-header";

interface FixedAssetOpening {
  id: string;
  name: string;
  amount: number;
}
interface Openings {
  cash: number;
  bank: number;
  inventory: number;
  inventoryVat: number;
  closingInventory: number;
  closingInventoryVat: number;
  drawerCustody: number;
  equipmentOpening: number;
  supplierDebts: Record<string, number>;
  fixedAssets: FixedAssetOpening[];
}
const EMPTY_OPENINGS: Openings = { cash: 0, bank: 0, inventory: 0, inventoryVat: 0, closingInventory: 0, closingInventoryVat: 0, drawerCustody: 0, equipmentOpening: 0, supplierDebts: {}, fixedAssets: [] };

function openingsKey(orgId: string) {
  return `pharmledger.openings.v1.${orgId}`;
}
function readOpenings(orgId: string | null): Openings {
  if (!orgId || typeof window === "undefined") return EMPTY_OPENINGS;
  try {
    const raw = localStorage.getItem(openingsKey(orgId));
    if (!raw) return EMPTY_OPENINGS;
    const v = JSON.parse(raw);
    return {
      cash: Number(v.cash) || 0,
      bank: Number(v.bank) || 0,
      inventory: Number(v.inventory) || 0,
      inventoryVat: Number(v.inventoryVat) || 0,
      closingInventory: Number(v.closingInventory) || 0,
      closingInventoryVat: Number(v.closingInventoryVat) || 0,
      drawerCustody: Number(v.drawerCustody) || 0,
      equipmentOpening: Number(v.equipmentOpening) || 0,
      supplierDebts: (v.supplierDebts && typeof v.supplierDebts === "object") ? v.supplierDebts : {},
      fixedAssets: Array.isArray(v.fixedAssets)
        ? v.fixedAssets.map((a: any) => ({
            id: String(a.id ?? Math.random().toString(36).slice(2)),
            name: String(a.name ?? ""),
            amount: Number(a.amount) || 0,
          }))
        : [],
    };
  } catch {
    return EMPTY_OPENINGS;
  }
}
function readSuppliers(orgId: string | null): SupplierRecord[] {
  if (!orgId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`suppliers.records.v1.${orgId}`);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function readSupplierPayments(orgId: string | null): SupplierPaymentForAccounting[] {
  if (!orgId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`pharmledger.supplier-payments.v1.${orgId}`);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


export const Route = createFileRoute("/statements")({
  head: () => ({
    meta: [
      { title: "Financial Statements — PharmLedger" },
      {
        name: "description",
        content: "Profit & loss, balance sheet and cash flow statements for the pharmacy.",
      },
    ],
  }),
  component: StatementsPage,
});

type Tab = "pl" | "bs" | "cf" | "sl";
type PeriodFilter = "month" | "quarter" | "year" | "all" | "custom";

function getRange(filter: PeriodFilter, from: string, to: string) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  switch (filter) {
    case "month":
      start.setDate(1);
      break;
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      start.setMonth(q * 3, 1);
      break;
    }
    case "year":
      start.setMonth(0, 1);
      break;
    case "all":
      start = new Date(0);
      break;
    case "custom":
      if (from) start = new Date(from);
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        return { start, end: d };
      }
      break;
  }
  return { start, end };
}

function StatementsPage() {
  const { t, fmt, lang, dir } = useApp();
  const navigate = useNavigate();
  const fin = useFinancials();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const [tab, setTab] = useState<Tab>("pl");

  const openPurchaseForEdit = (purchaseId: string) => {
    try {
      sessionStorage.setItem("pharmledger.open.editPurchase", purchaseId);
    } catch {}
    navigate({ to: "/purchases" });
  };


  const [openings, setOpenings] = useState<Openings>(EMPTY_OPENINGS);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPaymentForAccounting[]>([]);
  const [openingsOpen, setOpeningsOpen] = useState(false);

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [slFrom, setSlFrom] = useState("");
  const [slTo, setSlTo] = useState("");

  useEffect(() => {
    setOpenings(readOpenings(orgId));
    setSuppliers(readSuppliers(orgId));
    setSupplierPayments(readSupplierPayments(orgId));
  }, [orgId]);
  const saveOpenings = (next: Openings) => {
    const cleaned: Openings = { ...next, supplierDebts: {} };
    setOpenings(cleaned);
    if (orgId && typeof window !== "undefined") {
      localStorage.setItem(openingsKey(orgId), JSON.stringify(cleaned));
    }
    toast.success(t("saveChanges"));
  };
  const openingSupplierDebtsTotal = Object.values(openings.supplierDebts).reduce(
    (s, v) => s + (Number(v) || 0),
    0,
  );

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getRange(periodFilter, customFrom, customTo),
    [periodFilter, customFrom, customTo],
  );


  const filteredPeriod = useMemo(() => {
    const revs = fin.revenues.filter((r) => {
      const date = new Date(r.date);
      return date >= rangeStart && date <= rangeEnd;
    });
    const exps = fin.expenses.filter((e) => {
      const date = new Date(e.date);
      return date >= rangeStart && date <= rangeEnd;
    });
    const purs = fin.purchases.filter((p) => {
      const date = new Date(p.date);
      return date >= rangeStart && date <= rangeEnd;
    });

    const cash = revs.reduce((s, r) => s + (Number(r.cash) || 0), 0);
    const bank = revs.reduce((s, r) => s + (Number(r.bank) || 0), 0);
    const outputVat = revs.reduce((s, r) => s + (Number((r as { vat?: number }).vat) || 0), 0);
    const discount = revs.reduce((s, r) => s + (Number(r.discount) || 0), 0);
    const cogs = exps
      .filter((e) => ["medsPurchase", "cosmeticsPurchase", "milkPurchase"].includes(e.category))
      .reduce((s, e) => s + (Number(e.subtotal) || 0), 0);
    const opexMap = new Map<string, number>();
    for (const e of exps) {
      if (["medsPurchase", "cosmeticsPurchase", "milkPurchase"].includes(e.category)) continue;
      if (e.category === "ownerDrawings") continue;
      opexMap.set(e.category, (opexMap.get(e.category) || 0) + (Number(e.subtotal) || 0));
    }
    const operatingExpenses = Array.from(opexMap.entries()).map(([key, amount]) => ({ key, amount }));
    const expensesVat = exps.filter((e) => e.category !== "ownerDrawings").reduce((s, e) => s + (Number(e.vat) || 0), 0);
    const purchasesVat = purs.reduce((s, p) => s + (Number(p.vat) || 0), 0);
    const vat = expensesVat + purchasesVat;
    const drawings = exps
      .filter((e) => e.category === "ownerDrawings")
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    let labelAr: string;
    let labelEn: string;
    if (periodFilter === "custom" && customFrom && customTo) {
      labelAr = `${customFrom} إلى ${customTo}`;
      labelEn = `${customFrom} to ${customTo}`;
    } else if (periodFilter === "all") {
      labelAr = "كامل الفترة";
      labelEn = "All Time";
    } else if (periodFilter === "quarter") {
      const q = Math.floor(rangeStart.getMonth() / 3) + 1;
      labelAr = `الربع ${q} ${rangeStart.getFullYear()}`;
      labelEn = `Q${q} ${rangeStart.getFullYear()}`;
    } else if (periodFilter === "year") {
      labelAr = `${rangeStart.getFullYear()}`;
      labelEn = `${rangeStart.getFullYear()}`;
    } else {
      labelEn = rangeStart.toLocaleDateString("en", { month: "short", year: "numeric" });
      labelAr = rangeStart.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
    }

    return {
      label: { ar: labelAr, en: labelEn },
      cash,
      bank,
      discount,
      cogs,
      operatingExpenses,
      vat,
      expensesVat,
      purchasesVat,
      outputVat,
      drawings,
    };
  }, [fin.revenues, fin.expenses, fin.purchases, rangeStart, rangeEnd, periodFilter, customFrom, customTo]);

  const opex = filteredPeriod.operatingExpenses.reduce((s, x) => s + x.amount, 0);
  const grossRevenue = filteredPeriod.cash + filteredPeriod.bank + filteredPeriod.discount;
  const netRevenue = (filteredPeriod.cash + filteredPeriod.bank - filteredPeriod.outputVat);
  const grossProfit = netRevenue - filteredPeriod.cogs;
  const operatingIncome = grossProfit - opex;
  // VAT is a pass-through: revenue and expenses are already shown net of VAT.
  // Net VAT payable (output - input) is a liability on the balance sheet, not a P&L expense.
  const netVatPayable = filteredPeriod.outputVat - filteredPeriod.vat;
  // netIncome adds manual debts impact (Other Income from receivables, Other Expense from payables).
  // Those values are computed below; recompute here using inline filtering to keep order valid.
  const _inRangeIso = (iso: string) => { const d = new Date(iso); return d >= rangeStart && d <= rangeEnd; };
  const _periodOtherIncome = fin.debts
    .filter((d) => d.kind === "receivable" && !String(d.id).startsWith("AUTO-PUR-") && _inRangeIso(d.issuedAt))
    .reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const _periodOtherExpense = fin.debts
    .filter((d) => d.kind === "payable" && !String(d.id).startsWith("AUTO-PUR-") && _inRangeIso(d.issuedAt))
    .reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const netIncome = operatingIncome + _periodOtherIncome - _periodOtherExpense;
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
  const netMargin = netRevenue > 0 ? (netIncome / netRevenue) * 100 : 0;

  // ===== Cumulative all-time aggregates (Balance Sheet is a snapshot, not period-bound) =====
  const COGS_CATS = ["medsPurchase", "cosmeticsPurchase", "milkPurchase"];
  const DRAWINGS_CAT = "ownerDrawings";
  const DEPRECIATION_CAT = "depreciation";
  // Categories that are non-cash for balance sheet / cash flow purposes.
  const NON_CASH_CATS = [DRAWINGS_CAT, DEPRECIATION_CAT];

  const allCashRev = fin.revenues.reduce((s, r) => s + (Number(r.cash) || 0), 0);
  const allBankRev = fin.revenues.reduce((s, r) => s + (Number(r.bank) || 0), 0);
  const allOutputVat = fin.revenues.reduce((s, r) => s + (Number((r as { vat?: number }).vat) || 0), 0);
  const allDiscount = fin.revenues.reduce((s, r) => s + (Number(r.discount) || 0), 0);

  const allExpensesTotal = fin.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  // Exclude depreciation from cash deductions (non-cash expense).
  const allExpensesCash = fin.expenses.filter((e) => e.method === "cash" && e.category !== DEPRECIATION_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allExpensesBank = fin.expenses.filter((e) => e.method !== "cash" && e.category !== DEPRECIATION_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allDrawings = fin.expenses.filter((e) => e.category === DRAWINGS_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allDepreciation = fin.expenses.filter((e) => e.category === DEPRECIATION_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allExpensesVat = fin.expenses.filter((e) => !NON_CASH_CATS.includes(e.category)).reduce((s, e) => s + (Number(e.vat) || 0), 0);
  const allCogsFromExpenses = fin.expenses
    .filter((e) => COGS_CATS.includes(e.category))
    .reduce((s, e) => s + (Number(e.subtotal) || 0), 0);
  const allCogsAmountFromExpenses = fin.expenses
    .filter((e) => COGS_CATS.includes(e.category))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  // Opex excludes COGS, VAT, and owner drawings (drawings are equity, not expense). Depreciation IS opex.
  const allOpex = allExpensesTotal - allCogsAmountFromExpenses - allExpensesVat - allDrawings;

  const allPurchasesSubtotal = fin.purchases.reduce((s, p) => s + (Number(p.subtotal) || 0), 0);
  const allPurchasesVat = fin.purchases.reduce((s, p) => s + (Number(p.vat) || 0), 0);
  const allPurchasesTotal = fin.purchases.reduce((s, p) => s + (Number(p.total) || 0), 0);
  const allPurchasesPaid = fin.purchases.reduce((s, p) => s + (Number(p.paid) || 0), 0);
  const allocatedPaymentByPurchase = getSupplierPaymentAllocations(fin.purchases, supplierPayments);
  const directPurchasePaid = (p: typeof fin.purchases[number]) => {
    const paid = Number(p.paid) || 0;
    if (paid <= 0) return paid;
    return Math.max(0, paid - (allocatedPaymentByPurchase.get(p.id) || 0));
  };
  const allDirectPurchasesPaidCash = fin.purchases.filter((p) => p.method === "cash").reduce((s, p) => s + directPurchasePaid(p), 0);
  const allSupplierPaymentsCash = supplierPayments.filter((p) => (p as { method?: string }).method === "cash").reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const allPurchasesOutstanding = (allPurchasesTotal - allPurchasesPaid);

  // Manual debts only: auto-mirrored purchase rows (AUTO-PUR-*) duplicate
  // balances already captured in purchases — exclude them everywhere downstream.
  const isAutoPurDebt = (d: { id: string }) => String(d.id).startsWith("AUTO-PUR-");
  const manualReceivableDebts = fin.debts.filter((d) => d.kind === "receivable" && !isAutoPurDebt(d));
  const manualPayableDebts = fin.debts.filter((d) => d.kind === "payable" && !isAutoPurDebt(d));

  // Open balances (outstanding) — used by Balance Sheet AR / AP rows.
  const allReceivable = manualReceivableDebts
    .reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0);
  const allPayableDebts = manualPayableDebts
    .reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0);

  // Gross face values — feed into all-time net income via Other Income / Other Expense
  // so the books balance when a manual debt is recorded (Asset/Liability ↑ ⇔ Equity ↑/↓).
  const allManualReceivableGross = manualReceivableDebts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const allManualPayableGross = manualPayableDebts.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  // Cash effects from manual debt settlement (collections ↑cash, payments ↓cash).
  const allManualReceivablePaid = manualReceivableDebts.reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const allManualPayablePaid = manualPayableDebts.reduce((s, d) => s + (Number(d.paid) || 0), 0);

  // Period-bound aggregates (P&L is period-based; CF is period-based with cumulative opening)
  const fExps = useMemo(
    () => fin.expenses.filter((e) => { const date = new Date(e.date); return date >= rangeStart && date <= rangeEnd; }),
    [fin.expenses, rangeStart, rangeEnd],
  );
  const fPurs = useMemo(
    () => fin.purchases.filter((p) => { const date = new Date(p.date); return date >= rangeStart && date <= rangeEnd; }),
    [fin.purchases, rangeStart, rangeEnd],
  );

  const filteredDirectPurchasesPaid = fPurs.reduce((s, p) => s + directPurchasePaid(p), 0);
  const filteredSupplierPayments = supplierPayments
    .filter((p) => { const date = new Date(p.date); return date >= rangeStart && date <= rangeEnd; })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const filteredPurchasesPaid = filteredDirectPurchasesPaid + filteredSupplierPayments;
  const filteredDrawings = fExps.filter((e) => e.category === DRAWINGS_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  // Cash outflows exclude drawings (financing) and depreciation (non-cash).
  const filteredExpensesTotal = fExps.filter((e) => !NON_CASH_CATS.includes(e.category)).reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Cash Flow opening = openings + (all cash/bank flows BEFORE rangeStart)
  const beforeStart = (d: string) => new Date(d) < rangeStart;
  const preCashIn = fin.revenues.filter((r) => beforeStart(r.date))
    .reduce((s, r) => s + (Number(r.cash) || 0) + (Number(r.bank) || 0), 0);
  const preCashOutExp = fin.expenses.filter((e) => beforeStart(e.date) && e.category !== DEPRECIATION_CAT)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const preCashOutPur = fin.purchases.filter((p) => beforeStart(p.date))
    .reduce((s, p) => s + directPurchasePaid(p), 0)
    + supplierPayments.filter((p) => beforeStart(p.date)).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  // Manual debt collections / payments BEFORE the period also moved cash.
  const debtPayDate = (d: { paidAt?: string; issuedAt: string }) => d.paidAt || d.issuedAt;
  const preDebtCollect = manualReceivableDebts
    .filter((d) => beforeStart(debtPayDate(d)))
    .reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const preDebtPay = manualPayableDebts
    .filter((d) => beforeStart(debtPayDate(d)))
    .reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const cfOpening = openings.cash + openings.bank + openings.drawerCustody + preCashIn - preCashOutExp - preCashOutPur + preDebtCollect - preDebtPay;

  // ===== Balance Sheet (cumulative snapshot, NOT period-filtered) =====
  const computedInventory = openings.inventory + allPurchasesSubtotal - allCogsFromExpenses;
  // If user provides a closing inventory count, use it as the period-end snapshot.
  const inventory = (openings.closingInventory || 0) > 0 ? openings.closingInventory : computedInventory;
  // Cash on hand absorbs manual debt settlement (collections ↑, payments ↓).
  const cashOnHand = openings.cash + allCashRev - allExpensesCash - allDirectPurchasesPaidCash - allSupplierPaymentsCash + allManualReceivablePaid - allManualPayablePaid;
  const bankBalance = openings.bank + allBankRev - allExpensesBank;
  const accountsReceivable = allReceivable;
  // Auto-mirrored purchase debts are excluded from allPayableDebts; only manual payables here.
  const accountsPayable = openingSupplierDebtsTotal + allPurchasesOutstanding + allPayableDebts;
  // Input VAT receivable = brought-forward opening inventory VAT (recoverable from prior period)
  // + period purchases VAT + period expenses VAT.
  // Closing inventory VAT is NOT added here: the VAT on that inventory was already
  // recovered when the goods were purchased, so adding it again double-counts.
  const inputVatTotal = allExpensesVat + allPurchasesVat + (openings.inventoryVat || 0);
  const outputVatTotal = allOutputVat;
  // Memo: VAT embedded in closing inventory (informational only — already in input VAT above).
  const closingInventoryVatMemo = openings.closingInventoryVat || 0;

  // All-time retained earnings = all-time net income (depreciation already inside allOpex)
  // Manual receivables credit Other Income; manual payables debit Other Expense — this
  // keeps Assets = Liabilities + Equity balanced whenever a debt is recorded.
  const allNetRevenueExVat = (allCashRev + allBankRev - allOutputVat);
  const allNetIncome = allNetRevenueExVat - allCogsFromExpenses - allOpex - allExpensesVat
    + allManualReceivableGross - allManualPayableGross;

  const fixedAssetRows: { key: string; label?: string; amount: number }[] = [];
  if ((openings.equipmentOpening || 0) !== 0) {
    fixedAssetRows.push({ key: "equipmentOpening", amount: openings.equipmentOpening });
  }
  openings.fixedAssets
    .filter((a) => (Number(a.amount) || 0) !== 0 || (a.name || "").trim().length > 0)
    .forEach((a) => fixedAssetRows.push({ key: `fa-${a.id}`, label: a.name || t("fixedAssets"), amount: Number(a.amount) || 0 }));
  if (allDepreciation > 0) {
    fixedAssetRows.push({ key: "accumulatedDepreciation", amount: -allDepreciation });
  }

  const balanceSheet = {
    currentAssets: [
      { key: "cashOnHand", amount: cashOnHand },
      { key: "drawerCustody", amount: openings.drawerCustody },
      { key: "bank", amount: bankBalance },
      { key: "accountsReceivable", amount: accountsReceivable },
      { key: "inventory", amount: inventory },
      { key: "inputVat", amount: inputVatTotal },
    ],
    fixedAssets: fixedAssetRows,
    currentLiabilities: [
      { key: "accountsPayable", amount: accountsPayable },
      { key: "outputVatPayable", amount: (outputVatTotal) },
    ],
    longTermLiabilities: [] as { key: string; amount: number }[],
    equity: [
      { key: "retainedEarnings", amount: allNetIncome },
      { key: "ownerDrawings", amount: -allDrawings },
    ],
  };

  const totalCurrentAssets = balanceSheet.currentAssets.reduce((s, x) => s + x.amount, 0);
  const totalFixedAssets = balanceSheet.fixedAssets.reduce((s, x) => s + x.amount, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;
  const totalCurrentLiab = balanceSheet.currentLiabilities.reduce((s, x) => s + x.amount, 0);
  const totalLongLiab = balanceSheet.longTermLiabilities.reduce((s, x) => s + x.amount, 0);
  const totalLiab = totalCurrentLiab + totalLongLiab;
  const totalEquity = balanceSheet.equity.reduce((s, x) => s + x.amount, 0);
  const liabPlusEquity = totalLiab + totalEquity;

  // Period-bound manual debts: gross issuance for P&L Other Income/Expense,
  // and paid amounts (by paidAt within range) for the cash flow operating section.
  const inRange = (iso: string) => {
    const dt = new Date(iso);
    return dt >= rangeStart && dt <= rangeEnd;
  };
  const periodOtherIncome = manualReceivableDebts
    .filter((d) => inRange(d.issuedAt))
    .reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const periodOtherExpense = manualPayableDebts
    .filter((d) => inRange(d.issuedAt))
    .reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const periodDebtCollections = manualReceivableDebts
    .filter((d) => inRange(d.paidAt || d.issuedAt))
    .reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const periodDebtPayments = manualPayableDebts
    .filter((d) => inRange(d.paidAt || d.issuedAt))
    .reduce((s, d) => s + (Number(d.paid) || 0), 0);

  // Cash flow (period-based with cumulative opening)
  const cashFlowData = {
    opening: cfOpening,
    operating: [
      { key: "cashFromSales", amount: filteredPeriod.cash + filteredPeriod.bank },
      { key: "cashFromReceivables", amount: periodDebtCollections },
      { key: "cashToExpenses", amount: -filteredExpensesTotal },
      { key: "cashToSuppliers", amount: -filteredPurchasesPaid },
      { key: "cashToPayables", amount: -periodDebtPayments },
    ].filter((x) => x.amount !== 0),
    investing: [] as { key: string; amount: number }[],
    financing: (filteredDrawings > 0
      ? [{ key: "ownerDrawings", amount: -filteredDrawings }]
      : []) as { key: string; amount: number }[],
  };
  const sumOp = cashFlowData.operating.reduce((s, x) => s + x.amount, 0);
  const sumInv = cashFlowData.investing.reduce((s, x) => s + x.amount, 0);
  const sumFin = cashFlowData.financing.reduce((s, x) => s + x.amount, 0);
  const netChange = sumOp + sumInv + sumFin;
  const closing = cashFlowData.opening + netChange;

  // ===== Supplier Ledger (per-supplier partner ledger) =====
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) ?? null;
  const slRangeStart = useMemo(() => (slFrom ? new Date(slFrom + "T00:00:00") : rangeStart), [slFrom, rangeStart]);
  const slRangeEnd = useMemo(() => (slTo ? new Date(slTo + "T23:59:59") : rangeEnd), [slTo, rangeEnd]);
  const supplierLedger = useMemo(() => {
    if (!selectedSupplier) {
      return { opening: 0, rows: [] as Array<{ id: string; date: string; invoice: string; vendorRef: string; debit: number; credit: number; balance: number; source: "purchase" | "payment" }>, totalDebit: 0, totalCredit: 0, closing: 0 };
    }
    const matchesP = (p: typeof fin.purchases[number]) => supplierMatches(selectedSupplier.name, p.supplier);
    const matchesPayment = (p: SupplierPaymentForAccounting) => supplierMatches(selectedSupplier.name, p.supplier);
    const allP = fin.purchases.filter(matchesP);
    const allPayments = supplierPayments.filter(matchesPayment);
    const allocatedPaidByPurchase = getSupplierPaymentAllocations(allP, allPayments);
    const openingManual = Number(openings.supplierDebts[selectedSupplier.id]) || 0;
    // Prevent double-counting: purchase totals/returns come from purchases;
    // invoice-entered paid amounts stay on the invoice date; supplier payment
    // vouchers are shown separately on voucher date and subtracted from the
    // invoice paid amount through their recorded FIFO allocations.

    type Row = { id: string; date: string; invoice: string; vendorRef: string; debit: number; credit: number; balance: number; ts: number; source: "purchase" | "payment" };
    const purchaseRows: Row[] = allP
      .flatMap((p) => {
        const total = Number(p.total) || 0;
        const paid = Number(p.paid) || 0;
        const allocatedPaid = allocatedPaidByPurchase.get(p.id) || 0;
        const directPaid = paid > 0 ? Math.max(0, paid - allocatedPaid) : paid;
        const ts = new Date(p.date).getTime();
        const invoice = p.invoiceNumber || p.id;
        const vendorRef = p.vendorReference || "";
        const out: Row[] = [];
        if (total !== 0) {
          out.push({
            id: p.id,
            date: p.date,
            invoice: total < 0 ? `${invoice} (مرتجع)` : invoice,
            vendorRef,
            debit: total < 0 ? -total : 0,
            credit: total > 0 ? total : 0,
            balance: 0,
            ts,
            source: "purchase",
          });
        }
        if (directPaid !== 0) {
          // directPaid > 0 → paid on purchase invoice (debit supplier account)
          // directPaid < 0 → refund recorded on invoice (credit supplier account)
          out.push({
            id: `${p.id}-pay`,
            date: p.date,
            invoice: directPaid < 0 ? `${invoice} (استرداد)` : `${invoice} (سداد فاتورة)`,
            vendorRef,
            debit: directPaid > 0 ? directPaid : 0,
            credit: directPaid < 0 ? -directPaid : 0,
            balance: 0,
            ts,
            source: "payment",
          });
        }
        return out;
      });

    const paymentRows: Row[] = allPayments.map((p) => ({
      id: p.id,
      date: p.date,
      invoice: p.id ? `${(p as { voucherNo?: string }).voucherNo || p.id} (سند سداد)` : "سند سداد",
      vendorRef: "",
      debit: Math.max(0, Number(p.amount) || 0),
      credit: 0,
      balance: 0,
      ts: new Date(p.date).getTime(),
      source: "payment",
    }));

    const allRows = [...purchaseRows, ...paymentRows].sort((a, b) => a.ts - b.ts);
    const opening = openingManual + allRows
      .filter((r) => r.ts < slRangeStart.getTime())
      .reduce((s, r) => s + r.credit - r.debit, 0);
    const merged = allRows.filter((r) => r.ts >= slRangeStart.getTime() && r.ts <= slRangeEnd.getTime());
    let balance = opening;
    const rows = merged.map((r) => {
      balance += r.credit - r.debit;
      return { ...r, balance };
    });
    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return { opening, rows, totalDebit, totalCredit, closing: balance };
  }, [selectedSupplier, fin.purchases, supplierPayments, openings.supplierDebts, slRangeStart, slRangeEnd]);
  const supplierLedgerSort = useSortable(supplierLedger.rows, {
    date: (r) => new Date(r.date),
    invoice: (r) => r.invoice,
    vendorRef: (r) => r.vendorRef || "",
    debit: (r) => r.debit,
    credit: (r) => r.credit,
  });


  const handleExport = () => toast.success(t("exportPdf"));
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const supplierLedgerFileBase = () => {
    const name = selectedSupplier ? (selectedSupplier.name[lang] || selectedSupplier.name.en || selectedSupplier.name.ar) : "supplier";
    const safe = String(name).replace(/[^\w\u0600-\u06FF-]+/g, "_");
    const d = new Date().toISOString().slice(0, 10);
    return `supplier-ledger-${safe}-${d}`;
  };

  const handleExportSupplierLedgerXlsx = async () => {
    if (!selectedSupplier) return;
    const XLSX = await import("xlsx");
    const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
    const header = [t("date"), t("invoiceNumber"), "Vendor Ref", t("debit"), t("credit"), t("runningBalance")];
    const rows: (string | number)[][] = [];
    rows.push(["", t("openingBalance"), "", 0, 0, r2(supplierLedger.opening)]);
    for (const r of supplierLedger.rows) {
      rows.push([
        new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en"),
        r.invoice,
        r.vendorRef || "",
        r2(r.debit || 0),
        r2(r.credit || 0),
        r2(r.balance),
      ]);
    }
    rows.push([t("closingBalance"), "", "", r2(supplierLedger.totalDebit), r2(supplierLedger.totalCredit), r2(supplierLedger.closing)]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
    if (lang === "ar") ws["!views"] = [{ RTL: true }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${supplierLedgerFileBase()}.xlsx`);
    toast.success("Excel ✓");
  };

  const handleExportSupplierLedgerPdf = async () => {
    if (!selectedSupplier) return;
    const { default: jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas-pro")).default;

    const isAr = lang === "ar";
    const dirAttr = isAr ? "rtl" : "ltr";
    const supplierName = selectedSupplier.name[lang] || selectedSupplier.name.en || selectedSupplier.name.ar;
    const today = new Date().toLocaleDateString(isAr ? "ar-EG" : "en");
    const rangeLabel = `${slFrom || "—"}  ←→  ${slTo || "—"}`;

    const headers = [t("date"), t("invoiceNumber"), "Vendor Ref", t("debit"), t("credit"), t("runningBalance")];

    // Build rows in display order: opening → transactions → totals/closing.
    const bodyRows = supplierLedger.rows.map((r, i) => `
      <tr style="background:${i % 2 ? "#f8fafc" : "#ffffff"}">
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#475569;font-variant-numeric:tabular-nums;">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#475569;font-variant-numeric:tabular-nums;">${new Date(r.date).toLocaleDateString(isAr ? "ar-EG" : "en")}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(r.invoice)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-variant-numeric:tabular-nums;color:#475569;">${escapeHtml(r.vendorRef || "—")}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:end;font-variant-numeric:tabular-nums;color:#dc2626;">${r.debit ? fmt(r.debit) : "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:end;font-variant-numeric:tabular-nums;color:#15803d;">${r.credit ? fmt(r.credit) : "—"}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:end;font-variant-numeric:tabular-nums;font-weight:600;">${fmt(r.balance)}</td>
      </tr>`).join("");

    const html = `
      <div dir="${dirAttr}" lang="${lang}" style="font-family:'Cairo','Tahoma','Segoe UI',sans-serif;width:1100px;padding:28px;background:#ffffff;color:#0f172a;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;">
          <div>
            <div style="font-size:20px;font-weight:700;">${t("supplierLedger")}</div>
            <div style="font-size:14px;color:#334155;margin-top:4px;">${escapeHtml(supplierName)}</div>
          </div>
          <div style="text-align:end;font-size:11px;color:#64748b;line-height:1.6;">
            <div><b>${t("dateFrom")} / ${t("dateTo")}:</b> ${rangeLabel}</div>
            <div><b>${t("currency")}</b></div>
            <div>${today}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;font-size:12px;">
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;background:#f1f5f9;">
            <div style="color:#64748b;font-size:11px;">${t("openingBalance")}</div>
            <div style="font-weight:700;font-size:15px;font-variant-numeric:tabular-nums;margin-top:4px;">${fmt(supplierLedger.opening)}</div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;background:#f1f5f9;">
            <div style="color:#64748b;font-size:11px;">${t("debit")} / ${t("credit")}</div>
            <div style="font-weight:700;font-size:15px;font-variant-numeric:tabular-nums;margin-top:4px;">${fmt(supplierLedger.totalDebit)} / ${fmt(supplierLedger.totalCredit)}</div>
          </div>
          <div style="border:1px solid #0f172a;border-radius:8px;padding:10px;background:#0f172a;color:#ffffff;">
            <div style="color:#cbd5e1;font-size:11px;">${t("closingBalance")}</div>
            <div style="font-weight:700;font-size:15px;font-variant-numeric:tabular-nums;margin-top:4px;">${fmt(supplierLedger.closing)}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:12px;direction:${dirAttr};">
          <thead>
            <tr style="background:#0f172a;color:#ffffff;">
              <th style="padding:8px;text-align:start;width:36px;">#</th>
              <th style="padding:8px;text-align:start;">${headers[0]}</th>
              <th style="padding:8px;text-align:start;">${headers[1]}</th>
              <th style="padding:8px;text-align:start;">${headers[2]}</th>
              <th style="padding:8px;text-align:end;">${headers[3]}</th>
              <th style="padding:8px;text-align:end;">${headers[4]}</th>
              <th style="padding:8px;text-align:end;">${headers[5]}</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:#fef3c7;">
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;" colspan="6"><b>${t("openingBalance")}</b></td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:end;font-weight:700;font-variant-numeric:tabular-nums;">${fmt(supplierLedger.opening)}</td>
            </tr>
            ${bodyRows || `<tr><td colspan="7" style="padding:18px;text-align:center;color:#94a3b8;">${t("noTransactions")}</td></tr>`}
          </tbody>
          <tfoot>
            <tr style="background:#0f172a;color:#ffffff;font-weight:700;">
              <td style="padding:8px;" colspan="4">${t("closingBalance")}</td>
              <td style="padding:8px;text-align:end;font-variant-numeric:tabular-nums;">${fmt(supplierLedger.totalDebit)}</td>
              <td style="padding:8px;text-align:end;font-variant-numeric:tabular-nums;">${fmt(supplierLedger.totalCredit)}</td>
              <td style="padding:8px;text-align:end;font-variant-numeric:tabular-nums;">${fmt(supplierLedger.closing)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top:18px;font-size:10px;color:#94a3b8;text-align:center;">PharmLedger — ${today}</div>
      </div>`;

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-10000px";
    wrapper.style.top = "0";
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
    try {
      const canvas = await html2canvas(wrapper.firstElementChild as HTMLElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 24;
      const usableW = pageW - margin * 2;
      const imgH = (canvas.height * usableW) / canvas.width;
      if (imgH <= pageH - margin * 2) {
        doc.addImage(imgData, "PNG", margin, margin, usableW, imgH);
      } else {
        // Multi-page: slice canvas vertically.
        const pxPerPt = canvas.width / usableW;
        const sliceHpx = (pageH - margin * 2) * pxPerPt;
        let y = 0;
        let first = true;
        while (y < canvas.height) {
          const h = Math.min(sliceHpx, canvas.height - y);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = h;
          const ctx = slice.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
          const sliceData = slice.toDataURL("image/png");
          if (!first) doc.addPage();
          first = false;
          doc.addImage(sliceData, "PNG", margin, margin, usableW, (h / pxPerPt));
          y += h;
        }
      }
      doc.save(`${supplierLedgerFileBase()}.pdf`);
      toast.success("PDF ✓");
    } finally {
      document.body.removeChild(wrapper);
    }
  };


  return (
    <div className="min-h-screen bg-background flex" dir={dir}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("statementsTitle")}</h1>
              <p className="text-muted-foreground mt-1">{t("statementsSubtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpeningsOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent-foreground border border-border/60 text-sm font-medium transition-all"
              >
                <Pencil className="size-4" />
                {t("editOpenings")}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground border border-border/60 text-sm font-medium transition-all"
              >
                <Printer className="size-4" />
                {t("printStatement")}
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-sm font-medium transition-all"
              >
                <Download className="size-4" />
                {t("exportPdf")}
              </button>
            </div>
          </div>

          {openingsOpen && (
            <OpeningsEditor
              openings={openings}
              suppliers={suppliers}
              onSave={saveOpenings}
              onClose={() => setOpeningsOpen(false)}
            />
          )}

          {/* Period Filter */}
          <div className="glass-card rounded-2xl p-4 animate-fade-in">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                {t("filterPeriod")}:
              </span>
              <div className="inline-flex rounded-xl border border-border/60 bg-card/40 p-1">
                {(
                  [
                    { id: "month", label: t("filterMonth") },
                    { id: "quarter", label: t("filterQuarter") },
                    { id: "year", label: t("filterYear") },
                    { id: "all", label: t("filterAllTime") },
                    { id: "custom", label: t("filterCustom") },
                  ] as const
                ).map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setPeriodFilter(x.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      periodFilter === x.id
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {x.label}
                  </button>
                ))}
              </div>

              {periodFilter === "custom" && (
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">{t("dateFrom")}</span>
                    <DatePickerInput
                      value={customFrom}
                      onChange={setCustomFrom}
                      className="px-2 py-1.5 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">{t("dateTo")}</span>
                    <DatePickerInput
                      value={customTo}
                      onChange={setCustomTo}
                      className="px-2 py-1.5 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Tabs + period */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-border/60 bg-card/40 p-1 backdrop-blur-sm">
              {(
                [
                  { id: "pl", label: t("profitLoss"), icon: TrendingUp },
                  { id: "bs", label: t("balanceSheet"), icon: Scale },
                  { id: "cf", label: t("cashFlowStatement"), icon: Wallet },
                  { id: "sl", label: t("supplierLedger"), icon: Users },
                ] as const
              ).map((x) => (
                <button
                  key={x.id}
                  onClick={() => setTab(x.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    tab === x.id
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <x.icon className="size-4" />
                  {x.label}
                </button>
              ))}
            </div>

            {tab === "pl" && (
              <span className="text-xs text-muted-foreground tabular">
                {filteredPeriod.label[lang]} · {t("currency")}
              </span>
            )}
          </div>

          {/* P&L */}
          {tab === "pl" && (
            <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Highlights */}
              <div className="lg:col-span-1 space-y-4">
                <HighlightCard
                  icon={TrendingUp}
                  accent="success"
                  title={t("grossProfit")}
                  value={fmt(grossProfit)}
                  badge={`${grossMargin.toFixed(1)}% ${t("margin")}`}
                />
                <HighlightCard
                  icon={FileBarChart2}
                  accent="info"
                  title={t("operatingIncome")}
                  value={fmt(operatingIncome)}
                  badge={`${((operatingIncome / netRevenue) * 100).toFixed(1)}%`}
                />
                <HighlightCard
                  icon={Banknote}
                  accent={netIncome >= 0 ? "primary" : "destructive"}
                  title={t("netIncome")}
                  value={fmt(netIncome)}
                  badge={`${netMargin.toFixed(1)}% ${t("margin")}`}
                />
              </div>

              {/* P&L Statement */}
              <div className="lg:col-span-2 glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold">{t("profitLoss")}</h2>
                  <span className="text-xs text-muted-foreground tabular">
                    {filteredPeriod.label[lang]} · {t("currency")}
                  </span>
                </div>

                <div className="space-y-1">
                  <PLRow label={t("cash")} amount={filteredPeriod.cash} muted indent />
                  <PLRow label={t("bank")} amount={filteredPeriod.bank} muted indent />
                  <PLRow label={t("discount")} amount={filteredPeriod.discount} muted indent />
                  <PLRow label={t("grossRevenue")} amount={grossRevenue} subtotal />
                  <PLRow label={t("discount")} amount={-filteredPeriod.discount} muted />
                  <PLRow label={t("outputVat")} amount={-filteredPeriod.outputVat} muted />
                  <PLRow label={t("netRevenue")} amount={netRevenue} total />
                  <PLRow label={t("costOfGoods")} amount={-filteredPeriod.cogs} muted />
                  <PLRow label={t("grossProfit")} amount={grossProfit} total />

                  <div className="pt-4 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {t("operatingExpenses")}
                  </div>
                  {filteredPeriod.operatingExpenses.map((e) => (
                    <PLRow
                      key={e.key}
                      label={t(e.key as never)}
                      amount={-e.amount}
                      muted
                      indent
                    />
                  ))}
                  <PLRow label={t("operatingExpenses")} amount={-opex} subtotal />
                  <PLRow label={t("operatingIncome")} amount={operatingIncome} total />

                  {(periodOtherIncome > 0 || periodOtherExpense > 0) && (
                    <>
                      <div className="pt-4 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
                        {t("otherActivity")}
                      </div>
                      {periodOtherIncome > 0 && (
                        <PLRow label={t("otherIncome")} amount={periodOtherIncome} muted indent />
                      )}
                      {periodOtherExpense > 0 && (
                        <PLRow label={t("otherExpense")} amount={-periodOtherExpense} muted indent />
                      )}
                    </>
                  )}

                  <div className="pt-2" />
                  <PLRow label={t("netIncome")} amount={netIncome} total emphasized />

                  <div className="pt-4 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {t("vatSummary")}
                  </div>
                  <PLRow label={t("outputVat")} amount={filteredPeriod.outputVat} muted indent />
                  <PLRow label={t("inputVat")} amount={filteredPeriod.vat} muted indent />
                  {(openings.inventoryVat || 0) > 0 && (
                    <PLRow label={t("openingInventoryVatCarry")} amount={openings.inventoryVat} muted indent />
                  )}
                  <PLRow
                    label={t("netVatPayable")}
                    amount={filteredPeriod.outputVat - filteredPeriod.vat - (openings.inventoryVat || 0)}
                    subtotal
                  />
                  {closingInventoryVatMemo > 0 && (
                    <PLRow label={t("closingInventoryVatMemo")} amount={closingInventoryVatMemo} muted indent />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Balance Sheet */}
          {tab === "bs" && (
            <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                  <Wallet className="size-5 text-primary" />
                  {t("assets")}
                </h2>
                <div className="space-y-1">
                  <SectionLabel>{t("currentAssets")}</SectionLabel>
                  {balanceSheet.currentAssets.map((a) => (
                    <PLRow key={a.key} label={t(a.key as never)} amount={a.amount} indent />
                  ))}
                  <PLRow label={t("currentAssets")} amount={totalCurrentAssets} subtotal />

                  <SectionLabel>{t("fixedAssets")}</SectionLabel>
                  {balanceSheet.fixedAssets.map((a) => (
                    <PLRow key={a.key} label={(a as any).label ?? t(a.key as never)} amount={a.amount} indent />
                  ))}
                  <PLRow label={t("fixedAssets")} amount={totalFixedAssets} subtotal />

                  <div className="pt-2" />
                  <PLRow label={t("totalAssets")} amount={totalAssets} total emphasized />
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                  <Scale className="size-5 text-secondary" />
                  {t("liabilities")} & {t("equity")}
                </h2>
                <div className="space-y-1">
                  <SectionLabel>{t("currentLiabilities")}</SectionLabel>
                  {balanceSheet.currentLiabilities.map((a) => (
                    <PLRow key={a.key} label={t(a.key as never)} amount={a.amount} indent />
                  ))}
                  <PLRow label={t("currentLiabilities")} amount={totalCurrentLiab} subtotal />

                  <SectionLabel>{t("longTermLiabilities")}</SectionLabel>
                  {balanceSheet.longTermLiabilities.map((a) => (
                    <PLRow key={a.key} label={t(a.key as never)} amount={a.amount} indent />
                  ))}
                  <PLRow label={t("longTermLiabilities")} amount={totalLongLiab} subtotal />
                  <PLRow label={t("totalLiabilities")} amount={totalLiab} total />

                  <SectionLabel>{t("equity")}</SectionLabel>
                  {balanceSheet.equity.map((a) => (
                    <PLRow key={a.key} label={t(a.key as never)} amount={a.amount} indent />
                  ))}
                  <PLRow label={t("totalEquity")} amount={totalEquity} subtotal />

                  <div className="pt-2" />
                  <PLRow
                    label={t("liabilitiesAndEquity")}
                    amount={liabPlusEquity}
                    total
                    emphasized
                  />
                  <div className="mt-3 text-xs text-center text-muted-foreground tabular">
                    {totalAssets === liabPlusEquity ? "✓ " : "Δ "}
                    {fmt(Math.abs(totalAssets - liabPlusEquity))} {t("currency")}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cash Flow */}
          {tab === "cf" && (
            <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-1 space-y-4">
                <HighlightCard
                  icon={ArrowUpRight}
                  accent="info"
                  title={t("openingBalance")}
                  value={fmt(cashFlowData.opening)}
                />
                <HighlightCard
                  icon={netChange >= 0 ? ArrowUpRight : ArrowDownRight}
                  accent={netChange >= 0 ? "success" : "destructive"}
                  title={t("netCashChange")}
                  value={fmt(netChange)}
                />
                <HighlightCard
                  icon={Wallet}
                  accent="primary"
                  title={t("closingBalance")}
                  value={fmt(closing)}
                />
              </div>

              <div className="lg:col-span-2 glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-5">{t("cashFlowStatement")}</h2>
                <div className="space-y-1">
                  <PLRow label={t("openingBalance")} amount={cashFlowData.opening} muted />

                  <SectionLabel>{t("operatingActivities")}</SectionLabel>
                  {cashFlowData.operating.map((x, i) => (
                    <PLRow key={i} label={t(x.key as never)} amount={x.amount} indent />
                  ))}
                  <PLRow label={t("operatingActivities")} amount={sumOp} subtotal />

                  <SectionLabel>{t("investingActivities")}</SectionLabel>
                  {cashFlowData.investing.map((x, i) => (
                    <PLRow key={i} label={t(x.key as never)} amount={x.amount} indent />
                  ))}
                  <PLRow label={t("investingActivities")} amount={sumInv} subtotal />

                  <SectionLabel>{t("financingActivities")}</SectionLabel>
                  {cashFlowData.financing.map((x, i) => (
                    <PLRow key={i} label={t(x.key as never)} amount={x.amount} indent />
                  ))}
                  <PLRow label={t("financingActivities")} amount={sumFin} subtotal />

                  <div className="pt-2" />
                  <PLRow label={t("netCashChange")} amount={netChange} total />
                  <PLRow label={t("closingBalance")} amount={closing} total emphasized />
                </div>
              </div>
            </div>
          )}

          {/* Supplier Ledger */}
          {tab === "sl" && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("selectSupplier")}:
                </span>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="min-w-[240px] px-3 py-2 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">{t("selectSupplier")}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name[lang] || s.name.en || s.name.ar}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">{t("dateFrom")}</span>
                  <DatePickerInput
                    value={slFrom}
                    onChange={setSlFrom}
                    className="px-2 py-1.5 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">{t("dateTo")}</span>
                  <DatePickerInput
                    value={slTo}
                    onChange={setSlTo}
                    className="px-2 py-1.5 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
                {(slFrom || slTo) && (
                  <button
                    onClick={() => { setSlFrom(""); setSlTo(""); }}
                    className="px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                  >
                    {t("filterAllTime")}
                  </button>
                )}
                {selectedSupplier && (
                  <div className="flex items-center gap-2 ms-auto">
                    <button
                      onClick={handleExportSupplierLedgerXlsx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 hover:bg-success/20 text-success border border-success/30 text-xs font-medium transition-all"
                    >
                      <Download className="size-3.5" />
                      Excel
                    </button>
                    <button
                      onClick={handleExportSupplierLedgerPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-medium transition-all"
                    >
                      <Download className="size-3.5" />
                      PDF
                    </button>
                    <span className="text-xs text-muted-foreground tabular">
                      {t("currency")}
                    </span>
                  </div>
                )}
              </div>

              {!selectedSupplier ? (
                <div className="glass-card rounded-2xl p-10 text-center text-sm text-muted-foreground">
                  {suppliers.length === 0 ? t("noSuppliersYet") : t("selectSupplier")}
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <HighlightCard
                      icon={ArrowUpRight}
                      accent="info"
                      title={t("openingBalance")}
                      value={fmt(supplierLedger.opening)}
                    />
                    <HighlightCard
                      icon={TrendingUp}
                      accent="success"
                      title={`${t("debit")} / ${t("credit")}`}
                      value={`${fmt(supplierLedger.totalDebit)} / ${fmt(supplierLedger.totalCredit)}`}
                    />
                    <HighlightCard
                      icon={Wallet}
                      accent={supplierLedger.closing > 0 ? "destructive" : "primary"}
                      title={t("closingBalance")}
                      value={fmt(supplierLedger.closing)}
                    />
                  </div>

                  <div className="glass-card rounded-2xl p-6 overflow-x-auto">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="size-5 text-primary" />
                      {selectedSupplier.name[lang] || selectedSupplier.name.en}
                    </h2>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border/60">
                          <th className="text-start py-2 px-2"><SortHeader sortKey="date" currentKey={supplierLedgerSort.sortKey} currentDir={supplierLedgerSort.sortDir} onSort={supplierLedgerSort.toggle}>{t("date")}</SortHeader></th>
                          <th className="text-start py-2 px-2"><SortHeader sortKey="invoice" currentKey={supplierLedgerSort.sortKey} currentDir={supplierLedgerSort.sortDir} onSort={supplierLedgerSort.toggle}>{t("invoiceNumber")}</SortHeader></th>
                          <th className="text-start py-2 px-2"><SortHeader sortKey="vendorRef" currentKey={supplierLedgerSort.sortKey} currentDir={supplierLedgerSort.sortDir} onSort={supplierLedgerSort.toggle}>Vendor Ref</SortHeader></th>
                          <th className="text-end py-2 px-2"><SortHeader sortKey="debit" currentKey={supplierLedgerSort.sortKey} currentDir={supplierLedgerSort.sortDir} onSort={supplierLedgerSort.toggle} align="end">{t("debit")}</SortHeader></th>
                          <th className="text-end py-2 px-2"><SortHeader sortKey="credit" currentKey={supplierLedgerSort.sortKey} currentDir={supplierLedgerSort.sortDir} onSort={supplierLedgerSort.toggle} align="end">{t("credit")}</SortHeader></th>
                          <th className="text-end py-2 px-2">{t("runningBalance")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/40 bg-muted/20">
                          <td className="py-2 px-2 text-muted-foreground" colSpan={5}>
                            {t("openingBalance")}
                          </td>
                          <td className="py-2 px-2 text-end tabular font-medium">
                            {fmt(supplierLedger.opening)}
                          </td>
                        </tr>
                        {supplierLedger.rows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              {t("noTransactions")}
                            </td>
                          </tr>
                        ) : (
                          supplierLedgerSort.sorted.map((r) => (
                            <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20">
                              <td className="py-2 px-2 tabular text-muted-foreground">
                                {new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en")}
                              </td>
                              <td className="py-2 px-2">{r.invoice}</td>
                              <td className="py-2 px-2 tabular text-xs">
                                {r.source === "purchase" ? (
                                  <button
                                    type="button"
                                    onClick={() => openPurchaseForEdit(r.id)}
                                    className="text-primary hover:underline focus:outline-none focus:underline"
                                    title={lang === "ar" ? "فتح الفاتورة للتعديل" : "Open invoice to edit"}
                                  >
                                    {r.vendorRef || (lang === "ar" ? "فتح الفاتورة" : "Open invoice")}
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground">{r.vendorRef || "—"}</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-end tabular text-destructive">{r.debit ? fmt(r.debit) : "—"}</td>
                              <td className="py-2 px-2 text-end tabular text-success">
                                {r.credit ? fmt(r.credit) : "—"}
                              </td>

                              <td className="py-2 px-2 text-end tabular font-medium">{fmt(r.balance)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border/60 font-semibold bg-primary/5">
                          <td className="py-2 px-2" colSpan={3}>
                            {t("closingBalance")}
                          </td>
                          <td className="py-2 px-2 text-end tabular text-destructive">{fmt(supplierLedger.totalDebit)}</td>
                          <td className="py-2 px-2 text-end tabular text-success">{fmt(supplierLedger.totalCredit)}</td>

                          <td className="py-2 px-2 text-end tabular text-primary">
                            {fmt(supplierLedger.closing)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-4 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

interface PLRowProps {
  label: string;
  amount: number;
  positive?: boolean;
  muted?: boolean;
  total?: boolean;
  subtotal?: boolean;
  emphasized?: boolean;
  indent?: boolean;
}

function PLRow({
  label,
  amount,
  muted,
  total,
  subtotal,
  emphasized,
  indent,
}: PLRowProps) {
  const { fmt } = useApp();
  const negative = amount < 0;
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-3 rounded-lg transition-colors",
        total && "bg-primary/5 border border-primary/20 font-semibold",
        emphasized && "bg-primary/10 text-primary text-base",
        subtotal && "border-t border-border/60 font-medium mt-1",
        !total && !subtotal && "hover:bg-muted/30",
      )}
    >
      <span
        className={cn(
          "text-sm",
          indent && "ps-4",
          muted && "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular text-sm",
          negative && !total && "text-destructive",
          emphasized && "text-lg",
        )}
      >
        {negative ? "(" : ""}
        {fmt(Math.abs(amount))}
        {negative ? ")" : ""}
      </span>
    </div>
  );
}

interface HighlightCardProps {
  icon: typeof TrendingUp;
  title: string;
  value: string;
  badge?: string;
  accent: "primary" | "success" | "info" | "destructive";
}

function HighlightCard({ icon: Icon, title, value, badge, accent }: HighlightCardProps) {
  const { t } = useApp();
  const accentMap = {
    primary: "from-primary/20 to-primary/0 text-primary",
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    destructive: "from-destructive/20 to-destructive/0 text-destructive",
  };
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:shadow-glow transition-all">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none",
          accentMap[accent],
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          <div
            className={cn(
              "size-10 rounded-xl grid place-items-center bg-background/40 backdrop-blur-sm border border-border/50",
              accentMap[accent].split(" ").pop(),
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <div className="text-2xl font-bold tabular tracking-tight">{value}</div>
          <span className="text-xs text-muted-foreground">{t("currency")}</span>
        </div>
        {badge && (
          <div className="mt-2 inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-background/40 border border-border/40">
            {badge}
          </div>
        )}
      </div>
    </div>
  );
}

function OpeningsEditor({
  openings,
  suppliers,
  onSave,
  onClose,
}: {
  openings: Openings;
  suppliers: SupplierRecord[];
  onSave: (next: Openings) => void;
  onClose: () => void;
}) {
  const { t, lang } = useApp();
  const [draft, setDraft] = useState<Openings>(openings);
  useEffect(() => setDraft(openings), [openings]);

  const setNum = (key: "cash" | "bank" | "inventory" | "inventoryVat" | "closingInventory" | "closingInventoryVat" | "drawerCustody" | "equipmentOpening", v: string) =>
    setDraft((d) => ({ ...d, [key]: Number(v) || 0 }));
  const setSupplierDebt = (id: string, v: string) =>
    setDraft((d) => ({
      ...d,
      supplierDebts: { ...d.supplierDebts, [id]: Number(v) || 0 },
    }));
  const addFixedAsset = () =>
    setDraft((d) => ({
      ...d,
      fixedAssets: [...d.fixedAssets, { id: Math.random().toString(36).slice(2), name: "", amount: 0 }],
    }));
  const updateFixedAsset = (id: string, patch: Partial<FixedAssetOpening>) =>
    setDraft((d) => ({
      ...d,
      fixedAssets: d.fixedAssets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  const removeFixedAsset = (id: string) =>
    setDraft((d) => ({ ...d, fixedAssets: d.fixedAssets.filter((a) => a.id !== id) }));

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">{t("openingBalances")}</h2>
          <p className="text-xs text-muted-foreground mt-1">{t("openingBalancesHint")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm border border-border/60 hover:bg-muted/30"
          >
            {t("close" as never) || "Close"}
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90"
          >
            {t("saveChanges")}
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <NumberField label={t("openingCash")} value={draft.cash} onChange={(v) => setNum("cash", v)} />
        <NumberField label={t("openingBank")} value={draft.bank} onChange={(v) => setNum("bank", v)} />
        <NumberField label={t("openingDrawerCustody")} value={draft.drawerCustody} onChange={(v) => setNum("drawerCustody", v)} />
        <NumberField label={t("openingEquipment")} value={draft.equipmentOpening} onChange={(v) => setNum("equipmentOpening", v)} />
      </div>

      <div className="mb-6">
        <div className="text-sm font-semibold mb-2">{t("openingInventory")}</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField label={t("openingInventorySubtotal")} value={draft.inventory} onChange={(v) => setNum("inventory", v)} />
          <NumberField label={t("openingInventoryVat")} value={draft.inventoryVat} onChange={(v) => setNum("inventoryVat", v)} />
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <div className="text-xs text-muted-foreground mb-1">{t("openingInventoryTotal")}</div>
            <div className="text-base font-semibold tabular">
              {((Number(draft.inventory) || 0) + (Number(draft.inventoryVat) || 0)).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm font-semibold mb-2">{t("closingInventory")}</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField label={t("closingInventorySubtotal")} value={draft.closingInventory} onChange={(v) => setNum("closingInventory", v)} />
          <NumberField label={t("closingInventoryVat")} value={draft.closingInventoryVat} onChange={(v) => setNum("closingInventoryVat", v)} />
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <div className="text-xs text-muted-foreground mb-1">{t("closingInventoryTotal")}</div>
            <div className="text-base font-semibold tabular">
              {((Number(draft.closingInventory) || 0) + (Number(draft.closingInventoryVat) || 0)).toLocaleString()}
            </div>
          </div>
        </div>
      </div>


      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">{t("openingFixedAssets")}</div>
          <button
            type="button"
            onClick={addFixedAsset}
            className="px-3 py-1.5 rounded-lg text-xs border border-border/60 hover:bg-muted/30"
          >
            + {t("addFixedAsset")}
          </button>
        </div>
        {draft.fixedAssets.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4">{t("noFixedAssetsYet")}</div>
        ) : (
          <div className="space-y-2">
            {draft.fixedAssets.map((a) => (
              <div key={a.id} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-end">
                <label className="block">
                  <span className="block text-xs text-muted-foreground mb-1">{t("assetName")}</span>
                  <input
                    type="text"
                    value={a.name}
                    onChange={(e) => updateFixedAsset(a.id, { name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
                <NumberField
                  label={t("amount")}
                  value={a.amount}
                  onChange={(v) => updateFixedAsset(a.id, { amount: Number(v) || 0 })}
                />
                <button
                  type="button"
                  onClick={() => removeFixedAsset(a.id)}
                  className="px-3 py-2 rounded-lg text-xs border border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  {t("remove")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}

