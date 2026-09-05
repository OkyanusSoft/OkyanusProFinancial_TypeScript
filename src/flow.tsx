import { I } from "./ui";

/* ════════════════════════════════════════════════════════════
   محرك سير حالة المستندات (Document Lifecycle Engine)
   مسودة ← معتمد ← مرحّل ← ملغي
   القاعدة الذهبية: المستند المعتمد/المرحّل لا يُعدَّل ولا يُحذف
   نهائياً إلا بعد إلغاء الاعتماد أو الإلغاء بأثر عكسي.
   ════════════════════════════════════════════════════════════ */

export type Canon = "draft" | "pending" | "approved" | "posted" | "void";
export type DocAction = "view" | "edit" | "del" | "print" | "approve" | "unapprove" | "post" | "void";

export const normStatus = (s?: string): Canon => {
  if (!s) return "posted";
  if (s.includes("مسودة")) return "draft";
  if (s.includes("بانتظار")) return "pending";
  if (s.includes("معتمد")) return "approved";
  if (s.includes("مرحّل") || s.includes("مرحّلة")) return "posted";
  if (s.includes("ملغ")) return "void";
  return "posted";
};

export interface Rule { ok: boolean; reason: string }

export function docRule(status: string | undefined, action: DocAction): Rule {
  const c = normStatus(status);
  const OK: Rule = { ok: true, reason: "" };
  switch (action) {
    case "view":
    case "print":
      return OK; /* الاستعراض والطباعة متاحان دائماً — حتى للنسخ المؤرشفة */
    case "edit":
    case "del":
      if (c === "draft" || c === "pending") return OK;
      if (c === "approved") return { ok: false, reason: "المستند معتمد — ألغِ الاعتماد أولاً لإعادة التعديل أو الحذف" };
      if (c === "posted") return { ok: false, reason: "المستند مرحّل ومحكم — لا تعديل أو حذف دائم؛ استخدم «إلغاء» لتوليد أثر عكسي" };
      return { ok: false, reason: "المستند ملغي ومؤرشف — لا إجراءات عليه" };
    case "approve":
      if (c === "draft" || c === "pending") return OK;
      return { ok: false, reason: c === "approved" ? "المستند معتمد مسبقاً" : c === "posted" ? "المستند مرحّل بالفعل" : "المستند ملغي" };
    case "unapprove":
      if (c === "approved") return OK;
      return { ok: false, reason: "إلغاء الاعتماد متاح فقط للمستندات المعتمدة التي لم تُرحّل بعد" };
    case "post":
      if (c === "approved") return OK;
      if (c === "draft" || c === "pending") return { ok: false, reason: "اعتمد المستند أولاً ثم رحّله — حماية الترحيل المباشر" };
      return { ok: false, reason: c === "posted" ? "المستند مرحّل بالفعل" : "المستند ملغي" };
    case "void":
      if (c === "approved" || c === "posted") return OK;
      if (c === "draft" || c === "pending") return { ok: false, reason: "المسودة تُحذف مباشرة ولا تحتاج إلغاءً" };
      return { ok: false, reason: "المستند ملغي مسبقاً" };
  }
}

export interface DocActionDef { id: DocAction; label: string; perm: string; icon: string; tone: string }
export const DOC_ACTIONS: DocActionDef[] = [
  { id: "view", label: "استعراض", perm: "استعراض", icon: "eye", tone: "var(--brand)" },
  { id: "edit", label: "تعديل", perm: "تعديل", icon: "edit", tone: "var(--accent)" },
  { id: "del", label: "حذف", perm: "حذف", icon: "trash", tone: "var(--bad)" },
  { id: "print", label: "طباعة", perm: "طباعة", icon: "print", tone: "var(--brand)" },
  { id: "approve", label: "اعتماد", perm: "اعتماد", icon: "shield", tone: "var(--warn)" },
  { id: "unapprove", label: "إلغاء الاعتماد", perm: "اعتماد", icon: "unlock", tone: "var(--soft)" },
  { id: "post", label: "ترحيل", perm: "ترحيل", icon: "check", tone: "var(--good)" },
  { id: "void", label: "إلغاء", perm: "إلغاء", icon: "undo", tone: "var(--bad)" },
];

