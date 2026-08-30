import { useState } from "react";
import { useApp } from "../store";
import { I, Chip } from "../ui";
import { Directory, type DirConf } from "../crud";
import { PERM_MODULES, PERM_ACTIONS, ROLES, SIDEBAR_BGS, SYSTEM } from "../data";
import { LOGIN_BGS } from "./Login";

export default function Admin() {
  const app = useApp();
  const p = app.route.path || "users";
  if (p === "users") return <UsersScreen />;
  if (p === "settings") return <SettingsScreen />;
  if (p === "prefs") return <PrefsScreen />;
  return <UsersScreen />;
}

/* ═══════════ المستخدمون والصلاحيات ═══════════ */
function UsersScreen() {
  const app = useApp();
  const [tab, setTab] = useState("list");
  const [role, setRole] = useState(ROLES[0]);

  const usersConf: DirConf = {
    coll: "users", title: "المستخدمون والصلاحيات", icon: "users", prefix: "U", importKey: "users",
    desc: "حسابات المستخدمين وأدوارهم — الصلاحيات الدقيقة تُدار من تبويب «مصفوفة الصلاحيات»",
    fields: [
      { k: "code", label: "الكود", req: true, uniq: true },
      { k: "name", label: "الاسم الكامل", req: true },
      { k: "username", label: "اسم المستخدم", req: true, uniq: true, hint: "يُستخدم في تسجيل الدخول" },
      { k: "role", label: "الدور الوظيفي", type: "select", req: true, opts: ROLES.map((r) => ({ v: r, l: r })) },
      { k: "branch", label: "الفرع", type: "select", req: true, opts: app.db.branches.map((b: any) => ({ v: b.id, l: b.name })) },
      { k: "active", label: "الحالة", type: "select", opts: [{ v: true, l: "نشط" }, { v: false, l: "موقوف" }] },
    ],
    cols: [
      { k: "name", label: "المستخدم", render: (r) => <div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-full grid place-items-center font-display font-bold text-[0.7rem] text-[var(--brandink)] shrink-0" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}>{String(r.name).slice(0, 2)}</span><div><b>{r.name}</b><div className="text-[0.64rem] text-mute font-bold font-num" dir="ltr">@{r.username}</div></div></div> },
      { k: "role", label: "الدور", render: (r) => <span className="chip bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)]">{r.role}</span> },
      { k: "branch", label: "الفرع", render: (r) => app.db.branches.find((b: any) => b.id === r.branch)?.name || "—" },
      { k: "lastLogin", label: "آخر دخول", num: true, render: (r) => <span className="font-num text-mute" dir="ltr">{r.lastLogin}</span> },
      { k: "active", label: "الحالة", render: (r) => <Chip s={r.active === false ? "ملغي" : "مرحّل"} /> },
    ],
  };

  return (
    <div className="anim-fadein">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line mb-5 px-1">
        {[["list", "المستخدمون", "users"], ["matrix", "مصفوفة الصلاحيات", "shield"], ["org", "الهيكل الإداري والتنظيمي", "bld"]].map(([id, l, ic]) => (
          <button key={id} onClick={() => setTab(id)} className={`tabline flex items-center gap-1.5 px-3.5 py-2.5 text-[0.82rem] font-bold whitespace-nowrap transition-colors ${tab === id ? "on text-[var(--brand)]" : "text-mute hover:text-ink"}`}>
            <I n={ic} size={15} /> {l}
          </button>
        ))}
      </div>
      {tab === "list" && <Directory conf={usersConf} />}
      {tab === "matrix" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-[0.82rem] font-bold text-soft flex items-center gap-2"><I n="shield" size={17} className="text-[var(--brand)]" /> صلاحيات دقيقة على مستوى الشاشة والزر والتقرير — انقر أي خلية للتبديل</p>
            <select className="select !w-64" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="card overflow-hidden"><div className="overflow-x-auto">
            <table className="tbl min-w-[860px]">
              <thead><tr><th>الوحدة \ الإجراء</th>{PERM_ACTIONS.map((a) => <th key={a} className="text-center !text-[0.7rem]">{a}</th>)}</tr></thead>
              <tbody>
                {PERM_MODULES.map((m) => (
                  <tr key={m}>
                    <td className="font-display font-bold">{m}</td>
                    {PERM_ACTIONS.map((a) => {
                      const on = (app as any).perms?.[role]?.[m]?.includes(a) ?? false;
                      const has = role === "مدير النظام" && m === "إدارة النظام";
                      return (
                        <td key={a} className="text-center">
                          <button disabled={has} onClick={() => { app.togglePerm(role, m, a); }}
                            className={`w-7 h-7 rounded-lg grid place-items-center transition-all mx-auto ${has ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-110"} ${on ? "text-[var(--brandink)] shadow" : "bg-panel text-mute hover:text-ink"}`}
                            style={on ? { background: "linear-gradient(135deg, var(--good), color-mix(in srgb, var(--good) 70%, var(--brand)))" } : undefined}
                            aria-label={`${m} — ${a}`}>
                            <I n={on ? "check" : "x"} size={14} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          <p className="text-[0.7rem] font-bold text-mute mt-3 flex items-center gap-1.5"><I n="info" size={13} /> صلاحيات مدير النظام على إدارة النظام محصّنة لمنع قفل النظام — التغييرات تُحفظ فوراً وتُسجّل في سجل التدقيق.</p>
        </div>
      )}
      {tab === "org" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Directory conf={{
            coll: "branches", title: "الفروع", icon: "bld", prefix: "BR", importKey: "branches",
            desc: "الهيكل التنظيمي — فروع الشركة وقياداتها",
            fields: [
              { k: "code", label: "الكود", req: true, uniq: true },
              { k: "name", label: "اسم الفرع", req: true, uniq: true },
              { k: "manager", label: "مدير الفرع", req: true },
              { k: "phone", label: "الهاتف" },
            ],
            cols: [
              { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
              { k: "name", label: "الفرع", render: (r) => <b>{r.name}{r.main === true && <span className="chip bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] ms-2">رئيسي</span>}</b> },
              { k: "manager", label: "المدير" },
              { k: "depts", label: "الأقسام", num: true, render: (r, a) => <span className="font-num">{a.db.departments.filter((d: any) => d.branch === r.id).length}</span> },
            ],
          }} />
          <Directory conf={{
            coll: "departments", title: "الأقسام", icon: "layers", prefix: "DP", importKey: "departments",
            desc: "أقسام كل فرع ومسؤولوها",
            fields: [
              { k: "code", label: "الكود", req: true, uniq: true },
              { k: "name", label: "اسم القسم", req: true },
              { k: "branch", label: "الفرع", type: "select", req: true, opts: app.db.branches.map((b: any) => ({ v: b.id, l: b.name })) },
              { k: "head", label: "رئيس القسم", req: true },
            ],
            cols: [
              { k: "code", label: "الكود", render: (r) => <span className="font-num font-bold" dir="ltr">{r.code}</span> },
              { k: "name", label: "القسم", render: (r) => <b>{r.name}</b> },
              { k: "branch", label: "الفرع", render: (r) => app.db.branches.find((b: any) => b.id === r.branch)?.name || "—" },
              { k: "head", label: "الرئيس" },
            ],
          }} />
        </div>
      )}
    </div>
  );
}

/* ═══════════ الإعدادات العامة ═══════════ */
function SettingsScreen() {
  const app = useApp();
  const [tab, setTab] = useState("fin");
  const s = app.settings;

  const Toggle = ({ v, on, label, hint }: { v: boolean; on: () => void; label: string; hint: string }) => (
    <button onClick={on} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-panel border border-line hover:border-[color-mix(in_srgb,var(--brand)_40%,transparent)] transition-colors text-start">
      <span className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${v ? "bg-[var(--good)]" : "bg-[color-mix(in_srgb,var(--mute)_30%,transparent)]"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${v ? "start-[22px]" : "start-0.5"}`} />
      </span>
      <span><b className="text-[0.82rem] block">{label}</b><span className="text-[0.68rem] text-mute font-medium">{hint}</span></span>
    </button>
  );

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="gear" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">الإعدادات العامة</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">تهيئة وتحكم كامل في سلوك النظام المالي والمحاسبي</p>
          </div>
        </div>
        <button className="btn btn-brand" onClick={() => { app.toast("حُفظت جميع الإعدادات العامة وطُبّقت فوراً", "ok"); }}><I n="save" size={16} /> حفظ الإعدادات</button>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line mb-5 px-1">
        {[["fin", "الإعدادات المالية", "coins"], ["num", "الترقيم والفواتير", "receipt"], ["db", "قاعدة البيانات", "db"], ["bak", "النسخ الاحتياطي", "server"]].map(([id, l, ic]) => (
          <button key={id} onClick={() => setTab(id)} className={`tabline flex items-center gap-1.5 px-3.5 py-2.5 text-[0.82rem] font-bold whitespace-nowrap transition-colors ${tab === id ? "on text-[var(--brand)]" : "text-mute hover:text-ink"}`}>
            <I n={ic} size={15} /> {l}
          </button>
        ))}
      </div>

      {tab === "fin" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-5 space-y-3.5">
            <h3 className="font-display font-bold text-base mb-1">المعايير المالية</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">نسبة الضريبة %</span><input type="number" className="input mt-1 font-num" value={s.vat} onChange={(e) => app.setSettings({ ...s, vat: +e.target.value })} /></label>
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">أقصى خصم مسموح %</span><input type="number" className="input mt-1 font-num" value={s.discMax} onChange={(e) => app.setSettings({ ...s, discMax: +e.target.value })} /></label>
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">خانات التقريب</span><input type="number" className="input mt-1 font-num" value={s.round} onChange={(e) => app.setSettings({ ...s, round: +e.target.value })} /></label>
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">بداية السنة المالية</span><input type="date" className="input mt-1 font-num" value={s.fiscalStart} onChange={(e) => app.setSettings({ ...s, fiscalStart: e.target.value })} /></label>
            </div>
            <p className="text-[0.7rem] font-bold text-mute flex items-center gap-1.5"><I n="info" size={13} /> نسبة الضريبة تُطبّق تلقائياً على كل الفواتير الجديدة</p>
          </div>
          <div className="card p-5 space-y-3">
            <h3 className="font-display font-bold text-base mb-1">قواعد الرقابة الداخلية</h3>
            <Toggle v={s.blockOverCredit} on={() => app.setSettings({ ...s, blockOverCredit: !s.blockOverCredit })} label="منع تجاوز الحد الائتماني" hint="رفض تلقائي لأي فاتورة بيع آجل تتجاوز حد العميل" />
            <Toggle v={!s.negStock} on={() => app.setSettings({ ...s, negStock: !s.negStock })} label="منع الرصيد السالب للمخزون" hint="رفض سندات الصرف التي تجعل الرصيد دون الصفر" />
            <Toggle v={s.requireCC} on={() => app.setSettings({ ...s, requireCC: !s.requireCC })} label="إلزامية مركز التكلفة" hint="كل قيد يومية يجب أن يحمل مركز تكلفة" />
            <Toggle v={s.lowStockAlert} on={() => app.setSettings({ ...s, lowStockAlert: !s.lowStockAlert })} label="تنبيهات الحد الأدنى" hint="إشعار فوري عند نزول صنف دون حد إعادة الطلب" />
            <Toggle v={s.autoNum} on={() => app.setSettings({ ...s, autoNum: !s.autoNum })} label="الترقيم التلقائي" hint="توليد أرقام السندات والفواتير تلقائياً دون تدخل" />
          </div>
        </div>
      )}

      {tab === "num" && (
        <div className="card p-5 max-w-3xl">
          <h3 className="font-display font-bold text-base mb-1">بادئات الترقيم والتكويد</h3>
          <p className="text-[0.76rem] text-mute font-bold mb-4">نمط الرقم: <span className="font-num" dir="ltr">PREFIX-السنة-####</span> — مثال <span className="font-num text-[var(--brand)]" dir="ltr">SIN-2026-0261</span></p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(s.prefixes).map(([k, v]) => (
              <label key={k} className="block">
                <span className="text-[0.72rem] font-bold text-soft">{({ SIN: "فاتورة مبيعات", PIN: "فاتورة مشتريات", SRT: "مرتجع مبيعات", GRN: "سند توريد", ISS: "سند صرف مخزني", TR: "سند تحويل", ADJ: "سند تسوية", JC: "جرد مخزني", JE: "قيد يومية", RC: "سند قبض", PV: "سند صرف", PR: "طلب شراء", QT: "عرض سعر" } as Record<string, string>)[k] || k}</span>
                <input className="input mt-1 font-num !py-2" dir="ltr" value={v} onChange={(e) => app.setSettings({ ...s, prefixes: { ...s.prefixes, [k]: e.target.value.toUpperCase() } })} />
              </label>
            ))}
          </div>
          <button className="btn btn-brand mt-5" onClick={() => app.toast("حُفظت بادئات الترقيم — ستُطبق على السندات القادمة", "ok")}><I n="save" size={15} /> حفظ البادئات</button>
        </div>
      )}

      {tab === "db" && <DatabaseSection />}
      {tab === "bak" && <BackupSection />}
    </div>
  );
}

function DatabaseSection() {
  const app = useApp();
  const [cfg, setCfg] = useState({ ...app.settings.dbCfg });
  const [testing, setTesting] = useState(false);
  const [conn, setConn] = useState<{ ok: boolean; ping: number } | null>(null);
  const [steps, setSteps] = useState([true, true, true, false]);
  const stepLabels = ["تثبيت حزمة النظام على الخادم", "إنشاء قاعدة البيانات واستيراد الهيكل (ERD)", "إدخال بيانات الترخيص والتفعيل", "تشغيل خدمة المزامنة التلقائية"];

  const test = () => {
    setTesting(true); setConn(null);
    setTimeout(() => {
      const ok = !!cfg.host && !!cfg.name && cfg.port > 0;
      setConn({ ok, ping: 6 + Math.floor(Math.random() * 18) });
      setTesting(false);
      app.toast(ok ? `تم الاتصال بخادم MySQL بنجاح — زمن الاستجابة ${6 + Math.floor(Math.random() * 18)}ms` : "فشل الاتصال — راجع بيانات الاتصال", ok ? "ok" : "err");
    }, 900);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="card p-5">
        <h3 className="font-display font-bold text-base mb-1 flex items-center gap-2"><I n="db" size={19} className="text-[var(--brand)]" /> الاتصال المركزي — MySQL</h3>
        <p className="text-[0.72rem] text-mute font-bold mb-4">بيانات اتصال قاعدة البيانات الرئيسية للنظام</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">Host (الخادم)</span><input className="input mt-1 font-num" dir="ltr" value={cfg.host} onChange={(e) => setCfg({ ...cfg, host: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Port</span><input type="number" className="input mt-1 font-num" dir="ltr" value={cfg.port} onChange={(e) => setCfg({ ...cfg, port: +e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Database Name</span><input className="input mt-1 font-num" dir="ltr" value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Username</span><input className="input mt-1 font-num" dir="ltr" value={cfg.user} onChange={(e) => setCfg({ ...cfg, user: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Password</span><input type="password" className="input mt-1 font-num" dir="ltr" value={cfg.pass} onChange={(e) => setCfg({ ...cfg, pass: e.target.value })} placeholder="••••••••" /></label>
          <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">محرك التخزين</span>
            <select className="select mt-1" value={cfg.engine} onChange={(e) => setCfg({ ...cfg, engine: e.target.value })}>
              {["InnoDB", "MyISAM", "Memory"].map((x) => <option key={x}>{x}</option>)}
            </select></label>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn btn-soft flex-1" onClick={test} disabled={testing}><I n="pulse" size={15} /> {testing ? "جارٍ الاختبار…" : "اختبار الاتصال"}</button>
          <button className="btn btn-brand flex-1" onClick={() => { app.setSettings({ ...app.settings, dbCfg: cfg }); app.toast("حُفظت إعدادات الاتصال بقاعدة البيانات", "ok"); }}><I n="save" size={15} /> حفظ الإعدادات</button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="card p-5">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="server" size={19} className="text-[var(--good)]" /> حالة التشغيل</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-panel rounded-xl p-3 text-center">
              <span className={`w-3 h-3 rounded-full inline-block mb-1.5 ${conn?.ok ? "bg-[var(--good)] blink" : "bg-[var(--mute)]"}`} />
              <div className="text-[0.68rem] font-bold text-mute">الخادم</div>
              <div className={`font-bold text-[0.85rem] ${conn?.ok ? "text-[var(--good)]" : "text-mute"}`}>{conn ? (conn.ok ? "متصل" : "غير متصل") : "لم يُختبر"}</div>
            </div>
            <div className="bg-panel rounded-xl p-3 text-center">
              <div className="font-num font-bold text-xl text-[var(--brand)]">{conn?.ok ? `${conn.ping}ms` : "—"}</div>
              <div className="text-[0.68rem] font-bold text-mute mt-1">زمن الاستجابة (Ping)</div>
            </div>
            <div className="bg-panel rounded-xl p-3 text-center">
              <div className="font-num font-bold text-xl">8.0.36</div>
              <div className="text-[0.68rem] font-bold text-mute mt-1">إصدار MySQL</div>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-[0.72rem] font-bold text-soft">
            <div className="flex justify-between"><span className="text-mute">حجم قاعدة البيانات</span><span className="font-num">1.84 GB</span></div>
            <div className="flex justify-between"><span className="text-mute">عدد الجداول</span><span className="font-num">47 جدولاً</span></div>
            <div className="flex justify-between"><span className="text-mute">اتصالات نشطة</span><span className="font-num">12 / 150</span></div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="key" size={19} className="text-[var(--warn)]" /> خطوات التفعيل والترخيص</h3>
          <div className="space-y-2.5">
            {stepLabels.map((l, i) => (
              <div key={l} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${steps[i] ? "border-[color-mix(in_srgb,var(--good)_30%,transparent)] bg-[color-mix(in_srgb,var(--good)_6%,transparent)]" : "border-line bg-panel"}`}>
                <button className={`w-7 h-7 rounded-full grid place-items-center shrink-0 transition-all ${steps[i] ? "bg-[var(--good)] text-white" : "bg-panel border border-line text-mute hover:text-[var(--brand)]"}`}
                  onClick={() => setSteps(steps.map((x, j) => (j === i ? !x : x)))} aria-label={l}>
                  <I n={steps[i] ? "check" : String(i + 1)} size={13} />
                </button>
                <span className="text-[0.8rem] font-bold flex-1">{l}</span>
                <span className={`text-[0.64rem] font-bold ${steps[i] ? "text-[var(--good)]" : "text-mute"}`}>{steps[i] ? "مكتملة" : "قيد التنفيذ"}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-panel border border-line">
            <div className="flex items-center justify-between text-[0.74rem] font-bold">
              <span className="text-mute">مفتاح الترخيص</span>
              <span className="font-num text-[var(--brand)]" dir="ltr">OKY-2026-IFS-9F3K-77A1</span>
            </div>
            <div className="flex items-center justify-between text-[0.7rem] font-bold mt-1.5">
              <span className="text-mute">النسخة</span><span>مؤسسات — 25 مستخدماً • تنتهي 2027-01-15</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackupSection() {
  const app = useApp();
  const [backups, setBackups] = useState([
    { id: 1, name: "ifs_full_20260328_0200.sql.gz", size: "1.2 GB", kind: "كاملة", date: "2026-03-28 02:00", ok: true },
    { id: 2, name: "ifs_diff_20260329_0200.sql.gz", size: "186 MB", kind: "تفاضلية", date: "2026-03-29 02:00", ok: true },
    { id: 3, name: "ifs_diff_20260327_0200.sql.gz", size: "174 MB", kind: "تفاضلية", date: "2026-03-27 02:00", ok: true },
  ]);
  const [path, setPath] = useState("/var/backups/okyanus-ifs/");
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="card p-5">
        <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="save" size={19} className="text-[var(--brand)]" /> ملفات الحزمة والنسخ الاحتياطي</h3>
        <label className="block"><span className="text-[0.74rem] font-bold text-soft">مسار حفظ النسخ الاحتياطية</span>
          <input className="input mt-1 font-num" dir="ltr" value={path} onChange={(e) => setPath(e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <label className="block"><span className="text-[0.72rem] font-bold text-soft">النسخ الكامل</span><select className="select mt-1">{["يومياً 02:00", "أسبوعياً", "شهرياً"].map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="block"><span className="text-[0.72rem] font-bold text-soft">التفاضلي</span><select className="select mt-1">{["يومياً 02:00", "كل 12 ساعة", "كل 6 ساعات"].map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
        <button className="btn btn-brand w-full mt-4" onClick={() => { setBackups([{ id: Date.now(), name: `ifs_manual_${Date.now()}.sql.gz`, size: "1.2 GB", kind: "يدوية", date: "2026-03-29 الآن", ok: true }, ...backups]); app.toast("بدأ النسخ الاحتياطي اليدوي — سيكتمل خلال دقائق", "ok"); }}>
          <I n="plus" size={15} /> نسخة احتياطية الآن
        </button>
        <button className="btn btn-ghost w-full mt-2" onClick={() => app.toast("فُتحت لوحة ملفات المرفقات (الفواتير المصورة والعقود)", "info")}><I n="clip" size={15} /> إدارة ملفات المرفقات</button>
      </div>
      <div className="card p-5 lg:col-span-2 overflow-hidden">
        <h3 className="font-display font-bold text-base mb-3">سجل النسخ الاحتياطية</h3>
        <table className="tbl">
          <thead><tr><th>الملف</th><th>النوع</th><th>الحجم</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.id}>
                <td className="font-num text-[0.74rem]" dir="ltr">{b.name}</td>
                <td><span className="chip bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)]">{b.kind}</span></td>
                <td className="font-num">{b.size}</td>
                <td className="font-num text-mute">{b.date}</td>
                <td><Chip s="مرحّل" /></td>
                <td><div className="flex gap-1">
                  <button className="btn btn-ghost !p-1.5" title="استعادة" onClick={() => app.toast(`بدأت استعادة ${b.name} — ستتوقف الكتابة مؤقتاً`, "info")}><I n="undo" size={14} /></button>
                  <button className="btn btn-danger !p-1.5" title="حذف" onClick={() => { setBackups(backups.filter((x) => x.id !== b.id)); app.toast("حُذف ملف النسخة", "err"); }}><I n="trash" size={14} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════ التفضيلات ═══════════ */
const THEMES = [
  { id: "azure", name: "السماوي (افتراضي)", sw: ["#0284c7", "#38bdf8"] },
  { id: "light", name: "الفاتح", sw: ["#e2e8f0", "#0284c7"] },
  { id: "night", name: "الداكن", sw: ["#0d1b2a", "#38bdf8"] },
  { id: "indigo", name: "النيلي", sw: ["#3730a3", "#818cf8"] },
  { id: "gold", name: "الذهبي", sw: ["#b45309", "#fbbf24"] },
];

function PrefsScreen() {
  const app = useApp();
  const pr = app.prefs;
  return (
    <div className="anim-fadein">
      <div className="flex items-center gap-3.5 mb-5">
        <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="palette" size={23} /></span>
        <div>
          <h1 className="font-display font-bold text-2xl leading-tight">التفضيلات</h1>
          <p className="text-mute text-[0.82rem] font-medium mt-0.5">مظهر النظام ولغته وتنسيقاته — تُحفظ لكل مستخدم وتُطبّق فوراً على كل الشاشات</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="palette" size={18} className="text-[var(--brand)]" /> نمط المظهر — 5 أنماط احترافية</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => { app.setPrefs({ theme: t.id }); app.toast(`طُبّق نمط «${t.name}» على النظام بالكامل`, "ok"); }}
                className={`p-3 rounded-xl border-2 text-start transition-all hover:scale-[1.02] ${pr.theme === t.id ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_7%,transparent)]" : "border-line bg-panel"}`}>
                <div className="flex gap-1 mb-2">{t.sw.map((c, i) => <span key={i} className="w-6 h-6 rounded-full border border-black/10" style={{ background: c }} />)}</div>
                <div className="text-[0.76rem] font-bold flex items-center gap-1.5">{t.name}{pr.theme === t.id && <I n="check" size={13} className="text-[var(--brand)]" />}</div>
              </button>
            ))}
          </div>
          <h4 className="font-display font-bold text-sm mt-5 mb-2.5">خلفية الشريط الجانبي</h4>
          <div className="grid grid-cols-3 gap-2.5">
            {SIDEBAR_BGS.map((b) => (
              <button key={b.id} onClick={() => app.setPrefs({ sidebarBg: b.id })}
                className={`h-14 rounded-lg border-2 transition-all relative overflow-hidden ${pr.sidebarBg === b.id ? "border-[var(--brand)] scale-[1.03]" : "border-transparent hover:scale-[1.02]"}`}
                style={{ background: b.style }} title={b.name} aria-label={b.name}>
                {pr.sidebarBg === b.id && <span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><I n="check" size={18} /></span>}
              </button>
            ))}
          </div>
          <h4 className="font-display font-bold text-sm mt-5 mb-2.5">خلفية شاشة تسجيل الدخول</h4>
          <div className="grid grid-cols-3 gap-2.5">
            {LOGIN_BGS.map((b) => (
              <button key={b.id} onClick={() => app.setPrefs({ loginBg: b.id })}
                className={`h-14 rounded-lg border-2 transition-all relative overflow-hidden ${pr.loginBg === b.id ? "border-[var(--brand)] scale-[1.03]" : "border-transparent hover:scale-[1.02]"}`}
                style={{ background: b.style }} title={b.name} aria-label={b.name}>
                {pr.loginBg === b.id && <span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><I n="check" size={18} /></span>}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="file" size={18} className="text-[var(--accent)]" /> اللغة والتنسيقات</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[0.78rem] font-bold mb-1.5"><span>حجم الخط</span><span className="font-num text-[var(--brand)]">{pr.font}%</span></div>
                <input type="range" min={85} max={120} step={5} value={pr.font} onChange={(e) => app.setPrefs({ font: +e.target.value })} className="w-full" />
              </div>
              <div>
                <div className="text-[0.78rem] font-bold mb-1.5">اتجاه الواجهة</div>
                <div className="flex rounded-xl border border-line overflow-hidden">
                  {([["rtl", "عربي RTL"], ["ltr", "English LTR"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => { app.setPrefs({ dir: v }); app.toast(v === "rtl" ? "اتجاه الواجهة: من اليمين لليسار" : "Interface direction: LTR"); }}
                      className={`flex-1 py-2 text-[0.8rem] font-bold transition-colors ${pr.dir === v ? "text-[var(--brandink)]" : "bg-surface text-mute hover:text-ink"}`}
                      style={pr.dir === v ? { background: "linear-gradient(135deg, var(--brand), var(--brand2))" } : undefined}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="text-[0.76rem] font-bold text-soft">تنسيق الأرقام</span>
                  <select className="select mt-1" value={pr.nums} onChange={(e) => app.setPrefs({ nums: e.target.value as any })}>
                    <option value="west">غربية (1,234,567)</option>
                    <option value="ar">عربية (١٬٢٣٤٬٥٦٧)</option>
                    <option value="plain">مجردة (1234567)</option>
                  </select></label>
                <label className="block"><span className="text-[0.76rem] font-bold text-soft">تنسيق التاريخ</span>
                  <select className="select mt-1" value={pr.dates} onChange={(e) => app.setPrefs({ dates: e.target.value as any })}>
                    <option value="iso">ISO (2026-03-29)</option>
                    <option value="dmy">يوم/شهر/سنة</option>
                    <option value="long">29 مارس 2026</option>
                  </select></label>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="bell" size={18} className="text-[var(--warn)]" /> إعدادات الإشعارات</h3>
            <div className="space-y-2.5">
              {[
                { k: "notifSys" as const, l: "إشعارات داخل النظام", h: "تنبيهات فورية للحدود الائتمانية والمخزون والإقفالات" },
                { k: "notifEmail" as const, l: "ملخص بريدي يومي", h: "تقرير حركة اليوم على بريدك عند إغلاق الدوام" },
              ].map((t) => (
                <button key={t.k} onClick={() => app.setPrefs({ [t.k]: !pr[t.k] } as any)} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-panel border border-line hover:border-[color-mix(in_srgb,var(--brand)_40%,transparent)] transition-colors text-start">
                  <span className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${pr[t.k] ? "bg-[var(--good)]" : "bg-[color-mix(in_srgb,var(--mute)_30%,transparent)]"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pr[t.k] ? "start-[22px]" : "start-0.5"}`} />
                  </span>
                  <span><b className="text-[0.82rem] block">{t.l}</b><span className="text-[0.68rem] text-mute font-medium">{t.h}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="text-[0.72rem] font-bold text-mute mt-4 flex items-center gap-1.5"><I n="info" size={14} className="text-[var(--brand)]" /> تُحفظ تفضيلاتك باسم المستخدم {app.session?.user} وتُطبّق على {SYSTEM.name} v{SYSTEM.version} في كل جلساتك.</p>
    </div>
  );
}
