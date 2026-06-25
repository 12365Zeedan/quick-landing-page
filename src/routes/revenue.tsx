import { createFileRoute } from "@tanstack/react-router";
import { DatePickerInput } from "@/components/date-picker-input";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  Building2,
  Calendar as CalendarIcon,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  TicketPercent,
  TrendingUp,
  Upload,
  Users,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { ShowAllToggle } from "@/components/show-all-toggle";
import { PaginationBar } from "@/components/pagination-bar";
import { useApp } from "@/lib/app-context";
import { useOrg } from "@/lib/org-context";
import { usePagination } from "@/lib/use-pagination";
import { useSelection } from "@/lib/use-selection";
import { useSortable } from "@/lib/use-sortable";
import { SortHeader } from "@/components/sort-header";
import { type RevenueEntry } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GroupMode = "none" | "day" | "week" | "month" | "year";
type PayFilter = "all" | "cash" | "bank" | "wasfaty";



const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};

const groupKeyOf = (iso: string, mode: GroupMode) => {
  const d = new Date(iso);
  if (mode === "day") return iso.slice(0, 10);
  if (mode === "week") return startOfWeek(d).toISOString().slice(0, 10);
  if (mode === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (mode === "year") return String(d.getFullYear());
  return "";
};


export const Route = createFileRoute("/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue — PharmLedger" },
      { name: "description", content: "Track daily pharmacy revenue: customers, cash, bank and discounts with CSV export." },
    ],
  }),
  component: RevenuePage,
});

export const VAT_RATE = 0.15;
/** VAT is entered manually per entry. Returns the stored vat or 0. */
export const vatOf = (e: Pick<RevenueEntry, "vat"> & Partial<Pick<RevenueEntry, "cash" | "bank" | "wasfaty">>) => {
  return Number(e.vat) || 0;
};
const net = (e: Pick<RevenueEntry, "cash" | "bank">) => e.cash + e.bank;
const gross = (e: Pick<RevenueEntry, "cash" | "bank" | "discount">) => e.cash + e.bank + e.discount;

export const nextReference = (entries: RevenueEntry[]) => {
  const max = entries.reduce((m, e) => {
    const n = Number(e.id.replace(/\D/g, "")) || 0;
    return n > m ? n : m;
  }, 0);
  return `RV-${String(max + 1).padStart(5, "0")}`;
};

const STORAGE_PREFIX = "pharmledger.revenue.entries.v2";
const storageKeyFor = (orgId: string | null | undefined) =>
  orgId ? `${STORAGE_PREFIX}.${orgId}` : `${STORAGE_PREFIX}.__none__`;

function loadEntriesFor(orgId: string | null | undefined): RevenueEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKeyFor(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as RevenueEntry[];
  } catch (e) {
    console.warn("Failed to load revenue entries", e);
  }
  return [];
}

