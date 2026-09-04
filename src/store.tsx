import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import {
  ACCOUNTS, ANALYTICALS, UNITS, GROUPS, WAREHOUSES, ITEMS, SUPPLIERS, CUSTOMERS, CASHBOXES,
  COST_CENTERS, BRANCHES, DEPARTMENTS, USERS, CURRENCIES, PERIODS, INV_DOCS, PURCHASES, SALES,
  RETURNS, QUOTES, REQUESTS, JOURNALS, PERM_MODULES, PERM_ACTIONS, SIDEBAR_BGS, IMPORT_SAMPLES,
  SYSTEM, BANKS, PAYTERMS, PARTNER_CATS, ROLES_DIR, DEVICES, ACTIVITY_SEED,
  MODULE_SCREENS, REPORTS, REPORT_ACTIONS, BUTTON_ACTIONS,
  ACTIVITIES, HR_EMPLOYEES, HR_ATTENDANCE, HR_REWARDS, HR_WARNINGS, HR_LEAVES, ASSETS, OWNER_PIN,
  type AnyR, type InvDoc, type Invoice, type Journal, type Account,
  type Activity, type Device, type Tombstone, type ActivityDef,
} from "./data";
export type { AnyR, Activity, Device, Tombstone } from "./data";
import { engine } from "./sync";
export { engine };

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
  dbCfg: { host: string; port: number; user: string; pass: string; name: string; engine: string; charset: string; tz: string; ssl: boolean; pool: number; queue: number; timeout: number };
  deviceName: string;
  api: { baseUrl: string; wsPath: string; jwtExp: string; refresh: boolean; cors: string; rateLimit: number };
  front: { syncSec: number; sessionMin: number; offline: boolean; density: "مريحة" | "مضغوطة"; sound: boolean; autoSave: boolean };
  backup: { fullDaily: boolean; diffHours: number; gzip: boolean; encrypt: boolean; retainDays: number; path: string; autoLocal: boolean };
  quick: { visible: boolean; items: QuickItem[] };
}
export interface QuickItem { id: string; module: string; path: string; label: string; icon: string }

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
  /* مصفوفة الصلاحيات الرباعية: نظام / شاشات / تقارير / أزرار */
  matrix: Record<string, PermRole>;
  setModulePerm: (role: string, mod: string, on: boolean) => void;
  setScreenPerm: (role: string, key: string, on: boolean) => void;
  setAllScreens: (role: string, mod: string, on: boolean) => void;
  setReportAction: (role: string, rep: string, act: string, on: boolean) => void;
  setButtonPerm: (role: string, mod: string, act: string, on: boolean) => void;
  setAllButtons: (role: string, mod: string, on: boolean) => void;
  grantAll: (role: string) => void;
  revokeAll: (role: string) => void;
  permCounts: (role: string) => { modules: number; screens: number; reports: number; buttons: number; total: number };
  /* النسخ الاحتياطي الحقيقي */
  downloadSnapshot: (label: string) => void;
  restoreSnapshot: (file: File) => void;
  accounts: Account[];
  addAccount: (a: Account) => boolean;
  nextAccountCode: (parentCode: string) => string;
  /* المزامنة المركزية اللحظية */
  activity: Activity[]; devices: Device[]; tombstones: Tombstone[];
  gen: number; deviceId: string;
  mergeSync: (coll: CollKey, incoming: AnyR[]) => void;
  sync: typeof engine; reinitCentral: () => void;
  /* الأنظمة المتخصصة والأنشطة */
  activities: ActivityDef[];
  activeSystems: string[]; primaryActivity: string;
  toggleSystem: (id: string) => void; setPrimaryActivity: (id: string) => void;
  ownerUnlocked: boolean; unlockOwner: (pin: string) => boolean; lockOwner: () => void;
  specData: Record<string, AnyR[]>;
  saveSpec: (key: string, row: AnyR) => void; removeSpec: (key: string, id: string, label?: string) => void;
  postSpecToGL: (key: string, row: AnyR, amount: number, label: string) => { ok: boolean; msg: string };
  posSale: (lines: { item: string; qty: number; price: number }[], mode: "cash" | "card") => { ok: boolean; msg: string };
  /* الموارد البشرية */
  hr: { employees: AnyR[]; attendance: AnyR[]; rewards: AnyR[]; warnings: AnyR[]; leaves: AnyR[]; payroll: AnyR[] };
  setHr: (patch: Partial<AppCtx["hr"]>) => void;
  runPayroll: () => { ok: boolean; msg: string };
  /* الأصول الثابتة */
  assets: AnyR[]; setAssets: (a: AnyR[]) => void;
  depreciationOf: (a: AnyR) => number;
  postDepreciation: () => { ok: boolean; msg: string };
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

/* ═══════ مصفوفة الصلاحيات الرباعية (نظام / شاشات / تقارير / أزرار) ═══════ */
export interface PermRole {
  modules: Record<string, boolean>;            /* مستوى النظام: دخول الوحدات كاملة */
  screens: Record<string, boolean>;            /* مستوى الشاشة: مفتاح «الوحدة:الشاشة» */
  reports: Record<string, string[]>;           /* مستوى التقارير: إجراءات لكل تقرير */
  buttons: Record<string, string[]>;           /* مستوى الأزرار: إجراءات لكل وحدة */
}
const mkPerm = (mods: Record<string, boolean>, btns: Record<string, string[]>, repMods: string[]): PermRole => ({
  modules: mods,
  screens: Object.fromEntries(Object.entries(MODULE_SCREENS).flatMap(([mid, m]) => m.screens.map((s) => [`${mid}:${s.id}`, !!mods[mid]]))),
  reports: Object.fromEntries(REPORTS.map((r) => [r.id, repMods.includes(r.module) ? [...REPORT_ACTIONS] : mods[r.module] ? ["عرض"] : []])),
  buttons: btns,
});
const ALL_MODS = Object.fromEntries(Object.keys(MODULE_SCREENS).map((m) => [m, true]));
const ALL_BTNS = Object.fromEntries(Object.keys(MODULE_SCREENS).map((m) => [m, [...BUTTON_ACTIONS]]));
const ALL_REPS = Object.keys(MODULE_SCREENS);
const DEF_MATRIX: Record<string, PermRole> = {
  "مدير النظام": mkPerm(ALL_MODS, ALL_BTNS, ALL_REPS),
  "محاسب رئيسي": mkPerm({ ...ALL_MODS, adm: true }, { ...ALL_BTNS, adm: ["تصدير"] }, ALL_REPS),
  "أمين مخزن": mkPerm({ dash: true, inv: true, pos: true, pur: true, sal: true },
    { inv: ["إضافة", "تعديل", "ترحيل", "إلغاء/تراجع", "طباعة", "تصدير", "استيراد"], pos: ["ترحيل", "طباعة"] },
    ["inv", "pos"]),
  "مسؤولة مشتريات": mkPerm({ dash: true, inv: true, pur: true, gl: true },
    { pur: [...BUTTON_ACTIONS], inv: ["إضافة", "ترحيل"], gl: ["إضافة"] }, ["pur"]),
  "مسؤول مبيعات": mkPerm({ dash: true, sal: true, pos: true, inv: true },
    { sal: [...BUTTON_ACTIONS], pos: ["ترحيل", "طباعة"] }, ["sal"]),
  "مدقق خارجي": mkPerm(ALL_MODS, {}, ALL_REPS),
};

