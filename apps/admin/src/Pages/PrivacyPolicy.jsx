import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/Layout/Footer";
import SEO from "@/components/SEO";

const cardClass =
  "bg-white rounded-[20px] p-7 md:p-10 border border-gray-200 flex flex-col gap-4 md:gap-6";

const sectionTitleClass =
  "text-[24px] sm:text-[26px] md:text-[25px] font-semibold text-[#0D4A7A] font-['Outfit']";

const subTitleClass =
  "text-[#2C2C2A] font-['Outfit'] text-[18px] md:text-[20px] font-semibold";

const bodyClass =
  "text-gray-700 font-['DM_Sans'] leading-[1.85] text-[16px] md:text-[17px]";

export default function PrivacyPolicy() {
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

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F9F9F9] font-sans overflow-x-hidden">
      <SEO
        title="Privacy Policy | WINGS Counselling Centre"
        description="Read WINGS Counselling Centre's Privacy Policy regarding data protection, confidentiality, personal information collection, and client privacy."
        path="/privacy-policy"
      />
      <div className="w-full h-[400px] bg-[#0D4A7A] pt-[120px] sm:pt-[140px] md:pt-[160px] pb-12 sm:pb-16 md:pb-20 text-center relative shrink-0">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-white font-['Outfit'] pt-[70px] font-semibold text-[34px] sm:text-[36px] md:text-[46px] tracking-tight"
            >
              {t("privacyPolicy.hero.title")}
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
                <h2 className={sectionTitleClass}>{t("privacyPolicy.whoWeAre.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>
                    {t("privacyPolicy.whoWeAre.content.website")}{" "}
                    <a
                      href={t("privacyPolicy.whoWeAre.content.websiteUrl")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:underline transition"
                    >
                      {t("privacyPolicy.whoWeAre.content.websiteUrl")}
                    </a>
                    .
                  </p>
                  <p>{t("privacyPolicy.whoWeAre.content.paragraph1")}</p>
                  <p>{t("privacyPolicy.whoWeAre.content.paragraph2")}</p>
                  <p>{t("privacyPolicy.whoWeAre.content.paragraph3")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("privacyPolicy.pdpa.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("privacyPolicy.pdpa.content.paragraph1")}</p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>
                  {t("privacyPolicy.personalData.title")}
                </h2>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>{t("privacyPolicy.personalData.comments.title")}</h3>
                  <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                    <p>{t("privacyPolicy.personalData.comments.paragraph1")}</p>
                    <p>
                      {t("privacyPolicy.personalData.comments.paragraph2")}{" "}
                      {t("privacyPolicy.personalData.comments.privacyPolicyText")}{" "}
                      <a
                        href={t("privacyPolicy.personalData.comments.privacyPolicyUrl")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:underline transition break-all"
                      >
                        {t("privacyPolicy.personalData.comments.privacyPolicyUrl")}
                      </a>
                      . {t("privacyPolicy.personalData.comments.paragraph3")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>{t("privacyPolicy.personalData.media.title")}</h3>
                  <div className={bodyClass}>
                    <p>{t("privacyPolicy.personalData.media.paragraph1")}</p>
                  </div>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("privacyPolicy.contactForms.title")}</h2>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>{t("privacyPolicy.contactForms.cookies.title")}</h3>
                  <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                    <p>{t("privacyPolicy.contactForms.cookies.paragraph1")}</p>
                    <p>{t("privacyPolicy.contactForms.cookies.paragraph2")}</p>
                    <p>{t("privacyPolicy.contactForms.cookies.paragraph3")}</p>
                    <p>{t("privacyPolicy.contactForms.cookies.paragraph4")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>{t("privacyPolicy.contactForms.embeddedContent.title")}</h3>
                  <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                    <p>{t("privacyPolicy.contactForms.embeddedContent.paragraph1")}</p>
                    <p>{t("privacyPolicy.contactForms.embeddedContent.paragraph2")}</p>
                  </div>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("privacyPolicy.analytics.title")}</h2>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>{t("privacyPolicy.analytics.dataSharing.title")}</h3>
                  <div className={bodyClass}>
                    <p>{t("privacyPolicy.analytics.dataSharing.paragraph1")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>{t("privacyPolicy.analytics.dataRetention.title")}</h3>
                  <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                    <p>{t("privacyPolicy.analytics.dataRetention.paragraph1")}</p>
                    <p>{t("privacyPolicy.analytics.dataRetention.paragraph2")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>{t("privacyPolicy.analytics.userRights.title")}</h3>
                  <div className={bodyClass}>
                    <p>{t("privacyPolicy.analytics.userRights.paragraph1")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>{t("privacyPolicy.analytics.dataTransfer.title")}</h3>
                  <div className={bodyClass}>
                    <p>{t("privacyPolicy.analytics.dataTransfer.paragraph1")}</p>
                  </div>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>{t("privacyPolicy.contactInformation.title")}</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>{t("privacyPolicy.contactInformation.description")}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-x-4 gap-y-3 pt-5">
                    <span>{t("privacyPolicy.contactInformation.details.nameLabel")}:</span>
                    <span>{t("privacyPolicy.contactInformation.details.name")}</span>

                    <span>{t("privacyPolicy.contactInformation.details.emailLabel")}:</span>
                    <span>
                      <a
                        href={`mailto:${t("privacyPolicy.contactInformation.details.email")}`}
                        className="text-gray-700 hover:underline font-medium transition"
                      >
                        {t("privacyPolicy.contactInformation.details.email")}
                      </a>
                    </span>

                    <span>{t("privacyPolicy.contactInformation.details.postalAddressLabel")}:</span>
                    <span>{t("privacyPolicy.contactInformation.details.postalAddress")}</span>

                    <span>{t("privacyPolicy.contactInformation.details.telephoneLabel")}:</span>
                    <span>
                      <a
                        href="tel:63835745"
                        className="text-gray-700 hover:underline font-medium transition"
                      >
                        {t("privacyPolicy.contactInformation.details.telephone")}
                      </a>
                    </span>
                  </div>
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
