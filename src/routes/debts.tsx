import { createFileRoute } from "@tanstack/react-router";
import { DatePickerInput } from "@/components/date-picker-input";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  Plus,
  Scale,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { ShowAllToggle } from "@/components/show-all-toggle";
import { PaginationBar } from "@/components/pagination-bar";
import { useApp } from "@/lib/app-context";
import { useOrgStorage } from "@/lib/use-org-storage";
import { usePagination } from "@/lib/use-pagination";
import { useSelection } from "@/lib/use-selection";
import { useSortable } from "@/lib/use-sortable";
import { SortHeader } from "@/components/sort-header";
import {
  type DebtKind,
  type DebtRecord,
  type DebtStatus,
  type PurchaseEntry,
  type SupplierRecord,
} from "@/lib/mock-data";
import {
  allocatePaymentToPurchases,
  computePurchaseAging,
  getSupplierPaymentAllocations,
  normalizeSupplierName,
  reconcileSupplierAccounting,
  supplierIdentity,
  type SupplierPaymentAllocation,
} from "@/lib/supplier-accounting";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SupplierPaymentMethod = "cash" | "bank";
export interface SupplierPayment {
  id: string;
  voucherNo: string;
  date: string;
  supplier: { ar: string; en: string };
  amount: number;
  method: SupplierPaymentMethod;
  note?: string;
  allocations?: SupplierPaymentAllocation[];
}

// Normalize supplier names for FIFO matching across purchases & dropdown.
function normName(s: string): string {
  return normalizeSupplierName(s);
}

export const Route = createFileRoute("/debts")({
  head: () => ({
    meta: [
      { title: "Debts — PharmLedger" },
      { name: "description", content: "Manage receivables, payables and debt aging for the pharmacy." },
    ],
  }),
  component: DebtsPage,
});

const KINDS: DebtKind[] = ["receivable", "payable"];
const STATUSES: DebtStatus[] = ["current", "overdue", "settled"];

const statusTone: Record<DebtStatus, string> = {
  current: "bg-info/15 text-info border-info/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
  settled: "bg-success/15 text-success border-success/30",
};

