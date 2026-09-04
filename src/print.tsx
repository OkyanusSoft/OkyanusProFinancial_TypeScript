import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import { SYSTEM } from "./data";

/* ════════════════════════════════════════════════════════════
   محرك الطباعة الاحترافي — مستندات A4 بترويسة وختم واعتمادات
   ════════════════════════════════════════════════════════════ */

/* الطباعة عبر iframe معزول تماماً — يُطبع المستند وحده ولا يمكن أبداً
   أن تلتقط الطابعة محتويات شاشة التطبيق (الحل القوي والموثوق) */
export function openPrint(content: ReactNode) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "طباعة مستند";
  iframe.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:9999;background:#fff;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) { iframe.remove(); return; }

  /* جمع أنماط التطبيق (الخطوط + مكونات الطباعة) من ملف CSS المجمّع */
  let css = "";
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try { css += Array.from(sheet.cssRules).map((r) => r.cssText).join("\n") + "\n"; } catch { /* قواعد CORS */ }
    }
  } catch { /* ignore */ }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>${SYSTEM.name} — مستند للطباعة</title>
<style>
${css}
/* ── عزل صارم: خلفية بيضاء والمستند فقط ── */
html, body { background:#fff !important; margin:0 !important; }
body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
#print-doc { position:static !important; background:#fff !important; margin:0 !important; padding:0 !important; }
.print-doc { box-shadow:none !important; border-radius:0 !important; }
@media print {
  body { background:#fff !important; }
  .print-doc { box-shadow:none !important; border-radius:0 !important; }
  .no-print { display:none !important; }
}
@page { size: A4; margin: 9mm; }
</style>
</head>
<body>
<div id="print-doc"></div>
</body>
</html>`);
  doc.close();

  const host = doc.getElementById("print-doc");
  if (!host) { iframe.remove(); return; }
  const root = createRoot(host);
  root.render(<div dir="rtl">{content}</div>);

  let printed = false;
  const firePrint = () => {
    if (printed) return;
    printed = true;
    try {
      const w = iframe.contentWindow;
      if (w) { w.focus(); w.print(); }
    } catch { /* ignore */ }
  };
  const cleanup = () => {
    setTimeout(() => { try { root.unmount(); } catch { /* ignore */ } iframe.remove(); }, 500);
  };

  /* الانتظار حتى يكتمل رسم المستند داخل الـ iframe ثم الطباعة مرة واحدة */
  iframe.onload = () => setTimeout(firePrint, 150);
  setTimeout(firePrint, 500); /* احتياط إن لم يُطلق onload */

  iframe.contentWindow?.addEventListener("afterprint", cleanup);
  setTimeout(cleanup, 60000); /* حد أقصى للتنظيف */
}

/* ── شعار مطبوع ── */
export function PMark({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#0a4a73" />
      <path d="M8 28c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#67d5ff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M8 19c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#a5e6ff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
      <circle cx="37" cy="13" r="3" fill="#ffd28a" />
    </svg>
  );
}

/* ── ختم المطابقة (Stamp) ── */
export function PStamp({ status }: { status: string }) {
  const bad = status.includes("ملغ") || status.includes("مرفوض");
  const pend = status.includes("بانتظار");
  const color = bad ? "#b3382f" : pend ? "#a16207" : "#146c43";
  return (
    <div className="p-stamp" style={{ color, borderColor: color }}>
      <span>{status}</span>
      <small>{SYSTEM.name}</small>
    </div>
  );
}

/* ── ترويسة المستند ── */
export function PHead({ docTitle, no, date, status, subtitle }: { docTitle: string; no: string; date: string; status: string; subtitle?: string }) {
  return (
    <div>
      <div className="p-head">
        <div className="p-head-side">
          <PMark />
          <div>
            <div className="p-sys">{SYSTEM.name}</div>
            <div className="p-co">{SYSTEM.company} — {subtitle || "المركز الرئيسي"}</div>
            <div className="p-co2">{SYSTEM.en} • {SYSTEM.site.replace("https://", "")}</div>
          </div>
        </div>
        <div className="p-head-no">
          <div className="p-doctype">{docTitle}</div>
          <div className="p-num" dir="ltr">{no}</div>
          <div className="p-date" dir="ltr">{date}</div>
        </div>
      </div>
      <div className="p-rule" />
      <div className="p-stampwrap"><PStamp status={status} /></div>
    </div>
  );
}

/* ── شبكة بيانات الطرف/الميتا ── */
export function PMeta({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="p-meta">
      {rows.map(([k, v], i) => (
        <div className="p-meta-cell" key={i}>
          <span className="p-meta-k">{k}</span>
          <span className="p-meta-v">{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ── جدول طباعة ── */
export function PTable({ head, rows, widths }: { head: ReactNode[]; rows: ReactNode[][]; widths?: (string | undefined)[] }) {
  return (
    <table className="p-table">
      <thead><tr>{head.map((h, i) => <th key={i} style={widths?.[i] ? { width: widths[i] } : undefined}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

/* ── صندوق الإجماليات ── */
export function PTotals({ items, grand }: { items: [string, string][]; grand: [string, string] }) {
  return (
    <div className="p-totals">
      {items.map(([k, v], i) => (
        <div className="p-total-row" key={i}><span>{k}</span><b dir="ltr">{v}</b></div>
      ))}
      <div className="p-grand"><span>{grand[0]}</span><b dir="ltr">{grand[1]}</b></div>
    </div>
  );
}

/* ── خانة الملاحظات ── */
export function PNote({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="p-note"><span>ملاحظات:</span> {text}</div>;
}

/* ── توقيعات الاعتماد ── */
export function PSign({ labels = ["المُعد / أمين المخزن", "المراجع المالي", "المعتمد / المدير المالي"] }: { labels?: string[] }) {
  return (
    <div className="p-sign">
      {labels.map((l, i) => (
        <div className="p-sign-box" key={i}>
          <div className="p-sign-line" />
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}

/* ── تذييل الصفحة ── */
export function PFoot({ user }: { user: string }) {
  const now = new Date();
  return (
    <div className="p-foot">
      <div>طُبع بواسطة: <b>{user}</b> — {now.toLocaleString("ar-EG")} </div>
      <div className="p-foot-mid">{SYSTEM.name} — {SYSTEM.company} <span dir="ltr">{SYSTEM.phone}</span></div>
      <div dir="ltr">{SYSTEM.site}</div>
      <div className="p-bar" aria-hidden="true">
        {`OKS-${now.getTime().toString().slice(-8)}`.split("").map((c, i) => (
          <span key={i} style={{ width: (c.charCodeAt(0) % 3) + 1, height: 16 - (i % 3) * 3 }} />
        ))}
      </div>
    </div>
  );
}

/* ── غلاف سند كامل ── */
export function DocSheet({ docTitle, no, date, status, subtitle, meta, children, totals, note, user, signLabels, stampText, stampSub, amountBox }: {
  docTitle: string; no: string; date: string; status: string; subtitle?: string;
  meta: [string, ReactNode][]; children: ReactNode; totals?: { items: [string, string][]; grand: [string, string] };
  note?: string; user: string; signLabels?: string[];
  stampText?: string; stampSub?: string; amountBox?: { num: string; words: string };
}) {
  return (
    <div className="print-doc">
      <PHead docTitle={docTitle} no={no} date={date} status={status} subtitle={subtitle} />
      <div className="p-rule" />
      {stampText && (
        <div className="p-stampwrap">
          <div className="p-stamp" style={{ color: docTitle.includes("قبض") ? "#15803d" : "#b45309" }}>
            {stampText}<small>{stampSub}</small>
          </div>
        </div>
      )}
      <PMeta rows={meta} />
      {amountBox && (
        <div className="p-amountbox">
          <div><span>المبلغ رقماً</span><b dir="ltr">{amountBox.num}</b></div>
          <div><span>المبلغ بالحروف</span><b>{amountBox.words}</b></div>
        </div>
      )}
      {children}
      {totals && <PTotals items={totals.items} grand={totals.grand} />}
      <PNote text={note} />
      <PSign labels={signLabels} />
      <PFoot user={user} />
    </div>
  );
}

/* ── غلاف تقرير كامل ── */
export function ReportSheet({ title, subtitle, filters, summary, children, user }: {
  title: string; subtitle?: string; filters?: [string, ReactNode][]; summary?: [string, ReactNode][];
  children: ReactNode; user: string;
}) {
  return (
    <div className="print-doc">
      <div className="p-head">
        <div className="p-head-side">
          <PMark />
          <div>
            <div className="p-sys">{SYSTEM.name}</div>
            <div className="p-co">{SYSTEM.company}</div>
            <div className="p-co2">{SYSTEM.en}</div>
          </div>
        </div>
        <div className="p-head-no">
          <div className="p-doctype">{title}</div>
          <div className="p-num" dir="ltr">RPT-{new Date().toISOString().slice(0, 10)}</div>
          <div className="p-date" dir="ltr">{new Date().toLocaleDateString("en-GB")}</div>
        </div>
      </div>
      <div className="p-rule" />
      {subtitle && <div className="p-repsub">{subtitle}</div>}
      {filters && filters.length > 0 && <PMeta rows={filters} />}
      {children}
      {summary && summary.length > 0 && (
        <div className="p-summary">
          {summary.map(([k, v], i) => <div key={i} className="p-summary-cell"><span>{k}</span><b dir="ltr">{v}</b></div>)}
        </div>
      )}
      <PFoot user={user} />
    </div>
  );
}

/* ═══════ التفقيط — كتابة المبلغ بالحروف العربية للسندات المالية ═══════ */
const TF_ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const TF_TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const TF_HUND = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
const TF_SCALE: [string, string, string][] = [["", "", ""], ["ألف", "ألفان", "آلاف"], ["مليون", "مليونان", "ملايين"], ["مليار", "ملياران", "مليارات"]];
export function tafqit(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "صفر";
  let out = "", si = 0;
  while (n > 0) {
    const g = n % 1000; n = Math.floor(n / 1000);
    if (g) {
      let t = "";
      const h = Math.floor(g / 100), r = g % 100;
      if (h) t = TF_HUND[h];
      if (r) t += (t ? " و" : "") + (r < 20 ? TF_ONES[r] : TF_TENS[Math.floor(r / 10)] + (r % 10 ? " و" + TF_ONES[r % 10] : ""));
      const [s1, s2, sp] = TF_SCALE[si];
      let seg: string;
      if (si === 0) seg = t;
      else if (g === 1) seg = s1; else if (g === 2) seg = s2; else seg = t + " " + (g <= 10 ? sp : s1);
      out = out ? seg + " و" + out : seg;
    }
    si++;
  }
  return out;
}

/* ═══════ طابعة السجلات العامة — أي دليل أو قائمة سجلات ═══════ */
export interface PrintCol { h: string; v: (r: any) => ReactNode; w?: string }
export function printDirectory(user: string, opts: {
  title: string; subtitle?: string; columns: PrintCol[]; rows: any[];
  filters?: [string, ReactNode][]; summary?: [string, ReactNode][];
}) {
  openPrint(
    <ReportSheet title={opts.title} subtitle={opts.subtitle || `سجل كامل — ${opts.rows.length} سجل`} filters={opts.filters} summary={opts.summary} user={user}>
      <PTable
        head={["#", ...opts.columns.map((c) => c.h)]}
        widths={["4%", ...opts.columns.map((c) => c.w)]}
        rows={opts.rows.map((r, i) => [<b key="i">{i + 1}</b>, ...opts.columns.map((c, j) => <span key={j}>{c.v(r)}</span>)])}
      />
    </ReportSheet>
  );
}

/* ═══════ طابعة مستندات التعاملات — فاتورة / عرض سعر / طلب ═══════ */
export function printTradeDoc(user: string, d: {
  docTitle: string; no: string; date: string; status: string;
  meta: [string, ReactNode][];
  lines: { name: string; unit?: string; qty: number | string; price: number | string; disc?: number | string; total: number | string }[];
  totals?: { items: [string, string][]; grand: [string, string] };
  grandValue?: number;
  note?: string; signLabels?: string[]; stampText?: string; fmtN: (n: number) => string;
}) {
  openPrint(
    <DocSheet docTitle={d.docTitle} no={d.no} date={d.date} status={d.status} meta={d.meta}
      stampText={d.stampText || d.docTitle} stampSub={d.status === "مسودة" ? "معاينة" : "معتمد"}
      amountBox={d.grandValue !== undefined ? { num: d.fmtN(d.grandValue) + " ر.ي", words: tafqit(d.grandValue) } : undefined}
      totals={d.totals} note={d.note} user={user} signLabels={d.signLabels || ["المحاسب", "المدير المالي"]}>
      <PTable
        head={["الصنف / البيان", "الوحدة", "الكمية", "سعر الوحدة", "خصم %", "الإجمالي"]}
        widths={["40%", "8%", "10%", "14%", "9%", "19%"]}
        rows={d.lines.map((l) => [
          <b key="n">{l.name}</b>,
          <span key="u" dir="ltr">{l.unit || "—"}</span>,
          <span key="q" dir="ltr">{l.qty}</span>,
          <span key="p" dir="ltr">{l.price}</span>,
          <span key="d" dir="ltr">{l.disc ?? "—"}</span>,
          <b key="t" dir="ltr">{l.total}</b>,
        ])}
      />
    </DocSheet>
  );
}
