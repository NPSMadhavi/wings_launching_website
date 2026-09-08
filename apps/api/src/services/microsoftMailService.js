/**
 * Microsoft Graph Mail Service — Client Credentials (Application) Flow only.
 *
 * Matches: microsoft-graph-email-integration_silentEmailSeding.md
 * No interactive login. No Authorization Code Flow. No delegated permissions.
 *
 * Env (document names preferred; MS_* aliases still accepted):
 *   AZURE_CLIENT_ID / MS_CLIENT_ID
 *   AZURE_TENANT_ID / MS_TENANT_ID
 *   AZURE_CLIENT_SECRET / MS_CLIENT_SECRET
 *   MAIL_FROM  (sender mailbox)  — falls back to ORGANIZATION_EMAIL
 *   MAIL_TO    (recipient)       — falls back to ORGANIZATION_NOTIFICATION_EMAIL
 */

import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";

const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

let _graphClient = null;
let _credentialFingerprint = "";

function readMsCredentials() {
  // Document vars (AZURE_*) first, then existing MS_* aliases
  const clientId = String(
    process.env.AZURE_CLIENT_ID || process.env.MS_CLIENT_ID || ""
  ).trim();
  const tenantId = String(
    process.env.AZURE_TENANT_ID || process.env.MS_TENANT_ID || ""
  ).trim();
  const clientSecret = String(
    process.env.AZURE_CLIENT_SECRET || process.env.MS_CLIENT_SECRET || ""
  ).trim();

  const missing = [];
  if (!clientId) missing.push("AZURE_CLIENT_ID (or MS_CLIENT_ID)");
  if (!tenantId) missing.push("AZURE_TENANT_ID (or MS_TENANT_ID)");
  if (!clientSecret) missing.push("AZURE_CLIENT_SECRET (or MS_CLIENT_SECRET)");

  return { clientId, tenantId, clientSecret, missing };
}

export function getMailFrom() {
  return String(
    process.env.MAIL_FROM || process.env.ORGANIZATION_EMAIL || ""
  ).trim();
}

export function getMailTo() {
  return String(
    process.env.MAIL_TO || process.env.ORGANIZATION_NOTIFICATION_EMAIL || ""
  ).trim();
}

/**
 * Map Graph / Azure errors to clear operational messages.
 */
export function explainGraphMailError(err) {
  const status = err?.statusCode || err?.status || err?.code;
  const msg = String(err?.message || err?.body || err || "");
  const lower = msg.toLowerCase();

  if (/aadsts700016|application.*(not found)|invalid client/i.test(msg)) {
    return "Invalid Client ID (AZURE_CLIENT_ID / MS_CLIENT_ID). Check the App Registration Application (client) ID.";
  }
  if (/aadsts7000215|invalid client secret|client secret.*expired/i.test(msg)) {
    return "Invalid Client Secret (AZURE_CLIENT_SECRET / MS_CLIENT_SECRET). Create a new client secret in Azure Portal.";
  }
  if (/aadsts90002|tenant|aadsts900023|aadsts500011/i.test(msg) || /invalid_tenant/i.test(lower)) {
    return "Invalid Tenant ID (AZURE_TENANT_ID / MS_TENANT_ID). Use the Directory (tenant) ID from Microsoft Entra ID.";
  }
  if (
    status === 403 ||
    /authorization_requestdenied|accessdenied|insufficient privileges|mail\.send/i.test(
      msg
    )
  ) {
    return "Mail.Send application permission is missing, or Admin Consent has not been granted.";
  }
  if (
    status === 404 ||
    /mailboxnotenabledforrestapi|erroritemnotfound|resource could not be found|mailbox/i.test(
      msg
    )
  ) {
    return "Mailbox not found. Set MAIL_FROM to a real user/shared mailbox in this tenant.";
  }
  if (
    /token|credential|authentication|unauthorized|401/i.test(lower) ||
    status === 401
  ) {
    return "Token acquisition failed. Verify AZURE_CLIENT_ID / MS_CLIENT_ID, AZURE_TENANT_ID / MS_TENANT_ID, and AZURE_CLIENT_SECRET / MS_CLIENT_SECRET.";
  }

  return msg || "Microsoft Graph mail send failed.";
}

/**
 * Lazy singleton Graph client. Token is obtained/refreshed by the SDK.
 */
export function getGraphClient() {
  const { clientId, tenantId, clientSecret, missing } = readMsCredentials();
  if (missing.length) {
    throw new Error(
      `Microsoft Graph mail is not configured. Add to apps/api/.env: ${missing.join(", ")}`
    );
  }

  const fingerprint = `${tenantId}|${clientId}|${clientSecret.slice(0, 4)}`;
  if (_graphClient && _credentialFingerprint === fingerprint) {
    return _graphClient;
  }

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: [GRAPH_SCOPE],
  });

  _graphClient = Client.initWithMiddleware({ authProvider });
  _credentialFingerprint = fingerprint;
  return _graphClient;
}

function toRecipientList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(/[,;]/);
  return list
    .map((v) => String(v).trim())
    .filter(Boolean)
    .map((address) => ({ emailAddress: { address } }));
}

