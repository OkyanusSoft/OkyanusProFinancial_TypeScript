import { useMemo, useRef, useState, type ReactNode } from "react";
import { useApp, vReq, vDup, vNum, parseCsv, sampleCsv, type CollKey, type AnyR } from "./store";
import { I, Modal, Empty, Chip } from "./ui";

/* ════════════════════════════════════════════════════════════
   محرّك الأدلة العام (Directory Engine)
   يوحّد: توليد الأرقام، الاستيراد، التحقق والتكرار، الحذف والصيانة
   ════════════════════════════════════════════════════════════ */

export interface FieldDef {
  k: string; label: string;
  type?: "text" | "number" | "select" | "date";
  req?: boolean; uniq?: boolean; opts?: { v: any; l: string }[];
  span?: boolean; hint?: string; readOnly?: boolean; placeholder?: string;
}
export interface ColDef { k: string; label: string; render?: (r: AnyR, app: ReturnType<typeof useApp>) => ReactNode; w?: string; num?: boolean }

export interface DirConf {
  coll: CollKey; title: string; icon: string; desc: string;
  fields: FieldDef[]; cols: ColDef[];
  prefix: string; importKey?: string; idField?: string; nameField?: string;
  extra?: (app: ReturnType<typeof useApp>) => ReactNode;
}

