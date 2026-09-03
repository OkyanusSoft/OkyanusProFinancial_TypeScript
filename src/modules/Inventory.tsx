import { useMemo, useState } from "react";
import { useApp, type AnyR } from "../store";
import { I, Modal, Chip, Barcode, Reveal, Empty, BarChart } from "../ui";
import { Directory, DocList, type DirConf, type ColDef } from "../crud";
import { openPrint, DocSheet, PTable, ReportSheet } from "../print";
import type { InvDoc } from "../data";

export default function Inventory() {
  const app = useApp();
  const p = app.route.path || "base.units";
  if (p === "base.units") return <Directory conf={unitsConf(app)} />;
  if (p === "base.wh") return <Directory conf={whConf(app)} />;
  if (p === "base.groups") return <Directory conf={groupsConf(app)} />;
  if (p === "base.items") return <Directory conf={itemsConf(app)} />;
  if (p.startsWith("mv.")) return <MoveScreen kind={p.slice(3)} />;
  if (p.startsWith("rep.")) return <ReportScreen kind={p.slice(4)} />;
  return <Directory conf={unitsConf(app)} />;
}

/* ═══════════ تكوينات الأدلة ═══════════ */
const unitsConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "units", title: "الوحدات", icon: "scale", prefix: "UN", importKey: "units",
  desc: "وحدات القياس المعتمدة في النظام — تُستخدم في دليل الأصناف والسندات",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true, placeholder: "UN-08" },
    { k: "name", label: "الاسم", req: true, uniq: true, placeholder: "مثال: دستة" },
    { k: "symbol", label: "الرمز المختصر", req: true },
    { k: "active", label: "الحالة", type: "select", opts: [{ v: true, l: "نشطة" }, { v: false, l: "موقوفة" }] },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "اسم الوحدة", render: (r) => <b>{r.name}</b> },
    { k: "symbol", label: "الرمز" },
    { k: "usage", label: "مرات الاستخدام", num: true, render: (r) => <span className="font-num">{app.db.items.filter((i) => i.unit === r.id).length} صنف</span> },
    { k: "active", label: "الحالة", render: (r) => <Chip s={r.active === false ? "ملغي" : "مرحّل"} /> },
  ],
});

const whConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "warehouses", title: "دليل المخازن", icon: "bld", prefix: "WH", importKey: "warehouses",
  desc: "المخازن والمستودعات وأمناء العهدة — كل حركة مخزنية تُرحّل إلى مخزن محدد",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "اسم المخزن", req: true, uniq: true },
    { k: "keeper", label: "أمين المخزن", req: true },
    { k: "location", label: "الموقع" },
    { k: "capacity", label: "السعة التخزينية" },
    { k: "active", label: "الحالة", type: "select", opts: [{ v: true, l: "نشط" }, { v: false, l: "موقوف" }] },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "المخزن", render: (r) => <b>{r.name}</b> },
    { k: "keeper", label: "الأمين" },
    { k: "location", label: "الموقع" },
    { k: "capacity", label: "السعة" },
    { k: "stock", label: "الرصيد الحالي", num: true, render: (r, a) => <b className="font-num">{a.fmtN(a.db.items.reduce((s, i) => s + ((i.qty as any)[r.id] || 0), 0))}</b> },
    { k: "active", label: "الحالة", render: (r) => <Chip s={r.active === false ? "ملغي" : "مرحّل"} /> },
  ],
});

const groupsConf = (_app?: ReturnType<typeof useApp>): DirConf => ({
  coll: "groups", title: "دليل المجموعات", icon: "layers", prefix: "GR", importKey: "groups",
  desc: "تصنيف الأصناف إلى مجموعات لتحليل التقارير ومراقبة المخزون",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "اسم المجموعة", req: true, uniq: true },
    { k: "note", label: "ملاحظات", span: true },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "المجموعة", render: (r) => <b>{r.name}</b> },
    { k: "note", label: "ملاحظات" },
  ],
});

const itemsConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "items", title: "دليل الأصناف", icon: "box", prefix: "IT", importKey: "items",
  desc: "الأصناف مع الباركود والحدود الدنيا والعليا — أساس كل حركة مخزنية ومالية",
  fields: [
    { k: "code", label: "كود الصنف", req: true, uniq: true },
    { k: "name", label: "اسم الصنف", req: true, span: true },
    { k: "group", label: "المجموعة", type: "select", req: true, opts: app.db.groups.map((g) => ({ v: g.id, l: g.name })) },
    { k: "unit", label: "الوحدة", type: "select", req: true, opts: app.db.units.map((u) => ({ v: u.id, l: u.name })) },
    { k: "barcode", label: "الباركود", hint: "يُولّد تلقائياً إن تُرك فارغاً", placeholder: "6210001011" },
    { k: "cost", label: "التكلفة", type: "number", req: true },
    { k: "price", label: "سعر البيع", type: "number", req: true },
    { k: "min", label: "الحد الأدنى", type: "number", req: true },
    { k: "max", label: "الحد الأقصى", type: "number", req: true },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "الصنف", render: (r) => <b>{r.name}</b> },
    { k: "group", label: "المجموعة", render: (r) => app.db.groups.find((g) => g.id === r.group)?.name || "—" },
    { k: "barcode", label: "الباركود", render: (r) => <Barcode value={String(r.barcode || r.code)} h={22} /> },
    { k: "cost", label: "التكلفة", num: true, render: (r, a) => <span className="font-num">{a.fmtN(r.cost)}</span> },
    { k: "price", label: "سعر البيع", num: true, render: (r, a) => <span className="font-num font-bold text-[var(--brand)]">{a.fmtN(r.price)}</span> },
    { k: "qty", label: "الرصيد الكلي", num: true, render: (r, a) => <b className="font-num">{a.fmtN(a.itemQty(r.id))}</b> },
  ],
});

/* ═══════════ شاشات الحركات ═══════════ */
const DOC_META: Record<string, { label: string; full: string; icon: string; prefix: string; desc: string; verb: string }> = {
  open: { label: "قيد افتتاحي", full: "سند قيد افتتاحي مخزني", icon: "cal", prefix: "OB", desc: "إدخال أرصدة الأصناف عند بداية السنة أو افتتاح مخزن جديد", verb: "قيد افتتاحي" },
  grn: { label: "توريد", full: "سند توريد مخزني", icon: "down", prefix: "GRN", desc: "إضافة كميات واردة إلى المخزن (مشتريات، إرجاع من عميل، إنتاج)", verb: "توريد" },
  iss: { label: "صرف", full: "سند صرف مخزني", icon: "wallet", prefix: "ISS", desc: "صرف كميات من المخزن (مبيعات، استهلاك داخلي) مع منع السالب", verb: "صرف" },
  tr: { label: "تحويل", full: "سند تحويل مخزني", icon: "swap", prefix: "TR", desc: "نقل أصناف بين مخزنين — يخرج من المصدر ويدخل في الوجهة تلقائياً", verb: "تحويل" },
  adj: { label: "تسوية", full: "سند تسوية مخزنية", icon: "scale", prefix: "ADJ", desc: "تسوية فروقات بكميات موجبة أو سالبة مع ذكر السبب", verb: "تسوية" },
  count: { label: "جرد", full: "جرد مخزني", icon: "clip", prefix: "JC", desc: "جرد فعلي: تُدخل الكميات المعدودة ويُحتسب الفرق عن النظام تلقائياً", verb: "جرد" },
};

/* ── طباعة سند مخزني ── */
function printInvDoc(app: ReturnType<typeof useApp>, d: AnyR, docTitle: string) {
  const whName = (id: string) => app.db.warehouses.find((w) => w.id === id)?.name || id;
  const itemName = (id: string) => app.db.items.find((i) => i.id === id)?.name || id;
  const lines = (d.lines || []) as any[];
  const totalVal = lines.reduce((s, l) => s + l.qty * l.cost, 0);
  openPrint(
    <DocSheet docTitle={docTitle} no={d.ref} date={d.date} status={d.status} subtitle={app.session?.branch}
      meta={[
        ["المخزن", whName(d.warehouse)],
        ...(d.toWarehouse ? [["إلى مخزن", whName(d.toWarehouse)] as [string, string]] : []),
        ["المستخدم", d.user],
        ["عدد الأصناف", String(lines.length)],
        ["البيان", d.note || "—"],
        ["الحالة", d.status],
      ]}
      totals={{ items: [["عدد الأسطر", String(lines.length)], ["إجمالي الكميات", app.fmtN(lines.reduce((s, l) => s + Math.abs(l.qty), 0))]], grand: ["القيمة الإجمالية بالتكلفة", app.fmtN(totalVal)] }}
      note={d.note} user={app.session?.user || "—"}
    >
      <PTable head={["م", "كود الصنف", "اسم الصنف", "الكمية", "التكلفة", "الإجمالي"]}
        widths={["4%", "12%", undefined, "12%", "14%", "16%"]}
        rows={lines.map((l, i) => [
          i + 1, <span className="num">{l.item}</span>, itemName(l.item),
          <span className="num"><b>{l.qty > 0 ? `+${app.fmtN(l.qty)}` : app.fmtN(l.qty)}</b></span>,
          <span className="num">{app.fmtN(l.cost)}</span>,
          <span className="num">{app.fmtN(l.qty * l.cost)}</span>,
        ])} />
    </DocSheet>
  );
}

