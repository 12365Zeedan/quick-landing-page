import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Lock,
  ScanLine,
  Smartphone,
  Sparkles,
  TrendingUp,
  Zap,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Features — PharmLedger" },
      {
        name: "description",
        content: "Upcoming AI-powered forecasting, insights and automation for your pharmacy.",
      },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  const { t, dir, lang } = useApp();

  const features = [
    {
      key: "aiForecast",
      descKey: "aiForecastDesc",
      icon: TrendingUp,
      tint: "from-primary/30 to-primary/5",
      eta: lang === "ar" ? "الربع الثالث 2026" : "Q3 2026",
    },
    {
      key: "smartInsights",
      descKey: "smartInsightsDesc",
      icon: Sparkles,
      tint: "from-secondary/30 to-secondary/5",
      eta: lang === "ar" ? "الربع الثالث 2026" : "Q3 2026",
    },
    {
      key: "barcodeScanner",
      descKey: "barcodeScannerDesc",
      icon: ScanLine,
      tint: "from-emerald-500/30 to-emerald-500/5",
      eta: lang === "ar" ? "الربع الرابع 2026" : "Q4 2026",
    },
    {
      key: "multiBranchRollup",
      descKey: "multiBranchRollupDesc",
      icon: Layers,
      tint: "from-amber-500/30 to-amber-500/5",
      eta: lang === "ar" ? "الربع الرابع 2026" : "Q4 2026",
    },
    {
      key: "mobileApp",
      descKey: "mobileAppDesc",
      icon: Smartphone,
      tint: "from-fuchsia-500/30 to-fuchsia-500/5",
      eta: "2027",
    },
  ] as const;

  return (
    <div className="min-h-screen flex bg-background" dir={dir}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-4 lg:px-8 py-6 space-y-8">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-background to-card p-8 lg:p-10">
            <div
              aria-hidden
              className="absolute -top-20 -end-10 size-72 rounded-full gradient-primary opacity-25 blur-3xl"
            />
            <div className="relative max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-xs font-medium">
                <Zap className="size-3.5 text-primary" />
                {t("comingSoon")}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                {t("aiCenter")}
              </h1>
              <p className="text-muted-foreground">{t("aiSubtitle")}</p>
            </div>
          </section>

          {/* Feature grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {features.map((f) => (
              <article
                key={f.key}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg",
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-60 group-hover:opacity-100 transition-opacity",
                    f.tint,
                  )}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-card/70 backdrop-blur-[2px]"
                />
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="size-11 rounded-xl bg-background/70 border border-border/60 grid place-items-center">
                      <f.icon className="size-5 text-primary" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-semibold border border-amber-500/30">
                      <Lock className="size-3" />
                      {t("comingSoon")}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg leading-tight">
                      {t(f.key as never)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(f.descKey as never)}
                    </p>
                  </div>

                  {/* Locked preview */}
                  <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{lang === "ar" ? "معاينة" : "Preview"}</span>
                      <BarChart3 className="size-3" />
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {[40, 60, 35, 75, 55, 80, 65, 90].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-primary/10"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      ETA · {f.eta}
                    </span>
                    <button
                      onClick={() => toast.success(t("notifyAdded"))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <Bell className="size-3.5" />
                      {t("notifyMe")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
