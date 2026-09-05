import { useMemo, useState } from "react";
import { useApp } from "../store";
import { I, Empty, Chip, Modal, BarChart } from "../ui";
import { openPrint, ReportSheet, PTable } from "../print";
import { Directory, type DirConf } from "../crud";

const TABS = [
  ["org", "الهيكل الإداري", "bld"], ["emp", "الموظفون", "users"], ["att", "الحضور والانصراف", "clock"], ["rw", "المكافآت", "coins"],
  ["wn", "الإنذارات", "alert"], ["lv", "الأذونات والإجازات", "cal"], ["pay", "كشوف الرواتب", "receipt"], ["rep", "التقارير", "chart"],
] as const;

export default function HR() {
  const app = useApp();
  const [tab, setTab] = useState<string>("org");
  const empName = (id: string) => app.hr.employees.find((e) => e.id === id)?.name || id;
  const [form, setForm] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [showAddEmp, setShowAddEmp] = useState(false);

  const statusChip = (s: string) => <Chip s={s} />;

  const saveRow = (coll: keyof typeof app.hr, row: any, label: string) => {
    const list = app.hr[coll] as any[];
    const stamped = { ...row, updatedAt: Date.now() };
    const i = list.findIndex((r) => r.id === stamped.id);
    const next = i >= 0 ? list.map((r, j) => (j === i ? stamped : r)) : [...list, { id: `${label}-${String(list.length + 1).padStart(2, "0")}`, code: `${label}-${String(list.length + 1).padStart(2, "0")}`, ...stamped }];
    app.setHr({ [coll]: next } as any);
    app.toast(i >= 0 ? "حُدّث السجل بنجاح" : "أُضيف السجل ووُلّد رقمه تلقائياً", "ok");
    setForm(null);
  };

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="users" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">نظام الموارد البشرية</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">الموظفون والحضور والمكافآت والإنذارات والأذونات وكشوف الرواتب المرحَّلة محاسبياً</p>
          </div>
        </div>
        {tab === "emp" && <button className="btn btn-brand" onClick={() => setShowAddEmp(true)}><I n="plus" size={16} /> موظف جديد</button>}
        {tab === "pay" && <button className="btn btn-brand" onClick={() => app.runPayroll()}><I n="check" size={16} /> ترحيل كشف رواتب الشهر</button>}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-line mb-5 px-1">
        {TABS.map(([id, l, ic]) => (
          <button key={id} onClick={() => setTab(id)} className={`tabline flex items-center gap-1.5 px-3.5 py-2.5 text-[0.82rem] font-bold whitespace-nowrap transition-colors ${tab === id ? "on text-[var(--brand)]" : "text-mute hover:text-ink"}`}>
            <I n={ic} size={15} /> {l}
          </button>
        ))}
      </div>

      {tab === "org" && (
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          <Directory conf={{
            coll: "departments", title: "الإدارات", icon: "bld", prefix: "DP", importKey: "departments",
            desc: "الكيانات الإدارية العليا في الهيكل التنظيمي — ترتبط بها الأقسام",
            fields: [
              { k: "code", label: "الكود", req: true, uniq: true },
              { k: "name", label: "اسم الإدارة", req: true, uniq: true },
              { k: "head", label: "مدير الإدارة", req: true },
            ],
            cols: [
              { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
              { k: "name", label: "الإدارة", render: (r) => <b>{r.name}</b> },
              { k: "head", label: "المدير" },
              { k: "secs", label: "الأقسام", num: true, render: (r, a) => <span className="font-num">{a.db.sections.filter((s: any) => s.dept === r.id).length}</span> },
            ],
          }} />
          <Directory conf={{
            coll: "sections", title: "الأقسام", icon: "layers", prefix: "SC", importKey: "sections",
            desc: "وحدات فرعية مرتبطة بالإدارات — تُسند إليها المهام والموظفون",
            fields: [
              { k: "code", label: "الكود", req: true, uniq: true },
              { k: "name", label: "اسم القسم", req: true },
              { k: "dept", label: "الإدارة التابعة", type: "select", req: true, opts: app.db.departments.map((d: any) => ({ v: d.id, l: d.name })) },
              { k: "head", label: "رئيس القسم", req: true },
            ],
            cols: [
              { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
              { k: "name", label: "القسم", render: (r) => <b>{r.name}</b> },
              { k: "dept", label: "الإدارة", render: (r) => app.db.departments.find((d: any) => d.id === r.dept)?.name || "—" },
              { k: "head", label: "الرئيس" },
            ],
          }} />
        </div>
      )}

      {tab === "emp" && (
        <SimpleTable title="سجل الموظفين" icon="users" cols={["الكود", "الاسم", "الوظيفة", "القسم", "الراتب", "تاريخ التعيين", "الحالة"]}
          rows={app.hr.employees.map((e) => [e.code, <b>{e.name}</b>, e.job, e.dept, <b className="font-num">{app.fmtN(e.salary)}</b>, <span className="font-num">{e.join}</span>, statusChip(e.status)])}
          onExport={() => app.exportCsv("الموظفون", [["الكود", "الاسم", "الوظيفة", "القسم", "الراتب", "الحالة"], ...app.hr.employees.map((e: any) => [e.code, e.name, e.job, e.dept, e.salary, e.status])])}
          onPrint={() => printHR(app, "سجل الموظفين", ["الكود", "الاسم", "الوظيفة", "القسم", "الراتب", "الحالة"], app.hr.employees.map((e: any) => [e.code, e.name, e.job, e.dept, String(e.salary), e.status]))} />
      )}

      {tab === "att" && (
        <SimpleTable title="الحضور والانصراف — اليوم" icon="clock" cols={["الموظف", "التاريخ", "الحضور", "الانصراف", "الساعات", "الحالة"]}
          rows={app.hr.attendance.map((a) => [<b>{empName(a.emp)}</b>, <span className="font-num">{a.date}</span>, <span className="font-num">{a.in}</span>, <span className="font-num">{a.out}</span>, <span className="font-num">{a.hours}</span>, statusChip(a.status)])}
          onExport={() => app.exportCsv("الحضور", [["الموظف", "التاريخ", "الحضور", "الانصراف", "الساعات", "الحالة"], ...app.hr.attendance.map((a: any) => [empName(a.emp), a.date, a.in, a.out, a.hours, a.status])])}
          onPrint={() => printHR(app, "الحضور والانصراف", ["الموظف", "التاريخ", "الحضور", "الانصراف", "الساعات", "الحالة"], app.hr.attendance.map((a: any) => [empName(a.emp), a.date, a.in, a.out, String(a.hours), a.status]))} />
      )}

      {tab === "rw" && (
        <SimpleTable title="المكافآت" icon="coins" cols={["الموظف", "السبب", "المبلغ", "التاريخ", "الحالة"]}
          rows={app.hr.rewards.map((r) => [<b>{empName(r.emp)}</b>, r.reason, <b className="font-num text-[var(--good)]">{app.fmtN(r.amount)}</b>, <span className="font-num">{r.date}</span>, statusChip(r.status)])}
          onExport={() => app.exportCsv("المكافآت", [["الموظف", "السبب", "المبلغ", "الحالة"], ...app.hr.rewards.map((r: any) => [empName(r.emp), r.reason, r.amount, r.status])])}
          onPrint={() => printHR(app, "المكافآت", ["الموظف", "السبب", "المبلغ", "الحالة"], app.hr.rewards.map((r: any) => [empName(r.emp), r.reason, String(r.amount), r.status]))} />
      )}

      {tab === "wn" && (
        <SimpleTable title="الإنذارات" icon="alert" cols={["الموظف", "السبب", "المستوى", "التاريخ", "الحالة"]}
          rows={app.hr.warnings.map((w) => [<b>{empName(w.emp)}</b>, w.reason, <span className="chip bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-[var(--bad)]">{w.level}</span>, <span className="font-num">{w.date}</span>, statusChip(w.status)])}
          onExport={() => app.exportCsv("الإنذارات", [["الموظف", "السبب", "المستوى", "الحالة"], ...app.hr.warnings.map((w: any) => [empName(w.emp), w.reason, w.level, w.status])])}
          onPrint={() => printHR(app, "الإنذارات", ["الموظف", "السبب", "المستوى", "الحالة"], app.hr.warnings.map((w: any) => [empName(w.emp), w.reason, w.level, w.status]))} />
      )}

      {tab === "lv" && (
        <SimpleTable title="الأذونات والإجازات" icon="cal" cols={["الموظف", "من", "إلى", "الأيام", "النوع", "الحالة"]}
          rows={app.hr.leaves.map((l) => [<b>{empName(l.emp)}</b>, <span className="font-num">{l.from}</span>, <span className="font-num">{l.to}</span>, <span className="font-num">{l.days}</span>, l.type, statusChip(l.status)])}
          onExport={() => app.exportCsv("الإجازات", [["الموظف", "من", "إلى", "الأيام", "النوع", "الحالة"], ...app.hr.leaves.map((l: any) => [empName(l.emp), l.from, l.to, l.days, l.type, l.status])])}
          onPrint={() => printHR(app, "الإجازات", ["الموظف", "من", "إلى", "الأيام", "النوع", "الحالة"], app.hr.leaves.map((l: any) => [empName(l.emp), l.from, l.to, String(l.days), l.type, l.status]))} />
      )}

      {tab === "pay" && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap items-center gap-3 justify-between" style={{ background: "color-mix(in srgb, var(--brand) 5%, var(--panel))" }}>
            <div className="text-[0.8rem] font-bold text-soft flex items-center gap-2"><I n="info" size={16} className="text-[var(--brand)]" /> ترحيل الكشف يولّد قيداً متوازناً: من ح/ الرواتب (31111) إلى ح/ البنك — ويظهر في دفتر الأستاذ فوراً</div>
            <div className="text-[0.85rem] font-display font-bold">إجمالي رواتب الشهر: <span className="font-num text-[var(--brand)]">{app.fmtN(app.hr.employees.reduce((a: number, e: any) => a + e.salary, 0))} ر.ي</span></div>
          </div>
          <SimpleTable title="كشوف الرواتب المرحَّلة" icon="receipt" cols={["الموظف", "الشهر", "الأساسي", "مكافآت", "الإجمالي", "الحالة"]}
            rows={app.hr.payroll.length ? app.hr.payroll.map((p) => [<b>{p.name}</b>, <span className="font-num">{p.month}</span>, <span className="font-num">{app.fmtN(p.basic)}</span>, <span className="font-num text-[var(--good)]">{app.fmtN(p.bonus)}</span>, <b className="font-num">{app.fmtN(p.total)}</b>, statusChip(p.status)]) : []}
            empty="لم يُرحَّل أي كشف بعد — اضغط «ترحيل كشف رواتب الشهر»"
            onExport={() => app.exportCsv("كشوف_الرواتب", [["الموظف", "الشهر", "الأساسي", "مكافآت", "الإجمالي", "الحالة"], ...app.hr.payroll.map((p: any) => [p.name, p.month, p.basic, p.bonus, p.total, p.status])])}
            onPrint={() => printHR(app, "كشف الرواتب المرحَّل", ["الموظف", "الشهر", "الأساسي", "مكافآت", "الإجمالي", "الحالة"], app.hr.payroll.map((p: any) => [p.name, p.month, String(p.basic), String(p.bonus), String(p.total), p.status]))} />
        </div>
      )}

      {tab === "rep" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-4">الرواتب حسب القسم</h3>
            <BarChart height={200} color="var(--brand)" data={Object.entries(app.hr.employees.reduce((acc: Record<string, number>, e: any) => { acc[e.dept] = (acc[e.dept] || 0) + e.salary; return acc; }, {})).map(([k, v]) => ({ label: k, value: v }))} unit=" ر.ي" />
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-4">ملخص القوى العاملة</h3>
            <div className="grid grid-cols-2 gap-3">
              {[["إجمالي الموظفين", app.hr.employees.length, "users", "var(--brand)"], ["حاضرون اليوم", app.hr.attendance.filter((a) => a.status === "حاضر").length, "clock", "var(--good)"], ["إجازات معتمدة", app.hr.leaves.filter((l) => l.status === "معتمدة").length, "cal", "var(--warn)"], ["مكافآت مصروفة", app.hr.rewards.filter((r) => r.status === "مصروفة").length, "coins", "var(--accent)"]].map(([l, v, ic, tone]: any) => (
                <div key={l} className="bg-panel border border-line rounded-xl p-4 text-center">
                  <I n={ic} size={22} className="mx-auto mb-2" />
                  <div className="font-num font-bold text-2xl" style={{ color: tone }}>{v}</div>
                  <div className="text-[0.7rem] font-bold text-mute mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal open={showAddEmp} onClose={() => setShowAddEmp(false)} title="إضافة موظف جديد" icon="users" wide>
        <EmpForm onCancel={() => setShowAddEmp(false)} onSave={(r) => { saveRow("employees", r, "EMP"); setShowAddEmp(false); }} app={app} />
      </Modal>
    </div>
  );
}

function EmpForm({ onSave, onCancel, app }: { onSave: (r: any) => void; onCancel: () => void; app: ReturnType<typeof useApp> }) {
  const [f, setF] = useState({ name: "", job: "", dept: "المالية", salary: 100000, phone: "", join: "2026-03-29", status: "نشط" });
  return (
    <div className="grid md:grid-cols-2 gap-3.5">
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">الاسم *</span><input className="input mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">الوظيفة</span><input className="input mt-1" value={f.job} onChange={(e) => setF({ ...f, job: e.target.value })} /></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">القسم</span>
        <select className="select mt-1" value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })}>{["المالية", "المخازن", "المشتريات", "المبيعات", "الموارد البشرية", "الإدارة"].map((d) => <option key={d}>{d}</option>)}</select></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">الراتب الأساسي</span><input type="number" className="input mt-1 font-num" value={f.salary} onChange={(e) => setF({ ...f, salary: +e.target.value })} /></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">الهاتف</span><input className="input mt-1 font-num" dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
      <label className="block"><span className="text-[0.74rem] font-bold text-soft">تاريخ التعيين</span><input type="date" className="input mt-1 font-num" value={f.join} onChange={(e) => setF({ ...f, join: e.target.value })} /></label>
      <div className="md:col-span-2 flex justify-end gap-2 mt-2">
        <button className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
        <button className="btn btn-brand" onClick={() => { if (!f.name.trim()) { app.toast("الاسم مطلوب", "err"); return; } onSave(f); }}><I n="save" size={15} /> حفظ الموظف</button>
      </div>
    </div>
  );
}

function SimpleTable({ title, icon, cols, rows, onExport, onPrint, empty }: {
  title: string; icon: string; cols: string[]; rows: any[][]; onExport: () => void; onPrint: () => void; empty?: string;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-line bg-panel flex items-center justify-between">
        <h3 className="font-display font-bold text-sm flex items-center gap-2"><I n={icon} size={17} className="text-[var(--brand)]" /> {title} <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{rows.length}</span></h3>
        <div className="flex gap-1.5">
          <button className="btn btn-ghost !py-1.5 !text-[0.72rem]" onClick={onExport}><I n="xlsx" size={14} /> Excel</button>
          <button className="btn btn-soft !py-1.5 !text-[0.72rem]" onClick={onPrint}><I n="print" size={14} /> طباعة</button>
        </div>
      </div>
      {rows.length === 0 ? <Empty msg={empty || "لا توجد سجلات"} /> : (
        <div className="overflow-x-auto">
          <table className="tbl min-w-[680px]">
            <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function printHR(app: ReturnType<typeof useApp>, title: string, cols: string[], rows: (string | number)[][]) {
  openPrint(
    <ReportSheet title={title} subtitle="نظام الموارد البشرية — النظام المالي المتكامل" user={app.session?.user || "—"}
      summary={[["عدد السجلات", String(rows.length)]]}>
      <PTable head={cols} rows={rows.map((r) => r.map((c) => <span>{String(c)}</span>))} />
    </ReportSheet>
  );
}
