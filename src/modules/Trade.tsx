import { useMemo, useState } from "react";
import { useApp, type AnyR } from "../store";
import { I, Modal, Chip, Reveal, Empty, BarChart, Donut, LineChart, FormSection } from "../ui";
import { Directory, ActionBtn, type DirConf } from "../crud";
import { printTradeDoc, printDirectory, tafqit } from "../print";
import type { Invoice } from "../data";

/* ═══════ طابعة الفواتير وعروض الأسعار والطلبات (A4 احترافية) ═══════ */
function printInvoiceDoc(app: ReturnType<typeof useApp>, inv: any, kind: "sales" | "purchases" | "returns") {
  const partners = kind === "purchases" ? app.db.suppliers : app.db.customers;
  const partner = partners.find((p: any) => p.id === inv.partner);
  const sub = inv.lines.reduce((a: number, l: any) => a + l.qty * l.price * (1 - (l.disc || 0) / 100), 0);
  const total = app.invoiceTotal(inv);
  const docTitle = kind === "sales" ? "فاتورة مبيعات" : kind === "purchases" ? "فاتورة مشتريات" : "فاتورة مرتجع مبيعات";
  const totalItems: [string, string][] = [
    ["الإجمالي الفرعي", app.fmtN(sub) + " ر.ي"],
    [`ضريبة القيمة المضافة ${inv.vat}%`, app.fmtN(total - sub) + " ر.ي"],
  ];
  if (inv.paid) { totalItems.push(["المدفوع", app.fmtN(inv.paid) + " ر.ي"], ["المتبقي", app.fmtN(total - (inv.paid || 0)) + " ر.ي"]); }
  printTradeDoc(app.session?.user || "—", {
    docTitle, no: inv.no, date: app.fmtDate(inv.date), status: inv.status,
    meta: [
      [kind === "purchases" ? "المورد" : "العميل", partner?.name || "—"],
      ["طريقة السداد", inv.payType], ["العملة", inv.currency + (inv.rate !== 1 ? ` (سعر ${inv.rate})` : "")],
      ["مركز التكلفة", inv.costCenter || "—"], ["المدفوع", app.fmtN(inv.paid || 0) + " ر.ي"],
    ],
    lines: inv.lines.map((l: any) => {
      const it = app.db.items.find((i: any) => i.id === l.item);
      return { name: it?.name || l.item, unit: it?.unit || "—", qty: app.fmtN(l.qty), price: app.fmtN(l.price), disc: l.disc || 0, total: app.fmtN(l.qty * l.price * (1 - (l.disc || 0) / 100)) };
    }),
    totals: {
      items: [...totalItems, ["المبلغ بالحروف", tafqit(total)]],
      grand: ["الإجمالي المستحق", app.fmtN(total) + " ر.ي"],
    },
    grandValue: total,
    stampText: docTitle,
    signLabels: inv.status === "مسودة" ? ["البائع", "المحاسب"] : ["البائع", "المحاسب", "المدير المالي"],
    note: inv.note || "رُحّل قيد محاسبي متوازن تلقائياً في دفتر الأستاذ العام.",
    fmtN: app.fmtN,
  });
}

/* ═══════════ المشتريات والموردون ═══════════ */
export function Purchases() {
  const app = useApp();
  const p = app.route.path || "base.sup";
  if (p === "base.sup") return <Directory conf={supConf(app)} />;
  if (p === "base.cats") return <Directory conf={catsConf(app)} />;
  if (p === "mv.req") return <PurchaseRequests />;
  if (p === "mv.quote") return <QuotesScreen kind="شراء" />;
  if (p === "mv.inv") return <InvoiceScreen kind="purchases" credit={false} />;
  if (p === "mv.credit") return <InvoiceScreen kind="purchases" credit />;
  if (p === "rep.main") return <PurchaseReports />;
  return <Directory conf={supConf(app)} />;
}

/* ═══════════ المبيعات والعملاء ═══════════ */
export function Sales() {
  const app = useApp();
  const p = app.route.path || "base.cus";
  if (p === "base.cus") return <Directory conf={cusConf(app)} />;
  if (p === "base.cats") return <Directory conf={catsConf(app)} />;
  if (p === "mv.quote") return <QuotesScreen kind="بيع" />;
  if (p === "mv.inv") return <InvoiceScreen kind="sales" credit={false} />;
  if (p === "mv.ret") return <InvoiceScreen kind="returns" credit={false} />;
  if (p === "rep.main") return <SalesReports />;
  return <Directory conf={cusConf(app)} />;
}

/* ═══════════ تكوينات الأدلة ═══════════ */
const supConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "suppliers", title: "إدارة الموردين", icon: "truck", prefix: "SP", importKey: "suppliers",
  desc: "بيانات الموردين وتصنيفاتهم وحسابات الربط المحاسبي ومدد الائتمان",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "اسم المورد", req: true, uniq: true, span: true },
    { k: "phone", label: "الهاتف" },
    { k: "city", label: "المدينة" },
    { k: "category", label: "التصنيف", type: "select", opts: app.db.partnerCats.filter((c: any) => c.scope !== "عملاء").map((c: any) => ({ v: c.name, l: c.name })) },
    { k: "creditDays", label: "مدة الائتمان (أيام)", type: "number" },
    { k: "account", label: "حساب الربط المحاسبي", type: "select", req: true, opts: app.accounts.filter((a) => a.posting && a.code.startsWith("2111")).map((a) => ({ v: a.code, l: `${a.code} — ${a.name}` })) },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "المورد", render: (r) => <b>{r.name}</b> },
    { k: "city", label: "المدينة" },
    { k: "category", label: "التصنيف", render: (r) => <span className="chip bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">{r.category}</span> },
    { k: "balance", label: "الرصيد المستحق", num: true, render: (r, a) => <b className="font-num text-[var(--warn)]">{a.fmtN(r.balance)}</b> },
    { k: "account", label: "حساب الربط", num: true, render: (r) => <span className="font-num" dir="ltr">{r.account}</span> },
  ],
});

const cusConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "customers", title: "إدارة العملاء", icon: "users", prefix: "CU", importKey: "customers",
  desc: "العملاء مع حدود الائتمان — يُرفض ترحيل أي فاتورة آجلة تتجاوز الحد تلقائياً",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "اسم العميل", req: true, uniq: true, span: true },
    { k: "phone", label: "الهاتف" },
    { k: "city", label: "المدينة" },
    { k: "category", label: "التصنيف", type: "select", opts: app.db.partnerCats.filter((c: any) => c.scope !== "موردون").map((c: any) => ({ v: c.name, l: c.name })) },
    { k: "creditLimit", label: "حد الائتمان", type: "number", req: true, hint: "أقصى رصيد مدين مسموح لهذا العميل" },
    { k: "account", label: "حساب الربط المحاسبي", type: "select", req: true, opts: app.accounts.filter((a) => a.posting && a.code.startsWith("1121")).map((a) => ({ v: a.code, l: `${a.code} — ${a.name}` })) },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "العميل", render: (r) => <b>{r.name}</b> },
    { k: "city", label: "المدينة" },
    { k: "balance", label: "الرصيد المدين", num: true, render: (r, a) => <b className="font-num">{a.fmtN(r.balance)}</b> },
    {
      k: "usage", label: "استخدام الحد", render: (r) => {
        const pct = r.creditLimit ? Math.min(100, Math.round((r.balance / r.creditLimit) * 100)) : 0;
        const tone = pct > 100 ? "var(--bad)" : pct > 80 ? "var(--warn)" : "var(--good)";
        return <div className="w-32"><div className="flex justify-between text-[0.62rem] font-bold mb-0.5"><span style={{ color: tone }}>{pct}%</span><span className="text-mute font-num">{r.creditLimit ? `${Math.round(r.balance).toLocaleString()}/${Math.round(r.creditLimit).toLocaleString()}` : ""}</span></div>
          <div className="h-1.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} /></div></div>;
      },
    },
    { k: "account", label: "حساب الربط", num: true, render: (r) => <span className="font-num" dir="ltr">{r.account}</span> },
  ],
});

const catsConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "partnerCats", title: "تصنيفات الموردين والعملاء", icon: "layers", prefix: "PC", importKey: "partnerCats",
  desc: "تصنيفات موحّدة تُستخدم في بطاقات الموردين والعملاء لتسهيل الفرز والتقارير التحليلية",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "اسم التصنيف", req: true, uniq: true },
    { k: "scope", label: "النطاق", type: "select", req: true, opts: [{ v: "موردون", l: "موردون" }, { v: "عملاء", l: "عملاء" }, { v: "مشترك", l: "مشترك (الطرفان)" }] },
    { k: "note", label: "ملاحظة", span: true },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "التصنيف", render: (r) => <b>{r.name}</b> },
    { k: "scope", label: "النطاق", render: (r) => <span className={`chip ${r.scope === "موردون" ? "bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)]" : r.scope === "عملاء" ? "bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]" : "bg-[color-mix(in_srgb,var(--mute)_14%,transparent)] text-[var(--soft)]"}`}>{r.scope}</span> },
    { k: "suppliers", label: "موردون", num: true, render: (r, a) => <span className="font-num">{a.db.suppliers.filter((s: any) => s.category === r.name).length}</span> },
    { k: "customers", label: "عملاء", num: true, render: (r, a) => <span className="font-num">{a.db.customers.filter((s: any) => s.category === r.name).length}</span> },
    { k: "note", label: "ملاحظة", render: (r) => <span className="text-[0.74rem] text-mute font-bold">{r.note}</span> },
  ],
});

/* ═══════════ طلبات الشراء ═══════════ */
function printRequestDoc(app: ReturnType<typeof useApp>, r: any) {
  const it = app.db.items.find((i: any) => i.id === r.item);
  printTradeDoc(app.session?.user || "—", {
    docTitle: "طلب شراء", no: r.no, date: app.fmtDate(r.date), status: r.status, fmtN: app.fmtN,
    meta: [["مقدم الطلب", r.requester], ["الصنف", it?.name || "—"], ["الحالة", r.status]],
    lines: [{ name: r.desc || it?.name || "طلب شراء", qty: app.fmtN(r.qty), price: app.fmtN((r.est || 0) / (r.qty || 1)), disc: 0, total: app.fmtN(r.est || 0) }],
    totals: { items: [["الكمية المطلوبة", app.fmtN(r.qty)]], grand: ["القيمة التقديرية", app.fmtN(r.est || 0) + " ر.ي"] },
    signLabels: ["مقدم الطلب", "مسؤول المشتريات", "المعتمد / المدير المالي"],
  });
}

function printQuoteDoc(app: ReturnType<typeof useApp>, q: any, partners: any[], isSale: boolean) {
  const partner = partners.find((p: any) => p.id === q.partner);
  printTradeDoc(app.session?.user || "—", {
    docTitle: isSale ? "عرض سعر بيع" : "عرض سعر شراء", no: q.no, date: app.fmtDate(q.date), status: q.status, fmtN: app.fmtN,
    meta: [[isSale ? "العميل" : "المورد", partner?.name || "—"], ["صالح حتى", app.fmtDate(q.valid)], ["الحالة", q.status]],
    lines: [{ name: isSale ? "عرض سعر مبيعات للعميل" : "عرض سعر مشتريات من المورد", qty: "1", price: app.fmtN(q.total), disc: 0, total: app.fmtN(q.total) }],
    totals: { items: [["تاريخ انتهاء الصلاحية", app.fmtDate(q.valid)]], grand: ["قيمة العرض الإجمالية", app.fmtN(q.total) + " ر.ي"] },
    note: `هذا العرض ساري حتى ${app.fmtDate(q.valid)} ويشمل ضريبة القيمة المضافة.`,
    signLabels: ["المسؤول التجاري", "العميل / المورد", "المدير المالي"],
  });
}

