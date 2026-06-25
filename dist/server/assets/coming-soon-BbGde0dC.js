import { jsxs, jsx } from "react/jsx-runtime";
import { Construction } from "lucide-react";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { w as useApp } from "./router-CH3R9Cfm.js";
function ComingSoon({ titleKey }) {
  const { t } = useApp();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1 grid place-items-center px-6 py-12", children: /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-3xl p-10 text-center max-w-md animate-fade-in", children: [
        /* @__PURE__ */ jsx("div", { className: "size-16 rounded-2xl gradient-primary grid place-items-center mx-auto mb-5 glow-primary", children: /* @__PURE__ */ jsx(Construction, { className: "size-7 text-primary-foreground" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-2", children: t(titleKey) }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          t("appName"),
          " — coming soon · قريباً"
        ] })
      ] }) })
    ] })
  ] });
}
export {
  ComingSoon as C
};
