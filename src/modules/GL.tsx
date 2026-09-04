import { useMemo, useState } from "react";
import { useApp, type AnyR } from "../store";
import { I, Modal, Chip, Empty, Reveal, FormSection } from "../ui";
import { Directory, type DirConf } from "../crud";
import { openPrint, DocSheet, PTable, ReportSheet, tafqit } from "../print";
import type { Journal, JournalLine, Account } from "../data";

export default function GL() {
  const app = useApp();
  const p = app.route.path || "base.periods";
  if (p === "base.periods") return <PeriodsScreen close={false} />;
  if (p === "base.close") return <PeriodsScreen close />;
  if (p === "base.mid") return <SuspenseScreen />;
  if (p === "base.cash") return <Directory conf={cashConf(app)} />;
  if (p === "base.cur") return <CurrenciesScreen />;
  if (p === "base.cc") return <Directory conf={ccConf(app)} />;
  if (p === "base.banks") return <Directory conf={banksConf(app)} />;
  if (p === "base.pay") return <Directory conf={payConf(app)} />;
  if (p === "base.coa") return <CoaScreen />;
  if (p === "base.ana") return <AnalyticalScreen />;
  if (p.startsWith("mv.")) return <JEScreen kind={p.slice(3)} />;
  if (p.startsWith("rep.")) return <GLReport kind={p.slice(4)} />;
  return <PeriodsScreen close={false} />;
}

/* ═══════════ تكوينات ═══════════ */
const cashConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "cashboxes", title: "بيانات الصناديق", icon: "wallet", prefix: "CB", importKey: "cashboxes",
  desc: "الصناديق النقدية بالعملات المختلفة وربط كل صندوق بحسابه في دليل الحسابات",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "اسم الصندوق", req: true, uniq: true },
    { k: "currency", label: "العملة", type: "select", req: true, opts: app.db.currencies.map((c: any) => ({ v: c.id, l: `${c.id} — ${c.name}` })) },
    { k: "open", label: "الرصيد الافتتاحي", type: "number", req: true },
    { k: "keeper", label: "أمين الصندوق", req: true },
    { k: "account", label: "الحساب المرتبط", type: "select", req: true, opts: app.accounts.filter((a) => a.posting && a.code.startsWith("1111")).map((a) => ({ v: a.code, l: `${a.code} — ${a.name}` })) },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "الصندوق", render: (r) => <b>{r.name}</b> },
    { k: "currency", label: "العملة", render: (r) => <span className="chip bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)] font-num">{r.currency}</span> },
    { k: "open", label: "الرصيد الافتتاحي", num: true, render: (r, a) => <b className="font-num">{a.fmtN(r.open)}</b> },
    { k: "keeper", label: "الأمين" },
    { k: "account", label: "الحساب", num: true, render: (r) => <span className="font-num" dir="ltr">{r.account}</span> },
  ],
});

const ccConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "costCenters", title: "دليل مراكز التكلفة", icon: "bld", prefix: "CC", importKey: "costCenters",
  desc: "مراكز تكلفة رئيسية وفرعية لتحليل المصروفات والإيرادات بدقة",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "اسم المركز", req: true, uniq: true },
    { k: "parent", label: "مركز أب (اتركه فارغاً لمركز رئيسي)", type: "select", opts: app.db.costCenters.filter((c) => !c.parent).map((c) => ({ v: c.id, l: c.name })) },
    { k: "manager", label: "المسؤول", req: true },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "المركز", render: (r, a) => <span className={r.parent ? "ps-5 font-bold" : "font-display font-bold"}>{r.parent && "└ "}{r.name}{!r.parent && <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] ms-2">رئيسي</span>}</span> },
    { k: "manager", label: "المسؤول" },
    { k: "kids", label: "مراكز فرعية", num: true, render: (r, a) => <span className="font-num">{a.db.costCenters.filter((c) => c.parent === r.id).length}</span> },
  ],
});

const banksConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "banks", title: "البنوك والحسابات البنكية", icon: "bld", prefix: "BK", importKey: "banks",
  desc: "الحسابات البنكية للشركة بعملة كل حساب وربطها بدليل الحسابات (النقدية والبنوك)",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "اسم البنك", req: true, uniq: true },
    { k: "branch", label: "الفرع", req: true },
    { k: "iban", label: "رقم الآيبان (IBAN)", req: true },
    { k: "swift", label: "رمز السويفت (SWIFT)" },
    { k: "currency", label: "العملة", type: "select", req: true, opts: app.db.currencies.map((c: any) => ({ v: c.id, l: `${c.id} — ${c.name}` })) },
    { k: "account", label: "حساب الربط في الدليل", type: "select", req: true, opts: app.accounts.filter((a) => a.posting && a.code.startsWith("1112")).map((a) => ({ v: a.code, l: `${a.code} — ${a.name}` })) },
    { k: "balance", label: "الرصيد الافتتاحي", type: "number", req: true },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "البنك", render: (r) => <div><b>{r.name}</b><div className="text-[0.62rem] text-mute font-bold">{r.branch}</div></div> },
    { k: "iban", label: "الآيبان", render: (r) => <span className="font-num text-[0.7rem]" dir="ltr">{r.iban}</span> },
    { k: "currency", label: "العملة", render: (r) => <span className="chip bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)] font-num">{r.currency}</span> },
    { k: "account", label: "الربط", num: true, render: (r) => <span className="font-num" dir="ltr">{r.account}</span> },
    { k: "balance", label: "الرصيد", num: true, render: (r, a) => <b className="font-num">{a.fmtN(r.balance)}</b> },
  ],
});

const payConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "payTerms", title: "شروط وطرق الدفع", icon: "wallet", prefix: "PT", importKey: "payTerms",
  desc: "شروط الدفع الآجل (عدد الأيام) وطرق الدفع المتاحة للفواتير والسندات",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "الاسم", req: true, uniq: true },
    { k: "kind", label: "النوع", type: "select", req: true, opts: [{ v: "شرط دفع", l: "شرط دفع (آجل)" }, { v: "طريقة دفع", l: "طريقة دفع" }] },
    { k: "days", label: "عدد أيام الاستحقاق", type: "number", hint: "0 للدفع الفوري وطرق الدفع" },
    { k: "note", label: "ملاحظة", span: true },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "الاسم", render: (r) => <b>{r.name}</b> },
    { k: "kind", label: "النوع", render: (r) => <span className={`chip ${r.kind === "شرط دفع" ? "bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)]" : "bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)]"}`}>{r.kind}</span> },
    { k: "days", label: "الأيام", num: true, render: (r, a) => <span className="font-num font-bold">{r.days} يوم</span> },
    { k: "note", label: "ملاحظة", render: (r) => <span className="text-[0.74rem] text-mute font-bold">{r.note}</span> },
  ],
});

