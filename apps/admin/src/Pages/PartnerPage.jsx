import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Footer } from "@/components/Layout/Footer";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";

const PAGE_SIZE = 3;

const PartnerPage = () => {
  const { t, i18n } = useTranslation();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const strengthCardsRaw = t("partners.strength.cards", { returnObjects: true });
  const strengthCards = Array.isArray(strengthCardsRaw) ? strengthCardsRaw : [];

  useEffect(() => {
    let cancelled = false;
    const lang = (i18n.language || "en").split("-")[0];

    const loadPartners = async () => {
      try {
        const response = await fetch(
          `/api/partners?lang=${encodeURIComponent(lang)}`
        );

        if (!response.ok) throw new Error("Failed to fetch partners");

        const data = await response.json();

        if (!cancelled) {
          if (Array.isArray(data) && data.length) {
            setPartners(data);
          } else {
            setPartners([]);
          }
        }
      } catch (error) {
        console.error("Error fetching partners:", error);

        if (!cancelled) setPartners([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPartners();

    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const pageCount = Math.max(1, Math.ceil(partners.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const pagedPartners = useMemo(
    () =>
      partners.slice(
        safePage * PAGE_SIZE,
        safePage * PAGE_SIZE + PAGE_SIZE
      ),
    [partners, safePage]
  );

  useEffect(() => {
    setPage(0);
  }, [partners.length]);

  return (
    <div className="w-full bg-[#F5F9FF]">

      <SEO
        title="Our Partners & Collaborators | WINGS Counselling Centre"
        description="Discover our esteemed partners, schools, voluntary welfare organisations, and community collaborators working together with WINGS Counselling Centre."
        path="/partners"
        ogImage="/assets/partners-hero.jpg"
      />

      {/* Hero Section */}
      <section
        className="relative w-full min-h-[520px] md:min-h-[650px] lg:min-h-[790px] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `url('/assets/partners-hero.jpg')`
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(58, 58, 58, 0.7) 0%, rgba(0, 0, 0, 0.7) 75.96%)'
          }}
        ></div>

        <div className="relative z-10 w-full navbar-align-outer">
          <div className="navbar-align-inner">
            <div className="max-w-full mx-auto px-4 text-center mt-20 md:mt-24">

              <h1 className="text-white text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px] font-semibold font-['Outfit'] mb-6 leading-tight">
                {t("partners.hero.title")}
              </h1>

              <p className="text-white text-[clamp(15px,2.5vw,20px)] font-normal font-['DM_Sans'] max-w-3xl mx-auto mb-10 leading-relaxed">
                {t("partners.hero.description")}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  document
                    .getElementById("partners-section")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }}
                className="bg-[#0D4A7A] transition-colors text-white rounded-full px-8 py-4 inline-flex items-center gap-3"
              >
                <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[18px]">
                  {t("partners.hero.button")}
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
      </section>

      {/* Partners Section */}
      <section
        id="partners-section"
        className="py-20 md:py-24 bg-[#F7F6F3]"
      >
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner">

            {/* CENTERED HEADING */}
            <h2 className="text-[#0D4A7A] text-3xl md:text-[40px] font-medium font-['Outfit'] mb-12 md:mb-20 text-center">
              {t("partners.listing.title")}
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#0D4A7A] border-t-transparent animate-spin" />

                <p className="text-[#0D4A7A] font-['DM_Sans'] text-[15px]">
                  {t("partners.listing.loading")}
                </p>
              </div>

            ) : partners.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#4B5563] font-['DM_Sans'] text-[16px]">
                  {t("partners.listing.noPartners")}
                </p>
              </div>

            ) : (
              <>
                {/* 
                  1 card  -> centered
                  2 cards -> centered
                  3 cards -> 3 columns
                */}
                <div
                  className={`grid gap-8 md:gap-14 w-full ${
                    pagedPartners.length === 1
                      ? "grid-cols-1 max-w-[500px] mx-auto"
                      : pagedPartners.length === 2
                      ? "grid-cols-1 md:grid-cols-2 max-w-[1020px] mx-auto"
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  }`}
                >

                  {pagedPartners.map((partner) => (
                    <div
                      key={partner.id}
                      className="bg-white rounded-[20px] p-8 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow"
                    >

                      <div className="h-[140px] flex items-center justify-center mb-6">
                        <img
                          src={partner.logo || "/assets/partnerlogo1.png"}
                          alt={partner.name || "Partner"}
                          className="max-h-[140px] object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>

                      {partner.duration && (
                        <p className="text-[#6B7280] text-[14px] md:text-[15px] lg:text-[16px] font-normal font-['DM_Sans'] mb-2">
                          {partner.duration}
                        </p>
                      )}

                      {partner.name && (
                        <h3 className="text-[#0D4A7A] text-[18px] md:text-[20px] lg:text-[22px] font-semibold font-['Outfit'] mt-1 mb-4">
                          {partner.name}
                        </h3>
                      )}

                      {partner.description && (
                        <p className="text-[#4B5563] text-[15px] md:text-[16px] lg:text-[17px] font-normal font-['DM_Sans'] leading-[150%] mb-5 flex-grow">
                          {partner.description}
                        </p>
                      )}

                      {partner.quote && (
                        <p className="text-[#0D4A7A] text-[15px] md:text-[16px] lg:text-[17px] font-normal font-['DM_Sans'] leading-[150%] mb-5">
                          {partner.quote}
                        </p>
                      )}

                      {partner.websiteLink && (
                        <a
                          href={partner.websiteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#0D4A7A] text-[15px] md:text-[16px] lg:text-[17px] font-semibold font-['DM_Sans'] group mt-auto max-w-full flex-wrap"
                        >
                          {t("partners.listing.visitWebsite")}

                          <ChevronRight
                            size={16}
                            className="group-hover:translate-x-1 transition-transform shrink-0"
                          />
                        </a>
                      )}

                    </div>
                  ))}

                </div>

                {partners.length > PAGE_SIZE && (
                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">

                    <button
                      type="button"
                      disabled={safePage <= 0}
                      onClick={() =>
                        setPage((p) => Math.max(0, p - 1))
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0D4A7A] text-[#0D4A7A] font-['DM_Sans'] font-medium text-[15px] transition-colors hover:bg-[#0D4A7A] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#0D4A7A]"
                    >
                      <ChevronLeft size={18} />
                      {t("partners.listing.previous")}
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from(
                        { length: pageCount },
                        (_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setPage(i)}
                            aria-label={t(
                              "partners.listing.goToPage",
                              { page: i + 1 }
                            )}
                            className={`min-w-[40px] h-[40px] rounded-full font-['DM_Sans'] font-medium text-[15px] transition-colors ${
                              safePage === i
                                ? "bg-[#0D4A7A] text-white"
                                : "border border-[#0D4A7A] text-[#0D4A7A] hover:bg-[#0D4A7A] hover:text-white"
                            }`}
                          >
                            {i + 1}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={safePage >= pageCount - 1}
                      onClick={() =>
                        setPage((p) =>
                          Math.min(pageCount - 1, p + 1)
                        )
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0D4A7A] text-[#0D4A7A] font-['DM_Sans'] font-medium text-[15px] transition-colors hover:bg-[#0D4A7A] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#0D4A7A]"
                    >
                      {t("partners.listing.next")}
                      <ChevronRight size={18} />
                    </button>

                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </section>

      {/* The Strength of Partnership */}
      <section className="bg-[#D9E1E8] py-20 md:py-24">
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner">

            <div className="text-center mb-16 max-w-4xl mx-auto">

              <h2 className="text-[#0D4A7A] text-3xl md:text-[35px] font-medium font-['Outfit'] mb-6">
                {t("partners.strength.title")}
              </h2>

              <p className="text-black text-lg md:text-[18px] font-normal font-['DM_Sans'] leading-[30px]">
                {t("partners.strength.description")}
              </p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {strengthCards.map((card, index) => {

                const icons = [
                  <svg
                    key="shield"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>,

                  <svg
                    key="users"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>,

                  <svg
                    key="refresh"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>,
                ];

                return (
                  <div
                    key={index}
                    className="bg-white rounded-[20px] p-8 shadow-sm"
                  >
                    <div className="w-[60px] h-[60px] rounded-[16px] bg-[#E8F4FD] flex items-center justify-center mb-6 text-[#0D4A7A]">
                      {icons[index] || icons[0]}
                    </div>

                    <h3 className="text-black text-[25px] font-medium font-['DM_Sans'] mb-4">
                      {card.title}
                    </h3>

                    <p className="text-black/80 text-[18px] font-normal font-['DM_Sans'] leading-[25px]">
                      {card.description}
                    </p>
                  </div>
                );
              })}

            </div>

          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
};

export default PartnerPage;