/* القيم الافتراضية للإعدادات — تُدمج مع أي إعدادات محفوظة مركزياً */
const DEFAULT_SETTINGS: Settings = {
  vat: 5, discMax: 15, round: 2, autoNum: true, blockOverCredit: true, negStock: false,
  lowStockAlert: true, requireCC: true, fiscalStart: "2026-01-01",
  prefixes: { SIN: "SIN", PIN: "PIN", SRT: "SRT", GRN: "GRN", ISS: "ISS", TR: "TR", ADJ: "ADJ", JC: "JC", JE: "JE", RC: "RC", PV: "PV", PR: "PR", QT: "QT" },
  suspense: { salesCash: "41111", salesCredit: "41112", purchases: "11311", vatOut: "21211", vatIn: "21212", customers: "11211", suppliers: "21111", cogs: "31511", cash: "11111", bank: "11121" },
  dbCfg: { host: "localhost", port: 3306, user: "erp_admin", pass: "", name: "okyanus_ifs", engine: "InnoDB", charset: "utf8mb4", tz: "Asia/Aden", ssl: false, pool: 40, queue: 200, timeout: 30 },
  deviceName: "جهاز الإدارة الرئيسي",
  api: { baseUrl: "http://localhost:4000", wsPath: "/ws", jwtExp: "8h", refresh: true, cors: "*", rateLimit: 240 },
  front: { syncSec: 4.5, sessionMin: 30, offline: true, density: "مريحة", sound: true, autoSave: true },
  backup: { fullDaily: true, diffHours: 6, gzip: true, encrypt: true, retainDays: 30, path: "/var/backups/okyanus-ifs/", autoLocal: true },
  quick: {
    visible: true,
    items: [
      { id: "inv:base.items", module: "inv", path: "base.items", label: "دليل الأصناف", icon: "box" },
      { id: "inv:mv.grn", module: "inv", path: "mv.grn", label: "سند توريد مخزني", icon: "down" },
      { id: "sal:mv.inv", module: "sal", path: "mv.inv", label: "فواتير المبيعات", icon: "tag" },
      { id: "pur:mv.inv", module: "pur", path: "mv.inv", label: "فواتير المشتريات", icon: "truck" },
      { id: "gl:rep.trial", module: "gl", path: "rep.trial", label: "ميزان المراجعة", icon: "scale" },
      { id: "pos:", module: "pos", path: "", label: "نقاط البيع", icon: "coins" },
    ],
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  /* القاعدة تُحمَّل من التخزين المركزي المشترك (تبقى بعد التحديث وتُشارك بين النوافذ) */
  const [db, setDb] = useState(() => {
    const d = engine.loadDb(initDb);
    /* استكمال ربط المجموعات بالحسابات للنسخ المحفوظة قبل هذه الميزة — دون مسح أي تعديل */
    d.groups = (d.groups as AnyR[]).map((g: AnyR) => {
      const s = GROUPS.find((x) => x.id === g.id);
      if (!s) return g;
      return { ...g, stockAccount: g.stockAccount || s.stockAccount, cogsAccount: g.cogsAccount || s.cogsAccount, salesAccount: g.salesAccount || s.salesAccount };
    });
    return d;
  });
  const [accounts, setAccounts] = useState<Account[]>(ACCOUNTS);
  const [trash, setTrash] = useState<{ coll: CollKey; row: AnyR; at: string }[]>([]);
  const [seq, setSeq] = useState<Record<string, number>>({ SIN: 260, PIN: 120, SRT: 18, GRN: 8, ISS: 22, TR: 4, ADJ: 4, JC: 2, JE: 1010, RC: 107, PV: 107, PR: 36, QT: 48, OB: 2, FYE: 2, REQ: 5 });
  const [settings, setSettingsState] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...engine.loadJson("@settings", {} as Partial<Settings>) }));
  const setSettings = (s: Settings) => { setSettingsState(s); engine.publishState("@settings", s); }; /* حفظ مركزي + بث لحظي */
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
  const [matrix, setMatrix] = useState<Record<string, PermRole>>(DEF_MATRIX);

  /* ═══════ الأنظمة المتخصصة والأنشطة — لا يُفعَّل أي نظام افتراضياً، يفعّلها مالك النظام ═══════ */
  const [activeSystems, setActiveSystems] = useState<string[]>([]);
  const [primaryActivity, setPrimaryActivityState] = useState("");
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);
  const [specData, setSpecData] = useState<Record<string, AnyR[]>>(() => {
    const init: Record<string, AnyR[]> = {};
    ACTIVITIES.forEach((a) => a.entities.forEach((e) => { init[`${a.id}:${e.id}`] = e.seed; }));
    return init;
  });
  const [hr, setHrState] = useState(() => engine.loadJson("@hr", { employees: HR_EMPLOYEES, attendance: HR_ATTENDANCE, rewards: HR_REWARDS, warnings: HR_WARNINGS, leaves: HR_LEAVES, payroll: [] as AnyR[] }));
  const [assets, setAssetsState] = useState(() => engine.loadJson("@assets", ASSETS));
  const setAssets = (a: AnyR[]) => { setAssetsState(a); engine.publishState("@assets", a); }; /* بث لحظي + حفظ مركزي */

  /* ═══════ محرك المزامنة المركزية اللحظية (Merge Sync) ═══════ */
  const [activity, setActivity] = useState<Activity[]>(() => engine.loadActivity(ACTIVITY_SEED as any) as Activity[]);
  const [devices, setDevices] = useState<Device[]>(() => engine.loadDevices(DEVICES as any) as Device[]);
  const [tombstones, setTombstones] = useState<Tombstone[]>([]);
  const [gen, setGen] = useState(() => Math.max(1, engine.getGen()));
  const [deviceId] = useState(() => engine.deviceId); /* هوية الجهاز الثابتة من المحرك */
  const mutCount = useRef(0);

  /* تسجيل عملية في activity_log المركزي — تظهر فوراً في مراقبة النشاط بكل جهاز */
  const logActivity = (a: Omit<Activity, "id" | "ts">) => {
    const op = { ...a, id: `AC-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, ts: Date.now() } as Activity;
    setActivity((old) => [op, ...old].slice(0, 400));
    engine.appendActivity(op as any); /* بث لحظي + حفظ مركزي */
  };

  /* عملية محلية (المستخدم الحالي على هذا الجهاز) */
  const logLocal = (category: string, action: string, type: Activity["type"]) => {
    if (!session) return;
    logActivity({ user: session.user, role: session.role, device: settings.deviceName, deviceId, category, action, type });
  };

  /* دمج مركزي: الأحدث يفوز على مستوى السجل، ولا يُحذف شيء */
  const mergeSync = (coll: CollKey, incoming: AnyR[]) => {
    setDb((d) => {
      const list = [...d[coll]];
      incoming.forEach((inc) => {
        const i = list.findIndex((r) => r.id === inc.id);
        const incTs = (inc as any).updatedAt || 0;
        if (i < 0) list.push(inc);
        else { const curTs = (list[i] as any).updatedAt || 0; if (incTs >= curTs) list[i] = inc; } /* latest wins */
      });
      return { ...d, [coll]: list };
    });
  };

  /* شاهد حذف (Tombstone) — ينتشر لكل الأجهزة فلا يعود السجل أبداً */
  const addTombstone = (coll: CollKey, recordId: string, label: string) => {
    const by = session?.user || "النظام";
    setTombstones((t) => [{ id: `TB-${Date.now()}`, coll, recordId, label, by, ts: Date.now() }, ...t]);
    engine.publishTombstone(coll, recordId); /* بث فوري + تسجيل مركزي دائم */
    logLocal("النظام", `حذف «${label}» من ${coll} — نُشر شاهد الحذف لكل الأجهزة`, "delete");
  };

  /* خرائط: كل مجموعة بيانات ← فئتها المحاسبية واسمها العربي (للبث اللحظي) */
  const COLL_CAT: Record<string, string> = {
    units: "المخازن", groups: "المخازن", warehouses: "المخازن", items: "الأصول",
    suppliers: "المشتريات", customers: "المبيعات", cashboxes: "المالية", costCenters: "المالية",
    branches: "النظام", departments: "الموارد", users: "النظام", currencies: "المالية", periods: "المالية",
    banks: "المالية", payTerms: "المالية", partnerCats: "المبيعات", roles: "النظام",
    analyticals: "المالية", requests: "المشتريات", quotes: "المبيعات",
    sales: "المبيعات", purchases: "المشتريات", returns: "المبيعات", invDocs: "المخازن", journals: "المالية",
  };
  const COLL_AR: Record<string, string> = {
    units: "الوحدات", groups: "المجموعات", warehouses: "المخازن", items: "الأصناف",
    suppliers: "الموردين", customers: "العملاء", cashboxes: "الصناديق", costCenters: "مراكز التكلفة",
    branches: "الفروع", departments: "الأقسام", users: "المستخدمين", currencies: "العملات", periods: "الفترات",
    banks: "البنوك", payTerms: "شروط الدفع", partnerCats: "التصنيفات", roles: "الأدوار",
    analyticals: "الحسابات التحليلية", requests: "طلبات الشراء", quotes: "عروض الأسعار",
    sales: "فواتير المبيعات", purchases: "فواتير المشتريات", returns: "مرتجعات المبيعات", invDocs: "السندات المخزنية", journals: "القيود اليومية",
  };

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
  const login = (s: Session) => {
    setSession(s); setRoute({ module: "dashboard", path: "" });
    logActivity({ user: s.user, role: s.role, device: settings.deviceName, deviceId, category: "النظام", action: `تسجيل دخول إلى ${s.company} — ${s.branch} (السنة المالية ${s.year})`, type: "login" });
  };
  const logout = () => { if (session) logActivity({ user: session.user, role: session.role, device: settings.deviceName, deviceId, category: "النظام", action: "تسجيل خروج", type: "login" }); setSession(null); };

  const year = session?.year || "2026";
  const nextNo = (prefix: string) => {
    const n = (seq[prefix] || 1) + 1;
    setSeq((s) => ({ ...s, [prefix]: n }));
    return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
  };

  /* ── إدارة السجلات العامة (دمج مركزي + بث لحظي للأجهزة الأخرى) ── */
  const save = (coll: CollKey, row: AnyR) => {
    const stamped: AnyR = { ...row, updatedAt: Date.now() };
    mergeSync(coll, [stamped]);
    engine.publishPatches([{ coll, rows: [stamped] }]); /* يصل للمحاسب/المدير خلال ثوانٍ */
    engine.bumpDeviceOps();
    logLocal(COLL_CAT[coll] || "النظام", `حفظ «${String(stamped.name || stamped.code || stamped.id)}» في ${COLL_AR[coll] || coll} — دُمج في القاعدة المركزية`, "update");
  };

  const remove = (coll: CollKey, id: string, label?: string) => {
    const row = db[coll].find((r) => r.id === id);
    setTrash((t) => [{ coll, row: row || ({ id } as AnyR), at: new Date().toLocaleString("ar-EG") }, ...t]);
    setDb((d) => ({ ...d, [coll]: d[coll].filter((r) => r.id !== id) }));
    addTombstone(coll, id, label || id);
    toast(`نُقل «${label || id}» إلى سلة المحذوفات ونُشر الحذف لكل الأجهزة`, "ok");
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
    if (t) addTombstone(t.coll, t.row.id, String(t.row.name || t.row.code || t.row.id));
    toast(`حُذف «${t?.row?.name || t?.row?.code || "السجل"}» نهائياً من قاعدة البيانات`, "err");
  };
  const emptyTrash = () => {
    setTrash([]);
    const g = gen + 1;
    setGen(g);
    engine.publishGen(dbRef.current, "إفراغ سلة المحذوفات"); /* استبدال شامل: تستبدل كل الأجهزة نسختها تلقائياً */
    logLocal("النظام", `إفراغ سلة المحذوفات — ارتفع الجيل إلى ${g} وستُستبدل النسخ القديمة على كل الأجهزة`, "delete");
    toast("أُفرغت سلة المحذوفات وارتفع جيل المزامنة — اكتملت الصيانة", "info");
  };

  /* ── إضافة حساب لدليل الحسابات (ترقيم تلقائي حسب المستوى) ── */
  const addAccount = (acc: Account): boolean => {
    if (accounts.some((a) => a.code === acc.code)) { toast(`الكود ${acc.code} مستخدم بالفعل — التكرار غير مسموح`, "err"); return false; }
    if (accounts.some((a) => a.parent === acc.parent && a.name === acc.name)) { toast("يوجد حساب بنفس الاسم تحت هذا الأب", "err"); return false; }
    const parent = accounts.find((a) => a.code === acc.parent);
    if (!parent) { toast("الحساب الأب غير موجود", "err"); return false; }
    if (parent.level >= 5) { toast("لا يمكن الإضافة تحت حساب من المستوى الخامس", "err"); return false; }
    const stampedAcc = { ...acc, level: parent.level + 1, type: acc.type || parent.type, parent: acc.parent, updatedAt: Date.now() };
    setAccounts((old) => [
      ...old.map((a) => (a.code === acc.parent && a.posting ? { ...a, posting: false } : a)),
      stampedAcc,
    ]);
    engine.publishAccounts([stampedAcc as any]); /* دليل الحسابات يتزامن لحظياً بين كل الأجهزة */
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
    logLocal(COLL_CAT[coll] || "النظام", `استيراد جماعي إلى ${COLL_AR[coll] || coll}: أُضيف ${added} وتُخطي ${skipped}`, "create");
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
    /* ── التكامل المحاسبي: قيد مزدوج متوازن على حسابات المخزن والمجموعة ──
       توريد   : من ح/ مخزون المجموعة ← إلى ح/ الطرف (مورد آجل / صندوق / عميل مرتجع)
       افتتاحي : من ح/ مخزون المجموعة ← إلى ح/ رأس المال (أو أرباح مرحلة / مقاصة)
       صرف     : من ح/ تكلفة مبيعات المجموعة ← إلى ح/ المخزن المرتبط
       تحويل   : من ح/ مخزن الوجهة ← إلى ح/ المخزن المصدر                      */
    const whAccOf = (code: string) => ((db.warehouses.find((w: any) => w.id === code) as any)?.account as string) || settings.suspense.purchases;
    /* حساب المجموعة المرتبط بالصنف — مع الوقوع على الحساب الوسطي عند غياب الربط */
    const grpAcc = (itemId: string, field: "stockAccount" | "cogsAccount" | "salesAccount", fallback: string) => {
      const it: any = db.items.find((x) => x.id === itemId);
      const g: any = it ? db.groups.find((x) => x.id === it.group) : undefined;
      return (g?.[field] as string) || fallback;
    };
    const totalVal = d.lines.reduce((s, l) => s + l.qty * l.cost, 0);
    const v = Math.abs(totalVal);
    const from = whAccOf(d.warehouse);
    const to = d.toWarehouse ? whAccOf(d.toWarehouse) : from;
    /* تجميع قيم البنود حسب حساب المجموعة — السند متعدد المجموعات يولّد سطراً لكل حساب */
    const aggBy = (field: "stockAccount" | "cogsAccount", fallback: string) => {
      const m: Record<string, number> = {};
      d.lines.forEach((l) => {
        const acc = grpAcc(l.item, field, fallback);
        m[acc] = (m[acc] || 0) + Math.abs(l.qty * l.cost);
      });
      return Object.entries(m).map(([account, val]) => ({ account, val }));
    };
    /* حساب الطرف المقابل حسب طبيعة الحركة (مورد آجل / صندوق نقدي / عميل مرتجع) */
    const partyName =
      d.partyKind === "supplier" ? (db.suppliers.find((s: any) => s.id === d.party) as any)?.name :
      d.partyKind === "customer" ? (db.customers.find((c: any) => c.id === d.party) as any)?.name :
      d.partyKind === "cashbox" ? (db.cashboxes.find((c: any) => c.id === d.party) as any)?.name : undefined;
    const partyAcc =
      d.partyKind === "supplier" ? ((db.suppliers.find((s: any) => s.id === d.party) as any)?.account as string) || settings.suspense.suppliers :
      d.partyKind === "customer" ? ((db.customers.find((c: any) => c.id === d.party) as any)?.account as string) || settings.suspense.customers :
      d.partyKind === "cashbox" ? ((db.cashboxes.find((c: any) => c.id === d.party) as any)?.account as string) || settings.suspense.cash :
      settings.suspense.purchases;
    const jeLines = v === 0 ? [] :
      d.type === "تحويل" ? (from === to ? [] : [
        { account: to, debit: v, credit: 0, currency: "YER", rate: 1 },
        { account: from, debit: 0, credit: v, currency: "YER", rate: 1 },
      ]) :
      d.type === "صرف" || totalVal < 0 ? [
        ...aggBy("cogsAccount", settings.suspense.cogs).map(({ account, val }) => ({ account, debit: val, credit: 0, currency: "YER", rate: 1 })),
        { account: from, debit: 0, credit: v, currency: "YER", rate: 1 },
      ] : (() => {
        /* القيد الافتتاحي: من حـ/ المخزون ← إلى حـ/ رأس المال (أو أرباح مرحلة / حساب مقاصة) */
        const creditAcc = d.type === "قيد افتتاحي" ? ((d as any).clearAccount as string) || "22111" : partyAcc;
        return [
          ...aggBy("stockAccount", settings.suspense.purchases).map(({ account, val }) => ({ account, debit: val, credit: 0, currency: "YER", rate: 1 })),
          { account: creditAcc, debit: 0, credit: v, currency: "YER", rate: 1 },
        ];
      })();
    const clearAccName = d.type === "قيد افتتاحي" ? accounts.find((a) => a.code === (((d as any).clearAccount as string) || "22111"))?.name : undefined;
    const jeNo = nextNo(settings.prefixes.JE);
    const je = jeLines.length ? {
      id: jeNo, no: jeNo, date: d.date, user: session?.user || "—", status: "مرحّل",
      desc: `قيد تلقائي — سند ${d.type} مخزني ${d.ref}${d.subType ? ` (${d.subType})` : ""}${partyName ? ` — الطرف: ${partyName}` : ""}${clearAccName ? ` — إلى ح/ ${clearAccName}` : ""}`,
      kind: "يومية", source: `سند ${d.type} مخزني`, lines: jeLines,
    } : null;

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
      return { ...old, items, invDocs: [...old.invDocs, d as any], journals: je ? [...old.journals, je as any] : old.journals };
    });
    /* بث لحظي: السند وأثره المخزني لكل الأجهزة */
    const now = Date.now();
    const patches: { coll: string; rows: AnyR[] }[] = [{ coll: "invDocs", rows: [{ ...d, updatedAt: now } as any] }];
    (db.items as AnyR[]).forEach((it) => {
      const line = d.lines.find((l) => l.item === it.id);
      if (!line) return;
      const qty = { ...(it.qty as Record<string, number>) };
      if (d.type === "تحويل") { qty[d.warehouse] = (qty[d.warehouse] || 0) - line.qty; qty[d.toWarehouse!] = (qty[d.toWarehouse!] || 0) + line.qty; }
      else { const delta = d.type === "صرف" ? -line.qty : line.qty; qty[d.warehouse] = (qty[d.warehouse] || 0) + delta; }
      patches.push({ coll: "items", rows: [{ ...it, qty, updatedAt: now }] });
    });
    if (je) patches.push({ coll: "journals", rows: [{ ...je, updatedAt: now } as any] });
    engine.publishPatches(patches);
    engine.bumpDeviceOps();
    toast(`رُحّل السند ${d.ref} — أُثّرت الكميات${je ? ` ووُلّد قيد محاسبي متوازن على ${from}` : ""}`);
    pushNotif({ kind: "info", title: `سند ${d.type} جديد`, body: `${d.ref} — ${d.lines.length} صنف في ${d.warehouse}${je ? " + قيد محاسبي" : ""}` });
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
    /* ── التكامل المحاسبي: قيد مزدوج متوازن يُولَّد تلقائياً على حسابات المجموعات ──
       مبيعات : من ح/ الصندوق أو ذمم العملاء ← إلى إيرادات مبيعات المجموعات + ضريبةOutput
       مشتريات: من ح/ مخزون المجموعات + ضريبةInput ← إلى ح/ الصندوق أو المورد
       مرتجع  : من ح/ مرتجع مبيعات محلية + ضريبةOutput ← إلى ح/ الصندوق أو العميل  */
    const grpAccOf = (itemId: string, field: "stockAccount" | "salesAccount", fallback: string) => {
      const it: any = db.items.find((x) => x.id === itemId);
      const g: any = it ? db.groups.find((x) => x.id === it.group) : undefined;
      return (g?.[field] as string) || fallback;
    };
    const sub = inv.lines.reduce((a, l) => a + l.qty * l.price * (1 - (l.disc || 0) / 100), 0);
    const vatVal = total - sub;
    const agg: Record<string, number> = {};
    inv.lines.forEach((l) => {
      const acc = kind === "purchases"
        ? grpAccOf(l.item, "stockAccount", settings.suspense.purchases)
        : grpAccOf(l.item, "salesAccount", inv.payType === "نقدي" ? settings.suspense.salesCash : settings.suspense.salesCredit);
      agg[acc] = (agg[acc] || 0) + l.qty * l.price * (1 - (l.disc || 0) / 100);
    });
    const L = (account: string, debit: number, credit: number) => ({ account, debit, credit, currency: "YER", rate: 1 });
    const jeLines =
      kind === "sales" ? [
        L(inv.payType === "نقدي" ? settings.suspense.cash : settings.suspense.customers, total, 0),
        ...Object.entries(agg).map(([a, val]) => L(a, 0, val)),
        L(settings.suspense.vatOut, 0, vatVal),
      ] :
      kind === "purchases" ? [
        ...Object.entries(agg).map(([a, val]) => L(a, val, 0)),
        L(settings.suspense.vatIn, vatVal, 0),
        L(inv.payType === "نقدي" ? settings.suspense.cash : settings.suspense.suppliers, 0, total),
      ] : [
        L("41311", sub, 0),
        L(settings.suspense.vatOut, vatVal, 0),
        L(inv.payType === "نقدي" ? settings.suspense.cash : settings.suspense.customers, 0, total),
      ];
    const jeNo = nextNo(settings.prefixes.JE);
    const je: any = {
      id: jeNo, no: jeNo, date: inv.date, user: session?.user || "—", status: "مرحّل",
      desc: `قيد تلقائي — فاتورة ${kind === "sales" ? "مبيعات" : kind === "purchases" ? "مشتريات" : "مرتجع مبيعات"} ${inv.no} على حسابات المجموعات (${inv.payType})`,
      kind: "يومية", source: kind === "sales" ? "فاتورة مبيعات" : kind === "purchases" ? "فاتورة مشتريات" : "فاتورة مرتجع مبيعات", lines: jeLines,
    };
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
      return { ...old, items, [coll]: [...old[coll], inv as any], [partners]: pList, journals: [...old.journals, je] };
    });
    /* بث لحظي: الفاتورة وقيدها المحاسبي وأثرها المخزني تصل للمدير والمحاسب خلال ثوانٍ */
    const now = Date.now();
    const partnersColl = (kind === "purchases" ? "suppliers" : "customers") as CollKey;
    const patches: { coll: string; rows: AnyR[] }[] = [{ coll, rows: [{ ...inv, updatedAt: now } as any] }, { coll: "journals", rows: [{ ...je, updatedAt: now }] }];
    if (inv.payType === "آجل") {
      const p: any = db[partnersColl].find((x) => x.id === inv.partner);
      if (p) patches.push({ coll: partnersColl, rows: [{ ...p, balance: p.balance + total, updatedAt: now }] });
    }
    (db.items as AnyR[]).forEach((it) => {
      const l = inv.lines.find((x) => x.item === it.id);
      if (!l) return;
      const qty = { ...(it.qty as Record<string, number>), "WH-01": ((it.qty as Record<string, number>)["WH-01"] || 0) + (kind === "sales" ? -l.qty : l.qty) };
      patches.push({ coll: "items", rows: [{ ...it, qty, updatedAt: now }] });
    });
    engine.publishPatches(patches);
    engine.bumpDeviceOps();
    toast(`رُحّلت الفاتورة ${inv.no} (${inv.payType}) — قيد متوازن ${jeNo} على حسابات المجموعات + أثر مخزني فوري`);
    pushNotif({ kind: "info", title: `فاتورة ${kind === "sales" ? "مبيعات" : kind === "purchases" ? "مشتريات" : "مرتجع"}`, body: `${inv.no} — ${Math.round(total).toLocaleString("en-US")} ر.ي (${inv.payType}) • قيد ${jeNo}` });
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
    engine.publishPatches([{ coll: "journals", rows: [{ ...j, updatedAt: Date.now() } as any] }]); /* يصل للمدير لحظياً */
    engine.bumpDeviceOps();
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

  /* ── محرك الصلاحيات الرباعي (نظام / شاشات / تقارير / أزرار) ── */
  const emptyPerm = (): PermRole => ({ modules: {}, screens: {}, reports: {}, buttons: {} });
  const updMatrix = (role: string, fn: (r: PermRole) => PermRole) =>
    setMatrix((old) => ({ ...old, [role]: fn(old[role] || emptyPerm()) }));
  const permAudit = (role: string, level: string, target: string, on: boolean) =>
    logLocal("النظام", `${on ? "منح" : "سحب"} صلاحية [${level}] «${target}» للدور «${role}»`, "update");

  const can = (module: string, action: string) => {
    const r = matrix[session?.role || ""] || matrix["مدقق خارجي"];
    if (!r || !r.modules[module]) return false;
    if (action === "عرض") return true;
    return (r.buttons[module] || []).includes(action);
  };
  /* توافقية مع الواجهات القديمة */
  const togglePerm = (role: string, module: string, action: string) => {
    setPerms((old) => {
      const cur = old[role]?.[module] || [];
      const next = cur.includes(action) ? cur.filter((a) => a !== action) : [...cur, action];
      return { ...old, [role]: { ...(old[role] || {}), [module]: next } };
    });
    if (action === "عرض") setModulePerm(role, module, !(matrix[role]?.modules[module]));
    else setButtonPerm(role, module, action, !(matrix[role]?.buttons[module] || []).includes(action));
  };

  const setModulePerm = (role: string, mod: string, on: boolean) => {
    updMatrix(role, (r) => ({
      ...r, modules: { ...r.modules, [mod]: on },
      /* إغلاق الوحدة يسقط شاشاتها وأزرارها تلقائياً */
      screens: on ? r.screens : Object.fromEntries(Object.entries(r.screens).map(([k, v]) => [k, k.startsWith(mod + ":") ? false : v])),
    }));
    permAudit(role, "النظام", MODULE_SCREENS[mod]?.label || mod, on);
  };
  const setScreenPerm = (role: string, key: string, on: boolean) => {
    updMatrix(role, (r) => ({ ...r, screens: { ...r.screens, [key]: on } }));
    const [mid, sid] = key.split(":");
    const sc = MODULE_SCREENS[mid]?.screens.find((s) => s.id === sid);
    permAudit(role, "الشاشات", `${MODULE_SCREENS[mid]?.label || mid} ← ${sc?.label || sid}`, on);
  };
  const setAllScreens = (role: string, mod: string, on: boolean) => {
    updMatrix(role, (r) => ({ ...r, screens: { ...r.screens, ...Object.fromEntries((MODULE_SCREENS[mod]?.screens || []).map((s) => [`${mod}:${s.id}`, on])) } }));
    permAudit(role, "الشاشات", `كل شاشات ${MODULE_SCREENS[mod]?.label || mod}`, on);
  };
  const setReportAction = (role: string, rep: string, act: string, on: boolean) => {
    updMatrix(role, (r) => {
      const cur = r.reports[rep] || [];
      return { ...r, reports: { ...r.reports, [rep]: on ? [...new Set([...cur, act])] : cur.filter((a) => a !== act) } };
    });
    permAudit(role, "التقارير", `${REPORTS.find((x) => x.id === rep)?.name || rep} — ${act}`, on);
  };
  const setButtonPerm = (role: string, mod: string, act: string, on: boolean) => {
    updMatrix(role, (r) => {
      const cur = r.buttons[mod] || [];
      return { ...r, buttons: { ...r.buttons, [mod]: on ? [...new Set([...cur, act])] : cur.filter((a) => a !== act) } };
    });
    permAudit(role, "الأزرار", `${MODULE_SCREENS[mod]?.label || mod} — ${act}`, on);
  };
  const setAllButtons = (role: string, mod: string, on: boolean) => {
    updMatrix(role, (r) => ({ ...r, buttons: { ...r.buttons, [mod]: on ? [...BUTTON_ACTIONS] : [] } }));
    permAudit(role, "الأزرار", `كل أزرار ${MODULE_SCREENS[mod]?.label || mod}`, on);
  };
  const grantAll = (role: string) => { setMatrix((old) => ({ ...old, [role]: mkPerm({ ...ALL_MODS }, JSON.parse(JSON.stringify(ALL_BTNS)), ALL_REPS) })); permAudit(role, "شاملة", "منح كل الصلاحيات", true); };
  const revokeAll = (role: string) => { setMatrix((old) => ({ ...old, [role]: emptyPerm() })); permAudit(role, "شاملة", "سحب كل الصلاحيات", false); };
  const permCounts = (role: string) => {
    const r = matrix[role] || emptyPerm();
    const modules = Object.values(r.modules).filter(Boolean).length;
    const screens = Object.values(r.screens).filter(Boolean).length;
    const reports = Object.values(r.reports).reduce((a, x) => a + x.length, 0);
    const buttons = Object.values(r.buttons).reduce((a, x) => a + x.length, 0);
    return { modules, screens, reports, buttons, total: modules + screens + reports + buttons };
  };

  /* ── النسخ الاحتياطي الحقيقي: تنزيل لقطة JSON واستعادتها مع بث Gen ── */
  const downloadSnapshot = (label: string) => {
    const snap = { app: "okyanus_ifs", name: "النظام المالي المتكامل", v: SYSTEM.version, gen, ts: Date.now(), label, db: dbRef.current, accounts };
    const blob = new Blob([JSON.stringify(snap)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `OkyanusIFS_Backup_G${gen}_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    logLocal("النظام", `تنزيل نسخة احتياطية كاملة (${label}) — جيل المزامنة ${gen}`, "create");
    toast("نُزّلت النسخة الاحتياطية الكاملة بصيغة JSON", "ok");
  };
  const restoreSnapshot = (file: File) => {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const snap = JSON.parse(String(rd.result));
        if (!snap || !snap.db) throw new Error("bad");
        const restored = engine.loadDb(snap.db);
        setDb(restored);
        if (Array.isArray(snap.accounts) && snap.accounts.length) setAccounts(snap.accounts);
        const g = gen + 1;
        setGen(g);
        engine.publishGen(dbRef.current, `استعادة النسخة ${file.name}`);
        logLocal("النظام", `استعادة نسخة احتياطية من «${file.name}» — ارتفع الجيل إلى ${g} وبُث الاستبدال لكل الأجهزة`, "update");
        toast("اكتملت الاستعادة وبُث جيل جديد — استُبدلت النسخ القديمة على كل الأجهزة", "ok");
      } catch { toast("ملف النسخة الاحتياطية غير صالح", "err"); }
    };
    rd.readAsText(file);
  };

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

  /* ═══════ الأنظمة المتخصصة: تفعيل وتهيئة ═══════ */
  const toggleSystem = (id: string) => {
    const a = ACTIVITIES.find((x) => x.id === id);
    const on = activeSystems.includes(id);
    const next = on ? activeSystems.filter((x) => x !== id) : [...activeSystems, id];
    setActiveSystems(next);
    if (!on && a) {
      setPrimaryActivityState((p) => p || id);
      logLocal("الأنشطة", `تفعيل نظام «${a.name}» من لوحة المالك — شُكّلت قوائمه وبياناته`, "create");
      toast(`فُعّل نظام «${a.name}» وشُكّلت قوائمه وبياناته${a.id === "restaurants" ? " — تحولت نقاط البيع لنمط المطاعم والطاولات" : ""}`, "ok");
    } else if (on && a) {
      if (primaryActivity === id) setPrimaryActivityState(next[0] || "");
      logLocal("الأنشطة", `تعطيل نظام «${a.name}»`, "delete");
      toast(`عُطّل نظام «${a.name}»${a.id === "restaurants" ? " — تحولت نقاط البيع فوراً لنمط متاجر التجزئة" : " وأُخفيت قوائمه"}`, "info");
    }
  };
  const setPrimaryActivity = (id: string) => {
    const a = ACTIVITIES.find((x) => x.id === id);
    if (!activeSystems.includes(id)) setActiveSystems((old) => [...old, id]);
    setPrimaryActivityState(id);
    if (a) toast(`أصبح النشاط الأساسي: «${a.name}» — تكيّفت المصطلحات ونمط نقاط البيع`, "ok");
  };
  const unlockOwner = (pin: string) => {
    if (pin === OWNER_PIN) { setOwnerUnlocked(true); return true; }
    return false;
  };
  const lockOwner = () => setOwnerUnlocked(false);

  /* ═══════ الوحدات المتخصصة: حفظ / حذف / ترحيل (بث لحظي) ═══════ */
  const saveSpec = (key: string, row: AnyR) => {
    const stamped: AnyR = { ...row, updatedAt: Date.now() };
    setSpecData((old) => {
      const list = old[key] || [];
      const i = list.findIndex((r) => r.id === stamped.id);
      return { ...old, [key]: i >= 0 ? list.map((r, j) => (j === i ? stamped : r)) : [...list, stamped] };
    });
    engine.publishSpec(key, [stamped]); /* ما يدخله موظف النشاط يظهر لكل الأجهزة فوراً */
    engine.bumpDeviceOps();
    logLocal("الأنشطة", `حفظ سجل «${String(stamped.name || stamped.code || stamped.id)}» في وحدة متخصصة — دُمج مركزياً`, "update");
  };
  const removeSpec = (key: string, id: string, label?: string) => {
    setSpecData((old) => ({ ...old, [key]: (old[key] || []).filter((r) => r.id !== id) }));
    engine.publishTombstone(`spec:${key}`, id);
    addTombstone("specData" as any, `${key}:${id}`, label || id);
    toast(`حُذف «${label || id}» من الوحدة المتخصصة ونُشر الحذف`, "err");
  };
  const postSpecToGL = (key: string, row: AnyR, amount: number, label: string) => {
    if (!amount || amount <= 0) return { ok: false, msg: "لا توجد قيمة قابلة للترحيل" };
    const actId = key.split(":")[0];
    const act = ACTIVITIES.find((a) => a.id === actId);
    const credit = act?.glCredit || "41411";
    const no = `JE-2026-${1100 + db.journals.length}`;
    const j = {
      id: no, no, date: "2026-03-29", desc: `ترحيل ${label} — ${String(row.name || row.code || row.id)}`,
      kind: "يومية", user: session?.user || "النظام", status: "مرحّل", source: `نظام ${act?.name || "متخصص"}`,
      lines: [
        { account: settings.suspense.cash, debit: amount, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
        { account: credit, debit: 0, credit: amount, currency: "YER", rate: 1, costCenter: "CC-01" },
      ],
    } as any;
    setDb((old) => ({ ...old, journals: [...old.journals, j] }));
    engine.publishPatches([{ coll: "journals", rows: [j] }]); /* القيد المتوازن يصل لكل الأجهزة */
    logLocal("المالية", `ترحيل قيمة ${label} (${Math.round(amount).toLocaleString("en-US")}) إلى الحسابات العامة بقيد متوازن`, "create");
    toast(`رُحّلت قيمة ${label} (${Math.round(amount).toLocaleString("en-US")} ر.ي) بقيد متوازن إلى الحساب ${credit}`, "ok");
    return { ok: true, msg: "تم الترحيل" };
  };

  /* ═══════ نقاط البيع: بيع فوري مع أثر مخزني ومحاسبي ═══════ */
  const posSale = (lines: { item: string; qty: number; price: number }[], mode: "cash" | "card") => {
    if (!lines.length) return { ok: false, msg: "أضف أصنافاً أولاً" };
    const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0);
    const vat = subtotal * (settings.vat / 100);
    const total = subtotal + vat;
    const no = `POS-2026-${String(900 + db.sales.length)}`;
    const inv = {
      id: no, no, date: "2026-03-29", partner: "", payType: "نقدي" as const, currency: "YER", rate: 1,
      costCenter: "CC-01", status: "مرحّلة", vat: settings.vat,
      lines: lines.map((l) => ({ item: l.item, qty: l.qty, price: l.price, disc: 0 })),
      posMode: mode,
    } as any;
    const je = {
      id: `JE-${no}`, no: `JE-${no}`, date: "2026-03-29", desc: `قيد نقطة بيع ${no} (${mode === "cash" ? "نقدي" : "بطاقة"})`,
      kind: "يومية", user: session?.user || "الكاشير", status: "مرحّل", source: "نظام نقاط البيع",
      lines: [
        { account: mode === "cash" ? settings.suspense.cash : settings.suspense.bank, debit: total, credit: 0, currency: "YER", rate: 1, costCenter: "CC-012" },
        { account: "41111", debit: 0, credit: subtotal, currency: "YER", rate: 1, costCenter: "CC-012" },
        { account: "21211", debit: 0, credit: vat, currency: "YER", rate: 1 },
      ],
    };
    setDb((old) => {
      const items = old.items.map((it: AnyR) => {
        const l = lines.find((x) => x.item === it.id);
        if (!l) return it;
        const qty = { ...(it.qty as Record<string, number>) };
        qty["WH-01"] = (qty["WH-01"] || 0) - l.qty;
        return { ...it, qty };
      });
      return { ...old, items, sales: [...old.sales, inv], journals: [...old.journals, je] };
    });
    /* بث لحظي: بيع الكاشير يظهر للمحاسب والمدير خلال ثوانٍ */
    const now = Date.now();
    const posPatches: { coll: string; rows: AnyR[] }[] = [
      { coll: "sales", rows: [{ ...inv, updatedAt: now } as any] },
      { coll: "journals", rows: [{ ...je, updatedAt: now } as any] },
    ];
    (db.items as AnyR[]).forEach((it) => {
      const l = lines.find((x) => x.item === it.id);
      if (!l) return;
      const qty = { ...(it.qty as Record<string, number>), "WH-01": ((it.qty as Record<string, number>)["WH-01"] || 0) - l.qty };
      posPatches.push({ coll: "items", rows: [{ ...it, qty, updatedAt: now }] });
    });
    engine.publishPatches(posPatches);
    engine.bumpDeviceOps();
    logLocal("المبيعات", `بيع نقطة بيع ${no} — ${Math.round(total).toLocaleString("en-US")} ر.ي (${mode === "cash" ? "نقدي" : "بطاقة"})`, "create");
    toast(`تم البيع ${no} بإجمالي ${Math.round(total).toLocaleString("en-US")} ر.ي وخصم المخزون وترحيل القيد`, "ok");
    return { ok: true, msg: no };
  };

  /* ═══════ الموارد البشرية: كشف الرواتب المرحَّل (بث لحظي) ═══════ */
  const setHr = (patch: Partial<typeof hr>) => {
    const next = { ...hr, ...patch };
    setHrState(next);
    engine.publishState("@hr", next); /* عمليات الموارد تصل لكل الأجهزة فوراً */
  };
  const runPayroll = () => {
    const month = "2026-03";
    const rows = hr.employees.filter((e) => e.status !== "منتهي").map((e) => ({
      id: `PAY-${e.id}-${month}`, code: `PAY-${e.id}`, emp: e.id, name: e.name, month,
      basic: e.salary, bonus: hr.rewards.filter((r) => r.emp === e.id && r.status === "مصروفة").reduce((a, r) => a + r.amount, 0),
      total: e.salary + hr.rewards.filter((r) => r.emp === e.id && r.status === "مصروفة").reduce((a, r) => a + r.amount, 0),
      status: "مرحَّل",
    }));
    const totalAmt = rows.reduce((a, r) => a + r.total, 0);
    const no = `JE-2026-${1200 + db.journals.length}`;
    const je = {
      id: no, no, date: "2026-03-29", desc: `مسيرات رواتب ${month} — ${rows.length} موظف`,
      kind: "صرف", user: session?.user || "النظام", status: "مرحّل", source: "نظام الموارد البشرية",
      lines: [
        { account: "31111", debit: totalAmt, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
        { account: settings.suspense.bank, debit: 0, credit: totalAmt, currency: "YER", rate: 1 },
      ],
    } as any;
    const nextHr = { ...hr, payroll: [...rows, ...hr.payroll] };
    setHrState(nextHr);
    engine.publishState("@hr", nextHr); /* الكشف المرحّل يظهر لكل الأجهزة فوراً */
    setDb((old) => ({ ...old, journals: [...old.journals, je] }));
    engine.publishPatches([{ coll: "journals", rows: [je] }]);
    logLocal("الموارد", `ترحيل مسيرات رواتب ${month} بإجمالي ${Math.round(totalAmt).toLocaleString("en-US")} ر.ي`, "create");
    toast(`رُحّل كشف رواتب ${month} (${rows.length} موظف — ${Math.round(totalAmt).toLocaleString("en-US")} ر.ي) بقيد متوازن`, "ok");
    return { ok: true, msg: "تم ترحيل الرواتب" };
  };

  /* ═══════ الأصول الثابتة: قسط ثابت + قيد سنوي ═══════ */
  const depreciationOf = (a: AnyR) => Math.max(0, (Number(a.cost) - Number(a.salvage)) / (Number(a.life) || 1));
  const postDepreciation = () => {
    const active = assets.filter((a) => a.status === "في الخدمة");
    const totalAmt = active.reduce((s, a) => s + depreciationOf(a), 0);
    const no = `JE-2026-${1300 + db.journals.length}`;
    const je = {
      id: no, no, date: "2026-03-29", desc: `قسط إهلاك سنوي — ${active.length} أصل (طريقة القسط الثابت)`,
      kind: "يومية", user: session?.user || "النظام", status: "مرحّل", source: "نظام الأصول",
      lines: [
        { account: "31311", debit: totalAmt, credit: 0, currency: "YER", rate: 1, costCenter: "CC-01" },
        { account: "11421", debit: 0, credit: totalAmt, currency: "YER", rate: 1 },
      ],
    } as any;
    setDb((old) => ({ ...old, journals: [...old.journals, je] }));
    engine.publishPatches([{ coll: "journals", rows: [je] }]);
    logLocal("الأصول", `ترحيل قسط الإهلاك السنوي ${Math.round(totalAmt).toLocaleString("en-US")} ر.ي`, "create");
    toast(`رُحّل قسط الإهلاك السنوي (${Math.round(totalAmt).toLocaleString("en-US")} ر.ي) بقيد متوازن`, "ok");
    return { ok: true, msg: "تم ترحيل الإهلاك" };
  };

  const exportCsv = (name: string, rows: (string | number)[][]) => {
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast(`صُدّر التقرير «${name}» بصيغة Excel (CSV)`, "ok");
  };

  /* ═══════ محاكي البث اللحظي: أجهزة بعيدة تُدخل بيانات فتظهر هنا فوراً ═══════ */
  const liveNo = useRef(0);
  useEffect(() => {
    if (!session) return;
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

    /* عملية تعديل حقيقية على جهاز بعيد → تُدمج في القاعدة المركزية */
    const remoteMutate = (dev: Device): string => {
      const items = ["IT-1001", "IT-1002", "IT-1003", "IT-1004", "IT-1005", "IT-1008"];
      const cust = ["CU-01", "CU-02", "CU-03", "CU-04"];
      const supp = ["SP-01", "SP-02", "SP-04"];
      const it = pick(items);
      const qty = ri(2, 24);
      const n = ++liveNo.current;

      if (dev.category === "الموارد" || dev.category === "النظام") {
        const hr = ["تحديث بيانات موظف — قسم المختبرات", "تسجيل حضور وانصراف — وردية الصباح", "مراجعة مسير الرواتب الشهري", "إضافة موظف جديد — قسم الاستقبال"];
        return pick(hr);
      }
      if (dev.category === "المخازن") {
        const ref = `GRN-2026-${String(300 + n).padStart(4, "0")}`;
        setDb((d) => ({
          ...d,
          invDocs: [...d.invDocs, { id: `LIVE-${ref}`, type: "توريد", date: "2026-03-29", ref, warehouse: "WH-01", user: dev.user, status: "مرحّل", lines: [{ item: it, qty, cost: 1000 }], updatedAt: Date.now() } as any],
          items: d.items.map((x) => (x.id === it ? { ...x, qty: { ...(x.qty as any), "WH-01": ((x.qty as any)["WH-01"] || 0) + qty } } : x)),
        }));
        return `سند توريد مخزني ${ref} — ${qty} وحدة من ${it}`;
      }
      if (dev.category === "المشتريات") {
        const no = `PIN-2026-${String(400 + n).padStart(4, "0")}`;
        const price = ri(800, 4000); const credit = Math.random() > 0.5;
        setDb((d) => ({
          ...d,
          purchases: [...d.purchases, { id: `LIVE-${no}`, no, date: "2026-03-29", partner: pick(supp), payType: credit ? "آجل" : "نقدي", currency: "YER", rate: 1, costCenter: "CC-01", status: "مرحّلة", vat: 5, lines: [{ item: it, qty, price, disc: 0 }], updatedAt: Date.now() } as any],
          items: d.items.map((x) => (x.id === it ? { ...x, qty: { ...(x.qty as any), "WH-01": ((x.qty as any)["WH-01"] || 0) + qty } } : x)),
        }));
        return `فاتورة مشتريات ${no} (${credit ? "آجل" : "نقدي"}) — ${qty} × ${it}`;
      }
      if (dev.category === "المالية") {
        const amt = ri(20, 400) * 1000;
        const no = `RC-2026-${String(500 + n).padStart(4, "0")}`;
        setDb((d) => ({
          ...d,
          journals: [...d.journals, { id: `LIVE-${no}`, no, date: "2026-03-29", desc: `سند قبض — تحصيل دفعة (بث لحظي من ${dev.name})`, kind: "قبض", user: dev.user, status: "مرحّل", source: "سند قبض", lines: [
            { account: "11111", debit: amt, credit: 0, currency: "YER", rate: 1 },
            { account: "11211", debit: 0, credit: amt, currency: "YER", rate: 1 },
          ], updatedAt: Date.now() } as any],
        }));
        return `سند قبض ${no} — تحصيل ${amt.toLocaleString("en-US")} ر.ي`;
      }
      /* المبيعات / نقاط البيع */
      const no = `SIN-2026-${String(600 + n).padStart(4, "0")}`;
      const price = ri(900, 5000); const credit = dev.category === "المبيعات" && Math.random() > 0.6;
      const partner = pick(cust);
      setDb((d) => ({
        ...d,
        sales: [...d.sales, { id: `LIVE-${no}`, no, date: "2026-03-29", partner, payType: credit ? "آجل" : "نقدي", currency: "YER", rate: 1, costCenter: "CC-012", status: "مرحّلة", vat: 5, lines: [{ item: it, qty, price, disc: 0 }], updatedAt: Date.now() } as any],
        items: d.items.map((x) => (x.id === it ? { ...x, qty: { ...(x.qty as any), "WH-01": Math.max(0, ((x.qty as any)["WH-01"] || 0) - qty) } } : x)),
        customers: credit ? d.customers.map((c) => (c.id === partner ? { ...c, balance: c.balance + qty * price } : c)) : d.customers,
      }));
      return `فاتورة ${dev.category === "نقاط البيع" ? "نقاط بيع" : "مبيعات"} ${no} (${credit ? "آجل" : "نقدي"}) — ${qty} × ${it}`;
    };

    const iv = setInterval(() => {
      const dev = pick(DEVICES);
      /* تحديث حالة الجهاز: آخر ظهور، عدد العمليات، وتبديل الاتصال أحياناً */
      setDevices((old) => old.map((x) => (x.id === dev.id ? { ...x, lastSeen: Date.now(), ops: x.ops + 1, online: Math.random() > 0.06 ? true : !x.online } : x)));

      const doMutate = mutCount.current < 18 && Math.random() < 0.42;
      if (doMutate) {
        mutCount.current++;
        const action = remoteMutate(dev);
        const t: Activity["type"] = dev.category === "الموارد" || dev.category === "النظام" ? "update" : "create";
        logActivity({ user: dev.user, role: dev.role, device: dev.name, deviceId: dev.id, category: dev.category, action, type: t });
      } else {
        /* نبض مزامنة يبقي البث حياً دون تعديل البيانات */
        if (Math.random() < 0.5) {
          const syncMsgs = [
            "مزامنة تلقائية ناجحة — لا تغييرات جديدة",
            `مزامنة دلتا — استلام ${ri(1, 5)} سجلات محدثة`,
            "فحص اتصال بقاعدة البيانات المركزية — 12ms",
            "تحديث الرصيد اللحظي للصناديق والبنوك",
            "نسخ احتياطي تفاضلي مجدول اكتمل",
          ];
          logActivity({ user: dev.user, role: dev.role, device: dev.name, deviceId: dev.id, category: dev.category === "المالية" ? "المالية" : "النظام", action: pick(syncMsgs), type: "sync" });
        }
      }
    }, 4500);

    return () => clearInterval(iv);
  }, [session]);

  /* ═══════ الربط الحي بمحرك المزامنة المركزية ═══════ */
  const dbRef = useRef(db);
  /* حفظ مركزي دائم (يُشارك بين النوافذ ويبقى بعد التحديث) */
  useEffect(() => {
    dbRef.current = db;
    const t = setTimeout(() => engine.persistDb(db), 250);
    return () => clearTimeout(t);
  }, [db]);

  /* استقبال عمليات الأجهزة الأخرى: دمج «الأحدث يفوز» دون إعادة بث */
  useEffect(() => engine.subscribe((m) => {
    if (m.kind === "patches") {
      m.patches.forEach((p) => mergeSync(p.coll as CollKey, p.rows));
      engine.stats.applied += m.patches.reduce((a, p) => a + p.rows.length, 0);
    } else if (m.kind === "spec") {
      setSpecData((old) => {
        const list = [...(old[m.key] || [])];
        m.rows.forEach((inc) => {
          const i = list.findIndex((r) => r.id === inc.id);
          const its = (inc as any).updatedAt || 0;
          if (i < 0) list.push(inc);
          else if (its >= ((list[i] as any).updatedAt || 0)) list[i] = inc; /* الأحدث يفوز */
        });
        return { ...old, [m.key]: list };
      });
      engine.stats.applied += m.rows.length;
    } else if (m.kind === "accounts") {
      setAccounts((old) => {
        const list = [...old];
        (m.rows as any as (Account & { updatedAt?: number })[]).forEach((inc) => {
          const i = list.findIndex((a) => a.code === inc.code);
          if (i < 0) list.push(inc);
          else if ((inc.updatedAt || 0) >= ((list[i] as any).updatedAt || 0)) list[i] = { ...list[i], ...inc };
        });
        return list;
      });
    } else if (m.kind === "tomb") {
      if (m.coll.startsWith("spec:")) {
        const key = m.coll.slice(5);
        setSpecData((old) => ({ ...old, [key]: (old[key] || []).filter((r) => r.id !== m.id) }));
      } else {
        setDb((d) => (m.coll in d ? { ...d, [m.coll]: d[m.coll as CollKey].filter((r) => r.id !== m.id) } : d));
      }
      setTombstones((t) => [{ id: `TB-${Date.now()}`, coll: m.coll as any, recordId: m.id, label: m.id, by: "جهاز بعيد", ts: Date.now() }, ...t]);
      engine.stats.tombstones++;
    } else if (m.kind === "gen") {
      setDb(m.db as Record<CollKey, AnyR[]>); /* استبدال شامل — الجيل انتشر */
      setGen(m.gen);
      engine.stats.genEvents++;
      toast(`انتشر الاستبدال الشامل: استُبدلت القاعدة المركزية (الجيل ${m.gen}) على هذا الجهاز`, "ok");
    } else if (m.kind === "op") {
      setActivity((old) => (old.some((x) => x.id === (m.op as any).id) ? old : [m.op as any as Activity, ...old].slice(0, 400)));
    } else if (m.kind === "hello") {
      setDevices((old) => [...old.filter((d) => d.id !== (m.device as any).id), m.device as any as Device]);
    } else if (m.kind === "state") {
      if (m.key === "@hr") setHrState(m.val as typeof hr);
      else if (m.key === "@assets") setAssetsState(m.val as AnyR[]);
      else if (m.key === "@settings") setSettingsState(m.val as Settings);
    }
  }), []);

  /* نبضة هذا الجهاز كل 5 ثوانٍ: تظهر حالته في مراقبة النشاط بكل الأجهزة */
  useEffect(() => {
    if (!session) return;
    const beat = () => {
      engine.hello({ id: deviceId, name: settings.deviceName, user: session.user, role: session.role, lastSeen: Date.now(), ops: 0, online: true });
      setDevices(() => (engine.loadDevices(DEVICES as any) as Device[]).map((d) => ({ ...d, online: Date.now() - d.lastSeen < 15000 })));
    };
    beat();
    const iv = setInterval(beat, 5000);
    return () => clearInterval(iv);
  }, [session, settings.deviceName, deviceId]);

  /* إعادة تهيئة القاعدة المركزية — تُبث لكل الأجهزة عبر الجيل */
  const reinitCentral = () => {
    const g = engine.reinitCentral(initDb);
    setDb(engine.loadDb(initDb));
    setGen(g);
    logLocal("النظام", `إعادة تهيئة القاعدة المركزية — بُثّ الجيل ${g} لكل الأجهزة`, "delete");
    toast(`أُعيدت تهيئة القاعدة المركزية وبُثّ الجيل ${g} لكل الأجهزة تلقائياً`, "ok");
  };

  return (
    <Ctx.Provider value={{
      db, trash, seq, settings, setSettings, prefs, setPrefs, session, route, toasts, notifs,
      toast, pushNotif, markNotifs, nav, login, logout, nextNo,
      save, remove, restore, purge, emptyTrash, importRows,
      addInvDoc, voidInvDoc, addInvoice, voidInvoice, payInvoice,
      addJournal, voidJournal, approveJournal, lockPeriod, setQuoteStatus, setRequestStatus,
      fmtN, fmtMoney, fmtDate, invoiceTotal, itemQty, exportCsv, can, togglePerm, perms,
      matrix, setModulePerm, setScreenPerm, setAllScreens, setReportAction, setButtonPerm, setAllButtons,
      grantAll, revokeAll, permCounts, downloadSnapshot, restoreSnapshot,
      accounts, addAccount, nextAccountCode: (p: string) => nextAccountCode(accounts, p),
      activity, devices, tombstones, gen, deviceId, mergeSync, sync: engine, reinitCentral,
      activities: ACTIVITIES, activeSystems, primaryActivity, toggleSystem, setPrimaryActivity,
      ownerUnlocked, unlockOwner, lockOwner, specData, saveSpec, removeSpec, postSpecToGL, posSale,
      hr, setHr, runPayroll, assets, setAssets, depreciationOf, postDepreciation,
      sidebarBgs: SIDEBAR_BGS, SYSTEM,
    }}>
      {children}
    </Ctx.Provider>
  );
}
