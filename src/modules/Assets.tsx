import { useState } from "react";
import { useApp } from "../store";
import { I, Empty, Chip, Modal } from "../ui";
import { openPrint, ReportSheet, PTable } from "../print";

export default function Assets() {
  const app = useApp();
  const [show, setShow] = useState(false);
  const [q, setQ] = useState("");
  const dep = app.depreciationOf;
  const rows = app.assets.filter((a) => !q || a.name.includes(q) || a.code.includes(q) || a.group.includes(q));
  const totalCost = app.assets.reduce((s, a) => s + Number(a.cost), 0);
  const totalDep = app.assets.filter((a) => a.status === "في الخدمة").reduce((s, a) => s + dep(a), 0);

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--accent), var(--brand))" }}><I n="bld" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">نظام الأصول الثابتة</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">سجل الأصول، إهلاك القسط الثابت، والقيد السنوي المرحَّل إلى الحسابات العامة</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-soft" onClick={() => app.postDepreciation()}><I n="check" size={16} /> ترحيل قسط الإهلاك السنوي</button>
          <button className="btn btn-brand" onClick={() => setShow(true)}><I n="plus" size={16} /> أصل جديد</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {[["إجمالي تكلفة الأصول", totalCost, "bld", "var(--brand)"], ["القسط السنوي (قسط ثابت)", totalDep, "scale", "var(--accent)"], ["أصول في الخدمة", app.assets.filter((a) => a.status === "في الخدمة").length, "check", "var(--good)"], ["عدد الأصول", app.assets.length, "layers", "var(--warn)"]].map(([l, v, ic, tone]: any) => (
          <div key={l} className="card card-lift p-4 relative overflow-hidden">
            <div className="absolute -top-6 -start-6 w-20 h-20 rounded-full opacity-[0.09]" style={{ background: tone }} />
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[0.72rem] font-bold text-mute">{l}</div>
                <div className="font-num font-bold text-[1.3rem] mt-1" style={{ color: tone }}>{typeof v === "number" ? app.fmtN(v) : v}</div>
              </div>
              <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone }}><I n={ic} size={20} /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-3.5">
        <div className="relative w-80 max-w-full">
          <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
          <input className="input !ps-9" placeholder="بحث بالاسم أو الكود أو المجموعة…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn btn-ghost ms-auto" onClick={() => app.exportCsv("الأصول_الثابتة", [["الكود", "الاسم", "المجموعة", "التكلفة", "القيمة التخريدية", "العمر", "القسط السنوي", "الحالة"], ...app.assets.map((a: any) => [a.code, a.name, a.group, a.cost, a.salvage, a.life, Math.round(dep(a)), a.status])])}><I n="xlsx" size={15} /> تصدير Excel</button>
        <button className="btn btn-soft" onClick={() => openPrint(
          <ReportSheet title="سجل الأصول الثابتة والإهلاك" subtitle="طريقة القسط الثابت — النظام المالي المتكامل" user={app.session?.user || "—"}
            summary={[["إجمالي التكلفة", app.fmtN(totalCost)], ["القسط السنوي", app.fmtN(totalDep)], ["عدد الأصول", String(app.assets.length)]]}>
            <PTable head={["الكود", "الاسم", "المجموعة", "التكلفة", "القسط السنوي", "الحالة"]}
              rows={app.assets.map((a: any) => [<span className="num">{a.code}</span>, <span>{a.name}</span>, <span>{a.group}</span>, <span className="num">{app.fmtN(a.cost)}</span>, <span className="num">{app.fmtN(dep(a))}</span>, <span>{a.status}</span>])} />
          </ReportSheet>
        )}><I n="print" size={15} /> طباعة السجل</button>
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? <Empty msg="لا توجد أصول مطابقة" /> : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[900px]">
              <thead><tr><th>الكود</th><th>الأصل</th><th>المجموعة</th><th>التكلفة</th><th>التخريدية</th><th>العمر (سنة)</th><th>القسط السنوي</th><th>تاريخ الشراء</th><th>الحالة</th><th></th></tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="font-num font-bold" dir="ltr">{a.code}</td>
                    <td><b>{a.name}</b><div className="text-[0.64rem] text-mute font-medium">{a.location}</div></td>
                    <td><span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{a.group}</span></td>
                    <td className="font-num font-bold">{app.fmtN(a.cost)}</td>
                    <td className="font-num text-mute">{app.fmtN(a.salvage)}</td>
                    <td className="font-num">{a.life}</td>
                    <td className="font-num font-bold text-[var(--accent)]">{app.fmtN(dep(a))}</td>
                    <td className="font-num text-mute">{a.purchase}</td>
                    <td><Chip s={a.status} /></td>
                    <td><div className="act-row"><button className="act-ico" style={{ ["--tone" as any]: "var(--bad)" }} title="استبعاد الأصل" aria-label="استبعاد" onClick={() => { app.setAssets(app.assets.map((x) => x.id === a.id ? { ...x, status: "مستبعد" } : x)); app.toast(`استُبعد الأصل «${a.name}» من الخدمة`, "info"); }}><I n="trash" size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={show} onClose={() => setShow(false)} title="إضافة أصل ثابت جديد" icon="bld" wide>
        <AssetForm onCancel={() => setShow(false)} app={app} onSave={(r) => {
          const id = `FA-${String(app.assets.length + 1).padStart(2, "0")}`;
          app.setAssets([...app.assets, { id, code: id, ...r, status: "في الخدمة" }]);
          app.toast(`أُضيف الأصل «${r.name}» ووُلّد رقمه تلقائياً`, "ok");
          setShow(false);
        }} />
      </Modal>
    </div>
  );
}

