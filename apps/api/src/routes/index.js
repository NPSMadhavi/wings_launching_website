import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import teamRouter from "./team.js";
import articlesRouter from "./articles.js";
import careersRouter from "./careers.js";
import eventsRouter from "./events.js";
import uploadRouter from "./upload.js";
import candidatesRouter from "./candidates.js";
import applicationsRouter from "./applications.js";
import eventSubscribersRouter from "./eventSubcriber.js";
import emailRecipientsRouter from "./emailRecipients.js";
import appointmentRouter from "./appointment.js";
import counsellingTypesRouter from "./counsellingTypes.js";
import partnersRouter from "./partners.js";
import testimonialsRouter from "./testimonials.js";
import socialMediaRouter from "./socialMedia.js";
import formSubmissionEmailsRouter from "./formSubmissionEmails.js";
import jobsRouter from "./jobs.js";
import adminUsersRouter from "./adminUsers.js";
import { db } from "../config/db.js";
import { isDuplicateColumnError } from "../config/pg-helpers.js";
import { requireAdmin } from "../middlewares/auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminUsersRouter);
router.use(teamRouter);
router.use(articlesRouter);
router.use(careersRouter);
router.use(eventsRouter);
router.use(uploadRouter);
router.use(candidatesRouter);
router.use(applicationsRouter);
router.use(eventSubscribersRouter);
router.use(emailRecipientsRouter);
router.use(jobsRouter);
router.use(formSubmissionEmailsRouter);

// Appointments
router.use("/appointments", appointmentRouter);

// Counselling types
router.use("/counselling-types", counsellingTypesRouter);

// Partners (logos table)
router.use(partnersRouter);

// Testimonials (testmonials table)
router.use(testimonialsRouter);

// Social media footer links
router.use(socialMediaRouter);

// Stub routes for disabled features — return empty arrays so the admin panel
// doesn't show 404 errors for interview availability endpoints
router.get("/admin/interview-availability", (_req, res) => res.json([]));
router.post("/admin/interview-availability/bulk", (_req, res) => res.status(201).json([]));
router.delete("/admin/interview-availability/:id", (_req, res) => res.json({ ok: true }));
router.get("/admin/interview-custom-requests", (_req, res) => res.json([]));

// ── Admin: Users (candidates) ──────────────────────────────────────────────
// Ensure is_blocked column exists on candidates table
(async () => {
  try {
    await (db as any).execute(
      "ALTER TABLE candidates ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT false"
    );
  } catch (err: any) {
    if (!isDuplicateColumnError(err)) console.error("[DB] candidates is_blocked column:", err?.message);
  }
})();

function mapCandidateToUser(row: any) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    mobileNumber: row.phone ?? "",
    emailVerified: Boolean(row.phone_verified),
    isBlocked: Boolean(row.is_blocked),
    createdAt: row.created_at ?? null,
  };
}

router.get("/admin/users", requireAdmin, async (_req, res) => {
  try {
    const [rows] = await (db as any).execute(
      `SELECT id, email, first_name, last_name, phone, phone_verified, is_blocked, created_at
       FROM candidates ORDER BY created_at DESC`
    );
    res.json((rows as any[]).map(mapCandidateToUser));
  } catch (err: any) {
    console.error("/admin/users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await (db as any).execute(
      `SELECT id, email, first_name, last_name, phone, phone_verified, is_blocked, created_at
       FROM candidates WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!(rows as any[]).length) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = mapCandidateToUser((rows as any[])[0]);

    // Fetch applications for this candidate
    let applications: any[] = [];
    try {
      const [appRows] = await (db as any).execute(
        `SELECT ja.id, ja.status, ja.submitted_at AS createdAt,
                jp.title AS jobTitle, jp.job_id AS jobIdCode
         FROM job_applications ja
         LEFT JOIN job_postings jp ON jp.id = ja.job_id
         WHERE ja.candidate_id = ?
         ORDER BY ja.submitted_at DESC`,
        [id]
      );
      applications = appRows as any[];
    } catch { /* table may not exist */ }

    res.json({
      user,
      profile: null,
      certifications: [],
      workExperience: [],
      applications,
    });
  } catch (err: any) {
    console.error("/admin/users/:id:", err);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

router.patch("/admin/users/:id/block", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isBlocked } = req.body ?? {};
    await (db as any).execute(
      "UPDATE candidates SET is_blocked = ? WHERE id = ?",
      [Boolean(isBlocked), id]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error("/admin/users/:id/block:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const connection = await (db as any).getConnection();

  try {
    await connection.beginTransaction();

    const [candidateRows] = await connection.execute(
      "SELECT id FROM candidates WHERE id = ? LIMIT 1",
      [id]
    );

    if (!(candidateRows as any[]).length) {
      await connection.rollback();
      return res.status(404).json({ error: "User not found" });
    }

    const [applicationRows] = await connection.execute(
      "SELECT id FROM job_applications WHERE candidate_id = ?",
      [id]
    );
    const applicationIds = (applicationRows as any[]).map((row) => row.id);

    if (applicationIds.length > 0) {
      const placeholders = applicationIds.map(() => "?").join(", ");

      await connection.execute(
        `DELETE FROM application_answers aa
         USING application_questions aq
         WHERE aq.id = aa.question_id
           AND aq.application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM application_questions
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM interview_slots
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM interview_bookings
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM interview_custom_requests
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `DELETE FROM mcq_sessions
         WHERE application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        `UPDATE interview_availability
         SET booked_application_id = NULL
         WHERE booked_application_id IN (${placeholders})`,
        applicationIds
      );

      await connection.execute(
        "DELETE FROM job_applications WHERE candidate_id = ?",
        [id]
      );
    }

    await connection.execute("DELETE FROM candidates WHERE id = ?", [id]);
    await connection.commit();
    return res.json({ success: true });
  } catch (err: any) {
    await connection.rollback().catch(() => {});
    console.error("/admin/users/:id DELETE:", err);
    return res.status(500).json({ error: "Failed to delete user" });
  } finally {
    connection.release();
  }
});

export default router;
