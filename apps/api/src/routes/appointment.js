// src/routes/appointment.js

import express from "express";
import { db } from "../config/db.js";
import { isDuplicateColumnError } from "../config/pg-helpers.js";
import { sendAppointmentConfirmationEmail, protectFileWithPassword } from "../lib/email.js";
import { broadcastToAdmin } from "../lib/sse.js";

const router = express.Router();

async function ensureAppointmentColumns() {
    const columns = [
        ["sub_counselling_types", "TEXT NULL"],
        ["enquirer_type", "TEXT NULL"],
        ["enquirer_name", "TEXT NULL"],
        ["enquirer_relationship", "TEXT NULL"],
        ["enquirer_contact_number", "TEXT NULL"],
        ["enquirer_email", "TEXT NULL"],
        ["referral_agency_name", "TEXT NULL"],
        ["referral_agency_contact_person", "TEXT NULL"],
        ["referral_agency_contact_email", "TEXT NULL"],
        ["referral_agency_password", "TEXT NULL"],
        ["attachments_json", "TEXT NULL"],
    ];

    for (const [colName, colType] of columns) {
        try {
            const [cols] = await db.execute(
                `SELECT column_name FROM information_schema.columns
                 WHERE table_schema = current_schema()
                   AND table_name = 'appointments'
                   AND column_name = '${colName}'`
            );
            if (cols.length === 0) {
                await db.execute(
                    `ALTER TABLE appointments ADD COLUMN ${colName} ${colType}`
                );
                console.log(`[Appointments] Added ${colName} column`);
            }
        } catch (err) {
            if (!isDuplicateColumnError(err)) {
                console.warn(`[Appointments] Schema check for ${colName} failed:`, err.message);
            }
        }
    }
}

ensureAppointmentColumns();

/* =========================================================
   CREATE APPOINTMENT
========================================================= */