function AssetForm({ onSave, onCancel, app }: { onSave: (r: any) => void; onCancel: () => void; app: ReturnType<typeof useApp> }) {
  const [f, setF] = useState({ name: "", group: "معدات", cost: 100000, salvage: 10000, life: 10, purchase: "2026-03-29", location: "" });
  const preview = Math.max(0, (f.cost - f.salvage) / (f.life || 1));
  return (
    <div className="grid md:grid-cols-2 gap-3.5">
      <label className="block md:col-span-2"><span className="text-[0.74rem] font-bold text-soft">اسم الأصل *</span><input className="input mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">المجموعة</span>
        <select className="select mt-1" value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })}>{["معدات", "معدات طبية", "وسائل نقل", "أثاث", "مبانٍ", "أجهزة حاسب"].map((g) => <option key={g}>{g}</option>)}</select></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">الموقع</span><input className="input mt-1" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">التكلفة</span><input type="number" className="input mt-1 font-num" value={f.cost} onChange={(e) => setF({ ...f, cost: +e.target.value })} /></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">القيمة التخريدية</span><input type="number" className="input mt-1 font-num" value={f.salvage} onChange={(e) => setF({ ...f, salvage: +e.target.value })} /></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">العمر الإنتاجي (سنة)</span><input type="number" className="input mt-1 font-num" value={f.life} onChange={(e) => setF({ ...f, life: +e.target.value })} /></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">تاريخ الشراء</span><input type="date" className="input mt-1 font-num" value={f.purchase} onChange={(e) => setF({ ...f, purchase: e.target.value })} /></label>
      <div className="md:col-span-2 p-3 rounded-xl bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-[0.8rem] font-bold flex items-center gap-2">
        <I n="scale" size={17} className="text-[var(--accent)]" /> القسط السنوي (قسط ثابت) = <span className="font-num text-[var(--accent)]">{app.fmtN(preview)} ر.ي</span>
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
        <button className="btn btn-brand" onClick={() => { if (!f.name.trim()) { app.toast("اسم الأصل مطلوب", "err"); return; } onSave(f); }}><I n="save" size={15} /> حفظ الأصل</button>
      </div>
    </div>
  );
}
