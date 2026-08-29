import { useEffect, useRef, useState } from "react";
import { AppProvider, useApp } from "./store";
import { I, Logo } from "./ui";
import Login from "./modules/Login";
import Dashboard from "./modules/Dashboard";
import Inventory from "./modules/Inventory";
import { Purchases, Sales } from "./modules/Trade";
import GL from "./modules/GL";
import Admin from "./modules/Admin";
import Help from "./modules/Help";

const NAV = [
  { id: "dashboard", label: "لوحة التحكم", icon: "dash", subs: [] as string[] },
  { id: "inventory", label: "المخازن", icon: "box", subs: ["البيانات الأساسية", "الحركات", "التقارير"] },
  { id: "purchases", label: "المشتريات", icon: "truck", subs: ["الموردون", "الفواتير", "التقارير"] },
  { id: "sales", label: "المبيعات", icon: "tag", subs: ["العملاء", "الفواتير", "التقارير"] },
  { id: "gl", label: "الحسابات العامة", icon: "book", subs: ["الأدلة والفترات", "القيود", "التقارير المالية"] },
  { id: "admin", label: "إدارة النظام", icon: "shield", subs: ["المستخدمون", "الإعدادات", "قاعدة البيانات"] },
  { id: "help", label: "المساعدة", icon: "life", subs: [] as string[] },
];
const SUB_TAB: Record<string, string[]> = {
  inventory: ["base", "moves", "reports"],
  purchases: ["base", "moves", "reports"],
  sales: ["base", "moves", "reports"],
  gl: ["base", "moves", "reports"],
  admin: ["users", "settings", "database"],
};

function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-5 start-5 z-[100] space-y-2 max-w-[min(92vw,380px)]">
      {toasts.map((t) => (
        <div key={t.id} className={`anim-slidein card !rounded-xl px-4 py-3 flex items-start gap-2.5 shadow-xl border-s-4 ${
          t.kind === "ok" ? "!border-s-[var(--good)]" : t.kind === "err" ? "!border-s-[var(--bad)]" : "!border-s-[var(--brand)]"}`}
          style={{ background: "var(--surface)" }}>
          <span className={`mt-0.5 shrink-0 ${t.kind === "ok" ? "text-[var(--good)]" : t.kind === "err" ? "text-[var(--bad)]" : "text-[var(--brand)]"}`}>
            <I n={t.kind === "ok" ? "check" : t.kind === "err" ? "alert" : "info"} size={17} />
          </span>
          <p className="text-[0.8rem] font-bold leading-5">{t.msg}</p>
        </div>
      ))}
    </div>
  );
}

