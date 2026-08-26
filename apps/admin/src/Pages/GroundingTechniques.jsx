import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Check } from "lucide-react";
import { Footer } from "@/components/Layout/Footer";
import { useLocation, useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppointment } from "@/context/AppointmentContext";
import {
  loadPageContent,
  htmlWithHeadingIds,
  extractHeadingsFromHtml,
  htmlToPdfBlocks,
  getPageKeyFromCategory,
  savePageContent,
  extractFirstParagraphFromHtml,
} from "@/lib/articlePageContent";
import { resolveAssetUrl } from "@/admin/lib/api";
import { scrollToArticleDetailsWithRetry } from "@/lib/scrollToSection";
import SEO from "@/components/SEO";

const heroImg = "/assets/articlesection.jpeg";
const introImg = "/assets/img4.jpg";

const DEFAULT_SECTIONS = [
  { label: "Introduction", id: "what-is-anxiety" },
  { label: "1. The 5–4–3–2–1 method", id: "5-4-3-2-1-method" },
  { label: "2. Controlled breathing", id: "controlled-breathing" },
  { label: "3. Physical grounding through touch", id: "physical-grounding" },
  { label: "4. Micro-movements", id: "micro-movements" },
  { label: "What grounding can — and cannot — do", id: "what-grounding" },
  { label: "Final thought", id: "final-thought" },
];

const PAGE_KEY = "GroundingTechniques";

const styles = {
  heading: {
    fontFamily: "Outfit, sans-serif",
  },

  body: {
    fontFamily: "DM Sans, sans-serif",
  },
};

