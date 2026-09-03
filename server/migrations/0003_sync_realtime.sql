-- ═══════════ 0003: محرك المزامنة المركزية اللحظية ═══════════
-- دمج مركزي على مستوى السجل (الأحدث يفوز) + سجل عمليات + شواهد حذف + أجيال

-- سجلات موحدة لكل المجموعات — الدمج يتم هنا بمفتاح (coll, record_id)
CREATE TABLE IF NOT EXISTS sync_records (
  coll VARCHAR(40) NOT NULL, record_id VARCHAR(60) NOT NULL,
  payload JSON NOT NULL, updated_at BIGINT NOT NULL,
  origin_device VARCHAR(60), updated_by VARCHAR(120),
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (coll, record_id),
  INDEX idx_sync_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- سجل العمليات المتسلسل للسحب التفاضلي (pull?since=seq) والبث اللحظي
CREATE TABLE IF NOT EXISTS sync_ops (
  seq BIGINT AUTO_INCREMENT PRIMARY KEY,
  coll VARCHAR(40) NOT NULL, record_id VARCHAR(60) NOT NULL,
  op_type ENUM('upsert','delete','gen') NOT NULL,
  payload JSON NULL, device_id VARCHAR(60), actor VARCHAR(120),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_ops_seq (seq), INDEX idx_ops_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- شواهد الحذف (Tombstones): المفتاح الفريد يضمن انتشار الحذف مرة واحدة
-- والمحذوف لا يعود أبداً لأي جهاز
CREATE TABLE IF NOT EXISTS tombstones (
  coll VARCHAR(40) NOT NULL, record_id VARCHAR(60) NOT NULL,
  deleted_by VARCHAR(120), origin_device VARCHAR(60),
  deleted_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (coll, record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- رقم الجيل: أي استعادة/إعادة تهيئة ترفعه فتستبدل الأجهزة نسخها القديمة تلقائياً
CREATE TABLE IF NOT EXISTS generations (
  id TINYINT PRIMARY KEY, current BIGINT NOT NULL DEFAULT 0,
  last_reason VARCHAR(120), last_actor VARCHAR(120), bumped_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO generations (id, current) VALUES (1, 0);

-- سجل الأجهزة المتصلة بهويتها الثابتة
CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(60) PRIMARY KEY, name VARCHAR(120) NOT NULL,
  last_user VARCHAR(120), last_role VARCHAR(80), local_ip VARCHAR(45),
  ops_count INT DEFAULT 0, last_seen DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_devices_seen (last_seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- سجل نشاط المستخدمين (شاشة مراقبة النشاط — بث كل 5 ثوانٍ)
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ts BIGINT NOT NULL, actor VARCHAR(120), role VARCHAR(80),
  device_id VARCHAR(60), device_name VARCHAR(120),
  category VARCHAR(40), action VARCHAR(250), op_type VARCHAR(20),
  INDEX idx_act_ts (ts), INDEX idx_act_actor (actor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إجراء تنظيف دوري: ضغط سجل العمليات الأقدم من 30 يوماً (يُجدول من الخادم)
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_purge_old_ops $$
CREATE PROCEDURE sp_purge_old_ops()
BEGIN
  DELETE FROM sync_ops WHERE created_at < NOW() - INTERVAL 30 DAY;
  DELETE FROM activity_log WHERE ts < (UNIX_TIMESTAMP(NOW() - INTERVAL 14 DAY) * 1000);
END $$
DELIMITER ;
