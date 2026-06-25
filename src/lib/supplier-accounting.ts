import type { PurchaseStatus } from "@/lib/mock-data";

export interface SupplierNameLike {
  ar?: string;
  en?: string;
}

export interface PurchaseForSupplierAccounting {
  id: string;
  date: string;
  month?: string; // e.g. "2024-01" — used for month-based aging when present
  dueDate?: string;
  supplier: SupplierNameLike;
  total: number;
  paid: number;
  status?: PurchaseStatus;
}

export interface SupplierPaymentAllocation {
  purchaseId: string;
  amount: number;
}

export interface SupplierPaymentForAccounting {
  id: string;
  date: string;
  supplier: SupplierNameLike;
  amount: number;
  voucherNo?: string;
  method?: string;
  note?: string;
  allocations?: SupplierPaymentAllocation[];
}

export interface SupplierAccountingReconciliation<T extends PurchaseForSupplierAccounting, P extends SupplierPaymentForAccounting> {
  purchases: T[];
  payments: P[];
  duplicates: P[];
}

export interface PurchaseAgingLot<T extends PurchaseForSupplierAccounting = PurchaseForSupplierAccounting> {
  purchase: T;
  remaining: number;
  originalTotal: number;
}

export function normalizeSupplierName(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, " ")
    .replace(/\b(co|company|ltd|llc|inc|corp|corporation|sa|sarl|gmbh|plc|trading|intl|international|limited|شركه|شركة|محدوده|محدودة|ذمم|ذ\s?م\s?م|للتجارة)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function supplierKeys(supplier?: SupplierNameLike): string[] {
  if (!supplier) return [];
  return [normalizeSupplierName(supplier.en || ""), normalizeSupplierName(supplier.ar || "")].filter(Boolean);
}

export function supplierIdentity(supplier?: SupplierNameLike): string {
  return supplierKeys(supplier)[0] || "";
}

export function supplierMatches(target?: SupplierNameLike, candidate?: SupplierNameLike): boolean {
  const targets = supplierKeys(target);
  const sources = supplierKeys(candidate);
  return targets.some((t) => sources.some((s) => s === t));
}

function normalizeVoucherNo(v?: string): string {
  return String(v || "").toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "").trim();
}

function dateOnly(date: string): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? String(date || "").slice(0, 10) : d.toISOString().slice(0, 10);
}

function moneyKey(amount: number): string {
  return String(Math.round((Number(amount) || 0) * 100));
}

export function supplierPaymentDuplicateKeys(payment: SupplierPaymentForAccounting): string[] {
  const supplier = supplierIdentity(payment.supplier);
  const voucher = normalizeVoucherNo(payment.voucherNo);
  const exact = [
    "exact",
    supplier,
    dateOnly(payment.date),
    moneyKey(payment.amount),
    String(payment.method || "").toLowerCase().trim(),
  ].join("|");
  return voucher ? [["voucher", supplier, voucher].join("|"), exact] : [exact];
}

export function dedupeSupplierPayments<P extends SupplierPaymentForAccounting>(payments: P[]): { payments: P[]; duplicates: P[] } {
  const seen = new Set<string>();
  const unique: P[] = [];
  const duplicates: P[] = [];
  for (let i = payments.length - 1; i >= 0; i -= 1) {
    const payment = payments[i];
    const keys = supplierPaymentDuplicateKeys(payment);
    if (keys.some((key) => seen.has(key))) {
      duplicates.push(payment);
      continue;
    }
    keys.forEach((key) => seen.add(key));
    unique.push(payment);
  }
  return { payments: unique.reverse(), duplicates: duplicates.reverse() };
}

export function allocatePaymentToPurchases<T extends PurchaseForSupplierAccounting>(
  purchases: T[],
  supplierKey: string,
  amount: number,
): { purchases: T[]; allocations: SupplierPaymentAllocation[]; leftover: number } {
  let remaining = Math.max(0, Number(amount) || 0);
  const allocations: SupplierPaymentAllocation[] = [];
  const next = purchases.slice();
  const candidates = purchases
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => {
      const total = Number(p.total) || 0;
      const paid = Number(p.paid) || 0;
      return total > 0 && total - paid > 0.001 && supplierKeys(p.supplier).includes(supplierKey);
    })
    .sort((a, b) => new Date(a.p.date).getTime() - new Date(b.p.date).getTime());

  for (const { p, i } of candidates) {
    if (remaining <= 0.001) break;
    const total = Number(p.total) || 0;
    const paid = Number(p.paid) || 0;
    const outstanding = Math.max(0, total - paid);
    const applied = Math.min(outstanding, remaining);
    if (applied <= 0) continue;
    remaining -= applied;
    allocations.push({ purchaseId: p.id, amount: applied });
    const newPaid = paid + applied;
    const patched: T = {
      ...p,
      paid: newPaid,
      ...(Object.prototype.hasOwnProperty.call(p, "status")
        ? { status: newPaid >= total - 0.01 ? "paid" : newPaid > 0 ? "partial" : "unpaid" }
        : {}),
    } as T;
    next[i] = patched;
  }

  return { purchases: next, allocations, leftover: remaining };
}

