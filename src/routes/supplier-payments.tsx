import { createFileRoute } from "@tanstack/react-router";
import { DatePickerInput } from "@/components/date-picker-input";
import { useMemo, useRef, useState } from "react";
import {
  Download,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Wallet,
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
import type { PurchaseEntry, SupplierRecord } from "@/lib/mock-data";
import {
  allocatePaymentToPurchases,
  normalizeSupplierName,
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
import type { SupplierPayment, SupplierPaymentMethod } from "@/routes/debts";

export const Route = createFileRoute("/supplier-payments")({
  head: () => ({
    meta: [
      { title: "Supplier Payments — PharmLedger" },
      { name: "description", content: "Manage supplier payment vouchers." },
    ],
  }),
  component: SupplierPaymentsPage,
});

const normName = (s: string) => normalizeSupplierName(s);

function rollbackPurchases(purchases: PurchaseEntry[], allocations?: SupplierPaymentAllocation[]): PurchaseEntry[] {
  if (!allocations?.length) return purchases;
  const byId = new Map(allocations.map((a) => [a.purchaseId, a.amount]));
  return purchases.map((p) => {
    const rb = byId.get(p.id);
    if (!rb) return p;
    const total = Number(p.total) || 0;
    const paid = Math.max(0, (Number(p.paid) || 0) - rb);
    const status = total > 0 ? (paid >= total - 0.01 ? "paid" : paid > 0 ? "partial" : "unpaid") : p.status;
    return { ...p, paid, status };
  });
}

function SupplierPaymentsPage() {
  const { t, fmt, lang, dir } = useApp();
  const [payments, setPayments] = useOrgStorage<SupplierPayment>("pharmledger.supplier-payments.v1", []);
  const [purchases, setPurchases] = useOrgStorage<PurchaseEntry>("pharmledger.purchases.v1", []);
  const [suppliersDir] = useOrgStorage<SupplierRecord>("suppliers.records.v1", []);

  const [query, setQuery] = useState("");
  const [supplier, setSupplier] = useState<string>("all");
  const [method, setMethod] = useState<"all" | SupplierPaymentMethod>("all");
  const [datePreset, setDatePreset] = useState<"all" | "30" | "60" | "90" | "120" | "150" | "custom">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [editing, setEditing] = useState<SupplierPayment | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const supplierOptions = useMemo(() => {
    const map = new Map<string, { ar: string; en: string }>();
    const add = (s: { ar: string; en: string }) => {
      const key = normName(s.en || s.ar);
      if (key && !map.has(key)) map.set(key, s);
    };
    suppliersDir.forEach((s) => add(s.name));
    purchases.forEach((p) => add(p.supplier));
    payments.forEach((p) => add(p.supplier));
    return Array.from(map.values()).sort((a, b) => (a.en || a.ar).localeCompare(b.en || b.ar));
  }, [suppliersDir, purchases, payments]);

  const supplierFilters = useMemo(() => {
    const map = new Map<string, string>();
    supplierOptions.forEach((s) => {
      const key = supplierIdentity(s);
      if (key && !map.has(key)) map.set(key, s[lang] || s.en || s.ar);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [supplierOptions, lang]);

  const nextVoucherNo = useMemo(() => {
    const max = payments.reduce((m, p) => {
      const n = parseInt((p.voucherNo || "").replace(/\D/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `PAY-${String(max + 1).padStart(5, "0")}`;
  }, [payments]);

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
    return payments.filter((p) => {
      if (supplier !== "all" && !([p.supplier.en, p.supplier.ar].map(normName)).includes(supplier)) return false;
      if (method !== "all" && p.method !== method) return false;
      const ts = new Date(p.date).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (!q) return true;
      return (
        (p.voucherNo || "").toLowerCase().includes(q) ||
        p.supplier.en.toLowerCase().includes(q) ||
        p.supplier.ar.includes(q) ||
        String(p.amount).includes(q) ||
        (p.note || "").toLowerCase().includes(q)
      );
    });
  }, [payments, query, supplier, method, datePreset, dateFrom, dateTo]);

  const sortable = useSortable<SupplierPayment>(filtered, {
    voucherNo: (p) => p.voucherNo || "",
    date: (p) => (p.date ? new Date(p.date) : null),
    supplier: (p) => p.supplier.en || p.supplier.ar,
    amount: (p) => p.amount,
    method: (p) => p.method,
  });
  const pg = usePagination(sortable.sorted);
  const visibleIds = useMemo(() => pg.pageItems.map((p) => p.id), [pg.pageItems]);
  const sel = useSelection(visibleIds);

  // CRUD
  const upsertPayment = (id: string | null, payload: Omit<SupplierPayment, "id" | "voucherNo"> & { voucherNo?: string }) => {
    const old = id ? payments.find((p) => p.id === id) : null;
    let working = purchases;
    if (old) working = rollbackPurchases(working, old.allocations);
    const allocation = allocatePaymentToPurchases(working, supplierIdentity(payload.supplier), payload.amount);
    working = allocation.purchases;
    const voucherNo = payload.voucherNo?.trim() || old?.voucherNo || nextVoucherNo;
    const rec: SupplierPayment = {
      id: id || `SP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      voucherNo,
      date: payload.date,
      supplier: payload.supplier,
      amount: payload.amount,
      method: payload.method,
      note: payload.note,
      allocations: allocation.allocations,
    };
    setPurchases(working);
    setPayments((prev) => (id ? prev.map((p) => (p.id === id ? rec : p)) : [rec, ...prev]));
    toast.success(lang === "ar" ? (id ? "تم تحديث السند" : `تم تسجيل السند ${voucherNo}`) : (id ? "Voucher updated" : `Voucher ${voucherNo} saved`));
    if (allocation.leftover > 0.01) {
      toast.warning(
        lang === "ar"
          ? `لم يتم تخصيص ${fmt(allocation.leftover)} لعدم وجود فواتير غير مسددة كافية`
          : `${fmt(allocation.leftover)} not allocated (no open invoices)`,
      );
    }
    setEditing(null);
    setAddOpen(false);
  };

  const deletePayment = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRow"))) return;
    const pay = payments.find((p) => p.id === id);
    if (pay) setPurchases((prev) => rollbackPurchases(prev, pay.allocations));
    setPayments((prev) => prev.filter((p) => p.id !== id));
    toast.success(t("deletedRow"));
  };

  const deleteSelected = () => {
    if (sel.count === 0) return;
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteSelected"))) return;
    const ids = new Set(sel.ids);
    const toRemove = payments.filter((p) => ids.has(p.id));
    let working = purchases;
    for (const p of toRemove) working = rollbackPurchases(working, p.allocations);
    setPurchases(working);
    setPayments((prev) => prev.filter((p) => !ids.has(p.id)));
    sel.clear();
    toast.success(t("deletedSelected"));
  };

  const deleteAll = () => {
    if (!payments.length) {
      toast.info(lang === "ar" ? "لا توجد سندات للحذف" : "No vouchers to delete");
      return;
    }
    if (!window.confirm(lang === "ar" ? `سيتم حذف جميع سندات السداد (${payments.length}). هل تريد المتابعة؟` : `Delete all ${payments.length} supplier payment vouchers?`)) return;
    let working = purchases;
    for (const p of payments) working = rollbackPurchases(working, p.allocations);
    setPurchases(working);
    setPayments([]);
    toast.success(lang === "ar" ? "تم حذف جميع سندات السداد" : "All supplier payment vouchers deleted");
  };

  // Export
  const buildExport = () => {
    const headers = ["voucherNo", "date", "supplier", "amount", "method", "note"];
    const rows = filtered.map((p) => ({
      voucherNo: p.voucherNo,
      date: p.date.slice(0, 10),
      supplier: p.supplier.en || p.supplier.ar,
      amount: p.amount,
      method: p.method,
      note: p.note || "",
    }));
    return { headers, rows };
  };
  const exportXlsx = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsXlsx } = await import("@/lib/data-export");
    await exportRowsAsXlsx({ filename: `supplier-payments-${Date.now()}`, sheetName: "Payments", headers, rows });
  };
  const exportPdf = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsPdf } = await import("@/lib/data-export");
    await exportRowsAsPdf({ filename: `supplier-payments-${Date.now()}`, title: lang === "ar" ? "سندات سداد الموردين" : "Supplier Payments", headers, rows, lang });
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { date: "2025-01-15", voucherNo: "PAY-00001", supplier: "Supplier Name", amount: 1000, method: "bank", note: "" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "supplier-payments-template.xlsx");
  };

  const handleImport = async (ev: React.ChangeEvent<HTMLInputElement>) => {
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
        const supplierName = String(pick(r, ["supplier", "المورد", "اسم المورد"]) || "").trim();
        const amount = toNum(pick(r, ["amount", "المبلغ", "القيمة"]));
        if (!supplierName || !(amount > 0)) continue;
        const methodRaw = String(pick(r, ["method", "طريقة السداد", "طريقة"]) || "bank").toLowerCase().trim();
        const m: SupplierPaymentMethod = ["cash", "نقد", "نقدا", "نقداً"].includes(methodRaw) ? "cash" : "bank";
        const vGiven = String(pick(r, ["voucherNo", "voucher", "رقم السند", "السند"]) || "").trim();
        const voucherNo = vGiven || `PAY-${String(++counter).padStart(5, "0")}`;
        if (vGiven) counter = Math.max(counter, parseInt(vGiven.replace(/\D/g, ""), 10) || counter);
        const allocation = allocatePaymentToPurchases(workingPurchases, normName(supplierName), amount);
        workingPurchases = allocation.purchases;
        const rec: SupplierPayment = {
          id: `SP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}-${created.length}`,
          voucherNo,
          date: toIso(pick(r, ["date", "التاريخ"])),
          supplier: { ar: supplierName, en: supplierName },
          amount,
          method: m,
          note: String(pick(r, ["note", "notes", "ملاحظات"]) || "") || undefined,
          allocations: allocation.allocations,
        };
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

  const totals = useMemo(() => {
    const sum = filtered.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const bank = filtered.filter((p) => p.method === "bank").reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const cash = filtered.filter((p) => p.method === "cash").reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return { sum, bank, cash, count: filtered.length };
  }, [filtered]);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="px-4 lg:px-8 py-6 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                <span className="text-gradient">{lang === "ar" ? "سندات سداد الموردين" : "Supplier Payment Vouchers"}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {lang === "ar" ? "إدارة وتعديل سندات السداد المسجلة للموردين" : "Manage and edit recorded supplier payment vouchers"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportXlsx} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <Download className="size-4" />{t("exportExcel")}
              </button>
              <button onClick={exportPdf} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <FileText className="size-4" />{t("exportPdf")}
              </button>
              <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
              <button onClick={() => importRef.current?.click()} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <Upload className="size-4" />{lang === "ar" ? "استيراد Excel" : "Import Excel"}
              </button>
              <button onClick={downloadTemplate} className="h-10 px-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <FileText className="size-4" />{lang === "ar" ? "قالب" : "Template"}
              </button>
              <button onClick={deleteAll} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-destructive/40 text-destructive hover:bg-destructive/10 transition">
                <Trash2 className="size-4" />{lang === "ar" ? "حذف الكل" : "Clear All"}
              </button>
              <button onClick={() => setAddOpen(true)} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition">
                <Plus className="size-4" />{lang === "ar" ? "سند جديد" : "New Voucher"}
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiBox label={lang === "ar" ? "عدد السندات" : "Vouchers"} value={String(totals.count)} tone="primary" />
            <KpiBox label={lang === "ar" ? "إجمالي السداد" : "Total Paid"} value={`${fmt(totals.sum)} ${t("currency")}`} tone="success" />
            <KpiBox label={lang === "ar" ? "بنك" : "Bank"} value={`${fmt(totals.bank)} ${t("currency")}`} tone="info" />
            <KpiBox label={lang === "ar" ? "نقدا" : "Cash"} value={`${fmt(totals.cash)} ${t("currency")}`} tone="warning" />
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in">
            <div className="relative flex-1 min-w-[220px]">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3")} />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === "ar" ? "بحث برقم السند، المورد، المبلغ..." : "Search by voucher, supplier, amount..."}
                className={cn(
                  "w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition",
                  dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4",
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap">{t("supplier")}</span>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger className="h-9 w-48 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40">
                  <SelectValue placeholder={t("filterAll")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-72">
                  <SelectItem value="all" className="text-xs">{t("filterAll")}</SelectItem>
                  {supplierFilters.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide whitespace-nowrap">{lang === "ar" ? "الطريقة" : "Method"}</span>
              <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <SelectTrigger className="h-9 w-32 rounded-xl bg-muted/50 border-border text-xs font-semibold focus:ring-ring/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">{t("filterAll")}</SelectItem>
                  <SelectItem value="bank" className="text-xs">{lang === "ar" ? "بنك" : "Bank"}</SelectItem>
                  <SelectItem value="cash" className="text-xs">{lang === "ar" ? "نقدا" : "Cash"}</SelectItem>
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
                <DatePickerInput value={dateFrom} onChange={setDateFrom} className="h-9 px-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring/40" />
                <span className="text-xs text-muted-foreground">→</span>
                <DatePickerInput value={dateTo} onChange={setDateTo} className="h-9 px-3 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring/40" />
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
                      <input type="checkbox" aria-label={t("selectAll")} checked={sel.allSelected} ref={(el) => { if (el) el.indeterminate = sel.someSelected; }} onChange={sel.toggleAll} className="size-4 rounded border-border accent-primary cursor-pointer" />
                    </th>
                    <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="voucherNo" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{lang === "ar" ? "رقم السند" : "Voucher No."}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="date" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{lang === "ar" ? "التاريخ" : "Date"}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="supplier" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("supplier")}</SortHeader></th>
                    <th className="text-end font-medium py-3 px-3"><SortHeader sortKey="amount" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{lang === "ar" ? "المبلغ" : "Amount"}</SortHeader></th>
                    <th className="text-center font-medium py-3 px-3"><SortHeader sortKey="method" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="center">{lang === "ar" ? "الطريقة" : "Method"}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3 hidden md:table-cell">{lang === "ar" ? "ملاحظات" : "Notes"}</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pg.pageItems.map((p) => (
                    <tr key={p.id} className={cn("hover:bg-muted/30 transition", sel.isSelected(p.id) && "bg-primary/5")}>
                      <td className="py-3 px-3">
                        <input type="checkbox" aria-label={t("selectAll")} checked={sel.isSelected(p.id)} onChange={() => sel.toggle(p.id)} className="size-4 rounded border-border accent-primary cursor-pointer" />
                      </td>
                      <td className="py-3 px-3 font-semibold tabular text-xs">{p.voucherNo}</td>
                      <td className="py-3 px-3 tabular text-muted-foreground">
                        {new Date(p.date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 px-3 truncate max-w-[220px]">{p.supplier[lang] || p.supplier.en || p.supplier.ar}</td>
                      <td className="py-3 px-3 text-end tabular font-bold text-primary">{fmt(p.amount)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", p.method === "bank" ? "bg-info/15 text-info border-info/30" : "bg-warning/15 text-warning border-warning/30")}>
                          {p.method === "bank" ? (lang === "ar" ? "بنك" : "Bank") : (lang === "ar" ? "نقدا" : "Cash")}
                        </span>
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell text-muted-foreground text-xs truncate max-w-[200px]">{p.note || "—"}</td>
                      <td className="py-3 px-2 text-end">
                        <div className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => setEditing(p)} className="size-8 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center" title={t("edit")} aria-label={t("edit")}>
                            <Pencil className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => deletePayment(p.id)} className="size-8 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center" title={t("delete")} aria-label={t("delete")}>
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">{t("noResults")}</td></tr>
                  )}
                </tbody>
              </table>
              <PaginationBar page={pg.page} totalPages={pg.totalPages} total={pg.total} from={pg.from} to={pg.to} onPageChange={pg.setPage} showAll={pg.showAll} onToggleShowAll={pg.toggleShowAll} />
            </div>
          </div>
        </main>
      </div>

      {(addOpen || editing) && (
        <PaymentDialog
          initial={editing}
          suppliers={supplierOptions}
          nextVoucherNo={nextVoucherNo}
          onClose={() => { setEditing(null); setAddOpen(false); }}
          onSubmit={(payload) => upsertPayment(editing?.id || null, payload)}
        />
      )}
    </div>
  );
}

function KpiBox({ label, value, tone = "primary" }: { label: string; value: string; tone?: "primary" | "success" | "info" | "warning" }) {
  const toneCls: Record<string, string> = {
    primary: "text-primary border-primary/30 bg-primary/5",
    success: "text-success border-success/30 bg-success/5",
    info: "text-info border-info/30 bg-info/5",
    warning: "text-warning border-warning/30 bg-warning/5",
  };
  return (
    <div className={cn("glass-card rounded-2xl p-5 border", toneCls[tone])}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        <Wallet className="size-4 opacity-70" />
      </div>
      <div className="text-2xl font-bold tabular tracking-tight">{value}</div>
    </div>
  );
}

function PaymentDialog({
  initial, suppliers, nextVoucherNo, onClose, onSubmit,
}: {
  initial: SupplierPayment | null;
  suppliers: { ar: string; en: string }[];
  nextVoucherNo: string;
  onClose: () => void;
  onSubmit: (p: Omit<SupplierPayment, "id" | "voucherNo"> & { voucherNo?: string }) => void;
}) {
  const { t, lang } = useApp();
  const [date, setDate] = useState((initial?.date || new Date().toISOString()).slice(0, 10));
  const [voucherNo, setVoucherNo] = useState(initial?.voucherNo || nextVoucherNo);
  const [supplierKey, setSupplierKey] = useState<string>(initial ? (initial.supplier.en || initial.supplier.ar) : "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [method, setMethod] = useState<SupplierPaymentMethod>(initial?.method || "bank");
  const [note, setNote] = useState(initial?.note || "");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return toast.error(lang === "ar" ? "أدخل قيمة صحيحة" : "Enter a valid amount");
    const supplier = suppliers.find((s) => (s.en || s.ar) === supplierKey) || (supplierKey ? { ar: supplierKey, en: supplierKey } : null);
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
            <h2 className="text-lg font-bold">
              {initial ? (lang === "ar" ? "تعديل سند سداد" : "Edit Payment Voucher") : (lang === "ar" ? "سند سداد جديد" : "New Payment Voucher")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? "سيتم تخصيص المبلغ تلقائياً على فواتير المورد غير المسددة (الأقدم أولاً)" : "Amount auto-allocated to supplier's unpaid invoices (oldest first)"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "التاريخ" : "Date"}</span>
            <DatePickerInput value={date} onChange={setDate} required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </label>
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "رقم السند" : "Voucher No."}</span>
            <input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} placeholder={nextVoucherNo} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </label>
          <label className="space-y-1.5 block col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "المورد" : "Supplier"}</span>
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
          </label>
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-muted-foreground">{`${lang === "ar" ? "المبلغ" : "Amount"} (${t("currency")})`}</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0.01} step="0.01" required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </label>
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "طريقة السداد" : "Payment Method"}</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as SupplierPaymentMethod)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              <option value="bank">{lang === "ar" ? "بنك" : "Bank"}</option>
              <option value="cash">{lang === "ar" ? "نقدا" : "Cash"}</option>
            </select>
          </label>
          <label className="space-y-1.5 block col-span-2">
            <span className="text-xs font-medium text-muted-foreground">{lang === "ar" ? "ملاحظات" : "Notes"}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </label>
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
