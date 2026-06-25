import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, List, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  showAll?: boolean;
  onToggleShowAll?: () => void;
}

/**
 * Compact pagination bar used at the bottom of module listings.
 * Shows "X–Y of N" and prev/next + first/last controls.
 * When onToggleShowAll is provided, also exposes a button to display
 * every record on a single page (for bulk select-all + delete).
 */
export function PaginationBar({ page, totalPages, total, from, to, onPageChange, showAll, onToggleShowAll }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  if (total === 0) return null;

  const label = showAll
    ? ar
      ? `عرض الكل (${total})`
      : `Showing all (${total})`
    : ar
      ? `عرض ${from}–${to} من ${total}`
      : `Showing ${from}–${to} of ${total}`;
  const pageLabel = ar ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`;
  const toggleLabel = showAll
    ? ar ? "عرض مقسم على صفحات" : "Paginate"
    : ar ? "عرض الكل في صفحة واحدة" : "Show all on one page";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/40 text-sm text-muted-foreground">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        {onToggleShowAll && (
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={onToggleShowAll}
            aria-pressed={showAll}
            title={toggleLabel}
          >
            {showAll ? <LayoutList className="h-4 w-4" /> : <List className="h-4 w-4" />}
            <span className="hidden sm:inline">{toggleLabel}</span>
          </Button>
        )}
        {!showAll && (
          <>
            <span className="hidden sm:inline">{pageLabel}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
                aria-label="First page"
              >
                {ar ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                {ar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                {ar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages}
                aria-label="Last page"
              >
                {ar ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
