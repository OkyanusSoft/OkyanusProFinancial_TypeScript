import { useMemo, useState } from "react";
import { useApp } from "../store";
import { BarChart, Chip, Donut, Empty, I, Modal, PageHead, Tabs, Reveal, LineChart } from "../ui";
import type { Invoice } from "../data";

const payToggle = (v: "نقدي" | "آجل", set: (p: "نقدي" | "آجل") => void) => (
  <div className="flex rounded-xl border border-line overflow-hidden" role="radiogroup" aria-label="طريقة الدفع">
    {(["نقدي", "آجل"] as const).map((p) => (
      <button key={p} type="button" onClick={() => set(p)}
        className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${v === p ? "text-[var(--brandink)]" : "bg-surface text-mute hover:text-ink"}`}
        style={v === p ? { background: p === "نقدي" ? "linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 70%,var(--brand)))" : "linear-gradient(135deg,var(--warn),color-mix(in srgb,var(--warn) 70%,var(--bad)))" } : undefined}>
        <I n={p === "نقدي" ? "coins" : "clock"} size={16} /> {p}
      </button>
    ))}
  </div>
);

interface BuilderState { partner: string; date: string; payType: "نقدي" | "آجل"; currency: string; item: string; qty: number; price: number; disc: number; lines: { item: string; qty: number; price: number; disc: number }[] }

function InvoiceBuilder({ open, onClose, kind }: { open: boolean; onClose: () => void; kind: "sales" | "purchases" | "returns" }) {
  const app = useApp();
  const partners = kind === "purchases" ? app.suppliers : app.customers;
  const [s, setS] = useState<BuilderState>({ partner: partners[0]?.code || "", date: "2026-03-29", payType: "نقدي", currency: "YER", item: app.items[0]?.code || "", qty: 10, price: 0, disc: 0, lines: [] });
  const rate = app.currencies.find((c) => c.code === s.currency)?.rate || 1;
  const itemSel = app.items.find((i) => i.code === s.item);
  const lineTotal = (l: { qty: number; price: number; disc: number }) => l.qty * l.price * (1 - l.disc / 100);
  const sub = s.lines.reduce((a, l) => a + lineTotal(l), 0);
  const total = sub * 1.05;

  const addLine = () => {
    if (s.qty <= 0) { app.toast("الكمية يجب أن تكون أكبر من صفر", "err"); return; }
    setS({ ...s, lines: [...s.lines, { item: s.item, qty: s.qty, price: s.price || (kind === "purchases" ? itemSel?.cost || 0 : itemSel?.price || 0), disc: s.disc }], qty: 10, disc: 0 });
  };
  const save = () => {
    if (s.lines.length === 0) { app.toast("أضف سطراً واحداً على الأقل", "err"); return; }
    if (kind === "sales" && s.payType === "آجل") {
      const c = app.customers.find((x) => x.code === s.partner);
      if (c?.creditLimit && c.balance + total * rate > c.creditLimit) { app.toast(`تجاوز الحد الائتماني للعميل ${c.name} — رُفض الترحيل`, "err"); return; }
    }
    const prefix = kind === "sales" ? "SIN" : kind === "purchases" ? "PIN" : "SRT";
    const no = `${prefix}-2026-0${300 + Math.floor(Math.random() * 90)}`;
    const res = app.addInvoice(kind, { id: `${prefix}-${Date.now()}`, no, date: s.date, partner: s.partner, payType: s.payType, currency: s.currency, rate, costCenter: "CC-01", status: "مرحّلة", vat: 5, lines: s.lines });
    app.toast(res.msg, res.ok ? "ok" : "err");
    if (res.ok) { setS({ ...s, lines: [] }); onClose(); }
  };

  return (
    <Modal open={open} onClose={onClose} wide icon="receipt"
      title={kind === "sales" ? "فاتورة مبيعات جديدة" : kind === "purchases" ? "فاتورة مشتريات جديدة" : "مرتجع مبيعات جديد"}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">{kind === "purchases" ? "المورد" : "العميل"}</span>
          <select className="select mt-1" value={s.partner} onChange={(e) => setS({ ...s, partner: e.target.value })}>
            {partners.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select></label>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">التاريخ</span>
          <input type="date" className="input mt-1 font-num" value={s.date} onChange={(e) => setS({ ...s, date: e.target.value })} /></label>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">العملة</span>
          <select className="select mt-1" value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })}>
            {app.currencies.map((c) => <option key={c.code} value={c.code}>{c.code} ({app.fmtN(c.rate)})</option>)}
          </select></label>
        <div className="col-span-2 md:col-span-4">
          <span className="text-[0.74rem] font-bold text-soft block mb-1.5">طريقة السداد <span className="text-[var(--bad)]">*</span></span>
          {payToggle(s.payType, (p) => setS({ ...s, payType: p }))}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-panel p-3 mb-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
          <label className="block col-span-2"><span className="text-[0.7rem] font-bold text-mute">الصنف</span>
            <select className="select mt-1 !py-2" value={s.item} onChange={(e) => { const it = app.items.find((x) => x.code === e.target.value); setS({ ...s, item: e.target.value, price: kind === "purchases" ? it?.cost || 0 : it?.price || 0 }); }}>
              {app.items.map((i) => <option key={i.code} value={i.code}>{i.name}</option>)}
            </select></label>
          <label className="block"><span className="text-[0.7rem] font-bold text-mute">الكمية</span><input type="number" className="input mt-1 !py-2 font-num" value={s.qty} onChange={(e) => setS({ ...s, qty: +e.target.value })} /></label>
          <label className="block"><span className="text-[0.7rem] font-bold text-mute">السعر</span><input type="number" className="input mt-1 !py-2 font-num" value={s.price} onChange={(e) => setS({ ...s, price: +e.target.value })} /></label>
          <div className="flex items-end gap-2">
            <label className="block flex-1"><span className="text-[0.7rem] font-bold text-mute">خصم %</span><input type="number" className="input mt-1 !py-2 font-num" value={s.disc} onChange={(e) => setS({ ...s, disc: +e.target.value })} /></label>
            <button className="btn btn-soft !py-2" onClick={addLine}><I n="plus" size={15} /> إضافة</button>
          </div>
        </div>
      </div>

      {s.lines.length > 0 ? (
        <table className="tbl mb-4">
          <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>خصم</th><th>الإجمالي</th><th></th></tr></thead>
          <tbody>{s.lines.map((l, i) => (
            <tr key={i}>
              <td className="font-bold">{app.items.find((x) => x.code === l.item)?.name}</td>
              <td className="font-num">{l.qty}</td><td className="font-num">{app.fmtN(l.price)}</td><td className="font-num">{l.disc}%</td>
              <td className="font-num font-bold">{app.fmtN(lineTotal(l))}</td>
              <td><button className="text-mute hover:text-[var(--bad)] transition-colors" onClick={() => setS({ ...s, lines: s.lines.filter((_, j) => j !== i) })} aria-label="حذف سطر"><I n="trash" size={15} /></button></td>
            </tr>))}
          </tbody>
        </table>
      ) : <Empty msg="لم تُضف أصناف بعد — استخدم النموذج أعلاه" />}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--brand) 6%, var(--panel))" }}>
        <div className="text-[0.78rem] font-bold text-soft space-y-1">
          <div>الإجمالي الفرعي: <span className="font-num">{app.fmtN(sub)}</span> • ضريبة 5%: <span className="font-num">{app.fmtN(sub * 0.05)}</span></div>
          {s.currency !== "YER" && <div>سعر التحويل: <span className="font-num">1 {s.currency} = {app.fmtN(rate)} ر.ي</span></div>}
        </div>
        <div className="text-end">
          <div className="text-[0.7rem] font-bold text-mute">الإجمالي المستحق</div>
          <div className="font-num font-bold text-2xl text-[var(--brand)]">{app.fmtN(total)} <span className="text-sm">{s.currency === "YER" ? "ر.ي" : s.currency}</span></div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
        <button className="btn btn-brand" onClick={save}><I n="check" size={16} /> ترحيل الفاتورة ({s.payType})</button>
      </div>
    </Modal>
  );
}

function InvoicesTable({ kind }: { kind: "sales" | "purchases" | "returns" }) {
  const app = useApp();
  const list = kind === "sales" ? app.sales : kind === "purchases" ? app.purchases : app.returns;
  const partners = kind === "purchases" ? app.suppliers : app.customers;
  const [q, setQ] = useState("");
  const rows = list.filter((i) => { const p = partners.find((x) => x.code === i.partner)?.name || ""; return !q || i.no.includes(q) || p.includes(q); });
  return (
    <div>
      <div className="relative w-72 max-w-full mb-3">
        <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
        <input className="input !ps-9" placeholder="بحث برقم الفاتورة أو اسم الطرف…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
        <table className="tbl min-w-[820px]">
          <thead><tr><th>الرقم</th><th>التاريخ</th><th>{kind === "purchases" ? "المورد" : "العميل"}</th><th>السداد</th><th>العملة</th><th>الإجمالي</th><th>الحالة</th><th>إجراء</th></tr></thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id}>
                <td className="font-num font-bold" dir="ltr">{inv.no}</td>
                <td className="font-num">{app.fmtDate(inv.date)}</td>
                <td className="font-bold">{partners.find((p) => p.code === inv.partner)?.name}</td>
                <td><Chip s={inv.payType} /></td>
                <td className="font-num">{inv.currency}</td>
                <td className="font-num font-bold">{app.fmtN(app.invoiceTotal(inv))} <span className="text-[0.62rem] text-mute">ر.ي</span></td>
                <td><Chip s={inv.status} /></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost !p-1.5" onClick={() => app.toast(`${inv.no}: ${inv.lines.length} صنف — ${inv.note || "بدون ملاحظات"}`, "info")} title="عرض"><I n="eye" size={14} /></button>
                    <button className="btn btn-ghost !p-1.5" onClick={() => app.toast("أُرسلت الفاتورة إلى قائمة الطباعة", "info")} title="طباعة"><I n="print" size={14} /></button>
                    {inv.status !== "ملغاة" && <button className="btn btn-danger !p-1.5" onClick={() => app.voidInvoice(kind, inv.id)} title="إلغاء"><I n="undo" size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div></Reveal>
    </div>
  );
}

/* ══════════════════ وحدة المشتريات ══════════════════ */
export function Purchases() {
  const app = useApp();
  const [tab, setTab] = useState(app.route.tab || "base");
  const [show, setShow] = useState(false);
  const total = (arr: Invoice[]) => arr.filter((i) => i.status !== "ملغاة").reduce((a, i) => a + app.invoiceTotal(i), 0);

  return (
    <div>
      <PageHead icon="truck" title="وحدة المشتريات والموردين" desc="طلبات الشراء، عروض الأسعار، وفواتير بنمطي السداد نقدي / آجل">
        <button className="btn btn-brand" onClick={() => setShow(true)}><I n="plus" size={16} /> فاتورة مشتريات</button>
      </PageHead>
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "base", label: "الموردون", icon: "users" },
        { id: "quotes", label: "الطلبات وعروض الأسعار", icon: "clip" },
        { id: "moves", label: "فواتير المشتريات", icon: "receipt" },
        { id: "reports", label: "التقارير التحليلية", icon: "chart" },
      ]} />

      {tab === "base" && (
        <div className="grid md:grid-cols-2 gap-4 stagger">
          {app.suppliers.map((s) => (
            <div key={s.code} className="card card-lift p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl grid place-items-center font-display font-bold" style={{ background: "color-mix(in srgb, var(--accent) 13%, transparent)", color: "var(--accent)" }}>{s.name.slice(5, 7)}</span>
                  <div>
                    <div className="font-display font-bold">{s.name}</div>
                    <div className="text-[0.72rem] text-mute font-bold font-num" dir="ltr">{s.code} • {s.phone}</div>
                  </div>
                </div>
                <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{s.category}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-panel rounded-lg p-2.5 text-center"><div className="text-[0.64rem] font-bold text-mute">الرصيد المستحق</div><div className="font-num font-bold text-[0.95rem] mt-0.5">{app.fmtN(s.balance)}</div></div>
                <div className="bg-panel rounded-lg p-2.5 text-center"><div className="text-[0.64rem] font-bold text-mute">فواتير الربع</div><div className="font-num font-bold text-[0.95rem] mt-0.5">{app.purchases.filter((p) => p.partner === s.code && p.status !== "ملغاة").length}</div></div>
                <div className="bg-panel rounded-lg p-2.5 text-center"><div className="text-[0.64rem] font-bold text-mute">حساب الربط</div><div className="font-num font-bold text-[0.95rem] mt-0.5" dir="ltr">{s.account}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "quotes" && (
        <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
          <table className="tbl min-w-[680px]">
            <thead><tr><th>الرقم</th><th>النوع</th><th>الطرف</th><th>التاريخ</th><th>الصالحية</th><th>القيمة</th><th>الحالة</th></tr></thead>
            <tbody>
              {app.quotes.filter((q) => q.no.startsWith("PQ") || tab === "quotes").slice(0, 8).map((q) => (
                <tr key={q.id}>
                  <td className="font-num font-bold" dir="ltr">{q.no}</td>
                  <td>{q.no.startsWith("PQ") ? <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)]">عرض سعر شراء</span> : <span className="chip bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]">عرض سعر بيع</span>}</td>
                  <td className="font-bold">{[...app.suppliers, ...app.customers].find((p) => p.code === q.partner)?.name}</td>
                  <td className="font-num">{app.fmtDate(q.date)}</td>
                  <td className="font-num">{app.fmtDate(q.valid)}</td>
                  <td className="font-num font-bold">{app.fmtN(q.total)}</td>
                  <td><Chip s={q.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div></Reveal>
      )}

      {tab === "moves" && <InvoicesTable kind="purchases" />}

      {tab === "reports" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Reveal><div className="card p-5">
            <h3 className="font-display font-bold text-base mb-4">المشتريات حسب المورد (الربع الأول)</h3>
            <BarChart height={180} color="var(--accent)" data={app.suppliers.map((s) => ({ label: s.name.split(" ").slice(0, 2).join(" "), value: Math.round(app.purchases.filter((p) => p.partner === s.code && p.status !== "ملغاة").reduce((a, i) => a + app.invoiceTotal(i), 0)) }))} unit=" ر.ي" />
          </div></Reveal>
          <Reveal delay={80}><div className="card p-5">
            <h3 className="font-display font-bold text-base mb-4">التوزيع الشهري</h3>
            <BarChart height={180} data={["يناير", "فبراير", "مارس"].map((m, idx) => ({ label: m, value: Math.round(app.purchases.filter((p) => p.status !== "ملغاة" && p.date.slice(5, 7) === String(idx + 1).padStart(2, "0")).reduce((a, i) => a + app.invoiceTotal(i), 0)) }))} unit=" ر.ي" />
          </div></Reveal>
          <Reveal className="lg:col-span-2"><div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-base">أعلى الأصناف شراءً</h3>
              <button className="btn btn-ghost !py-1.5 !text-[0.72rem]" onClick={() => { const rows: (string | number)[][] = [["المورد", "الإجمالي"], ...app.suppliers.map((s) => [s.name, Math.round(app.purchases.filter((p) => p.partner === s.code).reduce((a, i) => a + app.invoiceTotal(i), 0))])]; app.exportCsv("تحليل_المشتريات", rows); }}><I n="xlsx" size={14} /> تصدير Excel</button>
            </div>
            <div className="space-y-3">
              {app.items.slice(0, 5).map((it) => {
                const v = app.purchases.filter((p) => p.status !== "ملغاة").flatMap((p) => p.lines).filter((l) => l.item === it.code).reduce((a, l) => a + l.qty * l.price, 0);
                const max = 600000;
                return (
                  <div key={it.code}>
                    <div className="flex justify-between text-[0.76rem] font-bold mb-1"><span>{it.name}</span><span className="font-num text-mute">{app.fmtN(v)}</span></div>
                    <div className="h-2.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (v / max) * 100)}%`, background: "linear-gradient(90deg, var(--accent), var(--brand))" }} /></div>
                  </div>
                );
              })}
            </div>
          </div></Reveal>
        </div>
      )}
      <InvoiceBuilder open={show} onClose={() => setShow(false)} kind="purchases" />
      <div className="mt-3 text-[0.72rem] font-bold text-mute">إجمالي مشتريات الربع الأول: <span className="font-num text-[var(--brand)]">{app.fmtMoney(total(app.purchases))}</span> — منها <span className="font-num">{app.fmtMoney(total(app.purchases.filter((i) => i.payType === "آجل")))}</span> آجلة.</div>
    </div>
  );
}

