import { createContext, useContext, useState, type ReactNode } from "react";
import {
  ACCOUNTS, ANALYTICALS, UNITS, GROUPS, WAREHOUSES, ITEMS, SUPPLIERS, CUSTOMERS, CASHBOXES,
  COST_CENTERS, BRANCHES, DEPARTMENTS, USERS, CURRENCIES, PERIODS, INV_DOCS, PURCHASES, SALES,
  RETURNS, QUOTES, REQUESTS, JOURNALS, PERM_MODULES, PERM_ACTIONS, SIDEBAR_BGS, IMPORT_SAMPLES,
  SYSTEM, BANKS, PAYTERMS, PARTNER_CATS, ROLES_DIR, type AnyR, type InvDoc, type Invoice, type Journal, type Account,
} from "./data";
export type { AnyR } from "./data";

/* ═══════ توليد أرقام دليل الحسابات حسب آخر رقم في المستوى ═══════
   القاعدة: الرقم الجديد = كود الحساب الأب + (آخر رقم للأشقاء + 1)
   مثال: آخر حساب تحت «الأصول الثابتة» هو 1113 ← يُولَّد 1114        */
export function nextAccountCode(accounts: Account[], parentCode: string): string {
  const kids = accounts.filter((a) => a.parent === parentCode);
  let max = 0, width = 1;
  kids.forEach((k) => {
    const suffix = k.code.slice(parentCode.length);
    const n = parseInt(suffix, 10);
    if (!isNaN(n)) {
      max = Math.max(max, n);
      width = Math.max(width, suffix.length);
    }
  });
  const next = max + 1;
  width = Math.max(width, String(next).length);
  return parentCode + String(next).padStart(width, "0");
}

/* ═══════ أدوات تحقق عامة (صلاحية / تكرار / أرقام) ═══════ */
export const vReq = (v: any, label: string) => (v === "" || v === undefined || v === null ? `حقل «${label}» إلزامي` : "");
export const vDup = (list: AnyR[], key: string, val: any, selfId?: string) =>
  list.some((r) => r.id !== selfId && String(r[key]).trim() === String(val).trim()) ? "القيمة مستخدمة مسبقاً — التكرار غير مسموح" : "";
export const vNum = (v: any, label: string) => (isNaN(Number(v)) || v === "" ? `«${label}» يجب أن يكون رقماً صالحاً` : "");

export function parseCsv(text: string): string[][] {
  return text.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, "")));
}
export function sampleCsv(key: string): string {
  const s = IMPORT_SAMPLES[key];
  if (!s) return "";
  return [s.headers.join(","), ...s.rows.map((r) => r.join(","))].join("\n");
}

/* ═══════ الأنواع ═══════ */
export interface Session { company: string; branch: string; user: string; year: string; role: string }
export interface Route { module: string; path: string }
export type Toast = { id: number; msg: string; kind: "ok" | "err" | "info" };
export interface Notif { id: number; title: string; body: string; time: string; kind: "info" | "warn" | "bad" }

export type CollKey = "units" | "groups" | "warehouses" | "items" | "suppliers" | "customers" | "cashboxes" |
  "costCenters" | "branches" | "departments" | "users" | "currencies" | "periods" | "analyticals" |
  "requests" | "quotes" | "sales" | "purchases" | "returns" | "invDocs" | "journals" |
  "banks" | "payTerms" | "partnerCats" | "roles";

export interface Settings {
  vat: number; discMax: number; round: number; autoNum: boolean; blockOverCredit: boolean;
  negStock: boolean; lowStockAlert: boolean; requireCC: boolean; fiscalStart: string;
  prefixes: Record<string, string>;
  suspense: Record<string, string>;
  dbCfg: { host: string; port: number; user: string; pass: string; name: string; engine: string };
}

export interface Prefs { theme: string; font: number; dir: "rtl" | "ltr"; nums: "west" | "ar" | "plain"; dates: "iso" | "dmy" | "long"; notifEmail: boolean; notifSys: boolean; sidebarBg: string; loginBg: string }

