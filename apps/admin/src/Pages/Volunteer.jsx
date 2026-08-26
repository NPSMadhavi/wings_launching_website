// src/pages/Volunteer.jsx
import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Layout/Footer";
import SEO from "@/components/SEO";
import {
  HeartHandshake,
  Mic,
  Users,
  TreePine,
  ClipboardList,
  GraduationCap,
  Briefcase,
  Heart,
} from "lucide-react";

const volunteerCardImages = [
  "/assets/volunteer1.png",
  "/assets/volunteer2.png",
  "/assets/volunteer3.jpeg",
  "/assets/volunteer4.jpeg",
];

const opportunityIcons = [
  <Mic size={24} strokeWidth={2} color="#1E3A8A" key="mic" />,
  <Users size={24} strokeWidth={2} color="#1E3A8A" key="users" />,
  <TreePine size={24} strokeWidth={2} color="#1E3A8A" key="tree" />,
  <ClipboardList size={24} strokeWidth={2} color="#1E3A8A" key="clipboard" />,
];

const whoVolunteerIcons = [
  <GraduationCap size={28} strokeWidth={2} color="#1E3A8A" key="grad" />,
  <Briefcase size={28} strokeWidth={2} color="#1E3A8A" key="briefcase" />,
  <Heart size={28} strokeWidth={2} color="#1E3A8A" key="heart" />,
];

