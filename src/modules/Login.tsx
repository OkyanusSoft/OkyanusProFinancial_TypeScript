import { useState } from "react";
import { useApp } from "../store";
import { I } from "../ui";

export const LOGIN_BGS = [
  { id: "sea", name: "أعماق المحيط (افتراضي)", style: "linear-gradient(165deg,#041e33,#07405f 38%,#0a6b9e 72%,#0e8fc4)" },
  { id: "abyss", name: "الليل القطبي", style: "linear-gradient(165deg,#02060f,#0a1626 45%,#123051)" },
  { id: "royal", name: "النيلي الملكي", style: "linear-gradient(165deg,#0d0f33,#232a75 55%,#3d35b4)" },
  { id: "dusk", name: "الغروب الذهبي", style: "linear-gradient(165deg,#1c1204,#4a3310 50%,#8a6420 90%)" },
  { id: "emerald", name: "الزمردي", style: "linear-gradient(165deg,#02170f,#06402d 55%,#0e6e52)" },
];

const COMPANIES = ["شركة أوكيانوس للتجارة والاستثمار", "مستشفى أوكيانوس التخصصي", "مجموعة المحيط الطبية"];
const BRANCHES: Record<string, string[]> = {
  "شركة أوكيانوس للتجارة والاستثمار": ["المركز الرئيسي — صنعاء", "فرع عدن", "فرع المكلا"],
  "مستشفى أوكيانوس التخصصي": ["المبنى الرئيسي — حدة", "مركز الأطراف الصناعية"],
  "مجموعة المحيط الطبية": ["الإدارة العامة", "فرع تعز"],
};

