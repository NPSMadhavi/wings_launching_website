import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

async function ensureVisitorsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS visitors (
      id SERIAL PRIMARY KEY,
      visitor_id VARCHAR(100) NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_action_time BIGINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure columns exist if table was previously created with older schema
  await db.query(`
    ALTER TABLE visitors ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
  `);
  await db.query(`
    ALTER TABLE visitors ADD COLUMN IF NOT EXISTS last_action_time BIGINT NOT NULL DEFAULT 0;
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_visitors_active_seen ON visitors (is_active, last_seen);
  `);
}

ensureVisitorsTable().catch((err) => {
  console.error("[DB] Failed to ensure visitors table:", err.message);
});

// Periodic async cleanup of stale visitor sessions older than 24 hours
async function cleanupStaleVisitors() {
  try {
    await db.query(`DELETE FROM visitors WHERE last_seen < NOW() - INTERVAL '24 hours'`);
  } catch (_err) {
    // Ignore cleanup errors
  }
}

/* ================= PUBLIC: TOTAL & TODAY VISITORS ================= */
router.get("/visitors/public-total", async (_req, res) => {
  try {
    await ensureVisitorsTable();

    const [totalRows] = await db.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count FROM visitors`
    );

    const [todayRows] = await db.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count FROM visitors WHERE last_seen >= CURRENT_DATE`
    );

    const totalVisitors = Number(totalRows[0]?.count || 0);
    const todayVisitors = Number(todayRows[0]?.count || 0);

    res.json({ totalVisitors, todayVisitors });
  } catch (err) {
    console.error("GET /visitors/public-total error:", err);
    res.status(500).json({ totalVisitors: 0, todayVisitors: 0 });
  }
});

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch (_e) {
      return {};
    }
  }
  return {};
}

/* ================= PUBLIC: IMMEDIATE JOIN ================= */
router.post("/visitors/join", async (req, res) => {
  try {
    const body = parseBody(req);
    const visitorId = body.visitorId;
    const actionTime = Number(body.timestamp) || Date.now();

    if (!visitorId || typeof visitorId !== "string" || !visitorId.trim()) {
      return res.status(400).json({ error: "Valid visitorId is required" });
    }

    const cleanVisitorId = visitorId.trim().slice(0, 100);
    await ensureVisitorsTable();

    await db.query(
      `INSERT INTO visitors (visitor_id, is_active, last_seen, last_action_time)
       VALUES (?, TRUE, CURRENT_TIMESTAMP, ?)
       ON CONFLICT (visitor_id) DO UPDATE SET
         is_active = TRUE,
         last_seen = CURRENT_TIMESTAMP,
         last_action_time = GREATEST(visitors.last_action_time, EXCLUDED.last_action_time)`,
      [cleanVisitorId, actionTime]
    );

    res.json({ ok: true, visitorId: cleanVisitorId, active: true });
  } catch (err) {
    console.error("POST /visitors/join error:", err);
    res.status(500).json({ error: "Join failed" });
  }
});

/* ================= PUBLIC: IMMEDIATE LEAVE ================= */
router.post("/visitors/leave", async (req, res) => {
  try {
    const body = parseBody(req);
    const visitorId = body.visitorId;
    const actionTime = Number(body.timestamp) || Date.now();

    if (!visitorId || typeof visitorId !== "string" || !visitorId.trim()) {
      return res.status(400).json({ error: "Valid visitorId is required" });
    }

    const cleanVisitorId = visitorId.trim().slice(0, 100);
    await ensureVisitorsTable();

    // Only set is_active = FALSE if this leave event is not older than a subsequent join
    await db.query(
      `UPDATE visitors
       SET is_active = FALSE
       WHERE visitor_id = ?
         AND (last_action_time IS NULL OR last_action_time <= ?)`,
      [cleanVisitorId, actionTime]
    );

    res.json({ ok: true, visitorId: cleanVisitorId, active: false });
  } catch (err) {
    console.error("POST /visitors/leave error:", err);
    res.status(500).json({ error: "Leave failed" });
  }
});

/* ================= PUBLIC: HEARTBEAT (BACKUP FALLBACK) ================= */
router.post("/visitors/heartbeat", async (req, res) => {
  try {
    const body = parseBody(req);
    const visitorId = body.visitorId;
    const actionTime = Number(body.timestamp) || Date.now();

    if (!visitorId || typeof visitorId !== "string" || !visitorId.trim()) {
      return res.status(400).json({ error: "Valid visitorId is required" });
    }

    const cleanVisitorId = visitorId.trim().slice(0, 100);
    await ensureVisitorsTable();

    await db.query(
      `INSERT INTO visitors (visitor_id, is_active, last_seen, last_action_time)
       VALUES (?, TRUE, CURRENT_TIMESTAMP, ?)
       ON CONFLICT (visitor_id) DO UPDATE SET
         is_active = TRUE,
         last_seen = CURRENT_TIMESTAMP,
         last_action_time = GREATEST(visitors.last_action_time, EXCLUDED.last_action_time)`,
      [cleanVisitorId, actionTime]
    );

    res.json({ ok: true, visitorId: cleanVisitorId });
  } catch (err) {
    console.error("POST /visitors/heartbeat error:", err);
    res.status(500).json({ error: "Heartbeat failed" });
  }
});

/* ================= ADMIN: LIVE COUNT ================= */
router.get("/visitors/live-count", requireAdmin, async (_req, res) => {
  try {
    await ensureVisitorsTable();
    cleanupStaleVisitors().catch(() => {});

    // Active visitors = visitor sessions explicitly active AND last_seen within 45 seconds safety window
    const [rows] = await db.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count
       FROM visitors
       WHERE is_active = TRUE
         AND last_seen >= NOW() - INTERVAL '45 seconds'`
    );

    const count = Number(rows[0]?.count || 0);
    res.json({ count });
  } catch (err) {
    console.error("GET /visitors/live-count error:", err);
    res.status(500).json({ error: "Failed to fetch live count" });
  }
});

/* ================= ADMIN: VISITOR STATS (Live & Total) ================= */
router.get("/visitors/stats", requireAdmin, async (_req, res) => {
  try {
    await ensureVisitorsTable();
    cleanupStaleVisitors().catch(() => {});

    // Live Visitors: is_active = TRUE and last_seen within 45s timeout
    const [liveRows] = await db.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count
       FROM visitors
       WHERE is_active = TRUE
         AND last_seen >= NOW() - INTERVAL '45 seconds'`
    );

    // Today's Visitors: unique visitor sessions active today
    const [todayRows] = await db.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count
       FROM visitors
       WHERE last_seen >= CURRENT_DATE`
    );

    // Total Visitors: unique anonymous visitor sessions ever registered
    const [totalRows] = await db.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS count
       FROM visitors`
    );

    const liveVisitors = Number(liveRows[0]?.count || 0);
    const todayVisitors = Number(todayRows[0]?.count || 0);
    const totalVisitors = Number(totalRows[0]?.count || 0);

    res.json({
      liveVisitors,
      todayVisitors,
      totalVisitors,
    });
  } catch (err) {
    console.error("GET /visitors/stats error:", err);
    res.status(500).json({ error: "Failed to fetch visitor stats" });
  }
});

export default router;
