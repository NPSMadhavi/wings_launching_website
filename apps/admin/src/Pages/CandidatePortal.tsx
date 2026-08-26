import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Briefcase, X, Eye, EyeOff, Upload,
  Mail, Lock, Phone, FileText, DollarSign, Building2,
  AlertCircle, User, LogOut, ClipboardList, ExternalLink,
  RefreshCw, Bell, BellRing, ArrowRight, Info,
  ChevronRight, Home, ChevronLeft, Send,
} from "lucide-react";
import {
  SiteMapPinIcon,
  SiteCalendarIcon,
  SiteClockIcon,
  SiteCheckIcon,
} from "@/components/ui/SiteIcons";

import { FaLinkedin } from "react-icons/fa";
import { useCandidateAuth, candidateLogin, candidateRegister } from "../context/CandidateAuthContext";
import { parseInterviewBookingApplicationId } from "@/lib/candidate-portal-routes";
import { Footer } from "@/components/Layout/Footer";
import SEO from "@/components/SEO";

const BASE = "/api";

/* ─── Types ───────────────────────────────────────────────────────────── */
interface Job {
  id: number;
  jobId?: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  employmentType: string;
  salaryRange?: string;
  postedAt?: string;
  closesAt?: string;
}

interface CandidateApp {
  id: number;
  applicationNumber: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  jobId?: number;
  jobTitle?: string;
  jobDepartment?: string;
  jobLocation?: string;
  jobEmploymentType?: string;
  jobRef?: string;
  adminNotes?: string;
  interview?: {
    date: string; timeSlot: string; duration: number;
    interviewerName: string; location: string; meetingLink: string;
  } | null;
}

interface InterviewAvailability {
  id: number;
  date: string;
  timeSlot: string;
  duration: number;
  interviewerName: string;
  location: string;
  meetingLink: string;
  notes: string;
}

interface CandidateNotification {
  id: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
  read: boolean;
}

const QUALIFICATIONS = ["Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Certificate", "Other"];
const NOTICE_PERIODS = ["Immediately", "1 week", "2 weeks", "1 month", "2 months", "3 months", "Negotiable"];
const EXPERIENCE = ["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"];
const SPECIALISATIONS_LIST = ["Individual Counselling", "Couples Counselling", "Family Therapy", "Child & Adolescent", "Trauma & PTSD", "Grief & Loss", "Anxiety & Depression", "Career Counselling", "Crisis Intervention", "Other"];

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: "Submitted", color: "#3b82f6", bg: "#eff6ff" },
  under_review: { label: "Under Review", color: "#f59e0b", bg: "#fffbeb" },
  shortlisted: { label: "Shortlisted", color: "#10b981", bg: "#ecfdf5" },
  not_shortlisted: { label: "Not Shortlisted", color: "#ef4444", bg: "#fef2f2" },
  interview_scheduled: { label: "Interview Scheduled", color: "#8b5cf6", bg: "#f5f3ff" },
  hired: { label: "Hired", color: "#059669", bg: "#d1fae5" },
  withdrawn: { label: "Withdrawn", color: "#94a3b8", bg: "#f8fafc" },
};

function normalizeApplicationStatus(status: string): string {
  return status.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

const BOOKABLE_INTERVIEW_STATUSES = new Set([
  "shortlisted",
  "round_1_selected",
  "round_2_selected",
  "reschedule_interview",
  "reschedule_round_1",
  "reschedule_round_2",
  "reschedule_round_3",
]);

function canBookInterview(status: string): boolean {
  return BOOKABLE_INTERVIEW_STATUSES.has(normalizeApplicationStatus(status));
}

function isInterviewScheduledStatus(status: string): boolean {
  const key = normalizeApplicationStatus(status);
  return new Set([
    "interview_scheduled",
    "round_1_scheduled",
    "round_1_confirmed",
    "round_2_scheduled",
    "round_2_confirmed",
    "round_3_scheduled",
    "round_3_confirmed",
  ]).has(key);
}

function hasCompletedInterviewBooking(app: CandidateApp): boolean {
  return Boolean(app.interview?.date && app.interview?.timeSlot) || isInterviewScheduledStatus(app.status);
}

function interviewBookingStorageKey(applicationId: number): string {
  return `wings-interview-booked-${applicationId}`;
}

function readStoredBookedSlot(applicationId: number): { date: string; timeSlot: string } | null {
  try {
    const raw = sessionStorage.getItem(interviewBookingStorageKey(applicationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.date && parsed?.timeSlot) return { date: parsed.date, timeSlot: parsed.timeSlot };
  } catch { /* ignore */ }
  return null;
}

function persistBookedSlot(applicationId: number, info: { date: string; timeSlot: string }) {
  try {
    sessionStorage.setItem(interviewBookingStorageKey(applicationId), JSON.stringify(info));
  } catch { /* ignore */ }
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const key = normalizeApplicationStatus(status);
  const s = STATUS[key] ?? STATUS.submitted;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: s.color, background: s.bg }}>{s.label}</span>
  );
}

/* ─── Application Journey Tracker ─────────────────────────────────────── */
const JOURNEY_STEPS = [
  { key: "submitted", label: "Applied", sub: "" },
  { key: "under_review", label: "Under Review", sub: "" },
  { key: "shortlisted", label: "Shortlisted", sub: "" },
  { key: "interview_scheduled", label: "Interview", sub: "Scheduled" },
  { key: "hired", label: "Hired", sub: "Offer Extended" },
];

const JOURNEY_MESSAGES: Record<string, string> = {
  submitted: "Your application has been received. We'll be in touch soon.",
  under_review: "Our team is currently reviewing your application.",
  shortlisted: "Congratulations! You've been shortlisted. Please schedule your interview.",
  interview_scheduled: "Your interview has been confirmed. Check the details below.",
  hired: "Welcome to the team! Please check your email for next steps.",
  not_shortlisted: "Thank you for applying. Unfortunately, you were not shortlisted this time.",
  withdrawn: "You have withdrawn this application.",
};

