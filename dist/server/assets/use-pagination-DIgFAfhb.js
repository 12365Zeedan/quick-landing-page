import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { LayoutList, List, ChevronsRight, ChevronsLeft, ChevronRight, ChevronLeft } from "lucide-react";
import { w as useApp, B as Button } from "./router-CH3R9Cfm.js";
import { useState, useEffect, useMemo, useCallback } from "react";
function PaginationBar({ page, totalPages, total, from, to, onPageChange, showAll, onToggleShowAll }) {
  const { lang } = useApp();
  const ar = lang === "ar";
  if (total === 0) return null;
  const label = showAll ? ar ? `عرض الكل (${total})` : `Showing all (${total})` : ar ? `عرض ${from}–${to} من ${total}` : `Showing ${from}–${to} of ${total}`;
  const pageLabel = ar ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`;
  const toggleLabel = showAll ? ar ? "عرض مقسم على صفحات" : "Paginate" : ar ? "عرض الكل في صفحة واحدة" : "Show all on one page";
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/40 text-sm text-muted-foreground", children: [
    /* @__PURE__ */ jsx("span", { children: label }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      onToggleShowAll && /* @__PURE__ */ jsxs(
        Button,
        {
          variant: showAll ? "default" : "outline",
          size: "sm",
          className: "h-8 gap-1.5",
          onClick: onToggleShowAll,
          "aria-pressed": showAll,
          title: toggleLabel,
          children: [
            showAll ? /* @__PURE__ */ jsx(LayoutList, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(List, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: toggleLabel })
          ]
        }
      ),
      !showAll && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: pageLabel }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "icon",
              className: "h-8 w-8",
              onClick: () => onPageChange(1),
              disabled: page <= 1,
              "aria-label": "First page",
              children: ar ? /* @__PURE__ */ jsx(ChevronsRight, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronsLeft, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "icon",
              className: "h-8 w-8",
              onClick: () => onPageChange(page - 1),
              disabled: page <= 1,
              "aria-label": "Previous page",
              children: ar ? /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "icon",
              className: "h-8 w-8",
              onClick: () => onPageChange(page + 1),
              disabled: page >= totalPages,
              "aria-label": "Next page",
              children: ar ? /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              size: "icon",
              className: "h-8 w-8",
              onClick: () => onPageChange(totalPages),
              disabled: page >= totalPages,
              "aria-label": "Last page",
              children: ar ? /* @__PURE__ */ jsx(ChevronsLeft, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronsRight, { className: "h-4 w-4" })
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function usePagination(items, pageSize = 25) {
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const total = items.length;
  const effectivePageSize = showAll ? Math.max(total, 1) : pageSize;
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);
  const pageItems = useMemo(() => {
    if (showAll) return items;
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize, showAll]);
  const toggleShowAll = useCallback(() => {
    setShowAll((v) => !v);
    setPage(1);
  }, []);
  return {
    page,
    setPage,
    pageSize: effectivePageSize,
    total,
    totalPages,
    pageItems,
    from: total === 0 ? 0 : showAll ? 1 : (page - 1) * pageSize + 1,
    to: showAll ? total : Math.min(total, page * pageSize),
    showAll,
    toggleShowAll
  };
}
export {
  PaginationBar as P,
  usePagination as u
};
