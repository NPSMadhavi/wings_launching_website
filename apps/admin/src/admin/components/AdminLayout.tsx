import { type ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Users,
  FileText,
  Briefcase,
  Calendar,
  HeartHandshake,
  Handshake,
  MessageSquareQuote,
  Share2,
  LogOut,
  LayoutDashboard,
  Bell,
  Eye,
  ChevronRight,
  ChevronDown,
  User,
  Mail,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getNotificationPermission,
  isNotificationSupported,
  notifyAdminEvent,
  requestNotificationPermission,
  buildAdminNotificationContent,
  showBrowserNotification,
} from "../lib/browserNotifications";
import { toast } from "react-toastify";
import { api } from "../lib/api";

/* ================= TYPES ================= */

type SSEEventType =
  | "new_application"
  | "new_appointment"
  | "new_volunteer"
  | "status_updated"
  | "interview_scheduled"
  | "interview_booked"
  | "interview_time_requested"
  | "new_job"
  | "new_form_submission"
  | "email_sent"
  | "email_failed"
  | "user_activity";

type SSENotification = {
  type: SSEEventType;
  data: Record<string, any>;
  timestamp: number;
};

function getNotificationStatus(type: SSEEventType): "success" | "error" | "info" {
  if (type === "email_sent") return "success";
  if (type === "email_failed") return "error";
  return "info";
}

/* ================= NOTIFICATIONS PAGE ================= */

