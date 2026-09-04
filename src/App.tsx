import { useEffect, useRef, useState } from "react";
import { AppProvider, useApp } from "./store";
import { I, Logo, LogoMark } from "./ui";
import { SYSTEM } from "./data";
import Login from "./modules/Login";
import Dashboard from "./modules/Dashboard";
import Inventory from "./modules/Inventory";
import { Purchases, Sales } from "./modules/Trade";
import GL from "./modules/GL";
import Admin from "./modules/Admin";
import Help from "./modules/Help";
import POS from "./modules/POS";
import HR from "./modules/HR";
import Assets from "./modules/Assets";
import { ActivationScreen, SpecModule } from "./modules/Spec";

/* ═══ القائمة الرئيسية — الهيكلية المطلوبة حرفياً (3 مستويات) ═══ */
type Leaf = { id: string; label: string };
type Group = { label: string; icon: string; leaves: Leaf[] };
type NavNode = { id: string; label: string; icon: string; groups: Group[]; leaves?: Leaf[]; color?: string; sep?: boolean };
const BASE_TREE: NavNode[] = [
  { id: "dash", label: "لوحة التحكم", icon: "dash", groups: [], leaves: [{ id: "", label: "لوحة التحكم" }] },
  {
    id: "inv", label: "المخازن والمستودعات", icon: "box", groups: [
      { label: "البيانات الأساسية", icon: "layers", leaves: [{ id: "base.units", label: "الوحدات" }, { id: "base.wh", label: "دليل المخازن" }, { id: "base.groups", label: "دليل المجموعات" }, { id: "base.items", label: "دليل الأصناف" }] },
      { label: "الحركات", icon: "swap", leaves: [{ id: "mv.open", label: "سند قيد افتتاحي مخزني" }, { id: "mv.grn", label: "سند توريد مخزني" }, { id: "mv.iss", label: "سند صرف مخزني" }, { id: "mv.tr", label: "سند تحويل مخزني" }, { id: "mv.adj", label: "سند تسوية مخزنية" }, { id: "mv.count", label: "جرد مخزني" }] },
      { label: "التقارير", icon: "chart", leaves: [{ id: "rep.bal", label: "أرصدة المخازن" }, { id: "rep.move", label: "حركة الأصناف" }, { id: "rep.card", label: "بطاقة صنف" }, { id: "rep.watch", label: "مراقبة المخزون" }, { id: "rep.count", label: "جرد المخزون" }] },
    ],
  },
  {
    id: "pur", label: "المشتريات والموردون", icon: "truck", groups: [
      { label: "البيانات الأساسية", icon: "users", leaves: [{ id: "base.sup", label: "إدارة الموردين" }, { id: "base.cats", label: "تصنيفات الموردين والعملاء" }] },
      { label: "الحركات", icon: "swap", leaves: [{ id: "mv.req", label: "طلب شراء" }, { id: "mv.quote", label: "عروض الأسعار" }, { id: "mv.inv", label: "فاتورة مشتريات" }, { id: "mv.credit", label: "فاتورة مشتريات آجل" }] },
      { label: "التقارير", icon: "chart", leaves: [{ id: "rep.main", label: "تقارير المشتريات" }] },
    ],
  },
  {
    id: "sal", label: "المبيعات والعملاء", icon: "tag", groups: [
      { label: "البيانات الأساسية", icon: "users", leaves: [{ id: "base.cus", label: "إدارة العملاء" }, { id: "base.cats", label: "تصنيفات الموردين والعملاء" }] },
      { label: "الحركات", icon: "swap", leaves: [{ id: "mv.quote", label: "عرض سعر" }, { id: "mv.inv", label: "فاتورة مبيعات" }, { id: "mv.ret", label: "فاتورة مرتجع مبيعات" }] },
      { label: "التقارير", icon: "chart", leaves: [{ id: "rep.main", label: "تقارير المبيعات" }] },
    ],
  },
  {
    id: "pos", label: "نقاط البيع", icon: "receipt", groups: [], leaves: [{ id: "", label: "شاشة نقاط البيع" }],
  },
  {
    id: "gl", label: "الحسابات العامة", icon: "book", groups: [
      { label: "البيانات الأساسية", icon: "layers", leaves: [{ id: "base.periods", label: "الفترات المالية" }, { id: "base.close", label: "إقفال الفترات المالية" }, { id: "base.mid", label: "الحسابات الوسطية" }, { id: "base.cash", label: "بيانات الصناديق" }, { id: "base.banks", label: "البنوك والحسابات البنكية" }, { id: "base.cur", label: "إدارة العملات" }, { id: "base.pay", label: "شروط وطرق الدفع" }, { id: "base.cc", label: "دليل مراكز التكلفة" }, { id: "base.coa", label: "دليل الحسابات" }, { id: "base.ana", label: "الحسابات التحليلية" }] },
      { label: "الحركات", icon: "swap", leaves: [{ id: "mv.open", label: "سند قيد افتتاحي مالي" }, { id: "mv.req", label: "طلب سند قيد يومية" }, { id: "mv.je", label: "سند قيد يومية" }, { id: "mv.pv", label: "سند صرف" }, { id: "mv.rv", label: "سند قبض" }] },
      { label: "التقارير", icon: "scale", leaves: [{ id: "rep.stmt", label: "تقرير كشف حساب" }, { id: "rep.trial", label: "تقرير ميزان المراجعة" }, { id: "rep.bs", label: "تقرير ميزان العمومية" }, { id: "rep.pl", label: "تقرير الأرباح والخسائر" }] },
    ],
  },
  {
    id: "hr", label: "الموارد البشرية", icon: "users", groups: [], leaves: [{ id: "", label: "شؤون الموظفين والرواتب" }],
  },
  {
    id: "assets", label: "الأصول الثابتة", icon: "bld", groups: [], leaves: [{ id: "", label: "سجل الأصول والإهلاك" }],
  },
];
/* الأنظمة المتخصصة (تُحقن ديناميكياً حسب النشاط المفعّل) تُدرج بين الأصول وإدارة النظام */
const TAIL_TREE: NavNode[] = [
  {
    id: "adm", label: "إدارة النظام", icon: "shield", groups: [], leaves: [
      { id: "activate", label: "تفعيل الأنظمة والأنشطة" },
      { id: "monitor", label: "مراقبة النشاط (بث لحظي)" },
      { id: "users", label: "المستخدمون والصلاحيات" },
      { id: "settings", label: "الإعدادات العامة" },
      { id: "prefs", label: "التفضيلات" },
    ],
  },
  {
    id: "help", label: "المساعدة", icon: "life", groups: [], leaves: [
      { id: "guide", label: "دليل المستخدم" },
    ],
  },
];

