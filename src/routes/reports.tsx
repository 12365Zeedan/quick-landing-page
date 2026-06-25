import { createFileRoute } from "@tanstack/react-router";
import { DatePickerInput } from "@/components/date-picker-input";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Layers,
  Package,
  Percent,
  PieChart,
  Eye,
  Play,
  X,
  Receipt,
  Scale,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useApp } from "@/lib/app-context";
import { type SupplierRecord } from "@/lib/mock-data";
import { useFinancials, type LiveFinancials } from "@/lib/use-financials";
import { useOrgStorage } from "@/lib/use-org-storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — PharmLedger" },
      {
        name: "description",
        content: "Run, preview, and export financial, sales, tax and HR reports.",
      },
    ],
  }),
  component: ReportsPage,
});

type CatKey =
  | "all"
  | "catFinancial"
  | "catSales"
  | "catInventory"
  | "catHr"
  | "catTax"
  | "catCompliance";

interface ReportDef {
  id: string;
  titleKey: string;
  descKey: string;
  category: Exclude<CatKey, "all">;
  icon: typeof FileText;
  accent: "primary" | "success" | "info" | "warning" | "destructive";
  rows: () => Array<Record<string, string | number>>;
}

const buildReports = (fin: LiveFinancials, suppliers: SupplierRecord[]): ReportDef[] => [
  {
    id: "pl",
    titleKey: "rptPL",
    descKey: "rptPLDesc",
    category: "catFinancial",
    icon: TrendingUp,
    accent: "success",
    rows: () => {
      const purchases = fin.purchasesTotal;
      const netRevenueExVat = (fin.netRevenue - fin.outputVat);
      return [
        { line: "Gross Revenue", amount: fin.grossRevenue },
        { line: "Discounts", amount: -fin.totalDiscount },
        { line: "Output VAT", amount: -fin.outputVat },
        { line: "Net Revenue (Ex-VAT)", amount: netRevenueExVat },
        { line: "Expenses", amount: -fin.totalExpenses },
        { line: "Purchases", amount: -purchases },
        { line: "Net Profit", amount: netRevenueExVat - fin.totalExpenses - purchases },
      ];
    },
  },
  {
    id: "bs",
    titleKey: "rptBS",
    descKey: "rptBSDesc",
    category: "catFinancial",
    icon: Scale,
    accent: "info",
    rows: () => {
      const receivables = fin.debts
        .filter((d) => d.kind === "receivable")
        .reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0);
      const payables =
        fin.debts
          .filter((d) => d.kind === "payable")
          .reduce((s, d) => s + ((Number(d.amount) || 0) - (Number(d.paid) || 0)), 0) +
        fin.purchasesOutstanding;
      const cashAndBank = fin.cashBalance + fin.bankRevenue - fin.expensesBank;
      const assets = cashAndBank + receivables + fin.purchasesSubtotal + fin.inputVat;
      const equity = assets - payables;
      return [
        { line: "Cash & Bank", amount: cashAndBank },
        { line: "Accounts Receivable", amount: receivables },
        { line: "Inventory / Purchases", amount: fin.purchasesSubtotal },
        { line: "Input VAT", amount: fin.inputVat },
        { line: "Total Assets", amount: assets },
        { line: "Accounts Payable", amount: payables },
        { line: "Total Equity", amount: equity },
      ];
    },
  },
  {
    id: "cf",
    titleKey: "rptCF",
    descKey: "rptCFDesc",
    category: "catFinancial",
    icon: Wallet,
    accent: "primary",
    rows: () => [
      { line: "Cash Revenue", amount: fin.cashRevenue },
      { line: "Bank Revenue", amount: fin.bankRevenue },
      { line: "Expenses Paid", amount: -fin.totalExpenses },
      { line: "Purchases Paid", amount: -fin.purchasesPaid },
      {
        line: "Net Cash Flow",
        amount: fin.cashRevenue + fin.bankRevenue - fin.totalExpenses - fin.purchasesPaid,
      },
    ],
  },
  {
    id: "sales",
    titleKey: "rptSales",
    descKey: "rptSalesDesc",
    category: "catSales",
    icon: BarChart3,
    accent: "success",
    rows: () =>
      fin.revenues.map((e) => ({
        id: e.id,
        date: e.date.slice(0, 10),
        customers: e.customers,
        cash: e.cash,
        bank: e.bank,
        discount: e.discount,
        wasfaty: e.wasfaty || 0,
        gross: e.cash + e.bank + e.discount,
        net: e.cash + e.bank,
      })),
  },
  {
    id: "topProducts",
    titleKey: "rptTopProducts",
    descKey: "rptTopProductsDesc",
    category: "catSales",
    icon: PieChart,
    accent: "warning",
    rows: () => {
      const map = new Map<string, { gross: number; net: number }>();
      for (const e of fin.revenues) {
        const day = e.date.slice(0, 10);
        const prev = map.get(day) ?? { gross: 0, net: 0 };
        map.set(day, {
          gross: prev.gross + e.cash + e.bank + e.discount,
          net: prev.net + e.cash + e.bank,
        });
      }
      return Array.from(map.entries())
        .sort((a, b) => b[1].net - a[1].net)
        .map(([date, v]) => ({ date, gross: v.gross, net: v.net }));
    },
  },
  {
    id: "purchases",
    titleKey: "rptPurchases",
    descKey: "rptPurchasesDesc",
    category: "catInventory",
    icon: Package,
    accent: "info",
    rows: () =>
      fin.purchases.map((p) => ({
        id: p.id,
        date: p.date.slice(0, 10),
        invoice: p.invoiceNumber,
        vendorReference: p.vendorReference ?? "",
        supplier: p.supplier.en,
        subtotal: p.subtotal,
        vat: p.vat,
        status: p.status,
        paid: p.paid,
        amount: p.total,
      })),
  },
  {
    id: "suppliers",
    titleKey: "rptSuppliers",
    descKey: "rptSuppliersDesc",
    category: "catInventory",
    icon: Building2,
    accent: "primary",
    rows: () =>
      suppliers.map((s) => ({
        id: s.id,
        name: s.name.en,
        invoices: s.invoicesCount,
        spend: s.totalPurchases,
        balance: s.balance,
        active: s.active ? "active" : "inactive",
      })),
  },
  {
    id: "staff",
    titleKey: "rptStaff",
    descKey: "rptStaffDesc",
    category: "catHr",
    icon: Users,
    accent: "info",
    rows: () =>
      fin.staff.map((m) => ({
        id: m.id,
        name: m.name.en,
        role: m.role,
        hours: m.hoursThisMonth,
        salary: m.salary,
      })),
  },
  {
    id: "vat",
    titleKey: "rptVat",
    descKey: "rptVatDesc",
    category: "catTax",
    icon: Percent,
    accent: "warning",
    rows: () => {
      const outputTaxable = (fin.netRevenue - fin.outputVat);
      const inputTaxable = fin.expensesSubtotal + fin.purchasesSubtotal;
      const inputVat = fin.expensesVat + fin.purchasesVat;
      return [
        { line: "Output Taxable", amount: outputTaxable },
        { line: "Output VAT", amount: fin.outputVat },
        { line: "Input Taxable", amount: inputTaxable },
        { line: "Input VAT", amount: inputVat },
        { line: "Net VAT", amount: fin.outputVat - inputVat },
      ];
    },
  },
  {
    id: "debts",
    titleKey: "rptDebts",
    descKey: "rptDebtsDesc",
    category: "catFinancial",
    icon: Receipt,
    accent: "destructive",
    rows: () =>
      fin.debts.map((d) => ({
        id: d.id,
        kind: d.kind,
        party: d.party.en,
        balance: d.amount - d.paid,
        dueDate: d.dueAt.slice(0, 10),
        status: d.status,
      })),
  },
  {
    id: "audit",
    titleKey: "rptAudit",
    descKey: "rptAuditDesc",
    category: "catCompliance",
    icon: ShieldCheck,
    accent: "primary",
    rows: () => [
      { event: "user.login", actor: "admin", at: "2026-05-13T08:12:00Z" },
      { event: "invoice.create", actor: "cashier-2", at: "2026-05-13T09:01:00Z" },
      { event: "stock.adjust", actor: "manager", at: "2026-05-12T17:45:00Z" },
    ],
  },
];

