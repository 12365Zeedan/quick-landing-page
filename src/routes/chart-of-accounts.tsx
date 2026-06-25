import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, Plus, Pencil, Trash2, RotateCcw, Check, X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { PaginationBar } from "@/components/pagination-bar";
import { useApp } from "@/lib/app-context";
import { useOrgStorage } from "@/lib/use-org-storage";
import { usePagination } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/chart-of-accounts")({
  head: () => ({
    meta: [
      { title: "Chart of Accounts — PharmLedger" },
      { name: "description", content: "Accounting directory for the pharmacy." },
    ],
  }),
  component: ChartOfAccountsPage,
});

import { DEFAULT_CHART, type Account, type AccountType } from "@/lib/journal";

const typeColor: Record<AccountType, string> = {
  assets: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  liabilities: "text-rose-500 bg-rose-500/10 border-rose-500/30",
  equity: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  revenue: "text-sky-500 bg-sky-500/10 border-sky-500/30",
  expenses: "text-violet-500 bg-violet-500/10 border-violet-500/30",
};

// ---- tree helpers ----
function cloneTree(tree: Account[]): Account[] {
  return tree.map((n) => ({ ...n, children: n.children ? cloneTree(n.children) : undefined }));
}
function updateNode(tree: Account[], code: string, fn: (n: Account) => Account): Account[] {
  return tree.map((n) => {
    if (n.code === code) return fn({ ...n, children: n.children ? cloneTree(n.children) : undefined });
    if (n.children) return { ...n, children: updateNode(n.children, code, fn) };
    return n;
  });
}
function removeNode(tree: Account[], code: string): Account[] {
  return tree
    .filter((n) => n.code !== code)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, code) } : n));
}
function nextRootCode(tree: Account[]): string {
  const nums = tree.map((n) => parseInt(n.code, 10)).filter((x) => !Number.isNaN(x));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}
