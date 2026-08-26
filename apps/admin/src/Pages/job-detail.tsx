import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Share2,
  Copy,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import {
  SiteMapPinIcon,
  SiteClockIcon,
  SiteCheckIcon,
  SITE_ICON_SIZE_LG,
} from "@/components/ui/SiteIcons";
import { SiWhatsapp } from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

import { Footer } from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import type { JobPosting } from "@/lib/careers-types";
import { useAuth } from "@/hooks/use-auth";
import { useCandidateAuth } from "@/context/CandidateAuthContext";
import SEO from "@/components/SEO";

function parseTextToList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
}

function parseSectionedRequirements(text: string) {
  const sections = new Map<string, string[]>();
  let currentKey = "Key Responsibilities";

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const headerMatch = line.match(/^(?:#{1,3}\s*)?([A-Za-z][A-Za-z\s'&]+):\s*$/);
    if (headerMatch) {
      currentKey = headerMatch[1].trim();
      if (!sections.has(currentKey)) sections.set(currentKey, []);
      continue;
    }

    const cleaned = line.replace(/^[\s•\-*]+/, "").trim();
    if (!cleaned) continue;

    if (!sections.has(currentKey)) sections.set(currentKey, []);
    sections.get(currentKey)!.push(cleaned);
  }

  const get = (...names: string[]) => {
    for (const name of names) {
      for (const [key, items] of sections.entries()) {
        if (key.toLowerCase() === name.toLowerCase() && items.length) {
          return items;
        }
      }
    }
    return [];
  };

  const allItems = parseTextToList(text);
  const defaultItems =
    sections.get("Key Responsibilities")?.length
      ? sections.get("Key Responsibilities")!
      : sections.size === 1
        ? Array.from(sections.values())[0] || []
        : allItems;

  return {
    responsibilities: get("Key Responsibilities").length
      ? get("Key Responsibilities")
      : defaultItems,
  };
}

export default function JobDetail() {
  const params = useParams<{ id: string }>();
  const slug = params.id || "";
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useCandidateAuth();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];

  const {
    data: job,
    isLoading: jobQueryLoading,
    isError: jobQueryError,
    error: jobQueryErrorDetail,
  } = useQuery<JobPosting>({
    queryKey: [
      `/api/jobs/by-job-id/${slug}?lang=${encodeURIComponent(lang)}`,
    ],
    enabled: !!slug && slug !== "undefined",
  });

  const { data: applicationCheck } = useQuery<{ hasApplied: boolean }>({
    queryKey: [`/api/applications/check/${job?.id}`],
    enabled: isAuthenticated && !!job?.id,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNativeShare = (jobTitle: string) => {
    if (navigator.share) {
      navigator
        .share({
          title: `${jobTitle} - WINGS Counselling Centre`,
          text: `Check out this job opening at WINGS: ${jobTitle}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      setShareOpen((prev) => !prev);
    }
  };

  const scrollToPositions = () => {
    const el = document.getElementById("job-detail-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (jobQueryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
        <Loader2 className="w-8 h-8 text-[#0D4A7A] animate-spin" />
      </div>
    );
  }

  if (jobQueryError || !job) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-[#0D4A7A] mb-4">
          {jobQueryError ? t("careers.detail.unableToLoad") : t("careers.detail.notFound")}
        </h1>
        <p className="text-gray-600 font-['DM_Sans'] mb-6 max-w-md">
          {jobQueryError
            ? (jobQueryErrorDetail instanceof Error
                ? jobQueryErrorDetail.message
                : t("careers.detail.loadFailed"))
            : t("careers.detail.notAvailable")}
        </p>
        <Link href="/careers">
          <Button className="bg-[#0D4A7A] hover:bg-[#08345c]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("careers.detail.backToCareers")}
          </Button>
        </Link>
      </div>
    );
  }

  const requirementSections = parseSectionedRequirements(job.requirements || "");

  const jobPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": (job.description || job.requirements || job.title).slice(0, 300),
    "identifier": {
      "@type": "PropertyValue",
      "name": "WINGS Counselling Centre",
      "value": String(job.id)
    },
    "hiringOrganization": {
      "@type": "Organization",
      "name": "WINGS Counselling Centre",
      "sameAs": "https://wingscc.netopsys.in/",
      "logo": "https://wingscc.netopsys.in/assets/wingsLogo.png"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "SG"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] overflow-x-hidden font-sans">
      <SEO
        title={`${job.title} - Careers | WINGS Counselling Centre`}
        description={(job.description || job.requirements || `Apply for ${job.title} position at WINGS Counselling Centre.`).slice(0, 160)}
        path={`/career/${job.id}`}
        ogImage="/assets/career1.png"
        jsonLd={jobPostingJsonLd}
      />
      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <section
        className="relative w-full flex items-center justify-center overflow-hidden shrink-0"
        style={{
          background:
            'linear-gradient(rgba(58,58,58,0.8), rgba(0,0,0,0.8)), url("/assets/career1.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        <motion.div
          className="relative z-10 w-full navbar-align-outer"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <div className="navbar-align-inner flex flex-col items-center text-center w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-white font-['Outfit'] font-semibold mb-6 md:mb-8 text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px] md:pt-[80px] leading-[1.1]"
            style={{ maxWidth: "843px" }}
          >
            {job.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-white/90 font-['DM_Sans'] font-normal text-[16px] sm:text-[18px] md:text-[20px] leading-relaxed max-w-[750px] mb-8 md:mb-10"
          >
            {job.summary || job.description}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            onClick={scrollToPositions}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-['DM_Sans'] font-semibold text-[16px] transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
          >
            {t("careers.hero.button")}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          BREADCRUMBS
      ═══════════════════════════════════════════ */}
      <div className="bg-[#F9F9F9] py-5">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner flex items-center gap-2 text-[16px] font-['DM_Sans']">
          <Link href="/">
            <span className="text-gray-800 hover:text-[#1B4585] transition-colors cursor-pointer underline">
              {t("careers.detail.home")}
            </span>
          </Link>
          <span className="text-gray-800">/</span>
          <Link href="/careers">
            <span className="text-gray-800 hover:text-[#1B4585] transition-colors cursor-pointer underline">
              {t("careers.detail.career")}
            </span>
          </Link>
          <span className="text-gray-800">/</span>
          <span className="text-gray-800">
            {job.title}
          </span>
          </div>
        </div>
      </div>

      <section
        id="job-detail-section"
        className="bg-[#0D4A7A] pt-8 pb-10 border-b-4 border-[#1E3A8A]"
      >
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
          {/* Tags */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="px-4 py-1.5 rounded-full border border-white/60 text-white text-xs font-semibold font-['Plus_Jakarta_Sans'] tracking-wide">
              {job.jobId}
            </span>
            {job.department && (
              <span className="px-4 py-1.5 rounded-full border border-white/60 text-white text-xs font-semibold font-['Plus_Jakarta_Sans'] tracking-wide">
                {job.department}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-[28px] sm:text-[34px] md:text-[40px] font-semibold text-white font-['Outfit'] mb-5 leading-tight">
            {job.title}
          </h1>

          {job.summary && (
            <p className="text-white/90 font-['DM_Sans'] text-[16px] md:text-[17px] leading-relaxed mb-6 max-w-[900px]">
              {job.summary}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-5 mb-6 text-white/90 font-['DM_Sans'] font-medium text-[15px]">
            <div className="flex items-center gap-2">
              <SiteMapPinIcon size={18} color="#FFFFFF" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <SiteClockIcon size={18} color="#FFFFFF" />
              <span>{job.experience}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-[18px] h-[18px] text-white" />
              <span>{job.employmentType}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 flex-wrap">
            {applicationCheck?.hasApplied ? (
              <span className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold transition-all duration-300 bg-green-100 text-green-700 shadow-sm text-[15px] font-['DM_Sans']">
                <SiteCheckIcon size={20} color="#FFFFFF" />
                {t("careers.jobs.alreadyApplied")}
              </span>
            ) : (
              <Link
                href={isAuthenticated ? `/apply/${job.jobId}` : "#"}
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    openAuthModal(`/apply/${job.jobId}`);
                  } else {
                    sessionStorage.setItem("careerApplyStage", "form");
                    sessionStorage.setItem("returnTo", `/career/apply/${encodeURIComponent(job.jobId)}`);
                  }
                }}
              >
                <span className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold transition-all duration-300 bg-white hover:bg-gray-100 text-[#0D4A7A] shadow-sm cursor-pointer text-[15px] font-['DM_Sans']">
                  {t("careers.jobs.applyNow")}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            )}

            <div className="relative" ref={shareRef}>
              <button
                onClick={() => handleNativeShare(job.title)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold transition-all duration-300 bg-white hover:bg-gray-100 text-[#0D4A7A] shadow-sm text-[15px] font-['DM_Sans']"
              >
                {t("careers.detail.share")}
                <Share2 className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {shareOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 font-['DM_Sans']"
                  >
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-gray-700 hover:bg-[#0D4A7A]/10 hover:text-[#0D4A7A] transition-colors"
                    >
                      {copied ? (
                        <SiteCheckIcon size={16} color="#16a34a" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                      {copied ? t("careers.detail.linkCopied") : t("careers.detail.copyLink")}
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Check out this job at WINGS: ${job.title} - ${window.location.href}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      onClick={() => setShareOpen(false)}
                    >
                      <SiWhatsapp className="w-4 h-4 text-green-500" />
                      {t("careers.detail.shareWhatsApp")}
                    </a>

                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                        window.location.href
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1B4585] transition-colors"
                      onClick={() => setShareOpen(false)}
                    >
                      <FaLinkedinIn className="w-4 h-4 text-[#1B4585]" />
                      {t("careers.detail.shareLinkedIn")}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ABOUT THIS ROLE
      ═══════════════════════════════════════════ */}
      <section className="pt-5 pb-6 md:pt-8 md:pb-8 bg-[#F9F9F9]">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[20px] p-7 md:p-10 border border-gray-200"
          >
            <h2 className="text-[24px] sm:text-[26px] md:text-[25px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-6">
              {t("careers.detail.aboutRole")}
            </h2>
            <div className="text-gray-700 font-['DM_Sans'] leading-[1.85] text-[16px] md:text-[17px] space-y-5 max-w-[1400px] whitespace-pre-wrap">
              {job.description || t("careers.detail.noDescription")}
            </div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          KEY RESPONSIBILITIES
      ═══════════════════════════════════════════ */}
      <section className="pb-6 md:pb-8 bg-[#F9F9F9]">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[20px] p-7 md:p-10 border border-gray-200"
          >
            <h2 className="text-[24px] sm:text-[26px] md:text-[25px] font-semibold text-[#0D4A7A] font-['Outfit'] mb-8">
              {t("careers.detail.keyResponsibilities")}
            </h2>
            <ul className="space-y-4 text-gray-700 font-['DM_Sans'] text-[16px] md:text-[17px] leading-relaxed max-w-[900px]">
              {requirementSections.responsibilities.length ? (
                requirementSections.responsibilities.map((item, i) => (
                  <li key={`${item}-${i}`} className="flex items-start gap-3">
                    <span className="mt-[7px] min-w-[7px] w-[7px] h-[7px] rounded-full bg-[#1B4585] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">{t("careers.detail.noRequirements")}</li>
              )}
            </ul>
          </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          APPLY BUTTON (Bottom CTA)
      ═══════════════════════════════════════════ */}
      <section className="pb-6 md:pb-8 bg-[#F9F9F9]">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {applicationCheck?.hasApplied ? (
              <span className="inline-flex items-center gap-2 px-8 py-4 bg-green-100 text-green-700 rounded-full font-bold shadow-md text-[16px] font-['DM_Sans']">
                <SiteCheckIcon size={20} color="#FFFFFF" />
                {t("careers.detail.alreadyAppliedPosition")}
              </span>
            ) : (
              <Link
                href={isAuthenticated ? `/apply/${job.jobId}` : "#"}
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    openAuthModal(`/apply/${job.jobId}`);
                  } else {
                    sessionStorage.setItem("careerApplyStage", "form");
                    sessionStorage.setItem("returnTo", `/career/apply/${encodeURIComponent(job.jobId)}`);
                  }
                }}
              >
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold transition-all duration-300 shadow-md cursor-pointer text-[16px] font-['DM_Sans']">
                  {t("careers.detail.applyPosition")}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            )}
          </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
