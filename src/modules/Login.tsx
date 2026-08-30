import { useMemo, useState } from "react";
import { useApp } from "../store";
import { I } from "../ui";
import { SYSTEM } from "../data";

export const LOGIN_BGS = [
  { id: "sea", name: "أعماق المحيط (افتراضي)", style: "linear-gradient(165deg,#041e33,#07405f 38%,#0a6b9e 72%,#0e8fc4)" },
  { id: "abyss", name: "الليل القطبي", style: "linear-gradient(165deg,#02060f,#0a1626 45%,#123051)" },
  { id: "royal", name: "النيلي الملكي", style: "linear-gradient(165deg,#0d0f33,#232a75 55%,#3d35b4)" },
  { id: "dusk", name: "الغروب الذهبي", style: "linear-gradient(165deg,#1c1204,#4a3310 50%,#8a6420 90%)" },
  { id: "emerald", name: "الزمردي", style: "linear-gradient(165deg,#02170f,#06402d 55%,#0e6e52)" },
];

const COMPANIES = ["شركة أوكيانوس للتجارة والاستثمار", "مستشفى أوكيانوس التخصصي", "مجموعة المحيط الطبية"];
const BRANCHES = ["المركز الرئيسي — صنعاء", "فرع عدن", "فرع المكلا"];
const YEARS = ["2026", "2025", "2024"];

export default function Login() {
  const { login, toast, prefs } = useApp();
  const bgStyle = LOGIN_BGS.find((b) => b.id === prefs.loginBg)?.style;
  const [f, setF] = useState({ company: COMPANIES[0], branch: BRANCHES[0], user: "admin", pass: "", year: "2026" });
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
      login({ company: f.company, branch: f.branch, user: f.user === "admin" ? "م. أروى المقطري" : f.user, year: f.year, role: f.user === "admin" ? "مدير النظام" : "محاسب رئيسي" });
      toast(`مرحباً بك في ${SYSTEM.name} — تم فتح السنة المالية ${f.year}`, "ok");
    }, 1100);
  };

  const features = useMemo(() => [
    ["book", "قيد مزدوج متعدد العملات"],
    ["box", "مخازن وجرود فورية"],
    ["scale", "تقارير IFRS جاهزة"],
    ["shield", "صلاحيات على مستوى الزر"],
  ], []);

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
        {/* التعريف بالنظام */}
        <div className="p-8 md:p-10 hidden lg:flex flex-col justify-between border-e border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true">
                <rect width="48" height="48" rx="13" fill="rgba(255,255,255,0.12)" />
                <path d="M8 28c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#67d5ff" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M8 19c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#a5e6ff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
                <circle cx="37" cy="13" r="3" fill="#ffd28a" />
              </svg>
              <div>
                <div className="font-display font-bold text-[1.65rem] leading-tight">{SYSTEM.name}</div>
                <div className="text-[0.7rem] font-bold text-white/60 tracking-wide">{SYSTEM.en} • v{SYSTEM.version}</div>
              </div>
            </div>
            <p className="mt-6 text-[0.9rem] leading-7 text-white/80 font-medium">
              نظام مالي ومخزني متكامل بقيد مزدوج محكم، ودليل حسابات هرمي من خمسة مستويات،
              وحسابات تحليلية للأنشطة الكبيرة — من سند التوريد إلى قائمة الدخل.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {features.map(([ic, l], i) => (
                <div key={l} className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] border border-white/10 px-3.5 py-3 anim-rise" style={{ animationDelay: `${200 + i * 90}ms` }}>
                  <span className="w-8 h-8 rounded-lg grid place-items-center bg-white/10 text-[#67d5ff] shrink-0"><I n={ic} size={16} /></span>
                  <span className="text-[0.76rem] font-bold text-white/85">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-[0.72rem] font-bold text-white/60 mt-8">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] blink" />
            خادم قاعدة البيانات يعمل • آخر نسخة احتياطية 02:00 اليوم
            <span className="ms-auto font-num flex items-center gap-1.5" dir="ltr"><I n="phone" size={13} /> {SYSTEM.phone}</span>
          </div>
        </div>

        {/* نموذج الدخول */}
        <div className="p-7 md:p-10">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="rgba(255,255,255,0.12)" /><path d="M8 28c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#67d5ff" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M8 19c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#a5e6ff" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
            <div><div className="font-display font-bold text-xl">{SYSTEM.name}</div><div className="text-[0.62rem] font-bold text-white/60">{SYSTEM.company} — {SYSTEM.companyEn}</div></div>
          </div>
          <h2 className="font-display font-bold text-2xl">تسجيل الدخول</h2>
          <p className="text-white/60 text-[0.8rem] font-bold mt-1">ادخل بيانات منشأتك لفتح السنة المالية</p>

          <div className="mt-6 space-y-3.5">
            <div>
              <label className="text-[0.74rem] font-bold text-white/75 flex items-center gap-1.5 mb-1.5"><I n="bld" size={14} /> الشركة</label>
              <select className="select !bg-white/[0.08] !border-white/15 !text-white [&>option]:text-black" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })}>
                {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.74rem] font-bold text-white/75 flex items-center gap-1.5 mb-1.5"><I n="globe" size={14} /> الفرع</label>
                <select className="select !bg-white/[0.08] !border-white/15 !text-white [&>option]:text-black" value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })}>
                  {BRANCHES.map((c) => <option key={c} value={c}>{c}</option>)}
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
