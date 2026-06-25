import { jsx, jsxs } from "react/jsx-runtime";
import { c as DatePickerInput, w as useApp, z as useOrgStorage, g as cn } from "./router-CH3R9Cfm.js";
import { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, Timer, Download, FileText, Users, UserCheck, Wallet, Briefcase, Search, Clock, Moon, Sun, Sunrise, CalendarClock, Phone, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";
import { l as Sidebar, T as Topbar } from "./topbar-CywcAnz-.js";
import { u as useSelection, S as ShowAllToggle, B as BulkActionsBar } from "./use-selection-COp7jQzX.js";
import { u as usePagination, P as PaginationBar } from "./use-pagination-DIgFAfhb.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "./client-bowce4Dj.js";
import "@supabase/supabase-js";
import "date-fns";
import "date-fns/locale/ar";
import "clsx";
import "tailwind-merge";
import "react-day-picker";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "@radix-ui/react-popover";
import "react-dom";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
function computeHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  let mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return Math.round(mins / 60 * 100) / 100;
}
const ROLES = ["pharmacist", "manager", "cashier", "assistant", "cleaner"];
const SHIFTS = ["morning", "evening", "night", "off"];
const shiftIcon = {
  morning: Sunrise,
  evening: Sun,
  night: Moon,
  off: Clock
};
const roleTone = {
  pharmacist: "bg-primary/15 text-primary border-primary/30",
  manager: "bg-secondary/15 text-secondary border-secondary/30",
  cashier: "bg-info/15 text-info border-info/30",
  assistant: "bg-success/15 text-success border-success/30",
  cleaner: "bg-muted text-muted-foreground border-border"
};
function StaffPage() {
  const {
    t,
    fmt,
    lang,
    dir
  } = useApp();
  const [members, setMembers] = useOrgStorage("staff.members", []);
  const [shifts, setShifts] = useOrgStorage("staff.shifts", []);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [shift, setShift] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 7));
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("pharmledger.open.logShift")) {
      sessionStorage.removeItem("pharmledger.open.logShift");
      setLogOpen(true);
    }
  }, []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (role !== "all" && m.role !== role) return false;
      if (shift !== "all" && m.shift !== shift) return false;
      if (!q) return true;
      return m.id.toLowerCase().includes(q) || m.name.ar.includes(q) || m.name.en.toLowerCase().includes(q) || m.phone.includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [members, query, role, shift]);
  const totals = useMemo(() => {
    const count = members.length;
    const payroll = members.reduce((s, m) => s + m.salary, 0);
    const onShift = members.filter((m) => m.shift !== "off" && m.active).length;
    const avg = count ? Math.round(payroll / count) : 0;
    return {
      count,
      payroll,
      onShift,
      avg
    };
  }, [members]);
  const buildStaffExport = () => {
    const headers = ["id", "name", "role", "phone", "email", "baseSalary", "overtimeSalary", "housingAllowance", "transportAllowance", "totalSalary", "shift", "hireDate", "hoursMTD", "active"];
    const rows = filtered.map((m) => ({
      id: m.id,
      name: m.name.en,
      role: m.role,
      phone: m.phone,
      email: m.email,
      baseSalary: m.baseSalary,
      overtimeSalary: m.overtimeSalary,
      housingAllowance: m.housingAllowance,
      transportAllowance: m.transportAllowance,
      totalSalary: m.salary,
      shift: m.shift,
      hireDate: m.hireDate,
      hoursMTD: m.hoursThisMonth,
      active: String(m.active)
    }));
    return {
      headers,
      rows
    };
  };
  const exportXlsx = async () => {
    const {
      headers,
      rows
    } = buildStaffExport();
    const {
      exportRowsAsXlsx
    } = await import("./data-export-tC_sT3ic.js");
    await exportRowsAsXlsx({
      filename: `pharmledger-staff-${Date.now()}`,
      sheetName: "Staff",
      headers,
      rows
    });
  };
  const exportPdf = async () => {
    const {
      headers,
      rows
    } = buildStaffExport();
    const {
      exportRowsAsPdf
    } = await import("./data-export-tC_sT3ic.js");
    await exportRowsAsPdf({
      filename: `pharmledger-staff-${Date.now()}`,
      title: String(t("staffTitle") || "Staff"),
      headers,
      rows,
      lang
    });
  };
  const addMember = (m) => {
    const id = `EMP-${String(Math.floor(Math.random() * 9e4) + 1e4)}`;
    setMembers((prev) => [{
      ...m,
      id
    }, ...prev]);
    toast.success(t("addedEmployee"));
    setOpen(false);
  };
  const updateMember = (id, m) => {
    setMembers((prev) => prev.map((x) => x.id === id ? {
      ...m,
      id
    } : x));
    toast.success(t("save"));
    setEditing(null);
  };
  const cycleShift = (id) => {
    setMembers((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const idx = SHIFTS.indexOf(m.shift);
      return {
        ...m,
        shift: SHIFTS[(idx + 1) % SHIFTS.length]
      };
    }));
  };
  const pg = usePagination(filtered);
  const visibleIds = useMemo(() => pg.pageItems.map((m) => m.id), [pg.pageItems]);
  const sel = useSelection(visibleIds);
  const deleteSelected = () => {
    if (sel.count === 0) return;
    if (typeof window !== "undefined" && !window.confirm(t("confirmDeleteSelected"))) return;
    const ids = new Set(sel.ids);
    const removed = members.filter((m) => ids.has(m.id));
    setMembers((prev) => prev.filter((m) => !ids.has(m.id)));
    sel.clear();
    toast.success(t("deletedSelected"), {
      action: {
        label: t("undo"),
        onClick: () => {
          setMembers((prev) => [...removed, ...prev.filter((m) => !ids.has(m.id))]);
          toast.success(t("restoredSelected"));
        }
      }
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex", children: [
    /* @__PURE__ */ jsx(Sidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 flex flex-col", children: [
      /* @__PURE__ */ jsx(Topbar, {}),
      /* @__PURE__ */ jsxs("main", { className: "px-4 lg:px-8 py-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl lg:text-3xl font-bold tracking-tight", children: /* @__PURE__ */ jsx("span", { className: "text-gradient", children: t("staffTitle") }) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("staffSubtitle") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("button", { onClick: exportXlsx, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(Download, { className: "size-4" }),
              t("exportExcel")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: exportPdf, className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(FileText, { className: "size-4" }),
              t("exportPdf")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setLogOpen(true), className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition", children: [
              /* @__PURE__ */ jsx(Timer, { className: "size-4" }),
              t("logShift")
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: () => setOpen(true), className: "h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition", children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              t("newEmployee")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsx(Stat, { icon: Users, label: t("staffCount"), value: fmt(totals.count), accent: "primary" }),
          /* @__PURE__ */ jsx(Stat, { icon: UserCheck, label: t("onShift"), value: fmt(totals.onShift), accent: "success" }),
          /* @__PURE__ */ jsx(Stat, { icon: Wallet, label: t("monthlyPayroll"), value: fmt(totals.payroll), suffix: t("currency"), accent: "warning" }),
          /* @__PURE__ */ jsx(Stat, { icon: Briefcase, label: t("avgSalary"), value: fmt(totals.avg), suffix: t("currency"), accent: "info" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-[220px]", children: [
            /* @__PURE__ */ jsx(Search, { className: cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3") }),
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("searchStaff"), className: cn("w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition", dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4") })
          ] }),
          /* @__PURE__ */ jsx(FilterChips, { label: t("role"), value: role, options: ROLES, onChange: (v) => setRole(v), t }),
          /* @__PURE__ */ jsx(FilterChips, { label: t("shift"), value: shift, options: SHIFTS, onChange: (v) => setShift(v), t })
        ] }),
        /* @__PURE__ */ jsx(ShowAllToggle, { showAll: pg.showAll, total: pg.total, onToggle: pg.toggleShowAll }),
        /* @__PURE__ */ jsx(BulkActionsBar, { count: sel.count, total: filtered.length, allSelected: sel.allSelected, onSelectAll: sel.toggleAll, onClear: sel.clear, onDelete: deleteSelected }),
        /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl overflow-hidden divide-y divide-border/60", children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-muted/30 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children: [
            /* @__PURE__ */ jsx("div", { className: "col-span-3", children: t("employeeName") }),
            /* @__PURE__ */ jsx("div", { className: "col-span-2", children: t("role") }),
            /* @__PURE__ */ jsx("div", { className: "col-span-2", children: t("contact") }),
            /* @__PURE__ */ jsx("div", { className: "col-span-2", children: t("totalSalary") }),
            /* @__PURE__ */ jsx("div", { className: "col-span-2", children: t("shift") }),
            /* @__PURE__ */ jsx("div", { className: "col-span-1 text-center", children: t("selectAll") })
          ] }),
          pg.pageItems.map((m) => {
            const SIcon = shiftIcon[m.shift];
            const initials = m.name.en.split(" ").filter(Boolean).slice(0, 2).map((p) => p.replace(".", "")[0]).join("").toUpperCase();
            const hire = new Date(m.hireDate);
            return /* @__PURE__ */ jsxs("div", { className: cn("group relative grid grid-cols-1 lg:grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-muted/30 transition", sel.isSelected(m.id) && "bg-primary/5"), children: [
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-3 flex items-center gap-3 min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "size-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0 font-bold text-sm glow-primary", children: initials }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm truncate", children: m.name[lang] }),
                  /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground tabular", children: m.id })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-2 min-w-0", children: [
                /* @__PURE__ */ jsx("span", { className: cn("text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block", roleTone[m.role]), children: t(m.role) }),
                /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground mt-1 tabular flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(CalendarClock, { className: "size-3" }),
                  hire.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
                    month: "short",
                    year: "numeric"
                  })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-2 min-w-0 space-y-0.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-sm tabular truncate flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Phone, { className: "size-3 text-muted-foreground" }),
                  m.phone
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground truncate flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Mail, { className: "size-3" }),
                  m.email
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-2 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "font-bold tabular text-sm text-primary", children: [
                  fmt(m.salary),
                  " ",
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: t("currency") })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground tabular", children: [
                  t("baseSalary"),
                  ": ",
                  fmt(m.baseSalary)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-2 min-w-0", children: [
                /* @__PURE__ */ jsxs("button", { onClick: () => cycleShift(m.id), className: "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border group-hover:scale-105 transition", title: t("shift"), children: [
                  /* @__PURE__ */ jsx(SIcon, { className: "size-3" }),
                  t(m.shift)
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground mt-1 tabular", children: [
                  t("hoursThisMonth"),
                  ": ",
                  fmt(m.hoursThisMonth),
                  "h"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-1 lg:col-span-1 flex items-center justify-center gap-2", children: [
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setEditing(m), "aria-label": t("edit"), title: t("edit"), className: "size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-primary transition", children: /* @__PURE__ */ jsx(Pencil, { className: "size-4" }) }),
                /* @__PURE__ */ jsx("label", { className: "size-8 rounded-lg hover:bg-muted grid place-items-center cursor-pointer", children: /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": t("selectAll"), checked: sel.isSelected(m.id), onChange: () => sel.toggle(m.id), className: "size-4 rounded border-border accent-primary cursor-pointer" }) })
              ] })
            ] }, m.id);
          }),
          filtered.length === 0 && /* @__PURE__ */ jsx("div", { className: "py-16 text-center text-sm text-muted-foreground", children: t("noResults") }),
          /* @__PURE__ */ jsx(PaginationBar, { page: pg.page, totalPages: pg.totalPages, total: pg.total, from: pg.from, to: pg.to, onPageChange: pg.setPage, showAll: pg.showAll, onToggleShowAll: pg.toggleShowAll })
        ] }),
        /* @__PURE__ */ jsx(ShiftsReport, { members, shifts, setShifts, month: reportMonth, setMonth: setReportMonth, lang, fmt, dir })
      ] })
    ] }),
    open && /* @__PURE__ */ jsx(AddStaffDialog, { onClose: () => setOpen(false), onSubmit: addMember }),
    editing && /* @__PURE__ */ jsx(AddStaffDialog, { initial: editing, onClose: () => setEditing(null), onSubmit: (m) => updateMember(editing.id, m) }),
    logOpen && /* @__PURE__ */ jsx(LogShiftDialog, { members, lang, dir, onClose: () => setLogOpen(false), onSubmit: (entries) => {
      const withIds = entries.map((entry) => ({
        ...entry,
        id: `SH-${String(Math.floor(Math.random() * 9e4) + 1e4)}`
      }));
      setShifts((prev) => [...withIds, ...prev]);
      toast.success(lang === "ar" ? "تم تسجيل المناوبة" : "Shift logged");
      setLogOpen(false);
    } })
  ] });
}
function Stat({
  icon: Icon,
  label,
  value,
  suffix,
  accent = "primary"
}) {
  const tone = {
    primary: "from-primary/20 to-primary/0 text-primary",
    secondary: "from-secondary/20 to-secondary/0 text-secondary",
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    warning: "from-warning/20 to-warning/0 text-warning",
    destructive: "from-destructive/20 to-destructive/0 text-destructive"
  };
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in", children: [
    /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", tone[accent]) }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: label }),
        /* @__PURE__ */ jsx("div", { className: cn("size-9 rounded-xl grid place-items-center bg-background/40 border border-border/50", tone[accent].split(" ").pop()), children: /* @__PURE__ */ jsx(Icon, { className: "size-4" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tabular tracking-tight", children: value }),
        suffix && /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: suffix })
      ] })
    ] })
  ] });
}
function FilterChips({
  label,
  value,
  options,
  onChange,
  t
}) {
  const all = ["all", ...options];
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium uppercase tracking-wide", children: label }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: all.map((o) => /* @__PURE__ */ jsx("button", { onClick: () => onChange(o), className: cn("h-8 px-3 rounded-lg text-xs font-semibold transition border", value === o ? "gradient-primary text-primary-foreground border-transparent" : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"), children: o === "all" ? t("filterAll") : t(o) }, o)) })
  ] });
}
function AddStaffDialog({
  onClose,
  onSubmit,
  initial
}) {
  const {
    t
  } = useApp();
  const [name, setName] = useState(initial?.name.en ?? "");
  const [role, setRole] = useState(initial?.role ?? "pharmacist");
  const [shift, setShift] = useState(initial?.shift ?? "morning");
  const [baseSalary, setBaseSalary] = useState(initial ? String(initial.baseSalary) : "");
  const [overtimeSalary, setOvertimeSalary] = useState(initial ? String(initial.overtimeSalary) : "");
  const [housingAllowance, setHousingAllowance] = useState(initial ? String(initial.housingAllowance) : "");
  const [transportAllowance, setTransportAllowance] = useState(initial ? String(initial.transportAllowance) : "");
  const [phone, setPhone] = useState(initial?.phone && initial.phone !== "—" ? initial.phone : "");
  const [email, setEmail] = useState(initial?.email && initial.email !== "—" ? initial.email : "");
  const base = Number(baseSalary) || 0;
  const ot = Number(overtimeSalary) || 0;
  const housing = Number(housingAllowance) || 0;
  const transport = Number(transportAllowance) || 0;
  const totalSal = base + ot + housing + transport;
  const submit = (ev) => {
    ev.preventDefault();
    if (!name.trim()) return toast.error("Name required");
    if (!base || base <= 0) return toast.error("Base salary must be > 0");
    onSubmit({
      name: initial ? {
        ar: name,
        en: name
      } : {
        ar: name,
        en: name
      },
      role,
      shift,
      phone: phone || "—",
      email: email || "—",
      baseSalary: base,
      overtimeSalary: ot,
      housingAllowance: housing,
      transportAllowance: transport,
      salary: totalSal,
      hireDate: initial?.hireDate ?? (/* @__PURE__ */ new Date()).toISOString(),
      hoursThisMonth: initial?.hoursThisMonth ?? 0,
      active: initial?.active ?? true
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: t("newEmployee") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("staffSubtitle") })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: t("employeeName"), full: true, children: /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), required: true, autoFocus: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("role"), children: /* @__PURE__ */ jsx("select", { value: role, onChange: (e) => setRole(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: ROLES.map((r) => /* @__PURE__ */ jsx("option", { value: r, children: t(r) }, r)) }) }),
      /* @__PURE__ */ jsx(Field, { label: t("shift"), children: /* @__PURE__ */ jsx("select", { value: shift, onChange: (e) => setShift(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: SHIFTS.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: t(s) }, s)) }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("baseSalary")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: baseSalary, onChange: (e) => setBaseSalary(e.target.value), min: 1, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("overtimeSalary")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: overtimeSalary, onChange: (e) => setOvertimeSalary(e.target.value), min: 0, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("housingAllowance")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: housingAllowance, onChange: (e) => setHousingAllowance(e.target.value), min: 0, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("transportAllowance")} (${t("currency")})`, children: /* @__PURE__ */ jsx("input", { type: "number", value: transportAllowance, onChange: (e) => setTransportAllowance(e.target.value), min: 0, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: `${t("totalSalary")} (${t("currency")})`, full: true, children: /* @__PURE__ */ jsx("input", { type: "number", value: totalSal || "", readOnly: true, className: "w-full h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm tabular font-bold text-primary" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("phone"), children: /* @__PURE__ */ jsx("input", { value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+9665…", className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) }),
      /* @__PURE__ */ jsx(Field, { label: t("email"), full: true, children: /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: t("cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
        t("save")
      ] })
    ] })
  ] }) });
}
function Field({
  label,
  children,
  full
}) {
  return /* @__PURE__ */ jsxs("label", { className: cn("space-y-1.5 block", full && "col-span-2"), children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: label }),
    children
  ] });
}
function LogShiftDialog({
  members,
  lang,
  dir,
  onClose,
  onSubmit
}) {
  const L = (ar, en) => lang === "ar" ? ar : en;
  const [employeeId, setEmployeeId] = useState(members[0]?.id ?? "");
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [sessions, setSessions] = useState([{
    checkIn: "09:00",
    checkOut: "13:00"
  }]);
  const [note, setNote] = useState("");
  const updateSession = (i, patch) => {
    setSessions((prev) => prev.map((s, idx) => idx === i ? {
      ...s,
      ...patch
    } : s));
  };
  const addSession = () => setSessions((prev) => [...prev, {
    checkIn: "14:00",
    checkOut: "18:00"
  }]);
  const removeSession = (i) => setSessions((prev) => prev.filter((_, idx) => idx !== i));
  const perSessionHours = sessions.map((s) => computeHours(s.checkIn, s.checkOut));
  const totalHours = Math.round(perSessionHours.reduce((a, b) => a + b, 0) * 100) / 100;
  const submit = (ev) => {
    ev.preventDefault();
    if (!employeeId) return toast.error(L("اختر موظفاً", "Pick an employee"));
    if (!date) return toast.error(L("اختر التاريخ", "Pick a date"));
    if (totalHours <= 0) return toast.error(L("الساعات يجب أن تكون أكبر من صفر", "Hours must be > 0"));
    const entries = sessions.map((s) => ({
      employeeId,
      date,
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      hours: computeHours(s.checkIn, s.checkOut),
      note: note || void 0
    })).filter((e) => e.hours > 0);
    if (entries.length === 0) return toast.error(L("لا توجد جلسات صالحة", "No valid sessions"));
    onSubmit(entries);
  };
  return /* @__PURE__ */ jsx("div", { dir, className: "fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, onClick: (e) => e.stopPropagation(), className: "glass-card rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: L("تسجيل مناوبة", "Log Shift") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: L("يمكنك تسجيل أكثر من حضور وانصراف في نفس اليوم", "Record multiple check-ins/outs on the same day") })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "size-8 rounded-lg hover:bg-muted grid place-items-center", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: L("الموظف", "Employee"), full: true, children: /* @__PURE__ */ jsxs("select", { value: employeeId, onChange: (e) => setEmployeeId(e.target.value), required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40", children: [
        members.length === 0 && /* @__PURE__ */ jsx("option", { value: "", children: L("لا يوجد موظفون — أضف موظف أولاً", "No employees — add one first") }),
        members.map((m) => /* @__PURE__ */ jsxs("option", { value: m.id, children: [
          m.name[lang],
          " (",
          m.id,
          ")"
        ] }, m.id))
      ] }) }),
      /* @__PURE__ */ jsx(Field, { label: L("التاريخ", "Date"), full: true, children: /* @__PURE__ */ jsx(DatePickerInput, { value: date, onChange: setDate, required: true, className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: L("الجلسات", "Sessions") }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: addSession, className: "h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 bg-card border border-border hover:bg-muted transition", children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
          L("إضافة جلسة", "Add session")
        ] })
      ] }),
      sessions.map((s, i) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center", children: [
        /* @__PURE__ */ jsx("input", { type: "time", value: s.checkIn, onChange: (e) => updateSession(i, {
          checkIn: e.target.value
        }), required: true, className: "h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }),
        /* @__PURE__ */ jsx("input", { type: "time", value: s.checkOut, onChange: (e) => updateSession(i, {
          checkOut: e.target.value
        }), required: true, className: "h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs tabular font-semibold text-primary min-w-[3.5rem] text-center", children: [
          perSessionHours[i] || 0,
          "h"
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => removeSession(i), disabled: sessions.length === 1, className: "size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition", "aria-label": "remove", children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" }) })
      ] }, i))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(Field, { label: L("إجمالي اليوم", "Day total"), children: /* @__PURE__ */ jsx("input", { value: totalHours ? `${totalHours} h` : "", readOnly: true, className: "w-full h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm tabular font-bold text-primary" }) }),
      /* @__PURE__ */ jsx(Field, { label: L("ملاحظة (اختياري)", "Note (optional)"), children: /* @__PURE__ */ jsx("input", { value: note, onChange: (e) => setNote(e.target.value), className: "w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition", children: L("إلغاء", "Cancel") }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: members.length === 0, className: "h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2 disabled:opacity-50", children: [
        /* @__PURE__ */ jsx(Timer, { className: "size-4" }),
        L("حفظ", "Save")
      ] })
    ] })
  ] }) });
}
function ShiftsReport({
  members,
  shifts,
  setShifts,
  month,
  setMonth,
  lang,
  fmt,
  dir
}) {
  const L = (ar, en) => lang === "ar" ? ar : en;
  const monthShifts = useMemo(() => shifts.filter((s) => s.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)), [shifts, month]);
  const totals = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const s of monthShifts) {
      const cur = map.get(s.employeeId) ?? {
        hours: 0,
        days: 0
      };
      cur.hours += s.hours;
      cur.days += 1;
      map.set(s.employeeId, cur);
    }
    return Array.from(map.entries()).map(([employeeId, v]) => {
      const m = members.find((x) => x.id === employeeId);
      return {
        employeeId,
        name: m?.name[lang] ?? employeeId,
        hours: Math.round(v.hours * 100) / 100,
        days: v.days
      };
    }).sort((a, b) => b.hours - a.hours);
  }, [monthShifts, members, lang]);
  const exportXlsx = async () => {
    const headers = ["date", "employeeId", "employee", "checkIn", "checkOut", "hours", "note"];
    const rows = monthShifts.map((s) => ({
      date: s.date,
      employeeId: s.employeeId,
      employee: members.find((m) => m.id === s.employeeId)?.name[lang] ?? s.employeeId,
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      hours: s.hours,
      note: s.note ?? ""
    }));
    const {
      exportRowsAsXlsx
    } = await import("./data-export-tC_sT3ic.js");
    await exportRowsAsXlsx({
      filename: `pharmledger-shifts-${month}`,
      sheetName: "Shifts",
      headers,
      rows
    });
  };
  const exportPdfShifts = async () => {
    const headers = ["date", "employeeId", "employee", "checkIn", "checkOut", "hours", "note"];
    const rows = monthShifts.map((s) => ({
      date: s.date,
      employeeId: s.employeeId,
      employee: members.find((m) => m.id === s.employeeId)?.name[lang] ?? s.employeeId,
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      hours: s.hours,
      note: s.note ?? ""
    }));
    const {
      exportRowsAsPdf
    } = await import("./data-export-tC_sT3ic.js");
    await exportRowsAsPdf({
      filename: `pharmledger-shifts-${month}`,
      title: L("تقرير ساعات العمل", "Work Hours Report"),
      headers,
      rows,
      lang
    });
  };
  const remove = (id) => {
    if (typeof window !== "undefined" && !window.confirm(L("حذف هذه المناوبة؟", "Delete this shift?"))) return;
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };
  return /* @__PURE__ */ jsxs("div", { className: "glass-card rounded-2xl p-5 space-y-5 animate-fade-in", dir, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base", children: L("تقرير ساعات العمل", "Work Hours Report") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: L("مجموع ساعات كل موظف للشهر المختار", "Total hours per employee for selected month") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("input", { type: "month", value: month, onChange: (e) => setMonth(e.target.value), className: "h-9 rounded-lg bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" }),
        /* @__PURE__ */ jsxs("button", { onClick: exportXlsx, className: "h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-card border border-border hover:bg-muted transition", children: [
          /* @__PURE__ */ jsx(Download, { className: "size-3.5" }),
          "Excel"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: exportPdfShifts, className: "h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-card border border-border hover:bg-muted transition", children: [
          /* @__PURE__ */ jsx(Download, { className: "size-3.5" }),
          "PDF"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [
      totals.length === 0 && /* @__PURE__ */ jsx("div", { className: "col-span-full text-center text-sm text-muted-foreground py-8", children: L("لا توجد مناوبات في هذا الشهر", "No shifts recorded this month") }),
      totals.map((t) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-border bg-background/40 p-4", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold truncate", children: t.name }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold tabular mt-1 text-primary", children: [
          fmt(t.hours),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-muted-foreground", children: "h" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground mt-1", children: [
          fmt(t.days),
          " ",
          L("يوم عمل", "days")
        ] })
      ] }, t.employeeId))
    ] }),
    monthShifts.length > 0 && /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-xs text-muted-foreground uppercase tracking-wide border-b border-border", children: [
        /* @__PURE__ */ jsx("th", { className: "text-start font-medium py-2", children: L("التاريخ", "Date") }),
        /* @__PURE__ */ jsx("th", { className: "text-start font-medium", children: L("الموظف", "Employee") }),
        /* @__PURE__ */ jsx("th", { className: "text-start font-medium", children: L("الحضور", "In") }),
        /* @__PURE__ */ jsx("th", { className: "text-start font-medium", children: L("الانصراف", "Out") }),
        /* @__PURE__ */ jsx("th", { className: "text-end font-medium", children: L("الساعات", "Hours") }),
        /* @__PURE__ */ jsx("th", { className: "text-end font-medium" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-border/60", children: monthShifts.map((s) => {
        const name = members.find((m) => m.id === s.employeeId)?.name[lang] ?? s.employeeId;
        return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-muted/30 transition", children: [
          /* @__PURE__ */ jsx("td", { className: "py-2.5 tabular", children: s.date }),
          /* @__PURE__ */ jsx("td", { className: "py-2.5", children: name }),
          /* @__PURE__ */ jsx("td", { className: "py-2.5 tabular", children: s.checkIn }),
          /* @__PURE__ */ jsx("td", { className: "py-2.5 tabular", children: s.checkOut }),
          /* @__PURE__ */ jsxs("td", { className: "py-2.5 text-end tabular font-semibold", children: [
            fmt(s.hours),
            " h"
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-2.5 text-end", children: /* @__PURE__ */ jsx("button", { onClick: () => remove(s.id), className: "size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center inline-grid", children: /* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }) }) })
        ] }, s.id);
      }) })
    ] }) })
  ] });
}
export {
  LogShiftDialog,
  StaffPage as component
};
