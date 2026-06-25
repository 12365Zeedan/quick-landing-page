import { createFileRoute } from "@tanstack/react-router";
import { DatePickerInput } from "@/components/date-picker-input";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Banknote,
  Boxes,
  CalendarClock,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Upload,
  Wallet,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { ShowAllToggle } from "@/components/show-all-toggle";
import { PaginationBar } from "@/components/pagination-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/app-context";
import { useOrgStorage } from "@/lib/use-org-storage";
import { usePagination } from "@/lib/use-pagination";
import { useSelection } from "@/lib/use-selection";
import { useSortable } from "@/lib/use-sortable";
import { SortHeader } from "@/components/sort-header";
import {
  type PaymentMethod,
  type PurchaseEntry,
  type PurchaseStatus,
  type SupplierRecord,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "Purchases — PharmLedger" },
      { name: "description", content: "Track supplier invoices, VAT and outstanding balances for pharmacy purchases." },
    ],
  }),
  component: PurchasesPage,
});

const STATUSES: PurchaseStatus[] = ["paid", "partial", "unpaid"];
const METHODS: PaymentMethod[] = ["cash", "card", "transfer", "insurance"];

const methodIcon: Record<PaymentMethod, typeof Wallet> = {
  cash: Banknote, card: CreditCard, transfer: Wallet, insurance: ShieldCheck,
};

const statusTone: Record<PurchaseStatus, string> = {
  paid: "bg-success/15 text-success border-success/30",
  partial: "bg-warning/15 text-warning border-warning/30",
  unpaid: "bg-destructive/15 text-destructive border-destructive/30",
};

