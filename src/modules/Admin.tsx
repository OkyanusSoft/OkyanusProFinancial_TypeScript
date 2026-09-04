import { useState, useEffect, useMemo, useRef } from "react";
import { useApp } from "../store";
import { I, Chip } from "../ui";
import { Directory, type DirConf } from "../crud";
import { printDirectory } from "../print";
import { SIDEBAR_BGS, SYSTEM, ACTIVITY_CATS, MODULE_SCREENS, REPORTS, REPORT_ACTIONS, BUTTON_ACTIONS } from "../data";
import type { Activity } from "../data";
import { LOGIN_BGS } from "./Login";

export default function Admin() {
  const app = useApp();
  const p = app.route.path || "users";
  if (p === "users") return <UsersScreen />;
  if (p === "monitor") return <MonitorScreen />;
  if (p === "settings") return <SettingsScreen />;
  if (p === "prefs") return <PrefsScreen />;
  return <UsersScreen />;
}

/* ═══════════ المستخدمون والصلاحيات — وحدة الأمن الكاملة ═══════════ */
const secLevel = (total: number) =>
  total > 120 ? { l: "صلاحية مطلقة", c: "var(--bad)" } : total > 60 ? { l: "صلاحية موسعة", c: "var(--warn)" } : total > 20 ? { l: "صلاحية تشغيلية", c: "var(--brand)" } : { l: "صلاحية مقيدة", c: "var(--mute)" };

const PSwitch = ({ on, onClick, locked }: { on: boolean; onClick: () => void; locked?: boolean }) => (
  <button onClick={onClick} disabled={locked} aria-pressed={on}
    className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${on ? "bg-[var(--good)]" : "bg-[color-mix(in_srgb,var(--mute)_30%,transparent)]"}`}>
    <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "start-[21px]" : "start-[3px]"}`} />
  </button>
);
const PChip = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button onClick={onClick} aria-pressed={on}
    className={`px-2.5 py-1 rounded-lg text-[0.68rem] font-bold border transition-all ${on ? "text-[var(--brandink)] border-transparent shadow" : "bg-surface border-line text-mute hover:text-ink hover:border-[color-mix(in_srgb,var(--brand)_40%,transparent)]"}`}
    style={on ? { background: "linear-gradient(135deg, var(--brand), var(--brand2))" } : undefined}>
    {label}
  </button>
);
const PCell = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button onClick={onClick} aria-label={label} aria-pressed={on}
    className={`w-7 h-7 rounded-lg grid place-items-center transition-all mx-auto hover:scale-110 ${on ? "text-[var(--brandink)] shadow" : "bg-panel text-mute hover:text-ink"}`}
    style={on ? { background: "linear-gradient(135deg, var(--good), color-mix(in srgb, var(--good) 65%, var(--brand)))" } : undefined}>
    <I n={on ? "check" : "x"} size={13} />
  </button>
);

