-- ═══════════ 0006: حقول الأنظمة المستجدة + البيانات الافتراضية المعتمدة ═══════════
-- ١) أعمدة مستجدة عبر الإجراءات الشرطية (آمنة للتكرار — MySQL و MariaDB)
CALL sp_add_column_if_missing('inventory_docs', 'sub_type', 'VARCHAR(80) NULL');
CALL sp_add_column_if_missing('inventory_docs', 'party_kind', 'VARCHAR(20) NULL');
CALL sp_add_column_if_missing('inventory_docs', 'party_id', 'VARCHAR(40) NULL');
CALL sp_add_column_if_missing('inventory_docs', 'ext_ref', 'VARCHAR(60) NULL');
CALL sp_add_column_if_missing('inventory_docs', 'clear_account', 'VARCHAR(12) NULL');
CALL sp_add_column_if_missing('inventory_doc_lines', 'counted_qty', 'DECIMAL(15,2) NULL');
CALL sp_add_column_if_missing('journals', 'kind', 'VARCHAR(30) NULL');
CALL sp_add_column_if_missing('journals', 'source', 'VARCHAR(60) NULL');
CALL sp_add_column_if_missing('journal_lines', 'cost_center', 'CHAR(10) NULL');
CALL sp_add_column_if_missing('activity_records', 'weight_grams', 'DECIMAL(10,3) NULL');
CALL sp_add_index_if_missing('inventory_docs', 'idx_invdoc_type_date', 'doc_type, doc_date');
CALL sp_add_index_if_missing('journals', 'idx_je_kind', 'kind');
CALL sp_add_index_if_missing('journal_lines', 'idx_jl_account', 'account_code');

-- ٢) البيانات الافتراضية المعتمدة (INSERT IGNORE — لا تمس بيانات العميل القائمة)

-- العملات (الريال اليمني عملة الأساس)
INSERT IGNORE INTO currencies (code, name_ar, rate_to_base, is_base) VALUES
 ('YER', 'الريال اليمني', 1.0000, 1),
 ('USD', 'الدولار الأمريكي', 535.0000, 0),
 ('SAR', 'الريال السعودي', 142.7000, 0),
 ('EUR', 'اليورو', 578.4000, 0);

-- الفترات المالية 2026
INSERT IGNORE INTO periods (id, fiscal_year, label_ar, locked) VALUES
 ('2026-01','2026','يناير 2026',0), ('2026-02','2026','فبراير 2026',0), ('2026-03','2026','مارس 2026',0),
 ('2026-04','2026','أبريل 2026',0), ('2026-05','2026','مايو 2026',0), ('2026-06','2026','يونيو 2026',0),
 ('2026-07','2026','يوليو 2026',0), ('2026-08','2026','أغسطس 2026',0), ('2026-09','2026','سبتمبر 2026',0),
 ('2026-10','2026','أكتوبر 2026',0), ('2026-11','2026','نوفمبر 2026',0), ('2026-12','2026','ديسمبر 2026',0);

-- مراكز التكلفة (رئيسي وفرعي)
INSERT IGNORE INTO cost_centers (id, parent_id, name_ar, manager) VALUES
 ('CC-01', NULL,  'الإدارة العامة', 'م.وائل الشرفي'),
 ('CC-02', NULL,  'فرع عمران', 'إبراهيم المنصور'),
 ('CC-03', NULL,  'فرع ذمار', 'عبدالقادر الكحلاني'),
 ('CC-011','CC-01','قسم المشتريات', '—'),
 ('CC-012','CC-01','قسم المبيعات', '—');

-- وحدات القياس والمجموعات والمخازن الافتراضية
INSERT IGNORE INTO units (id, name_ar, symbol) VALUES
 ('UN-01','قطعة','قطعة'), ('UN-02','علبة','علبة'), ('UN-03','كرتون','كرتون'), ('UN-04','كيلوجرام','كجم');

INSERT IGNORE INTO item_groups (id, name_ar, notes) VALUES
 ('GR-01','بضائع عامة','المجموعة الافتراضية');

INSERT IGNORE INTO warehouses (id, name_ar, keeper, location, capacity) VALUES
 ('WH-01','المخزن الرئيسي — صنعاء','—','صنعاء','—'),
 ('WH-02','مخزن الفرع — عمران','—','عمران','—'),
 ('WH-03','مخزن الفرع — ذمار','—','ذمار','—');

-- تصنيفات الشركاء والأدوار الافتراضية
INSERT IGNORE INTO partner_categories (id, name_ar, scope) VALUES
 ('PC-01','عام','both');

