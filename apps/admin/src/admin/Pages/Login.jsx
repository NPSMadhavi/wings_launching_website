import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [p, setP] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);
    setErr("");

    try {
      const res = await api.login(email.trim(), p);
      login(res.token, res.user);

      if (res.user && !res.user.isSuperAdmin && Array.isArray(res.user.sections) && !res.user.sections.includes("all")) {
        if (!res.user.sections.includes("dashboard")) {
          const sectionPathMap = {
            team: "/admin/team",
            articles: "/admin/articles",
            careers: "/admin/careers",
            events: "/admin/events",
            services: "/admin/counselling-types",
            appointments: "/admin/appointments",
            volunteers: "/admin/volunteers",
            partners: "/admin/partners",
            testimonials: "/admin/testimonials",
            "social-media": "/admin/social-media",
            "user-management": "/admin/user-management",
            visitors: "/admin/visitors",
            mails: "/admin/settings/primary-cc-mails",
          };
          const firstAllowed = res.user.sections.map((s) => sectionPathMap[s]).filter(Boolean)[0];
          if (firstAllowed) {
            navigate(firstAllowed);
            return;
          }
        }
      }

      navigate("/admin");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (/invalid credentials/i.test(msg)) {
        setErr("Invalid email or password");
      } else if (/failed to fetch|network|load failed/i.test(msg) || !msg) {
        setErr("Cannot reach server. Make sure the API is running on port 5001.");
      } else {
        setErr(msg || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{ fontFamily: "'Nunito',sans-serif" }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/assets/hero-video.mp4"
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,20,50,0.80) 0%, rgba(0,70,137,0.60) 100%)",
        }}
      />

      <div
        className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-white"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27400%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.75%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix type=%27saturate%27 values=%270%27/%3E%3C/filter%3E%3Crect width=%27400%27 height=%27400%27 filter=%27url(%23noise)%27 opacity=%270.04%27/%3E%3C/svg%3E')",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            height: 5,
            background: "linear-gradient(90deg, #004689, #1d4ed8, #004689)",
          }}
        />

        <div className="pt-8 pb-6 px-8 text-center border-b border-gray-100">
          <img
            src="/assets/wingsLogo.png"
            alt="WINGS"
            className="h-14 mx-auto mb-4"
          />
          <h1 className="text-xl font-extrabold text-[#004689]">
            Admin Portal
          </h1>
          <p className="text-xs text-gray-500 font-semibold">
            WINGS Counselling Centre
          </p>
        </div>

        <div className="px-8 pt-6 pb-4">
          <div className="text-center mb-5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900">
            <p className="text-white text-xs font-bold uppercase tracking-widest">
              Secure Login
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold mb-1 block text-gray-600 uppercase">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block text-gray-600 uppercase">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-3 text-gray-400"
                />

                <input
                  type={showPw ? "text" : "password"}
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-semibold bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter password"
                />

                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {err && (
              <div className="text-red-600 text-xs font-semibold bg-red-50 border border-red-200 p-2 rounded-lg text-center">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm mt-2 bg-gradient-to-r from-blue-700 to-blue-900 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="px-8 py-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">
            WINGS Counselling Centre © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
