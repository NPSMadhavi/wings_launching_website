import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { getAdminEmail } from "../config/microsoftConfig.js";

const router = Router();

// Ensure admin_users table exists automatically on startup
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(320) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(100) NOT NULL DEFAULT 'counsellor',
        sections JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      );
    `);
  } catch (err) {
    console.error("[DB] admin_users table init error:", err?.message);
  }
})();

export const SYSTEM_SECTIONS = [
  { key: "dashboard", label: "Dashboard", path: "/admin", description: "Admin overview, analytics & quick metrics" },
  { key: "team", label: "Team Members", path: "/admin/team", description: "Manage counsellors & staff team profiles" },
  { key: "articles", label: "Articles", path: "/admin/articles", description: "Create & edit mental health blogs & articles" },
  { key: "careers", label: "Careers", path: "/admin/careers", description: "Job postings, applicant portal & interview slots" },
  { key: "events", label: "Events", path: "/admin/events", description: "Workshops, webinars & event management" },
  { key: "services", label: "Services", path: "/admin/counselling-types", description: "Counselling types & service categories" },
  { key: "appointments", label: "Appointments", path: "/admin/appointments", description: "Client appointment requests & bookings" },
  { key: "volunteers", label: "Volunteers", path: "/admin/volunteers", description: "Volunteer applications & status review" },
  { key: "partners", label: "Partners", path: "/admin/partners", description: "Collaborating organisations & partner logos" },
  { key: "testimonials", label: "Testimonials", path: "/admin/testimonials", description: "Client testimonials & feedback" },
  { key: "social-media", label: "Social Media Links", path: "/admin/social-media", description: "Social media URLs & footer channels" },
  { key: "visitors", label: "Visitors", path: "/admin/visitors", description: "Real-time visitors & live traffic tracking" },
  { key: "mails", label: "Settings / Mails", path: "/admin/settings/primary-cc-mails", description: "Notification recipients & mail server settings" },
];

function formatUser(row) {
  let sections = [];
  try {
    sections = Array.isArray(row.sections)
      ? row.sections
      : JSON.parse(row.sections || "[]");
  } catch {
    sections = [];
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role || "counsellor",
    sections,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at || null,
    isSystem: false,
  };
}

// GET available system sections metadata
router.get("/admin/system-sections", requireAdmin, (_req, res) => {
  res.json({ sections: SYSTEM_SECTIONS });
});

// GET current authenticated user profile + accessible sections
router.get("/admin/me", requireAdmin, async (req, res) => {
  try {
    const adminEmail = (getAdminEmail() || "").toLowerCase();
    const tokenEmail = (req.admin?.email || "").toLowerCase();

    // Check if Super Admin
    if (req.admin?.isSuperAdmin || tokenEmail === adminEmail) {
      return res.json({
        id: 0,
        email: getAdminEmail(),
        role: "Super Admin",
        isSuperAdmin: true,
        isSystem: true,
        sections: ["all"],
        isActive: true,
      });
    }

    // Check in database for non-superadmin user
    const { rows } = await pool.query(
      `SELECT * FROM admin_users WHERE id = $1 OR LOWER(email) = $2 LIMIT 1`,
      [req.admin?.id || 0, tokenEmail]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: "Account has been deactivated" });
    }

    return res.json(formatUser(user));
  } catch (err) {
    console.error("[admin/me]:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// GET all users (includes primary super administrator info + table list)
router.get("/admin/system-users", requireAdmin, async (_req, res) => {
  try {
    const primaryEmail = getAdminEmail();
    const primaryAdmin = {
      id: 0,
      email: primaryEmail,
      role: "Super Admin",
      isSuperAdmin: true,
      isSystem: true,
      sections: ["all"],
      isActive: true,
      createdAt: null,
      lastLoginAt: null,
    };

    const { rows } = await pool.query(
      `SELECT * FROM admin_users ORDER BY created_at DESC`
    );

    res.json({
      primaryAdmin,
      users: rows.map(formatUser),
      availableSections: SYSTEM_SECTIONS,
    });
  } catch (err) {
    console.error("[GET /admin/system-users]:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST create new user
router.post("/admin/system-users", requireAdmin, async (req, res) => {
  try {
    const { email, password, role, sections, isActive } = req.body || {};

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");
    const cleanRole = String(role || "counsellor").trim();
    const cleanSections = Array.isArray(sections) ? sections : [];
    const active = isActive !== false;

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ error: "A valid email address is required" });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (!cleanRole) {
      return res.status(400).json({ error: "Role is required" });
    }

    const primaryEmail = (getAdminEmail() || "").toLowerCase();
    if (cleanEmail === primaryEmail) {
      return res.status(400).json({
        error: "This email address is already configured as the primary system administrator.",
      });
    }

    // Check if email already in admin_users
    const existing = await pool.query(
      `SELECT id FROM admin_users WHERE LOWER(email) = $1 LIMIT 1`,
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "A user with this email address already exists" });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const insertResult = await pool.query(
      `INSERT INTO admin_users (email, password_hash, role, sections, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cleanEmail, passwordHash, cleanRole, JSON.stringify(cleanSections), active]
    );

    const newUser = formatUser(insertResult.rows[0]);
    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.error("[POST /admin/system-users]:", err);
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
});

// PUT update user
router.put("/admin/system-users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const { email, password, role, sections, isActive } = req.body || {};

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanRole = String(role || "counsellor").trim();
    const cleanSections = Array.isArray(sections) ? sections : [];
    const active = isActive !== false;

    // Check existence
    const existing = await pool.query(
      `SELECT * FROM admin_users WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    if (cleanEmail) {
      const primaryEmail = (getAdminEmail() || "").toLowerCase();
      if (cleanEmail === primaryEmail) {
        return res.status(400).json({
          error: "This email address is reserved for the primary system administrator.",
        });
      }

      // Check unique email among others
      const dup = await pool.query(
        `SELECT id FROM admin_users WHERE LOWER(email) = $1 AND id <> $2 LIMIT 1`,
        [cleanEmail, id]
      );
      if (dup.rows.length > 0) {
        return res.status(400).json({ error: "Another user with this email already exists" });
      }
    }

    const current = existing.rows[0];
    const finalEmail = cleanEmail || current.email;

    let updateQuery = "";
    let updateParams = [];

    if (password && String(password).trim().length >= 6) {
      const passwordHash = await bcrypt.hash(String(password).trim(), 10);
      updateQuery = `
        UPDATE admin_users
        SET email = $1, password_hash = $2, role = $3, sections = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *
      `;
      updateParams = [finalEmail, passwordHash, cleanRole, JSON.stringify(cleanSections), active, id];
    } else {
      updateQuery = `
        UPDATE admin_users
        SET email = $1, role = $2, sections = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      updateParams = [finalEmail, cleanRole, JSON.stringify(cleanSections), active, id];
    }

    const updateResult = await pool.query(updateQuery, updateParams);
    const updatedUser = formatUser(updateResult.rows[0]);

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("[PUT /admin/system-users/:id]:", err);
    res.status(500).json({ error: err.message || "Failed to update user" });
  }
});

// PATCH toggle active status
router.patch("/admin/system-users/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body || {};

    const result = await pool.query(
      `UPDATE admin_users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [Boolean(isActive), id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user: formatUser(result.rows[0]) });
  } catch (err) {
    console.error("[PATCH /admin/system-users/:id/status]:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// DELETE user
router.delete("/admin/system-users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const result = await pool.query(
      `DELETE FROM admin_users WHERE id = $1 RETURNING id`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error("[DELETE /admin/system-users/:id]:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
