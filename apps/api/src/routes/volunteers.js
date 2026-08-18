import express from "express";
import { db } from "../config/db.js";
import { sendVolunteerApplicationEmail, sendVolunteerStatusUpdateEmail } from "../lib/email.js";
import { broadcastToAdmin } from "../lib/sse.js";

const router = express.Router();

async function ensureVolunteerApplicationsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS volunteer_applications (
      id SERIAL PRIMARY KEY,
      title VARCHAR(10) NOT NULL,
      name VARCHAR(150) NOT NULL,
      nric_passport_last4 VARCHAR(4) NOT NULL,
      citizenship VARCHAR(100) NOT NULL,
      dob DATE NOT NULL,
      age INT NOT NULL,
      gender VARCHAR(20) NOT NULL,
      marital_status VARCHAR(20) NOT NULL,
      ethnicity VARCHAR(100) NULL,
      religion VARCHAR(100) NULL,
      occupation VARCHAR(150) NULL,
      address TEXT NOT NULL,
      phone_hp VARCHAR(20) NOT NULL,
      phone_res VARCHAR(20) NULL,
      email VARCHAR(150) NOT NULL,
      interest_areas TEXT NULL,
      other_contribution TEXT NULL,
      skills_hobbies TEXT NULL,
      preferred_days TEXT NOT NULL,
      time_from VARCHAR(10) DEFAULT '09:00',
      time_to VARCHAR(10) DEFAULT '17:00',
      commitment_duration INT NOT NULL,
      commitment_unit VARCHAR(20) NOT NULL DEFAULT 'Months',
      signature VARCHAR(150) NOT NULL,
      declaration_checked BOOLEAN NOT NULL DEFAULT true,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      admin_notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

ensureVolunteerApplicationsTable().catch((err) => {
  console.error("[Volunteers] Failed to ensure table:", err);
});

function mapVolunteerRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    name: row.name,
    nric_passport_last4: row.nric_passport_last4,
    citizenship: row.citizenship,
    dob: row.dob,
    age: row.age,
    gender: row.gender,
    marital_status: row.marital_status,
    ethnicity: row.ethnicity || "",
    religion: row.religion || "",
    occupation: row.occupation || "",
    address: row.address,
    phone_hp: row.phone_hp,
    phone_res: row.phone_res || "",
    email: row.email,
    interest_areas: row.interest_areas || "",
    other_contribution: row.other_contribution || "",
    skills_hobbies: row.skills_hobbies || "",
    preferred_days: row.preferred_days || "",
    time_from: row.time_from || "",
    time_to: row.time_to || "",
    commitment_duration: row.commitment_duration,
    commitment_unit: row.commitment_unit,
    signature: row.signature,
    declaration_checked: Boolean(row.declaration_checked),
    status: row.status || "pending",
    admin_notes: row.admin_notes || "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function formatAvailability(row) {
  const days = row.preferred_days || "—";
  const time =
    row.time_from && row.time_to ? `${row.time_from} - ${row.time_to}` : "—";
  const commitment =
    row.commitment_duration && row.commitment_unit
      ? `${row.commitment_duration} ${row.commitment_unit}`
      : "—";
  return `${days} | ${time} | ${commitment}`;
}

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const {
      title,
      name,
      nric_passport_last4,
      citizenship,
      dob,
      age,
      gender,
      marital_status,
      ethnicity,
      religion,
      occupation,
      address,
      phone_hp,
      phone_res,
      email,
      interest_areas,
      other_contribution,
      skills_hobbies,
      preferred_days,
      time_from = "09:00",
      time_to = "17:00",
      commitment_duration,
      commitment_unit = "Months",
      signature,
      declaration_checked,
    } = body;

    const missing = [];
    if (!title) missing.push("title");
    if (!name) missing.push("name");
    if (!nric_passport_last4) missing.push("nric_passport_last4");
    if (!citizenship) missing.push("citizenship");
    if (!dob) missing.push("dob");
    if (!age) missing.push("age");
    if (!gender) missing.push("gender");
    if (!marital_status) missing.push("marital_status");
    if (!address) missing.push("address");
    if (!phone_hp) missing.push("phone_hp");
    if (!email) missing.push("email");
    if (!preferred_days) missing.push("preferred_days");
    if (!commitment_duration) missing.push("commitment_duration");
    if (!signature) missing.push("signature");
    if (!declaration_checked) missing.push("declaration_checked");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      return res.status(400).json({
        success: false,
        message: "Age must be a valid number between 1 and 120",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO volunteer_applications (
        title, name, nric_passport_last4, citizenship, dob, age, gender,
        marital_status, ethnicity, religion, occupation, address, phone_hp,
        phone_res, email, interest_areas, other_contribution, skills_hobbies,
        preferred_days, time_from, time_to, commitment_duration, commitment_unit,
        signature, declaration_checked, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        title,
        name.trim(),
        String(nric_passport_last4).toUpperCase(),
        citizenship,
        dob,
        parsedAge,
        gender,
        marital_status,
        ethnicity || null,
        religion || null,
        occupation || null,
        address,
        phone_hp,
        phone_res || null,
        email.toLowerCase(),
        interest_areas || null,
        other_contribution || null,
        skills_hobbies || null,
        preferred_days,
        time_from,
        time_to,
        parseInt(commitment_duration, 10),
        commitment_unit,
        signature,
        declaration_checked ? true : false,
      ]
    );

    const volunteer = mapVolunteerRow({
      id: result.insertId,
      title,
      name: name.trim(),
      nric_passport_last4,
      citizenship,
      dob,
      age: parsedAge,
      gender,
      marital_status,
      ethnicity,
      religion,
      occupation,
      address,
      phone_hp,
      phone_res,
      email,
      interest_areas,
      other_contribution,
      skills_hobbies,
      preferred_days,
      time_from,
      time_to,
      commitment_duration,
      commitment_unit,
      signature,
      declaration_checked: 1,
      status: "pending",
      created_at: new Date(),
    });

    const emailSent = await sendVolunteerApplicationEmail(volunteer);

    if (!emailSent) {
      broadcastToAdmin("email_failed", {
        context: "volunteer_application",
        volunteerId: result.insertId,
        email,
        reason: "Failed to send volunteer application email",
      });
    } else {
      broadcastToAdmin("email_sent", {
        context: "volunteer_application",
        volunteerId: result.insertId,
        email,
        subject: "Volunteer application notification delivered",
      });
    }

    const submittedAt = new Date().toISOString();

    broadcastToAdmin("new_form_submission", {
      formType: "Volunteer",
      id: result.insertId,
      name,
      email,
    });

    broadcastToAdmin("new_volunteer", {
      id: result.insertId,
      name,
      email,
      phone: phone_hp,
      submittedAt,
    });

    res.status(201).json({
      success: true,
      message: "Volunteer application submitted successfully",
      volunteer,
      emailSent,
    });
  } catch (error) {
    console.error("[Volunteers] Create failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
});