/* ═══════════ الفترات المالية والإقفال ═══════════ */
function PeriodsScreen({ close }: { close: boolean }) {
  const app = useApp();
  const [confirm, setConfirm] = useState<AnyR | null>(null);
  const periods = app.db.periods;
  const addNext = () => {
    const last = periods[periods.length - 1];
    const [y, m] = last.id.split("-").map(Number);
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    const id = `${ny}-${String(nm).padStart(2, "0")}`;
    if (periods.some((p: any) => p.id === id)) { app.toast("الفترة موجودة مسبقاً", "err"); return; }
    const names = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    app.save("periods", { id, code: id, label: `${names[nm - 1]} ${ny}`, locked: false, closedAt: "" });
    app.toast(`فُتحت فترة جديدة: ${names[nm - 1]} ${ny}`);
  };
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n={close ? "lock" : "cal"} size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">{close ? "إقفال الفترات المالية" : "الفترات المالية"}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">{close ? "الإقفال يحمي القيود المرحّلة من أي تعديل أو ترحيل لاحق (مبدأ الاستمرارية)" : "إدارة فترات السنة المالية وفتح فترات جديدة"}</p>
          </div>
        </div>
        {!close && <button className="btn btn-brand" onClick={addNext}><I n="plus" size={16} /> فتح الفترة التالية</button>}
      </div>
      <div className="card overflow-hidden">
        <table className="tbl">
          <thead><tr><th>الفترة</th><th>المعرف</th><th>الحالة</th><th>تاريخ الإقفال</th><th>القيود المرحّلة</th><th>{close ? "قرار الإقفال" : "حماية الكتابة"}</th></tr></thead>
          <tbody>
            {periods.map((p: any) => {
              const cnt = (app.db.journals as any as Journal[]).filter((j) => j.date.startsWith(p.id) && j.status !== "ملغي").length;
              return (
                <tr key={p.id}>
                  <td className="font-bold">{p.label}</td>
                  <td className="font-num" dir="ltr">{p.id}</td>
                  <td><Chip s={p.locked ? "مقفلة" : "مفتوحة"} /></td>
                  <td className="font-num">{p.closedAt ? app.fmtDate(p.closedAt) : "—"}</td>
                  <td className="font-num text-center">{cnt}</td>
                  <td>
                    {p.locked
                      ? <span className="flex items-center gap-1.5 text-[0.74rem] font-bold text-mute"><I n="lock" size={14} className="text-[var(--bad)]" /> محصّنة ضد الكتابة</span>
                      : close
                        ? <button className="btn btn-danger !py-1.5 !text-[0.74rem]" onClick={() => setConfirm(p)}><I n="lock" size={14} /> إقفال نهائي</button>
                        : <span className="text-[0.72rem] font-bold text-[var(--good)] flex items-center gap-1"><I n="unlock" size={14} /> تقبل الترحيل</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`إقفال فترة ${confirm?.label || ""}`} icon="lock">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[color-mix(in_srgb,var(--bad)_7%,transparent)] border border-[color-mix(in_srgb,var(--bad)_25%,transparent)]">
          <I n="alert" size={20} className="text-[var(--bad)] shrink-0 mt-0.5" />
          <p className="text-[0.84rem] font-bold leading-6">
            بعد الإقفال: <b>لا يمكن ترحيل أي سند أو قيد</b> إلى هذه الفترة، ولا تعديل قيودها، ولا إعادة فتحها إلا بإذن مدير النظام.
            <span className="block text-[0.72rem] text-mute font-medium mt-1.5">تأكد من اكتمال قيود التسوية وإقفال حسابات النتيجة قبل المتابعة.</span>
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setConfirm(null)}>تراجع</button>
          <button className="btn btn-danger" onClick={() => { if (confirm) app.lockPeriod(confirm.id); setConfirm(null); }}><I n="lock" size={15} /> تأكيد الإقفال</button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════ الحسابات الوسطية ═══════════ */
const MID_LABELS: Record<string, string> = {
  salesCash: "حساب المبيعات النقدية", salesCredit: "حساب المبيعات الآجلة", purchases: "حساب المشتريات / المخزون",
  vatOut: "ضريبة المخرجات", vatIn: "ضريبة المدخلات", customers: "حساب العملاء (الذمم المدينة)",
  suppliers: "حساب الموردين (الذمم الدائنة)", cogs: "حساب تكلفة المبيعات", cash: "الصندوق الافتراضي", bank: "البنك الافتراضي",
};
function SuspenseScreen() {
  const app = useApp();
  const [draft, setDraft] = useState({ ...app.settings.suspense });
  const posting = app.accounts.filter((a) => a.posting);
  const accName = (c: string) => app.accounts.find((a) => a.code === c)?.name || c;
  return (
    <div className="anim-fadein max-w-4xl">
      <div className="flex items-center gap-3.5 mb-4">
        <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="swap" size={23} /></span>
        <div>
          <h1 className="font-display font-bold text-2xl leading-tight">الحسابات الوسطية</h1>
          <p className="text-mute text-[0.82rem] font-medium mt-0.5">خريطة التكامل المحاسبي: الحسابات التي تستخدمها الفواتير والسندات عند توليد قيودها تلقائياً</p>
        </div>
      </div>
      <Reveal><div className="card p-5">
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
          {Object.entries(MID_LABELS).map(([key, label]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.78rem] font-bold text-soft">{label}</span>
                <span className="chip bg-[color-mix(in_srgb,var(--mute)_12%,transparent)] text-[var(--soft)] font-num" dir="ltr">{draft[key]}</span>
              </div>
              <div className="flex gap-2">
                <select className="select flex-1" value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}>
                  {posting.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                </select>
              </div>
              <div className="text-[0.64rem] font-bold text-mute mt-1">الحالي: {accName(draft[key])}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-line">
          <p className="text-[0.74rem] font-bold text-mute flex items-center gap-2"><I n="info" size={15} className="text-[var(--brand)]" /> أي تغيير يؤثر فوراً على قيود الفواتير وسندات القبض والصرف الجديدة</p>
          <button className="btn btn-brand" onClick={() => { app.setSettings({ ...app.settings, suspense: draft }); app.toast("حُفظت خريطة الحسابات الوسطية — ستُطبّق على القيود التلقائية الجديدة", "ok"); }}>
            <I n="save" size={15} /> حفظ الخريطة
          </button>
        </div>
      </div></Reveal>
    </div>
  );
}

/* ═══════════ العملات ═══════════ */
function CurrenciesScreen() {
  const app = useApp();
  const [edit, setEdit] = useState<AnyR | null>(null);
  const [rate, setRate] = useState("");
  return (
    <div className="anim-fadein">
      <div className="flex items-center gap-3.5 mb-4">
        <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="coins" size={23} /></span>
        <div>
          <h1 className="font-display font-bold text-2xl leading-tight">إدارة العملات</h1>
          <p className="text-mute text-[0.82rem] font-medium mt-0.5">العملات المعتمدة وأسعار صرفها مقابل عملة الأساس (الريال اليمني)</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="tbl">
          <thead><tr><th>الرمز</th><th>العملة</th><th>سعر الصرف</th><th>آخر تحديث</th><th>النوع</th><th>إجراء</th></tr></thead>
          <tbody>
            {(app.db.currencies as any[]).map((c) => (
              <tr key={c.id}>
                <td><span className="w-10 h-10 rounded-xl grid place-items-center font-num font-bold bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)]" dir="ltr">{c.id}</span></td>
                <td className="font-bold">{c.name}</td>
                <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(c.rate)} <span className="text-[0.66rem] text-mute">ر.ي</span></td>
                <td className="font-num text-mute">{c.base ? "—" : app.fmtDate("2026-03-29")}</td>
                <td>{c.base ? <span className="chip bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]">عملة الأساس</span> : <span className="chip bg-[color-mix(in_srgb,var(--mute)_14%,transparent)] text-[var(--soft)]">أجنبية</span>}</td>
                <td>{!c.base && <button className="btn btn-soft !py-1.5 !text-[0.72rem]" onClick={() => { setEdit(c); setRate(String(c.rate)); }}><I n="edit" size={13} /> تحديث السعر</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={`تحديث سعر صرف ${edit?.id || ""}`} icon="coins">
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">1 {edit?.id} = كم ريال يمني؟</span>
          <input type="number" className="input mt-1 font-num" value={rate} onChange={(e) => setRate(e.target.value)} /></label>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setEdit(null)}>إلغاء</button>
          <button className="btn btn-brand" onClick={() => {
            const v = +rate;
            if (!v || v <= 0) { app.toast("أدخل سعراً صالحاً", "err"); return; }
            app.save("currencies", { ...edit!, rate: v });
            app.toast(`حُدّث سعر ${edit!.id} إلى ${app.fmtN(v)} ر.ي — سُجّل في سجل أسعار الصرف`); setEdit(null);
          }}><I n="save" size={15} /> حفظ السعر</button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════ دليل الحسابات ═══════════ */
function CoaScreen() {
  const app = useApp();
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const balances = useMemo(() => {
    const map: Record<string, { dr: number; cr: number }> = {};
    (app.db.journals as any as Journal[]).filter((j) => j.status !== "ملغي").forEach((j) =>
      j.lines.forEach((l) => { map[l.account] = map[l.account] || { dr: 0, cr: 0 }; map[l.account].dr += l.debit * l.rate; map[l.account].cr += l.credit * l.rate; })
    );
    return map;
  }, [app.db.journals]);
  const bal = (code: string) => { const b = balances[code]; return b ? b.dr - b.cr : 0; };
  const totalDr = Object.values(balances).reduce((a, b) => a + b.dr, 0);
  const totalCr = Object.values(balances).reduce((a, b) => a + b.cr, 0);
  const [open, setOpen] = useState<Record<string, boolean>>({ "1": true, "2": true, "3": true, "4": true, "11": true, "21": true, "22": true, "31": true, "41": true });

  const render = (acc: Account, depth: number): React.ReactNode => {
    const kids = app.accounts.filter((a) => a.parent === acc.code);
    if (q && !acc.name.includes(q) && !acc.code.includes(q) && kids.length === 0) return null;
    const b = bal(acc.code);
    const tone = acc.type === "أصول" ? "var(--brand)" : acc.type === "إيرادات" ? "var(--good)" : acc.type === "مصروفات" ? "var(--warn)" : "var(--bad)";
    return (
      <FragmentRow key={acc.code}>
        <tr className={acc.level === 5 ? "" : "bg-panel/60"}>
          <td className="font-num" dir="ltr" style={{ paddingInlineStart: `${0.8 + depth * 1.1}rem` }}>
            <span className="inline-flex items-center gap-1.5">
              {kids.length > 0 && <button onClick={() => setOpen({ ...open, [acc.code]: !open[acc.code] })} className="text-mute hover:text-[var(--brand)] transition-transform" style={{ transform: open[acc.code] ? "rotate(90deg)" : "none" }} aria-label="توسيع"><I n="chevS" size={13} /></button>}
              {acc.code}
            </span>
          </td>
          <td className={`font-bold ${acc.level === 5 ? "" : "font-display"}`}>{acc.name} <span className="text-[0.62rem] text-mute font-num" dir="ltr">{acc.en}</span></td>
          <td><span className="w-6 h-6 rounded-md grid place-items-center text-[0.66rem] font-num font-bold" style={{ background: `color-mix(in srgb, ${tone} 12%, transparent)`, color: tone }}>{acc.level}</span></td>
          <td><span className="chip" style={{ background: `color-mix(in srgb, ${tone} 10%, transparent)`, color: tone }}>{acc.type}</span></td>
          <td className="text-[0.74rem] font-bold text-mute">{acc.posting ? "ترحيلي" : "عنواني"}</td>
          <td className="font-num font-bold">{b !== 0 ? app.fmtN(b) : "—"}</td>
          <td>{acc.analytical ? <span className="chip bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]"><I n="users" size={11} /> تحليلي</span> : acc.level === 5 ? <span className="text-[0.7rem] text-mute font-bold">المستوى الخامس</span> : "—"}</td>
        </tr>
        {(open[acc.code] || !!q) && kids.map((k) => render(k, depth + 1))}
      </FragmentRow>
    );
  };

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="layers" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">دليل الحسابات</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">تسلسل هرمي من 5 مستويات — نمط يمين سوفت التجاري: 1-الأصول 2-الخصوم (تشمل حقوق الملكية) 3-المصروفات 4-الإيرادات</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] !py-2"><I n="check" size={13} /> متوازن: {app.fmtN(totalDr)} = {app.fmtN(totalCr)}</span>
          <button className="btn btn-soft" onClick={() => printCoa(app)} title="طباعة دليل الحسابات"><I n="print" size={16} /> طباعة الدليل</button>
          <button className="btn btn-brand" onClick={() => setShowAdd(true)}><I n="plus" size={16} /> إضافة حساب</button>
        </div>
      </div>
      <div className="relative w-80 max-w-full mb-3.5">
        <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
        <input className="input !ps-9" placeholder="بحث باسم الحساب أو كوده…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <AddAccountModal open={showAdd} onClose={() => setShowAdd(false)} />
      <div className="card overflow-hidden"><div className="overflow-x-auto">
        <table className="tbl min-w-[880px]">
          <thead><tr><th>الكود</th><th>اسم الحساب</th><th>المستوى</th><th>التصنيف</th><th>الطبيعة</th><th>الرصيد</th><th>خاصية</th></tr></thead>
          <tbody>{app.accounts.filter((a) => a.level === 1).map((r) => render(r, 0))}</tbody>
        </table>
      </div></div>
    </div>
  );
}
function FragmentRow({ children }: { children: React.ReactNode }) { return <>{children}</>; }

function printCoa(app: ReturnType<typeof useApp>) {
  const user = app.session?.user || "—";
  const today = new Date().toLocaleDateString("en-GB");
  const typeTone = (t: string) => (t === "أصول" ? "var(--brand)" : t === "إيرادات" ? "var(--good)" : t === "مصروفات" ? "var(--warn)" : t === "خصوم" ? "var(--bad)" : "var(--accent)");
  const rows = app.accounts.map((a) => ([
    <span key="c" className="num" dir="ltr">{a.code}</span>,
    <span key="n" style={{ paddingInlineStart: (a.level - 1) * 14, fontWeight: a.level <= 2 ? 700 : 400 }}>{a.name}</span>,
    <span key="l" className="num">{a.level}</span>,
    <span key="t" style={{ color: typeTone(a.type) }}>{a.type}</span>,
    <span key="p">{a.posting ? "ترحيلي" : "عنواني"}</span>,
  ]));
  openPrint(
    <ReportSheet title="دليل الحسابات" subtitle="التسلسل الهرمي الكامل للحسابات — 1-الأصول، 2-الخصوم (تشمل حقوق الملكية)، 3-المصروفات، 4-الإيرادات" user={user}
      filters={[["عدد الحسابات", String(app.accounts.length)], ["حسابات ترحيلية", String(app.accounts.filter((a) => a.posting).length)], ["حتى تاريخ", today]]}
      summary={[["عدد المستويات", "5 مستويات"], ["الحسابات التحليلية", String(app.accounts.filter((a) => a.analytical).length)]]}>
      <PTable head={["الكود", "اسم الحساب", "المستوى", "التصنيف", "الطبيعة"]} rows={rows} />
    </ReportSheet>
  );
}

/* ═══════════ إضافة حساب — ترقيم تلقائي حسب آخر رقم في المستوى ═══════════ */
function AddAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp();
  const parents = app.accounts.filter((a) => a.level < 5);
  const [parentCode, setParentCode] = useState("11");
  const [name, setName] = useState("");
  const [en, setEn] = useState("");
  const [manual, setManual] = useState("");
  const [analytical, setAnalytical] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});

  const parent = app.accounts.find((a) => a.code === parentCode);
  const siblings = app.accounts.filter((a) => a.parent === parentCode);
  const lastSibling = siblings.length ? siblings.reduce((m, s) => (parseInt(s.code.slice(parentCode.length), 10) > parseInt(m.code.slice(parentCode.length), 10) ? s : m)) : null;
  const autoCode = app.nextAccountCode(parentCode);
  const code = (manual.trim() || autoCode);
  const childLevel = (parent?.level || 1) + 1;
  const isLeaf = childLevel === 5;

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "اسم الحساب إلزامي";
    if (app.accounts.some((a) => a.code === code)) e.code = `الكود ${code} مستخدم بالفعل في الدليل`;
    if (!manual.trim() && !autoCode) e.code = "تعذّر توليد الكود — اختر حساباً أباً صالحاً";
    if (manual.trim() && !manual.trim().startsWith(parentCode)) e.code = `يجب أن يبدأ الكود بكود الأب (${parentCode})`;
    if (app.accounts.some((a) => a.parent === parentCode && a.name === name.trim())) e.name = "يوجد حساب بهذا الاسم تحت نفس الأب";
    setErrs(e);
    if (Object.keys(e).length) { app.toast("تعذّرت الإضافة — راجع الحقول المميّزة", "err"); return; }
    const ok = app.addAccount({
      code, name: name.trim(), en: en.trim() || undefined as any, level: childLevel, parent: parentCode,
      type: parent?.type || "أصول", posting: isLeaf, analytical: isLeaf && analytical ? true : undefined,
    } as Account);
    if (ok) { onClose(); setName(""); setEn(""); setManual(""); setAnalytical(false); setErrs({}); }
  };

  return (
    <Modal open={open} onClose={onClose} wide icon="layers" title="إضافة حساب جديد إلى دليل الحسابات" subtitle="ترقيم تسلسلي تلقائي حسب آخر رقم في نفس المستوى (1113 ← 1114)">
      <div className="grid md:grid-cols-2 gap-3.5">
        <label className="block md:col-span-2">
          <span className="text-[0.74rem] font-bold text-soft">الحساب الأب <b className="text-[var(--bad)]">*</b></span>
          <select className="select mt-1" value={parentCode} onChange={(e) => { setParentCode(e.target.value); setManual(""); setErrs({}); }}>
            {parents.map((p) => <option key={p.code} value={p.code}>{"— ".repeat(p.level - 1)}{p.code} — {p.name} (المستوى {p.level})</option>)}
          </select>
          <span className="text-[0.66rem] text-mute font-medium mt-1 block">سيُضاف الحساب الجديد في المستوى {childLevel} تحت هذا الأب{parent && <> — التصنيف «{parent.type}» يُورَّث تلقائياً</>}</span>
        </label>

        <div className="md:col-span-2 rounded-xl p-3.5 border border-[color-mix(in_srgb,var(--brand)_25%,transparent)]" style={{ background: "color-mix(in srgb, var(--brand) 5%, var(--panel))" }}>
          <div className="flex items-center gap-2 text-[0.76rem] font-bold text-[var(--brand)] mb-1.5"><I n="info" size={15} /> قاعدة الترقيم التلقائي</div>
          {lastSibling ? (
            <p className="text-[0.78rem] font-bold text-soft leading-6">
              آخر حساب تحت «{parent?.name}» هو <b className="font-num" dir="ltr">{lastSibling.code}</b> ({lastSibling.name})،
              لذا يُولَّد الرقم التالي <b className="font-num text-[var(--brand)]" dir="ltr">{autoCode}</b> تلقائياً.
            </p>
          ) : (
            <p className="text-[0.78rem] font-bold text-soft">لا توجد حسابات تحت «{parent?.name}» بعد — سيبدأ الترقيم من <b className="font-num text-[var(--brand)]" dir="ltr">{autoCode}</b>.</p>
          )}
        </div>

        <label className="block">
          <span className="text-[0.74rem] font-bold text-soft flex items-center gap-1.5">كود الحساب (المستوى {childLevel}) <b className="text-[var(--bad)]">*</b>
            <button className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)] !text-[0.6rem] !py-0" onClick={() => setManual("")}><I n="refresh" size={11} /> توليد تلقائي</button>
          </span>
          <input className={`input mt-1 font-num ${errs.code ? "!border-[var(--bad)]" : ""}`} dir="ltr" value={code} onChange={(e) => setManual(e.target.value)} />
          {errs.code ? <span className="flex items-center gap-1 text-[0.68rem] font-bold text-[var(--bad)] mt-1"><I n="alert" size={12} /> {errs.code}</span>
            : <span className="text-[0.66rem] text-mute font-medium mt-1 block">يمكن تعديله يدوياً بشرط أن يبدأ بـ <b className="font-num" dir="ltr">{parentCode}</b> وألا يكون مكرراً</span>}
        </label>

        <label className="block">
          <span className="text-[0.74rem] font-bold text-soft">الاسم الإنجليزي</span>
          <input className="input mt-1 font-num" dir="ltr" value={en} onChange={(e) => setEn(e.target.value)} placeholder="Account English Name" />
        </label>

        <label className="block md:col-span-2">
          <span className="text-[0.74rem] font-bold text-soft">اسم الحساب بالعربية <b className="text-[var(--bad)]">*</b></span>
          <input className={`input mt-1 ${errs.name ? "!border-[var(--bad)]" : ""}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أثاث ومفروشات المكتب" />
          {errs.name && <span className="flex items-center gap-1 text-[0.68rem] font-bold text-[var(--bad)] mt-1"><I n="alert" size={12} /> {errs.name}</span>}
        </label>

        <div className="md:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)]">التصنيف: {parent?.type || "—"}</span>
          <span className={`chip ${isLeaf ? "bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]" : "bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)]"}`}>
            {isLeaf ? "حساب ترحيلي (المستوى الخامس)" : "حساب عنواني — تُضاف تحته تفاصيل"}
          </span>
          {isLeaf && (
            <label className="flex items-center gap-2 cursor-pointer text-[0.78rem] font-bold text-soft">
              <input type="checkbox" className="cbx" checked={analytical} onChange={(e) => setAnalytical(e.target.checked)} />
              حساب تحليلي (يُربط بأسماء تفصيلية كحساب النزلاء)
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-line">
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
        <button className="btn btn-brand" onClick={submit}><I n="save" size={15} /> حفظ الحساب <span className="font-num" dir="ltr">({code})</span></button>
      </div>
    </Modal>
  );
}

/* ═══════════ الحسابات التحليلية ═══════════ */
function AnalyticalScreen() {
  const app = useApp();
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", note: "" });
  const rows = app.db.analyticals;
  const total = rows.reduce((s: number, a: any) => s + a.open + a.debit - a.credit, 0);
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}><I n="users" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">الحسابات التحليلية</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">تتبّع الذمم التفصيلية دون تضخيم دليل الحسابات — مرتبطة بالحساب 11212 «نزلاء المستشفى»</p>
          </div>
        </div>
        <button className="btn btn-brand" onClick={() => setShow(true)}><I n="plus" size={16} /> ربط اسم تحليلي</button>
      </div>
      <Reveal>
        <div className="card p-5 mb-4" style={{ background: "linear-gradient(120deg, color-mix(in srgb, var(--brand) 9%, var(--surface)), var(--surface))" }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[260px]">
              <h3 className="font-display font-bold text-lg">فكرة الابتكار</h3>
              <p className="text-[0.8rem] text-soft font-medium leading-6 mt-1">
                في الأنشطة الكبيرة — كالمستشفيات — لا تُضاف أسماء المرضى جميعاً إلى دليل الحسابات.
                بدلاً من ذلك يوجد في المستوى الخامس حساب واحد: <b className="font-num" dir="ltr">11212</b> «نزلاء المستشفى»،
                ويُربط هذا الحساب بشاشة الحسابات التحليلية حيث يُنشأ اسم لكل مريض. النتيجة: ذمم دقيقة لكل مريض،
                ودليل حسابات نظيف، وإجماليات تتطابق تلقائياً مع الأستاذ العام.
              </p>
            </div>
            <div className="text-center rounded-xl bg-panel border border-line px-6 py-4">
              <div className="font-num font-bold text-2xl text-[var(--brand)]">{app.fmtN(total)}</div>
              <div className="text-[0.68rem] font-bold text-mute mt-1">إجمالي الذمم التحليلية = رصيد 11212</div>
              <div className="text-[0.64rem] font-bold text-[var(--good)] mt-2 flex items-center justify-center gap-1"><I n="check" size={12} /> مطابقة تلقائية مع الأستاذ العام</div>
            </div>
          </div>
        </div>
      </Reveal>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
        {rows.map((a: any) => {
          const balance = a.open + a.debit - a.credit;
          return (
            <div key={a.id} className="card card-lift p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full grid place-items-center font-display font-bold text-sm bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]">{String(a.name).slice(0, 2)}</span>
                  <div><div className="font-bold">{a.name}</div><div className="text-[0.66rem] text-mute font-bold font-num" dir="ltr">{a.id} • {a.phone}</div></div>
                </div>
                <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)] font-num" dir="ltr">→ 11212</span>
              </div>
              <div className="text-[0.72rem] text-mute font-bold mt-2">{a.note}</div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-panel rounded-lg p-2 text-center"><div className="text-[0.6rem] font-bold text-mute">افتتاحي</div><div className="font-num font-bold text-[0.85rem]">{app.fmtN(a.open)}</div></div>
                <div className="bg-panel rounded-lg p-2 text-center"><div className="text-[0.6rem] font-bold text-mute">حركات مدينة</div><div className="font-num font-bold text-[0.85rem] text-[var(--bad)]">{app.fmtN(a.debit)}</div></div>
                <div className="bg-panel rounded-lg p-2 text-center"><div className="text-[0.6rem] font-bold text-mute">الرصيد</div><div className="font-num font-bold text-[0.85rem] text-[var(--brand)]">{app.fmtN(balance)}</div></div>
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={show} onClose={() => setShow(false)} title="ربط حساب تحليلي جديد بالحساب 11212" icon="users">
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-panel border border-line text-[0.76rem] font-bold text-soft flex items-center gap-2">
            <I n="info" size={15} className="text-[var(--brand)] shrink-0" /> سيُربط الاسم بالحساب <span className="font-num" dir="ltr">11212 — نزلاء المستشفى</span> دون إنشاء حساب جديد في الدليل.
          </div>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الاسم الكامل</span><input className="input mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="مثال: عبدالله أحمد النجار" /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الهاتف</span><input className="input mt-1 font-num" dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="7XX-XXX-XXX" /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">القسم / الغرفة</span><input className="input mt-1" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="قسم الجراحة — غرفة 120" /></label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setShow(false)}>إلغاء</button>
          <button className="btn btn-brand" onClick={() => {
            if (!f.name.trim()) { app.toast("الاسم مطلوب", "err"); return; }
            const id = `AN-${String(rows.length + 1).padStart(3, "0")}`;
            app.save("analyticals", { id, code: id, name: f.name, linkedAccount: "11212", open: 0, debit: 0, credit: 0, phone: f.phone, note: f.note });
            app.toast(`رُبط «${f.name}» بالحساب 11212 — تُتابَع ذممه دون إضافة حساب للدليل`, "ok"); setShow(false); setF({ name: "", phone: "", note: "" });
          }}><I n="check" size={15} /> ربط وتفعيل</button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════ القيود والسندات ═══════════ */
const JE_META: Record<string, { title: string; desc: string; icon: string; newLabel: string }> = {
  open: { title: "سند قيد افتتاحي مالي", desc: "القيد الافتتاحي للسنة المالية — أرصدة الحسابات عند 1 يناير", icon: "cal", newLabel: "قيد افتتاحي" },
  req: { title: "طلب سند قيد يومية", desc: "طلبات قيد بانتظار موافقة المدير المالي قبل الترحيل للأستاذ", icon: "clock", newLabel: "طلب قيد" },
  je: { title: "سند قيد يومية", desc: "القيود اليومية المرحّلة — قيد مزدوج متعدد العملات ومراكز التكلفة", icon: "book", newLabel: "قيد يومية" },
  pv: { title: "سندات الصرف", desc: "صرفيات نقدية وبنكية موثقة بقيود متوازنة", icon: "wallet", newLabel: "سند صرف" },
  rv: { title: "سندات القبض", desc: "قبضات نقدية وبنكية مع تسوية الذمم تلقائياً", icon: "down", newLabel: "سند قبض" },
};
function JEScreen({ kind }: { kind: string }) {
  const app = useApp();
  const meta = JE_META[kind];
  const [show, setShow] = useState(false);
  const kindMap: Record<string, string> = { open: "افتتاحي", req: "طلب", je: "يومية", pv: "صرف", rv: "قبض" };
  const list = (app.db.journals as any as Journal[]).filter((j) => j.kind === kindMap[kind]).reverse();
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n={meta.icon} size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">{meta.title}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">{meta.desc}</p>
          </div>
        </div>
        <button className="btn btn-brand" onClick={() => setShow(true)}><I n="plus" size={16} /> {meta.newLabel} جديد</button>
      </div>
      <div className="space-y-3 stagger">
        {list.map((j) => {
          const dr = j.lines.reduce((a, l) => a + l.debit, 0);
          return (
            <div key={j.id} className="card p-4 card-lift">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${j.kind === "قبض" ? "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]" : j.kind === "صرف" ? "bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-[var(--bad)]" : j.kind === "طلب" ? "bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)]" : "bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]"}`}>
                  <I n={meta.icon} size={19} />
                </span>
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-num font-bold text-[0.72rem]" dir="ltr">{j.no}</span>
                    <Chip s={j.status} />
                    <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)]">{j.source}</span>
                  </div>
                  <div className="font-bold text-[0.88rem] mt-1">{j.desc}</div>
                  <div className="text-[0.7rem] text-mute font-bold font-num mt-0.5" dir="ltr">{j.date} • {j.user}</div>
                </div>
                <div className="text-end shrink-0">
                  <div className="text-[0.66rem] font-bold text-mute">قيمة القيد</div>
                  <div className="font-num font-bold text-lg text-[var(--brand)]">{app.fmtN(dr)} <span className="text-[0.66rem] text-mute">ر.ي</span></div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button className="btn btn-ghost !p-1.5" title="طباعة السند" onClick={() => printJournal(app, j)}><I n="print" size={15} /></button>
                  {j.status === "بانتظار الموافقة" && <>
                    <button className="btn btn-brand !py-1.5 !text-[0.72rem]" onClick={() => app.approveJournal(j.id)}><I n="check" size={14} /> اعتماد وترحيل</button>
                    <button className="btn btn-danger !py-1.5 !text-[0.72rem]" onClick={() => app.voidJournal(j.id)}>رفض</button>
                  </>}
                  {j.status === "مرحّل" && j.kind !== "افتتاحي" && <button className="btn btn-danger !py-1.5" title="إلغاء القيد" onClick={() => app.voidJournal(j.id)}><I n="undo" size={14} /></button>}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-line/70 grid gap-1.5">
                {j.lines.filter((l) => l.debit || l.credit).map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-[0.76rem] font-bold">
                    <span className="flex items-center gap-2 text-soft flex-wrap"><span className="font-num text-mute" dir="ltr">{l.account}</span> {app.accounts.find((a) => a.code === l.account)?.name}
                      {l.analytical && <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)]">{(app.db.analyticals.find((a: any) => a.id === l.analytical) as any)?.name}</span>}
                      {l.currency !== "YER" && <span className="chip bg-[color-mix(in_srgb,var(--warn)_13%,transparent)] text-[var(--warn)] font-num">{l.currency} ×{l.rate}</span>}
                      {l.costCenter && <span className="chip bg-[color-mix(in_srgb,var(--mute)_11%,transparent)] text-[var(--mute)]">{l.costCenter}</span>}
                    </span>
                    <span className="font-num">{l.debit ? <span className="text-[var(--bad)]">مدين {app.fmtN(l.debit * l.rate)}</span> : <span className="text-[var(--good)]">دائن {app.fmtN(l.credit * l.rate)}</span>}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div className="card"><Empty msg="لا توجد قيود من هذا النوع بعد" /></div>}
      </div>
      {show && (kind === "rv" || kind === "pv" ? <VoucherBuilder kind={kind} onClose={() => setShow(false)} /> : <JEBuilder kind={kind} onClose={() => setShow(false)} />)}
    </div>
  );
}