function DebtsPage() {
  const { t, fmt, lang, dir } = useApp();
  const [records, setRecords] = useOrgStorage<DebtRecord>("pharmledger.debts.v1", []);
  const [purchases, setPurchases] = useOrgStorage<PurchaseEntry>("pharmledger.purchases.v1", []);
  const [suppliersDir] = useOrgStorage<SupplierRecord>("suppliers.records.v1", []);
  const [payments, setPayments] = useOrgStorage<SupplierPayment>("pharmledger.supplier-payments.v1", []);

  useEffect(() => {
    const reconciled = reconcileSupplierAccounting(purchases, payments);
    const purchasesChanged = JSON.stringify(reconciled.purchases) !== JSON.stringify(purchases);
    const paymentsChanged = JSON.stringify(reconciled.payments) !== JSON.stringify(payments);
    if (purchasesChanged) setPurchases(reconciled.purchases);
    if (paymentsChanged) setPayments(reconciled.payments);
  }, [purchases, payments, setPurchases, setPayments]);

  // Auto-mirror supplier purchases into payable debts.
  // Paid amount comes ONLY from the purchase row (the purchases module is the
  // single source of truth for supplier debt and aging). Expense payments are
  // no longer FIFO-allocated against purchases — that produced double-counting
  // and diverged from the supplier statement.
  useEffect(() => {
    setRecords((prev) => {
      const byId = new Map(prev.map((d) => [d.id, d]));
      let changed = false;
      const validAutoIds = new Set<string>();
      for (const p of purchases) {
        const autoId = `AUTO-PUR-${p.id}`;
        validAutoIds.add(autoId);
        const amount = Number(p.total) || 0;
        const paid = Math.min(amount, Number(p.paid) || 0);
        const outstanding = amount - paid;
        const dueAt = p.dueDate || p.date;
        const overdueDays = Math.floor((Date.now() - new Date(dueAt).getTime()) / 86400000);
        const status: DebtStatus =
          outstanding <= 0 ? "settled" : overdueDays > 0 ? "overdue" : "current";
        const auto: DebtRecord = {
          id: autoId,
          kind: "payable",
          party: p.supplier,
          reference: p.invoiceNumber || p.id,
          amount,
          paid,
          issuedAt: p.date,
          dueAt,
          status,
        };
        const existing = byId.get(autoId);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(auto)) {
          byId.set(autoId, auto);
          changed = true;
        }
      }
      // Clean auto rows whose source purchase was removed
      for (const id of Array.from(byId.keys())) {
        if (id.startsWith("AUTO-PUR-") && !validAutoIds.has(id)) {
          byId.delete(id);
          changed = true;
        }
      }
      return changed ? Array.from(byId.values()) : prev;
    });
  }, [purchases, setRecords]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<DebtKind | "all">("all");
  const [status, setStatus] = useState<DebtStatus | "all">("all");
  const [supplier, setSupplier] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<"all" | "30" | "60" | "90" | "120" | "150" | "custom">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState<DebtRecord | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Supplier dropdown sources: directory + suppliers seen in purchases + debts.
  const supplierOptions = useMemo(() => {
    const map = new Map<string, { ar: string; en: string }>();
    const add = (s: { ar: string; en: string }) => {
      const key = normName(s.en || s.ar);
      if (key && !map.has(key)) map.set(key, s);
    };
    suppliersDir.forEach((s) => add(s.name));
    purchases.forEach((p) => add(p.supplier));
    records.filter((d) => d.kind === "payable").forEach((d) => add(d.party));
    return Array.from(map.values()).sort((a, b) => (a.en || a.ar).localeCompare(b.en || b.ar));
  }, [suppliersDir, purchases, records]);

  // Next auto voucher number (PAY-00001…).
  const nextVoucherNo = useMemo(() => {
    const max = payments.reduce((m, p) => {
      const n = parseInt((p.voucherNo || "").replace(/\D/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `PAY-${String(max + 1).padStart(5, "0")}`;
  }, [payments]);


  const suppliers = useMemo(() => {
    const map = new Map<string, string>();
    supplierOptions.forEach((s) => {
      const key = supplierIdentity(s);
      if (key && !map.has(key)) map.set(key, s[lang] || s.en || s.ar);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [supplierOptions, lang]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    let fromTs: number | null = null;
    let toTs: number | null = null;
    if (datePreset === "custom") {
      if (dateFrom) fromTs = new Date(dateFrom).getTime();
      if (dateTo) toTs = new Date(dateTo).getTime() + 86400000 - 1;
    } else if (datePreset !== "all") {
      fromTs = now - Number(datePreset) * 86400000;
    }
    return records.filter((d) => {
      if (kind !== "all" && d.kind !== kind) return false;
      if (status !== "all" && d.status !== status) return false;
      if (supplier !== "all" && ![d.party.en, d.party.ar].map(normName).includes(supplier)) return false;
      const ts = new Date(d.issuedAt).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (!q) return true;
      return (
        d.id.toLowerCase().includes(q) ||
        d.reference.toLowerCase().includes(q) ||
        d.party.ar.includes(q) || d.party.en.toLowerCase().includes(q) ||
        String(d.amount).includes(q)
      );
    });
  }, [records, query, kind, status, supplier, datePreset, dateFrom, dateTo, lang]);

  const totals = useMemo(() => {
    const open = records.filter((d) => d.status !== "settled" && !String(d.id).startsWith("AUTO-PUR-"));
    const receivables = open.filter((d) => d.kind === "receivable").reduce((s, d) => s + (d.amount - d.paid), 0);
    const manualPayables = open.filter((d) => d.kind === "payable").reduce((s, d) => s + (d.amount - d.paid), 0);
    const purchasePayables = computePurchaseAging(purchases).total;
    const payables = manualPayables + purchasePayables;
    const overdueCount = open.filter((d) => d.status === "overdue").length;
    return { receivables, payables, net: receivables - payables, overdueCount };
  }, [records, purchases]);

  // Aging is computed DIRECTLY from the purchases module — purchase dates and
  // payment amounts recorded on each purchase row are the single source of
  // truth. We respect the supplier filter and the date-range filter so the
  // buckets stay aligned with what the user is looking at. Outstanding per
  // invoice = total - paid, aged by days since the purchase date.
  const agingResult = useMemo(() => {
    const now = Date.now();
    let from: Date | null = null;
    let to: Date | null = null;
    if (datePreset === "custom") {
      if (dateFrom) from = new Date(dateFrom + "T00:00:00");
      if (dateTo) to = new Date(dateTo + "T23:59:59");
    } else if (datePreset !== "all") {
      from = new Date(now - Number(datePreset) * 86400000);
    }
    return computePurchaseAging(purchases, { supplierKey: supplier === "all" ? "" : supplier, from, to, now });
  }, [purchases, supplier, datePreset, dateFrom, dateTo]);
  const aging = agingResult.buckets;

  type AgingBucketKey = "1" | "2" | "3" | "4" | "5" | "+5";
  const [bucketDetail, setBucketDetail] = useState<AgingBucketKey | null>(null);

  const lotsByBucket = useMemo(() => {
    const now = Date.now();
    const map: Record<AgingBucketKey, typeof agingResult.lots> = { "1": [], "2": [], "3": [], "4": [], "5": [], "+5": [] };
    for (const lot of agingResult.lots) {
      const monthStr = (lot.purchase as { month?: string }).month;
      const src = monthStr
        ? (() => { const [y, m] = monthStr.split("-").map(Number); return new Date(y, m - 1, 1); })()
        : new Date(lot.purchase.date);
      const end = new Date(now);
      const months = Math.max(0, (end.getFullYear() - src.getFullYear()) * 12 + (end.getMonth() - src.getMonth()));
      const key: AgingBucketKey = months <= 1 ? "1" : months <= 2 ? "2" : months <= 3 ? "3" : months <= 4 ? "4" : months <= 5 ? "5" : "+5";
      map[key].push(lot);
    }
    return map;
  }, [agingResult.lots]);


  const buildExport = () => {
    const headers = ["id", "kind", "party", "reference", "amount", "paid", "balance", "issued", "due", "status"];
    const rows = filtered.map((d) => ({
      id: d.id,
      kind: d.kind,
      party: d.party.en,
      reference: d.reference,
      amount: d.amount,
      paid: d.paid,
      balance: d.amount - d.paid,
      issued: d.issuedAt,
      due: d.dueAt,
      status: d.status,
    }));
    return { headers, rows };
  };
  const exportXlsx = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsXlsx } = await import("@/lib/data-export");
    await exportRowsAsXlsx({ filename: `pharmledger-debts-${Date.now()}`, sheetName: "Debts", headers, rows });
  };
  const exportPdf = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsPdf } = await import("@/lib/data-export");
    await exportRowsAsPdf({ filename: `pharmledger-debts-${Date.now()}`, title: String(t("debtsTitle" as never) || "Debts"), headers, rows, lang });
  };

  // FIFO-allocate a payment to the supplier's unpaid purchases (oldest first).
  // Updates each purchase's `paid` and `status`. Returns leftover unallocated.
  const allocateToPurchases = (supplierKey: string, amount: number) => {
    const allocated = allocatePaymentToPurchases(purchases, supplierKey, amount);
    setPurchases(allocated.purchases);
    return { allocations: allocated.allocations, leftover: allocated.leftover };
  };

  const addPayment = (payload: Omit<SupplierPayment, "id" | "voucherNo"> & { voucherNo?: string }) => {
    const id = `SP-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    const voucherNo = payload.voucherNo?.trim() || nextVoucherNo;
    const candidate: SupplierPayment = { ...payload, id, voucherNo };
    const allocation = allocateToPurchases(supplierIdentity(payload.supplier), payload.amount);
    const rec: SupplierPayment = { ...candidate, allocations: allocation.allocations };
    setPayments((prev) => [rec, ...prev]);
    const leftover = allocation.leftover;
    if (leftover > 0.01) {
      toast.warning(
        lang === "ar"
          ? `تم تسجيل السند ${voucherNo} — لم يتم تخصيص ${fmt(leftover)} لعدم وجود فواتير غير مسددة كافية`
          : `Voucher ${voucherNo} saved — ${fmt(leftover)} not allocated (no open invoices)`,
      );
    } else {
      toast.success(lang === "ar" ? `تم تسجيل السند ${voucherNo}` : `Voucher ${voucherNo} saved`);
    }
    setPayOpen(false);
  };

  const downloadPaymentTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { date: "2025-01-15", voucherNo: "PAY-00001", supplier: "Supplier Name", amount: 1000, method: "bank", note: "" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "supplier-payments-template.xlsx");
  };

  const handleImportPayments = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const pick = (r: Record<string, unknown>, keys: string[]) => {
        const low: Record<string, unknown> = {};
        for (const k of Object.keys(r)) low[k.toLowerCase().trim()] = r[k];
        for (const k of keys) { const v = low[k.toLowerCase()]; if (v !== undefined && v !== "") return v; }
        return "";
      };
      const toNum = (v: unknown) => {
        if (typeof v === "number") return v;
        const n = parseFloat(String(v).replace(/[^\d.-]/g, ""));
        return isNaN(n) ? 0 : n;
      };
      const toIso = (v: unknown) => {
        if (v instanceof Date) return v.toISOString();
        const s = String(v).trim();
        if (!s) return new Date().toISOString();
        const d = new Date(s);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      };
      let counter = payments.reduce((m, p) => {
        const n = parseInt((p.voucherNo || "").replace(/\D/g, ""), 10);
        return Number.isFinite(n) && n > m ? n : m;
      }, 0);
      let leftoverTotal = 0;
      const created: SupplierPayment[] = [];
      let workingPurchases = purchases;
      for (const r of rows) {
        const supplier = String(pick(r, ["supplier", "المورد", "اسم المورد"]) || "").trim();
        const amount = toNum(pick(r, ["amount", "المبلغ", "القيمة"]));
        if (!supplier || !(amount > 0)) continue;
        const methodRaw = String(pick(r, ["method", "طريقة السداد", "طريقة"]) || "bank").toLowerCase().trim();
        const method: SupplierPaymentMethod =
          ["cash", "نقد", "نقدا", "نقداً"].includes(methodRaw) ? "cash" : "bank";
        const vGiven = String(pick(r, ["voucherNo", "voucher", "رقم السند", "السند"]) || "").trim();
        const voucherNo = vGiven || `PAY-${String(++counter).padStart(5, "0")}`;
        if (!vGiven) counter; else counter = Math.max(counter, parseInt(vGiven.replace(/\D/g, ""), 10) || counter);
        const rec: SupplierPayment = {
          id: `SP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
          voucherNo,
          date: toIso(pick(r, ["date", "التاريخ"])),
          supplier: { ar: supplier, en: supplier },
          amount,
          method,
          note: String(pick(r, ["note", "notes", "ملاحظات"]) || "") || undefined,
        };
        const allocation = allocatePaymentToPurchases(workingPurchases, normName(supplier), amount);
        workingPurchases = allocation.purchases;
        rec.allocations = allocation.allocations;
        created.push(rec);
        leftoverTotal += allocation.leftover;
      }
      if (!created.length) {
        toast.error(lang === "ar" ? "لا توجد سندات صالحة في الملف" : "No valid payments in file");
        return;
      }
      setPurchases(workingPurchases);
      setPayments((prev) => [...created, ...prev]);
      toast.success(
        (lang === "ar" ? `تم استيراد ${created.length} سند` : `${created.length} payments imported`) +
          (leftoverTotal > 0.01 ? ` — ${fmt(leftoverTotal)} ${lang === "ar" ? "غير مخصص" : "unallocated"}` : ""),
      );

    } catch (err) {
      console.error(err);
      toast.error(t("importFailed"));
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const addDebt = (d: Omit<DebtRecord, "id">) => {
    const id = `DBT-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setRecords((prev) => [{ ...d, id }, ...prev]);
    toast.success(t("addedDebt"));
    setOpen(false);
  };


  const settle = (id: string) => {
    const nowIso = new Date().toISOString();
    setRecords((prev) => prev.map((d) => (d.id === id ? { ...d, status: "settled", paid: d.amount, paidAt: d.paidAt || nowIso } : d)));
    toast.success(t("addedDebt"));
  };

  const updateDebt = (id: string, patch: Omit<DebtRecord, "id">) => {
    setRecords((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      // Stamp paidAt when the paid amount increases and no prior stamp exists.
      const prevPaid = Number(d.paid) || 0;
      const nextPaid = Number(patch.paid) || 0;
      const paidAt = patch.paidAt || (nextPaid > prevPaid ? new Date().toISOString() : d.paidAt);
      return { ...d, ...patch, paidAt };
    }));
    toast.success(t("updatedDebt"));
    setEditing(null);
  };

  const deleteDebt = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRow"))) return;
    setRecords((prev) => prev.filter((d) => d.id !== id));
    toast.success(t("deletedRow"));
  };

  const sortable = useSortable<DebtRecord>(filtered, {
    reference: (d) => d.reference || d.id,
    party: (d) => d.party.en || d.party.ar,
    kind: (d) => d.kind,
    issueDate: (d) => (d.issuedAt ? new Date(d.issuedAt) : null),
    dueDate: (d) => (d.dueAt ? new Date(d.dueAt) : null),
    amount: (d) => d.amount,
    balance: (d) => d.amount - d.paid,
    status: (d) => d.status,
  });
  const pg = usePagination(sortable.sorted);
  const visibleIds = useMemo(() => pg.pageItems.map((d) => d.id), [pg.pageItems]);
  const sel = useSelection(visibleIds);
  const deleteSelected = () => {
    if (sel.count === 0) return;
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteSelected"))) return;
    const ids = new Set(sel.ids);
    const removed = records.filter((d) => ids.has(d.id));
    setRecords((prev) => prev.filter((d) => !ids.has(d.id)));
    sel.clear();
    toast.success(t("deletedSelected"), {
      action: {
        label: t("undo"),
        onClick: () => {
          setRecords((prev) => [...removed, ...prev.filter((d) => !ids.has(d.id))]);
          toast.success(t("restoredSelected"));
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="px-4 lg:px-8 py-6 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                <span className="text-gradient">{t("debtsTitle")}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("debtsSubtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportXlsx} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <Download className="size-4" />{t("exportExcel")}
              </button>
              <button onClick={exportPdf} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <FileText className="size-4" />{t("exportPdf")}
              </button>
            </div>

          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={ArrowDownLeft} label={t("receivables")} value={fmt(totals.receivables)} suffix={t("currency")} accent="success" />
            <Stat icon={ArrowUpRight} label={t("payables")} value={fmt(totals.payables)} suffix={t("currency")} accent="warning" />
            <Stat icon={Scale} label={t("netPosition")} value={fmt(totals.net)} suffix={t("currency")} accent={totals.net >= 0 ? "primary" : "destructive"} />
            <Stat icon={AlertTriangle} label={t("overdueCount")} value={fmt(totals.overdueCount)} accent="destructive" />
          </div>

          {/* Aging */}
          <div className="glass-card rounded-2xl p-5 animate-fade-in">
            <h3 className="font-semibold text-base mb-4">{t("agingBuckets")}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {([
                ["1", "bucket1", "info"],
                ["2", "bucket2", "info"],
                ["3", "bucket3", "warning"],
                ["4", "bucket4", "warning"],
                ["5", "bucket5", "destructive"],
                ["+5", "bucket5plus", "destructive"],
              ] as const).map(([k, label, tone]) => (
                <AgingCard
                  key={k}
                  label={t(label)}
                  value={aging[k as keyof typeof aging]}
                  count={lotsByBucket[k as AgingBucketKey].length}
                  tone={tone}
                  fmt={fmt}
                  t={t}
                  onClick={() => setBucketDetail(k as AgingBucketKey)}
                />
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in">
            <div className="relative flex-1 min-w-[220px]">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3")} />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchDebts")}
                className={cn(
                  "w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition",
                  dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4",
                )}
              />
            </div>
            <FilterSelect label={t("debtType")} value={kind} options={KINDS} onChange={(v) => setKind(v as DebtKind | "all")} t={t} />
            <FilterSelect label={t("status")} value={status} options={STATUSES} onChange={(v) => setStatus(v as DebtStatus | "all")} t={t} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap">{t("supplier")}</span>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger className="h-9 w-48 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40">
                  <SelectValue placeholder={t("filterAll")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  <SelectItem value="all" className="text-xs">{t("filterAll")}</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap">{lang === "ar" ? "الفترة" : "Period"}</span>
              <Select value={datePreset} onValueChange={(v) => setDatePreset(v as typeof datePreset)}>
                <SelectTrigger className="h-9 w-44 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">{t("filterAllTime")}</SelectItem>
                  <SelectItem value="30" className="text-xs">{lang === "ar" ? "آخر 30 يوماً" : "Last 30 days"}</SelectItem>
                  <SelectItem value="60" className="text-xs">{lang === "ar" ? "آخر 60 يوماً" : "Last 60 days"}</SelectItem>
                  <SelectItem value="90" className="text-xs">{lang === "ar" ? "آخر 90 يوماً" : "Last 90 days"}</SelectItem>
                  <SelectItem value="120" className="text-xs">{lang === "ar" ? "آخر 120 يوماً" : "Last 120 days"}</SelectItem>
                  <SelectItem value="150" className="text-xs">{lang === "ar" ? "آخر 150 يوماً" : "Last 150 days"}</SelectItem>
                  <SelectItem value="custom" className="text-xs">{lang === "ar" ? "فترة مخصصة" : "Custom range"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {datePreset === "custom" && (
              <div className="flex items-center gap-2">
                <DatePickerInput
                  value={dateFrom}
                  onChange={setDateFrom}
                  aria-label={t("dateFrom")}
                  className="h-9 px-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                <span className="text-xs text-muted-foreground">→</span>
                <DatePickerInput
                  value={dateTo}
                  onChange={setDateTo}
                  aria-label={t("dateTo")}
                  className="h-9 px-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            )}
          </div>

          {/* Table */}
          <div className="glass-card rounded-2xl p-2 sm:p-4 animate-fade-in space-y-3">
            <ShowAllToggle showAll={pg.showAll} total={pg.total} onToggle={pg.toggleShowAll} />
            <BulkActionsBar
              count={sel.count}
              total={filtered.length}
              allSelected={sel.allSelected}
              onSelectAll={sel.toggleAll}
              onClear={sel.clear}
              onDelete={deleteSelected}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        aria-label={t("selectAll")}
                        checked={sel.allSelected}
                        ref={(el) => { if (el) el.indeterminate = sel.someSelected; }}
                        onChange={sel.toggleAll}
                        className="size-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </th>
                    <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="reference" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("reference")}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="party" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("party")}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="kind" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("debtType")}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3 hidden md:table-cell"><SortHeader sortKey="issueDate" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{lang === "ar" ? "تاريخ الإصدار" : "Issue Date"}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3 hidden md:table-cell"><SortHeader sortKey="dueDate" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("dueDate")}</SortHeader></th>
                    <th className="text-end font-medium py-3 px-3"><SortHeader sortKey="amount" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("amount")}</SortHeader></th>
                    <th className="text-end font-medium py-3 px-3 hidden lg:table-cell"><SortHeader sortKey="balance" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("balance")}</SortHeader></th>
                    <th className="text-center font-medium py-3 px-3"><SortHeader sortKey="status" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="center">{t("status")}</SortHeader></th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pg.pageItems.map((d) => {
                    const due = new Date(d.dueAt);
                    const days = Math.floor((Date.now() - due.getTime()) / 86400000);
                    const balance = d.amount - d.paid;
                    return (
                      <tr key={d.id} className={cn("hover:bg-muted/30 transition", sel.isSelected(d.id) && "bg-primary/5")}>
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            aria-label={t("selectAll")}
                            checked={sel.isSelected(d.id)}
                            onChange={() => sel.toggle(d.id)}
                            className="size-4 rounded border-border accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold tabular text-xs">{d.reference}</div>
                          <div className="text-[11px] text-muted-foreground tabular">{d.id}</div>
                        </td>
                        <td className="py-3 px-3 text-foreground/90 truncate max-w-[200px]">{d.party[lang]}</td>
                        <td className="py-3 px-3">
                          <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border",
                            d.kind === "receivable"
                              ? "bg-success/15 text-success border-success/30"
                              : "bg-warning/15 text-warning border-warning/30",
                          )}>
                            {d.kind === "receivable" ? <ArrowDownLeft className="size-3" /> : <ArrowUpRight className="size-3" />}
                            {t(d.kind as never)}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell tabular text-muted-foreground">
                          {d.issuedAt ? new Date(d.issuedAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell tabular">
                          <div className={cn(d.status === "overdue" ? "text-destructive font-semibold" : "text-muted-foreground")}>
                            {due.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                          {d.status === "overdue" && <div className="text-[10px] text-destructive/80">+{days}d</div>}
                        </td>
                        <td className="py-3 px-3 text-end tabular text-muted-foreground">{fmt(d.amount)}</td>
                        <td className="py-3 px-3 text-end hidden lg:table-cell font-bold tabular">
                          <span className={d.kind === "receivable" ? "text-success" : "text-warning"}>{fmt(balance)}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", statusTone[d.status])}>
                            {t(d.status as never)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-end">
                          <div className="inline-flex items-center gap-1">
                            {d.status !== "settled" && (
                              <button onClick={() => settle(d.id)} className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-success/15 text-success border border-success/30 hover:bg-success/25 transition inline-flex items-center gap-1">
                                <CheckCircle2 className="size-3" />{t("markSettled")}
                              </button>
                            )}
                            <button type="button" onClick={() => setEditing(d)} className="size-8 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center" title={t("edit")} aria-label={t("edit")}>
                              <Pencil className="size-3.5" />
                            </button>
                            <button type="button" onClick={() => deleteDebt(d.id)} className="size-8 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center" title={t("delete")} aria-label={t("delete")}>
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="py-12 text-center text-sm text-muted-foreground">{t("noResults")}</td></tr>
                  )}
                </tbody>
              </table>
              <PaginationBar page={pg.page} totalPages={pg.totalPages} total={pg.total} from={pg.from} to={pg.to} onPageChange={pg.setPage} showAll={pg.showAll} onToggleShowAll={pg.toggleShowAll} />
            </div>

            {/* Totals footer */}
            {filtered.length > 0 && (
              <div className="glass-card rounded-2xl p-4 sm:p-5 animate-fade-in">
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">{t("totals")}</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <SummaryBox label={t("count")} value={String(filtered.length)} />
                  <SummaryBox label={t("totalAmount")} value={fmt(filtered.reduce((s, d) => s + d.amount, 0))} tone="primary" />
                  <SummaryBox label={t("totalPaid")} value={fmt(filtered.reduce((s, d) => s + d.paid, 0))} tone="success" />
                  <SummaryBox label={t("totalBalance")} value={fmt(filtered.reduce((s, d) => s + (d.amount - d.paid), 0))} tone="warning" />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {open && <AddDebtDialog onClose={() => setOpen(false)} onSubmit={addDebt} />}
      {payOpen && (
        <SupplierPaymentDialog
          onClose={() => setPayOpen(false)}
          onSubmit={addPayment}
          suppliers={supplierOptions}
          nextVoucherNo={nextVoucherNo}
        />
      )}
      {editing && (
        <AddDebtDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(patch) => updateDebt(editing.id, patch)}
        />
      )}
      {bucketDetail && (
        <AgingDetailsDialog
          bucketKey={bucketDetail}
          label={t(({ "1": "bucket1", "2": "bucket2", "3": "bucket3", "4": "bucket4", "5": "bucket5", "+5": "bucket5plus" } as const)[bucketDetail] as never)}
          lots={lotsByBucket[bucketDetail]}
          onClose={() => setBucketDetail(null)}
        />
      )}
    </div>
  );
}

function AgingCard({ label, value, count, tone, fmt, t, onClick }: {
  label: string; value: number; count: number; tone: "info" | "warning" | "destructive";
  fmt: (n: number) => string; t: (k: never) => string; onClick?: () => void;
}) {
  const toneCls: Record<string, string> = {
    info: "text-info border-info/30 bg-info/5 hover:bg-info/10",
    warning: "text-warning border-warning/30 bg-warning/5 hover:bg-warning/10",
    destructive: "text-destructive border-destructive/30 bg-destructive/5 hover:bg-destructive/10",
  };
  return (
    <button type="button" onClick={onClick} className={cn("text-start rounded-xl border p-4 transition cursor-pointer w-full", toneCls[tone])}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
        <span className="text-[10px] font-semibold tabular bg-background/40 border border-border/50 rounded-md px-1.5 py-0.5">{count}</span>
      </div>
      <div className="font-bold tabular text-xl mt-1">{fmt(value)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency" as never)}</span></div>
    </button>
  );
}

function AgingDetailsDialog({ bucketKey, label, lots, onClose }: {
  bucketKey: string;
  label: string;
  lots: { purchase: PurchaseEntry & { month?: string }; remaining: number; originalTotal: number }[];
  onClose: () => void;
}) {
  const { t, fmt, lang } = useApp();
  const monthOf = (p: PurchaseEntry & { month?: string }) => {
    if (p.month) return p.month;
    const d = new Date(p.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const total = lots.reduce((s, l) => s + l.remaining, 0);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-4xl p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {lang === "ar" ? "فواتير الفئة العمرية" : "Invoices in aging bucket"} — {label}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lots.length} {lang === "ar" ? "فاتورة" : "invoices"} · {fmt(total)} {t("currency")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>
        <div className="overflow-auto flex-1 -mx-2">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card/95 backdrop-blur">
              <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="text-start font-medium py-2 px-3">{t("invoiceNumber" as never) || (lang === "ar" ? "رقم الفاتورة" : "Invoice #")}</th>
                <th className="text-start font-medium py-2 px-3">{lang === "ar" ? "المورد" : "Supplier"}</th>
                <th className="text-start font-medium py-2 px-3">{lang === "ar" ? "التاريخ" : "Date"}</th>
                <th className="text-start font-medium py-2 px-3">{lang === "ar" ? "الشهر المحسوب" : "Computed Month"}</th>
                <th className="text-end font-medium py-2 px-3">{lang === "ar" ? "الإجمالي" : "Total"}</th>
                <th className="text-end font-medium py-2 px-3">{lang === "ar" ? "المسدد" : "Paid"}</th>
                <th className="text-end font-medium py-2 px-3">{lang === "ar" ? "المتبقي" : "Remaining"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {lots.map((l) => {
                const p = l.purchase;
                const paid = (Number(p.total) || 0) - l.remaining;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="py-2 px-3 font-semibold tabular text-xs">{p.invoiceNumber || p.id}</td>
                    <td className="py-2 px-3 truncate max-w-[180px]">{p.supplier[lang] || p.supplier.en || p.supplier.ar}</td>
                    <td className="py-2 px-3 tabular text-muted-foreground">{new Date(p.date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="py-2 px-3 tabular font-semibold text-primary">{monthOf(p)}</td>
                    <td className="py-2 px-3 text-end tabular">{fmt(Number(p.total) || 0)}</td>
                    <td className="py-2 px-3 text-end tabular text-success">{fmt(Math.max(0, paid))}</td>
                    <td className="py-2 px-3 text-end tabular font-bold text-warning">{fmt(l.remaining)}</td>
                  </tr>
                );
              })}
              {lots.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">{t("noResults")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end pt-2 border-t border-border/40">
          <button type="button" onClick={onClose} className="h-10 px-5 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">{t("close" as never) || (lang === "ar" ? "إغلاق" : "Close")}</button>
        </div>
        <span className="hidden">{bucketKey}</span>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix, accent = "primary" }: {
  icon: typeof Scale;
  label: string; value: string; suffix?: string;
  accent?: "primary" | "secondary" | "success" | "info" | "warning" | "destructive";
}) {
  const tone: Record<string, string> = {
    primary: "from-primary/20 to-primary/0 text-primary",
    secondary: "from-secondary/20 to-secondary/0 text-secondary",
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    warning: "from-warning/20 to-warning/0 text-warning",
    destructive: "from-destructive/20 to-destructive/0 text-destructive",
  };
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", tone[accent])} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className={cn("size-9 rounded-xl grid place-items-center bg-background/40 border border-border/50", tone[accent].split(" ").pop())}>
            <Icon className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <div className="text-2xl font-bold tabular tracking-tight">{value}</div>
          {suffix && <div className="text-xs font-medium text-muted-foreground">{suffix}</div>}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange, t }: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; t: (k: never) => string;
}) {
  const all = ["all", ...options];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-40 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40">
          <SelectValue placeholder={t("filterAll" as never)} />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {all.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">
              {o === "all" ? t("filterAll" as never) : t(o as never)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AddDebtDialog({ onClose, onSubmit, initial }: {
  onClose: () => void;
  onSubmit: (d: Omit<DebtRecord, "id">) => void;
  initial?: DebtRecord;
}) {
  const { t } = useApp();
  const [kind, setKind] = useState<DebtKind>(initial?.kind ?? "receivable");
  const [party, setParty] = useState(initial?.party.en ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [days, setDays] = useState(initial
    ? String((Math.round((new Date(initial.dueAt).getTime() - new Date(initial.issuedAt).getTime()) / 86400000)))
    : "30");
  const [reference, setReference] = useState(initial?.reference ?? "");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Amount must be > 0");
    if (!party.trim()) return toast.error("Party required");
    const issued = initial ? new Date(initial.issuedAt) : new Date();
    const due = new Date(issued);
    due.setDate(due.getDate() + (Number(days) || 30));
    onSubmit({
      kind,
      party: { ar: party, en: party },
      reference: reference || `${kind === "receivable" ? "AR" : "AP"}-${Math.floor(Math.random() * 90000) + 10000}`,
      amount: n,
      paid: initial?.paid ?? 0,
      issuedAt: issued.toISOString(),
      dueAt: due.toISOString(),
      status: initial?.status ?? "current",
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("newDebt")}</h2>
            <p className="text-xs text-muted-foreground">{t("debtsSubtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("debtType")}>
            <select value={kind} onChange={(e) => setKind(e.target.value as DebtKind)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              {KINDS.map((k) => <option key={k} value={k}>{t(k as never)}</option>)}
            </select>
          </Field>
          <Field label={t("party")}>
            <input value={party} onChange={(e) => setParty(e.target.value)} required autoFocus className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("amount")} (${t("currency")})`}>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={1} required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("dueDate")} (${t("daysOverdue")})`}>
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} min={1} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("reference")} full>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="AR/AP-xxxxx" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">{t("cancel")}</button>
          <button type="submit" className="h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Plus className="size-4" />{t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function SummaryBox({ label, value, tone = "primary" }: { label: string; value: string; tone?: "primary" | "success" | "warning" | "destructive" | "info"; }) {
  const toneCls: Record<string, string> = {
    primary: "text-primary border-primary/30 bg-primary/5",
    success: "text-success border-success/30 bg-success/5",
    warning: "text-warning border-warning/30 bg-warning/5",
    destructive: "text-destructive border-destructive/30 bg-destructive/5",
    info: "text-info border-info/30 bg-info/5",
  };
  return (
    <div className={cn("rounded-xl border p-4", toneCls[tone])}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className="font-bold tabular text-xl mt-1">{value}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("space-y-1.5 block", full && "col-span-2")}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SupplierPaymentDialog({
  onClose,
  onSubmit,
  suppliers,
  nextVoucherNo,
}: {
  onClose: () => void;
  onSubmit: (p: Omit<SupplierPayment, "id" | "voucherNo"> & { voucherNo?: string }) => void;
  suppliers: { ar: string; en: string }[];
  nextVoucherNo: string;
}) {
  const { t, lang } = useApp();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [voucherNo, setVoucherNo] = useState(nextVoucherNo);
  const [supplierKey, setSupplierKey] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<SupplierPaymentMethod>("bank");
  const [note, setNote] = useState("");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return toast.error(lang === "ar" ? "أدخل قيمة صحيحة" : "Enter a valid amount");
    const supplier = suppliers.find((s) => (s.en || s.ar) === supplierKey);
    if (!supplier) return toast.error(lang === "ar" ? "اختر المورد" : "Select a supplier");
    onSubmit({
      voucherNo: voucherNo.trim() || undefined,
      date: new Date(date).toISOString(),
      supplier,
      amount: n,
      method,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{lang === "ar" ? "تسديد مورد" : "Supplier Payment"}</h2>
            <p className="text-xs text-muted-foreground">
              {lang === "ar"
                ? "سيتم تخصيص المبلغ تلقائياً على فواتير المورد غير المسددة (الأقدم أولاً)"
                : "Amount auto-allocated to supplier's unpaid invoices (oldest first)"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={lang === "ar" ? "التاريخ" : "Date"}>
            <DatePickerInput value={date} onChange={setDate} required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={lang === "ar" ? "رقم السند" : "Voucher No."}>
            <input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} placeholder={nextVoucherNo} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={lang === "ar" ? "المورد" : "Supplier"} full>
            <Select value={supplierKey} onValueChange={setSupplierKey}>
              <SelectTrigger className="h-10 rounded-xl bg-input/40 border-border text-sm">
                <SelectValue placeholder={lang === "ar" ? "اختر المورد" : "Select supplier"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-72">
                {suppliers.length === 0 && (
                  <SelectItem value="__none" disabled className="text-xs">
                    {lang === "ar" ? "لا يوجد موردون" : "No suppliers"}
                  </SelectItem>
                )}
                {suppliers.map((s) => {
                  const v = s.en || s.ar;
                  return (
                    <SelectItem key={v} value={v} className="text-xs">
                      {lang === "ar" ? s.ar || s.en : s.en || s.ar}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>
          <Field label={`${lang === "ar" ? "المبلغ" : "Amount"} (${t("currency")})`}>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0.01} step="0.01" required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={lang === "ar" ? "طريقة السداد" : "Payment Method"}>
            <select value={method} onChange={(e) => setMethod(e.target.value as SupplierPaymentMethod)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              <option value="bank">{lang === "ar" ? "بنك" : "Bank"}</option>
              <option value="cash">{lang === "ar" ? "نقدا" : "Cash"}</option>
            </select>
          </Field>
          <Field label={lang === "ar" ? "ملاحظات" : "Notes"} full>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">{t("cancel")}</button>
          <button type="submit" className="h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <CheckCircle2 className="size-4" />{t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
