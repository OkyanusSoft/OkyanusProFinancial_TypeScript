import { useState } from "react";
import { useApp } from "../store";
import { I, Empty, Chip, Modal } from "../ui";
import type { ActivityDef, SpecEntity } from "../data";
import { openPrint, ReportSheet, PTable } from "../print";

/* ═══════════ شاشة تفعيل الأنظمة والأنشطة — صلاحية صاحب النظام ═══════════ */
export function ActivationScreen() {
  const app = useApp();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);

  if (!app.ownerUnlocked) {
    return (
      <div className="anim-fadein flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 w-full max-w-md text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: "linear-gradient(90deg, var(--bad), var(--warn), var(--bad))" }} />
          <span className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-4 bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-[var(--bad)]"><I n="lock" size={30} /></span>
          <h1 className="font-display font-bold text-2xl">تفعيل الأنظمة والأنشطة</h1>
          <p className="text-mute text-[0.8rem] font-bold mt-2 leading-6">
            هذه الشاشة محجوزة <b className="text-[var(--bad)]">لصاحب النظام فقط</b>.<br />تشكّل القائمة الرئيسية حسب نشاط العميل وتفعّل الوحدات المتخصصة.
          </p>
          <div className="mt-5">
            <label className="block text-start"><span className="text-[0.74rem] font-bold text-soft">الرقم السري للمالك</span>
              <input type="password" dir="ltr" className={`input mt-1.5 font-num text-center tracking-[0.4em] text-lg ${err ? "!border-[var(--bad)]" : ""}`}
                value={pin} placeholder="••••" maxLength={8}
                onChange={(e) => { setPin(e.target.value); setErr(false); }}
                onKeyDown={(e) => e.key === "Enter" && submit()} />
            </label>
            {err && <p className="text-[0.72rem] font-bold text-[var(--bad)] mt-2 flex items-center justify-center gap-1"><I n="alert" size={13} /> رقم سري غير صحيح — محاولة مرفوضة وسُجّلت</p>}
            <button className="btn btn-brand w-full mt-4 !py-3" onClick={submit}><I n="unlock" size={17} /> فتح لوحة التفعيل</button>
            <p className="text-[0.66rem] font-bold text-mute mt-3">تلميح للتجربة: الرقم السري هو <span className="font-num text-[var(--brand)]" dir="ltr">1234</span></p>
          </div>
        </div>
      </div>
    );
  }

  function submit() {
    if (app.unlockOwner(pin)) { app.toast("تم التحقق من هوية صاحب النظام — فُتحت لوحة التفعيل", "ok"); }
    else { setErr(true); app.toast("رفض الوصول: رقم سري غير صحيح", "err"); }
  }

  const activeCount = app.activeSystems.length;
  const primary = app.activities.find((a) => a.id === app.primaryActivity);

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-white shadow-lg" style={{ background: "linear-gradient(135deg, var(--bad), var(--warn))" }}><I n="shield" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight flex items-center gap-2">تفعيل الأنظمة والأنشطة <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]"><I n="unlock" size={12} /> وضع المالك</span></h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">فُعّل {activeCount} من {app.activities.length} نظاماً — النشاط الأساسي: «{primary?.name}» يكيّف المصطلحات ونمط نقاط البيع</p>
          </div>
        </div>
        <button className="btn btn-danger" onClick={() => { app.lockOwner(); setPin(""); app.toast("أُقفلت لوحة التفعيل", "info"); }}><I n="lock" size={16} /> قفل اللوحة</button>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3 justify-between" style={{ background: "color-mix(in srgb, var(--brand) 6%, var(--panel))" }}>
        <div className="text-[0.8rem] font-bold text-soft flex items-center gap-2"><I n="info" size={16} className="text-[var(--brand)]" /> تفعيل أي نظام يُظهره فوراً في القائمة الرئيسية ولوحة التحكم، ويهيّئ وحداته وبياناته التكيفية</div>
        <button className="btn btn-ghost !py-1.5" onClick={() => app.exportCsv("الأنظمة_المفعلة", [["النظام", "الحالة", "نمط POS"], ...app.activities.map((a) => [a.name, app.activeSystems.includes(a.id) ? "مفعّل" : "معطّل", a.posMode])])}><I n="xlsx" size={14} /> تصدير القائمة</button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
        {app.activities.map((a) => {
          const on = app.activeSystems.includes(a.id);
          const isPrimary = app.primaryActivity === a.id;
          return (
            <div key={a.id} className={`card card-lift p-4 relative overflow-hidden transition-all ${on ? "ring-1 ring-[color-mix(in_srgb,var(--brand)_40%,transparent)]" : "opacity-90"}`}>
              <div className="absolute top-0 inset-x-0 h-1" style={{ background: on ? `linear-gradient(90deg, ${a.color}, var(--brand))` : "var(--line)" }} />
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-xl grid place-items-center text-white shrink-0" style={{ background: `linear-gradient(135deg, ${a.color}, color-mix(in srgb, ${a.color} 60%, #000))` }}><I n={a.icon} size={21} /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-[0.95rem] flex items-center gap-2">{a.name}{isPrimary && <span className="chip bg-[color-mix(in_srgb,var(--warn)_15%,transparent)] text-[var(--warn)] !text-[0.58rem] !py-0">أساسي</span>}</div>
                  <p className="text-[0.7rem] text-mute font-medium mt-0.5 leading-5">{a.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="chip bg-[color-mix(in_srgb,var(--mute)_12%,transparent)] text-[var(--soft)] !text-[0.6rem]">{a.entities.length} وحدة</span>
                    <span className="chip bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] !text-[0.6rem]">POS: {a.posMode === "restaurant" ? "مطاعم/طاولات" : a.posMode === "retail" ? "تجزئة" : "—"}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3.5">
                {on ? (
                  <>
                    <button className="btn btn-danger !py-1.5 !text-[0.72rem] flex-1" onClick={() => setConfirmDeactivate(a.id)}><I n="x" size={13} /> تعطيل</button>
                    {!isPrimary && <button className="btn btn-soft !py-1.5 !text-[0.72rem] flex-1" onClick={() => app.setPrimaryActivity(a.id)}><I n="check" size={13} /> اجعله الأساسي</button>}
                    {isPrimary && <span className="btn btn-ghost !py-1.5 !text-[0.72rem] flex-1 !text-[var(--warn)] pointer-events-none">النشاط الأساسي</span>}
                  </>
                ) : (
                  <button className="btn btn-brand !py-1.5 !text-[0.72rem] flex-1" onClick={() => app.toggleSystem(a.id)}><I n="plus" size={13} /> تفعيل النظام</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!confirmDeactivate} onClose={() => setConfirmDeactivate(null)} title="تأكيد تعطيل النظام" icon="alert">
        <p className="text-[0.84rem] font-bold leading-6">
          سيُعطّل نظام «{app.activities.find((a) => a.id === confirmDeactivate)?.name}» وتُخفى قوائمه من الواجهة.
          <span className="block text-[0.72rem] text-mute font-medium mt-1.5">بياناته تبقى محفوظة ويمكن إعادة تفعيله في أي وقت دون فقدان.</span>
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setConfirmDeactivate(null)}>تراجع</button>
          <button className="btn btn-danger" onClick={() => { if (confirmDeactivate) app.toggleSystem(confirmDeactivate); setConfirmDeactivate(null); }}><I n="x" size={15} /> تعطيل النظام</button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════ الشاشة الديناميكية لنظام متخصص ═══════════ */
export function SpecModule({ activityId }: { activityId: string }) {
  const app = useApp();
  const act = app.activities.find((a) => a.id === activityId);
  const [entId, setEntId] = useState(act?.entities[0]?.id || "");
  if (!act) return <Empty msg="النظام غير معروف أو معطّل" />;
  const ent = act.entities.find((e) => e.id === entId) || act.entities[0];
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${act.color}, color-mix(in srgb, ${act.color} 55%, #000))` }}><I n={act.icon} size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">نظام {act.name}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">{act.desc} — {act.entities.length} وحدة متخصصة تكيفية</p>
          </div>
        </div>
        <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">نشاط مفعّل • يرحّل للحسابات العامة</span>
      </div>
      {act.entities.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-line mb-5 px-1">
          {act.entities.map((e) => (
            <button key={e.id} onClick={() => setEntId(e.id)} className={`tabline flex items-center gap-1.5 px-3.5 py-2.5 text-[0.82rem] font-bold whitespace-nowrap ${ent.id === e.id ? "on text-[var(--brand)]" : "text-mute hover:text-ink"}`}>
              <I n={e.icon} size={15} /> {e.label}
            </button>
          ))}
        </div>
      )}
      <SpecEntityScreen act={act} ent={ent} />
    </div>
  );
}

function SpecEntityScreen({ act, ent }: { act: ActivityDef; ent: SpecEntity }) {
  const app = useApp();
  const key = `${act.id}:${ent.id}`;
  const rows = app.specData[key] || [];
  const [q, setQ] = useState("");
  const [form, setForm] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);
  const [del, setDel] = useState<any>(null);

  const filtered = rows.filter((r) => !q || Object.values(r).some((v) => String(v ?? "").includes(q)));
  const prefix = `${act.id.slice(0, 2).toUpperCase()}-${ent.id.slice(0, 2).toUpperCase()}`;

  const submit = () => {
    const missing = ent.fields.filter((f) => f.req && !String(form[f.k] ?? "").trim());
    if (missing.length) { app.toast(`الحقول المطلوبة ناقصة: ${missing.map((f) => f.label).join("، ")}`, "err"); return; }
    const row = { ...form };
    if (!row.id) { const id = `${prefix}-${String(rows.length + 1).padStart(2, "0")}`; row.id = id; row.code = id; }
    if (!row.status && ent.statuses) row.status = ent.statuses[0];
    app.saveSpec(key, row);
    app.toast(isNew ? "أُضيف السجل ووُلّد رقمه تلقائياً" : "حُدّث السجل بنجاح", "ok");
    setForm(null);
  };

  const amount = (r: any) => Number(r[ent.amountField || "amount"] || r.amount || r.cost || r.price || 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3.5">
        <div className="relative w-80 max-w-full">
          <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
          <input className="input !ps-9" placeholder={`بحث فوري في ${ent.label}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{filtered.length} سجل</span>
        <div className="ms-auto flex gap-2">
          <button className="btn btn-ghost" onClick={() => app.exportCsv(ent.label, [ent.fields.map((f) => f.label), ...filtered.map((r) => ent.fields.map((f) => String(r[f.k] ?? "")))])}><I n="xlsx" size={15} /> Excel</button>
          <button className="btn btn-soft" onClick={() => openPrint(
            <ReportSheet title={ent.label} subtitle={`نظام ${act.name} — النظام المالي المتكامل`} user={app.session?.user || "—"}
              summary={[["عدد السجلات", String(filtered.length)]]}>
              <PTable head={ent.fields.map((f) => f.label)} rows={filtered.map((r) => ent.fields.map((f) => <span className={f.type === "number" ? "num" : ""}>{String(r[f.k] ?? "—")}</span>))} />
            </ReportSheet>
          )}><I n="print" size={15} /> طباعة</button>
          <button className="btn btn-brand" onClick={() => { setForm({}); setIsNew(true); }}><I n="plus" size={16} /> إضافة سجل</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? <Empty msg="لا توجد سجلات — أضف سجلاً جديداً" /> : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[820px]">
              <thead>
                <tr>
                  {ent.fields.map((f) => <th key={f.k}>{f.label}</th>)}
                  {ent.statusField ? <th>الحالة</th> : null}
                  <th style={{ width: "180px" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    {ent.fields.map((f) => (
                      <td key={f.k} className={f.type === "number" ? "font-num" : ""}>{f.amount ? <b className="font-num">{app.fmtN(Number(r[f.k] || 0))}</b> : String(r[f.k] ?? "—")}</td>
                    ))}
                    {ent.statusField && <td><Chip s={String(r[ent.statusField])} /></td>}
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-1.5" title="تعديل" onClick={() => { setForm({ ...r }); setIsNew(false); }}><I n="edit" size={14} /></button>
                        {amount(r) > 0 && <button className="btn btn-ghost !p-1.5 !text-[var(--good)]" title="ترحيل القيمة للحسابات العامة" onClick={() => app.postSpecToGL(key, r, amount(r), ent.label)}><I n="book" size={14} /></button>}
                        <button className="btn btn-danger !p-1.5" title="حذف" onClick={() => setDel(r)}><I n="trash" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <Modal open onClose={() => setForm(null)} title={isNew ? `إضافة — ${ent.label}` : `تعديل — ${form.name || form.id}`} icon={ent.icon} wide>
          <div className="grid md:grid-cols-2 gap-3.5">
            {ent.fields.map((f) => (
              <div key={f.k} className={f.span ? "md:col-span-2" : ""}>
                <label className="block">
                  <span className="text-[0.74rem] font-bold text-soft flex items-center gap-1">{f.label}{f.req && <b className="text-[var(--bad)]">*</b>}</span>
                  {f.type === "select" ? (
                    <select className="select mt-1" value={form[f.k] ?? ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}>
                      <option value="">— اختر —</option>
                      {f.opts?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      className={`input mt-1 ${f.type === "number" ? "font-num" : ""}`} dir={f.type === "number" ? "ltr" : undefined}
                      value={form[f.k] ?? ""} onChange={(e) => setForm({ ...form, [f.k]: f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value })} />
                  )}
                </label>
              </div>
            ))}
            {ent.statusField && ent.statuses && (
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">الحالة</span>
                <select className="select mt-1" value={form[ent.statusField] ?? ent.statuses[0]} onChange={(e) => setForm({ ...form, [ent.statusField!]: e.target.value })}>
                  {ent.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></label>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-line">
            <button className="btn btn-ghost" onClick={() => setForm(null)}>إلغاء</button>
            <button className="btn btn-brand" onClick={submit}><I n="save" size={15} /> {isNew ? "حفظ السجل" : "حفظ التعديلات"}</button>
          </div>
        </Modal>
      )}

      <Modal open={!!del} onClose={() => setDel(null)} title="تأكيد الحذف" icon="trash" subtitle="حذف آمن — ينشر شاهد الحذف لكل أجهزة الشبكة">
        <p className="text-[0.84rem] font-bold leading-6">سيُحذف «{String(del?.name || del?.code || del?.id)}» من {ent.label} ويُعمَّم الحذف على كل الأجهزة عبر سجل الشواهد.</p>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setDel(null)}>تراجع</button>
          <button className="btn btn-danger" onClick={() => { if (del) app.removeSpec(key, del.id, String(del.name || del.id)); setDel(null); }}><I n="trash" size={15} /> حذف نهائي</button>
        </div>
      </Modal>
    </div>
  );
}
