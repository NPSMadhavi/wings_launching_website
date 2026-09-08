import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import { Users, Activity, Calendar } from "lucide-react";
import SEO from "@/components/SEO";

const P = {
  card: "#ffffff",
  border: "#f1f5f9",
};

export default function VisitorsAdmin() {
  const [, navigate] = useLocation();
  const [stats, setStats] = useState({
    liveVisitors: 0,
    todayVisitors: 0,
    totalVisitors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const data = await api.fetchVisitorStats();
        if (isMounted && data) {
          setStats({
            liveVisitors: Number(data.liveVisitors || 0),
            todayVisitors: Number(data.todayVisitors || 0),
            totalVisitors: Number(data.totalVisitors || 0),
          });
        }
      } catch (_err) {
        // Silently handle polling errors
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    // Fast auto-update every 3 seconds for real-time live visitors tracking
    const interval = setInterval(fetchStats, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-[#f8fafc] font-sans">
      <SEO title="Visitors Statistics | WINGS Admin" noindex={true} />

      {/* Page Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          title="Go Back"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="#0D4A7A"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A]">
            Visitors
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time presence and unique visitor statistics for the public website.
          </p>
        </div>
      </div>

      {/* Visitor Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Live Visitors Card */}
        <div
          className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden transition-all"
          style={{ background: P.card, borderColor: P.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-md font-medium text-gray-600 tracking-wider">
                Live Visitors
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Activity size={20} />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-4xl md:text-5xl font-medium text-[#004689] tracking-tight">
              {loading ? "..." : stats.liveVisitors}
            </div>
          </div>
        </div>

        {/* Today's Visitors Card */}
        <div
          className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden transition-all"
          style={{ background: P.card, borderColor: P.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-md font-medium text-gray-600 tracking-wider">
                Today's Visitors
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Calendar size={20} />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-4xl md:text-5xl font-medium text-[#004689] tracking-tight">
              {loading ? "..." : stats.todayVisitors.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Total Unique Visitors Card */}
        <div
          className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden transition-all"
          style={{ background: P.card, borderColor: P.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-md font-medium text-gray-600 tracking-wider">
                Total Unique Visitors
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#004689]">
              <Users size={20} />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-4xl md:text-5xl font-medium text-[#004689] tracking-tight">
              {loading ? "..." : stats.totalVisitors.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
