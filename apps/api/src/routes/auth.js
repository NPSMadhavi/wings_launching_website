import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { getJwtSecret } from "../middlewares/auth.js";
import { getAdminEmail, getFrontendUrl } from "../config/microsoftConfig.js";

const router = Router();


/* ─────────────────────────────────────────────────────────────
   Admin login with email + password
   POST /api/admin/login
   Body: { email, password }  (username accepted as alias for email)
   ───────────────────────────────────────────────────────────── */
router.post("/admin/login", async (req, res) => {
  try {
    const body = req.body || {};
    const email = String(body.email || body.username || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const ADMIN_EMAIL = (getAdminEmail() || "").toLowerCase();
    const ADMIN_PASS = String(process.env.ADMIN_PASSWORD || "");

    // 1. Check Primary Super Administrator (from .env)
    if (ADMIN_EMAIL && ADMIN_PASS && email === ADMIN_EMAIL && password === ADMIN_PASS) {
      const token = jwt.sign(
        {
          id: 0,
          email: getAdminEmail(),
          username: getAdminEmail(),
          role: "Super Admin",
          isSuperAdmin: true,
          sections: ["all"],
        },
        getJwtSecret(),
        { expiresIn: "1d" }
      );

      return res.json({
        token,
        user: {
          id: 0,
          email: getAdminEmail(),
          role: "Super Admin",
          isSuperAdmin: true,
          sections: ["all"],
        },
      });
    }

    // 2. Check admin_users in PostgreSQL database
    try {
      const { rows } = await pool.query(
        `SELECT * FROM admin_users WHERE LOWER(email) = $1 LIMIT 1`,
        [email]
      );

      if (rows && rows.length > 0) {
        const user = rows[0];

        if (!user.is_active) {
          return res.status(403).json({
            error: "Your account has been deactivated. Please contact administrator.",
          });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
          // Update last login timestamp asynchronously
          pool.query(
            `UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [user.id]
          ).catch(() => {});

          let sections = [];
          try {
            sections = Array.isArray(user.sections)
              ? user.sections
              : JSON.parse(user.sections || "[]");
          } catch {
            sections = [];
          }

          const token = jwt.sign(
            {
              id: user.id,
              email: user.email,
              username: user.email,
              role: user.role,
              isSuperAdmin: false,
              sections,
            },
            getJwtSecret(),
            { expiresIn: "1d" }
          );

          return res.json({
            token,
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
              isSuperAdmin: false,
              sections,
            },
          });
        }
      }
    } catch (dbErr) {
      console.error("[admin/login] DB check error:", dbErr?.message);
    }

    // 3. Invalid credentials
    return res.status(401).json({ error: "Invalid email or password" });
  } catch (err) {
    console.error("admin/login:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ─────────────────────────────────────────────────────────────
   Logout — destroys server session and redirects to login page.
   Works for both email/password and Microsoft login sessions.
   GET /api/auth/logout
   ───────────────────────────────────────────────────────────── */
router.get("/auth/logout", (req, res) => {
  const frontendUrl = getFrontendUrl();
  const loginUrl = `${frontendUrl}/admin`;

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("[Auth] Session destroy error:", err?.message);
      }
    });
  }

  res.clearCookie("wings_session");
  return res.redirect(loginUrl);
});

export default router;
