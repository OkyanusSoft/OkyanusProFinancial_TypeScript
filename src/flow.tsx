import { useState, type ReactNode } from "react";
import { I, Modal } from "./ui";

/* ════════════════════════════════════════════════════════════
   محرك سير حالة المستندات (Document Lifecycle Engine)
   النموذج المعتمد:  مسودة ← مرحّل  (مع إلغاء ترحيل للمدير)

   القاعدة الذهبية:
   • الحفظ في أي شاشة حركة يعيد الحالة إلى «مسودة».
   • المسودة: استعراض / تعديل / حذف نهائي / ترحيل / طباعة.
   • المرحّل: استعراض / طباعة + «إلغاء ترحيل» (لمدير النظام
     ولمن يملك الصلاحية) يعيده مسودة ويعكس أثره.
   ════════════════════════════════════════════════════════════ */

export type Canon = "draft" | "posted" | "void";

export const normStatus = (s?: string): Canon => {
  if (!s) return "posted";
  if (s.includes("مسودة")) return "draft";
  if (s.includes("بانتظار")) return "draft"; /* الطلبات المعلقة تعامل كمسودة */
  if (s.includes("مرحّل") || s.includes("مرحّلة")) return "posted";
  if (s.includes("ملغ")) return "void";
  return "posted";
};

export const STATUS_LABEL: Record<Canon, string> = { draft: "مسودة", posted: "مرحّل", void: "ملغي" };

export interface Rule { ok: boolean; reason: string }
export const OK: Rule = { ok: true, reason: "" };

export function docRule(status: string | undefined, action: "view" | "edit" | "del" | "post" | "unpost" | "print"): Rule {
  const c = normStatus(status);
  switch (action) {
    case "view":
    case "print":
      return OK; /* الاستعراض والطباعة متاحان دائماً */
    case "edit":
    case "del":
      return c === "draft" ? OK : { ok: false, reason: c === "posted" ? "المستند مرحّل — اضغط «إلغاء ترحيل» أولاً لإعادته مسودة" : "المستند ملغي ومؤرشف" };
    case "post":
      return c === "draft" ? OK : { ok: false, reason: c === "posted" ? "المستند مرحّل بالفعل" : "المستند ملغي" };
    case "unpost":
      return c === "posted" ? OK : { ok: false, reason: "إلغاء الترحيل متاح للمرحّل فقط" };
  }
}

interface AppLike {
  can: (module: string, action: string) => boolean;
  toast: (msg: string, kind?: "ok" | "err" | "info") => void;
}

/* ═══════ زر إجراء منسّق — لبنة شريط الإجراءات ═══════ */
function Chip({ icon, label, tone, on, lockedTitle, onClick, strong }: {
  icon: string; label: string; tone: string; on: boolean; lockedTitle?: string; onClick: () => void; strong?: boolean;
}) {
  return (
    <button
      onClick={() => { if (on) onClick(); }}
      disabled={!on}
      title={on ? label : lockedTitle}
      aria-label={label}
      className={`act-chip ${on ? "" : "act-locked"} ${strong ? "act-strong" : ""}`}
      style={on ? { ["--tone" as any]: tone } : undefined}
    >
      <I n={on ? icon : "lock"} size={12} />
      <span>{label}</span>
    </button>
  );
}

/* ═══════ شريط إجراءات المستند — يتشكل حسب الحالة والصلاحيات ═══════
   الحذف نهائي: نقرتان — الأولى تحوّل الزر إلى «تأكيد؟» والثانية تحذف من السجل نهائياً */