function deriveFinForRange(
  base: LiveFinancials,
  from: Date | null,
  to: Date | null,
): LiveFinancials {
  if (!from && !to) return base;
  const inRange = (s: string | undefined | null) => {
    if (!s) return false;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  };
  const revenues = base.revenues.filter((r) => inRange(r.date));
  const expenses = base.expenses.filter((e) => inRange(e.date));
  const purchases = base.purchases.filter((p) => inRange(p.date));
  const debts = base.debts.filter((d) => inRange(d.dueAt));

  const n = (v: unknown) => Number(v) || 0;
  const cashRevenue = revenues.reduce((s, r) => s + n(r.cash), 0);
  const bankRevenue = revenues.reduce((s, r) => s + n(r.bank), 0);
  const wasfatyRevenue = revenues.reduce((s, r) => s + n(r.wasfaty), 0);
  const totalDiscount = revenues.reduce((s, r) => s + n(r.discount), 0);
  const netRevenue = cashRevenue + bankRevenue;
  const grossRevenue = netRevenue + totalDiscount;
  const outputVat =
    Math.round(revenues.reduce((s, r) => s + n((r as { vat?: number }).vat), 0) * 100) / 100;
  const netRevenueExVat = netRevenue - outputVat;

  const expensesSubtotal = expenses.reduce((s, e) => s + n(e.subtotal), 0);
  const expensesVat = expenses.reduce((s, e) => s + n(e.vat), 0);
  const totalExpenses = expenses.reduce((s, e) => s + n(e.amount), 0);
  const expensesCash = expenses
    .filter((e) => e.method === "cash")
    .reduce((s, e) => s + n(e.amount), 0);
  const expensesBank = expenses
    .filter((e) => e.method !== "cash")
    .reduce((s, e) => s + n(e.amount), 0);

  const purchasesSubtotal = purchases.reduce((s, p) => s + n(p.subtotal), 0);
  const purchasesVat = purchases.reduce((s, p) => s + n(p.vat), 0);
  const purchasesTotal = purchases.reduce((s, p) => s + n(p.total), 0);
  const purchasesPaid = purchases.reduce((s, p) => s + n(p.paid), 0);
  const purchasesOutstanding = purchasesTotal - purchasesPaid;
  const purchasesPaidCash = purchases
    .filter((p) => p.method === "cash")
    .reduce((s, p) => s + n(p.paid), 0);

  const inputVat = expensesVat + purchasesVat;
  const netVat = outputVat - inputVat;
  const netProfit = netRevenueExVat - totalExpenses;
  const cashBalance = cashRevenue - expensesCash - purchasesPaidCash;
  const outstandingDebts = debts
    .filter((d) => d.status !== "settled")
    .reduce((s, d) => s + (n(d.amount) - n(d.paid)), 0);

  return {
    ...base,
    revenues,
    expenses,
    purchases,
    debts,
    cashRevenue,
    bankRevenue,
    wasfatyRevenue,
    totalDiscount,
    netRevenue,
    netRevenueExVat,
    grossRevenue,
    outputVat,
    inputVat,
    netVat,
    expensesSubtotal,
    expensesVat,
    totalExpenses,
    expensesCash,
    expensesBank,
    purchasesSubtotal,
    purchasesVat,
    purchasesTotal,
    purchasesPaid,
    purchasesOutstanding,
    netProfit,
    cashBalance,
    outstandingDebts,
  };
}