export function Directory({ conf }: { conf: DirConf }) {
  const app = useApp();
  const rows = app.db[conf.coll];
  const idF = conf.idField || "code";
  const nameF = conf.nameField || "name";
  const [q, setQ] = useState("");
  const [form, setForm] = useState<AnyR | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [del, setDel] = useState<AnyR | null>(null);
  const [imp, setImp] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AnyR[] | null>(null);

  const filtered = useMemo(() => rows.filter((r) =>
    !q || Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q.toLowerCase()))
  ), [rows, q]);

  const openNew = () => {
    const base: AnyR = { id: "" } as AnyR;
    conf.fields.forEach((f) => { base[f.k] = f.type === "number" ? "" : ""; });
    setForm(base); setIsNew(true); setErrs({});
  };
  const openEdit = (r: AnyR) => { setForm({ ...r }); setIsNew(false); setErrs({}); };

  const validate = (row: AnyR) => {
    const e: Record<string, string> = {};
    conf.fields.forEach((f) => {
      const v = row[f.k];
      if (f.req) { const m = vReq(v, f.label); if (m) e[f.k] = m; }
      if (f.uniq && v !== "" && v !== undefined) {
        const m = vDup(rows as AnyR[], f.k === idF ? "id" : f.k, v, row.id || undefined);
        if (m) e[f.k] = m;
      }
      if (f.type === "number" && v !== "" && v !== undefined) {
        const m = vNum(v, f.label); if (m) e[f.k] = m;
      }
    });
    return e;
  };

  const submit = () => {
    if (!form) return;
    const e = validate(form);
    if (Object.keys(e).length) { setErrs(e); app.toast("تعذّر الحفظ — راجع الحقول المميّزة بالأحمر", "err"); return; }
    const row = { ...form };
    if (!row.id) {
      const code = String(row[idF] || "").trim() || app.nextNo(conf.prefix);
      row.id = code; row[idF] = code; if (idF !== "code" && !row.code) row.code = code;
    }
    app.save(conf.coll, row);
    app.toast(isNew ? `أُضيف السجل «${row[nameF] || row.id}» ووُلّد رقمه تلقائياً` : `حُدّث السجل «${row[nameF] || row.id}» بنجاح`, "ok");
    setForm(null);
  };

  const onImportFile = (f: File) => {
    const rd = new FileReader();
    rd.onload = () => {
      const grid = parseCsv(String(rd.result || ""));
      if (grid.length < 2) { app.toast("الملف فارغ أو غير صالح", "err"); return; }
      const headers = grid[0];
      const mapped = grid.slice(1).map((r) => {
        const o: AnyR = { id: "" } as AnyR;
        conf.fields.forEach((fd, i) => {
          const idx = headers.findIndex((h) => h.includes(fd.label) || fd.label.includes(h));
          o[fd.k] = idx >= 0 ? (r[idx] ?? "") : (i < headers.length && headers.length === conf.fields.length ? r[i] ?? "" : "");
        });
        return o;
      });
      setPending(mapped); setImp(true);
    };
    rd.readAsText(f);
  };

  const commitImport = () => {
    if (!pending) return;
    const res = app.importRows(conf.coll, pending, nameF === "name" ? "name" : idF === "code" ? "code" : idF, conf.prefix);
    app.toast(`اكتمل الاستيراد: أُضيف ${res.added} سجل، وتُخطي ${res.skipped} (تكرار أو ناقص)`, res.skipped ? "info" : "ok");
    setPending(null); setImp(false);
  };

  const trashItems = app.trash.filter((t) => t.coll === conf.coll);

  return (
    <div className="anim-fadein">
      {/* رأس الصفحة */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}>
            <I n={conf.icon} size={23} />
          </span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">{conf.title}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">{conf.desc}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
          <button className="btn btn-ghost" onClick={() => {
            if (conf.importKey) {
              const rows = sampleCsv(conf.importKey).split("\n").map((l) => l.split(","));
              app.exportCsv(`نموذج_استيراد_${conf.title}`, rows);
            }
            fileRef.current?.click();
          }} title="تنزيل النموذج ثم اختيار ملف CSV">
            <I n="down" size={15} /> استيراد بيانات
          </button>
          <button className="btn btn-ghost" onClick={() => app.exportCsv(conf.title, [conf.cols.map((c) => c.label), ...filtered.map((r) => conf.cols.map((c) => { const v = r[c.k]; return typeof v === "object" ? JSON.stringify(v) : String(v ?? ""); }))])}>
            <I n="xlsx" size={15} /> تصدير Excel
          </button>
          {trashItems.length > 0 && (
            <button className="btn btn-ghost !text-[var(--bad)]" onClick={() => setShowTrash(true)}>
              <I n="trash" size={15} /> السلة ({trashItems.length})
            </button>
          )}
          <button className="btn btn-brand" onClick={openNew}><I n="plus" size={16} /> إضافة جديد</button>
        </div>
      </div>

      {conf.extra?.(app)}

      {/* شريط البحث */}
      <div className="flex items-center gap-3 mb-3.5">
        <div className="relative w-80 max-w-full">
          <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
          <input className="input !ps-9" placeholder="بحث فوري في السجلات…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{filtered.length} سجل</span>
        <span className="text-[0.7rem] font-bold text-mute hidden md:flex items-center gap-1"><I n="check" size={13} className="text-[var(--good)]" /> تحقق تلقائي من التكرار مفعّل</span>
      </div>

      {/* الجدول */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? <Empty msg="لا توجد سجلات مطابقة — أضف سجلاً جديداً أو استورد البيانات" /> : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[760px]">
              <thead><tr>{conf.cols.map((c) => <th key={c.k} style={c.w ? { width: c.w } : undefined}>{c.label}</th>)}<th style={{ width: "110px" }}>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    {conf.cols.map((c) => (
                      <td key={c.k} className={c.num ? "font-num" : ""}>{c.render ? c.render(r, app) : String(r[c.k] ?? "—")}</td>
                    ))}
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost !p-1.5" title="تعديل" onClick={() => openEdit(r)}><I n="edit" size={14} /></button>
                        <button className="btn btn-danger !p-1.5" title="حذف (ينقل إلى السلة)" onClick={() => setDel(r)}><I n="trash" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة الإضافة/التعديل */}
      {form && (
        <Modal open onClose={() => setForm(null)} title={isNew ? `إضافة — ${conf.title}` : `تعديل — ${form[nameF] || form.id}`} icon={conf.icon} wide>
          <div className="grid md:grid-cols-2 gap-3.5">
            {conf.fields.map((f) => (
              <div key={f.k} className={f.span ? "md:col-span-2" : ""}>
                <label className="block">
                  <span className="text-[0.74rem] font-bold text-soft flex items-center gap-1">
                    {f.label} {f.req && <b className="text-[var(--bad)]">*</b>}
                    {f.k === idF && isNew && <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)] !text-[0.58rem] !py-0">يُولّد تلقائياً إن تُرك فارغاً</span>}
                  </span>
                  {f.type === "select" ? (
                    <select className={`select mt-1 ${errs[f.k] ? "!border-[var(--bad)]" : ""}`} value={form[f.k] ?? ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}>
                      <option value="">— اختر —</option>
                      {f.opts?.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      className={`input mt-1 ${f.type === "number" || f.k === idF ? "font-num" : ""} ${errs[f.k] ? "!border-[var(--bad)]" : ""}`}
                      dir={f.type === "number" ? "ltr" : undefined}
                      value={form[f.k] ?? ""} placeholder={f.placeholder}
                      readOnly={f.readOnly}
                      onChange={(e) => setForm({ ...form, [f.k]: f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value })} />
                  )}
                  {errs[f.k] && <span className="flex items-center gap-1 text-[0.68rem] font-bold text-[var(--bad)] mt-1"><I n="alert" size={12} /> {errs[f.k]}</span>}
                  {f.hint && !errs[f.k] && <span className="text-[0.66rem] text-mute font-medium mt-1 block">{f.hint}</span>}
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-line">
            <button className="btn btn-ghost" onClick={() => setForm(null)}>إلغاء</button>
            <button className="btn btn-brand" onClick={submit}><I n="save" size={15} /> {isNew ? "حفظ السجل الجديد" : "حفظ التعديلات"}</button>
          </div>
        </Modal>
      )}

      {/* تأكيد الحذف */}
      <Modal open={!!del} onClose={() => setDel(null)} title="تأكيد الحذف" icon="trash">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[color-mix(in_srgb,var(--bad)_7%,transparent)] border border-[color-mix(in_srgb,var(--bad)_25%,transparent)]">
          <I n="alert" size={20} className="text-[var(--bad)] shrink-0 mt-0.5" />
          <p className="text-[0.84rem] font-bold leading-6">
            سيُنقل السجل «{String(del?.[nameF] ?? del?.id)}» إلى <b>سلة المحذوفات</b> مع إيقاف أثره فوراً.
            <span className="block text-[0.72rem] text-mute font-medium mt-1">يمكنك استعادته لاحقاً من زر السلة، أو حذفه نهائياً من هناك (صيانة البيانات).</span>
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setDel(null)}>تراجع</button>
          <button className="btn btn-danger" onClick={() => { if (del) app.remove(conf.coll, del.id, String(del[nameF] ?? del.id)); setDel(null); }}>
            <I n="trash" size={15} /> نقل إلى السلة
          </button>
        </div>
      </Modal>

      {/* معاينة الاستيراد */}
      <Modal open={imp} onClose={() => { setImp(false); setPending(null); }} wide title="معاينة البيانات المستوردة" icon="down">
        {pending && (
          <>
            <div className="flex items-center gap-2 mb-3 text-[0.78rem] font-bold text-soft">
              <I n="info" size={16} className="text-[var(--brand)]" />
              تم تحليل <b className="font-num">{pending.length}</b> صف — السجلات المكررة (حسب حقل التعريف) ستُتخطى تلقائياً.
            </div>
            <div className="card overflow-hidden max-h-72 overflow-y-auto">
              <table className="tbl">
                <thead><tr><th>#</th>{conf.fields.map((f) => <th key={f.k}>{f.label}</th>)}<th>الفحص</th></tr></thead>
                <tbody>
                  {pending.map((r, i) => {
                    const keyVal = String(r[nameF === "name" ? "name" : idF] ?? r.name ?? "");
                    const dup = keyVal && rows.some((x) => String(x[nameF === "name" ? "name" : idF]) === keyVal);
                    return (
                      <tr key={i} className={dup ? "opacity-50" : ""}>
                        <td className="font-num text-mute">{i + 1}</td>
                        {conf.fields.map((f) => <td key={f.k} className="font-num">{String(r[f.k] ?? "—")}</td>)}
                        <td>{dup ? <Chip s="مرفوض" /> : <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]">جديد ✓</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => { setImp(false); setPending(null); }}>إلغاء</button>
              <button className="btn btn-brand" onClick={commitImport}><I n="check" size={15} /> تأكيد الاستيراد</button>
            </div>
          </>
        )}
      </Modal>

      {/* سلة المحذوفات */}
      <Modal open={showTrash} onClose={() => setShowTrash(false)} wide title={`سلة المحذوفات — ${conf.title}`} icon="trash">
        {trashItems.length === 0 ? <Empty msg="السلة فارغة" /> : (
          <div className="space-y-2">
            {trashItems.map((t, i) => {
              const idx = app.trash.indexOf(t);
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-panel border border-line">
                  <I n="trash" size={16} className="text-[var(--bad)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[0.84rem]">{String(t.row[nameF] ?? t.row.id)}</div>
                    <div className="text-[0.66rem] text-mute font-bold font-num">حُذف في {t.at}</div>
                  </div>
                  <button className="btn btn-soft !py-1.5 !text-[0.72rem]" onClick={() => app.restore(idx)}><I n="undo" size={13} /> استعادة</button>
                  <button className="btn btn-danger !py-1.5 !text-[0.72rem]" onClick={() => app.purge(idx)}><I n="x" size={13} /> حذف نهائي</button>
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <button className="btn btn-danger !py-1.5" onClick={app.emptyTrash}><I n="trash" size={14} /> إفراغ السلة نهائياً</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ═══════ شاشة حركات عامة (سندات) ═══════ */
export function DocList({ docs, title, desc, icon, cols, onNew, newLabel, onView }: {
  docs: AnyR[]; title: string; desc: string; icon: string; cols: ColDef[];
  onNew?: () => void; newLabel?: string; onView?: (d: AnyR) => void;
}) {
  const app = useApp();
  const [q, setQ] = useState("");
  const filtered = docs.filter((d) => !q || JSON.stringify(d).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}>
            <I n={icon} size={23} />
          </span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">{title}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">{desc}</p>
          </div>
        </div>
        {onNew && <button className="btn btn-brand" onClick={onNew}><I n="plus" size={16} /> {newLabel || "سند جديد"}</button>}
      </div>
      <div className="relative w-80 max-w-full mb-3.5">
        <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
        <input className="input !ps-9" placeholder="بحث برقم السند أو البيان…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card overflow-hidden">
        {filtered.length === 0 ? <Empty msg="لا توجد سندات — أنشئ سنداً جديداً برقم يُولّد تلقائياً" /> : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[760px]">
              <thead><tr>{cols.map((c) => <th key={c.k}>{c.label}</th>)}<th style={{ width: "120px" }}>إجراءات</th></tr></thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id}>
                    {cols.map((c) => <td key={c.k} className={c.num ? "font-num" : ""}>{c.render ? c.render(d, app) : String(d[c.k] ?? "—")}</td>)}
                    <td>
                      <div className="flex gap-1">
                        {onView && <button className="btn btn-ghost !p-1.5" title="عرض التفاصيل" onClick={() => onView(d)}><I n="eye" size={14} /></button>}
                        {d.status !== "ملغي" && d.status !== "ملغاة" && (
                          <button className="btn btn-danger !p-1.5" title="إلغاء السند وعكس أثره" onClick={() => {
                            if (d.lines) app.voidInvDoc(d.id);
                            else if (d.no) { const kind = String(d.no).startsWith("PIN") ? "purchases" : String(d.no).startsWith("SRT") ? "returns" : "sales"; app.voidInvoice(kind as any, d.id); }
                          }}><I n="undo" size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
