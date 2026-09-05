import { I } from "./ui";

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

/* ═══════ شريط إجراءات المستند — يتشكل حسب الحالة والصلاحيات ═══════ */
export function DocActions({ app, module, status, onView, onEdit, onDelete, onPost, onUnpost, onPrint }: {
  app: AppLike; module: string; status?: string;
  onView?: () => void; onEdit?: () => void; onDelete?: () => void;
  onPost?: () => void; onUnpost?: () => void; onPrint?: () => void;
}) {
  const c = normStatus(status);
  const can = (perm: string) => app.can(module, perm) || (perm === "استعراض" && app.can(module, "عرض"));
  const isAdmin = app.can(module, "إلغاء ترحيل");

  return (
    <div className="flex flex-wrap items-center gap-1">
      {onView && <Chip icon="eye" label="استعراض" tone="var(--brand)" on={can("استعراض")} lockedTitle="صلاحية «استعراض» غير مخوّلة" onClick={onView} />}

      {c === "draft" && onEdit && <Chip icon="edit" label="تعديل" tone="var(--accent)" on={can("تعديل")} lockedTitle="صلاحية «تعديل» غير مخوّلة" onClick={onEdit} />}
      {c === "draft" && onDelete && <Chip icon="trash" label="حذف" tone="var(--bad)" on={can("حذف")} lockedTitle="صلاحية «حذف» غير مخوّلة" onClick={onDelete} />}
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
