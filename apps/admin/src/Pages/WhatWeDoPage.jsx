import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useRoute } from "wouter";
import { useTranslation } from "react-i18next";

import { Footer } from "@/components/Layout/Footer";
import { useAppointment } from "@/context/AppointmentContext";
import SEO from "@/components/SEO";
import {
  Ear,
  ShieldCheck,
  Wrench,
  PersonStanding,
} from "lucide-react";
import {
  getSupportTopicBySlug,
  filterArticlesForTopic,
  filterServicesForTopic,
} from "@/lib/supportTopicsConfig";
import { getArticleDetailPath } from "@/lib/articlePageContent";


const img1 = "/assets/ihero1.jpeg";
const img2 = "/assets/img2.jpg";
const FALLBACK_ARTICLE_IMAGE = "/assets/article.jpg";
const FALLBACK_SERVICE_IMAGE = "/assets/card2.jpg.jpeg";

const styles = {
  heading: {
    fontFamily: "Outfit, sans-serif",
    fontWeight: 500,
    fontSize: "35px",
    lineHeight: "100%",
    letterSpacing: "0%",
    color: "#0D4A7A",
  },
  body: {
    fontFamily: "DM Sans, sans-serif",
    fontWeight: 400,
    fontSize: "20px",
    lineHeight: "160%",
    letterSpacing: "0%",
  },
};

function cleanArticleText(content = "") {
  return content
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatArticleDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-SG", {
    month: "long",
    year: "numeric",
  });
}

function mapApiArticle(article, t) {
  const plain = cleanArticleText(article.content);
  return {
    id: article.id,
    slug: article.slug,
    category: article.category || "General",
    title: article.title,
    desc:
      article.excerpt ||
      plain.slice(0, 140) ||
      t("supportTopic.articles.fallbackDescription"),
    image: article.coverImage || FALLBACK_ARTICLE_IMAGE,
    author: article.author || t("supportTopic.articles.fallbackAuthor"),
    time: t("supportTopic.articles.readTime"),
    date: formatArticleDate(article.publishedAt || article.createdAt),
  };
}

