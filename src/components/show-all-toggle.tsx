import { List, LayoutList } from "lucide-react";
import { useApp } from "@/lib/app-context";

interface Props {
  showAll: boolean;
  total: number;
  onToggle: () => void;
}

/**
 * Compact toggle placed at the top of module listings to switch between
 * paginated view and showing all records on a single page (for bulk
 * select-all + delete operations across the entire dataset).
 */
export function ShowAllToggle({ showAll, total, onToggle }: Props) {
  const { lang, fmt } = useApp();
  const ar = lang === "ar";
  if (total === 0) return null;
  const label = showAll
    ? ar ? "عرض مقسم على صفحات" : "Paginate"
    : ar ? `عرض الكل في صفحة واحدة (${fmt(total)})` : `Show all on one page (${fmt(total)})`;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={showAll}
      className={[
        "h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition border",
        showAll
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border hover:bg-muted",
      ].join(" ")}
    >
      {showAll ? <LayoutList className="size-3.5" /> : <List className="size-3.5" />}
      {label}
    </button>
  );
}
