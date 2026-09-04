-- ═══════════ 0004: الموارد البشرية + الأصول الثابتة ═══════════

CREATE TABLE IF NOT EXISTS hr_employees (
  id CHAR(10) PRIMARY KEY, name_ar VARCHAR(140) NOT NULL, job_title VARCHAR(100),
  department_id CHAR(8), branch_id CHAR(8), phone VARCHAR(30),
  hire_date DATE NOT NULL, base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  allowances DECIMAL(15,2) DEFAULT 0, deductions DECIMAL(15,2) DEFAULT 0,
  bank_account VARCHAR(60), status ENUM('active','suspended','terminated') DEFAULT 'active',
  updated_at BIGINT, FOREIGN KEY (department_id) REFERENCES departments(id), FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hr_attendance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, employee_id CHAR(10) NOT NULL, day DATE NOT NULL,
  check_in TIME NULL, check_out TIME NULL,
  status ENUM('present','late','absent','leave','mission') DEFAULT 'present',
  work_hours DECIMAL(4,2) DEFAULT 0, notes VARCHAR(190), updated_at BIGINT,
  UNIQUE KEY uk_emp_day (employee_id, day), FOREIGN KEY (employee_id) REFERENCES hr_employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hr_rewards (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, employee_id CHAR(10) NOT NULL, kind VARCHAR(60) NOT NULL,
  amount DECIMAL(15,2) NOT NULL, reason VARCHAR(190), doc_date DATE, posted TINYINT(1) DEFAULT 0, updated_at BIGINT,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hr_warnings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, employee_id CHAR(10) NOT NULL, level TINYINT DEFAULT 1,
  reason VARCHAR(250) NOT NULL, issued_by VARCHAR(120), doc_date DATE, updated_at BIGINT,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hr_leaves (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, employee_id CHAR(10) NOT NULL,
  leave_type ENUM('annual','sick','unpaid','mission') DEFAULT 'annual',
  from_date DATE NOT NULL, to_date DATE NOT NULL, days DECIMAL(4,1) NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending', approved_by VARCHAR(120), updated_at BIGINT,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- كشوف الرواتب: رأس كشف + بنود، والكشف المرحّل يولّد قيداً محاسبياً متوازناً
CREATE TABLE IF NOT EXISTS hr_payroll (
  id CHAR(14) PRIMARY KEY, ref_no VARCHAR(30) UNIQUE, period CHAR(7) NOT NULL,
  gross DECIMAL(15,2) DEFAULT 0, net DECIMAL(15,2) DEFAULT 0, emp_count INT DEFAULT 0,
  status ENUM('draft','posted') DEFAULT 'draft', gl_journal_id BIGINT NULL,
  prepared_by VARCHAR(120), posted_at DATETIME NULL, updated_at BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hr_payroll_lines (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, payroll_id CHAR(14) NOT NULL, employee_id CHAR(10) NOT NULL,
  base DECIMAL(15,2) DEFAULT 0, allowances DECIMAL(15,2) DEFAULT 0, deductions DECIMAL(15,2) DEFAULT 0,
  rewards DECIMAL(15,2) DEFAULT 0, net DECIMAL(15,2) DEFAULT 0,
  FOREIGN KEY (payroll_id) REFERENCES hr_payroll(id) ON DELETE CASCADE, FOREIGN KEY (employee_id) REFERENCES hr_employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══ الأصول الثابتة + الإهلاك (قسط ثابت) ═══
CREATE TABLE IF NOT EXISTS fixed_assets (
  id CHAR(12) PRIMARY KEY, name_ar VARCHAR(160) NOT NULL, category VARCHAR(80),
  location VARCHAR(140), custodian VARCHAR(120), serial_no VARCHAR(60),
  purchase_date DATE NOT NULL, cost DECIMAL(15,2) NOT NULL, salvage_value DECIMAL(15,2) DEFAULT 0,
  useful_years INT NOT NULL DEFAULT 5, accumulated_dep DECIMAL(15,2) DEFAULT 0,
  status ENUM('active','sold','disposed','fully_depreciated') DEFAULT 'active',
  expense_account VARCHAR(12) DEFAULT '31311', accum_account VARCHAR(12) DEFAULT '11421',
  updated_at BIGINT,
  FOREIGN KEY (expense_account) REFERENCES accounts(code), FOREIGN KEY (accum_account) REFERENCES accounts(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_depreciation (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, asset_id CHAR(12) NOT NULL, fiscal_year CHAR(4) NOT NULL,
  amount DECIMAL(15,2) NOT NULL, gl_journal_id BIGINT NULL, posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_asset_year (asset_id, fiscal_year), FOREIGN KEY (asset_id) REFERENCES fixed_assets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إجراء الإهلاك السنوي بقسط ثابت: (التكلفة - الخردة) ÷ العمر — ويولّد قيداً لكل أصل
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_post_annual_depreciation $$
CREATE PROCEDURE sp_post_annual_depreciation(IN p_year CHAR(4))
BEGIN
  DECLARE v_asset CHAR(12); DECLARE v_amt DECIMAL(15,2); DECLARE v_done INT DEFAULT 0;
  DECLARE cur CURSOR FOR
    SELECT id, GREATEST(0, (cost - salvage_value) / useful_years)
    FROM fixed_assets
    WHERE status = 'active' AND accumulated_dep < (cost - salvage_value)
      AND id NOT IN (SELECT asset_id FROM asset_depreciation WHERE fiscal_year = p_year);
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  OPEN cur;
  dep_loop: LOOP
    FETCH cur INTO v_asset, v_amt;
    IF v_done THEN LEAVE dep_loop; END IF;
    INSERT INTO asset_depreciation (asset_id, fiscal_year, amount) VALUES (v_asset, p_year, v_amt);
    UPDATE fixed_assets SET accumulated_dep = accumulated_dep + v_amt,
      status = IF(accumulated_dep + v_amt >= cost - salvage_value, 'fully_depreciated', status)
    WHERE id = v_asset;
  END LOOP;
  CLOSE cur;
END $$
DELIMITER ;
