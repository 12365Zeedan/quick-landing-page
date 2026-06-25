import { createFileRoute } from "@tanstack/react-router";
import { DatePickerInput } from "@/components/date-picker-input";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarClock,
  Clock,
  Download,
  FileText,
  Mail,
  Moon,
  Pencil,
  Phone,
  Plus,
  Search,
  Sun,
  Sunrise,
  Timer,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useOrgStorage } from "@/lib/use-org-storage";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { BulkActionsBar } from "@/components/bulk-actions-bar";
import { ShowAllToggle } from "@/components/show-all-toggle";
import { PaginationBar } from "@/components/pagination-bar";
import { useApp } from "@/lib/app-context";
import { usePagination } from "@/lib/use-pagination";
import { useSelection } from "@/lib/use-selection";
import {
  type ShiftType,
  type StaffMember,
  type StaffRole,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export type ShiftLog = {
  id: string;
  employeeId: string;
  date: string;       // YYYY-MM-DD
  checkIn: string;    // HH:MM
  checkOut: string;   // HH:MM
  hours: number;
  note?: string;
};

function computeHours(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [h1, m1] = checkIn.split(":").map(Number);
  const [h2, m2] = checkOut.split(":").map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff — PharmLedger" },
      { name: "description", content: "Manage pharmacy staff, payroll, shifts and working hours." },
    ],
  }),
  component: StaffPage,
});

const ROLES: StaffRole[] = ["pharmacist", "manager", "cashier", "assistant", "cleaner"];
const SHIFTS: ShiftType[] = ["morning", "evening", "night", "off"];

const shiftIcon: Record<ShiftType, typeof Sun> = {
  morning: Sunrise, evening: Sun, night: Moon, off: Clock,
};
const shiftTone: Record<ShiftType, string> = {
  morning: "bg-warning/15 text-warning border-warning/30",
  evening: "bg-info/15 text-info border-info/30",
  night: "bg-secondary/15 text-secondary border-secondary/30",
  off: "bg-muted text-muted-foreground border-border",
};
const roleTone: Record<StaffRole, string> = {
  pharmacist: "bg-primary/15 text-primary border-primary/30",
  manager: "bg-secondary/15 text-secondary border-secondary/30",
  cashier: "bg-info/15 text-info border-info/30",
  assistant: "bg-success/15 text-success border-success/30",
  cleaner: "bg-muted text-muted-foreground border-border",
};

