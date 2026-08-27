import React from "react";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAppointment } from "@/context/AppointmentContext";
import { useLocation } from "wouter";
import { Footer } from "@/components/Layout/Footer";
import { SiteCheckBadge } from "@/components/ui/SiteIcons";
import SEO from "@/components/SEO";

export default function AboutUs() {
  const { t } = useTranslation();
  const { openModal } = useAppointment();
  const [, navigate] = useLocation();

  const timelineRaw = t("aboutUs.journey.timeline", { returnObjects: true });
  const timelineData = Array.isArray(timelineRaw) ? timelineRaw : [];

  const visionParagraphsRaw = t("aboutUs.vision.paragraphs", { returnObjects: true });
  const visionParagraphs = Array.isArray(visionParagraphsRaw) ? visionParagraphsRaw : [];

  const whoWeServeCardsRaw = t("aboutUs.whoWeServe.cards", { returnObjects: true });
  const whoWeServeCards = Array.isArray(whoWeServeCardsRaw) ? whoWeServeCardsRaw : [];

  const impactPointsRaw = t("aboutUs.impact.points", { returnObjects: true });
  const impactPoints = Array.isArray(impactPointsRaw) ? impactPointsRaw : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    },
  };

  return (
    <div className="w-full flex flex-col min-h-screen">
      <SEO
        title="About Us | WINGS Counselling Centre"
        description="Learn about WINGS Counselling Centre, our mission, vision, clinical history, and commitment to providing accessible mental health care and therapy in Singapore."
        path="/about-us"
        ogImage="/assets/aboutusimage.png"
      />
      {/* Hero Section - CENTERED */}
      <div
        className="w-full flex justify-center items-center overflow-hidden relative shrink-0"
        style={{
          background: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url("/assets/aboutusimage.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        <div className="w-full navbar-align-outer h-full">
          <motion.div
            className="navbar-align-inner h-full flex flex-col items-center justify-center text-center relative"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1
              variants={itemVariants}
              className="text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px] font-semibold leading-tight  text-white"
              style={{ fontFamily: "'Outfit', sans-serif", maxWidth: "800px" }}
            >
              {t("aboutUs.hero.title")} <br />
              <span style={{ color: "#4BB6CF" }}>{t("aboutUs.hero.highlight")}</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-[15px] sm:text-[17px] md:text-[20px] leading-relaxed mb-8 sm:mb-10 text-white"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, maxWidth: "800px" }}
            >
              {t("aboutUs.hero.description")}
            </motion.p>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const journey = document.getElementById("journey-section");
                journey?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
              style={{
                padding: "12px 28px",
                borderRadius: "9999px",
                background: "#1B4585",
                color: "#F5F9FF",
                border: "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                fontSize: "clamp(15px, 1.5vw, 18px)",
              }}
            >
              {t("aboutUs.hero.button")}
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
          </motion.div>
        </div>
      </div>

      {/* Quote Section */}
      <div
        className="w-full flex justify-center items-center relative overflow-hidden shrink-0 py-8 sm:py-10 md:py-12"
        style={{ background: "#E8F4FD" }}
      >
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner relative flex flex-col items-center justify-center py-4 md:py-6">
            <p
              className="text-center z-10 text-[18px] sm:text-[24px] md:text-[32px] lg:text-[38px] font-semibold mb-4 sm:mb-5"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: "1.4",
                color: "#1B4585",
                maxWidth: "1000px",
              }}
            >
              "{t("aboutUs.quote.text")}"
            </p>

            <p
              className="text-center z-10 text-[15px] sm:text-[17px] md:text-[20px]"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                color: "#111827",
              }}
            >
              {t("aboutUs.quote.author")}
            </p>
          </div>
        </div>
      </div>

      {/* Journey Section */}
      <div
        id="journey-section"
        className="w-full pt-8 sm:pt-10 md:pt-14 flex justify-center bg-[#FDFDFD] pb-12 sm:pb-16 md:pb-[100px] overflow-hidden"
      >
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner flex flex-col items-center">
            {/* Section Header */}
            <div className="flex flex-col items-center text-center mb-16 md:mb-[120px]">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
                className="text-[28px] sm:text-[32px] md:text-[35px] font-medium mb-6"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  color: "#0D4A7A",
                  lineHeight: "100%",
                  maxWidth: "675px"
                }}
              >
                {t("aboutUs.journey.title")}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                className="text-[16px] sm:text-[18px] md:text-[20px] leading-[1.6] font-medium"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: "#4B5563",
                  maxWidth: "1500px"
                }}
              >
                {t("aboutUs.journey.description")}
              </motion.p>
            </div>

            {/* Timeline Container */}
            <div className="relative w-full">
              {/* Center Line */}
              <div
                className="absolute left-1/2 -translate-x-1/2 h-full w-[3px] bg-[#1E3A8A] hidden md:block"
                style={{ top: 0 }}
              />

              <div className="flex flex-col w-full">
                {timelineData.map((item, idx) => {
                  const isLeft = idx % 2 === 0;

                  return (
                    <div
                      key={idx}
                      className="relative flex flex-col md:flex-row items-start w-full mb-16 md:mb-24 last:mb-0"
                    >
                      {/* Fixed Circle and Icon */}
                      <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center justify-center">
                        <div className="w-[75px] h-[75px] rounded-full bg-[#1E3A8A] flex items-center justify-center">
                          <Trophy size={32} color="#FFFFFF" />
                        </div>
                      </div>

                      {/* Content Box */}
                      <div className={`w-full md:w-1/2 ${isLeft ? "md:pr-16 md:text-left md:ml-0" : "md:pl-16 md:ml-auto"}`}>
                        <motion.div
                          initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.9,
                            delay: idx * 0.15,
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                          className="w-full bg-white border border-[#E5E7EB] rounded-[20px] p-5 md:p-6 transition-shadow"
                        >
                          <div
                            className="inline-flex items-center justify-center mb-4"
                            style={{
                              padding: "8px 26px",
                              border: "1.8px solid #0D4A7A",
                              borderRadius: "999px",
                              background: "transparent",
                              color: "#0D4A7A",
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontWeight: 600,
                              fontSize: "14px",
                              letterSpacing: "2px",
                              lineHeight: "1",
                              width: "max-content",
                            }}
                          >
                            {item.category}
                          </div>

                          <h3
                            className="text-[18px] md:text-[20px] font-medium mb-3"
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              color: "#111827",
                              lineHeight: "1.2",
                            }}
                          >
                            {item.title} ({item.year})
                          </h3>

                          <p
                            className="text-[14px] md:text-[15px] leading-[1.6]"
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 400,
                              color: "#4B5563",
                            }}
                          >
                            {item.description}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Founding Vision */}
      <section className="w-full bg-[#F3F4EE] py-[60px] box-border overflow-hidden">
        <div className="w-full navbar-align-outer">
          <div className="w-full navbar-align-inner flex flex-col lg:flex-row gap-8 lg:gap-20 items-start">
            {/* Heading — mobile only */}
            <h2
              className="lg:hidden text-[22px] sm:text-[28px] md:text-[32px] font-medium order-1"
              style={{
                fontFamily: "'Outfit', sans-serif",
                color: "#0D4A7A",
                lineHeight: "1.2",
              }}
            >
              {t("aboutUs.vision.title")}
            </h2>

           <div className="relative shrink-0 w-full lg:w-[435px] order-2 lg:order-1 flex justify-center">
  <img
    src="/assets/foundingvision.jpeg"
    alt="Founding Vision"
    className="w-full h-auto max-h-[455px] object-contain rounded-[20px]"
  />
