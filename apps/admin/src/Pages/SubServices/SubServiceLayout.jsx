import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Layout/Footer";
import { SiteCheckBadge } from "@/components/ui/SiteIcons";
import PractitionerCard from "@/components/ui/PractitionerCard";
import { useAppointment } from "@/context/AppointmentContext";
import { scrollToServiceDetailsWithRetry } from "@/lib/scrollToSection";
import SEO from "@/components/SEO";

const heroImg = "/assets/card1.jpg.jpeg";

function pickTeamMembers(allMembers, keywords = [], limit = 3) {
  if (!allMembers.length) return [];

  const memberHaystack = (member) => {
    const creds = Array.isArray(member.credentials) ? member.credentials : [];
    const specs = Array.isArray(member.specialisations) ? member.specialisations : [];
    return [member.name, member.role, member.title, member.bio, member.experience, ...creds, ...specs]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  };

  const matchesKeyword = (member) => {
    if (!keywords.length) return false;
    const hay = memberHaystack(member);
    return keywords.some((kw) => hay.includes(kw.toLowerCase()));
  };

  const matched = allMembers.filter(matchesKeyword);
  const remaining = allMembers.filter((m) => !matched.includes(m));
  return [...matched, ...remaining].slice(0, limit);
}

export default function SubServiceLayout({
  serviceLabel,
  sectionTitle,
  description,
  bulletPoints = [],
  therapyImage = "/assets/card2.jpg.jpeg",
  imageAlt = "Service",
  backHash = "counselling",
  teamKeywords = [],
  assignedTeamMembers = null,
  appointmentSelection,
}) {
  const { t } = useTranslation();
  const { openModal } = useAppointment();
  const [, navigate] = useLocation();
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);

  const hasPresetTeam = Array.isArray(assignedTeamMembers);

  // Card click / route enter → jump below hero to service details (not top of hero)
  useLayoutEffect(() => {
    scrollToServiceDetailsWithRetry({ behavior: "auto" });
  }, [serviceLabel, sectionTitle]);

  useEffect(() => {
    if (hasPresetTeam) {
      setTeamLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchTeamMembers = async () => {
      try {
        const response = await fetch("/api/team");
        if (!response.ok) throw new Error("Failed to fetch team members");
        const data = await response.json();
        if (!cancelled) {
          setTeamMembers(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setTeamMembers([]);
      } finally {
        if (!cancelled) setTeamLoading(false);
      }
    };

    fetchTeamMembers();
    return () => {
      cancelled = true;
    };
  }, [hasPresetTeam]);

  const counsellors = useMemo(() => {
    if (hasPresetTeam) return assignedTeamMembers;
    return pickTeamMembers(teamMembers, teamKeywords, 3);
  }, [hasPresetTeam, assignedTeamMembers, teamMembers, teamKeywords]);

  const [location] = useLocation();

  const cleanDescription = (description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceLabel,
    "provider": {
      "@type": "CounselingService",
      "name": "WINGS Counselling Centre",
      "url": "https://wingscounselling.org.sg/"
    },
    "description": (description || "").trim().slice(0, 300)
  };

  return (
    <div className="w-full flex flex-col min-h-screen items-center bg-[#FAFAF5] overflow-x-hidden">
      <SEO
        title={`${serviceLabel} | WINGS Counselling Centre`}
        description={cleanDescription || `${serviceLabel} services at WINGS Counselling Centre.`}
        path={location}
        ogImage={therapyImage}
        jsonLd={serviceJsonLd}
      />
      <section
        className="relative flex w-full shrink-0 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
          backgroundImage: `url(${heroImg})`,
        }}
      >
        <div className="absolute inset-0 bg-black/45 z-0" />
        <div className="relative z-10 navbar-align-outer h-full w-full flex items-center justify-center">
          <div className="navbar-align-inner flex flex-col items-center justify-center text-center w-full py-6 sm:py-8 px-2">
            <h1
              className="text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px] md:pt-[80px] font-semibold leading-[1.15] sm:leading-tight mb-3 sm:mb-6 px-2"
              style={{ fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}
            >
              {t("subService.hero.title")}
            </h1>
            <p
              className="text-[15px] sm:text-[18px] md:text-[20px] leading-[1.6] sm:leading-relaxed mb-5 sm:mb-8 max-w-[850px] px-2"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#FFFFFF" }}
            >
              {t("subService.hero.description")}
            </p>
            <button
              onClick={() => {
                scrollToServiceDetailsWithRetry({ behavior: "smooth" });
              }}
              className="mt-4 sm:mt-6 h-[52px] sm:h-[60px] px-6 sm:px-8 rounded-full bg-[#1B4585] text-white font-['Plus_Jakarta_Sans',sans-serif] text-[15px] sm:text-[16px] md:text-[18px] font-semibold flex items-center gap-2 sm:gap-3 hover:scale-105 transition-all duration-300"
            >
              <span>{t("subService.hero.button")}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section id="service-details" className="w-full bg-[#F5F4F1] py-10 sm:py-16">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
            <div className="mb-6 sm:mb-12 font-['DM_Sans'] text-[14px] sm:text-[16px] font-medium">
              <span
                onClick={() => navigate(`/services#${backHash}`)}
                className="underline cursor-pointer hover:opacity-70 transition"
              >
                {t("subService.navigation.backToService")}
              </span>{" "}
              <span className="inline-flex items-center gap-2">/ {serviceLabel}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[475px_1fr] gap-0 rounded-[10px] overflow-hidden lg:min-h-[556px] bg-white shadow-sm lg:shadow-none">
              <div className="w-full lg:h-full">
                <img
                  src={therapyImage}
                  alt={imageAlt}
                  className="w-full aspect-[4/3] sm:aspect-[3/2] lg:aspect-auto h-auto lg:h-[560px] lg:min-h-[450px] object-cover object-center block"
                />
              </div>

              <div className="bg-white px-5 py-6 sm:p-10 lg:px-[40px] lg:py-[25px] flex flex-col justify-start h-full pb-8 sm:pb-10">

                <h2 className="mt-4 sm:mt-6 font-['Outfit'] text-[clamp(24px,5.5vw,32px)] font-medium leading-[1.2] text-black">
                  {sectionTitle}
                </h2>

                <p className="mt-4 sm:mt-6 max-w-[980px] font-['DM_Sans'] text-[16px] sm:text-[17px] md:text-[20px] leading-[1.65] sm:leading-[32px] text-[#333333] whitespace-pre-line">
                  {description}
                </p>

                {bulletPoints.length > 0 && (
                  <div className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
                    {bulletPoints.map((item) => (
                      <div
                        key={item}
                        className="flex items-start sm:items-center gap-3 sm:gap-5 font-['DM_Sans'] text-[16px] sm:text-[17px] md:text-[20px] font-medium text-black"
                      >
                        <SiteCheckBadge className="shrink-0 mt-0.5 sm:mt-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#F5F4F1] pt-2 pb-6 sm:pt-4 sm:pb-12 md:pt-8 md:pb-20 text-center">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">

            <h2 className="mt-4 sm:mt-6 text-[#0D4A7A] font-['Outfit'] text-[clamp(24px,6vw,35px)] font-medium leading-[1.2] px-2">
              {t("subService.team.title")}
            </h2>

            <p className="mt-4 sm:mt-6 max-w-[994px] mx-auto font-['DM_Sans'] text-[16px] md:text-[20px] font-medium leading-[1.5] sm:leading-[130%] px-2">
              {t("subService.team.description")}
            </p>

            <div className="mt-14 flex flex-wrap justify-center gap-4 sm:gap-5 md:gap-6 lg:gap-8 w-full items-stretch text-left">
              {teamLoading &&
                [0, 1, 2].map((i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="bg-white rounded-[12px] border border-[#E8E8E8] shadow-sm p-3 animate-pulse w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-18px)] max-w-[300px]"
                  >
                    <div className="w-full aspect-square rounded-[12px] bg-[#E8EEF5]" />
                    <div className="pt-3 space-y-2">
                      <div className="h-4 bg-[#E8EEF5] rounded w-3/4" />
                      <div className="h-3 bg-[#E8EEF5] rounded w-full" />
                    </div>
                  </div>
                ))}

              {!teamLoading && counsellors.length === 0 && (
                <p className="w-full text-center font-['DM_Sans'] text-[#666] text-[16px]">
                  {t("subService.team.updating")}{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/team")}
                    className="text-[#0D4A7A] underline hover:opacity-70"
                  >
                    {t("subService.team.meetFullTeam")}
                  </button>
                </p>
              )}

              {!teamLoading &&
                counsellors.map((person) => (
                  <div key={person.id ?? person.name} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-18px)] max-w-[300px]">
                    <PractitionerCard practitioner={person} />
                  </div>
                ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal(appointmentSelection || serviceLabel)}
              className="mt-12 h-[60px] px-8 rounded-full bg-[#1B4585] text-white font-['Plus_Jakarta_Sans',sans-serif] text-[17px] font-semibold inline-flex items-center gap-4 hover:scale-105 transition-all duration-300"
            >
              {t("subService.buttons.bookAppointment")}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
