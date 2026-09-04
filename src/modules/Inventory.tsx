import { useMemo, useState } from "react";
import { useApp, type AnyR } from "../store";
import { I, Modal, Chip, Barcode, Reveal, Empty, BarChart, FormSection } from "../ui";
import { Directory, DocList, type DirConf, type ColDef } from "../crud";
import { openPrint, DocSheet, PTable, ReportSheet, tafqit } from "../print";
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
  desc: "المخازن والمستودعات وأمناء العهدة — كل مخزن مرتبط بحساب في دليل الحسابات تُرحّل إليه حركاته",
  fields: [
    { k: "code", label: "الكود", req: true, uniq: true },
    { k: "name", label: "اسم المخزن", req: true, uniq: true },
    { k: "keeper", label: "أمين المخزن", req: true },
    { k: "account", label: "الحساب المرتبط (دليل الحسابات)", type: "select", req: true, span: true,
      opts: app.accounts.filter((a) => a.posting).map((a) => ({ v: a.code, l: `${a.code} — ${a.name}` })),
      hint: "تُرحّل حركات هذا المخزن (توريد/صرف/تحويل) إلى هذا الحساب في القيود المحاسبية تلقائياً — الربط يحقق التكامل المالي والمخزني" },
    { k: "location", label: "الموقع" },
    { k: "capacity", label: "السعة التخزينية" },
    { k: "active", label: "الحالة", type: "select", opts: [{ v: true, l: "نشط" }, { v: false, l: "موقوف" }] },
  ],
  cols: [
    { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
    { k: "name", label: "المخزن", render: (r) => <b>{r.name}</b> },
    { k: "keeper", label: "الأمين" },
    { k: "account", label: "الحساب المرتبط", render: (r, a) => {
        const acc = a.accounts.find((x) => x.code === r.account);
        return r.account ? (
          <span className="inline-flex items-center gap-1.5 chip bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)]" title={acc?.name}>
            <I n="book" size={12} /><span className="font-num" dir="ltr">{r.account}</span>
            <span className="hidden lg:inline text-[0.62rem]">{acc?.name ? "· " + acc.name.replace(/ — .*$/, "") : ""}</span>
          </span>
        ) : <span className="text-[0.7rem] font-bold text-mute">غير مرتبط</span>;
      } },
    { k: "capacity", label: "السعة" },
    { k: "stock", label: "الرصيد الحالي", num: true, render: (r, a) => <b className="font-num">{a.fmtN(a.db.items.reduce((s, i) => s + ((i.qty as any)[r.id] || 0), 0))}</b> },
    { k: "active", label: "الحالة", render: (r) => <Chip s={r.active === false ? "ملغي" : "مرحّل"} /> },
  ],
});

const accChip = (app: ReturnType<typeof useApp>, code: string | undefined, tone: string) => {
  if (!code) return <span className="chip bg-[color-mix(in_srgb,var(--mute)_14%,transparent)] text-[var(--mute)]">غير مرتبط</span>;
  const a = app.accounts.find((x) => x.code === code);
  return (
    <span className="chip font-num !text-[0.62rem]" dir="ltr" style={{ background: `color-mix(in srgb, ${tone} 11%, transparent)`, color: tone }} title={a?.name}>
      {code}
    </span>
  );
};

