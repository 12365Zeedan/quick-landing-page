import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Wifi, WifiOff, Monitor, Globe, ShieldCheck, HardDrive, FolderOpen, Download, Upload } from "lucide-react";
import { R as RequireAuth } from "./require-auth-0pnMuVtp.js";
import { l as Sidebar, T as Topbar, u as useOnlineStatus } from "./topbar-CywcAnz-.js";
import { l as isDesktop, j as getDataRoot, q as openDataFolder, t as saveBackup, m as loadBackup } from "./router-CH3R9Cfm.js";
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
function exportSnapshot() {
  if (typeof localStorage === "undefined") return "{}";
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (!k.startsWith("pharmledger.") && !k.startsWith("pl_") && !k.startsWith("org.")) continue;
    const v = localStorage.getItem(k);
    try {
      out[k] = v ? JSON.parse(v) : v;
    } catch {
      out[k] = v;
    }
  }
  return JSON.stringify({
    __pharmledger_backup__: true,
    version: 1,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    data: out
  }, null, 2);
}
function importSnapshot(json) {
  const parsed = JSON.parse(json);
  if (!parsed?.__pharmledger_backup__) throw new Error("ملف النسخة الاحتياطية غير صالح");
  const data = parsed.data;
  let count = 0;
  for (const [k, v] of Object.entries(data)) {
    localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
    count++;
  }
  return count;
}
function BackupPage() {
  return /* @__PURE__ */ jsx(RequireAuth, { children: /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen bg-background", dir: "rtl", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsx(BackupContent, {})
    ] })
  ] }) });
}
function BackupContent() {
  const online = useOnlineStatus();
  const desktop = isDesktop();
  const [dataRoot, setDataRoot] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getDataRoot().then(setDataRoot);
  }, []);
  const onExport = async () => {
    setBusy(true);
    try {
      const json = exportSnapshot();
      const path = await saveBackup(json);
      if (path) toast.success(`تم حفظ النسخة الاحتياطية: ${path}`);
    } catch (e) {
      toast.error("فشل تصدير النسخة الاحتياطية");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };
  const onImport = async () => {
    setBusy(true);
    try {
      const json = await loadBackup();
      if (!json) return;
      const n = importSnapshot(json);
      toast.success(`تم استيراد ${n} عنصر — أعد تحميل الصفحة لرؤية التغييرات`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast.error(e.message || "فشل استيراد الملف");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 lg:p-10 space-y-8", children: [
    /* @__PURE__ */ jsxs("header", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "النسخ الاحتياطي والاستعادة" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "احفظ بيانات الصيدلية في ملف JSON قابل للنقل بين الأجهزة." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(StatusCard, { icon: online ? Wifi : WifiOff, label: "حالة الاتصال", value: online ? "متصل بالإنترنت" : "غير متصل", tone: online ? "ok" : "warn" }),
      /* @__PURE__ */ jsx(StatusCard, { icon: desktop ? Monitor : Globe, label: "نوع التشغيل", value: desktop ? "تطبيق سطح مكتب" : "متصفح ويب", tone: "info" }),
      /* @__PURE__ */ jsx(StatusCard, { icon: ShieldCheck, label: "حفظ البيانات", value: desktop ? "ملفات + ذاكرة المتصفح" : "ذاكرة المتصفح فقط", tone: "ok" })
    ] }),
    desktop && dataRoot && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-border bg-card p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "size-12 rounded-xl bg-primary/10 grid place-items-center shrink-0", children: /* @__PURE__ */ jsx(HardDrive, { className: "size-6 text-primary" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg", children: "مجلد البيانات على جهازك" }),
        /* @__PURE__ */ jsx("code", { className: "block mt-2 text-xs bg-muted/50 rounded-lg p-3 break-all", children: dataRoot }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "كل بياناتك محفوظة في هذا المجلد. تقدر تنسخه يدوياً لأي مكان كنسخة احتياطية." })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => openDataFolder(), className: "px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium flex items-center gap-2 shrink-0", children: [
        /* @__PURE__ */ jsx(FolderOpen, { className: "size-4" }),
        "فتح المجلد"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(ActionCard, { icon: Download, title: "تصدير نسخة احتياطية", desc: "يحفظ كل بيانات التطبيق (مشتريات، مصروفات، مخزون، موظفين...) في ملف JSON واحد.", buttonText: "تصدير الآن", onClick: onExport, disabled: busy, tone: "primary" }),
      /* @__PURE__ */ jsx(ActionCard, { icon: Upload, title: "استيراد نسخة احتياطية", desc: "استرجاع البيانات من ملف JSON محفوظ مسبقاً. سيتم استبدال البيانات الحالية.", buttonText: "استيراد ملف", onClick: onImport, disabled: busy, tone: "secondary" })
    ] }),
    !desktop && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-amber-200", children: "تنبيه: أنت تستخدم نسخة المتصفح" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-amber-100/80 mt-2 leading-relaxed", children: [
        "البيانات محفوظة في ذاكرة المتصفح فقط، ولو مسحت بيانات المتصفح حتفقدها. لتجربة كاملة مع ملفات قابلة للنسخ على القرص الصلب، نزّل نسخة سطح المكتب من الإعدادات أو راجع ",
        /* @__PURE__ */ jsx("code", { children: "electron/README.md" }),
        " في مجلد المشروع."
      ] })
    ] })
  ] });
}
function StatusCard({
  icon: Icon,
  label,
  value,
  tone
}) {
  const colors = {
    ok: "text-emerald-400 bg-emerald-500/10",
    warn: "text-amber-400 bg-amber-500/10",
    info: "text-sky-400 bg-sky-500/10"
  }[tone];
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-5 flex items-center gap-4", children: [
    /* @__PURE__ */ jsx("div", { className: `size-11 rounded-xl grid place-items-center ${colors}`, children: /* @__PURE__ */ jsx(Icon, { className: "size-5" }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: "font-semibold truncate", children: value })
    ] })
  ] });
}
function ActionCard({
  icon: Icon,
  title,
  desc,
  buttonText,
  onClick,
  disabled,
  tone
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 flex flex-col", children: [
    /* @__PURE__ */ jsx(Icon, { className: "size-7 text-primary mb-3" }),
    /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg", children: title }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2 leading-relaxed flex-1", children: desc }),
    /* @__PURE__ */ jsx("button", { onClick, disabled, className: `mt-4 px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50 ${tone === "primary" ? "gradient-primary text-primary-foreground hover:opacity-90" : "bg-muted hover:bg-muted/70"}`, children: buttonText })
  ] });
}
export {
  BackupPage as component
};
