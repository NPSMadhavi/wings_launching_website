import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Check } from "lucide-react";
import { Footer } from "@/components/Layout/Footer";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAppointment } from "@/context/AppointmentContext";
import { scrollToArticleDetailsWithRetry } from "@/lib/scrollToSection";
import SEO from "@/components/SEO";


const heroImg = "/assets/ihero1.jpeg";
const introImg = "/assets/img4.jpg";

const sections = [
  { label: "Introduction", id: "relationship-and-marital" },
  { label: "1. When differences create distance", id: "when-differences-create-distance" },
  { label: "2. Building trust and communication", id: "building-trust-and-communication" },
  { label: "3. When divorce becomes a concern", id: "when-divorce-becomes-a-concern" },
  { label: "4. Getting support after betrayal", id: "getting-support-after-betrayal" },
  { label: "Final thought", id: "final-thought" },
];

const styles = {
  heading: {
    fontFamily: "Outfit, sans-serif",
  },

  body: {
    fontFamily: "DM Sans, sans-serif",
  },
};

export default function RelationshipArticlePage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { openModal } = useAppointment();
  const [activeSection, setActiveSection] = useState("relationship-and-marital");
  const articleRef = useRef(null);
  const mainContentRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useLayoutEffect(() => {
    scrollToArticleDetailsWithRetry({ behavior: "auto" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = [
        "relationship-and-marital",
        "when-differences-create-distance",
        "building-trust-and-communication",
        "when-divorce-becomes-a-concern",
        "getting-support-after-betrayal",
        "final-thought",
      ];

      let currentSection = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the top of the section is at or above the top 200px of the viewport, it's the active one
          if (rect.top <= 200) {
            currentSection = id;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: document.title || "Relationship and Marital Support",
      text: "Check out this article on relationship and marital support:",
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
        const subject = encodeURIComponent("Relationship and Marital Support");
        const body = encodeURIComponent(
          `Check out this article on relationship and marital support:\n\n${window.location.href}`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
      }
    }
  };



  return (
    <div
      className="w-full bg-white text-[#111111]"
      style={styles.body}
    >
      <SEO
        title="Relationship & Marital Support Guide | WINGS Counselling Centre"
        description="Navigate relationship challenges, improve communication, rebuild trust, and explore couples counselling with guidance from WINGS Counselling Centre."
        path="/RelationshipArticlePage"
        ogImage="/assets/ihero1.jpeg"
        ogType="article"
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
      <section className="relative h-[640px] md:h-[700px] overflow-hidden">
        <img
          src={heroImg}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 w-full h-full navbar-align-outer">
          <div className="navbar-align-inner h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-[760px] flex flex-col items-center text-center text-white"
            >
              <h1
                className="text-[44px] md:text-[58px] leading-[108%] tracking-[-0.04em] font-medium"
                style={{
                  ...styles.heading,
                  maxWidth: "620px",
                }}
              >
                {t("articleDetail.hero.title")}
              </h1>

              <p className="max-w-[560px] mx-auto mt-6 text-[15px] md:text-[17px] leading-[190%] text-white/90">
                {t("articleDetail.hero.description")}
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  scrollToArticleDetailsWithRetry({ behavior: "smooth" });
                }}
                className="group flex items-center justify-center gap-2 cursor-pointer rounded-full bg-[#15467B] min-h-[3.75rem] h-auto py-3 px-6 sm:px-8 mt-9"
              >
                <span className="text-white text-[clamp(0.9rem,1.1rem,1.125rem)] font-medium whitespace-normal text-center">
                  {t("articleDetail.hero.button")}
                </span>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="white"
                    strokeWidth="2.4"
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
        <div className="navbar-align-inner py-[22px]">
          <p className="text-[16px] leading-[160%]">
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

            <span id="anxiety-article">Relationship and Marital</span>
          </p>
        </div>
      </div>

      {/* INTRO SECTION */}
      <section className="w-full">
        
        <div className="grid lg:grid-cols-2 min-h-[410px]">
          {/* LEFT */}
          <div className="bg-[#0D4A7A] px-[24px] md:px-[34px] lg:px-[74px] py-[54px] text-white flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-[700px]"
            >
              <p className="mb-7 text-white/80 text-[15px] tracking-wide">
                {t("articleDetail.breadcrumb.lastUpdated")} february 27, 2026
              </p>

              <h2
                className="text-[25px] md:text-[28px] lg:text-[38px] leading-[115%] tracking-[-0.03em] font-medium"
              >
                Relationship and Marital support
              </h2>

              <p className="mt-7 text-white/85 text-[16px] leading-[190%]">
                Relationship and Marital refers to emotional, psychological, and social well-being. It affects how we think, feel, act, cope with stress, maintain relationships, and recover from life’s challenges.
              </p>
            </motion.div>
          </div>

          {/* RIGHT */}
          <div className="relative min-h-[410px] overflow-hidden">
            <img
              src={introImg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ARTICLE */}
      <section className="bg-[#F5F3F0]">
        <div className="w-full px-[24px] md:px-[34px] lg:px-[74px] py-[72px]">
            <div ref={articleRef} className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-[58px] items-start xl:min-h-0">
              {/* LEFT SIDEBAR */}
              <aside className="hidden xl:block w-full xl:w-[220px] sticky top-[120px] self-start max-h-[calc(100vh-140px)] overflow-y-auto sidebar-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <div>
                  {/* AUTHOR */}
                  <div className="text-[16px] leading-[190%] text-[#595550]">
                    <p>
                      {t("articleDetail.sidebar.by")} Marcus Lee · Licensed counselor
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

                  {/* RELATED ARTICLES */}
                  <div className="mt-[58px]">
                    {[1, 2, 3, 4].map((_, index) => (
                      <div
                        key={index}
                        className={`${index !== 0 ? "border-t border-[#D7D2CB]" : ""
                          } pt-[22px] pb-[26px]`}
                      >
                        <h4
                          className="text-[18px] leading-[135%] tracking-[-0.02em] text-[#2C2C2A] font-normal"
                          style={{
                            fontFamily: "Outfit, sans-serif",
                          }}
                        >
                          Difficult conversations with your partner without
                          becoming an argument
                        </h4>

                        <p className="mt-[14px] text-[14px] leading-[165%] text-[#2C2C2A]">
                          Communication breakdowns are at the heart of most
                          relationship struggles.
                        </p>

                        <div className="mt-[10px] flex items-center gap-[10px]">
                          <span className="text-[13px] text-[#0D4A7A]">
                            6 min read
                          </span>

                          <span className="w-[3px] h-[3px] rounded-full bg-[#0D4A7A]" />

                          <span className="text-[13px] text-[#0D4A7A]">
                            Priya Anand
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              {/* RIGHT ARTICLE CONTENT */}
              <main ref={mainContentRef} className="sidebar-scroll w-full xl:max-h-[calc(100vh-140px)] xl:overflow-y-auto" style={{ scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {/* INTRO */}
                <motion.div
                  id="relationship-and-marital"
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2
                    className="text-[35px] leading-[120%] tracking-[-0.03em] font-medium text-[#111111]"
                    style={styles.heading}
                  >
                    Relationship and Marital
                  </h2>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      One of the greatest challenges in a relationship is when individuals do not
                      see things the way their partner sees them. These differences in a relationship
                      can cause a lot of agony and relational challenges as the relationship progresses
                      beyond the honeymoon phase.
                    </p>

                    <p>
                      Many couples experience differences in a marital relationship. Such differences
                      can be due to gender differences, personality traits, habits and preferences,
                      family upbringing, cultural values, emotional needs, and expectations.
                    </p>
                  </div>
                </motion.div>

                {/* SECTION 1 */}
                <section id="when-differences-create-distance" className="mt-[72px]">
                  <h3
                    className="text-[26px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    1. When differences create distance
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Differences can become painful when they are misunderstood or magnified.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Sometimes, the very differences that are meant to complement the relationship
                      can repel. These differences may become magnified, and partners may start the
                      blame-game, souring the relationship.
                    </p>

                    <p>
                      When partners struggle to understand each other’s perspective, emotional
                      distance, repeated conflict, and resentment can build over time.
                    </p>
                  </div>
                </section>

                {/* SECTION 2 */}
                <section id="building-trust-and-communication" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    2. Building trust and communication
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Trust and open communication are important foundations in marriage.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Building a bedrock of trust as the foundation of marriage, coupled with open
                      communication, can help strengthen a couple relationship.
                    </p>

                    <p>
                      Agreeing to disagree with your partner can be a sign of respect and appreciation
                      towards individual differences.
                    </p>

                    <p>
                      This can contribute to greater connection, intimacy, emotional satisfaction,
                      and stability in a healthy couple relationship, and may also reduce the risk
                      of divorce.
                    </p>
                  </div>
                </section>

                {/* SECTION 3 */}
                <section id="when-divorce-becomes-a-concern" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    3. When divorce becomes a concern
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Marital counselling can help couples pause, communicate, and reflect.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Divorce rates are supposedly on the rise. When divorce happens, it results
                      in difficulties for the couple and the children as well.
                    </p>

                    <p>
                      While divorce may be necessary and a healthier choice for some couples, others
                      may wish to salvage whatever is left of the union because the implications on
                      the children are real.
                    </p>

                    <p>
                      This may be an appropriate time to seek marital counselling to enhance open
                      communication, where each partner feels appreciated and valued.
                    </p>

                    <p>
                      Before rushing for a divorce due to an unhappy situation, every parent must
                      consider the needs of their child or children, who need their parents’ tender
                      loving care as the foundation for emotional stability.
                    </p>
                  </div>
                </section>

                {/* SECTION 4 */}
                <section id="getting-support-after-betrayal" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    4. Getting support after betrayal
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Recovering from an affair is not impossible, but it takes work and support.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Another major contributing factor for a marriage breaking down may be when
                      one or both parties are having an affair, or one partner has had an affair.
                    </p>

                    <p>
                      In such circumstances, trust, betrayal, and anger are normal emotions for the
                      partner who is feeling rejected.
                    </p>

                    <p>
                      Recovering from an affair is not impossible, but it takes a lot of hard work
                      from both parties to start reconnecting the missing pieces of the relationship.
                      Seek help immediately.
                    </p>
                  </div>
                </section>

                {/* FINAL THOUGHT */}
                <section id="final-thought" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium text-[#111111]"
                    style={styles.heading}
                  >
                    Final thought
                  </h3>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      With the support of a trained professional, marital counselling can provide
                      a different perspective to the dynamics of a relationship when a couple has
                      reached a stalemate.
                    </p>

                    <p>
                      Unhelpful behaviour patterns that may have become ingrained can be modified
                      when a couple is committed to making changes that will benefit them in the
                      long run.
                    </p>

                    <p>
                      Seeking professional counselling can enhance communication and effective
                      conflict resolution, which are building blocks to a strong foundation in a
                      marriage.
                    </p>

                    <p>
                      A professional counsellor can also bring a refreshing element by reminding
                      the couple of their strengths in the relationship.
                    </p>
                  </div>
                </section>

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