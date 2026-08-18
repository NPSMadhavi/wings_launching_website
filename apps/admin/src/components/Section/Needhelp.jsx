import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAppointment } from "@/context/AppointmentContext";

const buttons = [
  {
    id: "book",
    href: "#contact",
    style: {
      background: "#FFF",
      border: "none",
      color: "#0D4A7A",
    },
  },
];

export function Needhelp() {
  const { t } = useTranslation();
  const { openModal } = useAppointment();

  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  const handleClick = (id, href) => {
    if (id === "book") {
      openModal();
      return;
    }

    if (href.startsWith("#")) {
      const el = document.querySelector(href);

      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section
      id="needhelp"
      ref={sectionRef}
      className="relative w-full flex flex-col items-center justify-center pt-[60px] pb-[60px] lg:pb-16 overflow-hidden bg-[#F9F9F9]"
    >
      <div className="w-full navbar-align-outer">
      <div className="navbar-align-inner">
      <div className="w-full flex flex-col items-center justify-center py-12 md:py-20 px-4 sm:px-6 rounded-[30px] relative overflow-hidden bg-[#0D4A7A]">
        
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ y: bgY }}
        />

        {/* Heading */}
        <h2
          className="text-[18px]  md:text-[35px] text-center mb-4 text-white font-['Outfit'] font-medium leading-[1.1] max-w-[850px]"
        >
          {t("needHelp.title")}
        </h2>

        {/* Subheading */}
        <p
          className="text-[14px] md:text-[18px] lg:text-[20px] text-center mb-10 text-white/90 font-['DM_Sans'] font-medium leading-[1.4] max-w-[600px]"
        >
          {t("needHelp.description")}
        </p>

        {/* Buttons Row */}
        <div
          className="flex flex-col sm:flex-row flex-wrap justify-center gap-5 min-w-[220px] sm:w-auto"
        >
          {buttons.map((btn) => (
            <a
              key={btn.id}
              href={btn.id === "call" ? btn.href : undefined}
              onClick={(e) => {
                if (btn.id === "book") e.preventDefault();

                handleClick(btn.id, btn.href);
              }}
              className={`
                transition-all duration-300 hover:scale-105
                flex items-center justify-center gap-2 sm:gap-3
                px-5 sm:px-8 h-[52px] sm:h-[60px]
                w-auto sm:min-w-[220px]
                rounded-full font-semibold
                text-[14px] min-[375px]:text-[13px] md:text-[18px]
                font-['Plus_Jakarta_Sans'] no-underline cursor-pointer
                ${
                  btn.id === "call"
                    ? "bg-white text-[#0D4A7A] border-none"
                    : "bg-white text-[#0D4A7A] border border-white"
                }
              `}
            >
              {btn.icon}

              <span className="whitespace-nowrap">{t("needHelp.bookAppointment")}</span>

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
            </a>
          ))}
        </div>
      </div>
      </div>
      </div>
    </section>
  );
}
