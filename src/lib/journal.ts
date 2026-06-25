// Shared chart of accounts + journal line generation per organization.
// Reads localStorage data written by useOrgStorage in each module.

export type AccountType = "assets" | "liabilities" | "equity" | "revenue" | "expenses";
export type Nature = "debit" | "credit";
import {
  getSupplierPaymentAllocations,
  reconcileSupplierAccounting,
  type SupplierPaymentForAccounting,
} from "@/lib/supplier-accounting";

export interface Account {
  code: string;
  nameAr: string;
  nameEn: string;
  type: AccountType;
  nature: Nature;
  children?: Account[];
}

export const DEFAULT_CHART: Account[] = [
  {
    code: "1", nameAr: "الأصول", nameEn: "Assets", type: "assets", nature: "debit",
    children: [
      {
        code: "11", nameAr: "الأصول المتداولة", nameEn: "Current Assets", type: "assets", nature: "debit",
        children: [
          { code: "1101", nameAr: "النقد في الصندوق", nameEn: "Cash on Hand", type: "assets", nature: "debit" },
          { code: "1106", nameAr: "عهدة الدرج", nameEn: "Cash Drawer Custody", type: "assets", nature: "debit" },
          { code: "1102", nameAr: "البنك", nameEn: "Bank", type: "assets", nature: "debit" },
          { code: "1103", nameAr: "الذمم المدينة (العملاء)", nameEn: "Accounts Receivable", type: "assets", nature: "debit" },
          { code: "1104", nameAr: "المخزون", nameEn: "Inventory", type: "assets", nature: "debit" },
          { code: "1105", nameAr: "ضريبة المدخلات", nameEn: "Input VAT", type: "assets", nature: "debit" },
        ],
      },
      {
        code: "12", nameAr: "الأصول الثابتة", nameEn: "Fixed Assets", type: "assets", nature: "debit",
        children: [
          { code: "1201", nameAr: "الأثاث والمعدات", nameEn: "Furniture & Equipment", type: "assets", nature: "debit" },
          { code: "1202", nameAr: "السيارات", nameEn: "Vehicles", type: "assets", nature: "debit" },
          { code: "1203", nameAr: "مجمع الإهلاك", nameEn: "Accumulated Depreciation", type: "assets", nature: "credit" },
        ],
      },
    ],
  },
  {
    code: "2", nameAr: "الخصوم", nameEn: "Liabilities", type: "liabilities", nature: "credit",
    children: [
      {
        code: "21", nameAr: "الخصوم المتداولة", nameEn: "Current Liabilities", type: "liabilities", nature: "credit",
        children: [
          { code: "2101", nameAr: "الذمم الدائنة (الموردون)", nameEn: "Accounts Payable", type: "liabilities", nature: "credit" },
          { code: "2102", nameAr: "ضريبة المخرجات المستحقة", nameEn: "Output VAT Payable", type: "liabilities", nature: "credit" },
          { code: "2103", nameAr: "رواتب مستحقة", nameEn: "Accrued Salaries", type: "liabilities", nature: "credit" },
        ],
      },
      {
        code: "22", nameAr: "الخصوم طويلة الأجل", nameEn: "Long-term Liabilities", type: "liabilities", nature: "credit",
        children: [
          { code: "2201", nameAr: "قروض طويلة الأجل", nameEn: "Long-term Loans", type: "liabilities", nature: "credit" },
        ],
      },
    ],
  },
  {
    code: "3", nameAr: "حقوق الملكية", nameEn: "Equity", type: "equity", nature: "credit",
    children: [
      { code: "3101", nameAr: "رأس المال", nameEn: "Owner's Capital", type: "equity", nature: "credit" },
      { code: "3102", nameAr: "الأرباح المحتجزة", nameEn: "Retained Earnings", type: "equity", nature: "credit" },
      { code: "3103", nameAr: "حساب جاري الملاك (المسحوبات الشخصية)", nameEn: "Owners' Current Account (Drawings)", type: "equity", nature: "debit" },
    ],
  },
  {
    code: "4", nameAr: "الإيرادات", nameEn: "Revenue", type: "revenue", nature: "credit",
    children: [
      { code: "4101", nameAr: "مبيعات الوصفات الطبية", nameEn: "Prescription Sales", type: "revenue", nature: "credit" },
      { code: "4102", nameAr: "مبيعات بدون وصفة", nameEn: "OTC Sales", type: "revenue", nature: "credit" },
      { code: "4103", nameAr: "مبيعات مستحضرات التجميل", nameEn: "Cosmetics Sales", type: "revenue", nature: "credit" },
      { code: "4104", nameAr: "مبيعات المكملات", nameEn: "Supplements Sales", type: "revenue", nature: "credit" },
      { code: "4105", nameAr: "مبيعات وصفتي", nameEn: "Wasfaty Sales", type: "revenue", nature: "credit" },
      { code: "4199", nameAr: "إيرادات أخرى", nameEn: "Other Revenue", type: "revenue", nature: "credit" },
    ],
  },
  {
    code: "5", nameAr: "المصروفات", nameEn: "Expenses", type: "expenses", nature: "debit",
    children: [
      { code: "5101", nameAr: "تكلفة المبيعات (مشتريات الأدوية)", nameEn: "Cost of Goods Sold", type: "expenses", nature: "debit" },
      { code: "5201", nameAr: "الرواتب", nameEn: "Salaries", type: "expenses", nature: "debit" },
      { code: "5202", nameAr: "الإيجار", nameEn: "Rent", type: "expenses", nature: "debit" },
      { code: "5203", nameAr: "الكهرباء", nameEn: "Electricity", type: "expenses", nature: "debit" },
      { code: "5204", nameAr: "تليفونات", nameEn: "Phones", type: "expenses", nature: "debit" },
      { code: "5205", nameAr: "أدوات مكتبية", nameEn: "Office Supplies", type: "expenses", nature: "debit" },
      { code: "5206", nameAr: "تسويق", nameEn: "Marketing", type: "expenses", nature: "debit" },
      { code: "5207", nameAr: "رسوم بنكية", nameEn: "Bank Fees", type: "expenses", nature: "debit" },
      { code: "5208", nameAr: "مصروفات تأسيس", nameEn: "Founding Expenses", type: "expenses", nature: "debit" },
      { code: "5210", nameAr: "مصروف الإهلاك", nameEn: "Depreciation Expense", type: "expenses", nature: "debit" },
      { code: "5299", nameAr: "نثريات", nameEn: "Miscellaneous", type: "expenses", nature: "debit" },
    ],
  },
];

