import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../config/db.js";
import { buildInterviewBookingLink, getCandidatePortalOrigin } from "./candidatePortalLinks.js";
import {
  recordFormSubmissionEmail,
  formatAppointmentEmailContent,
  formatApplicationEmailContent,
  formatVolunteerEmailContent,
} from "./formSubmissionEmailLog.js";
import {
  getActiveSubscribers,
  wasNotificationSent,
  recordMailLog,
  ensureNotifyTables,
} from "./notifyService.js";
import {
  sendGraphMail,
  getMailFrom,
  getMailTo,
} from "../services/microsoftMailService.js";

/**
 * All site emails go through Microsoft Graph (MAIL_FROM mailbox).
 * SMTP / Gmail is intentionally not used.
 */
function isGraphMailConfigured() {
  const clientId = process.env.AZURE_CLIENT_ID || process.env.MS_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID || process.env.MS_TENANT_ID;
  const secret = process.env.AZURE_CLIENT_SECRET || process.env.MS_CLIENT_SECRET;
  const from = getMailFrom();
  return Boolean(clientId && tenantId && secret && from);
}

function extractEmailAddress(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const angle = raw.match(/<([^>]+)>/);
  return (angle ? angle[1] : raw).trim().toLowerCase();
}

function getFromAddress() {
  const addr = getMailFrom() || process.env.EMAIL_FROM || "";
  return addr
    ? `WINGS Counselling Centre <${addr}>`
    : "WINGS Counselling Centre <itsupport@wingscounselling.org.sg>";
}

/** Org inbox for appointment / volunteer / Stay Connected alerts */
function getOrgNotificationEmail() {
  const to =
    process.env.FORM_NOTIFICATION_TO ||
    getMailTo() ||
    process.env.APPOINTMENT_NOTIFICATION_EMAIL ||
    process.env.ORGANIZATION_NOTIFICATION_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.EMAIL_NOTIFICATION_TO ||
    "";
  return isValidEmail(to) ? to.trim().toLowerCase() : "";
}

function getFormNotificationCcFromEnv() {
  const raw = String(
    process.env.FORM_NOTIFICATION_CC ||
      process.env.APPOINTMENT_CC_EMAIL ||
      ""
  ).trim();
  if (!raw) return [];
  return raw.split(/[,;]/).map((e) => e.trim()).filter(isValidEmail);
}

const DEFAULT_FORM_PRIMARY_EMAIL = "lavetimadhavilatha19@gmail.com";
const DEFAULT_FORM_CC_EMAIL = "sahupavan335@gmail.com";

/**
 * Primary + CC recipients for appointment/volunteer admin alerts.
 * Uses email_recipients table first, then .env (FORM_NOTIFICATION_TO / FORM_NOTIFICATION_CC), then defaults.
 */
async function getFormSubmissionNotificationRecipients(excludeEmail = "") {
  const exclude = (excludeEmail || "").trim().toLowerCase();

  let primaryRecipients = await getConfiguredEmailRecipients("primary");
  let ccRecipients = await getConfiguredEmailRecipients("cc");

  if (!primaryRecipients.length) {
    const envPrimary = getOrgNotificationEmail();
    primaryRecipients = envPrimary ? [envPrimary] : [DEFAULT_FORM_PRIMARY_EMAIL];
  }

  if (!ccRecipients.length) {
    ccRecipients = getFormNotificationCcFromEnv();
    if (!ccRecipients.length) {
      ccRecipients = [DEFAULT_FORM_CC_EMAIL];
    }
  }

  primaryRecipients = uniqueEmails(primaryRecipients).filter((e) => e !== exclude);
  ccRecipients = uniqueEmails(ccRecipients).filter(
    (e) => e !== exclude && !primaryRecipients.includes(e)
  );

  return {
    primary: primaryRecipients[0] || "",
    cc: ccRecipients,
    allPrimary: primaryRecipients,
  };
}

function formatSubmittedAt(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-SG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Singapore",
    });
  } catch {
    return String(value);
  }
}

function buildAdminDetailRows(rows) {
  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 10px 12px 10px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 38%; vertical-align: top;">
            ${escapeHtml(label)}
          </td>
          <td style="padding: 10px 0; color: #334155; font-size: 14px; vertical-align: top; word-break: break-word;">
            ${escapeHtml(value ?? "—")}
          </td>
        </tr>
      `
    )
    .join("");
}

function buildAdminDetailsCard(title, rows) {
  if (!rows.length) return "";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; padding: 22px 24px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 14px 0; color: #0D4A7A; font-size: 16px; font-weight: 700;">
            ${escapeHtml(title)}
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${buildAdminDetailRows(rows)}
          </table>
        </td>
      </tr>
    </table>
  `;
}

function buildAdminHighlightedCard(title, subtitle, mainValue, extraHtml = "") {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #ffffff; border-radius: 16px; padding: 24px; border: 2px solid #0D4A7A; box-shadow: 0 4px 14px rgba(13, 74, 122, 0.08);">
          <p style="margin: 0 0 6px 0; color: #0D4A7A; font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;">
            ${escapeHtml(title)}
          </p>
          <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">${escapeHtml(subtitle)}</p>
          <p style="margin: 0 0 18px 0; color: #0D4A7A; font-size: 20px; font-weight: 700; line-height: 1.4;">
            ${escapeHtml(mainValue ?? "—")}
          </p>
          ${extraHtml}
        </td>
      </tr>
    </table>
  `;
}

function buildAdminTextCard(title, content) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #f8fafc; border-radius: 12px; padding: 20px 22px; border: 1px solid #FFD700; border-top: 4px solid #FFD700;">
          <p style="margin: 0 0 8px 0; color: #0D4A7A; font-size: 14px; font-weight: 700;">
            ${escapeHtml(title)}
          </p>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.7; word-break: break-word;">
            ${escapeHtml(content ?? "—")}
          </p>
        </td>
      </tr>
    </table>
  `;
}

