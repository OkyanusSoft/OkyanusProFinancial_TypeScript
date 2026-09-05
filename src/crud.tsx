import { useMemo, useRef, useState, type ReactNode } from "react";
import { useApp, vReq, vDup, vNum, parseCsv, sampleCsv, type CollKey, type AnyR } from "./store";
import { I, Modal, Empty, Chip } from "./ui";
import { printDirectory } from "./print";

/* ═══════ شريط أزرار الإجراءات — محكوم بالصلاحيات ═══════
   عرض / تعديل / حذف / طباعة / ترحيل / اعتماد              */
export type ActKey = "view" | "edit" | "del" | "print" | "post" | "approve";
const ACT_META: Record<ActKey, { icon: string; label: string; perm: string; cls: string; on: string }> = {
  view: { icon: "eye", label: "عرض", perm: "عرض", cls: "border-line text-soft hover:text-[var(--brand)] hover:border-[color-mix(in_srgb,var(--brand)_45%,transparent)]", on: "" },
  edit: { icon: "edit", label: "تعديل", perm: "تعديل", cls: "border-line text-soft hover:text-[var(--accent)] hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]", on: "" },
  print: { icon: "print", label: "طباعة", perm: "طباعة", cls: "border-line text-soft hover:text-[var(--brand)] hover:border-[color-mix(in_srgb,var(--brand)_45%,transparent)]", on: "" },
  post: { icon: "check", label: "ترحيل", perm: "ترحيل", cls: "border-[color-mix(in_srgb,var(--good)_30%,transparent)] text-[var(--good)] hover:bg-[color-mix(in_srgb,var(--good)_10%,transparent)]", on: "" },
  approve: { icon: "shield", label: "اعتماد", perm: "اعتماد", cls: "border-[color-mix(in_srgb,var(--warn)_35%,transparent)] text-[var(--warn)] hover:bg-[color-mix(in_srgb,var(--warn)_10%,transparent)]", on: "" },
  del: { icon: "trash", label: "حذف", perm: "حذف", cls: "border-line text-soft hover:text-[var(--bad)] hover:border-[color-mix(in_srgb,var(--bad)_45%,transparent)]", on: "" },
};

export function ActionBtn({ k, onClick, allowed = true, lockedTitle, title, strong }: {
  k: ActKey; onClick: () => void; allowed?: boolean; lockedTitle?: string; title?: string; strong?: boolean;
}) {
  const m = ACT_META[k];
  const tone = k === "view" ? "var(--brand)" : k === "edit" ? "var(--accent)" : k === "del" ? "var(--bad)"
    : k === "post" ? "var(--good)" : k === "approve" ? "var(--warn)" : "var(--brand)";
  if (!allowed) return (
    <button disabled title={lockedTitle || `صلاحية «${m.perm}» غير مخوّلة لدورك`} aria-label={m.label}
      className="act-ico act-ico-locked" style={{ ["--tone" as any]: "var(--mute)" }}>
      <I n="lock" size={13} />
    </button>
  );
  return (
    <button onClick={onClick} title={title || m.label} aria-label={m.label}
      className={`act-ico ${strong ? "act-ico-strong" : ""}`} style={{ ["--tone" as any]: tone }}>
      <I n={m.icon} size={14} />
    </button>
  );
}

/* استنتاج وحدة الصلاحيات من المجموعة */
const COLL_MOD: Record<string, string> = {
  units: "inv", warehouses: "inv", groups: "inv", items: "inv",
  suppliers: "pur", pcats: "pur", customers: "sal",
  banks: "gl", payterms: "gl", costcenters: "gl", cashboxes: "gl",
  users: "adm", roles: "adm", branches: "adm", departments: "adm",
  employees: "hr",
};

