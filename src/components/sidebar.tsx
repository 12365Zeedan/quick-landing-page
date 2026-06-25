import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
  CreditCard,
  FileBarChart,
  Calculator,
  PieChart,
  Settings,
  Pill,
  Sparkles,
  LogOut,
  Building2,
  Wallet,
  BookOpen,
  BookOpenCheck,
  Package,
  Boxes,
  ArrowLeftRight,
  FileBarChart2,
  ChevronDown,
  HardDrive,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type Item = { to: string; icon: typeof LayoutDashboard; key: any };

const COLLAPSE_KEY = "pl_sidebar_collapsed";

export function Sidebar() {
  const { t, dir } = useApp();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem(COLLAPSE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {}
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const accountsChildren: Item[] = [
    { to: "/revenue", icon: TrendingUp, key: "revenue" },
    { to: "/expenses", icon: Receipt, key: "expenses" },
    { to: "/debts", icon: CreditCard, key: "debts" },
    { to: "/supplier-payments", icon: Wallet, key: "supplierPayments" },
    
    { to: "/statements", icon: FileBarChart, key: "statements" },
    { to: "/vat", icon: Calculator, key: "vat" },
    { to: "/chart-of-accounts", icon: BookOpen, key: "chartOfAccounts" },
    { to: "/journal-entries", icon: BookOpenCheck, key: "journalAndLedger" },
  ];

  const accountsActive = accountsChildren.some((c) => path.startsWith(c.to));
  const [accountsOpen, setAccountsOpen] = useState<boolean>(accountsActive);

  const inventoryChildren: Item[] = [
    { to: "/inventory/products", icon: Package, key: "inventoryProducts" },
    { to: "/inventory/operations", icon: ArrowLeftRight, key: "inventoryOperations" },
    { to: "/inventory/reports", icon: FileBarChart2, key: "inventoryReports" },
  ];
  const inventoryActive = inventoryChildren.some((c) => path.startsWith(c.to));
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(inventoryActive);

  const mainItems: Item[] = [
    { to: "/", icon: LayoutDashboard, key: "dashboard" },
    { to: "/reports", icon: PieChart, key: "reports" },
    { to: "/purchases", icon: ShoppingCart, key: "purchases" },
    { to: "/suppliers", icon: Truck, key: "suppliers" },
    { to: "/staff", icon: Users, key: "staff" },
    { to: "/organizations", icon: Building2, key: "organizations" },
    { to: "/ai", icon: Sparkles, key: "ai" },
    { to: "/backup", icon: HardDrive, key: "backup" },
    { to: "/settings", icon: Settings, key: "settings" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof localStorage !== "undefined") localStorage.removeItem("pl_session");
    toast.success(t("signedOut"));
    navigate({ to: "/login" });
  };

  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  const renderItem = (it: Item, opts?: { nested?: boolean }) => {
    const active = isActive(it.to);
    const label = t(it.key);
    return (
      <Link
        key={it.key}
        to={it.to}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all relative group",
          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
          !collapsed && opts?.nested && (dir === "rtl" ? "mr-3" : "ml-3"),
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
        )}
      >
        {active && !collapsed && (
          <span
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-6 w-1 rounded-full gradient-primary",
              dir === "rtl" ? "right-0" : "left-0",
            )}
          />
        )}
        <it.icon className={cn("size-4 shrink-0", active && "text-primary")} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  const renderGroup = (opts: {
    icon: typeof LayoutDashboard;
    labelKey: any;
    active: boolean;
    open: boolean;
    setOpen: (fn: (o: boolean) => boolean) => void;
    children: Item[];
  }) => {
    const { icon: Icon, labelKey, active, open, setOpen, children } = opts;
    const label = t(labelKey);

    // When collapsed: render children as flat icon list (no group header toggle).
    if (collapsed) {
      return <>{children.map((it) => renderItem(it))}</>;
    }

    return (
      <>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            active
              ? "text-sidebar-foreground"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
          )}
        >
          <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
          <span className="truncate flex-1 text-start">{label}</span>
          <ChevronDown className={cn("size-4 transition-transform shrink-0", !open && "-rotate-90")} />
        </button>
        {open && (
          <div
            className={cn(
              "space-y-1 border-sidebar-border/60",
              dir === "rtl" ? "border-r pr-2 mr-4" : "border-l pl-2 ml-4",
            )}
          >
            {children.map((it) => renderItem(it, { nested: true }))}
          </div>
        )}
      </>
    );
  };

  const CollapseIcon = collapsed
    ? (dir === "rtl" ? PanelLeftClose : PanelLeftOpen)
    : (dir === "rtl" ? PanelLeftOpen : PanelLeftClose);

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col bg-sidebar border-sidebar-border h-screen sticky top-0 transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
        dir === "rtl" ? "border-l" : "border-r",
      )}
    >
      <div
        className={cn(
          "py-6 flex items-center gap-3",
          collapsed ? "px-2 justify-center" : "px-6",
        )}
      >
        <div className="size-10 rounded-xl gradient-primary grid place-items-center glow-primary shrink-0">
          <Pill className="size-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sidebar-foreground text-lg leading-tight truncate">
              {t("appName")}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{t("tagline")}</div>
          </div>
        )}
      </div>

      <div className={cn("flex pb-2", collapsed ? "px-2 justify-center" : "px-3 justify-end")}>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
        >
          <CollapseIcon className="size-4" />
        </button>
      </div>

      <nav className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
        {mainItems.slice(0, 1).map((it) => renderItem(it))}
        {mainItems.slice(1, 2).map((it) => renderItem(it))}
        {mainItems.slice(2, 3).map((it) => renderItem(it))}

        {renderGroup({
          icon: Boxes,
          labelKey: "inventory",
          active: inventoryActive,
          open: inventoryOpen,
          setOpen: setInventoryOpen,
          children: inventoryChildren,
        })}

        {renderGroup({
          icon: Wallet,
          labelKey: "accounts",
          active: accountsActive,
          open: accountsOpen,
          setOpen: setAccountsOpen,
          children: accountsChildren,
        })}

        {mainItems.slice(3).map((it) => renderItem(it))}
      </nav>

      <div className={cn("border-t border-sidebar-border", collapsed ? "px-2 py-3" : "px-4 py-4")}>
        {collapsed ? (
          <button
            onClick={handleSignOut}
            className="w-full grid place-items-center py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            aria-label={t("signOut")}
            title={user?.email ?? t("signOut")}
          >
            <LogOut className="size-4" />
          </button>
        ) : (
          <div className="glass-card rounded-xl p-3 flex items-center gap-3">
            <div className="size-9 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold text-sm">
              م
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user?.email?.split("@")[0] ?? t("admin")}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user?.email ?? "—"}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
              aria-label={t("signOut")}
              title={t("signOut")}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