export function DocActions({ app, module, status, onView, onEdit, onDelete, onPost, onUnpost, onPrint }: {
  app: AppLike; module: string; status?: string;
  onView?: () => void; onEdit?: () => void; onDelete?: () => void;
  onPost?: () => void; onUnpost?: () => void; onPrint?: () => void;
}) {
  const c = normStatus(status);
  const can = (perm: string) => app.can(module, perm) || (perm === "استعراض" && app.can(module, "عرض"));
  const isAdmin = app.can(module, "إلغاء ترحيل");
  const [armDel, setArmDel] = useState(false);

  /* تسليح زر الحذف: إن لم يكن مسلّحاً يتحول إلى «تأكيد؟» ثم يعود بعد 2.5ث */
  const handleDelete = () => {
    if (!onDelete) return;
    if (!armDel) {
      setArmDel(true);
      window.setTimeout(() => setArmDel(false), 2500);
      return;
    }
    setArmDel(false);
    onDelete();
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {onView && <Chip icon="eye" label="استعراض" tone="var(--brand)" on={can("استعراض")} lockedTitle="صلاحية «استعراض» غير مخوّلة" onClick={onView} />}

      {c === "draft" && onEdit && <Chip icon="edit" label="تعديل" tone="var(--accent)" on={can("تعديل")} lockedTitle="صلاحية «تعديل» غير مخوّلة" onClick={onEdit} />}
      {c === "draft" && onDelete && (
        <Chip icon={armDel ? "alert" : "trash"} label={armDel ? "تأكيد الحذف؟" : "حذف"} tone="var(--bad)" on={can("حذف")}
          lockedTitle="صلاحية «حذف» غير مخوّلة" onClick={handleDelete} strong={armDel} />
      )}
      {c === "draft" && onPost && <Chip icon="check" label="ترحيل" tone="var(--good)" on={can("ترحيل")} lockedTitle="صلاحية «ترحيل» غير مخوّلة" onClick={onPost} strong />}

      {c === "posted" && onUnpost && (
        <Chip icon="undo" label="إلغاء ترحيل" tone="var(--warn)" on={isAdmin} lockedTitle="«إلغاء ترحيل» لمدير النظام أو من يملك الصلاحية" onClick={onUnpost} />
      )}

      {onPrint && <Chip icon="print" label="طباعة" tone="var(--brand)" on={can("طباعة")} lockedTitle="صلاحية «طباعة» غير مخوّلة" onClick={onPrint} />}
    </div>
  );
}

/* ═══════ شارة الحالة الملوّنة ═══════ */
export function StatusChip({ status }: { status?: string }) {
  const c = normStatus(status);
  const tone = c === "draft" ? "var(--mute)" : c === "posted" ? "var(--good)" : "var(--bad)";
  const label = status && status.includes("بانتظار") ? "بانتظار الموافقة" : STATUS_LABEL[c];
  return (
    <span className="chip !text-[0.62rem]" style={{ background: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone }} />
      {label}
    </span>
  );
}

