-- ═══════════ 0005: أنماط تعديل الجداول والأعمدة (آمنة للتكرار) ═══════════
-- هذا الملف يوضح المنهجية المعتمدة لإضافة/تعديل أي جدول أو عمود لأي نشاط:
-- كل عملية تعديل داخل إجراء شرطي يفحص وجود العمود أولاً فلا تفشل الهجرة عند الإعادة

-- نمط 1: إضافة عمود جديد إن لم يوجد (مثال: رقم العقد في فواتير المقاولات)
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_add_column_if_missing $$
CREATE PROCEDURE sp_add_column_if_missing(
  IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition VARCHAR(250)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END $$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS sp_modify_column $$
CREATE PROCEDURE sp_modify_column(
  IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition VARCHAR(250)
)
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` MODIFY COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END $$
DELIMITER ;

-- نمط 2: فهرس شرطي
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_add_index_if_missing $$
CREATE PROCEDURE sp_add_index_if_missing(
  IN p_table VARCHAR(64), IN p_index VARCHAR(64), IN p_columns VARCHAR(190)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_index
  ) THEN
    SET @ddl = CONCAT('CREATE INDEX `', p_index, '` ON `', p_table, '` (', p_columns, ')');
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END $$
DELIMITER ;

-- ═══ تطبيقات فعلية لخدمة الأنشطة ═══
-- عمود «رقم العقد» يخدم المقاولات وتأجير السيارات والصالات دون جدول جديد
CALL sp_add_column_if_missing('invoices', 'contract_no', 'VARCHAR(60) NULL');
-- عمود «الوزن/العيار» يخدم نشاط الذهب والمجوهرات في السجلات المرنة
CALL sp_add_column_if_missing('activity_records', 'weight_grams', 'DECIMAL(10,3) NULL');
-- توسيع حقل الملاحظات للجرد
CALL sp_modify_column('inventory_docs', 'notes', 'VARCHAR(400) NULL');
-- فهرس يخدم تقارير المبيعات اليومية لكل الأنشطة
CALL sp_add_index_if_missing('invoices', 'idx_inv_date_kind', 'doc_date, kind');