function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-5 start-5 z-[100] space-y-2 max-w-[min(92vw,380px)]">
      {toasts.map((t) => (
        <div key={t.id} className={`anim-slidein card !rounded-xl px-4 py-3 flex items-start gap-2.5 shadow-xl border-s-4 ${t.kind === "ok" ? "!border-s-[var(--good)]" : t.kind === "err" ? "!border-s-[var(--bad)]" : "!border-s-[var(--brand)]"}`}>
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
            <button className="text-[0.7rem] font-bold text-[var(--brand)] hover:underline" onClick={() => { markNotifs(); setOpen(false); }}>مسح الكل</button>
          </div>
          <div className="max-h-72 overflow-auto">
            {notifs.length === 0 && <p className="p-6 text-center text-[0.78rem] font-bold text-mute">لا إشعارات جديدة</p>}
            {notifs.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-line/60 last:border-0 hover:bg-panel transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${n.kind === "bad" ? "bg-[var(--bad)]" : n.kind === "warn" ? "bg-[var(--warn)]" : "bg-[var(--brand)]"}`} />
                  <span className="font-bold text-[0.8rem] flex-1">{n.title}</span>
                  <span className="text-[0.62rem] font-bold text-mute shrink-0 font-num" dir="ltr">{n.time}</span>
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
  const [openGroups, setOpenGroups] = useState<string[]>(["inv:البيانات الأساسية"]);
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [route.module, route.path]);

  if (!session) return <><Login /><Toasts /></>;

  const bg = app.sidebarBgs.find((b) => b.id === prefs.sidebarBg)?.style;
  const toggleGroup = (key: string) => setOpenGroups((old) => old.includes(key) ? old.filter((k) => k !== key) : [...old, key]);

  /* الأنظمة المفعّلة تُحقن في القائمة بين الأصول الثابتة وإدارة النظام */
  const activeSpec = app.activities.filter((a) => app.activeSystems.includes(a.id));
  const specNodes: NavNode[] = activeSpec.map((a) => ({ id: `spec:${a.id}`, label: `نظام ${a.name}`, icon: a.icon, color: a.color, groups: [], leaves: [{ id: "", label: `نظام ${a.name}` }] }));
  const specLabel: NavNode[] = activeSpec.length ? [{ id: "_speclabel", label: "الأنظمة حسب طبيعة النشاط", icon: "layers", groups: [], sep: true }] : [];
  const TREE: NavNode[] = [...BASE_TREE, ...specLabel, ...specNodes, ...TAIL_TREE];

  const current = TREE.find((n) => n.id === route.module);
  const leafLabel = current?.groups.flatMap((g) => g.leaves).concat(current?.leaves || []).find((l) => l.id === route.path)?.label || current?.label || "";

  return (
    <div className="min-h-screen ambient relative">
      <div className="relative z-10 flex min-h-screen">
        {/* ═══ الشريط الجانبي — 3 مستويات ═══ */}
        <aside className={`relative text-[var(--sideink)] flex flex-col shrink-0 transition-all duration-300 sticky top-0 h-screen overflow-hidden ${collapsed ? "w-[74px]" : "w-[262px]"}`}
          style={{ background: bg || "linear-gradient(168deg,var(--side1),var(--side2))" }}>
          <div className={`relative z-10 flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3.5 h-16 border-b border-white/10 shrink-0`}>
            {collapsed
              ? <svg width="38" height="38" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="13" fill="rgba(255,255,255,0.1)" /><path d="M8 28c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#67d5ff" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M8 19c4.5-4.5 9-4.5 13.5 0s9 4.5 13.5 0" stroke="#a5e6ff" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
              : <div className="flex items-center gap-2 min-w-0">
                  <LogoMark size={36} variant="glass" />
                  <div className="leading-none min-w-0">
                    <div className="font-display font-bold text-[0.98rem] text-white truncate">{SYSTEM.name}</div>
                    <div dir="ltr" className="font-num text-[0.52rem] font-bold text-white/55 mt-1 tracking-[0.14em] text-start">INTEGRATED FINANCIAL SYSTEM</div>
                  </div>
                </div>}
            {!collapsed && <button onClick={() => setCollapsed(true)} className="w-7 h-7 grid place-items-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0" aria-label="طي"><I n="chevS" size={16} className="rotate-180" /></button>}
          </div>

          <nav className="relative z-10 flex-1 overflow-y-auto py-2.5 px-2 space-y-0.5">
            {collapsed && <button onClick={() => setCollapsed(false)} className="w-full grid place-items-center py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors mb-1" aria-label="توسيع"><I n="chevS" size={17} /></button>}
            {TREE.map((m) => {
              const isOn = route.module === m.id;
              if (m.sep) return !collapsed ? (
                <div key={m.id} className="px-2.5 pt-3.5 pb-1 flex items-center gap-2">
                  <span className="text-[0.62rem] font-bold text-white/40 tracking-wide whitespace-nowrap">{m.label}</span>
                  <span className="flex-1 h-px bg-white/10" />
                </div>
              ) : <div key={m.id} className="h-2" />;
              return (
                <div key={m.id}>
                  <button
                    onClick={() => {
                      nav({ module: m.id, path: m.groups.length ? m.groups[0].leaves[0].id : (m.leaves?.[0].id || "") });
                      if (m.groups.length) setOpenGroups((old) => old.includes(`${m.id}:${m.groups[0].label}`) ? old : [...old, `${m.id}:${m.groups[0].label}`]);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[0.84rem] font-bold transition-all duration-200 ${isOn ? "bg-white/[0.14] text-white shadow-lg" : "text-white/65 hover:text-white hover:bg-white/[0.07] hover:translate-x-[-2px]"}`}
                    title={collapsed ? m.label : undefined}>
                    <span className={`shrink-0 ${isOn ? "text-[#67d5ff]" : ""}`}><I n={m.icon} size={19} /></span>
                    {!collapsed && <span className="flex-1 text-start truncate">{m.label}</span>}
                    {!collapsed && m.groups.length > 0 && <I n="chevD" size={13} className={`opacity-60 transition-transform ${isOn ? "rotate-180" : ""}`} />}
                    {!collapsed && isOn && m.groups.length === 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#67d5ff] blink shrink-0" />}
                  </button>

                  {/* المستوى الثاني: المجموعات */}
                  {!collapsed && isOn && (
                    <div className="ps-2 ms-3.5 border-s border-white/15 my-0.5 space-y-0.5">
                      {m.leaves?.map((l) => (
                        <button key={l.id || "root"} onClick={() => nav({ module: m.id, path: l.id })}
                          className={`w-full text-start px-2.5 py-1.5 rounded-lg text-[0.76rem] font-bold transition-colors flex items-center gap-2 ${route.path === l.id ? "text-[#67d5ff] bg-white/[0.09]" : "text-white/60 hover:text-white"}`}>
                          <span className={`w-1 h-1 rounded-full ${route.path === l.id ? "bg-[#67d5ff]" : "bg-white/30"}`} /> {l.label}
                        </button>
                      ))}
                      {m.groups.map((g) => {
                        const key = `${m.id}:${g.label}`;
                        const open = openGroups.includes(key);
                        const groupActive = g.leaves.some((l) => l.id === route.path);
                        return (
                          <div key={key}>
                            <button onClick={() => toggleGroup(key)}
                              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[0.78rem] font-bold transition-colors ${groupActive ? "text-white bg-white/[0.06]" : "text-white/70 hover:text-white hover:bg-white/[0.05]"}`}>
                              <I n={g.icon} size={14} className={groupActive ? "text-[#67d5ff]" : "opacity-70"} />
                              <span className="flex-1 text-start">{g.label}</span>
                              <I n="chevD" size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                            </button>
                            {/* المستوى الثالث: الأوراق */}
                            <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                              <div className="overflow-hidden">
                                <div className="ps-3 ms-3 border-s border-white/12 py-0.5 space-y-px">
                                  {g.leaves.map((l) => (
                                    <button key={l.id} onClick={() => nav({ module: m.id, path: l.id })}
                                      className={`w-full text-start px-2.5 py-[7px] rounded-lg text-[0.73rem] font-bold transition-all flex items-center gap-2 ${route.path === l.id ? "text-[#04283d] bg-gradient-to-l from-[#67d5ff] to-[#a5e6ff] shadow" : "text-white/55 hover:text-white hover:bg-white/[0.06] hover:ps-3.5"}`}>
                                      {l.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="relative z-10 p-2.5 border-t border-white/10 shrink-0">
            <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
              <span className="w-9 h-9 rounded-full grid place-items-center font-display font-bold text-sm bg-white/15 text-white shrink-0">{session.user.slice(0, 2)}</span>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-[0.76rem] font-bold text-white truncate">{session.user}</div>
                  <div className="text-[0.6rem] font-bold text-white/50 truncate">{session.role} — {session.year}</div>
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
            <div className="flex items-center gap-2 text-[0.8rem] font-bold text-mute min-w-0">
              <I n="home" size={15} className="shrink-0" />
              <span className="truncate">{current?.label}</span>
              {route.path && <><I n="chevS" size={12} className="opacity-50 shrink-0" /><span className="text-[var(--brand)] truncate">{leafLabel}</span></>}
            </div>
            <div className="ms-auto flex items-center gap-1.5 shrink-0">
              <span className="hidden md:flex chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] !py-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--good)] blink" /> مارس 2026 مفتوحة</span>
              <span className="hidden lg:flex chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-num !py-1" dir="ltr">FY-{session.year}</span>
              <button onClick={() => setPrefs({ theme: prefs.theme === "night" ? "azure" : "night" })} className="w-9 h-9 grid place-items-center rounded-lg text-soft hover:bg-panel hover:text-[var(--brand)] transition-colors" aria-label="الوضع الليلي" title="داكن/فاتح">
                <I n={prefs.theme === "night" ? "sun" : "moon"} size={18} />
              </button>
              <NotifBell />
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-panel transition-colors">
                  <span className="w-8 h-8 rounded-full grid place-items-center font-display font-bold text-xs text-[var(--brandink)]" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}>{session.user.slice(0, 2)}</span>
                  <I n="chevD" size={13} className="text-mute hidden sm:block" />
                </button>
                {userMenu && (
                  <div className="absolute top-12 end-0 w-64 card anim-pop z-50 overflow-hidden p-1.5">
                    <div className="px-3 py-2.5 border-b border-line mb-1">
                      <div className="font-bold text-[0.86rem]">{session.user}</div>
                      <div className="text-[0.66rem] text-mute font-bold">{session.company} — {session.branch}</div>
                    </div>
                    <button onClick={() => { nav({ module: "adm", path: "prefs" }); setUserMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] font-bold text-soft hover:bg-panel transition-colors"><I n="palette" size={16} /> التفضيلات والمظهر</button>
                    <button onClick={() => { nav({ module: "help", path: "guide" }); setUserMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] font-bold text-soft hover:bg-panel transition-colors"><I n="info" size={16} /> حول النظام</button>
                    <button onClick={() => { app.logout(); app.toast("تم تسجيل الخروج بأمان", "info"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] font-bold text-[var(--bad)] hover:bg-panel transition-colors"><I n="out" size={16} /> تسجيل الخروج</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 md:px-6 py-6 w-full max-w-[1400px] mx-auto" key={route.module + route.path}>
            <div className="anim-rise">
              {route.module === "dash" && <Dashboard />}
              {route.module === "inv" && <Inventory />}
              {route.module === "pur" && <Purchases />}
              {route.module === "sal" && <Sales />}
              {route.module === "pos" && <POS />}
              {route.module === "gl" && <GL />}
              {route.module === "hr" && <HR />}
              {route.module === "assets" && <Assets />}
              {route.module.startsWith("spec:") && <SpecModule activityId={route.module.slice(5)} />}
              {route.module === "adm" && (route.path === "activate" ? <ActivationScreen /> : <Admin />)}
              {route.module === "help" && <Help />}
            </div>
          </main>

          {/* ═══ التذييل الثابت — أسفل كل شاشة ═══ */}
          <footer className="border-t border-line mt-2 py-4 px-4 text-center" style={{ background: "color-mix(in srgb, var(--panel) 75%, transparent)" }}>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.78rem] font-bold text-soft">
              <LogoMark size={22} variant="tile" />
              <span>جميع الحقوق محفوظة لدى شركة أوكيانوس سوفت - Okyanus Soft</span>
              <a href={SYSTEM.site} target="_blank" rel="noreferrer" className="text-[var(--brand)] hover:underline underline-offset-4 font-num" dir="ltr">{SYSTEM.site}</a>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[0.68rem] font-bold">
              <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] font-num !text-[0.74rem]" dir="ltr"><I n="phone" size={12} className="inline -mt-0.5" /> {SYSTEM.phone}</span>
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]"><I n="globe" size={12} className="inline -mt-0.5" /> {SYSTEM.cr}</span>
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