/* نافذة بطاقة السجل (عرض فقط + طباعة) */
export function RecordView({ open, onClose, title, icon, row, fields, onPrint, onEdit, canEdit }: {
  open: boolean; onClose: () => void; title: string; icon: string; row: AnyR | null;
  fields: FieldDef[]; onPrint: () => void; onEdit?: () => void; canEdit?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={`بطاقة — ${row ? String(row.name || row.code || row.id) : ""}`} icon={icon} wide>
      {row && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="chip bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)] font-num" dir="ltr">{String(row.code || row.id)}</span>
            <span className="chip bg-[color-mix(in_srgb,var(--mute)_12%,transparent)] text-[var(--soft)]">{title}</span>
            {row.status && <Chip s={String(row.status)} />}
          </div>
          <div className="grid md:grid-cols-2 gap-x-5 gap-y-3 rounded-xl border border-line bg-panel/50 p-4">
            {fields.map((f) => {
              const v = row[f.k];
              const disp = f.type === "select" ? (f.opts?.find((o) => String(o.v) === String(v))?.l ?? String(v ?? "—")) : (v === "" || v === undefined || v === null ? "—" : String(v));
              return (
                <div key={f.k} className={f.span ? "md:col-span-2" : ""}>
                  <div className="text-[0.64rem] font-bold text-mute">{f.label}</div>
                  <div className={`text-[0.86rem] font-bold mt-0.5 ${f.type === "number" || f.k === "code" ? "font-num" : ""}`} dir={f.type === "number" ? "ltr" : undefined}>{disp}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-line">
            {canEdit && onEdit && <button className="btn btn-ghost" onClick={onEdit}><I n="edit" size={15} /> تعديل السجل</button>}
            <button className="btn btn-brand" onClick={onPrint}><I n="print" size={15} /> طباعة البطاقة</button>
          </div>
        </>
      )}
    </Modal>
  );
}

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
  const mod = (conf as any).module || COLL_MOD[conf.coll] || null;
  const allowed = (perm: string) => !mod || app.can(mod, perm);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<AnyR | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [del, setDel] = useState<AnyR | null>(null);
  const [view, setView] = useState<AnyR | null>(null);
  const [imp, setImp] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AnyR[] | null>(null);

  /* طباعة السجل الكامل أو بطاقة سجل واحد (قيم خام قابلة للطباعة) */
  const rawVal = (r: AnyR, k: string) => { const v = r[k]; if (v === true) return "نعم"; if (v === false) return "لا"; if (v === "" || v === undefined || v === null) return "—"; return String(v); };
  const printCols = conf.cols.map((c) => ({ h: c.label, v: (r: AnyR) => rawVal(r, c.k) }));
  const printLog = () => printDirectory(app.session?.user || "—", {
    title: conf.title, subtitle: conf.desc, columns: printCols, rows: filtered,
    summary: [["عدد السجلات", String(filtered.length)], ["المجموعة", conf.coll]],
  }, app.settings.report);
  const printCard = (r: AnyR) => printDirectory(app.session?.user || "—", {
    title: `بطاقة — ${conf.title}`, subtitle: String(r[nameF] ?? r.id), columns: printCols, rows: [r],
  }, app.settings.report);

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
          {allowed("طباعة")
            ? <button className="btn btn-soft" onClick={printLog} title="طباعة السجل الكامل (A4)"><I n="print" size={15} /> طباعة السجل</button>
            : <button className="btn btn-ghost opacity-50 cursor-not-allowed" disabled title="صلاحية «طباعة» غير مخوّلة"><I n="lock" size={15} /> طباعة السجل</button>}
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
              <thead><tr>{conf.cols.map((c) => <th key={c.k} style={c.w ? { width: c.w } : undefined}>{c.label}</th>)}<th style={{ width: "150px" }}>الإجراءات</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    {conf.cols.map((c) => (
                      <td key={c.k} className={c.num ? "font-num" : ""}>{c.render ? c.render(r, app) : String(r[c.k] ?? "—")}</td>
                    ))}
                    <td>
                      <div className="act-row">
                        <ActionBtn k="view" allowed={allowed("عرض")} onClick={() => setView(r)} />
                        <ActionBtn k="edit" allowed={allowed("تعديل")} onClick={() => openEdit(r)} />
                        <ActionBtn k="print" allowed={allowed("طباعة")} onClick={() => printCard(r)} title="طباعة بطاقة السجل" />
                        <ActionBtn k="del" allowed={allowed("حذف")} onClick={() => setDel(r)} title="حذف (ينقل إلى السلة)" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* بطاقة العرض */}
      <RecordView open={!!view} onClose={() => setView(null)} title={conf.title} icon={conf.icon} row={view}
        fields={conf.fields} onPrint={() => view && printCard(view)} canEdit={allowed("تعديل")}
        onEdit={() => { if (view) { openEdit(view); setView(null); } }} />

      {/* نافذة الإضافة/التعديل */}
      {form && (
        <Modal open onClose={() => setForm(null)} title={isNew ? `إضافة — ${conf.title}` : `تعديل — ${form[nameF] || form.id}`} icon={conf.icon} wide
          footer={<>
            <button className="btn btn-ghost" onClick={() => setForm(null)}>إلغاء</button>
            <button className="btn btn-brand" onClick={submit}><I n="save" size={15} /> {isNew ? "حفظ السجل الجديد" : "حفظ التعديلات"}</button>
          </>}>
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
        </Modal>
      )}

      {/* تأكيد الحذف */}
      <Modal open={!!del} onClose={() => setDel(null)} title="تأكيد الحذف" icon="trash" subtitle="حذف آمن — ينشر شاهد الحذف (Tombstone) لكل أجهزة الشبكة"
        footer={<>
          <button className="btn btn-ghost !px-6" onClick={() => setDel(null)}>تراجع</button>
          <button className="btn btn-danger !px-6" onClick={() => { if (del) app.remove(conf.coll, del.id, String(del[nameF] ?? del.id)); setDel(null); }}>
            <I n="trash" size={15} /> نقل إلى السلة
          </button>
        </>}>
        <div className="max-w-xl mx-auto text-center py-2">
          <span className="w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-4 anim-pop" style={{ background: "color-mix(in srgb, var(--bad) 12%, transparent)", color: "var(--bad)" }}>
            <I n="alert" size={30} />
          </span>
          <p className="text-[0.95rem] font-bold leading-7">
            سيُنقل السجل «{String(del?.[nameF] ?? del?.id)}» إلى <b className="text-[var(--bad)]">سلة المحذوفات</b> مع إيقاف أثره فوراً.
          </p>
          <p className="text-[0.76rem] text-mute font-medium mt-1.5 leading-6">يمكنك استعادته لاحقاً من زر السلة، أو حذفه نهائياً من هناك (صيانة البيانات).</p>
        </div>
      </Modal>

      {/* معاينة الاستيراد */}
      <Modal open={imp} onClose={() => { setImp(false); setPending(null); }} wide title="معاينة البيانات المستوردة" icon="down"
        subtitle="فحص التكرار والسلامة قبل الدمج في القاعدة المركزية"
        footer={pending ? <>
          <button className="btn btn-ghost" onClick={() => { setImp(false); setPending(null); }}>إلغاء</button>
          <button className="btn btn-brand" onClick={commitImport}><I n="check" size={15} /> تأكيد الاستيراد</button>
        </> : undefined}>
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

/* ═══════ شاشة حركات عامة (سندات) — بأزرار عرض/طباعة/ترحيل/اعتماد/حذف محكومة بالصلاحيات ═══════ */
export function DocList({ docs, title, desc, icon, cols, onNew, newLabel, onView, onPrint, module, renderActions }: {
  docs: AnyR[]; title: string; desc: string; icon: string; cols: ColDef[];
  onNew?: () => void; newLabel?: string; onView?: (d: AnyR) => void; onPrint?: (d: AnyR) => void;
  module?: string; renderActions?: (d: AnyR) => ReactNode;
}) {
  const app = useApp();
  const allowed = (perm: string) => !module || app.can(module, perm);
  const [q, setQ] = useState("");
  const filtered = docs.filter((d) => !q || JSON.stringify(d).toLowerCase().includes(q.toLowerCase()));
  const voidDoc = (d: AnyR) => {
    if (d.lines) app.voidInvDoc(d.id);
    else if (d.no) { const kind = String(d.no).startsWith("PIN") ? "purchases" : String(d.no).startsWith("SRT") ? "returns" : "sales"; app.voidInvoice(kind as any, d.id); }
  };
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
        <div className="flex items-center gap-2 flex-wrap">
          {allowed("طباعة")
            ? <button className="btn btn-soft" onClick={() => printDirectory(app.session?.user || "—", { title: `سجل — ${title}`, subtitle: desc, columns: cols.map((c) => ({ h: c.label, v: (r: AnyR) => String(r[c.k] ?? "—") })), rows: filtered, summary: [["عدد السندات", String(filtered.length)]] }, app.settings.report)}><I n="print" size={15} /> طباعة السجل</button>
            : <button className="btn btn-ghost opacity-50 cursor-not-allowed" disabled title="صلاحية «طباعة» غير مخوّلة"><I n="lock" size={15} /> طباعة السجل</button>}
          {onNew && <button className="btn btn-brand" onClick={onNew}><I n="plus" size={16} /> {newLabel || "سند جديد"}</button>}
        </div>
      </div>
      <div className="relative w-80 max-w-full mb-3.5">
        <I n="search" size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
        <input className="input !ps-9" disabled={module ? !app.can(module, "بحث") : false}
          title={module && !app.can(module, "بحث") ? "صلاحية «بحث» غير مخوّلة لدورك" : undefined}
          placeholder="بحث برقم السند أو البيان…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card overflow-hidden">
        {filtered.length === 0 ? <Empty msg="لا توجد سندات — أنشئ سنداً جديداً برقم يُولّد تلقائياً" /> : (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[760px]">
              <thead><tr>{cols.map((c) => <th key={c.k}>{c.label}</th>)}<th style={{ width: "215px" }}>الإجراءات</th></tr></thead>
              <tbody>
                {filtered.map((d) => {
                  const dead = d.status === "ملغي" || d.status === "ملغاة" || d.status === "مرفوض";
                  return (
                    <tr key={d.id}>
                      {cols.map((c) => <td key={c.k} className={c.num ? "font-num" : ""}>{c.render ? c.render(d, app) : String(d[c.k] ?? "—")}</td>)}
                      <td>
                        {renderActions ? renderActions(d) : (
                          <div className="act-row">
                            {onView && <ActionBtn k="view" allowed={allowed("عرض")} onClick={() => onView(d)} />}
                            {onPrint && <ActionBtn k="print" allowed={allowed("طباعة")} onClick={() => onPrint(d)} title="طباعة السند (A4)" />}
                            {!dead && <ActionBtn k="del" allowed={allowed("حذف")} onClick={() => voidDoc(d)} title="إلغاء السند وعكس أثره" />}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