// ---- chart load (per-org) ----
export function loadChartFor(orgId: string | null | undefined): Account[] {
  if (typeof window === "undefined" || !orgId) return DEFAULT_CHART;
  try {
    const raw = localStorage.getItem(`pl_chart_of_accounts.${orgId}`);
    if (!raw) return DEFAULT_CHART;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? (parsed as Account[]) : DEFAULT_CHART;
  } catch {
    return DEFAULT_CHART;
  }
}

export function flattenChart(tree: Account[]): Account[] {
  const out: Account[] = [];
  const walk = (n: Account) => {
    out.push(n);
    n.children?.forEach(walk);
  };
  tree.forEach(walk);
  return out;
}

export function findAccount(tree: Account[], code: string): Account | null {
  for (const n of tree) {
    if (n.code === code) return n;
    if (n.children) {
      const found = findAccount(n.children, code);
      if (found) return found;
    }
  }
  return null;
}

// ---- mapping ----
const EXPENSE_CATEGORY_TO_ACCOUNT: Record<string, string> = {
  annual: "5299",
  founding: "5208",
  office: "5205",
  marketing: "5206",
  phones: "5204",
  electricity: "5203",
  bankFees: "5207",
  rent: "5202",
  salaries: "5201",
  medsPurchase: "5101",
  cosmeticsPurchase: "5101",
  milkPurchase: "5101",
  ownerDrawings: "3103",
  depreciation: "5210",
  misc: "5299",
  other: "5299",
};

const cashAccount = (method?: string) => (method === "bank" || method === "card" || method === "transfer" ? "1102" : "1101");

// ---- journal lines ----
export interface JournalLine {
  id: string;            // unique line id
  entryId: string;       // parent entry/transaction id (groups debit+credit lines)
  date: string;          // ISO
  source: "revenue" | "expense" | "purchase" | "debt";
  reference: string;
  description: string;
  accountCode: string;
  debit: number;
  credit: number;
}

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