/* ── بناء مستند طباعة قيد/سند مالي ── */
function printJournal(app: ReturnType<typeof useApp>, j: Journal) {
  const lines = j.lines.filter((l) => l.debit || l.credit);
  const dr = lines.reduce((a, l) => a + l.debit * l.rate, 0);
  const cr = lines.reduce((a, l) => a + l.credit * l.rate, 0);
  openPrint(
    <DocSheet
      docTitle={j.source || "سند قيد يومية"} no={j.no} date={j.date} status={j.status}
      subtitle={app.session?.branch}
      meta={[
        ["البيان", j.desc],
        ["نوع القيد", j.kind],
        ["مركز التكلفة", lines[0]?.costCenter || "—"],
        ["المستخدم", j.user],
        ["عدد الأسطر", String(lines.length)],
        ["الحالة", j.status],
      ]}
      totals={{ items: [["إجمالي الطرف المدين", app.fmtN(dr)], ["إجمالي الطرف الدائن", app.fmtN(cr)], ["فرق التوازن", app.fmtN(dr - cr)], ["المبلغ بالحروف", tafqit(dr)]], grand: ["قيمة السند", app.fmtN(dr) + " ر.ي"] }}
      stampText={j.source || "قيد يومية"} stampSub={j.status === "بانتظار الموافقة" ? "بانتظار الاعتماد" : j.status === "ملغي" ? "ملغي" : "معتمد"}
      amountBox={{ num: app.fmtN(dr) + " ر.ي", words: tafqit(dr) }}
      signLabels={j.status === "بانتظار الموافقة" ? ["المحاسب", "المدير المالي"] : ["المحاسب", "المراجع", "المدير المالي"]}
      user={app.session?.user || "—"}
    >
      <PTable
        head={["م", "الكود", "الحساب", "تحليلي", "العملة", "مدين", "دائن"]}
        widths={["4%", "10%", undefined, "16%", "8%", "14%", "14%"]}
        rows={lines.map((l, i) => [
          i + 1,
          <span className="num">{l.account}</span>,
          app.accounts.find((a) => a.code === l.account)?.name || "—",
          (l.analytical && (app.db.analyticals.find((x: any) => x.id === l.analytical) as any)?.name) || "—",
          <span className="num">{l.currency}{l.rate !== 1 ? ` ×${l.rate}` : ""}</span>,
          <span className="num">{l.debit ? app.fmtN(l.debit * l.rate) : "—"}</span>,
          <span className="num">{l.credit ? app.fmtN(l.credit * l.rate) : "—"}</span>,
        ])}
      />
    </DocSheet>
  );
}

