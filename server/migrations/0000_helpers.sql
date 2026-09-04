-- ═══════════ 0000: الإجراءات المساعدة (تعمل أولاً — تجعل كل الهجرات قابلة للتكرار بأمان) ═══════════
-- DDL في MySQL/MariaDB يُلتزم ضمنياً (Implicit Commit) ولا يمكن التراجع عنه،
-- لذلك كل تعديل هيكلي يمر عبر إجراء شرطي يفحص الوجود أولاً — لا تفشل هجرة عند الإعادة أبداً.

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

DROP PROCEDURE IF EXISTS sp_drop_index_if_exists $$
CREATE PROCEDURE sp_drop_index_if_exists(
  IN p_table VARCHAR(64), IN p_index VARCHAR(64)
)
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_index
  ) THEN
    SET @ddl = CONCAT('DROP INDEX `', p_index, '` ON `', p_table, '`');
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END $$
DELIMITER ;
