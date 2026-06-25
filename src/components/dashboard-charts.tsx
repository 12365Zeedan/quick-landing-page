import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "@/lib/app-context";
import { useFinancials, type LiveFinancials } from "@/lib/use-financials";

type FinProp = { fin?: LiveFinancials };
function useFin(fin?: LiveFinancials): LiveFinancials {
  const live = useFinancials();
  return fin ?? live;
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

const chartTooltipStyle: React.CSSProperties = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "var(--shadow-elegant)",
  color: "var(--color-popover-foreground)",
};

function ChartShell({ children, height = 260 }: { children: React.ReactNode; height?: number }) {
  const mounted = useMounted();
  if (!mounted) return <div style={{ height }} className="rounded-xl bg-muted/30 animate-pulse" />;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueExpenseChart({ fin }: FinProp = {}) {
  const { dailySeries } = useFin(fin);
  return (
    <ChartShell height={280}>
      <LineChart data={dailySeries} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-chart-1)" />
            <stop offset="100%" stopColor="var(--color-chart-2)" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip contentStyle={chartTooltipStyle} cursor={{ stroke: "var(--color-primary)", strokeWidth: 1, strokeDasharray: "3 3" }} />
        <Line type="monotone" dataKey="revenue" stroke="url(#revLine)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="expenses" stroke="var(--color-warning)" strokeWidth={2} dot={false} strokeDasharray="4 4" activeDot={{ r: 4 }} />
      </LineChart>
    </ChartShell>
  );
}

export function PaymentMixChart({ fin }: FinProp = {}) {
  const { t } = useApp();
  const { paymentMix } = useFin(fin);
  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];
  const data = paymentMix.map((p) => ({ ...p, label: t(p.name as any) }));

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <ChartShell height={200}>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle} />
          </PieChart>
        </ChartShell>
      </div>
      <div className="space-y-2 shrink-0">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-sm" style={{ background: colors[i] }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-semibold tabular">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthlyProfitChart({ fin }: FinProp = {}) {
  const { monthlyProfit } = useFin(fin);
  return (
    <ChartShell height={240}>
      <BarChart data={monthlyProfit} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
        <Bar dataKey="profit" fill="url(#barFill)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartShell>
  );
}

export function CashFlowChart({ fin }: FinProp = {}) {
  const { cashFlow } = useFin(fin);
  return (
    <ChartShell height={220}>
      <AreaChart data={cashFlow} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Area type="monotone" dataKey="balance" stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#areaFill)" />
      </AreaChart>
    </ChartShell>
  );
}