function PurchaseRequests() {
  const app = useApp();
  const [show, setShow] = useState(false);
  const [view, setView] = useState<any>(null);
  const [f, setF] = useState({ desc: "", qty: 10, est: 0, item: app.db.items[0]?.id || "" });
  const rows = app.db.requests;
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="clip" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">طلبات الشراء</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">دورة عمل كاملة: مسودة ← اعتماد ← تحويل إلى فاتورة مشتريات</p>
          </div>
        </div>
        <button className="btn btn-brand" onClick={() => setShow(true)}><I n="plus" size={16} /> طلب شراء جديد</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl min-w-[820px]">
            <thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>مقدم الطلب</th><th>البيان</th><th>الكمية</th><th>القيمة التقديرية</th><th>الحالة</th><th>إجراء</th></tr></thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-num font-bold" dir="ltr">{r.no}</td>
                  <td className="font-num">{app.fmtDate(r.date)}</td>
                  <td>{r.requester}</td>
                  <td className="font-bold">{r.desc}</td>
                  <td className="font-num">{app.fmtN(r.qty)}</td>
                  <td className="font-num">{app.fmtN(r.est)}</td>
                  <td><Chip s={r.status === "معتمد" ? "مقبول" : r.status === "تم التحويل" ? "مرحّل" : r.status === "مرفوض" ? "مرفوض" : "بانتظار الموافقة"} /> <span className="text-[0.72rem] font-bold">{r.status}</span></td>
                  <td>
                    <div className="flex flex-wrap gap-1 justify-start max-w-[260px]">
                      <ActionBtn k="view" allowed={app.can("pur", "عرض")} onClick={() => setView(r)} />
                      <ActionBtn k="print" allowed={app.can("pur", "طباعة")} onClick={() => printRequestDoc(app, r)} title="طباعة الطلب (A4)" />
                      {r.status === "مسودة" && <ActionBtn k="approve" allowed={app.can("pur", "اعتماد")} onClick={() => app.setRequestStatus(r.id, "معتمد")} title="اعتماد الطلب" />}
                      {r.status === "معتمد" && <ActionBtn k="post" allowed={app.can("pur", "ترحيل")} onClick={() => { app.setRequestStatus(r.id, "تم التحويل"); app.toast(`حُوّل الطلب ${r.no} إلى فاتورة مشتريات`, "ok"); }} title="تحويل إلى فاتورة" />}
                      {r.status === "مسودة" && <ActionBtn k="del" allowed={app.can("pur", "حذف")} onClick={() => app.setRequestStatus(r.id, "مرفوض")} title="رفض الطلب" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={!!view} onClose={() => setView(null)} title={`الطلب ${view?.no || ""}`} icon="clip" wide subtitle="تفاصيل طلب الشراء — الاعتماد والتحويل والطباعة"
        footer={view ? <>
          {view.status === "مسودة" && app.can("pur", "اعتماد") && <button className="btn btn-soft" onClick={() => { app.setRequestStatus(view.id, "معتمد"); setView(null); }}><I n="shield" size={15} /> اعتماد</button>}
          {view.status === "معتمد" && app.can("pur", "ترحيل") && <button className="btn btn-brand" onClick={() => { app.setRequestStatus(view.id, "تم التحويل"); app.toast(`حُوّل الطلب ${view.no} إلى فاتورة`, "ok"); setView(null); }}><I n="check" size={15} /> تحويل لفاتورة</button>}
          {app.can("pur", "طباعة") && <button className="btn btn-brand" onClick={() => printRequestDoc(app, view)}><I n="print" size={15} /> طباعة</button>}
        </> : undefined}>
        {view && (() => { const it = app.db.items.find((i: any) => i.id === view.item); return (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <Chip s={view.status === "معتمد" ? "مقبول" : view.status === "تم التحويل" ? "مرحّل" : view.status === "مرفوض" ? "مرفوض" : "بانتظار الموافقة"} />
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{view.requester}</span>
              <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)] font-num" dir="ltr">{app.fmtDate(view.date)}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 rounded-xl border border-line bg-panel/50 p-4">
              <div><div className="text-[0.64rem] font-bold text-mute">الصنف المطلوب</div><div className="text-[0.9rem] font-bold mt-0.5">{it?.name || "—"}</div></div>
              <div><div className="text-[0.64rem] font-bold text-mute">البيان</div><div className="text-[0.9rem] font-bold mt-0.5">{view.desc}</div></div>
              <div><div className="text-[0.64rem] font-bold text-mute">الكمية</div><div className="text-[0.9rem] font-bold font-num mt-0.5">{app.fmtN(view.qty)}</div></div>
              <div><div className="text-[0.64rem] font-bold text-mute">القيمة التقديرية</div><div className="text-[0.9rem] font-bold font-num text-[var(--brand)] mt-0.5">{app.fmtN(view.est)} ر.ي</div></div>
            </div>
          </>
        ); })()}
      </Modal>

      <Modal open={show} onClose={() => setShow(false)} title="طلب شراء جديد" icon="clip" subtitle="يُحفظ كمسودة ثم يمر بدورة اعتماد وتحويل"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setShow(false)}>إلغاء</button>
          <button className="btn btn-brand" onClick={() => {
            if (!f.desc.trim()) { app.toast("البيان مطلوب", "err"); return; }
            const no = app.nextNo(app.settings.prefixes.PR);
            app.save("requests", { id: no, code: no, no, date: "2026-03-29", requester: app.session?.user || "—", desc: f.desc, qty: f.qty, est: f.est, status: "مسودة" });
            app.toast(`أُنشئ طلب الشراء ${no} بحالة «مسودة»`, "ok"); setShow(false);
          }}><I n="check" size={15} /> حفظ الطلب (مسودة)</button>
        </>}>
        <div className="space-y-3">
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الصنف المطلوب</span>
            <select className="select mt-1" value={f.item} onChange={(e) => { const it: any = app.db.items.find((i) => i.id === e.target.value); setF({ ...f, item: e.target.value, desc: `طلب شراء — ${it?.name || ""}`, est: (f.qty || 0) * (it?.cost || 0) }); }}>
              {app.db.items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">الكمية</span><input type="number" className="input mt-1 font-num" value={f.qty} onChange={(e) => { const it: any = app.db.items.find((i) => i.id === f.item); const q = +e.target.value; setF({ ...f, qty: q, est: q * (it?.cost || 0) }); }} /></label>
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">القيمة التقديرية</span><input type="number" className="input mt-1 font-num" value={f.est} onChange={(e) => setF({ ...f, est: +e.target.value })} /></label>
          </div>
          <label className="block">
            <span className="flex items-center gap-1.5 text-[0.78rem] font-bold text-soft mb-1.5"><I n="file" size={14} className="text-[var(--brand)]" /> الــبيــان <b className="text-[var(--bad)]">*</b></span>
            <textarea className="input !text-[0.86rem] !leading-6" rows={2} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="اذكر تفاصيل طلب الشراء والغرض منه…" />
          </label>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════ عروض الأسعار ═══════════ */
function QuotesScreen({ kind }: { kind: "بيع" | "شراء" }) {
  const app = useApp();
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ partner: "", valid: "2026-04-30", total: 100000 });
  const partners = kind === "بيع" ? app.db.customers : app.db.suppliers;
  const rows = (app.db.quotes as any[]).filter((q) => q.kind === kind);
  const isSale = kind === "بيع";
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="receipt" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">{isSale ? "عروض أسعار البيع" : "عروض أسعار الشراء"}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">عروض {isSale ? "للعملاء قابلة للتحويل إلى فواتير مبيعات" : "من الموردين للمقارنة والاختيار"} مع تواريخ صلاحية</p>
          </div>
        </div>
        <button className="btn btn-brand" onClick={() => { setF({ ...f, partner: partners[0]?.id || "" }); setShow(true); }}><I n="plus" size={16} /> عرض سعر جديد</button>
      </div>
      <div className="card overflow-hidden"><div className="overflow-x-auto">
        <table className="tbl min-w-[760px]">
          <thead><tr><th>رقم العرض</th><th>{isSale ? "العميل" : "المورد"}</th><th>التاريخ</th><th>صالح حتى</th><th>القيمة</th><th>الحالة</th><th>إجراء</th></tr></thead>
          <tbody>
            {rows.map((q: any) => (
              <tr key={q.id}>
                <td className="font-num font-bold" dir="ltr">{q.no}</td>
                <td className="font-bold">{partners.find((p: any) => p.id === q.partner)?.name || "—"}</td>
                <td className="font-num">{app.fmtDate(q.date)}</td>
                <td className="font-num">{app.fmtDate(q.valid)}</td>
                <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(q.total)}</td>
                <td><Chip s={q.status} /></td>
                <td>
                  <div className="flex flex-wrap gap-1 justify-start max-w-[240px]">
                    <ActionBtn k="print" allowed={app.can(isSale ? "sal" : "pur", "طباعة")} onClick={() => printQuoteDoc(app, q, partners, isSale)} title="طباعة العرض (A4)" />
                    {q.status === "ساري" && isSale && <ActionBtn k="approve" allowed={app.can("sal", "اعتماد")} onClick={() => { app.setQuoteStatus(q.id, "مقبول"); app.toast(`قُبل العرض ${q.no} — افتح شاشة فاتورة مبيعات لإصدارها`, "ok"); }} title="قبول وتحويل" />}
                    {q.status === "ساري" && <ActionBtn k="del" allowed={app.can(isSale ? "sal" : "pur", "حذف")} onClick={() => app.setQuoteStatus(q.id, "مرفوض")} title="رفض العرض" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
      <Modal open={show} onClose={() => setShow(false)} title={`عرض سعر ${kind} جديد`} icon="receipt" subtitle="عرض سعر بصلاحية زمنية — قابل للقبول والتحويل"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setShow(false)}>إلغاء</button>
          <button className="btn btn-brand" onClick={() => {
            if (!f.partner) { app.toast("اختر الطرف أولاً", "err"); return; }
            const no = app.nextNo(isSale ? app.settings.prefixes.QT : "PQ");
            app.save("quotes", { id: no, code: no, no, kind, date: "2026-03-29", partner: f.partner, valid: f.valid, total: f.total, status: "ساري" });
            app.toast(`أُنشئ العرض ${no} — ساري حتى ${f.valid}`, "ok"); setShow(false);
          }}><I n="check" size={15} /> إصدار العرض</button>
        </>}>
        <div className="space-y-3">
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">{isSale ? "العميل" : "المورد"}</span>
            <select className="select mt-1" value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })}>
              {partners.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">صالح حتى</span><input type="date" className="input mt-1 font-num" value={f.valid} onChange={(e) => setF({ ...f, valid: e.target.value })} /></label>
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">قيمة العرض</span><input type="number" className="input mt-1 font-num" value={f.total} onChange={(e) => setF({ ...f, total: +e.target.value })} /></label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════ شاشة الفواتير (مبيعات/مشتريات/مرتجع + الآجلة) ═══════════ */
function InvoiceScreen({ kind, credit }: { kind: "sales" | "purchases" | "returns"; credit?: boolean }) {
  const app = useApp();
  const [show, setShow] = useState(false);
  const [view, setView] = useState<any>(null);
  const [payFor, setPayFor] = useState<any>(null);
  const [payAmt, setPayAmt] = useState(0);
  const [q, setQ] = useState("");

  const partners = kind === "purchases" ? app.db.suppliers : app.db.customers;
  const mod = kind === "purchases" ? "pur" : "sal";
  const all = app.db[kind] as any as Invoice[];
  let rows = all.filter((i) => {
    const p = partners.find((x: any) => x.id === i.partner)?.name || "";
    return !q || i.no.includes(q) || p.includes(q);
  });
  if (credit) rows = rows.filter((i) => i.payType === "آجل");
  rows = [...rows].reverse();

  const TITLES: Record<string, string[]> = {
    "sales:false": ["فواتير المبيعات", "فواتير بنمطي سداد صريحين: نقدي وآجل — مع أثر مخزني ومحاسبي فوري", "tag"],
    "purchases:false": ["فاتورة مشتريات", "إدخال فواتير الموردين (نقدي / آجل) — تُرحّل للمخزون والذمم تلقائياً", "truck"],
    "returns:false": ["فاتورة مرتجع مبيعات", "مرتجعات العملاء (نقدي / آجل) — تُعيد الكميات للمخزن وتخفض الذمم", "undo"],
    "purchases:true": ["فواتير مشتريات آجل", "إدارة الذمم الدائنة للموردين: سجل الدفعات، المتبقي، والتسوية الكاملة", "wallet"],
    "sales:true": ["فواتير مبيعات آجل", "إدارة الذمم المدينة: التحصيلات والمتبقي", "wallet"],
    "returns:true": ["مرتجعات آجلة", "إدارة المرتجعات الآجلة", "undo"],
  };
  const titles = TITLES[`${kind}:${credit ? "true" : "false"}`] || ["الفواتير", "", "receipt"];

  const partnerName = (code: string) => partners.find((p: any) => p.id === code)?.name || code;
  const itemName = (code: string) => app.db.items.find((i: any) => i.id === code)?.name || code;

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n={titles[2]} size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">{titles[0]}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">{titles[1]}</p>
          </div>
        </div>
        {!credit && <button className="btn btn-brand" onClick={() => setShow(true)}><I n="plus" size={16} /> فاتورة جديدة</button>}
      </div>

      {credit && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { l: "إجمالي الذمم الدائنة", v: partners.reduce((s: number, p: any) => s + p.balance, 0), c: "var(--warn)", ic: "wallet" },
            { l: "فواتير آجلة قائمة", v: rows.filter((r) => r.status === "مرحّلة").length, c: "var(--brand)", ic: "receipt" },
            { l: "دفعات مسجلة", v: rows.reduce((s, r) => s + (r.paid || 0), 0), c: "var(--good)", ic: "check" },
            { l: "متبقي للسداد", v: rows.filter((r) => r.status === "مرحّلة").reduce((s, r) => s + Math.max(0, app.invoiceTotal(r) - (r.paid || 0)), 0), c: "var(--bad)", ic: "clock" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 60}><div className="card card-lift p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${s.c} 12%, transparent)`, color: s.c }}><I n={s.ic} size={19} /></span>
              <div className="min-w-0"><div className="font-num font-bold text-lg leading-tight" style={{ color: s.c }}>{app.fmtN(s.v)}</div><div className="text-[0.66rem] font-bold text-mute truncate">{s.l}</div></div>
            </div></Reveal>
          ))}
        </div>
      )}

      <div className="relative w-80 max-w-full mb-3.5">
        <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
        <input className="input !ps-9" placeholder="بحث برقم الفاتورة أو اسم الطرف…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card overflow-hidden"><div className="overflow-x-auto">
        <table className="tbl min-w-[860px]">
          <thead><tr><th>الرقم</th><th>التاريخ</th><th>{kind === "purchases" ? "المورد" : "العميل"}</th><th>السداد</th><th>العملة</th><th>الإجمالي</th>{credit && <th>المدفوع / المتبقي</th>}<th>الحالة</th><th>إجراء</th></tr></thead>
          <tbody>
            {rows.map((inv) => {
              const total = app.invoiceTotal(inv);
              const paid = inv.paid || 0;
              const rem = Math.max(0, total - paid);
              return (
                <tr key={inv.id}>
                  <td className="font-num font-bold" dir="ltr">{inv.no}</td>
                  <td className="font-num">{app.fmtDate(inv.date)}</td>
                  <td className="font-bold">{partnerName(inv.partner)}</td>
                  <td><Chip s={inv.payType} /></td>
                  <td className="font-num">{inv.currency}</td>
                  <td className="font-num font-bold">{app.fmtN(total)} <span className="text-[0.62rem] text-mute">ر.ي</span></td>
                  {credit && <td>
                    <div className="w-36">
                      <div className="flex justify-between text-[0.66rem] font-bold mb-0.5"><span className="font-num text-[var(--good)]">{app.fmtN(paid)}</span><span className="font-num text-[var(--bad)]">{app.fmtN(rem)}</span></div>
                      <div className="h-1.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full bg-[var(--good)]" style={{ width: `${total ? (paid / total) * 100 : 0}%` }} /></div>
                    </div>
                  </td>}
                  <td><Chip s={inv.status} />{credit && inv.status === "مرحّلة" && rem < 1 && <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] ms-1">مسددة ✓</span>}</td>
                  <td>
                    <div className="flex flex-wrap gap-1 justify-start max-w-[260px]">
                      <ActionBtn k="view" allowed={app.can(mod, "عرض")} onClick={() => setView(inv)} />
                      <ActionBtn k="print" allowed={app.can(mod, "طباعة")} onClick={() => printInvoiceDoc(app, inv, kind)} title="طباعة الفاتورة (A4)" />
                      {credit && inv.status === "مرحّلة" && rem >= 1 && <button className="btn btn-brand !py-1 !px-2 !text-[0.62rem]" onClick={() => { setPayFor(inv); setPayAmt(Math.round(rem)); }}><I n="coins" size={12} /> سداد</button>}
                      {inv.status !== "ملغاة" && !credit && <ActionBtn k="del" allowed={app.can(mod, "حذف")} onClick={() => app.voidInvoice(kind, inv.id)} title="إلغاء الفاتورة وعكس أثرها" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div></div>

      {show && <InvoiceBuilder kind={kind} onClose={() => setShow(false)} defaultCredit={credit} />}

      <Modal open={!!view} onClose={() => setView(null)} wide icon="receipt" title={`الفاتورة ${view?.no || ""}`} subtitle="عرض الفاتورة — البنود والضريبة مع الطباعة A4 والإلغاء"
        footer={view ? <>
          {view.status !== "ملغاة" && app.can(mod, "حذف") && <button className="btn btn-danger" onClick={() => { app.voidInvoice(kind, view.id); setView(null); }}><I n="undo" size={15} /> إلغاء الفاتورة</button>}
          {app.can(mod, "طباعة") && <button className="btn btn-brand" onClick={() => printInvoiceDoc(app, view, kind)}><I n="print" size={15} /> طباعة الفاتورة</button>}
        </> : undefined}>
        {view && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <Chip s={view.status} /><Chip s={view.payType} />
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{partnerName(view.partner)}</span>
              <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)] font-num" dir="ltr">{view.date} • مركز: {view.costCenter}</span>
            </div>
            {view.note && (
              <div className="rounded-xl border border-[color-mix(in_srgb,var(--brand)_22%,transparent)] bg-[color-mix(in_srgb,var(--brand)_5%,var(--panel))] p-3.5 mb-3">
                <div className="flex items-center gap-1.5 text-[0.7rem] font-bold text-[var(--brand)] mb-1"><I n="file" size={13} /> الــبيــان</div>
                <p className="text-[0.84rem] font-bold text-soft leading-6">{view.note}</p>
              </div>
            )}
            <table className="tbl mb-3">
              <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>خصم</th><th>الإجمالي</th></tr></thead>
              <tbody>{view.lines.map((l: any, i: number) => (
                <tr key={i}><td className="font-bold">{itemName(l.item)}</td><td className="font-num">{l.qty}</td><td className="font-num">{app.fmtN(l.price)}</td><td className="font-num">{l.disc}%</td><td className="font-num font-bold">{app.fmtN(l.qty * l.price * (1 - l.disc / 100))}</td></tr>
              ))}</tbody>
            </table>
            <div className="flex flex-wrap justify-between items-center gap-3 rounded-xl p-4 bg-[color-mix(in_srgb,var(--brand)_6%,var(--panel))] border border-line">
              <span className="text-[0.78rem] font-bold text-soft">ضريبة {view.vat}% مضمّنة • التكامل المحاسبي ولّد قيداً تلقائياً في دفتر الأستاذ</span>
              <span className="font-num font-bold text-xl text-[var(--brand)]">{app.fmtN(app.invoiceTotal(view))} ر.ي</span>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!payFor} onClose={() => setPayFor(null)} title={`تسجيل سداد — ${payFor?.no || ""}`} icon="coins"
        subtitle="تسجيل دفعة سداد — يولّد سند صرف/قبض ويحدّث الذمم فوراً"
        footer={payFor ? <>
          <button className="btn btn-ghost" onClick={() => setPayFor(null)}>إلغاء</button>
          <button className="btn btn-brand" onClick={() => {
            const res = app.payInvoice(kind as "sales" | "purchases", payFor.id, payAmt);
            app.toast(res.msg, res.ok ? "ok" : "err");
            if (res.ok) setPayFor(null);
          }}><I n="check" size={15} /> تسجيل الدفعة وتوليد السند</button>
        </> : undefined}>
        {payFor && (() => {
          const total = app.invoiceTotal(payFor); const rem = total - (payFor.paid || 0);
          return (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-panel rounded-xl p-3"><div className="text-[0.64rem] font-bold text-mute">الإجمالي</div><div className="font-num font-bold">{app.fmtN(total)}</div></div>
                <div className="bg-panel rounded-xl p-3"><div className="text-[0.64rem] font-bold text-mute">المدفوع</div><div className="font-num font-bold text-[var(--good)]">{app.fmtN(payFor.paid || 0)}</div></div>
                <div className="bg-panel rounded-xl p-3"><div className="text-[0.64rem] font-bold text-mute">المتبقي</div><div className="font-num font-bold text-[var(--bad)]">{app.fmtN(rem)}</div></div>
              </div>
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">مبلغ الدفعة</span>
                <input type="number" className="input mt-1 font-num" value={payAmt} onChange={(e) => setPayAmt(+e.target.value)} /></label>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-ghost !py-1.5 !text-[0.72rem]" onClick={() => setPayAmt(Math.round(rem / 2))}>نصف المبلغ</button>
                <button className="btn btn-ghost !py-1.5 !text-[0.72rem]" onClick={() => setPayAmt(Math.round(rem))}>كامل المتبقي</button>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}

/* ═══════════ منشئ الفواتير مع مفتاح نقدي/آجل ═══════════ */
function InvoiceBuilder({ kind, onClose, defaultCredit }: { kind: "sales" | "purchases" | "returns"; onClose: () => void; defaultCredit?: boolean }) {
  const app = useApp();
  const partners = kind === "purchases" ? app.db.suppliers : app.db.customers;
  const [s, setS] = useState({ partner: partners[0]?.id || "", date: "2026-03-29", payType: (defaultCredit ? "آجل" : "نقدي") as "نقدي" | "آجل", currency: "YER", item: app.db.items[0]?.id || "", qty: 10, price: 0, disc: 0, note: "", lines: [] as { item: string; qty: number; price: number; disc: number }[] });
  const rate = (app.db.currencies.find((c: any) => c.id === s.currency) as any)?.rate || 1;
  const it: any = app.db.items.find((i: any) => i.id === s.item);
  const lineTotal = (l: any) => l.qty * l.price * (1 - l.disc / 100);
  const sub = s.lines.reduce((a, l) => a + lineTotal(l), 0);
  const total = sub * (1 + app.settings.vat / 100);
  const vatV = sub * (app.settings.vat / 100);
  const cust: any = app.db.customers.find((c: any) => c.id === s.partner);
  const willExceed = kind === "sales" && s.payType === "آجل" && cust?.creditLimit && cust.balance + total * rate > cust.creditLimit;

  const addLine = () => {
    if (s.qty <= 0) { app.toast("الكمية يجب أن تكون أكبر من صفر", "err"); return; }
    setS({ ...s, lines: [...s.lines, { item: s.item, qty: s.qty, price: s.price || (kind === "purchases" ? it?.cost || 0 : it?.price || 0), disc: s.disc }], qty: 10, disc: 0 });
  };
  const save = () => {
    if (s.lines.length === 0) { app.toast("أضف سطراً واحداً على الأقل", "err"); return; }
    const prefix = kind === "sales" ? app.settings.prefixes.SIN : kind === "purchases" ? app.settings.prefixes.PIN : app.settings.prefixes.SRT;
    const no = app.nextNo(prefix);
    const res = app.addInvoice(kind, { id: no, no, date: s.date, partner: s.partner, payType: s.payType, currency: s.currency, rate, costCenter: "CC-01", status: "مرحّلة", vat: app.settings.vat, lines: s.lines, paid: s.payType === "نقدي" ? total * rate : 0, note: s.note.trim() || undefined });
    app.toast(res.msg, res.ok ? "ok" : "err");
    if (res.ok) onClose();
  };

  /* معاينة طباعة الفاتورة قبل الترحيل */
  const printDraft = () => {
    if (s.lines.length === 0) { app.toast("أضف بنداً واحداً على الأقل قبل الطباعة", "err"); return; }
    printInvoiceDoc(app, { id: "draft", no: "معاينة", date: s.date, partner: s.partner, payType: s.payType, currency: s.currency, rate, costCenter: "CC-01", status: "مسودة", vat: app.settings.vat, lines: s.lines, paid: 0, note: s.note }, kind);
  };

  return (
    <Modal open onClose={onClose} wide icon="receipt" title={kind === "sales" ? "فاتورة مبيعات جديدة" : kind === "purchases" ? "فاتورة مشتريات جديدة" : "فاتورة مرتجع مبيعات"} subtitle="سداد صريح نقدي أو آجل — مع فحص الحد الائتماني وترحيل محاسبي ومخزني فوري"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
        <button className="btn btn-soft" onClick={printDraft}><I n="print" size={15} /> معاينة الطباعة</button>
        <button className="btn btn-brand" onClick={save} disabled={!!willExceed}><I n="check" size={16} /> حفظ وترحيل الفاتورة</button>
      </>}>
      <FormSection n="أولاً" icon="file" title="رأس الفاتورة" hint="العميل أو المورد وطريقة السداد والعملة">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">{kind === "purchases" ? "المورد" : "العميل"}</span>
          <select className="select mt-1" value={s.partner} onChange={(e) => setS({ ...s, partner: e.target.value })}>
            {partners.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">التاريخ</span>
          <input type="date" className="input mt-1 font-num" value={s.date} onChange={(e) => setS({ ...s, date: e.target.value })} /></label>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">العملة</span>
          <select className="select mt-1" value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })}>
            {app.db.currencies.map((c: any) => <option key={c.id} value={c.id}>{c.id} ({app.fmtN(c.rate)})</option>)}
          </select></label>
        <div className="col-span-2 md:col-span-4">
          <span className="text-[0.74rem] font-bold text-soft block mb-1.5">طريقة السداد <b className="text-[var(--bad)]">*</b> خيار صريح لكل فاتورة</span>
          <div className="flex rounded-xl border border-line overflow-hidden">
            {(["نقدي", "آجل"] as const).map((p) => (
              <button key={p} type="button" onClick={() => setS({ ...s, payType: p })}
                className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${s.payType === p ? "text-[var(--brandink)]" : "bg-surface text-mute hover:text-ink"}`}
                style={s.payType === p ? { background: p === "نقدي" ? "linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 65%,var(--brand)))" : "linear-gradient(135deg,var(--warn),color-mix(in srgb,var(--warn) 65%,var(--bad)))" } : undefined}>
                <I n={p === "نقدي" ? "coins" : "clock"} size={16} /> {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* حقل البيان — كبير وكامل العرض */}
      <label className="block mb-4">
        <span className="flex items-center gap-1.5 text-[0.78rem] font-bold text-soft mb-1.5"><I n="file" size={14} className="text-[var(--brand)]" /> الــبيــان</span>
        <textarea className="input !text-[0.86rem] !leading-6" rows={2} value={s.note} onChange={(e) => setS({ ...s, note: e.target.value })}
          placeholder={kind === "purchases" ? "مثال: فاتورة مشتريات من المورد … بموجب أمر شراء رقم … تشمل أصناف …" : kind === "returns" ? "مثال: مرتجع مبيعات من العميل … بسبب …" : "مثال: فاتورة مبيعات للعميل … تشمل أصناف …"} />
      </label>
      </FormSection>

      <FormSection n="ثانياً" icon="box" title="بنود الفاتورة" hint="أضف الأصناف بكمياتها وأسعارها وخصوماتها">
      <div className="rounded-xl border border-line bg-panel p-3 mb-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
          <label className="block col-span-2"><span className="text-[0.7rem] font-bold text-mute">الصنف</span>
            <select className="select mt-1 !py-2" value={s.item} onChange={(e) => { const ni: any = app.db.items.find((x: any) => x.id === e.target.value); setS({ ...s, item: e.target.value, price: kind === "purchases" ? ni?.cost || 0 : ni?.price || 0 }); }}>
              {app.db.items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select></label>
          <label className="block"><span className="text-[0.7rem] font-bold text-mute">الكمية</span><input type="number" className="input mt-1 !py-2 font-num" value={s.qty} onChange={(e) => setS({ ...s, qty: +e.target.value })} /></label>
          <label className="block"><span className="text-[0.7rem] font-bold text-mute">السعر</span><input type="number" className="input mt-1 !py-2 font-num" value={s.price} onChange={(e) => setS({ ...s, price: +e.target.value })} /></label>
          <div className="flex items-end gap-2">
            <label className="block flex-1"><span className="text-[0.7rem] font-bold text-mute">خصم %</span><input type="number" className="input mt-1 !py-2 font-num" value={s.disc} onChange={(e) => setS({ ...s, disc: Math.min(app.settings.discMax, +e.target.value) })} /></label>
            <button className="btn btn-soft !py-2" onClick={addLine}><I n="plus" size={15} /> إضافة</button>
          </div>
        </div>
      </div>

      {s.lines.length > 0 ? (
        <table className="tbl mb-4">
          <thead><tr><th>الصنف</th><th>الوحدة</th><th>الكمية</th><th>السعر</th><th>خصم</th><th>الإجمالي</th><th></th></tr></thead>
          <tbody>{s.lines.map((l, i) => (
            <tr key={i}>
              <td className="font-bold">{app.db.items.find((x: any) => x.id === l.item)?.name}</td>
              <td className="text-[0.72rem] font-bold text-mute">{(app.db.items.find((x: any) => x.id === l.item) as any)?.unit || "—"}</td>
              <td className="font-num">{l.qty}</td><td className="font-num">{app.fmtN(l.price)}</td><td className="font-num">{l.disc}%</td>
              <td className="font-num font-bold">{app.fmtN(lineTotal(l))}</td>
              <td><button className="text-mute hover:text-[var(--bad)] transition-colors" onClick={() => setS({ ...s, lines: s.lines.filter((_, j) => j !== i) })} aria-label="حذف"><I n="trash" size={15} /></button></td>
            </tr>))}
          </tbody>
        </table>
      ) : <Empty msg="لم تُضف أصناف بعد — استخدم النموذج أعلاه" />}

      {willExceed && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] border border-[color-mix(in_srgb,var(--bad)_30%,transparent)] text-[0.78rem] font-bold text-[var(--bad)] mb-3">
          <I n="alert" size={16} /> ستُرفض الفاتورة: الرصيد الناتج {app.fmtN(cust.balance + total * rate)} يتجاوز حد الائتمان {app.fmtN(cust.creditLimit)}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 bg-[color-mix(in_srgb,var(--brand)_6%,var(--panel))] border border-line">
        <div className="text-[0.78rem] font-bold text-soft space-y-1">
          <div>الفرعي: <span className="font-num">{app.fmtN(sub)}</span> • ضريبة {app.settings.vat}%: <span className="font-num">{app.fmtN(vatV)}</span></div>
          {s.currency !== "YER" && <div>سعر التحويل: <span className="font-num">1 {s.currency} = {app.fmtN(rate)} ر.ي</span></div>}
        </div>
        <div className="text-end">
          <div className="text-[0.7rem] font-bold text-mute">الإجمالي المستحق</div>
          <div className="font-num font-bold text-2xl text-[var(--brand)]">{app.fmtN(total)} <span className="text-sm">{s.currency === "YER" ? "ر.ي" : s.currency}</span></div>
        </div>
      </div>
      </FormSection>

    </Modal>
  );
}

/* ═══════════ تقارير المشتريات ═══════════ */
function PurchaseReports() {
  const app = useApp();
  const act = (app.db.purchases as any as Invoice[]).filter((i) => i.status !== "ملغاة");
  const bySup = app.db.suppliers.map((s: any) => ({ label: String(s.name).split(" ").slice(0, 2).join(" "), value: Math.round(act.filter((p) => p.partner === s.id).reduce((a, i) => a + app.invoiceTotal(i), 0)) }));
  const byMonth = ["يناير", "فبراير", "مارس"].map((m, idx) => ({ label: m, value: Math.round(act.filter((p) => p.date.slice(5, 7) === String(idx + 1).padStart(2, "0")).reduce((a, i) => a + app.invoiceTotal(i), 0)) }));
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="chart" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">تقارير المشتريات</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">تحليلات حسب المورد والصنف والفترة مع تصدير فوري</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => app.exportCsv("تقرير_المشتريات_حسب_المورد", [["المورد", "الإجمالي"], ...bySup.map((s) => [s.label, s.value])])}><I n="xlsx" size={15} /> Excel</button>
          {app.can("pur", "طباعة")
            ? <button className="btn btn-soft" onClick={() => printDirectory(app.session?.user || "—", { title: "تقرير المشتريات التحليلي", subtitle: "المشتريات حسب المورد والفترة — الربع الأول 2026", columns: [{ h: "المورد", v: (r: any) => r.label }, { h: "الإجمالي (ر.ي)", v: (r: any) => app.fmtN(r.value) }], rows: bySup, summary: [["إجمالي المشتريات", app.fmtN(bySup.reduce((a, s) => a + s.value, 0)) + " ر.ي"], ["عدد الموردين", String(bySup.length)]] })}><I n="print" size={15} /> طباعة / PDF</button>
            : <button className="btn btn-ghost opacity-50 cursor-not-allowed" disabled title="صلاحية «طباعة» غير مخوّلة"><I n="lock" size={15} /> طباعة</button>}
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Reveal><div className="card p-5"><h3 className="font-display font-bold text-base mb-4">المشتريات حسب المورد</h3><BarChart height={180} color="var(--accent)" data={bySup} unit=" ر.ي" /></div></Reveal>
        <Reveal delay={80}><div className="card p-5"><h3 className="font-display font-bold text-base mb-4">التوزيع الشهري — الربع الأول 2026</h3><BarChart height={180} data={byMonth} unit=" ر.ي" /></div></Reveal>
        <Reveal className="lg:col-span-2"><div className="card p-5">
          <h3 className="font-display font-bold text-base mb-4">أعلى الأصناف شراءً (حسب قيمة الفواتير)</h3>
          <div className="space-y-3">
            {app.db.items.slice(0, 6).map((itx: any) => {
              const v = act.flatMap((p) => p.lines).filter((l) => l.item === itx.id).reduce((a, l) => a + l.qty * l.price, 0);
              return (
                <div key={itx.id}>
                  <div className="flex justify-between text-[0.78rem] font-bold mb-1"><span>{itx.name}</span><span className="font-num text-mute">{app.fmtN(v)}</span></div>
                  <div className="h-2.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (v / 600000) * 100)}%`, background: "linear-gradient(90deg, var(--accent), var(--brand))" }} /></div>
                </div>
              );
            })}
          </div>
        </div></Reveal>
      </div>
    </div>
  );
}

