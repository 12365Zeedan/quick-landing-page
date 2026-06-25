import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Generic row-selection hook. Pass the currently visible ids; selection is
 * automatically pruned when ids change (filters, pagination, org switch).
 */
export function useSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Prune ids that are no longer visible (e.g., filter narrowed list).
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const allow = new Set(visibleIds);
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (allow.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [visibleIds]);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = !allSelected && visibleIds.some((id) => selected.has(id));

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (visibleIds.length > 0 && visibleIds.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(visibleIds);
    });
  }, [visibleIds]);

  const ids = useMemo(() => Array.from(selected), [selected]);

  return { selected, ids, count: selected.size, isSelected, toggle, toggleAll, clear, allSelected, someSelected };
}
