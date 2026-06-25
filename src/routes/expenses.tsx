import { createFileRoute } from "@tanstack/react-router";
import { DatePickerInput } from "@/components/date-picker-input";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Banknote,
  Building2,
  Calendar as CalendarIcon,
  Download,
  Megaphone,
  Phone,
  Plus,
  Receipt,
  Search,
  Sparkles,
  TrendingDown,
  Wallet,
  X,
  Zap,
  Boxes,
  Users,
  FileText,
  Briefcase,
  Pencil,
  Landmark,
  Pill,
  Milk,
  ShoppingBag,
  Upload,
  FileSpreadsheet,
  Trash2,
  HandCoins,
  Coins,
  TrendingDown as TrendingDownIcon,

} from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { ShowAllToggle } from "@/components/show-all-toggle";
import { AccountPicker } from "@/components/account-picker";
import { PaginationBar } from "@/components/pagination-bar";
import { usePagination } from "@/lib/use-pagination";
import { useApp } from "@/lib/app-context";
import { useOrgStorage } from "@/lib/use-org-storage";
import { useSelection } from "@/lib/use-selection";
import { useSortable } from "@/lib/use-sortable";
import { SortHeader } from "@/components/sort-header";
import {
  type ExpenseCategory,
  type ExpenseEntry,
  type ExpensePayMethod,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GroupBy = "none" | "day" | "month" | "quarter" | "year";

function groupKey(d: Date, mode: Exclude<GroupBy, "none">): { key: string; label: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  if (mode === "day") {
    const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { key: k, label: k };
  }
  if (mode === "month") {
    const k = `${y}-${String(m + 1).padStart(2, "0")}`;
    return { key: k, label: k };
  }
  if (mode === "quarter") {
    const q = Math.floor(m / 3) + 1;
    return { key: `${y}-Q${q}`, label: `${y} Q${q}` };
  }
  return { key: `${y}`, label: `${y}` };
}

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — PharmLedger" },
      { name: "description", content: "Track all pharmacy operating expenses with categories, filters and CSV export." },
    ],
  }),
  component: ExpensesPage,
});

const CATEGORIES: ExpenseCategory[] = [
  "annual", "founding", "office", "marketing", "phones",
  "electricity", "bankFees", "rent", "salaries",
  "medsPurchase", "cosmeticsPurchase", "milkPurchase",
  "ownerDrawings", "depreciation", "zakat",
  "misc", "other",
];
const METHODS: ExpensePayMethod[] = ["cash", "bank"];
const VAT_RATE = 0.15;

const catIcon: Record<ExpenseCategory, typeof Boxes> = {
  annual: CalendarIcon,
  founding: Briefcase,
  office: Pencil,
  marketing: Megaphone,
  phones: Phone,
  electricity: Zap,
  bankFees: Landmark,
  rent: Building2,
  salaries: Users,
  medsPurchase: Pill,
  cosmeticsPurchase: Sparkles,
  milkPurchase: Milk,
  ownerDrawings: HandCoins,
  depreciation: TrendingDownIcon,
  zakat: Coins,
  misc: ShoppingBag,
  other: Wallet,
};

const methodIcon: Record<ExpensePayMethod, typeof Wallet> = {
  cash: Banknote, bank: Landmark,
};
const methodTone: Record<ExpensePayMethod, string> = {
  cash: "bg-success/15 text-success border-success/30",
  bank: "bg-info/15 text-info border-info/30",
};

