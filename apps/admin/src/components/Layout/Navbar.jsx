
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Heart,
  Globe,
  Home as HomeIcon,
  Users,
  HandHeart,
  FileText,
  Briefcase,
  Handshake,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
import { scrollToContactWithRetry, scrollToPartnersWithRetry } from "@/lib/scrollToSection";

import { useAppointment } from "@/context/AppointmentContext";

const navLinks = [
  { id: "home", labelKey: "navbar.home", href: "/", route: true },

  {
    id: "about",
    labelKey: "navbar.about",
    href: "/about-us",
    route: true,

    dropdown: [
      {
        id: "about",
        labelKey: "navbar.about",
        href: "/about-us",
        route: true,
      },

      {
        id: "team",
        labelKey: "navbar.team",
        href: "/team",
        route: true,
      },

      {
        id: "contact",
        labelKey: "navbar.contact",
        href: "/#contact",
        route: false,
      },
    ],
  },

  {
    id: "services",
    labelKey: "navbar.services",
    href: "/services",
    route: true,

    dropdown: [
      {
        id: "counselling",
        labelKey: "navbar.counselling",
        href: "/services#counselling",
        route: false,
      },

      {
        id: "supervision",
        labelKey: "navbar.supervision",
        href: "/services#supervision",
        route: false,
      },

      {
        id: "training",
        labelKey: "navbar.training",
        href: "/services#training",
        route: false,
      },
    ],
  },

  {
    id: "resources",
    labelKey: "navbar.resources",
    href: "/events",
    route: false,

    dropdown: [
     {

    id: "careers",
    labelKey: "navbar.careers",
    href: "/career",
    route: true,
    newTab: true,
},

      {
        id: "articles",
        labelKey: "navbar.articles",
        href: "/articles",
        route: true,
      },

      {
        id: "volunteers",
        labelKey: "navbar.volunteers",
        href: "/volunteer",
        route: true,
      },
    ],
  },

  {
    id: "partners",
    labelKey: "navbar.partners",
    href: "/partners",
    route: true,
  },

{
        id: "events",
        labelKey: "navbar.events",
        href: "/events",
        route: true,
      },
];

const navIcons = {
  home: HomeIcon,
  about: Users,
  services: HandHeart,
  resources: FileText,
  partners: Handshake,
  careers: Briefcase,
};

const languages = [
  { code: "en", name: "English", displayName: "Eng" },
  { code: "zh", name: "中文", displayName: "中文" },
  { code: "ms", name: "Bahasa Melayu", displayName: "BM" },
  { code: "hi", name: "हिंदी", displayName: "हिंदी" },
  { code: "ta", name: "தமிழ்", displayName: "தமிழ்" },
];

function markIntroAsPlayed() {
  try {
    sessionStorage.setItem("skipLogoIntro", "1");
    sessionStorage.setItem("hasPlayedIntro", "1");
  } catch (err) {}
}

