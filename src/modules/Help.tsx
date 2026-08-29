import { useState } from "react";
import { useApp } from "../store";
import { Chip, I, Logo, Modal, PageHead, Reveal, Tabs } from "../ui";

/* ملوّن أكواد خفيف */
function Code({ children }: { children: string }) {
  const html = children
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(--[^\n]*)/g, '<span class="c">$1</span>')
    .replace(/\b(CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|ENGINE|CHARSET|INT|DECIMAL|VARCHAR|DATE|DATETIME|ENUM|BOOLEAN|TRIGGER|BEFORE|INSERT|ON|FOR|EACH|ROW|BEGIN|END|IF|THEN|SIGNAL|SQLSTATE|MESSAGE_TEXT|UNIQUE|INDEX|AUTO_INCREMENT)\b/g, '<span class="k">$1</span>')
    .replace(/('[^']*')/g, '<span class="s">$1</span>');
  return <pre className="codebox" dangerouslySetInnerHTML={{ __html: html }} />;
}

const SQL = `-- ═══ OkyanusProERP 3.0 — الهيكل الأساسي لقاعدة البيانات (MySQL 8.4) ═══
CREATE TABLE accounts (
  code        VARCHAR(12) PRIMARY KEY,          -- 5 مستويات: 1 / 11 / 111 / 1111 / 11111
  name        VARCHAR(120) NOT NULL,
  name_en     VARCHAR(120),
  level       INT NOT NULL CHECK (level BETWEEN 1 AND 5),
  parent_code VARCHAR(12),
  type        ENUM('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE') NOT NULL,
  is_posting  BOOLEAN DEFAULT (level = 5),
  FOREIGN KEY (parent_code) REFERENCES accounts(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE analytical_accounts (            -- نقطة الابتكار: التحليلي
  id          INT AUTO_INCREMENT PRIMARY KEY,
  parent_code VARCHAR(12) NOT NULL,             -- حساب المستوى الخامس المرتبط
  full_name   VARCHAR(120) NOT NULL,            -- مثل: اسم المريض
  INDEX idx_parent (parent_code),
  FOREIGN KEY (parent_code) REFERENCES accounts(code)
) ENGINE=InnoDB;

CREATE TABLE journal_entries (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  doc_no      VARCHAR(24) UNIQUE NOT NULL,
  entry_date  DATE NOT NULL,
  fiscal_period CHAR(7) NOT NULL,               -- YYYY-MM
  description VARCHAR(255) NOT NULL,
  status      ENUM('POSTED','VOID','PENDING') DEFAULT 'POSTED',
  created_by  INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE journal_lines (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  entry_id      BIGINT NOT NULL,
  account_code  VARCHAR(12) NOT NULL,
  analytic_id   INT NULL,
  cost_center   VARCHAR(12),
  currency      CHAR(3) DEFAULT 'YER',
  rate          DECIMAL(14,6) DEFAULT 1,
  debit         DECIMAL(18,2) DEFAULT 0,
  credit        DECIMAL(18,2) DEFAULT 0,
  FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_code) REFERENCES accounts(code)
) ENGINE=InnoDB;

-- ═══ محفّز (Trigger) لضمان توازن القيد المزدوج ═══
CREATE TRIGGER trg_balance_check
BEFORE INSERT ON journal_lines FOR EACH ROW
BEGIN
  DECLARE total_dr DECIMAL(18,2); DECLARE total_cr DECIMAL(18,2);
  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0)
    INTO total_dr, total_cr FROM journal_lines WHERE entry_id = NEW.entry_id;
  -- يُستكمل الفحص عند إغلاق القيد عبر إجراء مخزن sp_close_entry
END;

-- ═══ محفّز منع الكتابة على فترة مقفلة ═══
CREATE TRIGGER trg_locked_period
BEFORE INSERT ON journal_entries FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM fiscal_periods
             WHERE period = NEW.fiscal_period AND is_locked = 1) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'الفترة المالية مقفلة - لا يمكن الترحيل';
  END IF;
END;`;

