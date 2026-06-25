import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/lib/use-sortable";

interface SortHeaderProps {
  sortKey: string;
  currentKey: string | null;
  currentDir: SortDir;
  onSort: (key: string) => void;
  align?: "start" | "end" | "center";
  children: React.ReactNode;
  className?: string;
}

/** Clickable column header that toggles sort direction and shows a chevron. */
export function SortHeader({
  sortKey,
  currentKey,
  currentDir,
  onSort,
  align = "start",
  children,
  className,
}: SortHeaderProps) {
  const active = currentKey === sortKey;
  const Icon = !active ? ArrowUpDown : currentDir === "asc" ? ArrowUp : ArrowDown;
  const justify =
    align === "end" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1.5 w-full select-none hover:text-foreground transition",
        justify,
        active && "text-foreground",
        className,
      )}
    >
      <span>{children}</span>
      <Icon className={cn("size-3 shrink-0", active ? "opacity-100" : "opacity-40")} />
    </button>
  );
}