INSERT IGNORE INTO roles (id, name_ar, level) VALUES
 ('RL-01','مدير النظام',1), ('RL-02','محاسب رئيسي',2), ('RL-03','أمين مخزن',3),
 ('RL-04','مسؤول مشتريات',3), ('RL-05','مسؤول مبيعات',3), ('RL-06','مدقق خارجي',4);

-- ٣) دليل الحسابات الافتراضي (5 مستويات — نمط الأنظمة التجارية الكبرى)
INSERT IGNORE INTO accounts (code, parent_code, name_ar, lvl, type, is_posting, is_analytical) VALUES
 ('1',NULL,'الأصول',1,'assets',0,0),
 ('11','1','الأصول المتداولة',2,'assets',0,0),
 ('111','11','النقدية والبنوك',3,'assets',0,0),
 ('1111','111','الصناديق النقدية',4,'assets',0,0),
 ('11111','1111','الصندوق الرئيسي',5,'assets',1,0),
 ('11112','1111','صندوق فرع عمران',5,'assets',1,0),
 ('1112','111','البنوك',4,'assets',0,0),
 ('11121','1112','بنك الكريمي — جاري',5,'assets',1,0),
 ('11122','1112','بنك التضامن — توفير',5,'assets',1,0),
 ('112','11','الذمم المدينة',3,'assets',0,0),
 ('1121','112','ذمم العملاء',4,'assets',0,0),
 ('11211','1121','عملاء محليون — آجل',5,'assets',1,0),
 ('11212','1121','نزلاء المستشفى — تحليلي',5,'assets',1,1),
 ('11213','1121','ذمم موظفين',5,'assets',1,0),
 ('113','11','المخزون',3,'assets',0,0),
 ('1131','113','مخزون البضائع',4,'assets',0,0),
 ('11311','1131','المخزون الرئيسي',5,'assets',1,0),
 ('11312','1131','مخزون فرع عمران',5,'assets',1,0),
 ('11313','1131','مخزون فرع ذمار',5,'assets',1,0),
 ('114','11','الأصول الثابتة',3,'assets',0,0),
 ('1141','114','المعدات والتجهيزات',4,'assets',0,0),
 ('11411','1141','معدات وتجهيزات',5,'assets',1,0),
 ('1142','114','مجمعات الاستهلاك',4,'assets',0,0),
 ('11421','1142','مجمع استهلاك المعدات',5,'assets',1,0),
 ('2',NULL,'الخصوم',1,'liabilities',0,0),
 ('21','2','الخصوم المتداولة',2,'liabilities',0,0),
 ('211','21','الذمم الدائنة',3,'liabilities',0,0),
 ('2111','211','ذمم الموردين',4,'liabilities',0,0),
 ('21111','2111','موردون محليون — آجل',5,'liabilities',1,0),
 ('212','21','الضرائب المستحقة',3,'liabilities',0,0),
 ('2121','212','ضريبة المبيعات',4,'liabilities',0,0),
 ('21211','2121','ضريبة مخرجات',5,'liabilities',1,0),
 ('21212','2121','ضريبة مدخلات',5,'liabilities',1,0),
 ('22','2','حقوق الملكية',2,'liabilities',0,0),
 ('221','22','رأس المال',3,'liabilities',0,0),
 ('2211','221','رأس المال المدفوع',4,'liabilities',0,0),
 ('22111','2211','رأس المال — الشركاء',5,'liabilities',1,0),
 ('222','22','الاحتياطيات والأرباح',3,'liabilities',0,0),
 ('2221','222','أرباح محتجزة',4,'liabilities',0,0),
 ('22211','2221','أرباح سنوات سابقة',5,'liabilities',1,0),
 ('3',NULL,'المصروفات',1,'expenses',0,0),
 ('31','3','المصروفات التشغيلية',2,'expenses',0,0),
 ('311','31','الرواتب والأجور',3,'expenses',0,0),
 ('3111','311','رواتب الموظفين',4,'expenses',0,0),
 ('31111','3111','رواتب إدارية وتشغيلية',5,'expenses',1,0),
 ('312','31','الإيجارات والمرافق',3,'expenses',0,0),
 ('3121','312','الإيجارات',4,'expenses',0,0),
 ('31211','3121','إيجار المقر الرئيسي',5,'expenses',1,0),
 ('313','31','الاستهلاكات',3,'expenses',0,0),
 ('3131','313','استهلاك أصول ثابتة',4,'expenses',0,0),
 ('31311','3131','استهلاك المعدات',5,'expenses',1,0),
 ('314','31','مصاريف تسويقية',3,'expenses',0,0),
 ('3141','314','إعلان ودعاية',4,'expenses',0,0),
 ('31411','3141','حملات تسويقية',5,'expenses',1,0),
 ('315','31','تكلفة المبيعات',3,'expenses',0,0),
 ('3151','315','تكلفة البضاعة المباعة',4,'expenses',0,0),
 ('31511','3151','تكلفة مبيعات البضائع',5,'expenses',1,0),
 ('31512','3151','تكلفة مبيعات الأجهزة والمعدات',5,'expenses',1,0),
 ('4',NULL,'الإيرادات',1,'revenues',0,0),
 ('41','4','الإيرادات التشغيلية',2,'revenues',0,0),
 ('411','41','المبيعات',3,'revenues',0,0),
 ('4111','411','مبيعات البضائع',4,'revenues',0,0),
 ('41111','4111','مبيعات محلية — نقدي',5,'revenues',1,0),
 ('41112','4111','مبيعات محلية — آجل',5,'revenues',1,0),
 ('41113','4111','مبيعات الأجهزة والمعدات',5,'revenues',1,0),
 ('412','41','إيرادات الخدمات',3,'revenues',0,0),
 ('4121','412','الخدمات',4,'revenues',0,0),
 ('41211','4121','إيراد خدمات',5,'revenues',1,0),
 ('413','41','مرتجعات المبيعات',3,'revenues',0,0),
 ('4131','413','مرتجعات محلية',4,'revenues',0,0),
 ('41311','4131','مرتجع مبيعات محلية',5,'revenues',1,0),
 ('414','41','إيرادات الأنشطة المتخصصة',3,'revenues',0,0),
 ('4141','414','إيرادات أنشطة متنوعة',4,'revenues',0,0),
 ('41411','4141','إيراد الأنشطة المتخصصة',5,'revenues',1,0);

