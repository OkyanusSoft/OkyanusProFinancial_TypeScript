import { useMemo, useState } from "react";
import { useApp } from "../store";
import { Chip, Empty, I, Modal, PageHead, Reveal, Tabs } from "../ui";
import type { Journal, JournalLine } from "../data";

type Row = { account: string; debit: string; credit: string; currency: string; rate: number; analytical: string; costCenter: string };

export default function GL() {
  const app = useApp();
  const [tab, setTab] = useState(app.route.tab || "base");
  const [base, setBase] = useState("accounts");
  const [showJE, setShowJE] = useState<"يومية" | "قبض" | "صرف" | null>(null);
  const [rep, setRep] = useState("trial");
  const [stmtAcc, setStmtAcc] = useState("11111");
  const [showAna, setShowAna] = useState(false);
  const [newAna, setNewAna] = useState({ name: "", phone: "", note: "" });

  const posting = app.accounts.filter((a) => a.posting);

  /* أرصدة الحسابات من القيود المرحّلة */
  const balances = useMemo(() => {
    const map: Record<string, { dr: number; cr: number }> = {};
    app.journals.filter((j) => j.status !== "ملغي").forEach((j) =>
      j.lines.forEach((l) => {
        map[l.account] = map[l.account] || { dr: 0, cr: 0 };
        map[l.account].dr += l.debit * l.rate;
        map[l.account].cr += l.credit * l.rate;
      })
    );
    return map;
  }, [app.journals]);
  const bal = (code: string) => { const b = balances[code] || { dr: 0, cr: 0 }; return b.dr - b.cr; };
  const sumType = (t: string) => app.accounts.filter((a) => a.posting && a.type === t).reduce((s, a) => s + bal(a.code), 0);

  const totalDr = Object.values(balances).reduce((a, b) => a + b.dr, 0);
  const totalCr = Object.values(balances).reduce((a, b) => a + b.cr, 0);

  const stmtLines = app.journals.filter((j) => j.status !== "ملغي").flatMap((j) => j.lines.filter((l) => l.account === stmtAcc).map((l) => ({ ...l, no: j.no, date: j.date, desc: j.desc })));

  const tree = useMemo(() => {
    const roots = app.accounts.filter((a) => a.level === 1);
    const children = (code: string) => app.accounts.filter((a) => a.parent === code);
    return { roots, children };
  }, [app.accounts]);

  return (
    <div>
      <PageHead icon="book" title="وحدة الحسابات العامة" desc="دليل هرمي من 5 مستويات، قيد مزدوج متعدد العملات، حسابات تحليلية، وتقارير IFRS">
        <button className="btn btn-brand" onClick={() => setShowJE("يومية")}><I n="plus" size={16} /> سند قيد يومية</button>
      </PageHead>
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "base", label: "البيانات الأساسية", icon: "layers" },
        { id: "moves", label: "القيود والسندات", icon: "receipt" },
        { id: "reports", label: "التقارير المالية", icon: "scale" },
      ]} />

      {tab === "base" && (
        <div className="anim-fadein">
          <div className="flex flex-wrap gap-2 mb-4">
            {[["accounts", "دليل الحسابات", "layers"], ["analytical", "الحسابات التحليلية", "users"], ["periods", "الفترات المالية", "lock"], ["currencies", "العملات وأسعار الصرف", "coins"], ["cost", "مراكز التكلفة", "bld"]].map(([id, l, ic]) => (
              <button key={id} onClick={() => setBase(id)} className={`btn !py-2 ${base === id ? "btn-brand" : "btn-ghost"}`}><I n={ic} size={15} /> {l}</button>
            ))}
          </div>

          {base === "accounts" && (
            <Reveal><div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-line bg-panel flex items-center justify-between">
                <h3 className="font-display font-bold text-sm">دليل الحسابات — 5 مستويات (أصول / خصوم / حقوق ملكية / إيرادات / مصروفات)</h3>
                <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]">متوازن ✓ {app.fmtN(totalDr)} = {app.fmtN(totalCr)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="tbl min-w-[860px]">
                  <thead><tr><th>الكود</th><th>اسم الحساب</th><th>المستوى</th><th>التصنيف</th><th>طبيعة</th><th>الرصيد</th><th>خاصية</th></tr></thead>
                  <tbody>
                    {tree.roots.map((r) => (
                      <AccRows key={r.code} acc={r} depth={0} children={tree.children} bal={bal} fmtN={app.fmtN} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div></Reveal>
          )}

          {base === "analytical" && (
            <div className="space-y-4">
              <Reveal>
                <div className="card p-5" style={{ background: "linear-gradient(120deg, color-mix(in srgb, var(--brand) 10%, var(--surface)), var(--surface))" }}>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)]" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}><I n="users" size={23} /></span>
                    <div className="flex-1 min-w-[240px]">
                      <h3 className="font-display font-bold text-lg">نقطة الابتكار: الحسابات التحليلية</h3>
                      <p className="text-[0.8rem] text-soft font-medium leading-6 mt-0.5">
                        بدلاً من تضخيم دليل الحسابات بآلاف الأسماء (كمرضى المستشفى)، يُربط حساب المستوى الخامس
                        <span className="font-num font-bold mx-1" dir="ltr">11212</span>«نزلاء المستشفى» بأسماء تحليلية مستقلة —
                        فتُتابَع ذمم كل مريض بدقة مع بقاء الدليل نظيفاً، ويُجمَع الإجمالي تلقائياً في الحساب الأم.
                      </p>
                    </div>
                    <button className="btn btn-brand" onClick={() => setShowAna(true)}><I n="plus" size={16} /> ربط اسم تحليلي</button>
                  </div>
                </div>
              </Reveal>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
                {app.analyticals.map((a) => {
                  const balance = a.open + a.debit - a.credit;
                  return (
                    <div key={a.id} className="card card-lift p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-full grid place-items-center font-display font-bold text-sm bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]">{a.name.slice(0, 2)}</span>
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
                <div className="card p-5 grid place-items-center border-dashed">
                  <div className="text-center">
                    <div className="font-num font-bold text-2xl text-[var(--brand)]">{app.fmtN(app.analyticals.reduce((s, a) => s + a.open + a.debit - a.credit, 0))}</div>
                    <div className="text-[0.72rem] font-bold text-mute mt-1">إجمالي الذمم التحليلية = رصيد الحساب 11212</div>
                    <div className="text-[0.66rem] font-bold text-[var(--good)] mt-2 flex items-center justify-center gap-1"><I n="check" size={13} /> مطابقة تلقائية مع الأستاذ العام</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {base === "periods" && (
            <Reveal><div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-line bg-panel flex items-center gap-2">
                <I n="lock" size={16} className="text-[var(--brand)]" />
                <h3 className="font-display font-bold text-sm">الفترات المالية — الإقفال يحمي القيود المرحّلة من أي تعديل (Going Concern)</h3>
              </div>
              <table className="tbl">
                <thead><tr><th>الفترة</th><th>المعرف</th><th>الحالة</th><th>تاريخ الإقفال</th><th>القيود المرحّلة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {app.periods.map((p) => {
                    const cnt = app.journals.filter((j) => j.date.startsWith(p.id) && j.status !== "ملغي").length;
                    return (
                      <tr key={p.id}>
                        <td className="font-bold">{p.label}</td>
                        <td className="font-num" dir="ltr">{p.id}</td>
                        <td><Chip s={p.locked ? "مقفلة" : "مفتوحة"} /></td>
                        <td className="font-num">{p.closedAt ? app.fmtDate(p.closedAt) : "—"}</td>
                        <td className="font-num text-center">{cnt}</td>
                        <td>{p.locked
                          ? <span className="flex items-center gap-1.5 text-[0.74rem] font-bold text-mute"><I n="lock" size={14} /> محصّنة ضد الكتابة</span>
                          : <button className="btn btn-danger !py-1.5 !text-[0.74rem]" onClick={() => app.lockPeriod(p.id)}><I n="lock" size={14} /> إقفال الفترة</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></Reveal>
          )}

          {base === "currencies" && (
            <Reveal><div className="card overflow-hidden">
              <table className="tbl">
                <thead><tr><th>الرمز</th><th>العملة</th><th>سعر الصرف مقابل الريال</th><th>تاريخ التحديث</th><th>النوع</th><th>إجراء</th></tr></thead>
                <tbody>
                  {app.currencies.map((c) => (
                    <tr key={c.code}>
                      <td><span className="w-9 h-9 rounded-lg grid place-items-center font-num font-bold bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)]" dir="ltr">{c.code}</span></td>
                      <td className="font-bold">{c.name}</td>
                      <td className="font-num font-bold">{app.fmtN(c.rate)} <span className="text-[0.66rem] text-mute">ر.ي</span></td>
                      <td className="font-num text-mute">2026-03-29</td>
                      <td>{c.base ? <span className="chip bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]">عملة الأساس</span> : <span className="chip bg-[color-mix(in_srgb,var(--mute)_15%,transparent)] text-[var(--soft)]">أجنبية</span>}</td>
                      <td>{!c.base && <button className="btn btn-soft !py-1.5 !text-[0.72rem]" onClick={() => app.toast(`تم تحديث سعر ${c.code} — سُجّل في سجل أسعار الصرف`, "ok")}><I n="refresh" size={13} /> تحديث السعر</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></Reveal>
          )}

          {base === "cost" && (
            <div className="grid md:grid-cols-2 gap-4 stagger">
              {app.costCenters.filter((c) => !c.parent).map((c) => (
                <div key={c.code} className="card card-lift p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl grid place-items-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]"><I n="bld" size={19} /></span>
                      <div><div className="font-display font-bold">{c.name}</div><div className="text-[0.66rem] text-mute font-bold font-num" dir="ltr">{c.code}</div></div>
                    </div>
                    <Chip s="رئيسي" />
                  </div>
                  <div className="text-[0.74rem] font-bold text-mute mt-2">المسؤول: {c.manager}</div>
                  {app.costCenters.filter((s) => s.parent === c.code).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {app.costCenters.filter((s) => s.parent === c.code).map((s) => (
                        <div key={s.code} className="flex items-center justify-between ps-4 border-s-2 border-[color-mix(in_srgb,var(--brand)_35%,transparent)] bg-panel rounded-lg px-3 py-2">
                          <div className="text-[0.78rem] font-bold">{s.name} <span className="text-mute font-medium">— {s.manager}</span></div>
                          <Chip s="فرعي" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "moves" && <JEMoves onNew={(k) => setShowJE(k)} />}

      {tab === "reports" && (
        <div className="anim-fadein">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[["trial", "ميزان المراجعة"], ["stmt", "كشف حساب"], ["bs", "الميزانية العمومية"], ["pl", "قائمة الدخل"]].map(([id, l]) => (
              <button key={id} onClick={() => setRep(id)} className={`btn !py-1.5 !px-3.5 ${rep === id ? "btn-brand" : "btn-ghost"}`}>{l}</button>
            ))}
            <button className="btn btn-ghost ms-auto !py-1.5" onClick={() => app.exportCsv("ميزان_المراجعة", [["الحساب", "مدين", "دائن"], ...posting.map((a) => [a.name, Math.max(0, bal(a.code)), Math.max(0, -bal(a.code))])])}><I n="xlsx" size={15} /> Excel</button>
          </div>

          {rep === "trial" && (
            <Reveal><div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-line bg-panel flex items-center justify-between">
                <h3 className="font-display font-bold text-sm">ميزان المراجعة — حتى 2026-03-29 (بمعيار IFRS)</h3>
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
            </div></Reveal>
          )}

          {rep === "stmt" && (
            <Reveal><div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-line bg-panel flex flex-wrap items-center gap-3">
                <h3 className="font-display font-bold text-sm">كشف حساب تفصيلي</h3>
                <select className="select !w-72 !py-1.5" value={stmtAcc} onChange={(e) => setStmtAcc(e.target.value)}>
                  {posting.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                </select>
              </div>
              {stmtLines.length ? (
                <div className="overflow-x-auto"><table className="tbl min-w-[680px]">
                  <thead><tr><th>التاريخ</th><th>القيد</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
                  <tbody>{(() => { let run = 0; return stmtLines.map((l, i) => { run += (l.debit - l.credit) * l.rate; return (
                    <tr key={i}>
                      <td className="font-num">{app.fmtDate(l.date)}</td>
                      <td className="font-num" dir="ltr">{l.no}</td>
                      <td className="font-bold">{l.desc}{l.analytical && <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)] me-1">{app.analyticals.find((a) => a.id === l.analytical)?.name}</span>}</td>
                      <td className="font-num">{l.debit ? app.fmtN(l.debit * l.rate) : "—"}</td>
                      <td className="font-num">{l.credit ? app.fmtN(l.credit * l.rate) : "—"}</td>
                      <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(run)}</td>
                    </tr>); }); })()}</tbody>
                </table></div>
              ) : <Empty msg="لا توجد حركات على هذا الحساب خلال الفترة" />}
            </div></Reveal>
          )}

          {rep === "bs" && (
            <div className="grid md:grid-cols-2 gap-4 stagger">
              <div className="card p-5">
                <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="scale" size={18} className="text-[var(--brand)]" /> الأصول</h3>
                {["أصول"].map((t) => (
                  <div key={t} className="space-y-2">
                    {posting.filter((a) => a.type === t && bal(a.code) !== 0).map((a) => (
                      <div key={a.code} className="flex justify-between text-[0.8rem] font-bold border-b border-line/60 pb-2"><span>{a.name} <span className="font-num text-mute" dir="ltr">({a.code})</span></span><span className="font-num">{app.fmtN(bal(a.code))}</span></div>
                    ))}
                    <div className="flex justify-between font-display font-bold text-[var(--brand)] pt-1"><span>إجمالي الأصول</span><span className="font-num">{app.fmtN(sumType("أصول"))}</span></div>
                  </div>
                ))}
              </div>
              <div className="card p-5">
                <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="shield" size={18} className="text-[var(--warn)]" /> الخصوم وحقوق الملكية</h3>
                <div className="space-y-2">
                  {posting.filter((a) => (a.type === "خصوم" || a.type === "حقوق ملكية") && bal(a.code) !== 0).map((a) => (
                    <div key={a.code} className="flex justify-between text-[0.8rem] font-bold border-b border-line/60 pb-2"><span>{a.name} <span className="font-num text-mute" dir="ltr">({a.code})</span></span><span className="font-num">{app.fmtN(-bal(a.code))}</span></div>
                  ))}
                  <div className="flex justify-between text-[0.8rem] font-bold border-b border-line/60 pb-2"><span>صافي ربح الفترة (قائمة الدخل)</span><span className="font-num text-[var(--good)]">{app.fmtN(sumType("إيرادات") * -1 - sumType("مصروفات"))}</span></div>
                  <div className="flex justify-between font-display font-bold text-[var(--warn)] pt-1"><span>الإجمالي</span><span className="font-num">{app.fmtN(-sumType("خصوم") - sumType("حقوق ملكية") + (sumType("إيرادات") * -1 - sumType("مصروفات")))}</span></div>
                </div>
              </div>
            </div>
          )}

          {rep === "pl" && (
            <Reveal><div className="card p-6 max-w-2xl mx-auto">
              <h3 className="font-display font-bold text-lg text-center mb-1">قائمة الدخل (الأرباح والخسائر)</h3>
              <p className="text-center text-[0.72rem] font-bold text-mute mb-5">عن الفترة من 2026-01-01 حتى 2026-03-29 — وفقاً لمعايير IFRS</p>
              {(() => {
                const rev = -sumType("إيرادات"); const exp = sumType("مصروفات"); const net = rev - exp;
                const rows: [string, number, string?][] = [
                  ...posting.filter((a) => a.type === "إيرادات" && bal(a.code) !== 0).map((a) => [a.name, -bal(a.code), "rev"] as [string, number, string?]),
                  ["إجمالي الإيرادات", rev, "tot"],
                  ...posting.filter((a) => a.type === "مصروفات" && bal(a.code) !== 0).map((a) => [`(${a.name})`, -bal(a.code), "exp"] as [string, number, string?]),
                  ["إجمالي المصروفات", -exp, "tot"],
                  ["صافي الربح قبل الزكاة", net, "net"],
                ];
                return rows.map(([l, v, k], i) => (
                  <div key={i} className={`flex justify-between py-2.5 border-b border-line/70 text-[0.85rem] font-bold ${k === "tot" ? "bg-panel -mx-3 px-3 rounded-lg !border-0" : ""} ${k === "net" ? "font-display text-lg !border-0" : ""}`}>
                    <span className={k === "net" ? (v >= 0 ? "text-[var(--good)]" : "text-[var(--bad)]") : ""}>{l}</span>
                    <span className={`font-num ${k === "net" ? (v >= 0 ? "text-[var(--good)]" : "text-[var(--bad)]") : k === "tot" ? "text-[var(--brand)]" : ""}`}>{app.fmtN(v)}</span>
                  </div>
                ));
              })()}
              <div className="mt-4 text-center text-[0.72rem] font-bold text-mute">هامش صافي الربح: <span className="font-num text-[var(--good)]">{Math.round((( -sumType("إيرادات") - sumType("مصروفات")) / (-sumType("إيرادات") || 1)) * 100)}%</span></div>
            </div></Reveal>
          )}
        </div>
      )}

      {showJE && <JEBuilder kind={showJE} onClose={() => setShowJE(null)} />}

      <Modal open={showAna} onClose={() => setShowAna(false)} title="ربط حساب تحليلي جديد بالحساب 11212" icon="users">
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-panel border border-line text-[0.76rem] font-bold text-soft flex items-center gap-2">
            <I n="info" size={15} className="text-[var(--brand)] shrink-0" /> سيُربط الاسم بالحساب <span className="font-num" dir="ltr">11212 — نزلاء المستشفى</span> دون إنشاء حساب جديد في الدليل.
          </div>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الاسم الكامل</span><input className="input mt-1" value={newAna.name} onChange={(e) => setNewAna({ ...newAna, name: e.target.value })} placeholder="مثال: عبدالله أحمد النجار" /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الهاتف</span><input className="input mt-1 font-num" dir="ltr" value={newAna.phone} onChange={(e) => setNewAna({ ...newAna, phone: e.target.value })} placeholder="7XX-XXX-XXX" /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">القسم / الغرفة</span><input className="input mt-1" value={newAna.note} onChange={(e) => setNewAna({ ...newAna, note: e.target.value })} placeholder="قسم الجراحة — غرفة 120" /></label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setShowAna(false)}>إلغاء</button>
          <button className="btn btn-brand" onClick={() => { if (!newAna.name.trim()) { app.toast("الاسم مطلوب", "err"); return; } app.addAnalytical({ id: `AN-00${app.analyticals.length + 1}`, name: newAna.name, linkedAccount: "11212", open: 0, debit: 0, credit: 0, phone: newAna.phone, note: newAna.note }); setShowAna(false); }}><I n="check" size={15} /> ربط وتفعيل</button>
        </div>
      </Modal>
    </div>
  );
}

/* صف دليل الحسابات المتداخل */
function AccRows({ acc, depth, children, bal, fmtN }: { acc: (typeof import("../data").ACCOUNTS)[number]; depth: number; children: (c: string) => typeof import("../data").ACCOUNTS; bal: (c: string) => number; fmtN: (n: number) => string }) {
  const [open, setOpen] = useState(depth < 1);
  const kids = children(acc.code);
  const b = bal(acc.code);
  const tone = acc.type === "أصول" ? "var(--brand)" : acc.type === "إيرادات" ? "var(--good)" : acc.type === "مصروفات" ? "var(--warn)" : acc.type === "خصوم" ? "var(--bad)" : "var(--accent)";
  return (
    <>
      <tr className={acc.level === 5 ? "" : "bg-panel/60"}>
        <td className="font-num" dir="ltr" style={{ paddingInlineStart: `${0.8 + depth * 1.1}rem` }}>
          <span className="inline-flex items-center gap-1.5">
            {kids.length > 0 && <button onClick={() => setOpen(!open)} className="text-mute hover:text-[var(--brand)] transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }} aria-label="توسيع"><I n="chevS" size={13} /></button>}
            {acc.code}
          </span>
        </td>
        <td className={`font-bold ${acc.level === 5 ? "" : "font-display"}`}>{acc.name} <span className="text-[0.62rem] text-mute font-num" dir="ltr">{acc.en}</span></td>
        <td><span className="w-6 h-6 rounded-md grid place-items-center text-[0.66rem] font-num font-bold" style={{ background: `color-mix(in srgb, ${tone} 12%, transparent)`, color: tone }}>{acc.level}</span></td>
        <td><span className="chip" style={{ background: `color-mix(in srgb, ${tone} 10%, transparent)`, color: tone }}>{acc.type}</span></td>
        <td className="text-[0.74rem] font-bold text-mute">{acc.posting ? "ترحيلي" : "عنواني"}</td>
        <td className="font-num font-bold">{b !== 0 ? fmtN(b) : "—"}</td>
        <td>{acc.analytical ? <span className="chip bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]"><I n="users" size={11} /> تحليلي</span> : acc.level === 5 ? <span className="text-[0.7rem] text-mute font-bold">المستوى الخامس</span> : "—"}</td>
      </tr>
      {open && kids.map((k) => <AccRows key={k.code} acc={k} depth={depth + 1} children={children} bal={bal} fmtN={fmtN} />)}
    </>
  );
}

/* ── القيود والسندات ── */
function JEMoves({ onNew }: { onNew: (k: "يومية" | "قبض" | "صرف") => void }) {
  const app = useApp();
  const [filter, setFilter] = useState("الكل");
  const list = app.journals.filter((j) => filter === "الكل" || j.kind === filter || (filter === "طلب" && j.kind === "طلب"));
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {["الكل", "افتتاحي", "يومية", "قبض", "صرف", "طلب"].map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`btn !py-1.5 !px-3 !text-[0.76rem] ${filter === t ? "btn-brand" : "btn-ghost"}`}>{t}</button>
        ))}
        <div className="ms-auto flex gap-2">
          <button className="btn btn-soft" onClick={() => onNew("قبض")}><I n="down" size={15} /> سند قبض</button>
          <button className="btn btn-soft" onClick={() => onNew("صرف")}><I n="wallet" size={15} /> سند صرف</button>
          <button className="btn btn-brand" onClick={() => onNew("يومية")}><I n="plus" size={15} /> قيد يومية</button>
        </div>
      </div>
      <div className="space-y-3 stagger">
        {list.map((j) => {
          const dr = j.lines.reduce((a, l) => a + l.debit, 0);
          return (
            <div key={j.id} className="card p-4 card-lift">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${j.kind === "قبض" ? "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]" : j.kind === "صرف" ? "bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-[var(--bad)]" : j.kind === "طلب" ? "bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)]" : "bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]"}`}>
                  <I n={j.kind === "قبض" ? "down" : j.kind === "صرف" ? "wallet" : j.kind === "طلب" ? "clock" : j.kind === "افتتاحي" ? "cal" : "book"} size={19} />
                </span>
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-num font-bold text-[0.72rem]" dir="ltr">{j.no}</span>
                    <Chip s={j.status} />
                    <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)]">{j.source}</span>
                    <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)]">مركز: {j.lines[0]?.costCenter || "—"}</span>
                  </div>
                  <div className="font-bold text-[0.88rem] mt-1">{j.desc}</div>
                  <div className="text-[0.7rem] text-mute font-bold font-num mt-0.5" dir="ltr">{j.date} • by {j.user}</div>
                </div>
                <div className="text-end shrink-0">
                  <div className="text-[0.66rem] font-bold text-mute">قيمة القيد</div>
                  <div className="font-num font-bold text-lg text-[var(--brand)]">{app.fmtN(dr)} <span className="text-[0.66rem] text-mute">ر.ي</span></div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {j.status === "بانتظار الموافقة" && <button className="btn btn-brand !py-1.5 !text-[0.72rem]" onClick={() => app.approveJournal(j.id)}><I n="check" size={14} /> اعتماد</button>}
                  {j.status === "مرحّل" && j.kind !== "افتتاحي" && <button className="btn btn-danger !py-1.5" title="إلغاء القيد" onClick={() => app.voidJournal(j.id)}><I n="undo" size={14} /></button>}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-line/70 grid gap-1.5">
                {j.lines.filter((l) => l.debit || l.credit).map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-[0.76rem] font-bold">
                    <span className="flex items-center gap-2 text-soft"><span className="font-num text-mute" dir="ltr">{l.account}</span> {app.accounts.find((a) => a.code === l.account)?.name}
                      {l.analytical && <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)]">{app.analyticals.find((a) => a.id === l.analytical)?.name}</span>}
                      {l.currency !== "YER" && <span className="chip bg-[color-mix(in_srgb,var(--warn)_13%,transparent)] text-[var(--warn)] font-num">{l.currency} ×{l.rate}</span>}
                    </span>
                    <span className="font-num">{l.debit ? <span className="text-[var(--bad)]">مدين {app.fmtN(l.debit * l.rate)}</span> : <span className="text-[var(--good)]">دائن {app.fmtN(l.credit * l.rate)}</span>}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div className="card"><Empty msg="لا توجد قيود من هذا النوع" /></div>}
      </div>
    </div>
  );
}

/* ── منشئ القيود ── */
function JEBuilder({ kind, onClose }: { kind: "يومية" | "قبض" | "صرف"; onClose: () => void }) {
  const app = useApp();
  const [desc, setDesc] = useState(kind === "قبض" ? "سند قبض — تحصيل دفعة من عميل" : kind === "صرف" ? "سند صرف — سداد مستحقات" : "");
  const [date, setDate] = useState("2026-03-29");
  const [cc, setCc] = useState("CC-01");
  const [rows, setRows] = useState<Row[]>([
    { account: "11111", debit: "", credit: "", currency: "YER", rate: 1, analytical: "", costCenter: "CC-01" },
    { account: "11211", debit: "", credit: "", currency: "YER", rate: 1, analytical: "", costCenter: "" },
  ]);
  const posting = app.accounts.filter((a) => a.posting);
  const dr = rows.reduce((a, r) => a + (+r.debit || 0) * r.rate, 0);
  const cr = rows.reduce((a, r) => a + (+r.credit || 0) * r.rate, 0);
  const balanced = Math.abs(dr - cr) < 0.01 && dr > 0;

  const setRow = (i: number, patch: Partial<Row>) => setRows((old) => old.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const save = () => {
    if (!desc.trim()) { app.toast("البيان مطلوب", "err"); return; }
    if (!balanced) { app.toast(`القيد غير متوازن: مدين ${app.fmtN(dr)} مقابل دائن ${app.fmtN(cr)}`, "err"); return; }
    const no = `${kind === "قبض" ? "RC" : kind === "صرف" ? "PV" : "JE"}-2026-${1010 + app.journals.length}`;
    const lines: JournalLine[] = rows.filter((r) => +r.debit || +r.credit).map((r) => ({ account: r.account, debit: (+r.debit || 0) * r.rate, credit: (+r.credit || 0) * r.rate, currency: r.currency, rate: r.rate, analytical: r.analytical || undefined, costCenter: r.costCenter || undefined }));
    const res = app.addJournal({ id: no, no, date, desc, kind: "يومية", lines, user: app.session?.user || "—", status: "مرحّل", source: kind === "قبض" ? "سند قبض" : kind === "صرف" ? "سند صرف" : "سند قيد يومية" } as Journal);
    app.toast(res.msg, res.ok ? "ok" : "err");
    if (res.ok) onClose();
  };

  return (
    <Modal open onClose={onClose} wide icon="book" title={`طلب سند قيد ${kind === "يومية" ? "يومية" : kind}`}>
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <label className="block md:col-span-2"><span className="text-[0.74rem] font-bold text-soft">البيان</span><input className="input mt-1" value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">التاريخ</span><input type="date" className="input mt-1 font-num" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">مركز التكلفة</span>
          <select className="select mt-1" value={cc} onChange={(e) => setCc(e.target.value)}>{app.costCenters.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
      </div>

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
                  <td><select className="select !py-1.5 !w-24" value={r.currency} onChange={(e) => { const c = app.currencies.find((x) => x.code === e.target.value); setRow(i, { currency: e.target.value, rate: c?.rate || 1 }); }}>
                    {app.currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select></td>
                  <td>{acc?.analytical ? (
                    <select className="select !py-1.5 !w-36" value={r.analytical} onChange={(e) => setRow(i, { analytical: e.target.value })}>
                      <option value="">— بدون —</option>
                      {app.analyticals.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  ) : <span className="text-[0.68rem] text-mute font-bold">غير قابل</span>}</td>
                  <td><button className="text-mute hover:text-[var(--bad)] transition-colors" onClick={() => rows.length > 2 && setRows(rows.filter((_, j) => j !== i))} aria-label="حذف"><I n="trash" size={15} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="w-full py-2.5 text-[0.78rem] font-bold text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_6%,transparent)] transition-colors flex items-center justify-center gap-1.5 border-t border-line" onClick={() => setRows([...rows, { account: "11111", debit: "", credit: "", currency: "YER", rate: 1, analytical: "", costCenter: cc }])}>
          <I n="plus" size={14} /> إضافة سطر
        </button>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 border ${balanced ? "border-[color-mix(in_srgb,var(--good)_35%,transparent)] bg-[color-mix(in_srgb,var(--good)_7%,transparent)]" : "border-[color-mix(in_srgb,var(--bad)_35%,transparent)] bg-[color-mix(in_srgb,var(--bad)_6%,transparent)]"}`}>
        <div className="flex items-center gap-2 font-bold text-[0.82rem]">
          {balanced ? <I n="check" size={17} className="text-[var(--good)]" /> : <I n="alert" size={17} className="text-[var(--bad)]" />}
          <span className={balanced ? "text-[var(--good)]" : "text-[var(--bad)]"}>{balanced ? "القيد متوازن — جاهز للترحيل" : "القيد غير متوازن"}</span>
        </div>
        <div className="flex gap-4 font-num font-bold text-[0.85rem]">
          <span>مدين: <span className="text-[var(--bad)]">{app.fmtN(dr)}</span></span>
          <span>دائن: <span className="text-[var(--good)]">{app.fmtN(cr)}</span></span>
          <span>الفرق: <span className="text-[var(--warn)]">{app.fmtN(dr - cr)}</span></span>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
        <button className="btn btn-soft" onClick={() => app.toast("حُفظ القيد كمسودة في طلبات السندات", "info")}>حفظ كمسودة</button>
        <button className="btn btn-brand" disabled={!balanced} onClick={save}><I n="check" size={16} /> ترحيل القيد</button>
      </div>
    </Modal>
  );
}