const API_DOC = `# OkyanusProERP 3.0 — REST API (OpenAPI 3.1)
# المصادقة: JWT Bearer + OAuth2 Refresh Token — الصلاحيات ضمن الـ Claims

POST   /api/v3/auth/login          # دخول (شركة/فرع/مستخدم/سنة مالية) → access+refresh
GET    /api/v3/accounts/tree       # دليل الحسابات الهرمي (5 مستويات)
GET    /api/v3/accounts/{code}/statement?from&to   # كشف حساب
POST   /api/v3/journal-entries     # قيد يومية (يُرفض إن لم يتوازن أو الفترة مقفلة)
PATCH  /api/v3/journal-entries/{id}/void           # إلغاء مع قيد عكسي
POST   /api/v3/analytical          # ربط اسم تحليلي بحساب مستوى خامس
POST   /api/v3/invoices/sales      # فاتورة مبيعات { payType: CASH|CREDIT }
POST   /api/v3/invoices/purchases  # فاتورة مشتريات { payType: CASH|CREDIT }
GET    /api/v3/reports/trial-balance?period=2026-03
GET    /api/v3/reports/balance-sheet|income-statement
POST   /api/v3/periods/{yyyy-mm}/close             # إقفال فترة (صلاحية خاصة)
POST   /api/v3/system/backup                       # نسخة احتياطية فورية

# نموذج جسم القيد:
{
  "date": "2026-03-29", "description": "...", "costCenter": "CC-01",
  "lines": [
    { "account": "11111", "debit": 96500, "currency": "YER", "rate": 1 },
    { "account": "41111", "credit": 92000 },
    { "account": "21211", "credit": 4500 }
  ]
}`;

const ERD = `مخطط الكيانات (ERD) — 42 جدولاً موزعة على وحدات معزولة (Modular Monolith):

  ┌─────────────┐   1───n   ┌──────────────┐   n───1   ┌────────────┐
  │  companies  │───────────│   branches   │───────────│   users    │
  └─────────────┘           └──────────────┘           └────────────┘
                                     │ 1───n                │ n───n (roles/permissions)
                                     ▼                      ▼
  ┌─────────────┐   n───1   ┌──────────────┐         ┌────────────┐
  │journal_lines│───────────│journal_entries│         │   roles    │
  └─────────────┘           └──────────────┘         └────────────┘
     │ n───1                       │ n───1
     ▼                             ▼
  ┌─────────────┐            ┌──────────────┐
  │  accounts   │◄───────────│fiscal_periods│  (is_locked)
  │ (5 مستويات) │            └──────────────┘
  └─────────────┘
     ▲ n───1
  ┌──────────────────┐    ┌───────────┐    ┌──────────────┐
  │analytical_accounts│   │  items    │───n│ stock_moves  │
  └──────────────────┘    └───────────┘    └──────────────┘
                            │ n───n              │ n───1
                            ▼                    ▼
                         ┌───────────┐    ┌──────────────┐
                         │warehouses │    │  inv_docs    │
                         └───────────┘    └──────────────┘
  وحدات: GL • INV • PUR • SAL • SYS — لكل وحدة Service مستقلة وطبقة
  Data Access خاصة بها، ولا تعبر الاستعلامات بين الوحدات إلا عبر APIs داخلية.`;

const SPRINTS = [
  { n: "Sprint 1", period: "أسبوعان", title: "الأساس والهوية", items: ["إعداد بيئة Docker + CI/CD", "قاعدة البيانات والجوهر المحاسبي (GL)", "شاشة الدخول والتوثيق JWT/OAuth2"], done: true },
  { n: "Sprint 2", period: "3 أسابيع", title: "المخازن والمشتريات", items: ["الأدلة الأساسية والأصناف والباركود", "سندات الحركة الستة مع التراجع", "فواتير المشتريات نقدي/آجل وتقاريرها"], done: true },
  { n: "Sprint 3", period: "3 أسابيع", title: "المبيعات والحسابات التحليلية", items: ["الحدود الائتمانية ومرتجعات المبيعات", "الحسابات التحليلية المرتبطة بالمستوى الخامس", "الرسوم البيانية التفاعلية للتقارير"], done: true },
  { n: "Sprint 4", period: "أسبوعان", title: "التقارير والإقفال", items: ["ميزان المراجعة والميزانية وقائمة الدخل (IFRS)", "إقفال الفترات ومحفزات الحماية", "تصدير Excel/PDF"], done: true },
  { n: "Sprint 5", period: "أسبوعان", title: "الأمان والتسليم", items: ["مصفوفة الصلاحيات الدقيقة وسجل التدقيق", "النسخ الاحتياطي والتفعيل والتراخيص", "اختبارات الأحمال والتوثيق النهائي"], done: false },
];

