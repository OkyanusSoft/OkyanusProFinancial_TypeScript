/**
 * ═══ طبقة البيانات: حزمة اتصالات MySQL + محرك Migrations ═══
 * - حزمة اتصالات قابلة للضبط تكفي 100+ مستخدم متزامن
 * - منفّذ هجرات مرقّم (Idempotent): ينفّذ كل ملف مرة واحدة فقط
 *   ويسجّله في schema_migrations، مع دعم إضافة/تعديل الجداول والأعمدة
 */
import mysql from "mysql2/promise";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";

const __dir = dirname(fileURLToPath(import.meta.url));

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "erp_admin",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "okyanus_ifs",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 40),
  queueLimit: Number(process.env.DB_QUEUE_LIMIT || 200),
  namedPlaceholders: true,
  decimalNumbers: true,
});

/**
 * تقسيم ملف SQL إلى جمل — يدعم كتل DELIMITER (للمحفزات والإجراءات المخزّنة)
 * القاعدة الذهبية: المُحدِّد (delimiter) يظل ثابتاً حتى تظهر تعليمة DELIMITER جديدة.
 * هذا يمنع تقطيع جسم الإجراء عند أول «;» داخلي — وهو سبب خطأ "near '' at line N".
 */
export function splitStatements(sql) {
  const out = [];
  let delim = ";";
  let buf = [];
  const flush = () => {
    const stmt = buf
      .filter((l) => !/^\s*--/.test(l)) // إزالة أسطر التعليقات الكاملة
      .join("\n")
      .trim();
    if (stmt) out.push(stmt);
    buf = [];
  };
  for (const line of sql.split("\n")) {
    const dm = line.trim().match(/^DELIMITER\s+(\S+)\s*$/i);
    if (dm) {
      flush(); // إفراغ أي جملة معلّقة قبل تبديل المُحدِّد
      delim = dm[1];
      continue;
    }
    buf.push(line);
    const te = line.trimEnd();
    if (te.endsWith(delim)) {
      buf[buf.length - 1] = te.slice(0, te.length - delim.length);
      flush();
      // لا نعيد المُحدِّد إلى «;» هنا — يبقى سارياً حتى تعليمة DELIMITER التالية
    }
  }
  flush();
  return out.filter((s) => s.length > 0);
}

/** إنشاء جدول تسجيل الهجرات إن لم يوجد */
async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     VARCHAR(40)  PRIMARY KEY,
      file_name   VARCHAR(191) NOT NULL,
      applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/** تنفيذ كل الهجرات غير المطبّقة بالترتيب — كل ملف داخل معاملة مستقلة */
export async function migrate() {
  const conn = await pool.getConnection();
  try {
    await ensureMigrationsTable(conn);
    const dir = join(__dir, "..", "migrations");
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    const [done] = await conn.query("SELECT version FROM schema_migrations");
    const applied = new Set(done.map((r) => r.version));

    for (const file of files) {
      const version = file.split("_")[0];
      if (applied.has(version)) { console.log(`✓ مُطبَّق مسبقاً: ${file}`); continue; }
      const sql = readFileSync(join(dir, file), "utf8");
      const statements = splitStatements(sql);
      await conn.beginTransaction();
      try {
        for (let i = 0; i < statements.length; i++) {
          try {
            await conn.query(statements[i]);
          } catch (stmtErr) {
            const snippet = statements[i].split("\n").slice(0, 6).join("\n");
            console.error(`\n✘ الجملة رقم ${i + 1} من ${statements.length} في ${file} فشلت:`);
            console.error(`───────── بداية الجملة ─────────\n${snippet}\n───────── نهاية المقتطف ─────────`);
            throw stmtErr;
          }
        }
        await conn.query("INSERT INTO schema_migrations (version, file_name) VALUES (?, ?)", [version, file]);
        await conn.commit();
        console.log(`✔ نُفّذت الهجرة: ${file} (${statements.length} جملة)`);
      } catch (err) {
        await conn.rollback();
        console.error(`\n✘ فشلت الهجرة ${file} وتم التراجع الكامل:`, err.message);
        throw err;
      }
    }
  } finally {
    conn.release();
  }
}

/** عرض حالة الهجرات */
export async function status() {
  const [rows] = await pool.query("SELECT version, file_name, applied_at FROM schema_migrations ORDER BY version");
  console.table(rows);
}

/** فحص صحة الاتصال مع زمن الاستجابة */
export async function ping() {
  const t0 = Date.now();
  const conn = await pool.getConnection();
  try { await conn.query("SELECT 1"); return { ok: true, ms: Date.now() - t0 }; }
  finally { conn.release(); }
}

/* تنفيذ مباشر عند: npm run migrate / migrate:status */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2] || "migrate";
  (cmd === "status" ? status() : migrate())
    .then(() => process.exit(0))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