interface AppCtx {
  db: Record<CollKey, AnyR[]>;
  trash: { coll: CollKey; row: AnyR; at: string }[];
  seq: Record<string, number>;
  settings: Settings; setSettings: (s: Settings) => void;
  prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void;
  session: Session | null; route: Route;
  toasts: Toast[]; notifs: Notif[];
  toast: (msg: string, kind?: Toast["kind"]) => void;
  pushNotif: (n: { kind: Notif["kind"]; title: string; body: string }) => void;
  markNotifs: () => void;
  nav: (r: Partial<Route>) => void;
  login: (s: Session) => void; logout: () => void;
  nextNo: (prefix: string) => string;
  /* إدارة السجلات: إضافة/تعديل/حذف/استعادة/استيراد */
  save: (coll: CollKey, row: AnyR) => void;
  remove: (coll: CollKey, id: string, label?: string) => void;
  restore: (idx: number) => void;
  purge: (idx: number) => void;
  emptyTrash: () => void;
  importRows: (coll: CollKey, rows: AnyR[], keyField: string, prefix: string) => { added: number; skipped: number };
  /* الحركات المالية والمخزنية */
  addInvDoc: (d: InvDoc) => { ok: boolean; msg: string };
  voidInvDoc: (id: string) => void;
  addInvoice: (kind: "sales" | "purchases" | "returns", inv: Invoice) => { ok: boolean; msg: string };
  voidInvoice: (kind: "sales" | "purchases" | "returns", id: string) => void;
  payInvoice: (kind: "sales" | "purchases", id: string, amount: number) => { ok: boolean; msg: string };
  addJournal: (j: Journal) => { ok: boolean; msg: string };
  voidJournal: (id: string) => void;
  approveJournal: (id: string) => void;
  lockPeriod: (id: string) => void;
  setQuoteStatus: (id: string, status: string) => void;
  setRequestStatus: (id: string, status: string) => void;
  /* أدوات عرض */
  fmtN: (n: number) => string;
  fmtMoney: (n: number) => string;
  fmtDate: (iso: string) => string;
  invoiceTotal: (inv: Invoice) => number;
  itemQty: (code: string) => number;
  exportCsv: (name: string, rows: (string | number)[][]) => void;
  can: (module: string, action: string) => boolean;
  togglePerm: (role: string, module: string, action: string) => void;
  perms: Record<string, Record<string, string[]>>;
  accounts: Account[];
  addAccount: (a: Account) => boolean;
  nextAccountCode: (parentCode: string) => string;
  sidebarBgs: typeof SIDEBAR_BGS;
  SYSTEM: typeof SYSTEM;
}

const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => useContext(Ctx)!;

const initDb: Record<CollKey, AnyR[]> = {
  units: UNITS, groups: GROUPS, warehouses: WAREHOUSES, items: ITEMS, suppliers: SUPPLIERS,
  customers: CUSTOMERS, cashboxes: CASHBOXES, costCenters: COST_CENTERS, branches: BRANCHES,
  departments: DEPARTMENTS, users: USERS, currencies: CURRENCIES, periods: PERIODS,
  banks: BANKS, payTerms: PAYTERMS, partnerCats: PARTNER_CATS, roles: ROLES_DIR,
  analyticals: ANALYTICALS, requests: REQUESTS, quotes: QUOTES,
  sales: SALES as any, purchases: PURCHASES as any, returns: RETURNS as any,
  invDocs: INV_DOCS as any, journals: JOURNALS as any,
};