function WaveLayer({ opacity, dur, flip = false }: { opacity: number; dur: number; flip?: boolean }) {
  const d = "M0,60 C120,20 240,100 360,60 C480,20 600,100 720,60 C840,20 960,100 1080,60 C1200,20 1320,100 1440,60 L1440,140 L0,140 Z";
  return (
    <svg className="absolute bottom-0 left-0 w-[200%] h-40 wave-track" style={{ animationDuration: `${dur}s`, opacity, transform: flip ? "scaleY(-1) translateY(-100%)" : undefined }} viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export default function Login() {
  const { login, toast, pushNotif, prefs } = useApp();
  const bgStyle = LOGIN_BGS.find((b) => b.id === prefs.loginBg)?.style;
  const [company, setCompany] = useState(COMPANIES[0]);
  const [branch, setBranch] = useState(BRANCHES[COMPANIES[0]][0]);
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("");
  const [year, setYear] = useState("2026");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!user.trim()) return setErr("اسم المستخدم مطلوب");
    if (pass.length < 4) return setErr("كلمة المرور يجب ألا تقل عن 4 أحرف (للتجربة: 1234)");
    setBusy(true);
    setTimeout(() => {
      login({ user: user === "admin" ? "م. أروى المقطري" : user, role: user === "admin" ? "مدير النظام" : "محاسب", company, branch, year });
      toast(`مرحباً بك في ${company} — السنة المالية ${year}`, "ok");
      pushNotif({ kind: "info", title: "جلسة جديدة", body: `تسجيل دخول ناجح من ${branch}.` });
    }, 1100);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 text-white" dir="rtl" style={{ background: bgStyle }}>
      {/* حلقات السونار */}
      <div className="absolute top-1/4 start-1/4 pointer-events-none" aria-hidden="true">
        {[0, 0.8, 1.6].map((d) => (
          <span key={d} className="sonar absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/25" style={{ width: 340, height: 340, animationDelay: `${d}s` }} />
        ))}
      </div>
      {/* جسيمات عائمة */}
      {[
        [12, 22, 10], [78, 16, 14], [88, 60, 8], [20, 74, 12], [55, 88, 9], [66, 34, 7], [8, 48, 8], [38, 12, 6],
      ].map(([x, y, s], i) => (
        <span key={i} className="drift absolute rounded-full bg-cyan-100/20 pointer-events-none" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDelay: `${i * 0.7}s` }} aria-hidden="true" />
      ))}
      {/* أمواج متحركة */}
      <div className="absolute bottom-0 inset-x-0 text-cyan-300/15 pointer-events-none" aria-hidden="true"><WaveLayer opacity={1} dur={22} /></div>
      <div className="absolute bottom-0 inset-x-0 text-cyan-200/20 pointer-events-none" aria-hidden="true"><WaveLayer opacity={1} dur={15} /></div>
      <div className="absolute -bottom-2 inset-x-0 text-[#04121f]/60 pointer-events-none" aria-hidden="true"><WaveLayer opacity={1} dur={10} /></div>

      <div className="relative w-full max-w-4xl grid md:grid-cols-[1.1fr_1fr] card overflow-hidden !bg-[#062338]/80 backdrop-blur-md border-cyan-200/15 shadow-[0_40px_90px_-30px_rgba(0,10,30,0.8)] anim-pop" style={{ borderRadius: 20 }}>
        {/* اللوحة التعريفية */}
        <div className="hidden md:flex flex-col justify-between p-9 relative overflow-hidden border-e border-cyan-200/10">
          <div className="absolute -bottom-24 -start-24 w-72 h-72 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" aria-hidden="true" />
          <div>
            <svg width="58" height="58" viewBox="0 0 48 48" aria-hidden="true" className="mb-6">
              <rect width="48" height="48" rx="13" fill="rgba(255,255,255,0.1)" />
              <path d="M8 28c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#67d5ff" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M8 19c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#a5e6ff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
              <circle cx="37" cy="13" r="3" fill="#ffd28a" />
            </svg>
            <h1 className="font-display font-bold text-[1.9rem] leading-snug">
              نظام محاسبي واحد…<br />
              <span className="text-cyan-300">بحجم محيطٍ من البيانات</span>
            </h1>
            <p className="text-cyan-100/65 text-sm font-medium leading-7 mt-3">
              قيد مزدوج دقيق، فترات مالية محصّنة، حسابات تحليلية ذكية، وخمسة أنماط مظهر — كل ذلك في OkyanusProERP 3.0.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["6", "وحدات مترابطة"], ["5", "مستويات حسابات"], ["IFRS", "معايير دولية"]].map(([a, b]) => (
              <div key={b} className="rounded-xl bg-white/[0.05] border border-white/10 py-3">
                <div className="font-num font-bold text-xl text-cyan-300">{a}</div>
                <div className="text-[0.66rem] font-bold text-cyan-100/60 mt-0.5">{b}</div>
              </div>
            ))}
          </div>
        </div>

        {/* نموذج الدخول */}
        <form onSubmit={submit} className="p-7 md:p-9 bg-[#f6fbff] !text-[#0b2239]" dir="rtl">
          <div className="md:hidden mb-5"><svg width="40" height="40" viewBox="0 0 48 48"><rect width="48" height="48" rx="13" fill="#0b4f7a" /><path d="M8 28c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#67d5ff" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M8 19c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#a5e6ff" strokeWidth="3" fill="none" strokeLinecap="round" /></svg></div>
          <h2 className="font-display font-bold text-xl">تسجيل الدخول إلى النظام</h2>
          <p className="text-[0.78rem] text-mute font-medium mb-5">أدخل بيانات المنشأة والفرع للوصول إلى بيئة العمل</p>

          <div className="space-y-3.5">
            <label className="block">
              <span className="text-[0.74rem] font-bold text-soft flex items-center gap-1.5 mb-1"><I n="bld" size={14} /> اسم الشركة</span>
              <select className="select" value={company} onChange={(e) => { setCompany(e.target.value); setBranch(BRANCHES[e.target.value][0]); }}>
                {COMPANIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[0.74rem] font-bold text-soft flex items-center gap-1.5 mb-1"><I n="globe" size={14} /> الفرع</span>
                <select className="select" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  {BRANCHES[company].map((b) => <option key={b}>{b}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[0.74rem] font-bold text-soft flex items-center gap-1.5 mb-1"><I n="cal" size={14} /> السنة المالية</span>
                <select className="select" value={year} onChange={(e) => setYear(e.target.value)}>
                  {["2024", "2025", "2026"].map((y) => <option key={y}>{y}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-[0.74rem] font-bold text-soft flex items-center gap-1.5 mb-1"><I n="user" size={14} /> اسم المستخدم</span>
              <input className="input font-num" dir="ltr" style={{ textAlign: "left" }} value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" />
            </label>
            <label className="block">
              <span className="text-[0.74rem] font-bold text-soft flex items-center gap-1.5 mb-1"><I n="lock" size={14} /> كلمة المرور</span>
              <div className="relative">
                <input className="input font-num" dir="ltr" style={{ textAlign: "left", paddingInlineEnd: "2.6rem" }} type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" />
                <button type="button" onClick={() => setShow(!show)} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-mute hover:text-[var(--brand)] transition-colors" aria-label="إظهار كلمة المرور">
                  <I n="eye" size={17} />
                </button>
              </div>
            </label>
          </div>

          {err && (
            <div className="mt-3 flex items-center gap-2 text-[0.76rem] font-bold text-[var(--bad)] bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] rounded-lg px-3 py-2 anim-pop">
              <I n="alert" size={15} /> {err}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-brand w-full mt-5 !py-3 !text-[0.95rem]">
            {busy ? (<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full spin" /> جارٍ التحقق من الصلاحيات…</>) : (<><I n="key" size={17} /> دخول النظام</>)}
          </button>

          <div className="mt-4 flex items-center justify-between text-[0.7rem] font-bold text-mute">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--good)] blink" /> خادم MySQL متصل — زمن الاستجابة 4ms</span>
            <span className="font-num" dir="ltr">v3.0.0 build 2026.03</span>
          </div>
        </form>
      </div>

      <div className="absolute bottom-3 inset-x-0 text-center text-[0.68rem] font-bold text-cyan-100/50 z-10">
        جميع الحقوق محفوظة لدى شركة أوكيانوس سوفت — Okyanus Soft •{" "}
        <a href="https://okyanussoft.online/" target="_blank" rel="noreferrer" className="text-cyan-200 hover:text-white transition-colors underline underline-offset-2">okyanussoft.online</a>
      </div>
    </div>
  );
}
