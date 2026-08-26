import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    ChevronDown,
    ArrowDown,
} from "lucide-react";
import {
    SiteCalendarIcon,
    SiteClockIcon,
    SiteMapPinIcon,
    SITE_ICON_SIZE_SM,
} from "@/components/ui/SiteIcons";
import { useTranslation } from "react-i18next";
import { Footer } from "../components/Layout/Footer.jsx";
import SEO from "@/components/SEO";

function Events() {
    const { t, i18n } = useTranslation();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredButton, setHoveredButton] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("all");

    const filterOptions = [
        { key: "all", label: t("events.listing.filters.all") },
        { key: "inPerson", label: t("events.listing.filters.inPerson") },
        { key: "online", label: t("events.listing.filters.online") },
    ];

    const selectedFilterLabel =
        filterOptions.find((o) => o.key === selectedFilter)?.label ||
        t("events.listing.filters.all");

    const lang = (i18n.language || "en").split("-")[0];

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch(
                    `/api/events?lang=${encodeURIComponent(lang)}`
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch events");
                }

                const data = await response.json();

                setEvents(Array.isArray(data) ? data : []);

            } catch (error) {
                console.error("Error fetching events:", error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();

        // REAL-TIME AUTO UPDATE
        const eventSource = new EventSource(
            "/api/events/stream"
        );

        eventSource.addEventListener("event_created", fetchEvents);
        eventSource.addEventListener("event_updated", fetchEvents);
        eventSource.addEventListener("event_deleted", fetchEvents);

        eventSource.onerror = (error) => {
            console.error("SSE Error:", error);
        };

        return () => {
            eventSource.close();
        };

    }, [lang]);

    const formatDate = (dateString) => {
        if (!dateString) return t("events.listing.tba");

        return new Date(dateString).toLocaleDateString("en-SG", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return t("events.listing.tba");

        return new Date(dateString).toLocaleTimeString("en-SG", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Check if event is online or in-person
    const getEventType = (location) => {
        const locationLower = location?.toLowerCase() || "";
        if (locationLower.includes("zoom") || locationLower.includes("online")) {
            return "online";
        }
        return "inPerson";
    };

    const getEventTypeLabel = (typeKey) =>
        typeKey === "online"
            ? t("events.listing.online")
            : t("events.listing.inPerson");

    // Filter events based on selected filter
    const filteredEvents = events.filter(event => {
        if (selectedFilter === "all") {
            return true;
        }
        return getEventType(event.location) === selectedFilter;
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isDropdownOpen]);

    if (loading) {
        return (
            <div className="w-full flex justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-[#0D4A7A] border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <section
            id="events-section"
            className="w-full flex flex-col items-center py-10 sm:py-14 md:py-[60px] bg-[#FAFAF5]"
        >
            {/* RESPONSIVE PADDING */}
            <div className="w-full navbar-align-outer">
  <div className="navbar-align-inner">
                {/* HEADER */}
                <div className="w-full flex flex-wrap justify-between items-center gap-4 mb-10">
                    <h2
                        className="text-[26px] sm:text-[30px] md:text-[35px]"
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 500,
                            color: "#0D4A7A",
                            lineHeight: "100%",
                        }}
                    >
                        {t("events.listing.title")}
                    </h2>

                    {/* Custom Dropdown */}
                    <div className="relative dropdown-container">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-between bg-white"
                            style={{
                                width: "140px",
                                height: "44px",
                                padding: "0 16px",
                                borderRadius: "8px",
                                border: "1px solid #E5E7EB",
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 500,
                                fontSize: "16px",
                                color: "#000000",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                cursor: "pointer",
                            }}
                        >
                            {selectedFilterLabel}
                            <ChevronDown 
                                size={20} 
                                color="#6B7280"
                                style={{
                                    transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.3s ease"
                                }}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 z-50"
                                style={{
                                    minWidth: "140px",
                                    overflow: "hidden",
                                }}
                            >
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.key}
                                        onClick={() => {
                                            setSelectedFilter(option.key);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                        style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 500,
                                            fontSize: "14px",
                                            color: selectedFilter === option.key ? "#0D4A7A" : "#333333",
                                            backgroundColor: selectedFilter === option.key ? "#F0F7FF" : "transparent",
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* RESPONSIVE GRID - Reduced bottom margin */}
                {filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-0">
                        {filteredEvents.map((event, index) => {
                            const eventType = getEventType(event.location);
                            const isOnline = eventType === "online";
                            const eventTypeLabel = getEventTypeLabel(eventType);

                            return (
                                <div
                                    key={event.id}
                                    className="flex flex-col transition-all duration-300 hover:-translate-y-1"
                                    style={{
                                        width: "100%",
                                        minHeight: "500px",
                                        borderRadius: "12px",
                                        backgroundColor: "#FFFFFF",
                                        boxShadow: "0px 10px 30px rgba(0,0,0,0.05)",
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* IMAGE */}
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "220px",
                                            backgroundImage: `url('${event.photoUrls?.[0] ||
                                                "/assets/eventherosection.png"
                                                }')`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            position: "relative",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {/* BADGE */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "16px",
                                                right: "16px",
                                                height: "32px",
                                                backgroundColor: isOnline ? "#0D4A7A" : "#1B4585",
                                                borderRadius: "8px",
                                                padding: "0 14px",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontWeight: 500,
                                                    fontSize: "13px",
                                                    color: "#FFFFFF",
                                                }}
                                            >
                                                {eventTypeLabel}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CONTENT */}
                                    <div className="flex flex-col flex-1 p-5">
                                        <h3
                                            className="text-[18px] md:text-[20px]"
                                            style={{
                                                fontFamily: "'Outfit', sans-serif",
                                                color: "#000000",
                                                lineHeight: "1.3",
                                                fontWeight: 500,
                                                marginBottom: "12px",
                                            }}
                                        >
                                            {event.title}
                                        </h3>

                                        <p
                                            className="line-clamp-2 text-[14px] md:text-[15px]"
                                            style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontWeight: 400,
                                                color: "#333333",
                                                lineHeight: "1.6",
                                                marginBottom: "20px",
                                            }}
                                        >
                                            {event.description}
                                        </p>

                                        {/* DETAILS */}
                                        <div className="flex flex-col gap-3 mb-6">
                                            <div className="flex items-center gap-3">
                                                <SiteCalendarIcon size={SITE_ICON_SIZE_SM} />
                                                <span
                                                    style={{
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontWeight: 500,
                                                        fontSize: "14px",
                                                        color: "#333333",
                                                    }}
                                                >
                                                    {formatDate(event.eventDate)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <SiteClockIcon size={SITE_ICON_SIZE_SM} />
                                                <span
                                                    style={{
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontWeight: 500,
                                                        fontSize: "14px",
                                                        color: "#333333",
                                                    }}
                                                >
                                                    {formatTime(event.eventDate)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <SiteMapPinIcon size={SITE_ICON_SIZE_SM} />
                                                <span
                                                    className="line-clamp-1"
                                                    style={{
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontWeight: 500,
                                                        fontSize: "14px",
                                                        color: "#333333",
                                                    }}
                                                >
                                                    {event.location}
                                                </span>
                                            </div>
                                        </div>

                                        {/* PRICE + BUTTON */}
                                        <div className="mt-auto flex items-center justify-between">
                                            <span
                                                className="text-[20px] md:text-[24px]"
                                                style={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    color: "#000000",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {event.price || t("events.listing.free")}
                                            </span>

                                            <button
                                                onMouseEnter={() => setHoveredButton(index)}
                                                onMouseLeave={() => setHoveredButton(null)}
                                                onClick={() => window.open("https://ramakrishna.org.sg/event", "_blank")}
                                                style={{
                                                    minHeight: "40px",
                                                    height: "auto",
                                                    padding: "6px 14px",
                                                    borderRadius: "9999px",
                                                    border: "1px solid #1E3A8A",
                                                    backgroundColor: hoveredButton === index ? "#1E3A8A" : "transparent",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "6px",
                                                    cursor: "pointer",
                                                    transition: "all 0.3s ease",
                                                    maxWidth: "100%",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        fontWeight: 500,
                                                        fontSize: "13px",
                                                        color: hoveredButton === index ? "#FFFFFF" : "#1E3A8A",
                                                        transition: "color 0.3s ease",
                                                        textAlign: "center",
                                                        lineHeight: "1.2",
                                                    }}
                                                >
                                                    {t("events.listing.registerNow")}
                                                </span>
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M9 18L15 12L9 6"
                                                        stroke={hoveredButton === index ? "#FFFFFF" : "#1B4585"}
                                                        strokeWidth="3.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-[#666] font-['DM_Sans'] font-medium text-[18px]">
                            {selectedFilter === "all"
                                ? t("events.listing.noEvents")
                                : t("events.listing.noFilteredEvents", { filter: selectedFilterLabel })}
                        </p>
                    </div>
                )}
            </div>
            </div>
        </section>
    );
}

export default function EventsPage() {
    const { t } = useTranslation();
    const [subEmail, setSubEmail] = useState("");
    const [subStatus, setSubStatus] = useState("idle"); // idle | loading | success | duplicate | error

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!subEmail.trim()) return;
        setSubStatus("loading");
        try {
            const res = await fetch("/api/notify/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: subEmail.trim(), type: "event" }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 409 || data.alreadySubscribed) { setSubStatus("duplicate"); return; }
            if (!res.ok) throw new Error();
            setSubStatus("success");
            setSubEmail("");
        } catch {
            setSubStatus("error");
        }
    };
    return (
        <div className="w-full flex flex-col min-h-screen items-center bg-[#FAFAF5]">
            <SEO
                title="Events & Workshops | WINGS Counselling Centre"
                description="Discover upcoming mental health events, community workshops, parenting talks, and clinical training sessions hosted by WINGS Counselling Centre."
                path="/events"
                ogImage="/assets/EventsHeroImage.jpg"
            />
            {/* HERO SECTION */}
            <div
                className="relative flex w-full shrink-0 overflow-hidden"
                style={{
                    minHeight: "480px",
                    height: "clamp(480px, 55vw, 790px)",
                    background: "linear-gradient(180deg, rgba(58,58,58,0.5) 0%, rgba(0,0,0,0.6) 100%), url('/assets/eventherosection.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
               <div className="relative w-full h-full navbar-align-outer">
  <div className="navbar-align-inner h-full flex items-center justify-center">
    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.3,
                            ease: "easeOut",
                        }}
                        className="flex flex-col items-center justify-center text-center"
                        style={{ maxWidth: "840px" }}
                    >
                        <h1
                            className="text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px]"
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                color: "#FFFFFF",
                                fontWeight: 600,
                                lineHeight: "1.2",
                                marginBottom: "24px",
                            }}
                        >
                            {t("events.hero.title")}
                        </h1>

                        <p
                            className="text-[16px] md:text-[20px]"
                            style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 400,
                                color: "#FFFFFF",
                                maxWidth: "700px",
                                lineHeight: "1.8",
                                marginBottom: "32px",
                            }}
                        >
                            {t("events.hero.description")}
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                height: "60px",
                                padding: "0 32px",
                                gap: "10px",
                                borderRadius: "9999px",
                                backgroundColor: "#1B4585",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                const eventsSection = document.getElementById("events-section");
                                if (eventsSection) {
                                    eventsSection.scrollIntoView({ behavior: "smooth" });
                                }
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                    fontSize: "18px",
                                }}
                            >
                                {t("events.hero.button")}
                            </span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>
                    </motion.div>
                    </div>
                </div>
            </div>

            {/* EVENTS */}
            <Events />

            {/* NEWSLETTER / UPCOMING EVENTS SECTION */}
           <div className="w-full flex flex-col items-center py-10 sm:py-12 bg-[#FAFAF5]">
  <div className="w-full navbar-align-outer">
    <div className="navbar-align-inner">
      <div className="w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#0D4A7A] rounded-[16px] md:rounded-[20px] px-5 py-10 sm:px-8 sm:py-12 md:py-14 min-h-[280px] sm:min-h-[300px] md:min-h-[338px]">   

                        <h2 className="font-['Outfit'] font-medium text-[clamp(24px,5vw,35px)] leading-tight text-white mb-3 sm:mb-4 text-center px-2">
                            {t("events.newsletter.title")}
                        </h2>

                        <p className="font-['DM_Sans'] font-medium text-[clamp(15px,2.5vw,20px)] leading-snug text-white mb-6 sm:mb-8 md:mb-10 text-center max-w-[600px] px-2">
                            {t("events.newsletter.description")}
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full justify-center max-w-[720px]">
                            {subStatus === "success" ? (
                                <p className="text-white font-['DM_Sans'] font-semibold text-[15px] sm:text-[17px] text-center">
                                     {t("events.newsletter.success")}
                                </p>
                            ) : (
                                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full justify-center">
                                    <div className="relative w-full sm:flex-1 sm:max-w-[483px] h-[52px] sm:h-[56px] md:h-[60px]">
                                        <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2">
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#9CA3AF"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            value={subEmail}
                                            onChange={(e) => { setSubEmail(e.target.value); setSubStatus("idle"); }}
                                            placeholder={t("events.newsletter.emailPlaceholder")}
                                            required
                                            className="w-full h-full rounded-[24px] sm:rounded-[30px] border-none pl-12 sm:pl-[60px] pr-4 sm:pr-5 font-['DM_Sans'] font-normal text-[15px] sm:text-[16px] md:text-[18px] outline-none bg-white"
                                        />
                                    </div>

                                    <motion.button
                                        type="submit"
                                        disabled={subStatus === "loading"}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-full sm:w-[160px] h-[52px] sm:h-[56px] md:h-[60px] shrink-0 bg-transparent rounded-full border border-white text-[#F5F9FF] font-['Plus_Jakarta_Sans'] font-semibold text-[16px] sm:text-[17px] md:text-[18px] cursor-pointer transition-all duration-300 hover:bg-white hover:text-[#0D4A7A] disabled:opacity-70"
                                    >
                                        {subStatus === "loading" ? t("events.newsletter.loading") : t("events.newsletter.notifyMe")}
                                    </motion.button>
                                </form>
                            )}
                        </div>
                        {subStatus === "duplicate" && (
                            <p className="text-[#FFD700] font-['DM_Sans'] text-[13px] sm:text-[14px] mt-3 sm:mt-[10px] text-center">
                                {t("events.newsletter.duplicate")}
                            </p>
                        )}
                        {subStatus === "error" && (
                            <p className="text-[#FCA5A5] font-['DM_Sans'] text-[13px] sm:text-[14px] mt-3 sm:mt-[10px] text-center">
                                {t("events.newsletter.error")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
</div>
            <Footer />
        </div>
        
    );
}