/* ═══════════ باني سندات القبض والصرف — حقول رأس وبنود احترافية ═══════════ */
interface VLine { account: string; amount: string; currency: string; desc: string; cc: string }
function VoucherBuilder({ kind, onClose }: { kind: "rv" | "pv"; onClose: () => void }) {
  const app = useApp();
  const isRV = kind === "rv";
  const boxes = app.db.cashboxes as any[];
  const posting = app.accounts.filter((a) => a.posting);
  const [date, setDate] = useState("2026-03-29");
  const [box, setBox] = useState(boxes[0]?.id || "");
  const [payMethod, setPayMethod] = useState("نقداً");
  const [payRef, setPayRef] = useState("");
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("YER");
  const [cc, setCc] = useState("CC-01");
  const [desc, setDesc] = useState("");
  const [lines, setLines] = useState<VLine[]>([
    { account: isRV ? app.settings.suspense.customers : app.settings.suspense.suppliers, amount: "", currency: "YER", desc: "", cc: "CC-01" },
  ]);
  const rate = (app.db.currencies.find((c: any) => c.id === currency) as any)?.rate || 1;
  const boxAcc: string = (boxes.find((b) => b.id === box) as any)?.account || app.settings.suspense.cash;
  const boxAccName = app.accounts.find((a) => a.code === boxAcc)?.name || "—";
  const linesSum = lines.reduce((a, l) => a + (+l.amount || 0) * ((app.db.currencies.find((c: any) => c.id === l.currency) as any)?.rate || 1), 0);
  const headerVal = (+amount || 0) * rate;
  const matched = Math.abs(linesSum - headerVal) < 0.01 && headerVal > 0;
  /* رقم السند يُحجز عند أول معاينة ويُعاد استخدامه عند الحفظ فيتطابق المطبوع مع المحفوظ */
  const vPrefix = isRV ? app.settings.prefixes.RC : app.settings.prefixes.PV;
  const [no, setNo] = useState<string | null>(null);

  const setL = (i: number, p: Partial<VLine>) => setLines((old) => old.map((l, j) => (j === i ? { ...l, ...p } : l)));

  const save = () => {
    if (!desc.trim()) { app.toast("حقل «البيان» إلزامي", "err"); return; }
    if (!party.trim()) { app.toast(isRV ? "حقل «استلمنا من» إلزامي" : "حقل «صُرف إلى» إلزامي", "err"); return; }
    if (!(+amount > 0)) { app.toast("أدخل المبلغ رقماً — يجب أن يكون أكبر من صفر", "err"); return; }
    if (!matched) { app.toast(`إجمالي البنود (${app.fmtN(linesSum)}) لا يطابق مبلغ السند (${app.fmtN(headerVal)})`, "err"); return; }
    const n = no || app.nextNo(vPrefix);
    const je: Journal = {
      id: n, no: n, date, user: app.session?.user || "—", status: "مرحّل",
      desc: `${isRV ? "سند قبض" : "سند صرف"} — ${isRV ? "استلمنا من" : "صُرف إلى"} ${party} — ${desc}`,
      kind: isRV ? "قبض" : "صرف", source: isRV ? "سند قبض" : "سند صرف",
      lines: [
        ...(isRV
          ? [{ account: boxAcc, debit: headerVal, credit: 0, currency, rate, costCenter: cc }]
          : lines.filter((l) => +l.amount > 0).map((l) => ({ account: l.account, debit: (+l.amount || 0) * ((app.db.currencies.find((c: any) => c.id === l.currency) as any)?.rate || 1), credit: 0, currency: l.currency, rate: (app.db.currencies.find((c: any) => c.id === l.currency) as any)?.rate || 1, costCenter: l.cc || cc }))),
        ...(isRV
          ? lines.filter((l) => +l.amount > 0).map((l) => ({ account: l.account, debit: 0, credit: (+l.amount || 0) * ((app.db.currencies.find((c: any) => c.id === l.currency) as any)?.rate || 1), currency: l.currency, rate: (app.db.currencies.find((c: any) => c.id === l.currency) as any)?.rate || 1, costCenter: l.cc || cc }))
          : [{ account: boxAcc, debit: 0, credit: headerVal, currency, rate, costCenter: cc }]),
      ],
    } as unknown as Journal;
    const res = app.addJournal(je);
    app.toast(res.msg, res.ok ? "ok" : "err");
    if (res.ok) { printVoucher(app, { no: n, date, box: boxes.find((b) => b.id === box)?.name, boxAcc, boxAccName, party, amount: headerVal, currency, rate, payMethod, payRef, cc, desc, lines, isRV, status: "مرحّل" }); onClose(); }
  };

  /* معاينة الطباعة تُخرج المستند النهائي (برقمه وحالته المرحّلة) وليس نسخة مسودة */
  const printFinal = () => {
    if (!(+amount > 0)) { app.toast("أدخل المبلغ أولاً قبل الطباعة", "err"); return; }
    if (!matched) { app.toast("طابق إجمالي البنود مع مبلغ السند أولاً", "err"); return; }
    const n = no || app.nextNo(vPrefix);
    setNo(n);
    printVoucher(app, { no: n, date, box: boxes.find((b) => b.id === box)?.name, boxAcc, boxAccName, party, amount: headerVal, currency, rate, payMethod, payRef, cc, desc, lines, isRV, status: "مرحّل" });
  };

  return (
    <Modal open onClose={onClose} wide icon={isRV ? "down" : "wallet"}
      title={`${isRV ? "سند قبض" : "سند صرف"} جديد — رقم يُولّد تلقائياً`}
      subtitle={isRV ? "تحصيل نقدي أو بنكي — يُرحَّل قيداً متوازناً: من ح/ الصندوق إلى الحسابات الدائنة" : "صرف نقدي أو بنكي — يُرحَّل قيداً متوازناً: من الحسابات المدينة إلى ح/ الصندوق"}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
        <button className="btn btn-soft" onClick={printFinal}><I n="print" size={15} /> معاينة الطباعة</button>
        <button className="btn btn-brand" onClick={save} disabled={!matched}><I n="check" size={15} /> حفظ وترحيل السند</button>
      </>}>
      {/* ── أولاً: رأس المستند ── */}
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--brand)_22%,transparent)] overflow-hidden mb-4">
        <div className="px-4 py-2 flex items-center gap-2 text-[0.72rem] font-bold" style={{ background: "color-mix(in srgb, var(--brand) 9%, var(--panel))" }}>
          <I n="receipt" size={15} className="text-[var(--brand)]" /> أولاً — رأس المستند (Header)
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="block"><span className="text-[0.74rem] font-bold text-soft flex items-center gap-1">اسم الصندوق <b className="text-[var(--bad)]">*</b></span>
            <select className="select mt-1" value={box} onChange={(e) => setBox(e.target.value)}>
              {boxes.map((b) => <option key={b.id} value={b.id}>{b.name} (ح/ {b.account})</option>)}
            </select>
            <span className="text-[0.62rem] font-bold text-[var(--brand)] mt-1 block">ح/ {boxAcc} — {boxAccName}</span>
          </label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft flex items-center gap-1">التاريخ <b className="text-[var(--bad)]">*</b></span>
            <input type="date" className="input mt-1 font-num" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft flex items-center gap-1">المبلغ رقماً <b className="text-[var(--bad)]">*</b></span>
            <input type="number" className="input mt-1 font-num !font-bold !text-[1.05rem]" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">عملة الحساب</span>
            <select className="select mt-1" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {app.db.currencies.map((c: any) => <option key={c.id} value={c.id}>{c.id}{c.rate !== 1 ? ` (×${app.fmtN(c.rate)})` : " — أساس"}</option>)}
            </select>
            {rate !== 1 && <span className="text-[0.62rem] font-bold text-[var(--warn)] mt-1 block">المعادل: {app.fmtN(headerVal)} ر.ي</span>}
          </label>
          <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft flex items-center gap-1">{isRV ? "استلمنا من" : "صُرف إلى"} <b className="text-[var(--bad)]">*</b></span>
            <input className="input mt-1" list={`parties-${kind}`} value={party} onChange={(e) => setParty(e.target.value)} placeholder={isRV ? "اسم العميل أو الجهة المسلِّمة…" : "اسم المورد أو الجهة المستلمة…"} />
            <datalist id={`parties-${kind}`}>{(isRV ? app.db.customers : app.db.suppliers).map((p: any) => <option key={p.id} value={p.name} />)}</datalist>
          </label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">طريقة الدفع</span>
            <select className="select mt-1" value={payMethod} onChange={(e) => { setPayMethod(e.target.value); if (e.target.value === "نقداً") setPayRef(""); }}>
              {["نقداً", "شيك", "حوالة بنكية", "بطاقة"].map((m) => <option key={m}>{m}</option>)}
            </select></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">{payMethod === "شيك" ? "رقم الشيك" : payMethod === "حوالة بنكية" ? "رقم الحوالة" : "مرجع مستندي"}</span>
            <input className="input mt-1 font-num" dir="ltr" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="اختياري…" /></label>
          <label className="block col-span-2 md:col-span-4">
            <span className="flex items-center gap-1.5 text-[0.78rem] font-bold text-soft mb-1.5"><I n="file" size={14} className="text-[var(--brand)]" /> الــبيــان <b className="text-[var(--bad)]">*</b></span>
            <textarea className="input !text-[0.86rem] !leading-6" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder={isRV ? "مثال: استلمنا من العميل … مبلغاً وقدره … وذلك سداداً للدفعة رقم … بموجب الفاتورة …" : "مثال: صُرف إلى المورد … مبلغاً وقدره … وذلك سداداً للمستحقات بموجب الفاتورة …"} />
          </label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">مركز التكلفة</span>
            <select className="select mt-1" value={cc} onChange={(e) => setCc(e.target.value)}>{app.db.costCenters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        </div>
      </div>

      {/* ── ثانياً: بنود المستند ── */}
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] overflow-hidden mb-4">
        <div className="px-4 py-2 flex items-center gap-2 text-[0.72rem] font-bold" style={{ background: "color-mix(in srgb, var(--accent) 9%, var(--panel))" }}>
          <I n="layers" size={15} className="text-[var(--accent)]" /> ثانياً — بنود المستند (Details)
          <span className="ms-auto text-mute">الطرف المقابل للصندوق: {isRV ? "دائن" : "مدين"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[760px]">
            <thead><tr>
              <th style={{ width: "13%" }}>المبلغ <b className="text-[var(--bad)]">*</b></th>
              <th style={{ width: "24%" }}>رقم الحساب <b className="text-[var(--bad)]">*</b></th>
              <th style={{ width: "22%" }}>اسم الحساب</th>
              <th style={{ width: "10%" }}>العملة</th>
              <th>البيان</th>
              <th style={{ width: "13%" }}>مركز التكلفة</th>
              <th style={{ width: "4%" }}></th>
            </tr></thead>
            <tbody>
              {lines.map((l, i) => {
                const lRate = (app.db.currencies.find((c: any) => c.id === l.currency) as any)?.rate || 1;
                const acc = app.accounts.find((a) => a.code === l.account);
                return (
                  <tr key={i}>
                    <td><input type="number" className="input !py-1.5 font-num !font-bold" dir="ltr" value={l.amount} onChange={(e) => setL(i, { amount: e.target.value })} placeholder="0.00" /></td>
                    <td><select className="select !py-1.5 !text-[0.76rem]" value={l.account} onChange={(e) => setL(i, { account: e.target.value })}>
                      {posting.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                    </select></td>
                    <td><span className="text-[0.74rem] font-bold text-soft">{acc?.name || "—"}</span></td>
                    <td><select className="select !py-1.5 !text-[0.74rem]" value={l.currency} onChange={(e) => setL(i, { currency: e.target.value })}>
                      {app.db.currencies.map((c: any) => <option key={c.id} value={c.id}>{c.id}</option>)}
                    </select></td>
                    <td><input className="input !py-1.5 !text-[0.76rem]" value={l.desc} onChange={(e) => setL(i, { desc: e.target.value })} placeholder="بيان البند…" /></td>
                    <td><select className="select !py-1.5 !text-[0.74rem]" value={l.cc} onChange={(e) => setL(i, { cc: e.target.value })}>
                      {app.db.costCenters.map((c: any) => <option key={c.id} value={c.id}>{c.code}</option>)}
                    </select></td>
                    <td className="text-center"><button className="text-mute hover:text-[var(--bad)] transition-colors" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, j) => j !== i))} aria-label="حذف البند"><I n="trash" size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button className="w-full py-2.5 text-[0.76rem] font-bold text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] transition-colors flex items-center justify-center gap-1.5 border-t border-line"
          onClick={() => setLines([...lines, { account: isRV ? app.settings.suspense.customers : app.settings.suspense.suppliers, amount: "", currency: "YER", desc: "", cc }])}>
          <I n="plus" size={14} /> إضافة بند
        </button>
      </div>

      {/* ── شريط التوازن ── */}
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 border ${matched ? "border-[color-mix(in_srgb,var(--good)_35%,transparent)] bg-[color-mix(in_srgb,var(--good)_7%,transparent)]" : "border-[color-mix(in_srgb,var(--warn)_35%,transparent)] bg-[color-mix(in_srgb,var(--warn)_6%,transparent)]"}`}>
        <div className="flex items-center gap-2 font-bold text-[0.8rem]">
          <I n={matched ? "check" : "alert"} size={17} className={matched ? "text-[var(--good)]" : "text-[var(--warn)]"} />
          <span className={matched ? "text-[var(--good)]" : "text-[var(--warn)]"}>{matched ? "السند متوازن — جاهز للترحيل والطباعة" : "اجعل إجمالي البنود مطابقاً لمبلغ السند"}</span>
        </div>
        <div className="flex gap-4 font-num font-bold text-[0.82rem] flex-wrap">
          <span>مبلغ السند: <span className="text-[var(--brand)]">{app.fmtN(headerVal)}</span></span>
          <span>إجمالي البنود: <span className={matched ? "text-[var(--good)]" : "text-[var(--bad)]"}>{app.fmtN(linesSum)}</span></span>
          <span>الفرق: <span className="text-[var(--warn)]">{app.fmtN(headerVal - linesSum)}</span></span>
        </div>
      </div>
    </Modal>
  );
}

/* ── طباعة سند القبض / الصرف — مستند A4 احترافي مع التفقيط والاعتمادات ── */
function printVoucher(app: ReturnType<typeof useApp>, v: {
  no: string; date: string; box?: string; boxAcc: string; boxAccName: string; party: string; amount: number;
  currency: string; rate: number; payMethod: string; payRef: string; cc: string; desc: string; lines: VLine[]; isRV: boolean; status: string;
}) {
  openPrint(
    <DocSheet
      docTitle={v.isRV ? "سند قبض" : "سند صرف"} no={v.no} date={v.date} status={v.status}
      stampText={v.isRV ? "سند قبض" : "سند صرف"} stampSub={v.status === "مرحّل" ? "معتمد" : v.status}
      subtitle={app.session?.branch}
      meta={[
        [v.isRV ? "استلمنا من" : "صُرف إلى", v.party || "—"],
        ["الصندوق / البنك", v.box || "—"],
        ["حساب الصندوق", `${v.boxAcc} — ${v.boxAccName}`],
        ["طريقة الدفع", v.payMethod + (v.payRef ? ` — ${v.payRef}` : "")],
        ["عملة السند", v.currency + (v.rate !== 1 ? ` (×${app.fmtN(v.rate)})` : "")],
        ["مركز التكلفة", v.cc],
      ]}
      amountBox={{ num: `${app.fmtN(v.amount)} ${v.currency === "YER" ? "ر.ي" : v.currency}`, words: `فقط ${tafqit(v.amount)} ${v.currency === "YER" ? "ريال يمني" : v.currency} لا غير` }}
      totals={{ items: [[v.isRV ? "إجمالي الطرف الدائن" : "إجمالي الطرف المدين", app.fmtN(v.amount)], ["إجمالي الطرف المقابل", app.fmtN(v.amount)], ["حالة التوازن", "متوازن ✓"]], grand: ["قيمة السند", `${app.fmtN(v.amount)} ${v.currency === "YER" ? "ر.ي" : v.currency}`] }}
      note={v.desc}
      signLabels={v.isRV ? ["المحاسب", "أمين الصندوق", "المسلِّم (العميل)"] : ["المحاسب", "أمين الصندوق", "المستلم"]}
      user={app.session?.user || "—"}
    >
      <table className="p-table">
        <thead><tr><th style={{ width: "14%" }}>رقم الحساب</th><th style={{ width: "26%" }}>اسم الحساب</th><th style={{ width: "14%" }}>المبلغ</th><th style={{ width: "9%" }}>العملة</th><th>البيان</th><th style={{ width: "11%" }}>م. التكلفة</th></tr></thead>
        <tbody>
          {v.lines.filter((l) => +l.amount > 0).map((l, i) => {
            const lRate = (app.db.currencies.find((c: any) => c.id === l.currency) as any)?.rate || 1;
            return (
              <tr key={i}>
                <td className="num" dir="ltr">{l.account}</td>
                <td>{app.accounts.find((a) => a.code === l.account)?.name || "—"}</td>
                <td className="num">{app.fmtN((+l.amount || 0) * lRate)}{lRate !== 1 ? <span className="num" style={{ fontSize: "0.6rem" }}> ({l.amount} {l.currency})</span> : null}</td>
                <td className="num">{l.currency}</td>
                <td>{l.desc || v.desc}</td>
                <td className="num">{l.cc}</td>
              </tr>
            );
          })}
          <tr>
            <td className="num" dir="ltr">{v.boxAcc}</td>
            <td><b>{v.boxAccName}</b> {v.isRV ? "(مدين)" : "(دائن)"}</td>
            <td className="num"><b>{app.fmtN(v.amount)}</b></td>
            <td className="num">{v.currency}</td>
            <td>{v.box || "—"}</td>
            <td className="num">{v.cc}</td>
          </tr>
        </tbody>
      </table>
    </DocSheet>
  );
}

function JEBuilder({ kind, onClose }: { kind: string; onClose: () => void }) {
  const app = useApp();
  const isReq = kind === "req";
  const [desc, setDesc] = useState(kind === "rv" ? "سند قبض — تحصيل دفعة من عميل" : kind === "pv" ? "سند صرف — سداد مستحقات" : "");
  const [date, setDate] = useState("2026-03-29");
  const [cc, setCc] = useState("CC-01");
  const defAcc = kind === "rv" ? ["11111", "11211"] : kind === "pv" ? [app.settings.suspense.suppliers, app.settings.suspense.bank] : ["11111", "41111"];
  const [rows, setRows] = useState<{ account: string; debit: string; credit: string; currency: string; rate: number; analytical: string }[]>(
    defAcc.map((a) => ({ account: a, debit: "", credit: "", currency: "YER", rate: 1, analytical: "" }))
  );
  const posting = app.accounts.filter((a) => a.posting);
  const dr = rows.reduce((a, r) => a + (+r.debit || 0) * r.rate, 0);
  const cr = rows.reduce((a, r) => a + (+r.credit || 0) * r.rate, 0);
  const balanced = Math.abs(dr - cr) < 0.01 && dr > 0;
  const setRow = (i: number, patch: Partial<typeof rows[0]>) => setRows((old) => old.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  /* رقم القيد يُحجز عند أول معاينة ويُعاد استخدامه عند الحفظ فيتطابق المطبوع مع المحفوظ */
  const jePrefix = kind === "rv" ? app.settings.prefixes.RC : kind === "pv" ? app.settings.prefixes.PV : kind === "open" ? "FYE" : app.settings.prefixes.JE;
  const [no, setNo] = useState<string | null>(null);
  const jeStatus = isReq ? "بانتظار الموافقة" : "مرحّل";
  const buildLines = (): JournalLine[] => rows.filter((r) => +r.debit || +r.credit).map((r) => ({ account: r.account, debit: (+r.debit || 0) * r.rate, credit: (+r.credit || 0) * r.rate, currency: r.currency, rate: r.rate, analytical: r.analytical || undefined, costCenter: cc }));

  const save = () => {
    if (!desc.trim()) { app.toast("البيان مطلوب", "err"); return; }
    if (!balanced) { app.toast(`القيد غير متوازن: مدين ${app.fmtN(dr)} مقابل دائن ${app.fmtN(cr)}`, "err"); return; }
    const n = no || app.nextNo(jePrefix);
    const res = app.addJournal({ id: n, no: n, date, desc, kind: isReq ? "طلب" : kind === "open" ? "افتتاحي" : "يومية", lines: buildLines(), user: app.session?.user || "—", status: jeStatus, source: JE_META[kind].title } as Journal);
    app.toast(res.msg, res.ok ? "ok" : "err");
    if (res.ok) onClose();
  };

  /* معاينة الطباعة تُخرج المستند النهائي (برقمه وحالته) وليس نسخة مسودة */
  const printFinal = () => {
    if (!balanced) { app.toast("وازن القيد أولاً قبل الطباعة", "err"); return; }
    const n = no || app.nextNo(jePrefix);
    setNo(n);
    printJournal(app, { id: n, no: n, date, desc, kind: "يومية", lines: buildLines(), user: app.session?.user || "—", status: jeStatus, source: JE_META[kind].title } as unknown as Journal);
  };

  return (
    <Modal open onClose={onClose} wide icon="book" title={JE_META[kind].newLabel + " جديد — رقم يُولّد تلقائياً"} subtitle="قيد مزدوج متعدد العملات — يُرفض الترحيل إذا لم يتوازن المدين والدائن">
      <FormSection n="أولاً" icon="file" title="رأس القيد" hint="البيان والتاريخ ومركز التكلفة">
      {/* حقل البيان — كبير وكامل العرض */}
      <label className="block mb-3">
        <span className="flex items-center gap-1.5 text-[0.78rem] font-bold text-soft mb-1.5"><I n="file" size={14} className="text-[var(--brand)]" /> الــبيــان <b className="text-[var(--bad)]">*</b></span>
        <textarea className="input !text-[0.86rem] !leading-6" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)}
          placeholder={kind === "قبض" ? "مثال: سند قبض دفعة من العميل … بموجب …" : kind === "صرف" ? "مثال: سند صرف سداد مستحقات للمورد …" : "اذكر وصف القيد وطبيعة الحركة المحاسبية بوضوح…"} />
      </label>
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">التاريخ</span><input type="date" className="input mt-1 font-num" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">مركز التكلفة</span>
          <select className="select mt-1" value={cc} onChange={(e) => setCc(e.target.value)}>{app.db.costCenters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
      </FormSection>
      <FormSection n="ثانياً" icon="book" title="سطور القيد" hint="الحسابات المدينة والدائنة — يجب أن يتوازن الطرفان">
      <div className="rounded-xl border border-line overflow-hidden mb-3">
        <table className="tbl">
          <thead><tr><th>الحساب (المستوى 5)</th><th>مدين</th><th>دائن</th><th>العملة</th><th>تحليلي</th><th></th></tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const acc = app.accounts.find((a) => a.code === r.account);
              return (
                <tr key={i}>
                  <td><select className="select !py-1.5 !text-[0.78rem]" value={r.account} onChange={(e) => setRow(i, { account: e.target.value })}>
                    {posting.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                  </select></td>
                  <td><input className="input !py-1.5 font-num !w-28" type="number" placeholder="0" value={r.debit} onChange={(e) => setRow(i, { debit: e.target.value, credit: "" })} /></td>
                  <td><input className="input !py-1.5 font-num !w-28" type="number" placeholder="0" value={r.credit} onChange={(e) => setRow(i, { credit: e.target.value, debit: "" })} /></td>
                  <td><select className="select !py-1.5 !w-24" value={r.currency} onChange={(e) => { const c: any = app.db.currencies.find((x: any) => x.id === e.target.value); setRow(i, { currency: e.target.value, rate: c?.rate || 1 }); }}>
                    {app.db.currencies.map((c: any) => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select></td>
                  <td>{acc?.analytical ? (
                    <select className="select !py-1.5 !w-36" value={r.analytical} onChange={(e) => setRow(i, { analytical: e.target.value })}>
                      <option value="">— بدون —</option>
                      {app.db.analyticals.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  ) : <span className="text-[0.68rem] text-mute font-bold">غير قابل</span>}</td>
                  <td><button className="text-mute hover:text-[var(--bad)] transition-colors" onClick={() => rows.length > 2 && setRows(rows.filter((_, j) => j !== i))} aria-label="حذف"><I n="trash" size={15} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="w-full py-2.5 text-[0.78rem] font-bold text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_6%,transparent)] transition-colors flex items-center justify-center gap-1.5 border-t border-line"
          onClick={() => setRows([...rows, { account: "11111", debit: "", credit: "", currency: "YER", rate: 1, analytical: "" }])}>
          <I n="plus" size={14} /> إضافة سطر
        </button>
      </div>
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 border ${balanced ? "border-[color-mix(in_srgb,var(--good)_35%,transparent)] bg-[color-mix(in_srgb,var(--good)_7%,transparent)]" : "border-[color-mix(in_srgb,var(--bad)_35%,transparent)] bg-[color-mix(in_srgb,var(--bad)_6%,transparent)]"}`}>
        <div className="flex items-center gap-2 font-bold text-[0.82rem]">
          {balanced ? <I n="check" size={17} className="text-[var(--good)]" /> : <I n="alert" size={17} className="text-[var(--bad)]" />}
          <span className={balanced ? "text-[var(--good)]" : "text-[var(--bad)]"}>{balanced ? "القيد متوازن — جاهز للترحيل" : "القيد غير متوازن (مبدأ القيد المزدوج)"}</span>
        </div>
        <div className="flex gap-4 font-num font-bold text-[0.85rem]">
          <span>مدين: <span className="text-[var(--bad)]">{app.fmtN(dr)}</span></span>
          <span>دائن: <span className="text-[var(--good)]">{app.fmtN(cr)}</span></span>
          <span>الفرق: <span className="text-[var(--warn)]">{app.fmtN(dr - cr)}</span></span>
        </div>
      </div>
      </FormSection>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
        <button className="btn btn-soft" onClick={printFinal}><I n="print" size={15} /> معاينة الطباعة</button>
        <button className="btn btn-brand" disabled={!balanced} onClick={save}>
          <I n="check" size={16} /> حفظ و{isReq ? "إرسال الطلب" : "ترحيل القيد"}
        </button>
      </div>
    </Modal>
  );
}

