import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ACCOUNTS, ANALYTICALS, COST_CENTERS, CURRENCIES, CUSTOMERS, INV_DOCS, ITEMS, JOURNALS,
  PERIODS, PERM_ACTIONS, PERM_MODULES, PURCHASES, QUOTES, RETURNS, ROLES, SALES, SUPPLIERS,
  UNITS, GROUPS, USERS, WAREHOUSES, CHANGELOG, SIDEBAR_BGS,
  type Invoice, type InvDoc, type Journal, type Quote, type User,
} from "./data";

/* ── الإعدادات والتفضيلات ── */
export interface Prefs {
  theme: string; fontScale: "sm" | "md" | "lg"; dir: "rtl" | "ltr";
  numFmt: "west" | "arabic" | "plain"; dateFmt: "ymd" | "dmy" | "arlong";
  notif: { period: boolean; credit: boolean; stock: boolean; sounds: boolean };
  sidebarBg: string; loginBg: string;
}
const DEFAULT_PREFS: Prefs = {
  theme: "azure", fontScale: "md", dir: "rtl", numFmt: "west", dateFmt: "dmy",
  notif: { period: true, credit: true, stock: true, sounds: false },
  sidebarBg: "ocean", loginBg: "sea",
};

export interface Session { user: string; role: string; company: string; branch: string; year: string }
export type Route = { module: string; tab: string };
export interface Toast { id: number; kind: "ok" | "err" | "info"; msg: string }
export interface Notif { id: number; kind: "warn" | "info" | "bad"; title: string; body: string; time: string }
export interface Backup { id: string; name: string; size: string; date: string; kind: "كامل" | "تفاضلي" }

interface Store {
  prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void;
  session: Session | null; login: (s: Session) => void; logout: () => void;
  route: Route; nav: (r: Route) => void;
  toasts: Toast[]; toast: (msg: string, kind?: Toast["kind"]) => void;
  notifs: Notif[]; markNotifs: () => void; pushNotif: (n: Omit<Notif, "id" | "time">) => void;
  /* البيانات */
  accounts: typeof ACCOUNTS; analyticals: typeof ANALYTICALS; items: typeof ITEMS;
  invDocs: InvDoc[]; journals: Journal[]; sales: Invoice[]; purchases: Invoice[];
  returns: Invoice[]; quotes: Quote[]; customers: typeof CUSTOMERS; suppliers: typeof SUPPLIERS;
  warehouses: typeof WAREHOUSES; units: string[]; groups: string[]; costCenters: typeof COST_CENTERS;
  currencies: typeof CURRENCIES; periods: typeof PERIODS; users: User[]; roles: string[];
  permModules: string[]; permActions: string[]; changelog: typeof CHANGELOG; sidebarBgs: typeof SIDEBAR_BGS;
  /* إجراءات */
  addJournal: (j: Journal) => { ok: boolean; msg: string };
  voidJournal: (id: string) => void; approveJournal: (id: string) => void;
  addInvoice: (kind: "sales" | "purchases" | "returns", inv: Invoice) => { ok: boolean; msg: string };
  voidInvoice: (kind: "sales" | "purchases" | "returns", id: string) => void;
  addInvDoc: (d: InvDoc) => void; voidInvDoc: (id: string) => void;
  lockPeriod: (id: string) => void;
  addUser: (u: User) => void; toggleUser: (id: string) => void;
  perms: Record<string, boolean>; togglePerm: (key: string) => void;
  backups: Backup[]; addBackup: (b: Backup) => void;
  addItem: (i: (typeof ITEMS)[number]) => void; addAnalytical: (a: (typeof ANALYTICALS)[number]) => void;
  invoiceTotal: (inv: Invoice) => number;
  fmtN: (n: number) => string; fmtMoney: (n: number, cur?: string) => string; fmtDate: (d: string) => string;
  exportCsv: (name: string, rows: (string | number)[][]) => void;
  itemQty: (code: string) => number;
}

const Ctx = createContext<Store | null>(null);
export const useApp = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("useApp خارج المزود");
  return s;
};

