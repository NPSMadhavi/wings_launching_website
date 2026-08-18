import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Footer } from "../components/Layout/Footer.jsx";
import { useLocation } from "wouter";
import { useAppointment } from "@/context/AppointmentContext";
import { getArticleDetailPath } from "@/lib/articlePageContent";

export default function ArticlePage() {
    const { t, i18n } = useTranslation();
    const [, navigate] = useLocation();
    const { openModal } = useAppointment();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subEmail, setSubEmail] = useState("");
    const [subStatus, setSubStatus] = useState("idle"); // idle | loading | success | duplicate | error
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("__all__");

    const allArticlesLabel = t("articles.listing.filters.all");
    const articleFilterOptions = [
        { key: "__all__", label: allArticlesLabel },
        ...Array.from(
            new Set(
                articles
                    .map((article) => article.category)
                    .filter(Boolean)
            )
        ).map((category) => ({ key: category, label: category })),
    ];

    const selectedFilterLabel =
        articleFilterOptions.find((o) => o.key === selectedFilter)?.label ||
        allArticlesLabel;

    const filteredArticles = articles.filter((article) => {
        if (selectedFilter === "__all__") return true;
        return article.category === selectedFilter;
    });

    const cleanArticleContent = (content = "") =>
        content
            .replace(/<!--[\s\S]*?-->/g, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const getRoute = (article) => getArticleDetailPath(article);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!subEmail.trim()) return;
        setSubStatus("loading");
        try {
            const res = await fetch("/api/notify/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: subEmail.trim(), type: "article" }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 409 || data.alreadySubscribed) {
                setSubStatus("duplicate");
                return;
            }
            if (!res.ok) throw new Error();
            setSubStatus("success");
            setSubEmail("");
        } catch {
            setSubStatus("error");
        }
    };

    // FETCH ARTICLES (localized by navbar language)
    const fetchArticles = async () => {
        try {
            const lang = (i18n.language || "en").split("-")[0];
            const response = await fetch(`/api/articles?lang=${encodeURIComponent(lang)}`);

            if (!response.ok) {
                throw new Error("Failed to fetch articles");
            }

            const data = await response.json();

            console.log("ARTICLES DATA:", data);

            setArticles(data);
        } catch (error) {
            console.error("Error fetching articles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, [i18n.language]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest(".dropdown-container")) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isDropdownOpen]);

    return (
        <div className="w-full flex flex-col min-h-screen bg-[#FAFAF5]">

            {/* HERO SECTION */}
            <div
                className="relative flex w-full shrink-0 overflow-hidden"
                style={{
                    minHeight: "480px",
                    height: "clamp(480px, 55vw, 790px)",
                    background: `linear-gradient(180deg, rgba(58, 58, 58, 0.5) 0%, rgba(0, 0, 0, 0.6) 100%), url('/assets/articlesection.jpeg')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="relative w-full h-full navbar-align-outer">
                    <div className="navbar-align-inner h-full flex flex-col items-center justify-center text-center">

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-white font-semibold mb-4 md:mb-6 text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px] leading-[1.1] max-w-[900px]"
                        >
                            {t("articles.hero.title")}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-white text-[clamp(15px,2.5vw,20px)] leading-[1.5] max-w-[750px] px-2"
                        >
                            {t("articles.hero.description")}
                        </motion.p>

                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.1, delay: 0.1 }}
                            onClick={() => {
                                document
                                    .getElementById("featured-articles")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                            }}
                            className="mt-6 md:mt-10 bg-[#1B4585] rounded-full px-6 min-[375px]:px-8 py-3.5 min-[375px]:py-4 flex items-center gap-2 sm:gap-3 text-white text-[15px] md:text-[16px] lg:text-[18px] font-medium"
                        >
                            {t("articles.hero.button")}
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

            {/* FEATURED ARTICLES SECTION */}
            
            {/* FILTER SECTION */}
            <div id="featured-articles" className="w-full flex flex-col items-center pt-4 sm:pt-5 lg:py-[60px] pb-6 sm:pb-8 bg-[#FAFAF5]">
                <div className="w-full navbar-align-outer">
                    <div className="navbar-align-inner flex flex-wrap justify-between items-center gap-4">
                        <h2
                            className="text-[26px] sm:text-[30px] md:text-[35px]"
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 500,
                                color: "#0D4A7A",
                                lineHeight: "100%",
                            }}
                        >
                            {t("articles.listing.title")}
                        </h2>

                        <div className="relative dropdown-container">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between bg-white text-left gap-3"
                                style={{
                                    minWidth: "160px",
                                    maxWidth: "340px",
                                    minHeight: "44px",
                                    height: "auto",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid #E5E7EB",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 500,
                                    fontSize: "15px",
                                    color: "#000000",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                    cursor: "pointer",
                                }}
                            >
                                <span className="leading-snug break-words flex-1">
                                    {selectedFilterLabel}
                                </span>
                                <ChevronDown
                                    size={20}
                                    color="#6B7280"
                                    className="shrink-0"
                                    style={{
                                        transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.3s ease",
                                    }}
                                />
                            </button>

                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 w-max min-w-[200px] max-w-[340px] max-h-[300px] overflow-y-auto"
                                >
                                    {articleFilterOptions.map((option) => (
                                        <button
                                            key={option.key}
                                            onClick={() => {
                                                setSelectedFilter(option.key);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors break-words"
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
                </div>
            </div>

            {/* ARTICLES GRID - Reduced bottom padding */}
            <div className="w-full flex flex-col items-center pt-4 sm:pt-6 pb-10 sm:pb-12 bg-[#FAFAF5]">
                <div className="w-full navbar-align-outer">
                    <div className="navbar-align-inner">

                        {loading ? (
                            <div className="text-center text-[16px] sm:text-[18px] md:text-[20px]">
                                {t("articles.listing.loading")}
                            </div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="text-center text-[16px] sm:text-[18px] md:text-[20px]">
                                {t("articles.listing.noArticles")}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">

                                {filteredArticles.map((article, idx) => (
                                    <div
                                        key={article.id}
                                        onClick={() => navigate(getRoute(article))}
                                        className="bg-white group cursor-pointer rounded-[10px] overflow-hidden shadow-md flex flex-col h-full"
                                    >
                                        {/* IMAGE */}
                                        <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] md:h-[200px] lg:h-[220px] md:aspect-auto overflow-hidden">
                                            <img
                                                src={
                                                    article.coverImage
                                                        ? article.coverImage
                                                        : "/assets/article.jpg"
                                                }
                                                alt={article.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />

                                            {/* CATEGORY */}
                                            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white px-3 sm:px-4 py-1 rounded-full max-w-[calc(100%-1.5rem)]">
                                                <span className="text-[#1E3A8A] text-[10px] sm:text-[11px] font-semibold line-clamp-1">
                                                    {article.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* CONTENT */}
                                        <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-1 min-w-0">

                                            {/* AUTHOR + DATE */}
                                            <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4 min-w-0">
                                                <span className="text-[#1E3A8A] text-[12px] md:text-[13px] font-medium line-clamp-1 min-w-0">
                                                  Article sourced by {article.author}
                                                </span>

                                              
                                            </div>

                                            {/* TITLE */}
                                            <h3 className="text-[clamp(16px,3.5vw,20px)] font-semibold leading-[1.35] mb-2 sm:mb-3 line-clamp-3">
                                                {article.title}
                                            </h3>

                                            {/* EXCERPT */}
                                            <p className="text-[13px] sm:text-[14px] leading-[1.65] sm:leading-[1.7] text-[#555] mb-4 sm:mb-5 line-clamp-3 flex-1">
                                                {cleanArticleContent(article.content)}
                                            </p>

                                            {/* BUTTON */}
                                            <button
                                                className="mt-auto ml-auto flex items-center justify-center text-black hover:translate-x-1 transition-all duration-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(getRoute(article));
                                                }}
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M9 18L15 12L9 6"
                                                        stroke="#1B4585"
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
                        )}
                    </div>
                </div>
            </div>

            {/* NEWSLETTER / UPCOMING ARTICLES SECTION */}
            <div className="w-full flex flex-col items-center py-10 sm:py-12 bg-[#FAFAF5]">
                <div className="w-full navbar-align-outer">
                    <div className="navbar-align-inner">
                        <div className="w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#0D4A7A] rounded-[16px] md:rounded-[20px] px-5 py-10 sm:px-8 sm:py-12 md:py-14 min-h-[280px] sm:min-h-[300px] md:min-h-[338px]">

                            {/* Title */}
                            <h2 className="font-['Outfit'] font-medium text-[clamp(24px,5vw,35px)] leading-tight text-white mb-3 sm:mb-4 text-center px-2">
                                {t("articles.newsletter.title")}
                            </h2>

                            {/* Subtitle */}
                            <p className="font-['DM_Sans'] font-medium text-[clamp(15px,2.5vw,20px)] leading-snug text-white mb-6 sm:mb-8 md:mb-10 text-center max-w-[600px] px-2">
                                {t("articles.newsletter.description")}
                            </p>

                            {/* Form */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full justify-center max-w-[720px]">
                                {subStatus === "success" ? (
                                    <p className="text-white font-['DM_Sans'] font-semibold text-[15px] sm:text-[17px] text-center">
                                        {t("articles.newsletter.success")}
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
                                                onChange={(e) => {
                                                    setSubEmail(e.target.value);
                                                    setSubStatus("idle");
                                                }}
                                                placeholder={t("articles.newsletter.emailPlaceholder")}
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
                                            {subStatus === "loading" ? t("articles.newsletter.loading") : t("articles.newsletter.notifyMe")}
                                        </motion.button>
                                    </form>
                                )}
                            </div>

                            {subStatus === "duplicate" && (
                                <p className="text-[#FFD700] font-['DM_Sans'] text-[13px] sm:text-[14px] mt-3 sm:mt-[10px] text-center">
                                    {t("articles.newsletter.duplicate")}
                                </p>
                            )}

                            {subStatus === "error" && (
                                <p className="text-[#FCA5A5] font-['DM_Sans'] text-[13px] sm:text-[14px] mt-3 sm:mt-[10px] text-center">
                                    {t("articles.newsletter.error")}
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