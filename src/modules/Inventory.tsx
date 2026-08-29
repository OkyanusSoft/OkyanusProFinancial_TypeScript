import { useMemo, useState } from "react";
import { useApp } from "../store";
import { Barcode, Chip, Empty, I, Modal, PageHead, Tabs, Reveal } from "../ui";
import type { InvDoc } from "../data";

const TABS = [
  { id: "base", label: "البيانات الأساسية", icon: "layers" },
  { id: "moves", label: "الحركات والمستندات", icon: "swap" },
  { id: "reports", label: "التقارير", icon: "chart" },
];

export default function Inventory() {
  const app = useApp();
  const [tab, setTab] = useState(app.route.tab || "base");
  const [base, setBase] = useState("items");
  const [q, setQ] = useState("");
  const [docType, setDocType] = useState<string>("الكل");
  const [showNew, setShowNew] = useState(false);
  const [showItem, setShowItem] = useState(false);
  const [newDoc, setNewDoc] = useState({ type: "توريد" as InvDoc["type"], warehouse: "WH-01", toWarehouse: "WH-02", date: "2026-03-29", item: "IT-1001", qty: 50 });
  const [newItem, setNewItem] = useState({ name: "", group: "مسكنات وخافضات حرارة", unit: "علبة", cost: 1000, price: 1400, min: 50, max: 500, qty: 0 });

  const totalQty = (it: (typeof app.items)[number]) => Object.values(it.qty).reduce((a, b) => a + b, 0);
  const filteredItems = app.items.filter((i) => !q || i.name.includes(q) || i.code.includes(q) || i.barcode.includes(q));
  const filteredDocs = app.invDocs.filter((d) => docType === "الكل" || d.type === docType);

  const createDoc = () => {
    const id = `${newDoc.type === "توريد" ? "GRN" : newDoc.type === "صرف" ? "ISS" : newDoc.type === "تحويل" ? "TR" : newDoc.type === "جرد" ? "JC" : "ADJ"}-2026-${String(app.invDocs.length + 100).padStart(4, "0")}`;
    app.addInvDoc({ id, type: newDoc.type, date: newDoc.date, ref: id, warehouse: newDoc.warehouse, toWarehouse: newDoc.type === "تحويل" ? newDoc.toWarehouse : undefined, user: app.session?.user || "—", status: "مرحّل", lines: [{ item: newDoc.item, qty: newDoc.qty, cost: app.items.find((i) => i.code === newDoc.item)?.cost || 0 }] });
    setShowNew(false);
  };

  const createItem = () => {
    if (!newItem.name.trim()) { app.toast("اسم الصنف مطلوب", "err"); return; }
    app.addItem({ code: `IT-${1000 + app.items.length + 1}`, name: newItem.name, group: newItem.group, unit: newItem.unit, barcode: `621000${1000 + app.items.length + 1}`, cost: +newItem.cost, price: +newItem.price, min: +newItem.min, max: +newItem.max, qty: { "WH-01": +newItem.qty } });
    setShowItem(false);
  };

  return (
    <div>
      <PageHead icon="box" title="وحدة المخازن والمستودعات" desc="الأدلة الأساسية، سندات الحركة الستة، وتقارير الرقابة المخزنية">
        <button className="btn btn-ghost" onClick={() => app.exportCsv("ارصدة_المخازن", [["الكود", "الصنف", "الرصيد", "الحد الأدنى", "قيمة التكلفة"], ...app.items.map((i) => [i.code, i.name, totalQty(i), i.min, totalQty(i) * i.cost])])}><I n="xlsx" size={16} /> Excel</button>
        <button className="btn btn-ghost" onClick={() => app.toast("جارٍ تجهيز ملف PDF للطباعة…", "info")}><I n="pdf" size={16} /> PDF</button>
        <button className="btn btn-brand" onClick={() => setShowItem(true)}><I n="plus" size={16} /> صنف جديد</button>
      </PageHead>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "base" && (
        <div className="anim-fadein">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[["items", "دليل الأصناف", "box"], ["wh", "دليل المخازن", "bld"], ["groups", "دليل المجموعات", "layers"], ["units", "الوحدات", "scale"]].map(([id, l, ic]) => (
              <button key={id} onClick={() => setBase(id)} className={`btn !py-2 ${base === id ? "btn-brand" : "btn-ghost"}`}><I n={ic} size={15} /> {l}</button>
            ))}
            <div className="relative ms-auto w-64 max-w-full">
              <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
              <input className="input !ps-9" placeholder="بحث بالكود أو الاسم أو الباركود…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          {base === "items" && (
            <Reveal><div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="tbl min-w-[880px]">
                  <thead><tr><th>الكود</th><th>الصنف</th><th>المجموعة</th><th>الوحدة</th><th>الباركود</th><th>التكلفة</th><th>سعر البيع</th><th>الرصيد الكلي</th><th>الحدود</th><th>الحالة</th></tr></thead>
                  <tbody>
                    {filteredItems.map((i) => { const t = totalQty(i); const low = t < i.min; return (
                      <tr key={i.code}>
                        <td className="font-num" dir="ltr">{i.code}</td>
                        <td className="font-bold">{i.name}</td>
                        <td><span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{i.group}</span></td>
                        <td>{i.unit}</td>
                        <td><Barcode value={i.barcode} h={26} /><div className="font-num text-[0.62rem] text-mute" dir="ltr">{i.barcode}</div></td>
                        <td className="font-num">{app.fmtN(i.cost)}</td>
                        <td className="font-num font-bold">{app.fmtN(i.price)}</td>
                        <td className="font-num font-bold" style={{ color: low ? "var(--bad)" : "var(--ink)" }}>{app.fmtN(t)}</td>
                        <td className="font-num text-mute" dir="ltr">{i.min} – {i.max}</td>
                        <td>{low ? <span className="chip bg-[color-mix(in_srgb,var(--bad)_13%,transparent)] text-[var(--bad)]"><I n="alert" size={11} /> دون الحد</span> : <span className="chip bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]"><I n="check" size={11} /> سليم</span>}</td>
                      </tr>); })}
                  </tbody>
                </table>
              </div>
              {filteredItems.length === 0 && <Empty msg="لا توجد أصناف مطابقة لبحثك" />}
            </div></Reveal>
          )}

          {base === "wh" && (
            <div className="grid md:grid-cols-3 gap-4 stagger">
              {app.warehouses.map((w, idx) => (
                <div key={w.code} className="card card-lift p-5 relative overflow-hidden">
                  <div className="absolute top-0 start-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, var(--brand), var(--accent))` }} />
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-11 h-11 rounded-xl grid place-items-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]"><I n="bld" size={22} /></span>
                    <div><div className="font-display font-bold">{w.name}</div><div className="font-num text-[0.68rem] text-mute" dir="ltr">{w.code}</div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[0.76rem]">
                    <div className="bg-panel rounded-lg p-2.5"><div className="text-mute font-bold text-[0.66rem]">أمين المخزن</div><div className="font-bold mt-0.5">{w.keeper}</div></div>
                    <div className="bg-panel rounded-lg p-2.5"><div className="text-mute font-bold text-[0.66rem]">السعة</div><div className="font-num font-bold mt-0.5" dir="ltr">{w.capacity}</div></div>
                    <div className="bg-panel rounded-lg p-2.5"><div className="text-mute font-bold text-[0.66rem]">أصناف نشطة</div><div className="font-num font-bold mt-0.5">{app.items.filter((i) => (i.qty[w.code] || 0) > 0).length}</div></div>
                    <div className="bg-panel rounded-lg p-2.5"><div className="text-mute font-bold text-[0.66rem]">وحدات مخزنة</div><div className="font-num font-bold mt-0.5">{app.fmtN(app.items.reduce((a, i) => a + (i.qty[w.code] || 0), 0))}</div></div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full" style={{ width: `${40 + idx * 22}%`, background: "linear-gradient(90deg, var(--brand), var(--accent))" }} /></div>
                </div>
              ))}
            </div>
          )}

          {base === "groups" && (
            <Reveal><div className="card p-5">
              <div className="grid md:grid-cols-3 gap-3">
                {app.groups.map((g) => {
                  const gi = app.items.filter((i) => i.group === g);
                  const val = gi.reduce((a, i) => a + totalQty(i) * i.cost, 0);
                  return (
                    <div key={g} className="p-4 rounded-xl border border-line bg-panel hover:border-[var(--brand)] transition-colors cursor-default group">
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold group-hover:text-[var(--brand)] transition-colors">{g}</span>
                        <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)] font-num">{gi.length} صنف</span>
                      </div>
                      <div className="mt-2 font-num text-sm font-bold">{app.fmtMoney(val)}</div>
                      <div className="text-[0.68rem] text-mute font-bold">قيمة مخزون المجموعة بالتكلفة</div>
                    </div>
                  );
                })}
              </div>
            </div></Reveal>
          )}

          {base === "units" && (
            <Reveal><div className="card p-5">
              <div className="flex flex-wrap gap-3">
                {app.units.map((u, i) => (
                  <div key={u} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-line bg-panel card-lift cursor-default">
                    <span className="w-9 h-9 rounded-lg grid place-items-center font-display font-bold text-sm" style={{ background: `color-mix(in srgb, var(--brand) ${10 + i * 3}%, transparent)`, color: "var(--brand)" }}>{u.slice(0, 2)}</span>
                    <div><div className="font-bold text-sm">{u}</div><div className="font-num text-[0.64rem] text-mute" dir="ltr">UNIT-0{i + 1}</div></div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[0.74rem] text-mute font-bold flex items-center gap-1.5"><I n="info" size={14} /> الوحدات مرتبطة بالأصناف عبر جدول items.unit وتُستخدم في التحويل بين وحدات الصرف والتوريد.</p>
            </div></Reveal>
          )}
        </div>
      )}

      {tab === "moves" && (
        <div className="anim-fadein">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {["الكل", "افتتاحي", "توريد", "صرف", "تحويل", "تسوية", "جرد"].map((t) => (
              <button key={t} onClick={() => setDocType(t)} className={`btn !py-1.5 !px-3 !text-[0.76rem] ${docType === t ? "btn-brand" : "btn-ghost"}`}>{t}</button>
            ))}
            <button className="btn btn-brand ms-auto" onClick={() => setShowNew(true)}><I n="plus" size={15} /> سند جديد</button>
          </div>
          <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
            <table className="tbl min-w-[860px]">
              <thead><tr><th>رقم السند</th><th>النوع</th><th>التاريخ</th><th>المخزن</th><th>الأصناف</th><th>القيمة</th><th>بواسطة</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>
                {filteredDocs.map((d) => (
                  <tr key={d.id}>
                    <td className="font-num font-bold" dir="ltr">{d.id}</td>
                    <td><span className={`chip ${d.type === "توريد" ? "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]" : d.type === "صرف" ? "bg-[color-mix(in_srgb,var(--bad)_13%,transparent)] text-[var(--bad)]" : "bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]"}`}>{d.type}</span></td>
                    <td className="font-num">{app.fmtDate(d.date)}</td>
                    <td className="font-bold text-[0.78rem]">{app.warehouses.find((w) => w.code === d.warehouse)?.name.split("—")[0]}{d.toWarehouse && <span className="text-mute"> ← {app.warehouses.find((w) => w.code === d.toWarehouse)?.name.split("—")[0]}</span>}</td>
                    <td className="font-num text-center">{d.lines.length}</td>
                    <td className="font-num font-bold">{app.fmtN(d.lines.reduce((a, l) => a + l.qty * l.cost, 0))}</td>
                    <td className="text-[0.78rem]">{d.user}</td>
                    <td><Chip s={d.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-1.5" title="عرض" onClick={() => app.toast(`السند ${d.id}: ${d.lines.map((l) => `${app.items.find((i) => i.code === l.item)?.name} × ${l.qty}`).join("، ")}`, "info")}><I n="eye" size={14} /></button>
                        {d.status === "مرحّل" && <button className="btn btn-danger !p-1.5" title="تراجع عن الإذن" onClick={() => app.voidInvDoc(d.id)}><I n="undo" size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div></Reveal>
        </div>
      )}

      {tab === "reports" && <InvReports />}

      {/* سند جديد */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="إنشاء سند مخزني جديد" icon="swap">
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">نوع السند</span>
            <select className="select mt-1" value={newDoc.type} onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value as InvDoc["type"] })}>
              {["توريد", "صرف", "تحويل", "تسوية", "جرد", "افتتاحي"].map((t) => <option key={t}>{t}</option>)}
            </select></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">التاريخ</span>
            <input type="date" className="input mt-1 font-num" value={newDoc.date} onChange={(e) => setNewDoc({ ...newDoc, date: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">المخزن {newDoc.type === "تحويل" ? "(من)" : ""}</span>
            <select className="select mt-1" value={newDoc.warehouse} onChange={(e) => setNewDoc({ ...newDoc, warehouse: e.target.value })}>
              {app.warehouses.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
            </select></label>
          {newDoc.type === "تحويل" ? (
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">إلى مخزن</span>
              <select className="select mt-1" value={newDoc.toWarehouse} onChange={(e) => setNewDoc({ ...newDoc, toWarehouse: e.target.value })}>
                {app.warehouses.filter((w) => w.code !== newDoc.warehouse).map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
              </select></label>
          ) : (
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">الكمية</span>
              <input type="number" className="input mt-1 font-num" value={newDoc.qty} onChange={(e) => setNewDoc({ ...newDoc, qty: +e.target.value })} /></label>
          )}
          <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">الصنف</span>
            <select className="select mt-1" value={newDoc.item} onChange={(e) => setNewDoc({ ...newDoc, item: e.target.value })}>
              {app.items.map((i) => <option key={i.code} value={i.code}>{i.code} — {i.name}</option>)}
            </select></label>
          {newDoc.type === "تحويل" && (
            <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">الكمية المحوّلة</span>
              <input type="number" className="input mt-1 font-num" value={newDoc.qty} onChange={(e) => setNewDoc({ ...newDoc, qty: +e.target.value })} /></label>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setShowNew(false)}>إلغاء</button>
          <button className="btn btn-brand" onClick={createDoc}><I n="check" size={15} /> ترحيل السند</button>
        </div>
      </Modal>

      {/* صنف جديد */}
      <Modal open={showItem} onClose={() => setShowItem(false)} title="إضافة صنف إلى الدليل" icon="box">
        <div className="grid grid-cols-2 gap-3">
          <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">اسم الصنف</span><input className="input mt-1" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="مثال: إيبوبروفين 400mg" /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">المجموعة</span><select className="select mt-1" value={newItem.group} onChange={(e) => setNewItem({ ...newItem, group: e.target.value })}>{app.groups.map((g) => <option key={g}>{g}</option>)}</select></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الوحدة</span><select className="select mt-1" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}>{app.units.map((u) => <option key={u}>{u}</option>)}</select></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">التكلفة</span><input type="number" className="input mt-1 font-num" value={newItem.cost} onChange={(e) => setNewItem({ ...newItem, cost: +e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">سعر البيع</span><input type="number" className="input mt-1 font-num" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: +e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الحد الأدنى</span><input type="number" className="input mt-1 font-num" value={newItem.min} onChange={(e) => setNewItem({ ...newItem, min: +e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الرصيد الافتتاحي</span><input type="number" className="input mt-1 font-num" value={newItem.qty} onChange={(e) => setNewItem({ ...newItem, qty: +e.target.value })} /></label>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-panel border border-dashed border-line text-center">
          <span className="text-[0.7rem] font-bold text-mute block mb-2">رفع صورة الصنف (اختياري)</span>
          <button className="btn btn-ghost !py-1.5" onClick={() => app.toast("تم إرفاق صورة الصنف بنجاح", "ok")}><I n="down" size={14} /> اختيار صورة / توليد باركود تلقائي</button>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setShowItem(false)}>إلغاء</button>
          <button className="btn btn-brand" onClick={createItem}><I n="plus" size={15} /> حفظ الصنف</button>
        </div>
      </Modal>
    </div>
  );
}

function InvReports() {
  const app = useApp();
  const [rep, setRep] = useState("balances");
  const totalQty = (i: (typeof app.items)[number]) => Object.values(i.qty).reduce((a, b) => a + b, 0);

  const reports = useMemo(() => ({
    balances: { title: "أرصدة المخازن", rows: [["الصنف", ...app.warehouses.map((w) => w.name.split("—")[0].trim()), "الإجمالي", "القيمة"] as (string | number)[], ...app.items.map((i) => [i.name, ...app.warehouses.map((w) => i.qty[w.code] || 0), totalQty(i), app.fmtN(totalQty(i) * i.cost)])] },
    movements: { title: "حركة الأصناف", rows: [["السند", "النوع", "التاريخ", "الصنف", "الكمية", "القيمة"] as (string | number)[], ...app.invDocs.filter((d) => d.status === "مرحّل").flatMap((d) => d.lines.map((l) => [d.id, d.type, d.date, app.items.find((i) => i.code === l.item)?.name || l.item, l.qty, app.fmtN(l.qty * l.cost)]))] },
    card: { title: "بطاقة صنف — باراسيتامول 500mg", rows: [["التاريخ", "السند", "وارد", "منصرف", "الرصيد"] as (string | number)[], ["2026-01-01", "OB-2026", 1240, 0, 1240], ["2026-01-28", "TR-0007", 0, 320, 920], ["2026-03-03", "SIN-2026-0234", 0, 200, 720]] },
    watch: { title: "مراقبة المخزون", rows: [["الصنف", "الرصيد", "الحد الأدنى", "الحد الأقصى", "الحالة"] as (string | number)[], ...app.items.map((i) => [i.name, totalQty(i), i.min, i.max, totalQty(i) < i.min ? "⚠ دون الحد" : "سليم"])] },
    count: { title: "نتائج الجرد الدوري", rows: [["المخزن", "الصنف", "الفرق", "التسوية"] as (string | number)[], ...app.invDocs.filter((d) => d.type === "جرد" && d.status === "مرحّل").flatMap((d) => d.lines.map((l) => [app.warehouses.find((w) => w.code === d.warehouse)?.name || "", app.items.find((i) => i.code === l.item)?.name || "", l.qty, app.fmtN(Math.abs(l.qty) * l.cost)]))] },
  }), [app.items, app.invDocs, app.warehouses]);

  const r = reports[rep as keyof typeof reports];
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[["balances", "أرصدة المخازن"], ["movements", "حركة الأصناف"], ["card", "بطاقة صنف"], ["watch", "مراقبة المخزون"], ["count", "جرد المخزون"]].map(([id, l]) => (
          <button key={id} onClick={() => setRep(id)} className={`btn !py-1.5 !px-3 !text-[0.76rem] ${rep === id ? "btn-brand" : "btn-ghost"}`}>{l}</button>
        ))}
        <div className="ms-auto flex gap-2">
          <button className="btn btn-ghost !py-1.5" onClick={() => app.exportCsv(r.title, r.rows as (string | number)[][])}><I n="xlsx" size={15} /> تصدير Excel</button>
          <button className="btn btn-ghost !py-1.5" onClick={() => app.toast("تم إنشاء ملف PDF وإرساله إلى قائمة الطباعة", "info")}><I n="pdf" size={15} /> PDF</button>
        </div>
      </div>
      <Reveal><div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between bg-panel">
          <h3 className="font-display font-bold text-sm flex items-center gap-2"><I n="file" size={16} className="text-[var(--brand)]" /> {r.title}</h3>
          <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-num">{(r.rows.length - 1)} سجل</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[640px]">
            <thead><tr>{(r.rows[0] as (string | number)[]).map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{(r.rows.slice(1) as (string | number)[][]).map((row, i) => (
              <tr key={i}>{row.map((c, j) => <td key={j} className={j === 0 ? "font-bold" : "font-num"}>{c}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </div></Reveal>
    </div>
  );
}
