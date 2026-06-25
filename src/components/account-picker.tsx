import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useOrg } from "@/lib/org-context";
import { flattenChart, loadChartFor, type Account, type AccountType } from "@/lib/journal";
import { cn } from "@/lib/utils";

interface Props {
  value?: string;
  onChange: (code: string | undefined) => void;
  /** Only show leaf accounts of these types (e.g. ["expenses"]). */
  filterTypes?: AccountType[];
  placeholder?: string;
  className?: string;
}

export function AccountPicker({ value, onChange, filterTypes, placeholder, className }: Props) {
  const { lang, t } = useApp();
  const { currentOrg } = useOrg();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const allAccounts = useMemo(() => {
    const flat = flattenChart(loadChartFor(currentOrg?.id));
    // leaves only (no children)
    const leaves = flat.filter((a) => !a.children || a.children.length === 0);
    return filterTypes ? leaves.filter((a) => filterTypes.includes(a.type)) : leaves;
  }, [currentOrg?.id, filterTypes]);

  const selected: Account | undefined = useMemo(
    () => allAccounts.find((a) => a.code === value),
    [allAccounts, value],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return allAccounts;
    return allAccounts.filter(
      (a) =>
        a.code.toLowerCase().includes(term) ||
        a.nameAr.toLowerCase().includes(term) ||
        a.nameEn.toLowerCase().includes(term),
    );
  }, [allAccounts, q]);

  const display = (a: Account) => `${a.code} — ${lang === "ar" ? a.nameAr : a.nameEn}`;

  return (
    <div className={cn("relative", open && "z-[100]", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-10 px-3 rounded-xl bg-input/40 border border-border text-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        <span className={cn("flex-1 text-start truncate", !selected && "text-muted-foreground")}>
          {selected ? display(selected) : placeholder ?? t("selectAccount")}
        </span>
        {selected && (
          <X
            className="size-4 opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
          />
        )}
        <ChevronDown className="size-4 opacity-60" />
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
            <div
              className="fixed z-[9999] rounded-xl bg-popover border border-border shadow-xl overflow-hidden"
              style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
            >
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search")}
              className="w-full h-10 px-3 border-b border-border bg-transparent text-sm focus:outline-none"
            />
            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">{t("noResults")}</div>
              ) : (
                filtered.map((a) => (
                  <button
                    key={a.code}
                    type="button"
                    onClick={() => {
                      onChange(a.code);
                      setOpen(false);
                      setQ("");
                    }}
                    className={cn(
                      "w-full text-start px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2",
                      a.code === value && "bg-primary/10 text-primary",
                    )}
                  >
                    <span className="font-mono text-xs text-muted-foreground w-14 shrink-0">{a.code}</span>
                    <span className="flex-1 truncate">{lang === "ar" ? a.nameAr : a.nameEn}</span>
                  </button>
                ))
              )}
            </div>
          </div>
          </>,
          document.body,
        )}
    </div>
  );
}