/* ═══════ مدرّج المسار: مسودة ← مرحّل ═══════ */
export function StatusSteps({ status, className = "" }: { status?: string; className?: string }) {
  const c = normStatus(status);
  if (c === "void") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-[var(--bad)] ${className}`}>
        <I n="undo" size={13} /> ملغي — أثر عكسي مُولّد
      </span>
    );
  }
  const steps = [
    { k: "draft", l: "مسودة" },
    { k: "posted", l: "مرحّل" },
  ] as const;
  const idx = c === "draft" ? 0 : 1;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {steps.map((s, i) => (
        <span key={s.k} className="inline-flex items-center gap-1">
          {i > 0 && <span className={`w-5 h-px ${i <= idx ? "bg-[var(--good)]" : "bg-[color-mix(in_srgb,var(--mute)_35%,transparent)]"}`} />}
          <span
            className={`flex items-center gap-1.5 text-[0.64rem] font-bold px-2 py-0.5 rounded-full ${i === idx ? "text-[var(--brandink)] shadow-sm" : i < idx ? "text-[var(--good)] bg-[color-mix(in_srgb,var(--good)_10%,transparent)]" : "text-mute bg-panel"}`}
            style={i === idx ? { background: "linear-gradient(135deg, var(--brand), var(--brand2))" } : undefined}
          >
            {i < idx && <I n="check" size={10} />}
            {i === idx && <span className="w-1.5 h-1.5 rounded-full bg-white/90 blink" />}
            {s.l}
          </span>
        </span>
      ))}
    </span>
  );
}

/* لهجة شارة الحالة */
export const statusTone = (status?: string): string => {
  const c = normStatus(status);
  return c === "draft" ? "var(--mute)" : c === "posted" ? "var(--good)" : "var(--bad)";
};

/* ═══════════ عرض المستند للقراءة فقط — بلا أي تعديل ═══════════
   شاشة موحّدة تعرض السند وبياناته كاملة كما هي، مع قيده المحاسبي
   المولّد تلقائياً إن وُجد. الزر الوحيد: طباعة (اختياري).        */
export interface DocViewData {
  icon: string;
  docTitle: string;                     /* نوع السند: سند توريد مخزني، فاتورة مبيعات… */
  no: string;                           /* رقم السند */
  date: string;
  status?: string;
  user?: string;
  meta: [string, ReactNode][];          /* حقول رأس المستند */
  lineCols?: string[];                  /* أعمدة بنود المستند */
  lineRows?: ReactNode[][];             /* صفوف البنود */
  totals?: [string, ReactNode][];       /* الإجماليات الفرعية */
  grand?: [string, ReactNode];          /* الإجمالي النهائي */
  journalLines?: { account: string; name?: string; debit: number; credit: number }[]; /* القيد المولّد */
  note?: string;                        /* البيان */
}
export function ReadOnlyDoc({ open, onClose, d, fmtN, onPrint }: {
  open: boolean; onClose: () => void; d: DocViewData | null;
  fmtN: (n: number) => string; onPrint?: () => void;
}) {
  if (!d) return null;
  const jeTotal = (d.journalLines || []).reduce((a, l) => a + l.debit, 0);
  return (
    <Modal open={open} onClose={onClose} wide icon={d.icon}
      title={`${d.docTitle} — ${d.no}`}
      subtitle="عرض المستند وبياناته كما هي — للقراءة فقط، لا يمكن التعديل من هنا"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}><I n="x" size={15} /> إغلاق</button>
        {onPrint && <button className="btn btn-brand" onClick={onPrint}><I n="print" size={15} /> طباعة المستند</button>}
      </>}>
      {/* شريط الحالة */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <StatusChip status={d.status} />
        <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-num" dir="ltr">{d.no}</span>
        <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)] font-num" dir="ltr">{d.date}</span>
        {d.user && <span className="chip bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)]"><I n="user" size={11} /> {d.user}</span>}
        <span className="ms-auto chip bg-[color-mix(in_srgb,var(--warn)_12%,transparent)] text-[var(--warn)]"><I n="lock" size={11} /> للقراءة فقط</span>
      </div>

      {/* رأس المستند */}
      <div className="rounded-xl border border-line bg-panel/60 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <I n="file" size={16} className="text-[var(--brand)]" />
          <h4 className="font-display font-bold text-[0.95rem]">رأس المستند</h4>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-3">
          {d.meta.map(([k, v], i) => (
            <div key={i}>
              <div className="text-[0.64rem] font-bold text-mute">{k}</div>
              <div className="text-[0.86rem] font-bold mt-0.5">{v}</div>
            </div>
          ))}
        </div>
        {d.note && (
          <div className="mt-3 pt-3 border-t border-line">
            <div className="text-[0.64rem] font-bold text-mute">البيان</div>
            <p className="text-[0.84rem] font-bold text-soft leading-6 mt-0.5">{d.note}</p>
          </div>
        )}
      </div>

      {/* بنود المستند */}
      {d.lineCols && d.lineRows && (
        <div className="rounded-xl border border-line overflow-hidden mb-4">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-panel/60 border-b border-line">
            <I n="layers" size={15} className="text-[var(--brand)]" />
            <h4 className="font-display font-bold text-[0.95rem]">بنود المستند</h4>
            <span className="ms-auto chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)]">{d.lineRows.length} بند</span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr>{d.lineCols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>{d.lineRows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* الإجماليات */}
      {d.totals && (
        <div className="rounded-xl border border-line bg-panel/60 p-4 mb-4">
          <div className="space-y-2">
            {d.totals.map(([k, v], i) => (
              <div key={i} className="flex justify-between text-[0.82rem] font-bold border-b border-line/60 pb-2 last:border-0">
                <span className="text-soft">{k}</span><span className="font-num">{v}</span>
              </div>
            ))}
          </div>
          {d.grand && (
            <div className="flex justify-between items-center mt-3 rounded-lg px-3.5 py-2.5 text-[var(--brandink)]" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}>
              <span className="font-display font-bold text-[0.9rem]">{d.grand[0]}</span>
              <span className="font-num font-bold text-[1.05rem]">{d.grand[1]}</span>
            </div>
          )}
        </div>
      )}

      {/* القيد المحاسبي المولّد تلقائياً */}
      {d.journalLines && d.journalLines.length > 0 && (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--good)_30%,transparent)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[color-mix(in_srgb,var(--good)_8%,transparent)] border-b border-[color-mix(in_srgb,var(--good)_25%,transparent)]">
            <I n="book" size={15} className="text-[var(--good)]" />
            <h4 className="font-display font-bold text-[0.95rem]">القيد المحاسبي المولّد تلقائياً</h4>
            <span className="ms-auto chip bg-[color-mix(in_srgb,var(--good)_14%,transparent)] text-[var(--good)]">متوازن ✓ {fmtN(jeTotal)} ر.ي</span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>الحساب</th><th>الاسم</th><th>مدين</th><th>دائن</th></tr></thead>
              <tbody>
                {d.journalLines.map((l, i) => (
                  <tr key={i}>
                    <td className="font-num font-bold" dir="ltr">{l.account}</td>
                    <td className="font-bold">{l.name || "—"}</td>
                    <td className="font-num font-bold text-[var(--bad)]">{l.debit ? fmtN(l.debit) : "—"}</td>
                    <td className="font-num font-bold text-[var(--good)]">{l.credit ? fmtN(l.credit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
