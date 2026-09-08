import { db } from "../config/db.js";

async function ensureFormSubmissionEmailsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS form_submission_emails (
      id SERIAL PRIMARY KEY,
      form_type VARCHAR(120) NOT NULL,
      source_id INT NULL,
      primary_mail TEXT NOT NULL,
      cc_mail TEXT NULL,
      subject VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      remarks TEXT NULL,
      sender_email VARCHAR(320) NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_form_submission_emails_created ON form_submission_emails (created_at DESC)`
  );
  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_form_submission_emails_type ON form_submission_emails (form_type)`
  );
}

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await ensureFormSubmissionEmailsTable();
  tableReady = true;
}

/**
 * Persist a form-triggered outbound email for the admin Primary & CC Mails inbox.
 */
export async function recordFormSubmissionEmail({
  formType,
  sourceId = null,
  primaryMail,
  ccMail = "",
  subject,
  content,
  remarks = "",
  senderEmail = null,
}) {
  try {
    await ensureTable();

    await db.execute(
      `INSERT INTO form_submission_emails
        (form_type, source_id, primary_mail, cc_mail, subject, content, remarks, sender_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        formType,
        sourceId,
        primaryMail,
        ccMail || "",
        subject,
        content,
        remarks || "",
        senderEmail,
      ]
    );
  } catch (err) {
    console.warn("[Email] Failed to record form submission email:", err);
  }
}

export function formatAppointmentEmailContent(appointment) {
  const enquirerType = appointment.enquirer_type || appointment.enquirerType || "";
  const enquirerName = appointment.enquirer_name || appointment.enquirerName;
  const enquirerRelationship = appointment.enquirer_relationship || appointment.enquirerRelationship || appointment.relationship;
  const enquirerContactNumber = appointment.enquirer_contact_number || appointment.enquirerContactNumber;
  const enquirerEmail = appointment.enquirer_email || appointment.enquirerEmail;

  const refAgencyName = appointment.referral_agency_name || appointment.referralAgencyName;
  const refAgencyPerson = appointment.referral_agency_contact_person || appointment.referralAgencyContactPerson;
  const refAgencyEmail = appointment.referral_agency_contact_email || appointment.referralAgencyContactEmail;
  const refAgencyPassword = appointment.referral_agency_password || appointment.referralAgencyPassword;

  let concernsText = appointment.type_of_concern || "";
  if (appointment.type_of_concern_other) {
    concernsText = concernsText ? `${concernsText} (${appointment.type_of_concern_other})` : appointment.type_of_concern_other;
  }
  if (!concernsText) {
    let concernsList = [];
    if (appointment.counselling_type) concernsList.push(appointment.counselling_type);
    if (appointment.sub_counselling_types) concernsList.push(appointment.sub_counselling_types);
    concernsText = concernsList.join(", ");
  }
  const concerns = concernsText || "—";

  let messageText = appointment.description || appointment.remarks || "—";
  if (appointment.description && appointment.remarks && appointment.description !== appointment.remarks) {
    messageText = `${appointment.description}\nRemarks: ${appointment.remarks}`;
  }

  const lines = [
    "An appointment request has been submitted on your website wingscounselling.org.sg with following credentials.",
    "",
    `Full Name: ${appointment.name || "—"}`,
    `Age: ${appointment.age ?? "—"}`,
    `Gender : ${appointment.gender || "—"}`,
    `Residential Status: ${appointment.nationality || "—"}`,
  ];

  if (appointment.nric_fin_number) {
    lines.push(`NRIC: ${appointment.nric_fin_number}`);
  }

  lines.push(
    `Email: ${appointment.email || "—"}`,
    `Contact: ${appointment.phone || "—"}`,
    `Concerns: ${concerns}`
  );

  if (enquirerType) lines.push(`Enquirer Type: ${enquirerType}`);
  if (enquirerName) lines.push(`Enquirer Name: ${enquirerName}`);
  if (enquirerRelationship) lines.push(`Relationship: ${enquirerRelationship}`);
  if (enquirerContactNumber) lines.push(`Enquirer Contact Number: ${enquirerContactNumber}`);
  if (enquirerEmail) lines.push(`Enquirer Email Address: ${enquirerEmail}`);

  if (refAgencyName) lines.push(`Referral Agency Name: ${refAgencyName}`);
  if (refAgencyPerson) lines.push(`Referral Agency Contact Person: ${refAgencyPerson}`);
  if (refAgencyEmail) lines.push(`Referral Agency Contact Email: ${refAgencyEmail}`);

  lines.push(`Message: ${messageText}`);

  if (refAgencyPassword) lines.push(`Password: ${refAgencyPassword}`);

  if (Array.isArray(appointment.attachments) && appointment.attachments.length) {
    lines.push(`Attached Documents: ${appointment.attachments.map(f => typeof f === 'string' ? f : (f.name || 'Document')).join(', ')}`);
  }

  return lines.join("\n");
}

export function formatApplicationEmailContent(data) {
  return [
    `New ${data.formLabel || "application"} from ${data.firstName || ""} ${data.lastName || ""}`.trim(),
    "",
    `Position: ${data.jobTitle || "—"}`,
    `Application Ref: ${data.applicationNumber || "—"}`,
    `Applicant Email: ${data.email || "—"}`,
    `Status: ${data.status || "submitted"}`,
  ].join("\n");
}

export function formatVolunteerEmailContent(volunteer) {
  const lines = [
    `New volunteer application from ${volunteer.name || "Unknown"}`,
    "",
    `Email: ${volunteer.email || "—"}`,
    `Phone (H/P): ${volunteer.phone_hp || "—"}`,
    `Phone (Res): ${volunteer.phone_res || "—"}`,
    `Address: ${volunteer.address || "—"}`,
    `Citizenship: ${volunteer.citizenship || "—"}`,
    `Age: ${volunteer.age ?? "—"}`,
    `Gender: ${volunteer.gender || "—"}`,
    "",
    `Interest Areas: ${volunteer.interest_areas || "—"}`,
    `Other Contribution: ${volunteer.other_contribution || "—"}`,
    `Skills & Hobbies: ${volunteer.skills_hobbies || "—"}`,
    `Preferred Days: ${volunteer.preferred_days || "—"}`,
    `Time: ${volunteer.time_from || "—"} - ${volunteer.time_to || "—"}`,
    `Commitment: ${volunteer.commitment_duration || "—"} ${volunteer.commitment_unit || ""}`,
  ];
  return lines.join("\n");
}
