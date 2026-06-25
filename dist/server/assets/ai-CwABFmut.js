import { jsxs, jsx } from "react/jsx-runtime";
import { Zap, TrendingUp, Sparkles, ScanLine, Layers, Smartphone, Lock, BarChart3, Bell } from "lucide-react";
import { toast } from "sonner";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { w as useApp, g as cn } from "./router-CH3R9Cfm.js";
import "react";
import "@tanstack/react-router";
import "./client-bowce4Dj.js";
import "@supabase/supabase-js";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "class-variance-authority";
import "@radix-ui/react-select";
import "@tanstack/react-query";
import "date-fns";
import "date-fns/locale/ar";
import "clsx";
import "tailwind-merge";
import "react-day-picker";
import "@radix-ui/react-slot";
import "@radix-ui/react-popover";
import "react-dom";
function AiPage() {
  const {
    t,
    dir,
    lang
  } = useApp();
  const features = [{
    key: "aiForecast",
    descKey: "aiForecastDesc",
    icon: TrendingUp,
    tint: "from-primary/30 to-primary/5",
    eta: lang === "ar" ? "الربع الثالث 2026" : "Q3 2026"
  }, {
    key: "smartInsights",
    descKey: "smartInsightsDesc",
    icon: Sparkles,
    tint: "from-secondary/30 to-secondary/5",
    eta: lang === "ar" ? "الربع الثالث 2026" : "Q3 2026"
  }, {
    key: "barcodeScanner",
    descKey: "barcodeScannerDesc",
    icon: ScanLine,
    tint: "from-emerald-500/30 to-emerald-500/5",
    eta: lang === "ar" ? "الربع الرابع 2026" : "Q4 2026"
  }, {
    key: "multiBranchRollup",
    descKey: "multiBranchRollupDesc",
    icon: Layers,
    tint: "from-amber-500/30 to-amber-500/5",
    eta: lang === "ar" ? "الربع الرابع 2026" : "Q4 2026"
  }, {
    key: "mobileApp",
    descKey: "mobileAppDesc",
    icon: Smartphone,
    tint: "from-fuchsia-500/30 to-fuchsia-500/5",
    eta: "2027"
  }];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex bg-background", dir, children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "flex-1 px-4 lg:px-8 py-6 space-y-8", children: [
        /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-background to-card p-8 lg:p-10", children: [
          /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "absolute -top-20 -end-10 size-72 rounded-full gradient-primary opacity-25 blur-3xl" }),
          /* @__PURE__ */ jsxs("div", { className: "relative max-w-2xl space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-xs font-medium", children: [
              /* @__PURE__ */ jsx(Zap, { className: "size-3.5 text-primary" }),
              t("comingSoon")
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "text-3xl lg:text-4xl font-bold tracking-tight", children: t("aiCenter") }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("aiSubtitle") })
          ] })
        ] }),
        /* @__PURE__ */ jsx("section", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5", children: features.map((f) => /* @__PURE__ */ jsxs("article", { className: cn("group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg"), children: [
          /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: cn("absolute inset-0 bg-gradient-to-br opacity-60 group-hover:opacity-100 transition-opacity", f.tint) }),
          /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "absolute inset-0 bg-card/70 backdrop-blur-[2px]" }),
          /* @__PURE__ */ jsxs("div", { className: "relative space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsx("div", { className: "size-11 rounded-xl bg-background/70 border border-border/60 grid place-items-center", children: /* @__PURE__ */ jsx(f.icon, { className: "size-5 text-primary" }) }),
              /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-semibold border border-amber-500/30", children: [
                /* @__PURE__ */ jsx(Lock, { className: "size-3" }),
                t("comingSoon")
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg leading-tight", children: t(f.key) }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: t(f.descKey) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-border/60 bg-background/60 p-3 space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { children: lang === "ar" ? "معاينة" : "Preview" }),
                /* @__PURE__ */ jsx(BarChart3, { className: "size-3" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex items-end gap-1 h-12", children: [40, 60, 35, 75, 55, 80, 65, 90].map((h, i) => /* @__PURE__ */ jsx("div", { className: "flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-primary/10", style: {
                height: `${h}%`
              } }, i)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-1", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-muted-foreground", children: [
                "ETA · ",
                f.eta
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => toast.success(t("notifyAdded")), className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors", children: [
                /* @__PURE__ */ jsx(Bell, { className: "size-3.5" }),
                t("notifyMe")
              ] })
            ] })
          ] })
        ] }, f.key)) })
      ] })
    ] })
  ] });
}
export {
  AiPage as component
};