export function getSupplierPaymentAllocations<T extends PurchaseForSupplierAccounting>(
  purchases: T[],
  payments: SupplierPaymentForAccounting[],
): Map<string, number> {
  const allocated = new Map<string, number>();
  const byId = new Map(purchases.map((p) => [p.id, p]));
  const add = (purchaseId: string, amount: number) => {
    const n = Math.max(0, Number(amount) || 0);
    if (!n || !byId.has(purchaseId)) return;
    allocated.set(purchaseId, (allocated.get(purchaseId) || 0) + n);
  };

  for (const payment of payments) {
    if (payment.allocations?.length) {
      payment.allocations.forEach((a) => add(a.purchaseId, a.amount));
    }
  }

  const legacyPayments = payments.filter((p) => !p.allocations?.length).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const payment of legacyPayments) {
    let remaining = Math.max(0, Number(payment.amount) || 0);
    const candidates = purchases
      .filter((p) => supplierMatches(payment.supplier, p.supplier))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const p of candidates) {
      if (remaining <= 0.001) break;
      const paidCapacity = Math.max(0, Math.min(Number(p.total) || 0, Math.max(0, Number(p.paid) || 0)) - (allocated.get(p.id) || 0));
      const applied = Math.min(paidCapacity, remaining);
      if (applied <= 0) continue;
      add(p.id, applied);
      remaining -= applied;
    }
  }

  return allocated;
}

export function reconcileSupplierAccounting<T extends PurchaseForSupplierAccounting, P extends SupplierPaymentForAccounting>(
  purchases: T[],
  payments: P[],
): SupplierAccountingReconciliation<T, P> {
  const previousAllocated = getSupplierPaymentAllocations(purchases, payments);
  const directPaidByPurchase = new Map<string, number>();
  for (const p of purchases) {
    const total = Number(p.total) || 0;
    const paid = Number(p.paid) || 0;
    const voucherPaid = previousAllocated.get(p.id) || 0;
    directPaidByPurchase.set(p.id, total > 0 ? Math.max(0, Math.min(total, paid) - voucherPaid) : paid);
  }

  let working = purchases.map((p) => ({
    ...p,
    paid: directPaidByPurchase.get(p.id) ?? 0,
  })) as T[];
  const reconciledPayments: P[] = [];
  for (const payment of [...payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
    const allocation = allocatePaymentToPurchases(working, supplierIdentity(payment.supplier), Number(payment.amount) || 0);
    working = allocation.purchases;
    reconciledPayments.push({ ...payment, allocations: allocation.allocations } as P);
  }

  const byId = new Map(working.map((p) => [p.id, p]));
  return {
    purchases: purchases.map((p) => byId.get(p.id) || p),
    payments: reconciledPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    duplicates: [],
  };
}

function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function getPurchaseMonthDate(purchase: PurchaseForSupplierAccounting): Date {
  if (purchase.month) {
    const [y, m] = purchase.month.split("-").map(Number);
    if (y && m) return new Date(y, m - 1, 1);
  }
  return new Date(purchase.date);
}

export function computePurchaseAging<T extends PurchaseForSupplierAccounting>(
  purchases: T[],
  options: { supplierKey?: string; from?: Date | null; to?: Date | null; now?: number } = {},
): { buckets: Record<"1" | "2" | "3" | "4" | "5" | "+5", number>; lots: PurchaseAgingLot<T>[]; total: number } {
  const fromTs = options.from ? options.from.getTime() : -Infinity;
  const toTs = options.to ? options.to.getTime() : Infinity;
  const supplierKey = options.supplierKey || "";
  const events = purchases
    .filter((p) => {
      const ts = new Date(p.date).getTime();
      if (ts < fromTs || ts > toTs) return false;
      if (supplierKey && !supplierKeys(p.supplier).includes(supplierKey)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const lots: PurchaseAgingLot<T>[] = [];
  for (const purchase of events) {
    const total = Number(purchase.total) || 0;
    const paid = Number(purchase.paid) || 0;
    if (total > 0) {
      const remaining = Math.max(0, total - Math.max(0, paid));
      if (remaining > 0.001) lots.push({ purchase, remaining, originalTotal: total });
      continue;
    }
    if (total < 0) {
      let credit = Math.max(0, Math.abs(total) - Math.max(0, -paid));
      for (const lot of lots) {
        if (credit <= 0.001) break;
        const applied = Math.min(lot.remaining, credit);
        lot.remaining -= applied;
        credit -= applied;
      }
    }
  }

  const openLots = lots.filter((l) => l.remaining > 0.001);
  const now = options.now ?? Date.now();
  const buckets: Record<"1" | "2" | "3" | "4" | "5" | "+5", number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "+5": 0 };
  for (const lot of openLots) {
    const months = Math.max(0, monthsBetween(getPurchaseMonthDate(lot.purchase), new Date(now)));
    if (months <= 1) buckets["1"] += lot.remaining;
    else if (months <= 2) buckets["2"] += lot.remaining;
    else if (months <= 3) buckets["3"] += lot.remaining;
    else if (months <= 4) buckets["4"] += lot.remaining;
    else if (months <= 5) buckets["5"] += lot.remaining;
    else buckets["+5"] += lot.remaining;
  }

  return { buckets, lots: openLots, total: openLots.reduce((s, l) => s + l.remaining, 0) };
}