import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { BookOpen, Plus, RotateCcw, ChevronDown, ChevronRight, Check, X, Pencil, Trash2 } from "lucide-react";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { u as usePagination, P as PaginationBar } from "./use-pagination-DIgFAfhb.js";
import { w as useApp, z as useOrgStorage, D as DEFAULT_CHART, g as cn } from "./router-CH3R9Cfm.js";
import { toast } from "sonner";
import "@tanstack/react-router";
import "./client-bowce4Dj.js";
import "@supabase/supabase-js";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "class-variance-authority";
import "@radix-ui/react-select";
import "@tanstack/react-query";
import "date-fns";
import "date-fns/locale/ar";
import "clsx";
import "tailwind-merge";
import "react-day-picker";
import "@radix-ui/react-slot";
import "@radix-ui/react-popover";
import "react-dom";
const typeColor = {
  assets: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  liabilities: "text-rose-500 bg-rose-500/10 border-rose-500/30",
  equity: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  revenue: "text-sky-500 bg-sky-500/10 border-sky-500/30",
  expenses: "text-violet-500 bg-violet-500/10 border-violet-500/30"
};
function cloneTree(tree) {
  return tree.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : void 0
  }));
}
function updateNode(tree, code, fn) {
  return tree.map((n) => {
    if (n.code === code) return fn({
      ...n,
      children: n.children ? cloneTree(n.children) : void 0
    });
    if (n.children) return {
      ...n,
      children: updateNode(n.children, code, fn)
    };
    return n;
  });
}
function removeNode(tree, code) {
  return tree.filter((n) => n.code !== code).map((n) => n.children ? {
    ...n,
    children: removeNode(n.children, code)
  } : n);
}
function nextRootCode(tree) {
  const nums = tree.map((n) => parseInt(n.code, 10)).filter((x) => !Number.isNaN(x));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}