router.post("/", async (req, res) => {
    try {
        const {
            nric_fin_number,
            name,
            age,
            gender,
            nationality,
            email,
            phone,
            counselling_type,
            sub_counselling_types,
            description,
            remarks,
            type_of_concern,
            type_of_concern_other,
            enquirer_type,
            enquirerType,
            enquirer_name,
            enquirer_relationship,
            enquirer_contact_number,
            enquirer_email,
            referral_agency_name,
            referralAgencyName,
            referral_agency_contact_person,
            referralAgencyContactPerson,
            referral_agency_contact_email,
            referralAgencyContactEmail,
            referral_agency_password,
            referralAgencyPassword,
            referral_agency_attachment_1,
            referral_agency_attachment_1_data,
            referral_agency_attachment_2,
            referral_agency_attachment_2_data,
            relationship,
            attachment1,
            attachment2,
            attachments
        } = req.body;

        const missingFields = [];
        if (!nric_fin_number) missingFields.push("nric_fin_number");
        if (!name) missingFields.push("name");
        if (!age) missingFields.push("age");
        if (!gender) missingFields.push("gender");
        if (!nationality) missingFields.push("nationality");
        if (!email) missingFields.push("email");
        if (!phone) missingFields.push("phone");

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`
            });
        }

        const parsedAge = parseInt(age, 10);
        if (Number.isNaN(parsedAge) || parsedAge <= 0) {
            return res.status(400).json({
                success: false,
                message: "Age must be a valid positive number"
            });
        }

        const finalEnquirerType = enquirer_type || enquirerType || (
            (referral_agency_name || referralAgencyName) ? "Referral Agency" :
            (enquirer_name || enquirer_relationship || relationship || enquirer_contact_number || enquirer_email) ? "Enquirer" : "Self"
        );
        const finalRefAgencyName = referral_agency_name || referralAgencyName || null;
        const finalRefAgencyPerson = referral_agency_contact_person || referralAgencyContactPerson || null;
        const finalRefAgencyEmail = referral_agency_contact_email || referralAgencyContactEmail || null;
        const finalRefAgencyPassword = referral_agency_password || referralAgencyPassword || null;
        const finalRelationship = relationship || enquirer_relationship || null;

        const rawFiles = [];
        if (referral_agency_attachment_1_data || referral_agency_attachment_1) {
            rawFiles.push({
                name: referral_agency_attachment_1 || "Attachment_1.pdf",
                data: referral_agency_attachment_1_data || referral_agency_attachment_1
            });
        }
        if (referral_agency_attachment_2_data || referral_agency_attachment_2) {
            rawFiles.push({
                name: referral_agency_attachment_2 || "Attachment_2.pdf",
                data: referral_agency_attachment_2_data || referral_agency_attachment_2
            });
        }
        if (attachment1) rawFiles.push(attachment1);
        if (attachment2) rawFiles.push(attachment2);
        if (Array.isArray(attachments)) rawFiles.push(...attachments);

        const fileList = [];
        for (let i = 0; i < rawFiles.length; i++) {
            const fileItem = rawFiles[i];
            if (!fileItem) continue;
            let fileName = typeof fileItem === 'string' ? `Attachment_${i + 1}.pdf` : (fileItem.name || `Attachment_${i + 1}.pdf`);
            let rawData = typeof fileItem === 'string' ? fileItem : (fileItem.data || fileItem.contentBytes || fileItem.base64 || "");

            if (finalRefAgencyPassword && rawData) {
                try {
                    let base64Content = rawData;
                    if (base64Content.includes(",")) {
                        base64Content = base64Content.split(",")[1];
                    }
                    const inputBuffer = Buffer.from(base64Content, "base64");
                    const protectedRes = await protectFileWithPassword(fileName, inputBuffer, finalRefAgencyPassword);
                    if (protectedRes && protectedRes.buffer) {
                        const encryptedBase64 = `data:application/pdf;base64,${protectedRes.buffer.toString("base64")}`;
                        fileList.push({
                            name: protectedRes.name || fileName,
                            data: encryptedBase64
                        });
                        continue;
                    }
                } catch (err) {
                    console.warn("[Appointment POST] Failed to encrypt attachment:", err.message);
                }
            }
            fileList.push(typeof fileItem === 'string' ? { name: fileName, data: rawData } : fileItem);
        }

        const attachmentsJson = fileList.length ? JSON.stringify(fileList) : null;

        const sql = `
      INSERT INTO appointments (
        nric_fin_number,
        name,
        age,
        gender,
        nationality,
        email,
        phone,
        counselling_type,
        sub_counselling_types,
        description,
        remarks,
        type_of_concern,
        type_of_concern_other,
        enquirer_type,
        enquirer_name,
        enquirer_relationship,
        enquirer_contact_number,
        enquirer_email,
        referral_agency_name,
        referral_agency_contact_person,
        referral_agency_contact_email,
        referral_agency_password,
        attachments_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const values = [
            nric_fin_number,
            name,
            parsedAge,
            gender,
            nationality,
            email,
            phone,
            counselling_type || "Counselling",
            sub_counselling_types || null,
            description || null,
            remarks || null,
            type_of_concern || null,
            type_of_concern_other || null,
            finalEnquirerType,
            enquirer_name || null,
            finalRelationship,
            enquirer_contact_number || null,
            enquirer_email || null,
            finalRefAgencyName,
            finalRefAgencyPerson,
            finalRefAgencyEmail,
            finalRefAgencyPassword,
            attachmentsJson
        ];

        const [result] = await db.execute(sql, values);

        const appointment = {
            id: result.insertId,
            nric_fin_number,
            name,
            age: parsedAge,
            gender,
            nationality,
            email,
            phone,
            counselling_type: counselling_type || "",
            sub_counselling_types: sub_counselling_types || "",
            description: description || "",
            remarks: remarks || "",
            type_of_concern: type_of_concern || "",
            type_of_concern_other: type_of_concern_other || "",
            enquirer_type: finalEnquirerType,
            enquirer_name: enquirer_name || null,
            enquirer_relationship: finalRelationship,
            enquirer_contact_number: enquirer_contact_number || null,
            enquirer_email: enquirer_email || null,
            referral_agency_name: finalRefAgencyName,
            referral_agency_contact_person: finalRefAgencyPerson,
            referral_agency_contact_email: finalRefAgencyEmail,
            referral_agency_password: finalRefAgencyPassword,
            relationship: finalRelationship,
            attachments: fileList
        };

        const emailSent = await sendAppointmentConfirmationEmail(appointment);
        if (!emailSent) {
            console.error("Appointment email send failed for appointment id:", result.insertId, "recipients:", email, "and counselling center");
            broadcastToAdmin("email_failed", {
              context: "appointment_confirmation",
              appointmentId: result.insertId,
              email,
              reason: "Failed to send appointment confirmation email"
            });
        } else {
            console.log("Appointment email sent successfully for appointment id:", result.insertId);
            broadcastToAdmin("email_sent", {
              context: "appointment_confirmation",
              appointmentId: result.insertId,
              email,
              subject: "Appointment confirmation delivered"
            });
        }

        broadcastToAdmin("new_form_submission", {
          formType: "Appointment",
          id: result.insertId,
          name,
          email,
          counsellingType: counselling_type
        });

        broadcastToAdmin("new_appointment", {
          id: result.insertId,
          name,
          email,
          counsellingType: counselling_type,
        });

        res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            appointment,
            emailSent
        });

    } catch (error) {
        console.error("Appointment creation failed:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
});

/* =========================================================
   GET ALL APPOINTMENTS
========================================================= */

router.get("/", async (req, res) => {
    try {

        const sql = `
      SELECT *
      FROM appointments
      ORDER BY created_at DESC
    `;

        const [rows] = await db.execute(sql);

        const appointments = await Promise.all(rows.map(async (row) => {
            let attachments = [];
            if (row.attachments_json) {
                try {
                    attachments = JSON.parse(row.attachments_json);
                } catch (e) {
                    attachments = [];
                }
            }

            const password = row.referral_agency_password;
            if (password && Array.isArray(attachments) && attachments.length > 0) {
                const encryptedAttachments = await Promise.all(attachments.map(async (file, idx) => {
                    const fileName = typeof file === 'string' ? `Attachment_${idx + 1}.pdf` : (file.name || `Attachment_${idx + 1}.pdf`);
                    const rawData = typeof file === 'object' && file.data ? file.data : (typeof file === 'string' ? file : "");
                    if (!rawData) return file;

                    try {
                        let base64Content = rawData;
                        if (base64Content.includes(",")) {
                            base64Content = base64Content.split(",")[1];
                        }
                        const inputBuffer = Buffer.from(base64Content, "base64");

                        const pdfHeaderStr = inputBuffer.toString("utf8", 0, Math.min(inputBuffer.length, 2048));
                        if (pdfHeaderStr.includes("/Encrypt") || pdfHeaderStr.includes("/Filter/Standard")) {
                            return file;
                        }

                        const protectedRes = await protectFileWithPassword(fileName, inputBuffer, password);
                        if (protectedRes && protectedRes.buffer) {
                            return {
                                name: protectedRes.name || fileName,
                                data: `data:application/pdf;base64,${protectedRes.buffer.toString("base64")}`
                            };
                        }
                    } catch (e) {
                        console.warn("[GET Appointments] Encrypt on the fly failed:", e.message);
                    }
                    return file;
                }));
                attachments = encryptedAttachments;
            }

            return {
                ...row,
                attachments: Array.isArray(attachments) ? attachments : [],
            };
        }));

        res.status(200).json({
            success: true,
            count: appointments.length,
            appointments
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/* =========================================================
   GET SINGLE APPOINTMENT
========================================================= */

router.get("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const sql = `
      SELECT *
      FROM appointments
      WHERE id = ?
    `;

        const [rows] = await db.execute(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        res.status(200).json({
            success: true,
            appointment: rows[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/* =========================================================
   UPDATE APPOINTMENT
========================================================= */

router.put("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const {
            nric_fin_number,
            name,
            age,
            gender,
            nationality,
            email,
            phone,
            counselling_type,
            sub_counselling_types,
            description,
            remarks
        } = req.body;

        const sql = `
      UPDATE appointments
      SET
        nric_fin_number = ?,
        name = ?,
        age = ?,
        gender = ?,
        nationality = ?,
        email = ?,
        phone = ?,
        counselling_type = ?,
        sub_counselling_types = ?,
        description = ?,
        remarks = ?
      WHERE id = ?
    `;

        const values = [
            nric_fin_number,
            name,
            age,
            gender,
            nationality,
            email,
            phone,
            counselling_type,
            sub_counselling_types ?? null,
            description,
            remarks,
            id
        ];

        await db.execute(sql, values);

        res.status(200).json({
            success: true,
            message: "Appointment updated successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/* =========================================================
   DELETE APPOINTMENT
========================================================= */

router.delete("/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const sql = `
      DELETE FROM appointments
      WHERE id = ?
    `;

        await db.execute(sql, [id]);

        res.status(200).json({
            success: true,
            message: "Appointment deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

export default router;