function NotifBell() {
  const { notifs, markNotifs } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative w-9 h-9 grid place-items-center rounded-lg text-soft hover:bg-panel hover:text-[var(--brand)] transition-colors" aria-label="الإشعارات">
        <I n="bell" size={19} />
        {notifs.length > 0 && <span className="absolute top-1 end-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--bad)] text-white text-[0.6rem] font-num font-bold grid place-items-center">{notifs.length}</span>}
      </button>
      {open && (
        <div className="absolute top-11 end-0 w-80 card anim-pop z-50 overflow-hidden" dir="rtl">
          <div className="px-4 py-3 border-b border-line bg-panel flex items-center justify-between">
            <span className="font-display font-bold text-sm">الإشعارات ({notifs.length})</span>
            <button className="text-[0.7rem] font-bold text-[var(--brand)] hover:underline" onClick={() => { markNotifs(); setOpen(false); }}>تحديد الكل كمقروء</button>
          </div>
          <div className="max-h-72 overflow-auto">
            {notifs.length === 0 && <p className="p-6 text-center text-[0.78rem] font-bold text-mute">لا إشعارات جديدة — كل شيء تحت السيطرة</p>}
            {notifs.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-line/60 last:border-0 hover:bg-panel transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${n.kind === "bad" ? "bg-[var(--bad)]" : n.kind === "warn" ? "bg-[var(--warn)]" : "bg-[var(--brand)]"}`} />
                  <span className="font-bold text-[0.8rem] flex-1">{n.title}</span>
                  <span className="text-[0.62rem] font-bold text-mute shrink-0">{n.time}</span>
                </div>
                <p className="text-[0.72rem] text-mute font-medium mt-1 leading-5">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Shell() {
  const app = useApp();
  const { session, route, nav, prefs, setPrefs } = app;
  const [collapsed, setCollapsed] = useState(false);
  const [openSec, setOpenSec] = useState<string>(route.module);
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [route.module, route.tab]);

  if (!session) return <><Login /><Toasts /></>;

  const bg = app.sidebarBgs.find((b) => b.id === prefs.sidebarBg)?.style;
  const current = NAV.find((n) => n.id === route.module);
  const pageLabel = current?.label || "";

  return (
    <div className="min-h-screen ambient relative">
      <div className="relative z-10 flex min-h-screen">
        {/* ═══ الشريط الجانبي ═══ */}
        <aside className={`side-gradient relative text-[var(--sideink)] flex flex-col shrink-0 transition-all duration-300 sticky top-0 h-screen ${collapsed ? "w-[76px]" : "w-[248px]"}`} style={bg ? { background: bg } : undefined}>
          <div className={`relative z-10 flex items-center ${collapsed ? "justify-center" : "justify-between"} px-4 h-16 border-b border-white/10`}>
            {collapsed
              ? <svg width="38" height="38" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="rgba(255,255,255,0.1)" /><path d="M8 28c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#67d5ff" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M8 19c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#a5e6ff" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
              : <Logo light size={38} />}
            {!collapsed && (
              <button onClick={() => setCollapsed(true)} className="w-7 h-7 grid place-items-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors" aria-label="طي القائمة"><I n="chevS" size={16} className="rotate-180" /></button>
            )}
          </div>

          <nav className="relative z-10 flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
            {collapsed && (
              <button onClick={() => setCollapsed(false)} className="w-full grid place-items-center py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors mb-1" aria-label="توسيع القائمة"><I n="chevS" size={17} /></button>
            )}
            {NAV.map((n) => {
              const isOn = route.module === n.id;
              return (
                <div key={n.id}>
                  <button
                    onClick={() => { nav({ module: n.id, tab: "" }); setOpenSec(isOn && !collapsed ? (openSec === n.id ? "" : n.id) : n.id); }}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.86rem] font-bold transition-all duration-200 ${isOn ? "bg-white/[0.14] text-white shadow-lg" : "text-white/65 hover:text-white hover:bg-white/[0.07] hover:translate-x-[-2px]"}`}
                    title={collapsed ? n.label : undefined}
                  >
                    <span className={`shrink-0 ${isOn ? "text-[#67d5ff]" : ""}`}><I n={n.icon} size={19} /></span>
                    {!collapsed && <span className="flex-1 text-start">{n.label}</span>}
                    {!collapsed && n.subs.length > 0 && <I n="chevD" size={14} className={`transition-transform duration-200 ${openSec === n.id && isOn ? "rotate-180" : ""}`} />}
                    {!collapsed && isOn && <span className="w-1.5 h-1.5 rounded-full bg-[#67d5ff] blink" />}
                  </button>
                  {!collapsed && isOn && n.subs.length > 0 && (
                    <div className={`grid transition-all duration-300 ${openSec === n.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="ps-5 ms-5 border-s border-white/15 py-1 space-y-0.5">
                          {n.subs.map((s, si) => (
                            <button key={s} onClick={() => nav({ module: n.id, tab: SUB_TAB[n.id]?.[si] || "" })}
                              className={`w-full text-start px-3 py-1.5 rounded-lg text-[0.78rem] font-bold transition-colors ${route.tab === (SUB_TAB[n.id]?.[si] || "") || (!route.tab && si === 0) ? "text-[#67d5ff] bg-white/[0.08]" : "text-white/55 hover:text-white"}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="relative z-10 p-3 border-t border-white/10">
            <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
              <span className="w-9 h-9 rounded-full grid place-items-center font-display font-bold text-sm bg-white/15 text-white shrink-0">{session.user.slice(0, 2)}</span>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-[0.78rem] font-bold text-white truncate">{session.user}</div>
                  <div className="text-[0.62rem] font-bold text-white/50 truncate">{session.role} — {session.year}</div>
                </div>
              )}
              {!collapsed && (
                <button onClick={() => { app.logout(); app.toast("تم تسجيل الخروج بأمان وإبطال الرمز", "info"); }} className="w-8 h-8 grid place-items-center rounded-lg text-white/60 hover:text-[#ff9d9d] hover:bg-white/10 transition-colors" aria-label="خروج" title="تسجيل الخروج">
                  <I n="out" size={16} />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ═══ المحتوى ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-16 flex items-center gap-3 px-4 md:px-6 border-b border-line" style={{ background: "color-mix(in srgb, var(--surface) 88%, transparent)", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center gap-2 text-[0.8rem] font-bold text-mute">
              <I n="home" size={15} />
              <span>{pageLabel}</span>
              {route.tab && <><I n="chevS" size={12} className="opacity-50" /><span className="text-[var(--brand)]">{current?.subs[Object.values(SUB_TAB[route.module] || {}).indexOf(route.tab)] || ""}</span></>}
            </div>
            <div className="ms-auto flex items-center gap-1.5">
              <span className="hidden md:flex chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] !py-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--good)] blink" /> مارس 2026 مفتوحة</span>
              <span className="hidden lg:flex chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-num !py-1" dir="ltr">FY-{session.year}</span>
              <button onClick={() => setPrefs({ theme: prefs.theme === "night" ? "azure" : "night" })} className="w-9 h-9 grid place-items-center rounded-lg text-soft hover:bg-panel hover:text-[var(--brand)] transition-colors" aria-label="تبديل الوضع الليلي" title="داكن/فاتح">
                <I n={prefs.theme === "night" ? "sun" : "moon"} size={18} />
              </button>
              <NotifBell />
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-panel transition-colors">
                  <span className="w-8 h-8 rounded-full grid place-items-center font-display font-bold text-xs text-[var(--brandink)]" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}>{session.user.slice(0, 2)}</span>
                  <I n="chevD" size={13} className="text-mute" />
                </button>
                {userMenu && (
                  <div className="absolute top-12 end-0 w-60 card anim-pop z-50 overflow-hidden p-1.5">
                    <div className="px-3 py-2.5 border-b border-line mb-1">
                      <div className="font-bold text-[0.86rem]">{session.user}</div>
                      <div className="text-[0.66rem] text-mute font-bold">{session.company} — {session.branch}</div>
                    </div>
                    {[["palette", "التفضيلات والمظهر", () => { nav({ module: "admin", tab: "prefs" }); setUserMenu(false); }],
                      ["info", "حول النظام", () => { nav({ module: "help", tab: "" }); setUserMenu(false); }],
                      ["out", "تسجيل الخروج", () => { app.logout(); app.toast("تم تسجيل الخروج بأمان", "info"); }]].map(([ic, l, fn]: any) => (
                      <button key={l} onClick={fn} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] font-bold hover:bg-panel transition-colors ${l === "تسجيل الخروج" ? "text-[var(--bad)]" : "text-soft"}`}>
                        <I n={ic} size={16} /> {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 md:px-6 py-6 w-full max-w-[1400px] mx-auto" key={route.module + route.tab}>
            <div className="anim-rise">
              {route.module === "dashboard" && <Dashboard />}
              {route.module === "inventory" && <Inventory />}
              {route.module === "purchases" && <Purchases />}
              {route.module === "sales" && <Sales />}
              {route.module === "gl" && <GL />}
              {route.module === "admin" && <Admin />}
              {route.module === "help" && <Help />}
            </div>
          </main>

          {/* ═══ التذييل الثابت ═══ */}
          <footer className="border-t border-line mt-2 py-4 px-4 text-center" style={{ background: "color-mix(in srgb, var(--panel) 75%, transparent)" }}>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.78rem] font-bold text-soft">
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="var(--brand)" /><path d="M8 28c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="var(--brandink)" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M8 19c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="var(--brandink)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" /></svg>
              <span>جميع الحقوق محفوظة لدى شركة أوكيانوس سوفت - Okyanus Soft</span>
              <a href="https://okyanussoft.online/" target="_blank" rel="noreferrer" className="text-[var(--brand)] hover:underline underline-offset-4 font-num" dir="ltr">https://okyanussoft.online/</a>
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-2 text-[0.68rem] font-bold text-mute">
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-num" dir="ltr">السجل التجاري: 2019004571 — صنعاء</span>
              <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)] font-num" dir="ltr">OkyanusProERP v3.0.0</span>
              <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--good)] blink" /> الخادم متصل — MySQL 8.4</span>
            </div>
          </footer>
        </div>
      </div>
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
