import { useState } from "react";
import { useApp } from "../store";
import { I, Modal, PageHead, Reveal, Tabs } from "../ui";
import { LOGIN_BGS } from "./Login";

export default function Admin() {
  const app = useApp();
  const [tab, setTab] = useState(app.route.tab || "users");

  return (
    <div>
      <PageHead icon="shield" title="إدارة النظام" desc="المستخدمون والصلاحيات الدقيقة، الإعدادات المالية، قاعدة البيانات، والتفضيلات" />
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "users", label: "المستخدمون والصلاحيات", icon: "users" },
        { id: "settings", label: "الإعدادات العامة", icon: "gear" },
        { id: "database", label: "قاعدة البيانات", icon: "db" },
        { id: "prefs", label: "التفضيلات والمظهر", icon: "palette" },
      ]} />
      {tab === "users" && <UsersTab />}
      {tab === "settings" && <SettingsTab />}
      {tab === "database" && <DatabaseTab />}
      {tab === "prefs" && <PrefsTab />}
    </div>
  );
}

/* ═══════════════ المستخدمون والصلاحيات ═══════════════ */
function UsersTab() {
  const app = useApp();
  const [show, setShow] = useState(false);
  const [role, setRole] = useState(app.roles[1]);
  const [nu, setNu] = useState({ name: "", username: "", branch: "المركز الرئيسي — صنعاء" });

  return (
    <div className="grid xl:grid-cols-5 gap-4 anim-fadein">
      <Reveal className="xl:col-span-2"><div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line bg-panel flex items-center justify-between">
          <h3 className="font-display font-bold text-sm">المستخدمون النشطون</h3>
          <button className="btn btn-brand !py-1.5 !text-[0.74rem]" onClick={() => setShow(true)}><I n="plus" size={14} /> مستخدم</button>
        </div>
        <div className="divide-y divide-[color-mix(in_srgb,var(--line)_65%,transparent)]">
          {app.users.map((u) => (
            <div key={u.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[color-mix(in_srgb,var(--brand)_4%,transparent)] transition-colors">
              <span className={`w-10 h-10 rounded-full grid place-items-center font-display font-bold text-sm ${u.active ? "bg-[color-mix(in_srgb,var(--brand)_13%,transparent)] text-[var(--brand)]" : "bg-[color-mix(in_srgb,var(--mute)_16%,transparent)] text-[var(--mute)]"}`}>{u.name.slice(0, 2)}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[0.86rem] flex items-center gap-2">{u.name} {!u.active && <span className="chip bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-[var(--bad)]">موقوف</span>}</div>
                <div className="text-[0.68rem] text-mute font-bold font-num" dir="ltr">@{u.username} • {u.lastLogin}</div>
                <div className="text-[0.68rem] text-mute font-bold">{u.role} — {u.branch}</div>
              </div>
              <button className="btn btn-ghost !p-2" onClick={() => { app.toggleUser(u.id); app.toast(u.active ? `أُوقف المستخدم ${u.name}` : `فُعّل المستخدم ${u.name}`, "info"); }} title="تفعيل/إيقاف">
                <I n={u.active ? "lock" : "unlock"} size={15} />
              </button>
            </div>
          ))}
        </div>
      </div></Reveal>

      <Reveal className="xl:col-span-3" delay={80}><div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-line bg-panel">
          <h3 className="font-display font-bold text-sm">مصفوفة الصلاحيات — مستوى الشاشة والزر والتقرير</h3>
          <p className="text-[0.7rem] text-mute font-bold mt-0.5">الدور المحدد: <span className="text-[var(--brand)]">{role}</span> — التغييرات تُحفظ في سجل التدقيق فوراً</p>
        </div>
        <div className="p-4">
          <select className="select !w-64 mb-4" value={role} onChange={(e) => setRole(e.target.value)}>
            {app.roles.map((r) => <option key={r}>{r}</option>)}
          </select>
          <div className="overflow-x-auto">
            <table className="tbl min-w-[620px]">
              <thead><tr><th>الوحدة / الشاشة</th>{app.permActions.map((a) => <th key={a} className="text-center">{a}</th>)}</tr></thead>
              <tbody>
                {app.permModules.map((m) => (
                  <tr key={m}>
                    <td className="font-bold">{m}</td>
                    {app.permActions.map((a) => {
                      const key = `${m}|${a}`;
                      return (
                        <td key={a} className="text-center">
                          <button onClick={() => { app.togglePerm(key); }} aria-label={`${m} ${a}`}
                            className={`w-7 h-7 rounded-lg grid place-items-center mx-auto transition-all ${app.perms[key] ? "bg-[var(--brand)] text-[var(--brandink)] shadow-md" : "bg-panel border border-line text-transparent hover:border-[var(--brand)]"}`}>
                            <I n="check" size={14} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[0.72rem] font-bold text-mute flex items-center gap-1.5">
            <I n="shield" size={14} className="text-[var(--good)]" /> {Object.values(app.perms).filter(Boolean).length} صلاحية ممنوحة من أصل {Object.keys(app.perms).length} — تُطبَّق على مستوى الـ API أيضاً (JWT Claims).
          </div>
        </div>
      </div></Reveal>

      <Modal open={show} onClose={() => setShow(false)} title="إضافة مستخدم جديد" icon="user">
        <div className="space-y-3">
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الاسم الكامل</span><input className="input mt-1" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">اسم المستخدم</span><input className="input mt-1 font-num" dir="ltr" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} /></label>
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">الدور الوظيفي</span><select className="select mt-1" value={role} onChange={(e) => setRole(e.target.value)}>{app.roles.map((r) => <option key={r}>{r}</option>)}</select></label>
          </div>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">الفرع</span>
            <select className="select mt-1" value={nu.branch} onChange={(e) => setNu({ ...nu, branch: e.target.value })}>
              {["المركز الرئيسي — صنعاء", "فرع عدن", "فرع المكلا"].map((b) => <option key={b}>{b}</option>)}
            </select></label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-ghost" onClick={() => setShow(false)}>إلغاء</button>
          <button className="btn btn-brand" onClick={() => {
            if (!nu.name.trim() || !nu.username.trim()) { app.toast("أكمل بيانات المستخدم", "err"); return; }
            app.addUser({ id: `U-0${app.users.length + 1}`, name: nu.name, username: nu.username, role, branch: nu.branch, active: true, lastLogin: "—" });
            setShow(false);
          }}><I n="check" size={15} /> إنشاء الحساب</button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════ الإعدادات العامة ═══════════════ */
function SettingsTab() {
  const app = useApp();
  const [fin, setFin] = useState({ prefix: "SIN-2026-", vat: 5, maxDisc: 15, decimals: 2, autoNum: true, round: "0.05" });
  return (
    <div className="grid lg:grid-cols-2 gap-4 anim-fadein">
      <Reveal><div className="card p-5">
        <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2"><I n="receipt" size={18} className="text-[var(--brand)]" /> ترقيم المستندات والفواتير</h3>
        <div className="space-y-3">
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">بادئة ترقيم فواتير المبيعات</span>
            <div className="flex gap-2 mt-1"><input className="input font-num" dir="ltr" value={fin.prefix} onChange={(e) => setFin({ ...fin, prefix: e.target.value })} />
              <span className="input !w-24 text-center font-num text-mute" dir="ltr">0{251 + app.sales.length}</span></div>
            <span className="text-[0.66rem] text-mute font-bold">المعاينة: <span className="font-num" dir="ltr">{fin.prefix}0{251 + app.sales.length}</span></span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">نسبة الضريبة %</span><input type="number" className="input mt-1 font-num" value={fin.vat} onChange={(e) => setFin({ ...fin, vat: +e.target.value })} /></label>
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">سقف الخصم المسموح %</span><input type="number" className="input mt-1 font-num" value={fin.maxDisc} onChange={(e) => setFin({ ...fin, maxDisc: +e.target.value })} /></label>
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">الخانات العشرية</span>
              <select className="select mt-1" value={fin.decimals} onChange={(e) => setFin({ ...fin, decimals: +e.target.value })}><option value={0}>0</option><option value={2}>2</option><option value={3}>3</option></select></label>
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">التقريب النقدي</span>
              <select className="select mt-1 font-num" value={fin.round} onChange={(e) => setFin({ ...fin, round: e.target.value })}><option value="0.05">0.05</option><option value="0.25">0.25</option><option value="0.50">0.50</option><option value="1">1.00</option></select></label>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg bg-panel">
            <input type="checkbox" className="cbx" checked={fin.autoNum} onChange={(e) => setFin({ ...fin, autoNum: e.target.checked })} />
            <span className="text-[0.8rem] font-bold">الترقيم التسلسلي التلقائي (يمنع التكرار والفجوات)</span>
          </label>
        </div>
      </div></Reveal>

      <Reveal delay={80}><div className="card p-5">
        <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2"><I n="gear" size={18} className="text-[var(--brand)]" /> سياسات النظام المالي</h3>
        <div className="space-y-2.5">
          {[
            ["lock", "منع الترحيل للفترات المقفلة (إلزامي)", true, true],
            ["check", "فرض توازن القيد قبل الحفظ (مدين = دائن)", true, true],
            ["alert", "تنبيه عند تجاوز الحد الائتماني للعميل", true, false],
            ["undo", "السماح بالتراجع عن الأذونات المخزنية مع عكس الكميات", true, false],
            ["eye", "تسجيل جميع عمليات الحذف في دفتر التدقيق", true, true],
            ["coins", "إعادة تقييم العملات الأجنبية نهاية كل فترة", false, false],
          ].map(([ic, l, on, locked]: any) => (
            <div key={l} className="flex items-center justify-between p-3 rounded-lg bg-panel border border-line/70">
              <span className="flex items-center gap-2.5 text-[0.8rem] font-bold"><I n={ic} size={16} className="text-[var(--brand)]" /> {l}</span>
              <span className={`chip ${on ? "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]" : "bg-[color-mix(in_srgb,var(--mute)_15%,transparent)] text-[var(--mute)]"}`}>{locked ? "مفروضة" : on ? "مفعّلة" : "متوقفة"}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-brand w-full mt-4" onClick={() => app.toast("حُفظت الإعدادات المالية وطُبّقت على الفترات المفتوحة", "ok")}><I n="save" size={16} /> حفظ الإعدادات</button>
      </div></Reveal>
    </div>
  );
}

/* ═══════════════ قاعدة البيانات ═══════════════ */
function DatabaseTab() {
  const app = useApp();
  const [conn, setConn] = useState({ host: "192.168.1.10", port: "3306", user: "okyanus_admin", pass: "••••••••••", db: "okyanus_erp_v3" });
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ on: boolean; ping: number } | null>({ on: true, ping: 4 });
  const [license, setLicense] = useState({ key: "", machine: "SRV-OKY-2026-A11F", state: "مفعّلة حتى 2027-01-15" });
  const [path, setPath] = useState("/var/backups/okyanus-erp");

  const test = () => {
    setTesting(true); setStatus(null);
    setTimeout(() => {
      const ok = conn.host.trim().length > 3 && conn.db.trim().length > 0;
      setStatus({ on: ok, ping: 3 + Math.floor(Math.random() * 9) });
      setTesting(false);
      app.toast(ok ? "تم الاتصال بخادم MySQL بنجاح" : "تعذّر الاتصال — تحقق من Host والمنفذ", ok ? "ok" : "err");
    }, 1300);
  };

  return (
    <div className="grid xl:grid-cols-2 gap-4 anim-fadein">
      {/* الاتصال المركزي */}
      <Reveal><div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-base flex items-center gap-2"><I n="db" size={19} className="text-[var(--brand)]" /> الاتصال المركزي — MySQL 8.4</h3>
          {status && (
            <span className={`chip ${status.on ? "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]" : "bg-[color-mix(in_srgb,var(--bad)_13%,transparent)] text-[var(--bad)]"}`}>
              <span className={`w-2 h-2 rounded-full ${status.on ? "bg-[var(--good)] blink" : "bg-[var(--bad)]"}`} />
              {status.on ? `متصل — Ping ${status.ping}ms` : "غير متصل"}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">Host / عنوان الخادم</span><input className="input mt-1 font-num" dir="ltr" value={conn.host} onChange={(e) => setConn({ ...conn, host: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Port</span><input className="input mt-1 font-num" dir="ltr" value={conn.port} onChange={(e) => setConn({ ...conn, port: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Username</span><input className="input mt-1 font-num" dir="ltr" value={conn.user} onChange={(e) => setConn({ ...conn, user: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Password</span><input className="input mt-1 font-num" dir="ltr" type="password" value={conn.pass} onChange={(e) => setConn({ ...conn, pass: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Database</span><input className="input mt-1 font-num" dir="ltr" value={conn.db} onChange={(e) => setConn({ ...conn, db: e.target.value })} /></label>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn btn-soft flex-1" onClick={test} disabled={testing}>
            {testing ? <><span className="w-4 h-4 border-2 border-[var(--brand)]/30 border-t-[var(--brand)] rounded-full spin" /> جارٍ الفحص…</> : <><I n="pulse" size={16} /> اختبار الاتصال</>}
          </button>
          <button className="btn btn-brand flex-1" onClick={() => app.toast("حُفظت إعدادات الاتصال وأُعيد تشغيل تجمع الاتصالات (Pool)", "ok")}><I n="save" size={16} /> حفظ الإعدادات</button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[["12", "اتصال نشط"], ["96 MB", "ذاكرة التخزين المؤقت"], ["0", "استعلامات عالقة"]].map(([a, b]) => (
            <div key={b} className="bg-panel rounded-lg py-2.5"><div className="font-num font-bold text-[var(--brand)]">{a}</div><div className="text-[0.64rem] font-bold text-mute">{b}</div></div>
          ))}
        </div>
      </div></Reveal>

      {/* حالة التشغيل */}
      <Reveal delay={70}><div className="card p-5">
        <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2"><I n="server" size={19} className="text-[var(--accent)]" /> حالة التشغيل (Operation Status)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-line bg-panel">
            <div className="text-[0.7rem] font-bold text-mute">خادم قاعدة البيانات</div>
            <div className={`font-display font-bold text-lg mt-1 ${status?.on ? "text-[var(--good)]" : "text-[var(--bad)]"}`}>{status ? (status.on ? "متصل" : "غير متصل") : "جارٍ الفحص…"}</div>
            <div className="font-num text-[0.66rem] text-mute mt-0.5" dir="ltr">mysql://{conn.host}:{conn.port}/{conn.db}</div>
          </div>
          <div className="p-4 rounded-xl border border-line bg-panel">
            <div className="text-[0.7rem] font-bold text-mute">زمن الاستجابة (Ping)</div>
            <div className="font-num font-bold text-lg mt-1 text-[var(--brand)]">{status?.ping ?? "—"} ms</div>
            <div className="flex gap-[3px] mt-2 items-end" aria-hidden="true">
              {[5, 8, 4, 7, 6, 9, 4, 6, 8, 5, 7, 4].map((v, i) => <span key={i} className="w-2 rounded-sm bg-[var(--accent)]/70" style={{ height: v * 2.4 }} />)}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {[["Uptime", "99.98% (آخر 90 يوماً)", "var(--good)"], ["آخر نسخة احتياطية", "اليوم 06:00 — تفاضلي", "var(--brand)"], ["حجم قاعدة البيانات", "8.7 GB — 42 جدولاً", "var(--accent)"], ["محركات الجداول", "InnoDB مع تشفير AES-256", "var(--warn)"]].map(([a, b, c]) => (
            <div key={a} className="flex items-center justify-between p-2.5 rounded-lg bg-panel border border-line/70 text-[0.78rem] font-bold">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: c }} /> {a}</span>
              <span className="text-mute font-medium font-num">{b}</span>
            </div>
          ))}
        </div>
      </div></Reveal>

      {/* التفعيل */}
      <Reveal><div className="card p-5">
        <h3 className="font-display font-bold text-base mb-1 flex items-center gap-2"><I n="key" size={19} className="text-[var(--warn)]" /> خطوات التفعيل والترخيص</h3>
        <p className="text-[0.74rem] text-mute font-bold mb-4">النسخة الحالية: <span className="text-[var(--good)]">{license.state}</span></p>
        <div className="space-y-3">
          {[["1", "نسخ معرف الجهاز", license.machine, true], ["2", "إرسال المعرف لفريق أوكيانوس سوفت", "عبر okyanussoft.online/license", true], ["3", "إدخال مفتاح التفعيل", "", false]].map(([n, t, d, done]: any) => (
            <div key={n} className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full grid place-items-center font-num font-bold shrink-0 ${done ? "bg-[var(--good)] text-white" : "bg-panel border-2 border-dashed border-[var(--brand)] text-[var(--brand)]"}`}>{done ? <I n="check" size={15} /> : n}</span>
              <div className="flex-1"><div className="text-[0.82rem] font-bold">{t}</div>{d && <div className="font-num text-[0.68rem] text-mute" dir="ltr">{d}</div>}</div>
            </div>
          ))}
          <div className="flex gap-2">
            <input className="input font-num" dir="ltr" placeholder="OKY-3.0-XXXX-XXXX-XXXX" value={license.key} onChange={(e) => setLicense({ ...license, key: e.target.value })} />
            <button className="btn btn-brand shrink-0" onClick={() => {
              if (license.key.replace(/[^a-zA-Z0-9]/g, "").length < 12) { app.toast("مفتاح التفعيل غير صالح — يجب أن يتكون من 16 خانة", "err"); return; }
              app.toast("تم تفعيل الترخيص حتى 2028-01-15 وتمديد الدعم الفني", "ok");
            }}><I n="check" size={15} /> تفعيل</button>
          </div>
        </div>
      </div></Reveal>

      {/* النسخ الاحتياطي */}
      <Reveal delay={70}><div className="card p-5">
        <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2"><I n="save" size={19} className="text-[var(--brand)]" /> ملفات الحزمة والنسخ الاحتياطي</h3>
        <label className="block mb-3"><span className="text-[0.74rem] font-bold text-soft">مسار حفظ النسخ والملفات المرفقة</span>
          <div className="flex gap-2 mt-1">
            <input className="input font-num" dir="ltr" value={path} onChange={(e) => setPath(e.target.value)} />
            <button className="btn btn-ghost shrink-0" onClick={() => app.toast("تم التحقق من المسار — 142 GB متاحة", "ok")}><I n="check" size={15} /> تحقق</button>
          </div>
        </label>
        <div className="flex gap-2 mb-3">
          <button className="btn btn-brand flex-1" onClick={() => { app.addBackup({ id: `BK-0${app.backups.length + 1}`, name: `OkyanusERP_Full_2026-03-29.sql.gz`, size: "2.4 GB", date: "2026-03-29 الآن", kind: "كامل" }); app.toast("اكتمل النسخ الاحتياطي الكامل وتم التحقق من سلامة الملف (Checksum)", "ok"); }}><I n="save" size={16} /> نسخة احتياطية الآن</button>
          <button className="btn btn-ghost" onClick={() => app.toast("جُدولت مهمة النسخ اليومي الساعة 02:00 فجراً", "info")}><I n="clock" size={16} /> جدولة</button>
        </div>
        <div className="space-y-2 max-h-44 overflow-auto">
          {app.backups.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-panel border border-line/70">
              <I n="file" size={17} className="text-[var(--brand)] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-num text-[0.72rem] font-bold truncate" dir="ltr">{b.name}</div>
                <div className="text-[0.64rem] text-mute font-bold">{b.kind} • {b.size} • {b.date}</div>
              </div>
              <button className="btn btn-ghost !p-1.5" onClick={() => app.toast(`بدأ تنزيل ${b.name}`, "info")} title="تنزيل"><I n="down" size={14} /></button>
            </div>
          ))}
        </div>
      </div></Reveal>
    </div>
  );
}

/* ═══════════════ التفضيلات ═══════════════ */
export function PrefsTab() {
  const app = useApp();
  const { prefs, setPrefs } = app;
  const themes = [
    { id: "azure", name: "السماوي (افتراضي)", g: "linear-gradient(135deg,#0c7ec8,#00b4c5)" },
    { id: "light", name: "الفاتح", g: "linear-gradient(135deg,#2b6cb0,#319795)" },
    { id: "night", name: "الداكن", g: "linear-gradient(135deg,#111b2c,#38a8e8)" },
    { id: "indigo", name: "النيلي", g: "linear-gradient(135deg,#4f46e5,#0ea5b7)" },
    { id: "gold", name: "الذهبي", g: "linear-gradient(135deg,#a87b1c,#157a8c)" },
  ];
  return (
    <div className="grid lg:grid-cols-2 gap-4 anim-fadein">
      <Reveal><div className="card p-5">
        <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2"><I n="palette" size={19} className="text-[var(--brand)]" /> المظهر — 5 أنماط احترافية</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {themes.map((t) => (
            <button key={t.id} onClick={() => { setPrefs({ theme: t.id }); app.toast(`فُعّل نمط «${t.name}»`, "ok"); }}
              className={`relative rounded-xl overflow-hidden border-2 transition-all text-start ${prefs.theme === t.id ? "border-[var(--brand)] shadow-lg scale-[1.02]" : "border-line hover:border-[color-mix(in_srgb,var(--brand)_45%,var(--line))]"}`}>
              <div className="h-16" style={{ background: t.g }} />
              <div className="px-3 py-2 bg-surface">
                <div className="text-[0.76rem] font-bold flex items-center justify-between">{t.name}
                  {prefs.theme === t.id && <I n="check" size={15} className="text-[var(--brand)]" />}
                </div>
              </div>
            </button>
          ))}
        </div>
        <h4 className="font-display font-bold text-sm mt-5 mb-2.5">خلفية الشريط الجانبي</h4>
        <div className="grid grid-cols-3 gap-2.5">
          {app.sidebarBgs.map((b) => (
            <button key={b.id} onClick={() => setPrefs({ sidebarBg: b.id })}
              className={`h-14 rounded-lg border-2 transition-all ${prefs.sidebarBg === b.id ? "border-[var(--brand)] scale-[1.03]" : "border-transparent hover:scale-[1.02]"}`}
              style={{ background: b.style }} title={b.name} aria-label={b.name} />
          ))}
        </div>
        <h4 className="font-display font-bold text-sm mt-5 mb-2.5">خلفية شاشة تسجيل الدخول</h4>
        <div className="grid grid-cols-3 gap-2.5">
          {LOGIN_BGS.map((b) => (
            <button key={b.id} onClick={() => { setPrefs({ loginBg: b.id }); app.toast(`ستظهر شاشة الدخول بنمط «${b.name}»`, "ok"); }}
              className={`h-14 rounded-lg border-2 transition-all relative overflow-hidden ${prefs.loginBg === b.id ? "border-[var(--brand)] scale-[1.03]" : "border-transparent hover:scale-[1.02]"}`}
              style={{ background: b.style }} title={b.name} aria-label={b.name}>
              {prefs.loginBg === b.id && <span className="absolute inset-0 grid place-items-center bg-black/25 text-white"><I n="check" size={18} /></span>}
            </button>
          ))}
        </div>
      </div></Reveal>

      <Reveal delay={70}><div className="card p-5 space-y-5">
        <div>
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="edit" size={18} className="text-[var(--brand)]" /> حجم الخط</h3>
          <div className="flex gap-2">
            {([["sm", "صغير"], ["md", "متوسط"], ["lg", "كبير"]] as const).map(([id, l]) => (
              <button key={id} onClick={() => setPrefs({ fontScale: id })} className={`btn flex-1 ${prefs.fontScale === id ? "btn-brand" : "btn-ghost"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="globe" size={18} className="text-[var(--brand)]" /> اتجاه الواجهة</h3>
          <div className="flex gap-2">
            <button className={`btn flex-1 ${prefs.dir === "rtl" ? "btn-brand" : "btn-ghost"}`} onClick={() => setPrefs({ dir: "rtl" })}>العربية — RTL</button>
            <button className={`btn flex-1 ${prefs.dir === "ltr" ? "btn-brand" : "btn-ghost"}`} onClick={() => setPrefs({ dir: "ltr" })}>English — LTR</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-[0.74rem] font-bold text-soft flex items-center gap-1.5"><I n="coins" size={14} /> تنسيق الأرقام</span>
            <select className="select mt-1" value={prefs.numFmt} onChange={(e) => setPrefs({ numFmt: e.target.value as any })}>
              <option value="west">1,234,567.89</option><option value="arabic">١٬٢٣٤٬٥٦٧٫٨٩</option><option value="plain">1234567.89</option>
            </select></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft flex items-center gap-1.5"><I n="cal" size={14} /> تنسيق التاريخ</span>
            <select className="select mt-1" value={prefs.dateFmt} onChange={(e) => setPrefs({ dateFmt: e.target.value as any })}>
              <option value="dmy">29/03/2026</option><option value="ymd">2026-03-29</option><option value="arlong">٢٩ مارس ٢٠٢٦</option>
            </select></label>
        </div>
        <div>
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="bell" size={18} className="text-[var(--brand)]" /> الإشعارات</h3>
          <div className="space-y-2">
            {([["period", "تنبيهات إقفال الفترات المالية"], ["credit", "تجاوز الحدود الائتمانية للعملاء"], ["stock", "الوصول للحد الأدنى للمخزون"], ["sounds", "نغمة تنبيه صوتية"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center justify-between p-3 rounded-lg bg-panel border border-line/70 cursor-pointer">
                <span className="text-[0.8rem] font-bold">{l}</span>
                <input type="checkbox" className="cbx" checked={prefs.notif[k]} onChange={(e) => setPrefs({ notif: { ...prefs.notif, [k]: e.target.checked } })} />
              </label>
            ))}
          </div>
        </div>
      </div></Reveal>
    </div>
  );
}