export default function AnxietyArticlePage() {
  const [, navigate] = useLocation();
  const [isArticleRoute, articleParams] = useRoute("/article/:slug");
  const { t, i18n } = useTranslation();
  const { openModal } = useAppointment();
  const [activeSection, setActiveSection] = useState("what-is-anxiety");
  const articleRef = useRef(null);
  const mainContentRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const [customContent, setCustomContent] = useState(null);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  const uiLang = useMemo(
    () => (i18n.language || "en").toLowerCase().split("-")[0],
    [i18n.language]
  );

  // Prefer /article/:slug path param; also support legacy ?slug=
  const urlSlug = useMemo(() => {
    if (isArticleRoute && articleParams?.slug) {
      return decodeURIComponent(articleParams.slug);
    }
    try {
      return new URLSearchParams(window.location.search).get("slug") || "";
    } catch {
      return "";
    }
  }, [isArticleRoute, articleParams?.slug]);

  const applyArticleData = (next) => {
    if (!next) {
      setCustomContent(null);
      setSections(DEFAULT_SECTIONS);
      setActiveSection("what-is-anxiety");
      return;
    }
    const withIds = htmlWithHeadingIds(next.html || "");
    const headings = extractHeadingsFromHtml(withIds);
    setCustomContent({ ...next, html: withIds });
    if (withIds && headings.length) {
      setSections(headings);
      setActiveSection(headings[0].id);
    } else if (!withIds) {
      setSections(DEFAULT_SECTIONS);
      setActiveSection("what-is-anxiety");
    }
  };

  // Load THIS article from backend by slug + current UI language
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Clear previous article immediately so UI doesn't flash old content
      if (urlSlug) {
        setCustomContent(null);
        setSections(DEFAULT_SECTIONS);
      }

      try {
        let match = null;

        if (urlSlug) {
          const res = await fetch(
            `/api/articles/by-slug/${encodeURIComponent(urlSlug)}?lang=${encodeURIComponent(uiLang)}`
          );
          if (res.ok) {
            match = await res.json();
          }
        } else {
          const res = await fetch(`/api/articles?lang=${encodeURIComponent(uiLang)}`);
          if (!res.ok) throw new Error("Failed to fetch articles");
          const articles = await res.json();
          if (!Array.isArray(articles) || cancelled) return;
          // Legacy /GroundingTechniques with no slug → keep default template
          if (!cancelled) {
            setCustomContent(null);
            setSections(DEFAULT_SECTIONS);
          }
          return;
        }

        if (cancelled) return;
        if (!match) return;

        const pageKey = getPageKeyFromCategory(match.category) || PAGE_KEY;

        // Backend localized content is source of truth for each language
        const htmlFromBackend = (match.content || "").trim();

        const next = {
          html: htmlFromBackend || "",
          title: match.title || "",
          author: match.author || "WINGS Team",
          excerpt: match.excerpt || "",
          coverImage: match.coverImage
            ? resolveAssetUrl(match.coverImage)
            : "",
          slug: match.slug || "",
          language: match.language || uiLang,
          updatedAt: match.updatedAt || match.publishedAt || null,
        };

        // Cache per language so localStorage doesn't overwrite other langs
        savePageContent(`${pageKey}:${uiLang}`, next);
        if (!cancelled) applyArticleData(next);
      } catch (err) {
        console.error("Failed to load article from backend", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [urlSlug, uiLang]);

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = sections.map((s) => s.id);

      let currentSection = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            currentSection = id;
          }
        }
      }
      if (currentSection) setActiveSection(currentSection);
    };

    const mainEl = mainContentRef.current;
    window.addEventListener("scroll", handleScroll);
    if (mainEl) mainEl.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainEl) mainEl.removeEventListener("scroll", handleScroll);
    };
  }, [sections]);

  const displayTitle = customContent
    ? (customContent.title && customContent.title.trim()) ||
      sections[0]?.label ||
      "Article"
    : "";
  const displayAuthor = customContent
    ? (customContent.author && customContent.author.trim()) || "WINGS Team"
    : "";
  const firstBodyParagraph = customContent?.html
    ? extractFirstParagraphFromHtml(customContent.html)
    : "";
  const displayExcerpt = customContent
    ? (customContent.excerpt && customContent.excerpt.trim()) ||
      firstBodyParagraph ||
      ""
    : "";
  const displayCoverImage =
    (customContent?.coverImage && resolveAssetUrl(customContent.coverImage)) ||
    introImg;
  const lastUpdated = customContent?.updatedAt
    ? new Date(customContent.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "february 27, 2026";

  // Card click → land below hero on article content (not hero top)
  useLayoutEffect(() => {
    scrollToArticleDetailsWithRetry({ behavior: "auto" });
  }, [urlSlug, displayTitle]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: displayTitle || document.title || "Grounding Techniques",
      text: displayExcerpt || "Check out this article on grounding techniques:",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const subject = encodeURIComponent(displayTitle || "Grounding Techniques");
        const body = encodeURIComponent(
          `Check out this article:\n\n${window.location.href}`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
      }
    }
  };



  const articlePath = isArticleRoute ? `/article/${urlSlug}` : "/GroundingTechniques";
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": displayTitle || "Grounding Techniques for Anxiety",
    "description": (displayExcerpt || "").slice(0, 300),
    "image": displayCoverImage ? [displayCoverImage] : [],
    "author": {
      "@type": "Person",
      "name": displayAuthor || "WINGS Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "WINGS Counselling Centre",
      "logo": {
        "@type": "ImageObject",
        "url": "https://wingscc.netopsys.in/assets/wingsLogo.png"
      }
    }
  };

  return (
    <div
      className="w-full bg-white text-[#111111]"
      style={styles.body}
    >
      <SEO
        title={`${displayTitle || "Grounding Techniques for Anxiety"} | WINGS Counselling Centre`}
        description={(displayExcerpt || "Learn practical grounding techniques to manage anxiety, panic, and distress from WINGS Counselling Centre.").slice(0, 160)}
        path={articlePath}
        ogImage={displayCoverImage}
        ogType="article"
        jsonLd={articleJsonLd}
      />
      {/* GOOGLE FONTS */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Outfit:wght@400;500;600;700&display=swap');

          html {
            scroll-behavior: smooth;
          }

          [id] {
            scroll-margin-top: 120px;
          }

          .sidebar-scroll::-webkit-scrollbar {
            display: none;
          }

          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* HERO */}
      <section
        className="relative flex w-full shrink-0 overflow-hidden"
        style={{
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        <img
          src={heroImg}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 w-full h-full navbar-align-outer">
          <div className="navbar-align-inner h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-center w-full"
              style={{ maxWidth: "840px" }}
            >
              <h1
                className="text-[32px] sm:text-[44px] md:text-[54px] lg:text-[60px] font-semibold leading-[1.2] text-white mb-6"
                style={styles.heading}
              >
                {t("articleDetail.hero.title")}
              </h1>

              <p
                className="text-[16px] md:text-[20px] leading-[1.8] text-white max-w-[700px] mb-8"
                style={styles.body}
              >
                {t("articleDetail.hero.description")}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  scrollToArticleDetailsWithRetry({ behavior: "smooth" });
                }}
                className="flex items-center justify-center gap-2.5 min-h-[3.75rem] h-auto py-3 px-6 sm:px-8 rounded-full bg-[#1B4585] cursor-pointer"
              >
                <span className="text-white font-['Plus_Jakarta_Sans'] font-semibold text-[clamp(0.9rem,1.1rem,1.125rem)] whitespace-normal text-center">
                  {t("articleDetail.hero.button")}
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
        </div>
      </section>

      {/* BREADCRUMB */}
      <div className="w-full navbar-align-outer">
        <div className="navbar-align-inner py-4 sm:py-[22px]">
          <p className="text-[14px] sm:text-[16px] leading-[160%]">
            <span
              onClick={() => navigate("/")}
              className="cursor-pointer underline hover:opacity-70 transition"
            >
              {t("articleDetail.breadcrumb.home")}
            </span>

            <span className="mx-1">/</span>

            <span
              onClick={() => navigate("/articles")}
              className="cursor-pointer underline hover:opacity-70 transition"
            >
              {t("articleDetail.breadcrumb.backToArticles")}
            </span>

            <span className="mx-1">/</span>

            <span id="anxiety-article">{displayTitle}</span>
          </p>
        </div>
      </div>

      {/* INTRO SECTION */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT — text starts at same edge as navbar */}
          <div className="bg-[#0D4A7A] py-10 sm:py-12 lg:py-[54px] text-white flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-[700px] support-topic-text-pl"
            >
              <p className="mb-4 sm:mb-7 text-white/80 text-[13px] sm:text-[15px] tracking-wide">
                {t("articleDetail.breadcrumb.lastUpdated")} {lastUpdated}
              </p>

              <h2 className="text-[25px] md:text-[28px] lg:text-[38px] leading-[1.15] tracking-[-0.03em] font-medium">
                {displayTitle}
              </h2>

              {displayExcerpt ? (
                <p className="mt-4 sm:mt-7 text-white/85 text-[15px] sm:text-[16px] leading-[1.7] sm:leading-[190%]">
                  {displayExcerpt}
                </p>
              ) : null}
            </motion.div>
          </div>

          {/* RIGHT */}
          <div className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-[410px] overflow-hidden">
            <img
              src={displayCoverImage}
              alt={displayTitle}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ARTICLE */}
      <section className="bg-[#F5F3F0]">
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner py-[72px]">
            <div ref={articleRef} className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-[58px] items-start xl:min-h-0">
              {/* LEFT SIDEBAR */}
              <aside className="hidden xl:block w-full xl:w-[220px] sticky top-[120px] self-start max-h-[calc(100vh-140px)] overflow-y-auto sidebar-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <div>
                  {/* AUTHOR */}
                  <div className="text-[16px] leading-[190%] text-[#595550]">
                    <p>
                      {t("articleDetail.sidebar.by")} {displayAuthor}
                    </p>
                  </div>

                  {/* TOC */}
                  <div className="mt-8 space-y-0">
                    {sections.map((item, index) => {
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            document.getElementById(item.id)?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }}
                          className={`block w-full text-left text-[16px] leading-snug whitespace-normal break-words py-[10px] pl-5 border-l-2 transition-all duration-300 ${isActive
                              ? "border-[#0D4A7A] text-[#0D4A7A] font-bold bg-[#EDF3F8]"
                              : "border-[#D8D3CC] text-[#6D6862] hover:text-[#0D4A7A] hover:border-[#9DB4C9]"
                            }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* RIGHT ARTICLE CONTENT */}
              <main ref={mainContentRef} className="sidebar-scroll w-full xl:max-h-[calc(100vh-140px)] xl:overflow-y-auto" style={{ scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {customContent?.html ? (
                  <div
                    className="word-article-body space-y-6 text-[18px] leading-[210%] text-[#3D3935]
                      [&_h1]:text-[35px] [&_h1]:leading-[120%] [&_h1]:tracking-[-0.03em] [&_h1]:font-medium [&_h1]:text-[#111111] [&_h1]:mb-6
                      [&_h2]:text-[30px] [&_h2]:leading-[120%] [&_h2]:tracking-[-0.03em] [&_h2]:font-medium [&_h2]:mt-[72px] [&_h2]:mb-6
                      [&_h3]:text-[26px] [&_h3]:leading-[120%] [&_h3]:tracking-[-0.03em] [&_h3]:font-medium [&_h3]:mt-[48px] [&_h3]:mb-4
                      [&_p]:mb-4
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-4
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:mb-4
                      [&_strong]:font-semibold
                      [&_a]:text-[#0D4A7A] [&_a]:underline"
                    style={styles.heading}
                    dangerouslySetInnerHTML={{ __html: customContent.html }}
                  />
                ) : null}

                {/* ACTION BUTTONS */}
                <div className="mt-16 flex flex-wrap gap-3 border-t border-[#D9D4CD] pt-8">
                  {[
                    {
                      icon: copied ? Check : Copy,
                      label: copied ? t("articleDetail.actions.copied") : t("articleDetail.actions.copyLink"),
                      onClick: handleCopyLink,
                    },
                    {
                      icon: Share2,
                      label: t("articleDetail.actions.share", { defaultValue: "Share" }),
                      onClick: handleShare,
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={item.onClick}
                        className={`flex items-center gap-2 rounded-[6px] border min-h-[2.125rem] h-auto py-2 px-4 text-[clamp(0.75rem,0.85rem,0.9rem)] cursor-pointer transition-colors ${
                          copied && index === 0
                            ? "border-green-400 bg-green-50 text-green-700"
                            : "border-[#D8D2CB] bg-white text-[#49433E] hover:bg-[#F0EDEA]"
                        }`}
                      >
                        <Icon size={14} />
                        {item.label}
                      </motion.button>
                    );
                  })}
                </div>
              </main>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 bg-[#F5F3F0]">
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-[12px] bg-[#0D4A7A] px-8 py-[56px] text-center text-white w-full"
            >
              <h2
                className="text-[38px] leading-[115%] tracking-[-0.03em] font-medium"
                style={styles.heading}
              >
                {t("articleDetail.cta.title")}
              </h2>

              <p className="mx-auto mt-5 max-w-[720px] text-white/85 text-[15px] leading-[190%]">
                {t("articleDetail.cta.description")}
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal()}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white min-h-[3.75rem] h-auto py-3 px-6 sm:px-8 text-[clamp(0.9rem,1.1rem,1.125rem)] font-semibold text-[#0D4A7A] cursor-pointer whitespace-normal text-center"
              >
                {t("articleDetail.cta.button")}

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