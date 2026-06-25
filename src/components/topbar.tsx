import { Bell, Languages, Moon, Search, Sun, Wifi, WifiOff, Monitor } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";
import { OrgSwitcher } from "@/components/org-switcher";
import { useOnlineStatus } from "@/lib/use-online-status";
import { isDesktop } from "@/lib/desktop-bridge";

export function Topbar() {
  const { t, lang, toggleLang, theme, toggleTheme, dir } = useApp();
  const online = useOnlineStatus();
  const desktop = isDesktop();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
        <div className={cn("relative flex-1 max-w-md", dir === "rtl" ? "ml-auto" : "mr-auto")}>
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground",
              dir === "rtl" ? "right-3" : "left-3",
            )}
          />
          <input
            type="search"
            placeholder={t("search")}
            className={cn(
              "w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition",
              dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4",
            )}
          />
        </div>

        <OrgSwitcher />

        {/* Online/Offline + desktop indicator */}
        <div
          className={cn(
            "h-10 px-3 rounded-xl border flex items-center gap-2 text-xs font-medium",
            online
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-amber-500/10 border-amber-500/30 text-amber-300",
          )}
          title={online ? "متصل بالإنترنت" : "غير متصل — البيانات تُحفظ محلياً"}
        >
          {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
          {desktop && <Monitor className="size-3.5 opacity-70" />}
          <span className="hidden md:inline">{online ? "متصل" : "أوفلاين"}</span>
        </div>

        <button
          onClick={toggleLang}
          className="h-10 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border flex items-center gap-2 text-sm font-medium transition"
          aria-label="Toggle language"
        >
          <Languages className="size-4" />
          <span className="hidden sm:inline">{lang === "ar" ? "EN" : "ع"}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted border border-border grid place-items-center transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted border border-border grid place-items-center transition relative">
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>
      </div>
    </header>
  );
}
