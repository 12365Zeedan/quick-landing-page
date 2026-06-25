// Shared helpers to export tabular data as XLSX or PDF across the site.
// CSV exports are no longer offered — only Excel (.xlsx) and PDF.
import { buildReportTableHtml, exportHtmlAsPdf } from "@/lib/pdf-export";

export type Row = Record<string, string | number | null | undefined>;

const r2 = (n: unknown): number | string => {
  if (typeof n === "number" && Number.isFinite(n)) return Math.round(n * 100) / 100;
  return (n as string | number | null | undefined) ?? "";
};

export async function exportRowsAsXlsx(opts: {
  filename: string;
  sheetName?: string;
  headers: string[];
  rows: Row[];
}) {
  if (typeof window === "undefined") return;
  const XLSX = await import("xlsx");
  const aoa: (string | number)[][] = [opts.headers];
  for (const row of opts.rows) {
    aoa.push(opts.headers.map((h) => r2(row[h]) as string | number));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (opts.sheetName || "Sheet1").slice(0, 31));
  XLSX.writeFile(wb, opts.filename.endsWith(".xlsx") ? opts.filename : `${opts.filename}.xlsx`);
}

const fmtCell = (v: unknown): string => {
  if (typeof v === "number" && Number.isFinite(v)) {
    return (Math.round(v * 100) / 100).toFixed(2);
  }
  return String(v ?? "");
};

export async function exportRowsAsPdf(opts: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Row[];
  lang: "ar" | "en";
  orientation?: "portrait" | "landscape";
}) {
  if (typeof window === "undefined") return;
  const date = new Date().toISOString().slice(0, 10);
  const body = opts.rows.map((row) => opts.headers.map((h) => fmtCell(row[h])));
  const html = buildReportTableHtml({
    title: opts.title,
    subtitle: opts.subtitle,
    date,
    headers: opts.headers,
    rows: body,
    lang: opts.lang,
    footerText: `PharmLedger — ${date}`,
  });
  await exportHtmlAsPdf({
    html,
    filename: opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`,
    orientation: opts.orientation ?? "landscape",
  });
}