interface RecentRun {
  id: string;
  reportId: string;
  format: "csv" | "pdf";
  at: string;
}

function ReportsPage() {
  const { t, fmt, dir, lang } = useApp();
  const fin = useFinancials();
  const [suppliers] = useOrgStorage<SupplierRecord>("suppliers.records.v1", []);
  const reports = useMemo(() => buildReports(fin, suppliers), [fin, suppliers]);
  const [cat, setCat] = useState<CatKey>("all");
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentRun[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewReport = previewId ? (reports.find((r) => r.id === previewId) ?? null) : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (!q) return true;
      return (
        t(r.titleKey as never)
          .toLowerCase()
          .includes(q) ||
        t(r.descKey as never)
          .toLowerCase()
          .includes(q)
      );
    });
  }, [cat, query, reports, t]);

  // Align KPI cards with the source modules:
  // - Revenue module shows VAT-inclusive net revenue (cash+bank+wasfaty)
  // - Expenses module shows expenses only (purchases live in their own module)
  // Net profit still uses the ex-VAT revenue and includes purchases as cost.
  const grossRevenue = fin.grossRevenue;
  const totalRevenue = fin.netRevenue;
  const totalExpenses = fin.totalExpenses;
  const netRevenueExVat = (fin.netRevenue - fin.outputVat);
  const netProfit = netRevenueExVat - fin.totalExpenses - fin.purchasesTotal;

  const fmtCell = (v: unknown): string => {
    if (typeof v === "number" && Number.isFinite(v)) {
      return (Math.round(v * 100) / 100).toFixed(2);
    }
    return String(v ?? "");
  };
  const runReport = async (
    r: ReportDef,
    format: "csv" | "pdf",
    overrideRows?: Array<Record<string, string | number>>,
  ) => {
    const rows = overrideRows ?? r.rows();

    const date = new Date().toISOString().slice(0, 10);
    if (rows.length > 0 && typeof window !== "undefined") {
      if (format === "csv") {
        const header = Object.keys(rows[0]).join(",");
        const body = rows
          .map((row) => Object.values(row).map(fmtCell).join(","))
          .join("\n");
        const blob = new Blob([`\ufeff${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${r.id}-${date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === "pdf") {
        const { exportHtmlAsPdf, buildReportTableHtml } = await import("@/lib/pdf-export");
        const title = String(t(r.titleKey as never));
        const subtitle = String(t(r.descKey as never));
        const headers = Object.keys(rows[0]);
        const body = rows.map((row) =>
          headers.map((h) => fmtCell((row as Record<string, unknown>)[h])),
        );
        const html = buildReportTableHtml({
          title,
          subtitle,
          date,
          headers,
          rows: body,
          lang,
          footerText: `PharmLedger — ${date}`,
        });
        await exportHtmlAsPdf({
          html,
          filename: `${r.id}-${date}.pdf`,
          orientation: "landscape",
        });
      }
    }
    setRecent((prev) =>
      [
        {
          id: `${r.id}-${Date.now()}`,
          reportId: r.id,
          format,
          at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 8),
    );
    toast.success(`${t(r.titleKey as never)} — ${format.toUpperCase()}`);
  };

  const cats: { id: CatKey; label: string; icon: typeof Layers }[] = [
    { id: "all", label: t("filterAll"), icon: Layers },
    { id: "catFinancial", label: t("catFinancial"), icon: TrendingUp },
    { id: "catSales", label: t("catSales"), icon: BarChart3 },
    { id: "catInventory", label: t("catInventory"), icon: Package },
    { id: "catHr", label: t("catHr"), icon: Users },
    { id: "catTax", label: t("catTax"), icon: Percent },
    { id: "catCompliance", label: t("catCompliance"), icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-background flex" dir={dir}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 space-y-6 overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("reportsTitle")}</h1>
              <p className="text-muted-foreground mt-1">{t("reportsSubtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="size-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search")}
                  className="ps-9 pe-3 py-2.5 rounded-xl bg-card/60 border border-border/60 text-sm focus:outline-none focus:border-primary/50 transition-colors w-64"
                />
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MiniKpi
              icon={TrendingUp}
              accent="primary"
              label={t("grossRevenue")}
              value={fmt(grossRevenue)}
            />
            <MiniKpi
              icon={Receipt}
              accent="success"
              label={t("netRevenue")}
              value={fmt(totalRevenue)}
            />
            <MiniKpi
              icon={Wallet}
              accent="warning"
              label={t("totalExpenses")}
              value={fmt(totalExpenses)}
            />
            <MiniKpi
              icon={Scale}
              accent={netProfit >= 0 ? "primary" : "destructive"}
              label={t("netIncome") as string}
              value={fmt(netProfit)}
            />
            <MiniKpi
              icon={FileSpreadsheet}
              accent="info"
              label={t("reportCatalog")}
              value={String(reports.length)}
              suffix=""
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all",
                  cat === c.id
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "bg-card/40 text-muted-foreground border-border/60 hover:text-foreground hover:border-border",
                )}
              >
                <c.icon className="size-4" />
                {c.label}
              </button>
            ))}
          </div>

          {/* Catalog */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                onRun={runReport}
                onPreview={() => setPreviewId(r.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="sm:col-span-2 xl:col-span-3 glass-card rounded-2xl p-12 text-center text-muted-foreground">
                {t("noResults")}
              </div>
            )}
          </div>

          {/* Recent runs */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="size-5 text-primary" />
                {t("recentReports")}
              </h2>
              {recent.length > 0 && (
                <button
                  onClick={() => setRecent([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("clear") || "Clear"}
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                {t("noRecentReports")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b border-border/60">
                      <th className="px-3 py-2 text-start font-medium">{t("reportName")}</th>
                      <th className="px-3 py-2 text-start font-medium">{t("category")}</th>
                      <th className="px-3 py-2 text-start font-medium">{t("format")}</th>
                      <th className="px-3 py-2 text-start font-medium">{t("generatedAt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((row) => {
                      const def = reports.find((x) => x.id === row.reportId);
                      if (!def) return null;
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2.5 font-medium flex items-center gap-2">
                            <def.icon className="size-4 text-muted-foreground" />
                            {t(def.titleKey as never)}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {t(def.category as never)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-muted/50 border border-border/40">
                              {row.format.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 tabular text-muted-foreground">
                            {new Date(row.at).toLocaleString(lang === "ar" ? "ar-SA" : "en-GB")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
      {previewReport && (
        <PreviewModal
          report={previewReport}
          fin={fin}
          suppliers={suppliers}
          onClose={() => setPreviewId(null)}
          onExport={(fmt, filteredRows) => {
            runReport(previewReport, fmt, filteredRows);
            setPreviewId(null);
          }}
        />
      )}

    </div>
  );
}

type PeriodKey = "all" | "month" | "quarter" | "half" | "year" | "custom";

function getPeriodRange(
  p: PeriodKey,
  from?: string,
  to?: string,
): { from: Date | null; to: Date | null } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (p) {
    case "all":
      return { from: null, to: null };
    case "month":
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0, 23, 59, 59, 999) };
    case "quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return { from: new Date(y, qStart, 1), to: new Date(y, qStart + 3, 0, 23, 59, 59, 999) };
    }
    case "half": {
      const hStart = m < 6 ? 0 : 6;
      return { from: new Date(y, hStart, 1), to: new Date(y, hStart + 6, 0, 23, 59, 59, 999) };
    }
    case "year":
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31, 23, 59, 59, 999) };
    case "custom":
      return {
        from: from ? new Date(from) : null,
        to: to ? new Date(`${to}T23:59:59.999`) : null,
      };
  }
}

function PreviewModal({
  report,
  fin,
  suppliers,
  onClose,
  onExport,
}: {
  report: ReportDef;
  fin: LiveFinancials;
  suppliers: SupplierRecord[];
  onClose: () => void;
  onExport: (fmt: "csv" | "pdf", rows?: Array<Record<string, string | number>>) => void;
}) {
  const { t, fmt: fmtNum, lang } = useApp();

  const [period, setPeriod] = useState<PeriodKey>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  // Rebuild this report against a fin recomputed for the chosen period.
  const periodFilteredRows = useMemo(() => {
    const { from, to } = getPeriodRange(period, customFrom, customTo);
    const scopedFin = deriveFinForRange(fin, from, to);
    const scoped = buildReports(scopedFin, suppliers).find((r) => r.id === report.id);
    return scoped ? scoped.rows() : [];
  }, [fin, suppliers, report.id, period, customFrom, customTo]);

  const rawRows = periodFilteredRows;
  const columns = rawRows[0] ? Object.keys(rawRows[0]) : [];
  const isNumericCol = (c: string) => rawRows.length > 0 && typeof rawRows[0][c] === "number";


  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rows = useMemo(() => {
    if (!sortCol) return periodFilteredRows;
    const sorted = [...periodFilteredRows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av ?? "").localeCompare(String(bv ?? ""), undefined, {
        numeric: true,
      });
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [periodFilteredRows, sortCol, sortDir]);

  const toggleSort = (c: string) => {
    if (sortCol === c) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(c);
      setSortDir("asc");
    }
    setPage(1);
  };

  const PAGE_SIZES = [10, 25, 50, 100];
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, rows.length);
  const pageRows = useMemo(() => rows.slice(startIdx, endIdx), [rows, startIdx, endIdx]);

  const isAr = lang === "ar";
  const periodOptions: { id: PeriodKey; label: string }[] = [
    { id: "all", label: isAr ? "كامل الفترة" : "All time" },
    { id: "month", label: isAr ? "شهري" : "Monthly" },
    { id: "quarter", label: isAr ? "ربع سنوي" : "Quarterly" },
    { id: "half", label: isAr ? "نصف سنوي" : "Semi-annual" },
    { id: "year", label: isAr ? "سنوي" : "Annual" },
    { id: "custom", label: isAr ? "من - إلى" : "Custom" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-border/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border/60">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-11 rounded-xl grid place-items-center bg-primary/15 text-primary border border-primary/30 shrink-0">
              <report.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("reportPreview")}
              </div>
              <h2 className="text-lg font-semibold truncate">{t(report.titleKey as never)}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {t(report.descKey as never)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
            aria-label={t("closePreview")}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-border/60 text-xs text-muted-foreground bg-muted/20">
          <span>
            {t("rowsCount")}:{" "}
            <span className="text-foreground font-semibold tabular">{rows.length}</span>
          </span>
          <span className="text-border">•</span>
          <span>
            {t("category")}: <span className="text-foreground">{t(report.category as never)}</span>
          </span>
        </div>

        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border/60 bg-card/30">
          <span className="text-xs font-medium text-muted-foreground me-1">
            {isAr ? "الفترة" : "Period"}:
          </span>
          {periodOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setPeriod(opt.id);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                period === opt.id
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "bg-card/60 text-muted-foreground border-border/60 hover:text-foreground hover:border-border",
              )}
            >
              {opt.label}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex items-center gap-2 ms-1">
              <DatePickerInput
                value={customFrom}
                onChange={(v) => {
                  setCustomFrom(v);
                  setPage(1);
                }}
                className="px-2 py-1 rounded-md bg-card/60 border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-muted-foreground">—</span>
              <DatePickerInput
                value={customTo}
                onChange={(v) => {
                  setCustomTo(v);
                  setPage(1);
                }}
                className="px-2 py-1 rounded-md bg-card/60 border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>



        <div className="overflow-auto flex-1">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">{t("noResults")}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border/60 sticky top-0 backdrop-blur-sm">
                <tr>
                  {columns.map((c) => {
                    const active = sortCol === c;
                    const SortIcon = active
                      ? sortDir === "asc"
                        ? ArrowUp
                        : ArrowDown
                      : ArrowUpDown;
                    const numeric = isNumericCol(c);
                    return (
                      <th
                        key={c}
                        className={cn(
                          "px-4 py-2.5 font-medium text-xs uppercase tracking-wide select-none cursor-pointer transition-colors hover:text-foreground",
                          active ? "text-foreground" : "text-muted-foreground",
                          numeric ? "text-end" : "text-start",
                        )}
                        onClick={() => toggleSort(c)}
                        aria-sort={
                          active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                        }
                      >
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5",
                            numeric && "flex-row-reverse",
                          )}
                        >
                          {c}
                          <SortIcon
                            className={cn("size-3", active ? "opacity-100" : "opacity-40")}
                          />
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                  >
                    {columns.map((c) => {
                      const v = row[c];
                      const numeric = typeof v === "number";
                      return (
                        <td
                          key={c}
                          className={cn(
                            "px-4 py-2.5",
                            numeric ? "text-end tabular font-medium" : "text-start",
                          )}
                        >
                          {numeric ? fmtNum(v as number) : String(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-t border-border/60 bg-muted/10 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                {startIdx + 1}–{endIdx} / {rows.length}
              </span>
              <span className="text-border">•</span>
              <label className="flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-card/60 border border-border/60 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="size-7 grid place-items-center rounded-md hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="First page"
              >
                «
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="size-7 grid place-items-center rounded-md hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Previous page"
              >
                ‹
              </button>
              <span className="px-2 text-foreground tabular">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="size-7 grid place-items-center rounded-md hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Next page"
              >
                ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="size-7 grid place-items-center rounded-md hover:bg-muted/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                aria-label="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 p-4 border-t border-border/60 bg-card/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            {t("closePreview")}
          </button>
          <button
            onClick={() => onExport("pdf", periodFilteredRows)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card/60 border border-border/60 text-sm font-medium hover:bg-muted/40 transition-all"
          >
            <FileText className="size-4" />
            {t("exportPdf")}
          </button>
          <button
            onClick={() => onExport("csv", periodFilteredRows)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
          >
            <Download className="size-4" />
            {t("exportCsv")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  report,
  onRun,
  onPreview,
}: {
  report: ReportDef;
  onRun: (r: ReportDef, format: "csv" | "pdf") => void;
  onPreview: () => void;
}) {
  const { t } = useApp();
  const accentMap: Record<ReportDef["accent"], string> = {
    primary: "from-primary/20 to-primary/0 text-primary border-primary/30",
    success: "from-success/20 to-success/0 text-success border-success/30",
    info: "from-info/20 to-info/0 text-info border-info/30",
    warning: "from-warning/20 to-warning/0 text-warning border-warning/30",
    destructive: "from-destructive/20 to-destructive/0 text-destructive border-destructive/30",
  };
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden hover:shadow-glow transition-all flex flex-col">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none",
          accentMap[report.accent],
        )}
      />
      <div className="relative flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "size-11 rounded-xl grid place-items-center bg-background/60 backdrop-blur-sm border",
              accentMap[report.accent],
            )}
          >
            <report.icon className="size-5" />
          </div>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground px-2 py-0.5 rounded-md border border-border/50 bg-card/40">
            {t(report.category as never)}
          </span>
        </div>
        <h3 className="font-semibold text-base leading-tight">{t(report.titleKey as never)}</h3>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed flex-1">
          {t(report.descKey as never)}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onPreview}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all"
          >
            <Eye className="size-3.5" />
            {t("preview")}
          </button>
          <button
            onClick={() => onRun(report, "csv")}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs font-medium hover:bg-muted/40 transition-all"
            title="CSV"
          >
            <Download className="size-3.5" />
            CSV
          </button>
          <button
            onClick={() => onRun(report, "pdf")}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-card/60 border border-border/60 text-xs font-medium hover:bg-muted/40 transition-all"
            title="PDF"
          >
            <FileText className="size-3.5" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  accent,
  suffix,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  accent: "success" | "info" | "primary" | "warning" | "destructive";
  suffix?: string;
}) {
  const { t } = useApp();
  const map = {
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    primary: "from-primary/20 to-primary/0 text-primary",
    warning: "from-warning/20 to-warning/0 text-warning",
    destructive: "from-destructive/20 to-destructive/0 text-destructive",
  };
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none",
          map[accent],
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          <div
            className={cn(
              "size-10 rounded-xl grid place-items-center bg-background/40 backdrop-blur-sm border border-border/50",
              map[accent].split(" ").pop(),
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <div className="text-2xl font-bold tabular tracking-tight">{value}</div>
          <span className="text-xs text-muted-foreground">{suffix ?? t("currency")}</span>
        </div>
      </div>
    </div>
  );
}