/* ═══════════ تقارير المبيعات ═══════════ */
function SalesReports() {
  const app = useApp();
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const act = useMemo(() => (app.db.sales as any as Invoice[]).filter((i) => i.status !== "ملغاة"), [app.db.sales]);
  const byMonth = ["يناير", "فبراير", "مارس"].map((m, idx) => ({ label: m, value: Math.round(act.filter((s) => s.date.slice(5, 7) === String(idx + 1).padStart(2, "0")).reduce((a, i) => a + app.invoiceTotal(i), 0)) }));
  const byDay = useMemo(() => {
    const days: Record<string, number> = {};
    act.forEach((s) => { days[s.date] = (days[s.date] || 0) + app.invoiceTotal(s); });
    return Object.entries(days).sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ label: d.slice(8), value: Math.round(v) }));
  }, [act]);
  const creditV = Math.round(act.filter((s) => s.payType === "آجل").reduce((a, i) => a + app.invoiceTotal(i), 0));
  const cashV = Math.round(act.reduce((a, i) => a + app.invoiceTotal(i), 0)) - creditV;

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="chart" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">تقارير المبيعات</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">تقارير يومية وشهرية وسنوية مع رسوم بيانية تفاعلية</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {([["daily", "يومي"], ["monthly", "شهري"], ["yearly", "سنوي"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setPeriod(id)} className={`btn !py-1.5 !px-4 ${period === id ? "btn-brand" : "btn-ghost"}`}>{l}</button>
          ))}
          <button className="btn btn-ghost" onClick={() => app.exportCsv(`تقرير_المبيعات_${period}`, [["الفترة", "القيمة"], ...(period === "daily" ? byDay : byMonth).map((d) => [d.label, d.value])])}><I n="xlsx" size={15} /> Excel</button>
          {app.can("sal", "طباعة")
            ? <button className="btn btn-soft" onClick={() => printDirectory(app.session?.user || "—", { title: `تقرير المبيعات ${period === "daily" ? "اليومي" : period === "monthly" ? "الشهري" : "السنوي"}`, subtitle: "الربع الأول 2026 — نقدي وآجل", columns: [{ h: "الفترة", v: (r: any) => r.label }, { h: "القيمة (ر.ي)", v: (r: any) => app.fmtN(r.value) }], rows: period === "daily" ? byDay : byMonth, summary: [["إجمالي المبيعات", app.fmtN(cashV + creditV) + " ر.ي"], ["نقدي", app.fmtN(cashV) + " ر.ي"], ["آجل", app.fmtN(creditV) + " ر.ي"], ["نسبة التحصيل النقدي", Math.round((cashV / (cashV + creditV || 1)) * 100) + "%"]] })}><I n="print" size={15} /> طباعة / PDF</button>
            : <button className="btn btn-ghost opacity-50 cursor-not-allowed" disabled title="صلاحية «طباعة» غير مخوّلة"><I n="lock" size={15} /> طباعة</button>}
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Reveal className="lg:col-span-2"><div className="card p-5">
          <h3 className="font-display font-bold text-base mb-4">
            {period === "daily" ? "المبيعات اليومية — مارس 2026" : period === "monthly" ? "المبيعات الشهرية — الربع الأول 2026" : "المبيعات السنوية 2023 – 2026"}
          </h3>
          {period === "yearly"
            ? <BarChart height={210} data={[{ label: "2023", value: 5200000 }, { label: "2024", value: 7400000 }, { label: "2025", value: 9100000 }, { label: "2026*", value: Math.round(act.reduce((a, i) => a + app.invoiceTotal(i), 0)) }]} unit=" ر.ي" />
            : <BarChart height={210} data={period === "daily" ? byDay : byMonth} unit=" ر.ي" />}
        </div></Reveal>
        <Reveal delay={90}><div className="card p-5">
          <h3 className="font-display font-bold text-base mb-4">نقدي مقابل آجل</h3>
          <Donut label={`${Math.round((cashV + creditV) / 1000)}K`} parts={[
            { name: "نقدي", value: cashV, color: "var(--accent)" },
            { name: "آجل", value: creditV, color: "var(--warn)" },
          ]} />
          <div className="mt-4 pt-3 border-t border-line text-[0.72rem] font-bold text-mute">نسبة التحصيل النقدي {Math.round((cashV / (cashV + creditV || 1)) * 100)}% — فوق المستهدف (35%)</div>
        </div></Reveal>
        <Reveal className="lg:col-span-3"><div className="card p-5">
          <h3 className="font-display font-bold text-base mb-3">اتجاه المبيعات التراكمي (أسبوعياً)</h3>
          <LineChart points={[180, 240, 310, 290, 380, 460, 520, 610, 680, 745].map((x) => x * 1000)} height={150} />
        </div></Reveal>
      </div>
    </div>
  );
}
