import { useState, useMemo } from "react";
import { jsxs, jsx } from "react/jsx-runtime";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { g as cn } from "./router-CH3R9Cfm.js";
function useSortable(items, getters, initial) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const toggle = (key) => {
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
        const na = va instanceof Date ? va.getTime() : new Date(va).getTime();
        const nb = vb instanceof Date ? vb.getTime() : new Date(vb).getTime();
        return (na - nb) * sign;
      }
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
      return String(va).localeCompare(String(vb), void 0, { numeric: true }) * sign;
    });
    return arr;
  }, [items, sortKey, sortDir, getters]);
  return { sorted, sortKey, sortDir, toggle };
}
function SortHeader({
  sortKey,
  currentKey,
  currentDir,
  onSort,
  align = "start",
  children,
  className
}) {
  const active = currentKey === sortKey;
  const Icon = !active ? ArrowUpDown : currentDir === "asc" ? ArrowUp : ArrowDown;
  const justify = align === "end" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: () => onSort(sortKey),
      className: cn(
        "inline-flex items-center gap-1.5 w-full select-none hover:text-foreground transition",
        justify,
        active && "text-foreground",
        className
      ),
      children: [
        /* @__PURE__ */ jsx("span", { children }),
        /* @__PURE__ */ jsx(Icon, { className: cn("size-3 shrink-0", active ? "opacity-100" : "opacity-40") })
      ]
    }
  );
}
export {
  SortHeader as S,
  useSortable as u
};
