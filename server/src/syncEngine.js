/**
 * ═══ محرك الدمج المركزي (Server-Side Merge Engine) ═══
 * 1) دمج على مستوى السجل — الأحدث يفوز (لا حذف لبيانات أي جهاز)
 * 2) نشر الحذف عبر Tombstones بمفتاح فريد (يختفي من كل الأجهزة ولا يعود)
 * 3) الاستبدال الشامل عبر رقم الجيل Gen (استعادة/إعادة تهيئة تنتشر تلقائياً)
 * 4) سجل عمليات sync_ops للسحب التفاضلي (pull?since=seq)
 */
import { pool } from "./db.js";

/** دمج دفعة عمليات قادمة من جهاز — داخل معاملة واحدة، وتُعيد إحصاءات الدمج */
export async function mergePush({ deviceId, user, patches = [], tombstones = [] }) {
  const conn = await pool.getConnection();
  const stats = { accepted: 0, conflictsWon: 0, rejectedOlder: 0, deleted: 0 };
  try {
    await conn.beginTransaction();

    /* ── دمج الصفوف: الأحدث يفوز عبر مقارنة updated_at ── */
    for (const { coll, rows } of patches) {
      for (const row of rows) {
        const [res] = await conn.query(
          `INSERT INTO sync_records (coll, record_id, payload, updated_at, origin_device, updated_by)
           VALUES (:coll, :id, :payload, :ts, :dev, :usr)
           ON DUPLICATE KEY UPDATE
             payload       = IF(VALUES(updated_at) >= updated_at, VALUES(payload), payload),
             origin_device = IF(VALUES(updated_at) >= updated_at, VALUES(origin_device), origin_device),
             updated_by    = IF(VALUES(updated_at) >= updated_at, VALUES(updated_by), updated_by),
             updated_at    = GREATEST(updated_at, VALUES(updated_at))`,
          { coll, id: row.id, payload: JSON.stringify(row), ts: row.updatedAt || Date.now(), dev: deviceId, usr: user }
        );
        if (res.affectedRows === 1) stats.accepted++;
        else if (res.affectedRows === 2) stats.conflictsWon++;   /* حُدّث: الأحدث فاز */
        else stats.rejectedOlder++;                              /* صف أقدم — رُفض بأمان */

        /* تسجيل العملية للسحب التفاضلي والبث */
        await conn.query(
          "INSERT INTO sync_ops (coll, record_id, op_type, payload, device_id, actor) VALUES (?,?,?,?,?,?)",
          [coll, row.id, "upsert", JSON.stringify(row), deviceId, user]
        );
      }
    }

    /* ── نشر الحذف: Tombstone بمفتاح فريد — يُطبَّق مرة واحدة ولا يعود ── */
    for (const t of tombstones) {
      const [r] = await conn.query(
        "INSERT IGNORE INTO tombstones (coll, record_id, deleted_by, origin_device) VALUES (?,?,?,?)",
        [t.coll, t.id, user, deviceId]
      );
      if (r.affectedRows === 1) {
        stats.deleted++;
        await conn.query("DELETE FROM sync_records WHERE coll=? AND record_id=?", [t.coll, t.id]);
        await conn.query("INSERT INTO sync_ops (coll, record_id, op_type, device_id, actor) VALUES (?,?, 'delete', ?,?)", [t.coll, t.id, deviceId, user]);
      }
    }

    await conn.commit();
    return stats;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** السحب التفاضلي: كل ما حدث بعد seq معين + الجيل الحالي + شواهد الحذف */
export async function pullSince(seq = 0, limit = 500) {
  const [ops] = await pool.query("SELECT * FROM sync_ops WHERE seq > ? ORDER BY seq ASC LIMIT ?", [seq, limit]);
  const [gen] = await pool.query("SELECT current FROM generations WHERE id = 1");
  const [tombs] = await pool.query("SELECT coll, record_id, deleted_at FROM tombstones");
  return { ops, gen: gen[0]?.current || 0, tombstones: tombs };
}

/** رفع الجيل (استعادة نسخة/إعادة تهيئة) — تستبدل كل الأجهزة نسختها القديمة تلقائياً */
export async function bumpGen(reason, actor) {
  await pool.query("UPDATE generations SET current = current + 1, last_reason=?, last_actor=?, bumped_at=NOW() WHERE id=1", [reason, actor]);
  const [g] = await pool.query("SELECT current FROM generations WHERE id=1");
  return g[0].current;
}

/** استعلامات عامة للسجلات المرنة (محرك الأنشطة التكيفية) */
export const records = {
  list: (moduleKey, entityKey, q = "") =>
    pool.query(
      `SELECT r.*, m.name_ar AS module, e.name_ar AS entity FROM activity_records r
       JOIN activity_entities e ON e.id = r.entity_id
       JOIN activity_modules  m ON m.id = e.module_id
       WHERE m.slug=? AND e.slug=? AND (r.name LIKE ? OR r.code LIKE ?)
       ORDER BY r.updated_at DESC LIMIT 400`,
      [moduleKey, entityKey, `%${q}%`, `%${q}%`]
    ).then(([rows]) => rows),

  upsert: async (entityKey, body, user) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [ent] = await conn.query("SELECT id FROM activity_entities WHERE slug=?", [entityKey]);
      const id = body.id || `${entityKey.slice(0, 2).toUpperCase()}-${Date.now()}`;
      await conn.query(
        `INSERT INTO activity_records (id, entity_id, code, name, status, amount, doc_date, payload, updated_by, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), amount=VALUES(amount),
           doc_date=VALUES(doc_date), payload=VALUES(payload), updated_by=VALUES(updated_by), updated_at=VALUES(updated_at)`,
        [id, ent[0].id, id, body.name, body.status || null, body.amount || 0, body.doc_date || null, JSON.stringify(body), user, new Date()]
      );
      await conn.commit();
      return id;
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  },

  remove: (id) => pool.query("DELETE FROM activity_records WHERE id=?", [id]),
};
