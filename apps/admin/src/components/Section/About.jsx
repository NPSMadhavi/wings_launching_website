import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

function ShieldIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" fill="none">
      <path
        d="M16 1L2 7V17C2 24.7 8.2 31.9 16 34C23.8 31.9 30 24.7 30 17V7L16 1Z"
        fill="#DE5753"
      />
      <path
        d="M10 18L14 22L22 13"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function About() {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();

  const features = [
    { id: "compassion", label: t("about.features.compassion") },
    { id: "evidence", label: t("about.features.evidence") },
    { id: "confidential", label: t("about.features.confidential") },
    { id: "holistic", label: t("about.features.holistic") },
  ];

  return (
    <motion.section
      id="about"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className="w-full bg-[#E8EEF5] pt-[60px] pb-[60px]"
    >
      <div className="w-full navbar-align-outer">
        <div className="w-full navbar-align-inner min-w-0">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-['Outfit'] font-medium text-[#0D4A7A] text-[clamp(22px,4.8vw,28px)] md:text-[35px] leading-[1.2] text-center mb-8 md:mb-10"
          >
            {t("about.title")}
          </motion.h2>

          <div className="w-full flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-8 lg:gap-12 xl:gap-16">
            <motion.div
              key={i18n.language}
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex min-w-0 flex-1 flex-col justify-between text-left lg:min-h-[392px] lg:pr-4 xl:pr-8"
            >
              <div>
                <motion.p
                  variants={item}
                  className="font-['DM_Sans'] text-[16px] md:text-[18px] lg:text-[20px] font-normal max-w-[950px] leading-[1.5] lg:leading-[28px] text-black mb-5 lg:mb-6"
                >
                  {t("about.description1")}
                </motion.p>
                <motion.p
                  variants={item}
                  className="font-['DM_Sans'] text-[16px] md:text-[18px] lg:text-[20px] font-normal max-w-[950px] leading-[1.5] lg:leading-[28px] text-black mb-8 lg:mb-10"
                >
                  {t("about.description2")}
                </motion.p>

                <div className="flex flex-col gap-y-6 sm:flex-row sm:items-start sm:gap-x-10 lg:gap-x-12 w-fit max-w-full">
                  <div className="flex flex-col gap-y-6">
                    {[features[0], features[2]].map((feature) => (
                      <motion.div
                        key={feature.id}
                        variants={item}
                        className="flex items-center gap-2"
                      >
                        <ShieldIcon size={28} />
                        <span className="font-['DM_Sans'] font-medium text-[16px] lg:text-[18px] text-black">
                          {feature.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-y-6">
                    {[features[1], features[3]].map((feature) => (
                      <motion.div
                        key={feature.id}
                        variants={item}
                        className="flex items-center gap-2"
                      >
                        <ShieldIcon size={28} />
                        <span className="font-['DM_Sans'] font-medium text-[16px] lg:text-[18px] text-black">
                          {feature.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <motion.button
                variants={item}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/about-us")}
                className="hidden lg:inline-flex items-center mt-8 gap-2 self-start h-[48px] px-8 rounded-full bg-[#1B4585] text-white text-[15px] md:text-[18px] font-['DM_Sans']"
              >
                {t("about.readMore")} <ArrowIcon />
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="w-full shrink-0 lg:w-[483px] lg:h-[392px]"
            >
              <img
                src="/assets/Aboutsection.png"
                alt={t("about.imageAlt")}
                className="w-full h-[280px] sm:h-[340px] lg:h-[392px] rounded-[20px] object-cover object-center"
              />
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/about-us")}
            className="lg:hidden inline-flex items-center gap-2 h-[48px] px-8 rounded-full bg-[#1B4585] text-white text-[16px] font-medium font-['DM_Sans'] mt-8"
          >
            {t("about.readMore")} <ArrowIcon />
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
