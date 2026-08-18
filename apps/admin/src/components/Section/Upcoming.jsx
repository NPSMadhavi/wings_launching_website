import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { GetInTouch } from "./GetInTouch";
import { RecentArticles } from "./RecentArticles";
import {
    SiteCalendarIcon,
    SiteClockIcon,
    SiteMapPinIcon,
    SITE_ICON_SIZE_SM,
} from "@/components/ui/SiteIcons";
import { Testimonial } from "./Testimonial";


const formatDate = (dateString, tba) => {
    if (!dateString) return tba;

    return new Date(dateString).toLocaleDateString("en-SG", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

const formatTime = (dateString, tba) => {
    if (!dateString) return tba;

    return new Date(dateString).toLocaleTimeString("en-SG", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

/* ─── Event Card ───────────────────────────────────────────── */

function EventCard({ event }) {
    const { t } = useTranslation();
    const [hoveredButton, setHoveredButton] = useState(false);

    const locationLower = event.location?.toLowerCase() || "";
    const isOnline =
        locationLower.includes("zoom") || locationLower.includes("online");
    const eventType = isOnline ? t("upcoming.online") : t("upcoming.inPerson");
    const tba = t("upcoming.tba");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col transition-all duration-300 hover:-translate-y-1 w-full max-w-[400px]"
            style={{
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
                    backgroundImage: `url('${event.photoUrls?.[0] || "/assets/eventImage1.jpg"}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                    flexShrink: 0,
                }}
            >
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
                        {eventType}
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
                            {formatDate(event.eventDate, tba)}
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
                            {formatTime(event.eventDate, tba)}
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

                <div className="mt-auto flex items-center justify-between">
                    <span
                        className="text-[20px] md:text-[24px]"
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            color: "#000000",
                            fontWeight: 700,
                        }}
                    >
                        {event.price || t("upcoming.free")}
                    </span>

                    <button
                        onMouseEnter={() => setHoveredButton(true)}
                        onMouseLeave={() => setHoveredButton(false)}
                        onClick={() =>
                            window.open(
                                event.registrationUrl || "https://ramakrishna.org.sg/event",
                                "_blank"
                            )
                        }
                        style={{
                            minHeight: "40px",
                            height: "auto",
                            padding: "6px 14px",
                            borderRadius: "9999px",
                            border: "1px solid #1E3A8A",
                            backgroundColor: hoveredButton ? "#1E3A8A" : "transparent",
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
                                color: hoveredButton ? "#FFFFFF" : "#1E3A8A",
                                transition: "color 0.3s ease",
                                textAlign: "center",
                                lineHeight: "1.2",
                            }}
                        >
                            {t("upcoming.registerNow")}
                        </span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                            <path
                                d="M9 18L15 12L9 6"
                                stroke={hoveredButton ? "#FFFFFF" : "#1B4585"}
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Main Component ───────────────────────────────────────── */

export function Upcoming() {
    const { t, i18n } = useTranslation();
    const sectionRef = useRef(null);
    const [, navigate] = useLocation();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const lang = (i18n.language || "en").split("-")[0];

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch(
                    `/api/events?lang=${encodeURIComponent(lang)}`
                );
                if (!response.ok) throw new Error("Failed to fetch events");
                const data = await response.json();
                setEvents(Array.isArray(data) ? data.slice(0, 4) : []);
            } catch (error) {
                console.error("Error fetching events:", error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();

        const eventSource = new EventSource("/api/events/stream");
        eventSource.addEventListener("event_created", fetchEvents);
        eventSource.addEventListener("event_updated", fetchEvents);
        eventSource.addEventListener("event_deleted", fetchEvents);
        eventSource.onerror = (error) => console.error("SSE Error:", error);

        return () => eventSource.close();
    }, [lang]);

    return (
        <div
            ref={sectionRef}
            className="
                relative
                w-full
                flex
                flex-col
                items-center
                overflow-hidden
                bg-[#F9F9F9]
            "
        >
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{ y: bgY }}
            />

            {/* UPCOMING SECTION */}
            <section
                id="upcoming"
                className="w-full flex flex-col items-center pt-[60px] pb-[60px] box-border"
            >
                <div className="w-full navbar-align-outer">
                <div className="navbar-align-inner flex flex-col items-center">
                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="
                        text-[clamp(22px,4.8vw,28px)]
                        md:text-[35px]
                        text-center
                        font-medium
                        font-['Outfit']
                        leading-[1.2]
                        mb-4
                        text-[#0D4A7A]
                    "
                >
                    {t("upcoming.title")}
                </motion.h2>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="
                        text-black
                        text-center
                        font-['DM_Sans']
                        text-[16px]
                        md:text-[18px]
                        lg:text-[20px]
                        font-normal
                        leading-[1.5]
                        line-clamp-none
                        md:line-clamp-none
                        w-full
                        mb-8
                    "
                >
                    {t("upcoming.description")}
                </motion.p>

                {/* Events Grid */}
                {loading ? (
                    <div className="w-full flex justify-center py-16">
                        <div className="w-8 h-8 rounded-full border-2 border-[#0D4A7A] border-t-transparent animate-spin" />
                    </div>
                ) : events.length > 0 ? (
                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    xl:grid-cols-4
                    gap-6
                    xl:gap-8
                    w-full
                    mb-6
                    justify-items-center
                ">
                    {events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                        />
                    ))}
                </div>
                ) : (
                    <p className="text-[#666] font-['DM_Sans'] font-medium text-[18px] text-center py-12 mb-6">
                        {t("upcoming.noEvents")}
                    </p>
                )}

                {/* View All Button */}
                <div className="mt-2 md:mt-4">
                    <button
                        onClick={() => navigate("/events")}
                        className="
                            group
                            flex
                            items-center
                            justify-center
                            gap-2
                            whitespace-nowrap
                            rounded-full
                            bg-[#1B4585]
                            text-white
                            font-['Plus_Jakarta_Sans']
                            font-[700]
                            transition-all
                            duration-300
                            shadow-[0_4px_12px_rgba(27,69,133,0.3)]
                            hover:scale-105
                            active:scale-95
                        "
                        style={{
                            height: "46px",
                            padding: "0 24px",
                            fontSize: "clamp(15px,0.9vw,18px)",
                        }}
                    >
                        {t("upcoming.viewAll")}
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
                </div>
            </section>

            {/* RECENT ARTICLES */}
            <RecentArticles />

          <Testimonial />
       

            {/* GET IN TOUCH */}
            <GetInTouch />
        </div>
    );
}
