import { Construction } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useApp } from "@/lib/app-context";

export function ComingSoon({ titleKey }: { titleKey: Parameters<ReturnType<typeof useApp>["t"]>[0] }) {
  const { t } = useApp();
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 grid place-items-center px-6 py-12">
          <div className="glass-card rounded-3xl p-10 text-center max-w-md animate-fade-in">
            <div className="size-16 rounded-2xl gradient-primary grid place-items-center mx-auto mb-5 glow-primary">
              <Construction className="size-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t(titleKey)}</h1>
            <p className="text-sm text-muted-foreground">
              {t("appName")} — coming soon · قريباً
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