-- ٤) كيانات وحقول الأنظمة التكيفية (المطاعم / المستشفيات / المصانع)
INSERT IGNORE INTO activity_entities (id, module_id, slug, name_ar, icon, gl_mode, sort_order) VALUES
 ('res-tables','restaurants','tables','الطاولات والحجوزات','bld','none',1),
 ('res-orders','restaurants','orders','طلبات المطابخ','receipt','revenue',2),
 ('res-menu','restaurants','menu','قوائم الطعام','file','none',3),
 ('hos-patients','hospitals','patients','سجل المرضى','users','none',1),
 ('hos-admissions','hospitals','admissions','حالات التنويم','bld','revenue',2),
 ('hos-services','hospitals','services','الخدمات العلاجية','pulse','revenue',3),
 ('fac-orders','factories','production_orders','أوامر الإنتاج','gear','none',1),
 ('fac-bom','factories','bom','قوائم المكونات (BOM)','layers','none',2),
 ('fac-stations','factories','workstations','محطات التشغيل','shield','none',3);

INSERT IGNORE INTO activity_fields (entity_id, field_key, label_ar, field_type, required, is_amount) VALUES
 ('res-tables','table_no','رقم الطاولة','text',1,0),
 ('res-tables','capacity','عدد المقاعد','number',1,0),
 ('res-tables','status','الحالة','select',1,0),
 ('res-orders','order_no','رقم الطلب','text',1,0),
 ('res-orders','amount','قيمة الطلب','number',1,1),
 ('res-orders','doc_date','تاريخ الطلب','date',1,0),
 ('hos-patients','file_no','رقم الملف','text',1,0),
 ('hos-patients','phone','الهاتف','text',0,0),
 ('hos-admissions','room','الغرفة','text',1,0),
 ('hos-admissions','amount','قيمة التنويم','number',1,1),
 ('hos-services','amount','قيمة الخدمة','number',1,1),
 ('fac-orders','batch_no','رقم الدفعة','text',1,0),
 ('fac-orders','quantity','كمية الإنتاج','number',1,0),
 ('fac-bom','ratio','نسبة المكوّن','number',1,0);

-- تفضيلات الأنشطة — تكيف المصطلحات ونمط نقاط البيع تلقائياً
INSERT IGNORE INTO activity_prefs (module_id, term_item, term_customer, term_invoice, pos_show_tables) VALUES
 ('restaurants','الطبق / الوجبة','الزبون / الطاولة','فاتورة طلب',1),
 ('hospitals','الخدمة العلاجية','المريض','فاتورة خدمات',0),
 ('factories','المنتج','العميل','فاتورة بيع إنتاج',0);
