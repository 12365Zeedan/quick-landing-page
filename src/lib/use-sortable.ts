import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";
export type Getter<T> = (item: T) => string | number | Date | null | undefined;

/**
 * Generic, client-side sorting. Pass a map of column-key → value getter.
 * Cycles through asc → desc → none on repeated clicks of the same column.
 */
export function useSortable<T>(
  items: T[],
  getters: Record<string, Getter<T>>,
  initial?: { key: string; dir: SortDir },
) {
  const [sortKey, setSortKey] = useState<string | null>(initial?.key ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(initial?.dir ?? "asc");

  const toggle = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    if (sortDir === "asc") {
      setSortDir("desc");
      return;
    }
    setSortKey(null);
    setSortDir("asc");
  };

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    const get = getters[sortKey];
    if (!get) return items;
    const sign = sortDir === "asc" ? 1 : -1;
    const arr = [...items];
    arr.sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va instanceof Date || vb instanceof Date) {
        const na = va instanceof Date ? va.getTime() : new Date(va as string).getTime();
        const nb = vb instanceof Date ? vb.getTime() : new Date(vb as string).getTime();
        return (na - nb) * sign;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * sign;
    });
    return arr;
  }, [items, sortKey, sortDir, getters]);

  return { sorted, sortKey, sortDir, toggle };
}
