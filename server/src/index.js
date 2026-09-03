/**
 * ═══ الخادم المركزي — النظام المالي المتكامل v3.0 ═══
 * Express + JWT + WebSocket: دمج مركزي لحظي يتحمل 100+ مستخدم متزامن
 */
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { WebSocketServer } from "ws";
import http from "node:http";
import "dotenv/config";
import { pool, ping, migrate } from "./db.js";
import { mergePush, pullSince, bumpGen, records } from "./syncEngine.js";

const app = express();
const server = http.createServer(app);
const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_PER_MIN || 240), standardHeaders: true }));

/* ═══════ مصادقة JWT (OAuth2 Bearer) ═══════ */
app.post("/api/v3/auth/login", async (req, res) => {
  const { username, password, company, branch, year } = req.body || {};
  const [rows] = await pool.query("SELECT * FROM users WHERE username=? AND active=1 LIMIT 1", [username]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || "", u.pass_hash)))
    return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  const token = jwt.sign({ sub: u.id, user: u.full_name, role: u.role, company, branch, year }, SECRET, { expiresIn: process.env.JWT_EXPIRES || "8h" });
  res.json({ token, user: { name: u.full_name, role: u.role } });
});

const auth = (req, res, next) => {
  const h = req.headers.authorization || "";
  try { req.auth = jwt.verify(h.replace("Bearer ", ""), SECRET); next(); }
  catch { res.status(401).json({ error: "رمز منتهٍ أو غير صالح" }); }
};

/* ═══════ نقاط المزامنة المركزية ═══════ */
// دفع العمليات: دمج «الأحدث يفوز» + نشر الحذف عبر Tombstones
app.post("/api/v3/sync/push", auth, async (req, res) => {
  const { deviceId, patches, tombstones } = req.body || {};
  try {
    const stats = await mergePush({ deviceId, user: req.auth.user, patches, tombstones });
    hub.broadcast({ kind: "ops", deviceId, stats }, deviceId);        // بث لحظي لبقية الأجهزة
    res.json({ ok: true, ...stats });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// سحب تفاضلي للأجهزة العائدة من انقطاع
app.get("/api/v3/sync/pull", auth, async (req, res) => {
  const since = Number(req.query.since || 0);
  res.json(await pullSince(since));
});

// الاستبدال الشامل: رفع الجيل (استعادة نسخة/إعادة تهيئة) — ينتشر لكل الأجهزة
app.post("/api/v3/sync/gen", auth, async (req, res) => {
  const gen = await bumpGen(req.body?.reason || "استعادة", req.auth.user);
  hub.broadcast({ kind: "gen", gen, reason: req.body?.reason });
  res.json({ ok: true, gen });
});

/* ═══════ محرك الأنشطة التكيفية (21 نظاماً بقاعدة مرنة) ═══════ */
app.get("/api/v3/modules", auth, async (_req, res) => {
  const [mods] = await pool.query("SELECT * FROM activity_modules ORDER BY sort_order");
  const [ents] = await pool.query("SELECT * FROM activity_entities ORDER BY sort_order");
  const [fields] = await pool.query("SELECT * FROM activity_fields ORDER BY sort_order");
  res.json({ modules: mods, entities: ents, fields });
});
app.get("/api/v3/:module/records/:entity", auth, async (req, res) =>
  res.json(await records.list(req.params.module, req.params.entity, req.query.q || "")));
app.post("/api/v3/records/:entity", auth, async (req, res) =>
  res.json({ id: await records.upsert(req.params.entity, req.body, req.auth.user) }));
app.delete("/api/v3/records/:entity/:id", auth, async (req, res) => {
  await records.remove(req.params.id);
  res.json({ ok: true });
});

/* ═══════ حالة التشغيل ═══════ */
app.get("/api/v3/health", async (_req, res) => {
  const p = await ping();
  res.json({ ok: p.ok, ping: p.ms, devices: hub.size(), uptime: process.uptime() });
});

/* ═══════ محور WebSocket — البث اللحظي ═══════ */
class Hub {
  clients = new Map(); // deviceId -> ws
  broadcast(msg, except) {
    const raw = JSON.stringify(msg);
    for (const [id, ws] of this.clients) if (id !== except && ws.readyState === 1) ws.send(raw);
  }
  size() { return this.clients.size; }
}
const hub = new Hub();
const wss = new WebSocketServer({ server, path: process.env.WS_PATH || "/ws" });
wss.on("connection", (ws, req) => {
  const deviceId = new URL(req.url, "http://x").searchParams.get("deviceId") || `dev-${Date.now()}`;
  hub.clients.set(deviceId, ws);
  ws.send(JSON.stringify({ kind: "welcome", deviceId, peers: hub.size() }));
  ws.on("close", () => { hub.clients.delete(deviceId); hub.broadcast({ kind: "device-left", deviceId }); });
});

/* ═══════ الإقلاع: ترميم الجداول تلقائياً ثم التشغيل ═══════ */
const PORT = process.env.PORT || 4000;
migrate()
  .then(() => pool.query("INSERT IGNORE INTO generations (id, current) VALUES (1, 0)"))
  .then(() => server.listen(PORT, () => console.log(`✔ الخادم المركزي يعمل: http://localhost:${PORT} — الأجهزة المتصلة: ${hub.size()}`)))
  .catch((e) => { console.error("فشل الإقلاع:", e.message); process.exit(1); });
