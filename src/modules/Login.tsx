import { useEffect, useState } from "react";
import { useApp } from "../store";
import { I, LogoMark } from "../ui";
import { SYSTEM } from "../data";

export const LOGIN_BGS = [
  { id: "sea", name: "أعماق المحيط (افتراضي)", style: "linear-gradient(165deg,#041e33,#07405f 38%,#0a6b9e 72%,#0e8fc4)" },
  { id: "abyss", name: "الليل القطبي", style: "linear-gradient(165deg,#02060f,#0a1626 45%,#123051)" },
  { id: "royal", name: "النيلي الملكي", style: "linear-gradient(165deg,#0d0f33,#232a75 55%,#3d35b4)" },
  { id: "dusk", name: "الغروب الذهبي", style: "linear-gradient(165deg,#1c1204,#4a3310 50%,#8a6420 90%)" },
  { id: "emerald", name: "الزمردي", style: "linear-gradient(165deg,#02170f,#06402d 55%,#0e6e52)" },
];

const YEARS = ["2026", "2025", "2024"];

export default function Login() {
  const app = useApp();
  const { login, toast, prefs } = app;
  const bgStyle = LOGIN_BGS.find((b) => b.id === prefs.loginBg)?.style;
  /* قائمة الشركات النشطة من سجل الشركات (الإعدادات ← الشركات والفروع) — إضافة/حذف تنعكس فوراً */
  const companies = (app.db.companies || []).filter((c) => String(c.active) === "true").map((c) => c.name);
  const companyList = companies.length ? companies : [app.settings.company?.name || "شركتي"];
  /* قائمة الفروع من سجل الفروع */
  const branches = (app.db.branches || []).map((b) => b.name);
  const branchList = branches.length ? branches : ["المركز الرئيسي"];
  const [f, setF] = useState({ company: companyList[0], branch: branchList[0], user: "admin", pass: "", year: "2026" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.user.trim()) e.user = "اسم المستخدم إلزامي";
    if (!f.pass) e.pass = "كلمة السر إلزامية";
    else if (f.pass.length < 4) e.pass = "كلمة السر قصيرة — 4 رموز على الأقل";
    setErrs(e);
    if (Object.keys(e).length) { toast("تعذّر الدخول — أكمل الحقول المميّزة", "err"); return; }
    setLoading(true);
    setTimeout(() => {
      login({ company: f.company, branch: f.branch, user: f.user === "admin" ? "م.وائل الشرفي" : f.user, year: f.year, role: f.user === "admin" ? "مدير النظام" : "محاسب رئيسي" });
      toast(`مرحباً بك في ${SYSTEM.name} — تم فتح السنة المالية ${f.year}`, "ok");
    }, 1100);
  };

  const features = [
    ["pulse", "مزامنة مركزية لحظية"],
    ["book", "قيد مزدوج متعدد العملات"],
    ["layers", "دليل حسابات 5 مستويات"],
    ["shield", "صلاحيات على 4 مستويات"],
    ["print", "طباعة A4 احترافية"],
    ["db", "قاعدة بيانات تكيفية"],
  ] as const;

  const counters = [
    ["21", "نظاماً متخصصاً"],
    ["10", "أنظمة أساسية"],
    ["40+", "شاشة وتقرير"],
    ["100", "مستخدم متزامن"],
  ] as const;

  /* شارة المميزات المتبدلة — قوة النظام لا عملاؤه */
  const MERITS = [
    "مزامنة لحظية: ما يدخله الكاشير يظهر للمدير خلال ثوانٍ",
    "قيد مزدوج متوازن يرفض أي قيد غير متطابق",
    "إقفال فترات مالية محصّن ضد أي تعديل",
    "حسابات تحليلية بلا تضخيم لدليل الحسابات",
    "ترحيل تلقائي: كل فاتورة تولّد قيدها فوراً",
    "طباعة A4 احترافية لكل سند وتقرير",
    "نسخ احتياطي واستعادة تنتشر لكل الأجهزة",
    "صلاحيات دقيقة على مستوى النظام والشاشة والزر",
  ];
  const [actIdx, setActIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActIdx((i) => (i + 1) % MERITS.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 text-white" dir="rtl" style={{ background: bgStyle }}>
      {/* خلفية حية */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="absolute rounded-full border border-white/[0.07] anim-ring"
            style={{ width: `${280 + i * 160}px`, height: `${280 + i * 160}px`, top: "12%", insetInlineStart: "-6%", animationDelay: `${i * 1.4}s` }} />
        ))}
        {[...Array(14)].map((_, i) => (
          <span key={`p${i}`} className="absolute rounded-full bg-white/20 anim-float"
            style={{ width: `${3 + (i % 4)}px`, height: `${3 + (i % 4)}px`, top: `${(i * 37) % 100}%`, insetInlineStart: `${(i * 53) % 100}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${8 + (i % 5)}s` }} />
        ))}
        <svg className="absolute bottom-0 inset-x-0 w-[200%] h-40 text-white/[0.06] wave-track" style={{ animationDuration: "30s" }} viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C160,20 320,100 480,60 C640,20 800,100 960,60 C1120,20 1280,100 1440,60 L1440,120 L0,120 Z" fill="currentColor" />
        </svg>
        <svg className="absolute bottom-0 inset-x-0 w-[200%] h-28 text-white/[0.08] wave-track" style={{ animationDuration: "19s", animationDirection: "reverse" }} viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,70 C180,30 340,110 520,70 C700,30 860,110 1040,70 C1220,30 1360,100 1440,70 L1440,120 L0,120 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-[1.05fr_1fr] rounded-[22px] overflow-hidden shadow-2xl anim-rise" style={{ background: "rgba(3,20,35,0.55)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.14)" }}>
        {/* التعريف بالنظام — بيانات القوة والمميزات */}
        <div className="p-8 md:p-9 hidden lg:flex flex-col justify-between border-e border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark size={54} variant="glass" />
              <div>
                <div className="font-display font-bold text-[1.5rem] leading-tight">{SYSTEM.name}</div>
                <div className="text-[0.62rem] font-bold text-white/60 tracking-[0.16em] font-num" dir="ltr">INTEGRATED FINANCIAL SYSTEM</div>
              </div>
            </div>

            <h1 className="font-display font-bold text-[1.5rem] leading-9 mt-6">
              منصة محاسبية إنتاجية واحدة
              <span className="block text-[#7fd8ff]">تتكيف مع كل أنشطة الأعمال</span>
            </h1>
            <p className="mt-2.5 text-[0.85rem] leading-7 text-white/75 font-medium">
              نظام محاسبي متكامل شامل لا يعرف حدود القطاع… يصلح لجميع الأنشطة التجارية والخدمية
              والمصنعية والطبية، ومزامنته الفورية، وتقاريره وفق أرقى المعايير العالمية، وقاعدة
              بياناته التي تتنفس مرونة… كأنما خُلق خصيصاً لعالمك.
            </p>

            {/* مؤشرات القوة */}
            <div className="mt-5 grid grid-cols-4 gap-2.5">
              {counters.map(([v, l], i) => (
                <div key={l} className="rounded-xl bg-white/[0.07] border border-white/10 px-2 py-3 text-center anim-rise" style={{ animationDelay: `${150 + i * 80}ms` }}>
                  <div className="font-num font-bold text-[1.3rem] text-[#7fd8ff] leading-none">{v}</div>
                  <div className="text-[0.6rem] font-bold text-white/60 mt-1.5">{l}</div>
                </div>
              ))}
            </div>

            {/* المميزات */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {features.map(([ic, l], i) => (
                <div key={l} className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] border border-white/10 px-3 py-2.5 anim-rise" style={{ animationDelay: `${220 + i * 70}ms` }}>
                  <span className="w-8 h-8 rounded-lg grid place-items-center bg-white/10 text-[#67d5ff] shrink-0"><I n={ic} size={15} /></span>
                  <span className="text-[0.72rem] font-bold text-white/85">{l}</span>
                </div>
              ))}
            </div>

            {/* شارة الميزة المتبدلة — تدور على مميزات النظام */}
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 overflow-hidden">
              <span className="relative grid h-8 w-8 place-items-center shrink-0">
                <span className="absolute inset-0 rounded-full bg-[#7fd8ff]/30 anim-ring" />
                <I n="check" size={15} className="text-[#7fd8ff] relative" />
              </span>
              <div className="text-[0.72rem] font-bold text-white/70 leading-5">
                <span className="text-[#7fd8ff]">لماذا نحن؟</span>{" "}
                <span key={actIdx} className="text-white anim-fadein inline-block">{MERITS[actIdx]}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[0.68rem] font-bold text-white/60 mt-7">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] blink" />
            خادم قاعدة البيانات يعمل • آخر نسخة احتياطية 02:00
            <span className="ms-auto flex items-center gap-3">
              <span className="font-num flex items-center gap-1.5" dir="ltr"><I n="phone" size={13} /> {SYSTEM.phone}</span>
              <a href={SYSTEM.site} target="_blank" rel="noreferrer" className="font-num text-[#7fd8ff] hover:underline" dir="ltr">okyanus-soft.com</a>
            </span>
          </div>
        </div>

        {/* نموذج الدخول */}
        <div className="p-7 md:p-10">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <LogoMark size={42} variant="glass" />
            <div><div className="font-display font-bold text-xl">{SYSTEM.name}</div><div className="text-[0.62rem] font-bold text-white/60">{SYSTEM.company} — {SYSTEM.companyEn}</div></div>
          </div>
          <h2 className="font-display font-bold text-2xl">تسجيل الدخول</h2>
          <p className="text-white/60 text-[0.8rem] font-bold mt-1">ادخل بيانات منشأتك لفتح السنة المالية</p>

          <div className="mt-6 space-y-3.5">
            <div>
              <label className="text-[0.74rem] font-bold text-white/75 flex items-center gap-1.5 mb-1.5"><I n="bld" size={14} /> الشركة</label>
              <select className="select !bg-white/[0.08] !border-white/15 !text-white [&>option]:text-black" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })}>
                {companyList.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.74rem] font-bold text-white/75 flex items-center gap-1.5 mb-1.5"><I n="globe" size={14} /> الفرع</label>
                <select className="select !bg-white/[0.08] !border-white/15 !text-white [&>option]:text-black" value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })}>
                  {branchList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.74rem] font-bold text-white/75 flex items-center gap-1.5 mb-1.5"><I n="cal" size={14} /> السنة المالية</label>
                <select className="select !bg-white/[0.08] !border-white/15 !text-white font-num [&>option]:text-black" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })}>
                  {YEARS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[0.74rem] font-bold text-white/75 flex items-center gap-1.5 mb-1.5"><I n="user" size={14} /> اسم المستخدم</label>
              <input className={`input !bg-white/[0.08] !border-white/15 !text-white placeholder:text-white/35 ${errs.user ? "!border-[#ff9d9d]" : ""}`} dir="ltr" value={f.user} onChange={(e) => setF({ ...f, user: e.target.value })} placeholder="admin" />
              {errs.user && <span className="text-[0.66rem] font-bold text-[#ff9d9d] mt-1 block">{errs.user}</span>}
            </div>
            <div>
              <label className="text-[0.74rem] font-bold text-white/75 flex items-center gap-1.5 mb-1.5"><I n="key" size={14} /> كلمة السر</label>
              <input type="password" className={`input !bg-white/[0.08] !border-white/15 !text-white placeholder:text-white/35 ${errs.pass ? "!border-[#ff9d9d]" : ""}`} dir="ltr" value={f.pass} onChange={(e) => setF({ ...f, pass: e.target.value })} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submit()} />
              {errs.pass ? <span className="text-[0.66rem] font-bold text-[#ff9d9d] mt-1 block">{errs.pass}</span>
                : <span className="text-[0.64rem] font-bold text-white/45 mt-1 block">للتجربة: أي كلمة من 4 رموز فأكثر</span>}
            </div>
            <button onClick={submit} disabled={loading}
              className="w-full py-3.5 rounded-xl font-display font-bold text-[1.02rem] text-[#03283e] transition-all hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: "linear-gradient(120deg, #67d5ff, #a5e6ff)" }}>
              {loading ? <><span className="w-4 h-4 rounded-full border-2 border-[#03283e]/30 border-t-[#03283e] spin" /> جارٍ فتح النظام…</> : <><I n="out" size={18} className="rotate-180" /> دخول النظام</>}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[0.66rem] font-bold text-white/50">
            <span>{SYSTEM.company} — {SYSTEM.companyEn}</span>
            <a href={SYSTEM.site} target="_blank" rel="noreferrer" className="text-[#67d5ff] hover:underline font-num" dir="ltr">{SYSTEM.site}</a>
            <span className="font-num" dir="ltr">{SYSTEM.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
