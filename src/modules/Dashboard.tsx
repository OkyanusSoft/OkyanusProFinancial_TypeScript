import { useMemo, useState } from "react";
import { useApp } from "../store";
import { BarChart, Chip, Donut, I, LineChart, Reveal, Stat } from "../ui";
import type { Invoice, Journal } from "../data";

export default function Dashboard() {
  const app = useApp();
  const { db, fmtMoney, fmtN, nav, SYSTEM } = app;
  const sales = db.sales as any as Invoice[];
  const purchases = db.purchases as any as Invoice[];
  const journals = db.journals as any as Journal[];

  const [feed] = useState([
    { t: "09:42", txt: "ترحيل فاتورة مبيعات SIN-2026-0251 — مستشفى النور (نقدي)", k: "ok" },
    { t: "09:18", txt: "سند قبض RC-2026-0105 بمبلغ 130,000 ر.ي", k: "ok" },
    { t: "08:55", txt: "تنبيه: صنف «أنسولين مخلوط» دون الحد الأدنى (135 < 120)", k: "bad" },
    { t: "08:31", txt: "طلب قيد REQ-2026-0004 بانتظار موافقة المدير المالي", k: "warn" },
    { t: "08:02", txt: "نسخة احتياطية تفاضلية اكتملت — 186 MB", k: "info" },
    { t: "07:47", txt: "تحديث سعر صرف USD → 535 ر.ي", k: "info" },
  ]);

  const active = <T extends { status: string }>(arr: T[]): T[] => arr.filter((x) => !x.status.includes("ملغ"));
  const salesTotal = useMemo(() => active(sales).reduce((a, i) => a + app.invoiceTotal(i), 0), [sales]);
  const purchTotal = useMemo(() => active(purchases).reduce((a, i) => a + app.invoiceTotal(i), 0), [purchases]);
  const receivables = db.customers.reduce((a: number, c: any) => a + c.balance, 0);
  const payables = db.suppliers.reduce((a: number, s: any) => a + s.balance, 0);
  const quick = app.settings.quick || { visible: false, items: [] as { id: string; module: string; path: string; label: string; icon: string }[] };

  const monthly = ["يناير", "فبراير", "مارس"].map((m, idx) => ({
    label: m,
    value: Math.round(active(sales).filter((s) => s.date.slice(5, 7) === String(idx + 1).padStart(2, "0")).reduce((a, i) => a + app.invoiceTotal(i), 0)),
  }));
  const cashSeries = [1700, 1655, 1610, 1726, 1660, 1705, 1790, 1745, 1780, 1816];
  const lowStock = db.items.filter((i: any) => app.itemQty(i.id) < i.min);
  const overCredit = db.customers.filter((c: any) => c.creditLimit && c.balance > c.creditLimit);
  const jeSum = journals.filter((j) => j.status !== "ملغي").reduce((a, j) => a + j.lines.reduce((x, l) => x + l.debit, 0), 0);

  return (
    <div className="space-y-5">
      <Reveal>
        <div className="card relative overflow-hidden p-5 md:p-6" style={{ background: "linear-gradient(120deg, var(--side1), var(--side2))", borderColor: "transparent" }}>
          <svg className="absolute bottom-0 inset-x-0 w-[200%] h-20 text-white/10 wave-track pointer-events-none" style={{ animationDuration: "26s" }} viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,50 C160,15 320,85 480,50 C640,15 800,85 960,50 C1120,15 1280,85 1440,50 L1440,100 L0,100 Z" fill="currentColor" />
          </svg>
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[var(--sideink)]/70 text-[0.72rem] font-bold mb-1">
                <I n="cal" size={14} /> السنة المالية {app.session?.year} • الفترة المفتوحة: مارس 2026
              </div>
              <h1 className="font-display font-bold text-2xl md:text-[1.7rem] text-white">أهلاً {app.session?.user} 👋</h1>
              <p className="text-[var(--sideink)]/75 text-[0.82rem] font-medium mt-1">
                {SYSTEM.name} — {app.session?.company} • {app.session?.branch} • قيد مزدوج متوازن ({fmtN(jeSum)} ر.ي)
              </p>
            </div>
            <span className="chip !bg-white/10 !text-white/85 border border-white/15"><I n="cal" size={12} /> السنة المالية {app.session?.year}</span>
          </div>
        </div>
      </Reveal>

      {/* ═══ شريط الوصول السريع — يُدار من: إدارة النظام ← الوصول السريع ═══ */}
      {quick.visible && quick.items.length > 0 && (
        <Reveal delay={40}>
          <div className="card relative overflow-hidden px-4 py-3 flex items-center gap-3">
            <span className="absolute top-0 inset-x-0 h-[3px]" style={{ background: "linear-gradient(90deg, var(--brand), var(--accent) 55%, var(--brand))" }} />
            <span className="shrink-0 flex items-center gap-1.5 text-[0.72rem] font-bold text-[var(--brand)] pe-3 border-e border-line">
              <I n="star" size={15} className="text-[var(--warn)]" /> الوصول السريع
            </span>
            <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1" style={{ scrollbarWidth: "none" }}>
              {quick.items.map((it, i) => (
                <button key={it.id} onClick={() => nav({ module: it.module, path: it.path })}
                  className="group shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-panel/70 hover:border-[color-mix(in_srgb,var(--brand)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand)_8%,transparent)] hover:-translate-y-0.5 transition-all anim-rise"
                  style={{ animationDelay: `${i * 45}ms` }} title={it.label}>
                  <span className="w-6 h-6 rounded-md grid place-items-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] group-hover:scale-110 transition-transform"><I n={it.icon} size={13} /></span>
                  <span className="text-[0.76rem] font-bold whitespace-nowrap">{it.label}</span>
                  <I n="arrow" size={11} className="text-mute opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
            <button onClick={() => nav({ module: "adm", path: "quick" })} className="shrink-0 w-8 h-8 grid place-items-center rounded-lg text-mute hover:text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_8%,transparent)] transition-colors" title="إدارة الوصول السريع">
              <I n="gear" size={16} />
            </button>
          </div>
        </Reveal>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Stat icon="tag" label="إجمالي المبيعات (الربع الأول)" value={Math.round(salesTotal)} sub={`${active(sales).length} فاتورة مرحّلة`} tone="var(--brand)" />
        <Stat icon="truck" label="إجمالي المشتريات" value={Math.round(purchTotal)} sub={`${active(purchases).length} فاتورة — منها ${active(purchases).filter((p) => p.payType === "آجل").length} آجلة`} tone="var(--accent)" delay={70} />
        <Stat icon="users" label="الذمم المدينة (عملاء)" value={Math.round(receivables)} sub={`${db.customers.length} عملاء — ${overCredit.length} متجاوز للحد`} tone="var(--warn)" delay={140} />
        <Stat icon="wallet" label="الذمم الدائنة (موردون)" value={Math.round(payables)} sub={`${db.suppliers.length} موردين — فواتير مشتريات آجل`} tone="var(--good)" delay={210} />
      </div>

      {/* ═══ نبض النشاط — وحدات الأنظمة المتخصصة المفعّلة ═══ */}
      {app.activeSystems.length > 0 && (
        <Reveal>
          <div className="card p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1" style={{ background: "linear-gradient(90deg, var(--brand), var(--accent), var(--brand))" }} />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base flex items-center gap-2"><I n="pulse" size={19} className="text-[var(--good)]" /> نبض النشاط — الأنظمة المتخصصة المفعّلة</h3>
              <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]"><I n="check" size={12} /> {app.activeSystems.length} نظام مفعّل • يتغير تلقائياً مع النشاط</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {app.activities.filter((a) => app.activeSystems.includes(a.id)).map((a) => {
                const rows = a.entities.flatMap((e) => app.specData[`${a.id}:${e.id}`] || []);
                const amount = a.entities.reduce((s, e) => {
                  const af = e.amountField || "amount";
                  return s + (app.specData[`${a.id}:${e.id}`] || []).reduce((x, r) => x + Number((r as any)[af] || (r as any).cost || (r as any).price || 0), 0);
                }, 0);
                const isPrimary = app.primaryActivity === a.id;
                return (
                  <button key={a.id} onClick={() => nav({ module: `spec.${a.id}`, path: "" })}
                    className="card card-lift p-3.5 text-start relative overflow-hidden group">
                    <span className="absolute top-0 inset-x-0 h-0.5" style={{ background: a.color }} />
                    <div className="flex items-start gap-2.5">
                      <span className="w-9 h-9 rounded-lg grid place-items-center text-white shrink-0" style={{ background: `linear-gradient(135deg, ${a.color}, color-mix(in srgb, ${a.color} 60%, #000))` }}><I n={a.icon} size={17} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[0.82rem] truncate flex items-center gap-1.5">{a.name}{isPrimary && <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] blink shrink-0" />}</div>
                        <div className="font-num text-[0.68rem] text-mute font-bold mt-0.5">{rows.length} سجل</div>
                      </div>
                    </div>
                    {amount > 0 && <div className="font-num font-bold text-[0.9rem] mt-2" style={{ color: a.color }}>{fmtN(amount)} <span className="text-[0.6rem] text-mute">ر.ي</span></div>}
                    <div className="text-[0.62rem] font-bold text-[var(--brand)] mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><I n="arrow" size={11} /> فتح النظام</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Reveal className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base flex items-center gap-2"><I n="chart" size={18} className="text-[var(--brand)]" /> المبيعات الشهرية 2026</h3>
              <button className="btn btn-ghost !py-1.5 !px-3 !text-[0.72rem]" onClick={() => nav({ module: "sal", path: "rep.main" })}>التقرير الكامل <I n="arrow" size={13} /></button>
            </div>
            <BarChart data={monthly} height={200} unit=" ر.ي" />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="card p-5 h-full">
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2"><I n="coins" size={18} className="text-[var(--accent)]" /> أكبر الذمم المدينة</h3>
            <Donut
              label={`${Math.round(receivables / 1000)}K`}
              parts={[
                { name: "مستشفى النور", value: 412000, color: "var(--brand)" },
                { name: "ابن سينا", value: 210500, color: "var(--warn)" },
                { name: "الصحة للجميع", value: 188200, color: "var(--accent)" },
                { name: "أخرى", value: Math.max(0, Math.round(receivables) - 810700), color: "var(--mute)" },
              ]}
            />
            <div className="mt-4 pt-3 border-t border-line flex items-center gap-2 text-[0.72rem] font-bold text-[var(--warn)]">
              <I n="alert" size={15} /> {overCredit.length > 0 ? `${overCredit[0].name} تجاوزت حد الائتمان (${fmtN(overCredit[0].balance)} / ${fmtN(overCredit[0].creditLimit)})` : "كل العملاء ضمن الحدود"}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Reveal className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-base flex items-center gap-2"><I n="pulse" size={18} className="text-[var(--good)]" /> حركة السيولة — آخر 10 أسابيع</h3>
              <span className="chip bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]"><I n="pulse" size={12} /> مباشر</span>
            </div>
            <LineChart points={cashSeries.map((x) => x * 1000)} color="var(--good)" height={160} />
            <div className="flex justify-between text-[0.65rem] font-bold text-mute mt-1 font-num" dir="ltr"><span>W1</span><span>W3</span><span>W5</span><span>W7</span><span>W10</span></div>
          </div>
        </Reveal>
        <Reveal delay={90}>
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="alert" size={18} className="text-[var(--warn)]" /> تنبيهات الرقابة</h3>
            <div className="space-y-2.5">
              {lowStock.map((i: any) => (
                <div key={i.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[color-mix(in_srgb,var(--bad)_7%,transparent)] border border-[color-mix(in_srgb,var(--bad)_20%,transparent)]">
                  <I n="box" size={16} className="text-[var(--bad)] mt-0.5 shrink-0" />
                  <div className="text-[0.74rem] font-bold leading-5">{i.name}
                    <span className="block text-mute font-medium font-num" dir="ltr">{app.itemQty(i.id)} / min {i.min}</span>
                  </div>
                </div>
              ))}
              {overCredit.map((c: any) => (
                <div key={c.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[color-mix(in_srgb,var(--warn)_8%,transparent)] border border-[color-mix(in_srgb,var(--warn)_25%,transparent)]">
                  <I n="wallet" size={16} className="text-[var(--warn)] mt-0.5 shrink-0" />
                  <div className="text-[0.74rem] font-bold leading-5">{c.name}
                    <span className="block text-mute font-medium">تجاوز الحد بـ {fmtMoney(c.balance - (c.creditLimit || 0))}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[color-mix(in_srgb,var(--brand)_7%,transparent)] border border-[color-mix(in_srgb,var(--brand)_20%,transparent)]">
                <I n="lock" size={16} className="text-[var(--brand)] mt-0.5 shrink-0" />
                <div className="text-[0.74rem] font-bold leading-5">فترتا يناير وفبراير مقفلتان
                  <span className="block text-mute font-medium">أي محاولة ترحيل إليهما ستُرفض تلقائياً</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Reveal className="lg:col-span-2">
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2"><I n="clock" size={18} className="text-[var(--brand)]" /> آخر الحركات المرحّلة اليوم</h3>
            <div className="relative overflow-hidden h-52" style={{ maskImage: "linear-gradient(180deg, transparent, black 12%, black 88%, transparent)" }}>
              <div className="space-y-2.5" style={{ animation: "ticker 18s linear infinite" }}>
                {[...feed, ...feed].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-panel border border-line/60">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${f.k === "ok" ? "bg-[var(--good)]" : f.k === "bad" ? "bg-[var(--bad)]" : f.k === "warn" ? "bg-[var(--warn)]" : "bg-[var(--brand)]"}`} />
                    <span className="text-[0.78rem] font-bold flex-1 truncate">{f.txt}</span>
                    <span className="font-num text-[0.68rem] text-mute shrink-0" dir="ltr">{f.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base flex items-center gap-2"><I n="book" size={18} className="text-[var(--brand)]" /> أحدث القيود</h3>
              <button className="text-[0.7rem] font-bold text-[var(--brand)] hover:underline" onClick={() => nav({ module: "gl", path: "mv.je" })}>عرض الكل</button>
            </div>
            <div className="space-y-2">
              {journals.slice(0, 5).map((j) => (
                <div key={j.id} className="flex items-center gap-3 py-2 border-b border-line/60 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.78rem] font-bold truncate">{j.desc}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-num text-[0.66rem] text-mute" dir="ltr">{j.no}</span>
                      <Chip s={j.status} />
                    </div>
                  </div>
                  <span className="font-num text-[0.8rem] font-bold shrink-0">{fmtN(j.lines.reduce((a, l) => a + l.debit, 0))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-line text-[0.7rem] font-bold text-mute flex items-center gap-1.5">
              <I n="check" size={14} className="text-[var(--good)]" /> جميع القيود متوازنة: المدين = الدائن ({fmtN(jeSum)} ر.ي)
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
