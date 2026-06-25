import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { TrendingUp, Receipt, CreditCard, Wallet, FileBarChart, Calculator, BookOpen, BookOpenCheck, Package, ArrowLeftRight, FileBarChart2, Pill, PanelLeftClose, PanelLeftOpen, LayoutDashboard, PieChart, ShoppingCart, Truck, Users, Building2, Sparkles, HardDrive, Settings, LogOut, ChevronDown, Boxes, ChevronRight, Check, Circle, X, ChevronUp, ImagePlus, Loader2, Trash2, Plus, Settings2, Search, Wifi, WifiOff, Monitor, Languages, Sun, Moon, Bell } from "lucide-react";
import { w as useApp, x as useAuth, g as cn, y as useOrg, l as isDesktop } from "./router-CH3R9Cfm.js";
import { s as supabase } from "./client-bowce4Dj.js";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import * as SelectPrimitive from "@radix-ui/react-select";
const COLLAPSE_KEY = "pl_sidebar_collapsed";
function Sidebar() {
  const { t, dir } = useApp();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem(COLLAPSE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {
    }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
      }
      return next;
    });
  };
  const accountsChildren = [
    { to: "/revenue", icon: TrendingUp, key: "revenue" },
    { to: "/expenses", icon: Receipt, key: "expenses" },
    { to: "/debts", icon: CreditCard, key: "debts" },
    { to: "/supplier-payments", icon: Wallet, key: "supplierPayments" },
    { to: "/statements", icon: FileBarChart, key: "statements" },
    { to: "/vat", icon: Calculator, key: "vat" },
    { to: "/chart-of-accounts", icon: BookOpen, key: "chartOfAccounts" },
    { to: "/journal-entries", icon: BookOpenCheck, key: "journalAndLedger" }
  ];
  const accountsActive = accountsChildren.some((c) => path.startsWith(c.to));
  const [accountsOpen, setAccountsOpen] = useState(accountsActive);
  const inventoryChildren = [
    { to: "/inventory/products", icon: Package, key: "inventoryProducts" },
    { to: "/inventory/operations", icon: ArrowLeftRight, key: "inventoryOperations" },
    { to: "/inventory/reports", icon: FileBarChart2, key: "inventoryReports" }
  ];
  const inventoryActive = inventoryChildren.some((c) => path.startsWith(c.to));
  const [inventoryOpen, setInventoryOpen] = useState(inventoryActive);
  const mainItems = [
    { to: "/", icon: LayoutDashboard, key: "dashboard" },
    { to: "/reports", icon: PieChart, key: "reports" },
    { to: "/purchases", icon: ShoppingCart, key: "purchases" },
    { to: "/suppliers", icon: Truck, key: "suppliers" },
    { to: "/staff", icon: Users, key: "staff" },
    { to: "/organizations", icon: Building2, key: "organizations" },
    { to: "/ai", icon: Sparkles, key: "ai" },
    { to: "/backup", icon: HardDrive, key: "backup" },
    { to: "/settings", icon: Settings, key: "settings" }
  ];
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof localStorage !== "undefined") localStorage.removeItem("pl_session");
    toast.success(t("signedOut"));
    navigate({ to: "/login" });
  };
  const isActive = (to) => to === "/" ? path === "/" : path.startsWith(to);
  const renderItem = (it, opts) => {
    const active = isActive(it.to);
    const label = t(it.key);
    return /* @__PURE__ */ jsxs(
      Link,
      {
        to: it.to,
        title: collapsed ? label : void 0,
        className: cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-all relative group",
          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
          !collapsed && opts?.nested && (dir === "rtl" ? "mr-3" : "ml-3"),
          active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
        ),
        children: [
          active && !collapsed && /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "absolute top-1/2 -translate-y-1/2 h-6 w-1 rounded-full gradient-primary",
                dir === "rtl" ? "right-0" : "left-0"
              )
            }
          ),
          /* @__PURE__ */ jsx(it.icon, { className: cn("size-4 shrink-0", active && "text-primary") }),
          !collapsed && /* @__PURE__ */ jsx("span", { className: "truncate", children: label })
        ]
      },
      it.key
    );
  };
  const renderGroup = (opts) => {
    const { icon: Icon, labelKey, active, open, setOpen, children } = opts;
    const label = t(labelKey);
    if (collapsed) {
      return /* @__PURE__ */ jsx(Fragment, { children: children.map((it) => renderItem(it)) });
    }
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setOpen((o) => !o),
          className: cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            active ? "text-sidebar-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
          ),
          children: [
            /* @__PURE__ */ jsx(Icon, { className: cn("size-4 shrink-0", active && "text-primary") }),
            /* @__PURE__ */ jsx("span", { className: "truncate flex-1 text-start", children: label }),
            /* @__PURE__ */ jsx(ChevronDown, { className: cn("size-4 transition-transform shrink-0", !open && "-rotate-90") })
          ]
        }
      ),
      open && /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            "space-y-1 border-sidebar-border/60",
            dir === "rtl" ? "border-r pr-2 mr-4" : "border-l pl-2 ml-4"
          ),
          children: children.map((it) => renderItem(it, { nested: true }))
        }
      )
    ] });
  };
  const CollapseIcon = collapsed ? dir === "rtl" ? PanelLeftClose : PanelLeftOpen : dir === "rtl" ? PanelLeftOpen : PanelLeftClose;
  return /* @__PURE__ */ jsxs(
    "aside",
    {
      className: cn(
        "hidden lg:flex shrink-0 flex-col bg-sidebar border-sidebar-border h-screen sticky top-0 transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
        dir === "rtl" ? "border-l" : "border-r"
      ),
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "py-6 flex items-center gap-3",
              collapsed ? "px-2 justify-center" : "px-6"
            ),
            children: [
              /* @__PURE__ */ jsx("div", { className: "size-10 rounded-xl gradient-primary grid place-items-center glow-primary shrink-0", children: /* @__PURE__ */ jsx(Pill, { className: "size-5 text-primary-foreground", strokeWidth: 2.5 }) }),
              !collapsed && /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("div", { className: "font-bold text-sidebar-foreground text-lg leading-tight truncate", children: t("appName") }),
                /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground truncate", children: t("tagline") })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: cn("flex pb-2", collapsed ? "px-2 justify-center" : "px-3 justify-end"), children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: toggleCollapsed,
            className: "size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors",
            "aria-label": collapsed ? "Expand sidebar" : "Collapse sidebar",
            title: collapsed ? "توسيع القائمة" : "تصغير القائمة",
            children: /* @__PURE__ */ jsx(CollapseIcon, { className: "size-4" })
          }
        ) }),
        /* @__PURE__ */ jsxs("nav", { className: "px-3 py-2 flex-1 overflow-y-auto space-y-1", children: [
          mainItems.slice(0, 1).map((it) => renderItem(it)),
          mainItems.slice(1, 2).map((it) => renderItem(it)),
          mainItems.slice(2, 3).map((it) => renderItem(it)),
          renderGroup({
            icon: Boxes,
            labelKey: "inventory",
            active: inventoryActive,
            open: inventoryOpen,
            setOpen: setInventoryOpen,
            children: inventoryChildren
          }),
          renderGroup({
            icon: Wallet,
            labelKey: "accounts",
            active: accountsActive,
            open: accountsOpen,
            setOpen: setAccountsOpen,
            children: accountsChildren
          }),
          mainItems.slice(3).map((it) => renderItem(it))
        ] }),
        /* @__PURE__ */ jsx("div", { className: cn("border-t border-sidebar-border", collapsed ? "px-2 py-3" : "px-4 py-4"), children: collapsed ? /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSignOut,
            className: "w-full grid place-items-center py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors",
            "aria-label": t("signOut"),
            title: user?.email ?? t("signOut"),
            children: /* @__PURE__ */ jsx(LogOut, { className: "size-4" })
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-xl p-3 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "size-9 rounded-full gradient-primary grid place-items-center text-primary-foreground font-bold text-sm", children: "م" }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold truncate", children: user?.email?.split("@")[0] ?? t("admin") }),
            /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground truncate", children: user?.email ?? "—" })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSignOut,
              className: "size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors",
              "aria-label": t("signOut"),
              title: t("signOut"),
              children: /* @__PURE__ */ jsx(LogOut, { className: "size-4" })
            }
          )
        ] }) })
      ]
    }
  );
}
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props });
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(LabelPrimitive.Root, { ref, className: cn(labelVariants(), className), ...props }));
Label.displayName = LabelPrimitive.Root.displayName;
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const [dir, setDir] = React.useState(void 0);
  React.useEffect(() => {
    setDir(document.documentElement.dir);
  }, []);
  return /* @__PURE__ */ jsxs(
    SelectPrimitive.Trigger,
    {
      ref,
      dir,
      className: cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
      ]
    }
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  const [dir, setDir] = React.useState(void 0);
  React.useEffect(() => {
    setDir(document.documentElement.dir);
  }, []);
  return /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
    SelectPrimitive.Content,
    {
      ref,
      dir,
      className: cn(
        "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)",
        position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      ),
      position,
      ...props,
      children: [
        /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
        /* @__PURE__ */ jsx(
          SelectPrimitive.Viewport,
          {
            className: cn(
              "p-1",
              position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
            ),
            children
          }
        ),
        /* @__PURE__ */ jsx(SelectScrollDownButton, {})
      ]
    }
  ) });
});
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => {
  const [dir, setDir] = React.useState(void 0);
  React.useEffect(() => {
    setDir(document.documentElement.dir);
  }, []);
  return /* @__PURE__ */ jsxs(
    SelectPrimitive.Item,
    {
      ref,
      dir,
      className: cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 ltr:pl-2 rtl:pr-2 ltr:pr-8 rtl:pl-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx("span", { className: "absolute ltr:right-2 rtl:left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
        /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
      ]
    }
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
function LogoPicker({
  value,
  onChange
}) {
  const { t } = useApp();
  const { uploadLogo } = useOrg();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const handlePick = async (file) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("logoTooLarge"));
      return;
    }
    setBusy(true);
    try {
      const url = await uploadLogo(file);
      onChange(url);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: "size-16 rounded-xl border border-border bg-muted/40 grid place-items-center overflow-hidden shrink-0", children: value ? /* @__PURE__ */ jsx("img", { src: value, alt: "logo", className: "size-full object-cover" }) : /* @__PURE__ */ jsx(ImagePlus, { className: "size-6 text-muted-foreground" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => inputRef.current?.click(),
          disabled: busy,
          className: "px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent disabled:opacity-60 inline-flex items-center gap-1.5",
          children: [
            busy ? /* @__PURE__ */ jsx(Loader2, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsx(ImagePlus, { className: "size-3.5" }),
            busy ? t("uploadingLogo") : value ? t("changeLogo") : t("uploadLogo")
          ]
        }
      ),
      value && !busy && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => onChange(null),
          className: "size-8 grid place-items-center rounded-lg border border-border text-destructive hover:bg-destructive hover:text-destructive-foreground",
          "aria-label": t("removeLogo"),
          children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept: "image/*",
        className: "hidden",
        onChange: (e) => {
          const f = e.target.files?.[0];
          if (f) handlePick(f);
        }
      }
    )
  ] });
}
function OrgSwitcher() {
  const { t } = useApp();
  const { organizations, currentOrg, switchOrg, createOrg } = useOrg();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [bizType, setBizType] = useState("pharmacy");
  const [currency, setCurrency] = useState("SAR");
  const [taxNum, setTaxNum] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error(t("organizationName"));
      return;
    }
    setSaving(true);
    try {
      await createOrg({
        name: name.trim(),
        business_type: bizType,
        currency,
        tax_number: taxNum.trim() || null,
        logo_url: logoUrl
      });
      toast.success(t("organizationCreated"));
      setOpen(false);
      setName("");
      setTaxNum("");
      setLogoUrl(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(DropdownMenu, { children: [
      /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("button", { className: "h-10 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border flex items-center gap-2 text-sm font-medium transition max-w-[220px]", children: [
        currentOrg?.logo_url ? /* @__PURE__ */ jsx("img", { src: currentOrg.logo_url, alt: "", className: "size-5 rounded object-cover shrink-0" }) : /* @__PURE__ */ jsx(Building2, { className: "size-4 text-primary shrink-0" }),
        /* @__PURE__ */ jsx("span", { className: "truncate", children: currentOrg?.name ?? t("noOrganizations") }),
        /* @__PURE__ */ jsx(ChevronDown, { className: "size-4 opacity-60 shrink-0" })
      ] }) }),
      /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-72", children: [
        /* @__PURE__ */ jsx(DropdownMenuLabel, { children: t("switchOrganization") }),
        /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
        organizations.length === 0 && /* @__PURE__ */ jsx("div", { className: "px-2 py-3 text-xs text-muted-foreground text-center", children: t("noOrganizations") }),
        organizations.map((o) => /* @__PURE__ */ jsxs(
          DropdownMenuItem,
          {
            onClick: () => switchOrg(o.id),
            className: "flex items-center gap-2",
            children: [
              o.logo_url ? /* @__PURE__ */ jsx("img", { src: o.logo_url, alt: "", className: "size-5 rounded object-cover shrink-0" }) : /* @__PURE__ */ jsx(Building2, { className: "size-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm truncate", children: o.name }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: t(`role${(o.role ?? "cashier").charAt(0).toUpperCase()}${(o.role ?? "cashier").slice(1)}`) })
              ] }),
              currentOrg?.id === o.id && /* @__PURE__ */ jsx(Check, { className: "size-4 text-primary" })
            ]
          },
          o.id
        )),
        /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
        /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setOpen(true), children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4 me-2" }),
          t("createOrganization")
        ] }),
        /* @__PURE__ */ jsx(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ jsxs(Link, { to: "/organizations", className: "cursor-pointer", children: [
          /* @__PURE__ */ jsx(Settings2, { className: "size-4 me-2" }),
          t("manageOrganizations")
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: t("createOrganization") }),
        /* @__PURE__ */ jsx(DialogDescription, { children: t("organizationName") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: t("organizationLogo") }),
          /* @__PURE__ */ jsx(LogoPicker, { value: logoUrl, onChange: setLogoUrl })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: t("organizationName") }),
          /* @__PURE__ */ jsx(Input, { value: name, onChange: (e) => setName(e.target.value), autoFocus: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx(Label, { children: t("businessType") }),
            /* @__PURE__ */ jsxs(Select, { value: bizType, onValueChange: setBizType, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "pharmacy", children: t("pharmacyType") }),
                /* @__PURE__ */ jsx(SelectItem, { value: "clinic", children: t("clinicType") }),
                /* @__PURE__ */ jsx(SelectItem, { value: "company", children: t("companyType") }),
                /* @__PURE__ */ jsx(SelectItem, { value: "retail", children: t("retailType") })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx(Label, { children: t("currency") }),
            /* @__PURE__ */ jsxs(Select, { value: currency, onValueChange: setCurrency, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "SAR", children: "SAR" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "AED", children: "AED" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "EGP", children: "EGP" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "USD", children: "USD" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "EUR", children: "EUR" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { children: t("taxNumber") }),
          /* @__PURE__ */ jsx(Input, { value: taxNum, onChange: (e) => setTaxNum(e.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setOpen(false),
            className: "px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent",
            children: t("cancel")
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleCreate,
            disabled: saving,
            className: "px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60",
            children: t("create")
          }
        )
      ] })
    ] }) })
  ] });
}
function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof navigator !== "undefined") setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}
function Topbar() {
  const { t, lang, toggleLang, theme, toggleTheme, dir } = useApp();
  const online = useOnlineStatus();
  const desktop = isDesktop();
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 lg:px-8 h-16", children: [
    /* @__PURE__ */ jsxs("div", { className: cn("relative flex-1 max-w-md", dir === "rtl" ? "ml-auto" : "mr-auto"), children: [
      /* @__PURE__ */ jsx(
        Search,
        {
          className: cn(
            "absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground",
            dir === "rtl" ? "right-3" : "left-3"
          )
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "search",
          placeholder: t("search"),
          className: cn(
            "w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition",
            dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"
          )
        }
      )
    ] }),
    /* @__PURE__ */ jsx(OrgSwitcher, {}),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "h-10 px-3 rounded-xl border flex items-center gap-2 text-xs font-medium",
          online ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
        ),
        title: online ? "متصل بالإنترنت" : "غير متصل — البيانات تُحفظ محلياً",
        children: [
          online ? /* @__PURE__ */ jsx(Wifi, { className: "size-4" }) : /* @__PURE__ */ jsx(WifiOff, { className: "size-4" }),
          desktop && /* @__PURE__ */ jsx(Monitor, { className: "size-3.5 opacity-70" }),
          /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: online ? "متصل" : "أوفلاين" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: toggleLang,
        className: "h-10 px-3 rounded-xl bg-muted/50 hover:bg-muted border border-border flex items-center gap-2 text-sm font-medium transition",
        "aria-label": "Toggle language",
        children: [
          /* @__PURE__ */ jsx(Languages, { className: "size-4" }),
          /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: lang === "ar" ? "EN" : "ع" })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: toggleTheme,
        className: "h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted border border-border grid place-items-center transition",
        "aria-label": "Toggle theme",
        children: theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "size-4" }) : /* @__PURE__ */ jsx(Moon, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsxs("button", { className: "h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted border border-border grid place-items-center transition relative", children: [
      /* @__PURE__ */ jsx(Bell, { className: "size-4" }),
      /* @__PURE__ */ jsx("span", { className: "absolute top-2 right-2 size-2 rounded-full bg-destructive ring-2 ring-background" })
    ] })
  ] }) });
}
export {
  Dialog as D,
  Input as I,
  Label as L,
  Select as S,
  Topbar as T,
  DialogContent as a,
  DialogDescription as b,
  DialogFooter as c,
  DialogHeader as d,
  DialogTitle as e,
  DialogTrigger as f,
  LogoPicker as g,
  SelectContent as h,
  SelectItem as i,
  SelectTrigger as j,
  SelectValue as k,
  Sidebar as l,
  useOnlineStatus as u
};