function nextChildCode(parent) {
  const kids = parent.children ?? [];
  if (kids.length === 0) return `${parent.code}01`;
  const max = kids.reduce((m, k) => {
    const suffix = k.code.startsWith(parent.code) ? k.code.slice(parent.code.length) : "";
    const n = parseInt(suffix, 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  const width = Math.max(2, String(max + 1).length);
  return `${parent.code}${String(max + 1).padStart(width, "0")}`;
}
function ChartOfAccountsPage() {
  const {
    t,
    lang
  } = useApp();
  const [chart, setChart] = useOrgStorage("pl_chart_of_accounts", DEFAULT_CHART);
  const [open, setOpen] = useState({
    "1": true,
    "2": true,
    "3": true,
    "4": true,
    "5": true
  });
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [editAr, setEditAr] = useState("");
  const [editEn, setEditEn] = useState("");
  const [addingUnder, setAddingUnder] = useState(null);
  const [newAr, setNewAr] = useState("");
  const [newEn, setNewEn] = useState("");
  const tName = (a) => lang === "ar" ? a.nameAr : a.nameEn;
  const tType = (type) => t(type);
  const filtered = useMemo(() => {
    if (!query.trim()) return chart;
    const q = query.toLowerCase();
    const match = (a) => {
      const kids = a.children?.map(match).filter(Boolean);
      const hit = a.code.includes(q) || a.nameAr.toLowerCase().includes(q) || a.nameEn.toLowerCase().includes(q);
      if (hit || kids && kids.length) return {
        ...a,
        children: kids
      };
      return null;
    };
    return chart.map(match).filter(Boolean);
  }, [query, chart]);
  const pg = usePagination(filtered);
  const startEdit = (a) => {
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
      nameEn: editEn.trim() || n.nameEn
    })));
    setEditing(null);
    toast.success(t("save"));
  };
  const startAddChild = (parentCode) => {
    setAddingUnder(parentCode);
    setNewAr("");
    setNewEn("");
    setOpen((p) => ({
      ...p,
      [parentCode]: true
    }));
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
      const node = {
        code,
        nameAr: ar || en,
        nameEn: en || ar,
        type: "assets",
        nature: "debit",
        children: []
      };
      setChart((prev) => [...prev, node]);
    } else if (addingUnder) {
      setChart((prev) => updateNode(prev, addingUnder, (parent) => {
        const code = nextChildCode(parent);
        const child = {
          code,
          nameAr: ar || en,
          nameEn: en || ar,
          type: parent.type,
          nature: parent.nature
        };
        return {
          ...parent,
          children: [...parent.children ?? [], child]
        };
      }));
    }
    setAddingUnder(null);
    toast.success(t("save"));
  };
  const deleteAccount = (code) => {
    if (!confirm(t("confirmDeleteAccount"))) return;
    setChart((prev) => removeNode(prev, code));
    toast.success(t("deleteAccount"));
  };
  const resetDefaults = () => {
    if (!confirm(t("resetToDefault") + "?")) return;
    setChart(cloneTree(DEFAULT_CHART));
  };
  const renderRow = (a, depth = 0) => {
    const hasKids = !!a.children?.length;
    const isOpen = open[a.code] ?? true;
    const isEditing = editing === a.code;
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: cn("group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition border border-transparent", depth === 0 && "bg-card/50 border-border font-semibold"), style: {
        paddingInlineStart: `${depth * 20 + 12}px`
      }, children: [
        /* @__PURE__ */ jsx("button", { onClick: () => hasKids && setOpen((p) => ({
          ...p,
          [a.code]: !isOpen
        })), className: cn("size-5 grid place-items-center rounded shrink-0", !hasKids && "invisible"), children: isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "size-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "size-4" }) }),
        /* @__PURE__ */ jsx("span", { className: "tabular text-xs font-mono text-muted-foreground w-14 shrink-0", children: a.code }),
        isEditing ? /* @__PURE__ */ jsxs("div", { className: "flex-1 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("input", { value: editAr, onChange: (e) => setEditAr(e.target.value), placeholder: "عربي", className: "flex-1 h-8 px-2 rounded bg-background border border-border text-sm", autoFocus: true }),
          /* @__PURE__ */ jsx("input", { value: editEn, onChange: (e) => setEditEn(e.target.value), placeholder: "English", className: "flex-1 h-8 px-2 rounded bg-background border border-border text-sm" }),
          /* @__PURE__ */ jsx("button", { onClick: commitEdit, className: "size-7 grid place-items-center rounded bg-primary text-primary-foreground", title: t("save"), children: /* @__PURE__ */ jsx(Check, { className: "size-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => setEditing(null), className: "size-7 grid place-items-center rounded bg-muted", title: t("cancel"), children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("span", { className: "flex-1 truncate", children: tName(a) }),
          /* @__PURE__ */ jsx("span", { className: cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase", typeColor[a.type]), children: tType(a.type) }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground w-12 text-end shrink-0", children: a.nature === "debit" ? t("natureDebit") : t("natureCredit") }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => startAddChild(a.code), className: "size-7 grid place-items-center rounded hover:bg-primary/20 text-primary", title: t("addSubAccount"), children: /* @__PURE__ */ jsx(Plus, { className: "size-4" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => startEdit(a), className: "size-7 grid place-items-center rounded hover:bg-muted", title: t("editName"), children: /* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => deleteAccount(a.code), className: "size-7 grid place-items-center rounded hover:bg-destructive/20 text-destructive", title: t("deleteAccount"), children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }) })
          ] })
        ] })
      ] }),
      addingUnder === a.code && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1 p-2 rounded-lg bg-primary/5 border border-primary/30", style: {
        paddingInlineStart: `${(depth + 1) * 20 + 12}px`
      }, children: [
        /* @__PURE__ */ jsx("input", { value: newAr, onChange: (e) => setNewAr(e.target.value), placeholder: "اسم عربي", className: "flex-1 h-8 px-2 rounded bg-background border border-border text-sm", autoFocus: true }),
        /* @__PURE__ */ jsx("input", { value: newEn, onChange: (e) => setNewEn(e.target.value), placeholder: "English name", className: "flex-1 h-8 px-2 rounded bg-background border border-border text-sm" }),
        /* @__PURE__ */ jsx("button", { onClick: commitAdd, className: "size-7 grid place-items-center rounded bg-primary text-primary-foreground", children: /* @__PURE__ */ jsx(Check, { className: "size-4" }) }),
        /* @__PURE__ */ jsx("button", { onClick: () => setAddingUnder(null), className: "size-7 grid place-items-center rounded bg-muted", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
      ] }),
      hasKids && isOpen && /* @__PURE__ */ jsx("div", { className: "mt-1 space-y-1", children: a.children.map((c) => renderRow(c, depth + 1)) })
    ] }, a.code);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen w-full", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 p-6 lg:p-8 space-y-6", children: [
        /* @__PURE__ */ jsxs("header", { className: "flex items-start justify-between gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "size-12 rounded-xl gradient-primary grid place-items-center glow-primary", children: /* @__PURE__ */ jsx(BookOpen, { className: "size-6 text-primary-foreground" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: t("chartOfAccounts") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("chartOfAccountsSubtitle") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("search"), className: "h-10 px-3 rounded-lg bg-card border border-border text-sm w-64" }),
            /* @__PURE__ */ jsxs("button", { onClick: startAddRoot, className: "h-10 px-4 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 glow-primary", children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " ",
              t("addRootAccount")
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: resetDefaults, className: "h-10 px-3 rounded-lg bg-card border border-border text-sm flex items-center gap-2 hover:bg-muted", title: t("resetToDefault"), children: /* @__PURE__ */ jsx(RotateCcw, { className: "size-4" }) })
          ] })
        ] }),
        addingUnder === "__root__" && /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-xl p-3 flex items-center gap-2 border border-primary/30", children: [
          /* @__PURE__ */ jsx("input", { value: newAr, onChange: (e) => setNewAr(e.target.value), placeholder: "اسم عربي", className: "flex-1 h-9 px-3 rounded bg-background border border-border text-sm", autoFocus: true }),
          /* @__PURE__ */ jsx("input", { value: newEn, onChange: (e) => setNewEn(e.target.value), placeholder: "English name", className: "flex-1 h-9 px-3 rounded bg-background border border-border text-sm" }),
          /* @__PURE__ */ jsx("button", { onClick: commitAdd, className: "h-9 px-3 rounded bg-primary text-primary-foreground text-sm font-semibold", children: t("save") }),
          /* @__PURE__ */ jsx("button", { onClick: () => setAddingUnder(null), className: "h-9 px-3 rounded bg-muted text-sm", children: t("cancel") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 space-y-1", children: [
          filtered.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-muted-foreground py-12", children: t("noResults") }) : pg.pageItems.map((a) => renderRow(a)),
          /* @__PURE__ */ jsx(PaginationBar, { page: pg.page, totalPages: pg.totalPages, total: pg.total, from: pg.from, to: pg.to, onPageChange: pg.setPage, showAll: pg.showAll, onToggleShowAll: pg.toggleShowAll })
        ] })
      ] })
    ] })
  ] });
}
export {
  ChartOfAccountsPage as component
};