export function Navbar() {
  const { t, i18n } = useTranslation();
  const lng = (i18n.language || "en").split("-")[0];
  const isTamil = lng === "ta";
  const compactNav = lng === "ms" || lng === "ta";
  const desktopNavClass = "hidden min-[1280px]:flex";
  const mobileBtnClass = "min-[1280px]:hidden flex";
  const mobileOnlyClass = "min-[1280px]:hidden";
  const navFontSize = isTamil
    ? "clamp(10px,0.66vw,12.5px)"
    : compactNav
    ? "clamp(11px,0.72vw,14px)"
    : "clamp(13px,0.95vw,18px)";
  const navPad = isTamil
    ? "clamp(2px,0.18vw,4px) clamp(2px,0.25vw,5px)"
    : compactNav
    ? "clamp(4px,0.35vw,6px) clamp(4px,0.45vw,8px)"
    : "clamp(6px,0.5vw,8px) clamp(8px,0.8vw,14px)";
  const ctaFontSize = isTamil
    ? "clamp(9px,0.6vw,11.5px)"
    : compactNav
    ? "clamp(10px,0.7vw,13px)"
    : "clamp(12px,0.9vw,15px)";
  const ctaPad = isTamil
    ? "0 clamp(4px, 0.4vw, 8px)"
    : compactNav
    ? "0 clamp(8px, 0.8vw, 12px)"
    : "0 clamp(12px, 1.2vw, 18px)";

  const { openModal } =
    useAppointment();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [location, navigate] =
    useLocation();

 const [activeDropdown, setActiveDropdown] =
  useState(null);

const [hoveredNav, setHoveredNav] =
  useState(null);

  const [
    activeLangDropdown,
    setActiveLangDropdown,
  ] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const lng = (i18n.language || "en").split("-")[0];
    return languages.find((l) => l.code === lng) || languages[0];
  });

  const [showNavbar, setShowNavbar] =
    useState(false);

  const [isScrolled, setIsScrolled] =
    useState(false);

  const [navbarHeight, setNavbarHeight] = useState(0);
  const navbarRef = useState(null);

  /* =====================================================
     SCROLL
  ===================================================== */

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, []);

  /* =====================================================
     INTRO CHECK
  ===================================================== */

  useEffect(() => {
    const checkIntro = () => {
      const intro =
        document.getElementById(
          "logo-intro"
        );

      if (!intro) {
        setShowNavbar(true);
      } else {
        setShowNavbar(false);
      }
    };

    const interval =
      setInterval(checkIntro, 100);

    return () =>
      clearInterval(interval);
  }, []);

  /* =====================================================
     MEASURE NAVBAR HEIGHT FOR MOBILE MENU POSITIONING
  ===================================================== */

  useEffect(() => {
    const measureNavbar = () => {
      const navEl = document.getElementById("wings-main-navbar");
      if (navEl) {
        setNavbarHeight(navEl.offsetHeight);
      }
    };

    measureNavbar();
    window.addEventListener("resize", measureNavbar);

    return () => window.removeEventListener("resize", measureNavbar);
  }, [showNavbar]);

  /* =====================================================
     ESC KEY TO CLOSE MOBILE MENU
  ===================================================== */

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
        setActiveDropdown(null);
        setActiveLangDropdown(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [mobileOpen]);

  /* =====================================================
     BODY SCROLL LOCK WHEN MOBILE MENU IS OPEN
  ===================================================== */

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* =====================================================
     HASH SCROLL
  ===================================================== */

  useEffect(() => {
    if (
      showNavbar &&
      window.location.hash
    ) {
      const id =
        window.location.hash;

      const el =
        document.querySelector(id);

      if (el) {
        const timer =
          setTimeout(() => {
            el.scrollIntoView({
              behavior: "smooth",
            });
          }, 300);

        return () =>
          clearTimeout(timer);
      }
    }
  }, [showNavbar, location]);

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const handleNavClick = (
    e,
    link
  ) => {
    e.preventDefault();

    if (link.dropdown) return;

    setMobileOpen(false);

    setActiveDropdown(null);

    if (link.newTab) {
      window.open(link.href, "_blank", "noopener,noreferrer");
      return;
    }

    if (link.route) {
      if (link.href === "/") {
        markIntroAsPlayed();
      }
      navigate(link.href);
    } else {
      const [path, hashPart] =
        link.href.split("#");

      const targetPath =
        path || "/";

      const targetHash =
        hashPart
          ? `#${hashPart}`
          : "";

      try {
        if (targetHash || targetPath === "/") {
          markIntroAsPlayed();
        }
      } catch (err) {}

      if (
        location === targetPath &&
        targetHash === "#contact"
      ) {
        scrollToContactWithRetry();
        return;
      }

      if (
        location === targetPath &&
        targetHash === "#partners"
      ) {
        scrollToPartnersWithRetry();
        return;
      }

      if (
        location === targetPath &&
        targetHash
      ) {
        const el =
          document.querySelector(
            targetHash
          );

        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
          });
        } else {
          window.location.hash =
            targetHash;
        }
      } else if (
        targetPath === "/" &&
        targetHash
      ) {
        try {
          if (targetHash === "#contact") {
            sessionStorage.setItem(
              "scrollToContact",
              "1"
            );
          }
          if (targetHash === "#partners") {
            sessionStorage.setItem(
              "scrollToPartners",
              "1"
            );
          }
        } catch (err) {}

        navigate("/");
      } else {
        navigate(link.href);
      }
    }
  };

  /* =====================================================
     LANGUAGE
  ===================================================== */

  useEffect(() => {
    const lng = (i18n.language || "en").split("-")[0];
    const match = languages.find((l) => l.code === lng) || languages[0];
    setSelectedLanguage(match);
  }, [i18n.language]);

  const handleLanguageSelect = (
    lang
  ) => {
    i18n.changeLanguage(lang.code);
    setSelectedLanguage(lang);
    setActiveLangDropdown(false);
  };

  const getLanguageDisplayText = () => {
    return selectedLanguage.displayName;
  };

  return (
    <>
      <AnimatePresence>
        {showNavbar && (
          <motion.div
            initial={{
              opacity: 0,
              y: -20,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}

            className="
              fixed
              top-0
              left-0
              right-0
              w-full
              z-[100002]
              pointer-events-none
            "
          >
            {/* =====================================================
               NAVBAR WRAPPER
            ===================================================== */}

            <div
              id="wings-navbar-wrapper"
              className={`
                w-full
                flex
                justify-center
                transition-all
                duration-300
                px-2
                min-[375px]:px-3
                sm:px-4
                md:px-5
                lg:px-6
                xl:px-8
                2xl:px-10

                ${
                  isScrolled
                    ? "pt-0 pb-2 sm:pb-3"
                    : "pt-2 pb-2 sm:pt-3 sm:pb-4"
                }
              `}
            >
              {/* =====================================================
                 MAIN NAVBAR
              ===================================================== */}

              <div
                id="wings-main-navbar"
                className="
                  w-full
                  max-w-[1750px]
                  2xl:max-w-[1920px]
                  min-[2560px]:max-w-[2200px]
                  mx-auto
                  flex
                  items-center
                  justify-between
                  gap-1
                  sm:gap-1.5
                  lg:gap-2
                  min-w-0
                  pointer-events-auto
                  transition-all
                  duration-300
                "
                style={{
                  minHeight: "clamp(64px, 5vw, 88px)",
                  padding: "clamp(8px, 1vw, 12px) clamp(12px, 2vw, 24px)",

                  borderRadius:
                    isScrolled
                      ? "0 0 clamp(16px,3vw,30px) clamp(16px,3vw,30px)"
                      : "clamp(16px,3vw,30px)",

                  background: "#FFF",

                  boxShadow:
                    "0 4px 15px rgba(0,0,0,0.08)",
                }}
              >
                {/* =====================================================
                   LOGO
                ===================================================== */}

                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    markIntroAsPlayed();
                    navigate("/");
                  }}

                  className="
                    flex-shrink-0
                    relative
                    z-20
                  "
                >
                  <img
                    src="/assets/wingsLogo.png"
                    alt="Wings Counselling Centre"
                    className={
                      isTamil
                        ? `
                      w-[110px]
                      min-[375px]:w-[115px]
                      sm:w-[125px]
                      md:w-[130px]
                      lg:w-[140px]
                      xl:w-[150px]
                      2xl:w-[170px]
                    `
                        : compactNav
                        ? `
                      w-[120px]
                      min-[375px]:w-[130px]
                      sm:w-[140px]
                      md:w-[150px]
                      lg:w-[160px]
                      xl:w-[170px]
                      2xl:w-[190px]
                    `
                        : `
                      w-[140px]
                      min-[375px]:w-[155px]
                      sm:w-[170px]
                      md:w-[170px]
                      lg:w-[180px]
                      xl:w-[210px]
                      2xl:w-[230px]
                    `
                    }
                    style={{
                      height: "auto",
                      objectFit:
                        "contain",
                    }}
                  />
                </a>

                {/* =====================================================
                   DESKTOP NAVIGATION
                ===================================================== */}

                <div
                  className={`
                    ${desktopNavClass}
                    flex-1
                    items-center
                    justify-center
                    gap-0
                    xl:gap-0.5
                    2xl:gap-2
                    min-w-0
                    overflow-visible
                    relative
                    z-10
                  `}
                >
                  {navLinks.map(
                    (link) => {
                      const hasDropdown =
                        !!link.dropdown;

                      const isActive =
                        location ===
                          link.href ||
                        (hasDropdown &&
                          link.dropdown.some(
                            (d) =>
                              location ===
                              d.href
                          ));
                          const isHovered =
  hoveredNav === link.id;

                      return (
                        <div
                          key={
                            link.id
                          }

                          className="
                            relative
                            group
                          "

                          onMouseEnter={() => {
  setHoveredNav(link.id);

  if (hasDropdown) {
    setActiveDropdown(link.id);
  }
}}

onMouseLeave={() => {
  setHoveredNav(null);

  if (hasDropdown) {
    setActiveDropdown(null);
  }
}}
                        >
                          {/* =====================================================
                             NAV ITEM
                          ===================================================== */}

                          <div className="relative">
                            {link.route ? (
                              link.newTab ? (
                                <a
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="
                                    flex
                                    items-center
                                    gap-1
                                    transition-all
                                    duration-300
                                    nav-item-parent
                                    whitespace-nowrap
                                  "
                                  style={{
  color:
  isActive ||
  isHovered ||
  activeDropdown === link.id
    ? "#1B4585"
    : "#000",
                                    fontFamily:
                                      "'DM Sans', sans-serif",
                                    fontSize: navFontSize,
                                    fontWeight:
                                      "500",
                                    textDecoration:
                                      "none",
                                    padding: navPad,
                                    borderRadius:
                                      "8px",
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  {t(link.labelKey)}
                                </a>
                              ) : (
                              <Link
                                href={
                                  link.href
                                }

                                className="
                                  flex
                                  items-center
                                  gap-1
                                  transition-all
                                  duration-300
                                  nav-item-parent
                                  whitespace-nowrap
                                "

                                style={{
                                 color:
  isActive ||
  isHovered ||
  activeDropdown === link.id
    ? "#1B4585"
    : "#000",

                                  fontFamily:
                                    "'DM Sans', sans-serif",

                                  fontSize:
                                    navFontSize,

                                  fontWeight:
                                    "500",

                                  textDecoration:
                                    "none",

                                  padding:
                                    navPad,

                                  borderRadius:
                                    "8px",

                                  cursor:
                                    "pointer",
                                }}

                                onClick={() => {
                                  if (link.href === "/") {
                                    markIntroAsPlayed();
                                  }

                                  setMobileOpen(
                                    false
                                  );

                                  setActiveDropdown(
                                    null
                                  );
                                }}
                              >
                                {
                                  t(link.labelKey)
                                }

                                {hasDropdown && (
                                  <ChevronDown
                                    size={
                                      18
                                    }

                                    className={`
                                      transition-transform
                                      duration-300

                                      ${
                                        activeDropdown ===
                                        link.id
                                          ? "rotate-180"
                                          : ""
                                      }
                                    `}
                                  />
                                )}
                              </Link>
                              )
                            ) : (
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-1
                                  transition-all
                                  duration-300
                                  cursor-default
                                  nav-item-parent
                                  whitespace-nowrap
                                "
                                style={{
                                 color:
                                isActive ||
                                isHovered ||
                                activeDropdown === link.id
                                  ? "#1B4585"
                                  : "#000",

                                  fontFamily:
                                    "'DM Sans', sans-serif",

                                  fontSize:
                                    navFontSize,

                                  fontWeight:
                                    "500",

                                  padding:
                                    navPad,

                                  borderRadius:
                                    "8px",
                                }}
                              >
                                {
                                  t(link.labelKey)
                                }

                                {hasDropdown && (
                                  <ChevronDown
                                    size={
                                      18
                                    }

                                    className={`
                                      transition-transform
                                      duration-300

                                      ${
                                        activeDropdown ===
                                        link.id
                                          ? "rotate-180"
                                          : ""
                                      }
                                    `}
                                  />
                                )}
                              </div>
                            )}

                            <AnimatePresence>
                              {(isActive ||
  isHovered ||
  activeDropdown === link.id) && (
                                <motion.div
                                  layoutId="navUnderline"

                                  initial={{
                                    scaleX: 0,
                                    opacity: 0,
                                  }}

                                  animate={{
                                    scaleX: 1,
                                    opacity: 1,
                                  }}

                                  exit={{
                                    scaleX: 0,
                                    opacity: 0,
                                  }}

                                 transition={{
  duration: 0.25,
  ease: "easeOut",
}}

                                  className="
                                    absolute
                                    bottom-0
                                    left-4
                                    right-4
                                    h-[2px]
                                    bg-[#1B4585]
                                  "
                                />
                              )}
                            </AnimatePresence>
                          </div>

                          {/* =====================================================
                             DROPDOWN
                          ===================================================== */}

                          {hasDropdown && (
                            <AnimatePresence>
                              {activeDropdown ===
                                link.id && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    y: 10,
                                  }}

                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                  }}

                                  exit={{
                                    opacity: 0,
                                    y: 10,
                                  }}

                                  transition={{
                                    duration: 0.2,
                                  }}

                                  className="
                                    absolute
                                    top-full
                                    left-0
                                    mt-2
                                    min-w-[220px]
                                    lg:min-w-[220px]
                                    xl:min-w-[240px]
                                    bg-white
                                    rounded-xl
                                    shadow-xl
                                    overflow-hidden
                                    border
                                    border-gray-100
                                    z-[100050]
                                  "
                                >
                                  <div className="py-2">
                                    {link.dropdown.map((subItem) =>
                                      subItem.route ? (
                                        subItem.newTab ? (
                                          <a
                                            key={subItem.id}
                                            href={subItem.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="
                                              block
                                              px-5
                                              lg:px-5
                                              xl:px-6
                                              py-3
                                              transition-all
                                              duration-200
                                              dropdown-item
                                              rounded-lg
                                              mx-2
                                            "
                                            style={{
                                              fontFamily: "'DM Sans', sans-serif",
                                              fontWeight: "500",
                                              fontSize: "clamp(13px,0.95vw,16px)",
                                              textDecoration: "none",
                                              color: "#333",
                                              backgroundColor: "transparent",
                                            }}
                                            onClick={() => {
                                              setActiveDropdown(null);
                                              setMobileOpen(false);
                                            }}
                                          >
                                            {t(subItem.labelKey)}
                                          </a>
                                        ) : (
                                          <Link
                                            key={subItem.id}
                                            href={subItem.href}
                                            className="
                                              block
                                              px-5
                                              lg:px-5
                                              xl:px-6
                                              py-3
                                              transition-all
                                              duration-200
                                              dropdown-item
                                              rounded-lg
                                              mx-2
                                            "
                                            style={{
                                              fontFamily: "'DM Sans', sans-serif",
                                              fontWeight: "500",
                                              fontSize: "clamp(13px,0.95vw,16px)",
                                              textDecoration: "none",
                                              color:
                                                location === subItem.href
                                                  ? "#1B4585"
                                                  : "#333",
                                              backgroundColor:
                                                location === subItem.href
                                                  ? "#EAF3FF"
                                                  : "transparent",
                                            }}
                                            onClick={() => {
                                              setActiveDropdown(null);
                                              setMobileOpen(false);
                                            }}
                                          >
                                            {t(subItem.labelKey)}
                                          </Link>
                                        )
                                      ) : (
                                        <a
                                          key={subItem.id}
                                          href={subItem.href}
                                          onClick={(e) =>
                                            handleNavClick(e, subItem)
                                          }
                                          className="
                                            block
                                            px-5
                                            lg:px-5
                                            xl:px-6
                                            py-3
                                            transition-all
                                            duration-200
                                            dropdown-item
                                            rounded-lg
                                            mx-2
                                          "
                                          style={{
                                            fontFamily:
                                              "'DM Sans', sans-serif",
                                            fontWeight: "500",
                                            fontSize:
                                              "clamp(13px,0.95vw,16px)",
                                            textDecoration: "none",
                                            color: "#333",
                                          }}
                                        >
                                          {t(subItem.labelKey)}
                                        </a>
                                      )
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* =====================================================
                   RIGHT BUTTONS
                ===================================================== */}

                <div
                  className={`
                    ${desktopNavClass}
                    items-center
                    gap-1
                    xl:gap-2
                    2xl:gap-3
                    flex-shrink-0
                    relative
                    z-20
                  `}
                >

                  {/* =====================================================
                     LANGUAGE
                  ===================================================== */}

                  <div
                    className="
                      relative
                    "

                    onMouseEnter={() =>
                      setActiveLangDropdown(
                        true
                      )
                    }

                    onMouseLeave={() =>
                      setActiveLangDropdown(
                        false
                      )
                    }
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-1.5
                        xl:gap-2
                        cursor-pointer
                        nav-item-parent
                        whitespace-nowrap
                      "
                      style={{
                        color:
                          activeLangDropdown
                            ? "#1B4585"
                            : "#000",

                        fontFamily:
                          "'DM Sans', sans-serif",

                        fontSize:
                          navFontSize,

                        fontWeight:
                          "500",

                        padding:
                          navPad,

                        borderRadius:
                          "8px",
                      }}
                    >
                      <Globe
                        size={18}
                        color="#1B4585"
                      />

                      <span>
                        {getLanguageDisplayText()}
                      </span>

                      <ChevronDown
                        size={16}
                        className={`
                          transition-transform
                          duration-300

                          ${
                            activeLangDropdown
                              ? "rotate-180"
                              : ""
                          }
                        `}
                      />
                    </div>

                    <AnimatePresence>
                      {activeLangDropdown && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}

                          animate={{
                            opacity: 1,
                            y: 0,
                          }}

                          exit={{
                            opacity: 0,
                            y: 10,
                          }}

                          transition={{
                            duration: 0.2,
                          }}

                          className="
                            absolute
                            top-full
                            right-0
                            mt-2
                            min-w-[200px]
                            xl:min-w-[220px]
                            bg-white
                            rounded-xl
                            shadow-xl
                            overflow-hidden
                            border
                            border-gray-100
                            z-[100]
                          "
                        >
                          <div className="py-2">
                            {languages.map(
                              (
                                lang
                              ) => (
                                <button
                                  key={
                                    lang.code
                                  }

                                  onClick={() =>
                                    handleLanguageSelect(
                                      lang
                                    )
                                  }

                                  className="
                                    w-full
                                    text-left
                                    px-5
                                    xl:px-6
                                    py-3
                                    transition-all
                                    duration-200
                                    dropdown-item
                                    rounded-lg
                                    mx-2
                                    flex
                                    items-center
                                    gap-3
                                  "

                                  style={{
                                    fontFamily:
                                      "'DM Sans', sans-serif",

                                    fontWeight:
                                      "500",

                                    fontSize:
                                      "clamp(13px,0.95vw,16px)",

                                    color:
                                      selectedLanguage?.code ===
                                      lang.code
                                        ? "#1B4585"
                                        : "#333",

                                    backgroundColor:
                                      selectedLanguage?.code ===
                                      lang.code
                                        ? "#EAF3FF"
                                        : "transparent",
                                  }}
                                >
                                  <span>
                                    {
                                      lang.name
                                    }
                                  </span>

                                  {selectedLanguage?.code ===
                                    lang.code && (
                                    <span className="ml-auto text-[#1B4585]">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* DONATE */}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();

                      window.open(
                        "https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow",
                        "_blank"
                      );
                    }}
                    className="
                      transition-transform
                      hover:scale-105
                      flex
                      items-center
                      justify-center
                      gap-1.5
                      xl:gap-2
                      text-center
                    "
                    style={{
                      minHeight: "clamp(2.5rem, 3vw, 2.875rem)",
                      height: "auto",
                      padding: compactNav
                        ? "0.4rem 0.7rem"
                        : "0.5rem 1rem",
                      borderRadius: "9999px",
                      border: "2px solid #1B4585",
                      color: "#1B4585",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: ctaFontSize,
                      fontWeight: "600",
                      maxWidth: compactNav ? "9.5rem" : "none",
                      whiteSpace: compactNav ? "normal" : "nowrap",
                      lineHeight: 1.2,
                    }}
                  >
                    {t("navbar.donate")}

                    <Heart size={17} fill="currentColor" />
                  </a>

                  {/* APPOINTMENT */}

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      openModal();
                    }}
                    className="
                      transition-all
                      hover:scale-105
                      hover:shadow-xl
                      active:scale-95
                      active:shadow-md
                      flex
                      items-center
                      justify-center
                      gap-1.5
                      xl:gap-2
                      text-center
                    "
                    style={{
                      minHeight: "clamp(2.5rem, 3vw, 2.875rem)",
                      height: "auto",
                      padding: compactNav
                        ? "0.45rem 0.75rem"
                        : "0.55rem 1rem",
                      borderRadius: "9999px",
                      background: "#1B4585",
                      color: "#F5F9FF",
                      textDecoration: "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: ctaFontSize,
                      fontWeight: "700",
                      boxShadow: "0 4px 12px rgba(27,69,133,0.3)",
                      border: "none",
                      maxWidth: compactNav ? "12rem" : "none",
                      whiteSpace: compactNav ? "normal" : "nowrap",
                      lineHeight: 1.2,
                    }}
                  >
                    {t("navbar.bookAppointment")}

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

                {/* =====================================================
                   MOBILE BUTTON
                ===================================================== */}

                <button
                  className={`
                    ${mobileBtnClass}
                    items-center
                    justify-center
                    p-2
                    flex-shrink-0
                  `}

                  onClick={() =>
                    setMobileOpen(
                      !mobileOpen
                    )
                  }

                  style={{
                    background:
                      "none",

                    border:
                      "none",
                  }}
                >
                  {mobileOpen ? (
                    <X
                      size={28}
                      color="#1B4585"
                    />
                  ) : (
                    <Menu
                      size={28}
                      color="#1B4585"
                    />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
         MOBILE MENU - GLASSMORPHISM RIGHT-SIDE PANEL
      ===================================================== */}

      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* BACKDROP OVERLAY */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`
                fixed
                inset-0
                z-[100000]
                ${mobileOnlyClass}
              `}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
              onClick={() => {
                setMobileOpen(false);
                setActiveDropdown(null);
                setActiveLangDropdown(false);
              }}
            />

            {/* SLIDING PANEL */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
                mass: 0.8,
              }}
              className={`
                fixed
                right-2
                min-[375px]:right-3
                sm:right-4
                h-fit
                z-[100001]
                ${mobileOnlyClass}
                overflow-hidden
                flex
                flex-col
              `}
              style={{
                top: navbarHeight > 0
                  ? `${navbarHeight + 8}px`
                  : "clamp(72px,14vw,96px)",
                maxHeight: navbarHeight > 0
                  ? `calc(100vh - ${navbarHeight + 16}px)`
                  : "calc(100vh - 100px)",
                width: "85%",
                maxWidth: window.innerWidth >= 600 ? "400px" : "320px",
                borderRadius: "24px",
                background: "#FFFFFF",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                boxShadow: "-8px 0 40px rgba(0, 0, 0, 0.12), -2px 0 8px rgba(0, 0, 0, 0.06)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.5)",
              }}
            >


              {/* SCROLLABLE NAV CONTENT */}
              <div
                className="
                  overflow-y-auto
                  overflow-x-hidden
                "
                style={{
                  padding: "clamp(8px, 2vw, 16px) clamp(12px, 3vw, 20px) clamp(16px, 4vw, 24px)",
                }}
              >
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const hasDropdown = !!link.dropdown;
                    const isActive =
                      location === link.href ||
                      (hasDropdown &&
                        link.dropdown.some((d) => location === d.href));
                    const NavIcon = navIcons[link.id];

                    return (
                      <div key={link.id} className="w-full">
                        {/* MAIN BUTTON */}
                        <button
                          onClick={(e) => {
                            if (hasDropdown) {
                              setActiveDropdown(
                                activeDropdown === link.id
                                  ? null
                                  : link.id
                              );
                            } else {
                              handleNavClick(e, link);
                            }
                          }}
                          className="
                            w-full
                            flex
                            items-center
                            justify-between
                            transition-all
                            duration-200
                          "
                          style={{
                            padding: "14px 16px",
                            borderRadius: "16px",
                            color: "#1B4585",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "15px",
                            fontWeight: isActive ? "700" : "600",
                            background: isActive ? "rgba(27, 69, 133, 0.07)" : "transparent",
                            border: "none",
                          }}
                        >
                          <span className="flex items-center gap-3">
                            {NavIcon && (
                              <NavIcon
                                size={20}
                                color="#1B4585"
                                strokeWidth={isActive ? 2.5 : 2}
                              />
                            )}
                            {t(link.labelKey)}
                          </span>

                          {hasDropdown && (
                            <ChevronDown
                              size={18}
                              className={`
                                transition-transform
                                duration-300
                                ${activeDropdown === link.id ? "rotate-180" : ""}
                              `}
                            />
                          )}
                        </button>

                        {/* DROPDOWN */}
                        <AnimatePresence>
                          {hasDropdown &&
                            activeDropdown === link.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div
                                  className="flex flex-col gap-0.5"
                                  style={{
                                    marginLeft: "16px",
                                    marginTop: "4px",
                                    marginBottom: "4px",
                                    paddingLeft: "12px",
                                    borderLeft: "2px solid rgba(27, 69, 133, 0.12)",
                                  }}
                                >
                                  {link.dropdown.map((subItem) => {
                                    const subActive = location === subItem.href;

                                    return (
                                      <button
                                        key={subItem.id}
                                        onClick={(e) => handleNavClick(e, subItem)}
                                        className="
                                          text-left
                                          transition-all
                                          duration-200
                                        "
                                        style={{
                                          padding: "10px 14px",
                                          borderRadius: "12px",
                                          fontSize: "14px",
                                          fontFamily: "'DM Sans', sans-serif",
                                          fontWeight: subActive ? "600" : "500",
                                          color: subActive ? "#1B4585" : "#555",
                                          background: subActive ? "rgba(27, 69, 133, 0.06)" : "transparent",
                                          border: "none",
                                          width: "100%",
                                        }}
                                      >
                                        {t(subItem.labelKey)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* MOBILE LANGUAGE */}
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(27, 69, 133, 0.08)",
                  }}
                >
                  <button
                    onClick={() =>
                      setActiveLangDropdown(!activeLangDropdown)
                    }
                    className="
                      w-full
                      flex
                      items-center
                      justify-between
                      transition-all
                      duration-200
                    "
                    style={{
                      padding: "12px 14px",
                      borderRadius: "14px",
                      color: "#1B4585",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "15px",
                      fontWeight: "600",
                      background: "transparent",
                      border: "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Globe size={18} color="#1B4585" />
                      <span>{selectedLanguage.displayName}</span>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`
                        transition-transform
                        duration-300
                        ${activeLangDropdown ? "rotate-180" : ""}
                      `}
                    />
                  </button>

                  <AnimatePresence>
                    {activeLangDropdown && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div
                          className="flex flex-col gap-0.5"
                          style={{
                            marginLeft: "16px",
                            marginTop: "4px",
                            paddingLeft: "12px",
                            borderLeft: "2px solid rgba(27, 69, 133, 0.12)",
                          }}
                        >
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => handleLanguageSelect(lang)}
                              className="
                                w-full
                                flex
                                items-center
                                gap-3
                                text-left
                                transition-all
                                duration-200
                              "
                              style={{
                                padding: "10px 14px",
                                borderRadius: "12px",
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "14px",
                                fontWeight: selectedLanguage.code === lang.code ? "600" : "500",
                                color: selectedLanguage.code === lang.code ? "#1B4585" : "#555",
                                background:
                                  selectedLanguage.code === lang.code
                                    ? "rgba(27, 69, 133, 0.06)"
                                    : "transparent",
                                border: "none",
                              }}
                            >
                              <span>{lang.name}</span>
                              {selectedLanguage.code === lang.code && (
                                <span className="ml-auto text-[#1B4585] font-bold">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ACTION BUTTONS */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(27, 69, 133, 0.08)",
                  }}
                >
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        window.open(
                          "https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow",
                          "_blank"
                        );
                      }}
                      className="
                        w-full
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition-all
                        duration-200
                        active:scale-[0.97]
                      "
                      style={{
                        height: "48px",
                        borderRadius: "9999px",
                        border: "2px solid #1B4585",
                        color: "#1B4585",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "15px",
                        fontWeight: "600",
                        background: "transparent",
                      }}
                    >
                      {t("navbar.donate")}
                      <Heart size={16} fill="#1B4585" color="#1B4585" />
                    </button>

                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        openModal();
                      }}
                      className="
                        w-full
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition-all
                        duration-200
                        active:scale-[0.97]
                      "
                      style={{
                        height: "48px",
                        borderRadius: "9999px",
                        background: "#1B4585",
                        color: "#F5F9FF",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "15px",
                        fontWeight: "700",
                        boxShadow: "0 4px 16px rgba(27, 69, 133, 0.3)",
                        border: "none",
                      }}
                    >
                      {t("navbar.bookAppointment")}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .nav-item-parent:hover {
          color: #1b4585 !important;
        }

        .dropdown-item:hover {
          background-color: #eaf3ff !important;
          color: #1b4585 !important;
        }

        @media (max-width: 1599px) {
          .mobile-nav-panel::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }

          .mobile-nav-panel {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        }

        @supports (max-width: 400px) {
          @media (min-width: 600px) and (max-width: 1599px) {
            .mobile-slide-panel {
              max-width: 480px !important;
            }
          }
        }
      `}</style>
    </>
  );
}