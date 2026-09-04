-- ═══════════ 0002: محرك الأنشطة التكيفية (Adaptive Activity Engine) ═══════════
-- قاعدة بيانات تكيفية: الوحدات المتخصصة تُعرَّف بالحقول وتُخزن في سجلات مرنة
-- تتسع لأي نشاط (21 نظاماً) دون أي تغيير في المخطط — الحقول الديناميكية في JSON
-- مع أعمدة مولّدة مفهرسة للبحث والتقارير والترحيل المحاسبي

CREATE TABLE IF NOT EXISTS activity_modules (
  id VARCHAR(30) PRIMARY KEY, slug VARCHAR(30) NOT NULL UNIQUE,
  name_ar VARCHAR(100) NOT NULL, icon VARCHAR(30), color VARCHAR(12),
  pos_mode ENUM('retail','restaurant','none') DEFAULT 'none',
  revenue_account VARCHAR(12) DEFAULT '41411', enabled TINYINT(1) DEFAULT 0,
  is_primary TINYINT(1) DEFAULT 0, sort_order INT DEFAULT 0,
  FOREIGN KEY (revenue_account) REFERENCES accounts(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_entities (
  id VARCHAR(40) PRIMARY KEY, module_id VARCHAR(30) NOT NULL, slug VARCHAR(40) NOT NULL,
  name_ar VARCHAR(100) NOT NULL, icon VARCHAR(30),
  amount_field VARCHAR(30) DEFAULT 'amount',
  gl_mode ENUM('none','revenue','expense','both') DEFAULT 'revenue',
  expense_account VARCHAR(12) NULL, sort_order INT DEFAULT 0,
  UNIQUE KEY uk_entity_slug (module_id, slug),
  FOREIGN KEY (module_id) REFERENCES activity_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- تعريف حقول كل وحدة (يُبنى منها الواجهة والتحقق ديناميكياً)
CREATE TABLE IF NOT EXISTS activity_fields (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, entity_id VARCHAR(40) NOT NULL,
  field_key VARCHAR(40) NOT NULL, label_ar VARCHAR(80) NOT NULL,
  field_type ENUM('text','number','select','date') DEFAULT 'text',
  required TINYINT(1) DEFAULT 0, is_amount TINYINT(1) DEFAULT 0,
  options_json TEXT NULL, sort_order INT DEFAULT 0,
  UNIQUE KEY uk_field (entity_id, field_key),
  FOREIGN KEY (entity_id) REFERENCES activity_entities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- السجلات المرنة: صف واحد لأي وحدة في أي نشاط — payload يحمل الحقول الخاصة
CREATE TABLE IF NOT EXISTS activity_records (
  id VARCHAR(40) PRIMARY KEY, entity_id VARCHAR(40) NOT NULL,
  code VARCHAR(40) UNIQUE, name VARCHAR(160) NOT NULL,
  status VARCHAR(30) NULL, amount DECIMAL(15,2) DEFAULT 0, doc_date DATE NULL,
  payload JSON NOT NULL,
  posted_to_gl TINYINT(1) DEFAULT 0, gl_journal_id BIGINT NULL,
  created_by VARCHAR(120), created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(120), updated_at BIGINT,
  INDEX idx_rec_entity_date (entity_id, doc_date),
  INDEX idx_rec_status (status),
  FOREIGN KEY (entity_id) REFERENCES activity_entities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- فهرس نصي سريع للبحث الفوري داخل الحقول المرنة
CREATE INDEX idx_rec_name ON activity_records(name);

-- تفضيلات النشاط: نمط نقاط البيع والمصطلحات تتكيف تلقائياً حسب النشاط الأساسي
CREATE TABLE IF NOT EXISTS activity_prefs (
  module_id VARCHAR(30) PRIMARY KEY, term_item VARCHAR(60), term_customer VARCHAR(60),
  term_invoice VARCHAR(60), pos_show_tables TINYINT(1) DEFAULT 0, extra_json JSON NULL,
  FOREIGN KEY (module_id) REFERENCES activity_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══ الأنظمة الـ21 المدمجة ═══
INSERT IGNORE INTO activity_modules (id, slug, name_ar, icon, color, pos_mode, sort_order) VALUES
 ('factory','factories','المصانع والإنتاج','gear','#b45309','none',1),
 ('restaurants','restaurants','المطاعم','bld','#dc2626','restaurant',2),
 ('hotels','hotels','الفنادق','home','#0891b2','none',3),
 ('hospitals','hospitals','المستشفيات','pulse','#e11d48','none',4),
 ('clinics','clinics','العيادات الطبية','pulse','#f472b6','none',5),
 ('construction','construction','المقاولات','bld','#d97706','none',6),
 ('fuel','fuel','محطات البترول','coins','#ca8a04','retail',7),
 ('utilities','utilities','محطات الكهرباء والمياه','sun','#059669','none',8),
 ('travel','travel','السفريات والسياحة','globe','#0284c7','none',9),
 ('clubs','clubs','النوادي الرياضية','users','#7c3aed','none',10),
 ('tailoring','tailoring','الخياطة','edit','#db2777','none',11),
 ('gold','gold','الذهب والمجوهرات','coins','#eab308','retail',12),
 ('carrental','carrental','تأجير السيارات والصيانة','truck','#475569','none',13),
 ('exchange','exchange','الصرافة والحوالات','swap','#16a34a','none',14),
 ('institutes','institutes','المعاهد والمراكز التعليمية','file','#2563eb','none',15),
 ('schools','schools','المدارس','bld','#4f46e5','none',16),
 ('universities','universities','الجامعات','bld','#7c3aed','none',17),
 ('phonerepair','phonerepair','صيانة الجوالات','gear','#0d9488','none',18),
 ('shares','shares','الأسهم والمساهمون','chart','#0369a1','none',19),
 ('halls','halls','الصالات والمناسبات','cal','#be185d','none',20),
 ('archive','archive','الأرشفة','clip','#64748b','none',21);

-- مثال: تفضيلات المطاعم (تكيف المصطلحات والطاولات في نقاط البيع)
INSERT IGNORE INTO activity_prefs (module_id, term_item, term_customer, term_invoice, pos_show_tables)
VALUES ('restaurants','الطبق / الوجبة','الزبون / الطاولة','فاتورة طلب', 1);
INSERT IGNORE INTO activity_prefs (module_id, term_item, term_customer, term_invoice, pos_show_tables)
VALUES ('gold','القطعة (عيار/وزن)','العميل','فاتورة بيع ذهب', 0);