function RevenuePage() {
  const { t, fmt, lang, dir } = useApp();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RevenueEntry | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("pharmledger.open.newRevenue") === "1") {
        sessionStorage.removeItem("pharmledger.open.newRevenue");
        setOpen(true);
      }
    } catch {}
  }, []);

  // Load entries whenever the active organization changes
  useEffect(() => {
    setEntries(loadEntriesFor(orgId));
    setHydratedFor(orgId);
  }, [orgId]);

  // Persist on changes (only after hydration completes for this org)
  useEffect(() => {
    if (hydratedFor !== orgId) return;
    try {
      localStorage.setItem(storageKeyFor(orgId), JSON.stringify(entries));
    } catch (e) {
      console.warn("Failed to save revenue entries", e);
    }
  }, [entries, hydratedFor, orgId]);

  // Filters
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [minAmt, setMinAmt] = useState<string>("");
  const [maxAmt, setMaxAmt] = useState<string>("");
  const [payFilter, setPayFilter] = useState<PayFilter>("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("none");

  const resetFilters = () => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setMinAmt("");
    setMaxAmt("");
    setPayFilter("all");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : -Infinity;
    const to = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Infinity;
    const minN = minAmt === "" ? -Infinity : Number(minAmt);
    const maxN = maxAmt === "" ? Infinity : Number(maxAmt);

    return entries.filter((e) => {
      // Search
      if (q) {
        const hay =
          e.id.toLowerCase() +
          " " + e.reference.toLowerCase() +
          " " + e.date.toLowerCase() +
          " " + String(net(e));
        if (!hay.includes(q)) return false;
      }
      // Date range
      const ts = new Date(e.date).getTime();
      if (ts < from || ts > to) return false;
      // Payment filter
      if (payFilter === "cash" && e.cash <= 0) return false;
      if (payFilter === "bank" && e.bank <= 0) return false;
      if (payFilter === "wasfaty" && (e.wasfaty || 0) <= 0) return false;
      // Amount (uses net)
      const n = net(e);
      if (n < minN || n > maxN) return false;
      return true;
    });
  }, [entries, query, dateFrom, dateTo, minAmt, maxAmt, payFilter]);


  const totals = useMemo(() => {
    const cash = filtered.reduce((s, e) => s + e.cash, 0);
    const bank = filtered.reduce((s, e) => s + e.bank, 0);
    const discount = filtered.reduce((s, e) => s + e.discount, 0);
    const wasfaty = filtered.reduce((s, e) => s + (e.wasfaty || 0), 0);
    const customers = filtered.reduce((s, e) => s + e.customers, 0);
    const vat = filtered.reduce((s, e) => s + (e.vat ?? vatOf(e)), 0);
    // Wasfaty is excluded from gross/net revenue totals.
    const netSum = cash + bank;
    const grossSum = netSum + discount;
    const avg = customers ? Math.round(netSum / customers) : 0;
    return { netSum, grossSum, cash, bank, discount, wasfaty, customers, count: filtered.length, avg, vat };
  }, [filtered]);

  const groups = useMemo(() => {
    if (groupMode === "none") return [] as Array<{ key: string; label: string; rows: RevenueEntry[]; cash: number; bank: number; discount: number; wasfaty: number; vat: number; customers: number; gross: number; net: number; }>;
    const map = new Map<string, RevenueEntry[]>();
    for (const e of filtered) {
      const k = groupKeyOf(e.date, groupMode);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    const formatLabel = (k: string) => {
      if (groupMode === "year") return k;
      if (groupMode === "month") {
        const [y, m] = k.split("-").map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { month: "long", year: "numeric" });
      }
      const d = new Date(k);
      if (groupMode === "week") {
        const end = new Date(d); end.setDate(end.getDate() + 6);
        const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
        return `${d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", opts)} — ${end.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", opts)}`;
      }
      return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, rows]) => {
        const cash = rows.reduce((s, e) => s + e.cash, 0);
        const bank = rows.reduce((s, e) => s + e.bank, 0);
        const discount = rows.reduce((s, e) => s + e.discount, 0);
        const wasfaty = rows.reduce((s, e) => s + (e.wasfaty || 0), 0);
        const vat = rows.reduce((s, e) => s + (e.vat ?? vatOf(e)), 0);
        const customers = rows.reduce((s, e) => s + e.customers, 0);
        return {
          key,
          label: formatLabel(key),
          rows,
          cash, bank, discount, wasfaty, vat, customers,
          gross: cash + bank + discount,
          net: cash + bank,
        };
      });
  }, [filtered, groupMode, lang]);


  const buildExport = () => {
    const headers = ["id", "date", "customers", "cash", "bank", "discount", "wasfaty", "vat", "gross", "net", "reference", "notes"];
    const rows = filtered.map((e) => ({
      id: e.id,
      date: e.date.slice(0, 10),
      customers: e.customers,
      cash: e.cash,
      bank: e.bank,
      discount: e.discount,
      wasfaty: e.wasfaty || 0,
      vat: e.vat ?? vatOf(e),
      gross: gross(e),
      net: net(e),
      reference: e.reference,
      notes: (e.notes ?? "").replace(/\n/g, " "),
    }));
    return { headers, rows };
  };
  const exportXlsx = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsXlsx } = await import("@/lib/data-export");
    await exportRowsAsXlsx({ filename: `pharmledger-revenue-${Date.now()}`, sheetName: "Revenue", headers, rows });
  };
  const exportPdf = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsPdf } = await import("@/lib/data-export");
    await exportRowsAsPdf({ filename: `pharmledger-revenue-${Date.now()}`, title: String(t("revenueTitle" as never) || "Revenue"), headers, rows, lang });
  };


  const addEntry = (e: Omit<RevenueEntry, "id" | "reference">) => {
    const id = nextReference(entries);
    const reference = `INV-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setEntries((prev) => [{ ...e, id, reference }, ...prev]);
    toast.success(t("addedRevenue"));
    setOpen(false);
  };

  const updateEntry = (id: string, patch: Omit<RevenueEntry, "id" | "reference">) => {
    setEntries((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    toast.success(t("updatedRevenue"));
    setEditing(null);
  };

  const deleteEntry = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteRevenue"))) return;
    setEntries((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("deletedRevenue"));
  };

  const sortable = useSortable<RevenueEntry>(filtered, {
    reference: (e) => e.reference || e.id,
    date: (e) => new Date(e.date),
    customers: (e) => e.customers,
    cash: (e) => e.cash,
    bank: (e) => e.bank,
    discount: (e) => e.discount,
    gross: (e) => gross(e),
    net: (e) => net(e),
    wasfaty: (e) => e.wasfaty || 0,
    vat: (e) => e.vat ?? vatOf(e),
  });
  const pgRows = usePagination(sortable.sorted);
  const pgGroups = usePagination(groups);
  const visibleIds = useMemo(() => (groupMode === "none" ? pgRows.pageItems.map((e) => e.id) : []), [pgRows.pageItems, groupMode]);
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
      ["date", "customers", "cash", "bank", "discount", "wasfaty", "vat", "notes"],
      ["2026-05-19", 45, 1200, 1800, 50, 600, 0, "Amounts are pre-VAT; enter vat manually"],
      ["2026-05-18", 38, 950, 1400, 0, 0, "", ""],
    ]);
    ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 28 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue");
    XLSX.writeFile(wb, "revenue-template.xlsx");
  };

  const handleImportFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: false });
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
        // Excel serial number — parse via SSF to avoid any TZ conversion
        if (typeof v === "number" && isFinite(v)) {
          const d = XLSX.SSF.parse_date_code(v);
          if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString();
        }
        if (v instanceof Date && !isNaN(v.getTime())) {
          return new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate())).toISOString();
        }
        if (typeof v === "string" && v.trim()) {
          const s = v.trim();
          // DD/MM/YYYY or DD-MM-YYYY
          const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
          if (dmy) {
            let [, dd, mm, yy] = dmy;
            let y = parseInt(yy, 10);
            if (y < 100) y += 2000;
            const m = parseInt(mm, 10);
            const d = parseInt(dd, 10);
            if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
              const dt = new Date(Date.UTC(y, m - 1, d));
              if (dt.getUTCDate() === d && dt.getUTCMonth() === m - 1) return dt.toISOString();
            }
          }
          // ISO YYYY-MM-DD
          const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (iso) {
            return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3])).toISOString();
          }
          const d = new Date(s);
          if (!isNaN(d.getTime())) {
            return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
          }
        }
        return null;
      };

      const parsed: RevenueEntry[] = [];
      let counter = entries.reduce((m, e) => {
        const n = Number(e.id.replace(/\D/g, "")) || 0;
        return n > m ? n : m;
      }, 0);

      for (const row of rows) {
        const iso = toIsoDate(pick(row, ["date", "التاريخ", "تاريخ"]));
        if (!iso) continue;
        const cash = toNum(pick(row, ["cash", "نقدي", "نقد"]));
        const bank = toNum(pick(row, ["bank", "بنك", "تحويل"]));
        const discount = toNum(pick(row, ["discount", "خصم", "خصومات"]));
        const wasfaty = toNum(pick(row, ["wasfaty", "وصفتي", "مبيعات وصفتي"]));
        const customers = toNum(pick(row, ["customers", "عملاء", "عدد العملاء"]));
        if (cash + bank + wasfaty <= 0) continue;
        counter += 1;
        const notesVal = pick(row, ["notes", "ملاحظات", "ملاحظة"]);
        const refVal = pick(row, ["reference", "مرجع", "المرجع"]);
        const vatVal = toNum(pick(row, ["vat", "ضريبة", "ضريبة القيمة المضافة"]));
        parsed.push({
          id: `RV-${String(counter).padStart(5, "0")}`,
          date: iso,
          customers: Math.max(0, Math.round(customers)),
          cash,
          bank,
          discount,
          wasfaty,
          vat: vatVal,
          reference: refVal ? String(refVal) : `INV-${String(Math.floor(Math.random() * 90000) + 10000)}`,
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
                <span className="text-gradient">{t("revenueTitle")}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("revenueSubtitle")}</p>
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
              <button
                onClick={exportXlsx}
                className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition"
              >
                <Download className="size-4" />
                {t("exportExcel")}
              </button>
              <button
                onClick={exportPdf}
                className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition"
              >
                <FileText className="size-4" />
                {t("exportPdf")}
              </button>
              <button
                onClick={() => setOpen(true)}
                className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition"
              >
                <Plus className="size-4" />
                {t("newRevenue")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Stat icon={TrendingUp} label={t("grossRevenue")} value={fmt(totals.grossSum)} suffix={t("currency")} accent="primary" />
            <Stat icon={Receipt} label={t("netRevenue")} value={fmt(totals.netSum)} suffix={t("currency")} accent="success" />
            <Stat icon={Receipt} label={t("vatAmount")} value={fmt(totals.vat)} suffix={t("currency")} accent="warning" />
            <Stat icon={FileSpreadsheet} label={t("wasfatySales")} value={fmt(totals.wasfaty)} suffix={t("currency")} accent="warning" />
            <Stat icon={Users} label={t("customersCount")} value={fmt(totals.customers)} accent="info" />
            <Stat icon={TicketPercent} label={t("totalDiscounts")} value={fmt(totals.discount)} suffix={t("currency")} accent="secondary" />
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-3 animate-fade-in">
            {/* Top row: search + group + reset */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground",
                    dir === "rtl" ? "right-3" : "left-3",
                  )}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchRevenue")}
                  className={cn(
                    "w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition",
                    dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4",
                  )}
                />
              </div>

              <div className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-muted/50 border border-border text-sm">
                <Layers className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t("groupBy")}:</span>
                <Select value={groupMode} onValueChange={(v) => setGroupMode(v as GroupMode)}>
                  <SelectTrigger className="h-7 min-w-[100px] border-0 bg-transparent shadow-none focus:ring-0 px-0 text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("groupNone")}</SelectItem>
                    <SelectItem value="day">{t("groupDay")}</SelectItem>
                    <SelectItem value="week">{t("groupWeek")}</SelectItem>
                    <SelectItem value="month">{t("groupMonth")}</SelectItem>
                    <SelectItem value="year">{t("groupYear")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={resetFilters}
                className="h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition"
                title={t("resetFilters")}
              >
                <RotateCcw className="size-4" />
                <span className="hidden sm:inline">{t("resetFilters")}</span>
              </button>
            </div>

            {/* Filter inputs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">{t("dateFrom")}</span>
                <div className="relative">
                  <CalendarIcon className={cn("absolute top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground", dir === "rtl" ? "right-2" : "left-2")} />
                  <DatePickerInput
                    value={dateFrom}
                    onChange={setDateFrom}
                    className={cn("w-full h-9 rounded-lg bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", dir === "rtl" ? "pr-7 pl-2" : "pl-7 pr-2")}
                  />
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">{t("dateTo")}</span>
                <div className="relative">
                  <CalendarIcon className={cn("absolute top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground", dir === "rtl" ? "right-2" : "left-2")} />
                  <DatePickerInput
                    value={dateTo}
                    onChange={setDateTo}
                    className={cn("w-full h-9 rounded-lg bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", dir === "rtl" ? "pr-7 pl-2" : "pl-7 pr-2")}
                  />
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">{t("amountMin")}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={minAmt}
                  onChange={(e) => setMinAmt(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 rounded-lg bg-muted/40 border border-border text-sm px-2 focus:outline-none focus:ring-2 focus:ring-ring/40 tabular"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">{t("amountMax")}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={maxAmt}
                  onChange={(e) => setMaxAmt(e.target.value)}
                  placeholder="∞"
                  className="w-full h-9 rounded-lg bg-muted/40 border border-border text-sm px-2 focus:outline-none focus:ring-2 focus:ring-ring/40 tabular"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground">{t("paymentMethod")}</span>
                <Select value={payFilter} onValueChange={(v) => setPayFilter(v as PayFilter)}>
                  <SelectTrigger className="h-9 w-full bg-muted/40 border-border text-sm focus:ring-2 focus:ring-ring/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("paymentAny")}</SelectItem>
                    <SelectItem value="cash">{t("cashOnly")}</SelectItem>
                    <SelectItem value="bank">{t("bankOnly")}</SelectItem>
                    <SelectItem value="wasfaty">{t("wasfatyOnly")}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            </div>

          <div className="glass-card rounded-2xl p-2 sm:p-4 animate-fade-in space-y-3">
            <ShowAllToggle showAll={pgRows.showAll} total={pgRows.total} onToggle={pgRows.toggleShowAll} />
            {groupMode === "none" && (
              <BulkActionsBar
                count={sel.count}
                total={filtered.length}
                allSelected={sel.allSelected}
                onSelectAll={sel.toggleAll}
                onClear={sel.clear}
                onDelete={deleteSelected}
              />
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                    {groupMode === "none" && (
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
                    )}
                    {groupMode === "none" ? (
                      <>
                        <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="reference" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("reference")}</SortHeader></th>
                        <th className="text-start font-medium py-3 px-3"><SortHeader sortKey="date" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("dateLabel")}</SortHeader></th>
                      </>
                    ) : (
                      <>
                        <th className="text-start font-medium py-3 px-3">{t("groupBy")}</th>
                        <th className="text-end font-medium py-3 px-3">{t("entriesCount")}</th>
                      </>
                    )}
                    <th className="text-end font-medium py-3 px-3">{groupMode === "none" ? <SortHeader sortKey="customers" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("customers")}</SortHeader> : t("customers")}</th>
                    <th className="text-end font-medium py-3 px-3">{groupMode === "none" ? <SortHeader sortKey="cash" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("cash")}</SortHeader> : t("cash")}</th>
                    <th className="text-end font-medium py-3 px-3">{groupMode === "none" ? <SortHeader sortKey="bank" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("bank")}</SortHeader> : t("bank")}</th>
                    <th className="text-end font-medium py-3 px-3">{groupMode === "none" ? <SortHeader sortKey="discount" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("discount")}</SortHeader> : t("discount")}</th>
                    <th className="text-end font-medium py-3 px-3">{groupMode === "none" ? <SortHeader sortKey="gross" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("grossRevenue")}</SortHeader> : t("grossRevenue")}</th>
                    <th className="text-end font-medium py-3 px-3">{groupMode === "none" ? <SortHeader sortKey="net" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("netRevenue")}</SortHeader> : t("netRevenue")}</th>
                    <th className="text-end font-medium py-3 px-3">{groupMode === "none" ? <SortHeader sortKey="wasfaty" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("wasfatySales")}</SortHeader> : t("wasfatySales")}</th>
                    <th className="text-end font-medium py-3 px-3">{groupMode === "none" ? <SortHeader sortKey="vat" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="end">{t("vatAmount")}</SortHeader> : t("vatAmount")}</th>
                    {groupMode === "none" && (
                      <th className="text-end font-medium py-3 px-3">{t("actions")}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {groupMode === "none" && pgRows.pageItems.map((e) => {
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
                          {d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3 text-end tabular">{fmt(e.customers)}</td>
                        <td className="py-3 px-3 text-end tabular text-success">{fmt(e.cash)}</td>
                        <td className="py-3 px-3 text-end tabular text-info">{fmt(e.bank)}</td>
                        <td className="py-3 px-3 text-end tabular text-destructive">
                          {e.discount ? fmt(e.discount) : fmt(0)}
                        </td>
                        <td className="py-3 px-3 text-end tabular font-semibold">{fmt(gross(e))}</td>
                        <td className="py-3 px-3 text-end font-bold tabular">
                          {fmt(net(e))}
                          <span className="text-[10px] text-muted-foreground font-normal ms-1">{t("currency")}</span>
                        </td>
                        <td className="py-3 px-3 text-end tabular text-warning">{fmt(e.wasfaty || 0)}</td>
                        <td className="py-3 px-3 text-end tabular text-muted-foreground">{fmt(e.vat ?? vatOf(e))}</td>
                        <td className="py-3 px-3 text-end">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditing(e)}
                              className="size-8 rounded-lg bg-muted/40 hover:bg-primary/15 hover:text-primary border border-border transition grid place-items-center"
                              title={t("edit")}
                              aria-label={t("edit")}
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEntry(e.id)}
                              className="size-8 rounded-lg bg-muted/40 hover:bg-destructive/15 hover:text-destructive border border-border transition grid place-items-center"
                              title={t("delete")}
                              aria-label={t("delete")}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {groupMode !== "none" && pgGroups.pageItems.map((g) => (
                    <tr key={g.key} className="hover:bg-muted/30 transition">
                      <td className="py-3 px-3 font-semibold">{g.label}</td>
                      <td className="py-3 px-3 text-end tabular text-muted-foreground">{fmt(g.rows.length)}</td>
                      <td className="py-3 px-3 text-end tabular">{fmt(g.customers)}</td>
                      <td className="py-3 px-3 text-end tabular text-success">{fmt(g.cash)}</td>
                      <td className="py-3 px-3 text-end tabular text-info">{fmt(g.bank)}</td>
                      <td className="py-3 px-3 text-end tabular text-destructive">{fmt(g.discount)}</td>
                      <td className="py-3 px-3 text-end tabular font-semibold">{fmt(g.gross)}</td>
                      <td className="py-3 px-3 text-end font-bold tabular">
                        {fmt(g.net)}
                        <span className="text-[10px] text-muted-foreground font-normal ms-1">{t("currency")}</span>
                      </td>
                      <td className="py-3 px-3 text-end tabular text-warning">{fmt(g.wasfaty)}</td>
                      <td className="py-3 px-3 text-end tabular text-muted-foreground">{fmt(g.vat)}</td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={groupMode === "none" ? 12 : 10} className="py-12 text-center text-sm text-muted-foreground">
                        {t("noResults")}
                      </td>
                    </tr>
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-border">
                      <td colSpan={groupMode === "none" ? 3 : 2} className="py-3 px-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        {t("totalSelected")} · {fmt(groupMode === "none" ? totals.count : groups.length)}
                      </td>
                      <td className="py-3 px-3 text-end tabular font-semibold">{fmt(totals.customers)}</td>
                      <td className="py-3 px-3 text-end tabular font-semibold text-success">{fmt(totals.cash)}</td>
                      <td className="py-3 px-3 text-end tabular font-semibold text-info">{fmt(totals.bank)}</td>
                      <td className="py-3 px-3 text-end tabular font-semibold text-destructive">
                        {fmt(totals.discount)}
                      </td>
                      <td className="py-3 px-3 text-end tabular font-bold">{fmt(totals.grossSum)}</td>
                      <td className="py-3 px-3 text-end font-bold tabular text-base text-gradient">
                        {fmt(totals.netSum)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
                      </td>
                      <td className="py-3 px-3 text-end tabular font-bold text-warning">{fmt(totals.wasfaty)}</td>
                      <td className="py-3 px-3 text-end tabular font-bold text-muted-foreground">{fmt(totals.vat)}</td>
                      {groupMode === "none" && <td className="py-3 px-3" />}
                    </tr>
                  </tfoot>
                )}
              </table>
              {groupMode === "none" ? (
                <PaginationBar page={pgRows.page} totalPages={pgRows.totalPages} total={pgRows.total} from={pgRows.from} to={pgRows.to} onPageChange={pgRows.setPage} showAll={pgRows.showAll} onToggleShowAll={pgRows.toggleShowAll} />
              ) : (
                <PaginationBar page={pgGroups.page} totalPages={pgGroups.totalPages} total={pgGroups.total} from={pgGroups.from} to={pgGroups.to} onPageChange={pgGroups.setPage} showAll={pgGroups.showAll} onToggleShowAll={pgGroups.toggleShowAll} />
              )}
            </div>
          </div>

        </main>
      </div>

      {open && (
        <RevenueDialog
          mode="create"
          onClose={() => setOpen(false)}
          onSubmit={addEntry}
          nextId={nextReference(entries)}
        />
      )}
      {editing && (
        <RevenueDialog
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(patch) => updateEntry(editing.id, patch)}
          nextId={editing.id}
        />
      )}
    </div>
  );
}

function Stat({
  icon: Icon, label, value, suffix, accent = "primary",
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  suffix?: string;
  accent?: "primary" | "secondary" | "success" | "info" | "warning";
}) {
  const tone: Record<string, string> = {
    primary: "from-primary/20 to-primary/0 text-primary",
    secondary: "from-secondary/20 to-secondary/0 text-secondary",
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    warning: "from-warning/20 to-warning/0 text-warning",
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

export function RevenueDialog({
  mode = "create", initial, onClose, onSubmit, nextId,
}: {
  mode?: "create" | "edit";
  initial?: RevenueEntry;
  onClose: () => void;
  onSubmit: (e: Omit<RevenueEntry, "id" | "reference">) => void;
  nextId: string;
}) {
  const { t, fmt } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initial ? initial.date.slice(0, 10) : today);
  const [customers, setCustomers] = useState(initial ? String(initial.customers) : "");
  const [cash, setCash] = useState(initial ? String(initial.cash) : "");
  const [bank, setBank] = useState(initial ? String(initial.bank) : "");
  const [discount, setDiscount] = useState(initial ? String(initial.discount) : "");
  const [wasfaty, setWasfaty] = useState(initial ? String(initial.wasfaty || 0) : "");
  const [vat, setVat] = useState(initial ? String(initial.vat || 0) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
  const cashN = round2(Number(cash) || 0);
  const bankN = round2(Number(bank) || 0);
  const discountN = round2(Number(discount) || 0);
  const wasfatyN = round2(Number(wasfaty) || 0);
  const vatN = round2(Number(vat) || 0);
  // cash + bank + wasfaty are entered VAT-inclusive; subtotal = total − VAT (manual).
  const totalIncVat = cashN + bankN + wasfatyN;
  const subtotalExVat = (totalIncVat - vatN);
  const netTotal = cashN + bankN;
  const grossTotal = cashN + bankN + discountN;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const c = Number(customers);
    if (!c || c <= 0) {
      toast.error(t("customers"));
      return;
    }
    if (cashN + bankN <= 0) {
      toast.error(t("netTotal"));
      return;
    }
    onSubmit({
      date: new Date(date).toISOString(),
      customers: c,
      cash: cashN,
      bank: bankN,
      discount: discountN,
      wasfaty: wasfatyN,
      vat: vatN,
      notes: notes || undefined,
    });
  };


  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{mode === "edit" ? t("editRevenue") : t("newRevenue")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("reference")}: <span className="tabular font-semibold text-foreground">{nextId}</span>
              {mode === "create" && <span className="ms-2 text-muted-foreground">({t("autoGenerated")})</span>}
            </p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("dateLabel")}>
            <DatePickerInput
              value={date}
              onChange={setDate}
              required
              className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </Field>
          <Field label={t("customers")}>
            <div className="relative">
              <Users className="absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground end-3 pointer-events-none" />
              <input
                type="number"
                value={customers}
                onChange={(e) => setCustomers(e.target.value)}
                min={1}
                required
                autoFocus
                className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </Field>

          <Field label={`${t("cash")} (${t("currency")})`}>
            <div className="relative">
              <Banknote className="absolute top-1/2 -translate-y-1/2 size-4 text-success end-3 pointer-events-none" />
              <input
                type="number"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
               
                step="0.01"
                className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </Field>
          <Field label={`${t("bank")} (${t("currency")})`}>
            <div className="relative">
              <Building2 className="absolute top-1/2 -translate-y-1/2 size-4 text-info end-3 pointer-events-none" />
              <input
                type="number"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
               
                step="0.01"
                className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </Field>
          <Field label={`${t("discount")} (${t("currency")})`}>
            <div className="relative">
              <TicketPercent className="absolute top-1/2 -translate-y-1/2 size-4 text-destructive end-3 pointer-events-none" />
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
               
                step="0.01"
                className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </Field>
          <Field label={t("grossRevenue")}>
            <div className="h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm tabular font-semibold flex items-center justify-between">
              <Receipt className="size-4 text-muted-foreground" />
              <span>
                {fmt(grossTotal)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
              </span>
            </div>
          </Field>
          <Field label={t("netRevenue")}>
            <div className="h-10 rounded-xl bg-primary/10 border border-primary/30 px-3 text-sm tabular font-bold flex items-center justify-between">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-gradient">
                {fmt(netTotal)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
              </span>
            </div>
          </Field>
          <Field label={`${t("wasfatySales")} (${t("currency")})`}>
            <div className="relative">
              <FileSpreadsheet className="absolute top-1/2 -translate-y-1/2 size-4 text-warning end-3 pointer-events-none" />
              <input
                type="number"
                value={wasfaty}
                onChange={(e) => setWasfaty(e.target.value)}
               
                step="0.01"
                className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </Field>
          <Field label={`${t("subtotal")} (${t("currency")})`}>
            <div className="h-10 rounded-xl bg-muted/40 border border-border px-3 text-sm tabular font-semibold flex items-center justify-between">
              <Receipt className="size-4 text-muted-foreground" />
              <span>
                {fmt(subtotalExVat)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
              </span>
            </div>
          </Field>
          <Field label={`${t("vatAmount")} (${t("currency")})`}>
            <div className="relative">
              <Receipt className="absolute top-1/2 -translate-y-1/2 size-4 text-warning end-3 pointer-events-none" />
              <input
                type="number"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
               
                step="0.01"
                placeholder="0.00"
                className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </Field>
          <Field label={`${t("totalAmount") || "Total"} (${t("currency")})`}>
            <div className="h-10 rounded-xl bg-primary/10 border border-primary/30 px-3 text-sm tabular font-bold flex items-center justify-between">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-gradient">
                {fmt(totalIncVat)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
              </span>
            </div>
          </Field>
        </div>

        <Field label={t("notes")}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl bg-input/40 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 resize-none"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">
            {t("cancel")}
          </button>
          <button type="submit" className="h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Plus className="size-4" />
            {t("save")}
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
