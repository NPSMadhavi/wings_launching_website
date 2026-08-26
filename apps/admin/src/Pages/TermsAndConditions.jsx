import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Layout/Footer";
import SEO from "@/components/SEO";

const cardClass =
  "bg-white rounded-[20px] p-7 md:p-10 border border-gray-200 flex flex-col gap-4 md:gap-6";

const sectionTitleClass =
  "text-[30px] font-medium text-[#0D4A7A] font-['Outfit']";

const bodyClass =
  "text-black font-['DM_Sans'] leading-[26px] text-[18px] font-normal";

function BulletList({ intro, items }) {
  const list = Array.isArray(items) ? items : Object.values(items || {});
  return (
    <p>
      {intro}
      <br />
      {list.map((item, i) => (
        <React.Fragment key={i}>
          {item}
          {i < list.length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  );
}

export default function TermsAndConditions() {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const websiteUseItems = t("termsConditions.websiteUse.content.items", { returnObjects: true });
  const professionalItems = t("termsConditions.professionalServices.content.items", { returnObjects: true });
  const emergencyItems = t("termsConditions.emergency.content.items", { returnObjects: true });
  const appointmentItems = t("termsConditions.appointments.content.items", { returnObjects: true });
  const confidentialityItems = t("termsConditions.confidentiality.content.items", { returnObjects: true });
  const liabilityItems = t("termsConditions.liability.content.items", { returnObjects: true });
  const submissionItems = t("termsConditions.userSubmissions.content.items", { returnObjects: true });

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F9F9F9] font-sans overflow-x-hidden">
      <SEO
        title="Terms of Service | WINGS Counselling Centre"
        description="Review the Terms of Service for WINGS Counselling Centre, governing website usage, appointment bookings, and service policies."
        path="/terms-of-service"
      />
      <div className="w-full h-[400px] bg-[#0D4A7A] pt-[120px] sm:pt-[140px] md:pt-[160px] pb-12 sm:pb-16 md:pb-20 text-center relative shrink-0">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-white font-['Outfit'] pt-[70px] font-semibold text-[40px] sm:text-[50px] md:text-[60px] tracking-tight"
            >
              {t("termsConditions.hero.title")}
            </motion.h1>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full bg-[#F9F9F9] pt-5 pb-8 md:pt-8 md:pb-10">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6 md:gap-8"
            >
              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.acceptance.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("termsConditions.acceptance.content.paragraph1")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.websiteUse.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <BulletList
                    intro={t("termsConditions.websiteUse.content.intro")}
                    items={websiteUseItems}
                  />
                  <p>{t("termsConditions.websiteUse.content.paragraph1")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.professionalServices.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("termsConditions.professionalServices.content.paragraph1")}</p>
                  <BulletList
                    intro={t("termsConditions.professionalServices.content.intro")}
                    items={professionalItems}
                  />
                  <p>{t("termsConditions.professionalServices.content.paragraph2")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.emergency.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("termsConditions.emergency.content.paragraph1")}</p>
                  <BulletList
                    intro={t("termsConditions.emergency.content.intro")}
                    items={emergencyItems}
                  />
                  <p>{t("termsConditions.emergency.content.paragraph2")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.appointments.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("termsConditions.appointments.content.paragraph1")}</p>
                  <BulletList
                    intro={t("termsConditions.appointments.content.intro")}
                    items={appointmentItems}
                  />
                  <p>{t("termsConditions.appointments.content.paragraph2")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.confidentiality.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("termsConditions.confidentiality.content.paragraph1")}</p>
                  <BulletList
                    intro={t("termsConditions.confidentiality.content.intro")}
                    items={confidentialityItems}
                  />
                  <p>{t("termsConditions.confidentiality.content.paragraph2")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.thirdPartyLinks.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("termsConditions.thirdPartyLinks.content.paragraph1")}</p>
                  <p>{t("termsConditions.thirdPartyLinks.content.paragraph2")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.liability.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <BulletList
                    intro={t("termsConditions.liability.content.intro")}
                    items={liabilityItems}
                  />
                  <p>{t("termsConditions.liability.content.paragraph1")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.websiteAvailability.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("termsConditions.websiteAvailability.content.paragraph1")}</p>
                  <p>{t("termsConditions.websiteAvailability.content.paragraph2")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.userSubmissions.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <BulletList
                    intro={t("termsConditions.userSubmissions.content.intro")}
                    items={submissionItems}
                  />
                  <p>{t("termsConditions.userSubmissions.content.paragraph1")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.governingLaw.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("termsConditions.governingLaw.content.paragraph1")}</p>
                  <p>{t("termsConditions.governingLaw.content.paragraph2")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("termsConditions.contact.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("termsConditions.contact.content.paragraph1")}</p>
                  <p className="font-semibold">{t("termsConditions.contact.content.organization")}</p>
                  <p>
                    {t("termsConditions.contact.content.details.emailLabel")}:{" "}
                    <a
                      href={`mailto:${t("termsConditions.contact.content.details.email")}`}
                      className="text-[#0D4A7A] hover:underline"
                    >
                      {t("termsConditions.contact.content.details.email")}
                    </a>
                    <br />
                    {t("termsConditions.contact.content.details.phoneLabel")}:{" "}
                    <a href="tel:63835745" className="text-[#0D4A7A] hover:underline">
                      {t("termsConditions.contact.content.details.phone")}
                    </a>
                  </p>
                </div>
              </motion.section>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