interface AppLike { can: (module: string, action: string) => boolean; toast: (msg: string, kind?: "ok" | "err" | "info") => void }

/* ═══════ شريط أزرار المستند — محكوم بالصلاحيات + حالة المستند ═══════ */
export function DocActions({ app, module, status, on }: {
  app: AppLike; module: string; status?: string;
  on: Partial<Record<DocAction, () => void>>;
}) {
  return (
    <div className="flex flex-wrap gap-1 justify-start">
      {DOC_ACTIONS.filter((a) => on[a.id]).map((def) => {
        const rule = docRule(status, def.id);
        const permOk = def.id === "view" || def.id === "print" ? app.can(module, def.perm) || app.can(module, "عرض") : app.can(module, def.perm);
        const allowed = rule.ok && permOk;
        const lockReason = !rule.ok ? rule.reason : !permOk ? `صلاحية «${def.perm}» غير مخوّلة لدورك` : "";
        return (
          <button
            key={def.id}
            onClick={() => { if (allowed) on[def.id]!(); else app.toast(lockReason, "err"); }}
            title={lockReason || def.label}
            aria-label={def.label}
            className={`flex items-center gap-1 px-1.5 py-1 rounded-lg border text-[0.62rem] font-bold transition-all whitespace-nowrap ${
              allowed
                ? "bg-surface border-line text-soft hover:-translate-y-px hover:shadow-sm"
                : "bg-panel/50 border-line/60 text-mute/60 cursor-not-allowed"
            }`}
            style={allowed ? { ["--hov" as any]: def.tone } : undefined}
            onMouseEnter={(e) => { if (allowed) { (e.currentTarget as HTMLButtonElement).style.borderColor = `color-mix(in srgb, ${def.tone} 55%, transparent)`; (e.currentTarget as HTMLButtonElement).style.color = def.tone; } }}
            onMouseLeave={(e) => { if (allowed) { (e.currentTarget as HTMLButtonElement).style.borderColor = ""; (e.currentTarget as HTMLButtonElement).style.color = ""; } }}
          >
            <I n={allowed ? def.icon : "lock"} size={11} /> {def.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════ مدرّج حالة المستند — المسار الاحترافي ═══════ */
export function StatusSteps({ status, className = "" }: { status?: string; className?: string }) {
  const c = normStatus(status);
  const steps = [
    { k: "draft", l: "مسودة" },
    { k: "approved", l: "معتمد" },
    { k: "posted", l: "مرحّل" },
  ] as const;
  const idx = c === "draft" || c === "pending" ? 0 : c === "approved" ? 1 : c === "posted" ? 2 : -1;
  if (c === "void") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-[var(--bad)] ${className}`}>
        <I n="undo" size={13} /> ملغي — أثر عكسي مُولّد
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {steps.map((s, i) => (
        <span key={s.k} className="inline-flex items-center gap-1">
          {i > 0 && <span className={`w-4 h-px ${i <= idx ? "bg-[var(--good)]" : "bg-[color-mix(in_srgb,var(--mute)_35%,transparent)]"}`} />}
          <span className={`flex items-center gap-1 text-[0.64rem] font-bold px-1.5 py-0.5 rounded-full ${
            i < idx ? "text-[var(--good)] bg-[color-mix(in_srgb,var(--good)_10%,transparent)]"
            : i === idx ? "text-[var(--brandink)] shadow-sm"
            : "text-mute bg-panel"
          }`} style={i === idx ? { background: "linear-gradient(135deg, var(--brand), var(--brand2))" } : undefined}>
            {i < idx && <I n="check" size={10} />}
            {i === idx && <span className="w-1.5 h-1.5 rounded-full bg-white/90 blink" />}
            {s.l}
          </span>
        </span>
      ))}
      {c === "pending" && <span className="text-[0.6rem] font-bold text-[var(--warn)] ms-1">(بانتظار الموافقة)</span>}
    </span>
  );
}

/* لهجة شارة الحالة */
export const statusTone = (status?: string): string => {
  const c = normStatus(status);
  return c === "draft" ? "var(--mute)" : c === "pending" ? "var(--warn)" : c === "approved" ? "var(--accent)" : c === "posted" ? "var(--good)" : "var(--bad)";
};