let tid = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(() => {
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem("okyanus.prefs") || "{}") }; }
    catch { return DEFAULT_PREFS; }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [route, setRoute] = useState<Route>({ module: "dashboard", tab: "" });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([
    { id: 1, kind: "warn", title: "فترة فبراير مغلقة", body: "أُقفلت فترة فبراير 2026 — لا يمكن الترحيل إليها.", time: "منذ ساعتين" },
    { id: 2, kind: "bad", title: "تجاوز حد ائتماني", body: "العميل «صيدلية ابن سينا» تجاوز حد الائتمان بمقدار 10,500.", time: "منذ 5 ساعات" },
    { id: 3, kind: "info", title: "نسخة احتياطية مكتملة", body: "اكتمل النسخ الاحتياطي الكامل (2.4 GB) بنجاح.", time: "أمس 23:00" },
  ]);

  const [journals, setJournals] = useState(JOURNALS);
  const [analyticals, setAnalyticals] = useState(ANALYTICALS);
  const [invDocs, setInvDocs] = useState<InvDoc[]>(INV_DOCS);
  const [sales, setSales] = useState(SALES);
  const [purchases, setPurchases] = useState(PURCHASES);
  const [returns, setReturns] = useState(RETURNS);
  const [items, setItems] = useState(ITEMS);
  const [users, setUsers] = useState(USERS);
  const [periods, setPeriods] = useState(PERIODS);
  const [backups, setBackups] = useState<Backup[]>([
    { id: "BK-01", name: "OkyanusERP_Full_2026-03-28.sql.gz", size: "2.4 GB", date: "2026-03-28 23:00", kind: "كامل" },
    { id: "BK-02", name: "OkyanusERP_Diff_2026-03-29.sql.gz", size: "186 MB", date: "2026-03-29 06:00", kind: "تفاضلي" },
  ]);
  const [perms, setPerms] = useState<Record<string, boolean>>(() => {
    const p: Record<string, boolean> = {};
    PERM_MODULES.forEach((m) => PERM_ACTIONS.forEach((a) => { p[`${m}|${a}`] = m === "لوحة التحكم" || a === "عرض"; }));
    p["المخازن|إنشاء"] = true; p["المبيعات|إنشاء"] = true; p["الحسابات العامة|تصدير تقارير"] = true;
    return p;
  });

  /* تطبيق التفضيلات على العنصر الجذر */
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-theme", prefs.theme);
    el.setAttribute("data-fontscale", prefs.fontScale);
    el.setAttribute("dir", prefs.dir);
    el.setAttribute("lang", prefs.dir === "rtl" ? "ar" : "en");
    localStorage.setItem("okyanus.prefs", JSON.stringify(prefs));
  }, [prefs]);

  const setPrefs = (p: Partial<Prefs>) => setPrefsState((old) => ({ ...old, ...p }));
  const toast = (msg: string, kind: Toast["kind"] = "ok") => {
    const id = ++tid;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };
  const pushNotif = (n: Omit<Notif, "id" | "time">) =>
    setNotifs((old) => [{ ...n, id: Date.now(), time: "الآن" }, ...old]);

  /* ── تنسيقات ── */
  const fmtN = (n: number) => {
    const abs = Math.abs(n);
    let s: string;
    if (prefs.numFmt === "arabic") s = abs.toLocaleString("ar-EG", { maximumFractionDigits: 2 });
    else if (prefs.numFmt === "plain") s = abs.toFixed(2).replace(/\.00$/, "");
    else s = abs.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return (n < 0 ? "-" : "") + s;
  };
  const fmtMoney = (n: number, cur = "YER") => {
    const c = CURRENCIES.find((x) => x.code === cur);
    return `${fmtN(n)} ${c ? c.symbol : cur}`;
  };
  const fmtDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    if (prefs.dateFmt === "ymd") return d;
    if (prefs.dateFmt === "arlong") return dt.toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const exportCsv = (name: string, rows: (string | number)[][]) => {
    const bom = "\uFEFF";
    const csv = bom + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast(`تم تجهيز ملف «${name}» للتصدير (Excel/CSV)`, "ok");
  };

  const itemQty = (code: string) => {
    const it = items.find((x) => x.code === code);
    return it ? Object.values(it.qty).reduce((a, b) => a + b, 0) : 0;
  };
  const invoiceTotal = (inv: Invoice) => {
    const sub = inv.lines.reduce((a, l) => a + l.qty * l.price * (1 - l.disc / 100), 0);
    return sub * (1 + inv.vat / 100) * inv.rate;
  };

  const monthOf = (d: string) => d.slice(0, 7);
  const periodLocked = (date: string) => periods.find((p) => p.id === monthOf(date))?.locked ?? false;

  /* ── إجراءات محاسبية ── */
  const addJournal = (j: Journal) => {
    const dr = j.lines.reduce((a, l) => a + l.debit, 0);
    const cr = j.lines.reduce((a, l) => a + l.credit, 0);
    if (Math.abs(dr - cr) > 0.01) return { ok: false, msg: `القيد غير متوازن! مدين ${fmtN(dr)} ≠ دائن ${fmtN(cr)}` };
    if (periodLocked(j.date)) { pushNotif({ kind: "bad", title: "محاولة ترحيل لفترة مغلقة", body: `القيد ${j.no} يستهدف الفترة ${monthOf(j.date)} المغلقة.` }); return { ok: false, msg: `الفترة ${monthOf(j.date)} مقفلة — لا يمكن الترحيل إليها (مبدأ الاستمرارية).` }; }
    setJournals((old) => [j, ...old]);
    return { ok: true, msg: `تم ترحيل القيد ${j.no} بنجاح (مدين = دائن = ${fmtN(dr)})` };
  };
  const voidJournal = (id: string) => {
    setJournals((old) => old.map((j) => (j.id === id ? { ...j, status: "ملغي" as const } : j)));
    pushNotif({ kind: "warn", title: "إلغاء قيد يومية", body: `أُلغي القيد ${id} وسُجّل في دفتر التدقيق.` });
    toast("تم إلغاء القيد وتسجيل العملية في دفتر التدقيق", "info");
  };
  const approveJournal = (id: string) => {
    setJournals((old) => old.map((j) => (j.id === id ? { ...j, status: "مرحّل" as const, kind: "يومية" as const } : j)));
    toast("تمت الموافقة على الطلب وترحيل القيد", "ok");
  };

  const applyStock = (inv: Invoice, sign: number) => {
    setItems((old) => old.map((it) => {
      const line = inv.lines.find((l) => l.item === it.code);
      if (!line) return it;
      const wh = "WH-01";
      return { ...it, qty: { ...it.qty, [wh]: (it.qty[wh] || 0) + sign * line.qty } };
    }));
  };

  const addInvoice = (kind: "sales" | "purchases" | "returns", inv: Invoice) => {
    if (periodLocked(inv.date)) return { ok: false, msg: `الفترة ${monthOf(inv.date)} مقفلة — اختر تاريخاً ضمن فترة مفتوحة.` };
    const set = kind === "sales" ? setSales : kind === "purchases" ? setPurchases : setReturns;
    set((old) => [inv, ...old]);
    if (kind === "sales") applyStock(inv, -1);
    if (kind === "purchases") applyStock(inv, +1);
    if (kind === "returns") applyStock(inv, +1);
    if (inv.payType === "آجل") {
      const list = kind === "purchases" ? SUPPLIERS : CUSTOMERS;
      const p = list.find((x) => x.code === inv.partner);
      const total = invoiceTotal(inv);
      if (p) pushNotif({ kind: "info", title: kind === "purchases" ? "استحقاق جديد لمورد" : "ذمم مدينة جديدة", body: `${p.name}: ${fmtMoney(total)} — ${inv.no}` });
    }
    return { ok: true, msg: `تم ترحيل الفاتورة ${inv.no} (${inv.payType})` };
  };
  const voidInvoice = (kind: "sales" | "purchases" | "returns", id: string) => {
    const set = kind === "sales" ? setSales : kind === "purchases" ? setPurchases : setReturns;
    set((old) => old.map((i) => (i.id === id ? { ...i, status: "ملغاة" as const } : i)));
    toast("تم إلغاء الفاتورة وعكس أثرها المخزني", "info");
  };

  const addInvDoc = (d: InvDoc) => {
    setInvDocs((old) => [d, ...old]);
    setItems((old) => old.map((it) => {
      const line = d.lines.find((l) => l.item === it.code);
      if (!line) return it;
      const q = { ...it.qty };
      q[d.warehouse] = (q[d.warehouse] || 0) + line.qty;
      if (d.type === "تحويل" && d.toWarehouse) q[d.toWarehouse] = (q[d.toWarehouse] || 0) + line.qty;
      return { ...it, qty: q };
    }));
    toast(`تم ترحيل سند ${d.type} رقم ${d.id}`, "ok");
  };
  const voidInvDoc = (id: string) => {
    const d = invDocs.find((x) => x.id === id);
    if (!d) return;
    setItems((old) => old.map((it) => {
      const line = d.lines.find((l) => l.item === it.code);
      if (!line) return it;
      const q = { ...it.qty };
      q[d.warehouse] = (q[d.warehouse] || 0) - line.qty;
      if (d.type === "تحويل" && d.toWarehouse) q[d.toWarehouse] = (q[d.toWarehouse] || 0) - line.qty;
      return { ...it, qty: q };
    }));
    setInvDocs((old) => old.map((x) => (x.id === id ? { ...x, status: "ملغي" as const } : x)));
    toast(`تم التراجع عن السند ${id} وعكس الكميات تلقائياً`, "info");
  };

  const lockPeriod = (id: string) => {
    setPeriods((old) => old.map((p) => (p.id === id ? { ...p, locked: true, closedAt: new Date().toISOString().slice(0, 10) } : p)));
    pushNotif({ kind: "warn", title: "إقفال فترة مالية", body: `أُغلقت الفترة ${id} — حُصّنت جميع القيود من التعديل.` });
    toast(`تم إقفال الفترة ${id} بنجاح — الكتابة عليها محظورة الآن`, "ok");
  };

  const store = useMemo<Store>(() => ({
    prefs, setPrefs, session, login: setSession, logout: () => { setSession(null); setRoute({ module: "dashboard", tab: "" }); },
    route, nav: setRoute, toasts, toast, notifs, markNotifs: () => setNotifs([]), pushNotif,
    accounts: ACCOUNTS, analyticals, items, invDocs, journals, sales, purchases, returns,
    quotes: QUOTES, customers: CUSTOMERS, suppliers: SUPPLIERS, warehouses: WAREHOUSES, units: UNITS,
    groups: GROUPS, costCenters: COST_CENTERS, currencies: CURRENCIES, periods, users, roles: ROLES,
    permModules: PERM_MODULES, permActions: PERM_ACTIONS, changelog: CHANGELOG, sidebarBgs: SIDEBAR_BGS,
    addJournal, voidJournal, approveJournal, addInvoice, voidInvoice, addInvDoc, voidInvDoc, lockPeriod,
    addUser: (u: User) => { setUsers((old) => [...old, u]); toast(`أُضيف المستخدم «${u.name}» ومنحه دور ${u.role}`); },
    toggleUser: (id) => setUsers((old) => old.map((u) => (u.id === id ? { ...u, active: !u.active } : u))),
    perms, togglePerm: (key) => setPerms((old) => ({ ...old, [key]: !old[key] })),
    backups, addBackup: (b) => setBackups((old) => [b, ...old]),
    addItem: (i) => { setItems((old) => [...old, i]); toast(`أُضيف الصنف «${i.name}» إلى الدليل`); },
    addAnalytical: (a) => { setAnalyticals((old) => [...old, a]); toast(`رُبط الحساب التحليلي «${a.name}» بالحساب ${a.linkedAccount}`); pushNotif({ kind: "info", title: "حساب تحليلي جديد", body: `${a.name} — ذمم مدينة تُتابَع دون تضخيم الدليل.` }); },
    invoiceTotal, fmtN, fmtMoney, fmtDate, exportCsv, itemQty,
  }), [prefs, session, route, toasts, notifs, journals, analyticals, invDocs, sales, purchases, returns, items, users, periods, backups, perms]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
