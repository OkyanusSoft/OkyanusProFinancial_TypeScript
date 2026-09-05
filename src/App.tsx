import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppProvider, useApp } from "./store";
import { I, LogoMark } from "./ui";

/* ═══════ حاجز الأخطاء — يعرض سبب العطل بدل صفحة فارغة ═══════ */
class ErrorBoundary extends Component<{ children: ReactNode }, { err: string }> {
  state = { err: "" };
  static getDerivedStateFromError(e: unknown) { return { err: e instanceof Error ? `${e.name}: ${e.message}` : String(e) }; }
  render() {
    if (this.state.err) {
      return (
        <div dir="rtl" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#07111f", color: "#e6f1fb", fontFamily: "Tajawal, sans-serif", padding: 24 }}>
          <div style={{ maxWidth: 560, background: "#0c1a2d", border: "1px solid #1d3550", borderRadius: 16, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(248,113,113,0.14)", color: "#f87171", fontSize: 22, fontWeight: 800 }}>!</span>
              <div>
                <div style={{ fontFamily: "Changa, sans-serif", fontWeight: 700, fontSize: 20 }}>تعذّر تشغيل الواجهة</div>
                <div style={{ fontSize: 12, color: "#7d97b0", fontWeight: 700 }}>النظام المالي المتكامل — أوكيانوس سوفت</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#b9cfe2", fontWeight: 700, lineHeight: 1.9 }}>
              حدث خطأ تشغيلي أثناء العرض. جرّب إعادة تحميل الصفحة — وإن تكرر، امسح تخزين المتصفح للموقع (بيانات المزامنة المحلية) ثم أعد التحميل.
            </p>
            <pre dir="ltr" style={{ direction: "ltr", textAlign: "left", background: "#06263e", border: "1px solid rgba(125,211,252,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 11.5, color: "#fca5a5", overflow: "auto", whiteSpace: "pre-wrap", fontFamily: "Space Grotesk, monospace" }}>{this.state.err}</pre>
            <button onClick={() => location.reload()} style={{ marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0284c7,#38bdf8)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "Tajawal, sans-serif" }}>إعادة تشغيل النظام</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
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

/* ════════════════════════════════════════════════════════════
   الهيكل الرئيسي — قائمة ثلاثية المستويات تتشكل ديناميكياً
   حسب الأنظمة المتخصصة المفعّلة من شاشة «تفعيل الأنظمة والأنشطة»
   ════════════════════════════════════════════════════════════ */

type Leaf = { id: string; label: string };
type Group = { label: string; icon: string; leaves: Leaf[] };
type NavNode = { id: string; label: string; icon: string; groups?: Group[]; leaves?: Leaf[]; sep?: boolean };

const G = (label: string, icon: string, leaves: [string, string][]): Group => ({ label, icon, leaves: leaves.map(([id, l]) => ({ id, label: l })) });

const BASE_TREE: NavNode[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: "dash" },
  {
    id: "inv", label: "نظام المخازن والمستودعات", icon: "box", groups: [
      G("البيانات الأساسية", "layers", [["base.units", "الوحدات"], ["base.wh", "دليل المخازن"], ["base.groups", "دليل المجموعات"], ["base.items", "دليل الأصناف"]]),
      G("الحركات", "swap", [["mv.open", "سند قيد افتتاحي مخزني"], ["mv.grn", "سند توريد مخزني"], ["mv.iss", "سند صرف مخزني"], ["mv.tr", "سند تحويل مخزني"], ["mv.adj", "سند تسوية مخزنية"], ["mv.count", "جرد مخزني"]]),
      G("التقارير", "chart", [["rep.bal", "أرصدة المخازن"], ["rep.move", "حركة الأصناف"], ["rep.card", "بطاقة صنف"], ["rep.watch", "مراقبة المخزون"], ["rep.count", "جرد المخزون"], ["rep.journal", "سجل حركة السندات"], ["rep.valuation", "تقييم المخزون"], ["rep.reorder", "اقتراحات إعادة الطلب"], ["rep.transfers", "سجل التحويلات"], ["rep.slow", "الأصناف الراكدة"]]),
    ],
  },
  {
    id: "pur", label: "نظام المشتريات والموردون", icon: "truck", groups: [
      G("البيانات الأساسية", "users", [["base.sup", "إدارة الموردين"], ["base.cats", "تصنيفات الموردين والعملاء"]]),
      G("الحركات", "receipt", [["mv.req", "طلب شراء"], ["mv.quote", "عروض الأسعار"], ["mv.inv", "فاتورة مشتريات"], ["mv.credit", "فاتورة مشتريات آجل"]]),
      G("التقارير", "chart", [["rep.main", "تقارير المشتريات"]]),
    ],
  },
  {
    id: "sal", label: "نظام المبيعات والعملاء", icon: "tag", groups: [
      G("البيانات الأساسية", "users", [["base.cus", "إدارة العملاء"], ["base.cats", "تصنيفات الموردين والعملاء"]]),
      G("الحركات", "receipt", [["mv.quote", "عرض سعر"], ["mv.inv", "فاتورة مبيعات"], ["mv.ret", "فاتورة مرتجع مبيعات"]]),
      G("التقارير", "chart", [["rep.main", "تقارير المبيعات"]]),
    ],
  },
  { id: "pos", label: "نظام نقاط البيع", icon: "wallet" },
  {
    id: "gl", label: "نظام الحسابات العامة", icon: "book", groups: [
      G("البيانات الأساسية", "layers", [
        ["base.periods", "الفترات المالية"], ["base.close", "إقفال الفترات المالية"], ["base.mid", "الحسابات الوسطية"],
        ["base.cash", "بيانات الصناديق"], ["base.cur", "إدارة العملات"], ["base.cc", "دليل مراكز التكلفة"],
        ["base.banks", "البنوك والحسابات البنكية"], ["base.pay", "شروط وطرق الدفع"], ["base.coa", "دليل الحسابات"], ["base.ana", "الحسابات التحليلية"],
      ]),
      G("الحركات", "receipt", [["mv.open", "سند قيد افتتاحي مالي"], ["mv.req", "طلب سند قيد يومية"], ["mv.je", "سند قيد يومية"], ["mv.pv", "سند صرف"], ["mv.rv", "سند قبض"]]),
      G("التقارير", "scale", [["rep.stmt", "تقرير كشف حساب"], ["rep.trial", "تقرير ميزان المراجعة"], ["rep.bs", "تقرير ميزان العمومية"], ["rep.pl", "تقرير الأرباح والخسائر"], ["rep.gljournal", "تقرير حركة القيود"]]),
    ],
  },
  { id: "hr", label: "نظام الموارد البشرية", icon: "users" },
  { id: "assets", label: "نظام الأصول الثابتة", icon: "bld" },
];

const TAIL_TREE: NavNode[] = [
  {
    id: "adm", label: "إدارة النظام", icon: "shield", leaves: [
      { id: "users", label: "المستخدمون والصلاحيات" },
      { id: "quick", label: "الوصول السريع" },
      { id: "agent", label: "الوكيل الذكي — التشخيص الذاتي" },
      { id: "monitor", label: "مراقبة النشاط" },
      { id: "activation", label: "تفعيل الأنظمة والأنشطة" },
      { id: "settings", label: "الإعدادات العامة" },
      { id: "prefs", label: "التفضيلات" },
    ],
  },
  { id: "help", label: "المساعدة", icon: "life" },
];

/* ── التنبيهات ── */
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

/* ── التنبيهات العائمة ── */
function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-5 start-5 z-[100] space-y-2 max-w-[min(92vw,400px)]">
      {toasts.map((t) => (
        <div key={t.id} className={`anim-slidein card !rounded-xl px-4 py-3 flex items-start gap-2.5 shadow-xl border-s-4 ${t.kind === "ok" ? "!border-s-[var(--good)]" : t.kind === "err" ? "!border-s-[var(--bad)]" : "!border-s-[var(--brand)]"}`} style={{ background: "var(--surface)" }}>
          <span className={`mt-0.5 shrink-0 ${t.kind === "ok" ? "text-[var(--good)]" : t.kind === "err" ? "text-[var(--bad)]" : "text-[var(--brand)]"}`}>
            <I n={t.kind === "ok" ? "check" : t.kind === "err" ? "alert" : "info"} size={17} />
          </span>
          <p className="text-[0.8rem] font-bold leading-5">{t.msg}</p>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ الهيكل ═══════════════ */
function Shell() {
  const app = useApp();
  const { session, route, nav, prefs, setPrefs, SYSTEM } = app;
  const [collapsed, setCollapsed] = useState(false);
  const [openMod, setOpenMod] = useState<string>(route.module);
  const [openGrp, setOpenGrp] = useState<string>("");
  const [userMenu, setUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* تطبيق النمط والخط ودرجة الوضوح والاتجاه على كامل النظام */
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = prefs.theme;
    el.style.fontSize = `${prefs.font}%`;
    el.dir = prefs.dir;
    /* درجة وضوح الخط: 0 (قياسي) ← 100 (فائق الحدة) → تُترجم إلى stroke بحد أقصى 0.5px */
    el.style.setProperty("--font-sharpen", `${((prefs.sharpen ?? 0) / 100) * 0.5}px`);
  }, [prefs.theme, prefs.font, prefs.dir, prefs.sharpen]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [route.module, route.path]);

  /* تشكيل القائمة: الأنظمة الأساسية + المتخصصة المفعّلة + الذيل */
  const TREE = useMemo<NavNode[]>(() => {
    const spec: NavNode[] = app.activeSystems.length
      ? [
          { id: "__sep", label: "", icon: "", sep: true },
          ...app.activities
            .filter((a) => app.activeSystems.includes(a.id))
            .map((a) => ({
              id: `spec.${a.id}`, label: `نظام ${a.name}`, icon: a.icon,
              groups: [G("الشاشات", "dash", a.entities.map((e) => [e.id, e.label] as [string, string]))],
            })),
        ]
      : [];
    return [...BASE_TREE, ...spec, ...TAIL_TREE];
  }, [app.activeSystems, app.activities]);

  if (!session) return <><Login /><Toasts /></>;

  const bg = app.sidebarBgs.find((b) => b.id === prefs.sidebarBg)?.style;
  const current = TREE.find((n) => n.id === route.module);
  const leafLabel =
    current?.groups?.flatMap((g) => g.leaves).find((l) => l.id === route.path)?.label ||
    current?.leaves?.find((l) => l.id === route.path)?.label || "";

  const go = (n: NavNode, leaf?: Leaf) => {
    nav({ module: n.id, path: leaf?.id || "" });
    setOpenMod(n.id);
    if (leaf) {
      const g = n.groups?.find((gg) => gg.leaves.some((l) => l.id === leaf.id));
      if (g) setOpenGrp(`${n.id}:${g.label}`);
    }
  };

  return (
    <div className="min-h-screen ambient relative">
      <div className="relative z-10 flex min-h-screen">
        {/* ═══ الشريط الجانبي ═══ */}
        <aside className={`relative text-[var(--sideink)] flex flex-col shrink-0 transition-all duration-300 sticky top-0 h-screen overflow-hidden ${collapsed ? "w-[74px]" : "w-[262px]"}`}
          style={{ background: bg || "linear-gradient(168deg,var(--side1),var(--side2))" }}>
          {/* الشعار */}
          <div className={`relative z-10 flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3.5 h-16 border-b border-white/10 shrink-0`}>
            {collapsed
              ? <LogoMark size={38} variant="glass" />
              : <div className="flex items-center gap-2 min-w-0">
                  <LogoMark size={36} variant="glass" />
                  <div className="leading-none min-w-0">
                    <div className="font-display font-bold text-[0.98rem] text-white truncate">{SYSTEM.name}</div>
                    <div dir="ltr" className="font-num text-[0.52rem] font-semibold text-white/65 mt-1.5 tracking-[0.17em] text-start">INTEGRATED FINANCIAL SYSTEM</div>
                  </div>
                </div>}
            {!collapsed && <button onClick={() => setCollapsed(true)} className="w-7 h-7 grid place-items-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0" aria-label="طي"><I n="chevS" size={16} className="rotate-180" /></button>}
          </div>

          {/* القائمة */}
          <nav className="relative z-10 flex-1 overflow-y-auto py-2.5 px-2 space-y-0.5">
            {collapsed && <button onClick={() => setCollapsed(false)} className="w-full grid place-items-center py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors mb-1" aria-label="توسيع"><I n="chevS" size={17} /></button>}
            {TREE.map((n) => {
              const isOn = route.module === n.id;
              if (n.sep) return !collapsed ? (
                <div key={n.id} className="flex items-center gap-2 px-3 pt-3 pb-1">
                  <span className="h-px flex-1 bg-white/12" />
                  <span className="text-[0.58rem] font-bold text-white/40 tracking-wide">الأنظمة المتخصصة</span>
                  <span className="h-px flex-1 bg-white/12" />
                </div>
              ) : <div key={n.id} className="h-px bg-white/12 mx-3 my-2" />;

              const hasKids = !!n.groups?.length || !!n.leaves?.length;
              return (
                <div key={n.id}>
                  <button
                    onClick={() => (hasKids ? (setOpenMod(openMod === n.id && !isOn ? n.id : isOn && openMod === n.id ? "" : n.id), nav({ module: n.id, path: n.groups?.[0]?.leaves[0]?.id || n.leaves?.[0]?.id || "" })) : go(n))}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.84rem] font-bold transition-all duration-200 ${isOn ? "bg-white/[0.14] text-white shadow-lg" : "text-white/65 hover:text-white hover:bg-white/[0.07] hover:translate-x-[-2px]"}`}
                    title={collapsed ? n.label : undefined}
                  >
                    <span className={`shrink-0 ${isOn ? "text-[#67d5ff]" : ""}`}><I n={n.icon} size={19} /></span>
                    {!collapsed && <span className="flex-1 text-start leading-5">{n.label}</span>}
                    {!collapsed && hasKids && <I n="chevD" size={14} className={`transition-transform duration-200 ${openMod === n.id && isOn ? "rotate-180" : ""}`} />}
                    {!collapsed && isOn && <span className="w-1.5 h-1.5 rounded-full bg-[#67d5ff] blink shrink-0" />}
                  </button>

                  {/* المجموعات والأوراق */}
                  {!collapsed && isOn && hasKids && (
                    <div className={`grid transition-all duration-300 ${openMod === n.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="ps-4 ms-4.5 border-s border-white/15 py-1 space-y-0.5">
                          {n.groups?.map((g) => {
                            const gk = `${n.id}:${g.label}`;
                            const gOpen = openGrp === gk || openGrp === "";
                            return (
                              <div key={g.label}>
                                <button onClick={() => setOpenGrp(openGrp === gk ? `${n.id}:__none` : gk)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[0.74rem] font-bold transition-colors ${route.path && g.leaves.some((l) => l.id === route.path) ? "text-[#67d5ff]" : "text-white/70 hover:text-white"}`}>
                                  <I n={g.icon} size={13} />
                                  <span className="flex-1 text-start">{g.label}</span>
                                  <I n="chevD" size={11} className={`transition-transform duration-200 ${gOpen ? "rotate-180" : ""}`} />
                                </button>
                                <div className={`grid transition-all duration-250 ${gOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                                  <div className="overflow-hidden">
                                    {g.leaves.map((l) => (
                                      <button key={l.id} onClick={() => go(n, l)}
                                        className={`w-full text-start ps-8 pe-2 py-1.5 rounded-lg text-[0.76rem] font-bold transition-all ${route.path === l.id ? "text-[#67d5ff] bg-white/[0.09] translate-x-[-3px]" : "text-white/55 hover:text-white hover:translate-x-[-2px]"}`}>
                                        {l.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {n.leaves?.map((l) => (
                            <button key={l.id} onClick={() => go(n, l)}
                              className={`w-full text-start px-2.5 py-1.5 rounded-lg text-[0.76rem] font-bold transition-all ${route.path === l.id ? "text-[#67d5ff] bg-white/[0.09]" : "text-white/55 hover:text-white"}`}>
                              {l.label}
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

          {/* المستخدم */}
          <div className="relative z-10 p-3 border-t border-white/10 shrink-0">
            <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
              <span className="w-9 h-9 rounded-full grid place-items-center font-display font-bold text-sm bg-white/15 text-white shrink-0">{session.user.slice(0, 2)}</span>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.78rem] font-bold text-white truncate">{session.user}</div>
                    <div className="text-[0.62rem] font-bold text-white/50 truncate">{session.role} — {session.year}</div>
                  </div>
                  <button onClick={() => { app.logout(); app.toast("تم تسجيل الخروج بأمان وإبطال الرمز", "info"); }} className="w-8 h-8 grid place-items-center rounded-lg text-white/60 hover:text-[#ff9d9d] hover:bg-white/10 transition-colors" aria-label="خروج" title="تسجيل الخروج">
                    <I n="out" size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ═══ المحتوى ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-16 flex items-center gap-3 px-4 md:px-6 border-b border-line" style={{ background: "color-mix(in srgb, var(--surface) 88%, transparent)", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center gap-2 text-[0.8rem] font-bold text-mute min-w-0">
              <I n="home" size={15} className="shrink-0" />
              <span className="truncate">{current?.label || ""}</span>
              {leafLabel && <><I n="chevS" size={12} className="opacity-50 shrink-0" /><span className="text-[var(--brand)] truncate">{leafLabel}</span></>}
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
                    <button onClick={() => { nav({ module: "adm", path: "prefs" }); setUserMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] font-bold text-soft hover:bg-panel transition-colors"><I n="palette" size={16} /> التفضيلات والمظهر</button>
                    <button onClick={() => { nav({ module: "help", path: "" }); setUserMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] font-bold text-soft hover:bg-panel transition-colors"><I n="info" size={16} /> حول النظام</button>
                    <button onClick={() => { app.logout(); app.toast("تم تسجيل الخروج بأمان", "info"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] font-bold text-[var(--bad)] hover:bg-panel transition-colors"><I n="out" size={16} /> تسجيل الخروج</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 md:px-6 py-6 w-full max-w-[1440px] mx-auto" key={route.module + route.path}>
            <div className="anim-rise">
              {route.module === "dashboard" && <Dashboard />}
              {route.module === "inv" && <Inventory />}
              {route.module === "pur" && <Purchases />}
              {route.module === "sal" && <Sales />}
              {route.module === "pos" && <POS />}
              {route.module === "gl" && <GL />}
              {route.module === "hr" && <HR />}
              {route.module === "assets" && <Assets />}
              {route.module === "adm" && (route.path === "activation" ? <ActivationScreen /> : <Admin />)}
              {route.module === "help" && <Help />}
              {route.module.startsWith("spec.") && <SpecModule activityId={route.module.slice(5)} />}
            </div>
          </main>

          {/* ═══ التذييل الثابت ═══ */}
          <footer className="border-t border-line mt-2 py-4 px-4 text-center" style={{ background: "color-mix(in srgb, var(--panel) 75%, transparent)" }}>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.78rem] font-bold text-soft">
              <LogoMark size={22} variant="tile" />
              <span>جميع الحقوق محفوظة لدى شركة أوكيانوس سوفت - Okyanus Soft</span>
              <a href={SYSTEM.site} target="_blank" rel="noreferrer" className="text-[var(--brand)] hover:underline underline-offset-4 font-num" dir="ltr">{SYSTEM.site}</a>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[0.68rem] font-bold">
              <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] font-num !text-[0.74rem]" dir="ltr"><I n="phone" size={12} className="inline -mt-0.5" /> {SYSTEM.phone}</span>
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]"><I n="globe" size={11} className="inline -mt-0.5" /> {SYSTEM.cr}</span>
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
    <ErrorBoundary>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ErrorBoundary>
  );
}