export function buildJournal(orgId: string | null | undefined): JournalLine[] {
  if (!orgId) return [];
  const lines: JournalLine[] = [];
  const push = (l: Omit<JournalLine, "id">) => {
    if (l.debit === 0 && l.credit === 0) return;
    lines.push({ ...l, id: `${l.entryId}-${l.accountCode}-${lines.length}` });
  };

  // Revenue (cash + bank are VAT-inclusive; vat is entered manually).
  // Wasfaty is excluded from accounting/financial statements per business rule.
  const revenue = readArray<any>(`pharmledger.revenue.entries.v2.${orgId}`);
  for (const r of revenue) {
    const cash = Number(r.cash) || 0;
    const bank = Number(r.bank) || 0;
    const vat = Number(r.vat) || 0;
    const totalInc = cash + bank;
    const ref = r.reference || r.id;
    const date = r.date;
    // Pro-rate output VAT across cash and bank by share of total.
    const share = (amt: number) => (totalInc > 0 ? (vat * amt) / totalInc : 0);
    const cashVat = share(cash);
    const bankVat = share(bank);
    if (cash > 0) {
      const net = cash - cashVat;
      push({ entryId: r.id, date, source: "revenue", reference: ref, description: "مبيعات نقدي", accountCode: "1101", debit: cash, credit: 0 });
      push({ entryId: r.id, date, source: "revenue", reference: ref, description: "مبيعات نقدي", accountCode: "4101", debit: 0, credit: net });
      if (cashVat > 0) push({ entryId: r.id, date, source: "revenue", reference: ref, description: "ضريبة مخرجات", accountCode: "2102", debit: 0, credit: cashVat });
    }
    if (bank > 0) {
      const net = bank - bankVat;
      push({ entryId: r.id, date, source: "revenue", reference: ref, description: "مبيعات بنك", accountCode: "1102", debit: bank, credit: 0 });
      push({ entryId: r.id, date, source: "revenue", reference: ref, description: "مبيعات بنك", accountCode: "4101", debit: 0, credit: net });
      if (bankVat > 0) push({ entryId: r.id, date, source: "revenue", reference: ref, description: "ضريبة مخرجات", accountCode: "2102", debit: 0, credit: bankVat });
    }
  }

  // Expenses
  const expenses = readArray<any>(`pharmledger.expenses.v1.${orgId}`);
  for (const e of expenses) {
    const subtotal = Number(e.subtotal) || 0;
    const vat = Number(e.vat) || 0;
    const total = Number(e.amount) || subtotal + vat;
    const cash = cashAccount(e.method);
    const expAccount = e.accountCode || EXPENSE_CATEGORY_TO_ACCOUNT[e.category] || "5299";
    const ref = e.reference || e.id;
    // Depreciation is non-cash: debit depreciation expense, credit accumulated depreciation.
    if (e.category === "depreciation") {
      const amt = total || subtotal;
      push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: `مصروف إهلاك`, accountCode: "5210", debit: amt, credit: 0 });
      push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: `مجمع الإهلاك`, accountCode: "1203", debit: 0, credit: amt });
      continue;
    }
    push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: `مصروف: ${e.vendor?.ar ?? ""}`, accountCode: expAccount, debit: subtotal, credit: 0 });
    if (vat > 0) push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: "ضريبة مدخلات", accountCode: "1105", debit: vat, credit: 0 });
    push({ entryId: e.id, date: e.date, source: "expense", reference: ref, description: `سداد مصروف`, accountCode: cash, debit: 0, credit: total });
  }

  // Purchases
  const rawPurchases = readArray<any>(`pharmledger.purchases.v1.${orgId}`);
  const rawSupplierPayments = readArray<SupplierPaymentForAccounting & { voucherNo?: string; method?: string }>(`pharmledger.supplier-payments.v1.${orgId}`);
  const reconciledSupplierAccounting = reconcileSupplierAccounting(rawPurchases, rawSupplierPayments);
  const purchases = reconciledSupplierAccounting.purchases;
  const supplierPayments = reconciledSupplierAccounting.payments;
  const allocatedPaidByPurchase = getSupplierPaymentAllocations(purchases, supplierPayments);
  for (const p of purchases) {
    const subtotal = Number(p.subtotal) || 0;
    const vat = Number(p.vat) || 0;
    const total = Number(p.total) || subtotal + vat;
    const paid = Number(p.paid) || 0;
    const allocatedPaid = allocatedPaidByPurchase.get(p.id) || 0;
    const directPaid = paid > 0 ? Math.max(0, paid - allocatedPaid) : paid;
    const owed = total - directPaid;
    const cash = cashAccount(p.method);
    const ref = p.invoiceNumber || p.id;
    if (total >= 0) {
      push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: `شراء: ${p.supplier?.ar ?? ""}`, accountCode: "1104", debit: subtotal, credit: 0 });
      if (vat > 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "ضريبة مدخلات", accountCode: "1105", debit: vat, credit: 0 });
      if (directPaid > 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "سداد مباشر من الفاتورة", accountCode: cash, debit: 0, credit: directPaid });
      if (owed !== 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "ذمم دائنة - موردون", accountCode: "2101", debit: 0, credit: owed });
    } else {
      push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: `مرتجع مشتريات: ${p.supplier?.ar ?? ""}`, accountCode: "2101", debit: Math.abs(total), credit: 0 });
      if (subtotal !== 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "عكس مخزون مرتجع", accountCode: "1104", debit: 0, credit: Math.abs(subtotal) });
      if (vat !== 0) push({ entryId: p.id, date: p.date, source: "purchase", reference: ref, description: "عكس ضريبة مدخلات", accountCode: "1105", debit: 0, credit: Math.abs(vat) });
      if (paid < 0) {
        push({ entryId: `${p.id}-refund`, date: p.date, source: "purchase", reference: ref, description: "استرداد من المورد", accountCode: cash, debit: Math.abs(paid), credit: 0 });
        push({ entryId: `${p.id}-refund`, date: p.date, source: "purchase", reference: ref, description: "إقفال استرداد المورد", accountCode: "2101", debit: 0, credit: Math.abs(paid) });
      }
    }
  }

  for (const p of supplierPayments) {
    const amount = Number(p.amount) || 0;
    if (amount <= 0) continue;
    const ref = p.voucherNo || p.id;
    const cash = cashAccount(p.method);
    push({ entryId: p.id, date: p.date, source: "debt", reference: ref, description: `سند سداد مورد: ${p.supplier?.ar ?? ""}`, accountCode: "2101", debit: amount, credit: 0 });
    push({ entryId: p.id, date: p.date, source: "debt", reference: ref, description: "نقد/بنك مقابل سند سداد مورد", accountCode: cash, debit: 0, credit: amount });
  }

  // Debts
  const debts = readArray<any>(`pharmledger.debts.v1.${orgId}`);
  for (const d of debts) {
    // Skip debt records that mirror purchase entries (already journalized above).
    if (typeof d.id === "string" && d.id.startsWith("AUTO-PUR-")) continue;
    const amount = Number(d.amount) || 0;
    const paid = Number(d.paid) || 0;
    const ref = d.reference || d.id;
    const payDate = d.paidAt || d.issuedAt;
    if (d.kind === "receivable") {
      push({ entryId: d.id, date: d.issuedAt, source: "debt", reference: ref, description: `ذمم مدينة: ${d.party?.ar ?? ""}`, accountCode: "1103", debit: amount, credit: 0 });
      push({ entryId: d.id, date: d.issuedAt, source: "debt", reference: ref, description: `مبيعات آجلة`, accountCode: "4199", debit: 0, credit: amount });
      if (paid > 0) {
        push({ entryId: `${d.id}-p`, date: payDate, source: "debt", reference: ref, description: `تحصيل`, accountCode: "1101", debit: paid, credit: 0 });
        push({ entryId: `${d.id}-p`, date: payDate, source: "debt", reference: ref, description: `تحصيل`, accountCode: "1103", debit: 0, credit: paid });
      }
    } else {
      push({ entryId: d.id, date: d.issuedAt, source: "debt", reference: ref, description: `التزام: ${d.party?.ar ?? ""}`, accountCode: "5299", debit: amount, credit: 0 });
      push({ entryId: d.id, date: d.issuedAt, source: "debt", reference: ref, description: `ذمم دائنة`, accountCode: "2101", debit: 0, credit: amount });
      if (paid > 0) {
        push({ entryId: `${d.id}-p`, date: payDate, source: "debt", reference: ref, description: `سداد التزام`, accountCode: "2101", debit: paid, credit: 0 });
        push({ entryId: `${d.id}-p`, date: payDate, source: "debt", reference: ref, description: `سداد التزام`, accountCode: "1101", debit: 0, credit: paid });
      }
    }
  }

  // sort by date desc
  lines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return lines;
}
