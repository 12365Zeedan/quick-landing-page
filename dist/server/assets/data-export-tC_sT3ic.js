import { buildReportTableHtml, exportHtmlAsPdf } from "./pdf-export-yIcOFHks.js";
const r2 = (n) => {
  if (typeof n === "number" && Number.isFinite(n)) return Math.round(n * 100) / 100;
  return n ?? "";
};
async function exportRowsAsXlsx(opts) {
  if (typeof window === "undefined") return;
  const XLSX = await import("xlsx");
  const aoa = [opts.headers];
  for (const row of opts.rows) {
    aoa.push(opts.headers.map((h) => r2(row[h])));
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (opts.sheetName || "Sheet1").slice(0, 31));
  XLSX.writeFile(wb, opts.filename.endsWith(".xlsx") ? opts.filename : `${opts.filename}.xlsx`);
}
const fmtCell = (v) => {
  if (typeof v === "number" && Number.isFinite(v)) {
    return (Math.round(v * 100) / 100).toFixed(2);
  }
  return String(v ?? "");
};
async function exportRowsAsPdf(opts) {
  if (typeof window === "undefined") return;
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const body = opts.rows.map((row) => opts.headers.map((h) => fmtCell(row[h])));
  const html = buildReportTableHtml({
    title: opts.title,
    subtitle: opts.subtitle,
    date,
    headers: opts.headers,
    rows: body,
    lang: opts.lang,
    footerText: `PharmLedger — ${date}`
  });
  await exportHtmlAsPdf({
    html,
    filename: opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`,
    orientation: opts.orientation ?? "landscape"
  });
}
export {
  exportRowsAsPdf,
  exportRowsAsXlsx
};
