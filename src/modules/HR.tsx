import { useMemo, useState } from "react";
import { useApp } from "../store";
import { I, Empty, Chip, Modal, BarChart, Donut, FormSection } from "../ui";
import { openPrint, ReportSheet, PTable, setReportCfg } from "../print";
import { Directory, type DirConf } from "../crud";
import { DocActions, StatusChip, ReadOnlyDoc, type DocViewData } from "../flow";

/* ═══════════ نظام الموارد البشرية — v6.1 ═══════════
   البيانات الأساسية: الهيكل الإداري · الموظفون والتوظيف · بيانات الدوام
   الحركات: حركة الدوام · حركات الموظفين · احتساب الرواتب بالقيد المحاسبي
   التقارير: بيانات الموظفين · الرواتب · حركة الدوام                    */

const MAIN_TABS = [
  ["base", "البيانات الأساسية", "layers"],
  ["mv", "الحركات", "pulse"],
  ["rep", "التقارير", "chart"],
] as const;

export default function HR() {
  const app = useApp();
  const path = app.route.path || "base.org";
  const [main, leaf] = path.split(".");
  const go = (p: string) => app.nav({ module: "hr", path: p });

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}><I n="users" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">نظام الموارد البشرية</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">الهيكل الإداري والموظفون والدوام والرواتب — بترحيل محاسبي متوازن</p>
          </div>
        </div>
      </div>

      {/* التبويبات الرئيسية */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line mb-5 px-1">
        {MAIN_TABS.map(([id, l, ic]) => (
          <button key={id} onClick={() => go(id === "base" ? "base.org" : id === "mv" ? "mv.att" : "rep.emp")}
            className={`tabline flex items-center gap-1.5 px-3.5 py-2.5 text-[0.82rem] font-bold whitespace-nowrap transition-colors ${main === id ? "on text-[var(--brand)]" : "text-mute hover:text-ink"}`}>
            <I n={ic} size={15} /> {l}
          </button>
        ))}
      </div>

      {main === "base" && (leaf === "emp" ? <EmployeesScreen /> : leaf === "att" ? <AttSettingsScreen /> : <OrgScreen />)}
      {main === "mv" && (leaf === "emp" ? <EmpMovesScreen /> : leaf === "pay" ? <PayrollScreen /> : <AttMovesScreen />)}
      {main === "rep" && (leaf === "pay" ? <PayrollReport /> : leaf === "att" ? <AttReport /> : <EmpReport />)}
    </div>
  );
}

