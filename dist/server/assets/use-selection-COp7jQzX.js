import { jsxs, jsx } from "react/jsx-runtime";
import { CheckSquare, X, Trash2, LayoutList, List } from "lucide-react";
import { w as useApp } from "./router-CH3R9Cfm.js";
import { useState, useEffect, useCallback, useMemo } from "react";
function BulkActionsBar({
  count,
  total,
  allSelected,
  onSelectAll,
  onClear,
  onDelete
}) {
  const { t, fmt } = useApp();
  if (count === 0) return null;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 animate-fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
      /* @__PURE__ */ jsx("span", { className: "text-gradient font-bold tabular", children: fmt(count) }),
      " ",
      /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
        "/ ",
        fmt(total),
        " ",
        t("selectedRows")
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: onSelectAll,
          className: "h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-card border border-border hover:bg-muted transition",
          children: [
            /* @__PURE__ */ jsx(CheckSquare, { className: "size-3.5" }),
            allSelected ? t("deselectAll") : t("selectAll")
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: onClear,
          className: "h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-card border border-border hover:bg-muted transition",
          children: [
            /* @__PURE__ */ jsx(X, { className: "size-3.5" }),
            t("clearSelection")
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: onDelete,
          className: "h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-destructive/15 text-destructive border border-destructive/40 hover:bg-destructive/25 transition",
          children: [
            /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
            t("deleteSelected")
          ]
        }
      )
    ] })
  ] });
}
function ShowAllToggle({ showAll, total, onToggle }) {
  const { lang, fmt } = useApp();
  const ar = lang === "ar";
  if (total === 0) return null;
  const label = showAll ? ar ? "عرض مقسم على صفحات" : "Paginate" : ar ? `عرض الكل في صفحة واحدة (${fmt(total)})` : `Show all on one page (${fmt(total)})`;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: onToggle,
      "aria-pressed": showAll,
      className: [
        "h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition border",
        showAll ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
      ].join(" "),
      children: [
        showAll ? /* @__PURE__ */ jsx(LayoutList, { className: "size-3.5" }) : /* @__PURE__ */ jsx(List, { className: "size-3.5" }),
        label
      ]
    }
  );
}
function useSelection(visibleIds) {
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const allow = new Set(visibleIds);
      let changed = false;
      const next = /* @__PURE__ */ new Set();
      prev.forEach((id) => {
        if (allow.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [visibleIds]);
  const isSelected = useCallback((id) => selected.has(id), [selected]);
  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clear = useCallback(() => setSelected(/* @__PURE__ */ new Set()), []);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = !allSelected && visibleIds.some((id) => selected.has(id));
  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (visibleIds.length > 0 && visibleIds.every((id) => prev.has(id))) {
        return /* @__PURE__ */ new Set();
      }
      return new Set(visibleIds);
    });
  }, [visibleIds]);
  const ids = useMemo(() => Array.from(selected), [selected]);
  return { selected, ids, count: selected.size, isSelected, toggle, toggleAll, clear, allSelected, someSelected };
}
export {
  BulkActionsBar as B,
  ShowAllToggle as S,
  useSelection as u
};
