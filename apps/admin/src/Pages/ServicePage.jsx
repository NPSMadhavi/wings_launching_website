import React, { useState, useEffect, useCallback } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Footer } from "../components/Layout/Footer.jsx";
import { useAppointment } from "@/context/AppointmentContext";
import { useLocation } from "wouter";
import { buildServiceCardsByTab } from "@/lib/serviceTabs";


export default function ServicePage() {
    const { t, i18n } = useTranslation();
    const { openModal } = useAppointment();
    const [activeTab, setActiveTab] = useState("counselling");
    const [hoveredButton, setHoveredButton] = useState(null);
    const [, setLocation] = useLocation();
    const [dynamicCardsByTab, setDynamicCardsByTab] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const lang = (i18n.language || "en").split("-")[0];

        const loadServices = async () => {
            try {
                const localizedUrl = `/api/counselling-types?lang=${encodeURIComponent(lang)}`;
                const requests =
                    lang === "en"
                        ? [fetch(localizedUrl)]
                        : [fetch(localizedUrl), fetch("/api/counselling-types")];

                const responses = await Promise.all(requests);
                const localizedJson = await responses[0].json();
                const englishJson =
                    responses[1] != null ? await responses[1].json() : null;

                if (
                    !cancelled &&
                    localizedJson.success &&
                    Array.isArray(localizedJson.data)
                ) {
                    const englishTypes =
                        englishJson?.success && Array.isArray(englishJson.data)
                            ? englishJson.data
                            : null;
                    setDynamicCardsByTab(
                        buildServiceCardsByTab(localizedJson.data, englishTypes)
                    );
                }
            } catch {
                if (!cancelled) setDynamicCardsByTab(null);
            }
        };

        loadServices();
        return () => {
            cancelled = true;
        };
    }, [i18n.language]);

    const counsellingRoutes = [
        "/Familysupport",
        "/Marital",
        "/SubService",
        "/Pre-school",
        "/Youth",
        "/Adult",
    ];
    const supervisionRoutes = [
      "/Clinicalsupervision",
      "/Personaltherapy",
    ];
    const trainingRoutes = [
      "/Schooloutreach",
      "/Workplace",
      "/Community",
      "/Skill",
    ];

    // Sync tab with URL hash
    React.useEffect(() => {
        const handleHash = () => {
            const hash = window.location.hash.replace("#", "");
            if (["counselling", "supervision", "training"].includes(hash)) {
                setActiveTab(hash);
                // Scroll to tabs section if needed
                const tabsEl = document.querySelector(".tab-selector");
                if (tabsEl) {
                    tabsEl.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        };

        handleHash();
        window.addEventListener("hashchange", handleHash);
        return () => window.removeEventListener("hashchange", handleHash);
    }, []);

    const getTitle = () => {
        switch (activeTab) {
            case "counselling": return t("services.counselling.title");
            case "supervision": return t("services.supervision.title");
            case "training": return t("services.training.title");
            default: return t("services.counselling.title");
        }
    };

    const getDescription = () => {
        switch (activeTab) {
            case "counselling":
                return t("services.counselling.description");
            case "supervision":
                return t("services.supervision.description");
            case "training":
                return t("services.training.description");
            default:
                return t("services.counselling.description");
        }
    };

    const isTrainingTab = activeTab === "training";
    const isSupervisionTab = activeTab === "supervision";
    const isCounsellingTab = activeTab === "counselling";

    const getCards = () => {
        return dynamicCardsByTab?.[activeTab] || [];
    };

    const navigateToCard = useCallback((card, index) => {
        if (card?.id) {
            setLocation(`/services/sub/${card.id}`);
            return;
        }

        if (activeTab === "counselling") {
            setLocation(counsellingRoutes[index]);
        } else if (activeTab === "supervision") {
            setLocation(supervisionRoutes[index]);
        } else if (activeTab === "training") {
            setLocation(trainingRoutes[index]);
        }
    }, [setLocation, activeTab]);

    // Split description into lines for training tab
    const renderDescription = (description) => {
        if (activeTab === "training" && description.includes("\n")) {
            return description.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                    {line}
                    {i < description.split("\n").length - 1 && <br />}
                </React.Fragment>
            ));
        }
        return description;
    };

    return (
        <div className="w-full flex flex-col min-h-screen items-center bg-[#FAFAF5]">
            {/* ── Hero Section ── CENTERED */}
            <div
                className="relative flex w-full shrink-0 overflow-hidden items-center justify-center"
                style={{
                    minHeight: "480px",
                    height: "clamp(480px, 55vw, 790px)",
                    background: "linear-gradient(180deg, rgba(58,58,58,0.8) 0%, rgba(0,0,0,0.7) 100%), url('/assets/howituseImage.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="relative w-full h-full navbar-align-outer">
  <div className="navbar-align-inner h-full">
    <div className="flex flex-col items-center justify-center text-center h-full max-w-[900px] mx-auto">
                        <h1 className="text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px] font-semibold leading-[1.1] sm:leading-tight mb-4 sm:mb-6 font-['Outfit'] text-white md:pt-[70px]">
                            {t("services.hero.title")}
                        </h1>

                        <p className="text-[clamp(15px,2.5vw,20px)] leading-relaxed mb-6 sm:mb-8 font-['DM_Sans'] font-normal text-white max-w-[750px] px-1">
                         {t("services.hero.description")}
                        </p>

                        <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => {
        document
            .getElementById("services-tabs")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
    }}
    className="flex items-center justify-center border-none cursor-pointer h-[clamp(46px,6vw,60px)] rounded-full bg-[#1B4585] px-5 min-[375px]:px-6 sm:px-8 gap-2 sm:gap-[10px]"
>
    <span className="text-[14px] sm:text-[16px] md:text-[18px] font-['Plus_Jakarta_Sans'] font-semibold text-white whitespace-nowrap">
        {t("services.hero.button")}
    </span>
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
    >
        <path
            d="M6 9L12 15L18 9"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
</motion.button>
                    </div>
                </div>
            </div>
</div>
            {/* ── Tabs + Cards Section ── WITH 150px PADDING */}
            
<div className="w-full pb-12 sm:pb-16 md:pb-20 overflow-x-hidden">
  <div className="w-full navbar-align-outer">
    <div className="navbar-align-inner flex flex-col">
                {/* Tab Selector - CENTERED */}
                <div
                    id="services-tabs"
                    className="tab-selector grid grid-cols-3 gap-1.5 sm:flex sm:gap-1 mt-8 sm:mt-12 md:mt-16 lg:mt-20 w-full max-w-full sm:max-w-[800px] mx-auto rounded-[28px] sm:rounded-[30px] bg-gradient-to-r from-[#0D4A7A] to-[#1B4585] p-1.5 sm:p-1 min-h-[52px] sm:min-h-0 sm:h-[clamp(48px,7vw,60px)] items-stretch sm:items-center shrink-0"
                >
                    {["counselling", "supervision", "training"].map((tab) => (
                        <div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-[22px] sm:rounded-[30px] flex items-center justify-center text-center font-['DM_Sans' text-[clamp(14px,2vw,18px)] leading-[1.15] sm:leading-normal px-1 min-[360px]:px-1.5 sm:px-3 md:px-4 py-2 sm:py-0 sm:flex-1 sm:min-w-0 sm:h-[clamp(38px,5vw,52px)] cursor-pointer transition-all duration-300 sm:whitespace-nowrap ${
                                activeTab === tab
                                    ? "bg-white text-[#0D4A7A] shadow-sm"
                                    : "bg-transparent text-white"
                            }`}
                        >
                            {tab === "counselling"
                                ? t("services.tabs.counselling")
                                : tab === "supervision"
                                ? t("services.tabs.supervision")
                                : t("services.tabs.training")}
                        </div>
                    ))}
                </div>

                {/* Section Title - CENTERED */}
                <div className="mt-8 sm:mt-12 md:mt-16 lg:mt-[90px] text-center px-1">
                    <h2 className="text-[clamp(22px,5vw,35px)] font-medium mb-3 sm:mb-4 font-['Outfit'] text-[#0D4A7A] leading-[1.2]">
                        {getTitle()}
                    </h2>
                    <p
                        className={`text-[clamp(14px,2.5vw,20px)] leading-relaxed mx-auto whitespace-pre-line font-['DM_Sans'] font-medium text-[#333333] max-w-[930px] ${
                            activeTab === "training" ? "line-clamp-3 sm:line-clamp-none" : ""
                        }`}
                    >
                        {renderDescription(getDescription())}
                    </p>
                </div>

                {/* Cards Grid */}
                <div
                    className={`mt-8 sm:mt-10 md:mt-12 grid gap-4 sm:gap-5 md:gap-6 w-full cursor-pointer ${
                        isCounsellingTab
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            : "grid-cols-1 md:grid-cols-2 max-w-[1000px] mx-auto"
                    }`}
                >
                    {getCards().map((card, index) => (
                        <div
                            key={index}
                            className="flex flex-col w-full transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 rounded-[10px] bg-white shadow-[0px_10px_30px_rgba(0,0,0,0.05)] overflow-hidden max-w-full h-full"
                        >
                            {/* Image */}
                            <div
                                onClick={() => navigateToCard(card, index)}
                                className="w-full relative shrink-0 transition-transform duration-300 hover:scale-[1.02] aspect-[16/10] sm:aspect-[2/1] md:aspect-auto md:h-[clamp(160px,22vw,206px)] bg-cover bg-center"
                                style={{
                                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%), url(${card.image})`,
                                }}
                            >
                                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 font-['Outfit'] font-medium text-[clamp(15px,2vw,20px)] leading-[1.3] text-white line-clamp-2">
                                    {card.title}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col flex-1 p-4 sm:p-5 min-w-0">
                                {/* Description */}
                                <p className="text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed mb-3 sm:mb-4 font-['DM_Sans'] font-normal text-black">
                                    <span className="line-clamp-4 sm:line-clamp-5">
                                        {card.description}
                                    </span>

                                    <span
                                      onClick={() => navigateToCard(card, index)}
                                        className="text-[#1B4585] underline cursor-pointer font-medium ml-1 inline-block mt-1"
                                    >
                                        {t("services.buttons.readMore")}
                                    </span>
                                </p>

                                {/* Tags – Training tab */}
                                {isTrainingTab && card.tags && (
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                        {card.tags.map((tag, tagIndex) => (
                                            <span
                                                key={tagIndex}
                                                className="font-['DM_Sans'] font-medium text-[11px] sm:text-[13px] md:text-[14px] px-2.5 sm:px-3 py-1 bg-[#F0F4F8] text-[#1B4585] rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Book an Appointment Button */}
                                <button
                                        onClick={() => openModal(card.appointmentSelection || card.title)}
                                        className={`flex items-center justify-center gap-2 mt-auto w-full cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] py-3 px-4 sm:py-3 sm:px-5 rounded-full border border-[#1B4585] font-['DM_Sans'] font-semibold text-[13px] md:text-[16px] ${
                                            hoveredButton === `${activeTab}-${index}`
                                                ? "bg-[#1B4585] text-white"
                                                : "bg-white text-[#1B4585]"
                                        }`}
                                        onMouseEnter={() => setHoveredButton(`${activeTab}-${index}`)}
                                        onMouseLeave={() => setHoveredButton(null)}
                                    >
                                        {t("services.buttons.bookAppointment")}
                                        
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
                                    </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            </div>
            </div>

            {/* Footer */}
            <Footer />

            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}