</div>

            <div className="flex flex-col flex-1 order-3 lg:order-2">
              <h2
                className="hidden lg:block text-[22px] sm:text-[28px] md:text-[32px] lg:text-[35px] font-medium mb-5"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  color: "#0D4A7A",
                  lineHeight: "1.2",
                }}
              >
                {t("aboutUs.vision.title")}
              </h2>

              <div
                className="text-[15px] sm:text-[17px] md:text-[20px] leading-relaxed max-w-[850px]"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  color: "#000000",
                }}
              >
                {visionParagraphs.map((text, i) => (
                  <p key={i} className={i < visionParagraphs.length - 1 ? "mb-5" : ""}>
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <div className="w-full flex justify-center bg-[#0D4A7A] py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner flex flex-col">
            <h2
              className="text-[22px] sm:text-[28px] md:text-[32px] lg:text-[35px] font-medium mb-4 text-white"
              style={{ fontFamily: "'Outfit', sans-serif", lineHeight: "1.2", maxWidth: "800px" }}
            >
              {t("aboutUs.whoWeServe.title")}
            </h2>

            <p
              className="text-[14px] sm:text-[16px] md:text-[20px] lg:text-[20px] leading-relaxed text-white mb-8 sm:mb-10"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, maxWidth: "900px" }}
            >
              {t("aboutUs.whoWeServe.description")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {whoWeServeCards.map((card, i) => (
                <div
                  key={i}
                  className="flex flex-col p-5 sm:p-6"
                  style={{
                    borderRadius: "10px",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    minHeight: "240px",
                  }}
                >
                  <h3
                    className="text-[24px] sm:text-[26px] md:text-[30px] font-bold text-white mb-2"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {card.age}
                  </h3>

                  <h4
                    className="text-[16px] sm:text-[18px] font-medium text-white mb-3"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {card.label}
                  </h4>

                  <p
                    className="text-[13px] sm:text-[14px] md:text-[15px] text-white leading-relaxed mb-5 flex-1"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, opacity: 0.9 }}
                  >
                    {card.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {(Array.isArray(card.tags) ? card.tags : []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="flex items-center justify-center"
                        style={{
                          padding: "4px 12px",
                          borderRadius: "9999px",
                          border: "1px solid rgba(255,255,255,0.6)",
                          color: "#FFFFFF",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 500,
                          fontSize: "12px"
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Our Impact */}
      <div className="w-full flex justify-center bg-[#F9FAFB] relative pt-12 sm:pt-16 md:pt-[80px] pb-8 sm:pb-10 md:pb-16 overflow-hidden">
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner flex flex-col items-center">
            <h2
              className="text-[22px] sm:text-[28px] md:text-[32px] lg:text-[35px] font-medium text-center mb-5"
              style={{ fontFamily: "'Outfit', sans-serif", lineHeight: "1.4", color: "#0D4A7A", maxWidth: "900px" }}
            >
              {t("aboutUs.impact.title")}
            </h2>

            <p
              className="text-[16px] sm:text-[18px] md:text-[20px] leading-[1.7] font-medium text-center mb-12"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#000000",
                maxWidth: "968px",
              }}
            >
              {t("aboutUs.impact.description")}
            </p>

            <div className="w-full flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-12 mb-6 sm:mb-8 md:mb-12">
              <div className="flex flex-col gap-6 sm:gap-8 flex-1">
                {impactPoints.map((text, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4"
                  >
                    <SiteCheckBadge />
                    <p
                      className="text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-relaxed"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: "#000000" }}
                    >
                      {text}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="relative shrink-0 w-full lg:w-[430px]"
                style={{ height: "clamp(320px, 40vw, 582px)" }}
              >
                <img
                  src="/assets/ourimpact1.png"
                  alt="Our Impact"
                  className="w-full h-full object-cover"
                  style={{ borderRadius: "40px" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Support Section */}
      <section className="w-full bg-[#F9FAFB] pt-0 pb-4 md:pb-6 lg:pb-12 -mt-8 md:-mt-12">
        <div className="w-full navbar-align-outer">
          <div className="w-full navbar-align-inner">
            <div
              className="w-full flex flex-col items-center justify-center relative overflow-hidden py-8 sm:py-10 md:py-12 lg:py-14 min-h-[260px] md:min-h-[300px] text-white rounded-[20px]"
              style={{
                backgroundImage: `linear-gradient(0deg, #00000094, #00000094), url('/assets/aboutusnavigate.jpg')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Title */}
              <h2
                className="font-medium text-center max-w-[90%] md:max-w-[823px] text-[30px] md:text-[35px] lg:text-[45px] leading-tight md:leading-[100%] px-4"
                style={{ fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}
              >
                {t("aboutUs.cta.title")}
              </h2>

              {/* Description */}
              <p
                className="font-medium text-center mt-6 md:mt-[35px] max-w-[90%] md:max-w-[940px] text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-relaxed md:leading-[34px] px-4"
                style={{ fontFamily: "'DM Sans', sans-serif", color: "#FFFFFF" }}
              >
                {t("aboutUs.cta.description")}
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 md:gap-5 items-center mt-8 md:mt-[45px] px-4 w-full max-w-[280px] sm:max-w-none mx-auto">
                {/* Book Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openModal()}
                  className="flex w-full sm:w-auto items-center justify-center cursor-pointer px-5 sm:px-6 md:px-8 py-3 md:py-4 gap-2 rounded-full bg-[#1B4585] text-white font-semibold text-[clamp(15px,0.9vw,18px)] transition-all whitespace-nowrap"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <span className="whitespace-nowrap">{t("aboutUs.cta.bookAppointment")}</span>

                  <svg
                    width="18"
                    height="18"
                    className="shrink-0 sm:w-5 sm:h-5"
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
                </motion.button>

                {/* Meet Team Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/team")}
                  className="flex w-full sm:w-auto items-center justify-center cursor-pointer px-5 sm:px-6 md:px-8 py-3 md:py-4 rounded-full bg-transparent text-white border border-white font-semibold md:text-[clamp(15px,0.9vw,18px)] transition-all whitespace-nowrap"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {t("aboutUs.cta.meetTeam")}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
