import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Pill, Sparkles, ShieldCheck, Mail, Lock, EyeOff, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { w as useApp, g as cn } from "./router-CH3R9Cfm.js";
import { s as supabase } from "./client-bowce4Dj.js";
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import "@tanstack/react-query";
import "date-fns";
import "date-fns/locale/ar";
import "clsx";
import "tailwind-merge";
import "react-day-picker";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "@radix-ui/react-popover";
import "react-dom";
import "@supabase/supabase-js";
const lovableAuth = createLovableAuth();
const lovable = {
  auth: {
    signInWithOAuth: async (provider, opts) => {
      const result = await lovableAuth.signInWithOAuth(provider, {
        redirect_uri: opts?.redirect_uri,
        extraParams: {
          ...opts?.extraParams
        }
      });
      if (result.redirected) {
        return result;
      }
      if (result.error) {
        return result;
      }
      try {
        await supabase.auth.setSession(result.tokens);
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
      return result;
    }
  }
};
function LoginPage() {
  const {
    t,
    lang,
    dir,
    toggleLang,
    theme,
    toggleTheme
  } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data
    }) => {
      if (data.session) navigate({
        to: "/"
      });
    });
  }, [navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const {
          error
        } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        toast.success(lang === "ar" ? "تم إنشاء الحساب — يرجى تأكيد بريدك" : "Account created — please verify your email");
        setMode("signin");
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        toast.success(t("signedIn"));
        navigate({
          to: "/"
        });
      }
    } catch (err) {
      toast.error(err.message || t("invalidCreds"));
    } finally {
      setLoading(false);
    }
  };
  const handleSocial = async (provider) => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin
      });
      if (result.error) throw new Error(result.error.message || "OAuth failed");
      if (result.redirected) return;
      toast.success(t("signedIn"));
      navigate({
        to: "/"
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen grid lg:grid-cols-2 bg-background text-foreground", dir, children: [
    /* @__PURE__ */ jsxs("div", { className: "relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-sidebar via-card to-background border-e border-sidebar-border", children: [
      /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "absolute -top-32 -end-32 size-[28rem] rounded-full gradient-primary opacity-30 blur-3xl" }),
      /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "absolute -bottom-40 -start-20 size-[24rem] rounded-full bg-secondary/40 blur-3xl" }),
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-3 relative z-10 w-fit", children: [
        /* @__PURE__ */ jsx("div", { className: "size-11 rounded-xl gradient-primary grid place-items-center glow-primary", children: /* @__PURE__ */ jsx(Pill, { className: "size-5 text-primary-foreground", strokeWidth: 2.5 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-bold text-lg leading-tight", children: t("appName") }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: t("tagline") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-6 max-w-md", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs font-medium", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "size-3.5 text-primary" }),
          t("trustedBy")
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold leading-tight", children: lang === "ar" ? "إدارة مالية احترافية لصيدليتك في مكان واحد." : "Professional financial control for your pharmacy, all in one place." }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: [{
          v: "12K+",
          l: lang === "ar" ? "فاتورة شهرياً" : "Invoices / mo"
        }, {
          v: "99.9%",
          l: lang === "ar" ? "وقت تشغيل" : "Uptime"
        }, {
          v: "ZATCA",
          l: lang === "ar" ? "متوافق" : "Compliant"
        }].map((s) => /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-xl p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-primary", children: s.v }),
          /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: s.l })
        ] }, s.l)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 text-xs text-muted-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "size-3.5 text-primary" }),
        lang === "ar" ? "تشفير من الطرف إلى الطرف وحماية على مستوى المؤسسات." : "End-to-end encryption with enterprise-grade security."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/", className: "lg:hidden flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "size-9 rounded-lg gradient-primary grid place-items-center", children: /* @__PURE__ */ jsx(Pill, { className: "size-4 text-primary-foreground" }) }),
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: t("appName") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "ms-auto flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("button", { onClick: toggleLang, className: "px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 hover:bg-accent transition-colors", children: lang === "ar" ? "EN" : "ع" }),
          /* @__PURE__ */ jsx("button", { onClick: toggleTheme, className: "size-8 grid place-items-center rounded-lg border border-border/60 hover:bg-accent transition-colors", "aria-label": "Toggle theme", children: theme === "dark" ? "🌙" : "☀️" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 grid place-items-center px-6 py-8", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md space-y-7", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: t("signInTitle") }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("signInSubtitle") })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground/80", children: lang === "ar" ? mode === "signup" ? "أنشئ حسابك للبدء — سيتم تعيينك ككاشير افتراضياً." : "سجّل دخولك بالحساب الذي أنشأته في Lovable Cloud." : mode === "signup" ? "Create your account — you'll be assigned cashier role by default." : "Sign in with the account you created in Lovable Cloud." }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => handleSocial("google"), disabled: loading, className: "inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50", children: [
            /* @__PURE__ */ jsx(GoogleIcon, {}),
            "Google"
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => handleSocial("apple"), disabled: loading, className: "inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50", children: [
            /* @__PURE__ */ jsx(AppleIcon, {}),
            "Apple"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 top-1/2 h-px bg-border" }),
          /* @__PURE__ */ jsx("span", { className: "relative bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground", children: t("orContinueWith") })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: t("email") }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Mail, { className: cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3") }),
              /* @__PURE__ */ jsx("input", { type: "email", required: true, autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), className: cn("w-full bg-card/60 border border-border/60 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent", dir === "rtl" ? "pe-10 ps-3" : "ps-10 pe-3"), placeholder: "you@pharmacy.com" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: t("password") }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => toast.info(t("forgotPassword")), className: "text-xs text-primary hover:underline", children: t("forgotPassword") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Lock, { className: cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3") }),
              /* @__PURE__ */ jsx("input", { type: showPassword ? "text" : "password", required: true, autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), className: cn("w-full bg-card/60 border border-border/60 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent", dir === "rtl" ? "pe-10 ps-10" : "ps-10 pe-10"), placeholder: "••••••••" }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPassword((v) => !v), className: cn("absolute top-1/2 -translate-y-1/2 size-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground", dir === "rtl" ? "left-1.5" : "right-1.5"), "aria-label": "Toggle password visibility", children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "size-4" }) : /* @__PURE__ */ jsx(Eye, { className: "size-4" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm select-none cursor-pointer", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: remember, onChange: (e) => setRemember(e.target.checked), className: "size-4 rounded border-border accent-primary" }),
            t("rememberMe")
          ] }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading, className: "w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm glow-primary hover:opacity-95 transition-opacity disabled:opacity-60", children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }) : mode === "signup" ? lang === "ar" ? "إنشاء حساب" : "Create account" : t("signIn") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center text-sm text-muted-foreground", children: [
          mode === "signin" ? t("noAccount") : lang === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?",
          " ",
          /* @__PURE__ */ jsx("button", { onClick: () => setMode(mode === "signin" ? "signup" : "signin"), className: "text-primary font-medium hover:underline", children: mode === "signin" ? lang === "ar" ? "إنشاء حساب" : "Create one" : lang === "ar" ? "تسجيل الدخول" : "Sign in" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 text-[11px] text-muted-foreground text-center border-t border-border/40", children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " ",
        t("appName"),
        " · ",
        t("tagline")
      ] })
    ] })
  ] });
}
function GoogleIcon() {
  return /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "size-4", "aria-hidden": true, children: /* @__PURE__ */ jsx("path", { fill: "#EA4335", d: "M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1S8.7 5.9 12 5.9c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" }) });
}
function AppleIcon() {
  return /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "size-4 fill-current", "aria-hidden": true, children: /* @__PURE__ */ jsx("path", { d: "M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.4 1-4.3 2.6-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.3 2.7 1.3-.1 1.8-.9 3.4-.9s2 .9 3.4.8c1.4 0 2.3-1.3 3.2-2.6.7-1 1.4-2.1 1.7-3.4-2.1-.8-2.2-3.7-2.2-3.8zm-2.6-7c.7-.9 1.2-2.1 1.1-3.4-1 .1-2.3.7-3 1.6-.6.8-1.2 2-1.1 3.3 1.2.1 2.4-.6 3-1.5z" }) });
}
export {
  LoginPage as component
};