/* ═══════════ تبويبات فرعية مشتركة ═══════════ */
function SubTabs({ items, active, onChange }: { items: [string, string, string][]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {items.map(([id, l, ic]) => (
        <button key={id} onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[0.74rem] font-bold transition-all ${active === id ? "text-[var(--brandink)] border-transparent shadow" : "bg-surface border-line text-soft hover:border-[color-mix(in_srgb,var(--brand)_40%,transparent)] hover:text-[var(--brand)]"}`}
          style={active === id ? { background: "linear-gradient(135deg, var(--brand), var(--brand2))" } : undefined}>
          <I n={ic} size={13} /> {l}
        </button>
      ))}
    </div>
  );
}

const nameOf = (app: ReturnType<typeof useApp>, coll: string, id: string) => (app.db as any)[coll]?.find((x: any) => x.id === id)?.name || id;
const empName = (app: ReturnType<typeof useApp>, id: string) => app.hr.employees.find((e) => e.id === id)?.name || id;

/* ═══════════ 1) الهيكل الإداري ═══════════ */
function OrgScreen() {
  const app = useApp();
  const [sub, setSub] = useState("countries");
  const dir = (c: DirConf) => <Directory conf={c} />;
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} items={[
        ["countries", "الدول", "globe"], ["governorates", "المحافظات", "bld"], ["departments", "الإدارات", "layers"],
        ["qualifications", "المؤهلات", "file"], ["specializations", "التخصصات", "book"], ["relations", "صلة القرابة", "users"],
      ]} />
      {sub === "countries" && dir({
        coll: "countries", title: "الدول", icon: "globe", prefix: "CT", importKey: "countries",
        desc: "دول الموظفين وجهات العمل — ترميز ISO",
        fields: [
          { k: "code", label: "الرمز (ISO)", req: true, uniq: true, hint: "مثل YE لليمن" },
          { k: "name", label: "اسم الدولة", req: true, uniq: true },
          { k: "en", label: "الاسم اللاتيني" },
          { k: "phone", label: "مفتاح الهاتف", hint: "مثل +967" },
        ],
        cols: [
          { k: "code", label: "الرمز", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "الدولة", render: (r) => <b>{r.name}</b> },
          { k: "en", label: "الاسم اللاتيني", num: true },
          { k: "phone", label: "مفتاح الهاتف", num: true },
        ],
      })}
      {sub === "governorates" && dir({
        coll: "governorates", title: "المحافظات", icon: "bld", prefix: "GV", importKey: "governorates",
        desc: "محافظات الجمهورية — تُربط بعناوين الموظفين والفروع",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "اسم المحافظة", req: true, uniq: true },
          { k: "country", label: "الدولة", type: "select", req: true, opts: app.db.countries.map((c: any) => ({ v: c.code, l: c.name })) },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "المحافظة", render: (r) => <b>{r.name}</b> },
          { k: "country", label: "الدولة", render: (r) => nameOf(app, "countries", r.country) },
        ],
      })}
      {sub === "departments" && dir({
        coll: "departments", title: "الإدارات", icon: "layers", prefix: "DP", importKey: "departments",
        desc: "الإدارات في الهيكل التنظيمي — يُسند إليها الموظفون",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "اسم الإدارة", req: true, uniq: true },
          { k: "head", label: "مدير الإدارة", req: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "الإدارة", render: (r) => <b>{r.name}</b> },
          { k: "head", label: "المدير" },
          { k: "emps", label: "الموظفون", num: true, render: (r) => <span className="font-num">{app.hr.employees.filter((e) => e.dept === r.name).length}</span> },
        ],
      })}
      {sub === "qualifications" && dir({
        coll: "qualifications", title: "المؤهلات العلمية", icon: "file", prefix: "QL", importKey: "qualifications",
        desc: "المؤهلات التي يحملها الموظفون",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "المؤهل", req: true, uniq: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "المؤهل", render: (r) => <b>{r.name}</b> },
        ],
      })}
      {sub === "specializations" && dir({
        coll: "specializations", title: "التخصصات", icon: "book", prefix: "SP", importKey: "specializations",
        desc: "التخصصات الوظيفية للموظفين",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "التخصص", req: true, uniq: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "التخصص", render: (r) => <b>{r.name}</b> },
        ],
      })}
      {sub === "relations" && dir({
        coll: "relations", title: "صلة القرابة", icon: "users", prefix: "RL", importKey: "relations",
        desc: "صل القرابة لجهات الطوارئ والتأمينات",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "صلة القرابة", req: true, uniq: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "صلة القرابة", render: (r) => <b>{r.name}</b> },
        ],
      })}
    </div>
  );
}

/* ═══════════ 2) بيانات الموظفين والتوظيف ═══════════ */
function EmployeesScreen() {
  const app = useApp();
  return (
    <Directory conf={{
      coll: "employees" as any, title: "بيانات الموظفين والتوظيف", icon: "users", prefix: "EMP", importKey: "employees",
      desc: "الملفات الوظيفية الكاملة — تُبنى منها الرواتب والدوام والتقارير",
      fields: [
        { k: "code", label: "الرقم الوظيفي", req: true, uniq: true },
        { k: "name", label: "اسم الموظف", req: true },
        { k: "job", label: "الوظيفة", req: true },
        { k: "dept", label: "الإدارة", type: "select", req: true, opts: app.db.departments.map((d: any) => ({ v: d.name, l: d.name })) },
        { k: "gov", label: "المحافظة", type: "select", opts: app.db.governorates.map((g: any) => ({ v: g.name, l: g.name })) },
        { k: "qual", label: "المؤهل", type: "select", opts: app.db.qualifications.map((q: any) => ({ v: q.name, l: q.name })) },
        { k: "spec", label: "التخصص", type: "select", opts: app.db.specializations.map((s: any) => ({ v: s.name, l: s.name })) },
        { k: "salary", label: "الراتب الأساسي", type: "number", req: true },
        { k: "phone", label: "الهاتف" },
        { k: "join", label: "تاريخ التعيين", type: "date", req: true },
        { k: "status", label: "الحالة", type: "select", req: true, opts: [{ v: "نشط", l: "نشط" }, { v: "إجازة", l: "إجازة" }, { v: "موقوف", l: "موقوف" }, { v: "منتهٍ", l: "منتهٍ" }] },
      ],
      cols: [
        { k: "code", label: "الرقم", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
        { k: "name", label: "الموظف", render: (r) => <b>{r.name}</b> },
        { k: "job", label: "الوظيفة" },
        { k: "dept", label: "الإدارة", render: (r) => <Chip s={String(r.dept)} /> },
        { k: "salary", label: "الراتب", num: true, render: (r, a) => <span className="font-num font-bold text-[var(--brand)]">{a.fmtN(r.salary)}</span> },
        { k: "join", label: "التعيين", num: true },
        { k: "status", label: "الحالة", render: (r) => <Chip s={String(r.status)} /> },
      ],
    }} />
  );
}

/* ═══════════ 3) بيانات الدوام (الأنواع والمعايير) ═══════════ */
function AttSettingsScreen() {
  const [sub, setSub] = useState("leaveTypes");
  const app = useApp();
  const dir = (c: DirConf) => <Directory conf={c} />;
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} items={[
        ["leaveTypes", "الإجازات", "cal"], ["warningLevels", "الإنذارات", "alert"], ["permitTypes", "الإذونات", "clock"],
        ["penaltyTypes", "الجزاءات", "x"], ["missionTypes", "المهام", "clip"], ["overtimeTypes", "الإضافي", "pulse"],
      ]} />
      {sub === "leaveTypes" && dir({
        coll: "leaveTypes", title: "أنواع الإجازات", icon: "cal", prefix: "LT", importKey: "leaveTypes",
        desc: "أنواع الإجازات ومددها القصوى وأجرها",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "نوع الإجازة", req: true },
          { k: "paid", label: "مدفوعة", type: "select", req: true, opts: [{ v: true, l: "نعم" }, { v: false, l: "لا" }] },
          { k: "maxDays", label: "الحد الأقصى (يوم)", type: "number", req: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "الإجازة", render: (r) => <b>{r.name}</b> },
          { k: "paid", label: "مدفوعة", render: (r) => <Chip s={r.paid ? "مرحّل" : "ملغي"} /> },
          { k: "maxDays", label: "الحد الأقصى", num: true },
        ],
      })}
      {sub === "warningLevels" && dir({
        coll: "warningLevels", title: "مستويات الإنذارات", icon: "alert", prefix: "WL", importKey: "warningLevels",
        desc: "درجات الإنذار التصاعدية",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "المستوى", req: true },
          { k: "severity", label: "الدرجة (1-4)", type: "number", req: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "المستوى", render: (r) => <b>{r.name}</b> },
          { k: "severity", label: "الدرجة", num: true },
        ],
      })}
      {sub === "permitTypes" && dir({
        coll: "permitTypes", title: "أنواع الإذونات", icon: "clock", prefix: "PT", importKey: "permitTypes",
        desc: "أنواع الإذونات ومددها بالساعات",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "نوع الإذن", req: true },
          { k: "hours", label: "المدة (ساعة)", type: "number", req: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "الإذن", render: (r) => <b>{r.name}</b> },
          { k: "hours", label: "الساعات", num: true },
        ],
      })}
      {sub === "penaltyTypes" && dir({
        coll: "penaltyTypes", title: "أنواع الجزاءات", icon: "x", prefix: "PN", importKey: "penaltyTypes",
        desc: "الجزاءات وقيمة الخصم بالأيام",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "الجزاء", req: true },
          { k: "deduct", label: "الخصم (يوم)", type: "number", req: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "الجزاء", render: (r) => <b>{r.name}</b> },
          { k: "deduct", label: "الخصم (يوم)", num: true },
        ],
      })}
      {sub === "missionTypes" && dir({
        coll: "missionTypes", title: "أنواع المهام", icon: "clip", prefix: "MS", importKey: "missionTypes",
        desc: "المهام وبدلاتها",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "نوع المهمة", req: true },
          { k: "allowance", label: "البدل", type: "number", req: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "المهمة", render: (r) => <b>{r.name}</b> },
          { k: "allowance", label: "البدل", num: true, render: (r, a) => <span className="font-num">{a.fmtN(r.allowance)}</span> },
        ],
      })}
      {sub === "overtimeTypes" && dir({
        coll: "overtimeTypes", title: "أنواع العمل الإضافي", icon: "pulse", prefix: "OT", importKey: "overtimeTypes",
        desc: "أنواع الإضافي ومعاملات الأجر",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "name", label: "النوع", req: true },
          { k: "rate", label: "المعامل", type: "number", req: true },
        ],
        cols: [
          { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
          { k: "name", label: "النوع", render: (r) => <b>{r.name}</b> },
          { k: "rate", label: "المعامل", num: true, render: (r) => <span className="font-num">×{r.rate}</span> },
        ],
      })}
    </div>
  );
}

/* ═══════════ 4) حركة الدوام ═══════════ */
function AttMovesScreen() {
  const app = useApp();
  const [sub, setSub] = useState("logs");
  const dir = (c: DirConf) => <Directory conf={c} />;
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} items={[
        ["logs", "حركات الدوام", "clock"], ["finger", "من جهاز البصمة", "pulse"], ["late", "التأخيرات", "alert"],
      ]} />
      {sub === "logs" && dir({
        coll: "attendanceLogs", title: "حركات الدوام اليومية", icon: "clock", prefix: "AT", importKey: "attendanceLogs",
        desc: "الحضور والانصراف اليومي لكل موظف",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "emp", label: "الموظف", type: "select", req: true, opts: app.hr.employees.map((e) => ({ v: e.id, l: e.name })) },
          { k: "date", label: "التاريخ", type: "date", req: true },
          { k: "checkIn", label: "الدخول", req: true, hint: "مثل 08:00" },
          { k: "checkOut", label: "الخروج", hint: "مثل 16:00" },
          { k: "hours", label: "الساعات", type: "number", req: true },
          { k: "status", label: "الحالة", type: "select", req: true, opts: [{ v: "حاضر", l: "حاضر" }, { v: "متأخر", l: "متأخر" }, { v: "غائب", l: "غائب" }, { v: "إجازة", l: "إجازة" }] },
        ],
        cols: [
          { k: "date", label: "التاريخ", num: true },
          { k: "emp", label: "الموظف", render: (r) => <b>{empName(app, r.emp)}</b> },
          { k: "checkIn", label: "الدخول", num: true },
          { k: "checkOut", label: "الخروج", num: true },
          { k: "hours", label: "الساعات", num: true },
          { k: "status", label: "الحالة", render: (r) => <Chip s={r.status === "حاضر" ? "مرحّل" : r.status === "متأخر" ? "بانتظار الموافقة" : "ملغي"} /> },
        ],
      })}
      {sub === "finger" && dir({
        coll: "fingerLogs", title: "حركات البصمة", icon: "pulse", prefix: "FP", importKey: "fingerLogs",
        desc: "البصمات الواردة من أجهزة الحضور",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "emp", label: "الموظف", type: "select", req: true, opts: app.hr.employees.map((e) => ({ v: e.id, l: e.name })) },
          { k: "date", label: "التاريخ", type: "date", req: true },
          { k: "time", label: "الوقت", req: true },
          { k: "type", label: "النوع", type: "select", req: true, opts: [{ v: "دخول", l: "دخول" }, { v: "خروج", l: "خروج" }] },
          { k: "device", label: "الجهاز", req: true },
        ],
        cols: [
          { k: "date", label: "التاريخ", num: true },
          { k: "emp", label: "الموظف", render: (r) => <b>{empName(app, r.emp)}</b> },
          { k: "time", label: "الوقت", num: true },
          { k: "type", label: "النوع", render: (r) => <Chip s={r.type === "دخول" ? "مرحّل" : "بانتظار الموافقة"} /> },
          { k: "device", label: "الجهاز" },
        ],
      })}
      {sub === "late" && dir({
        coll: "lateLogs", title: "التأخيرات", icon: "alert", prefix: "LL", importKey: "lateLogs",
        desc: "التأخيرات المسجلة وخصوماتها",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "emp", label: "الموظف", type: "select", req: true, opts: app.hr.employees.map((e) => ({ v: e.id, l: e.name })) },
          { k: "date", label: "التاريخ", type: "date", req: true },
          { k: "lateMin", label: "دقائق التأخير", type: "number", req: true },
          { k: "deduct", label: "الخصم (يوم)", type: "number", req: true },
          { k: "note", label: "السبب" },
        ],
        cols: [
          { k: "date", label: "التاريخ", num: true },
          { k: "emp", label: "الموظف", render: (r) => <b>{empName(app, r.emp)}</b> },
          { k: "lateMin", label: "الدقائق", num: true, render: (r) => <span className="font-num font-bold text-[var(--bad)]">{r.lateMin}</span> },
          { k: "deduct", label: "الخصم", num: true },
          { k: "note", label: "السبب" },
        ],
      })}
    </div>
  );
}

/* ═══════════ 5) حركات الموظفين ═══════════ */
function EmpMovesScreen() {
  const app = useApp();
  const [sub, setSub] = useState("advances");
  const dir = (c: DirConf) => <Directory conf={c} />;
  return (
    <div>
      <SubTabs active={sub} onChange={setSub} items={[
        ["advances", "السلف", "wallet"], ["permits", "الأذونات", "clock"], ["warnings", "الإنذارات", "alert"], ["leaves", "الإجازات", "cal"],
      ]} />
      {sub === "advances" && dir({
        coll: "advances", title: "سلف الموظفين", icon: "wallet", prefix: "AD", importKey: "advances",
        desc: "السلف وطرق سدادها — تُستقطع من الرواتب",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "emp", label: "الموظف", type: "select", req: true, opts: app.hr.employees.map((e) => ({ v: e.id, l: e.name })) },
          { k: "amount", label: "المبلغ", type: "number", req: true },
          { k: "date", label: "التاريخ", type: "date", req: true },
          { k: "method", label: "طريقة السداد", type: "select", req: true, opts: [{ v: "استقطاع شهري", l: "استقطاع شهري" }, { v: "دفعة واحدة", l: "دفعة واحدة" }] },
          { k: "months", label: "عدد الأشهر", type: "number", req: true },
          { k: "status", label: "الحالة", type: "select", req: true, opts: [{ v: "قائمة", l: "قائمة" }, { v: "مسدَّدة", l: "مسدَّدة" }] },
        ],
        cols: [
          { k: "emp", label: "الموظف", render: (r) => <b>{empName(app, r.emp)}</b> },
          { k: "amount", label: "المبلغ", num: true, render: (r, a) => <span className="font-num font-bold">{a.fmtN(r.amount)}</span> },
          { k: "date", label: "التاريخ", num: true },
          { k: "method", label: "السداد" },
          { k: "remaining", label: "المتبقي", num: true, render: (r, a) => <span className="font-num font-bold text-[var(--bad)]">{a.fmtN(r.remaining ?? 0)}</span> },
          { k: "status", label: "الحالة", render: (r) => <Chip s={r.status === "قائمة" ? "بانتظار الموافقة" : "مرحّل"} /> },
        ],
      })}
      {sub === "permits" && dir({
        coll: "empPermits", title: "أذونات الموظفين", icon: "clock", prefix: "EP", importKey: "empPermits",
        desc: "الأذونات القصيرة خلال الدوام",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "emp", label: "الموظف", type: "select", req: true, opts: app.hr.employees.map((e) => ({ v: e.id, l: e.name })) },
          { k: "type", label: "نوع الإذن", type: "select", req: true, opts: app.db.permitTypes.map((t: any) => ({ v: t.name, l: t.name })) },
          { k: "date", label: "التاريخ", type: "date", req: true },
          { k: "hours", label: "الساعات", type: "number", req: true },
          { k: "reason", label: "السبب" },
          { k: "status", label: "الحالة", type: "select", req: true, opts: [{ v: "معتمد", l: "معتمد" }, { v: "بانتظار الاعتماد", l: "بانتظار الاعتماد" }] },
        ],
        cols: [
          { k: "emp", label: "الموظف", render: (r) => <b>{empName(app, r.emp)}</b> },
          { k: "type", label: "الإذن", render: (r) => <Chip s={String(r.type)} /> },
          { k: "date", label: "التاريخ", num: true },
          { k: "hours", label: "الساعات", num: true },
          { k: "status", label: "الحالة", render: (r) => <Chip s={r.status === "معتمد" ? "مرحّل" : "بانتظار الموافقة"} /> },
        ],
      })}
      {sub === "warnings" && dir({
        coll: "empWarnings", title: "إنذارات الموظفين", icon: "alert", prefix: "EW", importKey: "empWarnings",
        desc: "الإنذارات المسجلة على الموظفين",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "emp", label: "الموظف", type: "select", req: true, opts: app.hr.employees.map((e) => ({ v: e.id, l: e.name })) },
          { k: "level", label: "المستوى", type: "select", req: true, opts: app.db.warningLevels.map((w: any) => ({ v: w.name, l: w.name })) },
          { k: "date", label: "التاريخ", type: "date", req: true },
          { k: "reason", label: "السبب", req: true },
          { k: "by", label: "صادر من" },
        ],
        cols: [
          { k: "emp", label: "الموظف", render: (r) => <b>{empName(app, r.emp)}</b> },
          { k: "level", label: "المستوى", render: (r) => <Chip s={String(r.level)} /> },
          { k: "date", label: "التاريخ", num: true },
          { k: "reason", label: "السبب" },
          { k: "by", label: "صادر من" },
        ],
      })}
      {sub === "leaves" && dir({
        coll: "empLeaves", title: "إجازات الموظفين", icon: "cal", prefix: "EL", importKey: "empLeaves",
        desc: "طلبات الإجازات واعتمادها",
        fields: [
          { k: "code", label: "الكود", req: true, uniq: true },
          { k: "emp", label: "الموظف", type: "select", req: true, opts: app.hr.employees.map((e) => ({ v: e.id, l: e.name })) },
          { k: "type", label: "نوع الإجازة", type: "select", req: true, opts: app.db.leaveTypes.map((t: any) => ({ v: t.name, l: t.name })) },
          { k: "from", label: "من", type: "date", req: true },
          { k: "to", label: "إلى", type: "date", req: true },
          { k: "days", label: "الأيام", type: "number", req: true },
          { k: "status", label: "الحالة", type: "select", req: true, opts: [{ v: "معتمدة", l: "معتمدة" }, { v: "بانتظار الاعتماد", l: "بانتظار الاعتماد" }, { v: "مرفوضة", l: "مرفوضة" }] },
        ],
        cols: [
          { k: "emp", label: "الموظف", render: (r) => <b>{empName(app, r.emp)}</b> },
          { k: "type", label: "النوع", render: (r) => <Chip s={String(r.type)} /> },
          { k: "from", label: "من", num: true },
          { k: "to", label: "إلى", num: true },
          { k: "days", label: "الأيام", num: true },
          { k: "status", label: "الحالة", render: (r) => <Chip s={r.status === "معتمدة" ? "مرحّل" : r.status === "مرفوضة" ? "ملغي" : "بانتظار الموافقة"} /> },
        ],
      })}
    </div>
  );
}

/* ═══════════ 6) احتساب الرواتب — بالقيد المحاسبي اللحظي ═══════════ */
function PayrollScreen() {
  const app = useApp();
  const [period, setPeriod] = useState("2026-09");
  const [payMethod, setPayMethod] = useState("نقدي");
  const [rows, setRows] = useState<Record<string, { allow: number; over: number; deduct: number }>>({});

  const activeEmps = app.hr.employees.filter((e) => e.status !== "منتهٍ");
  const r = (id: string) => rows[id] || { allow: 0, over: 0, deduct: 0 };
  const setR = (id: string, patch: Partial<{ allow: number; over: number; deduct: number }>) =>
    setRows((old) => ({ ...old, [id]: { ...r(id), ...patch } }));

  /* خصم السلف القائمة شهرياً */
  const advDeduct = (id: string) => {
    const adv = (app.db.advances as any[]).find((a) => a.emp === id && a.status === "قائمة");
    if (!adv) return 0;
    return adv.months > 0 ? Math.min(adv.remaining ?? 0, Math.round((adv.amount / adv.months))) : adv.remaining ?? 0;
  };

  const calc = activeEmps.map((e) => {
    const rr = r(e.id);
    const basic = e.salary || 0;
    const gross = basic + rr.allow + rr.over;
    const adv = advDeduct(e.id);
    const net = gross - rr.deduct - adv;
    return { id: e.id, name: e.name, basic, allow: rr.allow, over: rr.over, gross, deduct: rr.deduct, adv, net };
  });
  const sum = (f: (c: typeof calc[0]) => number) => calc.reduce((a, c) => a + f(c), 0);
  const totGross = sum((c) => c.gross);
  const totNet = sum((c) => c.net);
  const totDeduct = sum((c) => c.deduct + c.adv);

  /* القيد المحاسبي — يتحدث لحظياً مع كل تغيير */
  const payAcc = payMethod === "نقدي" ? "11111" : "11121";
  const jeLines = [
    { account: "31111", name: app.accounts.find((a) => a.code === "31111")?.name, debit: totGross, credit: 0 },
    { account: payAcc, name: app.accounts.find((a) => a.code === payAcc)?.name, debit: 0, credit: totNet },
    { account: "21311", name: app.accounts.find((a) => a.code === "21311")?.name, debit: 0, credit: totDeduct },
  ];
  const balanced = Math.abs(totGross - (totNet + totDeduct)) < 1 && totGross > 0;

  const buildJournal = () => ({
    id: app.nextNo(app.settings.prefixes.JE), no: app.nextNo(app.settings.prefixes.JE), date: `${period}-28`,
    desc: `رواتب شهر ${period} — ${calc.length} موظفاً (${payMethod})`,
    kind: "يومية" as const, source: "احتساب الرواتب",
    lines: jeLines.map((l) => ({ account: l.account, debit: l.debit, credit: l.credit, currency: "YER", rate: 1 })),
    user: app.session?.user || "—", status: "مرحّل" as const,
  });

  const post = () => {
    if (!balanced) { app.toast("القيد غير متوازن — راجع القيم", "err"); return; }
    const je = buildJournal();
    const res = app.addJournal(je);
    if (!res.ok) { app.toast(res.msg, "err"); return; }
    /* حفظ كشف الرواتب مرحّلاً */
    const payroll = { id: `PR-${period}`, code: `PR-${period}`, period, empCount: calc.length, gross: totGross, net: totNet, deduct: totDeduct, journalNo: je.no, status: "مرحّل", date: `${period}-28` };
    app.save("payrolls", payroll);
    app.toast(`رُحّلت رواتب ${period} بقيد متوازن (${app.fmtN(totGross)} ر.ي) — الكشف ${payroll.code}`, "ok");
  };

  const payrollView = (p: any): DocViewData => ({
    icon: "receipt", docTitle: `كشف رواتب ${p.period}`, no: p.code, date: p.date, status: p.status,
    meta: [["الفترة", p.period], ["عدد الموظفين", p.empCount], ["القيد المحاسبي", p.journalNo], ["طريقة الصرف", "—"]],
    totals: [["إجمالي الرواتب (مدين 31111)", app.fmtN(p.gross) + " ر.ي"], ["الصافي المدفوع (دائن)", app.fmtN(p.net) + " ر.ي"], ["الاستقطاعات (دائن 21311)", app.fmtN(p.deduct) + " ر.ي"]],
    grand: ["إجمالي الكشف", app.fmtN(p.gross) + " ر.ي"],
  });

  const [view, setView] = useState<any>(null);

  return (
    <div>
      <div className="card p-4 mb-4 flex flex-wrap items-end gap-3">
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">فترة الرواتب</span>
          <input type="month" className="input mt-1 font-num !w-44" value={period} onChange={(e) => setPeriod(e.target.value)} /></label>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">طريقة الصرف</span>
          <div className="flex rounded-lg border border-line overflow-hidden mt-1">
            {(["نقدي", "تحويل بنكي"] as const).map((m) => (
              <button key={m} onClick={() => setPayMethod(m)} className={`px-4 py-2 text-[0.78rem] font-bold transition-all ${payMethod === m ? "text-[var(--brandink)]" : "bg-surface text-mute"}`}
                style={payMethod === m ? { background: "linear-gradient(135deg, var(--brand), var(--brand2))" } : undefined}>{m}</button>
            ))}
          </div>
        </label>
        <div className="ms-auto flex gap-2">
          <button className="btn btn-brand" onClick={post} disabled={!balanced}><I n="check" size={16} /> ترحيل رواتب {period}</button>
        </div>
      </div>

      {/* جدول الرواتب القابل للتحرير */}
      <div className="card overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="tbl min-w-[980px]">
            <thead><tr><th>الموظف</th><th>الأساسي</th><th>البدلات</th><th>الإضافي</th><th>الإجمالي</th><th>جزاءات</th><th>خصم سلفة</th><th>الصافي</th></tr></thead>
            <tbody>
              {calc.map((c) => (
                <tr key={c.id}>
                  <td className="font-bold">{c.name}</td>
                  <td className="font-num">{app.fmtN(c.basic)}</td>
                  <td><input type="number" className="input !py-1 !w-24 font-num" value={r(c.id).allow || ""} placeholder="0" onChange={(e) => setR(c.id, { allow: +e.target.value || 0 })} /></td>
                  <td><input type="number" className="input !py-1 !w-24 font-num" value={r(c.id).over || ""} placeholder="0" onChange={(e) => setR(c.id, { over: +e.target.value || 0 })} /></td>
                  <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(c.gross)}</td>
                  <td><input type="number" className="input !py-1 !w-24 font-num" value={r(c.id).deduct || ""} placeholder="0" onChange={(e) => setR(c.id, { deduct: +e.target.value || 0 })} /></td>
                  <td className="font-num text-[var(--bad)]">{c.adv ? app.fmtN(c.adv) : "—"}</td>
                  <td className="font-num font-bold text-[var(--good)]">{app.fmtN(c.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="!bg-[color-mix(in_srgb,var(--brand)_7%,transparent)]">
                <td className="font-display font-bold">الإجمالي ({calc.length} موظفاً)</td>
                <td className="font-num font-bold">{app.fmtN(sum((c) => c.basic))}</td>
                <td className="font-num font-bold">{app.fmtN(sum((c) => c.allow))}</td>
                <td className="font-num font-bold">{app.fmtN(sum((c) => c.over))}</td>
                <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(totGross)}</td>
                <td className="font-num font-bold">{app.fmtN(sum((c) => c.deduct))}</td>
                <td className="font-num font-bold text-[var(--bad)]">{app.fmtN(sum((c) => c.adv))}</td>
                <td className="font-num font-bold text-[var(--good)]">{app.fmtN(totNet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* القيد المحاسبي — يتحدث لحظياً */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--good)_30%,transparent)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[color-mix(in_srgb,var(--good)_8%,transparent)] border-b border-[color-mix(in_srgb,var(--good)_25%,transparent)]">
            <I n="book" size={15} className="text-[var(--good)]" />
            <h4 className="font-display font-bold text-[0.95rem]">القيد المحاسبي — يتحدث لحظياً</h4>
            <span className="ms-auto chip" style={{ background: balanced ? "color-mix(in srgb, var(--good) 14%, transparent)" : "color-mix(in srgb, var(--bad) 14%, transparent)", color: balanced ? "var(--good)" : "var(--bad)" }}>
              {balanced ? "متوازن ✓" : "غير متوازن"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>الحساب</th><th>الاسم</th><th>مدين</th><th>دائن</th></tr></thead>
              <tbody>
                {jeLines.map((l, i) => (
                  <tr key={i}>
                    <td className="font-num font-bold" dir="ltr">{l.account}</td>
                    <td className="font-bold">{l.name}</td>
                    <td className="font-num font-bold text-[var(--bad)]">{l.debit ? app.fmtN(l.debit) : "—"}</td>
                    <td className="font-num font-bold text-[var(--good)]">{l.credit ? app.fmtN(l.credit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 text-[0.7rem] font-bold text-mute bg-panel/60 border-t border-line">
            من حـ/ {app.accounts.find((a) => a.code === "31111")?.name} ← إلى حـ/ {app.accounts.find((a) => a.code === payAcc)?.name} و حـ/ مستحقات الرواتب
          </div>
        </div>

        {/* كشوف الرواتب المرحّلة */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-panel border-b border-line">
            <I n="receipt" size={15} className="text-[var(--brand)]" />
            <h4 className="font-display font-bold text-[0.95rem]">كشوف الرواتب المرحّلة</h4>
          </div>
          {(app.db.payrolls as any[]).length === 0 ? <Empty msg="لا توجد كشوف مرحّلة — رحّل رواتب الشهر" /> : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>الكشف</th><th>الفترة</th><th>الإجمالي</th><th>الحالة</th><th></th></tr></thead>
                <tbody>
                  {(app.db.payrolls as any[]).slice().reverse().map((p) => (
                    <tr key={p.id}>
                      <td className="font-num font-bold" dir="ltr">{p.code}</td>
                      <td className="font-num">{p.period}</td>
                      <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(p.gross)}</td>
                      <td><Chip s={p.status} /></td>
                      <td><button className="act-ico" style={{ ["--tone" as any]: "var(--brand)" }} title="عرض الكشف" aria-label="عرض" onClick={() => setView(p)}><I n="eye" size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ReadOnlyDoc open={!!view} onClose={() => setView(null)} d={view ? payrollView(view) : null} fmtN={app.fmtN} />
    </div>
  );
}

/* ═══════════ 7) تقرير بيانات الموظفين ═══════════ */
function EmpReport() {
  const app = useApp();
  const emps = app.hr.employees;
  const byDept = useMemo(() => {
    const m: Record<string, number> = {};
    emps.forEach((e) => { m[e.dept] = (m[e.dept] || 0) + 1; });
    return Object.entries(m).map(([k, v]) => ({ label: k, value: v }));
  }, [emps]);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-soft" onClick={() => { setReportCfg(app.settings.report); openPrint(
          <ReportSheet title="تقرير بيانات الموظفين" subtitle="الملفات الوظيفية الكاملة" user={app.session?.user || "—"}
            filters={[["إجمالي الموظفين", String(emps.length)], ["النشطون", String(emps.filter((e) => e.status === "نشط").length)]]}
            summary={[["إجمالي الرواتب الشهرية", app.fmtN(emps.reduce((a, e) => a + (e.salary || 0), 0)) + " ر.ي"]]}>
            <PTable head={["الرقم", "الموظف", "الوظيفة", "الإدارة", "الراتب", "التعيين", "الحالة"]}
              rows={emps.map((e) => [e.code, e.name, e.job, e.dept, app.fmtN(e.salary), e.join, e.status])} />
          </ReportSheet>); }}>
          <I n="print" size={15} /> طباعة / PDF
        </button>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-bold text-base mb-3">توزيع الموظفين على الإدارات</h3>
          <BarChart data={byDept} height={200} unit=" موظف" />
        </div>
        <div className="card p-5 space-y-3">
          {[
            ["إجمالي الموظفين", emps.length, "users", "var(--brand)"],
            ["النشطون", emps.filter((e) => e.status === "نشط").length, "check", "var(--good)"],
            ["في إجازة", emps.filter((e) => e.status === "إجازة").length, "cal", "var(--warn)"],
            ["إجمالي الرواتب الشهرية", app.fmtN(emps.reduce((a, e) => a + (e.salary || 0), 0)), "wallet", "var(--accent)"],
          ].map(([l, v, ic, c]) => (
            <div key={l as string} className="card p-3.5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c as string }}><I n={ic as string} size={17} /></span>
              <div><div className="text-[0.64rem] font-bold text-mute">{l}</div><div className="font-num font-bold text-[0.95rem] mt-0.5">{v}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ 8) تقرير رواتب الموظفين ═══════════ */
function PayrollReport() {
  const app = useApp();
  const payrolls = app.db.payrolls as any[];
  const byPeriod = payrolls.map((p) => ({ label: p.period, value: Math.round(p.gross) }));
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-soft" onClick={() => { setReportCfg(app.settings.report); openPrint(
          <ReportSheet title="تقرير رواتب الموظفين" subtitle="الكشوف المرحّلة بقيد محاسبي" user={app.session?.user || "—"}
            filters={[["عدد الكشوف", String(payrolls.length)]]}
            summary={[["إجمالي المصروف", app.fmtN(payrolls.reduce((a, p) => a + p.gross)) + " ر.ي"], ["إجمالي الصافي المدفوع", app.fmtN(payrolls.reduce((a, p) => a + p.net)) + " ر.ي"]]}>
            <PTable head={["الكشف", "الفترة", "الموظفون", "الإجمالي", "الصافي", "الاستقطاعات", "القيد"]}
              rows={payrolls.map((p) => [p.code, p.period, p.empCount, app.fmtN(p.gross), app.fmtN(p.net), app.fmtN(p.deduct), p.journalNo])} />
          </ReportSheet>); }}>
          <I n="print" size={15} /> طباعة / PDF
        </button>
      </div>
      {payrolls.length === 0 ? <div className="card p-10"><Empty msg="لا توجد كشوف رواتب مرحّلة — رحّل الرواتب من شاشة احتساب الرواتب" /></div> : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-display font-bold text-base mb-3">الرواتب الشهرية</h3>
            <BarChart data={byPeriod} height={200} unit=" ر.ي" />
          </div>
          <div className="card p-5 space-y-3">
            {[
              ["عدد الكشوف", payrolls.length, "receipt", "var(--brand)"],
              ["إجمالي المصروف", app.fmtN(payrolls.reduce((a, p) => a + p.gross)), "wallet", "var(--accent)"],
              ["الصافي المدفوع", app.fmtN(payrolls.reduce((a, p) => a + p.net)), "coins", "var(--good)"],
              ["الاستقطاعات", app.fmtN(payrolls.reduce((a, p) => a + p.deduct)), "x", "var(--bad)"],
            ].map(([l, v, ic, c]) => (
              <div key={l as string} className="card p-3.5 flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c as string }}><I n={ic as string} size={17} /></span>
                <div><div className="text-[0.64rem] font-bold text-mute">{l}</div><div className="font-num font-bold text-[0.95rem] mt-0.5">{v}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ 9) تقرير حركة الدوام ═══════════ */
function AttReport() {
  const app = useApp();
  const logs = app.db.attendanceLogs as any[];
  const byStatus = useMemo(() => {
    const m: Record<string, number> = {};
    logs.forEach((l) => { m[l.status] = (m[l.status] || 0) + 1; });
    return Object.entries(m).map(([k, v]) => ({ label: k, value: v }));
  }, [logs]);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn btn-soft" onClick={() => { setReportCfg(app.settings.report); openPrint(
          <ReportSheet title="تقرير حركة الدوام" subtitle="الحضور والانصراف والتأخيرات" user={app.session?.user || "—"}
            filters={[["إجمالي الحركات", String(logs.length)], ["التأخيرات", String((app.db.lateLogs as any[]).length)]]}
            summary={[["إجمالي ساعات العمل", app.fmtN(logs.reduce((a, l) => a + (l.hours || 0))) + " ساعة"]]}>
            <PTable head={["التاريخ", "الموظف", "الدخول", "الخروج", "الساعات", "الحالة"]}
              rows={logs.map((l) => [l.date, empName(app, l.emp), l.checkIn, l.checkOut, l.hours, l.status])} />
          </ReportSheet>); }}>
          <I n="print" size={15} /> طباعة / PDF
        </button>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-bold text-base mb-3">توزيع حالات الدوام</h3>
          <BarChart data={byStatus} height={200} unit=" حركة" />
        </div>
        <div className="card p-5 space-y-3">
          {[
            ["حركات الدوام", logs.length, "clock", "var(--brand)"],
            ["حاضرون", logs.filter((l) => l.status === "حاضر").length, "check", "var(--good)"],
            ["متأخرون", logs.filter((l) => l.status === "متأخر").length, "alert", "var(--warn)"],
            ["غائبون", logs.filter((l) => l.status === "غائب").length, "x", "var(--bad)"],
            ["بصمات مسجلة", (app.db.fingerLogs as any[]).length, "pulse", "var(--accent)"],
          ].map(([l, v, ic, c]) => (
            <div key={l as string} className="card p-3.5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c as string }}><I n={ic as string} size={17} /></span>
              <div><div className="text-[0.64rem] font-bold text-mute">{l}</div><div className="font-num font-bold text-[0.95rem] mt-0.5">{v}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