const DEF_PERMS: Record<string, Record<string, string[]>> = {
  "مدير النظام": Object.fromEntries(PERM_MODULES.map((m) => [m, [...PERM_ACTIONS]])),
  "محاسب رئيسي": Object.fromEntries(PERM_MODULES.map((m) => [m, m === "إدارة النظام" ? ["عرض"] : [...PERM_ACTIONS]])),
  "أمين مخزن": { "لوحة التحكم": ["عرض"], "المخازن": ["عرض", "إنشاء", "تعديل", "تصدير تقارير"], "المشتريات": ["عرض"], "المبيعات": ["عرض"], "الحسابات العامة": ["عرض"], "إدارة النظام": [], "التقارير": ["عرض", "تصدير تقارير"] },
  "مسؤولة مشتريات": { "لوحة التحكم": ["عرض"], "المخازن": ["عرض"], "المشتريات": [...PERM_ACTIONS], "المبيعات": ["عرض"], "الحسابات العامة": ["عرض", "إنشاء"], "إدارة النظام": [], "التقارير": ["عرض", "تصدير تقارير"] },
  "مسؤول مبيعات": { "لوحة التحكم": ["عرض"], "المخازن": ["عرض"], "المشتريات": ["عرض"], "المبيعات": ["عرض", "إنشاء", "تعديل", "تصدير تقارير"], "الحسابات العامة": ["عرض"], "إدارة النظام": [], "التقارير": ["عرض", "تصدير تقارير"] },
  "مدقق خارجي": Object.fromEntries(PERM_MODULES.map((m) => [m, ["عرض", "تصدير تقارير"]])),
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState(initDb);
  const [accounts, setAccounts] = useState<Account[]>(ACCOUNTS);
  const [trash, setTrash] = useState<{ coll: CollKey; row: AnyR; at: string }[]>([]);
  const [seq, setSeq] = useState<Record<string, number>>({ SIN: 260, PIN: 120, SRT: 18, GRN: 8, ISS: 22, TR: 4, ADJ: 4, JC: 2, JE: 1010, RC: 107, PV: 107, PR: 36, QT: 48, OB: 2, FYE: 2, REQ: 5 });
  const [settings, setSettings] = useState<Settings>({
    vat: 5, discMax: 15, round: 2, autoNum: true, blockOverCredit: true, negStock: false,
    lowStockAlert: true, requireCC: true, fiscalStart: "2026-01-01",
    prefixes: { SIN: "SIN", PIN: "PIN", SRT: "SRT", GRN: "GRN", ISS: "ISS", TR: "TR", ADJ: "ADJ", JC: "JC", JE: "JE", RC: "RC", PV: "PV", PR: "PR", QT: "QT" },
    suspense: { salesCash: "41111", salesCredit: "41112", purchases: "11311", vatOut: "21211", vatIn: "21212", customers: "11211", suppliers: "21111", cogs: "31511", cash: "11111", bank: "11121" },
    dbCfg: { host: "localhost", port: 3306, user: "erp_admin", pass: "", name: "okyanus_ifs", engine: "InnoDB" },
  });
  const [prefs, setPrefsState] = useState<Prefs>({ theme: "azure", font: 100, dir: "rtl", nums: "west", dates: "iso", notifEmail: true, notifSys: true, sidebarBg: "ocean", loginBg: "sea" });
  const [session, setSession] = useState<Session | null>(null);
  const [route, setRoute] = useState<Route>({ module: "dashboard", path: "" });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([
    { id: 1, kind: "warn", title: "صنف دون الحد الأدنى", body: "سيفترياكسون 1g حقن: الرصيد 380 والحد الأدنى 300 — راقب الطلبات.", time: "09:20" },
    { id: 2, kind: "bad", title: "تجاوز حد ائتماني", body: "صيدلية ابن سينا تجاوزت حد الائتمان بمقدار 10,500 ر.ي.", time: "08:47" },
    { id: 3, kind: "info", title: "نسخة احتياطية", body: "اكتملت النسخة التفاضلية بنجاح (186 MB) الساعة 02:00.", time: "02:00" },
  ]);
  const [perms, setPerms] = useState(DEF_PERMS);

  const toast = (msg: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4400);
  };
  const pushNotif = (n: { kind: Notif["kind"]; title: string; body: string }) =>
    setNotifs((old) => [{ id: Date.now(), time: new Date().toTimeString().slice(0, 5), ...n }, ...old]);
  const markNotifs = () => setNotifs([]);

  const setPrefs = (p: Partial<Prefs>) => setPrefsState((old) => ({ ...old, ...p }));
  const nav = (r: Partial<Route>) => setRoute((old) => ({ module: r.module || old.module, path: r.path !== undefined ? r.path : old.path }));
  const login = (s: Session) => { setSession(s); setRoute({ module: "dashboard", path: "" }); };
  const logout = () => setSession(null);

  const year = session?.year || "2026";
  const nextNo = (prefix: string) => {
    const n = (seq[prefix] || 1) + 1;
    setSeq((s) => ({ ...s, [prefix]: n }));
    return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
  };

  /* ── إدارة السجلات العامة ── */
  const save = (coll: CollKey, row: AnyR) =>
    setDb((d) => {
      const list = d[coll];
      const i = list.findIndex((r) => r.id === row.id);
      const next = i >= 0 ? list.map((r, j) => (j === i ? row : r)) : [...list, row];
      return { ...d, [coll]: next };
    });

  const remove = (coll: CollKey, id: string, label?: string) => {
    setDb((d) => {
      const row = d[coll].find((r) => r.id === id);
      if (row) setTrash((t) => [{ coll, row, at: new Date().toLocaleString("ar-EG") }, ...t]);
      return { ...d, [coll]: d[coll].filter((r) => r.id !== id) };
    });
    toast(`نُقل «${label || id}» إلى سلة المحذوفات — يمكن الاستعادة من سلة الصيانة`, "ok");
  };
  const restore = (idx: number) => {
    const t = trash[idx];
    if (!t) return;
    setDb((d) => ({ ...d, [t.coll]: [...d[t.coll], t.row] }));
    setTrash((old) => old.filter((_, i) => i !== idx));
    toast("تمت استعادة السجل بنجاح", "ok");
  };
  const purge = (idx: number) => {
    const t = trash[idx];
    setTrash((old) => old.filter((_, i) => i !== idx));
    toast(`حُذف «${t?.row?.name || t?.row?.code || "السجل"}» نهائياً من قاعدة البيانات`, "err");
  };
  const emptyTrash = () => { setTrash([]); toast("أُفرغت سلة المحذوفات — اكتملت عملية الصيانة", "info"); };

  /* ── إضافة حساب لدليل الحسابات (ترقيم تلقائي حسب المستوى) ── */
  const addAccount = (acc: Account): boolean => {
    if (accounts.some((a) => a.code === acc.code)) { toast(`الكود ${acc.code} مستخدم بالفعل — التكرار غير مسموح`, "err"); return false; }
    if (accounts.some((a) => a.parent === acc.parent && a.name === acc.name)) { toast("يوجد حساب بنفس الاسم تحت هذا الأب", "err"); return false; }
    const parent = accounts.find((a) => a.code === acc.parent);
    if (!parent) { toast("الحساب الأب غير موجود", "err"); return false; }
    if (parent.level >= 5) { toast("لا يمكن الإضافة تحت حساب من المستوى الخامس", "err"); return false; }
    setAccounts((old) => [
      ...old.map((a) => (a.code === acc.parent && a.posting ? { ...a, posting: false } : a)),
      { ...acc, level: parent.level + 1, type: acc.type || parent.type, parent: acc.parent },
    ]);
    toast(`أُضيف الحساب ${acc.code} — «${acc.name}» (المستوى ${parent.level + 1}) بنجاح`, "ok");
    pushNotif({ kind: "info", title: "دليل الحسابات", body: `حساب جديد ${acc.code} — ${acc.name}` });
    return true;
  };

  const importRows = (coll: CollKey, rows: AnyR[], keyField: string, prefix: string) => {
    let added = 0, skipped = 0;
    setDb((d) => {
      const list = [...d[coll]];
      rows.forEach((r) => {
        const val = String(r[keyField] ?? "").trim();
        if (!val) { skipped++; return; }
        if (list.some((x) => String(x[keyField]).trim() === val)) { skipped++; return; }
        const id = r.id || `${prefix}-IMP${String(list.length + added + 1).padStart(3, "0")}`;
        list.push({ ...r, id, code: r.code || id });
        added++;
      });
      return { ...d, [coll]: list };
    });
    return { added, skipped };
  };

  /* ── التحقق من الفترات المقفلة ── */
  const periodLocked = (date: string) => {
    const m = date.slice(0, 7);
    return (db.periods as any[]).some((p: any) => p.id === m && p.locked);
  };

  /* ── الحركات المخزنية ── */
  const itemQty = (code: string) => {
    const it: any = db.items.find((i) => i.id === code);
    return it ? Object.values(it.qty as Record<string, number>).reduce((a: number, b: any) => a + (b as number), 0) : 0;
  };

  const addInvDoc = (d: InvDoc) => {
    if (periodLocked(d.date)) { toast(`الفترة ${d.date.slice(0, 7)} مقفلة مالياً — لا يمكن الترحيل إليها`, "err"); return { ok: false, msg: "فترة مقفلة" }; }
    if (!settings.negStock) {
      for (const l of d.lines) {
        const it: any = db.items.find((i) => i.id === l.item);
        if (!it) continue;
        const delta = d.type === "صرف" ? -l.qty : d.type === "توريد" || d.type === "قيد افتتاحي" ? l.qty : d.type === "جرد" || d.type === "تسوية" ? l.qty : 0;
        const cur = (it.qty[d.warehouse] || 0) + delta;
        if ((d.type === "صرف" || delta < 0) && cur < 0) return { ok: false, msg: `الكمية غير كافية للصنف ${it.name} — الرصيد سيصبح ${cur}` };
      }
    }
    setDb((old) => {
      const items = old.items.map((it: AnyR) => {
        const line = d.lines.find((l) => l.item === it.id);
        if (!line) return it;
        const delta = d.type === "صرف" ? -line.qty : d.type === "توريد" || d.type === "قيد افتتاحي" ? line.qty : line.qty;
        const qty = { ...(it.qty as Record<string, number>) };
        if (d.type === "تحويل") { qty[d.warehouse] = (qty[d.warehouse] || 0) - line.qty; qty[d.toWarehouse!] = (qty[d.toWarehouse!] || 0) + line.qty; }
        else qty[d.warehouse] = (qty[d.warehouse] || 0) + delta;
        return { ...it, qty };
      });
      return { ...old, items, invDocs: [...old.invDocs, d as any] };
    });
    toast(`رُحّل السند ${d.ref} وأُثّرت الكميات فوراً`);
    pushNotif({ kind: "info", title: `سند ${d.type} جديد`, body: `${d.ref} — ${d.lines.length} صنف في ${d.warehouse}` });
    return { ok: true, msg: `رُحّل السند ${d.ref}` };
  };

  const voidInvDoc = (id: string) => {
    const doc: any = db.invDocs.find((d: any) => d.id === id);
    if (!doc || doc.status === "ملغي") return;
    setDb((old) => {
      const items = old.items.map((it: AnyR) => {
        const line = doc.lines.find((l: any) => l.item === it.id);
        if (!line) return it;
        const qty = { ...(it.qty as Record<string, number>) };
        if (doc.type === "تحويل") { qty[doc.warehouse] = (qty[doc.warehouse] || 0) + line.qty; qty[doc.toWarehouse] = (qty[doc.toWarehouse] || 0) - line.qty; }
        else {
          const delta = doc.type === "صرف" ? -line.qty : line.qty;
          qty[doc.warehouse] = (qty[doc.warehouse] || 0) - delta;
        }
        return { ...it, qty };
      });
      const invDocs = old.invDocs.map((d: any) => (d.id === id ? { ...d, status: "ملغي" } : d));
      return { ...old, items, invDocs };
    });
    toast(`تم التراجع عن السند ${doc.ref} وعكس أثره على الكميات`, "ok");
  };

  /* ── الفواتير ── */
  const invoiceTotal = (inv: Invoice) =>
    inv.lines.reduce((a, l) => a + l.qty * l.price * (1 - l.disc / 100), 0) * (1 + inv.vat / 100) * inv.rate;

  const partnerOf = (kind: string, code: string) => (kind === "purchases" ? db.suppliers : db.customers).find((p) => p.id === code);

  const addInvoice = (kind: "sales" | "purchases" | "returns", inv: Invoice) => {
    if (periodLocked(inv.date)) return { ok: false, msg: `الفترة ${inv.date.slice(0, 7)} مقفلة مالياً — رُفض الترحيل` };
    const total = invoiceTotal(inv);
    const coll: CollKey = kind;
    if (kind === "sales" && inv.payType === "آجل" && settings.blockOverCredit) {
      const c = partnerOf(kind, inv.partner) as any;
      if (c?.creditLimit && c.balance + total > c.creditLimit)
        return { ok: false, msg: `تجاوز الحد الائتماني للعميل ${c.name} (${Math.round(c.balance + total)} / ${c.creditLimit}) — رُفض الترحيل` };
    }
    setDb((old) => {
      const items = (kind === "purchases" || kind === "returns")
        ? old.items.map((it: AnyR) => {
            const l = inv.lines.find((x) => x.item === it.id);
            if (!l) return it;
            const qty = { ...(it.qty as Record<string, number>) };
            const wh = "WH-01";
            qty[wh] = (qty[wh] || 0) + (kind === "purchases" ? l.qty : l.qty);
            return { ...it, qty };
          })
        : old.items.map((it: AnyR) => {
            const l = inv.lines.find((x) => x.item === it.id);
            if (!l) return it;
            const qty = { ...(it.qty as Record<string, number>) };
            const wh = "WH-01";
            qty[wh] = (qty[wh] || 0) - l.qty;
            return { ...it, qty };
          });
      const partners = kind === "purchases" ? "suppliers" : "customers";
      const pList = old[partners as CollKey].map((p: AnyR) =>
        p.id === inv.partner && inv.payType === "آجل" ? { ...p, balance: p.balance + total } : p
      );
      return { ...old, items, [coll]: [...old[coll], inv as any], [partners]: pList };
    });
    toast(`رُحّلت الفاتورة ${inv.no} (${inv.payType}) ووُلّد أثرها المحاسبي والمخزني`);
    pushNotif({ kind: "info", title: `فاتورة ${kind === "sales" ? "مبيعات" : kind === "purchases" ? "مشتريات" : "مرتجع"}`, body: `${inv.no} — ${Math.round(total).toLocaleString("en-US")} ر.ي (${inv.payType})` });
    return { ok: true, msg: `رُحّلت الفاتورة ${inv.no}` };
  };

  const voidInvoice = (kind: "sales" | "purchases" | "returns", id: string) => {
    const inv: any = db[kind].find((i: any) => i.id === id);
    if (!inv || inv.status === "ملغاة") return;
    const total = invoiceTotal(inv);
    setDb((old) => {
      const list = old[kind].map((i: any) => (i.id === id ? { ...i, status: "ملغاة" } : i));
      const partners = kind === "purchases" ? "suppliers" : "customers";
      const pList = old[partners as CollKey].map((p: AnyR) =>
        p.id === inv.partner && inv.payType === "آجل" ? { ...p, balance: Math.max(0, p.balance - total) } : p
      );
      return { ...old, [kind]: list, [partners]: pList };
    });
    toast(`أُلغيت الفاتورة ${inv.no} وعُدّلت أرصدة الذمم تلقائياً`, "ok");
  };

  const payInvoice = (kind: "sales" | "purchases", id: string, amount: number) => {
    const inv: any = db[kind].find((i: any) => i.id === id);
    if (!inv) return { ok: false, msg: "الفاتورة غير موجودة" };
    const total = invoiceTotal(inv);
    const remaining = total - (inv.paid || 0);
    if (amount <= 0 || amount > remaining + 0.01) return { ok: false, msg: `المبلغ غير صالح — المتبقي ${Math.round(remaining).toLocaleString("en-US")} ر.ي` };
    setDb((old) => {
      const list = old[kind].map((i: any) => (i.id === id ? { ...i, paid: (i.paid || 0) + amount } : i));
      const partners = kind === "purchases" ? "suppliers" : "customers";
      const pList = old[partners as CollKey].map((p: AnyR) => (p.id === inv.partner ? { ...p, balance: Math.max(0, p.balance - amount) } : p));
      const no = nextNo(kind === "purchases" ? settings.prefixes.PV : settings.prefixes.RC);
      const j: Journal = {
        id: no, no, date: "2026-03-29", user: session?.user || "—", status: "مرحّل",
        desc: kind === "purchases" ? `سند صرف — سداد دفعة للفاتورة ${inv.no}` : `سند قبض — تحصيل دفعة من الفاتورة ${inv.no}`,
        kind: kind === "purchases" ? "صرف" : "قبض",
        source: kind === "purchases" ? "سند صرف" : "سند قبض",
        lines: kind === "purchases"
          ? [{ account: settings.suspense.suppliers, debit: amount, credit: 0, currency: "YER", rate: 1 }, { account: settings.suspense.bank, debit: 0, credit: amount, currency: "YER", rate: 1 }]
          : [{ account: settings.suspense.cash, debit: amount, credit: 0, currency: "YER", rate: 1 }, { account: settings.suspense.customers, debit: 0, credit: amount, currency: "YER", rate: 1 }],
      };
      return { ...old, [kind]: list, [partners]: pList, journals: [...old.journals, j as any] };
    });
    toast(`سُجّلت الدفعة ${Math.round(amount).toLocaleString("en-US")} ر.ي ووُلّد سند ${kind === "purchases" ? "صرف" : "قبض"} محاسبي تلقائياً`);
    return { ok: true, msg: "تم التسجيل" };
  };

  /* ── القيود ── */
  const addJournal = (j: Journal) => {
    if (periodLocked(j.date)) return { ok: false, msg: `الفترة ${j.date.slice(0, 7)} مقفلة — حماية الكتابة مفعّلة` };
    const dr = j.lines.reduce((a, l) => a + l.debit, 0), cr = j.lines.reduce((a, l) => a + l.credit, 0);
    if (Math.abs(dr - cr) > 0.01) return { ok: false, msg: "القيد مرفوض: المدين ≠ الدائن (مبدأ القيد المزدوج)" };
    setDb((old) => ({ ...old, journals: [...old.journals, j as any] }));
    toast(`رُحّل القيد ${j.no} — متوازن (${Math.round(dr).toLocaleString("en-US")})`);
    return { ok: true, msg: `رُحّل القيد ${j.no}` };
  };
  const voidJournal = (id: string) => {
    setDb((old) => ({ ...old, journals: old.journals.map((j: any) => (j.id === id ? { ...j, status: "ملغي" } : j)) }));
    toast("أُلغي القيد وأُبعد عن الأرصدة والتقارير", "ok");
  };
  const approveJournal = (id: string) => {
    setDb((old) => ({ ...old, journals: old.journals.map((j: any) => (j.id === id ? { ...j, status: "مرحّل" } : j)) }));
    toast("اعتُمد الطلب ورُحّل القيد إلى دفتر الأستاذ");
  };
  const lockPeriod = (id: string) => {
    setDb((old) => ({ ...old, periods: old.periods.map((p: any) => (p.id === id ? { ...p, locked: true, closedAt: "2026-03-29" } : p)) }));
    toast(`أُقفلت الفترة ${id} — أصبحت محصّنة ضد أي ترحيل أو تعديل`, "ok");
    pushNotif({ kind: "warn", title: "إقفال فترة مالية", body: `الفترة ${id} مقفلة الآن بموجب صلاحيات الإقفال.` });
  };
  const setQuoteStatus = (id: string, status: string) => {
    setDb((old) => ({ ...old, quotes: old.quotes.map((q: AnyR) => (q.id === id ? { ...q, status } : q)) }));
    toast(`حُدّثت حالة العرض إلى «${status}»`);
  };
  const setRequestStatus = (id: string, status: string) => {
    setDb((old) => ({ ...old, requests: old.requests.map((r: AnyR) => (r.id === id ? { ...r, status } : r)) }));
    toast(`حُدّث طلب الشراء إلى «${status}»`);
  };

  /* ── الصلاحيات ── */
  const can = (module: string, action: string) => {
    const role = session?.role || "مدير النظام";
    return (perms[role]?.[module] || []).includes(action);
  };
  const togglePerm = (role: string, module: string, action: string) =>
    setPerms((old) => {
      const cur = old[role]?.[module] || [];
      const next = cur.includes(action) ? cur.filter((a) => a !== action) : [...cur, action];
      return { ...old, [role]: { ...(old[role] || {}), [module]: next } };
    });

  /* ── التنسيقات ── */
  const fmtN = (n: number) => {
    const r = Number(n.toFixed(settings.round));
    if (prefs.nums === "plain") return String(r);
    return r.toLocaleString(prefs.nums === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: settings.round });
  };
  const fmtMoney = (n: number) => `${fmtN(n)} ر.ي`;
  const fmtDate = (iso: string) => {
    if (!iso) return "—";
    if (prefs.dates === "iso") return iso;
    const [y, m, d] = iso.split("-");
    if (prefs.dates === "dmy") return `${d}/${m}/${y}`;
    const names = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${Number(d)} ${names[Number(m) - 1]} ${y}`;
  };

  const exportCsv = (name: string, rows: (string | number)[][]) => {
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast(`صُدّر التقرير «${name}» بصيغة Excel (CSV)`, "ok");
  };

  return (
    <Ctx.Provider value={{
      db, trash, seq, settings, setSettings, prefs, setPrefs, session, route, toasts, notifs,
      toast, pushNotif, markNotifs, nav, login, logout, nextNo,
      save, remove, restore, purge, emptyTrash, importRows,
      addInvDoc, voidInvDoc, addInvoice, voidInvoice, payInvoice,
      addJournal, voidJournal, approveJournal, lockPeriod, setQuoteStatus, setRequestStatus,
      fmtN, fmtMoney, fmtDate, invoiceTotal, itemQty, exportCsv, can, togglePerm, perms,
      accounts, addAccount, nextAccountCode: (p: string) => nextAccountCode(accounts, p),
      sidebarBgs: SIDEBAR_BGS, SYSTEM,
    }}>
      {children}
    </Ctx.Provider>
  );
}
