const API_ROOT = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const BASE = `${API_ROOT}/api`;

function buildApiUrl(path) {
  return `${BASE}${path}`;
}

export function resolveAssetUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return API_ROOT ? `${API_ROOT}${url}` : url;
}

export function toStorageUrl(url) {
  if (!url) return "";
  if (API_ROOT && url.startsWith(API_ROOT)) {
    return url.slice(API_ROOT.length);
  }
  return url;
}

function getToken() {
  return sessionStorage.getItem("wings_admin_token") || "";
}

function authHeaders(json = true) {
  const headers = {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function apiFetch(path, init = {}) {
  const res = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      ...authHeaders(!(init.body instanceof FormData)),
      ...(init.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && getToken()) {
      const message = data?.error || "Unauthorised";

      if (/invalid token|unauthorised|expired/i.test(message)) {
        sessionStorage.removeItem("wings_admin_token");
        window.dispatchEvent(new CustomEvent("wings-admin-session-expired"));
      }
    }

    throw new Error(data?.error || "Request failed");
  }

  return data;
}

async function safeApiFetch(path, fallback, init = {}) {
  try {
    return await apiFetch(path, init);
  } catch {
    return fallback;
  }
}

export const api = {
  login: (email, password) =>
    apiFetch("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getTeam: () => apiFetch("/admin/team"),
  createTeam: (data) =>
    apiFetch("/admin/team", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTeam: (id, data) =>
    apiFetch(`/admin/team/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTeam: (id) =>
    apiFetch(`/admin/team/${id}`, {
      method: "DELETE",
    }),
  getTeamGroupPhoto: () => safeApiFetch("/team/group-photo", { photoUrl: "", rawPhotoUrl: "" }),
  updateTeamGroupPhoto: (photoUrl, rawPhotoUrl = "") =>
    apiFetch("/admin/team/group-photo", {
      method: "PUT",
      body: JSON.stringify({ photoUrl, rawPhotoUrl }),
    }),
  deleteTeamGroupPhoto: () =>
    apiFetch("/admin/team/group-photo", {
      method: "DELETE",
    }),

  getArticles: () => apiFetch("/admin/articles"),
  createArticle: (data) =>
    apiFetch("/admin/articles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateArticle: (id, data) =>
    apiFetch(`/admin/articles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteArticle: (id) =>
    apiFetch(`/admin/articles/${id}`, {
      method: "DELETE",
    }),

  getLanguages: () => apiFetch("/admin/languages"),
  getArticleLanguages: (articleId) =>
    apiFetch(`/admin/articles/${articleId}/languages`),
  saveArticleLanguage: (articleId, languageId, data) =>
    apiFetch(`/admin/articles/${articleId}/languages/${languageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  translateArticleLanguage: (articleId, langCode, force = false) =>
    apiFetch(`/admin/articles/${articleId}/translate/${langCode}`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),

  getCounsellingTypeLanguages: (typeId) =>
    apiFetch(`/admin/counselling-types/${typeId}/languages`),
  saveCounsellingTypeLanguage: (typeId, languageId, data) =>
    apiFetch(`/admin/counselling-types/${typeId}/languages/${languageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  translateCounsellingTypeLanguage: (typeId, langCode, force = false) =>
    apiFetch(`/admin/counselling-types/${typeId}/translate/${langCode}`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),
  getCounsellingSubTypeLanguages: (subId) =>
    apiFetch(`/admin/counselling-sub-types/${subId}/languages`),
  saveCounsellingSubTypeLanguage: (subId, languageId, data) =>
    apiFetch(`/admin/counselling-sub-types/${subId}/languages/${languageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  translateCounsellingSubTypeLanguage: (subId, langCode, force = false) =>
    apiFetch(`/admin/counselling-sub-types/${subId}/translate/${langCode}`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),

  uploadDocument: async ({ file, htmlContent, originalName, title }) => {
    const fd = new FormData();
    if (file) fd.append("file", file);
    if (htmlContent != null) fd.append("htmlContent", htmlContent);
    if (originalName) fd.append("originalName", originalName);
    if (title != null) fd.append("title", title);
    return apiFetch("/admin/documents", {
      method: "POST",
      body: fd,
    });
  },

  getCareers: () => apiFetch("/jobs"),
  createCareer: (data) =>
    apiFetch("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCareer: (id, data) =>
    apiFetch(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCareer: (id) =>
    apiFetch(`/jobs/${id}`, {
      method: "DELETE",
    }),

  getEvents: (lang) =>
    apiFetch(
      lang
        ? `/admin/events?lang=${encodeURIComponent(lang)}`
        : "/admin/events"
    ),
  createEvent: (data) =>
    apiFetch("/admin/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEvent: (id, data) =>
    apiFetch(`/admin/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteEvent: (id) =>
    apiFetch(`/admin/events/${id}`, {
      method: "DELETE",
    }),
  saveEventLanguage: (eventId, languageId, data) =>
    apiFetch(`/admin/events/${eventId}/languages/${languageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  translateEventLanguage: (eventId, langCode, force = false) =>
    apiFetch(`/admin/events/${eventId}/translate/${langCode}`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),

  saveJobLanguage: (jobId, languageId, data) =>
    apiFetch(`/admin/jobs/${jobId}/languages/${languageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  translateJobLanguage: (jobId, langCode, force = false) =>
    apiFetch(`/admin/jobs/${jobId}/translate/${langCode}`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),
  saveCategoryLanguage: (categoryId, languageId, data) =>
    apiFetch(`/admin/categories/${categoryId}/languages/${languageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  translateCategoryLanguage: (categoryId, langCode, force = false) =>
    apiFetch(`/admin/categories/${categoryId}/translate/${langCode}`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),

  getApplications: () => safeApiFetch("/admin/applications", []),
  updateApplicationStatus: (id, status, adminNotes) =>
    apiFetch(`/admin/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, adminNotes }),
    }),
  scheduleInterview: (appId, data) =>
    apiFetch(`/admin/applications/${appId}/schedule-interview`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInterviewAvailability: () => safeApiFetch("/admin/interview-availability", []),
  createInterviewSlotsBulk: (slots) =>
    apiFetch("/admin/interview-availability/bulk", {
      method: "POST",
      body: JSON.stringify({ slots }),
    }),
  deleteInterviewSlot: (id) =>
    apiFetch(`/admin/interview-availability/${id}`, {
      method: "DELETE",
    }),

  getCustomInterviewRequests: () => safeApiFetch("/admin/interview-custom-requests", []),
  resolveCustomRequest: (id, status) =>
    apiFetch(`/admin/interview-custom-requests/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  getEmailRecipients: () => apiFetch("/admin/settings/emails"),
  createEmailRecipient: (data) =>
    apiFetch("/admin/settings/emails", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEmailRecipient: (id, data) =>
    apiFetch(`/admin/settings/emails/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteEmailRecipient: (id) =>
    apiFetch(`/admin/settings/emails/${id}`, {
      method: "DELETE",
    }),

  getFormSubmissionEmails: () => apiFetch("/admin/settings/primary-cc-mails"),
  getFormSubmissionEmail: (id) => apiFetch(`/admin/settings/primary-cc-mails/${id}`),
  updateFormSubmissionEmail: (id, data) =>
    apiFetch(`/admin/settings/primary-cc-mails/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteFormSubmissionEmail: (id) =>
    apiFetch(`/admin/settings/primary-cc-mails/${id}`, {
      method: "DELETE",
    }),
  deleteFormSubmissionEmailsBulk: (ids) =>
    apiFetch("/admin/settings/primary-cc-mails/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  getNotifySubscribers: () => apiFetch("/admin/notify-subscribers"),
  deleteNotifySubscriber: (id) =>
    apiFetch(`/admin/notify-subscribers/${id}`, { method: "DELETE" }),

  getPartners: (lang) =>
    apiFetch(
      lang ? `/admin/partners?lang=${encodeURIComponent(lang)}` : "/admin/partners"
    ),
  getPartner: (id) => apiFetch(`/admin/partners/${id}`),
  createPartner: (data) =>
    apiFetch("/admin/partners", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePartner: (id, data) =>
    apiFetch(`/admin/partners/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePartner: (id) =>
    apiFetch(`/admin/partners/${id}`, {
      method: "DELETE",
    }),
  savePartnerLanguage: (partnerId, languageId, data) =>
    apiFetch(`/admin/partners/${partnerId}/languages/${languageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  translatePartnerLanguage: (partnerId, langCode, force = false) =>
    apiFetch(`/admin/partners/${partnerId}/translate/${langCode}`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),

  getSocialMediaLinks: () => apiFetch("/admin/social-media"),
  createSocialMediaLink: (data) =>
    apiFetch("/admin/social-media", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSocialMediaLink: (id, data) =>
    apiFetch(`/admin/social-media/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteSocialMediaLink: (id) =>
    apiFetch(`/admin/social-media/${id}`, {
      method: "DELETE",
    }),

  getTestimonials: (lang) =>
    apiFetch(
      lang
        ? `/admin/testimonials?lang=${encodeURIComponent(lang)}`
        : "/admin/testimonials"
    ),
  getTestimonial: (id) => apiFetch(`/admin/testimonials/${id}`),
  createTestimonial: (data) =>
    apiFetch("/admin/testimonials", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTestimonial: (id, data) =>
    apiFetch(`/admin/testimonials/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTestimonial: (id) =>
    apiFetch(`/admin/testimonials/${id}`, {
      method: "DELETE",
    }),
  saveTestimonialLanguage: (testimonialId, languageId, data) =>
    apiFetch(`/admin/testimonials/${testimonialId}/languages/${languageId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  translateTestimonialLanguage: (testimonialId, langCode, force = false) =>
    apiFetch(`/admin/testimonials/${testimonialId}/translate/${langCode}`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),

  uploadFiles: async (files, type = "") => {
    const fd = new FormData();
    if (type) fd.append("type", type);

    files.forEach((file) => {
      fd.append("files", file);
    });

    const path = type ? `/admin/upload?type=${encodeURIComponent(type)}` : "/admin/upload";

    return apiFetch(path, {
      method: "POST",
      body: fd,
    });
  },
};