function MoveScreen({ kind }: { kind: string }) {
  const app = useApp();
  const meta = DOC_META[kind];
  const [show, setShow] = useState(false);
  const [view, setView] = useState<AnyR | null>(null);
  const docs = (app.db.invDocs as any as AnyR[]).filter((d) => d.type === meta.label).reverse();

  const whName = (id: string) => app.db.warehouses.find((w) => w.id === id)?.name || id;
  const itemName = (id: string) => app.db.items.find((i) => i.id === id)?.name || id;

  const cols: ColDef[] = [
    { k: "ref", label: "رقم السند", render: (d) => <span className="font-num font-bold" dir="ltr">{d.ref}</span> },
    { k: "date", label: "التاريخ", num: true, render: (d, a) => a.fmtDate(d.date) },
    { k: "warehouse", label: kind === "tr" ? "من مخزن → إلى" : "المخزن", render: (d) => <b>{whName(d.warehouse)}{kind === "tr" && <span className="text-[var(--brand)]"> ← {whName(d.toWarehouse)}</span>}</b> },
    { k: "lines", label: "الأصناف", num: true, render: (d) => <span className="font-num">{d.lines.length}</span> },
    { k: "value", label: "القيمة بالتكلفة", num: true, render: (d, a) => <b className="font-num">{a.fmtN(d.lines.reduce((s: number, l: any) => s + l.qty * l.cost, 0))}</b> },
    { k: "user", label: "المستخدم" },
    { k: "status", label: "الحالة", render: (d) => <Chip s={d.status} /> },
  ];

  return (
    <>
      <DocList docs={docs} title={meta.full} desc={meta.desc} icon={meta.icon} cols={cols}
        onNew={() => setShow(true)} newLabel={`${meta.verb} جديد`} onView={(d) => setView(d)} onPrint={(d) => printInvDoc(app, d, meta.full)} />

      {show && <DocBuilder kind={kind} onClose={() => setShow(false)} />}

      <Modal open={!!view} onClose={() => setView(null)} wide icon={meta.icon} title={`تفاصيل السند ${view?.ref || ""}`}>
        {view && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-num" dir="ltr">{view.ref}</span>
              <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)]">{view.type}</span>
              <Chip s={view.status} />
              <span className="text-[0.74rem] font-bold text-mute flex items-center gap-1"><I n="cal" size={13} /> {app.fmtDate(view.date)} • {view.user}</span>
            </div>
            <table className="tbl mb-3">
              <thead><tr><th>الصنف</th><th>الكمية</th><th>التكلفة</th><th>الإجمالي</th></tr></thead>
              <tbody>
                {view.lines.map((l: any, i: number) => (
                  <tr key={i}>
                    <td className="font-bold">{itemName(l.item)}</td>
                    <td className={`font-num font-bold ${l.qty < 0 ? "text-[var(--bad)]" : "text-[var(--good)]"}`}>{l.qty > 0 ? "+" : ""}{l.qty}</td>
                    <td className="font-num">{app.fmtN(l.cost)}</td>
                    <td className="font-num font-bold">{app.fmtN(l.qty * l.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {view.note && <p className="text-[0.78rem] font-bold text-soft bg-panel rounded-lg p-3 border border-line">ملاحظة: {view.note}</p>}
            {view.status !== "ملغي" && (
              <div className="flex justify-end mt-4">
                <button className="btn btn-danger" onClick={() => { app.voidInvDoc(view.id); setView(null); }}><I n="undo" size={15} /> التراجع عن السند وعكس الكميات</button>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

function DocBuilder({ kind, onClose }: { kind: string; onClose: () => void }) {
  const app = useApp();
  const meta = DOC_META[kind];
  const [date, setDate] = useState("2026-03-29");
  const [wh, setWh] = useState(app.db.warehouses[0]?.id || "WH-01");
  const [toWh, setToWh] = useState(app.db.warehouses[1]?.id || "WH-02");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<{ item: string; qty: string; cost: string; counted?: string }[]>([{ item: app.db.items[0]?.id || "", qty: "10", cost: String(app.db.items[0]?.cost || 0) }]);

  const setLine = (i: number, patch: Partial<typeof lines[0]>) => setLines((old) => old.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const totalQty = lines.reduce((a, l) => a + (+l.qty || 0), 0);
  const totalVal = lines.reduce((a, l) => a + (+l.qty || 0) * (+l.cost || 0), 0);

  const save = () => {
    const valid = lines.filter((l) => l.item && (+l.qty || 0) !== 0);
    if (valid.length === 0) { app.toast("أضف سطراً واحداً على الأقل بكمية غير صفرية", "err"); return; }
    if (kind === "tr" && wh === toWh) { app.toast("مخزنا المصدر والوجهة متطابقان — اختر مخزنين مختلفين", "err"); return; }
    const ref = app.nextNo(app.settings.prefixes[meta.prefix.toUpperCase()] || meta.prefix);
    const finalLines = valid.map((l) => {
      const it: any = app.db.items.find((i) => i.id === l.item);
      let qty = +l.qty;
      if (kind === "count") qty = +l.qty - ((it?.qty[wh] || 0)); // الفرق عن النظام
      return { item: l.item, qty, cost: +l.cost || it?.cost || 0 };
    });
    if (kind === "count" && finalLines.every((l) => l.qty === 0)) { app.toast("لا توجد فروقات جرد — الكميات المعدودة مطابقة للنظام ✓", "ok"); onClose(); return; }
    const res = app.addInvDoc({ id: ref, type: meta.label, date, ref, warehouse: wh, toWarehouse: kind === "tr" ? toWh : undefined, user: app.session?.user || "—", status: "مرحّل", lines: finalLines, note } as InvDoc);
    app.toast(res.msg, res.ok ? "ok" : "err");
    if (res.ok) onClose();
  };

  return (
    <Modal open onClose={onClose} wide icon={meta.icon} title={`إنشاء ${meta.full} — رقم يُولّد تلقائياً`}>
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">التاريخ</span>
          <input type="date" className="input mt-1 font-num" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">{kind === "tr" ? "من مخزن" : "المخزن"}</span>
          <select className="select mt-1" value={wh} onChange={(e) => setWh(e.target.value)}>
            {app.db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select></label>
        {kind === "tr" && (
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">إلى مخزن</span>
            <select className="select mt-1" value={toWh} onChange={(e) => setToWh(e.target.value)}>
              {app.db.warehouses.filter((w) => w.id !== wh).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select></label>
        )}
        <label className={`block ${kind === "tr" ? "" : "md:col-span-2"}`}><span className="text-[0.74rem] font-bold text-soft">ملاحظة / السبب</span>
          <input className="input mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب الحركة…" /></label>
      </div>

      <div className="rounded-xl border border-line overflow-hidden mb-3">
        <table className="tbl">
          <thead><tr><th>الصنف</th><th>{kind === "count" ? "الرصيد بالنظام" : ""}</th><th>{kind === "count" ? "الكمية المعدودة" : "الكمية"}</th><th>التكلفة</th><th>{kind === "count" ? "الفرق" : "الإجمالي"}</th><th></th></tr></thead>
          <tbody>
            {lines.map((l, i) => {
              const it: any = app.db.items.find((x) => x.id === l.item);
              const sys = it?.qty[wh] || 0;
              const diff = (+l.qty || 0) - sys;
              return (
                <tr key={i}>
                  <td>
                    <select className="select !py-1.5 !text-[0.78rem]" value={l.item}
                      onChange={(e) => { const ni: any = app.db.items.find((x) => x.id === e.target.value); setLine(i, { item: e.target.value, cost: String(ni?.cost || 0), qty: kind === "count" ? String(ni?.qty[wh] || 0) : l.qty }); }}>
                      {app.db.items.map((it2) => <option key={it2.id} value={it2.id}>{it2.name}</option>)}
                    </select>
                  </td>
                  {kind === "count" && <td className="font-num text-mute">{app.fmtN(sys)}</td>}
                  <td><input type="number" className="input !py-1.5 !w-28 font-num" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} /></td>
                  <td><input type="number" className="input !py-1.5 !w-28 font-num" value={l.cost} onChange={(e) => setLine(i, { cost: e.target.value })} /></td>
                  <td className="font-num font-bold">
                    {kind === "count"
                      ? <span className={diff === 0 ? "text-mute" : diff < 0 ? "text-[var(--bad)]" : "text-[var(--good)]"}>{diff > 0 ? "+" : ""}{diff}</span>
                      : app.fmtN((+l.qty || 0) * (+l.cost || 0))}
                  </td>
                  <td><button className="text-mute hover:text-[var(--bad)] transition-colors" onClick={() => lines.length > 1 && setLines(lines.filter((_, j) => j !== i))} aria-label="حذف"><I n="trash" size={15} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="w-full py-2.5 text-[0.78rem] font-bold text-[var(--brand)] hover:bg-[color-mix(in_srgb,var(--brand)_6%,transparent)] transition-colors flex items-center justify-center gap-1.5 border-t border-line"
          onClick={() => setLines([...lines, { item: app.db.items[0]?.id || "", qty: "1", cost: String(app.db.items[0]?.cost || 0) }])}>
          <I n="plus" size={14} /> إضافة سطر صنف
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 bg-[color-mix(in_srgb,var(--brand)_6%,var(--panel))] border border-line">
        <span className="text-[0.78rem] font-bold text-soft">عدد الأسطر: <b className="font-num">{lines.length}</b> • إجمالي الكميات: <b className="font-num">{app.fmtN(totalQty)}</b></span>
        <span className="font-num font-bold text-lg text-[var(--brand)]">{app.fmtN(totalVal)} <span className="text-[0.7rem] text-mute">ر.ي (بالتكلفة)</span></span>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
        <button className="btn btn-brand" onClick={save}><I n="check" size={16} /> ترحيل {meta.verb} وتحديث الكميات</button>
      </div>
    </Modal>
  );
}

/* ═══════════ التقارير الخمسة ═══════════ */
function ReportScreen({ kind }: { kind: string }) {
  const app = useApp();
  const items = app.db.items;
  const whs = app.db.warehouses;
  const [selItem, setSelItem] = useState(items[0]?.id || "");
  const [selWh, setSelWh] = useState("all");

  const title = { bal: "تقرير أرصدة المخازن", move: "تقرير حركة الأصناف", card: "بطاقة صنف", watch: "مراقبة المخزون", count: "تقرير جرد المخزون" }[kind] || "";
  const desc = {
    bal: "أرصدة كل صنف في كل مخزن مع إجماليات القيم بالتكلفة وبسعر البيع",
    move: "كل الحركات المخزنية على صنف محدد مع الرصيد التراكمي",
    card: "الملف الكامل لصنف: بياناته، باركود، حدوده، وأرصدته في المخازن",
    watch: "الأصناف دون الحد الأدنى أو فوق الأقصى أو الراكدة — إنذار مبكر",
    count: "نتائج الجرد الفعلية وفروقاتها المقيمة مالياً",
  }[kind] || "";
  const icon = { bal: "bld", move: "pulse", card: "receipt", watch: "eye", count: "clip" }[kind] || "chart";

  const moveRows = useMemo(() => {
    const rows: { ref: string; date: string; type: string; qty: number; run: number }[] = [];
    let run = 0;
    (app.db.invDocs as any as AnyR[]).filter((d) => d.status === "مرحّل").forEach((d) => {
      d.lines.forEach((l: any) => {
        if (l.item === selItem && (selWh === "all" || d.warehouse === selWh || d.toWarehouse === selWh)) {
          run += l.qty;
          rows.push({ ref: d.ref, date: d.date, type: d.type, qty: l.qty, run });
        }
      });
    });
    return rows;
  }, [app.db.invDocs, selItem, selWh]);

  const it: any = items.find((i) => i.id === selItem);

  const watchRows = items.map((i: any) => {
    const total = app.itemQty(i.id);
    const status = total === 0 ? "نافد" : total < i.min ? "دون الحد الأدنى" : total > i.max ? "فوق الحد الأعلى" : "سليم";
    return { ...i, total, status };
  });

  const exportReport = () => {
    if (kind === "bal") app.exportCsv("ارصدة_المخازن", [["الصنف", ...whs.map((w) => w.name), "الإجمالي", "قيمة التكلفة"], ...items.map((i: any) => [i.name, ...whs.map((w) => i.qty[w.id] || 0), app.itemQty(i.id), app.itemQty(i.id) * i.cost])]);
    else if (kind === "move") app.exportCsv(`حركة_الصنف_${it?.name || ""}`, [["السند", "التاريخ", "النوع", "الكمية", "الرصيد"], ...moveRows.map((r) => [r.ref, r.date, r.type, r.qty, r.run])]);
    else if (kind === "watch") app.exportCsv("مراقبة_المخزون", [["الصنف", "الرصيد", "أدنى", "أقصى", "الحالة"], ...watchRows.map((r) => [r.name, r.total, r.min, r.max, r.status])]);
    else if (kind === "count") app.exportCsv("الجرد", [["السند", "التاريخ", "الصنف", "الفرق", "قيمة الفرق"], ...(app.db.invDocs as any as AnyR[]).filter((d) => d.type === "جرد").flatMap((d) => d.lines.map((l: any) => [d.ref, d.date, items.find((i) => i.id === l.item)?.name || "", l.qty, l.qty * l.cost]))]);
    else app.toast("تقرير PDF جاهز في قائمة الطباعة", "info");
  };

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n={icon} size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">{title}</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">{desc}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={exportReport}><I n="xlsx" size={15} /> تصدير Excel</button>
          <button className="btn btn-soft" onClick={() => printInvReport(app, kind, { title, it, items, whs, moveRows, watchRows })}><I n="print" size={15} /> طباعة / PDF</button>
        </div>
      </div>

      {(kind === "move" || kind === "card") && (
        <div className="flex flex-wrap gap-2.5 mb-4">
          <select className="select !w-80" value={selItem} onChange={(e) => setSelItem(e.target.value)}>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          {kind === "move" && (
            <select className="select !w-56" value={selWh} onChange={(e) => setSelWh(e.target.value)}>
              <option value="all">كل المخازن</option>
              {whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )}
        </div>
      )}

      {kind === "bal" && (
        <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
          <table className="tbl min-w-[820px]">
            <thead><tr><th>الصنف</th>{whs.map((w) => <th key={w.id}>{w.name.split("—")[0]}</th>)}<th>الإجمالي</th><th>قيمة التكلفة</th><th>قيمة البيع</th></tr></thead>
            <tbody>
              {items.map((i: any) => {
                const total = app.itemQty(i.id);
                return (
                  <tr key={i.id}>
                    <td className="font-bold">{i.name}</td>
                    {whs.map((w) => <td key={w.id} className="font-num">{i.qty[w.id] ? app.fmtN(i.qty[w.id]) : <span className="text-mute">—</span>}</td>)}
                    <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(total)}</td>
                    <td className="font-num">{app.fmtN(total * i.cost)}</td>
                    <td className="font-num text-[var(--good)]">{app.fmtN(total * i.price)}</td>
                  </tr>
                );
              })}
              <tr className="!bg-[color-mix(in_srgb,var(--brand)_7%,transparent)]">
                <td className="font-display font-bold">الإجمالي الكلي</td>
                {whs.map((w) => <td key={w.id} className="font-num font-bold">{app.fmtN(items.reduce((s, i: any) => s + (i.qty[w.id] || 0), 0))}</td>)}
                <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(items.reduce((s, i: any) => s + app.itemQty(i.id), 0))}</td>
                <td className="font-num font-bold">{app.fmtN(items.reduce((s, i: any) => s + app.itemQty(i.id) * i.cost, 0))}</td>
                <td className="font-num font-bold text-[var(--good)]">{app.fmtN(items.reduce((s, i: any) => s + app.itemQty(i.id) * i.price, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div></div></Reveal>
      )}

      {kind === "move" && (
        <Reveal><div className="card overflow-hidden">
          {moveRows.length === 0 ? <Empty msg="لا توجد حركات على هذا الصنف ضمن الفلتر المحدد" /> : (
            <table className="tbl">
              <thead><tr><th>السند</th><th>التاريخ</th><th>نوع الحركة</th><th>الكمية</th><th>الرصيد التراكمي</th></tr></thead>
              <tbody>
                {moveRows.map((r, i) => (
                  <tr key={i}>
                    <td className="font-num font-bold" dir="ltr">{r.ref}</td>
                    <td className="font-num">{app.fmtDate(r.date)}</td>
                    <td><Chip s={r.type === "توريد" || r.type === "قيد افتتاحي" ? "مرحّل" : r.type === "صرف" ? "ملغي" : "بانتظار الموافقة"} /> <span className="text-[0.74rem] font-bold">{r.type}</span></td>
                    <td className={`font-num font-bold ${r.qty >= 0 ? "text-[var(--good)]" : "text-[var(--bad)]"}`}>{r.qty > 0 ? "+" : ""}{app.fmtN(r.qty)}</td>
                    <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(r.run)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div></Reveal>
      )}

      {kind === "card" && it && (
        <div className="grid lg:grid-cols-3 gap-4 stagger">
          <div className="card p-5 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] font-num" dir="ltr">{it.code}</span>
              <Chip s={app.itemQty(it.id) < it.min ? "بانتظار الموافقة" : "مرحّل"} />
            </div>
            <h3 className="font-display font-bold text-xl leading-7">{it.name}</h3>
            <div className="mt-4 flex justify-center py-4 bg-panel rounded-xl border border-line">
              <div className="text-center">
                <Barcode value={String(it.barcode || it.code)} h={44} />
                <div className="font-num text-[0.72rem] font-bold mt-2" dir="ltr">{it.barcode || it.code}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-4 text-[0.78rem] font-bold">
              <div className="bg-panel rounded-lg p-2.5"><span className="text-mute block text-[0.64rem]">المجموعة</span>{app.db.groups.find((g) => g.id === it.group)?.name || "—"}</div>
              <div className="bg-panel rounded-lg p-2.5"><span className="text-mute block text-[0.64rem]">الوحدة</span>{app.db.units.find((u) => u.id === it.unit)?.name || "—"}</div>
              <div className="bg-panel rounded-lg p-2.5"><span className="text-mute block text-[0.64rem]">التكلفة</span><span className="font-num">{app.fmtN(it.cost)}</span></div>
              <div className="bg-panel rounded-lg p-2.5"><span className="text-mute block text-[0.64rem]">سعر البيع</span><span className="font-num text-[var(--brand)]">{app.fmtN(it.price)}</span></div>
              <div className="bg-panel rounded-lg p-2.5"><span className="text-mute block text-[0.64rem]">حد إعادة الطلب</span><span className="font-num text-[var(--warn)]">{app.fmtN(it.min)}</span></div>
              <div className="bg-panel rounded-lg p-2.5"><span className="text-mute block text-[0.64rem]">السعة القصوى</span><span className="font-num">{app.fmtN(it.max)}</span></div>
            </div>
          </div>
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-display font-bold text-base mb-4">توزيع الرصيد على المخازن — الإجمالي <span className="font-num text-[var(--brand)]">{app.fmtN(app.itemQty(it.id))}</span></h3>
            <BarChart height={170} data={whs.map((w) => ({ label: w.name.split("—")[0].replace("مخزن ", ""), value: it.qty[w.id] || 0 }))} />
            <div className="mt-4 space-y-2">
              {whs.map((w) => {
                const v = it.qty[w.id] || 0;
                const pct = Math.min(100, (v / (it.max || 1)) * 100);
                return (
                  <div key={w.id}>
                    <div className="flex justify-between text-[0.74rem] font-bold mb-1"><span>{w.name}</span><span className="font-num text-mute">{app.fmtN(v)} ({Math.round(pct)}% من السعة)</span></div>
                    <div className="h-2.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--brand), var(--accent))" }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {kind === "watch" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { l: "أصناف سليمة", v: watchRows.filter((r) => r.status === "سليم").length, c: "var(--good)", ic: "check" },
              { l: "دون الحد الأدنى", v: watchRows.filter((r) => r.status === "دون الحد الأدنى").length, c: "var(--warn)", ic: "alert" },
              { l: "فوق الحد الأعلى", v: watchRows.filter((r) => r.status === "فوق الحد الأعلى").length, c: "var(--brand)", ic: "layers" },
              { l: "أرصدة نافدة", v: watchRows.filter((r) => r.status === "نافد").length, c: "var(--bad)", ic: "x" },
            ].map((s, i) => (
              <Reveal key={s.l} delay={i * 70}><div className="card card-lift p-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `color-mix(in srgb, ${s.c} 12%, transparent)`, color: s.c }}><I n={s.ic} size={19} /></span>
                <div><div className="font-num font-bold text-xl" style={{ color: s.c }}>{s.v}</div><div className="text-[0.7rem] font-bold text-mute">{s.l}</div></div>
              </div></Reveal>
            ))}
          </div>
          <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
            <table className="tbl min-w-[760px]">
              <thead><tr><th>الصنف</th><th>الرصيد</th><th>أدنى</th><th>أقصى</th><th>المؤشر</th><th>الحالة</th><th>الإجراء المقترح</th></tr></thead>
              <tbody>
                {watchRows.map((r: any) => {
                  const pct = Math.min(100, (r.total / (r.max || 1)) * 100);
                  const tone = r.status === "سليم" ? "var(--good)" : r.status === "نافد" ? "var(--bad)" : r.status === "دون الحد الأدنى" ? "var(--warn)" : "var(--brand)";
                  return (
                    <tr key={r.id}>
                      <td className="font-bold">{r.name}</td>
                      <td className="font-num font-bold">{app.fmtN(r.total)}</td>
                      <td className="font-num text-mute">{app.fmtN(r.min)}</td>
                      <td className="font-num text-mute">{app.fmtN(r.max)}</td>
                      <td style={{ width: 160 }}><div className="h-2 rounded-full bg-panel overflow-hidden relative">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
                        <span className="absolute top-[-3px] h-3.5 w-0.5 bg-[var(--warn)]" style={{ insetInlineStart: `${Math.min(100, (r.min / (r.max || 1)) * 100)}%` }} title="حد إعادة الطلب" />
                      </div></td>
                      <td><span className="chip" style={{ background: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone }}>{r.status}</span></td>
                      <td className="text-[0.74rem] font-bold text-soft">{r.status === "دون الحد الأدنى" || r.status === "نافد" ? "إنشاء طلب شراء عاجل" : r.status === "فوق الحد الأعلى" ? "إيقاف الشراء / تحويل لمخزن آخر" : "لا إجراء مطلوب"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div></Reveal>
        </div>
      )}

      {kind === "count" && (
        <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
          <table className="tbl min-w-[720px]">
            <thead><tr><th>سند الجرد</th><th>التاريخ</th><th>المخزن</th><th>الصنف</th><th>فرق الجرد</th><th>قيمة الفرق</th><th>الحالة</th></tr></thead>
            <tbody>
              {(app.db.invDocs as any as AnyR[]).filter((d) => d.type === "جرد").map((d) =>
                d.lines.map((l: any, i: number) => (
                  <tr key={d.id + i}>
                    <td className="font-num font-bold" dir="ltr">{d.ref}</td>
                    <td className="font-num">{app.fmtDate(d.date)}</td>
                    <td>{app.db.warehouses.find((w) => w.id === d.warehouse)?.name}</td>
                    <td className="font-bold">{items.find((x) => x.id === l.item)?.name}</td>
                    <td className={`font-num font-bold ${l.qty >= 0 ? "text-[var(--good)]" : "text-[var(--bad)]"}`}>{l.qty > 0 ? "+" : ""}{l.qty}</td>
                    <td className="font-num">{app.fmtN(l.qty * l.cost)}</td>
                    <td><Chip s={d.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div></div></Reveal>
      )}
    </div>
  );
}

/* ═══════════ طباعة تقارير المخازن الخمسة ═══════════ */
function printInvReport(app: ReturnType<typeof useApp>, kind: string, d: any) {
  const { title, it, items, whs, moveRows, watchRows } = d;
  const user = app.session?.user || "—";
  const today = new Date().toLocaleDateString("en-GB");
  const whName = (id: string) => whs.find((w: any) => w.id === id)?.name || id;
  const itemName = (id: string) => items.find((i: any) => i.id === id)?.name || id;

  if (kind === "bal") {
    const totCost = items.reduce((s: number, i: any) => s + app.itemQty(i.id) * i.cost, 0);
    openPrint(
      <ReportSheet title={title} subtitle="أرصدة الأصناف في كل مخزن مع قيم التكلفة" user={user}
        filters={[["عدد الأصناف", String(items.length)], ["عدد المخازن", String(whs.length)], ["حتى تاريخ", today]]}
        summary={[["إجمالي قيمة المخزون بالتكلفة", app.fmtN(totCost)]]}>
        <PTable head={["الصنف", ...whs.map((w: any) => w.name), "الإجمالي", "قيمة التكلفة"]}
          rows={items.map((i: any) => [<span key="n"><b>{i.name}</b></span>, ...whs.map((w: any) => <span key={w.id} className="num">{i.qty[w.id] || 0}</span>), <span key="t" className="num"><b>{app.itemQty(i.id)}</b></span>, <span key="v" className="num">{app.fmtN(app.itemQty(i.id) * i.cost)}</span>])} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "move") {
    openPrint(
      <ReportSheet title={`${title} — ${it?.name || ""}`} subtitle="الحركات المخزنية مع الرصيد التراكمي" user={user}
        filters={[["الصنف", it?.name || "—"], ["عدد الحركات", String(moveRows.length)], ["حتى تاريخ", today]]}>
        <PTable head={["السند", "التاريخ", "النوع", "الكمية", "الرصيد"]}
          rows={moveRows.map((r: any) => [<span key="r" className="num">{r.ref}</span>, <span key="d" className="num">{r.date}</span>, r.type, <span key="q" className="num">{r.qty > 0 ? `+${r.qty}` : r.qty}</span>, <span key="b" className="num"><b>{r.run}</b></span>])} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "card") {
    openPrint(
      <ReportSheet title={`بطاقة صنف — ${it?.name || ""}`} subtitle="الملف الكامل للصنف وأرصدته في المخازن" user={user}
        filters={[["الكود", it?.code || "—"], ["المجموعة", it?.group || "—"], ["الوحدة", it?.unit || "—"]]}
        summary={[["التكلفة", app.fmtN(it?.cost || 0)], ["سعر البيع", app.fmtN(it?.price || 0)], ["الرصيد الكلي", String(app.itemQty(it?.id || ""))]]}>
        <PTable head={["المخزن", "الرصيد", "أدنى", "أقصى"]}
          rows={whs.map((w: any) => [<b key="w">{w.name}</b>, <span key="q" className="num"><b>{it?.qty[w.id] || 0}</b></span>, <span key="mn" className="num">{it?.min}</span>, <span key="mx" className="num">{it?.max}</span>])} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "watch") {
    openPrint(
      <ReportSheet title={title} subtitle="الأصناف دون الحد الأدنى أو فوق الأقصى — إنذار مبكر" user={user}
        filters={[["عدد الأصناف", String(watchRows.length)], ["حتى تاريخ", today]]}
        summary={[["أصناف دون الحد", String(watchRows.filter((r: any) => r.status === "دون الحد الأدنى").length)], ["أصناف نافدة", String(watchRows.filter((r: any) => r.status === "نافد").length)]]}>
        <PTable head={["الصنف", "الرصيد", "أدنى", "أقصى", "الحالة"]}
          rows={watchRows.map((r: any) => [<b key="n">{r.name}</b>, <span key="q" className="num"><b>{r.total}</b></span>, <span key="mn" className="num">{r.min}</span>, <span key="mx" className="num">{r.max}</span>, <span key="s">{r.status}</span>])} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "count") {
    const rows = (app.db.invDocs as any as AnyR[]).filter((dd) => dd.type === "جرد").flatMap((dd) => dd.lines.map((l: any) => ({ ref: dd.ref, date: dd.date, wh: whName(dd.warehouse), item: itemName(l.item), qty: l.qty, val: l.qty * l.cost })));
    openPrint(
      <ReportSheet title={title} subtitle="نتائج الجرد الفعلية وفروقاتها المقيمة مالياً" user={user}
        filters={[["عدد الفروقات", String(rows.length)], ["حتى تاريخ", today]]}
        summary={[["صافي قيمة الفروقات", app.fmtN(rows.reduce((s, r) => s + r.val, 0))]]}>
        <PTable head={["السند", "التاريخ", "المخزن", "الصنف", "الفرق", "قيمة الفرق"]}
          rows={rows.map((r, i) => [<span key="r" className="num">{r.ref}</span>, <span key="d" className="num">{r.date}</span>, r.wh, r.item, <span key="q" className="num">{r.qty > 0 ? `+${r.qty}` : r.qty}</span>, <span key="v" className="num">{app.fmtN(r.val)}</span>])} />
      </ReportSheet>
    );
  }
}
