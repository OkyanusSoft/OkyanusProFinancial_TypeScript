import { useState } from "react";
import { useApp } from "../store";
import { I, Modal, Chip, Logo, Reveal } from "../ui";
import { CHANGELOG, SYSTEM } from "../data";

export default function Help() {
  const app = useApp();
  const [tab, setTab] = useState("guide");
  const [showLog, setShowLog] = useState(false);
  const [doc, setDoc] = useState("sql");

  return (
    <div className="anim-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-xl grid place-items-center text-[var(--brandink)] shadow-lg" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand2))" }}><I n="life" size={23} /></span>
          <div>
            <h1 className="font-display font-bold text-2xl leading-tight">المساعدة</h1>
            <p className="text-mute text-[0.82rem] font-medium mt-0.5">دليل المستخدم، حول النظام، ووثائق المطورين — {SYSTEM.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => setShowLog(true)}><I n="clock" size={15} /> Change Log</button>
          <a className="btn btn-brand no-underline" href={SYSTEM.help} target="_blank" rel="noreferrer"><I n="life" size={15} /> دعم فني</a>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-line mb-5 px-1">
        {[["guide", "دليل المستخدم", "book"], ["about", "حول النظام", "info"], ["dev", "وثائق المطورين", "code"]].map(([id, l, ic]) => (
          <button key={id} onClick={() => setTab(id)} className={`tabline flex items-center gap-1.5 px-3.5 py-2.5 text-[0.82rem] font-bold whitespace-nowrap transition-colors ${tab === id ? "on text-[var(--brand)]" : "text-mute hover:text-ink"}`}>
            <I n={ic} size={15} /> {l}
          </button>
        ))}
      </div>

      {tab === "guide" && (
        <div>
          <p className="text-[0.82rem] font-bold text-soft mb-4 leading-6">
            يغطي هذا الدليل الأنظمة العاملة كافة: <b className="text-[var(--brand)]">لوحة التحكم، المخازن والمستودعات، المشتريات والموردون، المبيعات والعملاء، نقاط البيع، الحسابات العامة، الموارد البشرية، الأصول الثابتة، والأنظمة المتخصصة</b> — مع دورة العمل الكاملة لكل نظام.
          </p>
          <div className="grid md:grid-cols-2 gap-4 stagger">
          {[
            { ic: "dash", t: "لوحة التحكم", steps: ["نظرة لحظية على المبيعات والمشتريات والسيولة والذمم", "نبض النشاط: وحدات الأنظمة المتخصصة بأعدادها ومبالغها", "شريط الوصول السريع لأهم الشاشات", "تنبيهات الرقابة: الأصناف الراكدة وتجاوز الحدود الائتمانية"] },
            { ic: "box", t: "المخازن والمستودعات", steps: ["أنشئ الأصناف في دليل الأصناف مع الباركود والحدود", "رحّل سند قيد افتتاحي مخزني أو سند توريد", "راقب الأرصدة من تقرير أرصدة المخازن وبطاقة الصنف", "نفّذ جرداً دورياً ورحّل فروقاته بتسوية"] },
            { ic: "truck", t: "المشتريات والموردون", steps: ["اطلب شراءً (مسودة ← اعتماد ← تحويل)", "قارن عروض أسعار الموردين", "أصدر فاتورة مشتريات نقدي أو آجل", "تابع الذمم من فواتير مشتريات آجل وسجّل الدفعات"] },
            { ic: "tag", t: "المبيعات والعملاء", steps: ["أصدر عرض سعر وقبوله يحوّله لفاتورة", "رحّل فاتورة مبيعات (نقدي / آجل) — يُفحص الحد الائتماني", "عند الاسترجاع أصدر فاتورة مرتجع مبيعات", "حلّل الأداء من تقارير المبيعات اليومية والشهرية"] },
            { ic: "coins", t: "نقاط البيع", steps: ["يفعّل نمطه تلقائياً حسب النشاط (تجزئة / مطاعم)", "بيع مباشر بالسلة مع خصم وضريبة", "فاتورة نقدية تُرحّل فوراً للمخزون والحسابات", "متابعة مبيعات الكاشير لحظياً من لوحة التحكم"] },
            { ic: "book", t: "الحسابات العامة", steps: ["افتح فترات السنة وأقفلها عند اكتمالها", "رحّل قيود اليومية وسندات القبض والصرف — يجب توازن القيد", "اربط الأسماء التفصيلية بالحسابات التحليلية", "أخرج ميزان المراجعة وميزان العمومية وقائمة الدخل وحركة القيود"] },
            { ic: "users", t: "الموارد البشرية", steps: ["أنشئ ملفات الموظفين واربطهم بالإدارات والأقسام", "سجّل الحضور والانصراف والمكافآت والإنذارات", "اعتمد الإجازات والأذونات", "أصدر كشوف الرواتب ورحّلها كقيد محاسبي"] },
            { ic: "layers", t: "الأصول الثابتة", steps: ["سجّل الأصول بتكلفتها وعمرها الافتراضي وقيمتها التخريدية", "يحسب إهلاك القسط الثابت تلقائياً", "رحّل قسط الإهلاك السنوي كقيد محاسبي", "استبعد الأصول المنتهية من الخدمة"] },
            { ic: "shield", t: "الإدارة والأمان", steps: ["أنشئ المستخدمين وحدّد أدوارهم", "اضبط مصفوفة الصلاحيات على مستوى الشاشة والزر", "اختبر اتصال MySQL من الإعدادات ← قاعدة البيانات", "استعن بالوكيل الذكي للتشخيص الذاتي والإصلاح"] },
            { ic: "palette", t: "التخصيص والتفضيلات", steps: ["اختر من 10 أنماط مظهر احترافية", "خصص خلفية الشريط الجانبي وشاشة الدخول", "اضبط حجم الخط ودرجة الوضوح والاتجاه والتنسيقات", "احفظ تفضيلاتك لتُطبّق في كل جلساتك"] },
          ].map((g, i) => (
            <Reveal key={g.t} delay={i * 60}>
              <div className="card card-lift p-5">
                <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-lg grid place-items-center bg-[color-mix(in_srgb,var(--brand)_11%,transparent)] text-[var(--brand)]"><I n={g.ic} size={18} /></span>
                  {g.t}
                </h3>
                <ol className="space-y-2">
                  {g.steps.map((s, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[0.78rem] font-bold text-soft leading-6">
                      <span className="w-5 h-5 rounded-full grid place-items-center text-[0.62rem] font-num font-bold bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)] shrink-0 mt-0.5">{j + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          ))}
          </div>
        </div>
      )}

      {tab === "about" && (
        <div className="max-w-3xl mx-auto">
          <Reveal><div className="card p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: "linear-gradient(90deg, var(--brand), var(--accent), var(--brand))" }} />
            <div className="flex justify-center mb-4"><Logo size={64} /></div>
            <h2 className="font-display font-bold text-3xl">{SYSTEM.name}</h2>
            <p className="text-[0.82rem] font-bold text-mute mt-1 font-num" dir="ltr">{SYSTEM.en}</p>
            <p className="text-[0.84rem] font-medium text-soft leading-7 mt-4 max-w-xl mx-auto">
              نظام محاسبي مالي إداري إنتاجي متكامل يتكيف مع جميع الأنشطة التجارية والخدمية والمصنعية والطبية:
              قيد مزدوج متعدد العملات، دليل حسابات من 5 مستويات، حسابات تحليلية، إقفال فترات محصّن،
              مزامنة مركزية لحظية، و21 نظاماً متخصصاً — بقاعدة بيانات تكيفية واحدة وتقارير بمعايير IFRS.
            </p>
            <div className="mt-5 rounded-xl border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] px-5 py-3.5 inline-flex items-center gap-3">
              <span className="w-9 h-9 rounded-full grid place-items-center bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent)]"><I n="edit" size={17} /></span>
              <div className="text-start">
                <div className="text-[0.66rem] font-bold text-mute">{SYSTEM.authorRole}</div>
                <div className="font-display font-bold text-[0.95rem] text-[var(--accent)]">{SYSTEM.author}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[["الإصدار الحالي", SYSTEM.version], ["قاعدة البيانات", "MySQL 8.0"], ["المصادقة", "JWT / OAuth2"], ["المعمارية", "Modular"]].map(([k, v]) => (
                <div key={k} className="bg-panel rounded-xl p-3 border border-line"><div className="text-[0.64rem] font-bold text-mute">{k}</div><div className="font-num font-bold text-[0.9rem] mt-0.5" dir="ltr">{v}</div></div>
              ))}
            </div>
            <button className="btn btn-brand mt-6" onClick={() => setShowLog(true)}><I n="clock" size={16} /> سجل التغييرات (Change Log)</button>
          </div></Reveal>
          <Reveal delay={100}><div className="card p-5 mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[0.8rem] font-bold text-soft">
              <div className="flex items-center gap-2"><I n="bld" size={16} className="text-[var(--brand)]" /> {SYSTEM.company} — {SYSTEM.companyEn}</div>
              <div className="flex items-center gap-2 mt-1.5"><I n="phone" size={16} className="text-[var(--good)]" /> <span className="font-num text-lg text-[var(--brand)]" dir="ltr">{SYSTEM.phone}</span></div>
            </div>
            <div className="text-end text-[0.72rem] font-bold text-mute">
              <div>{SYSTEM.cr}</div>
              <a href={SYSTEM.site} target="_blank" rel="noreferrer" className="text-[var(--brand)] hover:underline font-num" dir="ltr">{SYSTEM.site}</a>
            </div>
          </div></Reveal>
        </div>
      )}

      {tab === "dev" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {[["sql", "قاعدة البيانات SQL + ERD", "db"], ["sync", "المزامنة والـBackend", "swap"], ["api", "واجهة APIs (OpenAPI)", "code"], ["plan", "الخطة التنفيذية (Sprints)", "cal"]].map(([id, l, ic]) => (
              <button key={id} onClick={() => setDoc(id)} className={`btn !py-2 ${doc === id ? "btn-brand" : "btn-ghost"}`}><I n={ic} size={15} /> {l}</button>
            ))}
            <button className="btn btn-ghost ms-auto" onClick={() => app.toast("نُزلت حزمة الوثائق كاملة (PDF + SQL)", "ok")}><I n="down" size={15} /> تنزيل الحزمة</button>
          </div>
          {doc === "sql" && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-line bg-panel flex items-center justify-between">
                <span className="font-display font-bold text-sm">okyanus_ifs_schema.sql — هيكل قاعدة البيانات مع المحفزات</span>
                <Chip s="مرحّل" />
              </div>
              <pre className="codeblock" dir="ltr">{`-- ═══ ERD: accounts(1) ─< journal_lines(N) >─ journals(1)
--      items ─< inv_doc_lines >─ inv_docs | partners ─< invoices
CREATE TABLE accounts (
  code VARCHAR(12) PRIMARY KEY, parent_code VARCHAR(12),
  name_ar VARCHAR(120) NOT NULL, level TINYINT CHECK (level BETWEEN 1 AND 5),
  type ENUM('assets','liabilities','equity','revenue','expense'),
  is_posting BOOL DEFAULT 0, is_analytical BOOL DEFAULT 0,
  FOREIGN KEY (parent_code) REFERENCES accounts(code)
);
CREATE TABLE journals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, ref_no VARCHAR(30) UNIQUE,
  doc_date DATE NOT NULL, fy_period CHAR(7) NOT NULL,
  status ENUM('posted','void','pending') DEFAULT 'pending'
);
CREATE TABLE journal_lines (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, journal_id BIGINT,
  account_code VARCHAR(12), analytic_id BIGINT NULL,
  cost_center VARCHAR(12), currency CHAR(3), rate DECIMAL(12,4),
  debit DECIMAL(15,2) DEFAULT 0, credit DECIMAL(15,2) DEFAULT 0,
  FOREIGN KEY (journal_id) REFERENCES journals(id)
);
-- ★ محفز توازن القيد المزدوج (يُفشل أي قيد غير متوازن)
DELIMITER $$
CREATE TRIGGER trg_je_balance AFTER INSERT ON journal_lines
FOR EACH ROW BEGIN
  DECLARE d DECIMAL(15,2); DECLARE c DECIMAL(15,2);
  SELECT SUM(debit),SUM(credit) INTO d,c
    FROM journal_lines WHERE journal_id = NEW.journal_id;
  IF ABS(d-c) > 0.01 AND (SELECT COUNT(*) FROM journal_lines
      WHERE journal_id=NEW.journal_id) >= 2 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unbalanced entry';
  END IF; END$$
-- ★ محفز حماية الفترات المقفلة
CREATE TRIGGER trg_period_lock BEFORE INSERT ON journals
FOR EACH ROW BEGIN
  IF EXISTS (SELECT 1 FROM periods WHERE id=NEW.fy_period AND locked=1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Period locked';
  END IF; END$$
DELIMITER ;

-- ═══ جداول المزامنة المركزية اللحظية (يرمّمها الخادم تلقائياً عند التشغيل) ═══
CREATE TABLE IF NOT EXISTS device_registry (
  device_id   VARCHAR(16) PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL,
  username    VARCHAR(60), role VARCHAR(60), category VARCHAR(40),
  ip          VARCHAR(45), online TINYINT(1) DEFAULT 0,
  ops         INT UNSIGNED DEFAULT 0,
  last_seen   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS activity_log (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id   VARCHAR(16), username VARCHAR(60), role VARCHAR(60),
  category    VARCHAR(40), action VARCHAR(255),
  op_type     ENUM('create','update','delete','login','sync'),
  created_at  TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),   -- يُضاف ولا يُحذف أبداً
  KEY idx_cat_time (category, created_at)
);
CREATE TABLE IF NOT EXISTS deletions (          -- شواهد الحذف Tombstones
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  collection  VARCHAR(40), record_id VARCHAR(40), label VARCHAR(120),
  deleted_by  VARCHAR(60), gen INT UNSIGNED,
  created_at  TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_del (collection, record_id)     -- الحذف ينتشر مرة واحدة لكل الأجهزة
);
-- جيل المزامنة: عند الحذف الكلي يرتفع فتستبدل كل الأجهزة نسختها القديمة
CREATE TABLE IF NOT EXISTS sync_meta ( k VARCHAR(20) PRIMARY KEY, v INT UNSIGNED );
INSERT IGNORE INTO sync_meta(k,v) VALUES ('gen', 1);`}</pre>
            </div>
          )}
          {doc === "sync" && (
            <div className="space-y-4">
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-line bg-panel flex items-center justify-between">
                  <span className="font-display font-bold text-sm">الخادم المركزي — مجلد server/ (Express + MySQL 8 + WebSocket)</span>
                  <Chip s="ساري" />
                </div>
                <pre className="codeblock" dir="ltr">{`server/
├─ package.json            # npm install && npm run migrate && npm start
├─ .env.example            # DB + JWT + حجم حزمة الاتصالات (100+ مستخدم)
├─ src/
│  ├─ index.js             # Express + JWT + WS Hub (بث لحظي لكل الأجهزة)
│  ├─ db.js                # حزمة اتصالات + منفّذ Migrations مرقّم
│  └─ syncEngine.js        # دمج «الأحدث يفوز» + Tombstones + Gen
└─ migrations/             # تُنفَّذ بالترتيب وتُسجَّل في schema_migrations
   ├─ 0001_core_schema.sql       # الأنظمة الأساسية + محفزات حماية
   ├─ 0002_activity_engine.sql   # قاعدة تكيفية: 21 نظاماً بجداول مرنة JSON
   ├─ 0003_sync_realtime.sql     # sync_records / sync_ops / tombstones / generations
   ├─ 0004_hr_assets.sql         # الموارد البشرية + الأصول وإجراء الإهلاك السنوي
   └─ 0005_alter_patterns.sql    # أنماط إضافة/تعديل أي جدول أو عمود (آمنة للتكرار)`}</pre>
              </div>
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-line bg-panel">
                  <span className="font-display font-bold text-sm">عقد المزامنة اللحظية (مطابق في المتصفح والخادم)</span>
                </div>
                <pre className="codeblock" dir="ltr">{`1) دمج على مستوى السجل — الأحدث يفوز:
   كل صف يحمل updatedAt؛ INSERT … ON DUPLICATE KEY UPDATE
   يقبل الصف الأحدث فقط → لا يمحُ جهازٌ بياناتَ جهاز آخر أبداً.

2) نشر الحذف — Tombstones:
   مفتاح فريد (coll, record_id) → المحذوف يختفي من كل الأجهزة ولا يعود.

3) الاستبدال الشامل — رقم الجيل Gen:
   الاستعادة/إعادة التهيئة ترفع generations.current وتبث لقطة كاملة،
   فتستبدل كل الأجهزة المتصلة نسختها القديمة تلقائياً.

4) البث اللحظي:
   المتصفح: BroadcastChannel (جرّب نافذتين متجاورتين!)
   الخادم: WebSocket Hub + سحب تفاضلي GET /sync/pull?since=seq

5) تحمل 100+ مستخدم متزامن:
   حزمة اتصالات MySQL بحجم 40 + طابور 200 + فهارس updated_at
   + دمج كل دفعة في معاملة واحدة + Rate Limit لكل جهاز.
   التحقّق من شاشة: إدارة النظام ← مراقبة النشاط ← فحص التزامن والحمل.`}</pre>
              </div>
            </div>
          )}
          {doc === "api" && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-line bg-panel flex items-center justify-between">
                <span className="font-display font-bold text-sm">OpenAPI 3.1 — المصادقة OAuth2 (Bearer JWT) + تجديد تلقائي</span>
                <Chip s="ساري" />
              </div>
              <pre className="codeblock" dir="ltr">{`POST /api/v3/auth/token          # تسجيل الدخول → access + refresh
GET  /api/v3/inventory/items     # الأصناف (ترقيم، بحث، ترحيل صفحات)
POST /api/v3/inventory/docs      # سند مخزني (توريد/صرف/تحويل/تسوية/جرد)
POST /api/v3/inventory/docs/{id}/void   # تراجع مع عكس الكميات
POST /api/v3/purchases/invoices  # فاتورة مشتريات {payType: cash|credit}
POST /api/v3/purchases/invoices/{id}/payments  # دفعة سداد
POST /api/v3/sales/invoices      # فحص الحد الائتماني قبل الترحيل 409
POST /api/v3/gl/journals         # قيد يومية — 422 إن لم يتوازن
POST /api/v3/gl/periods/{id}/close      # إقفال فترة (صلاحية خاصة)
GET  /api/v3/reports/trial-balance?from&to&format=excel|pdf
# أكواد الخطأ: 401 رمز منتهٍ | 403 صلاحية | 409 حد ائتماني | 423 فترة مقفلة`}</pre>
            </div>
          )}
          {doc === "plan" && (
            <div className="grid md:grid-cols-2 gap-4 stagger">
              {[
                { n: "Sprint 1", w: "أسبوع 1–2", t: "الأساس", items: ["قاعدة البيانات والهيكل (ERD + محفزات)", "المصادقة والصلاحيات", "دليل الحسابات والفترات"] },
                { n: "Sprint 2", w: "أسبوع 3–4", t: "المخزون", items: ["الأدلة الأربعة + الاستيراد", "السندات الستة مع التراجع", "التقارير الخمسة"] },
                { n: "Sprint 3", w: "أسبوع 5–6", t: "التجارة", items: ["المشتريات والموردون + الآجل", "المبيعات والحدود الائتمانية", "المرتجعات وعروض الأسعار"] },
                { n: "Sprint 4", w: "أسبوع 7–8", t: "المحاسبة", items: ["القيود الخمسة والتوازن", "الحسابات التحليلية", "تقارير IFRS الأربعة"] },
                { n: "Sprint 5", w: "أسبوع 9", t: "الإدارة", items: ["الإعدادات وقاعدة البيانات", "النسخ الاحتياطي والتفعيل", "التفضيلات الكاملة"] },
                { n: "Sprint 6", w: "أسبوع 10", t: "التسليم", items: ["اختبارات القبول UAT", "تدريب المستخدمين", "الإطلاق والتوثيق النهائي"] },
              ].map((s, i) => (
                <div key={s.n} className="card card-lift p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold text-base">{s.n} — {s.t}</h3>
                    <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)]">{s.w}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {s.items.map((x) => <li key={x} className="flex items-center gap-2 text-[0.78rem] font-bold text-soft"><I n="check" size={14} className="text-[var(--good)]" /> {x}</li>)}
                  </ul>
                  <div className="mt-3 h-1.5 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full" style={{ width: `${100 - i * 12}%`, background: "linear-gradient(90deg, var(--brand), var(--accent))" }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={showLog} onClose={() => setShowLog(false)} wide icon="clock" title="سجل التغييرات — Change Log">
        <div className="relative ps-6">
          <span className="absolute top-1 bottom-1 start-[9px] w-px bg-[color-mix(in_srgb,var(--brand)_30%,transparent)]" />
          <div className="space-y-6">
            {CHANGELOG.map((c, i) => (
              <div key={c.v} className="relative anim-rise" style={{ animationDelay: `${i * 80}ms` }}>
                <span className={`absolute -start-6 top-1 w-[19px] h-[19px] rounded-full border-[3px] border-[var(--surface)] ${i === 0 ? "bg-[var(--brand)] blink" : "bg-[color-mix(in_srgb,var(--brand)_45%,var(--mute))]"}`} />
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-num font-bold text-[0.95rem]" dir="ltr">v{c.v}</span>
                  <span className={`chip ${i === 0 ? "bg-[color-mix(in_srgb,var(--brand)_13%,transparent)] text-[var(--brand)]" : "bg-[color-mix(in_srgb,var(--mute)_13%,transparent)] text-[var(--soft)]"}`}>{c.tag}</span>
                  <span className="text-[0.68rem] font-bold text-mute font-num" dir="ltr">{c.date}</span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {c.items.map((it) => <li key={it} className="flex items-start gap-2 text-[0.78rem] font-bold text-soft leading-6"><I n="check" size={13} className="text-[var(--good)] mt-1 shrink-0" /> {it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
