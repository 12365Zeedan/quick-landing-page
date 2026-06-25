// Shared helper to render an HTML node to a multi-page PDF with proper
// RTL/Arabic support via html2canvas (preserves browser-shaped Arabic glyphs).

export function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ExportHtmlPdfOptions {
  html: string;
  filename: string;
  orientation?: "portrait" | "landscape";
  margin?: number;
}

export async function exportHtmlAsPdf({
  html,
  filename,
  orientation = "landscape",
  margin = 24,
}: ExportHtmlPdfOptions) {
  if (typeof window === "undefined") return;
  const { default: jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas-pro")).default;

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  try {
    const target = wrapper.firstElementChild as HTMLElement;
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const usableW = pageW - margin * 2;
    const imgH = (canvas.height * usableW) / canvas.width;

    if (imgH <= pageH - margin * 2) {
      doc.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, usableW, imgH);
    } else {
      const pxPerPt = canvas.width / usableW;
      const sliceHpx = (pageH - margin * 2) * pxPerPt;
      let y = 0;
      let first = true;
      while (y < canvas.height) {
        const h = Math.min(sliceHpx, canvas.height - y);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = h;
        const ctx = slice.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (!first) doc.addPage();
        first = false;
        doc.addImage(slice.toDataURL("image/png"), "PNG", margin, margin, usableW, h / pxPerPt);
        y += h;
      }
    }
    doc.save(filename);
  } finally {
    document.body.removeChild(wrapper);
  }
}

export interface ReportTablePdfInput {
  title: string;
  subtitle?: string;
  date: string;
  headers: string[];
  rows: string[][];
  lang: "ar" | "en";
  footerText?: string;
}

export function buildReportTableHtml({
  title,
  subtitle,
  date,
  headers,
  rows,
  lang,
  footerText,
}: ReportTablePdfInput): string {
  const isAr = lang === "ar";
  const dirAttr = isAr ? "rtl" : "ltr";
  const bodyRows =
    rows.length > 0
      ? rows
          .map(
            (r, i) =>
              `<tr style="background:${i % 2 ? "#f8fafc" : "#ffffff"}">` +
              r
                .map(
                  (cell, ci) =>
                    `<td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;${
                      ci === 0 ? "" : "text-align:end;font-variant-numeric:tabular-nums;"
                    }">${escapeHtml(cell)}</td>`,
                )
                .join("") +
              `</tr>`,
          )
          .join("")
      : `<tr><td colspan="${headers.length}" style="padding:18px;text-align:center;color:#94a3b8;">—</td></tr>`;

  return `
    <div dir="${dirAttr}" lang="${lang}" style="font-family:'Cairo','Tahoma','Segoe UI',sans-serif;width:1100px;padding:28px;background:#ffffff;color:#0f172a;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;">
        <div>
          <div style="font-size:20px;font-weight:700;">${escapeHtml(title)}</div>
          ${subtitle ? `<div style="font-size:13px;color:#334155;margin-top:4px;">${escapeHtml(subtitle)}</div>` : ""}
        </div>
        <div style="text-align:end;font-size:11px;color:#64748b;line-height:1.6;">
          <div>${escapeHtml(date)}</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;direction:${dirAttr};">
        <thead>
          <tr style="background:#0f172a;color:#ffffff;">
            ${headers
              .map(
                (h, i) =>
                  `<th style="padding:8px;text-align:${i === 0 ? "start" : "end"};">${escapeHtml(h)}</th>`,
              )
              .join("")}
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      ${
        footerText
          ? `<div style="margin-top:18px;font-size:10px;color:#94a3b8;text-align:center;">${escapeHtml(footerText)}</div>`
          : ""
      }
    </div>`;
}