const Volunteer = () => {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [hoveredCard, setHoveredCard] = useState(null);

  const whyCardsRaw = t("volunteer.whyVolunteer.cards", { returnObjects: true });
  const whyCards = Array.isArray(whyCardsRaw) ? whyCardsRaw : [];

  const opportunitiesRaw = t("volunteer.opportunities.items", { returnObjects: true });
  const opportunities = Array.isArray(opportunitiesRaw) ? opportunitiesRaw : [];

  const processStepsRaw = t("volunteer.process.steps", { returnObjects: true });
  const processSteps = Array.isArray(processStepsRaw) ? processStepsRaw : [];

  const whoCardsRaw = t("volunteer.whoVolunteers.cards", { returnObjects: true });
  const whoCards = Array.isArray(whoCardsRaw) ? whoCardsRaw : [];

  return (
    <>
      <SEO
        title="Volunteer With Us | WINGS Counselling Centre"
        description="Join WINGS Counselling Centre as a volunteer and help empower individuals, families, and communities through mental health awareness and community support."
        path="/volunteer"
        ogImage="/assets/volunteer.png"
      />
      <main className="bg-[#F9F9F9]">
        {/* Hero */}
        <section
          className="relative w-full shrink-0 overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/volunteer.png')",
            minHeight: "480px",
            height: "clamp(480px, 55vw, 790px)",
          }}
        >
          <div className="absolute inset-0" style={{ background: "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65))" }} />

          <div className="relative z-10 w-full h-full navbar-align-outer">
            <div className="navbar-align-inner h-full flex flex-col items-center justify-center text-center text-white">
              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px]"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 500,
                  lineHeight: "100%",
                  textAlign: "center",
                  color: "#FFFFFF",
                  maxWidth: "715px",
                }}
              >
                {t("volunteer.hero.title")}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(14px, 1.4vw, 20px)",
                  lineHeight: "160%",
                  textAlign: "center",
                  color: "#FFFFFF",
                  maxWidth: "951px",
                  marginTop: "24px",
                }}
              >
                {t("volunteer.hero.description")}
              </motion.p>

              <motion.button
                onClick={() => navigate("/volunteerform")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 500,
                  fontSize: "18px",
                  lineHeight: "28px",
                  color: "#F5F9FF",
                  backgroundColor: "#1B4585",
                  borderRadius: "9999px",
                  padding: "16px 32px",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "32px",
                }}
              >
                {t("volunteer.hero.button")}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ position: "relative", top: "1.7px" }}
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
            </div>
          </div>
        </section>

        {/* Why volunteer */}
        <section style={{ paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>
          <div className="w-full navbar-align-outer">
            <div className="navbar-align-inner">
              <div className="flex flex-col items-center text-center">
                <h2
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500,
                    fontSize: "clamp(28px, 4vw, 48px)",
                    lineHeight: "120%",
                    color: "#0D4A7A",
                  }}
                >
                  {t("volunteer.whyVolunteer.title")}
                </h2>

                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: "clamp(14px, 1.15vw, 17px)",
                    lineHeight: "170%",
                    color: "#000000",
                    maxWidth: "900px",
                    marginTop: "20px",
                  }}
                >
                  {t("volunteer.whyVolunteer.description")}
                </p>
              </div>

              <div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                style={{ marginTop: "50px" }}
              >
                {whyCards.map((card, index) => (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="group relative overflow-hidden transition-transform duration-300 hover:-translate-y-1.5"
                    style={{
                      borderRadius: "16px",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div className="relative">
                      <img
                        src={volunteerCardImages[index] || volunteerCardImages[0]}
                        alt={card.title}
                        style={{
                          width: "100%",
                          height: "430px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      <div
                        className={`absolute bottom-0 left-0 w-full bg-[#0D4A7A] p-4 sm:p-5 overflow-hidden transition-all duration-700 ease-in-out ${
                          hoveredCard === index ? "min-h-[180px] h-auto" : "min-h-[78px] h-auto"
                        }`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <HeartHandshake
                            size={24}
                            strokeWidth={2}
                            color="#FFFFFF"
                            style={{ flexShrink: 0 }}
                          />
                          <h3
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 500,
                              fontSize: "18px",
                              lineHeight: "130%",
                              color: "#FFFFFF",
                              margin: 0,
                            }}
                          >
                            {card.title}
                          </h3>
                        </div>

                        <p
                          className={`overflow-hidden transition-all duration-700 ease-in-out ${
                            hoveredCard === index
                              ? "max-h-32 opacity-100 mt-3"
                              : "max-h-0 opacity-0 mt-0"
                          }`}
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 400,
                            fontSize: "16px",
                            lineHeight: "170%",
                            color: "rgba(255,255,255,0.85)",
                          }}
                        >
                          {card.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Opportunities */}
        <section style={{ backgroundColor: "#D9E1E8", paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>
          <div className="w-full navbar-align-outer">
            <div className="navbar-align-inner">
              <div>
                <h2
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500,
                    fontSize: "clamp(28px, 3.2vw, 40px)",
                    lineHeight: "100%",
                    color: "#0D4A7A",
                  }}
                >
                  {t("volunteer.opportunities.title")}
                </h2>

                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: "clamp(14px, 1.15vw, 17px)",
                    lineHeight: "160%",
                    color: "#000000",
                    marginTop: "12px",
                    maxWidth: "600px",
                  }}
                >
                  {t("volunteer.opportunities.description")}
                </p>
              </div>

              <div
                className="grid gap-6 md:grid-cols-2"
                style={{ marginTop: "40px" }}
              >
                {opportunities.map((item, index) => (
                  <div
                    key={index}
                    className="transition-transform duration-300 hover:-translate-y-1"
                    style={{
                      backgroundColor: "#F9F9F9",
                      borderRadius: "20px",
                      padding: "28px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          minWidth: "60px",
                          borderRadius: "10px",
                          backgroundColor: "#E8F4FD",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#DE5753",
                        }}
                      >
                        {opportunityIcons[index]}
                      </div>

                      <div>
                        <h3
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 500,
                            fontSize: "clamp(20px, 1.8vw, 24px)",
                            lineHeight: "130%",
                            color: "#000204",
                            margin: 0,
                          }}
                        >
                          {item.title}
                        </h3>

                        <p
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 500,
                            fontSize: "14px",
                            lineHeight: "150%",
                            color: "#0D4A7A",
                            marginTop: "4px",
                          }}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: "clamp(14px, 1.1vw, 16px)",
                        lineHeight: "170%",
                        color: "#000000",
                        marginTop: "16px",
                      }}
                    >
                      {item.description}
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "18px" }}>
                      {(Array.isArray(item.tags) ? item.tags : []).map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 500,
                            fontSize: "12px",
                            lineHeight: "150%",
                            color: "#0D4A7A",
                            backgroundColor: "#D9E1E8",
                            borderRadius: "9999px",
                            padding: "5px 14px",
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
        </section>

        {/* Process */}
        <section style={{ paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>
          <div className="w-full navbar-align-outer">
            <div className="navbar-align-inner" style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 500,
                  fontSize: "clamp(28px, 3.2vw, 40px)",
                  lineHeight: "100%",
                  color: "#0D4A7A",
                }}
              >
                {t("volunteer.process.title")}
              </h2>

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(14px, 1.15vw, 17px)",
                  lineHeight: "160%",
                  color: "#000000",
                  marginTop: "12px",
                }}
              >
                {t("volunteer.process.description")}
              </p>

              <div style={{ marginTop: "60px" }}>
                <div
                  className="hidden md:flex"
                  style={{
                    alignItems: "center",
                    paddingLeft: "calc(12.5% - 30px)",
                    paddingRight: "calc(12.5% - 30px)",
                    marginBottom: "28px",
                  }}
                >
                  {processSteps.map((_, index) => (
                    <React.Fragment key={index}>
                      <div
                        className="transition-transform duration-300 hover:scale-110"
                        style={{
                          width: "80px",
                          height: "80px",
                          minWidth: "80px",
                          borderRadius: "50%",
                          backgroundColor: "#1B4585",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 700,
                          fontSize: "24px",
                          color: "#FFFFFF",
                          position: "relative",
                          zIndex: 2,
                        }}
                      >
                        {index + 1}
                      </div>

                      {index < processSteps.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            marginLeft: "20px",
                            marginRight: "20px",
                            height: "5px",
                            borderRadius: "10px",
                            backgroundColor: "#DE5753",
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div
                  className="grid grid-cols-2 gap-6 md:hidden"
                  style={{ marginBottom: "24px" }}
                >
                  {processSteps.map((item, index) => (
                    <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          backgroundColor: "#1B4585",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 700,
                          fontSize: "24px",
                          color: "#FFFFFF",
                        }}
                      >
                        {index + 1}
                      </div>
                      <h3
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 500,
                          fontSize: "18px",
                          lineHeight: "130%",
                          color: "#1B4585",
                          margin: 0,
                          marginTop: "16px",
                          textAlign: "center",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 400,
                          fontSize: "16px",
                          lineHeight: "160%",
                          color: "#000000",
                          marginTop: "8px",
                          textAlign: "center",
                        }}
                      >
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  className="hidden md:grid md:grid-cols-4"
                  style={{ gap: "0px" }}
                >
                  {processSteps.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 500,
                          fontSize: "18px",
                          lineHeight: "130%",
                          color: "#1B4585",
                          margin: 0,
                        }}
                      >
                        {item.title}
                      </h3>

                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 400,
                          fontSize: "16px",
                          lineHeight: "160%",
                          color: "#000000",
                          marginTop: "8px",
                          maxWidth: "200px",
                        }}
                      >
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who volunteers */}
        <section style={{ backgroundColor: "#D9E1E8", paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>
          <div className="w-full navbar-align-outer">
            <div className="navbar-align-inner">
              <div style={{ textAlign: "center" }}>
                <h2
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500,
                    fontSize: "clamp(28px, 3.2vw, 40px)",
                    lineHeight: "100%",
                    color: "#0D4A7A",
                  }}
                >
                  {t("volunteer.whoVolunteers.title")}
                </h2>

                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: "clamp(14px, 1.15vw, 17px)",
                    lineHeight: "160%",
                    color: "#000000",
                    marginTop: "12px",
                    maxWidth: "700px",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  {t("volunteer.whoVolunteers.description")}
                </p>
              </div>

              <div
                className="grid gap-6 md:grid-cols-3"
                style={{ marginTop: "50px" }}
              >
                {whoCards.map((item, index) => (
                  <div
                    key={index}
                    className="transition-transform duration-300 hover:-translate-y-1.5"
                    style={{
                      backgroundColor: "#F9F9F9",
                      borderRadius: "20px",
                      padding: "32px",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "10px",
                        backgroundColor: "#E8F4FD",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#DE5753",
                        marginBottom: "20px",
                      }}
                    >
                      {whoVolunteerIcons[index]}
                    </div>

                    <h3
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 500,
                        fontSize: "clamp(20px, 1.8vw, 24px)",
                        lineHeight: "130%",
                        color: "#1B4585",
                        margin: 0,
                      }}
                    >
                      {item.title}
                    </h3>

                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: "clamp(14px, 1.1vw, 16px)",
                        lineHeight: "170%",
                        color: "#000000",
                        marginTop: "16px",
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ paddingTop: "clamp(60px, 8vw, 100px)", paddingBottom: "clamp(60px, 8vw, 100px)" }}>
          <div className="w-full navbar-align-outer">
            <div className="navbar-align-inner">
              <div
                style={{
                  backgroundColor: "#0D4A7A",
                  borderRadius: "24px",
                  padding: "clamp(48px, 6vw, 80px) clamp(24px, 4vw, 60px)",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-80px",
                    left: "-80px",
                    width: "240px",
                    height: "240px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "-60px",
                    right: "-60px",
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />

                <h2
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500,
                    fontSize: "clamp(28px, 3.5vw, 44px)",
                    lineHeight: "120%",
                    color: "#FFFFFF",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {t("volunteer.cta.title")}
                </h2>

                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: "clamp(14px, 1.15vw, 17px)",
                    lineHeight: "170%",
                    color: "rgba(255,255,255,0.9)",
                    maxWidth: "700px",
                    marginTop: "20px",
                    marginLeft: "auto",
                    marginRight: "auto",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {t("volunteer.cta.description")}
                </p>

                <button
                  onClick={() => navigate("/volunteerform")}
                  className="transition-transform duration-300 hover:scale-105 active:scale-95"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: "18px",
                    lineHeight: "28px",
                    color: "#1B4585",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "9999px",
                    padding: "16px 32px",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "36px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {t("volunteer.cta.button")}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Volunteer;