/* ══════════════════ وحدة المبيعات ══════════════════ */
export function Sales() {
  const app = useApp();
  const [tab, setTab] = useState(app.route.tab || "base");
  const [show, setShow] = useState(false);
  const [showRet, setShowRet] = useState(false);
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const act = app.sales.filter((s) => s.status !== "ملغاة");

  const byMonth = ["يناير", "فبراير", "مارس"].map((m, idx) => ({ label: m, value: Math.round(act.filter((s) => s.date.slice(5, 7) === String(idx + 1).padStart(2, "0")).reduce((a, i) => a + app.invoiceTotal(i), 0)) }));
  const byDay = useMemo(() => {
    const days: Record<string, number> = {};
    act.forEach((s) => { days[s.date] = (days[s.date] || 0) + app.invoiceTotal(s); });
    return Object.entries(days).sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ label: d.slice(8), value: Math.round(v) }));
  }, [act]);
  const creditV = Math.round(act.filter((s) => s.payType === "آجل").reduce((a, i) => a + app.invoiceTotal(i), 0));
  const cashV = Math.round(act.reduce((a, i) => a + app.invoiceTotal(i), 0)) - creditV;

  return (
    <div>
      <PageHead icon="tag" title="وحدة المبيعات والعملاء" desc="عروض أسعار، فواتير نقدية وآجلة مع حدود ائتمانية، ومرتجعات مبيعات">
        <button className="btn btn-ghost" onClick={() => setShowRet(true)}><I n="undo" size={16} /> مرتجع مبيعات</button>
        <button className="btn btn-brand" onClick={() => setShow(true)}><I n="plus" size={16} /> فاتورة مبيعات</button>
      </PageHead>
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "base", label: "العملاء والحدود الائتمانية", icon: "users" },
        { id: "quotes", label: "عروض الأسعار", icon: "clip" },
        { id: "moves", label: "فواتير المبيعات", icon: "receipt" },
        { id: "returns", label: "مرتجعات المبيعات", icon: "undo" },
        { id: "reports", label: "التقارير والرسوم", icon: "chart" },
      ]} />

      {tab === "base" && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {app.customers.map((c) => {
            const over = c.creditLimit ? c.balance / c.creditLimit : 0;
            return (
              <div key={c.code} className="card card-lift p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl grid place-items-center font-display font-bold" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)", color: "var(--brand)" }}>{c.name.slice(0, 2)}</span>
                    <div><div className="font-display font-bold">{c.name}</div><div className="text-[0.7rem] text-mute font-bold font-num" dir="ltr">{c.code} • {c.city}</div></div>
                  </div>
                  <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{c.category}</span>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[0.74rem] font-bold"><span className="text-mute">الرصيد المدين</span><span className="font-num">{app.fmtN(c.balance)} ر.ي</span></div>
                  <div className="flex justify-between text-[0.74rem] font-bold"><span className="text-mute">الحد الائتماني</span><span className="font-num">{app.fmtN(c.creditLimit || 0)} ر.ي</span></div>
                  <div className="h-2 rounded-full bg-panel overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, over * 100)}%`, background: over > 1 ? "var(--bad)" : over > 0.8 ? "var(--warn)" : "linear-gradient(90deg, var(--brand), var(--accent))" }} />
                  </div>
                  {over > 1 && <div className="flex items-center gap-1.5 text-[0.7rem] font-bold text-[var(--bad)]"><I n="alert" size={13} /> تجاوز الحد بمقدار {app.fmtN(c.balance - (c.creditLimit || 0))}</div>}
                  {over > 0.8 && over <= 1 && <div className="flex items-center gap-1.5 text-[0.7rem] font-bold text-[var(--warn)]"><I n="info" size={13} /> اقترب من الحد ({Math.round(over * 100)}%)</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "quotes" && (
        <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
          <table className="tbl min-w-[680px]">
            <thead><tr><th>الرقم</th><th>العميل</th><th>التاريخ</th><th>صالح حتى</th><th>القيمة</th><th>الحالة</th><th>إجراء</th></tr></thead>
            <tbody>
              {app.quotes.filter((q) => q.no.startsWith("QT")).map((q) => (
                <tr key={q.id}>
                  <td className="font-num font-bold" dir="ltr">{q.no}</td>
                  <td className="font-bold">{app.customers.find((c) => c.code === q.partner)?.name}</td>
                  <td className="font-num">{app.fmtDate(q.date)}</td>
                  <td className="font-num">{app.fmtDate(q.valid)}</td>
                  <td className="font-num font-bold">{app.fmtN(q.total)}</td>
                  <td><Chip s={q.status} /></td>
                  <td>{q.status === "ساري" ? <button className="btn btn-soft !py-1.5 !text-[0.72rem]" onClick={() => { setShow(true); app.toast(`تحويل العرض ${q.no} إلى فاتورة`, "info"); }}>تحويل لفاتورة</button> : <span className="text-[0.72rem] text-mute font-bold">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div></Reveal>
      )}

      {tab === "moves" && <InvoicesTable kind="sales" />}
      {tab === "returns" && <InvoicesTable kind="returns" />}

      {tab === "reports" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {([["daily", "يومي"], ["monthly", "شهري"], ["yearly", "سنوي"]] as const).map(([id, l]) => (
              <button key={id} onClick={() => setPeriod(id)} className={`btn !py-1.5 !px-4 ${period === id ? "btn-brand" : "btn-ghost"}`}>{l}</button>
            ))}
            <div className="ms-auto flex gap-2">
              <button className="btn btn-ghost !py-1.5" onClick={() => app.exportCsv("المبيعات_" + period, [["الفترة", "القيمة"], ...(period === "daily" ? byDay : byMonth).map((d) => [d.label, d.value])])}><I n="xlsx" size={15} /> Excel</button>
              <button className="btn btn-ghost !py-1.5" onClick={() => app.toast("تقرير PDF جاهز في قائمة الطباعة", "info")}><I n="pdf" size={15} /> PDF</button>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <Reveal className="lg:col-span-2"><div className="card p-5">
              <h3 className="font-display font-bold text-base mb-4">
                {period === "daily" ? "المبيعات اليومية — مارس 2026" : period === "monthly" ? "المبيعات الشهرية — الربع الأول 2026" : "المبيعات السنوية 2023 – 2026"}
              </h3>
              {period === "yearly"
                ? <BarChart height={200} data={[{ label: "2023", value: 5200000 }, { label: "2024", value: 7400000 }, { label: "2025", value: 9100000 }, { label: "2026*", value: Math.round(act.reduce((a, i) => a + app.invoiceTotal(i), 0)) }]} unit=" ر.ي" />
                : <BarChart height={200} data={period === "daily" ? byDay : byMonth} unit=" ر.ي" />}
            </div></Reveal>
            <Reveal delay={90}><div className="card p-5">
              <h3 className="font-display font-bold text-base mb-4">نقدي مقابل آجل</h3>
              <Donut label={app.fmtN((cashV + creditV) / 1000).replace(/\.0$/, "") + "K"} parts={[
                { name: "نقدي", value: cashV, color: "var(--accent)" },
                { name: "آجل", value: creditV, color: "var(--warn)" },
              ]} />
              <div className="mt-4 pt-3 border-t border-line text-[0.72rem] font-bold text-mute">نسبة التحصيل النقدي {Math.round((cashV / (cashV + creditV)) * 100)}% — فوق المستهدف (35%)</div>
            </div></Reveal>
          </div>
          <Reveal><div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3">اتجاه المبيعات التراكمي (أسبوعياً)</h3>
            <LineChart points={[180, 240, 310, 290, 380, 460, 520, 610, 680, 745].map((x) => x * 1000)} height={150} />
          </div></Reveal>
        </div>
      )}

      <InvoiceBuilder open={show} onClose={() => setShow(false)} kind="sales" />
      <InvoiceBuilder open={showRet} onClose={() => setShowRet(false)} kind="returns" />
    </div>
  );
}
