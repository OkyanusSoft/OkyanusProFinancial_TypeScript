-- ═══════════ 0001: المخطط الأساسي — الأنظمة الجوهرية ═══════════
-- الهيكل التنظيمي + المستخدمون والصلاحيات
CREATE TABLE IF NOT EXISTS companies (
  id CHAR(6) PRIMARY KEY, name_ar VARCHAR(160) NOT NULL, name_en VARCHAR(160),
  phone VARCHAR(30), cr_no VARCHAR(60), created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS branches (
  id CHAR(8) PRIMARY KEY, company_id CHAR(6), name_ar VARCHAR(120) NOT NULL,
  manager VARCHAR(120), phone VARCHAR(30), FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id CHAR(8) PRIMARY KEY, branch_id CHAR(8), name_ar VARCHAR(120) NOT NULL, head VARCHAR(120),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(8) PRIMARY KEY, name_ar VARCHAR(80) NOT NULL UNIQUE, level TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(8) PRIMARY KEY, username VARCHAR(60) NOT NULL UNIQUE, pass_hash VARCHAR(100) NOT NULL,
  full_name VARCHAR(120) NOT NULL, role VARCHAR(80), branch_id CHAR(8), active TINYINT(1) DEFAULT 1,
  last_login DATETIME NULL, FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- صلاحيات دقيقة: وحدة × إجراء
CREATE TABLE IF NOT EXISTS role_permissions (
  role_name VARCHAR(80) NOT NULL, module VARCHAR(60) NOT NULL, action VARCHAR(40) NOT NULL,
  PRIMARY KEY (role_name, module, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══ المحاسبة: دليل 5 مستويات + عملات + فترات ═══
CREATE TABLE IF NOT EXISTS accounts (
  code VARCHAR(12) PRIMARY KEY, parent_code VARCHAR(12), name_ar VARCHAR(140) NOT NULL, name_en VARCHAR(140),
  lvl TINYINT NOT NULL CHECK (lvl BETWEEN 1 AND 5),
  type ENUM('assets','liabilities','expenses','revenues') NOT NULL,
  is_posting TINYINT(1) DEFAULT 0, is_analytical TINYINT(1) DEFAULT 0,
  FOREIGN KEY (parent_code) REFERENCES accounts(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_accounts_parent ON accounts(parent_code);

CREATE TABLE IF NOT EXISTS currencies (
  code CHAR(3) PRIMARY KEY, name_ar VARCHAR(60), rate_to_base DECIMAL(14,4) NOT NULL DEFAULT 1,
  is_base TINYINT(1) DEFAULT 0, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS periods (
  id CHAR(7) PRIMARY KEY, fiscal_year CHAR(4) NOT NULL, label_ar VARCHAR(40),
  locked TINYINT(1) DEFAULT 0, closed_at DATETIME NULL, closed_by VARCHAR(120)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cost_centers (
  id CHAR(10) PRIMARY KEY, parent_id CHAR(10) NULL, name_ar VARCHAR(120) NOT NULL, manager VARCHAR(120),
  FOREIGN KEY (parent_id) REFERENCES cost_centers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS analytic_accounts (
  id CHAR(10) PRIMARY KEY, linked_account VARCHAR(12) NOT NULL, name_ar VARCHAR(140) NOT NULL,
  phone VARCHAR(30), note VARCHAR(190), opening DECIMAL(15,2) DEFAULT 0,
  FOREIGN KEY (linked_account) REFERENCES accounts(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══ اليومية العامة: قيود مزدوجة متعددة العملات ═══
CREATE TABLE IF NOT EXISTS journals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, ref_no VARCHAR(30) NOT NULL UNIQUE,
  doc_date DATE NOT NULL, fy_period CHAR(7) NOT NULL, description VARCHAR(250) NOT NULL,
  kind VARCHAR(30), source VARCHAR(60), cost_center CHAR(10), status ENUM('posted','void','pending') DEFAULT 'posted',
  created_by VARCHAR(120), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at BIGINT,
  FOREIGN KEY (fy_period) REFERENCES periods(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_journals_period ON journals(fy_period);

CREATE TABLE IF NOT EXISTS journal_lines (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, journal_id BIGINT NOT NULL, account_code VARCHAR(12) NOT NULL,
  analytic_id CHAR(10) NULL, currency CHAR(3) DEFAULT 'YER', rate DECIMAL(14,4) DEFAULT 1,
  debit DECIMAL(15,2) DEFAULT 0, credit DECIMAL(15,2) DEFAULT 0, updated_at BIGINT,
  FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE,
  FOREIGN KEY (account_code) REFERENCES accounts(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══ المخزون ═══
CREATE TABLE IF NOT EXISTS units (id CHAR(8) PRIMARY KEY, name_ar VARCHAR(60) NOT NULL UNIQUE, symbol VARCHAR(20)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS item_groups (id CHAR(8) PRIMARY KEY, name_ar VARCHAR(90) NOT NULL UNIQUE, notes VARCHAR(190)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS warehouses (id CHAR(8) PRIMARY KEY, name_ar VARCHAR(120) NOT NULL, keeper VARCHAR(120), location VARCHAR(160), capacity VARCHAR(60)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
  id CHAR(12) PRIMARY KEY, group_id CHAR(8), unit_id CHAR(8), name_ar VARCHAR(160) NOT NULL,
  barcode VARCHAR(40) UNIQUE, cost DECIMAL(15,2) DEFAULT 0, price DECIMAL(15,2) DEFAULT 0,
  min_qty DECIMAL(15,2) DEFAULT 0, max_qty DECIMAL(15,2) DEFAULT 0, photo_url VARCHAR(255),
  updated_at BIGINT, FOREIGN KEY (group_id) REFERENCES item_groups(id), FOREIGN KEY (unit_id) REFERENCES units(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS item_stock (
  item_id CHAR(12), warehouse_id CHAR(8), qty DECIMAL(15,2) DEFAULT 0, updated_at BIGINT,
  PRIMARY KEY (item_id, warehouse_id),
  FOREIGN KEY (item_id) REFERENCES items(id), FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_docs (
  id CHAR(14) PRIMARY KEY, doc_type ENUM('opening','receive','issue','transfer','adjust','count') NOT NULL,
  ref_no VARCHAR(30) UNIQUE, doc_date DATE NOT NULL, fy_period CHAR(7),
  warehouse_id CHAR(8), to_warehouse_id CHAR(8) NULL, status ENUM('posted','void') DEFAULT 'posted',
  notes VARCHAR(250), created_by VARCHAR(120), updated_at BIGINT,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_doc_lines (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, doc_id CHAR(14), item_id CHAR(12),
  qty DECIMAL(15,2) NOT NULL, cost DECIMAL(15,2) DEFAULT 0, updated_at BIGINT,
  FOREIGN KEY (doc_id) REFERENCES inventory_docs(id) ON DELETE CASCADE, FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══ الشركاء (موردون/عملاء بسجل موحد) + فواتير ═══
CREATE TABLE IF NOT EXISTS partner_categories (id CHAR(8) PRIMARY KEY, name_ar VARCHAR(90) NOT NULL, scope ENUM('suppliers','customers','both') DEFAULT 'both') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partners (
  id CHAR(10) PRIMARY KEY, kind ENUM('supplier','customer') NOT NULL, category_id CHAR(8),
  name_ar VARCHAR(160) NOT NULL, phone VARCHAR(30), city VARCHAR(80),
  balance DECIMAL(15,2) DEFAULT 0, credit_limit DECIMAL(15,2) NULL, account_code VARCHAR(12),
  updated_at BIGINT, UNIQUE KEY uk_partner_name_kind (name_ar, kind),
  FOREIGN KEY (category_id) REFERENCES partner_categories(id), FOREIGN KEY (account_code) REFERENCES accounts(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(14) PRIMARY KEY, kind ENUM('sales','purchases','sales_return') NOT NULL,
  ref_no VARCHAR(30) NOT NULL UNIQUE, doc_date DATE NOT NULL, fy_period CHAR(7),
  partner_id CHAR(10) NOT NULL, pay_type ENUM('cash','credit') NOT NULL,
  currency CHAR(3) DEFAULT 'YER', rate DECIMAL(14,4) DEFAULT 1, vat_pct DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0, paid DECIMAL(15,2) DEFAULT 0, cost_center CHAR(10),
  status ENUM('posted','void') DEFAULT 'posted', notes VARCHAR(250), created_by VARCHAR(120), updated_at BIGINT,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_invoices_partner ON invoices(partner_id, kind);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, invoice_id CHAR(14), item_id CHAR(12),
  qty DECIMAL(15,2) NOT NULL, price DECIMAL(15,2) NOT NULL, disc_pct DECIMAL(5,2) DEFAULT 0, updated_at BIGINT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- دفعات الفواتير الآجلة
CREATE TABLE IF NOT EXISTS invoice_payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, invoice_id CHAR(14) NOT NULL, amount DECIMAL(15,2) NOT NULL,
  pay_date DATE NOT NULL, method VARCHAR(40), voucher_no VARCHAR(30), updated_at BIGINT,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- طلبات شراء وعروض أسعار
CREATE TABLE IF NOT EXISTS purchase_requests (
  id CHAR(12) PRIMARY KEY, ref_no VARCHAR(30) UNIQUE, req_date DATE, needed_by DATE,
  status ENUM('draft','approved','converted','rejected') DEFAULT 'draft', notes VARCHAR(250),
  created_by VARCHAR(120), updated_at BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotes (
  id CHAR(12) PRIMARY KEY, ref_no VARCHAR(30) UNIQUE, kind ENUM('sales','purchase') NOT NULL,
  partner_id CHAR(10), quote_date DATE, valid_until DATE, total DECIMAL(15,2) DEFAULT 0,
  status ENUM('active','accepted','rejected','expired') DEFAULT 'active', updated_at BIGINT,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══ محفزات حماية السلامة ═══
-- 1) منع الترحيل إلى فترة مقفلة
DELIMITER $$
DROP TRIGGER IF EXISTS trg_period_lock $$
CREATE TRIGGER trg_period_lock BEFORE INSERT ON journals FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM periods WHERE id = NEW.fy_period AND locked = 1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'الفترة المالية مقفلة — لا يمكن الترحيل إليها';
  END IF;
END $$
DELIMITER ;