/**
 * Reusable Graph sendMail helper (Client Credentials).
 *
 * @param {object} options
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string|string[]} [options.to]  defaults to MAIL_TO
 * @param {string|string[]} [options.cc]
 * @param {string} [options.from]         defaults to MAIL_FROM
 * @param {boolean} [options.saveToSentItems=true]
 * @param {object[]} [options.replyTo]    Graph replyTo recipients
 * @param {object[]} [options.attachments] Graph fileAttachment objects
 */
export async function sendGraphMail({
  subject,
  html,
  to,
  cc,
  from,
  saveToSentItems = true,
  replyTo,
  attachments,
} = {}) {
  const sender = String(from || getMailFrom()).trim();
  const recipients = toRecipientList(to || getMailTo());

  if (!sender) {
    throw new Error(
      "MAIL_FROM is not set in .env (sender mailbox for Graph sendMail)."
    );
  }
  if (!recipients.length) {
    throw new Error(
      "MAIL_TO is not set in .env (recipient for Graph sendMail)."
    );
  }
  if (!subject) {
    throw new Error("Email subject is required.");
  }

  const client = getGraphClient();

  const message = {
    subject,
    body: {
      contentType: "HTML",
      content: html || "",
    },
    toRecipients: recipients,
    from: { emailAddress: { address: sender } },
  };

  const ccList = toRecipientList(cc);
  if (ccList.length) message.ccRecipients = ccList;
  if (Array.isArray(replyTo) && replyTo.length) message.replyTo = replyTo;
  if (Array.isArray(attachments) && attachments.length) {
    message.attachments = attachments;
  }

  try {
    await client.api(`/users/${encodeURIComponent(sender)}/sendMail`).post({
      message,
      saveToSentItems: Boolean(saveToSentItems),
    });
    return true;
  } catch (err) {
    const friendly = explainGraphMailError(err);
    console.error("[MS Mail] Graph sendMail failed:", friendly);
    if (err?.body || err?.code) {
      console.error("[MS Mail] Details:", err?.code || "", err?.body || err?.message);
    }
    const wrapped = new Error(friendly);
    wrapped.cause = err;
    throw wrapped;
  }
}

/* ───────────────── Appointment helpers (unchanged behaviour) ───────────────── */

function esc(value) {
  if (value == null || value === "") return "—";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
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

function buildAppointmentEmailHtml(appointment) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Appointment — WINGS Counselling Centre</title>
</head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;line-height:1.6;color:#333;">
  <p>An appointment request has been submitted on your website with following credentials.</p>
  
  <p>
    <strong>NRIC:</strong> ${esc(appointment.nric_fin_number || "—")}<br>
    <strong>Fullname:</strong> ${esc(appointment.name || "—")}<br>
    <strong>Age:</strong> ${esc(appointment.age || "—")}<br>
    <strong>Gender:</strong> ${esc(appointment.gender || "—")}<br>
    <strong>Residential Status:</strong> ${esc(appointment.nationality || "—")}<br>
    <strong>Email:</strong> ${esc(appointment.email || "—")}<br>
    <strong>Contact:</strong> ${esc(appointment.phone || "—")}<br>
    <strong>Concerns:</strong> ${esc(appointment.counselling_type || "—")}${appointment.sub_counselling_types ? ", " + esc(appointment.sub_counselling_types) : ""}${appointment.type_of_concern ? ", " + esc(appointment.type_of_concern) : ""}<br>
    <strong>Message:</strong> ${esc(appointment.description || "—")}<br>
    ${appointment.type_of_concern === "Others" && appointment.type_of_concern_other ? `<strong>Brief Description Of Concern:</strong> ${esc(appointment.type_of_concern_other)}<br>` : ""}
  </p>
</body>
</html>`;
}

/**
 * Send appointment notification via Microsoft Graph (application Mail.Send).
 * Same export used by routes/appointment.js — do not rename.
 *
 * @returns {Promise<boolean>}
 */
export async function sendAppointmentNotification(appointment) {
  const senderEmail = getMailFrom();
  const recipientEmail = getMailTo();

  if (!senderEmail) {
    console.error(
      "[MS Mail] MAIL_FROM (or ORGANIZATION_EMAIL) is not set — cannot send via Microsoft Graph"
    );
    return false;
  }
  if (!recipientEmail) {
    console.error(
      "[MS Mail] MAIL_TO (or ORGANIZATION_NOTIFICATION_EMAIL) is not set — cannot send via Microsoft Graph"
    );
    return false;
  }

  const { missing } = readMsCredentials();
  if (missing.length > 0) {
    console.error(`[MS Mail] Microsoft is not configured. Missing: ${missing.join(", ")}`);
    return false;
  }

  const clientName =
    (appointment.name || "").trim().split(/\s+/)[0] || "Client";
  const subject = `New appointment submission on WINGS website`;

  try {
    await sendGraphMail({
      from: senderEmail,
      to: recipientEmail,
      subject,
      html: buildAppointmentEmailHtml(appointment),
      saveToSentItems: true,
      replyTo: appointment.email
        ? [
            {
              emailAddress: {
                address: appointment.email,
                name: appointment.name || appointment.email,
              },
            },
          ]
        : undefined,
    });

    console.log(
      `[MS Mail] Appointment notification sent via Graph API. Appointment ID: ${appointment.id}, To: ${recipientEmail}`
    );
    return true;
  } catch (err) {
    console.error(
      "[MS Mail] Failed to send appointment notification:",
      err?.message || "Unknown error"
    );
    return false;
  }
}
