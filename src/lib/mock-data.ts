// Demo data has been cleared. All exports return empty/zero values.
// Real data comes from per-organization storage and user input.

export const kpis = {
  todayRevenue: 0,
  todayRevenueChange: 0,
  todayExpenses: 0,
  todayExpensesChange: 0,
  netProfitMTD: 0,
  netProfitChange: 0,
  outstandingDebts: 0,
  outstandingDebtsChange: 0,
  cashBalance: 0,
  cashBalanceChange: 0,
  vatDue: 0,
  vatDueChange: 0,
};

export const revenueExpenseSeries: Array<{ day: number; label: string; revenue: number; expenses: number }> = [];
export const paymentMix: Array<{ name: string; value: number }> = [];
export const monthlyProfit: Array<{ month: string; profit: number }> = [];
export const cashFlow: Array<{ day: number; balance: number }> = [];
export const recentTransactions: Array<{ id: number; kind: string; category: string; method: string; amount: number; time: string }> = [];
export const topSuppliers: Array<{ id: number; name: { ar: string; en: string }; total: number }> = [];
export const overdueDebts: Array<{ id: number; party: { ar: string; en: string }; amount: number; days: number }> = [];

export type RevenueCategory = "prescription" | "otc" | "cosmetics" | "supplements" | "medical" | "other";
export type PaymentMethod = "cash" | "card" | "transfer" | "insurance";

export interface RevenueEntry {
  id: string;
  date: string;
  customers: number;
  cash: number;
  bank: number;
  discount: number;
  wasfaty: number;
  /** VAT amount included in cash+bank+wasfaty (KSA standard 15%). */
  vat?: number;
  reference: string;
  notes?: string;
}
export const revenueEntries: RevenueEntry[] = [];

export type ExpenseCategory =
  | "annual" | "founding" | "office" | "marketing" | "phones"
  | "electricity" | "bankFees" | "rent" | "salaries"
  | "medsPurchase" | "cosmeticsPurchase" | "milkPurchase"
  | "ownerDrawings" | "depreciation" | "zakat"
  | "misc" | "other";
export type ExpensePayMethod = "cash" | "bank";

export interface ExpenseEntry {
  id: string;
  date: string;
  category: ExpenseCategory;
  method: ExpensePayMethod;
  subtotal: number;
  vat: number;
  amount: number;
  vendor: { ar: string; en: string };
  reference: string;
  receiptNo?: string;
  notes?: string;
  accountCode?: string;
}
export const expenseEntries: ExpenseEntry[] = [];

export type PurchaseStatus = "paid" | "partial" | "unpaid";
export type DueOption = "0" | "30" | "60" | "90" | "120" | "150" | "overdue";
export interface PurchaseEntry {
  id: string;
  date: string;
  dueDate: string;
  dueOption?: DueOption;
  supplier: { ar: string; en: string };
  invoiceNumber: string;
  vendorReference?: string;
  itemsCount: number;
  subtotal: number;
  vat: number;
  total: number;
  paid: number;
  status: PurchaseStatus;
  method: PaymentMethod;
}
export const purchaseEntries: PurchaseEntry[] = [];

export interface SupplierRecord {
  id: string;
  name: { ar: string; en: string };
  contact: string;
  phone: string;
  email: string;
  city: { ar: string; en: string };
  taxNumber: string;
  crNumber: string;
  gln?: string;
  nationalAddress: { ar: string; en: string };
  totalPurchases: number;
  balance: number;
  lastPurchase: string;
  invoicesCount: number;
  active: boolean;
}
export const supplierRecords: SupplierRecord[] = [];

export type StaffRole = "pharmacist" | "cashier" | "manager" | "assistant" | "cleaner";
export type ShiftType = "morning" | "evening" | "night" | "off";
export interface StaffMember {
  id: string;
  name: { ar: string; en: string };
  role: StaffRole;
  phone: string;
  email: string;
  baseSalary: number;
  overtimeSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  salary: number;
  hireDate: string;
  shift: ShiftType;
  hoursThisMonth: number;
  active: boolean;
}
export const staffMembers: StaffMember[] = [];

export type DebtKind = "receivable" | "payable";
export type DebtStatus = "current" | "overdue" | "settled";
export interface DebtRecord {
  id: string;
  kind: DebtKind;
  party: { ar: string; en: string };
  reference: string;
  amount: number;
  paid: number;
  issuedAt: string;
  dueAt: string;
  /** ISO date the debt was paid/settled (used by journal & cash flow). Falls back to issuedAt when absent. */
  paidAt?: string;
  status: DebtStatus;
  notes?: string;
}
export const debtRecords: DebtRecord[] = [];

export interface PLLine { key: string; amount: number; isTotal?: boolean; isSubtle?: boolean; }
export interface PLPeriod {
  label: { ar: string; en: string };
  revenue: number;
  cash: number;
  bank: number;
  discount: number;
  cogs: number;
  operatingExpenses: { key: string; amount: number }[];
  vat: number;
}
export const plMonthly: PLPeriod[] = [];

export interface BalanceSheetData {
  currentAssets: { key: string; amount: number }[];
  fixedAssets: { key: string; amount: number }[];
  currentLiabilities: { key: string; amount: number }[];
  longTermLiabilities: { key: string; amount: number }[];
  equity: { key: string; amount: number }[];
}
export const balanceSheet: BalanceSheetData = {
  currentAssets: [],
  fixedAssets: [],
  currentLiabilities: [],
  longTermLiabilities: [],
  equity: [],
};

export interface CashFlowData {
  opening: number;
  operating: { key: string; amount: number }[];
  investing: { key: string; amount: number }[];
  financing: { key: string; amount: number }[];
}
export const cashFlowData: CashFlowData = {
  opening: 0,
  operating: [],
  investing: [],
  financing: [],
};

export type VatDirection = "output" | "input";
export interface VatEntry {
  id: string;
  date: string;
  direction: VatDirection;
  party: { ar: string; en: string };
  reference: string;
  category: string;
  taxable: number;
  rate: number;
  vat: number;
}
export const vatEntries: VatEntry[] = [];

export const liveKpis = {
  grossRevenue: 0,
  netRevenue: 0,
  totalDiscount: 0,
  cashRevenue: 0,
  bankRevenue: 0,
  totalExpenses: 0,
  expensesCash: 0,
  expensesBank: 0,
  expensesVat: 0,
  purchasesSubtotal: 0,
  purchasesVat: 0,
  purchasesTotal: 0,
  purchasesPaid: 0,
  purchasesOutstanding: 0,
  purchasesPaidCash: 0,
  purchasesPaidBank: 0,
  todayRevenue: 0,
  todayExpenses: 0,
  netProfit: 0,
  vatDue: 0,
  cashBalance: 0,
};
