import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { w as useApp, y as useOrg, k as getSupplierPaymentAllocations, g as cn, c as DatePickerInput, v as supplierMatches } from "./router-CH3R9Cfm.js";
import { useState, useEffect, useMemo } from "react";
import { Pencil, Printer, Download, TrendingUp, Scale, Wallet, Users, FileBarChart2, Banknote, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { u as useFinancials } from "./use-financials-CxOuTKIn.js";
import { u as useSortable, S as SortHeader } from "./sort-header-ASVt2fVo.js";
import "@tanstack/react-query";
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
const EMPTY_OPENINGS = {
  cash: 0,
  bank: 0,
  inventory: 0,
  inventoryVat: 0,
  closingInventory: 0,
  closingInventoryVat: 0,
  drawerCustody: 0,
  equipmentOpening: 0,
  supplierDebts: {},
  fixedAssets: []
};
function openingsKey(orgId) {
  return `pharmledger.openings.v1.${orgId}`;
}
function readOpenings(orgId) {
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
      supplierDebts: v.supplierDebts && typeof v.supplierDebts === "object" ? v.supplierDebts : {},
      fixedAssets: Array.isArray(v.fixedAssets) ? v.fixedAssets.map((a) => ({
        id: String(a.id ?? Math.random().toString(36).slice(2)),
        name: String(a.name ?? ""),
        amount: Number(a.amount) || 0
      })) : []
    };
  } catch {
    return EMPTY_OPENINGS;
  }
}
function readSuppliers(orgId) {
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
function readSupplierPayments(orgId) {
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
function escapeHtml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function getRange(filter, from, to) {
  const now = /* @__PURE__ */ new Date();
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
      start = /* @__PURE__ */ new Date(0);
      break;
    case "custom":
      if (from) start = new Date(from);
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        return {
          start,
          end: d
        };
      }
      break;
  }
  return {
    start,
    end
  };
}
function StatementsPage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const navigate = useNavigate();
  const fin = useFinancials();
  const {
    currentOrg
  } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const [tab, setTab] = useState("pl");
  const openPurchaseForEdit = (purchaseId) => {
    try {
      sessionStorage.setItem("pharmledger.open.editPurchase", purchaseId);
    } catch {
    }
    navigate({
      to: "/purchases"
    });
  };
  const [openings, setOpenings] = useState(EMPTY_OPENINGS);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [openingsOpen, setOpeningsOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [slFrom, setSlFrom] = useState("");
  const [slTo, setSlTo] = useState("");
  useEffect(() => {
    setOpenings(readOpenings(orgId));
    setSuppliers(readSuppliers(orgId));
    setSupplierPayments(readSupplierPayments(orgId));
  }, [orgId]);
  const saveOpenings = (next) => {
    const cleaned = {
      ...next,
      supplierDebts: {}
    };
    setOpenings(cleaned);
    if (orgId && typeof window !== "undefined") {
      localStorage.setItem(openingsKey(orgId), JSON.stringify(cleaned));
    }
    toast.success(t("saveChanges"));
  };
  const openingSupplierDebtsTotal = Object.values(openings.supplierDebts).reduce((s, v) => s + (Number(v) || 0), 0);
  const {
    start: rangeStart,
    end: rangeEnd
  } = useMemo(() => getRange(periodFilter, customFrom, customTo), [periodFilter, customFrom, customTo]);
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
    const outputVat = revs.reduce((s, r) => s + (Number(r.vat) || 0), 0);
    const discount = revs.reduce((s, r) => s + (Number(r.discount) || 0), 0);
    const cogs = exps.filter((e) => ["medsPurchase", "cosmeticsPurchase", "milkPurchase"].includes(e.category)).reduce((s, e) => s + (Number(e.subtotal) || 0), 0);
    const opexMap = /* @__PURE__ */ new Map();
    for (const e of exps) {
      if (["medsPurchase", "cosmeticsPurchase", "milkPurchase"].includes(e.category)) continue;
      if (e.category === "ownerDrawings") continue;
      opexMap.set(e.category, (opexMap.get(e.category) || 0) + (Number(e.subtotal) || 0));
    }
    const operatingExpenses = Array.from(opexMap.entries()).map(([key, amount]) => ({
      key,
      amount
    }));
    const expensesVat = exps.filter((e) => e.category !== "ownerDrawings").reduce((s, e) => s + (Number(e.vat) || 0), 0);
    const purchasesVat = purs.reduce((s, p) => s + (Number(p.vat) || 0), 0);
    const vat = expensesVat + purchasesVat;
    const drawings = exps.filter((e) => e.category === "ownerDrawings").reduce((s, e) => s + (Number(e.amount) || 0), 0);
    let labelAr;
    let labelEn;
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
      labelEn = rangeStart.toLocaleDateString("en", {
        month: "short",
        year: "numeric"
      });
      labelAr = rangeStart.toLocaleDateString("ar-EG", {
        month: "long",
        year: "numeric"
      });
    }
    return {
      label: {
        ar: labelAr,
        en: labelEn
      },
      cash,
      bank,
      discount,
      cogs,
      operatingExpenses,
      vat,
      expensesVat,
      purchasesVat,
      outputVat,
      drawings
    };
  }, [fin.revenues, fin.expenses, fin.purchases, rangeStart, rangeEnd, periodFilter, customFrom, customTo]);
  const opex = filteredPeriod.operatingExpenses.reduce((s, x) => s + x.amount, 0);
  const grossRevenue = filteredPeriod.cash + filteredPeriod.bank + filteredPeriod.discount;
  const netRevenue = filteredPeriod.cash + filteredPeriod.bank - filteredPeriod.outputVat;
  const grossProfit = netRevenue - filteredPeriod.cogs;
  const operatingIncome = grossProfit - opex;
  filteredPeriod.outputVat - filteredPeriod.vat;
  const _inRangeIso = (iso) => {
    const d = new Date(iso);
    return d >= rangeStart && d <= rangeEnd;
  };
  const _periodOtherIncome = fin.debts.filter((d) => d.kind === "receivable" && !String(d.id).startsWith("AUTO-PUR-") && _inRangeIso(d.issuedAt)).reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const _periodOtherExpense = fin.debts.filter((d) => d.kind === "payable" && !String(d.id).startsWith("AUTO-PUR-") && _inRangeIso(d.issuedAt)).reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const netIncome = operatingIncome + _periodOtherIncome - _periodOtherExpense;
  const grossMargin = netRevenue > 0 ? grossProfit / netRevenue * 100 : 0;
  const netMargin = netRevenue > 0 ? netIncome / netRevenue * 100 : 0;
  const COGS_CATS = ["medsPurchase", "cosmeticsPurchase", "milkPurchase"];
  const DRAWINGS_CAT = "ownerDrawings";
  const DEPRECIATION_CAT = "depreciation";
  const NON_CASH_CATS = [DRAWINGS_CAT, DEPRECIATION_CAT];
  const allCashRev = fin.revenues.reduce((s, r) => s + (Number(r.cash) || 0), 0);
  const allBankRev = fin.revenues.reduce((s, r) => s + (Number(r.bank) || 0), 0);
  const allOutputVat = fin.revenues.reduce((s, r) => s + (Number(r.vat) || 0), 0);
  fin.revenues.reduce((s, r) => s + (Number(r.discount) || 0), 0);
  const allExpensesTotal = fin.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allExpensesCash = fin.expenses.filter((e) => e.method === "cash" && e.category !== DEPRECIATION_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allExpensesBank = fin.expenses.filter((e) => e.method !== "cash" && e.category !== DEPRECIATION_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allDrawings = fin.expenses.filter((e) => e.category === DRAWINGS_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allDepreciation = fin.expenses.filter((e) => e.category === DEPRECIATION_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allExpensesVat = fin.expenses.filter((e) => !NON_CASH_CATS.includes(e.category)).reduce((s, e) => s + (Number(e.vat) || 0), 0);
  const allCogsFromExpenses = fin.expenses.filter((e) => COGS_CATS.includes(e.category)).reduce((s, e) => s + (Number(e.subtotal) || 0), 0);
  const allCogsAmountFromExpenses = fin.expenses.filter((e) => COGS_CATS.includes(e.category)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const allOpex = allExpensesTotal - allCogsAmountFromExpenses - allExpensesVat - allDrawings;
  const allPurchasesSubtotal = fin.purchases.reduce((s, p) => s + (Number(p.subtotal) || 0), 0);
  const allPurchasesVat = fin.purchases.reduce((s, p) => s + (Number(p.vat) || 0), 0);
  const allPurchasesTotal = fin.purchases.reduce((s, p) => s + (Number(p.total) || 0), 0);
  const allPurchasesPaid = fin.purchases.reduce((s, p) => s + (Number(p.paid) || 0), 0);
  const allocatedPaymentByPurchase = getSupplierPaymentAllocations(fin.purchases, supplierPayments);
  const directPurchasePaid = (p) => {
    const paid = Number(p.paid) || 0;
    if (paid <= 0) return paid;
    return Math.max(0, paid - (allocatedPaymentByPurchase.get(p.id) || 0));
  };
  const allDirectPurchasesPaidCash = fin.purchases.filter((p) => p.method === "cash").reduce((s, p) => s + directPurchasePaid(p), 0);
  const allSupplierPaymentsCash = supplierPayments.filter((p) => p.method === "cash").reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const allPurchasesOutstanding = allPurchasesTotal - allPurchasesPaid;
  const isAutoPurDebt = (d) => String(d.id).startsWith("AUTO-PUR-");
  const manualReceivableDebts = fin.debts.filter((d) => d.kind === "receivable" && !isAutoPurDebt(d));
  const manualPayableDebts = fin.debts.filter((d) => d.kind === "payable" && !isAutoPurDebt(d));
  const allReceivable = manualReceivableDebts.reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0);
  const allPayableDebts = manualPayableDebts.reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0);
  const allManualReceivableGross = manualReceivableDebts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const allManualPayableGross = manualPayableDebts.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const allManualReceivablePaid = manualReceivableDebts.reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const allManualPayablePaid = manualPayableDebts.reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const fExps = useMemo(() => fin.expenses.filter((e) => {
    const date = new Date(e.date);
    return date >= rangeStart && date <= rangeEnd;
  }), [fin.expenses, rangeStart, rangeEnd]);
  const fPurs = useMemo(() => fin.purchases.filter((p) => {
    const date = new Date(p.date);
    return date >= rangeStart && date <= rangeEnd;
  }), [fin.purchases, rangeStart, rangeEnd]);
  const filteredDirectPurchasesPaid = fPurs.reduce((s, p) => s + directPurchasePaid(p), 0);
  const filteredSupplierPayments = supplierPayments.filter((p) => {
    const date = new Date(p.date);
    return date >= rangeStart && date <= rangeEnd;
  }).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const filteredPurchasesPaid = filteredDirectPurchasesPaid + filteredSupplierPayments;
  const filteredDrawings = fExps.filter((e) => e.category === DRAWINGS_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const filteredExpensesTotal = fExps.filter((e) => !NON_CASH_CATS.includes(e.category)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const beforeStart = (d) => new Date(d) < rangeStart;
  const preCashIn = fin.revenues.filter((r) => beforeStart(r.date)).reduce((s, r) => s + (Number(r.cash) || 0) + (Number(r.bank) || 0), 0);
  const preCashOutExp = fin.expenses.filter((e) => beforeStart(e.date) && e.category !== DEPRECIATION_CAT).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const preCashOutPur = fin.purchases.filter((p) => beforeStart(p.date)).reduce((s, p) => s + directPurchasePaid(p), 0) + supplierPayments.filter((p) => beforeStart(p.date)).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const debtPayDate = (d) => d.paidAt || d.issuedAt;
  const preDebtCollect = manualReceivableDebts.filter((d) => beforeStart(debtPayDate(d))).reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const preDebtPay = manualPayableDebts.filter((d) => beforeStart(debtPayDate(d))).reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const cfOpening = openings.cash + openings.bank + openings.drawerCustody + preCashIn - preCashOutExp - preCashOutPur + preDebtCollect - preDebtPay;
  const computedInventory = openings.inventory + allPurchasesSubtotal - allCogsFromExpenses;
  const inventory = (openings.closingInventory || 0) > 0 ? openings.closingInventory : computedInventory;
  const cashOnHand = openings.cash + allCashRev - allExpensesCash - allDirectPurchasesPaidCash - allSupplierPaymentsCash + allManualReceivablePaid - allManualPayablePaid;
  const bankBalance = openings.bank + allBankRev - allExpensesBank;
  const accountsReceivable = allReceivable;
  const accountsPayable = openingSupplierDebtsTotal + allPurchasesOutstanding + allPayableDebts;
  const inputVatTotal = allExpensesVat + allPurchasesVat + (openings.inventoryVat || 0);
  const outputVatTotal = allOutputVat;
  const closingInventoryVatMemo = openings.closingInventoryVat || 0;
  const allNetRevenueExVat = allCashRev + allBankRev - allOutputVat;
  const allNetIncome = allNetRevenueExVat - allCogsFromExpenses - allOpex - allExpensesVat + allManualReceivableGross - allManualPayableGross;
  const fixedAssetRows = [];
  if ((openings.equipmentOpening || 0) !== 0) {
    fixedAssetRows.push({
      key: "equipmentOpening",
      amount: openings.equipmentOpening
    });
  }
  openings.fixedAssets.filter((a) => (Number(a.amount) || 0) !== 0 || (a.name || "").trim().length > 0).forEach((a) => fixedAssetRows.push({
    key: `fa-${a.id}`,
    label: a.name || t("fixedAssets"),
    amount: Number(a.amount) || 0
  }));
  if (allDepreciation > 0) {
    fixedAssetRows.push({
      key: "accumulatedDepreciation",
      amount: -allDepreciation
    });
  }
  const balanceSheet = {
    currentAssets: [{
      key: "cashOnHand",
      amount: cashOnHand
    }, {
      key: "drawerCustody",
      amount: openings.drawerCustody
    }, {
      key: "bank",
      amount: bankBalance
    }, {
      key: "accountsReceivable",
      amount: accountsReceivable
    }, {
      key: "inventory",
      amount: inventory
    }, {
      key: "inputVat",
      amount: inputVatTotal
    }],
    fixedAssets: fixedAssetRows,
    currentLiabilities: [{
      key: "accountsPayable",
      amount: accountsPayable
    }, {
      key: "outputVatPayable",
      amount: outputVatTotal
    }],
    longTermLiabilities: [],
    equity: [{
      key: "retainedEarnings",
      amount: allNetIncome
    }, {
      key: "ownerDrawings",
      amount: -allDrawings
    }]
  };
  const totalCurrentAssets = balanceSheet.currentAssets.reduce((s, x) => s + x.amount, 0);
  const totalFixedAssets = balanceSheet.fixedAssets.reduce((s, x) => s + x.amount, 0);
  const totalAssets = totalCurrentAssets + totalFixedAssets;
  const totalCurrentLiab = balanceSheet.currentLiabilities.reduce((s, x) => s + x.amount, 0);
  const totalLongLiab = balanceSheet.longTermLiabilities.reduce((s, x) => s + x.amount, 0);
  const totalLiab = totalCurrentLiab + totalLongLiab;
  const totalEquity = balanceSheet.equity.reduce((s, x) => s + x.amount, 0);
  const liabPlusEquity = totalLiab + totalEquity;
  const inRange = (iso) => {
    const dt = new Date(iso);
    return dt >= rangeStart && dt <= rangeEnd;
  };
  const periodOtherIncome = manualReceivableDebts.filter((d) => inRange(d.issuedAt)).reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const periodOtherExpense = manualPayableDebts.filter((d) => inRange(d.issuedAt)).reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const periodDebtCollections = manualReceivableDebts.filter((d) => inRange(d.paidAt || d.issuedAt)).reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const periodDebtPayments = manualPayableDebts.filter((d) => inRange(d.paidAt || d.issuedAt)).reduce((s, d) => s + (Number(d.paid) || 0), 0);
  const cashFlowData = {
    opening: cfOpening,
    operating: [{
      key: "cashFromSales",
      amount: filteredPeriod.cash + filteredPeriod.bank
    }, {
      key: "cashFromReceivables",
      amount: periodDebtCollections
    }, {
      key: "cashToExpenses",
      amount: -filteredExpensesTotal
    }, {
      key: "cashToSuppliers",
      amount: -filteredPurchasesPaid
    }, {
      key: "cashToPayables",
      amount: -periodDebtPayments
    }].filter((x) => x.amount !== 0),
    investing: [],
    financing: filteredDrawings > 0 ? [{
      key: "ownerDrawings",
      amount: -filteredDrawings
    }] : []
  };
  const sumOp = cashFlowData.operating.reduce((s, x) => s + x.amount, 0);
  const sumInv = cashFlowData.investing.reduce((s, x) => s + x.amount, 0);
  const sumFin = cashFlowData.financing.reduce((s, x) => s + x.amount, 0);
  const netChange = sumOp + sumInv + sumFin;
  const closing = cashFlowData.opening + netChange;
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) ?? null;
  const slRangeStart = useMemo(() => slFrom ? /* @__PURE__ */ new Date(slFrom + "T00:00:00") : rangeStart, [slFrom, rangeStart]);
  const slRangeEnd = useMemo(() => slTo ? /* @__PURE__ */ new Date(slTo + "T23:59:59") : rangeEnd, [slTo, rangeEnd]);
  const supplierLedger = useMemo(() => {
    if (!selectedSupplier) {
      return {
        opening: 0,
        rows: [],
        totalDebit: 0,
        totalCredit: 0,
        closing: 0
      };
    }
    const matchesP = (p) => supplierMatches(selectedSupplier.name, p.supplier);
    const matchesPayment = (p) => supplierMatches(selectedSupplier.name, p.supplier);
    const allP = fin.purchases.filter(matchesP);
    const allPayments = supplierPayments.filter(matchesPayment);
    const allocatedPaidByPurchase = getSupplierPaymentAllocations(allP, allPayments);
    const openingManual = Number(openings.supplierDebts[selectedSupplier.id]) || 0;
    const purchaseRows = allP.flatMap((p) => {
      const total = Number(p.total) || 0;
      const paid = Number(p.paid) || 0;
      const allocatedPaid = allocatedPaidByPurchase.get(p.id) || 0;
      const directPaid = paid > 0 ? Math.max(0, paid - allocatedPaid) : paid;
      const ts = new Date(p.date).getTime();
      const invoice = p.invoiceNumber || p.id;
      const vendorRef = p.vendorReference || "";
      const out = [];
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
          source: "purchase"
        });
      }
      if (directPaid !== 0) {
        out.push({
          id: `${p.id}-pay`,
          date: p.date,
          invoice: directPaid < 0 ? `${invoice} (استرداد)` : `${invoice} (سداد فاتورة)`,
          vendorRef,
          debit: directPaid > 0 ? directPaid : 0,
          credit: directPaid < 0 ? -directPaid : 0,
          balance: 0,
          ts,
          source: "payment"
        });
      }
      return out;
    });
    const paymentRows = allPayments.map((p) => ({
      id: p.id,
      date: p.date,
      invoice: p.id ? `${p.voucherNo || p.id} (سند سداد)` : "سند سداد",
      vendorRef: "",
      debit: Math.max(0, Number(p.amount) || 0),
      credit: 0,
      balance: 0,
      ts: new Date(p.date).getTime(),
      source: "payment"
    }));
    const allRows = [...purchaseRows, ...paymentRows].sort((a, b) => a.ts - b.ts);
    const opening = openingManual + allRows.filter((r) => r.ts < slRangeStart.getTime()).reduce((s, r) => s + r.credit - r.debit, 0);
    const merged = allRows.filter((r) => r.ts >= slRangeStart.getTime() && r.ts <= slRangeEnd.getTime());
    let balance = opening;
    const rows = merged.map((r) => {
      balance += r.credit - r.debit;
      return {
        ...r,
        balance
      };
    });
    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    return {
      opening,
      rows,
      totalDebit,
      totalCredit,
      closing: balance
    };
  }, [selectedSupplier, fin.purchases, supplierPayments, openings.supplierDebts, slRangeStart, slRangeEnd]);
  const supplierLedgerSort = useSortable(supplierLedger.rows, {
    date: (r) => new Date(r.date),
    invoice: (r) => r.invoice,
    vendorRef: (r) => r.vendorRef || "",
    debit: (r) => r.debit,
    credit: (r) => r.credit
  });
  const handleExport = () => toast.success(t("exportPdf"));
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };
  const supplierLedgerFileBase = () => {
    const name = selectedSupplier ? selectedSupplier.name[lang] || selectedSupplier.name.en || selectedSupplier.name.ar : "supplier";
    const safe = String(name).replace(/[^\w\u0600-\u06FF-]+/g, "_");
    const d = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    return `supplier-ledger-${safe}-${d}`;
  };
  const handleExportSupplierLedgerXlsx = async () => {
    if (!selectedSupplier) return;
    const XLSX = await import("xlsx");
    const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
    const header = [t("date"), t("invoiceNumber"), "Vendor Ref", t("debit"), t("credit"), t("runningBalance")];
    const rows = [];
    rows.push(["", t("openingBalance"), "", 0, 0, r2(supplierLedger.opening)]);
    for (const r of supplierLedger.rows) {
      rows.push([new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en"), r.invoice, r.vendorRef || "", r2(r.debit || 0), r2(r.credit || 0), r2(r.balance)]);
    }
    rows.push([t("closingBalance"), "", "", r2(supplierLedger.totalDebit), r2(supplierLedger.totalCredit), r2(supplierLedger.closing)]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws["!cols"] = [{
      wch: 14
    }, {
      wch: 22
    }, {
      wch: 18
    }, {
      wch: 14
    }, {
      wch: 14
    }, {
      wch: 16
    }];
    if (lang === "ar") ws["!views"] = [{
      RTL: true
    }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${supplierLedgerFileBase()}.xlsx`);
    toast.success("Excel ✓");
  };
  const handleExportSupplierLedgerPdf = async () => {
    if (!selectedSupplier) return;
    const {
      default: jsPDF
    } = await import("jspdf");
    const html2canvas = (await import("html2canvas-pro")).default;
    const isAr = lang === "ar";
    const dirAttr = isAr ? "rtl" : "ltr";
    const supplierName = selectedSupplier.name[lang] || selectedSupplier.name.en || selectedSupplier.name.ar;
    const today = (/* @__PURE__ */ new Date()).toLocaleDateString(isAr ? "ar-EG" : "en");
    const rangeLabel = `${slFrom || "—"}  ←→  ${slTo || "—"}`;
    const headers = [t("date"), t("invoiceNumber"), "Vendor Ref", t("debit"), t("credit"), t("runningBalance")];
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
      const canvas = await html2canvas(wrapper.firstElementChild, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      });
      const imgData = canvas.toDataURL("image/png");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4"
      });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 24;
      const usableW = pageW - margin * 2;
      const imgH = canvas.height * usableW / canvas.width;
      if (imgH <= pageH - margin * 2) {
        doc.addImage(imgData, "PNG", margin, margin, usableW, imgH);
      } else {
        const pxPerPt = canvas.width / usableW;
        const sliceHpx = (pageH - margin * 2) * pxPerPt;
        let y = 0;
        let first = true;
        while (y < canvas.height) {
          const h = Math.min(sliceHpx, canvas.height - y);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = h;
          const ctx = slice.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
          const sliceData = slice.toDataURL("image/png");
          if (!first) doc.addPage();
          first = false;
          doc.addImage(sliceData, "PNG", margin, margin, usableW, h / pxPerPt);
          y += h;
        }
      }
      doc.save(`${supplierLedgerFileBase()}.pdf`);
      toast.success("PDF ✓");
    } finally {
      document.body.removeChild(wrapper);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex", dir, children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 p-6 space-y-6 overflow-x-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: t("statementsTitle") }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: t("statementsSubtitle") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("button", { onClick: () => setOpeningsOpen((v) => !v), className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent-foreground border border-border/60 text-sm font-medium transition-all", children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-4" }),
              t("editOpenings")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: handlePrint, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground border border-border/60 text-sm font-medium transition-all", children: [
              /* @__PURE__ */ jsx(Printer, { className: "size-4" }),
              t("printStatement")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: handleExport, className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-sm font-medium transition-all", children: [
              /* @__PURE__ */ jsx(Download, { className: "size-4" }),
              t("exportPdf")
            ] })
          ] })
        ] }),
        openingsOpen && /* @__PURE__ */ jsx(OpeningsEditor, { openings, suppliers, onSave: saveOpenings, onClose: () => setOpeningsOpen(false) }),
        /* @__PURE__ */ jsx("div", { className: "glass-card rounded-2xl p-4 animate-fade-in", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-muted-foreground", children: [
            t("filterPeriod"),
            ":"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-xl border border-border/60 bg-card/40 p-1", children: [{
            id: "month",
            label: t("filterMonth")
          }, {
            id: "quarter",
            label: t("filterQuarter")
          }, {
            id: "year",
            label: t("filterYear")
          }, {
            id: "all",
            label: t("filterAllTime")
          }, {
            id: "custom",
            label: t("filterCustom")
          }].map((x) => /* @__PURE__ */ jsx("button", { onClick: () => setPeriodFilter(x.id), className: cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", periodFilter === x.id ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"), children: x.label }, x.id)) }),
          periodFilter === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("dateFrom") }),
              /* @__PURE__ */ jsx(DatePickerInput, { value: customFrom, onChange: setCustomFrom, className: "px-2 py-1.5 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("dateTo") }),
              /* @__PURE__ */ jsx(DatePickerInput, { value: customTo, onChange: setCustomTo, className: "px-2 py-1.5 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex rounded-xl border border-border/60 bg-card/40 p-1 backdrop-blur-sm", children: [{
            id: "pl",
            label: t("profitLoss"),
            icon: TrendingUp
          }, {
            id: "bs",
            label: t("balanceSheet"),
            icon: Scale
          }, {
            id: "cf",
            label: t("cashFlowStatement"),
            icon: Wallet
          }, {
            id: "sl",
            label: t("supplierLedger"),
            icon: Users
          }].map((x) => /* @__PURE__ */ jsxs("button", { onClick: () => setTab(x.id), className: cn("inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", tab === x.id ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"), children: [
            /* @__PURE__ */ jsx(x.icon, { className: "size-4" }),
            x.label
          ] }, x.id)) }),
          tab === "pl" && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground tabular", children: [
            filteredPeriod.label[lang],
            " · ",
            t("currency")
          ] })
        ] }),
        tab === "pl" && /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-3 gap-6 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-1 space-y-4", children: [
            /* @__PURE__ */ jsx(HighlightCard, { icon: TrendingUp, accent: "success", title: t("grossProfit"), value: fmt(grossProfit), badge: `${grossMargin.toFixed(1)}% ${t("margin")}` }),
            /* @__PURE__ */ jsx(HighlightCard, { icon: FileBarChart2, accent: "info", title: t("operatingIncome"), value: fmt(operatingIncome), badge: `${(operatingIncome / netRevenue * 100).toFixed(1)}%` }),
            /* @__PURE__ */ jsx(HighlightCard, { icon: Banknote, accent: netIncome >= 0 ? "primary" : "destructive", title: t("netIncome"), value: fmt(netIncome), badge: `${netMargin.toFixed(1)}% ${t("margin")}` })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 glass-card rounded-2xl p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-5", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: t("profitLoss") }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground tabular", children: [
                filteredPeriod.label[lang],
                " · ",
                t("currency")
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(PLRow, { label: t("cash"), amount: filteredPeriod.cash, muted: true, indent: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("bank"), amount: filteredPeriod.bank, muted: true, indent: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("discount"), amount: filteredPeriod.discount, muted: true, indent: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("grossRevenue"), amount: grossRevenue, subtotal: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("discount"), amount: -filteredPeriod.discount, muted: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("outputVat"), amount: -filteredPeriod.outputVat, muted: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("netRevenue"), amount: netRevenue, total: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("costOfGoods"), amount: -filteredPeriod.cogs, muted: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("grossProfit"), amount: grossProfit, total: true }),
              /* @__PURE__ */ jsx("div", { className: "pt-4 pb-2 text-xs uppercase tracking-wide text-muted-foreground", children: t("operatingExpenses") }),
              filteredPeriod.operatingExpenses.map((e) => /* @__PURE__ */ jsx(PLRow, { label: t(e.key), amount: -e.amount, muted: true, indent: true }, e.key)),
              /* @__PURE__ */ jsx(PLRow, { label: t("operatingExpenses"), amount: -opex, subtotal: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("operatingIncome"), amount: operatingIncome, total: true }),
              (periodOtherIncome > 0 || periodOtherExpense > 0) && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("div", { className: "pt-4 pb-2 text-xs uppercase tracking-wide text-muted-foreground", children: t("otherActivity") }),
                periodOtherIncome > 0 && /* @__PURE__ */ jsx(PLRow, { label: t("otherIncome"), amount: periodOtherIncome, muted: true, indent: true }),
                periodOtherExpense > 0 && /* @__PURE__ */ jsx(PLRow, { label: t("otherExpense"), amount: -periodOtherExpense, muted: true, indent: true })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pt-2" }),
              /* @__PURE__ */ jsx(PLRow, { label: t("netIncome"), amount: netIncome, total: true, emphasized: true }),
              /* @__PURE__ */ jsx("div", { className: "pt-4 pb-2 text-xs uppercase tracking-wide text-muted-foreground", children: t("vatSummary") }),
              /* @__PURE__ */ jsx(PLRow, { label: t("outputVat"), amount: filteredPeriod.outputVat, muted: true, indent: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("inputVat"), amount: filteredPeriod.vat, muted: true, indent: true }),
              (openings.inventoryVat || 0) > 0 && /* @__PURE__ */ jsx(PLRow, { label: t("openingInventoryVatCarry"), amount: openings.inventoryVat, muted: true, indent: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("netVatPayable"), amount: filteredPeriod.outputVat - filteredPeriod.vat - (openings.inventoryVat || 0), subtotal: true }),
              closingInventoryVatMemo > 0 && /* @__PURE__ */ jsx(PLRow, { label: t("closingInventoryVatMemo"), amount: closingInventoryVatMemo, muted: true, indent: true })
            ] })
          ] })
        ] }),
        tab === "bs" && /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-6 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-6", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold mb-5 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Wallet, { className: "size-5 text-primary" }),
              t("assets")
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(SectionLabel, { children: t("currentAssets") }),
              balanceSheet.currentAssets.map((a) => /* @__PURE__ */ jsx(PLRow, { label: t(a.key), amount: a.amount, indent: true }, a.key)),
              /* @__PURE__ */ jsx(PLRow, { label: t("currentAssets"), amount: totalCurrentAssets, subtotal: true }),
              /* @__PURE__ */ jsx(SectionLabel, { children: t("fixedAssets") }),
              balanceSheet.fixedAssets.map((a) => /* @__PURE__ */ jsx(PLRow, { label: a.label ?? t(a.key), amount: a.amount, indent: true }, a.key)),
              /* @__PURE__ */ jsx(PLRow, { label: t("fixedAssets"), amount: totalFixedAssets, subtotal: true }),
              /* @__PURE__ */ jsx("div", { className: "pt-2" }),
              /* @__PURE__ */ jsx(PLRow, { label: t("totalAssets"), amount: totalAssets, total: true, emphasized: true })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-6", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold mb-5 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Scale, { className: "size-5 text-secondary" }),
              t("liabilities"),
              " & ",
              t("equity")
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(SectionLabel, { children: t("currentLiabilities") }),
              balanceSheet.currentLiabilities.map((a) => /* @__PURE__ */ jsx(PLRow, { label: t(a.key), amount: a.amount, indent: true }, a.key)),
              /* @__PURE__ */ jsx(PLRow, { label: t("currentLiabilities"), amount: totalCurrentLiab, subtotal: true }),
              /* @__PURE__ */ jsx(SectionLabel, { children: t("longTermLiabilities") }),
              balanceSheet.longTermLiabilities.map((a) => /* @__PURE__ */ jsx(PLRow, { label: t(a.key), amount: a.amount, indent: true }, a.key)),
              /* @__PURE__ */ jsx(PLRow, { label: t("longTermLiabilities"), amount: totalLongLiab, subtotal: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("totalLiabilities"), amount: totalLiab, total: true }),
              /* @__PURE__ */ jsx(SectionLabel, { children: t("equity") }),
              balanceSheet.equity.map((a) => /* @__PURE__ */ jsx(PLRow, { label: t(a.key), amount: a.amount, indent: true }, a.key)),
              /* @__PURE__ */ jsx(PLRow, { label: t("totalEquity"), amount: totalEquity, subtotal: true }),
              /* @__PURE__ */ jsx("div", { className: "pt-2" }),
              /* @__PURE__ */ jsx(PLRow, { label: t("liabilitiesAndEquity"), amount: liabPlusEquity, total: true, emphasized: true }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 text-xs text-center text-muted-foreground tabular", children: [
                totalAssets === liabPlusEquity ? "✓ " : "Δ ",
                fmt(Math.abs(totalAssets - liabPlusEquity)),
                " ",
                t("currency")
              ] })
            ] })
          ] })
        ] }),
        tab === "cf" && /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-3 gap-6 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-1 space-y-4", children: [
            /* @__PURE__ */ jsx(HighlightCard, { icon: ArrowUpRight, accent: "info", title: t("openingBalance"), value: fmt(cashFlowData.opening) }),
            /* @__PURE__ */ jsx(HighlightCard, { icon: netChange >= 0 ? ArrowUpRight : ArrowDownRight, accent: netChange >= 0 ? "success" : "destructive", title: t("netCashChange"), value: fmt(netChange) }),
            /* @__PURE__ */ jsx(HighlightCard, { icon: Wallet, accent: "primary", title: t("closingBalance"), value: fmt(closing) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 glass-card rounded-2xl p-6", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-5", children: t("cashFlowStatement") }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(PLRow, { label: t("openingBalance"), amount: cashFlowData.opening, muted: true }),
              /* @__PURE__ */ jsx(SectionLabel, { children: t("operatingActivities") }),
              cashFlowData.operating.map((x, i) => /* @__PURE__ */ jsx(PLRow, { label: t(x.key), amount: x.amount, indent: true }, i)),
              /* @__PURE__ */ jsx(PLRow, { label: t("operatingActivities"), amount: sumOp, subtotal: true }),
              /* @__PURE__ */ jsx(SectionLabel, { children: t("investingActivities") }),
              cashFlowData.investing.map((x, i) => /* @__PURE__ */ jsx(PLRow, { label: t(x.key), amount: x.amount, indent: true }, i)),
              /* @__PURE__ */ jsx(PLRow, { label: t("investingActivities"), amount: sumInv, subtotal: true }),
              /* @__PURE__ */ jsx(SectionLabel, { children: t("financingActivities") }),
              cashFlowData.financing.map((x, i) => /* @__PURE__ */ jsx(PLRow, { label: t(x.key), amount: x.amount, indent: true }, i)),
              /* @__PURE__ */ jsx(PLRow, { label: t("financingActivities"), amount: sumFin, subtotal: true }),
              /* @__PURE__ */ jsx("div", { className: "pt-2" }),
              /* @__PURE__ */ jsx(PLRow, { label: t("netCashChange"), amount: netChange, total: true }),
              /* @__PURE__ */ jsx(PLRow, { label: t("closingBalance"), amount: closing, total: true, emphasized: true })
            ] })
          ] })
        ] }),
        tab === "sl" && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-muted-foreground", children: [
              t("selectSupplier"),
              ":"
            ] }),
            /* @__PURE__ */ jsxs("select", { value: selectedSupplierId, onChange: (e) => setSelectedSupplierId(e.target.value), className: "min-w-[240px] px-3 py-2 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40", children: [
              /* @__PURE__ */ jsx("option", { value: "", children: t("selectSupplier") }),
              suppliers.map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.name[lang] || s.name.en || s.name.ar }, s.id))
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("dateFrom") }),
              /* @__PURE__ */ jsx(DatePickerInput, { value: slFrom, onChange: setSlFrom, className: "px-2 py-1.5 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("dateTo") }),
              /* @__PURE__ */ jsx(DatePickerInput, { value: slTo, onChange: setSlTo, className: "px-2 py-1.5 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40" })
            ] }),
            (slFrom || slTo) && /* @__PURE__ */ jsx("button", { onClick: () => {
              setSlFrom("");
              setSlTo("");
            }, className: "px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all", children: t("filterAllTime") }),
            selectedSupplier && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 ms-auto", children: [
              /* @__PURE__ */ jsxs("button", { onClick: handleExportSupplierLedgerXlsx, className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 hover:bg-success/20 text-success border border-success/30 text-xs font-medium transition-all", children: [
                /* @__PURE__ */ jsx(Download, { className: "size-3.5" }),
                "Excel"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: handleExportSupplierLedgerPdf, className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-medium transition-all", children: [
                /* @__PURE__ */ jsx(Download, { className: "size-3.5" }),
                "PDF"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground tabular", children: t("currency") })
            ] })
          ] }),
          !selectedSupplier ? /* @__PURE__ */ jsx("div", { className: "glass-card rounded-2xl p-10 text-center text-sm text-muted-foreground", children: suppliers.length === 0 ? t("noSuppliersYet") : t("selectSupplier") }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsx(HighlightCard, { icon: ArrowUpRight, accent: "info", title: t("openingBalance"), value: fmt(supplierLedger.opening) }),
              /* @__PURE__ */ jsx(HighlightCard, { icon: TrendingUp, accent: "success", title: `${t("debit")} / ${t("credit")}`, value: `${fmt(supplierLedger.totalDebit)} / ${fmt(supplierLedger.totalCredit)}` }),
              /* @__PURE__ */ jsx(HighlightCard, { icon: Wallet, accent: supplierLedger.closing > 0 ? "destructive" : "primary", title: t("closingBalance"), value: fmt(supplierLedger.closing) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-6 overflow-x-auto", children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Users, { className: "size-5 text-primary" }),
                selectedSupplier.name[lang] || selectedSupplier.name.en
              ] }),
              /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-xs uppercase tracking-wide text-muted-foreground border-b border-border/60", children: [
                  /* @__PURE__ */ jsx("th", { className: "text-start py-2 px-2", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "date", currentKey: supplierLedgerSort.sortKey, currentDir: supplierLedgerSort.sortDir, onSort: supplierLedgerSort.toggle, children: t("date") }) }),
                  /* @__PURE__ */ jsx("th", { className: "text-start py-2 px-2", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "invoice", currentKey: supplierLedgerSort.sortKey, currentDir: supplierLedgerSort.sortDir, onSort: supplierLedgerSort.toggle, children: t("invoiceNumber") }) }),
                  /* @__PURE__ */ jsx("th", { className: "text-start py-2 px-2", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "vendorRef", currentKey: supplierLedgerSort.sortKey, currentDir: supplierLedgerSort.sortDir, onSort: supplierLedgerSort.toggle, children: "Vendor Ref" }) }),
                  /* @__PURE__ */ jsx("th", { className: "text-end py-2 px-2", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "debit", currentKey: supplierLedgerSort.sortKey, currentDir: supplierLedgerSort.sortDir, onSort: supplierLedgerSort.toggle, align: "end", children: t("debit") }) }),
                  /* @__PURE__ */ jsx("th", { className: "text-end py-2 px-2", children: /* @__PURE__ */ jsx(SortHeader, { sortKey: "credit", currentKey: supplierLedgerSort.sortKey, currentDir: supplierLedgerSort.sortDir, onSort: supplierLedgerSort.toggle, align: "end", children: t("credit") }) }),
                  /* @__PURE__ */ jsx("th", { className: "text-end py-2 px-2", children: t("runningBalance") })
                ] }) }),
                /* @__PURE__ */ jsxs("tbody", { children: [
                  /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/40 bg-muted/20", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-muted-foreground", colSpan: 5, children: t("openingBalance") }),
                    /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-end tabular font-medium", children: fmt(supplierLedger.opening) })
                  ] }),
                  supplierLedger.rows.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "py-8 text-center text-muted-foreground", children: t("noTransactions") }) }) : supplierLedgerSort.sorted.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/30 hover:bg-muted/20", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-2 px-2 tabular text-muted-foreground", children: new Date(r.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en") }),
                    /* @__PURE__ */ jsx("td", { className: "py-2 px-2", children: r.invoice }),
                    /* @__PURE__ */ jsx("td", { className: "py-2 px-2 tabular text-xs", children: r.source === "purchase" ? /* @__PURE__ */ jsx("button", { type: "button", onClick: () => openPurchaseForEdit(r.id), className: "text-primary hover:underline focus:outline-none focus:underline", title: lang === "ar" ? "فتح الفاتورة للتعديل" : "Open invoice to edit", children: r.vendorRef || (lang === "ar" ? "فتح الفاتورة" : "Open invoice") }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: r.vendorRef || "—" }) }),
                    /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-end tabular text-destructive", children: r.debit ? fmt(r.debit) : "—" }),
                    /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-end tabular text-success", children: r.credit ? fmt(r.credit) : "—" }),
                    /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-end tabular font-medium", children: fmt(r.balance) })
                  ] }, r.id))
                ] }),
                /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "border-t-2 border-border/60 font-semibold bg-primary/5", children: [
                  /* @__PURE__ */ jsx("td", { className: "py-2 px-2", colSpan: 3, children: t("closingBalance") }),
                  /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-end tabular text-destructive", children: fmt(supplierLedger.totalDebit) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-end tabular text-success", children: fmt(supplierLedger.totalCredit) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-end tabular text-primary", children: fmt(supplierLedger.closing) })
                ] }) })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function SectionLabel({
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "pt-4 pb-2 text-xs uppercase tracking-wide text-muted-foreground", children });
}
function PLRow({
  label,
  amount,
  muted,
  total,
  subtotal,
  emphasized,
  indent
}) {
  const {
    fmt
  } = useApp();
  const negative = amount < 0;
  return /* @__PURE__ */ jsxs("div", { className: cn("flex items-center justify-between py-2 px-3 rounded-lg transition-colors", total && "bg-primary/5 border border-primary/20 font-semibold", emphasized && "bg-primary/10 text-primary text-base", subtotal && "border-t border-border/60 font-medium mt-1", !total && !subtotal && "hover:bg-muted/30"), children: [
    /* @__PURE__ */ jsx("span", { className: cn("text-sm", indent && "ps-4", muted && "text-muted-foreground"), children: label }),
    /* @__PURE__ */ jsxs("span", { className: cn("tabular text-sm", negative && !total && "text-destructive", emphasized && "text-lg"), children: [
      negative ? "(" : "",
      fmt(Math.abs(amount)),
      negative ? ")" : ""
    ] })
  ] });
}
function HighlightCard({
  icon: Icon,
  title,
  value,
  badge,
  accent
}) {
  const {
    t
  } = useApp();
  const accentMap = {
    primary: "from-primary/20 to-primary/0 text-primary",
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    destructive: "from-destructive/20 to-destructive/0 text-destructive"
  };
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 relative overflow-hidden group hover:shadow-glow transition-all", children: [
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", accentMap[accent]) }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: title }),
        /* @__PURE__ */ jsx("div", { className: cn("size-10 rounded-xl grid place-items-center bg-background/40 backdrop-blur-sm border border-border/50", accentMap[accent].split(" ").pop()), children: /* @__PURE__ */ jsx(Icon, { className: "size-5" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tabular tracking-tight", children: value }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: t("currency") })
      ] }),
      badge && /* @__PURE__ */ jsx("div", { className: "mt-2 inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-background/40 border border-border/40", children: badge })
    ] })
  ] });
}
function OpeningsEditor({
  openings,
  suppliers,
  onSave,
  onClose
}) {
  const {
    t,
    lang
  } = useApp();
  const [draft, setDraft] = useState(openings);
  useEffect(() => setDraft(openings), [openings]);
  const setNum = (key, v) => setDraft((d) => ({
    ...d,
    [key]: Number(v) || 0
  }));
  const addFixedAsset = () => setDraft((d) => ({
    ...d,
    fixedAssets: [...d.fixedAssets, {
      id: Math.random().toString(36).slice(2),
      name: "",
      amount: 0
    }]
  }));
  const updateFixedAsset = (id, patch) => setDraft((d) => ({
    ...d,
    fixedAssets: d.fixedAssets.map((a) => a.id === id ? {
      ...a,
      ...patch
    } : a)
  }));
  const removeFixedAsset = (id) => setDraft((d) => ({
    ...d,
    fixedAssets: d.fixedAssets.filter((a) => a.id !== id)
  }));
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-6 animate-fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: t("openingBalances") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("openingBalancesHint") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "px-3 py-1.5 rounded-lg text-sm border border-border/60 hover:bg-muted/30", children: t("close") || "Close" }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          onSave(draft);
          onClose();
        }, className: "px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90", children: t("saveChanges") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-4 mb-6", children: [
      /* @__PURE__ */ jsx(NumberField, { label: t("openingCash"), value: draft.cash, onChange: (v) => setNum("cash", v) }),
      /* @__PURE__ */ jsx(NumberField, { label: t("openingBank"), value: draft.bank, onChange: (v) => setNum("bank", v) }),
      /* @__PURE__ */ jsx(NumberField, { label: t("openingDrawerCustody"), value: draft.drawerCustody, onChange: (v) => setNum("drawerCustody", v) }),
      /* @__PURE__ */ jsx(NumberField, { label: t("openingEquipment"), value: draft.equipmentOpening, onChange: (v) => setNum("equipmentOpening", v) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold mb-2", children: t("openingInventory") }),
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsx(NumberField, { label: t("openingInventorySubtotal"), value: draft.inventory, onChange: (v) => setNum("inventory", v) }),
        /* @__PURE__ */ jsx(NumberField, { label: t("openingInventoryVat"), value: draft.inventoryVat, onChange: (v) => setNum("inventoryVat", v) }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border/60 bg-muted/20 px-4 py-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mb-1", children: t("openingInventoryTotal") }),
          /* @__PURE__ */ jsx("div", { className: "text-base font-semibold tabular", children: ((Number(draft.inventory) || 0) + (Number(draft.inventoryVat) || 0)).toLocaleString() })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold mb-2", children: t("closingInventory") }),
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsx(NumberField, { label: t("closingInventorySubtotal"), value: draft.closingInventory, onChange: (v) => setNum("closingInventory", v) }),
        /* @__PURE__ */ jsx(NumberField, { label: t("closingInventoryVat"), value: draft.closingInventoryVat, onChange: (v) => setNum("closingInventoryVat", v) }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border/60 bg-muted/20 px-4 py-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mb-1", children: t("closingInventoryTotal") }),
          /* @__PURE__ */ jsx("div", { className: "text-base font-semibold tabular", children: ((Number(draft.closingInventory) || 0) + (Number(draft.closingInventoryVat) || 0)).toLocaleString() })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: t("openingFixedAssets") }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: addFixedAsset, className: "px-3 py-1.5 rounded-lg text-xs border border-border/60 hover:bg-muted/30", children: [
          "+ ",
          t("addFixedAsset")
        ] })
      ] }),
      draft.fixedAssets.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground py-4", children: t("noFixedAssetsYet") }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: draft.fixedAssets.map((a) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-end", children: [
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "block text-xs text-muted-foreground mb-1", children: t("assetName") }),
          /* @__PURE__ */ jsx("input", { type: "text", value: a.name, onChange: (e) => updateFixedAsset(a.id, {
            name: e.target.value
          }), className: "w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" })
        ] }),
        /* @__PURE__ */ jsx(NumberField, { label: t("amount"), value: a.amount, onChange: (v) => updateFixedAsset(a.id, {
          amount: Number(v) || 0
        }) }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeFixedAsset(a.id), className: "px-3 py-2 rounded-lg text-xs border border-destructive/40 text-destructive hover:bg-destructive/10", children: t("remove") })
      ] }, a.id)) })
    ] })
  ] });
}
function NumberField({
  label,
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("span", { className: "block text-xs text-muted-foreground mb-1", children: label }),
    /* @__PURE__ */ jsx("input", { type: "number", inputMode: "decimal", step: "0.01", value: Number.isFinite(value) ? value : 0, onChange: (e) => onChange(e.target.value), className: "w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm tabular focus:outline-none focus:ring-2 focus:ring-primary/40" })
  ] });
}
export {
  StatementsPage as component
};
