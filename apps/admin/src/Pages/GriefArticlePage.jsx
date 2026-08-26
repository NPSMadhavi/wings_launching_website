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
  { label: "Introduction", id: "what-is-grief" },
  { label: "1. What grief can feel like", id: "what-grief-feels-like" },
  { label: "2. Losses that can cause grief", id: "losses-that-cause-grief" },
  { label: "3. When life becomes heavy with grief", id: "when-life-becomes-heavy" },
  { label: "4. Getting support", id: "getting-support" },
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

export default function AnxietyArticlePage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { openModal } = useAppointment();
  const [activeSection, setActiveSection] = useState("what-is-grief");
  const articleRef = useRef(null);
  const mainContentRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useLayoutEffect(() => {
    scrollToArticleDetailsWithRetry({ behavior: "auto" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = [
        "what-is-grief",
        "what-grief-feels-like",
        "losses-that-cause-grief",
        "when-life-becomes-heavy",
        "getting-support",
        "final-thought",
      ];

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

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: document.title || "Grief Support",
      text: "Check out this article on grief and loss support:",
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
        const subject = encodeURIComponent("Grief Support");
        const body = encodeURIComponent(
          `Check out this article on grief and loss support:\n\n${window.location.href}`
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
        title="Navigating Grief & Loss | WINGS Counselling Centre"
        description="Understand the emotional stages of grief and loss, learn coping mechanisms, and find compassionate counselling support during difficult times."
        path="/GriefArticlePage"
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

            <span id="anxiety-article">Grief & Loss</span>
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

              <h2 className="text-[25px] md:text-[28px] lg:text-[38px] leading-[115%] tracking-[-0.03em] font-medium">
                4 Grief support for when anxiety spikes
              </h2>

              <p className="mt-7 text-white/85 text-[16px] leading-[190%]">
                Grief is a natural reaction to loss, but it is not limited to the
                death of a loved one. Any meaningful loss can feel deeply painful
                and may need care, time, and support.
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
            <div
              ref={articleRef}
             className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-[58px] items-start xl:min-h-0"
            >
              {/* LEFT SIDEBAR */}
              <aside
                className="hidden xl:block w-full xl:w-[220px] sticky top-[120px] self-start max-h-[calc(100vh-140px)] overflow-y-auto sidebar-scroll"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <div>
                  {/* AUTHOR */}
                  <div className="text-[16px] leading-[190%] text-[#595550]">
                    <p>{t("articleDetail.sidebar.by")} Dr. Elena Morris · Relationship expert</p>
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
                          className={`block w-full text-left text-[16px] leading-snug whitespace-normal break-words py-[10px] pl-5 border-l-2 transition-all duration-300 ${
                            isActive
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
                        className={`${
                          index !== 0 ? "border-t border-[#D7D2CB]" : ""
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
              <main
                ref={mainContentRef}
                className="sidebar-scroll w-full xl:max-h-[calc(100vh-140px)] xl:overflow-y-auto"
                style={{
                  scrollBehavior: "smooth",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {/* INTRO */}
                <motion.div
                  id="what-is-grief"
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2
                    className="text-[35px] leading-[120%] tracking-[-0.03em] font-medium text-[#111111]"
                    style={styles.heading}
                  >
                    GRIEF - a hidden crisis?
                  </h2>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Grief is a natural reaction, a kind of acute pain that
                      accompanies a loss. However, this reaction is not only
                      limited to the loss of a loved one. It can also arise from
                      the loss of a treasured pet, a position in society, a job,
                      or a relationship that was meaningful.
                    </p>

                    <p>
                      Because grief reflects what or who we love, when something
                      or someone we love is taken away, it can feel
                      overwhelmingly painful or all-encompassing. Sometimes the
                      same pain can become complex when a person does not have
                      the opportunity or space to experience the pain fully
                      because of overwhelming responsibilities around them.
                    </p>
                  </div>
                </motion.div>

                {/* SECTION 1 */}
                <section id="what-grief-feels-like" className="mt-[72px]">
                  <h3
                    className="text-[26px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    1. What grief can feel like
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Grief can affect both emotional and physical wellbeing.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      In grief, one may experience all kinds of difficult and
                      unexpected emotions, ranging from shock or anger to
                      disbelief, guilt, and profound sadness.
                    </p>

                    <p>
                      The pain of grief can disrupt physical health, making it
                      difficult to sleep, eat, or even think straight. These are
                      normal reactions to loss, and the more significant the
                      loss, the more intense the grief may feel.
                    </p>

                    <p>
                      The grief experience and the grief process are common
                      occurrences interwoven throughout our lives. The intensity
                      and duration of grief depends on one’s personal reaction to
                      a particular loss. Every crisis involves an element of
                      grief because crisis often involves loss, and loss results
                      in grief.
                    </p>
                  </div>
                </section>

                {/* SECTION 2 */}
                <section id="losses-that-cause-grief" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    2. Losses that can cause grief
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Grief is not limited to the death of a loved one.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      People may associate grieving with the death of a loved
                      one, which is often the cause of the most intense type of
                      grief. However, any meaningful loss can cause grief,
                      including:
                    </p>

                    <ul className="list-disc pl-5 space-y-2">
                      <li>Divorce or relationship breakup</li>
                      <li>Loss of health</li>
                      <li>Losing a job</li>
                      <li>Loss of financial stability</li>
                      <li>A miscarriage</li>
                      <li>Retirement</li>
                      <li>A loved one’s serious illness</li>
                      <li>Loss of a friendship</li>
                      <li>Loss of safety after a trauma</li>
                    </ul>

                    <p>
                      Even subtle losses in life can trigger grief. For example,
                      one might grieve after moving away from an ancestral home
                      or changing jobs.
                    </p>
                  </div>
                </section>

                {/* SECTION 3 */}
                <section id="when-life-becomes-heavy" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    3. When life becomes heavy with grief
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Taking care of yourself is important, even while grieving.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      Firstly, taking care of one’s own self is important even
                      when grieving. You may experience difficulty sleeping or a
                      lack of motivation, but having a healthy diet, maintaining
                      exercise, and keeping a hygienic routine are important for
                      emotional healing.
                    </p>

                    <p>
                      Time can be the best healer in many cases, but there are
                      other avenues of help as well. Speaking to a trusted
                      friend or relative about overwhelming experiences can help
                      a person feel less alone.
                    </p>
                  </div>
                </section>

                {/* SECTION 4 */}
                <section id="getting-support" className="mt-[72px]">
                  <h3
                    className="text-[30px] leading-[120%] tracking-[-0.03em] font-medium"
                    style={styles.heading}
                  >
                    4. Getting support
                  </h3>

                  <div className="mt-7 rounded-[6px] bg-[#EAF4DF] px-5 py-[10px] inline-block w-full">
                    <p className="text-[#59713F] text-[18px] font-medium">
                      Counselling may help when grief feels intense or
                      prolonged.
                    </p>
                  </div>

                  <div className="mt-7 space-y-6 text-[18px] leading-[210%] text-[#3D3935]">
                    <p>
                      One can also seek assistance from a trained counsellor who
                      understands that whatever your loss may be, it is personal
                      and unique to you. Counselling can help you process the
                      loss in a safe and supportive space.
                    </p>

                    <p>
                      Although not everyone will need counselling, if someone is
                      experiencing intense grief for a long time after the loss,
                      counselling may indeed be necessary.
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
                      Whatever it is, there is no need to feel scared or ashamed
                      about how you feel, or to believe that it is strange to
                      behave or feel the way you are feeling.
                    </p>

                    <p>
                      Instead, believe that in time to come, you can come to
                      terms with your loss, find new meaning, and eventually
                      move on with your life. Temporarily, you may feel
                      disoriented, numb, or empty, and it is okay to need help
                      from others.
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