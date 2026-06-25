import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Upload,
  FolderOpen,
  HardDrive,
  Wifi,
  WifiOff,
  Monitor,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import {
  isDesktop,
  saveBackup,
  loadBackup,
  openDataFolder,
  getDataRoot,
} from "@/lib/desktop-bridge";
import { useOnlineStatus } from "@/lib/use-online-status";

export const Route = createFileRoute("/backup")({
  component: BackupPage,
});

/** Snapshot every pharmledger.* localStorage key into a single JSON object. */
function exportSnapshot(): string {
  if (typeof localStorage === "undefined") return "{}";
  const out: Record<string, unknown> = {};
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
  return JSON.stringify(
    {
      __pharmledger_backup__: true,
      version: 1,
      exportedAt: new Date().toISOString(),
      data: out,
    },
    null,
    2,
  );
}

function importSnapshot(json: string): number {
  const parsed = JSON.parse(json);
  if (!parsed?.__pharmledger_backup__) throw new Error("ملف النسخة الاحتياطية غير صالح");
  const data = parsed.data as Record<string, unknown>;
  let count = 0;
  for (const [k, v] of Object.entries(data)) {
    localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
    count++;
  }
  return count;
}

function BackupPage() {
  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-background" dir="rtl">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Topbar />
          <BackupContent />
        </main>
      </div>
    </RequireAuth>
  );
}

function BackupContent() {
  const online = useOnlineStatus();
  const desktop = isDesktop();
  const [dataRoot, setDataRoot] = useState<string | null>(null);
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
      toast.error((e as Error).message || "فشل استيراد الملف");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">النسخ الاحتياطي والاستعادة</h1>
        <p className="text-muted-foreground mt-2">
          احفظ بيانات الصيدلية في ملف JSON قابل للنقل بين الأجهزة.
        </p>
      </header>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          icon={online ? Wifi : WifiOff}
          label="حالة الاتصال"
          value={online ? "متصل بالإنترنت" : "غير متصل"}
          tone={online ? "ok" : "warn"}
        />
        <StatusCard
          icon={desktop ? Monitor : Globe}
          label="نوع التشغيل"
          value={desktop ? "تطبيق سطح مكتب" : "متصفح ويب"}
          tone="info"
        />
        <StatusCard
          icon={ShieldCheck}
          label="حفظ البيانات"
          value={desktop ? "ملفات + ذاكرة المتصفح" : "ذاكرة المتصفح فقط"}
          tone="ok"
        />
      </div>

      {/* Data location card */}
      {desktop && dataRoot && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 grid place-items-center shrink-0">
              <HardDrive className="size-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">مجلد البيانات على جهازك</h3>
              <code className="block mt-2 text-xs bg-muted/50 rounded-lg p-3 break-all">
                {dataRoot}
              </code>
              <p className="text-sm text-muted-foreground mt-2">
                كل بياناتك محفوظة في هذا المجلد. تقدر تنسخه يدوياً لأي مكان كنسخة احتياطية.
              </p>
            </div>
            <button
              onClick={() => openDataFolder()}
              className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium flex items-center gap-2 shrink-0"
            >
              <FolderOpen className="size-4" />
              فتح المجلد
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard
          icon={Download}
          title="تصدير نسخة احتياطية"
          desc="يحفظ كل بيانات التطبيق (مشتريات، مصروفات، مخزون، موظفين...) في ملف JSON واحد."
          buttonText="تصدير الآن"
          onClick={onExport}
          disabled={busy}
          tone="primary"
        />
        <ActionCard
          icon={Upload}
          title="استيراد نسخة احتياطية"
          desc="استرجاع البيانات من ملف JSON محفوظ مسبقاً. سيتم استبدال البيانات الحالية."
          buttonText="استيراد ملف"
          onClick={onImport}
          disabled={busy}
          tone="secondary"
        />
      </div>

      {!desktop && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h3 className="font-semibold text-amber-200">تنبيه: أنت تستخدم نسخة المتصفح</h3>
          <p className="text-sm text-amber-100/80 mt-2 leading-relaxed">
            البيانات محفوظة في ذاكرة المتصفح فقط، ولو مسحت بيانات المتصفح حتفقدها.
            لتجربة كاملة مع ملفات قابلة للنسخ على القرص الصلب، نزّل نسخة سطح المكتب
            من الإعدادات أو راجع <code>electron/README.md</code> في مجلد المشروع.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wifi;
  label: string;
  value: string;
  tone: "ok" | "warn" | "info";
}) {
  const colors = {
    ok: "text-emerald-400 bg-emerald-500/10",
    warn: "text-amber-400 bg-amber-500/10",
    info: "text-sky-400 bg-sky-500/10",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
      <div className={`size-11 rounded-xl grid place-items-center ${colors}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  buttonText,
  onClick,
  disabled,
  tone,
}: {
  icon: typeof Download;
  title: string;
  desc: string;
  buttonText: string;
  onClick: () => void;
  disabled?: boolean;
  tone: "primary" | "secondary";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
      <Icon className="size-7 text-primary mb-3" />
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{desc}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`mt-4 px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-50 ${
          tone === "primary"
            ? "gradient-primary text-primary-foreground hover:opacity-90"
            : "bg-muted hover:bg-muted/70"
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
}
