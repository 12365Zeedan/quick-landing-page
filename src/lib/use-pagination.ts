import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Generic client-side pagination. Default 25 per page.
 * Returns the slice for the current page plus paging controls.
 *
 * Supports a "show all" mode that displays every item on a single page —
 * useful for bulk select-all + delete operations across the full dataset.
 */
export function usePagination<T>(items: T[], pageSize = 25) {
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const total = items.length;
  const effectivePageSize = showAll ? Math.max(total, 1) : pageSize;
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(total / pageSize));

  // Reset to first page whenever the underlying list shrinks below current page.
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
    toggleShowAll,
  };
}