function getAdminNotificationEmailWrapper(content, title = "WINGS Admin Notification") {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#e8f0f7;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e8f0f7;padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.10);">
              <tr>
                <td style="background:#ffffff;padding:32px;text-align:center;border-bottom:1px solid #e2e8f0;">
                  <img src="cid:wings-logo@wings" alt="WINGS Logo" style="display:block;margin:0 auto;width:180px;height:auto;max-width:100%;" />
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px;">
                  ${content}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function buildAppointmentAdminNotificationHtml(appointment) {
  const clientName = escapeHtml(appointment.name || "Unknown");
  const counsellingType = appointment.counselling_type || "—";
  const subTypes = parseSubCounsellingTypes(
    appointment.sub_counselling_types || appointment.remarks
  );
  const subTypesExtra = subTypes.length
    ? `${buildSubCounsellingTypesEmailTable(subTypes)}`
    : "";

  const contactRows = [
    ["Full Name", appointment.name],
    ["Email", appointment.email],
    ["Phone", appointment.phone],
    ["NRIC / FIN", appointment.nric_fin_number],
    ["Age", appointment.age],
    ["Gender", appointment.gender],
    ["Nationality", appointment.nationality],
  ];

  let html = `
    <p style="margin:0 0 8px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
      New Appointment Submission
    </p>
    <h2 style="margin:0 0 24px 0;color:#0D4A7A;font-size:22px;font-weight:700;">
      Appointment Request — ${clientName}
    </h2>
    ${buildAdminDetailsCard("Applicant Contact Details", contactRows)}
    ${buildAdminHighlightedCard("Selected Support", "Main Counselling Type", counsellingType, subTypesExtra)}
  `;

  if (appointment.description) {
    html += buildAdminTextCard("Brief Description of Concern", appointment.description);
  }

  if (appointment.remarks) {
    html += buildAdminTextCard("Remarks", appointment.remarks);
  }

  return html;
}

function buildVolunteerAdminNotificationHtml(volunteer) {
  const volunteerName = escapeHtml(volunteer.name || "Unknown");

  const contactRows = [
    ["Title", volunteer.title],
    ["Full Name", volunteer.name],
    ["Email", volunteer.email],
    ["Phone (H/P)", volunteer.phone_hp],
    ["Phone (Res)", volunteer.phone_res],
    ["NRIC / Passport (Last 4)", volunteer.nric_passport_last4],
    ["Citizenship", volunteer.citizenship],
    ["Date of Birth", volunteer.dob],
    ["Age", volunteer.age],
    ["Gender", volunteer.gender],
    ["Address", volunteer.address],
    ["Submitted On", formatSubmittedAt(volunteer.created_at)],
  ];

  const preferenceRows = [
    ["Interest Areas", volunteer.interest_areas],
    ["Other Contribution", volunteer.other_contribution],
    ["Skills & Hobbies", volunteer.skills_hobbies],
    ["Preferred Days", volunteer.preferred_days],
    ["Availability", `${volunteer.time_from || "—"} - ${volunteer.time_to || "—"}`],
    ["Commitment", `${volunteer.commitment_duration || "—"} ${volunteer.commitment_unit || ""}`.trim()],
  ];

  return `
    <p style="margin:0 0 8px 0;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
      New Form Submission
    </p>
    <h2 style="margin:0 0 24px 0;color:#0D4A7A;font-size:22px;font-weight:700;">
      Volunteer Application — ${volunteerName}
    </h2>
    ${buildAdminDetailsCard("Applicant Contact Details", contactRows)}
    ${buildAdminDetailsCard("Volunteer Preferences", preferenceRows)}
  `;
}

/**
 * Send via Microsoft Graph only (no SMTP / Gmail).
 */
async function sendWithFallback(mailOptions) {
  if (!isGraphMailConfigured()) {
    throw new Error(
      "Microsoft Graph mail is not configured. Set MAIL_FROM, MAIL_TO, and MS_CLIENT_ID / MS_TENANT_ID / MS_CLIENT_SECRET in apps/api/.env"
    );
  }

  const from =
    extractEmailAddress(mailOptions.from) || getMailFrom();
  const to = mailOptions.to;
  const html = mailOptions.html || mailOptions.text || "";

  const replyToRaw = mailOptions.replyTo;
  let replyTo;
  if (replyToRaw) {
    const list = Array.isArray(replyToRaw) ? replyToRaw : [replyToRaw];
    replyTo = list
      .map((item) => {
        if (typeof item === "string") {
          const address = extractEmailAddress(item);
          return address ? { emailAddress: { address } } : null;
        }
        if (item?.emailAddress?.address) return item;
        if (item?.address) {
          return { emailAddress: { address: item.address, name: item.name } };
        }
        return null;
      })
      .filter(Boolean);
  }

  // Inline logo for notify emails (Gmail cannot load localhost image URLs)
  let attachments = Array.isArray(mailOptions.attachments)
    ? [...mailOptions.attachments]
    : [];
  if (
    String(html).includes(`cid:${NOTIFY_LOGO_CID}`) &&
    !attachments.some((a) => a?.contentId === NOTIFY_LOGO_CID)
  ) {
    const logo = getNotifyLogoGraphAttachment();
    if (logo) attachments.push(logo);
  }

  await sendGraphMail({
    from,
    to,
    cc: mailOptions.cc,
    subject: mailOptions.subject,
    html,
    replyTo: replyTo?.length ? replyTo : undefined,
    attachments: attachments.length ? attachments : undefined,
    saveToSentItems: true,
  });

  console.log(`[Email] Sent via Microsoft Graph from=${from} to=${to}`);
}

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function uniqueEmails(emails) {
  return Array.from(new Set(
    (emails || [])
      .map((email) => (typeof email === "string" ? email.trim().toLowerCase() : ""))
      .filter(isValidEmail)
  ));
}

async function getConfiguredEmailRecipients(type) {
  try {
    const [rows] = await db.execute(
      "SELECT email FROM email_recipients WHERE type = ? ORDER BY id ASC",
      [type]
    );

    return uniqueEmails(rows.map((row) => row.email));
  } catch (err) {
    console.warn("[Email] Unable to load configured email recipients:", err);
    return [];
  }
}

const FROM = getFromAddress; // call as FROM() — Graph mailbox (MAIL_FROM)

function normalizeMobileNumber(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return "";

  const defaultCountryCode = process.env.TWILIO_DEFAULT_COUNTRY_CODE?.trim();
  if (defaultCountryCode) {
    const normalizedCountryCode = defaultCountryCode.startsWith("+")
      ? defaultCountryCode
      : `+${defaultCountryCode.replace(/\D/g, "")}`;

    return `${normalizedCountryCode}${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }

  return `+${digits}`;
}

function getTwilioSmsConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber =
    process.env.TWILIO_FROM_NUMBER?.trim() ??
    process.env.TWILIO_FROM?.trim() ??
    process.env.TWILIO_PHONE_NUMBER?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

  return { accountSid, authToken, fromNumber, messagingServiceSid };
}

/**
 * Send OTP via SMS (Twilio)
 */
export async function sendMobileOtpSms(to, otp, firstName) {
  const { accountSid, authToken, fromNumber, messagingServiceSid } =
    getTwilioSmsConfig();
  const mobileNumber = normalizeMobileNumber(to);

  if (!accountSid || !authToken) {
    console.log(`[Twilio Mock] Would have sent OTP ${otp} to ${mobileNumber}`);
    return true;
  }

  if (!mobileNumber) {
    throw new Error("A valid mobile number is required to send OTP SMS.");
  }

  if (!fromNumber && !messagingServiceSid) {
    return false;
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const body = new URLSearchParams({
    To: mobileNumber,
    Body: `Hi ${firstName || "there"}, your WINGS verification code is ${otp}. It expires in 10 minutes.`,
  });

  if (messagingServiceSid) {
    body.set("MessagingServiceSid", messagingServiceSid);
  } else {
    body.set("From", fromNumber);
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to send OTP SMS");
  }

  return true;
}

/**
 * Generate calming, mental health themed email wrapper
 */
function getMentalHealthEmailWrapper(content, title = "WINGS Counselling Centre") {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #e8f4f8 0%, #d9e8f0 100%); font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #e8f4f8 0%, #d9e8f0 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 6px 12px rgba(0, 0, 0, 0.05);">
              <tr>
                <td
                  style="
                    background: #ffffff;
                    padding: 32px 30px;
                    text-align: center;
                    border-bottom: 1px solid #e8eef2;
                  "
                >
                  <!-- WINGS Logo -->
                  <div style="margin: 0 auto;">
                    <img
                      src="cid:wings-logo@wings"
                      alt="WINGS Logo"
                      style="display: block; width: 180px; height: auto; max-width: 100%; margin: 0 auto;"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background: #FFFFFF; padding: 20px 30px; text-align: center; ">
                  <p style="margin: 0; color: #2c5f8a; font-size: 16px; font-style: italic; line-height: 1.5;">
                    "✨ Your mental health journey matters. We're here to support you every step of the way."
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px; background: #ffffff;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="background: #f9fbfd; padding: 30px; border-top: 1px solid #e8eef2;">
                  <h3 style="color: #2c5f8a; font-size: 18px; margin: 0 0 15px 0; text-align: center;">💚 Mental Health Resources</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding: 8px 0;">
                        <p style="margin: 0; color: #4a6a7f; font-size: 14px; text-align: center;">
                          📞 24/7 Crisis Helpline: <strong style="color: #2c5f8a;">(+65) 6383 5745</strong>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
<td style="background: #1a3a5c; padding: 30px; text-align: center;">
  <p
    style="
      color: rgba(255,255,255,0.8);
      margin: 0 0 10px 0;
      font-size: 13px;
    "
  >
    🕊️ You are not alone. We're here to listen, support, and guide you.
  </p>

  <p
    style="
      color: rgba(255,255,255,0.6);
      margin: 0 0 5px 0;
      font-size: 12px;
    "
  >
    <a
      href="https://www.google.com/maps/search/?api=1&query=179+Bartley+Road+Singapore+539784"
      target="_blank"
      style="
        color: rgba(255,255,255,0.6);
        text-decoration: none;
      "
    >
      179 Bartley Road, Singapore 539784
    </a>
  </p>

  <p
    style="
      color: rgba(255,255,255,0.6);
      margin: 0 0 5px 0;
      font-size: 12px;
    "
  >
    📧
    <a
      href="mailto:admin@wingscounselling.org.sg"
      style="
        color: rgba(255,255,255,0.6);
        text-decoration: none;
      "
    >
      admin@wingscounselling.org.sg
    </a>

    &nbsp;|&nbsp; 🌐

    <a
      href="https://wingscounselling.org.sg/"
      target="_blank"
      style="
        color: rgba(255,255,255,0.6);
        text-decoration: none;
      "
    >
      wingscounselling.org.sg
    </a>
  </p>

  <p
    style="
      color: rgba(255,255,255,0.4);
      margin: 20px 0 0 0;
      font-size: 11px;
    "
  >
    This email is confidential. If you're in crisis, please reach out to our helpline immediately.
  </p>
</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseSubCounsellingTypes(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSubCounsellingTypesEmailTable(subTypes) {
  if (subTypes.length === 0) {
    return `
      <p style="margin: 12px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
        Our team will help you identify the most suitable support option during your first contact.
      </p>
    `;
  }

  const rows = subTypes
    .map(
      (name, index) => `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; color: #0D4A7A; font-weight: 700; font-size: 14px; text-align: center; width: 48px; background: #f8fafc;">
            ${index + 1}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 15px; font-weight: 500;">
            ${escapeHtml(name)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 14px; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden;">
      <thead>
        <tr style="background: linear-gradient(135deg, #0D4A7A 0%, #1a3a5c 100%);">
          <th style="padding: 12px; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; width: 48px;">#</th>
          <th style="padding: 12px 16px; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left; letter-spacing: 0.3px;">
            Sub Counselling Type Selected
          </th>
        </tr>
      </thead>
      <tbody style="background: #ffffff;">
        ${rows}
      </tbody>
    </table>
  `;
}



  function buildAppointmentConfirmationEmailHtml(appointment) {
  const clientName = escapeHtml(appointment.name || "Valued Client");

  const firstName = escapeHtml(
    (appointment.name || "").trim().split(/\s+/)[0] || "there"
  );

  const counsellingType = escapeHtml(
    appointment.counselling_type || "—"
  );

  const subTypes = parseSubCounsellingTypes(
    appointment.sub_counselling_types || appointment.remarks
  );

  const subTypesTable =
    buildSubCounsellingTypesEmailTable(subTypes);

  const description = escapeHtml(
    appointment.description ||
      "To be discussed during your session"
  );

  const detailRows = [
    ["NRIC / FIN", appointment.nric_fin_number],
    ["Full Name", appointment.name],
    ["Email", appointment.email],
    ["Phone", appointment.phone],
    ["Age", appointment.age],
    ["Gender", appointment.gender],
    ["Nationality", appointment.nationality],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="
            padding: 10px 12px 10px 0;
            color: #64748b;
            font-size: 13px;
            font-weight: 600;
            width: 38%;
            vertical-align: top;
          ">
            ${label}
          </td>

          <td style="
            padding: 10px 0;
            color: #334155;
            font-size: 14px;
            vertical-align: top;
          ">
            ${escapeHtml(value ?? "—")}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!-- Appointment Introduction -->
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="margin-bottom: 28px;"
    >
      <tr>
        <td
          style="
            background: linear-gradient(
              135deg,
              #e8f4fc 0%,
              #f0f7fa 100%
            );
            border-radius: 16px;
            padding: 28px 24px;
            border: 1px solid #d4e4ed;
          "
        >
          <p
            style="
              margin: 0 0 8px 0;
              color: #64748b;
              font-size: 13px;
              font-weight: 600;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            "
          >
          <strong>  Appointment Confirmation </strong>
          </p>

          <h2
            style="
              margin: 0 0 12px 0;
              color: #0D4A7A;
              font-size: 26px;
              font-weight: 600;
              line-height: 1.3;
            "
          >
            Hello, ${firstName}
          </h2>

          <p
            style="
              margin: 0;
              color: #475569;
              font-size: 16px;
              line-height: 1.7;
            "
          >
            Thank you,
            <strong style="color: #0D4A7A;">
              ${clientName}
            </strong>,
            for reaching out to
            <strong>WINGS Counselling Centre</strong>.
            We have received your appointment request and our team
            will contact you soon.
          </p>
        </td>
      </tr>
    </table>


    <!-- 1. YOUR CONTACT DETAILS -->
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="margin-bottom: 24px;"
    >
      <tr>
        <td
          style="
            background: linear-gradient(
              135deg,
              #f8fafc 0%,
              #f1f5f9 100%
            );
            border-radius: 14px;
            padding: 22px 24px;
            border: 1px solid #e2e8f0;
          "
        >
          <h3
            style="
              margin: 0 0 14px 0;
              color: #0D4A7A;
              font-size: 16px;
              font-weight: 700;
            "
          >
            Your Contact Details
          </h3>

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            ${detailRows}
          </table>
        </td>
      </tr>
    </table>


    <!-- 2. YOUR SELECTED SUPPORT -->
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="margin-bottom: 24px;"
    >
      <tr>
        <td
          style="
            background: #ffffff;
            border-radius: 16px;
            padding: 24px;
            border: 2px solid #0D4A7A;
            box-shadow:
              0 4px 14px rgba(13, 74, 122, 0.08);
          "
        >
          <p
            style="
              margin: 0 0 12px 0;
              color: #0D4A7A;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.6px;
              text-transform: uppercase;
            "
          >
            Your Selected Support
          </p>

          <p
            style="
              margin: 0 0 4px 0;
              color: #64748b;
              font-size: 13px;
            "
          >
            Main Counselling Type
          </p>

          <p
            style="
              margin: 0 0 18px 0;
              color: #0D4A7A;
              font-size: 20px;
              font-weight: 700;
              line-height: 1.4;
            "
          >
            ${counsellingType}
          </p>

          ${subTypesTable}
        </td>
      </tr>
    </table>


    <!-- 3. BRIEF DESCRIPTION -->
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="margin-bottom: 24px;"
    >
      <tr>
        <td
          style="
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px 22px;
            border: 1px solid #FFD700;
            border-top: 4px solid #FFD700;
          "
        >
          <p
            style="
              margin: 0 0 8px 0;
              color: #0D4A7A;
              font-size: 14px;
              font-weight: 700;
            "
          >
            Brief Description of Your Concern
          </p>

          <p
            style="
              margin: 0;
              color: #475569;
              font-size: 15px;
              line-height: 1.7;
            "
          >
            ${description}
          </p>
        </td>
      </tr>
    </table>


    <!-- WHAT HAPPENS NEXT -->
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="margin-bottom: 28px;"
    >
      <tr>
        <td
          style="
            background: #f0f7fa;
            border-radius: 14px;
            padding: 22px 24px;
          "
        >
          <h3
            style="
              margin: 0 0 14px 0;
              color: #0D4A7A;
              font-size: 16px;
              font-weight: 700;
            "
          >
            What Happens Next?
          </h3>

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
          >
            <tr>
              <td
                style="
                  padding: 8px 0;
                  color: #475569;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                <span
                  style="
                    color: #0D4A7A;
                    font-weight: 700;
                  "
                >
                  1.
                </span>

                A counsellor from our team will reach out within
                <strong>3 working days</strong>.
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 8px 0;
                  color: #475569;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                <span
                  style="
                    color: #0D4A7A;
                    font-weight: 700;
                  "
                >
                  2.
                </span>

                We will confirm your preferred date, time,
                and session format with you.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>


    <!-- CLOSING -->
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
    >
      <tr>
        <td
          style="
            padding-top: 8px;
            border-top: 2px solid #e2e8f0;
          "
        >
          <p
            style="
              margin: 0 0 10px 0;
              color: #475569;
              font-size: 15px;
              line-height: 1.7;
            "
          >
            Taking this step shows strength and self-care.
            We are honoured to support you on your journey.
          </p>

          <p
            style="
              margin: 0;
              color: #64748b;
              font-size: 14px;
              line-height: 1.6;
            "
          >
            With warmth,<br>

            <strong
              style="
                color: #0D4A7A;
                font-size: 16px;
              "
            >
              The WINGS Counselling Team
            </strong>
          </p>
        </td>
      </tr>
    </table>
  `;
}export async function sendAppointmentConfirmationEmail(appointment) {
  const userEmail = (appointment.email || "").trim().toLowerCase();
  const { primary: adminPrimary, cc: adminCc, allPrimary } =
    await getFormSubmissionNotificationRecipients(userEmail);

  let userEmailSent = false;
  let orgEmailSent = false;

  // 1. User confirmation — sent only to the applicant
  if (isValidEmail(userEmail)) {
    const userContent = buildAppointmentConfirmationEmailHtml(appointment);
    const userSubject = `Appointment Confirmation — WINGS Counselling Centre`;

    try {
      await sendWithFallback({
        from: getFromAddress(),
        to: userEmail,
        subject: userSubject,
        html: getMentalHealthEmailWrapper(userContent, "Appointment Confirmation"),
      });
      userEmailSent = true;
      console.log("[Email] Appointment confirmation sent via Graph to user:", userEmail);
    } catch (err) {
      console.error("[Email] Failed to send appointment confirmation to user:", userEmail, err?.message || err);
    }
  } else {
    console.warn("[Email] Invalid or missing user email for appointment confirmation:", appointment.email);
  }

  // 2. Admin notification — separate email with full applicant details (To + CC)
  const adminTo = allPrimary.length ? allPrimary : adminPrimary ? [adminPrimary] : [];
  if (adminTo.length) {
    try {
      const orgSubject = `New appointment submission on WINGS`;
      const orgContent = buildAppointmentAdminNotificationHtml(appointment);
      const ccList = adminCc.length ? adminCc : undefined;

      await sendWithFallback({
        from: getFromAddress(),
        to: adminTo.length === 1 ? adminTo[0] : adminTo,
        cc: ccList,
        replyTo: userEmail || undefined,
        subject: orgSubject,
        html: getAdminNotificationEmailWrapper(orgContent, "New Appointment Submission"),
      });
      orgEmailSent = true;
      console.log(
        "[Email] Appointment admin notification sent via Graph to:",
        adminTo.join(", "),
        ccList?.length ? `(CC: ${ccList.join(", ")})` : ""
      );

      try {
        await recordFormSubmissionEmail({
          formType: "Appointment",
          sourceId: appointment.id ?? null,
          primaryMail: adminTo.join(", "),
          ccMail: (ccList || []).join(", "),
          subject: orgSubject,
          content: formatAppointmentEmailContent(appointment),
          remarks: appointment.remarks || "",
          senderEmail: userEmail || "",
        });
      } catch (recordErr) {
        console.warn("[Email] Failed to record form submission email:", recordErr?.message || recordErr);
      }
    } catch (err) {
      console.error(
        "[Email] Failed to send appointment notification to admin:",
        adminTo.join(", "),
        err?.message || err
      );
    }
  } else {
    console.warn("[Email] No admin recipients configured for appointment notifications");
  }

  return userEmailSent || orgEmailSent;
}

export async function sendVolunteerAcknowledgementEmail(volunteer) {
  if (!isGraphMailConfigured()) return false;
  if (!volunteer.email) return false;

  const firstName = (volunteer.name || "").trim().split(/\s+/)[0] || "there";
  const subject = `Application Received - Volunteer | WINGS Counselling`;

  const content = `
    <h2 style="color: #1a3a5c; font-size: 24px; margin: 0 0 10px 0;">
      Thank You for Your Interest!
    </h2>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Dear <strong style="color: #2c5f8a;">${escapeHtml(firstName)}</strong>,
    </p>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
      We have successfully received your volunteer application at WINGS Counselling Centre.
    </p>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
      Our team will review your application and get back to you soon. We truly appreciate your willingness to contribute your time and skills.
    </p>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
      With gratitude,<br>
      <strong style="color: #2c5f8a;">WINGS Counselling Centre</strong>
    </p>
  `;

  try {
    await sendWithFallback({
      from: getFromAddress(),
      to: volunteer.email,
      subject,
      html: getMentalHealthEmailWrapper(content, "Application Received"),
    });
    console.log("[Email] Volunteer acknowledgement sent to:", volunteer.email);
    return true;
  } catch (err) {
    console.error("[Email] Volunteer acknowledgement send failed:", err?.message || err);
    return false;
  }
}

export async function sendVolunteerStatusUpdateEmail(volunteer) {
  if (!isGraphMailConfigured()) return false;
  if (!volunteer.email) return false;

  const firstName = (volunteer.name || "").trim().split(/\s+/)[0] || "there";
  const subject = `Application Update: ${volunteer.status} - Volunteer | WINGS Counselling`;

  const content = `
    <h2 style="color: #1a3a5c; font-size: 24px; margin: 0 0 10px 0;">
      Volunteer Application Update
    </h2>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Dear <strong style="color: #2c5f8a;">${escapeHtml(firstName)}</strong>,
    </p>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
      Your volunteer application status has been updated to: <strong style="color: #0D4A7A; text-transform: capitalize;">${escapeHtml(volunteer.status)}</strong>.
    </p>
    ${volunteer.admin_notes ? `
    <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
      <p style="color: #92400e; font-weight: 700; margin: 0 0 8px 0; font-size: 14px;">Note from Admin:</p>
      <p style="color: #78350f; margin: 0; line-height: 1.6; font-size: 14px;">${escapeHtml(volunteer.admin_notes)}</p>
    </div>` : ''}
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
      Thank you for your continued interest in supporting WINGS Counselling Centre.
    </p>
  `;

  try {
    await sendWithFallback({
      from: getFromAddress(),
      to: volunteer.email,
      subject,
      html: getMentalHealthEmailWrapper(content, "Application Status Update"),
    });
    console.log("[Email] Volunteer status update sent to:", volunteer.email);
    return true;
  } catch (err) {
    console.error("[Email] Volunteer status update send failed:", err?.message || err);
    return false;
  }
}

export async function sendVolunteerApplicationEmail(volunteer) {
  if (!isGraphMailConfigured()) {
    console.error("[Email] Microsoft Graph mail is not configured");
    return false;
  }

  const userEmail = (volunteer.email || "").trim().toLowerCase();
  const { primary: adminPrimary, cc: adminCc, allPrimary } =
    await getFormSubmissionNotificationRecipients(userEmail);

  let userEmailSent = false;
  let orgEmailSent = false;

  // 1. User acknowledgement — sent only to the volunteer applicant
  userEmailSent = await sendVolunteerAcknowledgementEmail(volunteer);

  // 2. Admin notification — separate email with full applicant details (To + CC)
  const adminTo = allPrimary.length ? allPrimary : adminPrimary ? [adminPrimary] : [];
  if (!adminTo.length) {
    console.error("[Email] No admin recipients configured for volunteer notifications");
    return userEmailSent;
  }

  const orgSubject = `New volunteer submission on WINGS`;
  const orgContent = buildVolunteerAdminNotificationHtml(volunteer);
  const ccList = adminCc.length ? adminCc : undefined;

  try {
    await sendWithFallback({
      from: getFromAddress(),
      to: adminTo.length === 1 ? adminTo[0] : adminTo,
      cc: ccList,
      replyTo: userEmail || undefined,
      subject: orgSubject,
      html: getAdminNotificationEmailWrapper(orgContent, "New Volunteer Submission"),
    });

    orgEmailSent = true;
    console.log(
      "[Email] Volunteer admin notification sent via Graph to:",
      adminTo.join(", "),
      ccList?.length ? `(CC: ${ccList.join(", ")})` : ""
    );

    try {
      await recordFormSubmissionEmail({
        formType: "Volunteer",
        sourceId: volunteer.id ?? null,
        primaryMail: adminTo.join(", "),
        ccMail: (ccList || []).join(", "),
        subject: orgSubject,
        content: formatVolunteerEmailContent(volunteer),
        remarks: volunteer.other_contribution || "",
        senderEmail: userEmail || "",
      });
    } catch (recordErr) {
      console.warn("[Email] Failed to record volunteer email:", recordErr?.message || recordErr);
    }
  } catch (err) {
    console.error(
      "[Email] Volunteer admin notification send failed:",
      adminTo.join(", "),
      err?.message || err
    );
  }

  return userEmailSent || orgEmailSent;
}

/**
 * Application acknowledgement email
 */
export async function sendApplicationAcknowledgement(to, data) {
  if (!isGraphMailConfigured()) {
    console.log("[Email] Microsoft Graph mail is not configured – skipping send");
    return;
  }

  const userEmail = to.trim().toLowerCase();
  const primaryRecipients = await getConfiguredEmailRecipients("primary");
  const ccRecipients = await getConfiguredEmailRecipients("cc");
  const bccRecipients = uniqueEmails([...primaryRecipients, ...ccRecipients]).filter(
    (email) => email !== userEmail
  );

  const isShortlisted = data.status === "shortlisted";
  const isNewSubmission = data.status === "submitted";

  const subject = isShortlisted
    ? `✨ Congratulations! You've Been Shortlisted – ${data.jobTitle}`
    : isNewSubmission
    ? `✅ Application Received – ${data.jobTitle} | Ref: ${data.applicationNumber}`
    : `📧 Application Update – ${data.jobTitle} | Ref: ${data.applicationNumber}`;

  let content = `
    <h2 style="color: #1a3a5c; font-size: 24px; margin: 0 0 10px 0;">
      ${isShortlisted ? "🎉 Congratulations!" : isNewSubmission ? "✅ Application Received!" : "Thank You for Your Application"}
    </h2>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Dear <strong style="color: #2c5f8a;">${data.firstName}</strong>,
    </p>
  `;

  if (isShortlisted) {
    content += `
      <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6d9 100%); border-radius: 16px; padding: 25px; margin: 20px 0;">
        <p style="color: #2e7d32; font-size: 18px; margin: 0 0 15px 0;">🌟 Exciting News!</p>
        <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
          You have been <strong>shortlisted</strong> for the position of <strong>${data.jobTitle}</strong>.
          Your passion for mental health support truly shines through!
        </p>
      </div>
      <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
        Our HR team will contact you within 3-5 business days to schedule an interview.
      </p>
    `;
  } else if (isNewSubmission) {
    content += `
      <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
        We have successfully received your application for the <strong>${data.jobTitle}</strong> position at WINGS Counselling Centre.
      </p>
      <div style="background: linear-gradient(135deg, #e8f4fc 0%, #f0f7fa 100%); border-radius: 16px; padding: 25px; margin: 20px 0; border: 1px solid #d4e4ed;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 15px;">
          <tr>
            <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600; width: 40%;">Position Applied:</td>
            <td style="padding: 8px 0; color: #1a3a5c; font-weight: 700;">${data.jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Application Ref:</td>
            <td style="padding: 8px 0; color: #4a6a7f;">${data.applicationNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Status:</td>
            <td style="padding: 8px 0;">
              <span style="background: #e8f5e9; color: #2e7d32; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 600;">Submitted</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="background: #f0f7fa; border-radius: 14px; padding: 22px 24px; margin: 20px 0;">
        <h3 style="color: #1a3a5c; font-size: 16px; margin: 0 0 12px 0;">What Happens Next?</h3>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 7px 0; color: #475569; font-size: 14px; line-height: 1.6;">
              <span style="color: #0D4A7A; font-weight: 700;">1.</span>
              Our team will review your application carefully.
            </td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #475569; font-size: 14px; line-height: 1.6;">
              <span style="color: #0D4A7A; font-weight: 700;">2.</span>
              Shortlisted candidates will be contacted within <strong>5–7 business days</strong>.
            </td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #475569; font-size: 14px; line-height: 1.6;">
              <span style="color: #0D4A7A; font-weight: 700;">3.</span>
              You will receive an email notification with the next steps.
            </td>
          </tr>
        </table>
      </div>
      <p style="color: #4a6a7f; font-size: 15px; line-height: 1.7;">
        Thank you for your interest in joining the WINGS team. We appreciate your commitment to mental health and wellness.
      </p>
    `;
  } else {
    content += `
      <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
        Thank you for applying for the <strong>${data.jobTitle}</strong> position at WINGS Counselling Centre.
      </p>
      <div style="background: #f0f7fa; border-radius: 16px; padding: 25px; margin: 20px 0;">
        <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
          While you were not selected this time, we encourage you to apply for future opportunities.
          Your interest in supporting mental health means the world to us.
        </p>
      </div>
      <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
        <strong>Application Reference:</strong> ${data.applicationNumber}
      </p>
    `;
  }

  content += `
    <div style="margin: 30px 0 0 0; padding: 20px 0 0 0; border-top: 2px solid #e8eef2;">
      <p style="color: #4a6a7f; font-size: 14px; margin: 0;">
        With gratitude,<br>
        <strong style="color: #2c5f8a;">WINGS Counselling Centre</strong>
      </p>
    </div>
  `;

  const mailOptions = {
    from: getFromAddress(),
    to: userEmail,
    subject,
    html: getMentalHealthEmailWrapper(content, "Application Update"),
  };

  if (bccRecipients.length > 0) {
    mailOptions.bcc = bccRecipients.join(", ");
  }

  await sendWithFallback(mailOptions);

  await recordFormSubmissionEmail({
    formType: "Volunteer / Career Application",
    sourceId: data.applicationId ?? null,
    primaryMail: primaryRecipients.join(", ") || userEmail,
    ccMail: ccRecipients.join(", "),
    subject,
    content: formatApplicationEmailContent({
      formLabel: "Volunteer / Career Application",
      firstName: data.firstName,
      lastName: data.lastName ?? "",
      jobTitle: data.jobTitle,
      applicationNumber: data.applicationNumber,
      email: userEmail,
      status: data.status,
    }),
    remarks: data.adminNotes || "",
    senderEmail: userEmail,
  });
}

/**
 * Interview invite email
 */
export async function sendInterviewInvite(to, data) {
  if (!isGraphMailConfigured()) {
    console.log("[Email] Microsoft Graph mail is not configured – skipping send");
    return;
  }

  const content = `
    <h2 style="color: #1a3a5c; font-size: 24px; margin: 0 0 10px 0;">📅 Interview Invitation</h2>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Dear <strong style="color: #2c5f8a;">${data.firstName}</strong>,
    </p>
    
    <div style="background: linear-gradient(135deg, #fff5e6 0%, #ffe8d4 100%); border-radius: 16px; padding: 25px; margin: 20px 0; border-left: 4px solid #FFD700;">
      <p style="color: #1a3a5c; font-size: 18px; margin: 0 0 15px 0;">🎯 Your Interview Details</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600; width: 35%;">Position:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">${data.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Date:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">📅 ${data.date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Time:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">⏰ ${data.timeSlot}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Duration:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">⌛ ${data.duration} minutes</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Interviewer:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">💼 ${data.interviewerName}</td>
        </tr>
      </table>
    </div>
    
    ${data.meetingLink ? `
    <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="color: #2e7d32; margin: 0 0 10px 0;">💻 Virtual Interview Link</p>
      <a href="${data.meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #2c5f8a 0%, #1a3a5c 100%); color: #ffffff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; margin-top: 10px;">
        Join Interview Meeting
      </a>
    </div>
    ` : ''}
    
    <div style="background: #f0f7fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1a3a5c; font-size: 16px; margin: 0 0 10px 0;">📝 Interview Tips</h3>
      <ul style="color: #4a6a7f; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Be ready 5-10 minutes before the scheduled time</li>
        <li>Prepare your questions about the role and our centre</li>
        <li>Share your experience and passion for mental health</li>
        <li>Ensure a quiet space and stable internet connection</li>
      </ul>
    </div>
    
    <p style="color: #4a6a7f; font-size: 14px; margin: 20px 0 0 0;">
      <strong>Reference:</strong> ${data.applicationNumber}
    </p>
    
    <div style="margin: 30px 0 0 0; padding: 20px 0 0 0; border-top: 2px solid #e8eef2;">
      <p style="color: #4a6a7f; font-size: 14px; margin: 0;">
        We look forward to meeting you!<br>
        <strong style="color: #2c5f8a;">The WINGS Recruitment Team</strong>
      </p>
    </div>
  `;

  await sendWithFallback({
    from: getFromAddress(),
    to,
    subject: `📅 Interview Invitation | ${data.jobTitle} | WINGS Counselling Centre`,
    html: getMentalHealthEmailWrapper(content, "Interview Invitation"),
  });
}

function resolveInterviewBookingUrl(data) {
  const applicationId = Number(data?.applicationId ?? data?.application_id);
  if (Number.isFinite(applicationId) && applicationId > 0) {
    return buildInterviewBookingLink(applicationId);
  }

  const portalLink = typeof data?.portalLink === "string" ? data.portalLink.trim() : "";
  if (portalLink) {
    if (portalLink.includes("/candidate-portal")) {
      console.warn(`[Email] Rejected legacy candidate-portal URL: ${portalLink}`);
    } else if (portalLink.includes("/candidate/interview-booking/")) {
      return portalLink;
    }
  }

  console.error("[Email] Missing applicationId — cannot build interview booking URL");
  return `${getCandidatePortalOrigin()}/candidate`;
}

/**
 * Send interview slot booking invitation with a link to the booking page.
 * Available slots are shown on the booking page, not in the email.
 */
export async function sendInterviewSlotInvitation(candidateEmail, data) {
  if (!isGraphMailConfigured()) {
    const err = new Error("Microsoft Graph mail is not configured (MAIL_FROM / MS_* missing)");
    console.error(`[Email] ${err.message}`);
    throw err;
  }

  const { firstName, jobTitle, jobIdCode, round, applicationId } = data;

  const bookingUrl = resolveInterviewBookingUrl(data);
  console.log(
    `[Email] Interview slot invitation booking URL: ${bookingUrl} (applicationId=${applicationId ?? "missing"})`
  );

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: linear-gradient(135deg, #e8f4fc 0%, #f0f7fa 100%); border-radius: 16px; padding: 28px 24px; border: 1px solid #d4e4ed;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
            Interview Invitation
          </p>
          <h2 style="margin: 0 0 12px 0; color: #0D4A7A; font-size: 26px; font-weight: 600; line-height: 1.3;">
            Congratulations, ${escapeHtml(firstName)}! 🎉
          </h2>
          <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.7;">
            You have been selected for <strong style="color: #0D4A7A;">${round || 'the interview round'}</strong> for the position of <strong>${escapeHtml(jobTitle)}</strong> (${escapeHtml(jobIdCode)}) at WINGS Counselling Centre.
          </p>
        </td>
      </tr>
    </table>

    <!-- Important Notice -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px 22px;">
          <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 700; font-size: 15px;">⚠️ Action Required</p>
          <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
            Please click the button below to open the interview booking page and select a convenient date and time from the available slots.
          </p>
        </td>
      </tr>
    </table>

    <!-- Booking Instructions -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: #f0f7fa; border-radius: 14px; padding: 22px 24px;">
          <h3 style="margin: 0 0 14px 0; color: #0D4A7A; font-size: 16px; font-weight: 700;">
            How to Book Your Interview Slot
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">1.</span>
                Click the button below to open the interview booking page
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">2.</span>
                Sign in with your candidate account if prompted
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">3.</span>
                Select your preferred date and time from the available options
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">4.</span>
                Confirm your booking to receive interview details
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="text-align: center;">
          <a href="${bookingUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #0D4A7A 0%, #1a3a5c 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 700; letter-spacing: 0.3px;">
            Book Your Interview Slot →
          </a>
          <p style="margin: 16px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.6; word-break: break-all;">
            If the button does not work, copy and paste this link into your browser:<br>
            <a href="${bookingUrl}" style="color: #0D4A7A; text-decoration: underline;">${escapeHtml(bookingUrl)}</a>
          </p>
        </td>
      </tr>
    </table>

    <!-- Interview Tips -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: #e8f5e9; border-radius: 12px; padding: 20px 22px;">
          <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 15px; font-weight: 700;">
            💡 Interview Preparation Tips
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: #15803d; font-size: 13px; line-height: 1.8;">
            <li>Be ready 5-10 minutes before your scheduled time</li>
            <li>Prepare questions about the role and WINGS Counselling Centre</li>
            <li>Share your experience and passion for mental health support</li>
            <li>Ensure a quiet space and stable internet connection (for virtual interviews)</li>
          </ul>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-top: 8px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px; line-height: 1.7;">
            We look forward to meeting you and learning more about your passion for mental health support!
          </p>
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Best regards,<br>
            <strong style="color: #0D4A7A; font-size: 16px;">The WINGS Recruitment Team</strong>
          </p>
        </td>
      </tr>
    </table>
  `;

  const subject = `Interview Invitation: ${round || 'Interview Round'} — ${jobTitle}${applicationId ? ` [App #${applicationId}]` : ''}`;

  const plainText = [
    `Congratulations, ${firstName}!`,
    `You have been selected for ${round || 'the interview round'} for ${jobTitle} (${jobIdCode}) at WINGS Counselling Centre.`,
    '',
    'Book your interview slot using this link:',
    bookingUrl,
    '',
    'If the link does not open, copy and paste it into your browser.',
  ].join('\n');

  const mailOptions = {
    from: getFromAddress(),
    to: candidateEmail,
    subject,
    text: plainText,
    html: getMentalHealthEmailWrapper(content, "Interview Invitation"),
  };

  try {
    await sendWithFallback(mailOptions);
    console.log(`[Email] Interview slot invitation sent to: ${candidateEmail}`);
    return true;
  } catch (err) {
    console.error(
      `[Email] Failed to send interview slot invitation to ${candidateEmail}:`,
      err?.message || err
    );
    throw err;
  }
}

/**
 * Send interview booking confirmation after candidate books a slot
 */
export async function sendInterviewBookingConfirmation(candidateEmail, data) {
  if (!isGraphMailConfigured()) {
    console.log("[Email] Microsoft Graph mail is not configured – skipping send");
    return false;
  }

  const { firstName, jobTitle, jobIdCode, round, date, timeSlot, duration, interviewerName, location, meetingLink, notes } = data;

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: linear-gradient(135deg, #e8f5e9 0%, #d1f4e0 100%); border-radius: 16px; padding: 28px 24px; border: 2px solid #10b981;">
          <p style="margin: 0 0 8px 0; color: #166534; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
            ✅ Interview Confirmed
          </p>
          <h2 style="margin: 0 0 12px 0; color: #0D4A7A; font-size: 26px; font-weight: 600; line-height: 1.3;">
            Your Interview is Scheduled!
          </h2>
          <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.7;">
            Hello <strong style="color: #0D4A7A;">${escapeHtml(firstName)}</strong>, your interview slot for <strong>${escapeHtml(jobTitle)}</strong> (${escapeHtml(jobIdCode)}) has been successfully booked.
          </p>
        </td>
      </tr>
    </table>

    <!-- Interview Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #ffffff; border-radius: 14px; padding: 24px; border: 2px solid #0D4A7A;">
          <h3 style="margin: 0 0 16px 0; color: #0D4A7A; font-size: 18px; font-weight: 700;">
            📋 Your Interview Details
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600; width: 35%;">Round:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px; font-weight: 600;">${escapeHtml(round || 'Interview Round')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Date:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">📅 ${escapeHtml(date)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Time:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">⏰ ${escapeHtml(timeSlot)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Duration:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">⌛ ${duration || 60} minutes</td>
            </tr>
            ${interviewerName ? `
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Interviewer:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">💼 ${escapeHtml(interviewerName)}</td>
            </tr>
            ` : ''}
            ${location ? `
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Location:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">📍 ${escapeHtml(location)}</td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>

    ${meetingLink ? `
    <!-- Meeting Link -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #e0f2fe; border-radius: 12px; padding: 20px 22px; text-align: center;">
          <p style="margin: 0 0 12px 0; color: #075985; font-size: 15px; font-weight: 700;">💻 Virtual Interview Link</p>
          <a href="${escapeHtml(meetingLink)}" 
             style="display: inline-block; background: linear-gradient(135deg, #0D4A7A 0%, #1a3a5c 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
            Join Interview Meeting →
          </a>
        </td>
      </tr>
    </table>
    ` : ''}

    ${notes ? `
    <!-- Additional Notes -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #f0f7fa; border-radius: 12px; padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; color: #0D4A7A; font-weight: 700; font-size: 14px;">📌 Additional Notes:</p>
          <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">${escapeHtml(notes)}</p>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Preparation Tips -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: #fef3c7; border-radius: 12px; padding: 20px 22px;">
          <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 15px; font-weight: 700;">
            ⚠️ Important Reminders
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.8;">
            <li>Join 5-10 minutes before the scheduled time</li>
            <li>Test your internet connection and audio/video (for virtual interviews)</li>
            <li>Keep your resume and relevant documents handy</li>
            <li>Prepare questions about the role and organization</li>
            <li>Dress professionally and choose a quiet, well-lit space</li>
          </ul>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-top: 8px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px; line-height: 1.7;">
            We're excited to meet you and discuss how you can contribute to our mission of supporting mental health and wellness!
          </p>
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Best of luck,<br>
            <strong style="color: #0D4A7A; font-size: 16px;">The WINGS Recruitment Team</strong>
          </p>
        </td>
      </tr>
    </table>
  `;

  const subject = `Interview Confirmed: ${date} at ${timeSlot} — ${jobTitle}`;

  const mailOptions = {
    from: getFromAddress(),
    to: candidateEmail,
    subject,
    html: getMentalHealthEmailWrapper(content, "Interview Confirmation"),
  };

  try {
    await sendWithFallback(mailOptions);
    console.log(`[Email] Interview booking confirmation sent to: ${candidateEmail}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send interview booking confirmation:", err);
    return false;
  }
}

/**
 * Send a notification email to subscribers when a new article or event is published.
 * type: "event" | "article"
 */
function getPublicSiteUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.SITE_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
}

function buildArticlePublicUrl(article) {
  const siteUrl = getPublicSiteUrl();
  const slug = String(article?.slug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!slug) return `${siteUrl}/articles`;
  // Must match apps/admin App.jsx: /article/:slug
  return `${siteUrl}/article/${encodeURIComponent(slug)}`;
}

function buildUnsubscribeLink(token) {
  return `${getPublicSiteUrl()}/api/notify/unsubscribe/${encodeURIComponent(token)}`;
}

const NOTIFY_BRAND = {
  navy: "#1B4585",
  navyDark: "#0D4A7A",
  text: "#1F2937",
  muted: "#64748B",
  lightBlue: "#DBEAFE",
  footerNavy: "#1B4585",
  contactEmail: "info@wingscounselling.org.sg",
  contactPhone: "+65 6777 3933",
  contactWebsite: "wingscounselling.org.sg",
};

const __emailDir = path.dirname(fileURLToPath(import.meta.url));
const NOTIFY_LOGO_CID = "wings-logo@wings";
const NOTIFY_LOGO_FILE = path.resolve(
  __emailDir,
  "../../../admin/public/assets/wingsLogo.png"
);

function getNotifyLogoSrc() {
  // Inline CID — email clients block localhost image URLs
  return `cid:${NOTIFY_LOGO_CID}`;
}

/** Microsoft Graph inline image attachment for the WINGS logo. */
function getNotifyLogoGraphAttachment() {
  if (!fs.existsSync(NOTIFY_LOGO_FILE)) {
    console.warn(`[Email] Logo not found at ${NOTIFY_LOGO_FILE}`);
    return null;
  }
  const contentBytes = fs.readFileSync(NOTIFY_LOGO_FILE).toString("base64");
  return {
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: "wingsLogo.png",
    contentType: "image/png",
    contentBytes,
    contentId: NOTIFY_LOGO_CID,
    isInline: true,
  };
}

function getNotifyLogoAttachments() {
  const logo = getNotifyLogoGraphAttachment();
  return logo ? [logo] : [];
}

function withNotifyLogoAttachments(mailOptions) {
  const attachments = getNotifyLogoAttachments();
  if (!attachments.length) return mailOptions;

  return {
    ...mailOptions,
    attachments: [...(mailOptions.attachments || []), ...attachments],
  };
}

function buildNotifyListCheckIcon() {
  return `
    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        <td width="28" height="28" align="center" valign="middle" style="width:28px;height:28px;border-radius:50%;background:${NOTIFY_BRAND.lightBlue};color:${NOTIFY_BRAND.navy};font-size:14px;font-weight:700;line-height:28px;">
          ✓
        </td>
      </tr>
    </table>
  `;
}

function buildNotifyEmailHeader() {
  const logoSrc = getNotifyLogoSrc();
  // Solid white table cells + class keep navy logo readable in Gmail dark mode
  return `
    <tr>
      <td class="wings-logo-wrap" bgcolor="#FFFFFF" align="center" style="background-color:#FFFFFF !important;padding:20px 24px 16px;border-bottom:1px solid #E8EDF2;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF !important;margin:0 auto;">
          <tr>
            <td class="wings-logo-wrap" bgcolor="#FFFFFF" align="center" style="background-color:#FFFFFF !important;padding:16px 20px;border-radius:12px;">
              <img src="${logoSrc}" alt="WINGS Logo" width="180" style="display:block;margin:0 auto;max-width:180px;width:180px;height:auto;border:0;outline:none;text-decoration:none;background:#FFFFFF;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildNotifyEmailContactFooter(unsubscribeUrl) {
  const siteUrl = getPublicSiteUrl();
  const year = new Date().getFullYear();

  return `
    <tr>
      <td style="background:#FFFFFF;padding:32px 32px 28px;">
        <h3 style="margin:0 0 20px;color:${NOTIFY_BRAND.text};font-size:22px;font-weight:700;line-height:1.3;font-family:'Segoe UI',Arial,sans-serif;">
          Have Questions? We're here to help.
        </h3>
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td style="padding:0 0 12px;color:${NOTIFY_BRAND.navy};font-size:15px;line-height:1.5;font-family:'Segoe UI',Arial,sans-serif;">
              <span style="display:inline-block;width:22px;">✉</span>
              <a href="mailto:${NOTIFY_BRAND.contactEmail}" style="color:${NOTIFY_BRAND.navy};text-decoration:none;">${NOTIFY_BRAND.contactEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 12px;color:${NOTIFY_BRAND.navy};font-size:15px;line-height:1.5;font-family:'Segoe UI',Arial,sans-serif;">
              <span style="display:inline-block;width:22px;">☎</span>
              <a href="tel:${NOTIFY_BRAND.contactPhone.replace(/\s/g, "")}" style="color:${NOTIFY_BRAND.navy};text-decoration:none;">${NOTIFY_BRAND.contactPhone}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0;color:${NOTIFY_BRAND.navy};font-size:15px;line-height:1.5;font-family:'Segoe UI',Arial,sans-serif;">
              <span style="display:inline-block;width:22px;">🌐</span>
              <a href="${siteUrl}" style="color:${NOTIFY_BRAND.navy};text-decoration:none;">${NOTIFY_BRAND.contactWebsite}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:${NOTIFY_BRAND.footerNavy};padding:28px 32px 32px;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#ffffff;">
          You're receiving this email because you subscribed to receive updates about WINGS events and programmes.
        </p>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#ffffff;">
          If you'd like to change how we stay in touch, you can
          <a href="${unsubscribeUrl}" style="color:#ffffff;text-decoration:underline;">unsubscribe</a>
          at any time.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-top:1px solid rgba(255,255,255,0.2);">
          <tr>
            <td style="padding-top:18px;font-size:13px;line-height:1.6;color:#ffffff;">
              © ${year} WINGS Counselling Centre. All rights reserved.
            </td>
            <td align="right" style="padding-top:18px;font-size:13px;line-height:1.6;color:#ffffff;">
              <a href="${siteUrl}/about-us" style="color:#ffffff;text-decoration:underline;">Privacy Policy</a>
              <span style="color:rgba(255,255,255,0.5);padding:0 8px;">|</span>
              <a href="${siteUrl}/about-us" style="color:#ffffff;text-decoration:underline;">Terms of Use</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildNotifyEmailDocument({ title, bodyRowsHtml, unsubscribeUrl }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(title)}</title>
  <style type="text/css">
    :root { color-scheme: light only; }
    [data-ogsc] .wings-logo-wrap,
    [data-ogsb] .wings-logo-wrap { background-color:#FFFFFF !important; }
  </style>
</head>
<body style="margin:0;padding:0;background:#EEF2F6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#EEF2F6;padding:24px 12px 32px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#FFFFFF" style="max-width:640px;width:100%;background:#ffffff;">
          ${buildNotifyEmailHeader()}
          ${bodyRowsHtml}
          ${buildNotifyEmailContactFooter(unsubscribeUrl)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildSubscribeConfirmationEmail(unsubscribeUrl) {
  const expectations = [
    {
      title: "Upcoming Workshops",
      description: "Learn new skills and connect with the community.",
    },
    {
      title: "Mental Wellness Talks",
      description: "Gain practical insights from experienced professionals.",
    },
    {
      title: "Support Groups",
      description: "Join safe, supportive spaces to share and grow.",
    },
    {
      title: "Parenting & Family Programmes",
      description: "Resources designed to strengthen family relationships.",
    },
    {
      title: "Community Updates",
      description: "Stay informed about new initiatives and special events.",
    },
  ];

  const listHtml = expectations
    .map(
      (item) => `
        <tr>
          <td width="36" valign="top" style="padding:0 0 22px;">
            ${buildNotifyListCheckIcon()}
          </td>
          <td valign="top" style="padding:0 0 22px;">
            <p style="margin:0 0 4px;color:#2D2D2D;font-size:16px;font-weight:700;line-height:1.4;font-family:'Segoe UI',Arial,sans-serif;">
              ${escapeHtml(item.title)}
            </p>
            <p style="margin:0;color:${NOTIFY_BRAND.muted};font-size:14px;line-height:1.6;font-family:'Segoe UI',Arial,sans-serif;">
              ${escapeHtml(item.description)}
            </p>
          </td>
        </tr>
      `
    )
    .join("");

  const bodyRowsHtml = `
    <tr>
      <td style="background:${NOTIFY_BRAND.navy};padding:40px 32px 36px;text-align:center;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="margin:0 auto 20px;">
          <tr>
            <td width="56" height="56" align="center" valign="middle" style="width:56px;height:56px;border-radius:50%;background:#ffffff;color:${NOTIFY_BRAND.navy};font-size:30px;font-weight:700;line-height:56px;">
              ✓
            </td>
          </tr>
        </table>
        <h1 style="margin:0 0 12px;color:#ffffff;font-size:34px;font-weight:700;line-height:1.2;font-family:'Segoe UI',Arial,sans-serif;">
          You're Subscribed!
        </h1>
        <p style="margin:0 0 16px;color:#ffffff;font-size:18px;line-height:1.5;font-family:'Segoe UI',Arial,sans-serif;">
          Thank you for joining the WINGS community.
        </p>
        <p style="margin:0;color:rgba(255,255,255,0.92);font-size:15px;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;">
          You'll be among the first to know about upcoming workshops, mental wellness talks, support groups, and community events designed to promote emotional well-being.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#F9F9F9;padding:36px 32px 28px;">
        <h2 style="margin:0 0 8px;color:#2D2D2D;font-size:24px;font-weight:500;line-height:1.3;font-family:'Outfit','Segoe UI',Arial,sans-serif;">
          Here's what you can expect
        </h2>
        <div style="width:72px;height:4px;background:${NOTIFY_BRAND.navy};margin:0 0 28px;border-radius:999px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          ${listHtml}
        </table>
      </td>
    </tr>
  `;

  return {
    subject: "You're Subscribed! - WINGS Counselling Centre",
    html: buildNotifyEmailDocument({
      title: "You're Subscribed!",
      bodyRowsHtml,
      unsubscribeUrl,
    }),
  };
}

export async function sendSubscribeConfirmationEmail({
  email,
  type,
  subscriber = null,
  subscribers = null,
}) {
  if (!isGraphMailConfigured() || !isValidEmail(email)) {
    console.log("[Email] Graph mail not configured or invalid email – skipping subscribe confirmation");
    return false;
  }

  await ensureNotifyTables();

  let unsubscribeUrl = null;
  if (type === "all" && subscribers) {
    unsubscribeUrl = buildUnsubscribeLink(
      subscribers.article?.unsubscribe_token ||
        subscribers.event?.unsubscribe_token ||
        ""
    );
  } else if (subscriber?.unsubscribe_token) {
    unsubscribeUrl = buildUnsubscribeLink(subscriber.unsubscribe_token);
  }

  if (!unsubscribeUrl || unsubscribeUrl.endsWith("/")) {
    console.warn("[Email] Missing unsubscribe token for subscribe confirmation");
    unsubscribeUrl = getPublicSiteUrl();
  }

  const mail = buildSubscribeConfirmationEmail(unsubscribeUrl);

  try {
    // 1) Confirmation to the person who subscribed (Graph / MAIL_FROM)
    await sendWithFallback({
      from: getFromAddress(),
      to: email,
      subject: mail.subject,
      html: mail.html,
    });
    console.log(`[Email] Subscribe confirmation sent to: ${email} (${type})`);

    // 2) Alert org inbox (MAIL_TO) — same From/To pattern as appointment/volunteer
    const orgTo = getOrgNotificationEmail();
    if (orgTo && orgTo !== email.toLowerCase()) {
      const typeLabel =
        type === "all"
          ? "Articles & Events"
          : type === "event"
            ? "Events"
            : "Articles";
      await sendWithFallback({
        from: getFromAddress(),
        to: orgTo,
        replyTo: email,
        subject: `New Notify Me signup — ${email} | WINGS`,
        html: getMentalHealthEmailWrapper(
          `
          <p><strong>Someone subscribed via Stay Connected / Notify Me</strong></p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>List:</strong> ${typeLabel}</p>
        `,
          "New Notify Me Signup"
        ),
      });
      console.log(`[Email] Notify Me org alert sent to: ${orgTo}`);
    }

    return true;
  } catch (err) {
    console.error("[Email] Failed to send subscribe confirmation:", err?.message);
    return false;
  }
}

function formatEventDateTime(eventDate) {
  if (!eventDate) return { date: "TBA", time: "TBA" };
  const d = new Date(eventDate);
  if (Number.isNaN(d.getTime())) return { date: "TBA", time: "TBA" };
  return {
    date: d.toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" }),
  };
}

function buildArticleNotificationEmail(article, unsubscribeUrl) {
  const title = article.title || "New Article";
  const excerpt = (article.excerpt || article.content || "").replace(/<[^>]+>/g, " ").trim().slice(0, 280);
  const articleUrl = buildArticlePublicUrl(article);

  const bodyRowsHtml = `
    <tr>
      <td bgcolor="#FFFFFF" style="background-color:#FFFFFF !important;padding:36px 32px 28px;font-family:'Segoe UI',Arial,sans-serif;">
        <p style="color:${NOTIFY_BRAND.text};font-size:16px;line-height:1.7;margin:0 0 20px;">Hello,</p>
        <p style="color:${NOTIFY_BRAND.text};font-size:16px;line-height:1.7;margin:0 0 24px;">
          We have just published a new article on WINGS Counselling Centre.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="#F4F8FC" style="background:#F4F8FC;border:1px solid #D4E4ED;border-radius:12px;margin:0 0 28px;">
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 8px;color:${NOTIFY_BRAND.muted};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Title</p>
              <h2 style="color:${NOTIFY_BRAND.navyDark};font-size:24px;margin:0 0 16px;line-height:1.3;font-weight:700;">
                <a href="${articleUrl}" target="_blank" style="color:${NOTIFY_BRAND.navyDark};text-decoration:none;">${escapeHtml(title)}</a>
              </h2>
              ${excerpt ? `<p style="margin:0 0 8px;color:${NOTIFY_BRAND.muted};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Short Description</p>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0;">${escapeHtml(excerpt)}${excerpt.length >= 280 ? "…" : ""}</p>` : ""}
            </td>
          </tr>
        </table>
        <p style="color:${NOTIFY_BRAND.text};font-size:16px;line-height:1.7;margin:24px 0 12px;">We hope this article supports your wellbeing.</p>
        <p style="color:${NOTIFY_BRAND.text};font-size:16px;line-height:1.7;margin:0 0 12px;">Thank you for being part of the WINGS community.</p>
        <p style="color:${NOTIFY_BRAND.text};font-size:16px;line-height:1.7;margin:0;">Regards,<br><strong>WINGS Counselling Centre</strong></p>
      </td>
    </tr>
  `;

  return {
    subject: "New Article Published - WINGS Counselling Centre",
    html: buildNotifyEmailDocument({
      title: "New Article Published",
      bodyRowsHtml,
      unsubscribeUrl,
    }),
  };
}

function buildEventNotificationEmail(event, unsubscribeUrl) {
  const siteUrl = getPublicSiteUrl();
  const title = event.title || "New Event";
  const description = (event.description || "").replace(/<[^>]+>/g, " ").trim().slice(0, 320);
  const { date, time } = formatEventDateTime(event.eventDate);
  const location = event.location || "TBA";
  const eventUrl = event.registrationUrl || `${siteUrl}/events`;

  const bodyRowsHtml = `
    <tr>
      <td style="background:#ffffff;padding:36px 32px 28px;font-family:'Segoe UI',Arial,sans-serif;">
        <p style="color:${NOTIFY_BRAND.text};font-size:16px;line-height:1.7;margin:0 0 20px;">Hello,</p>
        <p style="color:${NOTIFY_BRAND.text};font-size:16px;line-height:1.7;margin:0 0 24px;">
          We are excited to announce a new event.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#F4F8FC;border:1px solid #D4E4ED;border-radius:12px;margin:0 0 28px;">
          <tr>
            <td style="padding:24px;">
              <h2 style="color:${NOTIFY_BRAND.navyDark};font-size:24px;margin:0 0 16px;line-height:1.3;font-weight:700;">${escapeHtml(title)}</h2>
              <p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6;"><strong>Date:</strong> ${escapeHtml(date)}</p>
              <p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6;"><strong>Time:</strong> ${escapeHtml(time)}</p>
              <p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6;"><strong>Location:</strong> ${escapeHtml(location)}</p>
              ${description ? `<p style="margin:16px 0 0;color:#475569;font-size:15px;line-height:1.7;">${escapeHtml(description)}${description.length >= 320 ? "…" : ""}</p>` : ""}
            </td>
          </tr>
        </table>
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center" style="margin:0 auto 28px;">
          <tr>
            <td align="center" style="border-radius:999px;background:${NOTIFY_BRAND.navy};">
              <a href="${eventUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;font-family:'Segoe UI',Arial,sans-serif;">View Event</a>
            </td>
          </tr>
        </table>
        <p style="color:${NOTIFY_BRAND.text};font-size:16px;line-height:1.7;margin:0 0 12px;">We look forward to seeing you.</p>
        <p style="color:${NOTIFY_BRAND.text};font-size:16px;line-height:1.7;margin:0;">Regards,<br><strong>WINGS Counselling Centre</strong></p>
      </td>
    </tr>
  `;

  return {
    subject: "New Event Announced - WINGS Counselling Centre",
    html: buildNotifyEmailDocument({
      title: "New Event Announced",
      bodyRowsHtml,
      unsubscribeUrl,
    }),
  };
}

export async function sendArticleNotification(article) {
  return sendSubscriberNotification("article", article);
}

export async function sendEventNotification(event) {
  return sendSubscriberNotification("event", event);
}

export async function sendSubscriberNotification(type, item) {
  if (!isGraphMailConfigured()) {
    console.log("[Email] Microsoft Graph mail is not configured – skipping subscriber notification");
    return;
  }

  await ensureNotifyTables();

  const normalizedType = type === "event" ? "event" : "article";
  const referenceId = Number(item?.id);
  if (!Number.isFinite(referenceId)) {
    console.warn("[Email] Invalid reference id for subscriber notification");
    return;
  }

  const title =
    item?.title ||
    (normalizedType === "event" ? "New Event" : "New Article");

  // Always notify org inbox (MAIL_TO) — same From/To pattern as appointment/volunteer
  const orgTo = getOrgNotificationEmail();
  if (orgTo) {
    try {
      await sendWithFallback({
        from: getFromAddress(),
        to: orgTo,
        subject:
          normalizedType === "event"
            ? `New Event Published — ${title} | WINGS`
            : `New Article Published — ${title} | WINGS`,
        html: getMentalHealthEmailWrapper(
          `
          <p><strong>A ${normalizedType} was published on the website.</strong></p>
          <p><strong>Title:</strong> ${escapeHtml(title)}</p>
          <p><strong>ID:</strong> ${referenceId}</p>
          <p>Subscribers on the ${normalizedType} list are being notified separately.</p>
        `,
          normalizedType === "event" ? "Event Published" : "Article Published"
        ),
      });
      console.log(`[Email] ${normalizedType} org publish alert sent to: ${orgTo}`);
    } catch (err) {
      console.error(
        `[Email] Failed to send ${normalizedType} org alert:`,
        err?.message
      );
    }
  }

  const subscribers = await getActiveSubscribers(normalizedType);
  if (!subscribers.length) {
    console.log(`[Email] No active ${normalizedType} subscribers to notify.`);
    return;
  }

  let sent = 0;
  for (const subscriber of subscribers) {
    const email = subscriber.email;
    if (!isValidEmail(email)) continue;

    try {
      const alreadySent = await wasNotificationSent(email, normalizedType, referenceId);
      if (alreadySent) continue;

      const unsubscribeUrl = buildUnsubscribeLink(subscriber.unsubscribe_token);
      const mail = normalizedType === "event"
        ? buildEventNotificationEmail(item, unsubscribeUrl)
        : buildArticleNotificationEmail(item, unsubscribeUrl);

      await sendWithFallback({
        from: getFromAddress(),
        to: email,
        subject: mail.subject,
        html: mail.html,
      });

      await recordMailLog({
        subscriberId: subscriber.id,
        email,
        type: normalizedType,
        referenceId,
        status: "sent",
      });

      sent++;
    } catch (err) {
      console.error(`[Email] Failed to notify subscriber ${email}:`, err?.message);
      try {
        await recordMailLog({
          subscriberId: subscriber.id,
          email,
          type: normalizedType,
          referenceId,
          status: "failed",
        });
      } catch {
        // ignore log failure
      }
    }
  }

  console.log(`[Email] ${normalizedType} notifications sent: ${sent}/${subscribers.length}`);
}

/**
 * Send application status update email to candidate
 */
export async function sendApplicationStatusUpdateEmail(candidateEmail, data) {
  if (!isGraphMailConfigured()) {
    const err = new Error("Microsoft Graph mail is not configured (MAIL_FROM / MS_* missing)");
    console.error(`[Email] ${err.message}`);
    throw err;
  }

  const { firstName, jobTitle, jobIdCode, status, remarks } = data;

  // Status-specific messages
  const statusMessages = {
    'Pending': { color: '#f59e0b', emoji: '⏳', message: 'Your application is pending review.' },
    'Under Review': { color: '#3b82f6', emoji: '🔍', message: 'Great news! Your application is now under review by our team.' },
    'Shortlisted': { color: '#10b981', emoji: '🎉', message: 'Congratulations! You have been shortlisted for the next round.' },
    'Reschedule Round 1': { color: '#f59e0b', emoji: '📅', message: 'We need to reschedule your Round 1 (Technical Interview). Please check your portal for new time slots.' },
    'Reschedule Round 2': { color: '#f59e0b', emoji: '📅', message: 'We need to reschedule your Round 2 (LSP-E). Please check your portal for new time slots.' },
    'Reschedule Round 3': { color: '#f59e0b', emoji: '📅', message: 'We need to reschedule your Round 3 (Manager/HR Interview). Please check your portal for new time slots.' },
    'Round 1 Scheduled': { color: '#0891b2', emoji: '📆', message: 'Your Round 1 (Technical Interview) has been scheduled. Please check your profile for details.' },
    'Round 1 Confirmed': { color: '#3b82f6', emoji: '✅', message: 'Your Round 1 (Technical Interview) is confirmed. Please be ready at the scheduled time.' },
    'Round 1 Completed': { color: '#6366f1', emoji: '✔️', message: 'Thank you for attending Round 1. We will evaluate and get back to you soon.' },
    'Round 1 Selected': { color: '#10b981', emoji: '🎊', message: 'Congratulations! You have cleared Round 1 and are moving to Round 2.' },
    'Round 1 Not Selected': { color: '#ef4444', emoji: '📋', message: 'Thank you for participating in Round 1. Unfortunately, we have decided to move forward with other candidates.' },
    'Round 2 Scheduled': { color: '#0891b2', emoji: '📆', message: 'Your Round 2 (LSP-E) has been scheduled. Please check your profile for details.' },
    'Round 2 Confirmed': { color: '#3b82f6', emoji: '✅', message: 'Your Round 2 (LSP-E) is confirmed. Prepare for the live practical evaluation.' },
    'Round 2 Completed': { color: '#6366f1', emoji: '✔️', message: 'Thank you for attending Round 2. We will evaluate and get back to you soon.' },
    'Round 2 Selected': { color: '#10b981', emoji: '🎊', message: 'Congratulations! You have cleared Round 2 and are moving to Round 3.' },
    'Round 2 Not Selected': { color: '#ef4444', emoji: '📋', message: 'Thank you for participating in Round 2. Unfortunately, we have decided to move forward with other candidates.' },
    'Round 3 Scheduled': { color: '#0891b2', emoji: '📆', message: 'Your Round 3 (Manager/HR Interview) has been scheduled. This is your final interview round.' },
    'Round 3 Confirmed': { color: '#3b82f6', emoji: '✅', message: 'Your Round 3 (Manager/HR Interview) is confirmed. This is your final interview round.' },
    'Round 3 Completed': { color: '#6366f1', emoji: '✔️', message: 'Thank you for completing all interview rounds. We will finalize the decision soon.' },
    'Round 3 Selected': { color: '#059669', emoji: '🌟', message: 'Congratulations! You have successfully completed all interview rounds. The offer process will begin shortly.' },
    'Round 3 Not Selected': { color: '#ef4444', emoji: '📋', message: 'Thank you for participating in all rounds. Unfortunately, we have decided to move forward with other candidates.' },
    'Final Selected': { color: '#059669', emoji: '🎉', message: 'Congratulations! You have been selected for the position. Our team will reach out with the offer details.' },
    'Offer Extended': { color: '#14b8a6', emoji: '📧', message: 'An offer has been extended to you. Please check your email for the offer details.' },
    'Onboarded': { color: '#059669', emoji: '🎊', message: 'Welcome to the team! Your onboarding process has been initiated.' },
    'Rejected': { color: '#ef4444', emoji: '📋', message: 'Thank you for your interest in this position. After careful consideration, we have decided to move forward with other candidates.' },
    'Not Selected': { color: '#ef4444', emoji: '📋', message: 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates at this time.' },
    'Withdrawn by Candidate': { color: '#f97316', emoji: '📝', message: 'We acknowledge your decision to withdraw from the selection process. We wish you the best.' },
    'Position Closed': { color: '#6b7280', emoji: '🔒', message: 'This position has been closed. Thank you for your interest.' },
    'Rejected - Candidate non responsive': { color: '#ef4444', emoji: '📋', message: 'Your application has been closed due to non-responsiveness. Please contact us if you wish to reapply.' },
  };

  const statusInfo = statusMessages[status] || { 
    color: '#6b7280', 
    emoji: '📧', 
    message: 'Your application status has been updated.' 
  };

  const remarksSection = remarks ? `
    <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
      <p style="color: #92400e; font-weight: 700; margin: 0 0 8px 0; font-size: 14px;">📌 Note from Recruiter:</p>
      <p style="color: #78350f; margin: 0; line-height: 1.6; font-size: 14px;">${escapeHtml(remarks)}</p>
    </div>
  ` : '';

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: linear-gradient(135deg, #e8f4fc 0%, #f0f7fa 100%); border-radius: 16px; padding: 28px 24px; border: 1px solid #d4e4ed;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
            Application Status Update
          </p>
          <h2 style="margin: 0 0 12px 0; color: #0D4A7A; font-size: 26px; font-weight: 600; line-height: 1.3;">
            Hello, ${escapeHtml(firstName)}
          </h2>
          <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.7;">
            There's an update on your application for <strong style="color: #0D4A7A;">${escapeHtml(jobTitle)}</strong> (${escapeHtml(jobIdCode)}) at WINGS Counselling Centre.
          </p>
        </td>
      </tr>
    </table>

    <!-- Status Update Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: ${statusInfo.color}20; border-left: 4px solid ${statusInfo.color}; border-radius: 12px; padding: 20px 22px;">
          <p style="margin: 0 0 8px 0; color: ${statusInfo.color}; font-size: 18px; font-weight: 700;">
            ${statusInfo.emoji} ${escapeHtml(status)}
          </p>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.7;">
            ${statusInfo.message}
          </p>
        </td>
      </tr>
    </table>

    ${remarksSection}

    <!-- Next Steps -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: #f0f7fa; border-radius: 14px; padding: 22px 24px;">
          <h3 style="margin: 0 0 14px 0; color: #0D4A7A; font-size: 16px; font-weight: 700;">
            What's Next?
          </h3>
          <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
            Please log in to your candidate portal to view complete details about your application status and any next steps required.
          </p>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-top: 8px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px; line-height: 1.7;">
            Thank you for your continued interest in joining the WINGS team. We appreciate your patience throughout this process.
          </p>
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            With warmth,<br>
            <strong style="color: #0D4A7A; font-size: 16px;">The WINGS Counselling Team</strong>
          </p>
        </td>
      </tr>
    </table>
  `;

  const subject = `Application Update: ${status} — ${jobTitle}`;

  const mailOptions = {
    from: getFromAddress(),
    to: candidateEmail,
    subject,
    html: getMentalHealthEmailWrapper(content, "Application Status Update"),
  };

  try {
    await sendWithFallback(mailOptions);
    console.log(
      `[Email] Application status update sent to: ${candidateEmail} (status="${status}" job="${jobTitle}")`
    );
    return true;
  } catch (err) {
    console.error(
      `[Email] Failed to send application status update to ${candidateEmail}:`,
      err?.message || err
    );
    throw err;
  }
}