function NotificationsPage({
  notifications,
  onClose,
  onMarkRead,
  onNavigate
}: any) {

  function ago(ts: number) {
    const s = Math.floor((Date.now() - ts) / 1000);

    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;

    return `${Math.floor(s / 3600)}h ago`;
  }

  function notifLabel(n: SSENotification) {
    const d = n.data;

    if (n.type === "new_application") {
      return `New application: ${d.candidateName} → ${d.jobTitle}`;
    }

    if (n.type === "status_updated") {
      return `Status update: ${d.applicationNumber} → ${d.status}`;
    }

    if (n.type === "interview_scheduled") {
      return `Interview scheduled for App #${d.applicationId}`;
    }

    if (n.type === "interview_booked") {
      return `${d.candidateName} booked interview — ${d.date} ${d.timeSlot}`;
    }

    if (n.type === "interview_time_requested") {
      return `Custom time request: ${d.candidateName}`;
    }

    if (n.type === "new_job") {
      return `Job posted: ${d.title}`;
    }

    if (n.type === "new_appointment") {
      return `New appointment request: ${d.name} (${d.counsellingType})`;
    }

    if (n.type === "new_volunteer") {
      const when = d.submittedAt
        ? new Date(d.submittedAt).toLocaleString("en-SG")
        : "just now";
      return `New Volunteer Application Received: ${d.name} — ${when}`;
    }

    if (n.type === "new_form_submission") {
      return `New form submission: ${d.formType || "Form"} by ${d.name || d.email || "Unknown"}`;
    }

    if (n.type === "email_sent") {
      return `Email sent: ${d.subject || d.context || "Notification delivery successful"}`;
    }

    if (n.type === "email_failed") {
      return `Email failed: ${d.reason || d.error || "Delivery failed"}`;
    }

    if (n.type === "user_activity") {
      return `User activity: ${d.message || d.action || "Recent system activity"}`;
    }

    return "Notification";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[90%] max-w-2xl max-h-[90vh] overflow-hidden">

        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell size={20} style={{ color: "#004689" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "#004689" }}
            >
              Notifications
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell size={48} className="text-gray-300 mb-3" />

              <p className="text-gray-500 font-medium">
                No notifications yet
              </p>

              <p className="text-sm text-gray-400 mt-1">
                New notifications will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n: SSENotification, i: number) => (
                <div
                  key={i}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (n.type === "new_application") {
                      onNavigate("/admin/careers?tab=applications");
                    }

                    if (n.type === "interview_scheduled") {
                      onNavigate("/admin/careers?tab=slots");
                    }

                    onClose();
                  }}
                >
                  <div className="flex items-start gap-3">

                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Bell size={14} style={{ color: "#004689" }} />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {notifLabel(n)}
                      </p>
                      <div className="mt-1 inline-flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getNotificationStatus(n.type) === "success"
                            ? "bg-green-100 text-green-700"
                            : getNotificationStatus(n.type) === "error"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                            }`}
                        >
                          {getNotificationStatus(n.type)}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">{n.type.replace(/_/g, " ")}</span>
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        {ago(n.timestamp)}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onMarkRead}
              className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: "#004689",
                color: "white"
              }}
            >
              Mark All as Read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

export default function AdminLayout({
  children
}: {
  children: ReactNode;
}) {

  const [location, navigate] = useLocation();
  const { logout, token } = useAuth();

  const [notifications, setNotifications] = useState<
    SSENotification[]
  >([]);

  const [showNotifsPage, setShowNotifsPage] = useState(false);
  const [unread, setUnread] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [emailsDropdownOpen, setEmailsDropdownOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    () => getNotificationPermission()
  );
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [liveVisitors, setLiveVisitors] = useState(0);
  const emailsMenuRef = useRef<HTMLDivElement | null>(null);

  const _sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const loadLiveVisitors = async () => {
      try {
        const res = await api.fetchLiveVisitorCount();
        if (isMounted && res && typeof res.count === "number") {
          setLiveVisitors(res.count);
        }
      } catch (_err) {
        // Silently handle error
      }
    };

    loadLiveVisitors();
    const interval = setInterval(loadLiveVisitors, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const sync = () => {
      const perm = getNotificationPermission();
      setNotifPermission(perm);
      // Show banner if permission hasn't been decided yet
      setShowPermissionBanner(perm === "default");
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    setShowPermissionBanner(false);

    if (result === "granted") {
      toast.success("Notifications enabled. System alerts are now active.");
      // Fire a real system notification immediately so the user sees it works
      showBrowserNotification("user_activity", {
        message: "Desktop notifications are now enabled for WINGS Admin.",
      });
      setShowNotifsPage(true);
      return;
    }

    if (result === "denied") {
      toast.error(
        "Notifications were blocked. Enable them in your browser site settings, then click the bell again."
      );
      return;
    }

    if (result === "unsupported") {
      toast.error("This browser does not support desktop notifications.");
    }
  }

  const isPrimaryCcMailsRoute = location.startsWith("/admin/settings/primary-cc-mails");
  const isNotifyMailsRoute = location.startsWith("/admin/settings/notify-mails");
  const isEmailsRoute =
    isPrimaryCcMailsRoute ||
    isNotifyMailsRoute ||
    location.startsWith("/admin/settings/emails");

  useEffect(() => {
    if (isEmailsRoute) {
      setEmailsDropdownOpen(true);
    }
  }, [isEmailsRoute]);

  useEffect(() => {
    if (!emailsDropdownOpen) return;

    const close = (e: MouseEvent) => {
      const el = emailsMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setEmailsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [emailsDropdownOpen]);

  const push = useCallback(
    (type: SSEEventType, data: Record<string, any>) => {

      setNotifications((prev) => [
        {
          type,
          data,
          timestamp: Date.now()
        },
        ...prev
      ].slice(0, 50));

      setUnread((n) => n + 1);

      // notifyAdminEvent plays sound + shows system notification if permission is granted
      notifyAdminEvent(type, data);

      // Also show a Toastify toast for every SSE event
      const { title, body } = buildAdminNotificationContent(type, data);
      const message = `${title}: ${body}`;
      if (type === "email_failed") {
        toast.error(message, { autoClose: 5000 });
      } else if (type === "email_sent") {
        toast.success(message, { autoClose: 4000 });
      } else {
        toast.info(message, { autoClose: 4000 });
      }
    },
    []
  );

  /* ================= SSE ================= */

  useEffect(() => {

    if (!token) return;

    const es = new EventSource(
      `/api/admin/notifications/stream?token=${encodeURIComponent(token)}`
    );

    _sseRef.current = es;

    es.addEventListener("new_application", (e) =>
      push(
        "new_application",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("status_updated", (e) =>
      push(
        "status_updated",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("interview_scheduled", (e) =>
      push(
        "interview_scheduled",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("interview_booked", (e) =>
      push(
        "interview_booked",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("interview_time_requested", (e) =>
      push(
        "interview_time_requested",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("new_job", (e) =>
      push(
        "new_job",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("new_appointment", (e) =>
      push(
        "new_appointment",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("new_volunteer", (e) =>
      push(
        "new_volunteer",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("new_form_submission", (e) =>
      push(
        "new_form_submission",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("email_sent", (e) =>
      push(
        "email_sent",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("email_failed", (e) =>
      push(
        "email_failed",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.addEventListener("user_activity", (e) =>
      push(
        "user_activity",
        JSON.parse((e as MessageEvent).data)
      )
    );

    es.onerror = () => {
      es.close();
    };

    return () => es.close();

  }, [push, token]);

  /* ================= HELPERS ================= */

  const getCurrentTab = () => {
    const searchParams = new URLSearchParams(window.location.search);

    return searchParams.get("tab");
  };

  const isActive = (href: string) => {

    const currentTab = getCurrentTab();

    if (href === "/admin") {
      return location === "/admin";
    }

    if (href === "/admin/team") {
      return location === "/admin/team";
    }

    if (href === "/admin/articles") {
      return location === "/admin/articles";
    }

    if (href === "/admin/events") {
      return location === "/admin/events";
    }

    if (href === "/admin/appointments") {
      return location === "/admin/appointments";
    }

    if (href === "/admin/volunteers") {
      return location === "/admin/volunteers";
    }

    if (href === "/admin/partners") {
      return location === "/admin/partners";
    }

    if (href === "/admin/testimonials") {
      return location === "/admin/testimonials";
    }

    if (href === "/admin/social-media") {
      return location === "/admin/social-media";
    }

    if (href === "/admin/visitors") {
      return location === "/admin/visitors";
    }

    if (href === "/admin/settings/primary-cc-mails") {
      return isPrimaryCcMailsRoute;
    }

    if (href === "/admin/settings/notify-mails") {
      return isNotifyMailsRoute;
    }

    if (href === "__emails_section__") {
      return isEmailsRoute;
    }

    if (href === "/admin/careers") {
      return (
        location === "/admin/careers" &&
        (!currentTab || currentTab === "jobs")
      );
    }

    if (href === "/admin/careers?tab=applications") {
      return (
        location === "/admin/careers" &&
        currentTab === "applications"
      );
    }

    if (href === "/admin/careers?tab=slots") {
      return (
        location === "/admin/careers" &&
        currentTab === "slots"
      );
    }

    return false;
  };

  const handleMarkAllRead = () => {
    setUnread(0);
  };

  const handleNavigate = (href: string) => {
    setMobileSidebarOpen(false);

    if (href === "/admin/careers?tab=applications") {
      navigate("/admin/careers?tab=applications");
    }

    else if (href === "/admin/careers?tab=slots") {
      navigate("/admin/careers?tab=slots");
    }

    else {
      navigate(href);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden font-sans">

      {/* ================= NOTIFICATION PERMISSION BANNER ================= */}
      {showPermissionBanner && (
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-2.5 bg-[#004689] text-white text-sm z-50">
          <span className="font-medium">
            🔔 Enable browser notifications to receive real-time alerts for new appointments and events.
          </span>
          <div className="flex items-center gap-3 sm:ml-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="px-4 py-1.5 rounded-lg bg-white text-[#004689] text-xs font-bold hover:bg-blue-50 transition-colors"
            >
              Enable Notifications
            </button>
            <button
              type="button"
              onClick={() => setShowPermissionBanner(false)}
              className="text-white/70 hover:text-white text-lg leading-none"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mobile header */}
      <div className="lg:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 z-30">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} className="text-[#004689]" />
        </button>
        <img
          src="/assets/wingsLogo.png"
          alt="WINGS"
          className="h-8 w-auto object-contain"
        />
        <button
          type="button"
          onClick={() => setShowNotifsPage(true)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-[#004689]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden relative">

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-20
          ${sidebarCollapsed ? "w-20" : "w-[280px]"}
          max-w-[85vw] lg:max-w-none
          bg-white border-r border-gray-100 flex flex-col
          transition-all duration-300 h-full
          flex-shrink-0 shadow-sm
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >

        {/* Logo */}

        <div
          className={`p-6 mb-2 flex items-center justify-between ${sidebarCollapsed ? "lg:justify-center" : ""
            }`}
        >
          <div className="flex items-center justify-start">
            <img
              src="/assets/wingsLogo.png"
              alt="Logo"
              className={`${sidebarCollapsed ? "h-8" : "h-14"
                } w-auto object-contain`}
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* MENU */}

        <div
          className="flex-1 overflow-y-auto px-4 space-y-7"
          style={{ scrollbarWidth: "none" }}
        >

          {/* Dashboard */}

        <div className="pt-2">
  <button
    onClick={() => navigate("/admin")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all relative ${
      isActive("/admin")
        ? "bg-blue-50 text-gray-900"  // Changed from font-[DM sans] to text-gray-900
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"  // Changed from text-gray-400 to text-gray-700
    }`}
  >
    {isActive("/admin") && (
      <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />
    )}

    <LayoutDashboard size={18} />

    {!sidebarCollapsed && <span>Dashboard</span>}
  </button>