function nextChildCode(parent: Account): string {
  const kids = parent.children ?? [];
  if (kids.length === 0) return `${parent.code}01`;
  // Find max suffix after parent.code
  const max = kids.reduce((m, k) => {
    const suffix = k.code.startsWith(parent.code) ? k.code.slice(parent.code.length) : "";
    const n = parseInt(suffix, 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  const width = Math.max(2, String(max + 1).length);
  return `${parent.code}${String(max + 1).padStart(width, "0")}`;
}

function ChartOfAccountsPage() {
  const { t, lang } = useApp();
  const [chart, setChart] = useOrgStorage<Account>("pl_chart_of_accounts", DEFAULT_CHART);
  const [open, setOpen] = useState<Record<string, boolean>>({
    "1": true, "2": true, "3": true, "4": true, "5": true,
  });
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editAr, setEditAr] = useState("");
  const [editEn, setEditEn] = useState("");
  const [addingUnder, setAddingUnder] = useState<string | "__root__" | null>(null);
  const [newAr, setNewAr] = useState("");
  const [newEn, setNewEn] = useState("");

  const tName = (a: Account) => (lang === "ar" ? a.nameAr : a.nameEn);
  const tType = (type: AccountType) => t(type);

  const filtered = useMemo(() => {
    if (!query.trim()) return chart;
    const q = query.toLowerCase();
    const match = (a: Account): Account | null => {
      const kids = a.children?.map(match).filter(Boolean) as Account[] | undefined;
      const hit = a.code.includes(q) || a.nameAr.toLowerCase().includes(q) || a.nameEn.toLowerCase().includes(q);
      if (hit || (kids && kids.length)) return { ...a, children: kids };
      return null;
    };
    return chart.map(match).filter(Boolean) as Account[];
  }, [query, chart]);

  const pg = usePagination(filtered);


  const startEdit = (a: Account) => {
    setEditing(a.code);
    setEditAr(a.nameAr);
    setEditEn(a.nameEn);
  };
  const commitEdit = () => {
    if (!editing) return;
    const name = (lang === "ar" ? editAr : editEn).trim();
    if (!name) return;
    setChart((prev) => updateNode(prev, editing, (n) => ({
      ...n,
      nameAr: editAr.trim() || n.nameAr,
      nameEn: editEn.trim() || n.nameEn,
    })));
    setEditing(null);
    toast.success(t("save"));
  };

  const startAddChild = (parentCode: string) => {
    setAddingUnder(parentCode);
    setNewAr("");
    setNewEn("");
    setOpen((p) => ({ ...p, [parentCode]: true }));
  };
  const startAddRoot = () => {
    setAddingUnder("__root__");
    setNewAr("");
    setNewEn("");
  };
  const commitAdd = () => {
    const ar = newAr.trim();
    const en = newEn.trim() || ar;
    if (!ar && !en) return;
    if (addingUnder === "__root__") {
      const code = nextRootCode(chart);
      const node: Account = {
        code, nameAr: ar || en, nameEn: en || ar,
        type: "assets", nature: "debit", children: [],
      };
      setChart((prev) => [...prev, node]);
    } else if (addingUnder) {
      setChart((prev) => updateNode(prev, addingUnder, (parent) => {
        const code = nextChildCode(parent);
        const child: Account = {
          code, nameAr: ar || en, nameEn: en || ar,
          type: parent.type, nature: parent.nature,
        };
        return { ...parent, children: [...(parent.children ?? []), child] };
      }));
    }
    setAddingUnder(null);
    toast.success(t("save"));
  };

  const deleteAccount = (code: string) => {
    if (!confirm(t("confirmDeleteAccount"))) return;
    setChart((prev) => removeNode(prev, code));
    toast.success(t("deleteAccount"));
  };

  const resetDefaults = () => {
    if (!confirm(t("resetToDefault") + "?")) return;
    setChart(cloneTree(DEFAULT_CHART));
  };

  const renderRow = (a: Account, depth = 0) => {
    const hasKids = !!a.children?.length;
    const isOpen = open[a.code] ?? true;
    const isEditing = editing === a.code;
    return (
      <div key={a.code}>
        <div
          className={cn(
            "group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition border border-transparent",
            depth === 0 && "bg-card/50 border-border font-semibold",
          )}
          style={{ paddingInlineStart: `${depth * 20 + 12}px` }}
        >
          <button
            onClick={() => hasKids && setOpen((p) => ({ ...p, [a.code]: !isOpen }))}
            className={cn("size-5 grid place-items-center rounded shrink-0", !hasKids && "invisible")}
          >
            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
          <span className="tabular text-xs font-mono text-muted-foreground w-14 shrink-0">{a.code}</span>

          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                value={editAr}
                onChange={(e) => setEditAr(e.target.value)}
                placeholder="عربي"
                className="flex-1 h-8 px-2 rounded bg-background border border-border text-sm"
                autoFocus
              />
              <input
                value={editEn}
                onChange={(e) => setEditEn(e.target.value)}
                placeholder="English"
                className="flex-1 h-8 px-2 rounded bg-background border border-border text-sm"
              />
              <button onClick={commitEdit} className="size-7 grid place-items-center rounded bg-primary text-primary-foreground" title={t("save")}>
                <Check className="size-4" />
              </button>
              <button onClick={() => setEditing(null)} className="size-7 grid place-items-center rounded bg-muted" title={t("cancel")}>
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <span className="flex-1 truncate">{tName(a)}</span>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase", typeColor[a.type])}>
                {tType(a.type)}
              </span>
              <span className="text-[10px] text-muted-foreground w-12 text-end shrink-0">
                {a.nature === "debit" ? t("natureDebit") : t("natureCredit")}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => startAddChild(a.code)} className="size-7 grid place-items-center rounded hover:bg-primary/20 text-primary" title={t("addSubAccount")}>
                  <Plus className="size-4" />
                </button>
                <button onClick={() => startEdit(a)} className="size-7 grid place-items-center rounded hover:bg-muted" title={t("editName")}>
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => deleteAccount(a.code)} className="size-7 grid place-items-center rounded hover:bg-destructive/20 text-destructive" title={t("deleteAccount")}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {addingUnder === a.code && (
          <div
            className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-primary/5 border border-primary/30"
            style={{ paddingInlineStart: `${(depth + 1) * 20 + 12}px` }}
          >
            <input
              value={newAr}
              onChange={(e) => setNewAr(e.target.value)}
              placeholder="اسم عربي"
              className="flex-1 h-8 px-2 rounded bg-background border border-border text-sm"
              autoFocus
            />
            <input
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              placeholder="English name"
              className="flex-1 h-8 px-2 rounded bg-background border border-border text-sm"
            />
            <button onClick={commitAdd} className="size-7 grid place-items-center rounded bg-primary text-primary-foreground">
              <Check className="size-4" />
            </button>
            <button onClick={() => setAddingUnder(null)} className="size-7 grid place-items-center rounded bg-muted">
              <X className="size-4" />
            </button>
          </div>
        )}

        {hasKids && isOpen && <div className="mt-1 space-y-1">{a.children!.map((c) => renderRow(c, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl gradient-primary grid place-items-center glow-primary">
                <BookOpen className="size-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t("chartOfAccounts")}</h1>
                <p className="text-sm text-muted-foreground">{t("chartOfAccountsSubtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                className="h-10 px-3 rounded-lg bg-card border border-border text-sm w-64"
              />
              <button
                onClick={startAddRoot}
                className="h-10 px-4 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 glow-primary"
              >
                <Plus className="size-4" /> {t("addRootAccount")}
              </button>
              <button
                onClick={resetDefaults}
                className="h-10 px-3 rounded-lg bg-card border border-border text-sm flex items-center gap-2 hover:bg-muted"
                title={t("resetToDefault")}
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </header>

          {addingUnder === "__root__" && (
            <div className="glass-card rounded-xl p-3 flex items-center gap-2 border border-primary/30">
              <input
                value={newAr}
                onChange={(e) => setNewAr(e.target.value)}
                placeholder="اسم عربي"
                className="flex-1 h-9 px-3 rounded bg-background border border-border text-sm"
                autoFocus
              />
              <input
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                placeholder="English name"
                className="flex-1 h-9 px-3 rounded bg-background border border-border text-sm"
              />
              <button onClick={commitAdd} className="h-9 px-3 rounded bg-primary text-primary-foreground text-sm font-semibold">
                {t("save")}
              </button>
              <button onClick={() => setAddingUnder(null)} className="h-9 px-3 rounded bg-muted text-sm">
                {t("cancel")}
              </button>
            </div>
          )}

          <div className="glass-card rounded-2xl p-4 space-y-1">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">{t("noResults")}</p>
            ) : (
              pg.pageItems.map((a) => renderRow(a))
            )}
            <PaginationBar page={pg.page} totalPages={pg.totalPages} total={pg.total} from={pg.from} to={pg.to} onPageChange={pg.setPage} showAll={pg.showAll} onToggleShowAll={pg.toggleShowAll} />
          </div>
        </main>
      </div>
    </div>
  );
}
