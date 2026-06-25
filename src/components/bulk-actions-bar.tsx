import { Trash2, X, CheckSquare } from "lucide-react";
import { useApp } from "@/lib/app-context";

export function BulkActionsBar({
  count,
  total,
  allSelected,
  onSelectAll,
  onClear,
  onDelete,
}: {
  count: number;
  total: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onDelete: () => void;
}) {
  const { t, fmt } = useApp();
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 animate-fade-in">
      <div className="text-sm font-medium">
        <span className="text-gradient font-bold tabular">{fmt(count)}</span>{" "}
        <span className="text-muted-foreground">/ {fmt(total)} {t("selectedRows")}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          className="h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-card border border-border hover:bg-muted transition"
        >
          <CheckSquare className="size-3.5" />
          {allSelected ? t("deselectAll") : t("selectAll")}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 bg-card border border-border hover:bg-muted transition"
        >
          <X className="size-3.5" />
          {t("clearSelection")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-destructive/15 text-destructive border border-destructive/40 hover:bg-destructive/25 transition"
        >
          <Trash2 className="size-3.5" />
          {t("deleteSelected")}
        </button>
      </div>
    </div>
  );
}