/* ═══════════ التقارير المالية ═══════════ */
function GLReport({ kind }: { kind: string }) {
  const app = useApp();
  const posting = app.accounts.filter((a) => a.posting);
  const [stmtAcc, setStmtAcc] = useState("11111");
  const [gq, setGq] = useState("");
  const [gKind, setGKind] = useState("الكل");
  const [gStatus, setGStatus] = useState("الكل");
  const [gFrom, setGFrom] = useState("");
  const [gTo, setGTo] = useState("");
  const balances = useMemo(() => {
    const map: Record<string, { dr: number; cr: number }> = {};
    (app.db.journals as any as Journal[]).filter((j) => j.status !== "ملغي").forEach((j) =>
      j.lines.forEach((l) => { map[l.account] = map[l.account] || { dr: 0, cr: 0 }; map[l.account].dr += l.debit * l.rate; map[l.account].cr += l.credit * l.rate; })
    );
    return map;
  }, [app.db.journals]);
  const bal = (code: string) => { const b = balances[code]; return b ? b.dr - b.cr : 0; };
  const sumType = (t: string) => posting.filter((a) => a.type === t).reduce((s, a) => s + bal(a.code), 0);
  const totalDr = Object.values(balances).reduce((a, b) => a + b.dr, 0);
  const totalCr = Object.values(balances).reduce((a, b) => a + b.cr, 0);
  const stmtLines = (app.db.journals as any as Journal[]).filter((j) => j.status !== "ملغي").flatMap((j) => j.lines.filter((l) => l.account === stmtAcc).map((l) => ({ ...l, no: j.no, date: j.date, desc: j.desc })));

  const titles: Record<string, [string, string, string]> = {
    stmt: ["تقرير كشف حساب", "كشف تفصيلي بحركات ورصيد أي حساب ترحيلي", "receipt"],
    trial: ["تقرير ميزان المراجعة", "توازن المدين والدائن لكل الحسابات حتى تاريخه", "scale"],
    bs: ["تقرير ميزان العمومية", "المركز المالي: الأصول مقابل الخصوم وحقوق الملكية", "shield"],
    pl: ["تقرير الأرباح والخسائر", "قائمة الدخل عن الفترة وفق معايير IFRS", "chart"],
    gljournal: ["تقرير حركة القيود", "جميع القيود المولّدة من النظام المحاسبي: يدوية وتلقائية، مرحّلة أو ملغاة", "book"],
  };
  const [t, d, ic] = titles[kind] || titles.trial;

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n={ic} size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">{t}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">{d}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => kind === "gljournal"
            ? app.exportCsv(t, [["التاريخ", "رقم القيد", "البيان", "النوع", "المصدر", "مدين", "دائن", "الحالة"], ...(app.db.journals as any as Journal[]).map((j) => [String(j.date), String(j.no), String(j.desc), String(j.kind), String(j.source || "—"), j.lines.reduce((x, l) => x + l.debit, 0), j.lines.reduce((x, l) => x + l.credit, 0), String(j.status)])])
            : app.exportCsv(t, [["الحساب", "مدين", "دائن"], ...posting.map((a) => [a.name, Math.max(0, bal(a.code)), Math.max(0, -bal(a.code))])])}><I n="xlsx" size={15} /> Excel</button>
          <button className="btn btn-soft" onClick={() => printGLReport(app, kind, { bal, sumType, stmtLines, stmtAcc, totalDr, totalCr, posting })}><I n="print" size={15} /> طباعة / PDF</button>
        </div>
      </div>

      {kind === "stmt" && (
        <div>
          <select className="select !w-80 mb-3.5" value={stmtAcc} onChange={(e) => setStmtAcc(e.target.value)}>
            {posting.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
          </select>
          <div className="card overflow-hidden">
            {stmtLines.length === 0 ? <Empty msg="لا توجد حركات على هذا الحساب خلال الفترة" /> : (
              <div className="overflow-x-auto"><table className="tbl min-w-[680px]">
                <thead><tr><th>التاريخ</th><th>القيد</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
                <tbody>{(() => { let run = 0; return stmtLines.map((l, i) => { run += (l.debit - l.credit) * l.rate; return (
                  <tr key={i}>
                    <td className="font-num">{app.fmtDate(l.date)}</td>
                    <td className="font-num" dir="ltr">{l.no}</td>
                    <td className="font-bold">{l.desc}{l.analytical && <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)] ms-1">{(app.db.analyticals.find((a: any) => a.id === l.analytical) as any)?.name}</span>}</td>
                    <td className="font-num">{l.debit ? app.fmtN(l.debit * l.rate) : "—"}</td>
                    <td className="font-num">{l.credit ? app.fmtN(l.credit * l.rate) : "—"}</td>
                    <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(run)}</td>
                  </tr>); }); })()}</tbody>
              </table></div>
            )}
          </div>
        </div>
      )}

      {kind === "gljournal" && (() => {
        const all = app.db.journals as any as Journal[];
        const rows = all.filter((j) =>
          (!gKind || gKind === "الكل" || j.kind === gKind) &&
          (!gStatus || gStatus === "الكل" || j.status === gStatus) &&
          (!gFrom || j.date >= gFrom) && (!gTo || j.date <= gTo) &&
          (!gq || j.no.toLowerCase().includes(gq.toLowerCase()) || j.desc.includes(gq) || (j.user || "").includes(gq))
        ).slice().reverse();
        const sumDr = rows.reduce((a, j) => a + (j.status === "ملغي" ? 0 : j.lines.reduce((x, l) => x + l.debit, 0)), 0);
        const sumCr = rows.reduce((a, j) => a + (j.status === "ملغي" ? 0 : j.lines.reduce((x, l) => x + l.credit, 0)), 0);
        const kinds = ["الكل", ...Array.from(new Set(all.map((j) => j.kind)))];
        return (
          <div>
            <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-2.5">
              <div className="relative w-64">
                <I n="search" size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
                <input className="input !ps-9 !py-2 !text-[0.78rem]" placeholder="رقم القيد / البيان / المستخدم…" value={gq} onChange={(e) => setGq(e.target.value)} />
              </div>
              <select className="select !w-40 !py-2 !text-[0.78rem]" value={gKind} onChange={(e) => setGKind(e.target.value)}>
                {kinds.map((k) => <option key={k}>{k}</option>)}
              </select>
              <select className="select !w-44 !py-2 !text-[0.78rem]" value={gStatus} onChange={(e) => setGStatus(e.target.value)}>
                {["الكل", "مرحّل", "بانتظار الموافقة", "ملغي"].map((k) => <option key={k}>{k}</option>)}
              </select>
              <input type="date" className="input !w-40 !py-2 !text-[0.76rem] font-num" value={gFrom} onChange={(e) => setGFrom(e.target.value)} />
              <span className="text-mute font-bold text-[0.72rem]">إلى</span>
              <input type="date" className="input !w-40 !py-2 !text-[0.76rem] font-num" value={gTo} onChange={(e) => setGTo(e.target.value)} />
              <span className="ms-auto chip bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)]">{rows.length} قيد</span>
            </div>
            <div className="card overflow-hidden">
              {rows.length === 0 ? <Empty msg="لا توجد قيود مطابقة للفلاتر — رحّل قيداً أو اضبط الفترة" /> : (
                <div className="overflow-x-auto"><table className="tbl min-w-[960px]">
                  <thead><tr><th>التاريخ</th><th>رقم القيد</th><th>البيان</th><th>النوع</th><th>المصدر</th><th>مدين</th><th>دائن</th><th>المستخدم</th><th>الحالة</th></tr></thead>
                  <tbody>
                    {rows.map((j) => {
                      const dr = j.lines.reduce((a, l) => a + l.debit, 0);
                      const cr = j.lines.reduce((a, l) => a + l.credit, 0);
                      const dead = j.status === "ملغي";
                      return (
                        <tr key={j.id} className={dead ? "opacity-50" : ""}>
                          <td className="font-num">{app.fmtDate(j.date)}</td>
                          <td className="font-num font-bold" dir="ltr">{j.no}</td>
                          <td className="font-bold max-w-[280px] truncate">{j.desc}</td>
                          <td><span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{j.kind}</span></td>
                          <td className="text-[0.72rem] font-bold text-mute">{j.source}</td>
                          <td className="font-num font-bold text-[var(--bad)]">{dead ? "—" : app.fmtN(dr)}</td>
                          <td className="font-num font-bold text-[var(--good)]">{dead ? "—" : app.fmtN(cr)}</td>
                          <td className="text-[0.72rem] font-bold">{j.user}</td>
                          <td><Chip s={j.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="!bg-[color-mix(in_srgb,var(--brand)_7%,transparent)]">
                      <td colSpan={5} className="font-display font-bold">الإجمالي ({rows.filter((j) => j.status !== "ملغي").length} قيد فعّال)</td>
                      <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(sumDr)}</td>
                      <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(sumCr)}</td>
                      <td colSpan={2} className="font-bold text-[var(--good)] text-[0.74rem]">{Math.abs(sumDr - sumCr) < 0.01 ? "متوازن ✓" : "غير متوازن"}</td>
                    </tr>
                  </tfoot>
                </table></div>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {[
                ["عدد القيود", String(rows.length), "book", "var(--brand)"],
                ["القيود المرحّلة", String(rows.filter((j) => j.status === "مرحّل").length), "check", "var(--good)"],
                ["بانتظار الموافقة", String(rows.filter((j) => j.status === "بانتظار الموافقة").length), "clock", "var(--warn)"],
                ["قيمة الحركات", app.fmtN(sumDr) + " ر.ي", "coins", "var(--accent)"],
              ].map(([l, v, ic, c]) => (
                <div key={l as string} className="card p-3.5 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c as string }}><I n={ic as string} size={17} /></span>
                  <div><div className="text-[0.64rem] font-bold text-mute">{l}</div><div className="font-num font-bold text-[0.95rem] mt-0.5">{v}</div></div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {kind === "trial" && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line bg-panel flex items-center justify-between">
            <h3 className="font-display font-bold text-sm">ميزان المراجعة — حتى 2026-03-29</h3>
            <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]"><I n="check" size={12} /> متوازن</span>
          </div>
          <div className="overflow-x-auto"><table className="tbl min-w-[640px]">
            <thead><tr><th>الكود</th><th>الحساب</th><th>التصنيف</th><th>مدين</th><th>دائن</th></tr></thead>
            <tbody>
              {posting.map((a) => { const b = bal(a.code); if (!b) return null; return (
                <tr key={a.code}>
                  <td className="font-num" dir="ltr">{a.code}</td>
                  <td className="font-bold">{a.name}</td>
                  <td><span className="chip bg-[color-mix(in_srgb,var(--mute)_14%,transparent)] text-[var(--soft)]">{a.type}</span></td>
                  <td className="font-num font-bold">{b > 0 ? app.fmtN(b) : "—"}</td>
                  <td className="font-num font-bold">{b < 0 ? app.fmtN(-b) : "—"}</td>
                </tr>); })}
              <tr className="!bg-[color-mix(in_srgb,var(--brand)_7%,transparent)]">
                <td colSpan={3} className="font-display font-bold">الإجمالي</td>
                <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(totalDr)}</td>
                <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(totalCr)}</td>
              </tr>
            </tbody>
          </table></div>
        </div>
      )}

      {kind === "bs" && (
        <div className="grid md:grid-cols-2 gap-4 stagger">
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="scale" size={18} className="text-[var(--brand)]" /> الأصول</h3>
            <div className="space-y-2">
              {posting.filter((a) => a.type === "أصول" && bal(a.code) !== 0).map((a) => (
                <div key={a.code} className="flex justify-between text-[0.8rem] font-bold border-b border-line/60 pb-2"><span>{a.name} <span className="font-num text-mute" dir="ltr">({a.code})</span></span><span className="font-num">{app.fmtN(bal(a.code))}</span></div>
              ))}
              <div className="flex justify-between font-display font-bold text-[var(--brand)] pt-1"><span>إجمالي الأصول</span><span className="font-num">{app.fmtN(sumType("أصول"))}</span></div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="shield" size={18} className="text-[var(--warn)]" /> الخصوم وحقوق الملكية</h3>
            <div className="space-y-2">
              {posting.filter((a) => a.type === "خصوم" && bal(a.code) !== 0).map((a) => (
                <div key={a.code} className="flex justify-between text-[0.8rem] font-bold border-b border-line/60 pb-2"><span>{a.name} <span className="font-num text-mute" dir="ltr">({a.code})</span></span><span className="font-num">{app.fmtN(-bal(a.code))}</span></div>
              ))}
              <div className="flex justify-between text-[0.8rem] font-bold border-b border-line/60 pb-2"><span>صافي ربح الفترة</span><span className="font-num text-[var(--good)]">{app.fmtN(-sumType("إيرادات") - sumType("مصروفات"))}</span></div>
              <div className="flex justify-between font-display font-bold text-[var(--warn)] pt-1"><span>الإجمالي</span><span className="font-num">{app.fmtN(-sumType("خصوم") + (-sumType("إيرادات") - sumType("مصروفات")))}</span></div>
            </div>
          </div>
        </div>
      )}

      {kind === "pl" && (
        <div className="card p-6 max-w-2xl mx-auto">
          <h3 className="font-display font-bold text-lg text-center mb-1">قائمة الدخل (الأرباح والخسائر)</h3>
          <p className="text-center text-[0.72rem] font-bold text-mute mb-5">عن الفترة من 2026-01-01 حتى 2026-03-29 — وفقاً لمعايير IFRS</p>
          {(() => {
            const rev = -sumType("إيرادات"); const exp = sumType("مصروفات"); const net = rev - exp;
            const rows: [string, number, string?][] = [
              ...posting.filter((a) => a.type === "إيرادات" && bal(a.code) !== 0).map((a) => [a.name, -bal(a.code), "rev"] as [string, number, string?]),
              ["إجمالي الإيرادات", rev, "tot"],
              ...posting.filter((a) => a.type === "مصروفات" && bal(a.code) !== 0).map((a) => [`(${a.name})`, -bal(a.code), "exp"] as [string, number, string?]),
              ["إجمالي المصروفات", -exp, "tot"],
              ["صافي الربح", net, "net"],
            ];
            return rows.map(([l, v, k], i) => (
              <div key={i} className={`flex justify-between py-2.5 border-b border-line/70 text-[0.85rem] font-bold ${k === "tot" ? "bg-panel -mx-3 px-3 rounded-lg !border-0" : ""} ${k === "net" ? "font-display text-lg !border-0" : ""}`}>
                <span className={k === "net" ? (v >= 0 ? "text-[var(--good)]" : "text-[var(--bad)]") : ""}>{l}</span>
                <span className={`font-num ${k === "net" ? (v >= 0 ? "text-[var(--good)]" : "text-[var(--bad)]") : k === "tot" ? "text-[var(--brand)]" : ""}`}>{app.fmtN(v)}</span>
              </div>
            ));
          })()}
          <div className="mt-4 text-center text-[0.72rem] font-bold text-mute">هامش صافي الربح: <span className="font-num text-[var(--good)]">{Math.round(((-sumType("إيرادات") - sumType("مصروفات")) / (-sumType("إيرادات") || 1)) * 100)}%</span></div>
        </div>
      )}
    </div>
  );
}

/* ── طباعة التقارير المالية (كشف حساب / ميزان مراجعة / عمومية / أرباح وخسائر) ── */
function printGLReport(app: ReturnType<typeof useApp>, kind: string, d: {
  bal: (c: string) => number; sumType: (t: string) => number; stmtLines: any[]; stmtAcc: string;
  totalDr: number; totalCr: number; posting: Account[];
}) {
  const { bal, sumType, stmtLines, stmtAcc, totalDr, totalCr, posting } = d;
  const user = app.session?.user || "—";
  const today = new Date().toLocaleDateString("en-GB");

  if (kind === "gljournal") {
    const all = app.db.journals as any as Journal[];
    const act = all.filter((j) => j.status !== "ملغي");
    const sumDr = act.reduce((a, j) => a + j.lines.reduce((x, l) => x + l.debit, 0), 0);
    const sumCr = act.reduce((a, j) => a + j.lines.reduce((x, l) => x + l.credit, 0), 0);
    openPrint(
      <ReportSheet title="تقرير حركة القيود" subtitle="جميع القيود المولّدة من النظام المحاسبي — يدوية وتلقائية — مرتبة زمنياً" user={user}
        filters={[["عدد القيود", String(all.length)], ["قيود فعّالة", String(act.length)], ["حتى تاريخ", today], ["حالة التوازن", Math.abs(sumDr - sumCr) < 0.01 ? "متوازن ✓" : "غير متوازن"]]}
        summary={[["إجمالي المدين", app.fmtN(sumDr)], ["إجمالي الدائن", app.fmtN(sumCr)], ["قيمة الحركات", app.fmtN(sumDr) + " ر.ي"]]}>
        <table className="p-table">
          <thead><tr><th>التاريخ</th><th>رقم القيد</th><th>البيان</th><th>النوع</th><th>المصدر</th><th>مدين</th><th>دائن</th><th>الحالة</th></tr></thead>
          <tbody>
            {all.slice().reverse().map((j) => (
              <tr key={j.id} style={j.status === "ملغي" ? { opacity: 0.5 } : undefined}>
                <td className="num">{j.date}</td>
                <td className="num">{j.no}</td>
                <td>{j.desc}</td>
                <td>{j.kind}</td>
                <td>{j.source}</td>
                <td className="num">{j.status === "ملغي" ? "—" : app.fmtN(j.lines.reduce((x, l) => x + l.debit, 0))}</td>
                <td className="num">{j.status === "ملغي" ? "—" : app.fmtN(j.lines.reduce((x, l) => x + l.credit, 0))}</td>
                <td>{j.status}</td>
              </tr>
            ))}
            <tr className="tot-row"><td colSpan={5}><b>الإجمالي ({act.length} قيد فعّال)</b></td><td className="num"><b>{app.fmtN(sumDr)}</b></td><td className="num"><b>{app.fmtN(sumCr)}</b></td><td><b>{Math.abs(sumDr - sumCr) < 0.01 ? "متوازن ✓" : ""}</b></td></tr>
          </tbody>
        </table>
      </ReportSheet>
    );
    return;
  }

  if (kind === "stmt") {
    const acc = app.accounts.find((a) => a.code === stmtAcc);
    let run = 0;
    openPrint(
      <ReportSheet title="تقرير كشف حساب" subtitle={`كشف تفصيلي بحركات ورصيد الحساب ${stmtAcc} — ${acc?.name || ""}`} user={user}
        filters={[["الحساب", `${stmtAcc} — ${acc?.name || ""}`], ["التصنيف", acc?.type || "—"], ["عدد الحركات", String(stmtLines.length)], ["حتى تاريخ", today]]}
        summary={[["الرصيد النهائي", app.fmtN(stmtLines.reduce((a, l) => a + (l.debit - l.credit) * l.rate, 0))]]}>
        <PTable head={["التاريخ", "القيد", "البيان", "مدين", "دائن", "الرصيد"]}
          rows={stmtLines.map((l) => { run += (l.debit - l.credit) * l.rate; return [
            <span className="num">{l.date}</span>, <span className="num">{l.no}</span>, l.desc,
            <span className="num">{l.debit ? app.fmtN(l.debit * l.rate) : "—"}</span>,
            <span className="num">{l.credit ? app.fmtN(l.credit * l.rate) : "—"}</span>,
            <span className="num"><b>{app.fmtN(run)}</b></span>]; })} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "trial") {
    openPrint(
      <ReportSheet title="تقرير ميزان المراجعة" subtitle="توازن المدين والدائن لجميع الحسابات الترحيلية حتى تاريخه" user={user}
        filters={[["عدد الحسابات", String(posting.filter((a) => bal(a.code) !== 0).length)], ["حتى تاريخ", today]]}
        summary={[["إجمالي المدين", app.fmtN(totalDr)], ["إجمالي الدائن", app.fmtN(totalCr)], ["حالة التوازن", Math.abs(totalDr - totalCr) < 0.01 ? "متوازن ✓" : "غير متوازن"]]}>
        <table className="p-table">
          <thead><tr><th>الكود</th><th>الحساب</th><th>التصنيف</th><th>مدين</th><th>دائن</th></tr></thead>
          <tbody>
            {posting.filter((a) => bal(a.code) !== 0).map((a) => { const b = bal(a.code); return (
              <tr key={a.code}><td className="num">{a.code}</td><td>{a.name}</td><td>{a.type}</td>
                <td className="num">{b > 0 ? app.fmtN(b) : "—"}</td><td className="num">{b < 0 ? app.fmtN(-b) : "—"}</td></tr>); })}
            <tr className="tot-row"><td colSpan={3}><b>الإجمالي</b></td><td className="num"><b>{app.fmtN(totalDr)}</b></td><td className="num"><b>{app.fmtN(totalCr)}</b></td></tr>
          </tbody>
        </table>
      </ReportSheet>
    );
    return;
  }

  if (kind === "bs") {
    const netIncome = -sumType("إيرادات") - sumType("مصروفات");
    openPrint(
      <ReportSheet title="تقرير الميزانية العمومية" subtitle="المركز المالي: الأصول مقابل الخصوم وحقوق الملكية" user={user}
        filters={[["حتى تاريخ", today], ["معيار العرض", "IFRS"]]}
        summary={[["إجمالي الأصول", app.fmtN(sumType("أصول"))], ["إجمالي الخصوم وحقوق الملكية", app.fmtN(-sumType("خصوم") + netIncome)], ["صافي ربح الفترة", app.fmtN(netIncome)]]}>
        <table className="p-table">
          <thead><tr><th>البند</th><th>الكود</th><th>القيمة</th></tr></thead>
          <tbody>
            <tr className="tot-row"><td colSpan={2}><b>الأصول</b></td><td className="num"><b>{app.fmtN(sumType("أصول"))}</b></td></tr>
            {posting.filter((a) => a.type === "أصول" && bal(a.code) !== 0).map((a) => (
              <tr key={a.code}><td style={{ paddingInlineStart: 18 }}>{a.name}</td><td className="num">{a.code}</td><td className="num">{app.fmtN(bal(a.code))}</td></tr>))}
            <tr className="tot-row"><td colSpan={2}><b>الخصوم وحقوق الملكية</b></td><td className="num"><b>{app.fmtN(-sumType("خصوم") + netIncome)}</b></td></tr>
            {posting.filter((a) => a.type === "خصوم" && bal(a.code) !== 0).map((a) => (
              <tr key={a.code}><td style={{ paddingInlineStart: 18 }}>{a.name}</td><td className="num">{a.code}</td><td className="num">{app.fmtN(-bal(a.code))}</td></tr>))}
            <tr><td style={{ paddingInlineStart: 18 }}><b>صافي ربح الفترة</b></td><td className="num">—</td><td className="num"><b>{app.fmtN(netIncome)}</b></td></tr>
          </tbody>
        </table>
      </ReportSheet>
    );
    return;
  }

  // pl
  const rev = -sumType("إيرادات"); const exp = sumType("مصروفات"); const net = rev - exp;
  openPrint(
    <ReportSheet title="تقرير الأرباح والخسائر (قائمة الدخل)" subtitle="عن الفترة من 2026-01-01 حتى 2026-03-29 — وفقاً لمعايير IFRS" user={user}
      filters={[["الفترة", "الربع الأول 2026"], ["معيار العرض", "IFRS"]]}
      summary={[["إجمالي الإيرادات", app.fmtN(rev)], ["إجمالي المصروفات", app.fmtN(exp)], ["صافي الربح", app.fmtN(net)], ["هامش الربح", `${Math.round((net / (rev || 1)) * 100)}%`]]}>
      <table className="p-table">
        <thead><tr><th>البند</th><th>القيمة</th></tr></thead>
        <tbody>
          <tr className="tot-row"><td><b>الإيرادات</b></td><td className="num"><b>{app.fmtN(rev)}</b></td></tr>
          {posting.filter((a) => a.type === "إيرادات" && bal(a.code) !== 0).map((a) => (
            <tr key={a.code}><td style={{ paddingInlineStart: 18 }}>{a.name}</td><td className="num">{app.fmtN(-bal(a.code))}</td></tr>))}
          <tr className="tot-row"><td><b>المصروفات</b></td><td className="num"><b>({app.fmtN(exp)})</b></td></tr>
          {posting.filter((a) => a.type === "مصروفات" && bal(a.code) !== 0).map((a) => (
            <tr key={a.code}><td style={{ paddingInlineStart: 18 }}>({a.name})</td><td className="num">({app.fmtN(bal(a.code))})</td></tr>))}
          <tr className="tot-row"><td><b>صافي الربح</b></td><td className="num"><b>{app.fmtN(net)}</b></td></tr>
        </tbody>
      </table>
    </ReportSheet>
  );
}
