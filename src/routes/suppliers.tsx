import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Building2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Truck,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { ShowAllToggle } from "@/components/show-all-toggle";
import { PaginationBar } from "@/components/pagination-bar";
import { useApp } from "@/lib/app-context";
import { type SupplierRecord, type PurchaseEntry } from "@/lib/mock-data";
import { useOrgStorage } from "@/lib/use-org-storage";
import { usePagination } from "@/lib/use-pagination";
import { useSelection } from "@/lib/use-selection";
import { useSortable } from "@/lib/use-sortable";
import { SortHeader } from "@/components/sort-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers — PharmLedger" },
      { name: "description", content: "Manage pharmacy suppliers, payables and contact information." },
    ],
  }),
  component: SuppliersPage,
});

type StatusFilter = "all" | "active" | "inactive" | "owed";

function SuppliersPage() {
  const { t, fmt, lang, dir } = useApp();
  const [records, setRecords] = useOrgStorage<SupplierRecord>("suppliers.records.v1", []);
  const [purchases] = useOrgStorage<PurchaseEntry>("pharmledger.purchases.v1", []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SupplierRecord | null>(null);
  const [editSupplier, setEditSupplier] = useState<SupplierRecord | null>(null);

  // Sync supplier aggregates (totalPurchases, balance, invoicesCount, lastPurchase) from purchases
  useEffect(() => {
    if (!records.length) return;
    const norm = (s: string) => s.trim().toLowerCase();
    const agg = new Map<string, { total: number; balance: number; count: number; last: string }>();
    for (const p of purchases) {
      const keys = [norm(p.supplier?.ar ?? ""), norm(p.supplier?.en ?? "")].filter(Boolean);
      const total = Number(p.total) || 0;
      const owed = (total - (Number(p.paid) || 0));
      for (const k of keys) {
        const cur = agg.get(k) ?? { total: 0, balance: 0, count: 0, last: "" };
        cur.total += total;
        cur.balance += owed;
        cur.count += 1;
        if (!cur.last || new Date(p.date) > new Date(cur.last)) cur.last = p.date;
        agg.set(k, cur);
      }
    }
    let changed = false;
    const next = records.map((s) => {
      const a = agg.get(norm(s.name.ar)) ?? agg.get(norm(s.name.en));
      if (!a) {
        if (s.totalPurchases === 0 && s.balance === 0 && s.invoicesCount === 0) return s;
        changed = true;
        return { ...s, totalPurchases: 0, balance: 0, invoicesCount: 0 };
      }
      if (
        s.totalPurchases === a.total &&
        s.balance === a.balance &&
        s.invoicesCount === a.count &&
        s.lastPurchase === a.last
      ) return s;
      changed = true;
      return { ...s, totalPurchases: a.total, balance: a.balance, invoicesCount: a.count, lastPurchase: a.last || s.lastPurchase };
    });
    if (changed) setRecords(next);
  }, [purchases, records, setRecords]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((s) => {
      if (filter === "active" && !s.active) return false;
      if (filter === "inactive" && s.active) return false;
      if (filter === "owed" && s.balance <= 0) return false;
      if (!q) return true;
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.ar.includes(q) || s.name.en.toLowerCase().includes(q) ||
        s.contact.toLowerCase().includes(q) ||
        s.phone.includes(q) || s.email.toLowerCase().includes(q) ||
        s.city.ar.includes(q) || s.city.en.toLowerCase().includes(q) ||
        (s.gln ?? "").toLowerCase().includes(q)
      );
    });
  }, [records, query, filter]);

  const totals = useMemo(() => {
    const count = records.length;
    const active = records.filter((s) => s.active).length;
    const payables = records.reduce((s, r) => s + r.balance, 0);
    const top = [...records].sort((a, b) => b.totalPurchases - a.totalPurchases)[0];
    return { count, active, payables, topName: top?.name[lang] ?? "—" };
  }, [records, lang]);

  const buildExport = () => {
    const headers = ["id","name","contact","phone","email","city","tax","cr","gln","nationalAddress","totalPurchases","balance","invoicesCount","lastPurchase","active"];
    const rows = filtered.map((s) => ({
      id: s.id,
      name: s.name.en,
      contact: s.contact,
      phone: s.phone,
      email: s.email,
      city: s.city.en,
      tax: s.taxNumber,
      cr: s.crNumber,
      gln: s.gln ?? "",
      nationalAddress: s.nationalAddress.en,
      totalPurchases: s.totalPurchases,
      balance: s.balance,
      invoicesCount: s.invoicesCount,
      lastPurchase: s.lastPurchase,
      active: String(s.active),
    }));
    return { headers, rows };
  };
  const exportXlsx = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsXlsx } = await import("@/lib/data-export");
    await exportRowsAsXlsx({ filename: `pharmledger-suppliers-${Date.now()}`, sheetName: "Suppliers", headers, rows });
  };
  const exportPdf = async () => {
    const { headers, rows } = buildExport();
    const { exportRowsAsPdf } = await import("@/lib/data-export");
    await exportRowsAsPdf({ filename: `pharmledger-suppliers-${Date.now()}`, title: String(t("suppliersTitle" as never) || "Suppliers"), headers, rows, lang });
  };


  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        name: "Supplier Name",
        contact: "Contact Person",
        phone: "+966500000000",
        email: "supplier@example.com",
        city: "Riyadh",
        taxNumber: "300000000000003",
        crNumber: "1010000000",
        gln: "1234567890123",
        nationalAddress: "RRRD1234, Riyadh",
        totalPurchases: 0,
        balance: 0,
        invoicesCount: 0,
        lastPurchase: "2025-01-15",
        active: "yes",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
    XLSX.writeFile(wb, "suppliers-template.xlsx");
  };

  const handleImportFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
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
        if (v instanceof Date) return v.toISOString();
        const s = String(v).trim();
        if (!s) return new Date().toISOString();
        const d = new Date(s);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      };
      const toBool = (v: unknown) => {
        const s = String(v).toLowerCase().trim();
        if (["false", "no", "0", "inactive", "غير نشط", "لا"].includes(s)) return false;
        if (["true", "yes", "1", "active", "نشط", "نعم"].includes(s)) return true;
        return true;
      };

      const parsed: SupplierRecord[] = rows
        .map((r) => {
          const name = String(pick(r, ["name", "supplier", "اسم المورد", "المورد"]) || "").trim();
          if (!name) return null;
          const contact = String(pick(r, ["contact", "contact person", "جهة الاتصال", "المسؤول"]) || "");
          const phone = String(pick(r, ["phone", "mobile", "tel", "الهاتف", "الجوال"]) || "");
          const email = String(pick(r, ["email", "البريد", "البريد الإلكتروني"]) || "");
          const city = String(pick(r, ["city", "المدينة"]) || "");
          const taxNumber = String(pick(r, ["taxNumber", "tax", "tax number", "الرقم الضريبي"]) || "");
          const crNumber = String(pick(r, ["crNumber", "cr", "cr number", "السجل التجاري"]) || "");
          const gln = String(pick(r, ["gln", "GLN", "glnNumber", "رقم GLN", "GLN #"]) || "");
          const nationalAddress = String(pick(r, ["nationalAddress", "national address", "address", "العنوان الوطني", "العنوان"]) || "");
          return {
            id: `SUP-${String(Math.floor(Math.random() * 90000) + 10000)}`,
            name: { ar: name, en: name },
            contact,
            phone,
            email,
            city: { ar: city, en: city },
            taxNumber,
            crNumber,
            ...(gln ? { gln } : {}),
            nationalAddress: { ar: nationalAddress, en: nationalAddress },
            totalPurchases: toNum(pick(r, ["totalPurchases", "total purchases", "إجمالي المشتريات"])),
            balance: toNum(pick(r, ["balance", "الرصيد"])),
            lastPurchase: toIso(pick(r, ["lastPurchase", "last purchase", "آخر شراء"])),
            invoicesCount: toNum(pick(r, ["invoicesCount", "invoices", "عدد الفواتير"])),
            active: toBool(pick(r, ["active", "status", "الحالة"])),
          } as SupplierRecord;
        })
        .filter((e): e is SupplierRecord => e !== null);

      if (!parsed.length) {
        toast.error(t("importFailed"));
      } else {
        setRecords((prev) => [...parsed, ...prev]);
        toast.success(`${parsed.length} ✓`);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("importFailed"));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addRecord = (r: Omit<SupplierRecord, "id">) => {
    const id = `SUP-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setRecords((prev) => [{ ...r, id }, ...prev]);
    toast.success(t("addedSupplier"));
    setOpen(false);
  };

  const editRecord = (updated: SupplierRecord) => {
    setRecords((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
    toast.success(t("savedChanges"));
    setEditSupplier(null);
    setView(null);
  };

  const sortable = useSortable<SupplierRecord>(filtered, {
    name: (s) => s.name.en || s.name.ar,
    contact: (s) => s.contact,
    phone: (s) => s.phone,
    balance: (s) => s.balance,
    status: (s) => (s.active ? 1 : 0),
  });
  const pg = usePagination(sortable.sorted);
  const visibleIds = useMemo(() => pg.pageItems.map((s) => s.id), [pg.pageItems]);
  const sel = useSelection(visibleIds);
  const deleteSelected = () => {
    if (sel.count === 0) return;
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteSelected"))) return;
    const ids = new Set(sel.ids);
    const removed = records.filter((s) => ids.has(s.id));
    setRecords((prev) => prev.filter((s) => !ids.has(s.id)));
    sel.clear();
    toast.success(t("deletedSelected"), {
      action: {
        label: t("undo"),
        onClick: () => {
          setRecords((prev) => [...removed, ...prev.filter((s) => !ids.has(s.id))]);
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
                <span className="text-gradient">{t("suppliersTitle")}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("suppliersSubtitle")}</p>
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
                <Plus className="size-4" />{t("newSupplier")}
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={Truck} label={t("suppliersCount")} value={fmt(totals.count)} accent="primary" />
            <Stat icon={CheckCircle2} label={t("activeSuppliers")} value={fmt(totals.active)} accent="success" />
            <Stat icon={Wallet} label={t("totalPayables")} value={fmt(totals.payables)} suffix={t("currency")} accent={totals.payables > 0 ? "warning" : "success"} />
            <Stat icon={Building2} label={t("topSupplier")} value={totals.topName} accent="info" />
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in">
            <div className="relative flex-1 min-w-[220px]">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3")} />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchSuppliers")}
                className={cn(
                  "w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition",
                  dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4",
                )}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "active", "inactive", "owed"] as StatusFilter[]).map((o) => (
                <button key={o} onClick={() => setFilter(o)}
                  className={cn("h-9 px-3 rounded-lg text-xs font-semibold transition border",
                    filter === o
                      ? "gradient-primary text-primary-foreground border-transparent"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}>
                  {o === "all" ? t("filterAll") : o === "owed" ? t("outstanding") : t(o as never)}
                </button>
              ))}
            </div>
          </div>

          {/* List view */}
          <ShowAllToggle showAll={pg.showAll} total={pg.total} onToggle={pg.toggleShowAll} />
          <BulkActionsBar
            count={sel.count}
            total={filtered.length}
            allSelected={sel.allSelected}
            onSelectAll={sel.toggleAll}
            onClear={sel.clear}
            onDelete={deleteSelected}
          />
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/60">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-muted/30 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-4"><SortHeader sortKey="name" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("supplierName")}</SortHeader></div>
              <div className="col-span-2"><SortHeader sortKey="contact" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("contactPerson")}</SortHeader></div>
              <div className="col-span-2"><SortHeader sortKey="phone" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("phone")}</SortHeader></div>
              <div className="col-span-2"><SortHeader sortKey="balance" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle}>{t("balance")}</SortHeader></div>
              <div className="col-span-1 text-center"><SortHeader sortKey="status" currentKey={sortable.sortKey} currentDir={sortable.sortDir} onSort={sortable.toggle} align="center">{t("status")}</SortHeader></div>
              <div className="col-span-1 text-center">{t("selectAll")}</div>
            </div>
            {pg.pageItems.map((s) => {
              const last = new Date(s.lastPurchase);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "group relative grid grid-cols-1 lg:grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-muted/30 transition",
                    sel.isSelected(s.id) && "bg-primary/5"
                  )}
                >
                  {/* Name + ID */}
                  <button
                    type="button"
                    onClick={() => setView(s)}
                    className="col-span-1 lg:col-span-4 flex items-center gap-3 min-w-0 text-start"
                  >
                    <div className="size-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0 glow-primary">
                      <Truck className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{s.name[lang]}</div>
                      <div className="text-[11px] text-muted-foreground tabular flex items-center gap-1.5">
                        <span>{s.id}</span>
                        {s.gln && <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">GLN: {s.gln}</span>}
                      </div>
                    </div>
                  </button>

                  {/* Contact */}
                  <div className="col-span-1 lg:col-span-2 min-w-0">
                    <div className="text-sm truncate">{s.contact}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{s.city[lang]}</div>
                  </div>

                  {/* Phone + Email */}
                  <div className="col-span-1 lg:col-span-2 min-w-0 space-y-0.5">
                    <div className="text-sm tabular truncate flex items-center gap-1.5">
                      <Phone className="size-3 text-muted-foreground" />
                      {s.phone}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                      <Mail className="size-3" />
                      {s.email}
                    </div>
                  </div>

                  {/* Balance + Total */}
                  <div className="col-span-1 lg:col-span-2 min-w-0">
                    <div className={cn("font-bold tabular text-sm", s.balance > 0 ? "text-warning" : "text-success")}>
                      {fmt(s.balance)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular">
                      {t("totalPurchases")}: {fmt(s.totalPurchases)} {t("currency")}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 lg:col-span-1 text-center">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block",
                      s.active ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground border-border"
                    )}>
                      {s.active ? t("active") : t("inactive")}
                    </span>
                  </div>

                  {/* Checkbox */}
                  <label className="col-span-1 lg:col-span-1 flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label={t("selectAll")}
                      checked={sel.isSelected(s.id)}
                      onChange={() => sel.toggle(s.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="size-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </label>

                  {/* Last purchase mobile hint */}
                  <div className="col-span-1 lg:col-span-12 lg:hidden text-[11px] text-muted-foreground tabular">
                    {t("lastPurchase")}: {last.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-muted-foreground">{t("noResults")}</div>
            )}
            <PaginationBar page={pg.page} totalPages={pg.totalPages} total={pg.total} from={pg.from} to={pg.to} onPageChange={pg.setPage} showAll={pg.showAll} onToggleShowAll={pg.toggleShowAll} />
          </div>
        </main>
      </div>

      {open && <AddSupplierDialog onClose={() => setOpen(false)} onSubmit={addRecord} />}
      {view && <ViewSupplierDialog supplier={view} onClose={() => setView(null)} onEdit={() => setEditSupplier(view)} />}
      {editSupplier && <EditSupplierDialog supplier={editSupplier} onClose={() => setEditSupplier(null)} onSubmit={editRecord} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix, accent = "primary" }: {
  icon: typeof Truck;
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
          <div className="text-2xl font-bold tabular tracking-tight truncate">{value}</div>
          {suffix && <div className="text-xs font-medium text-muted-foreground">{suffix}</div>}
        </div>
      </div>
    </div>
  );
}

function ViewSupplierDialog({ supplier, onClose, onEdit }: { supplier: SupplierRecord; onClose: () => void; onEdit: () => void }) {
  const { t, fmt, lang } = useApp();
  const last = new Date(supplier.lastPurchase);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-12 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0 glow-primary">
              <Truck className="size-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{supplier.name[lang]}</h2>
              <p className="text-xs text-muted-foreground tabular">{supplier.id} · {supplier.taxNumber}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label={t("contactPerson")} value={supplier.contact} />
          <Info label={t("city")} value={supplier.city[lang]} />
          <Info label={t("phone")} value={supplier.phone} mono />
          <Info label={t("email")} value={supplier.email} />
          <Info label={t("crNumber")} value={supplier.crNumber} mono />
          <Info label={t("taxNumber")} value={supplier.taxNumber} mono />
          <Info label={t("glnNumber")} value={supplier.gln ?? "—"} mono />
          <Info label={t("invoicesCount")} value={fmt(supplier.invoicesCount)} mono />
          <Info label={t("lastPurchase")} value={last.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })} mono />
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">{t("nationalAddress")}</div>
          <div className="font-medium">{supplier.nationalAddress[lang]}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("totalPurchases")}</div>
            <div className="font-bold tabular text-xl mt-1">{fmt(supplier.totalPurchases)} <span className="text-xs text-muted-foreground font-normal">{t("currency")}</span></div>
          </div>
          <div className={cn("rounded-xl border p-4", supplier.balance > 0 ? "border-warning/40 bg-warning/10" : "border-success/40 bg-success/10")}>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("balance")}</div>
            <div className={cn("font-bold tabular text-xl mt-1", supplier.balance > 0 ? "text-warning" : "text-success")}>
              {fmt(supplier.balance)} <span className="text-xs text-muted-foreground font-normal">{t("currency")}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">{t("close")}</button>
          <button type="button" onClick={() => { onClose(); onEdit(); }} className="h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            {t("edit")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className={cn("text-sm font-medium truncate", mono && "tabular")}>{value}</div>
    </div>
  );
}

function AddSupplierDialog({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (r: Omit<SupplierRecord, "id">) => void;
}) {
  const { t } = useApp();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [gln, setGln] = useState("");
  const [nationalAddress, setNationalAddress] = useState("");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) return toast.error("Name required");
    if (crNumber && !/^\d{10}$/.test(crNumber.trim())) {
      return toast.error("CR / Unified # must be 10 digits");
    }
    onSubmit({
      name: { ar: name, en: name },
      contact: contact || "—",
      phone: phone || "—",
      email: email || "—",
      city: { ar: city || "—", en: city || "—" },
      taxNumber: taxNumber || "—",
      crNumber: crNumber.trim() || "—",
      ...(gln.trim() ? { gln: gln.trim() } : {}),
      nationalAddress: { ar: nationalAddress || "—", en: nationalAddress || "—" },
      totalPurchases: 0,
      balance: 0,
      lastPurchase: new Date().toISOString(),
      invoicesCount: 0,
      active: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("newSupplier")}</h2>
            <p className="text-xs text-muted-foreground">{t("suppliersSubtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("supplierName")} full>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("contactPerson")}>
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("phone")}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9665…" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("email")}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("city")}>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("crNumber")}>
            <input value={crNumber} onChange={(e) => setCrNumber(e.target.value)} inputMode="numeric" maxLength={10} placeholder="1010xxxxxx" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("taxNumber")} full>
            <input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} placeholder="3xxxxxxxxx00003" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("glnNumber")} full>
            <input value={gln} onChange={(e) => setGln(e.target.value)} placeholder="1234567890123" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("nationalAddress")} full>
            <input value={nationalAddress} onChange={(e) => setNationalAddress(e.target.value)} placeholder={t("nationalAddress")} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
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

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("space-y-1.5 block", full && "col-span-2")}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function EditSupplierDialog({ supplier, onClose, onSubmit }: {
  supplier: SupplierRecord;
  onClose: () => void;
  onSubmit: (r: SupplierRecord) => void;
}) {
  const { t, lang } = useApp();
  const [name, setName] = useState(supplier.name[lang] || "");
  const [contact, setContact] = useState(supplier.contact === "—" ? "" : supplier.contact);
  const [phone, setPhone] = useState(supplier.phone === "—" ? "" : supplier.phone);
  const [email, setEmail] = useState(supplier.email === "—" ? "" : supplier.email);
  const [city, setCity] = useState(supplier.city[lang] === "—" ? "" : supplier.city[lang]);
  const [taxNumber, setTaxNumber] = useState(supplier.taxNumber === "—" ? "" : supplier.taxNumber);
  const [crNumber, setCrNumber] = useState(supplier.crNumber === "—" ? "" : supplier.crNumber);
  const [gln, setGln] = useState(supplier.gln ?? "");
  const [nationalAddress, setNationalAddress] = useState(supplier.nationalAddress[lang] === "—" ? "" : supplier.nationalAddress[lang]);
  const [active, setActive] = useState(supplier.active);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) return toast.error("Name required");
    if (crNumber && !/^\d{10}$/.test(crNumber.trim())) {
      return toast.error("CR / Unified # must be 10 digits");
    }
    onSubmit({
      ...supplier,
      name: { ar: name, en: name },
      contact: contact || "—",
      phone: phone || "—",
      email: email || "—",
      city: { ar: city || "—", en: city || "—" },
      taxNumber: taxNumber || "—",
      crNumber: crNumber.trim() || "—",
      ...(gln.trim() ? { gln: gln.trim() } : {}),
      nationalAddress: { ar: nationalAddress || "—", en: nationalAddress || "—" },
      active,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("editSupplier")}</h2>
            <p className="text-xs text-muted-foreground">{supplier.id}</p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("supplierName")} full>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("contactPerson")}>
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("phone")}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9665…" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("email")}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("city")}>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("crNumber")}>
            <input value={crNumber} onChange={(e) => setCrNumber(e.target.value)} inputMode="numeric" maxLength={10} placeholder="1010xxxxxx" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("taxNumber")} full>
            <input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} placeholder="3xxxxxxxxx00003" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("glnNumber")} full>
            <input value={gln} onChange={(e) => setGln(e.target.value)} placeholder="1234567890123" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("nationalAddress")} full>
            <input value={nationalAddress} onChange={(e) => setNationalAddress(e.target.value)} placeholder={t("nationalAddress")} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 rounded border-border accent-primary cursor-pointer"
          />
          <span>{active ? t("active") : t("inactive")}</span>
        </label>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">{t("cancel")}</button>
          <button type="submit" className="h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <CheckCircle2 className="size-4" />{t("saveChanges")}
          </button>
        </div>
      </form>
    </div>
  );
}