const groupsConf = (app: ReturnType<typeof useApp>): DirConf => {
  const accOpts = app.accounts.filter((a) => a.posting).map((a) => ({ v: a.code, l: `${a.code} — ${a.name}` }));
  return {
    coll: "groups", title: "دليل المجموعات", icon: "layers", prefix: "GR", importKey: "groups",
    desc: "تصنيف الأصناف وربط كل مجموعة بحساباتها المحاسبية: حساب المخزون، تكلفة المبيعات، والمبيعات — تُستخدم تلقائياً في قيود الحركات والفواتير (نمط الأنظمة القوية)",
    fields: [
      { k: "code", label: "الكود", req: true, uniq: true },
      { k: "name", label: "اسم المجموعة", req: true, uniq: true },
      { k: "stockAccount", label: "حساب المخزون (دليل الحسابات)", type: "select", req: true, opts: accOpts, hint: "يُرحَّل إليه التوريد والمشتريات لهذه المجموعة" },
      { k: "cogsAccount", label: "حساب تكلفة المبيعات", type: "select", req: true, opts: accOpts, hint: "يُرحَّل إليه الصرف والجرد السالب وتكلفة المبيعات" },
      { k: "salesAccount", label: "حساب الإيراد (المبيعات)", type: "select", req: true, opts: accOpts, hint: "يُرحَّل إليه إيراد فواتير هذه المجموعة" },
      { k: "note", label: "ملاحظات", span: true },
    ],
    cols: [
      { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
      { k: "name", label: "المجموعة", render: (r) => <b>{r.name}</b> },
      { k: "items", label: "الأصناف", num: true, render: (r) => <span className="font-num">{app.db.items.filter((i) => i.group === r.id).length}</span> },
      { k: "stockAccount", label: "ح/ المخزون", render: (r) => accChip(app, r.stockAccount as string, "var(--brand)") },
      { k: "cogsAccount", label: "ح/ التكلفة", render: (r) => accChip(app, r.cogsAccount as string, "var(--warn)") },
      { k: "salesAccount", label: "ح/ المبيعات", render: (r) => accChip(app, r.salesAccount as string, "var(--good)") },
      { k: "note", label: "ملاحظات" },
    ],
    extra: () => {
      const linked = app.db.groups.filter((g) => g.stockAccount && g.cogsAccount && g.salesAccount).length;
      return (
        <div className="card p-3.5 mb-4 flex items-center gap-3" style={{ background: "color-mix(in srgb, var(--brand) 6%, var(--surface))" }}>
          <span className="w-9 h-9 rounded-lg grid place-items-center bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] shrink-0"><I n="book" size={17} /></span>
          <p className="text-[0.74rem] font-bold text-soft leading-5">
            <span className="font-num text-[var(--brand)]">{linked}</span> من <span className="font-num">{app.db.groups.length}</span> مجموعة مكتملة الربط المحاسبي —
            كل حركة على أصناف المجموعة (توريد، صرف، بيع) تولّد قيدها على حسابات المجموعة تلقائياً، وتُجمَّع الفواتير متعددة المجموعات بسطر محاسبي لكل حساب.
          </p>
        </div>
      );
    },
  };
};

const itemsConf = (app: ReturnType<typeof useApp>): DirConf => ({
  coll: "items", title: "دليل الأصناف", icon: "box", prefix: "IT", importKey: "items",
  desc: "الأصناف مع الباركود والحدود الدنيا والعليا — أساس كل حركة مخزنية ومالية",
  fields: [
    { k: "code", label: "كود الصنف", req: true, uniq: true },
    { k: "name", label: "اسم الصنف", req: true, span: true },
    { k: "group", label: "المجموعة", type: "select", req: true, opts: app.db.groups.map((g) => ({ v: g.id, l: g.name })), hint: "القيود المحاسبية تُرحَّل إلى حسابات المجموعة المرتبطة بها" },
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
  const whAcc = (id: string) => { const c = (app.db.warehouses.find((w) => w.id === id) as any)?.account; return c ? `${c} — ${app.accounts.find((a) => a.code === c)?.name || ""}` : "غير مرتبط"; };
  const itemName = (id: string) => app.db.items.find((i) => i.id === id)?.name || id;
  const lines = (d.lines || []) as any[];
  const totalVal = lines.reduce((s, l) => s + l.qty * l.cost, 0);
  openPrint(
    <DocSheet docTitle={docTitle} no={d.ref} date={d.date} status={d.status} subtitle={app.session?.branch}
      meta={[
        ...(d.subType ? [["نوع الحركة", d.subType] as [string, string]] : []),
        ["المخزن", whName(d.warehouse)],
        ["الحساب المرتبط", whAcc(d.warehouse)],
        ...(d.toWarehouse ? [["إلى مخزن", `${whName(d.toWarehouse)} (${whAcc(d.toWarehouse)})`] as [string, string]] : []),
        ...((() => { const p = d.partyKind === "supplier" ? app.db.suppliers.find((s) => s.id === d.party) : d.partyKind === "customer" ? app.db.customers.find((c) => c.id === d.party) : d.partyKind === "cashbox" ? app.db.cashboxes.find((c) => c.id === d.party) : undefined; return p ? [[d.partyKind === "supplier" ? "المورد وحسابه" : d.partyKind === "customer" ? "العميل وحسابه" : "الصندوق وحسابه", `${p.name} (${(p as any).account || "—"})`] as [string, string]] : []; })()),
        ...(d.clearAccount ? [["القيد المقابل (دائن)", `${app.accounts.find((a) => a.code === d.clearAccount)?.name || d.clearAccount} (ح/ ${d.clearAccount})`] as [string, string]] : []),
        ...(d.extRef ? [["مرجع خارجي", d.extRef] as [string, string]] : []),
        ["المستخدم", d.user],
        ["عدد الأصناف", String(lines.length)],
        ["البيان", d.note || "—"],
        ["الحالة", d.status],
      ]}
      totals={{ items: [["عدد الأسطر", String(lines.length)], ["إجمالي الكميات", app.fmtN(lines.reduce((s, l) => s + Math.abs(l.qty), 0))], ["المبلغ بالحروف", tafqit(totalVal)]], grand: ["القيمة الإجمالية بالتكلفة", app.fmtN(totalVal) + " ر.ي"] }}
      stampText={d.type} stampSub={d.status === "مسودة" ? "معاينة" : "معتمد"}
      signLabels={d.status === "مسودة" ? ["أمين المخزن", "المحاسب"] : ["أمين المخزن", "المحاسب", "المدير المالي"]}
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
  const partyOf = (d: any) =>
    d.partyKind === "supplier" ? app.db.suppliers.find((s) => s.id === d.party) :
    d.partyKind === "customer" ? app.db.customers.find((c) => c.id === d.party) :
    d.partyKind === "cashbox" ? app.db.cashboxes.find((c) => c.id === d.party) : undefined;

  const cols: ColDef[] = [
    { k: "ref", label: "رقم السند", render: (d) => <span className="font-num font-bold" dir="ltr">{d.ref}{d.extRef && <span className="block text-[0.6rem] text-mute">مرجع: {d.extRef}</span>}</span> },
    { k: "date", label: "التاريخ", num: true, render: (d, a) => a.fmtDate(d.date) },
    ...(kind !== "tr" && kind !== "open" ? [{ k: "subType", label: "نوع الحركة", render: (d: any) => d.subType ? <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] !text-[0.62rem]">{d.subType}</span> : <span className="text-mute">—</span> }] as ColDef[] : []),
    { k: "warehouse", label: kind === "tr" ? "من مخزن → إلى" : "المخزن", render: (d) => <b>{whName(d.warehouse)}{kind === "tr" && <span className="text-[var(--brand)]"> ← {whName(d.toWarehouse)}</span>}</b> },
    { k: "party", label: "الطرف المقابل", render: (d: any) => {
      if (d.clearAccount) {
        const ca = app.accounts.find((x) => x.code === d.clearAccount);
        return <span className="font-bold text-[0.78rem]">{ca?.name || d.clearAccount}<span className="block text-[0.6rem] text-[var(--good)] font-num" dir="ltr">ح/ {d.clearAccount}</span></span>;
      }
      const p = partyOf(d);
      return p ? <span className="font-bold text-[0.78rem]">{p.name}<span className="block text-[0.6rem] text-mute font-num" dir="ltr">ح/ {(p as any).account || "—"}</span></span> : <span className="text-mute">—</span>;
    } },
    { k: "lines", label: "الأصناف", num: true, render: (d) => <span className="font-num">{d.lines.length}</span> },
    { k: "value", label: "القيمة بالتكلفة", num: true, render: (d, a) => <b className="font-num">{a.fmtN(d.lines.reduce((s: number, l: any) => s + l.qty * l.cost, 0))}</b> },
    { k: "user", label: "المستخدم" },
    { k: "status", label: "الحالة", render: (d) => <Chip s={d.status} /> },
  ];

  return (
    <>
      <DocList docs={docs} title={meta.full} desc={meta.desc} icon={meta.icon} cols={cols} module="inv"
        onNew={() => setShow(true)} newLabel={`${meta.verb} جديد`} onView={(d) => setView(d)} onPrint={(d) => printInvDoc(app, d, meta.full)} />

      {show && <DocBuilder kind={kind} onClose={() => setShow(false)} />}

      <Modal open={!!view} onClose={() => setView(null)} wide icon={meta.icon} title={`تفاصيل السند ${view?.ref || ""}`} subtitle={`${meta.full} — عرض كامل البنود مع الطباعة والتراجع`}>
        {view && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-num" dir="ltr">{view.ref}</span>
              <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)]">{view.type}</span>
              {view.subType && <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)]">{view.subType}</span>}
              {(() => { const p = view.partyKind === "supplier" ? app.db.suppliers.find((s) => s.id === view.party) : view.partyKind === "customer" ? app.db.customers.find((c) => c.id === view.party) : view.partyKind === "cashbox" ? app.db.cashboxes.find((c) => c.id === view.party) : undefined; return p ? <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]">{view.partyKind === "supplier" ? "المورد" : view.partyKind === "customer" ? "العميل" : "الصندوق"}: {p.name} (ح/ {(p as any).account || "—"})</span> : null; })()}
              {view.clearAccount && (() => { const ca = app.accounts.find((a) => a.code === view.clearAccount); return <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]">القيد المقابل: {ca?.name || view.clearAccount} (ح/ {view.clearAccount})</span>; })()}
              {view.extRef && <span className="chip bg-[color-mix(in_srgb,var(--mute)_12%,transparent)] text-[var(--soft)] font-num" dir="ltr">مرجع: {view.extRef}</span>}
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
            {view.note && (
              <div className="rounded-xl border border-[color-mix(in_srgb,var(--brand)_22%,transparent)] bg-[color-mix(in_srgb,var(--brand)_5%,var(--panel))] p-3.5">
                <div className="flex items-center gap-1.5 text-[0.7rem] font-bold text-[var(--brand)] mb-1"><I n="file" size={13} /> الــبيــان</div>
                <p className="text-[0.84rem] font-bold text-soft leading-6">{view.note}</p>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 mt-4">
              {view.status !== "ملغي" && app.can("inv", "حذف") && (
                <button className="btn btn-danger" onClick={() => { app.voidInvDoc(view.id); setView(null); }}><I n="undo" size={15} /> التراجع عن السند وعكس الكميات</button>
              )}
              {app.can("inv", "طباعة") && (
                <button className="btn btn-brand" onClick={() => printInvDoc(app, view, meta.full)}><I n="print" size={15} /> طباعة السند</button>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

/* أنواع الحركة الفرعية لكل سند — تحدد الطرف المقابل والقيد المحاسبي (نمط الأنظمة الشهيرة) */
const SUBTYPES: Record<string, { id: string; l: string; party?: "supplier" | "customer" | "cashbox" }[]> = {
  grn: [
    { id: "شراء من مورد (آجل)", l: "شراء من مورد — آجل", party: "supplier" },
    { id: "شراء نقدي (كاش)", l: "شراء نقدي — كاش", party: "cashbox" },
    { id: "مرتجع مبيعات من عميل", l: "مرتجع مبيعات — عميل رد البضاعة", party: "customer" },
    { id: "إنتاج أو إضافة أخرى", l: "إنتاج / إضافة أخرى" },
  ],
  iss: [
    { id: "صرف لمبيعات (فاتورة)", l: "صرف لمبيعات — مرتبط بفاتورة", party: "customer" },
    { id: "استهلاك داخلي", l: "استهلاك داخلي / تشغيل" },
    { id: "تالف أو هالك", l: "تالف / هالك / منتهي الصلاحية" },
  ],
  adj: [{ id: "فرق جرد", l: "فرق جرد فعلي" }, { id: "تصحيح إدخال", l: "تصحيح خطأ إدخال" }, { id: "تالف", l: "إثبات تالف", }],
  count: [{ id: "جرد دوري", l: "جرد دوري شامل" }, { id: "جرد مفاجئ", l: "جرد مفاجئ" }],
  open: [{ id: "أرصدة افتتاحية", l: "أرصدة افتتاحية — بداية السنة" }],
};
const PARTY_LABEL: Record<string, string> = { supplier: "المورد", customer: "العميل", cashbox: "الصندوق / البنك" };

function DocBuilder({ kind, onClose }: { kind: string; onClose: () => void }) {
  const app = useApp();
  const meta = DOC_META[kind];
  const subs = SUBTYPES[kind] || [];
  const [date, setDate] = useState("2026-03-29");
  const [wh, setWh] = useState(app.db.warehouses[0]?.id || "WH-01");
  const [toWh, setToWh] = useState(app.db.warehouses[1]?.id || "WH-02");
  const [sub, setSub] = useState(subs[0]?.id || "");
  const [party, setParty] = useState("");
  const [clearAcc, setClearAcc] = useState("22111"); /* القيد الافتتاحي: رأس المال افتراضياً */
  const [extRef, setExtRef] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<{ item: string; qty: string; cost: string; counted?: string }[]>([{ item: app.db.items[0]?.id || "", qty: "10", cost: String(app.db.items[0]?.cost || 0) }]);

  const setLine = (i: number, patch: Partial<typeof lines[0]>) => setLines((old) => old.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const totalQty = lines.reduce((a, l) => a + (+l.qty || 0), 0);
  const totalVal = lines.reduce((a, l) => a + (+l.qty || 0) * (+l.cost || 0), 0);
  const subDef = subs.find((s) => s.id === sub);
  const partyKind = subDef?.party;

  /* حسابات القيد للمعاينة الحية — نفس منطق الترحيل بالضبط */
  const accInfo = (code?: string) => code ? { code, name: app.accounts.find((a) => a.code === code)?.name || "" } : null;
  const grpAcc = (field: string, fb: string) => (app.db.groups.find((g) => g.id === (app.db.items.find((i) => i.id === lines.find((l) => l.item)?.item) as any)?.group) as any)?.[field] || fb;
  const whAcc = (id: string) => ((app.db.warehouses.find((w) => w.id === id) as any)?.account as string) || app.settings.suspense.purchases;
  const partyAccCode =
    partyKind === "supplier" ? ((app.db.suppliers.find((s) => s.id === party) as any)?.account as string) || app.settings.suspense.suppliers :
    partyKind === "customer" ? ((app.db.customers.find((c) => c.id === party) as any)?.account as string) || app.settings.suspense.customers :
    partyKind === "cashbox" ? ((app.db.cashboxes.find((c) => c.id === party) as any)?.account as string) || app.settings.suspense.cash :
    kind === "grn" || kind === "open" ? app.settings.suspense.purchases : app.settings.suspense.cogs;
  const partyName =
    partyKind === "supplier" ? app.db.suppliers.find((s) => s.id === party)?.name :
    partyKind === "customer" ? app.db.customers.find((c) => c.id === party)?.name :
    partyKind === "cashbox" ? app.db.cashboxes.find((c) => c.id === party)?.name : undefined;
  /* خيارات الحساب الدائن للقيد الافتتاحي: رأس المال وأرباح المرحلة أولاً ثم بقية الحسابات الترحيلية */
  const clearOpts = [
    ...app.accounts.filter((a) => a.code === "22111" || a.code === "22211"),
    ...app.accounts.filter((a) => a.posting && a.code !== "22111" && a.code !== "22211"),
  ];
  const debitSide =
    kind === "tr" ? accInfo(whAcc(toWh)) :
    kind === "iss" ? accInfo(grpAcc("cogsAccount", app.settings.suspense.cogs)) :
    accInfo(grpAcc("stockAccount", whAcc(wh)));
  const creditSide =
    kind === "tr" ? accInfo(whAcc(wh)) :
    kind === "iss" ? accInfo(whAcc(wh)) :
    kind === "open" ? accInfo(clearAcc) :
    kind === "adj" || kind === "count" ? accInfo(totalVal >= 0 ? grpAcc("stockAccount", whAcc(wh)) : whAcc(wh)) :
    accInfo(partyAccCode);
  const debitSideNeg = kind === "adj" || kind === "count" ? accInfo(app.settings.suspense.cogs) : null;
  /* رقم السند يُحجز عند أول معاينة ويُعاد استخدامه عند الحفظ فيتطابق المطبوع مع المحفوظ */
  const invPrefix = app.settings.prefixes[meta.prefix.toUpperCase()] || meta.prefix;
  const [no, setNo] = useState<string | null>(null);

  const buildLines = () => lines.filter((l) => l.item && (+l.qty || 0) !== 0).map((l) => {
    const it: any = app.db.items.find((i) => i.id === l.item);
    const qty = kind === "count" ? (+l.qty || 0) - (it?.qty[wh] || 0) : +l.qty;
    return { item: l.item, qty, cost: +l.cost || it?.cost || 0 };
  });

  const save = () => {
    if (!note.trim()) { app.toast("حقل «البيان» إلزامي — اذكر تفاصيل الحركة وسببها", "err"); return; }
    const valid = lines.filter((l) => l.item && (+l.qty || 0) !== 0);
    if (valid.length === 0) { app.toast("أضف سطراً واحداً على الأقل بكمية غير صفرية", "err"); return; }
    if (kind === "tr" && wh === toWh) { app.toast("مخزنا المصدر والوجهة متطابقان — اختر مخزنين مختلفين", "err"); return; }
    if (partyKind && !party) { app.toast(`اختر ${PARTY_LABEL[partyKind]} — مطلوب لنوع الحركة «${sub}’`, "err"); return; }
    const ref = no || app.nextNo(invPrefix);
    const finalLines = buildLines();
    if (kind === "count" && finalLines.every((l) => l.qty === 0)) { app.toast("لا توجد فروقات جرد — الكميات المعدودة مطابقة للنظام ✓", "ok"); onClose(); return; }
    const res = app.addInvDoc({ id: ref, type: meta.label, date, ref, warehouse: wh, toWarehouse: kind === "tr" ? toWh : undefined, user: app.session?.user || "—", status: "مرحّل", lines: finalLines, note, subType: sub || undefined, partyKind, party: party || undefined, extRef: extRef || undefined, clearAccount: kind === "open" ? clearAcc : undefined } as InvDoc);
    app.toast(res.msg, res.ok ? "ok" : "err");
    if (res.ok) onClose();
  };

  /* معاينة الطباعة تُخرج المستند النهائي (برقمه وحالته المرحّلة) وليس نسخة مسودة */
  const printFinal = () => {
    const valid = lines.filter((l) => l.item && (+l.qty || 0) !== 0);
    if (valid.length === 0) { app.toast("أضف سطراً واحداً على الأقل قبل الطباعة", "err"); return; }
    const ref = no || app.nextNo(invPrefix);
    setNo(ref);
    printInvDoc(app, {
      id: ref, ref, date, status: "مرحّل",
      type: meta.label, warehouse: wh, toWarehouse: kind === "tr" ? toWh : undefined,
      user: app.session?.user || "—", note, subType: sub || undefined, partyKind, party: party || undefined,
      extRef: extRef || undefined, clearAccount: kind === "open" ? clearAcc : undefined,
      lines: buildLines(),
    } as any, meta.full);
  };

  return (
    <Modal open onClose={onClose} wide icon={meta.icon} title={`إنشاء ${meta.full} — رقم يُولّد تلقائياً`} subtitle="سند مخزني — يُرحّل الكميات فوراً ويولّد قيداً محاسبياً متوازناً في دفتر الأستاذ">
      <FormSection n="أولاً" icon="file" title="رأس المستند" hint="البيانات العامة للسند">
      <div className="grid md:grid-cols-4 gap-3 mb-3">
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">التاريخ</span>
          <input type="date" className="input mt-1 font-num" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        {subs.length > 1 && (
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">نوع الحركة <b className="text-[var(--bad)]">*</b></span>
            <select className="select mt-1" value={sub} onChange={(e) => { setSub(e.target.value); setParty(""); }}>
              {subs.map((s) => <option key={s.id} value={s.id}>{s.l}</option>)}
            </select></label>
        )}
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">{kind === "tr" ? "من مخزن" : "المخزن"}</span>
          <select className="select mt-1" value={wh} onChange={(e) => setWh(e.target.value)}>
            {app.db.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select></label>
        {kind === "open" && (
          <label className="block"><span className="text-[0.74rem] font-bold text-soft flex items-center gap-1">القيد المقابل (دائن) <b className="text-[var(--bad)]">*</b></span>
            <select className="select mt-1" value={clearAcc} onChange={(e) => setClearAcc(e.target.value)}>
              {clearOpts.map((a) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </select>
            <span className="text-[0.64rem] font-bold text-[var(--brand)] mt-1 flex items-center gap-1"><I n="book" size={11} /> {clearAcc === "22111" ? "رأس المال — الافتتاح القياسي" : clearAcc === "22211" ? "أرباح سنوات سابقة (مرحلة)" : "حساب مقاصة / مخصص"}</span>
          </label>
        )}
        {kind === "tr" && (
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">إلى مخزن</span>
            <select className="select mt-1" value={toWh} onChange={(e) => setToWh(e.target.value)}>
              {app.db.warehouses.filter((w) => w.id !== wh).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select></label>
        )}
        {/* الطرف المقابل حسب نوع الحركة — مع حسابه المحاسبي */}
        {partyKind && (
          <label className="block"><span className="text-[0.74rem] font-bold text-soft flex items-center gap-1">{PARTY_LABEL[partyKind]} <b className="text-[var(--bad)]">*</b></span>
            <select className="select mt-1" value={party} onChange={(e) => setParty(e.target.value)}>
              <option value="">— اختر {PARTY_LABEL[partyKind]} —</option>
              {(partyKind === "supplier" ? app.db.suppliers : partyKind === "customer" ? app.db.customers : app.db.cashboxes).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}{p.account ? ` (ح/ ${p.account})` : ""}</option>
              ))}
            </select>
            {party && <span className="text-[0.64rem] font-bold text-[var(--brand)] mt-1 flex items-center gap-1"><I n="book" size={11} /> سيُرحَّل إلى ح/ {partyAccCode} — {accInfo(partyAccCode)?.name}</span>}
          </label>
        )}
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">مرجع خارجي</span>
          <input className="input mt-1 font-num" dir="ltr" value={extRef} onChange={(e) => setExtRef(e.target.value)} placeholder={kind === "grn" ? "رقم فاتورة المورد…" : kind === "iss" ? "رقم فاتورة العميل…" : "رقم مرجعي…"} /></label>
      </div>

      {/* حقل البيان — كبير وكامل العرض في كل السندات المخزنية */}
      <label className="block mb-4">
        <span className="flex items-center gap-1.5 text-[0.78rem] font-bold text-soft mb-1.5"><I n="file" size={14} className="text-[var(--brand)]" /> الــبيــان <b className="text-[var(--bad)]">*</b></span>
        <textarea className="input !text-[0.86rem] !leading-6" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
          placeholder={kind === "grn" ? "مثال: توريد بضاعة من المورد … بموجب فاتورة رقم … تشمل أصناف …" : kind === "iss" ? "مثال: صرف بضاعة للعميل … بموجب فاتورة رقم …" : kind === "tr" ? "مثال: تحويل بضاعة من المخزن الرئيسي إلى مخزن الفرع لتغطية الطلب…" : kind === "open" ? "مثال: إثبات الأرصدة الافتتاحية للمخزون بداية السنة المالية…" : "اذكر تفاصيل الحركة وسببها بوضوح…"} />
      </label>
      </FormSection>

      {/* المعاينة الحية للقيد المحاسبي — من حـ/ … إلى حـ/ … */}
      <div className="mb-3 rounded-xl border border-[color-mix(in_srgb,var(--brand)_25%,transparent)] overflow-hidden">
        <div className="px-4 py-2 flex items-center gap-2 text-[0.72rem] font-bold" style={{ background: "color-mix(in srgb, var(--brand) 9%, var(--panel))" }}>
          <I n="book" size={15} className="text-[var(--brand)]" />
          <span className="text-soft">القيد المحاسبي الذي سيُولَّد عند الترحيل — يتحدث لحظياً مع كل تغيير</span>
          <span className="ms-auto font-num text-[var(--brand)]">{app.fmtN(Math.abs(totalVal))} ر.ي</span>
        </div>
        <div className="grid md:grid-cols-2 divide-x divide-x-reverse divide-[color-mix(in_srgb,var(--line)_80%,transparent)]">
          <div className="p-3.5">
            <div className="text-[0.62rem] font-bold text-[var(--bad)] mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--bad)]" /> مدين — من حـ/</div>
            {debitSide ? (
              <div className="flex items-center gap-2">
                <span className="chip bg-[color-mix(in_srgb,var(--bad)_11%,transparent)] text-[var(--bad)] font-num !text-[0.72rem]" dir="ltr">{debitSide.code}</span>
                <span className="text-[0.8rem] font-bold">{debitSide.name}</span>
              </div>
            ) : <span className="text-[0.74rem] font-bold text-[var(--warn)]">اربط المخزن/المجموعة بحساب أولاً</span>}
            {kind === "iss" && <div className="text-[0.62rem] text-mute font-bold mt-1.5">حساب تكلفة مبيعات مجموعة الصنف الأول — متعدد المجموعات يولّد سطراً لكل حساب</div>}
            {kind === "open" && <div className="text-[0.62rem] text-mute font-bold mt-1.5">قيمة الرصيد الافتتاحي للأصناف — متعدد المجموعات يولّد سطراً لكل حساب مخزون</div>}
          </div>
          <div className="p-3.5">
            <div className="text-[0.62rem] font-bold text-[var(--good)] mb-1.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--good)]" /> دائن — إلى حـ/</div>
            {creditSide ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] font-num !text-[0.72rem]" dir="ltr">{creditSide.code}</span>
                <span className="text-[0.8rem] font-bold">{creditSide.name}</span>
                {partyName && <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)]">{partyName}</span>}
              </div>
            ) : <span className="text-[0.74rem] font-bold text-[var(--warn)]">اختر الطرف المقابل</span>}
            {debitSideNeg && totalVal < 0 && (
              <div className="mt-2 text-[0.66rem] font-bold text-mute">قيمة سالبة: ينعكس القيد — مدين ح/ {debitSideNeg.code} ({debitSideNeg.name})</div>
            )}
          </div>
        </div>
      </div>

      <FormSection n="ثانياً" icon="box" title="بنود المستند" hint={kind === "count" ? "أدخل الكميات المعدودة فعلياً ويُحتسب الفرق عن النظام تلقائياً" : "أصناف السند وكمياتها وتكلفتها"}>
      <div className="rounded-xl border border-line overflow-hidden mb-3">
        <table className="tbl">
          <thead><tr><th>الصنف</th><th>الوحدة</th><th>{kind === "count" ? "الرصيد بالنظام" : ""}</th><th>{kind === "count" ? "الكمية المعدودة" : "الكمية"}</th><th>التكلفة</th><th>{kind === "count" ? "الفرق" : "الإجمالي"}</th><th></th></tr></thead>
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
                  <td className="text-[0.72rem] font-bold text-mute">{it?.unit || "—"}</td>
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
      </FormSection>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
        <button className="btn btn-soft" onClick={printFinal}><I n="print" size={15} /> معاينة الطباعة</button>
        <button className="btn btn-brand" onClick={save}><I n="check" size={16} /> حفظ وترحيل السند</button>
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
  const [jType, setJType] = useState("all");

  const title = { bal: "تقرير أرصدة المخازن", move: "تقرير حركة الأصناف", card: "بطاقة صنف", watch: "مراقبة المخزون", count: "تقرير جرد المخزون", journal: "سجل حركة السندات المخزنية", valuation: "تقرير تقييم المخزون", reorder: "اقتراحات إعادة الطلب", transfers: "سجل التحويلات بين المخازن", slow: "تقرير الأصناف الراكدة" }[kind] || "";
  const desc = {
    bal: "أرصدة كل صنف في كل مخزن مع إجماليات القيم بالتكلفة وبسعر البيع",
    move: "كل الحركات المخزنية على صنف محدد مع الرصيد التراكمي",
    card: "الملف الكامل لصنف: بياناته، باركود، حدوده، وأرصدته في المخازن",
    watch: "الأصناف دون الحد الأدنى أو فوق الأقصى أو الراكدة — إنذار مبكر",
    count: "نتائج الجرد الفعلية وفروقاتها المقيمة مالياً",
    journal: "اليومية العامة للسندات: كل الحركات المخزنية مرتبة زمنياً مع الأطراف والقيم",
    valuation: "قيمة المخزون بالتكلفة وبسعر البيع لكل مجموعة — مع هامش الربح المتوقع",
    reorder: "الأصناف التي بلغت حد إعادة الطلب مع الكمية المقترحة وقيمة أمر الشراء",
    transfers: "كل التحويلات بين المخازن: المصدر، الوجهة، الأصناف، والقيم",
    slow: "الأصناف بلا حركات صادرة — رأس مال راكد يستحق المراجعة",
  }[kind] || "";
  const icon = { bal: "bld", move: "pulse", card: "receipt", watch: "eye", count: "clip", journal: "file", valuation: "coins", reorder: "down", transfers: "swap", slow: "clock" }[kind] || "chart";

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
    else if (kind === "card") app.exportCsv(`بطاقة_الصنف_${it?.name || ""}`, [["السند", "التاريخ", "النوع", "وارد", "صادر", "الرصيد"], ...moveRows.map((r) => [r.ref, r.date, r.type, r.qty > 0 ? r.qty : 0, r.qty < 0 ? -r.qty : 0, r.run])]);
    else if (kind === "watch") app.exportCsv("مراقبة_المخزون", [["الصنف", "الرصيد", "أدنى", "أقصى", "الحالة"], ...watchRows.map((r) => [r.name, r.total, r.min, r.max, r.status])]);
    else if (kind === "count") app.exportCsv("الجرد", [["السند", "التاريخ", "الصنف", "الفرق", "قيمة الفرق"], ...(app.db.invDocs as any as AnyR[]).filter((d) => d.type === "جرد").flatMap((d) => d.lines.map((l: any) => [d.ref, d.date, items.find((i) => i.id === l.item)?.name || "", l.qty, l.qty * l.cost]))]);
    else if (kind === "journal") app.exportCsv("سجل_حركة_السندات", [["السند", "التاريخ", "النوع", "نوع الحركة", "المخزن", "القيمة"], ...(app.db.invDocs as any as AnyR[]).map((d: any) => [d.ref, d.date, d.type, d.subType || "", app.db.warehouses.find((w) => w.id === d.warehouse)?.name || "", d.lines.reduce((a: number, l: any) => a + l.qty * l.cost, 0)])]);
    else if (kind === "valuation") app.exportCsv("تقييم_المخزون", [["المجموعة", "الأصناف", "الكميات", "التكلفة", "البيعي", "الهامش"], ...app.db.groups.map((g: any) => { const gi = items.filter((i: any) => i.group === g.id); const c = gi.reduce((s, i: any) => s + app.itemQty(i.id) * i.cost, 0); const sv = gi.reduce((s, i: any) => s + app.itemQty(i.id) * i.price, 0); return [g.name, gi.length, gi.reduce((s, i: any) => s + app.itemQty(i.id), 0), c, sv, sv - c]; })]);
    else if (kind === "reorder") app.exportCsv("اقتراحات_اعادة_الطلب", [["الصنف", "الرصيد", "حد الطلب", "المقترح", "قيمة الأمر"], ...items.map((i: any) => ({ ...i, total: app.itemQty(i.id) })).filter((r: any) => r.total < r.min).map((r: any) => [r.name, r.total, r.min, r.max - r.total, (r.max - r.total) * r.cost])]);
    else if (kind === "transfers") app.exportCsv("سجل_التحويلات", [["السند", "التاريخ", "من", "إلى", "القيمة"], ...(app.db.invDocs as any as AnyR[]).filter((d) => d.type === "تحويل").map((d: any) => [d.ref, d.date, app.db.warehouses.find((w) => w.id === d.warehouse)?.name || "", app.db.warehouses.find((w) => w.id === d.toWarehouse)?.name || "", d.lines.reduce((a: number, l: any) => a + l.qty * l.cost, 0)])]);
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

      {/* ═══ سجل حركة السندات ═══ */}
      {kind === "journal" && (() => {
        const all = (app.db.invDocs as any as AnyR[]).filter((d) => jType === "all" || d.type === jType);
        const inVal = all.reduce((s, d) => s + d.lines.reduce((a: number, l: any) => a + (l.qty > 0 ? l.qty * l.cost : 0), 0), 0);
        const outVal = all.reduce((s, d) => s + d.lines.reduce((a: number, l: any) => a + (l.qty < 0 ? -l.qty * l.cost : 0), 0), 0);
        const partyOf = (d: any) => d.partyKind === "supplier" ? app.db.suppliers.find((s) => s.id === d.party)?.name : d.partyKind === "customer" ? app.db.customers.find((c) => c.id === d.party)?.name : d.partyKind === "cashbox" ? app.db.cashboxes.find((c) => c.id === d.party)?.name : "—";
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {["all", "قيد افتتاحي", "توريد", "صرف", "تحويل", "تسوية", "جرد"].map((t) => (
                <button key={t} onClick={() => setJType(t)} className={`btn !py-1.5 !px-3 !text-[0.74rem] ${jType === t ? "btn-brand" : "btn-ghost"}`}>{t === "all" ? "كل الحركات" : t}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["عدد السندات", String(all.length), "var(--brand)", "file"], ["قيمة الوارد", app.fmtN(inVal), "var(--good)", "down"], ["قيمة الصادر", app.fmtN(outVal), "var(--bad)", "wallet"]].map(([l, v, c, ic]: any, i) => (
                <Reveal key={l} delay={i * 60}><div className="card card-lift p-4 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c }}><I n={ic} size={19} /></span>
                  <div><div className="font-num font-bold text-lg" style={{ color: c }}>{v}</div><div className="text-[0.7rem] font-bold text-mute">{l}</div></div>
                </div></Reveal>
              ))}
            </div>
            <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
              <table className="tbl min-w-[900px]">
                <thead><tr><th>السند</th><th>التاريخ</th><th>النوع</th><th>نوع الحركة</th><th>المخزن</th><th>الطرف المقابل</th><th>وارد</th><th>صادر</th><th>الحالة</th></tr></thead>
                <tbody>
                  {all.map((d) => {
                    const inn = d.lines.reduce((a: number, l: any) => a + (l.qty > 0 ? l.qty * l.cost : 0), 0);
                    const out = d.lines.reduce((a: number, l: any) => a + (l.qty < 0 ? -l.qty * l.cost : 0), 0);
                    return (
                      <tr key={d.id}>
                        <td className="font-num font-bold" dir="ltr">{d.ref}</td>
                        <td className="font-num">{app.fmtDate(d.date)}</td>
                        <td><b>{d.type}</b></td>
                        <td className="text-[0.72rem] font-bold text-soft">{d.subType || "—"}</td>
                        <td>{app.db.warehouses.find((w) => w.id === d.warehouse)?.name}{d.toWarehouse ? <span className="text-[var(--brand)]"> ← {app.db.warehouses.find((w) => w.id === d.toWarehouse)?.name}</span> : null}</td>
                        <td className="text-[0.76rem] font-bold">{partyOf(d)}</td>
                        <td className="font-num text-[var(--good)] font-bold">{inn ? app.fmtN(inn) : "—"}</td>
                        <td className="font-num text-[var(--bad)] font-bold">{out ? app.fmtN(out) : "—"}</td>
                        <td><Chip s={d.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></div></Reveal>
          </div>
        );
      })()}

      {/* ═══ تقييم المخزون حسب المجموعات ═══ */}
      {kind === "valuation" && (() => {
        const rows = app.db.groups.map((g: any) => {
          const gi = items.filter((i: any) => i.group === g.id);
          const qty = gi.reduce((s, i: any) => s + app.itemQty(i.id), 0);
          const cost = gi.reduce((s, i: any) => s + app.itemQty(i.id) * i.cost, 0);
          const sale = gi.reduce((s, i: any) => s + app.itemQty(i.id) * i.price, 0);
          return { g, count: gi.length, qty, cost, sale, margin: sale - cost };
        });
        const tCost = rows.reduce((s, r) => s + r.cost, 0);
        const tSale = rows.reduce((s, r) => s + r.sale, 0);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[["قيمة المخزون بالتكلفة", app.fmtN(tCost), "var(--brand)", "coins"], ["القيمة البيعية المتوقعة", app.fmtN(tSale), "var(--good)", "tag"], ["هامش الربح المتوقع", app.fmtN(tSale - tCost), "var(--accent)", "chart"], ["نسبة الهامش", `${Math.round(((tSale - tCost) / (tCost || 1)) * 100)}%`, "var(--warn)", "scale"]].map(([l, v, c, ic]: any, i) => (
                <Reveal key={l} delay={i * 60}><div className="card card-lift p-4 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c }}><I n={ic} size={19} /></span>
                  <div><div className="font-num font-bold text-lg" style={{ color: c }}>{v}</div><div className="text-[0.7rem] font-bold text-mute">{l}</div></div>
                </div></Reveal>
              ))}
            </div>
            <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
              <table className="tbl min-w-[860px]">
                <thead><tr><th>المجموعة</th><th>ح/ المخزون المرتبط</th><th>الأصناف</th><th>الكميات</th><th>قيمة التكلفة</th><th>القيمة البيعية</th><th>هامش الربح</th><th>نسبته</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.g.id}>
                      <td className="font-bold">{r.g.name}</td>
                      <td><span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-num !text-[0.62rem]" dir="ltr">{r.g.stockAccount || "—"}</span></td>
                      <td className="font-num">{r.count}</td>
                      <td className="font-num">{app.fmtN(r.qty)}</td>
                      <td className="font-num font-bold">{app.fmtN(r.cost)}</td>
                      <td className="font-num text-[var(--good)] font-bold">{app.fmtN(r.sale)}</td>
                      <td className="font-num text-[var(--accent)] font-bold">{app.fmtN(r.margin)}</td>
                      <td className="font-num">{Math.round((r.margin / (r.cost || 1)) * 100)}%</td>
                    </tr>
                  ))}
                  <tr className="!bg-[color-mix(in_srgb,var(--brand)_7%,transparent)]">
                    <td className="font-display font-bold" colSpan={3}>الإجمالي الكلي</td>
                    <td className="font-num font-bold">{app.fmtN(rows.reduce((s, r) => s + r.qty, 0))}</td>
                    <td className="font-num font-bold">{app.fmtN(tCost)}</td>
                    <td className="font-num font-bold text-[var(--good)]">{app.fmtN(tSale)}</td>
                    <td className="font-num font-bold text-[var(--accent)]">{app.fmtN(tSale - tCost)}</td>
                    <td className="font-num font-bold">{Math.round(((tSale - tCost) / (tCost || 1)) * 100)}%</td>
                  </tr>
                </tbody>
              </table>
            </div></div></Reveal>
          </div>
        );
      })()}

      {/* ═══ اقتراحات إعادة الطلب ═══ */}
      {kind === "reorder" && (() => {
        const rows = items.map((i: any) => ({ ...i, total: app.itemQty(i.id) })).filter((r) => r.total < r.min);
        const totVal = rows.reduce((s, r) => s + (r.max - r.total) * r.cost, 0);
        return (
          <div className="space-y-4">
            <div className="card p-4 flex flex-wrap items-center gap-4" style={{ background: "color-mix(in srgb, var(--warn) 7%, var(--surface))" }}>
              <span className="w-10 h-10 rounded-xl grid place-items-center bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)]"><I n="alert" size={19} /></span>
              <div className="flex-1 text-[0.8rem] font-bold text-soft"><span className="font-num text-[var(--warn)]">{rows.length}</span> صنف بلغ حد إعادة الطلب — الكمية المقترحة تعيد الرصيد إلى الحد الأقصى</div>
              <div className="text-end"><div className="text-[0.64rem] font-bold text-mute">قيمة أوامر الشراء المقترحة</div><div className="font-num font-bold text-lg text-[var(--warn)]">{app.fmtN(totVal)} ر.ي</div></div>
            </div>
            <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
              <table className="tbl min-w-[860px]">
                <thead><tr><th>الصنف</th><th>المجموعة</th><th>الرصيد الحالي</th><th>حد الطلب</th><th>الحد الأقصى</th><th>الكمية المقترحة</th><th>التكلفة</th><th>قيمة الأمر</th><th>الأولوية</th></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const sug = r.max - r.total;
                    const urgent = r.total === 0;
                    return (
                      <tr key={r.id}>
                        <td className="font-bold">{r.name}</td>
                        <td>{app.db.groups.find((g) => g.id === r.group)?.name || "—"}</td>
                        <td className={`font-num font-bold ${urgent ? "text-[var(--bad)]" : "text-[var(--warn)]"}`}>{app.fmtN(r.total)}</td>
                        <td className="font-num text-mute">{app.fmtN(r.min)}</td>
                        <td className="font-num text-mute">{app.fmtN(r.max)}</td>
                        <td className="font-num font-bold text-[var(--brand)]">+{app.fmtN(sug)}</td>
                        <td className="font-num">{app.fmtN(r.cost)}</td>
                        <td className="font-num font-bold">{app.fmtN(sug * r.cost)}</td>
                        <td>{urgent ? <span className="chip bg-[color-mix(in_srgb,var(--bad)_13%,transparent)] text-[var(--bad)]">عاجل — نافد</span> : <span className="chip bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)]">عادي</span>}</td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && <tr><td colSpan={9}><Empty msg="كل الأصناف فوق حد إعادة الطلب ✓" /></td></tr>}
                </tbody>
              </table>
            </div></div></Reveal>
          </div>
        );
      })()}

      {/* ═══ سجل التحويلات بين المخازن ═══ */}
      {kind === "transfers" && (() => {
        const rows = (app.db.invDocs as any as AnyR[]).filter((d) => d.type === "تحويل");
        const totVal = rows.reduce((s, d) => s + d.lines.reduce((a: number, l: any) => a + l.qty * l.cost, 0), 0);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[["عدد التحويلات", String(rows.length), "var(--brand)", "swap"], ["إجمالي الأصناف المنقولة", String(rows.reduce((s, d) => s + d.lines.length, 0)), "var(--accent)", "box"], ["قيمة البضاعة المحوّلة", app.fmtN(totVal), "var(--good)", "coins"]].map(([l, v, c, ic]: any, i) => (
                <Reveal key={l} delay={i * 60}><div className="card card-lift p-4 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c }}><I n={ic} size={19} /></span>
                  <div><div className="font-num font-bold text-lg" style={{ color: c }}>{v}</div><div className="text-[0.7rem] font-bold text-mute">{l}</div></div>
                </div></Reveal>
              ))}
            </div>
            <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
              <table className="tbl min-w-[820px]">
                <thead><tr><th>السند</th><th>التاريخ</th><th>من مخزن</th><th>إلى مخزن</th><th>الأصناف</th><th>القيمة</th><th>المستخدم</th><th>الحالة</th></tr></thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <td className="font-num font-bold" dir="ltr">{d.ref}</td>
                      <td className="font-num">{app.fmtDate(d.date)}</td>
                      <td className="font-bold">{app.db.warehouses.find((w) => w.id === d.warehouse)?.name}</td>
                      <td className="font-bold text-[var(--brand)]">{app.db.warehouses.find((w) => w.id === d.toWarehouse)?.name}</td>
                      <td className="font-num">{d.lines.length}</td>
                      <td className="font-num font-bold">{app.fmtN(d.lines.reduce((a: number, l: any) => a + l.qty * l.cost, 0))}</td>
                      <td>{d.user}</td>
                      <td><Chip s={d.status} /></td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={8}><Empty msg="لا توجد تحويلات بين المخازن بعد" /></td></tr>}
                </tbody>
              </table>
            </div></div></Reveal>
          </div>
        );
      })()}

      {/* ═══ الأصناف الراكدة ═══ */}
      {kind === "slow" && (() => {
        const outMoves = new Set<string>();
        (app.db.invDocs as any as AnyR[]).forEach((d) => d.lines.forEach((l: any) => { if (l.qty < 0) outMoves.add(l.item); }));
        (app.db.sales as any as AnyR[]).forEach((s) => (s.lines || []).forEach((l: any) => outMoves.add(l.item)));
        const rows = items.map((i: any) => ({ ...i, total: app.itemQty(i.id), stagnant: app.itemQty(i.id) * i.cost })).filter((r) => !outMoves.has(r.id) && r.total > 0);
        const totVal = rows.reduce((s, r) => s + r.stagnant, 0);
        return (
          <div className="space-y-4">
            <div className="card p-4 flex flex-wrap items-center gap-4" style={{ background: "color-mix(in srgb, var(--bad) 6%, var(--surface))" }}>
              <span className="w-10 h-10 rounded-xl grid place-items-center bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-[var(--bad)]"><I n="clock" size={19} /></span>
              <div className="flex-1 text-[0.8rem] font-bold text-soft">أصناف لم تسجل أي حركة صادرة (صرف/بيع) منذ بداية الفترة — رأس مال مجمّد</div>
              <div className="text-end"><div className="text-[0.64rem] font-bold text-mute">قيمة الأموال الراكدة</div><div className="font-num font-bold text-lg text-[var(--bad)]">{app.fmtN(totVal)} ر.ي</div></div>
            </div>
            <Reveal><div className="card overflow-hidden"><div className="overflow-x-auto">
              <table className="tbl min-w-[760px]">
                <thead><tr><th>الصنف</th><th>المجموعة</th><th>الرصيد</th><th>القيمة الراكدة</th><th>آخر تكلفة</th><th>التوصية</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="font-bold">{r.name}</td>
                      <td>{app.db.groups.find((g) => g.id === r.group)?.name || "—"}</td>
                      <td className="font-num font-bold">{app.fmtN(r.total)}</td>
                      <td className="font-num font-bold text-[var(--bad)]">{app.fmtN(r.stagnant)}</td>
                      <td className="font-num">{app.fmtN(r.cost)}</td>
                      <td className="text-[0.74rem] font-bold text-soft">عرض ترويجي / تحويل لمخزن آخر / إيقاف الشراء</td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={6}><Empty msg="لا توجد أصناف راكدة — دوران المخزون صحي ✓" /></td></tr>}
                </tbody>
              </table>
            </div></div></Reveal>
          </div>
        );
      })()}

      {/* ═══ دفتر أستاذ الصنف — ملحق بطاقة الصنف ═══ */}
      {kind === "card" && it && (
        <Reveal><div className="card overflow-hidden mt-4">
          <div className="px-5 py-3.5 border-b border-line bg-panel flex flex-wrap items-center gap-3">
            <h3 className="font-display font-bold text-sm flex items-center gap-2"><I n="book" size={17} className="text-[var(--brand)]" /> السجل التفصيلي — وارد / صادر / رصيد</h3>
            <div className="ms-auto flex gap-2">
              <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)]">وارد: <b className="font-num">{app.fmtN(moveRows.reduce((s, r) => s + (r.qty > 0 ? r.qty : 0), 0))}</b></span>
              <span className="chip bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-[var(--bad)]">صادر: <b className="font-num">{app.fmtN(moveRows.reduce((s, r) => s + (r.qty < 0 ? -r.qty : 0), 0))}</b></span>
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]">الرصيد: <b className="font-num">{app.fmtN(app.itemQty(it.id))}</b></span>
            </div>
          </div>
          {moveRows.length === 0 ? <Empty msg="لا توجد حركات مسجلة على هذا الصنف بعد" /> : (
            <div className="overflow-x-auto">
              <table className="tbl min-w-[720px]">
                <thead><tr><th>السند</th><th>التاريخ</th><th>نوع الحركة</th><th>وارد</th><th>صادر</th><th>الرصيد بعد الحركة</th></tr></thead>
                <tbody>
                  {moveRows.map((r, i) => (
                    <tr key={i}>
                      <td className="font-num font-bold" dir="ltr">{r.ref}</td>
                      <td className="font-num">{app.fmtDate(r.date)}</td>
                      <td className="text-[0.76rem] font-bold">{r.type}</td>
                      <td className="font-num font-bold text-[var(--good)]">{r.qty > 0 ? app.fmtN(r.qty) : "—"}</td>
                      <td className="font-num font-bold text-[var(--bad)]">{r.qty < 0 ? app.fmtN(-r.qty) : "—"}</td>
                      <td className="font-num font-bold text-[var(--brand)]">{app.fmtN(r.run)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div></Reveal>
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
    const inTot = moveRows.reduce((s: number, r: any) => s + (r.qty > 0 ? r.qty : 0), 0);
    const outTot = moveRows.reduce((s: number, r: any) => s + (r.qty < 0 ? -r.qty : 0), 0);
    openPrint(
      <ReportSheet title={`بطاقة صنف — ${it?.name || ""}`} subtitle="سجل تفصيلي: الكميات الداخلة والخارجة والرصيد المتبقي بعد كل حركة" user={user}
        filters={[["الكود", it?.code || "—"], ["الباركود", String(it?.barcode || "—")], ["المجموعة", app.db.groups.find((g: any) => g.id === it?.group)?.name || "—"], ["الوحدة", app.db.units.find((u: any) => u.id === it?.unit)?.name || "—"], ["حد الطلب / الأقصى", `${it?.min} / ${it?.max}`]]}
        summary={[["إجمالي الوارد", app.fmtN(inTot)], ["إجمالي الصادر", app.fmtN(outTot)], ["الرصيد الحالي", String(app.itemQty(it?.id || ""))], ["قيمة الرصيد بالتكلفة", app.fmtN(app.itemQty(it?.id || "") * (it?.cost || 0))]]}>
        <PTable head={["السند", "التاريخ", "نوع الحركة", "وارد", "صادر", "الرصيد بعد الحركة"]}
          rows={moveRows.map((r: any) => [<span key="r" className="num">{r.ref}</span>, <span key="d" className="num">{r.date}</span>, r.type, <span key="in" className="num">{r.qty > 0 ? app.fmtN(r.qty) : "—"}</span>, <span key="out" className="num">{r.qty < 0 ? app.fmtN(-r.qty) : "—"}</span>, <span key="b" className="num"><b>{app.fmtN(r.run)}</b></span>])} />
        <PTable head={["المخزن", "الرصيد", "أدنى", "أقصى"]}
          rows={whs.map((w: any) => [<b key="w">{w.name}</b>, <span key="q" className="num"><b>{it?.qty[w.id] || 0}</b></span>, <span key="mn" className="num">{it?.min}</span>, <span key="mx" className="num">{it?.max}</span>])} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "journal") {
    const docs = app.db.invDocs as any as AnyR[];
    const inV = docs.reduce((s, d) => s + d.lines.reduce((a: number, l: any) => a + (l.qty > 0 ? l.qty * l.cost : 0), 0), 0);
    const outV = docs.reduce((s, d) => s + d.lines.reduce((a: number, l: any) => a + (l.qty < 0 ? -l.qty * l.cost : 0), 0), 0);
    openPrint(
      <ReportSheet title={title} subtitle="اليومية العامة لكل السندات المخزنية مرتبة مع الأطراف والقيم" user={user}
        filters={[["عدد السندات", String(docs.length)], ["حتى تاريخ", today]]}
        summary={[["قيمة الوارد", app.fmtN(inV)], ["قيمة الصادر", app.fmtN(outV)], ["صافي الحركة", app.fmtN(inV - outV)]]}>
        <PTable head={["السند", "التاريخ", "النوع", "نوع الحركة", "المخزن", "وارد", "صادر", "الحالة"]}
          rows={docs.map((d: any) => [<span key="r" className="num">{d.ref}</span>, <span key="d" className="num">{d.date}</span>, <b key="t">{d.type}</b>, <span key="s">{d.subType || "—"}</span>, <span key="w">{whName(d.warehouse)}</span>, <span key="in" className="num">{d.lines.reduce((a: number, l: any) => a + (l.qty > 0 ? l.qty * l.cost : 0), 0) || "—"}</span>, <span key="out" className="num">{d.lines.reduce((a: number, l: any) => a + (l.qty < 0 ? -l.qty * l.cost : 0), 0) || "—"}</span>, <span key="st">{d.status}</span>])} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "valuation") {
    const rows = app.db.groups.map((g: any) => {
      const gi = items.filter((i: any) => i.group === g.id);
      const cost = gi.reduce((s: number, i: any) => s + app.itemQty(i.id) * i.cost, 0);
      const sale = gi.reduce((s: number, i: any) => s + app.itemQty(i.id) * i.price, 0);
      return { g, count: gi.length, cost, sale };
    });
    openPrint(
      <ReportSheet title={title} subtitle="قيمة المخزون بالتكلفة والبيع لكل مجموعة مع هامش الربح" user={user}
        filters={[["عدد المجموعات", String(rows.length)], ["حتى تاريخ", today]]}
        summary={[["إجمالي التكلفة", app.fmtN(rows.reduce((s, r) => s + r.cost, 0))], ["إجمالي القيمة البيعية", app.fmtN(rows.reduce((s, r) => s + r.sale, 0))], ["هامش الربح المتوقع", app.fmtN(rows.reduce((s, r) => s + r.sale - r.cost, 0))]]}>
        <PTable head={["المجموعة", "ح/ المخزون", "الأصناف", "قيمة التكلفة", "القيمة البيعية", "هامش الربح"]}
          rows={rows.map((r, i) => [<b key="n">{r.g.name}</b>, <span key="a" className="num">{r.g.stockAccount || "—"}</span>, <span key="c" className="num">{r.count}</span>, <span key="co" className="num">{app.fmtN(r.cost)}</span>, <span key="sa" className="num">{app.fmtN(r.sale)}</span>, <span key="m" className="num"><b>{app.fmtN(r.sale - r.cost)}</b></span>])} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "reorder") {
    const rows = items.map((i: any) => ({ ...i, total: app.itemQty(i.id) })).filter((r: any) => r.total < r.min);
    openPrint(
      <ReportSheet title={title} subtitle="الأصناف التي بلغت حد إعادة الطلب مع الكميات المقترحة" user={user}
        filters={[["عدد الأصناف", String(rows.length)], ["حتى تاريخ", today]]}
        summary={[["قيمة أوامر الشراء المقترحة", app.fmtN(rows.reduce((s: number, r: any) => s + (r.max - r.total) * r.cost, 0))]]}>
        <PTable head={["الصنف", "الرصيد", "حد الطلب", "الأقصى", "الكمية المقترحة", "قيمة الأمر"]}
          rows={rows.map((r: any) => [<b key="n">{r.name}</b>, <span key="t" className="num"><b>{r.total}</b></span>, <span key="mn" className="num">{r.min}</span>, <span key="mx" className="num">{r.max}</span>, <span key="s" className="num"><b>+{r.max - r.total}</b></span>, <span key="v" className="num">{app.fmtN((r.max - r.total) * r.cost)}</span>])} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "transfers") {
    const rows = (app.db.invDocs as any as AnyR[]).filter((d) => d.type === "تحويل");
    openPrint(
      <ReportSheet title={title} subtitle="التحويلات بين المخازن: المصدر والوجهة والقيم" user={user}
        filters={[["عدد التحويلات", String(rows.length)], ["حتى تاريخ", today]]}
        summary={[["قيمة البضاعة المحوّلة", app.fmtN(rows.reduce((s, d) => s + d.lines.reduce((a: number, l: any) => a + l.qty * l.cost, 0), 0))]]}>
        <PTable head={["السند", "التاريخ", "من مخزن", "إلى مخزن", "الأصناف", "القيمة", "الحالة"]}
          rows={rows.map((d: any) => [<span key="r" className="num">{d.ref}</span>, <span key="d" className="num">{d.date}</span>, whName(d.warehouse), whName(d.toWarehouse || ""), <span key="c" className="num">{d.lines.length}</span>, <span key="v" className="num"><b>{app.fmtN(d.lines.reduce((a: number, l: any) => a + l.qty * l.cost, 0))}</b></span>, <span key="s">{d.status}</span>])} />
      </ReportSheet>
    );
    return;
  }

  if (kind === "slow") {
    const outMoves = new Set<string>();
    (app.db.invDocs as any as AnyR[]).forEach((d) => d.lines.forEach((l: any) => { if (l.qty < 0) outMoves.add(l.item); }));
    const rows = items.map((i: any) => ({ ...i, total: app.itemQty(i.id) })).filter((r: any) => !outMoves.has(r.id) && r.total > 0);
    openPrint(
      <ReportSheet title={title} subtitle="أصناف بلا حركات صادرة — رأس مال راكد" user={user}
        filters={[["عدد الأصناف الراكدة", String(rows.length)], ["حتى تاريخ", today]]}
        summary={[["قيمة الأموال الراكدة", app.fmtN(rows.reduce((s: number, r: any) => s + r.total * r.cost, 0))]]}>
        <PTable head={["الصنف", "المجموعة", "الرصيد", "القيمة الراكدة"]}
          rows={rows.map((r: any) => [<b key="n">{r.name}</b>, <span key="g">{app.db.groups.find((g: any) => g.id === r.group)?.name || "—"}</span>, <span key="t" className="num">{app.fmtN(r.total)}</span>, <span key="v" className="num"><b>{app.fmtN(r.total * r.cost)}</b></span>])} />
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