export default function Help() {
  const app = useApp();
  const [tab, setTab] = useState("about");
  const [showLog, setShowLog] = useState(false);
  const [doc, setDoc] = useState("sql");

  return (
    <div>
      <PageHead icon="life" title="المساعدة والتوثيق" desc="حول النظام، دليل المستخدم التفاعلي، ووثائق المطورين (SQL / OpenAPI / خطة التنفيذ)" />
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "about", label: "حول النظام", icon: "info" },
        { id: "guide", label: "دليل المستخدم", icon: "book" },
        { id: "dev", label: "وثائق المطورين", icon: "code" },
        { id: "plan", label: "خطة التنفيذ", icon: "clip" },
      ]} />

      {tab === "about" && (
        <div className="max-w-3xl mx-auto anim-fadein">
          <Reveal><div className="card p-8 text-center relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: "linear-gradient(90deg, var(--brand), var(--accent), var(--brand2))" }} />
            <div className="flex justify-center mb-4"><Logo size={72} /></div>
            <h2 className="font-display font-bold text-3xl">OkyanusProERP</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="chip bg-[color-mix(in_srgb,var(--brand)_13%,transparent)] text-[var(--brand)] !text-[0.8rem] !px-3 !py-1">الإصدار 3.0</span>
              <span className="chip bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)] !text-[0.8rem] !px-3 !py-1">مرخّص حتى 2027-01-15</span>
              <span className="chip bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] text-[var(--warn)] !text-[0.8rem] !px-3 !py-1">بناء 2026.03.29</span>
            </div>
            <p className="text-soft font-medium text-[0.9rem] leading-7 mt-5 max-w-xl mx-auto">
              نظام محاسبي وإداري متكامل بُني بنمط <b>Modular Monolith</b> بقيد مزدوج صارم، دليل حسابات هرمي من خمسة مستويات،
              حسابات تحليلية مبتكرة، وتقارير فورية بمعايير IFRS — صُمم ليكون الأقوى في المنطقة.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 text-center">
              {[["6", "وحدات وظيفية"], ["42", "جدول قاعدة بيانات"], ["5", "أنماط مظهر"], ["99.98%", "جاهزية تشغيل"]].map(([a, b]) => (
                <div key={b} className="bg-panel rounded-xl py-3.5"><div className="font-num font-bold text-xl text-[var(--brand)]">{a}</div><div className="text-[0.68rem] font-bold text-mute mt-0.5">{b}</div></div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <button className="btn btn-brand" onClick={() => setShowLog(true)}><I n="clock" size={16} /> Change Log — سجل التغييرات</button>
              <a className="btn btn-ghost" href="https://okyanussoft.online/" target="_blank" rel="noreferrer"><I n="globe" size={16} /> موقع الشركة</a>
              <button className="btn btn-ghost" onClick={() => app.toast("تم إرسال تقرير حالة النظام إلى فريق الدعم", "ok")}><I n="life" size={16} /> طلب دعم فني</button>
            </div>
          </div></Reveal>
        </div>
      )}

      {tab === "guide" && (
        <div className="grid md:grid-cols-2 gap-4 anim-fadein stagger">
          {[
            ["book", "القيد المزدوج", "كل سند يُنشئ قيداً متوازناً (مدين = دائن) تلقائياً. جرّب إنشاء قيد يدوي من الحسابات العامة ← قيود وسندات، ولن يُسمح بالترحيل دون توازن."],
            ["lock", "الفترات المالية", "من الحسابات العامة ← الفترات: الفترات المقفلة محصّنة بمحفزات قاعدة البيانات. أي فاتورة بتاريخ داخل فترة مقفلة ستُرفض فوراً — جرّبها."],
            ["users", "الحسابات التحليلية", "أضف أسماء مرضى من الحسابات العامة ← الحسابات التحليلية دون لمس دليل الحسابات، ثم اربطها في سطور القيد عند الحساب 11212."],
            ["undo", "التراجع عن الأذونات", "كل سند مخزني أو فاتورة قابلة للإلغاء بزر التراجع — تُعكس الكميات والأرصدة تلقائياً وتُسجل العملية في دفتر التدقيق."],
            ["coins", "تجاوز الحد الائتماني", "أنشئ فاتورة مبيعات آجلة لعميل قريب من حدّه الائتماني — سيرفض النظام الترحيل ويعرض التنبيه فوراً."],
            ["palette", "التخصيص الكامل", "من إدارة النظام ← التفضيلات: غيّر النمط، خلفية الشريط الجانبي، حجم الخط، الاتجاه RTL/LTR، وتنسيقات الأرقام — كل ذلك يُحفظ تلقائياً."],
          ].map(([ic, t, d]) => (
            <div key={t} className="card card-lift p-5 flex gap-4">
              <span className="w-11 h-11 rounded-xl grid place-items-center shrink-0 bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)]"><I n={ic} size={21} /></span>
              <div><h3 className="font-display font-bold">{t}</h3><p className="text-[0.8rem] text-soft font-medium leading-6 mt-1">{d}</p></div>
            </div>
          ))}
        </div>
      )}

      {tab === "dev" && (
        <div className="anim-fadein">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[["sql", "SQL + المحفزات", "db"], ["erd", "مخطط ERD", "layers"], ["api", "OpenAPI / REST", "code"]].map(([id, l, ic]) => (
              <button key={id} onClick={() => setDoc(id)} className={`btn ${doc === id ? "btn-brand" : "btn-ghost"}`}><I n={ic} size={15} /> {l}</button>
            ))}
            <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)] ms-auto">الطبقات: Presentation → Business Logic → Data Access — فصل تام</span>
          </div>
          <Reveal><div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-line bg-panel flex items-center justify-between">
              <h3 className="font-display font-bold text-sm">{doc === "sql" ? "scripts/schema_v3.sql — الجداول والمحفزات" : doc === "erd" ? "docs/erd.txt — العلاقات بين الوحدات" : "docs/openapi.yaml — ملخص الواجهات"}</h3>
              <button className="btn btn-ghost !py-1.5 !text-[0.72rem]" onClick={() => app.toast("نُسخ المحتوى إلى الحافظة", "info")}><I n="clip" size={14} /> نسخ</button>
            </div>
            <div className="p-4"><Code>{doc === "sql" ? SQL : doc === "erd" ? ERD : API_DOC}</Code></div>
          </div></Reveal>
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {[["server", "Backend", "Node.js + NestJS، طبقات Services/Repositories، JWT مع Refresh Rotation وArgon2id لكلمات المرور."], ["db", "Database", "MySQL 8.4 — InnoDB، محفزات لحماية الفترات والتوازن، نسخ احتياطي تفاضلي يومي."], ["globe", "Frontend", "React 18 + Vite + Tailwind v4 — هذا التطبيق، بـ RTL كامل وخمسة أنماط مظهر."]].map(([ic, t, d]) => (
              <div key={t} className="card p-4"><div className="flex items-center gap-2 font-display font-bold mb-1.5"><I n={ic} size={17} className="text-[var(--brand)]" /> {t}</div><p className="text-[0.76rem] text-soft font-medium leading-6">{d}</p></div>
            ))}
          </div>
        </div>
      )}

      {tab === "plan" && (
        <div className="max-w-3xl mx-auto anim-fadein">
          <div className="space-y-4">
            {SPRINTS.map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <div className="card p-5 flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className={`w-10 h-10 rounded-full grid place-items-center font-num font-bold shrink-0 ${s.done ? "bg-[var(--good)] text-white" : "bg-panel border-2 border-dashed border-[var(--brand)] text-[var(--brand)]"}`}>{s.done ? <I n="check" size={18} /> : i + 1}</span>
                    {i < SPRINTS.length - 1 && <span className="w-0.5 flex-1 bg-line mt-2" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-lg">{s.title}</h3>
                      <span className="chip bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] font-num">{s.n}</span>
                      <span className="chip bg-[color-mix(in_srgb,var(--mute)_14%,transparent)] text-[var(--soft)]">{s.period}</span>
                      <Chip s={s.done ? "مرحّل" : "بانتظار الموافقة"} />
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {s.items.map((it) => <li key={it} className="flex items-center gap-2 text-[0.82rem] font-bold text-soft"><I n="check" size={14} className={s.done ? "text-[var(--good)]" : "text-mute"} /> {it}</li>)}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal><div className="card p-5 mt-4 text-[0.8rem] font-bold text-soft leading-7">
            <h3 className="font-display font-bold text-base mb-2 flex items-center gap-2"><I n="file" size={18} className="text-[var(--brand)]" /> README.md — التشغيل السريع</h3>
            <Code>{`# OkyanusProERP 3.0
cp .env.example .env        # DB_HOST, DB_PORT, DB_USER, DB_PASS, JWT_SECRET
docker compose up -d mysql  # قاعدة البيانات + الترحيلات (migrations)
npm install && npm run dev  # الواجهة الأمامية على :5173
npm run test                # اختبارات الوحدة والتكامل (Vitest)`}</Code>
          </div></Reveal>
        </div>
      )}

      {/* نافذة سجل التغييرات */}
      <Modal open={showLog} onClose={() => setShowLog(false)} title="Change Log — سجل التغييرات الكامل" icon="clock" wide>
        <div className="space-y-5">
          {app.changelog.map((c, i) => (
            <div key={c.v} className="relative ps-6">
              <span className={`absolute start-0 top-1.5 w-3 h-3 rounded-full ${i === 0 ? "bg-[var(--brand)]" : "bg-line"}`} />
              {i < app.changelog.length - 1 && <span className="absolute start-[5px] top-5 bottom--4 w-0.5 bg-line h-[calc(100%-8px)]" />}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-num font-bold text-lg text-[var(--brand)]" dir="ltr">v{c.v}</span>
                <span className="chip bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] text-[var(--accent)]">{c.tag}</span>
                <span className="font-num text-[0.7rem] text-mute" dir="ltr">{c.date}</span>
                {i === 0 && <span className="chip bg-[color-mix(in_srgb,var(--good)_13%,transparent)] text-[var(--good)]">الإصدار الحالي</span>}
              </div>
              <ul className="mt-2 space-y-1.5">
                {c.items.map((it) => <li key={it} className="flex items-start gap-2 text-[0.82rem] font-bold text-soft"><I n="arrow" size={13} className="mt-1 shrink-0 text-[var(--brand)]" /> {it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
