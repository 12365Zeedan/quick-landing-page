import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  change: number;
  icon: LucideIcon;
  accent?: "primary" | "secondary" | "success" | "warning" | "destructive" | "info";
  suffix?: string;
  delay?: number;
}

const accentMap: Record<NonNullable<KPICardProps["accent"]>, string> = {
  primary: "from-primary/20 to-primary/0 text-primary",
  secondary: "from-secondary/20 to-secondary/0 text-secondary",
  success: "from-success/20 to-success/0 text-success",
  warning: "from-warning/20 to-warning/0 text-warning",
  destructive: "from-destructive/20 to-destructive/0 text-destructive",
  info: "from-info/20 to-info/0 text-info",
};

export function KPICard({
  title,
  value,
  change,
  icon: Icon,
  accent = "primary",
  suffix,
  delay = 0,
}: KPICardProps) {
  const { fmt, t } = useApp();
  const positive = change >= 0;

  return (
    <div
      className="glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in group hover:shadow-glow transition-all duration-300"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none",
          accentMap[accent],
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </div>
          <div
            className={cn(
              "size-10 rounded-xl grid place-items-center bg-background/40 backdrop-blur-sm border border-border/50",
              accentMap[accent].split(" ").pop(),
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-2">
          <div className="text-3xl font-bold tabular tracking-tight animate-count-up">
            {fmt(value)}
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            {suffix ?? t("currency")}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold tabular",
              positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-muted-foreground">{t("vsYesterday")}</span>
        </div>
      </div>
    </div>
  );
}