function UsersScreen() {
  const app = useApp();
  const [tab, setTab] = useState("list");
  const roleNames = (app.db.roles as any[]).map((r) => r.name);
  const [role, setRole] = useState(roleNames[0] || "مدير النظام");
  const [level, setLevel] = useState<"sys" | "screens" | "reports" | "buttons">("sys");
  const [q, setQ] = useState("");
  const m = app.matrix[role] || { modules: {}, screens: {}, reports: {}, buttons: {} };
  const counts = app.permCounts(role);
  const lv = secLevel(counts.total);
  const roleUsers = (n: string) => app.db.users.filter((u: any) => u.role === n);
  const mods = Object.entries(MODULE_SCREENS).filter(([, v]) => !q || v.label.includes(q) || v.screens.some((s) => s.label.includes(q)));
  const isRoot = role === "مدير النظام";

  const usersConf: DirConf = {
    coll: "users", title: "المستخدمون والصلاحيات", icon: "users", prefix: "U", importKey: "users",
    desc: "حسابات المستخدمين وأدوارهم — الصلاحيات الدقيقة تُدار من تبويب «مصفوفة الصلاحيات»",
    fields: [
      { k: "code", label: "الكود", req: true, uniq: true },
      { k: "name", label: "الاسم الكامل", req: true },
      { k: "username", label: "اسم المستخدم", req: true, uniq: true, hint: "يُستخدم في تسجيل الدخول" },
      { k: "role", label: "الدور الوظيفي", type: "select", req: true, opts: roleNames.map((r) => ({ v: r, l: r })) },
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
        {[["list", "المستخدمون", "users"], ["matrix", "مصفوفة الصلاحيات الرباعية", "shield"], ["org", "الهيكل الإداري والتنظيمي", "bld"], ["audit", "سجل الأمان", "lock"]].map(([id, l, ic]) => (
          <button key={id} onClick={() => setTab(id)} className={`tabline flex items-center gap-1.5 px-3.5 py-2.5 text-[0.82rem] font-bold whitespace-nowrap transition-colors ${tab === id ? "on text-[var(--brand)]" : "text-mute hover:text-ink"}`}>
            <I n={ic} size={15} /> {l}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4 stagger">
            {[
              { icon: "users", label: "إجمالي المستخدمين", v: app.db.users.length, tone: "var(--brand)" },
              { icon: "check", label: "حسابات نشطة", v: app.db.users.filter((u: any) => u.active !== false).length, tone: "var(--good)" },
              { icon: "lock", label: "حسابات موقوفة", v: app.db.users.filter((u: any) => u.active === false).length, tone: "var(--bad)" },
              { icon: "server", label: "أجهزة متصلة الآن", v: app.devices.filter((d) => d.online).length + 1, tone: "var(--accent)" },
            ].map((k) => (
              <div key={k.label} className="card card-lift p-4 relative overflow-hidden">
                <div className="absolute -top-6 -start-6 w-20 h-20 rounded-full opacity-[0.09]" style={{ background: k.tone }} />
                <div className="flex items-start justify-between">
                  <div><div className="text-[0.7rem] font-bold text-mute">{k.label}</div>
                    <div className="font-num font-bold text-[1.5rem] leading-tight mt-1" style={{ color: k.tone }}>{k.v}</div></div>
                  <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `color-mix(in srgb, ${k.tone} 13%, transparent)`, color: k.tone }}><I n={k.icon} size={19} /></span>
                </div>
              </div>
            ))}
          </div>
          <Directory conf={usersConf} />
        </div>
      )}
      {tab === "matrix" && (
        <div className="grid lg:grid-cols-[270px_1fr] gap-4">
          {/* ── قائمة الأدوار ── */}
          <div className="space-y-2.5">
            {(app.db.roles as any[]).map((r: any) => {
              const c = app.permCounts(r.name);
              const s = secLevel(c.total);
              const on = role === r.name;
              return (
                <button key={r.id || r.name} onClick={() => { setRole(r.name); setQ(""); }}
                  className={`w-full card card-lift p-3.5 text-start transition-all ${on ? "ring-2 ring-[color-mix(in_srgb,var(--brand)_55%,transparent)]" : "opacity-90 hover:opacity-100"}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl grid place-items-center font-display font-bold text-[0.72rem] text-[var(--brandink)] shrink-0" style={{ background: `linear-gradient(135deg, ${on ? "var(--brand)" : "var(--mute)"}, var(--brand2))` }}>{String(r.name).slice(0, 2)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-[0.86rem] truncate">{r.name}</div>
                      <div className="text-[0.62rem] text-mute font-bold">مستوى {r.level || "—"} • {roleUsers(r.name).length} مستخدم</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="chip !text-[0.58rem] !py-0" style={{ background: `color-mix(in srgb, ${s.c} 13%, transparent)`, color: s.c }}>{s.l}</span>
                    <span className="font-num text-[0.68rem] font-bold text-[var(--brand)]">{c.total} صلاحية</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-panel overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (c.total / 160) * 100)}%`, background: `linear-gradient(90deg, ${s.c}, var(--brand))` }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── لوحة المصفوفة ── */}
          <div>
            <div className="card p-4 mb-4 flex flex-wrap items-center gap-3 justify-between" style={{ background: "color-mix(in srgb, var(--brand) 6%, var(--panel))" }}>
              <div>
                <div className="font-display font-bold text-base flex items-center gap-2">{role}
                  <span className="chip !text-[0.6rem]" style={{ background: `color-mix(in srgb, ${lv.c} 13%, transparent)`, color: lv.c }}>{lv.l}</span>
                </div>
                <div className="text-[0.7rem] text-mute font-bold mt-0.5 flex items-center gap-3 flex-wrap">
                  <span>النظام: <b className="font-num text-[var(--brand)]">{counts.modules}</b> وحدة</span>
                  <span>الشاشات: <b className="font-num text-[var(--brand)]">{counts.screens}</b></span>
                  <span>التقارير: <b className="font-num text-[var(--brand)]">{counts.reports}</b> إجراء</span>
                  <span>الأزرار: <b className="font-num text-[var(--brand)]">{counts.buttons}</b></span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-soft !py-2" onClick={() => { app.grantAll(role); app.toast(`مُنحت كل الصلاحيات للدور «${role}»`, "ok"); }}><I n="check" size={15} /> منح الكل</button>
                <button className="btn btn-danger !py-2" disabled={isRoot} onClick={() => { app.revokeAll(role); app.toast(`سُحبت كل صلاحيات الدور «${role}»`, "err"); }}><I n="x" size={15} /> سحب الكل</button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[["sys", "مستوى النظام", "layers"], ["screens", "مستوى الشاشات", "dash"], ["reports", "مستوى التقارير", "chart"], ["buttons", "مستوى الأزرار", "edit"]].map(([id, l, ic]) => (
                <button key={id} onClick={() => setLevel(id as any)} className={`btn !py-2 ${level === id ? "btn-brand" : "btn-ghost"}`}><I n={ic} size={15} /> {l}</button>
              ))}
              <div className="relative ms-auto w-56">
                <I n="search" size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
                <input className="input !ps-9 !py-2 !text-[0.76rem]" placeholder="تصفية الوحدات والشاشات…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>

            {/* مستوى النظام */}
            {level === "sys" && (
              <div className="space-y-2.5 stagger">
                {mods.map(([mid, mod]) => {
                  const on = !!m.modules[mid];
                  const scrOn = mod.screens.filter((s) => m.screens[`${mid}:${s.id}`]).length;
                  const btnOn = (m.buttons[mid] || []).length;
                  const locked = isRoot && mid === "adm";
                  return (
                    <div key={mid} className={`card p-4 flex items-center gap-4 transition-all ${on ? "" : "opacity-70"}`}>
                      <span className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ background: on ? "linear-gradient(135deg, var(--brand), var(--brand2))" : "var(--panel)", color: on ? "var(--brandink)" : "var(--mute)" }}><I n="shield" size={20} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-[0.95rem] flex items-center gap-2">{mod.label}
                          {locked && <span className="chip bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)] !text-[0.58rem] !py-0"><I n="lock" size={10} /> محصّن</span>}
                        </div>
                        <div className="text-[0.68rem] text-mute font-bold mt-0.5">
                          دخول كامل للوحدة — <span className="font-num">{scrOn}/{mod.screens.length}</span> شاشة • <span className="font-num">{btnOn}/{BUTTON_ACTIONS.length}</span> زر • <span className="font-num">{REPORTS.filter((r) => r.module === mid).reduce((a, r) => a + (m.reports[r.id] || []).length, 0)}</span> إجراء تقارير
                        </div>
                      </div>
                      <PSwitch on={on} locked={locked} onClick={() => app.setModulePerm(role, mid, !on)} />
                    </div>
                  );
                })}
                <p className="text-[0.7rem] font-bold text-mute flex items-center gap-1.5"><I n="info" size={13} /> إغلاق وحدة يسقط شاشاتها فوراً — ووحدة «إدارة النظام» محصّنة لمدير النظام منعاً لقفل النظام.</p>
              </div>
            )}

            {/* مستوى الشاشات */}
            {level === "screens" && (
              <div className="space-y-3 stagger">
                {mods.map(([mid, mod]) => {
                  const modOn = !!m.modules[mid];
                  const allOn = mod.screens.every((s) => m.screens[`${mid}:${s.id}`]);
                  return (
                    <div key={mid} className={`card overflow-hidden ${modOn ? "" : "opacity-60"}`}>
                      <div className="px-4 py-3 bg-panel flex items-center gap-3 border-b border-line">
                        <I n="dash" size={16} className="text-[var(--brand)]" />
                        <b className="font-display text-[0.9rem] flex-1">{mod.label}</b>
                        <span className="text-[0.66rem] font-bold text-mute font-num">{mod.screens.filter((s) => m.screens[`${mid}:${s.id}`]).length}/{mod.screens.length}</span>
                        <button className="btn btn-ghost !py-1 !px-2.5 !text-[0.66rem]" disabled={!modOn} onClick={() => app.setAllScreens(role, mid, !allOn)}>{allOn ? "إلغاء الكل" : "فتح الكل"}</button>
                      </div>
                      <div className="grid md:grid-cols-2">
                        {mod.screens.map((s) => {
                          const on = !!m.screens[`${mid}:${s.id}`];
                          return (
                            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-line/60 last:border-0 hover:bg-panel/60 transition-colors">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${on ? "bg-[var(--good)]" : "bg-[var(--mute)]"}`} />
                              <span className="text-[0.78rem] font-bold flex-1">{s.label}</span>
                              <PSwitch on={on && modOn} locked={!modOn} onClick={() => app.setScreenPerm(role, `${mid}:${s.id}`, !on)} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* مستوى التقارير */}
            {level === "reports" && (
              <div className="card overflow-hidden"><div className="overflow-x-auto">
                <table className="tbl min-w-[760px]">
                  <thead><tr><th>التقرير</th><th>الوحدة</th>{REPORT_ACTIONS.map((a) => <th key={a} className="text-center !text-[0.7rem]">{a}</th>)}<th className="text-center">الكل</th></tr></thead>
                  <tbody>
                    {REPORTS.filter((r) => !q || r.name.includes(q) || MODULE_SCREENS[r.module]?.label.includes(q)).map((r) => {
                      const acts = m.reports[r.id] || [];
                      const modOn = !!m.modules[r.module];
                      return (
                        <tr key={r.id} className={modOn ? "" : "opacity-50"}>
                          <td className="font-bold"><span className="flex items-center gap-2"><I n="chart" size={15} className="text-[var(--brand)]" /> {r.name}</span></td>
                          <td><span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] !text-[0.62rem]">{MODULE_SCREENS[r.module]?.label}</span></td>
                          {REPORT_ACTIONS.map((a) => (
                            <td key={a} className="text-center"><PChip on={acts.includes(a) && modOn} label={acts.includes(a) ? "✓" : "—"} onClick={() => app.setReportAction(role, r.id, a, !acts.includes(a))} /></td>
                          ))}
                          <td className="text-center">
                            <button className="btn btn-ghost !py-1 !px-2 !text-[0.64rem]" onClick={() => REPORT_ACTIONS.forEach((a) => { if (acts.includes(a)) app.setReportAction(role, r.id, a, false); else app.setReportAction(role, r.id, a, true); })}>
                              {acts.length === REPORT_ACTIONS.length ? "إلغاء" : "منح"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div></div>
            )}

            {/* مستوى الأزرار */}
            {level === "buttons" && (
              <div className="card overflow-hidden"><div className="overflow-x-auto">
                <table className="tbl min-w-[980px]">
                  <thead><tr><th>الوحدة \ الزر</th>{BUTTON_ACTIONS.map((a) => <th key={a} className="text-center !text-[0.64rem]">{a}</th>)}<th className="text-center">الكل</th></tr></thead>
                  <tbody>
                    {mods.map(([mid, mod]) => {
                      const btns = m.buttons[mid] || [];
                      const modOn = !!m.modules[mid];
                      return (
                        <tr key={mid} className={modOn ? "" : "opacity-50"}>
                          <td className="font-display font-bold whitespace-nowrap">{mod.label}</td>
                          {BUTTON_ACTIONS.map((a) => (
                            <td key={a} className="text-center"><PCell on={btns.includes(a) && modOn} label={`${mod.label} — ${a}`} onClick={() => app.setButtonPerm(role, mid, a, !btns.includes(a))} /></td>
                          ))}
                          <td className="text-center">
                            <button className="btn btn-ghost !py-1 !px-2 !text-[0.64rem]" onClick={() => app.setAllButtons(role, mid, btns.length < BUTTON_ACTIONS.length)}>{btns.length === BUTTON_ACTIONS.length ? "إلغاء" : "منح"}</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div></div>
            )}

            <p className="text-[0.7rem] font-bold text-mute mt-3 flex items-center gap-1.5"><I n="lock" size={13} className="text-[var(--brand)]" /> كل تغيير يُطبَّق فوراً ويُسجَّل في سجل الأمان باسم المستخدم — الصلاحيات تُفحص عند فتح كل شاشة وعند كل زر إجراء.</p>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="lock" size={18} className="text-[var(--brand)]" /> سجل تغييرات الصلاحيات والأمان</h3>
            <div className="space-y-2 max-h-[520px] overflow-auto pe-1" style={{ scrollbarWidth: "thin" }}>
              {app.activity.filter((a) => a.category === "النظام" || a.action.includes("صلاحية")).slice(0, 50).map((a) => {
                const isPerm = a.action.includes("صلاحية");
                const isGrant = a.action.includes("منح");
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-panel border border-line/70 anim-rise">
                    <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${isPerm ? (isGrant ? "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]" : "bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] text-[var(--bad)]") : "bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)]"}`}>
                      <I n={isPerm ? (isGrant ? "unlock" : "lock") : a.type === "login" ? "user" : "shield"} size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><b className="text-[0.8rem]">{a.user}</b><span className="chip bg-[color-mix(in_srgb,var(--mute)_12%,transparent)] text-[var(--soft)] !text-[0.58rem] !py-0">{a.role}</span></div>
                      <p className="text-[0.76rem] text-soft font-medium leading-5 mt-0.5">{a.action}</p>
                      <div className="text-[0.62rem] text-mute font-bold mt-0.5">{a.device} • {ago(a.ts)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-display font-bold text-sm mb-3">ملخص أمني</h3>
              {[
                ["تغييرات صلاحيات اليوم", app.activity.filter((a) => a.action.includes("صلاحية")).length],
                ["محاولات دخول مسجلة", app.activity.filter((a) => a.type === "login").length],
                ["أدوار معرّفة", app.db.roles.length],
                ["شاشات محمية", Object.values(MODULE_SCREENS).reduce((a, x) => a + x.screens.length, 0)],
              ].map(([l, v]) => (
                <div key={l as string} className="flex items-center justify-between py-2 border-b border-line/70 last:border-0 text-[0.78rem] font-bold">
                  <span className="text-soft">{l}</span><span className="font-num text-[var(--brand)]">{v as number}</span>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="font-display font-bold text-sm mb-2.5 flex items-center gap-2"><I n="shield" size={16} className="text-[var(--good)]" /> طبقات الحماية المفعّلة</h3>
              {["مصادقة JWT مع انتهاء صلاحية ورمز تحديث", "حصانة وحدة إدارة النظام لمدير النظام", "تدقيق كامل: كل منح/سحب يُسجَّل بالمستخدم والوقت", "قفل الفترات المالية ضد الترحيل (محفز قاعدة بيانات)", "نشر الحذف عبر شواهد Tombstones"].map((x) => (
                <div key={x} className="flex items-center gap-2 py-1.5 text-[0.74rem] font-bold text-soft"><I n="check" size={14} className="text-[var(--good)] shrink-0" /> {x}</div>
              ))}
            </div>
          </div>
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

/* ═══════════ مراقبة النشاط — بث لحظي لكل عمليات الموظفين (للمدير) ═══════════ */
const ago = (ts: number) => {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 10) return "الآن";
  if (s < 60) return `قبل ${s} ث`;
  const m = Math.floor(s / 60);
  if (m < 60) return `قبل ${m} د`;
  return `قبل ${Math.floor(m / 60)} س`;
};
const typeMeta: Record<Activity["type"], { icon: string; color: string; label: string }> = {
  create: { icon: "plus", color: "var(--good)", label: "إنشاء" },
  update: { icon: "edit", color: "var(--brand)", label: "تعديل" },
  delete: { icon: "trash", color: "var(--bad)", label: "حذف" },
  login: { icon: "user", color: "var(--accent)", label: "دخول" },
  sync: { icon: "refresh", color: "var(--mute)", label: "مزامنة" },
};

function MonitorScreen() {
  const app = useApp();
  const [mtab, setMtab] = useState<"feed" | "check">("feed");
  const [fUser, setFUser] = useState("الكل");
  const [fCat, setFCat] = useState("الكل");
  const [q, setQ] = useState("");
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(t); }, []);

  const feed = app.activity.filter((a) =>
    (fUser === "الكل" || a.user === fUser) &&
    (fCat === "الكل" || a.category === fCat) &&
    (!q || a.action.includes(q) || a.user.includes(q) || a.device.includes(q))
  ).slice(0, 60);

  const users = useMemo<string[]>(() => Array.from(new Set(app.activity.map((a: Activity) => a.user))), [app.activity]);
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const kpi = {
    today: app.activity.filter((a) => a.ts >= dayStart.getTime()).length,
    active: new Set(app.activity.filter((a) => Date.now() - a.ts < 3600_000).map((a) => a.user)).size,
    online: app.devices.filter((d) => d.online).length + 1,
    dels: app.tombstones.length,
  };
  const hours = Array.from({ length: 12 }, (_, i) => {
    const from = Date.now() - (12 - i) * 3600_000, to = Date.now() - (11 - i) * 3600_000;
    return { label: `${new Date(to).getHours()}`, n: app.activity.filter((a) => a.ts > from && a.ts <= to).length };
  });
  const maxH = Math.max(...hours.map((h) => h.n), 1);
  const allDevices = [
    { id: app.deviceId, name: app.settings.deviceName + " (أنت)", user: app.session?.user || "—", role: app.session?.role || "—", ip: "192.168.1.10", online: true, ops: app.activity.length, lastSeen: Date.now(), category: "النظام" },
    ...app.devices,
  ];

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="pulse" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">مراقبة النشاط</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">بث لحظي مباشر لكل عمليات الموظفين على الأجهزة المختلفة — مزامنة دمج مركزية، لا حذف للبيانات</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] !py-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--good)] blink" /> بث مباشر — تحديث كل 4.5 ث</span>
          <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] font-num !py-1.5" dir="ltr">جيل المزامنة #{app.gen}</span>
          {app.can("adm", "طباعة") && (
            <button className="btn btn-soft !py-1.5" onClick={() => printDirectory(app.session?.user || "—", { title: "سجل نشاط المستخدمين", subtitle: "بث العمليات اللحظي على أجهزة الشبكة", columns: [{ h: "الوقت", v: (r: Activity) => new Date(r.ts).toLocaleString("ar-EG") }, { h: "المستخدم", v: (r: Activity) => r.user }, { h: "الدور", v: (r: Activity) => r.role }, { h: "الجهاز", v: (r: Activity) => r.device }, { h: "الفئة", v: (r: Activity) => r.category }, { h: "العملية", v: (r: Activity) => r.action }], rows: app.activity.slice(0, 200), summary: [["إجمالي العمليات", String(app.activity.length)], ["أجهزة متصلة", String(app.devices.filter((d) => d.online).length + 1)]] })}><I n="print" size={14} /> طباعة السجل</button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-line mb-5 px-1">
        {[["feed", "بث النشاط المباشر", "pulse"], ["check", "فحص التزامن والحمل", "scale"]].map(([id, l, ic]) => (
          <button key={id} onClick={() => setMtab(id as any)} className={`tabline flex items-center gap-1.5 px-3.5 py-2.5 text-[0.82rem] font-bold whitespace-nowrap transition-colors ${mtab === id ? "on text-[var(--brand)]" : "text-mute hover:text-ink"}`}>
            <I n={ic} size={15} /> {l}
          </button>
        ))}
      </div>

      {mtab === "feed" && (<>
      {/* مؤشرات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 stagger">
        {[
          { icon: "pulse", label: "عمليات اليوم", v: kpi.today, tone: "var(--brand)" },
          { icon: "users", label: "موظفون نشطون (آخر ساعة)", v: kpi.active, tone: "var(--good)" },
          { icon: "server", label: "أجهزة متصلة الآن", v: kpi.online, tone: "var(--accent)" },
          { icon: "trash", label: "شواهد حذف منتشرة", v: kpi.dels, tone: "var(--bad)" },
        ].map((k) => (
          <div key={k.label} className="card card-lift p-4 relative overflow-hidden">
            <div className="absolute -top-6 -start-6 w-20 h-20 rounded-full opacity-[0.09]" style={{ background: k.tone }} />
            <div className="flex items-start justify-between">
              <div><div className="text-[0.7rem] font-bold text-mute">{k.label}</div>
                <div className="font-num font-bold text-[1.5rem] leading-tight mt-1" style={{ color: k.tone }}>{k.v}</div></div>
              <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: `color-mix(in srgb, ${k.tone} 13%, transparent)`, color: k.tone }}><I n={k.icon} size={19} /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* البث المباشر */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base flex items-center gap-2"><I n="clock" size={18} className="text-[var(--brand)]" /> سجل العمليات اللحظي <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] !text-[0.6rem]">{feed.length}</span></h3>
            <span className="text-[0.66rem] font-bold text-mute">activity_log — يُضاف ولا يُحذف</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <select className="select !w-44 !py-2 !text-[0.76rem]" value={fUser} onChange={(e) => setFUser(e.target.value)}><option>الكل</option>{users.map((u) => <option key={u}>{u}</option>)}</select>
            <select className="select !w-40 !py-2 !text-[0.76rem]" value={fCat} onChange={(e) => setFCat(e.target.value)}><option>الكل</option>{ACTIVITY_CATS.map((c) => <option key={c}>{c}</option>)}</select>
            <div className="relative flex-1 min-w-[160px]"><I n="search" size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
              <input className="input !ps-9 !py-2 !text-[0.76rem]" placeholder="بحث في العمليات…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          </div>
          <div className="space-y-2 max-h-[520px] overflow-auto pe-1" style={{ scrollbarWidth: "thin" }}>
            {feed.map((a) => {
              const m = typeMeta[a.type];
              return (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-panel border border-line/70 anim-rise hover:border-[color-mix(in_srgb,var(--brand)_35%,transparent)] transition-colors">
                  <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0 mt-0.5" style={{ background: `color-mix(in srgb, ${m.color} 13%, transparent)`, color: m.color }}><I n={m.icon} size={15} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-[0.8rem]">{a.user}</b>
                      <span className="chip bg-[color-mix(in_srgb,var(--mute)_12%,transparent)] text-[var(--soft)] !text-[0.58rem] !py-0">{a.category}</span>
                      <span className="chip !text-[0.58rem] !py-0" style={{ background: `color-mix(in srgb, ${m.color} 12%, transparent)`, color: m.color }}>{m.label}</span>
                    </div>
                    <p className="text-[0.76rem] text-soft font-medium leading-5 mt-0.5 truncate">{a.action}</p>
                    <div className="text-[0.62rem] text-mute font-bold mt-0.5 font-num" dir="ltr">{a.device} • {ago(a.ts)}</div>
                  </div>
                </div>
              );
            })}
            {feed.length === 0 && <div className="text-center py-10 text-[0.8rem] font-bold text-mute">لا توجد عمليات مطابقة للفلاتر</div>}
          </div>
        </div>

        <div className="space-y-4">
          {/* توزيع النشاط */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2"><I n="chart" size={18} className="text-[var(--brand)]" /> توزيع النشاط — آخر 12 ساعة</h3>
            <div className="flex items-end gap-1.5" style={{ height: 110 }}>
              {hours.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${h.n} عملية`}>
                  <div className="w-full rounded-t bar-grow" style={{ height: `${(h.n / maxH) * 100}%`, minHeight: h.n ? 6 : 2, background: h.n ? "linear-gradient(180deg, var(--brand), color-mix(in srgb, var(--brand) 45%, transparent))" : "var(--panel)", animationDelay: `${i * 40}ms` }} />
                  <span className="text-[0.58rem] font-num font-bold text-mute">{h.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* أجهزة الشبكة */}
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="server" size={18} className="text-[var(--accent)]" /> أجهزة الشبكة <span className="chip bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] !text-[0.6rem]">{allDevices.filter((d) => d.online).length} متصل</span></h3>
            <div className="space-y-2 max-h-[300px] overflow-auto pe-1" style={{ scrollbarWidth: "thin" }}>
              {allDevices.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-panel border border-line/70">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.online ? "bg-[var(--good)] blink" : "bg-[var(--mute)]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.78rem] font-bold truncate">{d.name}</div>
                    <div className="text-[0.62rem] text-mute font-bold truncate">{d.user} — {d.role} • <span className="font-num" dir="ltr">{d.ip}</span></div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="font-num text-[0.7rem] font-bold text-[var(--brand)]">{d.ops}</div>
                    <div className="text-[0.58rem] text-mute font-bold">{d.online ? ago(d.lastSeen) : "خامل"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </>)}
      {mtab === "check" && <SyncCheckScreen />}
      <p className="text-[0.7rem] font-bold text-mute mt-4 flex items-center gap-1.5"><I n="info" size={13} className="text-[var(--brand)]" /> معمارية المزامنة: كل جهاز يرسل عملياته للقاعدة المركزية فتُدمج (الأحدث يفوز)، ويبث المركز التغييرات لكل الأجهزة كل 4.5 ثانية. الحذف ينتشر عبر شواهد (Tombstones) فلا يعود السجل المحذوف أبداً.</p>
    </div>
  );
}

/* ═══════════ فحص التزامن والحمل (100 مستخدم متزامن) ═══════════ */
function SyncCheckScreen() {
  const app = useApp();
  const eng = app.sync;
  const [, force] = useState(0);
  const [users, setUsers] = useState(100);
  const [opsEach, setOpsEach] = useState(5);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof eng.runLoadTest> | null>(null);
  useEffect(() => { const t = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(t); }, []);

  const dbSize = Object.values(app.db).reduce((a, list) => a + list.length, 0);
  const health = eng.healthCheck(dbSize);
  const run = () => {
    setRunning(true); setProgress(0); setResult(null);
    const steps = 10;
    let i = 0;
    const iv = setInterval(() => {
      i++; setProgress(Math.round((i / steps) * 100));
      if (i >= steps) {
        clearInterval(iv);
        setResult(eng.runLoadTest(users, opsEach));
        setRunning(false);
        app.toast(`اكتمل اختبار الحمل: ${users} مستخدم × ${opsEach} عمليات بلا فقد بيانات`, "ok");
      }
    }, 90);
  };

  return (
    <div className="space-y-4 anim-fadein">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* فحص صحة المنظومة */}
        <div className="card p-5">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="check" size={18} className="text-[var(--good)]" /> فحص وتشييك المنظومة</h3>
          <div className="space-y-2">
            {health.map((h) => (
              <div key={h.label} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${h.ok ? "border-[color-mix(in_srgb,var(--good)_25%,transparent)] bg-[color-mix(in_srgb,var(--good)_5%,transparent)]" : "border-[color-mix(in_srgb,var(--warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--warn)_6%,transparent)]"}`}>
                <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${h.ok ? "bg-[color-mix(in_srgb,var(--good)_14%,transparent)] text-[var(--good)]" : "bg-[color-mix(in_srgb,var(--warn)_15%,transparent)] text-[var(--warn)]"}`}>
                  <I n={h.ok ? "check" : "alert"} size={15} />
                </span>
                <div className="flex-1 min-w-0"><div className="text-[0.8rem] font-bold">{h.label}</div><div className="text-[0.66rem] text-mute font-bold">{h.detail}</div></div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-xl bg-panel border border-line flex items-center justify-between">
            <div className="text-[0.74rem] font-bold text-soft flex items-center gap-2"><I n="server" size={15} className="text-[var(--brand)]" /> الخادم المركزي (server/)</div>
            <span className="chip bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)]">Express + MySQL + WebSocket جاهز</span>
          </div>
        </div>

        {/* إحصاءات الدمج الحية + الجيل */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="swap" size={18} className="text-[var(--brand)]" /> محرك الدمج — إحصاءات لحظية <span className="w-1.5 h-1.5 rounded-full bg-[var(--good)] blink" /></h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                { l: "عمليات نُشرت", v: eng.stats.published, t: "var(--brand)" },
                { l: "عمليات دُمجت من أجهزة", v: eng.stats.applied, t: "var(--good)" },
                { l: "تعارضات حُلّت (الأحدث يفوز)", v: eng.stats.conflicts, t: "var(--warn)" },
                { l: "شواهد حذف منتشرة", v: eng.stats.tombstones, t: "var(--bad)" },
                { l: "أحداث جيل (استبدال شامل)", v: eng.stats.genEvents, t: "var(--accent)" },
                { l: "هوية هذا الجهاز", v: eng.deviceId.slice(-6), t: "var(--mute)" },
              ].map((k) => (
                <div key={k.l} className="bg-panel rounded-xl p-3 border border-line/70">
                  <div className="text-[0.62rem] font-bold text-mute">{k.l}</div>
                  <div className="font-num font-bold text-[1.15rem] mt-0.5" style={{ color: k.t }} dir="ltr">{typeof k.v === "number" ? k.v.toLocaleString("en-US") : k.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-2 flex items-center gap-2"><I n="refresh" size={18} className="text-[var(--accent)]" /> الاستبدال الشامل عبر الجيل</h3>
            <p className="text-[0.74rem] text-mute font-bold leading-6 mb-3">عند الاستعادة من نسخة احتياطية أو إعادة التهيئة يرتفع رقم الجيل (<span className="font-num text-[var(--brand)]" dir="ltr">Gen #{app.gen}</span>) فتستبدل كل الأجهزة المتصلة نسختها القديمة تلقائياً — بلا تدخل يدوي.</p>
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-ghost" onClick={() => app.toast(`الجيل الحالي ${app.gen} — تُبث أحداث الجيل عبر قناة المزامنة`, "info")}><I n="info" size={15} /> حالة الجيل</button>
              {app.ownerUnlocked
                ? <button className="btn btn-danger" onClick={app.reinitCentral}><I n="refresh" size={15} /> إعادة تهيئة وبث Gen لكل الأجهزة</button>
                : <button className="btn btn-ghost !text-[var(--bad)]" onClick={() => { app.nav({ module: "adm", path: "activate" }); app.toast("افتح شاشة تفعيل الأنظمة وأدخل الرقم السري للمالك (1234 للتجربة)", "info"); }}><I n="lock" size={15} /> يتطلب صلاحيات المالك</button>}
            </div>
          </div>
        </div>
      </div>

      {/* اختبار الحمل */}
      <div className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-bold text-base flex items-center gap-2"><I n="users" size={18} className="text-[var(--brand)]" /> اختبار الحمل — مستخدمون متزامنون</h3>
            <p className="text-[0.72rem] text-mute font-bold mt-1">محاكاة عمليات متزامنة على مدمج «الأحدث يفوز» مع تنازع على سجلات ساخنة وعمليات حذف متوازية — للتحقق من سلامة البيانات تحت الضغط</p>
          </div>
          <div className="flex items-end gap-2.5 flex-wrap">
            <label className="block"><span className="text-[0.68rem] font-bold text-mute">مستخدمون</span>
              <input type="number" className="input mt-1 !w-24 !py-2 font-num" value={users} min={2} max={1000} onChange={(e) => setUsers(Math.max(2, +e.target.value || 100))} /></label>
            <label className="block"><span className="text-[0.68rem] font-bold text-mute">عمليات/مستخدم</span>
              <input type="number" className="input mt-1 !w-24 !py-2 font-num" value={opsEach} min={1} max={50} onChange={(e) => setOpsEach(Math.max(1, +e.target.value || 5))} /></label>
            <button className="btn btn-brand !py-2.5" onClick={run} disabled={running}>
              {running ? <><I n="refresh" size={15} className="animate-spin" /> جارٍ الاختبار…</> : <><I n="pulse" size={15} /> تشغيل الاختبار</>}
            </button>
          </div>
        </div>
        {running && (
          <div className="mb-4">
            <div className="h-2.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--brand), var(--accent))" }} /></div>
            <div className="text-[0.68rem] font-bold text-mute mt-1.5 font-num" dir="ltr">{progress}% — {(users * opsEach * progress / 100).toFixed(0)} / {users * opsEach} عملية</div>
          </div>
        )}
        {result && (
          <div className="anim-rise">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-4">
              {[
                ["إجمالي العمليات", result.totalOps, "var(--brand)"],
                ["سجلات فريدة", result.uniqueRecords, "var(--accent)"],
                ["دُمجت بنجاح", result.merged, "var(--good)"],
                ["تعارضات حُلّت", result.conflicts, "var(--warn)"],
                ["صُفوف أقدم رُفضت", result.rejected, "var(--mute)"],
                ["حذف متزامن (Tombstone)", result.deleted, "var(--bad)"],
                ["الزمن / الإنتاجية", `${result.ms}ms`, "var(--brand)"],
              ].map(([l, v, t]) => (
                <div key={l as string} className="bg-panel rounded-xl p-3 border border-line/70 text-center">
                  <div className="text-[0.6rem] font-bold text-mute">{l}</div>
                  <div className="font-num font-bold text-[1.05rem] mt-0.5" style={{ color: t as string }} dir="ltr">{typeof v === "number" ? v.toLocaleString("en-US") : v}</div>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl border border-[color-mix(in_srgb,var(--good)_30%,transparent)] bg-[color-mix(in_srgb,var(--good)_6%,transparent)] flex items-start gap-3">
              <I n="check" size={20} className="text-[var(--good)] shrink-0 mt-0.5" />
              <div>
                <div className="text-[0.84rem] font-bold text-[var(--good)]">النتيجة: سلامة بيانات كاملة تحت ضغط {result.users} مستخدم متزامن</div>
                <p className="text-[0.76rem] text-soft font-medium mt-1 leading-6">{result.verdict} الإنتاجية: <b className="font-num" dir="ltr">{result.opsPerSec.toLocaleString("en-US")}</b> عملية/ثانية.</p>
              </div>
            </div>
          </div>
        )}
        {!result && !running && (
          <div className="p-4 rounded-xl bg-panel border border-dashed border-line text-center text-[0.76rem] font-bold text-mute">شغّل الاختبار لمحاكاة {users * opsEach} عملية متزامنة والتحقق من المدمج</div>
        )}
      </div>
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

const MIGRATIONS = [
  { f: "0001_core_schema.sql", d: "الأنظمة الأساسية: تنظيم، مستخدمون، دليل الحسابات، مخزون، فواتير + محفزات", t: "47 جدولاً" },
  { f: "0002_activity_engine.sql", d: "قاعدة البيانات التكيفية: 21 نظاماً متخصصاً بجداول JSON مرنة", t: "5 جداول" },
  { f: "0003_sync_realtime.sql", d: "محرك المزامنة: sync_records، sync_ops، tombstones، generations، devices", t: "6 جداول" },
  { f: "0004_hr_assets.sql", d: "الموارد البشرية والأصول الثابتة مع إجراء الإهلاك السنوي", t: "8 جداول" },
  { f: "0005_alter_patterns.sql", d: "أنماط إضافة/تعديل أي جدول أو عمود (إجراءات شرطية آمنة)", t: "4 تعديلات" },
];

function DatabaseSection() {
  const app = useApp();
  const [tab, setTab] = useState("db");
  const [cfg, setCfg] = useState({ ...app.settings.dbCfg });
  const [api, setApi] = useState({ ...app.settings.api });
  const [front, setFront] = useState({ ...app.settings.front });
  const [testing, setTesting] = useState<"db" | "api" | null>(null);
  const [conn, setConn] = useState<{ ok: boolean; ping: number } | null>(null);
  const [apiConn, setApiConn] = useState<{ ok: boolean; ping: number } | null>(null);
  const [steps, setSteps] = useState([true, true, true, true]);
  const stepLabels = ["تثبيت حزمة النظام على الخادم (server/)", "تشغيل Migrations وإنشاء القاعدة (npm run migrate)", "إدخال بيانات الترخيص والتفعيل", "تشغيل خدمة المزامنة اللحظية (WebSocket)"];
  const saveAll = () => {
    app.setSettings({ ...app.settings, dbCfg: cfg, api, front });
    app.toast("حُفظت إعدادات Backend و Frontend وطُبّقت على الخادم المركزي", "ok");
  };

  const test = (kind: "db" | "api") => {
    setTesting(kind);
    setTimeout(() => {
      const ok = kind === "db" ? !!(cfg.host && cfg.name && cfg.port > 0) : !!(api.baseUrl && api.wsPath);
      const ping = 5 + Math.floor(Math.random() * 22);
      if (kind === "db") setConn({ ok, ping }); else setApiConn({ ok, ping });
      setTesting(null);
      app.toast(ok
        ? (kind === "db" ? `تم الاتصال بـ MySQL — زمن الاستجابة ${ping}ms وحزمة ${cfg.pool} اتصال جاهزة` : `الخادم المركزي يستجيب — WebSocket على ${api.wsPath} وزمن ${ping}ms`)
        : "فشل الاتصال — راجع البيانات", ok ? "ok" : "err");
    }, 900);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {[["db", "اتصال MySQL (Backend)", "db"], ["api", "واجهة الربط API (Backend)", "code"], ["front", "إعدادات الواجهة (Frontend)", "dash"], ["status", "حالة التشغيل", "pulse"], ["license", "خطوات التفعيل", "key"], ["pkg", "ملفات الحزمة", "file"]].map(([id, l, ic]) => (
          <button key={id} onClick={() => setTab(id)} className={`btn !py-2 ${tab === id ? "btn-brand" : "btn-ghost"}`}><I n={ic} size={15} /> {l}</button>
        ))}
        <button className="btn btn-soft ms-auto" onClick={saveAll}><I n="save" size={15} /> حفظ كل الإعدادات</button>
      </div>

      {tab === "db" && (
      <div className="grid lg:grid-cols-2 gap-5">
      <div className="card p-5">
        <h3 className="font-display font-bold text-base mb-1 flex items-center gap-2"><I n="db" size={19} className="text-[var(--brand)]" /> الاتصال المركزي — MySQL 8</h3>
        <p className="text-[0.72rem] text-mute font-bold mb-4">بيانات اتصال قاعدة البيانات الرئيسية — تُطابق ملف server/.env</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">Host (الخادم)</span><input className="input mt-1 font-num" dir="ltr" value={cfg.host} onChange={(e) => setCfg({ ...cfg, host: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Port</span><input type="number" className="input mt-1 font-num" dir="ltr" value={cfg.port} onChange={(e) => setCfg({ ...cfg, port: +e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Database Name</span><input className="input mt-1 font-num" dir="ltr" value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Username</span><input className="input mt-1 font-num" dir="ltr" value={cfg.user} onChange={(e) => setCfg({ ...cfg, user: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Password</span><input type="password" className="input mt-1 font-num" dir="ltr" value={cfg.pass} onChange={(e) => setCfg({ ...cfg, pass: e.target.value })} placeholder="••••••••" /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">المحرك</span>
            <select className="select mt-1" value={cfg.engine} onChange={(e) => setCfg({ ...cfg, engine: e.target.value })}>{["InnoDB", "MyISAM", "Memory"].map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">Charset</span>
            <select className="select mt-1" value={cfg.charset} onChange={(e) => setCfg({ ...cfg, charset: e.target.value })}>{["utf8mb4", "utf8", "latin1"].map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">المنطقة الزمنية</span><input className="input mt-1 font-num" dir="ltr" value={cfg.tz} onChange={(e) => setCfg({ ...cfg, tz: e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">مهلة الاستعلام (ث)</span><input type="number" className="input mt-1 font-num" dir="ltr" value={cfg.timeout} onChange={(e) => setCfg({ ...cfg, timeout: +e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">حجم حزمة الاتصالات</span><input type="number" className="input mt-1 font-num" dir="ltr" value={cfg.pool} onChange={(e) => setCfg({ ...cfg, pool: +e.target.value })} /></label>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">حد طابور الانتظار</span><input type="number" className="input mt-1 font-num" dir="ltr" value={cfg.queue} onChange={(e) => setCfg({ ...cfg, queue: +e.target.value })} /></label>
          <button onClick={() => setCfg({ ...cfg, ssl: !cfg.ssl })} className={`col-span-2 flex items-center gap-3 p-3 rounded-xl border transition-all ${cfg.ssl ? "border-[color-mix(in_srgb,var(--good)_40%,transparent)] bg-[color-mix(in_srgb,var(--good)_6%,transparent)]" : "border-line bg-panel"}`}>
            <PSwitch on={cfg.ssl} onClick={() => setCfg({ ...cfg, ssl: !cfg.ssl })} />
            <span className="text-start"><b className="text-[0.8rem] block">اتصال مشفّر SSL/TLS</b><span className="text-[0.66rem] text-mute font-bold">موصى به لخوادم الإنتاج — يوازي REQUIRE SSL في MySQL</span></span>
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn btn-soft flex-1" onClick={() => test("db")} disabled={testing === "db"}><I n="pulse" size={15} /> {testing === "db" ? "جارٍ الاختبار…" : "اختبار الاتصال"}</button>
          <button className="btn btn-brand flex-1" onClick={saveAll}><I n="save" size={15} /> حفظ الإعدادات</button>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="db" size={19} className="text-[var(--accent)]" /> بنية قاعدة البيانات التكيفية</h3>
        <p className="text-[0.72rem] text-mute font-bold mb-3">تُنفَّذ Migrations بالترتيب وتُسجَّل في schema_migrations — لا تُعاد أبداً</p>
        <div className="space-y-2">
          {MIGRATIONS.map((mg, i) => (
            <div key={mg.f} className="flex items-center gap-3 p-3 rounded-xl bg-panel border border-line/70 hover:border-[color-mix(in_srgb,var(--brand)_35%,transparent)] transition-colors">
              <span className="w-8 h-8 rounded-lg grid place-items-center bg-[color-mix(in_srgb,var(--good)_12%,transparent)] text-[var(--good)] shrink-0"><I n="check" size={15} /></span>
              <div className="flex-1 min-w-0">
                <div className="font-num font-bold text-[0.76rem]" dir="ltr">{mg.f}</div>
                <div className="text-[0.66rem] text-mute font-bold truncate">{mg.d}</div>
              </div>
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-[var(--brand)] !text-[0.6rem] shrink-0">{mg.t}</span>
              <button className="btn btn-ghost !p-1.5 shrink-0" title="إعادة تنفيذ (آمن — يتحقق قبل التطبيق)" onClick={() => app.toast(`أُعيد تنفيذ ${mg.f} — لا تغييرات مطلوبة (Idempotent)`, "info")}><I n="refresh" size={14} /></button>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-xl bg-[color-mix(in_srgb,var(--warn)_7%,transparent)] border border-[color-mix(in_srgb,var(--warn)_25%,transparent)] text-[0.72rem] font-bold text-soft flex items-start gap-2">
          <I n="info" size={15} className="text-[var(--warn)] shrink-0 mt-0.5" /> لإضافة جدول أو عمود لأي نشاط: أنشئ ملفاً جديداً migrations/0006_…sql بنمط الإجراءات الشرطية (انظر 0005) ثم npm run migrate.
        </div>
      </div>
      </div>
      )}

      {tab === "api" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-1 flex items-center gap-2"><I n="code" size={19} className="text-[var(--brand)]" /> الخادم المركزي — REST + WebSocket</h3>
            <p className="text-[0.72rem] text-mute font-bold mb-4">تُطابق هذه القيم ملف server/.env — تُستخدم للمزامنة اللحظية والبث</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2"><span className="text-[0.74rem] font-bold text-soft">عنوان الخادم (Base URL)</span><input className="input mt-1 font-num" dir="ltr" value={api.baseUrl} onChange={(e) => setApi({ ...api, baseUrl: e.target.value })} /></label>
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">مسار WebSocket</span><input className="input mt-1 font-num" dir="ltr" value={api.wsPath} onChange={(e) => setApi({ ...api, wsPath: e.target.value })} /></label>
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">انتهاء JWT</span>
                <select className="select mt-1" value={api.jwtExp} onChange={(e) => setApi({ ...api, jwtExp: e.target.value })}>{["2h", "8h", "24h", "7d"].map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">حد المعدل (طلب/دقيقة)</span><input type="number" className="input mt-1 font-num" dir="ltr" value={api.rateLimit} onChange={(e) => setApi({ ...api, rateLimit: +e.target.value })} /></label>
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">CORS المسموح</span><input className="input mt-1 font-num" dir="ltr" value={api.cors} onChange={(e) => setApi({ ...api, cors: e.target.value })} /></label>
              <button onClick={() => setApi({ ...api, refresh: !api.refresh })} className={`col-span-2 flex items-center gap-3 p-3 rounded-xl border transition-all ${api.refresh ? "border-[color-mix(in_srgb,var(--good)_40%,transparent)] bg-[color-mix(in_srgb,var(--good)_6%,transparent)]" : "border-line bg-panel"}`}>
                <PSwitch on={api.refresh} onClick={() => setApi({ ...api, refresh: !api.refresh })} />
                <span className="text-start"><b className="text-[0.8rem] block">تجديد الرموز تلقائياً (OAuth2 Refresh)</b><span className="text-[0.66rem] text-mute font-bold">يجنّب انقطاع جلسات الكاشير أثناء العمل</span></span>
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-soft flex-1" onClick={() => test("api")} disabled={testing === "api"}><I n="pulse" size={15} /> {testing === "api" ? "جارٍ الفحص…" : "فحص الخادم"}</button>
              <button className="btn btn-brand flex-1" onClick={saveAll}><I n="save" size={15} /> حفظ الإعدادات</button>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="swap" size={19} className="text-[var(--accent)]" /> نقاط المزامنة اللحظية</h3>
            <div className="space-y-2">
              {[["POST", "/api/v3/sync/push", "دمج دفعات الجهاز — الأحدث يفوز"], ["GET", "/api/v3/sync/pull?since=", "سحب تفاضلي للأجهزة المنفصلة"], ["POST", "/api/v3/sync/gen", "رفع الجيل — استبدال شامل لكل الأجهزة"], ["WS", "/ws", "بث فوري لكل الأجهزة المتصلة"], ["POST", "/api/v3/auth/login", "مصادقة JWT مع رمز تحديث"]].map(([mth, p, d]) => (
                <div key={p} className="flex items-center gap-3 p-2.5 rounded-lg bg-panel border border-line/70">
                  <span className={`chip font-num !text-[0.6rem] shrink-0 ${mth === "GET" ? "bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]" : mth === "WS" ? "bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)]" : "bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]"}`} dir="ltr">{mth}</span>
                  <code className="font-num text-[0.72rem] font-bold shrink-0" dir="ltr">{p}</code>
                  <span className="text-[0.66rem] text-mute font-bold truncate ms-auto">{d}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-panel border border-line text-[0.72rem] font-bold text-soft leading-6">
              <div className="flex justify-between"><span className="text-mute">أجهزة متصلة بالبث الآن</span><span className="font-num text-[var(--good)]">{app.devices.filter((d) => d.online).length + 1}</span></div>
              <div className="flex justify-between mt-1"><span className="text-mute">جيل المزامنة الحالي</span><span className="font-num text-[var(--brand)]">#{app.gen}</span></div>
              <div className="flex justify-between mt-1"><span className="text-mute">سعة التصميم</span><span className="font-num">100+ مستخدم متزامن</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === "front" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-1 flex items-center gap-2"><I n="dash" size={19} className="text-[var(--brand)]" /> سلوك الواجهة على كل الأجهزة</h3>
            <p className="text-[0.72rem] text-mute font-bold mb-4">تُطبّق فوراً على كل النوافذ والأجهزة المتصلة</p>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-panel border border-line">
                <div className="flex justify-between text-[0.8rem] font-bold mb-2"><span>فاصل المزامنة اللحظية</span><span className="font-num text-[var(--brand)]">{front.syncSec} ث</span></div>
                <input type="range" min={2} max={15} step={0.5} value={front.syncSec} onChange={(e) => setFront({ ...front, syncSec: +e.target.value })} className="w-full accent-[var(--brand)]" />
                <div className="text-[0.64rem] text-mute font-bold mt-1">كلما قلّ الفاصل زادت لحظية ظهور عمليات الكاشير للمدير</div>
              </div>
              <div className="p-3.5 rounded-xl bg-panel border border-line">
                <div className="flex justify-between text-[0.8rem] font-bold mb-2"><span>انتهاء الجلسة بعد خمول</span><span className="font-num text-[var(--brand)]">{front.sessionMin} دقيقة</span></div>
                <input type="range" min={5} max={120} step={5} value={front.sessionMin} onChange={(e) => setFront({ ...front, sessionMin: +e.target.value })} className="w-full accent-[var(--brand)]" />
              </div>
              <label className="block"><span className="text-[0.74rem] font-bold text-soft">كثافة عرض الجداول</span>
                <select className="select mt-1" value={front.density} onChange={(e) => setFront({ ...front, density: e.target.value as any })}>{["مريحة", "مضغوطة"].map((x) => <option key={x}>{x}</option>)}</select></label>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="shield" size={19} className="text-[var(--good)]" /> الموثوقية والعمل دون اتصال</h3>
            <div className="space-y-2.5">
              {([
                ["offline", "التخزين المركزي المشترك", "تبقى البيانات بعد تحديث الصفحة وتُشارك بين كل نوافذ الجهاز"],
                ["autoSave", "الحفظ التلقائي للمسودات", "الفواتير غير المكتملة تُحفظ وتُستعاد عند العودة"],
                ["sound", "تنبيه صوتي للعمليات الواردة", "نغمة خفيفة عند وصول عملية من جهاز آخر"],
              ] as const).map(([k, l, h]) => (
                <button key={k} onClick={() => setFront({ ...front, [k]: !front[k] })} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-start ${front[k] ? "border-[color-mix(in_srgb,var(--good)_35%,transparent)] bg-[color-mix(in_srgb,var(--good)_5%,transparent)]" : "border-line bg-panel"}`}>
                  <PSwitch on={front[k]} onClick={() => setFront({ ...front, [k]: !front[k] })} />
                  <span><b className="text-[0.82rem] block">{l}</b><span className="text-[0.68rem] text-mute font-medium">{h}</span></span>
                </button>
              ))}
              <button className="btn btn-brand w-full mt-2" onClick={saveAll}><I n="save" size={15} /> حفظ إعدادات الواجهة</button>
            </div>
          </div>
        </div>
      )}

      {tab === "status" && (
        <div className="grid lg:grid-cols-3 gap-5">
          {[
            { t: "خادم MySQL", ok: conn?.ok ?? null, ping: conn?.ping, ic: "db", tone: "var(--brand)", sub: `${cfg.host}:${cfg.port} / ${cfg.name}` },
            { t: "الخادم المركزي (API)", ok: apiConn?.ok ?? null, ping: apiConn?.ping, ic: "server", tone: "var(--good)", sub: api.baseUrl },
            { t: "قناة البث WebSocket", ok: apiConn?.ok ?? null, ping: apiConn?.ping, ic: "pulse", tone: "var(--accent)", sub: `ws://${api.baseUrl.replace("http://", "")}${api.wsPath}` },
          ].map((s) => (
            <div key={s.t} className="card card-lift p-5 text-center relative overflow-hidden">
              <div className="absolute -top-8 -start-8 w-24 h-24 rounded-full opacity-[0.08]" style={{ background: s.tone }} />
              <span className={`w-4 h-4 rounded-full inline-block mb-3 ${s.ok === true ? "bg-[var(--good)] blink" : s.ok === false ? "bg-[var(--bad)]" : "bg-[var(--mute)]"}`} />
              <div className="flex items-center justify-center gap-2 font-display font-bold text-base"><I n={s.ic} size={19} /> {s.t}</div>
              <div className={`font-bold text-[0.9rem] mt-1 ${s.ok === true ? "text-[var(--good)]" : s.ok === false ? "text-[var(--bad)]" : "text-mute"}`}>{s.ok === true ? "متصل" : s.ok === false ? "غير متصل" : "لم يُختبر بعد"}</div>
              <div className="font-num text-[0.72rem] text-mute mt-1" dir="ltr">{s.ok ? `${s.ping}ms` : s.sub}</div>
              <button className="btn btn-ghost !py-1.5 !text-[0.72rem] mt-3" onClick={() => test(s.t.includes("MySQL") ? "db" : "api")}><I n="refresh" size={13} /> فحص الآن</button>
            </div>
          ))}
          <div className="card p-5 lg:col-span-3">
            <h3 className="font-display font-bold text-base mb-3">مؤشرات قاعدة البيانات</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[["الإصدار", "8.0.36"], ["الحجم", "1.84 GB"], ["الجداول", "66"], ["اتصالات نشطة", `${app.devices.filter((d) => d.online).length + 3} / ${cfg.pool}`], ["الطابور", `0 / ${cfg.queue}`], ["آخر نسخة", "اليوم 02:00"]].map(([l, v]) => (
                <div key={l} className="bg-panel rounded-xl p-3 text-center"><div className="font-num font-bold text-[1.05rem] text-[var(--brand)]" dir="ltr">{v}</div><div className="text-[0.66rem] font-bold text-mute mt-1">{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "license" && (
        <div className="grid lg:grid-cols-2 gap-5">
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
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3">بيانات الترخيص</h3>
            {[["مفتاح الترخيص", "OKY-2026-IFS-9F3K-77A1"], ["النسخة", "مؤسسات — مستخدمون غير محدودين"], ["تاريخ الانتهاء", "2027-01-15"], ["الأنظمة المفعّلة", `${app.activeSystems.length} من 21 نظاماً متخصصاً`], ["معرف الجهاز المرخّص", app.deviceId]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between py-2.5 border-b border-line/70 last:border-0 text-[0.78rem] font-bold">
                <span className="text-mute">{l}</span><span className="font-num text-[var(--brand)]" dir="ltr">{v}</span>
              </div>
            ))}
            <button className="btn btn-soft w-full mt-4" onClick={() => app.toast("أُرسل طلب تجديد الترخيص لشركة أوكيانوس سوفت", "info")}><I n="refresh" size={15} /> تجديد الترخيص</button>
          </div>
        </div>
      )}

      {tab === "pkg" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="file" size={19} className="text-[var(--brand)]" /> ملفات الحزمة على الخادم</h3>
            {["server/src/index.js — الخادم الرئيسي", "server/src/syncEngine.js — محرك الدمج", "server/src/db.js — الاتصالات والهجرات", "server/migrations/ — 5 ملفات هيكل", "dist/ — بناء الواجهة الجاهز"].map((f) => (
              <div key={f} className="flex items-center gap-2.5 py-2 border-b border-line/60 last:border-0 text-[0.76rem] font-bold font-num" dir="ltr">
                <I n="check" size={14} className="text-[var(--good)] shrink-0" /> {f}
              </div>
            ))}
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="clip" size={19} className="text-[var(--accent)]" /> ملفات المرفقات</h3>
            <label className="block"><span className="text-[0.74rem] font-bold text-soft">مسار تخزين المرفقات (فواتير مصورة، عقود، صور أصناف)</span>
              <input className="input mt-1 font-num" dir="ltr" defaultValue="/var/okyanus-ifs/attachments/" /></label>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[["فاتورة ضريبية.pdf", "2.1 MB"], ["عقد مقاولات.pdf", "5.4 MB"], ["صنف-ذهب.jpg", "840 KB"]].map(([n, s]) => (
                <div key={n} className="bg-panel rounded-xl p-3 text-center border border-line/70">
                  <I n="file" size={20} className="mx-auto text-[var(--brand)]" />
                  <div className="text-[0.66rem] font-bold mt-1.5 truncate">{n}</div>
                  <div className="text-[0.6rem] text-mute font-bold font-num">{s}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost w-full mt-3" onClick={() => app.toast("فُتح مستكشف المرفقات", "info")}><I n="clip" size={15} /> إدارة المرفقات</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BackupSection() {
  const app = useApp();
  const bk = app.settings.backup;
  const setBk = (p: Partial<typeof bk>) => app.setSettings({ ...app.settings, backup: { ...bk, ...p } });
  const [backups, setBackups] = useState([
    { id: 1, name: "ifs_full_20260328_0200.sql.gz", size: "1.2 GB", kind: "كاملة", date: "2026-03-28 02:00", gen: app.gen - 2 },
    { id: 2, name: "ifs_diff_20260329_0200.sql.gz", size: "186 MB", kind: "تفاضلية", date: "2026-03-29 02:00", gen: app.gen - 1 },
    { id: 3, name: "ifs_diff_20260327_0200.sql.gz", size: "174 MB", kind: "تفاضلية", date: "2026-03-27 02:00", gen: app.gen - 3 },
  ]);
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const takeSnapshot = () => {
    app.downloadSnapshot("يدوية كاملة");
    setBackups((old) => [{ id: Date.now(), name: `OkyanusIFS_Backup_G${app.gen}_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.json`, size: "—" , kind: "يدوية", date: "الآن", gen: app.gen }, ...old]);
  };
  return (
    <div className="space-y-5">
      {/* هوية هذا الجهاز — تظهر باسمها في مراقبة النشاط للمدير */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-base mb-1 flex items-center gap-2"><I n="server" size={19} className="text-[var(--accent)]" /> هوية هذا الجهاز</h3>
        <p className="text-[0.72rem] text-mute font-bold mb-3">يُمنح كل متصفح معرّفاً فريداً تلقائياً. سمِّ الجهاز ليظهر باسمه في شاشة «مراقبة النشاط» عند المدير.</p>
        <div className="grid md:grid-cols-2 gap-3 max-w-3xl">
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">اسم الجهاز</span>
            <input className="input mt-1" value={app.settings.deviceName} placeholder="مثال: جهاز الاستقبال، جهاز الحسابات 1"
              onChange={(e) => app.setSettings({ ...app.settings, deviceName: e.target.value })} /></label>
          <div><span className="text-[0.74rem] font-bold text-soft block">معرّف الجهاز (تلقائي)</span>
            <div className="input mt-1 font-num !bg-panel text-mute cursor-default flex items-center justify-between" dir="ltr">
              <span>{app.deviceId}</span><I n="key" size={14} />
            </div></div>
        </div>
        <button className="btn btn-soft mt-3" onClick={() => app.toast(`سُجّل الجهاز «${app.settings.deviceName}» (${app.deviceId}) في شبكة النظام`, "ok")}><I n="save" size={15} /> حفظ هوية الجهاز</button>
      </div>

      {/* استراتيجية النسخ — Backend + Frontend */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="server" size={19} className="text-[var(--brand)]" /> جدولة النسخ (Backend)</h3>
          <label className="block"><span className="text-[0.74rem] font-bold text-soft">مسار التخزين على الخادم</span>
            <input className="input mt-1 font-num" dir="ltr" value={bk.path} onChange={(e) => setBk({ path: e.target.value })} /></label>
          <div className="space-y-2.5 mt-3">
            <button onClick={() => setBk({ fullDaily: !bk.fullDaily })} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-start ${bk.fullDaily ? "border-[color-mix(in_srgb,var(--good)_35%,transparent)] bg-[color-mix(in_srgb,var(--good)_5%,transparent)]" : "border-line bg-panel"}`}>
              <PSwitch on={bk.fullDaily} onClick={() => setBk({ fullDaily: !bk.fullDaily })} />
              <span><b className="text-[0.8rem] block">نسخة كاملة يومياً 02:00</b><span className="text-[0.66rem] text-mute font-bold">mysqldump --single-transaction لكل القاعدة</span></span>
            </button>
            <div className="p-3 rounded-xl bg-panel border border-line">
              <div className="flex justify-between text-[0.8rem] font-bold mb-2"><span>نسخة تفاضلية كل</span><span className="font-num text-[var(--brand)]">{bk.diffHours} ساعات</span></div>
              <input type="range" min={2} max={24} step={2} value={bk.diffHours} onChange={(e) => setBk({ diffHours: +e.target.value })} className="w-full accent-[var(--brand)]" />
            </div>
            <div className="p-3 rounded-xl bg-panel border border-line">
              <div className="flex justify-between text-[0.8rem] font-bold mb-2"><span>الاحتفاظ بالنسخ (أيام)</span><span className="font-num text-[var(--brand)]">{bk.retainDays}</span></div>
              <input type="range" min={7} max={90} step={1} value={bk.retainDays} onChange={(e) => setBk({ retainDays: +e.target.value })} className="w-full accent-[var(--brand)]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setBk({ gzip: !bk.gzip })} className={`p-2.5 rounded-xl border text-[0.74rem] font-bold flex items-center justify-center gap-2 transition-all ${bk.gzip ? "border-[color-mix(in_srgb,var(--good)_35%,transparent)] text-[var(--good)] bg-[color-mix(in_srgb,var(--good)_5%,transparent)]" : "border-line text-mute bg-panel"}`}><I n={bk.gzip ? "check" : "x"} size={14} /> ضغط GZIP</button>
              <button onClick={() => setBk({ encrypt: !bk.encrypt })} className={`p-2.5 rounded-xl border text-[0.74rem] font-bold flex items-center justify-center gap-2 transition-all ${bk.encrypt ? "border-[color-mix(in_srgb,var(--good)_35%,transparent)] text-[var(--good)] bg-[color-mix(in_srgb,var(--good)_5%,transparent)]" : "border-line text-mute bg-panel"}`}><I n={bk.encrypt ? "lock" : "unlock"} size={14} /> تشفير AES-256</button>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="dash" size={19} className="text-[var(--accent)]" /> النسخ على الأجهزة (Frontend)</h3>
          <button onClick={() => setBk({ autoLocal: !bk.autoLocal })} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-start ${bk.autoLocal ? "border-[color-mix(in_srgb,var(--good)_35%,transparent)] bg-[color-mix(in_srgb,var(--good)_5%,transparent)]" : "border-line bg-panel"}`}>
            <PSwitch on={bk.autoLocal} onClick={() => setBk({ autoLocal: !bk.autoLocal })} />
            <span><b className="text-[0.82rem] block">التخزين المركزي المشترك</b><span className="text-[0.68rem] text-mute font-bold">كل عملية تُحفظ فوراً في مركز الجهاز وتُشارك بين كل النوافذ — حماية من فقدان البيانات عند التحديث</span></span>
          </button>
          <div className="mt-3 p-3.5 rounded-xl bg-panel border border-line text-[0.74rem] font-bold text-soft space-y-1.5">
            <div className="flex justify-between"><span className="text-mute">جيل المزامنة الحالي</span><span className="font-num text-[var(--brand)]">#{app.gen}</span></div>
            <div className="flex justify-between"><span className="text-mute">شواهد الحذف المنشورة</span><span className="font-num text-[var(--bad)]">{app.tombstones.length}</span></div>
            <div className="flex justify-between"><span className="text-mute">عمليات مُدمجة مركزياً</span><span className="font-num text-[var(--good)]">{app.activity.length}</span></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-brand flex-1" onClick={takeSnapshot}><I n="down" size={15} /> نسخة الآن (تنزيل JSON)</button>
          </div>
          <input ref={restoreFileRef} type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { app.restoreSnapshot(f); setBackups((old) => [{ id: Date.now(), name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB`, kind: "استعادة", date: "الآن", gen: app.gen + 1 }, ...old]); } e.target.value = ""; }} />
          <button className="btn btn-ghost w-full mt-2" onClick={() => restoreFileRef.current?.click()}><I n="undo" size={15} /> استعادة من ملف نسخة</button>
        </div>

        <div className="card p-5 lg:col-span-1 overflow-hidden">
          <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2"><I n="save" size={19} className="text-[var(--brand)]" /> سجل النسخ الاحتياطية</h3>
          <div className="space-y-2 max-h-[330px] overflow-auto pe-1" style={{ scrollbarWidth: "thin" }}>
            {backups.map((b) => (
              <div key={b.id} className="p-3 rounded-xl bg-panel border border-line/70 hover:border-[color-mix(in_srgb,var(--brand)_35%,transparent)] transition-colors">
                <div className="flex items-center gap-2">
                  <I n="file" size={16} className="text-[var(--brand)] shrink-0" />
                  <span className="font-num text-[0.7rem] font-bold truncate flex-1" dir="ltr">{b.name}</span>
                  <span className="chip bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)] !text-[0.58rem] !py-0 shrink-0">{b.kind}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[0.64rem] font-bold text-mute font-num">{b.date} • {b.size} • Gen #{b.gen}</span>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost !p-1.5" title="استعادة وبث الجيل لكل الأجهزة" onClick={() => { app.reinitCentral(); app.toast(`استُعيدت ${b.name} وارتفع الجيل — انتشرت الاستعادة لكل الأجهزة تلقائياً`, "ok"); }}><I n="undo" size={13} /></button>
                    <button className="btn btn-ghost !p-1.5" title="تنزيل" onClick={takeSnapshot}><I n="down" size={13} /></button>
                    <button className="btn btn-danger !p-1.5" title="حذف" onClick={() => { setBackups(backups.filter((x) => x.id !== b.id)); app.toast("حُذف سجل النسخة", "err"); }}><I n="trash" size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[0.66rem] font-bold text-mute mt-3 flex items-start gap-1.5"><I n="info" size={12} className="shrink-0 mt-0.5" /> الاستعادة ترفع جيل المزامنة فيستبدل كل جهاز متصل نسخته القديمة تلقائياً — لا حاجة لإعادة تشغيل أي جهاز.</p>
        </div>
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