router.get("/", async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM volunteer_applications ORDER BY created_at DESC`
    );
    const volunteers = rows.map((row) => ({
      ...mapVolunteerRow(row),
      availability: formatAvailability(row),
    }));
    res.status(200).json({ success: true, volunteers });
  } catch (error) {
    console.error("[Volunteers] List failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM volunteer_applications WHERE id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }
    const volunteer = {
      ...mapVolunteerRow(rows[0]),
      availability: formatAvailability(rows[0]),
    };
    res.status(200).json({ success: true, volunteer });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const body = req.body || {};
    
    const [existingRows] = await db.execute(
      `SELECT * FROM volunteer_applications WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (!existingRows.length) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }

    const previousStatus = existingRows[0].status;

    const fields = [
      "title",
      "name",
      "nric_passport_last4",
      "citizenship",
      "dob",
      "age",
      "gender",
      "marital_status",
      "ethnicity",
      "religion",
      "occupation",
      "address",
      "phone_hp",
      "phone_res",
      "email",
      "interest_areas",
      "other_contribution",
      "skills_hobbies",
      "preferred_days",
      "time_from",
      "time_to",
      "commitment_duration",
      "commitment_unit",
      "signature",
      "status",
      "admin_notes",
    ];

    const updates = [];
    const values = [];
    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field] === "" ? null : body[field]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    values.push(req.params.id);
    await db.execute(
      `UPDATE volunteer_applications SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const [rows] = await db.execute(
      `SELECT * FROM volunteer_applications WHERE id = ? LIMIT 1`,
      [req.params.id]
    );
    
    const updatedVolunteer = mapVolunteerRow(rows[0]);

    if (body.status && body.status !== previousStatus) {
      const emailSent = await sendVolunteerStatusUpdateEmail(updatedVolunteer);
      if (!emailSent) {
        broadcastToAdmin("email_failed", {
          context: "volunteer_status_update",
          volunteerId: updatedVolunteer.id,
          email: updatedVolunteer.email,
          reason: "Failed to send volunteer status update email",
        });
      } else {
        broadcastToAdmin("email_sent", {
          context: "volunteer_status_update",
          volunteerId: updatedVolunteer.id,
          email: updatedVolunteer.email,
          subject: "Volunteer status update delivered",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Volunteer updated successfully",
      volunteer: updatedVolunteer,
    });
  } catch (error) {
    console.error("[Volunteers] Update failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `DELETE FROM volunteer_applications WHERE id = ? RETURNING id`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Volunteer not found" });
    }
    res.status(200).json({ success: true, message: "Volunteer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