function ExpensesPage() {
  const { t, fmt, lang, dir } = useApp();
  const [entries, setEntries] = useOrgStorage<ExpenseEntry>("pharmledger.expenses.v1", []);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ExpenseCategory | "all">("all");
  const [method, setMethod] = useState<ExpensePayMethod | "all">("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseEntry | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("pharmledger.open.newExpense") === "1") {
        sessionStorage.removeItem("pharmledger.open.newExpense");
        setOpen(true);
      }
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (cat !== "all" && e.category !== cat) return false;
      if (method !== "all" && e.method !== method) return false;
      if (!q) return true;
      return (
        e.id.toLowerCase().includes(q) ||
        e.reference.toLowerCase().includes(q) ||
        e.vendor.ar.includes(q) || e.vendor.en.toLowerCase().includes(q) ||
        String(e.amount).includes(q)
      );
    });
  }, [entries, query, cat, method]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return [] as Array<{ key: string; label: string; count: number; sum: number; vat: number; subtotal: number }>;
    const map = new Map<string, { key: string; label: string; count: number; sum: number; vat: number; subtotal: number }>();
    for (const e of filtered) {
      const { key, label } = groupKey(new Date(e.date), groupBy);
      const prev = map.get(key) ?? { key, label, count: 0, sum: 0, vat: 0, subtotal: 0 };
      prev.count += 1;
      prev.sum += Number(e.amount) || 0;
      prev.vat += Number(e.vat) || 0;
      prev.subtotal += Number(e.subtotal) || 0;
      map.set(key, prev);
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [filtered, groupBy]);


  const totals = useMemo(() => {
    const sum = filtered.reduce((s, e) => s + e.amount, 0);
    const count = filtered.length;
    const avg = count ? Math.round(sum / count) : 0;
    const byCat: Record<string, number> = {};
    filtered.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + e.amount));
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { sum, count, avg, top };
  }, [filtered]);

  const buildExport = () => {
    const headers = ["id", "date", "category", "vendor", "method", "amount", "reference"];
    const rows = filtered.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      vendor: e.vendor.en,
      method: e.method,
      amount: e.amount,
      reference: e.reference,
    }));
    return { headers, rows };
  };
  const exportXlsx = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsXlsx } = await import("@/lib/data-export");
    await exportRowsAsXlsx({ filename: `pharmledger-expenses-${Date.now()}`, sheetName: "Expenses", headers, rows });
  };
  const exportPdf = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsPdf } = await import("@/lib/data-export");
    await exportRowsAsPdf({ filename: `pharmledger-expenses-${Date.now()}`, title: String(t("expensesTitle" as never) || "Expenses"), headers, rows, lang });
  };


  const addEntry = (e: Omit<ExpenseEntry, "id" | "reference">) => {
    const id = `EX-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setEntries((prev) => [{ ...e, id, reference: id }, ...prev]);
    toast.success(t("addedExpense"));
    setOpen(false);
  };

  const updateEntry = (id: string, patch: Omit<ExpenseEntry, "id" | "reference">) => {
    setEntries((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch, reference: x.reference } : x)));
    toast.success(t("updatedExpense"));
    setEditing(null);
  };

  const deleteEntry = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRow"))) return;
    setEntries((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("deletedRow"));
  };

  const sortable = useSortable<ExpenseEntry>(filtered, {
    reference: (e) => e.reference || e.id,
    date: (e) => new Date(e.date),
    category: (e) => e.category,
    vendor: (e) => e.vendor?.en || e.vendor?.ar || "",
    method: (e) => e.method,
    amount: (e) => e.amount,
  });
  const pg = usePagination(sortable.sorted);
  const visibleIds = useMemo(() => pg.pageItems.map((e) => e.id), [pg.pageItems]);
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

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["date", "category", "method", "vendor", "subtotal", "vat", "total", "receiptNo", "notes"],
      ["2026-05-19", "rent", "bank", "Landlord", 5000, 750, 5750, "R-1001", "Monthly rent"],
      ["2026-05-18", "electricity", "cash", "SEC", 800, 120, 920, "R-1002", ""],
    ]);
    ws["!cols"] = [
      { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 12 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 24 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses-template.xlsx");
  };

  const handleImportFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      const norm = (k: string) => k.toString().trim().toLowerCase();
      const pick = (row: Record<string, unknown>, keys: string[]) => {
        for (const k of Object.keys(row)) {
          if (keys.includes(norm(k))) return row[k];
        }
        return undefined;
      };
      const toNum = (v: unknown) => {
        if (v === null || v === undefined || v === "") return 0;
        const n = Number(String(v).replace(/[,\s]/g, ""));
        return Number.isFinite(n) ? n : 0;
      };
      const toIsoDate = (v: unknown): string | null => {
        if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
        if (typeof v === "number") {
          const d = XLSX.SSF.parse_date_code(v);
          if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString();
        }
        if (typeof v === "string" && v.trim()) {
          const d = new Date(v);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        return null;
      };

      const catAliases: Record<string, ExpenseCategory> = {
        annual: "annual", "مصروفات سنوية": "annual", "سنوية": "annual",
        founding: "founding", "تأسيس": "founding", "مصروفات تأسيس": "founding", "تاسيس": "founding",
        office: "office", "أدوات مكتبية": "office", "مكتبية": "office",
        marketing: "marketing", "تسويق": "marketing",
        phones: "phones", "تليفونات": "phones", "هاتف": "phones",
        electricity: "electricity", "كهرباء": "electricity",
        bankfees: "bankFees", "bank fees": "bankFees", "رسوم بنكية": "bankFees",
        rent: "rent", "إيجار": "rent", "ايجار": "rent",
        salaries: "salaries", "رواتب": "salaries", "رواتب شهرية": "salaries",
        medspurchase: "medsPurchase", "meds": "medsPurchase", "مشتريات أدوية": "medsPurchase", "أدوية": "medsPurchase",
        cosmeticspurchase: "cosmeticsPurchase", "cosmetics": "cosmeticsPurchase", "مشتريات كماليات": "cosmeticsPurchase", "كماليات": "cosmeticsPurchase",
        milkpurchase: "milkPurchase", "milk": "milkPurchase", "مشتريات حليب": "milkPurchase", "حليب": "milkPurchase",
        ownerdrawings: "ownerDrawings", "owner drawings": "ownerDrawings", "drawings": "ownerDrawings", "مسحوبات": "ownerDrawings", "مسحوبات شخصية": "ownerDrawings", "جاري الملاك": "ownerDrawings", "جاري الشركاء": "ownerDrawings",
        depreciation: "depreciation", "إهلاك": "depreciation", "اهلاك": "depreciation", "استهلاك": "depreciation",
        zakat: "zakat", "زكاة": "zakat", "زكاة سنوية": "zakat", "الزكاة": "zakat", "zakah": "zakat",
        misc: "misc", "نثريات": "misc",
        other: "other", "أخرى": "other", "اخرى": "other",
      };
      const mapCat = (v: unknown): ExpenseCategory => {
        const k = String(v ?? "").trim().toLowerCase();
        return catAliases[k] ?? "other";
      };
      const mapMethod = (v: unknown): ExpensePayMethod => {
        const k = String(v ?? "").trim().toLowerCase();
        if (["bank", "بنك", "تحويل"].includes(k)) return "bank";
        return "cash";
      };

      const parsed: ExpenseEntry[] = [];
      let counter = entries.reduce((m, e) => {
        const n = Number(e.id.replace(/\D/g, "")) || 0;
        return n > m ? n : m;
      }, 10000);

      for (const row of rows) {
        const iso = toIsoDate(pick(row, ["date", "التاريخ", "تاريخ", "تاريخ المصروف"]));
        if (!iso) continue;
        const subtotal = toNum(pick(row, ["subtotal", "amount", "المبلغ بدون ضريبة", "بدون ضريبة", "المبلغ"]));
        const vat = toNum(pick(row, ["vat", "tax", "ضريبة", "الضريبة", "ضريبة القيمة المضافة"]));
        const totalIn = toNum(pick(row, ["total", "الإجمالي", "اجمالي", "المبلغ الإجمالي"]));
        const sub = subtotal;
        const v = vat;
        const amount = totalIn > 0 ? totalIn : sub + v;
        if (amount <= 0) continue;

        const vendorVal = String(pick(row, ["vendor", "المورد", "مورد", "اسم المورد"]) ?? "—");
        const receiptVal = pick(row, ["receiptno", "receipt", "رقم الإيصال", "ايصال", "إيصال"]);
        const notesVal = pick(row, ["notes", "ملاحظات", "ملاحظة"]);

        counter += 1;
        const id = `EX-${counter}`;
        parsed.push({
          id,
          date: iso,
          category: mapCat(pick(row, ["category", "التصنيف", "تصنيف", "النوع"])),
          method: mapMethod(pick(row, ["method", "payment", "طريقة الدفع", "الدفع"])),
          vendor: { ar: vendorVal, en: vendorVal },
          subtotal: sub,
          vat: v,
          amount,
          reference: id,
          receiptNo: receiptVal ? String(receiptVal) : undefined,
          notes: notesVal ? String(notesVal) : undefined,
        });
      }

      if (parsed.length === 0) {
        toast.error(t("importNoRows"));
        return;
      }
      setEntries((prev) => [...parsed, ...prev]);
      toast.success(t("importedRevenue").replace("{n}", String(parsed.length)));
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
                <span className="text-gradient">{t("expensesTitle")}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("expensesSubtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f);
                }}
              />
              <button
                onClick={downloadTemplate}
                className="h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition"
                title={t("downloadTemplate")}
              >
                <FileSpreadsheet className="size-4" />
                <span className="hidden sm:inline">{t("downloadTemplate")}</span>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-info/10 text-info border border-info/30 hover:bg-info/20 transition"
              >
                <Upload className="size-4" />
                {t("importExcel")}
              </button>
              <button onClick={exportXlsx} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <Download className="size-4" />{t("exportExcel")}
              </button>
              <button onClick={exportPdf} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <FileText className="size-4" />{t("exportPdf")}
              </button>
              <button onClick={() => setOpen(true)} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition">
                <Plus className="size-4" />{t("newExpense")}
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={TrendingDown} label={t("totalExpenses")} value={fmt(totals.sum)} suffix={t("currency")} accent="warning" />
            <Stat icon={Receipt} label={t("transactionsCount")} value={fmt(totals.count)} accent="info" />
            <Stat icon={Wallet} label={t("avgExpense")} value={fmt(totals.avg)} suffix={t("currency")} accent="secondary" />
            <Stat icon={Boxes} label={t("topCategory")} value={t(totals.top as never) || "—"} accent="destructive" />
          </div>

          {/* Category breakdown bars */}
          <div className="glass-card rounded-2xl p-5 animate-fade-in">
            <h3 className="font-semibold text-base mb-4">{t("category")}</h3>
            <CategoryBars entries={filtered} />
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in">
            <div className="relative flex-1 min-w-[220px]">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3")} />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchExpenses")}
                className={cn(
                  "w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition",
                  dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4",
                )}
              />
            </div>
            <FilterSelect
              label={t("category")}
              value={cat}
              onChange={(v) => setCat(v as ExpenseCategory | "all")}
              options={[
                { value: "all", label: t("filterAll" as never) },
                ...CATEGORIES.map((c) => ({ value: c, label: t(c as never) })),
              ]}
            />
            <FilterSelect
              label={t("paymentMethod")}
              value={method}
              onChange={(v) => setMethod(v as ExpensePayMethod | "all")}
              options={[
                { value: "all", label: t("filterAll" as never) },
                ...METHODS.map((m) => ({ value: m, label: t(m as never) })),
              ]}
            />
            <FilterSelect
              label={lang === "ar" ? "تجميع حسب" : "Group by"}
              value={groupBy}
              onChange={(v) => setGroupBy(v as GroupBy)}
              options={[
                { value: "none", label: lang === "ar" ? "بدون تجميع" : "No grouping" },
                { value: "day", label: lang === "ar" ? "يومي" : "Daily" },
                { value: "month", label: lang === "ar" ? "شهري" : "Monthly" },
                { value: "quarter", label: lang === "ar" ? "ربع سنوي" : "Quarterly" },
                { value: "year", label: lang === "ar" ? "سنوي" : "Yearly" },
              ]}
            />
          </div>

          {/* Table */}
          <div className="glass-card rounded-2xl p-2 sm:p-4 animate-fade-in space-y-3">
            {groupBy === "none" ? (
              <>
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
                        <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="date" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("date")}</SortHeader></th>
                        <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="category" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("category")}</SortHeader></th>
                        <th className="text-start font-medium py-3 px-3 hidden lg:table-cell"><SortHeader sortKey="vendor" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("vendor")}</SortHeader></th>
                        <th className="text-start font-medium py-3 px-3 hidden md:table-cell"><SortHeader sortKey="method" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("paymentMethod")}</SortHeader></th>
                        <th className="text-end font-medium py-3 px-3"><SortHeader sortKey="amount" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("amount")}</SortHeader></th>
                        <th className="text-end font-medium py-3 px-3">{t("actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {pg.pageItems.map((e) => {
                        const Icon = catIcon[e.category];
                        const MIcon = methodIcon[e.method];
                        const d = new Date(e.date);
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
                              <div className="font-semibold tabular text-xs">{e.id}</div>
                              <div className="text-[11px] text-muted-foreground tabular">{e.reference}</div>
                            </td>
                            <td className="py-3 px-3 tabular text-muted-foreground">
                              {d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
                                <Icon className="size-3" />{t(e.category as never)}
                              </span>
                            </td>
                            <td className="py-3 px-3 hidden lg:table-cell text-foreground/90">{e.vendor[lang]}</td>
                            <td className="py-3 px-3 hidden md:table-cell">
                              <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border", methodTone[e.method])}>
                                <MIcon className="size-3" />{t(e.method as never)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-end font-bold tabular text-warning">
                              −{fmt(e.amount)}
                              <span className="text-[10px] text-muted-foreground font-normal ms-1">{t("currency")}</span>
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
                      {filtered.length === 0 && (
                        <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">{t("noResults")}</td></tr>
                      )}
                    </tbody>
                    {filtered.length > 0 && (
                      <tfoot>
                        <tr className="border-t border-border">
                          <td colSpan={6} className="py-3 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                            {t("totalSelected")} · {fmt(totals.count)}
                          </td>
                          <td className="py-3 px-3 text-end font-bold tabular text-base text-warning">
                            −{fmt(totals.sum)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  <PaginationBar page={pg.page} totalPages={pg.totalPages} total={pg.total} from={pg.from} to={pg.to} onPageChange={pg.setPage} showAll={pg.showAll} onToggleShowAll={pg.toggleShowAll} />
                </div>
              </>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                      <th className="text-start font-medium py-3 px-3">{lang === "ar" ? "الفترة" : "Period"}</th>
                      <th className="text-end font-medium py-3 px-3">{t("transactionsCount")}</th>
                      <th className="text-end font-medium py-3 px-3 hidden md:table-cell">{lang === "ar" ? "بدون ضريبة" : "Subtotal"}</th>
                      <th className="text-end font-medium py-3 px-3 hidden md:table-cell">{lang === "ar" ? "الضريبة" : "VAT"}</th>
                      <th className="text-end font-medium py-3 px-3">{t("amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {grouped.map((g) => (
                      <tr key={g.key} className="hover:bg-muted/30 transition">
                        <td className="py-3 px-3 font-semibold tabular">{g.label}</td>
                        <td className="py-3 px-3 text-end tabular">{fmt(g.count)}</td>
                        <td className="py-3 px-3 text-end tabular hidden md:table-cell">{fmt(g.subtotal)}</td>
                        <td className="py-3 px-3 text-end tabular hidden md:table-cell">{fmt(g.vat)}</td>
                        <td className="py-3 px-3 text-end font-bold tabular text-warning">
                          −{fmt(g.sum)}
                          <span className="text-[10px] text-muted-foreground font-normal ms-1">{t("currency")}</span>
                        </td>
                      </tr>
                    ))}
                    {grouped.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">{t("noResults")}</td></tr>
                    )}
                  </tbody>
                  {grouped.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-border">
                        <td className="py-3 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                          {t("totalSelected")} · {fmt(totals.count)}
                        </td>
                        <td className="py-3 px-3" />
                        <td className="py-3 px-3 hidden md:table-cell" />
                        <td className="py-3 px-3 hidden md:table-cell" />
                        <td className="py-3 px-3 text-end font-bold tabular text-base text-warning">
                          −{fmt(totals.sum)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {open && <AddExpenseDialog onClose={() => setOpen(false)} onSubmit={addEntry} />}
      {editing && (
        <AddExpenseDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(patch) => updateEntry(editing.id, patch)}
        />
      )}
    </div>
  );
}

function CategoryBars({ entries }: { entries: ExpenseEntry[] }) {
  const { t, fmt } = useApp();
  const totals = useMemo(() => {
    const m: Record<string, number> = {};
    entries.forEach((e) => (m[e.category] = (m[e.category] || 0) + e.amount));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [entries]);
  if (!totals.length) return <div className="text-sm text-muted-foreground py-6 text-center">{t("noResults")}</div>;
  const max = totals[0][1];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
      {totals.map(([k, v]) => {
        const Icon = catIcon[k as ExpenseCategory] ?? Wallet;
        const pct = (v / max) * 100;
        return (
          <div key={k} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{t(k as never)}</span>
              </div>
              <span className="font-semibold tabular text-xs">{fmt(v)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full gradient-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix, accent = "primary" }: {
  icon: typeof TrendingDown;
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
        <SelectTrigger className="h-9 min-w-[150px] bg-muted/40 border-border text-sm focus:ring-2 focus:ring-ring/40">
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

export function AddExpenseDialog({ onClose, onSubmit, initial }: {
  onClose: () => void;
  onSubmit: (e: Omit<ExpenseEntry, "id" | "reference">) => void;
  initial?: ExpenseEntry;
}) {
  const { t, fmt } = useApp();
  const [date, setDate] = useState(() => (initial ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10)));
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? "annual");
  const [method, setMethod] = useState<ExpensePayMethod>(initial?.method ?? "cash");
  const [subtotalStr, setSubtotalStr] = useState(initial ? String(initial.subtotal) : "");
  const [vatStr, setVatStr] = useState(initial ? String(initial.vat) : "");
  const [vendor, setVendor] = useState(initial?.vendor.en ?? "");
  const [receiptNo, setReceiptNo] = useState(initial?.receiptNo ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [accountCode, setAccountCode] = useState<string | undefined>(initial?.accountCode);

  const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
  const subtotal = Number(subtotalStr) || 0;
  const vat = vatStr === "" ? round2(subtotal * VAT_RATE) : Number(vatStr) || 0;
  const total = subtotal + vat;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (subtotal <= 0) return toast.error("Subtotal must be > 0");
    onSubmit({
      date: new Date(date).toISOString(),
      category, method,
      subtotal: round2(subtotal), vat: round2(vat), amount: round2(total),
      vendor: { ar: vendor || "—", en: vendor || "—" },
      receiptNo: receiptNo || undefined,
      notes: notes || undefined,
      accountCode: accountCode || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("newExpense")}</h2>
            <p className="text-xs text-muted-foreground">{t("expensesSubtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("dateLabel")}>
            <DatePickerInput value={date} onChange={setDate} required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("category")}>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(c as never)}</option>)}
            </select>
          </Field>
          <Field label={t("paymentMethod")}>
            <select value={method} onChange={(e) => setMethod(e.target.value as ExpensePayMethod)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              {METHODS.map((m) => <option key={m} value={m}>{t(m as never)}</option>)}
            </select>
          </Field>
          <Field label={t("vendor")}>
            <input value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("subtotal")} (${t("currency")})`}>
            <input type="number" value={subtotalStr} onChange={(e) => setSubtotalStr(e.target.value)} step="0.01" required autoFocus className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("vatAmount")} (${t("currency")})`}>
            <input type="number" value={vatStr} onChange={(e) => setVatStr(e.target.value)} step="0.01" placeholder={(subtotal * VAT_RATE).toFixed(2)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("receiptNo")}>
            <input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} placeholder="R-00000" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("reference")}>
            <input value={t("autoGenerated")} disabled className="w-full h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm text-muted-foreground" />
          </Field>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("totalAmount")}</span>
          <span className="text-lg font-bold tabular text-warning">
            {fmt(total)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
          </span>
        </div>

        <Field label={t("linkedAccount")}>
          <AccountPicker
            value={accountCode}
            onChange={setAccountCode}
            filterTypes={["expenses", "assets"]}
            placeholder={t("selectAccount")}
          />
        </Field>

        <Field label={t("notes")}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl bg-input/40 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none" />
        </Field>


        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">{t("cancel")}</button>
          <button type="submit" className="h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Plus className="size-4" />{t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