function ApplicationJourney({ status }: { status: string }) {
  const normalized = normalizeApplicationStatus(status);
  const isFailed = normalized === "not_shortlisted" || normalized.includes("not_selected");
  const isWithdrawn = normalized === "withdrawn" || normalized === "withdrawn_by_candidate";
  const isFinal = isFailed || isWithdrawn;

  const journeyKey =
    canBookInterview(status) ? "shortlisted"
    : isInterviewScheduledStatus(status) ? "interview_scheduled"
    : normalized;

  const currentIdx = isFailed ? 1 : isWithdrawn ? 0
    : Math.max(0, JOURNEY_STEPS.findIndex(s => s.key === journeyKey));

  const msg = JOURNEY_MESSAGES[journeyKey] ?? JOURNEY_MESSAGES.submitted;

  return (
    <div className="mt-4 rounded-2xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-1">
        <SiteCalendarIcon size={12} color="#94a3b8" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
          Application Journey
        </span>
      </div>

      {/* Stepper */}
      <div className="px-3 sm:px-5 pt-4 pb-3 overflow-x-auto">

        {/* Row 1: circles connected by lines */}
        <div className="flex items-center w-full min-w-[280px]">
          {JOURNEY_STEPS.map((step, i) => {
            const isDone = !isFinal && i < currentIdx;
            const isActive = !isFinal && i === currentIdx;
            const isFail = isFinal && i === currentIdx;
            const nodeBg = isDone ? "#10b981" : isActive ? "#10b981" : isFail ? (isWithdrawn ? "#94a3b8" : "#ef4444") : "#e2e8f0";
            const nodeClr = isDone || isActive || isFail ? "white" : "#94a3b8";
            const lineClr = isDone ? "#10b981" : "#e2e8f0";

            return (
              <div key={step.key} className="contents">
                {/* Node */}
                <div className="relative shrink-0" style={{ width: 32, height: 32 }}>
                  {/* Ping ring — centered on the circle, slow pulse */}
                  {isActive && (
                    <span className="absolute rounded-full"
                      style={{
                        width: 50, height: 50,
                        top: "50%", left: "50%",
                        marginTop: -25, marginLeft: -25,
                        background: "#10b981",
                        opacity: 0.25,
                        animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
                      }} />
                  )}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center relative"
                    style={{
                      background: nodeBg, color: nodeClr, zIndex: 1,
                      boxShadow: isActive ? "0 0 0 4px rgba(16,185,129,0.15)" : "none"
                    }}>
                    {isDone
                      ? <SiteCheckIcon size={14} color="white" />
                      : isFail && !isWithdrawn
                        ? <X size={14} />
                        : isWithdrawn && isFail
                          ? <span className="text-xs font-black">—</span>
                          : <span className="text-xs font-black">{i + 1}</span>
                    }
                  </div>
                </div>

                {/* Connector to next node */}
                {i < JOURNEY_STEPS.length - 1 && (
                  <div className="flex-1" style={{ height: 2, background: lineClr }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Row 2: labels aligned under each circle via justify-between */}
        <div className="flex justify-between mt-2 min-w-[280px]">
          {JOURNEY_STEPS.map((step, i) => {
            const isDone = !isFinal && i < currentIdx;
            const isActive = !isFinal && i === currentIdx;
            const isFail = isFinal && i === currentIdx;
            const labelClr = isDone || isActive ? "#059669" : isFail ? (isWithdrawn ? "#94a3b8" : "#ef4444") : "#94a3b8";
            return (
              <div key={step.key} className="flex flex-col items-center text-center flex-1 min-w-0 px-0.5">
                <p className="text-[8px] sm:text-[9px] font-extrabold leading-tight break-words" style={{ color: labelClr }}>
                  {step.label}
                </p>
                {step.sub && (
                  <p className="text-[8px] leading-tight mt-0.5" style={{ color: "#cbd5e1" }}>{step.sub}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <div className="px-5 pb-4 -mt-1">
          <p className="text-xs font-semibold leading-relaxed"
            style={{ color: isFailed ? "#ef4444" : isWithdrawn ? "#94a3b8" : status === "hired" ? "#059669" : "#004689" }}>
            {msg}
          </p>
        </div>
      )}
    </div>
  );
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch { /* ignore */ }
}

/* ─── Auth Page ───────────────────────────────────────────────────────── */
function AuthPage({ onSuccess, subtitle }: { onSuccess: () => void; subtitle?: string }) {
  const { login } = useCandidateAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", phone: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        const { token, candidate } = await candidateLogin(form.email, form.password);
        login(token, candidate);
      } else {
        const { token, candidate } = await candidateRegister({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone });
        login(token, candidate);
      }
      onSuccess();
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong");
    } finally { setLoading(false); }
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#004689] focus:border-transparent transition-all";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #001f4d 0%, #003a80 45%, #004689 100%)", fontFamily: "'Nunito',sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm" style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
            <img src="./public/assets/wingsLogo.png" alt="WINGS" className="h-7" />
          </div>
          <div className="h-5 w-px bg-white/20" />
          <span className="text-white/70 text-sm font-semibold">Candidate Portal</span>
        </div>
        <button onClick={() => navigate("/careers")}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-semibold transition-colors">
          <ChevronLeft size={15} /> Back to Careers
        </button>
      </div>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">
          {/* Card header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <User size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-1">Candidate Portal</h1>
            <p className="text-blue-200 text-sm">{subtitle ?? "Sign in or create an account to apply for roles at WINGS"}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {(["login", "register"] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setErr(""); }}
                  className="flex-1 py-4 text-sm font-bold transition-all"
                  style={{ borderBottom: mode === m ? "2px solid #004689" : "2px solid transparent", color: mode === m ? "#004689" : "#9ca3af" }}>
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">First Name *</label>
                    <input className={inp} value={form.firstName} onChange={e => set("firstName", e.target.value)} required placeholder="First name" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Last Name *</label>
                    <input className={inp} value={form.lastName} onChange={e => set("lastName", e.target.value)} required placeholder="Last name" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Email Address *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" className={`${inp} pl-10`} value={form.email} onChange={e => set("email", e.target.value)} required placeholder="your@email.com" />
                </div>
              </div>
              {mode === "register" && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className={`${inp} pl-10`} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+65 9123 4567" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Password *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPw ? "text" : "password"} className={`${inp} pl-10 pr-11`} value={form.password} onChange={e => set("password", e.target.value)} required minLength={6} placeholder="At least 6 characters" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {err && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-sm font-semibold">{err}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-extrabold text-white text-sm transition-all mt-1"
                style={{ background: loading ? "#93b4d4" : "#004689" }}>
                {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account & Continue"}
              </button>
            </form>
          </div>

          <p className="text-center text-blue-200/60 text-xs mt-6">
            WINGS Counselling Centre — A Community Project of Ramakrishna Mission
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Apply Modal ─────────────────────────────────────────────────────── */
function ApplyModal({ job, token, onClose }: { job: Job; token: string; onClose: (appNumber?: string) => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [appNumber, setAppNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    coverLetter: "", currentEmployer: "", yearsExperience: EXPERIENCE[0],
    highestQualification: QUALIFICATIONS[0], linkedinUrl: "",
    noticePeriod: NOTICE_PERIODS[0], expectedSalary: "",
    specialisations: [] as string[],
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  function toggleSpec(s: string) {
    setForm(f => ({ ...f, specialisations: f.specialisations.includes(s) ? f.specialisations.filter(x => x !== s) : [...f.specialisations, s] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (Array.isArray(v)) fd.append(k, JSON.stringify(v)); else fd.append(k, v as string); });
      if (resumeFile) fd.append("resume", resumeFile);
      const res = await fetch(`${BASE}/jobs/${job.id}/apply`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Submission failed"); }
      const data = await res.json();
      setAppNumber(data.applicationNumber);
      setStep("success");
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong");
    } finally { setLoading(false); }
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#004689] focus:border-transparent transition-all";
  const lbl = "text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block";

  if (step === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(0,70,137,0.1)" }}>
            <SiteCheckIcon size={32} color="#004689" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">Thank you for applying for <strong>{job.title}</strong>. We've sent a confirmation to your email.</p>
          <div className="rounded-xl p-5 mb-6" style={{ background: "#f0f4f8" }}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Your Application Number</p>
            <p className="text-2xl font-extrabold tracking-wider" style={{ color: "#004689" }}>{appNumber}</p>
            <p className="text-xs text-gray-500 mt-1">Save this for your reference</p>
          </div>
          <button onClick={() => onClose(appNumber)} className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: "#004689" }}>
            View My Applications
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <div>
            <h2 className="font-extrabold text-lg text-gray-800">Apply for {job.title}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              {job.jobId && <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "rgba(0,70,137,0.08)", color: "#004689" }}>{job.jobId}</span>}
              <span className="text-xs text-gray-500">{job.department} · {job.employmentType}</span>
            </div>
          </div>
          <button onClick={() => onClose()} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 flex flex-col gap-5">
          <div>
            <h3 className="text-sm font-extrabold text-gray-700 mb-3 pb-2 border-b border-gray-100">Professional Background</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Current / Most Recent Employer</label>
                <div className="relative"><Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className={`${inp} pl-10`} value={form.currentEmployer} onChange={e => set("currentEmployer", e.target.value)} placeholder="Organisation name" /></div>
              </div>
              <div>
                <label className={lbl}>Years of Experience</label>
                <select className={inp} value={form.yearsExperience} onChange={e => set("yearsExperience", e.target.value)}>{EXPERIENCE.map(v => <option key={v}>{v}</option>)}</select>
              </div>
              <div>
                <label className={lbl}>Highest Qualification</label>
                <select className={inp} value={form.highestQualification} onChange={e => set("highestQualification", e.target.value)}>{QUALIFICATIONS.map(v => <option key={v}>{v}</option>)}</select>
              </div>
              <div>
                <label className={lbl}>Notice Period</label>
                <select className={inp} value={form.noticePeriod} onChange={e => set("noticePeriod", e.target.value)}>{NOTICE_PERIODS.map(v => <option key={v}>{v}</option>)}</select>
              </div>
              <div>
                <label className={lbl}>Expected Salary (SGD)</label>
                <div className="relative"><DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className={`${inp} pl-10`} value={form.expectedSalary} onChange={e => set("expectedSalary", e.target.value)} placeholder="e.g. SGD 5,000 / month" /></div>
              </div>
              <div>
                <label className={lbl}>LinkedIn Profile</label>
                <div className="relative"><Linkedin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className={`${inp} pl-10`} value={form.linkedinUrl} onChange={e => set("linkedinUrl", e.target.value)} placeholder="linkedin.com/in/..." /></div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-700 mb-3 pb-2 border-b border-gray-100">Areas of Specialisation</h3>
            <div className="flex flex-wrap gap-2">
              {SPECIALISATIONS_LIST.map(s => (
                <button key={s} type="button" onClick={() => toggleSpec(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{ background: form.specialisations.includes(s) ? "rgba(0,70,137,0.1)" : "white", borderColor: form.specialisations.includes(s) ? "#004689" : "#e5e7eb", color: form.specialisations.includes(s) ? "#004689" : "#6b7280" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-700 mb-3 pb-2 border-b border-gray-100">Resume / CV *</h3>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setResumeFile(e.target.files?.[0] ?? null)} />
            {resumeFile ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50">
                <FileText size={18} className="text-green-600" />
                <span className="text-sm font-semibold text-green-700 flex-1 truncate">{resumeFile.name}</span>
                <button type="button" onClick={() => setResumeFile(null)} className="text-green-500 hover:text-green-700"><X size={14} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#004689] hover:bg-blue-50/30 transition-all">
                <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-semibold text-gray-500">Click to upload PDF, DOC or DOCX</p>
                <p className="text-xs text-gray-400 mt-1">Max 10 MB</p>
              </button>
            )}
          </div>
          <div>
            <label className={lbl}>Cover Letter (optional)</label>
            <textarea rows={4} className={inp} value={form.coverLetter} onChange={e => set("coverLetter", e.target.value)} placeholder="Tell us why you're interested in this role at WINGS…" />
          </div>
          {err && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-sm font-semibold">{err}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => onClose()} className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl text-sm font-extrabold text-white transition-all" style={{ background: loading ? "#93b4d4" : "#004689" }}>
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Time helpers ────────────────────────────────────────────────────── */
function formatTimeSlotDisplay(timeSlot: string): string {
  const trimmed = timeSlot.trim();
  if (/\s(AM|PM)$/i.test(trimmed)) return trimmed;
  const [hoursRaw, minutesRaw = "00"] = trimmed.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours)) return trimmed;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function parseTimeToMinutes(timeSlot: string): number {
  const trimmed = timeSlot.trim();
  if (/\s(AM|PM)$/i.test(trimmed)) {
    const [time, period] = trimmed.split(/\s+/);
    let [h, m] = time.split(":").map(Number);
    if (period.toUpperCase() === "PM" && h !== 12) h += 12;
    if (period.toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + (m || 0);
  }
  const [h, m] = trimmed.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatInterviewDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── Schedule Interview Modal ────────────────────────────────────────── */
const CANDIDATE_TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
];

function ScheduleInterviewModal({ appId, token, onBooked, onClose, embedded = false, pageLayout = false, jobTitle, candidateName, applicationNumber, jobRef }: {
  appId: number; token: string;
  onBooked: (info?: { date: string; timeSlot: string }) => void;
  onClose: () => void; embedded?: boolean;
  pageLayout?: boolean;
  jobTitle?: string;
  candidateName?: string;
  applicationNumber?: string;
  jobRef?: string | null;
}) {
  const [tab, setTab] = useState<"slots" | "custom">("slots");
  const [slots, setSlots] = useState<InterviewAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [activeDate, setActiveDate] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [customSending, setCustomSending] = useState(false);
  const [customSent, setCustomSent] = useState(false);
  const [justBooked, setJustBooked] = useState<{ date: string; timeSlot: string } | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetch(`${BASE}/candidate/interview-availability?applicationId=${appId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          setError(typeof err.error === "string" ? err.error : "Unable to load interview slots.");
          setLoading(false);
          return;
        }
        const d = await r.json();
        const list = Array.isArray(d) ? d : [];
        const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
        const filtered = list.filter((s: InterviewAvailability) => {
          if (s.date !== todayStr) return true;
          return parseTimeToMinutes(s.timeSlot) > nowMins;
        });
        setSlots(filtered);
        const dates = [...new Set(filtered.map((s: InterviewAvailability) => s.date))].sort();
        if (dates.length > 0) setActiveDate(dates[0]);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load interview slots. Please refresh the page.");
        setLoading(false);
      });
  }, [token, todayStr, appId]);

  // group and sort
  const grouped: Record<string, InterviewAvailability[]> = {};
  for (const s of slots) {
    (grouped[s.date] = grouped[s.date] ?? []).push(s);
  }
  const sortedDates = Object.keys(grouped).sort();
  const activeDateSlots = (grouped[activeDate] ?? []).slice().sort(
    (a, b) => parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot)
  );

  const selectedSlot = slots.find(s => s.id === selected);

  async function book() {
    if (!selected) return;
    setBooking(true); setError("");
    const bookedId = selected;
    try {
      const r = await fetch(`${BASE}/candidate/applications/${appId}/book-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ availabilityId: bookedId }),
      });
      if (!r.ok) { const e = await r.json(); setError(e.error ?? "Booking failed"); setBooking(false); return; }
      const bookedSlotInfo = selectedSlot ? { date: selectedSlot.date, timeSlot: selectedSlot.timeSlot } : undefined;
      setSlots((prev) => prev.filter((s) => s.id !== bookedId));
      setSelected(null);
      if (bookedSlotInfo) setJustBooked(bookedSlotInfo);
      onBooked(bookedSlotInfo);
    } catch { setError("Network error. Please try again."); setBooking(false); }
  }

  async function sendCustomRequest() {
    if (!customDate || !customTime) return;
    setCustomSending(true); setError("");
    try {
      const r = await fetch(`${BASE}/candidate/applications/${appId}/request-interview-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferredDate: customDate, preferredTimeSlot: customTime, notes: customNotes }),
      });
      if (!r.ok) { const e = await r.json(); setError(e.error ?? "Request failed"); setCustomSending(false); return; }
      setCustomSent(true);
    } catch { setError("Network error. Please try again."); }
    finally { setCustomSending(false); }
  }

  const panel = pageLayout ? (
    justBooked ? (
      <div className="w-full max-w-[560px] mx-auto rounded-[20px] bg-white shadow-[0_4px_4px_rgba(0,0,0,0.10)] px-6 md:px-10 py-10 md:py-12 text-center">
        <SiteCheckIcon size={52} color="#22c55e" className="mx-auto mb-5" />
        <h2 className="text-[#0D4A7A] font-['Outfit'] text-[28px] md:text-[32px] font-medium mb-3">Interview slot confirmed!</h2>
        <p className="text-[#0D4A7A]/80 font-['DM_Sans'] text-[16px] mb-2 leading-relaxed">
          Your interview{jobTitle ? <> for <strong>{jobTitle}</strong></> : ""} has been successfully booked.
        </p>
        <p className="text-gray-600 font-['DM_Sans'] text-[15px] mb-6">
          {formatInterviewDate(justBooked.date)} · {formatTimeSlotDisplay(justBooked.timeSlot)}
        </p>
        <p className="text-sm text-gray-500 font-['DM_Sans'] leading-relaxed max-w-md mx-auto">
          A confirmation email has been sent to your registered email address. Our team has also been notified.
        </p>
      </div>
    ) : (
    <div className="w-full flex flex-col gap-10 md:gap-[70px]">
      {/* Blue information box — matches apply.tsx sign-in card */}
      <div className="w-full max-w-[500px] mx-auto bg-[#0D4A7A] rounded-[20px] shadow-[0_20px_50px_rgba(13,74,122,0.15)] text-white overflow-hidden transition-all duration-300 hover:shadow-[0_25px_60px_rgba(13,74,122,0.25)] px-6 sm:px-8 py-10 sm:py-12 flex flex-col items-center text-center">
        <div className="w-[50px] h-[50px] bg-white rounded-[10px] flex items-center justify-center shadow-sm mb-6">
          <SiteCalendarIcon size={20} color="#0D4A7A" />
        </div>
        <h2 className="text-[25px] font-semibold tracking-tight leading-[33px] font-['DM_Sans'] mb-4">
          Interview Slot Booking
        </h2>
        <p className="text-[16px] text-white/90 font-normal leading-[21px] font-['DM_Sans'] max-w-[370px] mb-4">
          You have been invited to book an interview slot for{" "}
          <strong className="font-semibold text-white">{jobTitle ?? "your application"}</strong>
          {candidateName ? (
            <>
              . Welcome, <strong className="font-semibold text-white">{candidateName}</strong>.
            </>
          ) : (
            " at WINGS Counselling Centre."
          )}
        </p>
        <p className="text-[14px] text-white/75 font-normal leading-[20px] font-['DM_Sans'] max-w-[370px]">
          Select an available date and time below, then click <strong className="text-white">Book Slot</strong> to confirm. A confirmation email will be sent once complete.
        </p>
        {(jobRef || applicationNumber) && (
          <div className="mt-6 inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/15 border border-white/25">
            <span className="text-white/90 font-['DM_Sans'] text-[13px] font-medium">
              {jobRef ? `Job ID ${jobRef}` : applicationNumber}
              {jobRef && applicationNumber ? ` · ${applicationNumber}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Available slots section */}
      <div className="w-full rounded-[20px] bg-white shadow-[0_4px_4px_rgba(0,0,0,0.10)] px-6 md:px-8 py-7 md:py-9">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-[#0D4A7A] font-['Outfit'] text-[28px] md:text-[35px] font-medium leading-normal mb-2">
              Available Interview Slots
            </h3>
            <p className="text-[#0D4A7A] font-['DM_Sans'] text-[16px] md:text-[20px] font-medium leading-normal">
              Choose a convenient date and time
            </p>
          </div>
          <div className="flex rounded-[20px] p-1 bg-[#F8F8F8] border border-[#D9D9D9] w-fit">
            {(["slots", "custom"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-[16px] text-sm font-['DM_Sans'] font-medium transition-all ${
                  tab === t ? "bg-[#0D4A7A] text-white" : "text-[#000000CC] hover:bg-[#0D4A7A]/10"
                }`}
              >
                {t === "slots" ? "Available Slots" : "Request Custom Time"}
              </button>
            ))}
          </div>
        </div>

        {tab === "slots" && (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 rounded-[20px] bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="text-center py-12 px-4">
              <SiteCalendarIcon size={40} color="#d1d5db" className="mx-auto mb-4" />
              <p className="font-['DM_Sans'] text-lg font-medium text-gray-800 mb-2">No slots available yet</p>
              <p className="text-sm text-gray-500 mb-5 font-['DM_Sans']">Our team is finalising interview times. You can request a custom time instead.</p>
              <button onClick={() => setTab("custom")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[20px] bg-[#0D4A7A] text-white text-sm font-medium font-['DM_Sans']">
                Request custom time <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-['DM_Sans'] mb-3">Select a date</p>
                <div className="flex gap-3 flex-wrap">
                  {sortedDates.map((date) => {
                    const d = new Date(`${date}T00:00:00`);
                    const isActive = date === activeDate;
                    const isToday = date === todayStr;
                    return (
                      <button
                        key={date}
                        onClick={() => { setActiveDate(date); setSelected(null); }}
                        className={`flex flex-col items-center min-w-[76px] px-4 py-3 rounded-[16px] border transition-all font-['DM_Sans'] ${
                          isActive
                            ? "bg-[#0D4A7A] border-[#0D4A7A] text-white shadow-md"
                            : "bg-[#F8F8F8] border-[#D9D9D9] text-gray-800 hover:border-[#0D4A7A]"
                        }`}
                      >
                        <span className={`text-[10px] font-semibold uppercase ${isActive ? "text-white/80" : "text-gray-500"}`}>
                          {isToday ? "Today" : d.toLocaleDateString("en-SG", { weekday: "short" })}
                        </span>
                        <span className="text-2xl font-bold leading-tight">{d.getDate()}</span>
                        <span className={`text-[10px] ${isActive ? "text-white/70" : "text-gray-500"}`}>
                          {d.toLocaleDateString("en-SG", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeDate && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-['DM_Sans'] mb-3">
                    Select a time · <span className="text-[#0D4A7A]">{activeDateSlots.length} available</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {activeDateSlots.map((slot) => {
                      const isSelected = selected === slot.id;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelected(isSelected ? null : slot.id)}
                          className={`rounded-[20px] px-4 py-5 text-left transition-all border font-['DM_Sans'] ${
                            isSelected
                              ? "bg-[#0D4A7A] border-[#0D4A7A] text-white shadow-[0_4px_12px_rgba(13,74,122,0.25)]"
                              : "bg-white border-[#D9D9D9] hover:border-[#0D4A7A] hover:shadow-sm"
                          }`}
                        >
                          <SiteClockIcon size={14} color={isSelected ? "rgba(255,255,255,0.7)" : "#0D4A7A"} className="mb-2" />
                          <p className={`text-base font-semibold ${isSelected ? "text-white" : "text-gray-900"}`}>
                            {formatTimeSlotDisplay(slot.timeSlot)}
                          </p>
                          <p className={`text-xs mt-1 ${isSelected ? "text-white/70" : "text-gray-500"}`}>
                            {slot.duration} min
                            {slot.interviewerName ? ` · ${slot.interviewerName}` : ""}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )
        )}

        {tab === "custom" && (
          customSent ? (
            <div className="text-center py-12">
              <SiteCheckIcon size={48} color="#22c55e" className="mx-auto mb-4" />
              <p className="font-['DM_Sans'] text-lg font-medium text-gray-800 mb-2">Request sent!</p>
              <p className="text-sm text-gray-500 font-['DM_Sans']">Our team will review your preferred time and confirm via email.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-w-xl">
              <div className="rounded-[16px] p-4 bg-amber-50 border border-amber-200 flex gap-3">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-['DM_Sans']">None of the listed slots work? Tell us your preferred date and time.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-2 font-['DM_Sans']">Preferred date *</label>
                  <input type="date" min={todayStr} value={customDate} onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full rounded-[12px] border border-[#D9D9D9] px-3 py-2.5 text-sm font-['DM_Sans']" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-2 font-['DM_Sans']">Preferred time *</label>
                  <select value={customTime} onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full rounded-[12px] border border-[#D9D9D9] px-3 py-2.5 text-sm font-['DM_Sans']">
                    <option value="">Select time…</option>
                    {CANDIDATE_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-2 font-['DM_Sans']">Notes (optional)</label>
                <textarea rows={3} value={customNotes} onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. I'm only available in the mornings…"
                  className="w-full rounded-[12px] border border-[#D9D9D9] px-3 py-2.5 text-sm font-['DM_Sans'] resize-none" />
              </div>
              <button onClick={sendCustomRequest} disabled={!customDate || !customTime || customSending}
                className="inline-flex items-center justify-center gap-2 self-start px-6 py-3 rounded-[20px] bg-[#0D4A7A] text-white text-sm font-medium font-['DM_Sans'] disabled:opacity-50">
                {customSending ? "Sending…" : <><Send size={14} /> Send request</>}
              </button>
            </div>
          )
        )}

        {error && (
          <p className="mt-4 text-sm font-medium px-4 py-3 rounded-[12px] bg-red-50 text-red-600 border border-red-100 font-['DM_Sans']">{error}</p>
        )}
      </div>

      {/* Selected summary + book */}
      {tab === "slots" && selectedSlot && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] bg-white shadow-[0_4px_4px_rgba(0,0,0,0.10)] px-6 md:px-8 py-7"
        >
          <h3 className="text-[#0D4A7A] font-['Outfit'] text-[20px] font-medium mb-4">Selected Slot Summary</h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0D4A7A]/10 flex items-center justify-center shrink-0">
                <SiteCalendarIcon size={18} color="#0D4A7A" />
              </div>
              <div>
                <p className="font-['DM_Sans'] font-semibold text-gray-900">{formatInterviewDate(selectedSlot.date)}</p>
                <p className="text-sm text-gray-600 font-['DM_Sans'] mt-1">
                  {formatTimeSlotDisplay(selectedSlot.timeSlot)} · {selectedSlot.duration} minutes
                </p>
                {selectedSlot.location && (
                  <p className="text-sm text-gray-500 font-['DM_Sans'] mt-1 flex items-center gap-1">
                    <SiteMapPinIcon size={12} color="#6b7280" /> {selectedSlot.location}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={book}
              disabled={booking}
              className="inline-flex items-center justify-center gap-2 min-w-[200px] h-[46px] px-8 rounded-full bg-[#0D4A7A] text-white font-['DM_Sans'] text-[16px] font-medium hover:bg-[#0a3d66] transition-colors disabled:opacity-60 w-full sm:w-auto shadow-[0_4px_12px_rgba(13,74,122,0.25)]"
            >
              {booking ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Booking…</>
              ) : (
                <><SiteCalendarIcon size={16} color="#FFFFFF" /> Book Slot</>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
    )
  ) : (
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`w-full flex flex-col overflow-hidden bg-white ${embedded ? "rounded-[24px] border border-[#e8eef5] shadow-sm" : "max-w-xl"}`}
        style={{ borderRadius: embedded ? undefined : "24px", boxShadow: embedded ? undefined : "0 24px 64px rgba(0,30,70,0.18)", maxHeight: embedded ? undefined : "90vh", border: embedded ? undefined : "1px solid #e8eef5" }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #f0f4f8" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,70,137,0.08)" }}>
              <SiteCalendarIcon size={19} color="#004689" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Schedule Your Interview</h3>
              <p className="text-xs mt-0.5 text-gray-400">Pick a slot that works best for you</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X size={17} />
          </button>
        </div>

        {/* ── Pill toggle ── */}
        <div className="px-6 pt-5 pb-0">
          <div className="flex rounded-2xl p-1 w-fit" style={{ background: "#f1f5f9" }}>
            {(["slots", "custom"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all"
                style={{
                  background: tab === t ? "#004689" : "transparent",
                  color: tab === t ? "white" : "#64748b",
                  boxShadow: tab === t ? "0 2px 8px rgba(0,70,137,0.2)" : "none",
                }}>
                {t === "slots" ? "Available Slots" : "Request Custom Time"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {tab === "slots" && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#004689", borderTopColor: "transparent" }} />
                <p className="text-xs text-gray-400">Loading available times…</p>
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gray-50">
                  <SiteCalendarIcon size={28} color="#d1d5db" />
                </div>
                <p className="font-extrabold mb-1 text-gray-800">No slots available yet</p>
                <p className="text-sm mb-5 text-gray-400">Our team is finalising interview times.</p>
                <button onClick={() => setTab("custom")}
                  className="text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  style={{ background: "rgba(0,70,137,0.07)", color: "#004689" }}>
                  Request a custom time instead →
                </button>
              </div>
            ) : (
              <>
                {/* Date chips */}
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest mb-3 text-gray-400">Select a Date</p>
                  <div className="flex gap-3 flex-wrap">
                    {sortedDates.map(date => {
                      const d = new Date(date + "T00:00:00");
                      const isActive = date === activeDate;
                      const isToday = date === new Date().toISOString().slice(0, 10);
                      return (
                        <button key={date} onClick={() => { setActiveDate(date); setSelected(null); }}
                          className="flex flex-col items-center transition-all"
                          style={{
                            background: isActive ? "#004689" : "#f8fafc",
                            border: `2px solid ${isActive ? "#004689" : "#e2e8f0"}`,
                            borderRadius: "14px",
                            padding: "8px 20px",
                            minWidth: "72px",
                            boxShadow: isActive ? "0 4px 16px rgba(0,70,137,0.25)" : "none",
                          }}>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: isActive ? "rgba(255,255,255,0.75)" : "#94a3b8" }}>
                            {isToday ? "Today" : d.toLocaleDateString("en-SG", { weekday: "short" })}
                          </span>
                          <span className="text-2xl font-black leading-tight" style={{ color: isActive ? "white" : "#0f172a" }}>
                            {d.getDate()}
                          </span>
                          <span className="text-[10px] font-semibold" style={{ color: isActive ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
                            {d.toLocaleDateString("en-SG", { month: "short" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slot grid */}
                {activeDate && (
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest mb-3 text-gray-400">
                      Select a Time · <span className="text-[#004689]">{activeDateSlots.length} slot{activeDateSlots.length !== 1 ? "s" : ""} available</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {activeDateSlots.map(slot => {
                        const isSelected = selected === slot.id;
                        return (
                          <button key={slot.id} onClick={() => setSelected(isSelected ? null : slot.id)}
                            className="flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-2xl transition-all"
                            style={{
                              background: isSelected ? "#004689" : "#f8fafc",
                              border: `2px solid ${isSelected ? "#004689" : "#e8eef5"}`,
                              boxShadow: isSelected ? "0 4px 16px rgba(0,70,137,0.2)" : "none",
                            }}>
                            <SiteClockIcon size={13} color={isSelected ? "rgba(255,255,255,0.7)" : "#94a3b8"} />
                            <span className="text-sm font-extrabold" style={{ color: isSelected ? "white" : "#1e293b" }}>
                              {formatTimeSlotDisplay(slot.timeSlot)}
                            </span>
                            <span className="text-[10px] font-semibold" style={{ color: isSelected ? "rgba(255,255,255,0.6)" : "#94a3b8" }}>
                              {slot.duration} min
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected slot confirmation banner */}
                    {selectedSlot && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-4 rounded-2xl p-4 flex items-start gap-3"
                        style={{ background: "rgba(0,70,137,0.05)", border: "1.5px solid rgba(0,70,137,0.15)" }}>
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(0,70,137,0.1)" }}>
                          <SiteCheckIcon size={14} color="#004689" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-extrabold text-gray-800">
                            {formatInterviewDate(selectedSlot.date)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatTimeSlotDisplay(selectedSlot.timeSlot)} · {selectedSlot.duration} min
                            {selectedSlot.interviewerName ? ` · with ${selectedSlot.interviewerName}` : ""}
                          </p>
                          {(selectedSlot.location || selectedSlot.meetingLink) && (
                            <p className="text-xs text-gray-400 mt-0.5">{selectedSlot.location || "Video Call"}</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-500 border border-red-100">{error}</p>
                )}
              </>
            )
          )}

          {tab === "custom" && (
            customSent ? (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
                  <SiteCheckIcon size={30} color="#10b981" />
                </div>
                <p className="font-extrabold text-lg mb-2 text-gray-800">Request Sent!</p>
                <p className="text-sm mb-7 text-gray-400">Our team will review your preferred time and confirm via email.</p>
                <button onClick={onClose}
                  className="px-8 py-2.5 rounded-xl text-sm font-extrabold text-white"
                  style={{ background: "#004689" }}>Close</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl p-4 flex gap-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                  <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: "#d97706" }} />
                  <p className="text-xs leading-relaxed text-amber-700">
                    None of the available slots work for you? Let us know your preferred time and we'll do our best to accommodate.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-2 text-gray-400">Preferred Date *</label>
                    <input type="date" min={todayStr} value={customDate} onChange={e => setCustomDate(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all bg-gray-50 text-gray-800"
                      style={{ border: `1.5px solid ${customDate ? "#004689" : "#e2e8f0"}` }} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-2 text-gray-400">Preferred Time *</label>
                    <select value={customTime} onChange={e => setCustomTime(e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all bg-gray-50 text-gray-800"
                      style={{ border: `1.5px solid ${customTime ? "#004689" : "#e2e8f0"}` }}>
                      <option value="">Select time…</option>
                      {CANDIDATE_TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-2 text-gray-400">
                    Notes <span className="font-normal normal-case">(optional)</span>
                  </label>
                  <textarea rows={3} value={customNotes} onChange={e => setCustomNotes(e.target.value)}
                    placeholder="e.g. I'm only available in the mornings, or I have a prior commitment before 10 AM…"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition-all bg-gray-50 text-gray-800"
                    style={{ border: "1.5px solid #e2e8f0" }} />
                </div>

                {error && (
                  <p className="text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-500 border border-red-100">{error}</p>
                )}
              </div>
            )
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid #f0f4f8" }}>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            style={{ border: "1.5px solid #e2e8f0" }}>
            Cancel
          </button>
          {tab === "slots" ? (
            <button onClick={book} disabled={!selected || booking}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold text-white transition-all"
              style={{ background: selected ? "#004689" : "#cbd5e1", cursor: selected ? "pointer" : "not-allowed", boxShadow: selected ? "0 4px 14px rgba(0,70,137,0.3)" : "none" }}>
              {booking
                ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Confirming…</>
                : <><SiteCalendarIcon size={15} color="#FFFFFF" /> {selected ? "Confirm Slot" : "Select a slot"}</>
              }
            </button>
          ) : !customSent ? (
            <button onClick={sendCustomRequest} disabled={!customDate || !customTime || customSending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold text-white transition-all"
              style={{ background: customDate && customTime ? "#004689" : "#cbd5e1", cursor: customDate && customTime ? "pointer" : "not-allowed", boxShadow: customDate && customTime ? "0 4px 14px rgba(0,70,137,0.3)" : "none" }}>
              {customSending
                ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Sending…</>
                : <><Send size={15} /> Send Request</>
              }
            </button>
          ) : null}
        </div>
      </motion.div>
  );

  if (embedded || pageLayout) return panel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,30,70,0.55)", backdropFilter: "blur(4px)" }}>
      {panel}
    </div>
  );
}

/* ─── Job Browse Card (inside portal) ───────────────────────────────────── */
function PortalJobCard({ job, onApply }: { job: Job; onApply: (j: Job) => void }) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = job.closesAt ? Math.ceil((new Date(job.closesAt).getTime() - Date.now()) / 86400000) : null;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {job.jobId && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded" style={{ background: "rgba(0,70,137,0.08)", color: "#004689" }}>{job.jobId}</span>}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{job.employmentType}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{job.department}</span>
              {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">Closes in {daysLeft}d</span>}
            </div>
            <h3 className="font-extrabold text-gray-800 text-base leading-tight">{job.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              <span className="flex items-center gap-1"><SiteMapPinIcon size={11} color="#6b7280" />{job.location}</span>
              {job.salaryRange && <span className="flex items-center gap-1"><DollarSign size={11} />{job.salaryRange}</span>}
              {job.postedAt && <span className="flex items-center gap-1"><SiteClockIcon size={11} color="#6b7280" />Posted {new Date(job.postedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</span>}
            </div>
          </div>
          <button onClick={() => onApply(job)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
            style={{ background: "#004689" }}>
            Apply Now <ChevronRight size={13} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-2">{job.description}</p>
        <button onClick={() => setExpanded(!expanded)} className="mt-2 text-xs font-bold text-blue-600 flex items-center gap-1">
          {expanded ? "Show less" : "View full details"} <ChevronRight size={11} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
                {job.requirements && (<><h4 className="font-bold text-gray-700 text-sm mt-3 mb-1">Requirements</h4><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.requirements}</p></>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Dashboard (authenticated view) ─────────────────────────────────── */
function Dashboard({ defaultTab = "jobs" }: { defaultTab?: "jobs" | "applications" | "profile" }) {
  const { candidate, token, logout } = useCandidateAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"jobs" | "applications" | "profile">(defaultTab);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [apps, setApps] = useState<CandidateApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [schedulingAppId, setSchedulingAppId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<CandidateNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const initials = candidate ? `${candidate.firstName[0]}${candidate.lastName?.[0] ?? ""}`.toUpperCase() : "?";
  const fullName = candidate ? `${candidate.firstName} ${candidate.lastName}` : "";

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    const r = await fetch(`${BASE}/careers`).catch(() => null);
    if (r?.ok) setJobs(await r.json());
    setJobsLoading(false);
  }, []);

  const loadApps = useCallback(async () => {
    if (!token) return;
    setAppsLoading(true);
    const r = await fetch(`${BASE}/candidate/applications`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
    if (r?.ok) setApps(await r.json());
    setAppsLoading(false);
  }, [token]);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { if (tab === "applications") loadApps(); }, [tab, loadApps]);

  /* SSE */
  useEffect(() => {
    if (!token) return;
    const es = new EventSource(`${BASE}/candidate/notifications/stream?token=${encodeURIComponent(token)}`);
    const handle = (e: MessageEvent, eventName: string) => {
      try {
        const data = JSON.parse(e.data);
        setNotifications(prev => [{ id: `${Date.now()}-${Math.random()}`, event: eventName, data, timestamp: Date.now(), read: false }, ...prev].slice(0, 20));
        playNotificationSound();
        if (eventName === "status_updated") loadApps();
      } catch { /* ignore */ }
    };
    es.addEventListener("status_updated", (e: MessageEvent) => handle(e, "status_updated"));
    es.onerror = () => { };
    return () => es.close();
  }, [token, loadApps]);

  /* Close notification panel on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifPanel(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f1f5f9", fontFamily: "'Nunito',sans-serif" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 shadow-sm" style={{ background: "#004689" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center shrink-0 bg-white/10 rounded-lg px-2.5 py-1" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
            <img src="./public/assets/wingsLogo.png" alt="WINGS" className="h-7" />
          </div>
          <div className="h-5 w-px bg-white/20 shrink-0" />
          <span className="text-white/80 text-sm font-bold shrink-0">Candidate Portal</span>
          <div className="flex-1" />

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => { setShowNotifPanel(p => !p); if (unreadCount > 0) setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }}
              className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
              {unreadCount > 0 ? <BellRing size={19} className="text-yellow-300" /> : <Bell size={19} />}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white animate-pulse"
                  style={{ background: "#ef4444" }}>{unreadCount}</span>
              )}
            </button>
            <AnimatePresence>
              {showNotifPanel && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-100"
                  style={{ background: "white" }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-gray-700">Notifications</span>
                    {notifications.length > 0 && <button onClick={() => setNotifications([])} className="text-xs text-gray-400 hover:text-gray-600">Clear all</button>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center"><Bell size={24} className="mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-400">No notifications yet</p></div>
                    ) : notifications.map(n => {
                      const isShortlisted = n.event === "status_updated" && (n.data as any).status === "shortlisted";
                      const statusLabel = STATUS[(n.data as any).status as string]?.label ?? (n.data as any).status;
                      return (
                        <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0"
                          style={{ background: n.read ? "white" : "#f0f9ff" }}>
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                              style={{ background: isShortlisted ? "#ecfdf5" : "#eff6ff" }}>
                              {isShortlisted ? <SiteCalendarIcon size={13} color="#10b981" /> : <Info size={13} style={{ color: "#3b82f6" }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-700">{isShortlisted ? "You've been shortlisted! 🎉" : `Status updated: ${statusLabel}`}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{(n.data as any).jobTitle}</p>
                              {isShortlisted && (
                                <button onClick={() => { setTab("applications"); setShowNotifPanel(false); }}
                                  className="flex items-center gap-1 text-xs font-bold mt-1" style={{ color: "#7c3aed" }}>
                                  Schedule your interview <ArrowRight size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
              style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.35)" }}>
              {initials}
            </div>
            <span className="text-white text-sm font-semibold hidden sm:block">{fullName}</span>
          </div>

          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* Tab bar */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex">
            {([
              { key: "jobs", icon: <Briefcase size={14} />, label: "Browse Jobs", count: null },
              { key: "applications", icon: <ClipboardList size={14} />, label: "My Applications", count: apps.length || null },
              { key: "profile", icon: <User size={14} />, label: "My Profile", count: null },
            ] as const).map(({ key, icon, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all"
                style={{
                  background: tab === key ? "white" : "transparent",
                  color: tab === key ? "#004689" : "rgba(255,255,255,0.65)",
                  borderRadius: tab === key ? "8px 8px 0 0" : undefined,
                }}>
                {icon}{label}
                {count !== null && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold" style={{ background: tab === key ? "#004689" : "rgba(255,255,255,0.2)", color: "white" }}>{count}</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* ── Browse Jobs ── */}
        {tab === "jobs" && (
          <motion.div key="jobs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {jobsLoading ? (
              <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "#004689", borderTopColor: "transparent" }} /></div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20">
                <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-bold text-gray-500 mb-2">No open positions at this time</h2>
                <p className="text-gray-400 text-sm">Check back soon — new opportunities are regularly posted.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{jobs.length} Open Position{jobs.length !== 1 ? "s" : ""}</p>
                {jobs.map(j => <PortalJobCard key={j.id} job={j} onApply={setApplyJob} />)}
              </div>
            )}
          </motion.div>
        )}

        {/* ── My Applications ── */}
        {tab === "applications" && (
          <motion.div key="apps" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-gray-800">My Applications</h2>
              <button onClick={loadApps} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">
                <RefreshCw size={13} className={appsLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {appsLoading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#004689", borderTopColor: "transparent" }} /></div>
            ) : apps.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
                <h2 className="text-lg font-bold text-gray-500 mb-2">No applications yet</h2>
                <p className="text-gray-400 text-sm mb-5">Browse open positions and apply for a role that interests you.</p>
                <button onClick={() => setTab("jobs")} className="px-5 py-2 rounded-xl font-bold text-white text-sm" style={{ background: "#004689" }}>Browse Open Positions</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {apps.map(app => (
                  <motion.div key={app.id} layout className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <StatusBadge status={app.status} />
                            {app.jobRef && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{app.jobRef}</span>}
                          </div>
                          <h3 className="font-extrabold text-gray-800 text-base mt-1">{app.jobTitle ?? "Position"}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {app.jobDepartment && <span>{app.jobDepartment}</span>}
                            {app.jobLocation && <span className="flex items-center gap-0.5"><SiteMapPinIcon size={11} color="#6b7280" />{app.jobLocation}</span>}
                            {app.jobEmploymentType && <span>{app.jobEmploymentType}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400 font-semibold">Applied</p>
                          <p className="text-sm font-bold text-gray-600">{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
                          <p className="text-[10px] font-mono text-gray-400 mt-1">{app.applicationNumber}</p>
                        </div>
                      </div>

                      {/* Application Journey Tracker */}
                      <ApplicationJourney status={app.status} />

                      {/* Shortlisted / book interview CTA */}
                      {canBookInterview(app.status) && (
                        <div className="mt-4 p-4 rounded-xl" style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1px solid #86efac" }}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#22c55e20" }}>
                              <SiteCalendarIcon size={16} color="#16a34a" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-extrabold text-green-800">Congratulations! You've been shortlisted 🎉</p>
                              <p className="text-xs text-green-700 mt-0.5 mb-3">Please choose a convenient interview time slot to proceed.</p>
                              <button onClick={() => setSchedulingAppId(app.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#16a34a" }}>
                                <SiteCalendarIcon size={13} color="#FFFFFF" /> Schedule My Interview <ArrowRight size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Interview details */}
                      {(isInterviewScheduledStatus(app.status) || app.status === "interview_scheduled") && app.interview && (
                        <div className="mt-4 p-3 rounded-xl" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                          <p className="text-xs font-extrabold text-purple-700 mb-2 flex items-center gap-1.5"><SiteCalendarIcon size={12} color="#7c3aed" /> Interview Scheduled</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-purple-800">
                            <span><strong>Date:</strong> {new Date(app.interview.date).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
                            <span><strong>Time:</strong> {app.interview.timeSlot} ({app.interview.duration} min)</span>
                            {app.interview.interviewerName && <span><strong>Interviewer:</strong> {app.interview.interviewerName}</span>}
                            {app.interview.location && <span><strong>Location:</strong> {app.interview.location}</span>}
                          </div>
                          {app.interview.meetingLink && (
                            <a href={app.interview.meetingLink} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-purple-700 hover:text-purple-900 underline underline-offset-2">
                              <ExternalLink size={11} /> Join Meeting
                            </a>
                          )}
                        </div>
                      )}

                      {/* Admin notes */}
                      {app.adminNotes && (
                        <div className="mt-3 p-3 rounded-xl text-xs text-gray-600 leading-relaxed" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <p className="font-bold text-gray-400 mb-1 text-[10px] uppercase tracking-wider">Note from WINGS</p>
                          {app.adminNotes}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── My Profile ── */}
        {tab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, #004689, #1d4ed8)" }}>
                  {initials}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-800">{fullName}</h2>
                  <p className="text-sm text-gray-500">Candidate Profile</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {[{ icon: <User size={15} />, label: "Full Name", value: fullName }, { icon: <Mail size={15} />, label: "Email Address", value: candidate?.email ?? "" }].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#eff6ff", color: "#004689" }}>{icon}</div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-gray-700 mt-0.5">{value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {applyJob && <ApplyModal job={applyJob} token={token!} onClose={(appNum) => { setApplyJob(null); if (appNum) { setTab("applications"); loadApps(); } }} />}
      </AnimatePresence>
      {schedulingAppId !== null && token && (
        <ScheduleInterviewModal appId={schedulingAppId} token={token}
          onBooked={() => { setSchedulingAppId(null); loadApps(); }}
          onClose={() => setSchedulingAppId(null)} />
      )}
    </div>
  );
}

/* ─── Dedicated Interview Booking Page (from email link) ───────────────── */
function InterviewBookingPage({ applicationId }: { applicationId: number }) {
  const { candidate, token } = useCandidateAuth();
  const [, navigate] = useLocation();
  const [app, setApp] = useState<CandidateApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState(() => Boolean(readStoredBookedSlot(applicationId)));
  const [bookedSlot, setBookedSlot] = useState<{ date: string; timeSlot: string } | null>(
    () => readStoredBookedSlot(applicationId)
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const candidateName = candidate
    ? [candidate.firstName, candidate.lastName].filter(Boolean).join(" ") || candidate.email
    : undefined;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const r = await fetch(`${BASE}/candidate/applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error("Unable to load your application.");
        const apps: CandidateApp[] = await r.json();
        if (cancelled) return;
        const match = apps.find((item) => item.id === applicationId);
        if (!match) {
          setError("This application was not found or does not belong to your account.");
          setApp(null);
        } else {
          setApp(match);
          if (hasCompletedInterviewBooking(match)) {
            setBooked(true);
            if (match.interview?.date && match.interview?.timeSlot) {
              const info = { date: match.interview.date, timeSlot: match.interview.timeSlot };
              setBookedSlot(info);
              persistBookedSlot(applicationId, info);
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to load application.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, applicationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center pt-32">
        <div className="w-10 h-10 rounded-full border-2 border-[#0D4A7A]/30 border-t-[#0D4A7A] animate-spin" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20">
          <div className="w-full max-w-[500px] bg-[#0D4A7A] rounded-[20px] shadow-[0_20px_50px_rgba(13,74,122,0.15)] text-white px-6 sm:px-8 py-10 sm:py-12 flex flex-col items-center text-center">
            <div className="w-[50px] h-[50px] bg-white rounded-[10px] flex items-center justify-center shadow-sm mb-6">
              <AlertCircle className="w-5 h-5 text-[#0D4A7A]" />
            </div>
            <h1 className="text-[25px] font-semibold font-['DM_Sans'] mb-4">Unable to open booking</h1>
            <p className="text-[16px] text-white/90 font-['DM_Sans'] leading-[21px] max-w-[370px] mb-8">{error || "Application not found."}</p>
            <button onClick={() => navigate("/candidate")} className="w-[244px] h-[46px] bg-white hover:bg-white/95 text-[#0D4A7A] text-[16px] font-medium rounded-full font-['DM_Sans'] transition-all">
              Go to Candidate Portal
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (booked || (app && hasCompletedInterviewBooking(app))) {
    const displayDate = bookedSlot?.date ?? app.interview?.date;
    const displayTime = bookedSlot?.timeSlot ?? app.interview?.timeSlot;
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20">
          <div className="w-full max-w-[560px] mx-auto rounded-[20px] bg-white shadow-[0_4px_4px_rgba(0,0,0,0.10)] px-6 md:px-10 py-10 md:py-12 text-center">
            <SiteCheckIcon size={52} color="#22c55e" className="mx-auto mb-5" />
            <h1 className="text-[#0D4A7A] font-['Outfit'] text-[28px] md:text-[32px] font-medium mb-3">Interview slot confirmed!</h1>
            <p className="text-[#0D4A7A]/80 font-['DM_Sans'] text-[16px] mb-2 leading-relaxed">
              Your interview for <strong>{app.jobTitle}</strong> has been successfully booked.
            </p>
            {displayDate && displayTime && (
              <p className="text-gray-600 font-['DM_Sans'] text-[15px] mb-6">
                {formatInterviewDate(displayDate)} · {formatTimeSlotDisplay(displayTime)}
              </p>
            )}
            <p className="text-sm text-gray-500 font-['DM_Sans'] mb-8 leading-relaxed max-w-md mx-auto">
              A confirmation email has been sent to your registered email address. Our team has also been notified.
            </p>
            <button onClick={() => navigate("/candidate")} className="inline-flex items-center justify-center w-full sm:w-auto min-w-[244px] h-[46px] px-8 rounded-full text-white bg-[#0D4A7A] font-['DM_Sans'] text-[16px] font-medium hover:bg-[#0a3d66] transition-colors">
              Back to Candidate Portal
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!canBookInterview(app.status)) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-20">
          <div className="w-full max-w-[500px] bg-[#0D4A7A] rounded-[20px] shadow-[0_20px_50px_rgba(13,74,122,0.15)] text-white px-6 sm:px-8 py-10 sm:py-12 flex flex-col items-center text-center">
            <div className="w-[50px] h-[50px] bg-white rounded-[10px] flex items-center justify-center shadow-sm mb-6">
              <Info className="w-5 h-5 text-[#0D4A7A]" />
            </div>
            <h1 className="text-[25px] font-semibold font-['DM_Sans'] mb-4">Booking not available</h1>
            <p className="text-[16px] text-white/90 font-['DM_Sans'] leading-[21px] max-w-[370px] mb-8">
              Your application status is <strong className="text-white">{app.status}</strong>. Interview booking is not open at this time.
            </p>
            <button onClick={() => navigate("/candidate")} className="w-[244px] h-[46px] bg-white hover:bg-white/95 text-[#0D4A7A] text-[16px] font-medium rounded-full font-['DM_Sans'] transition-all">
              Go to Candidate Portal
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5] flex flex-col font-sans overflow-x-hidden">
      {/* Hero — same dimensions as Careers page */}
      <section
        className="relative w-full flex flex-col items-center justify-center overflow-hidden shrink-0"
        style={{
          background:
            'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.72)), url("/assets/career1.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 md:px-[150px] w-full max-w-[1440px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-white font-['Outfit'] font-semibold text-center mb-6 text-[32px] sm:text-[42px] md:text-[52px] lg:text-[50px] leading-[1.15]"
            style={{ maxWidth: "850px" }}
          >
            Book Your Interview Slot
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-white text-center font-['DM_Sans'] font-normal text-[16px] sm:text-[18px] md:text-[20px] leading-[1.6] mb-10"
            style={{ maxWidth: "760px" }}
          >
            Select a convenient date and time for your interview
            {app.jobTitle ? (
              <> for the <strong className="font-semibold">{app.jobTitle}</strong> position</>
            ) : (
              " at WINGS Counselling Centre"
            )}
            . We look forward to meeting you.
          </motion.p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              document.getElementById("interview-booking-slots")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="inline-flex items-center justify-center gap-[10px] border-none cursor-pointer rounded-full bg-[#1B4585] px-[32px] py-[16px] transition-all duration-300"
            style={{ boxShadow: "0 8px 24px rgba(27,69,133,0.35)" }}
          >
            <span className="text-center font-['Plus_Jakarta_Sans'] text-[16px] md:text-[18px] font-semibold leading-[28px] text-[#F5F9FF]">
              View available slots
            </span>
            <ChevronRight size={22} className="text-[#F5F9FF]" />
          </motion.button>
        </motion.div>
      </section>

      <section
        id="interview-booking-slots"
        className="w-full pt-[70px] pb-[80px] bg-[#F7F7F5] px-4 md:px-[150px]"
      >
        <div className="w-full max-w-[1440px] mx-auto">
          {token && (
            <ScheduleInterviewModal
              pageLayout
              appId={applicationId}
              token={token}
              jobTitle={app.jobTitle}
              candidateName={candidateName}
              applicationNumber={app.applicationNumber}
              jobRef={app.jobRef}
              onBooked={(info) => {
                if (info) setBookedSlot(info);
                setBooked(true);
              }}
              onClose={() => navigate("/candidate")}
            />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ─── Main Export ─────────────────────────────────────────────────────── */
export default function CandidatePortal() {
  const { candidate, isLoading } = useCandidateAuth();
  const [location, navigate] = useLocation();

  const bookingApplicationId = parseInterviewBookingApplicationId(location);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#003a80" }}>
        <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <AuthPage
        subtitle={bookingApplicationId ? "Sign in to book your interview slot" : undefined}
        onSuccess={() => {
          if (bookingApplicationId) navigate(location);
        }}
      />
    );
  }

  if (bookingApplicationId) {
    return <InterviewBookingPage applicationId={bookingApplicationId} />;
  }

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const applyJobId = params.get("apply");
  const defaultTab = applyJobId ? "jobs" : "jobs";

  return (
    <>
      <SEO title="Candidate Portal | WINGS Counselling Centre" noindex={true} />
      <Dashboard defaultTab={defaultTab} />
    </>
  );
}