</div>

          {/* MANAGE */}
<div className="space-y-1">

  {!sidebarCollapsed && (
    <h3 className="text-[20px] font-[DM Sans, sans-serif] text-blue-400 px-2 mb-3">
      Manage
    </h3>
  )}

  <button
    onClick={() => handleNavigate("/admin/team")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/team")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <Users size={18} />

    {!sidebarCollapsed && <span>Team Members</span>}
  </button>

  <button
    onClick={() => handleNavigate("/admin/articles")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/articles")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <FileText size={18} />

    {!sidebarCollapsed && <span>Articles</span>}
  </button>

  <button
    onClick={() => handleNavigate("/admin/careers")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/careers")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <Briefcase size={18} />

    {!sidebarCollapsed && <span>Careers</span>}
  </button>

  <button
    onClick={() => handleNavigate("/admin/events")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/events")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <Calendar size={18} />

    {!sidebarCollapsed && <span>Events</span>}
  </button>

  <button
    onClick={() => handleNavigate("/admin/counselling-types")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/counselling-types")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <Briefcase size={18} />

    {!sidebarCollapsed && <span>Services</span>}
  </button>

  {/* APPOINTMENTS */}

  <button
    onClick={() => handleNavigate("/admin/appointments")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/appointments")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <Calendar size={18} />

    {!sidebarCollapsed && <span>Appointments</span>}
  </button>

  <button
    onClick={() => handleNavigate("/admin/volunteers")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/volunteers")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <HeartHandshake size={18} />

    {!sidebarCollapsed && <span>Volunteers</span>}
  </button>

  <button
    onClick={() => handleNavigate("/admin/partners")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/partners")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <Handshake size={18} />

    {!sidebarCollapsed && <span>Partners</span>}
  </button>

  <button
    onClick={() => handleNavigate("/admin/testimonials")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/testimonials")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <MessageSquareQuote size={18} />

    {!sidebarCollapsed && <span>Testimonials</span>}
  </button>

  <button
    onClick={() => handleNavigate("/admin/social-media")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/social-media")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <Share2 size={18} />

    {!sidebarCollapsed && <span>Social Media Links</span>}
  </button>

  <button
    onClick={() => handleNavigate("/admin/visitors")}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("/admin/visitors")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <Users size={18} />

    {!sidebarCollapsed && <span>Visitors</span>}
  </button>
</div>

          {/* SETTINGS */}
<div className="space-y-1">

  {!sidebarCollapsed && (
    <h3 className="text-[20px] font-[DM Sans, sans-serif] text-blue-400 px-2 mb-3">
      Settings
    </h3>
  )}

  {/* <button
    type="button"
    onClick={async () => {
      if (notifPermission !== "granted") {
        await handleEnableNotifications();
      } else {
        setShowNotifsPage(true);
      }
    }}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      showNotifsPage
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
    title={
      notifPermission === "granted"
        ? "View notifications"
        : "Enable desktop notifications"
    }
  >
    <Bell size={18} />

    {!sidebarCollapsed && (
      <span className="flex-1 text-left">
        {notifPermission === "granted" ? "Notifications" : "Enable Notifications"}
      </span>
    )}

    {unread > 0 && (
      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
        {unread > 9 ? "9+" : unread}
      </span>
    )}
  </button> */}

  {/* Mails dropdown */}

 <div className="relative w-full" ref={emailsMenuRef}>
  <button
    type="button"
    onClick={() => {
      if (sidebarCollapsed) {
        handleNavigate("/admin/settings/primary-cc-mails");
      } else {
        setEmailsDropdownOpen((v) => !v);
      }
    }}
    className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] transition-all ${
      isActive("__emails_section__")
        ? "bg-blue-50 text-gray-900"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    {isActive("__emails_section__") && (
      <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#004689] rounded-r-full" />
    )}

    <Mail size={18} />

    {!sidebarCollapsed && (
      <>
        <span className="flex-1 text-left">Mails</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${emailsDropdownOpen ? "rotate-180" : ""}`}
        />
      </>
    )}
  </button>

  {!sidebarCollapsed && emailsDropdownOpen && (
    <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
      <button
        type="button"
        onClick={() => handleNavigate("/admin/settings/primary-cc-mails")}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[16px] transition-all ${
          isActive("/admin/settings/primary-cc-mails")
            ? "bg-blue-50 text-[#004689] font-medium"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        Mails
      </button>
      <button
        type="button"
        onClick={() => handleNavigate("/admin/settings/notify-mails")}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[16px] transition-all ${
          isActive("/admin/settings/notify-mails")
            ? "bg-blue-50 text-[#004689] font-medium"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        Notify mails
      </button>
    </div>
  )}
</div>
  {/* Logout */}

  <button
    onClick={logout}
    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[20px] text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
  >
    <LogOut size={18} />

    {!sidebarCollapsed && <span>Logout</span>}
  </button>

</div>
        </div>

        {/* Bottom */}

        <div className="flex-shrink-0 border-t border-gray-100 p-6 pt-4 space-y-4">

          <button
            onClick={() => window.open("/", "_blank")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
          >
            <Eye size={18} />

            {!sidebarCollapsed && <span>View Website</span>}
          </button>

          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-50">

              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#004689] font-bold shadow-sm">
                <User size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-800 truncate">
                  Administrator
                </div>

                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  Admin
                </div>
              </div>

            </div>
          ) : (
            <div className="flex justify-center p-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#004689] font-bold shadow-sm">
                <User size={18} />
              </div>
            </div>
          )}
        </div>

        {/* Collapse Button */}

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-[80px] w-6 h-6 bg-white border border-gray-100 rounded-full items-center justify-center shadow-md hover:bg-gray-50 transition-all z-30"
        >
          <ChevronRight
            size={12}
            className={`text-gray-400 transform transition-transform ${sidebarCollapsed ? "rotate-180" : ""
              }`}
          />
        </button>

      </aside>

      {/* MAIN */}

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      </div>{/* end flex row */}

      {/* Notifications Modal */}

      {showNotifsPage && (
        <NotificationsPage
          notifications={notifications}
          onClose={() => setShowNotifsPage(false)}
          onMarkRead={handleMarkAllRead}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}