export default function SupportTopicPage() {
  const { t, i18n } = useTranslation();
  const [, params] = useRoute("/support/:slug");
  const [location, navigate] = useLocation();
  const topic = getSupportTopicBySlug(params?.slug || "");

  const { openModal } = useAppointment();

  const [hoveredButton, setHoveredButton] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [apiArticles, setApiArticles] = useState([]);
  const [apiServices, setApiServices] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadArticles = async () => {
      setArticlesLoading(true);
      try {
        const response = await fetch(`/api/articles?lang=${encodeURIComponent((i18n.language || "en").split("-")[0])}`);
        if (!response.ok) throw new Error("Failed to fetch articles");
        const data = await response.json();
        if (!cancelled) {
          setApiArticles(
            Array.isArray(data) ? data.map((article) => mapApiArticle(article, t)) : []
          );
        }
      } catch {
        if (!cancelled) setApiArticles([]);
      } finally {
        if (!cancelled) setArticlesLoading(false);
      }
    };

    const loadServices = async () => {
      setServicesLoading(true);
      try {
        const lang = (i18n.language || "en").split("-")[0];
        const response = await fetch(`/api/counselling-types?lang=${encodeURIComponent(lang)}`);
        const json = await response.json();
        if (!cancelled && json.success && Array.isArray(json.data)) {
          const flattened = json.data.flatMap((mainType) =>
            (mainType.sub_types || [])
              .filter((sub) => sub.is_active !== false)
              .map((sub) => ({
                id: sub.id,
                title: sub.name,
                desc: sub.description || "",
                description: sub.description || "",
                image: sub.image_url || FALLBACK_SERVICE_IMAGE,
                parentName: mainType.name,
                appointmentSelection: {
                  counsellingTypeId: mainType.id,
                  subTypeId: sub.id,
                  counsellingTypeName: mainType.name,
                  subTypeName: sub.name,
                },
              }))
          );
          setApiServices(flattened);
        } else if (!cancelled) {
          setApiServices([]);
        }
      } catch {
        if (!cancelled) setApiServices([]);
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    };

    loadArticles();
    loadServices();

    return () => {
      cancelled = true;
    };
  }, [topic?.slug, i18n.language, t]);

  const topicArticles = useMemo(
    () => filterArticlesForTopic(apiArticles, topic),
    [apiArticles, topic]
  );

  const topicServices = useMemo(
    () => filterServicesForTopic(apiServices, topic),
    [apiServices, topic]
  );

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(topicArticles.map((item) => item.category).filter(Boolean))];
    return ["All", ...categories];
  }, [topicArticles]);

  useEffect(() => {
    setSelectedCategory("All");
  }, [topic?.slug]);

  const filteredArticles =
    selectedCategory === "All"
      ? topicArticles
      : topicArticles.filter(
          (article) =>
            article.category?.toLowerCase() === selectedCategory.toLowerCase()
        );

  const counsellingItemsRaw = t("supportTopic.counselling.items", {
    returnObjects: true,
  });
  const counsellingItems = Array.isArray(counsellingItemsRaw)
    ? counsellingItemsRaw
    : [];
  const counsellingIcons = [
    <Ear key="ear" size={30} color="#DE5753" strokeWidth={2.2} />,
    <ShieldCheck key="shield" size={30} color="#DE5753" strokeWidth={2.2} />,
    <Wrench key="wrench" size={30} color="#DE5753" strokeWidth={2.2} />,
    <PersonStanding key="person" size={30} color="#DE5753" strokeWidth={2.2} />,
  ];

  useEffect(() => {
    if (!topic?.slug) return;
    const attempt = () => {
      const el = document.getElementById("support-section");
      if (!el) return false;
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      return true;
    };
    if (!attempt()) {
      setTimeout(attempt, 100);
      setTimeout(attempt, 350);
      return;
    }
    setTimeout(attempt, 100);
    setTimeout(attempt, 350);
  }, [topic?.slug]);

  if (!topic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] px-4 text-center">
        <p className="text-[#0D4A7A] text-lg font-medium mb-4">
          {t("supportTopic.navigation.topicNotFound")}
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-[#1B4585] underline"
        >
          {t("supportTopic.navigation.backToHome")}
        </button>
      </div>
    );
  }

  const handleArticleClick = (article) => {
    navigate(getArticleDetailPath(article));
  };

  const handleServiceClick = (service) => {
    if (service.id) {
      navigate(`/services/sub/${service.id}`);
      return;
    }
    openModal(
      service.appointmentSelection || {
        counsellingTypeName: service.parentName,
        subTypeName: service.title,
      }
    );
  };

  return (
    <div className="bg-[#F5F5F5] text-black overflow-x-hidden">
      <SEO
        title={`${topic.label} Support & Counselling | WINGS Counselling Centre`}
        description={(topic.heroDescription || topic.understandingDescription || "").slice(0, 160)}
        path={`/support/${topic.slug}`}
        ogImage={img1}
      />
      {/* Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Outfit:wght@400;500;600;700&display=swap');
        `}
      </style>

      {/* HERO SECTION */}
      <section
        className="relative flex w-full shrink-0 overflow-hidden"
        style={{
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        <img
          src={img1}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />

        <div className="absolute inset-0 bg-black/65" />

        {/* HERO CONTENT */}
        <div className="relative z-10 w-full h-full flex items-center justify-center px-6 md:px-12 lg:px-[100px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center justify-center text-center w-full"
            style={{ maxWidth: "840px" }}
          >
            <h1
              className="text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px] md:pt-[80px] font-semibold leading-[1.2] text-white mb-6"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {t(`supportTopicsContent.${topic.contentKey}.heroTitle`, {
                defaultValue: topic.heroTitle,
              })}
            </h1>

            <p
              className="text-[16px] md:text-[20px] leading-[1.8] text-white max-w-[700px] mb-8"
              style={styles.body}
            >
              {t(`supportTopicsContent.${topic.contentKey}.heroDescription`, {
                defaultValue: topic.heroDescription,
              })}
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                document
                  .getElementById("support-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center justify-center gap-2.5 h-[60px] px-8 rounded-full bg-[#1B4585] cursor-pointer"
            >
              <span className="text-white font-['Plus_Jakarta_Sans'] font-semibold text-[16px] sm:text-[18px]">
                {t("supportTopic.hero.button")}
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9L12 15L18 9"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="w-full navbar-align-outer">
        <div className="navbar-align-inner py-4 sm:py-6 lg:py-10">
          <p className="text-[14px] sm:text-[16px]" style={styles.body}>
            <span
              onClick={() => {
                sessionStorage.setItem("scrollToIssues", "1");
                navigate("/");
              }}
              className="underline cursor-pointer hover:opacity-70 transition"
            >
              {t("supportTopic.navigation.backToHome")}
            </span>{" "}
            <span id="support-section" className="inline-flex items-center gap-2">
              /{" "}
              {t(`supportTopicsContent.${topic.contentKey}.breadcrumbLabel`, {
                defaultValue: topic.breadcrumbLabel,
              })}
            </span>
          </p>
        </div>
      </div>

      {/* UNDERSTANDING SECTION */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="bg-[#0D4A7A] text-white flex items-center py-4 sm:py-12 lg:py-14">
            <div className="w-full max-w-[650px] support-topic-text-pl">
                <h2
                  className="mb-4 sm:mb-8 text-white text-[clamp(24px,6vw,35px)] leading-[1.15] font-medium"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  {t(`supportTopicsContent.${topic.contentKey}.understandingTitle`, {
                    defaultValue: topic.understandingTitle,
                  })}
                </h2>

                <p
                  className="text-[15px] sm:text-[16px] leading-[1.7] sm:leading-[180%] text-white/90"
                  style={styles.body}
                >
                  {t(
                    `supportTopicsContent.${topic.contentKey}.understandingDescription`,
                    { defaultValue: topic.understandingDescription }
                  )}
                </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-[420px]">
            <img
              src={img2}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section className="py-24">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">
        <div className="mb-16">
          <h2 className="mb-5" style={styles.heading}>
            {t("supportTopic.articles.title")}
          </h2>

          <p className="mb-8" style={styles.body}>
            {t("supportTopic.articles.description")}
          </p>

          {/* Category Buttons */}
          <div className="flex flex-wrap gap-4">
            {categoryOptions.map((item, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(item)}
                className={`h-[50px] px-7 rounded-full border transition-all duration-300 ${
                  selectedCategory === item
                    ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                    : "bg-white border-[#D2D2D2] hover:border-[#1E3A8A] hover:text-[#1E3A8A]"
                }`}
                style={styles.body}
              >
                {item === "All" ? t("supportTopic.articles.all") : item}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {articlesLoading ? (
            <p className="col-span-full text-center text-[#666]" style={styles.body}>
              {t("supportTopic.articles.loading")}
            </p>
          ) : filteredArticles.length === 0 ? (
            <p className="col-span-full text-center text-[#666]" style={styles.body}>
              {t("supportTopic.articles.noArticles")}
            </p>
          ) : (
          filteredArticles.map((article, index) => (
            <div
              key={article.id || index}
              className="bg-white group cursor-pointer transition-transform duration-300 hover:-translate-y-1"
              onClick={() => handleArticleClick(article)}
              style={{
                width: "100%",
                minHeight: "480px",
                borderRadius: "10px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={article.image}
                  alt=""
                  className="w-full h-[180px] object-cover"
                />

                <div className="absolute top-4 left-4 bg-white rounded-full px-4 py-1 text-[12px]">
                  {article.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">

                {/* Meta */}
                <div
                  className="flex justify-between text-[#1E3A8A] text-[13px] mb-4"
                  style={styles.body}
                >
                  <span>
                    {article.author} · {article.time}
                  </span>

                  <span>{article.date}</span>
                </div>

                {/* Title */}
                <h3
                  className="text-[26px] leading-[34px] mb-4"
                  style={{
                    fontFamily: "Outfit",
                    fontWeight: 500,
                  }}
                >
                  {article.title}
                </h3>

                {/* Description */}
                <p
                  className="text-[#333] mb-6 flex-1"
                  style={styles.body}
                >
                  {article.desc}
                </p>

                {/* Arrow */}
                <div className="mt-auto pt-4 flex justify-end">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="#1E3A8A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )))}
        </div>
        </div>
        </div>
      </section>

      {/* WHAT HAPPENS */}
      <section className="pb-24">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">
        <div className="grid lg:grid-cols-2 rounded-[20px] overflow-hidden min-h-[520px] bg-white">

          {/* LEFT SIDE */}
          <div className="bg-[#0D4A7A] text-white">
            <div className="h-full flex flex-col justify-start px-8 sm:px-10 md:px-12 lg:px-14 py-12 sm:py-14 lg:py-16">

              {/* Badge */}
              <div className="border border-white rounded-full px-5 py-2 inline-flex items-center w-fit mb-8">
                <span
                  className="text-[12px] sm:text-[13px]"
                  style={styles.body}
                >
                  {t("supportTopic.counselling.badge")}
                </span>
              </div>

              {/* Heading */}
              <h2
                className="text-[42px] sm:text-[52px] lg:text-[60px] leading-[110%] tracking-[-1px] mb-8 max-w-[430px]"
                style={{
                  fontFamily: "Outfit",
                  fontWeight: 500,
                }}
              >
                {t("supportTopic.counselling.title")}
              </h2>

              {/* Description */}
              <p
                className="max-w-[500px] text-[15px] sm:text-[16px] leading-[180%] text-white/90"
                style={styles.body}
              >
                {t("supportTopic.counselling.description")}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-white">
            <div className="h-full flex flex-col justify-between px-6 sm:px-8 md:px-10 lg:px-14 py-12 sm:py-14 lg:py-8">

              {counsellingItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 sm:gap-5"
                >

                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {counsellingIcons[i]}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4
                      className="text-[18px] sm:text-[20px] lg:text-[22px] leading-[125%] mb-2 mt-2 text-[#111]"
                      style={{
                        fontFamily: "Outfit",
                        fontWeight: 500,
                      }}
                    >
                      {item.title}
                    </h4>

                    <p
                      className="text-[15px] sm:text-[16px] leading-[170%] text-[#333]"
                      style={styles.body}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="pb-24">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">

        {/* Heading */}
        <div className="text-center max-w-[900px] mx-auto mb-16 sm:mb-20">
          <h2
            className="mb-5 sm:mb-6"
            style={styles.heading}
          >
            {t("supportTopic.services.title")}
          </h2>

          <p
            className="text-[15px] sm:text-[16px] leading-[170%]"
            style={styles.body}
          >
            {t("supportTopic.services.description")}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 w-full">

          {servicesLoading ? (
            <p className="col-span-full text-center text-[#666]" style={styles.body}>
              {t("supportTopic.services.loading")}
            </p>
          ) : topicServices.length === 0 ? (
            <p className="col-span-full text-center text-[#666]" style={styles.body}>
              {t("supportTopic.services.noServices")}
            </p>
          ) : (
          topicServices.map((service, index) => (
            <div
              key={service.id || index}
              className="flex flex-col w-full transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 rounded-[10px] bg-white shadow-[0px_10px_30px_rgba(0,0,0,0.05)] overflow-hidden max-w-full h-full"
            >
              {/* Image */}
              <div
                onClick={() => handleServiceClick(service)}
                className="w-full relative shrink-0 transition-transform duration-300 hover:scale-[1.02] cursor-pointer aspect-[16/10] sm:aspect-[2/1] md:aspect-auto md:h-[clamp(160px,22vw,206px)] bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%), url(${service.image})`,
                }}
              >
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 font-['Outfit'] font-medium text-[clamp(14px,2vw,18px)] leading-[1.3] text-white line-clamp-2">
                  {service.title}
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col flex-1 p-4 sm:p-5 min-w-0">
                <p className="text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed mb-3 sm:mb-4 font-['DM_Sans'] font-normal text-black">
                  <span className="line-clamp-4 sm:line-clamp-5">
                    {service.desc}
                  </span>

                  <span
                    onClick={() => handleServiceClick(service)}
                    className="text-[#1B4585] underline cursor-pointer font-medium ml-1 inline-block mt-1"
                  >
                    {t("supportTopic.services.readMore")}
                  </span>
                </p>

                <button
                  type="button"
                  onClick={() =>
                    openModal(service.appointmentSelection || service.title)
                  }
                  className={`flex items-center justify-center gap-2 mt-auto w-full cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] py-3 px-4 sm:py-3 sm:px-5 rounded-full border border-[#1B4585] font-['DM_Sans'] font-semibold text-[13px] sm:text-[14px] ${
                    hoveredButton === `support-${index}`
                      ? "bg-[#1B4585] text-white"
                      : "bg-white text-[#1B4585]"
                  }`}
                  onMouseEnter={() => setHoveredButton(`support-${index}`)}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  {t("supportTopic.services.bookAppointment")}

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
          )))}
        </div>
        </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 bg-[#F5F3F0]">
        <div className="navbar-align-outer">
        <div className="navbar-align-inner">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[12px] bg-[#0D4A7A] px-8 py-[56px] text-center text-white w-full"
          >
            <h2
              className="text-[38px] leading-[115%] tracking-[-0.03em] font-semibold font-family: 'Outfit', sans-serif;"
              
            >
              {t("supportTopic.cta.title")}
            </h2>

            <p className="mx-auto mt-5 max-w-[900px] text-white/85 text-[18px] leading-[190%]">
              {t("supportTopic.cta.description")}
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white h-[46px] px-6 text-[14px] font-semibold text-[#0D4A7A] cursor-pointer"
            >
              {t("supportTopic.cta.button")}

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
            </motion.button>
          </motion.div>
        </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}