function PurchasesPage() {
  const { t, fmt, lang, dir } = useApp();
  const [entries, setEntries] = useOrgStorage<PurchaseEntry>("pharmledger.purchases.v1", []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PurchaseStatus | "all">("all");
  const [method, setMethod] = useState<PaymentMethod | "all">("all");
  const [groupBy, setGroupBy] = useState<"none" | "supplier">("none");
  const [periodBy, setPeriodBy] = useState<"none" | "day" | "month" | "quarter">("none");
  const [specificDate, setSpecificDate] = useState<string>("");
  const [openSuppliers, setOpenSuppliers] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseEntry | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("pharmledger.open.newPurchase") === "1") {
        sessionStorage.removeItem("pharmledger.open.newPurchase");
        setOpen(true);
      }
      const editId = sessionStorage.getItem("pharmledger.open.editPurchase");
      if (editId) {
        const target = entries.find((e) => e.id === editId);
        if (target) {
          sessionStorage.removeItem("pharmledger.open.editPurchase");
          setEditing(target);
        }
      }
    } catch {}
  }, [entries]);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (method !== "all" && e.method !== method) return false;
      if (specificDate) {
        const d = new Date(e.date);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (iso !== specificDate) return false;
      }
      if (!q) return true;
      return (
        e.id.toLowerCase().includes(q) ||
        e.invoiceNumber.toLowerCase().includes(q) ||
        e.supplier.ar.includes(q) || e.supplier.en.toLowerCase().includes(q) ||
        String(e.total).includes(q)
      );
    });
  }, [entries, query, status, method, specificDate]);

  const sortable = useSortable<PurchaseEntry>(filtered, {
    invoiceNumber: (e) => e.invoiceNumber,
    vendorReference: (e) => e.vendorReference ?? "",
    supplier: (e) => e.supplier.en || e.supplier.ar,
    date: (e) => new Date(e.date),
    dueDate: (e) => new Date(e.dueDate),
    subtotal: (e) => e.subtotal,
    vat: (e) => e.vat,
    total: (e) => e.total,
    paid: (e) => e.paid,
    status: (e) => e.status,
  });
  const sortedRows = sortable.sorted;

  type PeriodGroup = { key: string; label: string; rows: PurchaseEntry[]; sum: number; vatSum: number; paidSum: number; outstanding: number; count: number };
  type SupplierGroup = { key: string; label: string; rows: PurchaseEntry[]; sum: number; vatSum: number; paidSum: number; outstanding: number; count: number; periods: PeriodGroup[] };

  const supplierGroups = useMemo<SupplierGroup[]>(() => {
    if (groupBy !== "supplier") return [];
    const periodKey = (e: PurchaseEntry): { key: string; label: string } | null => {
      if (periodBy === "none") return null;
      const d = new Date(e.date);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (periodBy === "day") {
        const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return { key: iso, label: d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }) };
      }
      if (periodBy === "month") {
        const k = `${y}-${String(m + 1).padStart(2, "0")}`;
        return { key: k, label: new Date(y, m, 1).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { month: "long", year: "numeric" }) };
      }
      const q = Math.floor(m / 3) + 1;
      return { key: `${y}-Q${q}`, label: `Q${q} ${y}` };
    };
    const map = new Map<string, { label: string; rows: PurchaseEntry[] }>();
    for (const e of sortedRows) {
      const k = e.supplier.en || e.supplier.ar || "—";
      const prev = map.get(k) ?? { label: e.supplier[lang] || k, rows: [] };
      prev.rows.push(e);
      map.set(k, prev);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].label.localeCompare(b[1].label))
      .map(([key, v]) => {
        let periods: PeriodGroup[] = [];
        if (periodBy !== "none") {
          const pmap = new Map<string, { label: string; rows: PurchaseEntry[] }>();
          for (const e of v.rows) {
            const pk = periodKey(e);
            if (!pk) continue;
            const prev = pmap.get(pk.key) ?? { label: pk.label, rows: [] };
            prev.rows.push(e);
            pmap.set(pk.key, prev);
          }
          periods = Array.from(pmap.entries())
            .sort((a, b) => (a[0] < b[0] ? 1 : -1))
            .map(([pk, pv]) => ({
              key: pk,
              label: pv.label,
              rows: pv.rows,
              sum: pv.rows.reduce((s, e) => s + e.total, 0),
              vatSum: pv.rows.reduce((s, e) => s + e.vat, 0),
              paidSum: pv.rows.reduce((s, e) => s + e.paid, 0),
              outstanding: pv.rows.reduce((s, e) => s + (e.total - e.paid), 0),
              count: pv.rows.length,
            }));
        }
        return {
          key,
          label: v.label,
          rows: v.rows,
          sum: v.rows.reduce((s, e) => s + e.total, 0),
          vatSum: v.rows.reduce((s, e) => s + e.vat, 0),
          paidSum: v.rows.reduce((s, e) => s + e.paid, 0),
          outstanding: v.rows.reduce((s, e) => s + (e.total - e.paid), 0),
          count: v.rows.length,
          periods,
        };
      });
  }, [sortedRows, groupBy, periodBy, lang]);




  const totals = useMemo(() => {
    const sum = filtered.reduce((s, e) => s + e.total, 0);
    const vatSum = filtered.reduce((s, e) => s + e.vat, 0);
    const outstanding = filtered.reduce((s, e) => s + (e.total - e.paid), 0);
    const items = filtered.reduce((s, e) => s + e.itemsCount, 0);
    const count = filtered.length;
    const avg = count ? Math.round(sum / count) : 0;
    return { sum, vatSum, outstanding, items, count, avg };
  }, [filtered]);

  const buildExport = () => {
    const headers = ["date", "invoiceNumber", "vendorReference", "supplier", "subtotal", "vat", "total", "paid", "status", "method", "dueOption", "dueDate"];
    const rows = filtered.map((e) => {
      const methodLabel = e.method === "transfer" ? "bank" : e.method;
      return {
        date: new Date(e.date).toISOString().slice(0, 10),
        invoiceNumber: e.invoiceNumber,
        vendorReference: e.vendorReference ?? "",
        supplier: e.supplier.en,
        subtotal: e.subtotal,
        vat: e.vat,
        total: e.total,
        paid: e.paid,
        status: e.status,
        method: methodLabel,
        dueOption: e.dueOption ?? "",
        dueDate: new Date(e.dueDate).toISOString().slice(0, 10),
      };
    });
    return { headers, rows };
  };
  const exportXlsx = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsXlsx } = await import("@/lib/data-export");
    await exportRowsAsXlsx({ filename: `pharmledger-purchases-${Date.now()}`, sheetName: "Purchases", headers, rows });
  };
  const exportPdf = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsPdf } = await import("@/lib/data-export");
    await exportRowsAsPdf({ filename: `pharmledger-purchases-${Date.now()}`, title: String(t("purchasesTitle" as never) || "Purchases"), headers, rows, lang });
  };



  const addEntry = (e: Omit<PurchaseEntry, "id">) => {
    const id = `PO-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setEntries((prev) => [{ ...e, id }, ...prev]);
    toast.success(t("addedPurchase"));
    setOpen(false);
  };

  const updateEntry = (id: string, patch: Omit<PurchaseEntry, "id">) => {
    setEntries((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    toast.success(t("updatedPurchase"));
    setEditing(null);
  };

  const deleteEntry = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRow"))) return;
    setEntries((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("deletedRow"));
  };

  const pg = usePagination(sortable.sorted);
  const pgGroups = usePagination(supplierGroups);
  const visibleIds = useMemo(
    () => (groupBy === "none" ? pg.pageItems.map((e) => e.id) : []),
    [pg.pageItems, groupBy],
  );
  const sel = useSelection(visibleIds);
  const deleteSelected = () => {
    if (sel.count === 0) return;
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteSelected"))) return;
    const ids = new Set(sel.ids);
    const removed = entries.filter((x) => ids.has(x.id));
    setEntries((prev) => prev.filter((x) => !ids.has(x.id)));
    sel.clear();
    toast.success(t("deletedSelected"), {
      action: {
        label: t("undo"),
        onClick: () => {
          setEntries((prev) => [...removed, ...prev.filter((x) => !ids.has(x.id))]);
          toast.success(t("restoredSelected"));
        },
      },
    });
  };

  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        date: "2025-01-15",
        invoiceNumber: "SINV-12345",
        vendorReference: "REF-001",
        supplier: "Supplier Name",
        subtotal: 1000,
        vat: 150,
        total: 1150,
        paid: 1150,
        status: "paid",
        method: "cash",
        dueOption: "30",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, "purchases-template.xlsx");
  };

  const handleImportFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const pick = (r: Record<string, unknown>, keys: string[]) => {
        const lower: Record<string, unknown> = {};
        for (const k of Object.keys(r)) lower[k.toLowerCase().trim()] = r[k];
        for (const k of keys) {
          const v = lower[k.toLowerCase()];
          if (v !== undefined && v !== "") return v;
        }
        return "";
      };
      const toNum = (v: unknown) => {
        if (typeof v === "number") return v;
        const n = parseFloat(String(v).replace(/[^\d.-]/g, ""));
        return isNaN(n) ? 0 : n;
      };
      const toIso = (v: unknown) => {
        // Excel serial number (days since 1899-12-30) — parse without TZ
        if (typeof v === "number" && isFinite(v) && v > 0 && v < 80000) {
          const d = XLSX.SSF.parse_date_code(v);
          if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString();
        }
        if (v instanceof Date && !isNaN(v.getTime())) {
          return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate())).toISOString();
        }
        const s = String(v).trim();
        if (!s) return new Date().toISOString();
        // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
        if (dmy) {
          let [, d, m, y] = dmy;
          let yr = parseInt(y, 10);
          if (yr < 100) yr += 2000;
          const dn = parseInt(d, 10);
          const mn = parseInt(m, 10);
          if (mn >= 1 && mn <= 12 && dn >= 1 && dn <= 31) {
            const dt = new Date(Date.UTC(yr, mn - 1, dn));
            if (dt.getUTCDate() === dn && dt.getUTCMonth() === mn - 1) return dt.toISOString();
          }
        }
        // ISO YYYY-MM-DD
        const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (iso) {
          const dt = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
          if (!isNaN(dt.getTime())) return dt.toISOString();
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? new Date().toISOString() : new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
      };
      const mapStatus = (v: unknown): PurchaseStatus => {
        const s = String(v).toLowerCase().trim();
        if (["paid", "مدفوع", "مدفوعة"].includes(s)) return "paid";
        if (["partial", "partially paid", "جزئي", "جزئية"].includes(s)) return "partial";
        return "unpaid";
      };
      const mapMethod = (v: unknown): PaymentMethod => {
        const s = String(v).toLowerCase().trim();
        if (["bank", "transfer", "بنك", "تحويل"].includes(s)) return "transfer";
        return "cash";
      };
      const mapDueOption = (v: unknown): import("@/lib/mock-data").DueOption => {
        const s = String(v).toLowerCase().trim();
        if (["overdue", "over due", "متأخر"].includes(s)) return "overdue";
        const n = parseInt(s, 10);
        if ([0, 30, 60, 90, 120, 150].includes(n)) return String(n) as import("@/lib/mock-data").DueOption;
        return "30";
      };

      // Continue sequential numbering from existing entries
      const extractSeq = (s: string, prefix: string) => {
        const m = new RegExp(`^${prefix}-(\\d+)$`).exec(s || "");
        return m ? parseInt(m[1], 10) : 0;
      };
      let maxInvSeq = entries.reduce((m, e) => Math.max(m, extractSeq(e.invoiceNumber, "SINV")), 0);
      let maxPoSeq = entries.reduce((m, e) => Math.max(m, extractSeq(e.id, "PO")), 0);

      const parsed: PurchaseEntry[] = rows
        .map((r) => {
          const supplier = String(pick(r, ["supplier", "المورد", "اسم المورد"]) || "—");
          const subtotal = toNum(pick(r, ["subtotal", "بدون الضريبة", "بدون ضريبة", "صافي"]));
          const vat = toNum(pick(r, ["vat", "tax", "الضريبة", "ضريبة"]));
          const total = toNum(pick(r, ["total", "الإجمالي", "اجمالي", "grandtotal"]));
          const paid = toNum(pick(r, ["paid", "المدفوع", "المبلغ المدفوع"]));
          const status = mapStatus(pick(r, ["status", "paid status", "paidstatus", "الحالة"]) || (paid >= total && total > 0 ? "paid" : paid > 0 ? "partial" : "unpaid"));
          const method = mapMethod(pick(r, ["method", "طريقة الدفع", "payment"]));
          const date = toIso(pick(r, ["date", "التاريخ", "تاريخ"]));
          const dueOption = mapDueOption(pick(r, ["dueOption", "due", "due date", "duedate", "تاريخ الاستحقاق", "الاستحقاق"]));
          const dueDate = computeDueDate(date, dueOption);
          const providedInv = String(pick(r, ["invoiceNumber", "invoice", "invoice no", "invoice no.", "رقم الفاتورة"]) || "").trim();
          const vendorReference = String(pick(r, ["vendorReference", "vendor reference", "vendor ref", "vendorref", "مرجع المورد"]) || "");
          return {
            _providedInv: providedInv,
            date,
            dueDate,
            dueOption,
            supplier: { ar: supplier, en: supplier },
            vendorReference: vendorReference || undefined,
            itemsCount: 1,
            subtotal,
            vat,
            total: total || subtotal + vat,
            paid,
            status,
            method,
          };
        })
        // Include return invoices (negative amounts) as well
        .filter((e) => e.subtotal !== 0 || e.total !== 0)
        // Sort by date ascending so sequential numbers follow chronological order
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((e) => {
          const { _providedInv: _ignored, ...rest } = e;
          maxPoSeq += 1;
          const invoiceNumber = `SINV-${String(++maxInvSeq).padStart(5, "0")}`;
          return {
            id: `PO-${String(maxPoSeq).padStart(5, "0")}`,
            invoiceNumber,
            ...rest,
          } satisfies PurchaseEntry;
        });

      if (!parsed.length) {
        toast.error(t("importFailed"));
      } else {
        // Newest dates appear first in the list; numbering remains chronological
        setEntries((prev) => [...parsed.slice().reverse(), ...prev]);
        toast.success(`${parsed.length} ✓`);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("importFailed"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
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
                <span className="text-gradient">{t("purchasesTitle")}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("purchasesSubtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-info/15 text-info border border-info/30 hover:bg-info/25 transition">
                <Upload className="size-4" />{t("importExcel")}
              </button>
              <button onClick={downloadTemplate} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <FileSpreadsheet className="size-4" />{t("downloadTemplate")}
              </button>
              <button onClick={exportXlsx} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <Download className="size-4" />{t("exportExcel")}
              </button>
              <button onClick={exportPdf} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <FileText className="size-4" />{t("exportPdf")}
              </button>
              <button onClick={() => setOpen(true)} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition">
                <Plus className="size-4" />{t("newPurchaseInvoice")}
              </button>
            </div>

          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={ShoppingCart} label={t("totalPurchasesValue")} value={fmt(totals.sum)} suffix={t("currency")} accent="primary" />
            <Stat icon={FileText} label={t("invoicesCount")} value={fmt(totals.count)} accent="info" />
            <Stat icon={Package} label={t("itemsPurchased")} value={fmt(totals.items)} accent="secondary" />
            <Stat icon={CalendarClock} label={t("outstanding")} value={fmt(totals.outstanding)} suffix={t("currency")} accent={totals.outstanding > 0 ? "warning" : "success"} />
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in">
            <div className="relative flex-1 min-w-[220px]">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3")} />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPurchases")}
                className={cn(
                  "w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition",
                  dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4",
                )}
              />
            </div>
            <FilterSelect
              label={t("paymentStatus")}
              value={status}
              onChange={(v) => setStatus(v as PurchaseStatus | "all")}
              options={[
                { value: "all", label: t("filterAll") },
                ...STATUSES.map((s) => ({ value: s, label: t(s as never) })),
              ]}
            />
            <FilterSelect
              label={t("paymentMethod")}
              value={method}
              onChange={(v) => setMethod(v as PaymentMethod | "all")}
              options={[
                { value: "all", label: t("filterAll") },
                ...METHODS.map((m) => ({ value: m, label: t(m as never) })),
              ]}
            />
            <FilterSelect
              label={lang === "ar" ? "تجميع" : "Group by"}
              value={groupBy}
              onChange={(v) => setGroupBy(v as typeof groupBy)}
              options={[
                { value: "none", label: lang === "ar" ? "بدون تجميع" : "No grouping" },
                { value: "supplier", label: lang === "ar" ? "اسم المورد" : "Supplier" },
              ]}
            />
            {groupBy === "supplier" && (
              <FilterSelect
                label={lang === "ar" ? "الفترة" : "Period"}
                value={periodBy}
                onChange={(v) => setPeriodBy(v as typeof periodBy)}
                options={[
                  { value: "none", label: lang === "ar" ? "بدون فترة" : "No period" },
                  { value: "day", label: lang === "ar" ? "يومي" : "Day" },
                  { value: "month", label: lang === "ar" ? "شهري" : "Month" },
                  { value: "quarter", label: lang === "ar" ? "ربع سنوي" : "Quarter" },
                ]}
              />
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {lang === "ar" ? "تاريخ" : "Date"}
              </span>
              <DatePickerInput
                value={specificDate}
                onChange={setSpecificDate}
                className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              {specificDate && (
                <button
                  onClick={() => setSpecificDate("")}
                  className="h-9 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  title={lang === "ar" ? "مسح" : "Clear"}
                >
                  ×
                </button>
              )}
            </div>
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
                    <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="invoiceNumber" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("invoiceNumber")}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3 hidden md:table-cell"><SortHeader sortKey="vendorReference" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>Vendor Ref</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="supplier" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("supplier")}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3 hidden md:table-cell"><SortHeader sortKey="date" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("date")}</SortHeader></th>
                    <th className="text-start font-medium py-3 px-3 hidden lg:table-cell"><SortHeader sortKey="dueDate" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("dueDate")}</SortHeader></th>
                    <th className="text-end font-medium py-3 px-3 hidden md:table-cell"><SortHeader sortKey="subtotal" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("subtotal")}</SortHeader></th>
                    <th className="text-end font-medium py-3 px-3 hidden lg:table-cell"><SortHeader sortKey="vat" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("vatAmount")}</SortHeader></th>
                    <th className="text-end font-medium py-3 px-3"><SortHeader sortKey="total" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("grandTotal")}</SortHeader></th>
                    <th className="text-end font-medium py-3 px-3"><SortHeader sortKey="paid" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("paidAmount")}</SortHeader></th>
                    <th className="text-center font-medium py-3 px-3"><SortHeader sortKey="status" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="center">{t("paymentStatus")}</SortHeader></th>
                    <th className="text-end font-medium py-3 px-3">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {groupBy === "none" && pg.pageItems.map((e) => {
                    const MIcon = methodIcon[e.method];
                    const d = new Date(e.date);
                    const due = new Date(e.dueDate);
                    const overdue = e.status !== "paid" && due.getTime() < Date.now();
                    return (
                      <tr key={e.id} className={cn("hover:bg-muted/30 transition", sel.isSelected(e.id) && "bg-primary/5")}>
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            aria-label={t("selectAll")}
                            checked={sel.isSelected(e.id)}
                            onChange={() => sel.toggle(e.id)}
                            className="size-4 rounded border-border accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold tabular text-xs">{e.invoiceNumber}</div>
                          <div className="text-[11px] text-muted-foreground tabular flex items-center gap-1">
                            <MIcon className="size-3" />{e.id}
                          </div>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell tabular text-xs text-muted-foreground">
                          {e.vendorReference || "—"}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
                              <Truck className="size-3.5" />
                            </div>
                            <span className="font-medium text-foreground/90 truncate max-w-[180px]">{e.supplier[lang]}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell tabular text-muted-foreground">
                          {d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short" })}
                        </td>
                        <td className={cn("py-3 px-3 hidden lg:table-cell tabular", overdue ? "text-destructive font-semibold" : "text-muted-foreground")}>
                          {due.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="py-3 px-3 text-end hidden md:table-cell tabular text-muted-foreground">{fmt(e.subtotal)}</td>
                        <td className="py-3 px-3 text-end hidden lg:table-cell tabular text-muted-foreground">{fmt(e.vat)}</td>
                        <td className="py-3 px-3 text-end font-bold tabular">
                          {fmt(e.total)}
                          <span className="text-[10px] text-muted-foreground font-normal ms-1">{t("currency")}</span>
                        </td>
                        <td className="py-3 px-3 text-end tabular text-muted-foreground">
                          {fmt(e.paid)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border", statusTone[e.status])}>
                            {t(e.status as never)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-end">
                          <div className="inline-flex items-center gap-1">
                            <button type="button" onClick={() => setEditing(e)} className="size-8 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center" title={t("edit")} aria-label={t("edit")}>
                              <Pencil className="size-3.5" />
                            </button>
                            <button type="button" onClick={() => deleteEntry(e.id)} className="size-8 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center" title={t("delete")} aria-label={t("delete")}>
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {groupBy === "supplier" && pgGroups.pageItems.map((g) => {
                    const expanded = openSuppliers[g.key] ?? false;
                    return (
                      <Fragment key={g.key}>
                        <tr
                          onClick={() => setOpenSuppliers((s) => ({ ...s, [g.key]: !expanded }))}
                          className="hover:bg-muted/40 transition cursor-pointer bg-muted/20"
                        >
                          <td className="py-3 px-3 text-center text-muted-foreground">{expanded ? "−" : "+"}</td>
                          <td className="py-3 px-3 font-semibold text-foreground/90" colSpan={3}>
                            <span className="inline-flex items-center gap-2">
                              <Truck className="size-3.5 text-primary" />
                              {g.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground tabular hidden md:table-cell">
                            {fmt(g.count)} {lang === "ar" ? "فاتورة" : "invoices"}
                          </td>
                          <td className="py-3 px-3 hidden lg:table-cell" />
                          <td className="py-3 px-3 text-end hidden md:table-cell tabular text-muted-foreground">—</td>
                          <td className="py-3 px-3 text-end hidden lg:table-cell tabular text-muted-foreground">{fmt(g.vatSum)}</td>
                          <td className="py-3 px-3 text-end font-bold tabular">
                            {fmt(g.sum)}
                            <span className="text-[10px] text-muted-foreground font-normal ms-1">{t("currency")}</span>
                          </td>
                          <td className="py-3 px-3 text-end tabular text-muted-foreground">{fmt(g.paidSum)}</td>
                          <td className="py-3 px-3 text-center text-xs text-warning tabular">{fmt(g.outstanding)}</td>
                          <td />
                        </tr>
                        {expanded && periodBy !== "none" && g.periods.map((p) => (
                          <tr key={`${g.key}::${p.key}`} className="bg-background/40">
                            <td />
                            <td className="py-2 px-3 text-xs text-muted-foreground" colSpan={3}>
                              <span className="ps-6">{p.label}</span>
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground tabular hidden md:table-cell">
                              {fmt(p.count)} {lang === "ar" ? "فاتورة" : "invoices"}
                            </td>
                            <td className="py-2 px-3 hidden lg:table-cell" />
                            <td className="py-2 px-3 text-end hidden md:table-cell tabular text-muted-foreground">—</td>
                            <td className="py-2 px-3 text-end hidden lg:table-cell tabular text-muted-foreground">{fmt(p.vatSum)}</td>
                            <td className="py-2 px-3 text-end font-semibold tabular">
                              {fmt(p.sum)}
                              <span className="text-[10px] text-muted-foreground font-normal ms-1">{t("currency")}</span>
                            </td>
                            <td className="py-2 px-3 text-end tabular text-muted-foreground text-xs">{fmt(p.paidSum)}</td>
                            <td className="py-2 px-3 text-center text-xs text-warning tabular">{fmt(p.outstanding)}</td>
                            <td />
                          </tr>
                        ))}
                        {expanded && periodBy === "none" && g.rows.map((e) => {
                          const d = new Date(e.date);
                          return (
                            <tr key={`${g.key}::${e.id}`} className="bg-background/40 hover:bg-muted/30 transition">
                              <td />
                              <td className="py-2 px-3 text-xs ps-6 font-medium tabular">{e.invoiceNumber}</td>
                              <td className="py-2 px-3 text-xs text-muted-foreground hidden md:table-cell tabular">{e.vendorReference || "—"}</td>
                              <td className="py-2 px-3 text-xs text-muted-foreground">{e.id}</td>
                              <td className="py-2 px-3 hidden md:table-cell tabular text-muted-foreground text-xs">
                                {d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short" })}
                              </td>
                              <td className="py-2 px-3 hidden lg:table-cell" />
                              <td className="py-2 px-3 text-end hidden md:table-cell tabular text-muted-foreground text-xs">{fmt(e.subtotal)}</td>
                              <td className="py-2 px-3 text-end hidden lg:table-cell tabular text-muted-foreground text-xs">{fmt(e.vat)}</td>
                              <td className="py-2 px-3 text-end font-semibold tabular text-xs">
                                {fmt(e.total)}
                                <span className="text-[10px] text-muted-foreground font-normal ms-1">{t("currency")}</span>
                              </td>
                              <td className="py-2 px-3 text-end tabular text-muted-foreground text-xs">{fmt(e.paid)}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border", statusTone[e.status])}>
                                  {t(e.status as never)}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-end">
                                <div className="inline-flex items-center gap-1">
                                  <button type="button" onClick={(ev) => { ev.stopPropagation(); setEditing(e); }} className="size-7 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center" title={t("edit")} aria-label={t("edit")}>
                                    <Pencil className="size-3" />
                                  </button>
                                  <button type="button" onClick={(ev) => { ev.stopPropagation(); deleteEntry(e.id); }} className="size-7 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center" title={t("delete")} aria-label={t("delete")}>
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={12} className="py-12 text-center text-sm text-muted-foreground">{t("noResults")}</td></tr>
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-border">
                      <td colSpan={6} className="py-3 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        {t("totalSelected")} · {fmt(totals.count)}
                      </td>
                      <td className="py-3 px-3 text-end tabular text-muted-foreground text-xs">{fmt(totals.vatSum)}</td>
                      <td className="py-3 px-3 text-end font-bold tabular text-base text-primary">
                        {fmt(totals.sum)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
                      </td>
                      <td className="py-3 px-3 text-end tabular text-muted-foreground text-xs">{fmt(totals.sum - totals.outstanding)}</td>
                      <td />
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
              {groupBy === "none" ? (
                <PaginationBar page={pg.page} totalPages={pg.totalPages} total={pg.total} from={pg.from} to={pg.to} onPageChange={pg.setPage} showAll={pg.showAll} onToggleShowAll={pg.toggleShowAll} />
              ) : (
                <PaginationBar page={pgGroups.page} totalPages={pgGroups.totalPages} total={pgGroups.total} from={pgGroups.from} to={pgGroups.to} onPageChange={pgGroups.setPage} showAll={pgGroups.showAll} onToggleShowAll={pgGroups.toggleShowAll} />
              )}
            </div>
          </div>
        </main>
      </div>

      {open && <AddPurchaseDialog onClose={() => setOpen(false)} onSubmit={addEntry} />}
      {editing && (
        <AddPurchaseDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(patch) => updateEntry(editing.id, patch)}
        />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix, accent = "primary" }: {
  icon: typeof ShoppingCart;
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

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 min-w-[10rem] bg-muted/50 border-border text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterChips({ label, value, options, onChange, t }: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; t: (k: never) => string;
}) {
  const all = ["all", ...options];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {all.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            className={cn("h-8 px-3 rounded-lg text-xs font-semibold transition border",
              value === o
                ? "gradient-primary text-primary-foreground border-transparent"
                : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted",
            )}>
            {o === "all" ? t("filterAll" as never) : t(o as never)}
          </button>
        ))}
      </div>
    </div>
  );
}

const DUE_OPTIONS: { value: import("@/lib/mock-data").DueOption; label: string; days: number | "overdue" }[] = [
  { value: "0", label: "0 days", days: 0 },
  { value: "30", label: "30 days", days: 30 },
  { value: "60", label: "60 days", days: 60 },
  { value: "90", label: "90 days", days: 90 },
  { value: "120", label: "120 days", days: 120 },
  { value: "150", label: "150 days", days: 150 },
  { value: "overdue", label: "Over Due", days: "overdue" },
];

function computeDueDate(baseIso: string, opt: import("@/lib/mock-data").DueOption): string {
  const base = new Date(baseIso);
  const cfg = DUE_OPTIONS.find((d) => d.value === opt) ?? DUE_OPTIONS[1];
  if (cfg.days === "overdue") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString();
  }
  const d = new Date(base);
  d.setDate(d.getDate() + (cfg.days as number));
  return d.toISOString();
}

export function AddPurchaseDialog({ onClose, onSubmit, initial }: {
  onClose: () => void;
  onSubmit: (e: Omit<PurchaseEntry, "id">) => void;
  initial?: PurchaseEntry;
}) {
  const { t, lang } = useApp();
  const [suppliersList] = useOrgStorage<SupplierRecord>("suppliers.records.v1", []);
  const supplierOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: string[] = [];
    for (const s of suppliersList) {
      const name = (s.name?.[lang] || s.name?.en || s.name?.ar || "").trim();
      if (name && !seen.has(name)) { seen.add(name); opts.push(name); }
    }
    return opts.sort((a, b) => a.localeCompare(b, lang === "ar" ? "ar" : "en"));
  }, [suppliersList, lang]);
  const toDateInput = (iso?: string) => {
    const d = iso ? new Date(iso) : new Date();
    return d.toISOString().slice(0, 10);
  };
  const [date, setDate] = useState(toDateInput(initial?.date));
  const [invoiceNumber, setInvoiceNumber] = useState(initial?.invoiceNumber ?? "");
  const [vendorReference, setVendorReference] = useState(initial?.vendorReference ?? "");
  const [supplier, setSupplier] = useState(initial?.supplier[lang] ?? initial?.supplier.en ?? "");
  const [subtotal, setSubtotal] = useState(initial ? String(initial.subtotal) : "");
  const [vatInput, setVatInput] = useState(initial ? String(initial.vat) : "");
  const [totalInput, setTotalInput] = useState(initial ? String(initial.total) : "");
  const [paidAmount, setPaidAmount] = useState(initial ? String(initial.paid) : "");
  const [status, setStatus] = useState<PurchaseStatus>(initial?.status ?? "unpaid");
  const [payMethod, setPayMethod] = useState<"cash" | "bank">(initial?.method === "transfer" ? "bank" : "cash");
  const [dueOption, setDueOption] = useState<import("@/lib/mock-data").DueOption>(initial?.dueOption ?? "30");

  const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
  const sub = Number(subtotal) || 0;
  const vat = Number(vatInput) || 0;
  const total = totalInput !== "" ? Number(totalInput) || 0 : sub + vat;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const rawPaid = Number(paidAmount) || 0;
    const paid =
      status === "paid" ? total : status === "partial" ? (total < 0 ? Math.max(rawPaid, total) : Math.min(rawPaid, total)) : 0;
    if (status === "partial" && paid === 0) return toast.error(t("paidAmount"));
    const method: PaymentMethod = payMethod === "bank" ? "transfer" : "cash";
    const dateIso = new Date(date).toISOString();
    onSubmit({
      date: dateIso,
      dueDate: computeDueDate(dateIso, dueOption),
      dueOption,
      supplier: (() => {
        const rec = suppliersList.find((s) => (s.name?.ar === supplier || s.name?.en === supplier));
        if (rec) return { ar: rec.name.ar || supplier, en: rec.name.en || supplier };
        return { ar: supplier || "—", en: supplier || "—" };
      })(),
      invoiceNumber: invoiceNumber || `SINV-${Math.floor(Math.random() * 90000) + 10000}`,
      vendorReference: vendorReference || undefined,
      itemsCount: initial?.itemsCount ?? 1,
      subtotal: round2(sub), vat: round2(vat), total: round2(total),
      paid: round2(paid),
      status, method,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-2xl p-6 space-y-5 my-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("newPurchaseInvoice")}</h2>
            <p className="text-xs text-muted-foreground">{t("purchasesSubtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("date")}>
            <DatePickerInput value={date} onChange={setDate} required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("invoiceNumber")}>
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="SINV-xxxxx" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label="Vendor reference">
            <input value={vendorReference} onChange={(e) => setVendorReference(e.target.value)} placeholder="REF-..." className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("supplier")}>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              required
              className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="" disabled>
                {supplierOptions.length === 0
                  ? (lang === "ar" ? "لا يوجد موردين — أضف من شاشة الموردين" : "No suppliers — add from Suppliers page")
                  : (lang === "ar" ? "اختر مورد" : "Select supplier")}
              </option>
              {supplier && !supplierOptions.includes(supplier) && (
                <option value={supplier}>{supplier}</option>
              )}
              {supplierOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </Field>
          <Field label={`${t("subtotal")} (${t("currency")})`}>
            <input type="number" step="0.01" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("vatAmount")} (${t("currency")})`}>
            <input type="number" step="0.01" value={vatInput} onChange={(e) => setVatInput(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("grandTotal")} (${t("currency")})`}>
            <input type="number" step="0.01" value={totalInput} onChange={(e) => setTotalInput(e.target.value)} placeholder={(sub + vat).toFixed(2)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("paidAmount")} (${t("currency")})`}>
            <input
              type="number"
              step="0.01"
              value={status === "paid" ? (total || "") : status === "unpaid" ? 0 : paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              readOnly={status === "paid" || status === "unpaid"}
             
              className={cn(
                "w-full h-10 rounded-xl border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40",
                status === "paid" || status === "unpaid" ? "bg-muted/60 font-semibold" : "bg-input/40",
              )}
            />
          </Field>
          <Field label={t("paymentStatus")}>
            <select value={status} onChange={(e) => setStatus(e.target.value as PurchaseStatus)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              <option value="paid">{t("paid" as never)}</option>
              <option value="partial">{t("partial" as never)}</option>
              <option value="unpaid">{t("unpaid" as never)}</option>
            </select>
          </Field>
          <Field label={t("paymentMethod")}>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as "cash" | "bank")} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              <option value="cash">{t("cash")}</option>
              <option value="bank">{t("bank")}</option>
            </select>
          </Field>
          <Field label={t("dueDate")}>
            <select value={dueOption} onChange={(e) => setDueOption(e.target.value as import("@/lib/mock-data").DueOption)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              {DUE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        {(sub !== 0 || vat !== 0 || total !== 0) && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5 tabular">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span>{sub.toLocaleString()} {t("currency")}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("vatAmount")}</span><span>{vat.toLocaleString()} {t("currency")}</span></div>
            <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-border/60"><span>{t("grandTotal")}</span><span className="text-primary">{total.toLocaleString()} {t("currency")}</span></div>
            {status !== "unpaid" && (
              <div className="flex justify-between pt-1.5 border-t border-border/60"><span className="text-muted-foreground">{t("outstanding")}</span><span>{(total - (status === "paid" ? total : Number(paidAmount) || 0)).toLocaleString()} {t("currency")}</span></div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">{t("cancel")}</button>
          <button type="submit" className="h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Boxes className="size-4" />{t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

