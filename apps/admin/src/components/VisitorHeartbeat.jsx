import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

function getOrCreateVisitorId() {
  try {
    let id = localStorage.getItem("wings_visitor_id");
    if (!id) {
      id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("wings_visitor_id", id);
    }
    return id;
  } catch (_err) {
    return "v_temp_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
  }
}

function getOrCreateTabId() {
  try {
    let tabId = sessionStorage.getItem("wings_tab_id");
    if (!tabId) {
      tabId = "t_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
      sessionStorage.setItem("wings_tab_id", tabId);
    }
    return tabId;
  } catch (_err) {
    return "t_temp_" + Date.now().toString(36);
  }
}

function registerActiveTab(tabId) {
  try {
    const raw = localStorage.getItem("wings_active_tabs");
    const tabs = raw ? JSON.parse(raw) : {};
    tabs[tabId] = Date.now();
    localStorage.setItem("wings_active_tabs", JSON.stringify(tabs));
  } catch (_err) {}
}

function unregisterActiveTabAndCheckRemaining(tabId) {
  try {
    const raw = localStorage.getItem("wings_active_tabs");
    const tabs = raw ? JSON.parse(raw) : {};
    delete tabs[tabId];

    const now = Date.now();
    // Count tabs active within last 30s excluding current tab
    const remaining = Object.entries(tabs).filter(
      ([id, ts]) => id !== tabId && now - Number(ts) < 30000
    );

    localStorage.setItem("wings_active_tabs", JSON.stringify(tabs));
    return remaining.length;
  } catch (_err) {
    return 0;
  }
}

export function VisitorHeartbeat() {
  const [location] = useLocation();
  const heartbeatTimerRef = useRef(null);

  useEffect(() => {
    // Strictly do NOT track Admin Panel visits as public website visitors
    if (location.startsWith("/admin")) {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      return;
    }

    const visitorId = getOrCreateVisitorId();
    const tabId = getOrCreateTabId();
    const API_ROOT = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

    registerActiveTab(tabId);

    /* 1. IMMEDIATE JOIN */
    const sendJoin = async () => {
      const payload = JSON.stringify({ visitorId, timestamp: Date.now() });
      try {
        await fetch(`${API_ROOT}/api/visitors/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      } catch (_err) {}
    };

    /* 2. PERIODIC HEARTBEAT (BACKUP) */
    const sendHeartbeat = async () => {
      if (document.visibilityState === "hidden") return;
      registerActiveTab(tabId);

      const payload = JSON.stringify({ visitorId, timestamp: Date.now() });
      try {
        await fetch(`${API_ROOT}/api/visitors/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      } catch (_err) {}
    };

    /* 3. IMMEDIATE LEAVE (ON TAB CLOSE / LEAVE) */
    const sendLeaveSignal = () => {
      const remainingTabs = unregisterActiveTabAndCheckRemaining(tabId);
      // Only send leave signal if this was the last open tab for this visitor session
      if (remainingTabs === 0) {
        const url = `${API_ROOT}/api/visitors/leave`;
        const payload = JSON.stringify({ visitorId, timestamp: Date.now() });

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(url, blob);
        } else {
          try {
            fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: payload,
              keepalive: true,
            });
          } catch (_err) {}
        }
      }
    };

    // Send immediate Join signal on public site load
    sendJoin();

    // Start 15s backup heartbeat interval while tab is active
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setInterval(sendHeartbeat, 15000);

    // Page Visibility Handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        registerActiveTab(tabId);
        sendJoin();
        if (!heartbeatTimerRef.current) {
          heartbeatTimerRef.current = setInterval(sendHeartbeat, 15000);
        }
      } else {
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }
      }
    };

    // Pagehide / Unload Handler for immediate leave detection
    const handlePageHide = () => {
      sendLeaveSignal();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      sendLeaveSignal();
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [location]);

  return null;
}