function StaffPage() {
  const { t, fmt, lang, dir } = useApp();
  const [members, setMembers] = useOrgStorage<StaffMember>("staff.members", []);
  const [shifts, setShifts] = useOrgStorage<ShiftLog>("staff.shifts", []);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<StaffRole | "all">("all");
  const [shift, setShift] = useState<ShiftType | "all">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));

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
      return (
        m.id.toLowerCase().includes(q) ||
        m.name.ar.includes(q) || m.name.en.toLowerCase().includes(q) ||
        m.phone.includes(q) || m.email.toLowerCase().includes(q)
      );
    });
  }, [members, query, role, shift]);

  const totals = useMemo(() => {
    const count = members.length;
    const payroll = members.reduce((s, m) => s + m.salary, 0);
    const onShift = members.filter((m) => m.shift !== "off" && m.active).length;
    const avg = count ? Math.round(payroll / count) : 0;
    return { count, payroll, onShift, avg };
  }, [members]);

  const buildStaffExport = () => {
    const headers = ["id", "name", "role", "phone", "email", "baseSalary", "overtimeSalary", "housingAllowance", "transportAllowance", "totalSalary", "shift", "hireDate", "hoursMTD", "active"];
    const rows = filtered.map((m) => ({
      id: m.id, name: m.name.en, role: m.role, phone: m.phone, email: m.email,
      baseSalary: m.baseSalary, overtimeSalary: m.overtimeSalary,
      housingAllowance: m.housingAllowance, transportAllowance: m.transportAllowance,
      totalSalary: m.salary, shift: m.shift, hireDate: m.hireDate,
      hoursMTD: m.hoursThisMonth, active: String(m.active),
    }));
    return { headers, rows };
  };
  const exportXlsx = async () => {
    const { headers, rows } = buildStaffExport();
    const { exportRowsAsXlsx } = await import("@/lib/data-export");
    await exportRowsAsXlsx({ filename: `pharmledger-staff-${Date.now()}`, sheetName: "Staff", headers, rows });
  };
  const exportPdf = async () => {
    const { headers, rows } = buildStaffExport();
    const { exportRowsAsPdf } = await import("@/lib/data-export");
    await exportRowsAsPdf({ filename: `pharmledger-staff-${Date.now()}`, title: String(t("staffTitle" as never) || "Staff"), headers, rows, lang });
  };


  const addMember = (m: Omit<StaffMember, "id">) => {
    const id = `EMP-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setMembers((prev) => [{ ...m, id }, ...prev]);
    toast.success(t("addedEmployee"));
    setOpen(false);
  };

  const updateMember = (id: string, m: Omit<StaffMember, "id">) => {
    setMembers((prev) => prev.map((x) => (x.id === id ? { ...m, id } : x)));
    toast.success(t("save"));
    setEditing(null);
  };

  const cycleShift = (id: string) => {
    setMembers((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const idx = SHIFTS.indexOf(m.shift);
      return { ...m, shift: SHIFTS[(idx + 1) % SHIFTS.length] };
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
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="px-4 lg:px-8 py-6 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                <span className="text-gradient">{t("staffTitle")}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{t("staffSubtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportXlsx} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <Download className="size-4" />{t("exportExcel")}
              </button>
              <button onClick={exportPdf} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <FileText className="size-4" />{t("exportPdf")}
              </button>
              <button onClick={() => setLogOpen(true)} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-card border border-border hover:bg-muted transition">
                <Timer className="size-4" />{t("logShift")}
              </button>
              <button onClick={() => setOpen(true)} className="h-10 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition">
                <Plus className="size-4" />{t("newEmployee")}
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={Users} label={t("staffCount")} value={fmt(totals.count)} accent="primary" />
            <Stat icon={UserCheck} label={t("onShift")} value={fmt(totals.onShift)} accent="success" />
            <Stat icon={Wallet} label={t("monthlyPayroll")} value={fmt(totals.payroll)} suffix={t("currency")} accent="warning" />
            <Stat icon={Briefcase} label={t("avgSalary")} value={fmt(totals.avg)} suffix={t("currency")} accent="info" />
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in">
            <div className="relative flex-1 min-w-[220px]">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground", dir === "rtl" ? "right-3" : "left-3")} />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchStaff")}
                className={cn(
                  "w-full h-10 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition",
                  dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4",
                )}
              />
            </div>
            <FilterChips label={t("role")} value={role} options={ROLES} onChange={(v) => setRole(v as StaffRole | "all")} t={t} />
            <FilterChips label={t("shift")} value={shift} options={SHIFTS} onChange={(v) => setShift(v as ShiftType | "all")} t={t} />
          </div>

          {/* List view */}
          <ShowAllToggle showAll={pg.showAll} total={pg.total} onToggle={pg.toggleShowAll} />
          <BulkActionsBar
            count={sel.count}
            total={filtered.length}
            allSelected={sel.allSelected}
            onSelectAll={sel.toggleAll}
            onClear={sel.clear}
            onDelete={deleteSelected}
          />
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/60">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-muted/30 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-3">{t("employeeName")}</div>
              <div className="col-span-2">{t("role")}</div>
              <div className="col-span-2">{t("contact")}</div>
              <div className="col-span-2">{t("totalSalary")}</div>
              <div className="col-span-2">{t("shift")}</div>
              <div className="col-span-1 text-center">{t("selectAll")}</div>
            </div>
            {pg.pageItems.map((m) => {
              const SIcon = shiftIcon[m.shift];
              const initials = m.name.en.split(" ").filter(Boolean).slice(0, 2).map((p) => p.replace(".", "")[0]).join("").toUpperCase();
              const hire = new Date(m.hireDate);
              return (
                <div
                  key={m.id}
                  className={cn(
                    "group relative grid grid-cols-1 lg:grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-muted/30 transition",
                    sel.isSelected(m.id) && "bg-primary/5"
                  )}
                >
                  {/* Name + ID */}
                  <div className="col-span-1 lg:col-span-3 flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0 font-bold text-sm glow-primary">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{m.name[lang]}</div>
                      <div className="text-[11px] text-muted-foreground tabular">{m.id}</div>
                    </div>
                  </div>

                  {/* Role + Hire date */}
                  <div className="col-span-1 lg:col-span-2 min-w-0">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block", roleTone[m.role])}>
                      {t(m.role as never)}
                    </span>
                    <div className="text-[11px] text-muted-foreground mt-1 tabular flex items-center gap-1">
                      <CalendarClock className="size-3" />
                      {hire.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { month: "short", year: "numeric" })}
                    </div>
                  </div>

                  {/* Phone + Email */}
                  <div className="col-span-1 lg:col-span-2 min-w-0 space-y-0.5">
                    <div className="text-sm tabular truncate flex items-center gap-1.5">
                      <Phone className="size-3 text-muted-foreground" />
                      {m.phone}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                      <Mail className="size-3" />
                      {m.email}
                    </div>
                  </div>

                  {/* Salary breakdown */}
                  <div className="col-span-1 lg:col-span-2 min-w-0">
                    <div className="font-bold tabular text-sm text-primary">
                      {fmt(m.salary)} <span className="text-[10px] text-muted-foreground font-normal">{t("currency")}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular">
                      {t("baseSalary")}: {fmt(m.baseSalary)}
                    </div>
                  </div>

                  {/* Shift toggle */}
                  <div className="col-span-1 lg:col-span-2 min-w-0">
                    <button onClick={() => cycleShift(m.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold border group-hover:scale-105 transition" title={t("shift")}>
                      <SIcon className="size-3" />{t(m.shift as never)}
                    </button>
                    <div className="text-[11px] text-muted-foreground mt-1 tabular">
                      {t("hoursThisMonth")}: {fmt(m.hoursThisMonth)}h
                    </div>
                  </div>

                  {/* Actions + Checkbox */}
                  <div className="col-span-1 lg:col-span-1 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(m)}
                      aria-label={t("edit" as never)}
                      title={t("edit" as never)}
                      className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-primary transition"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <label className="size-8 rounded-lg hover:bg-muted grid place-items-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label={t("selectAll")}
                        checked={sel.isSelected(m.id)}
                        onChange={() => sel.toggle(m.id)}
                        className="size-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-muted-foreground">{t("noResults")}</div>
            )}
            <PaginationBar page={pg.page} totalPages={pg.totalPages} total={pg.total} from={pg.from} to={pg.to} onPageChange={pg.setPage} showAll={pg.showAll} onToggleShowAll={pg.toggleShowAll} />
          </div>

          {/* Shifts report */}
          <ShiftsReport
            members={members}
            shifts={shifts}
            setShifts={setShifts}
            month={reportMonth}
            setMonth={setReportMonth}
            lang={lang}
            fmt={fmt}
            dir={dir}
          />
        </main>
      </div>

      {open && <AddStaffDialog onClose={() => setOpen(false)} onSubmit={addMember} />}
      {editing && (
        <AddStaffDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(m) => updateMember(editing.id, m)}
        />
      )}
      {logOpen && (
        <LogShiftDialog
          members={members}
          lang={lang}
          dir={dir}
          onClose={() => setLogOpen(false)}
          onSubmit={(entries) => {
            const withIds: ShiftLog[] = entries.map((entry) => ({
              ...entry,
              id: `SH-${String(Math.floor(Math.random() * 90000) + 10000)}`,
            }));
            setShifts((prev) => [...withIds, ...prev]);
            toast.success(lang === "ar" ? "تم تسجيل المناوبة" : "Shift logged");
            setLogOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix, accent = "primary" }: {
  icon: typeof Users;
  label: string; value: string; suffix?: string;
  accent?: "primary" | "secondary" | "success" | "info" | "warning" | "destructive";
}) {
  const tone: Record<string, string> = {
    primary: "from-primary/20 to-primary/0 text-primary",
    secondary: "from-secondary/20 to-secondary/0 text-secondary",
    success: "from-success/20 to-success/0 text-success",
    info: "from-info/20 to-info/0 text-info",
    warning: "from-warning/20 to-warning/0 text-warning",
    destructive: "from-destructive/20 to-destructive/0 text-destructive",
  };
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden animate-fade-in">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none", tone[accent])} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className={cn("size-9 rounded-xl grid place-items-center bg-background/40 border border-border/50", tone[accent].split(" ").pop())}>
            <Icon className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <div className="text-2xl font-bold tabular tracking-tight">{value}</div>
          {suffix && <div className="text-xs font-medium text-muted-foreground">{suffix}</div>}
        </div>
      </div>
    </div>
  );
}

function FilterChips({ label, value, options, onChange, t }: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; t: (k: never) => string;
}) {
  const all = ["all", ...options];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {all.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            className={cn("h-8 px-3 rounded-lg text-xs font-semibold transition border",
              value === o
                ? "gradient-primary text-primary-foreground border-transparent"
                : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted",
            )}>
            {o === "all" ? t("filterAll" as never) : t(o as never)}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddStaffDialog({ onClose, onSubmit, initial }: {
  onClose: () => void;
  onSubmit: (m: Omit<StaffMember, "id">) => void;
  initial?: StaffMember;
}) {
  const { t } = useApp();
  const [name, setName] = useState(initial?.name.en ?? "");
  const [role, setRole] = useState<StaffRole>(initial?.role ?? "pharmacist");
  const [shift, setShift] = useState<ShiftType>(initial?.shift ?? "morning");
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

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) return toast.error("Name required");
    if (!base || base <= 0) return toast.error("Base salary must be > 0");
    onSubmit({
      name: initial ? { ar: name, en: name } : { ar: name, en: name },
      role, shift,
      phone: phone || "—",
      email: email || "—",
      baseSalary: base,
      overtimeSalary: ot,
      housingAllowance: housing,
      transportAllowance: transport,
      salary: totalSal,
      hireDate: initial?.hireDate ?? new Date().toISOString(),
      hoursThisMonth: initial?.hoursThisMonth ?? 0,
      active: initial?.active ?? true,
    });
  };


  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("newEmployee")}</h2>
            <p className="text-xs text-muted-foreground">{t("staffSubtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("employeeName")} full>
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("role")}>
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              {ROLES.map((r) => <option key={r} value={r}>{t(r as never)}</option>)}
            </select>
          </Field>
          <Field label={t("shift")}>
            <select value={shift} onChange={(e) => setShift(e.target.value as ShiftType)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              {SHIFTS.map((s) => <option key={s} value={s}>{t(s as never)}</option>)}
            </select>
          </Field>
          <Field label={`${t("baseSalary")} (${t("currency")})`}>
            <input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} min={1} required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("overtimeSalary")} (${t("currency")})`}>
            <input type="number" value={overtimeSalary} onChange={(e) => setOvertimeSalary(e.target.value)} min={0} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("housingAllowance")} (${t("currency")})`}>
            <input type="number" value={housingAllowance} onChange={(e) => setHousingAllowance(e.target.value)} min={0} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("transportAllowance")} (${t("currency")})`}>
            <input type="number" value={transportAllowance} onChange={(e) => setTransportAllowance(e.target.value)} min={0} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={`${t("totalSalary")} (${t("currency")})`} full>
            <input type="number" value={totalSal || ""} readOnly className="w-full h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm tabular font-bold text-primary" />
          </Field>
          <Field label={t("phone")}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9665…" className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
          <Field label={t("email")} full>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">{t("cancel")}</button>
          <button type="submit" className="h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2">
            <Plus className="size-4" />{t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular text-foreground/90 font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("space-y-1.5 block", full && "col-span-2")}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function LogShiftDialog({
  members, lang, dir, onClose, onSubmit,
}: {
  members: StaffMember[];
  lang: "ar" | "en";
  dir: "rtl" | "ltr";
  onClose: () => void;
  onSubmit: (entries: Omit<ShiftLog, "id">[]) => void;
}) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const [employeeId, setEmployeeId] = useState(members[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessions, setSessions] = useState<{ checkIn: string; checkOut: string }[]>([
    { checkIn: "09:00", checkOut: "13:00" },
  ]);
  const [note, setNote] = useState("");

  const updateSession = (i: number, patch: Partial<{ checkIn: string; checkOut: string }>) => {
    setSessions((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const addSession = () => setSessions((prev) => [...prev, { checkIn: "14:00", checkOut: "18:00" }]);
  const removeSession = (i: number) => setSessions((prev) => prev.filter((_, idx) => idx !== i));

  const perSessionHours = sessions.map((s) => computeHours(s.checkIn, s.checkOut));
  const totalHours = Math.round(perSessionHours.reduce((a, b) => a + b, 0) * 100) / 100;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!employeeId) return toast.error(L("اختر موظفاً", "Pick an employee"));
    if (!date) return toast.error(L("اختر التاريخ", "Pick a date"));
    if (totalHours <= 0) return toast.error(L("الساعات يجب أن تكون أكبر من صفر", "Hours must be > 0"));
    const entries = sessions
      .map((s) => ({
        employeeId,
        date,
        checkIn: s.checkIn,
        checkOut: s.checkOut,
        hours: computeHours(s.checkIn, s.checkOut),
        note: note || undefined,
      }))
      .filter((e) => e.hours > 0);
    if (entries.length === 0) return toast.error(L("لا توجد جلسات صالحة", "No valid sessions"));
    onSubmit(entries);
  };

  return (
    <div dir={dir} className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{L("تسجيل مناوبة", "Log Shift")}</h2>
            <p className="text-xs text-muted-foreground">{L("يمكنك تسجيل أكثر من حضور وانصراف في نفس اليوم", "Record multiple check-ins/outs on the same day")}</p>
          </div>
          <button type="button" onClick={onClose} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={L("الموظف", "Employee")} full>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40">
              {members.length === 0 && <option value="">{L("لا يوجد موظفون — أضف موظف أولاً", "No employees — add one first")}</option>}
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name[lang]} ({m.id})</option>
              ))}
            </select>
          </Field>
          <Field label={L("التاريخ", "Date")} full>
            <DatePickerInput value={date} onChange={setDate} required className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{L("الجلسات", "Sessions")}</span>
            <button type="button" onClick={addSession} className="h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 bg-card border border-border hover:bg-muted transition">
              <Plus className="size-3.5" />{L("إضافة جلسة", "Add session")}
            </button>
          </div>
          {sessions.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
              <input type="time" value={s.checkIn} onChange={(e) => updateSession(i, { checkIn: e.target.value })} required className="h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
              <input type="time" value={s.checkOut} onChange={(e) => updateSession(i, { checkOut: e.target.value })} required className="h-10 rounded-xl bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
              <span className="text-xs tabular font-semibold text-primary min-w-[3.5rem] text-center">{perSessionHours[i] || 0}h</span>
              <button
                type="button"
                onClick={() => removeSession(i)}
                disabled={sessions.length === 1}
                className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed transition"
                aria-label="remove"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={L("إجمالي اليوم", "Day total")}>
            <input value={totalHours ? `${totalHours} h` : ""} readOnly className="w-full h-10 rounded-xl bg-muted/60 border border-border px-3 text-sm tabular font-bold text-primary" />
          </Field>
          <Field label={L("ملاحظة (اختياري)", "Note (optional)")}>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full h-10 rounded-xl bg-input/40 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
          </Field>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/70 transition">{L("إلغاء", "Cancel")}</button>
          <button type="submit" disabled={members.length === 0} className="h-10 px-5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition inline-flex items-center gap-2 disabled:opacity-50">
            <Timer className="size-4" />{L("حفظ", "Save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function ShiftsReport({
  members, shifts, setShifts, month, setMonth, lang, fmt, dir,
}: {
  members: StaffMember[];
  shifts: ShiftLog[];
  setShifts: React.Dispatch<React.SetStateAction<ShiftLog[]>>;
  month: string;
  setMonth: (m: string) => void;
  lang: "ar" | "en";
  fmt: (n: number) => string;
  dir: "rtl" | "ltr";
}) {
  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const monthShifts = useMemo(
    () => shifts.filter((s) => s.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)),
    [shifts, month],
  );
  const totals = useMemo(() => {
    const map = new Map<string, { hours: number; days: number }>();
    for (const s of monthShifts) {
      const cur = map.get(s.employeeId) ?? { hours: 0, days: 0 };
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
        days: v.days,
      };
    }).sort((a, b) => b.hours - a.hours);
  }, [monthShifts, members, lang]);

  const exportXlsx = async () => {
    const headers = ["date", "employeeId", "employee", "checkIn", "checkOut", "hours", "note"];
    const rows = monthShifts.map((s) => ({
      date: s.date, employeeId: s.employeeId,
      employee: members.find((m) => m.id === s.employeeId)?.name[lang] ?? s.employeeId,
      checkIn: s.checkIn, checkOut: s.checkOut, hours: s.hours, note: s.note ?? "",
    }));
    const { exportRowsAsXlsx } = await import("@/lib/data-export");
    await exportRowsAsXlsx({ filename: `pharmledger-shifts-${month}`, sheetName: "Shifts", headers, rows });
  };
  const exportPdfShifts = async () => {
    const headers = ["date", "employeeId", "employee", "checkIn", "checkOut", "hours", "note"];
    const rows = monthShifts.map((s) => ({
      date: s.date, employeeId: s.employeeId,
      employee: members.find((m) => m.id === s.employeeId)?.name[lang] ?? s.employeeId,
      checkIn: s.checkIn, checkOut: s.checkOut, hours: s.hours, note: s.note ?? "",
    }));
    const { exportRowsAsPdf } = await import("@/lib/data-export");
    await exportRowsAsPdf({ filename: `pharmledger-shifts-${month}`, title: L("تقرير ساعات العمل", "Work Hours Report"), headers, rows, lang });
  };


  const remove = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(L("حذف هذه المناوبة؟", "Delete this shift?"))) return;
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5 animate-fade-in" dir={dir}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base">{L("تقرير ساعات العمل", "Work Hours Report")}</h3>
          <p className="text-xs text-muted-foreground">{L("مجموع ساعات كل موظف للشهر المختار", "Total hours per employee for selected month")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-9 rounded-lg bg-input/40 border border-border px-3 text-sm tabular focus:outline-none focus:ring-2 focus:ring-ring/40" />
          <button onClick={exportXlsx} className="h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-card border border-border hover:bg-muted transition">
            <Download className="size-3.5" />Excel
          </button>
          <button onClick={exportPdfShifts} className="h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-card border border-border hover:bg-muted transition">
            <Download className="size-3.5" />PDF
          </button>
        </div>
      </div>

      {/* Per-employee totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {totals.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-8">
            {L("لا توجد مناوبات في هذا الشهر", "No shifts recorded this month")}
          </div>
        )}
        {totals.map((t) => (
          <div key={t.employeeId} className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-sm font-semibold truncate">{t.name}</div>
            <div className="text-2xl font-bold tabular mt-1 text-primary">
              {fmt(t.hours)} <span className="text-xs font-normal text-muted-foreground">h</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {fmt(t.days)} {L("يوم عمل", "days")}
            </div>
          </div>
        ))}
      </div>

      {/* Detail log */}
      {monthShifts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="text-start font-medium py-2">{L("التاريخ", "Date")}</th>
                <th className="text-start font-medium">{L("الموظف", "Employee")}</th>
                <th className="text-start font-medium">{L("الحضور", "In")}</th>
                <th className="text-start font-medium">{L("الانصراف", "Out")}</th>
                <th className="text-end font-medium">{L("الساعات", "Hours")}</th>
                <th className="text-end font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {monthShifts.map((s) => {
                const name = members.find((m) => m.id === s.employeeId)?.name[lang] ?? s.employeeId;
                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition">
                    <td className="py-2.5 tabular">{s.date}</td>
                    <td className="py-2.5">{name}</td>
                    <td className="py-2.5 tabular">{s.checkIn}</td>
                    <td className="py-2.5 tabular">{s.checkOut}</td>
                    <td className="py-2.5 text-end tabular font-semibold">{fmt(s.hours)} h</td>
                    <td className="py-2.5 text-end">
                      <button onClick={() => remove(s.id)} className="size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center inline-grid">
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
