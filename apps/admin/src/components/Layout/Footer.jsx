import { useState, useEffect } from "react";
import { FaInstagram, FaFacebookF, FaYoutube } from "react-icons/fa";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { scrollToContactWithRetry } from "@/lib/scrollToSection";

const FALLBACK_SOCIAL = [
  {
    name: "Instagram",
    icon: null,
    link: "https://www.instagram.com/wingscounselling",
    FaIcon: FaInstagram,
  },
  {
    name: "Facebook",
    icon: null,
    link: "https://www.facebook.com/wingscounselling",
    FaIcon: FaFacebookF,
  },
  {
    name: "YouTube",
    icon: null,
    link: "https://www.youtube.com/@wingscounselling",
    FaIcon: FaYoutube,
  },
];

export function Footer() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | duplicate | error | privacy
  const [socialLinks, setSocialLinks] = useState(FALLBACK_SOCIAL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/social-media");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setSocialLinks(
          data.map((item) => ({
            name: item.name || "Social",
            icon: item.icon || null,
            link: item.link || "#",
            FaIcon: null,
          }))
        );
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStayConnected = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!acceptedPrivacy) {
      setStatus("privacy");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/notify/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: "all" }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 || data.alreadySubscribed) {
        setStatus("duplicate");
        return;
      }
      if (!res.ok) throw new Error();

      setStatus("success");
      setEmail("");
      setFullName("");
      setAcceptedPrivacy(false);
    } catch {
      setStatus("error");
    }
  };

  const goToHomeHero = (e) => {
    e.preventDefault();

    try {
      sessionStorage.setItem("skipLogoIntro", "1");
    } catch {
      // ignore
    }

    const scrollToHero = () => {
      window.history.replaceState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (location === "/") {
      scrollToHero();
      return;
    }

    try {
      sessionStorage.setItem("scrollToHero", "1");
    } catch {
      // ignore
    }

    navigate("/");
  };

  const goToContact = (e) => {
    e.preventDefault();

    try {
      sessionStorage.setItem("skipLogoIntro", "1");
    } catch {
      // ignore
    }

    if (location === "/") {
      scrollToContactWithRetry();
      return;
    }

    try {
      sessionStorage.setItem("scrollToContact", "1");
    } catch {
      // ignore
    }

    navigate("/");
  };
  const goToPage = (path) => (e) => {
  e.preventDefault();

  try {
    sessionStorage.setItem("skipLogoIntro", "1");
  } catch {
    // ignore
  }

  if (location === path) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  navigate(path);
};

  return (
    <footer className="w-full bg-[#1F2937] overflow-x-hidden">

      {/* Container — aligned with Navbar */}
      <div className="navbar-align-outer pt-10 sm:pt-[60px] pb-6 sm:pb-[30px]">
        <div className="navbar-align-inner w-full min-w-0">

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-16 mb-8 sm:mb-[50px] items-start w-full min-w-0">

            {/* COLUMN 1 */}
            <div className="flex flex-col gap-6 min-w-0 w-full">

              {/* Logo */}
              <Link href="/">
                <div
                  className="
                    w-full
                    max-w-[min(291px,100%)]
                    rounded-[12px]
                    bg-white
                    flex items-center justify-center
                    p-3
                    cursor-pointer
                    hover:opacity-90
                    transition
                  "
                >
                  <img
                    src="/assets/wingsLogo.png"
                    alt="WINGS Logo"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </Link>

              {/* Description */}
              <p className="text-white/90 text-[clamp(0.9375rem,2.5vw,1.125rem)] leading-relaxed sm:leading-[28px] max-w-full break-words">
                {t("footer.description")}
              </p>

              {/* Social Icons */}
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((item, index) => (
                  <a
                    key={`${item.name}-${index}`}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.name || `Social link ${index + 1}`}
                    className="
                      w-[44px] h-[44px]
                      shrink-0
                      rounded-full
                      bg-white/10
                      flex items-center justify-center
                      text-white text-[18px]
                      transition-all duration-300
                      hover:bg-white hover:text-[#1F2937]
                    "
                  >
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.name || ""}
                        className="w-5 h-5 object-contain"
                      />
                    ) : item.FaIcon ? (
                      <item.FaIcon />
                    ) : null}
                  </a>
                ))}
              </div>
            </div>

            {/* COLUMN 2 */}
            <div className="flex flex-col items-start md:items-center lg:items-center w-full min-w-0">

              {/* Links Container */}
              <div className="w-full max-w-[160px] flex flex-col gap-[16px]">

                {/* Heading */}
                <h3 className="text-white text-[clamp(1.25rem,4vw,1.875rem)] font-semibold mb-2">
                  {t("footer.links")}
                </h3>

                <a
                  href="/"
                  onClick={goToHomeHero}
                  className="text-white/90 text-[15px] hover:text-white transition whitespace-nowrap"
                >
                  {t("footer.home")}
                </a>

                <Link
                  href="/about-us"
                  onClick={goToPage("/about-us")}
                  className="text-white/90 text-[15px] hover:text-white transition whitespace-nowrap"
                >
                  {t("footer.about")}
                </Link>

                <Link
                  href="/services"
                  onClick={goToPage("/services")}
                  className="text-white/90 text-[15px] hover:text-white transition whitespace-nowrap"
                >
                  {t("footer.services")}
                </Link>

                <Link
                  href="/team"
                  onClick={goToPage("/team")}
                  className="text-white/90 text-[15px] hover:text-white transition whitespace-nowrap"
                >
                  {t("footer.team")}
                </Link>

                <Link
                  href="/events"
                  onClick={goToPage("/events")}
                  className="text-white/90 text-[15px] hover:text-white transition whitespace-nowrap"
                >
                  {t("footer.events")}
                </Link>
             <Link
                  href="/partners"
                  onClick={goToPage("/partners")}
                  className="text-white/90 text-[15px] hover:text-white transition whitespace-nowrap"
                >
                  {t("footer.partners")}
                </Link>
              <a
  href="/careers"
  target="_blank"
  rel="noopener noreferrer"
  className="text-white/90 text-[15px] hover:text-white transition whitespace-nowrap"
>
  Careers
</a>

                <a
                  href="/#contact"
                  onClick={goToContact}
                  className="text-white/90 text-[15px] hover:text-white transition whitespace-nowrap"
                >
                  {t("footer.contact")}
                </a>
               

              </div>

            </div>

            {/* COLUMN 3 */}
            <div className="flex flex-col gap-6 min-w-0 w-full">

              <h3 className="text-white text-[clamp(1.25rem,4vw,1.875rem)] font-semibold">
                {t("footer.stayConnected")}
              </h3>

              <p className="text-white/90 text-[clamp(0.9375rem,2.5vw,1.0625rem)] leading-relaxed sm:leading-[28px] max-w-full break-words">
                {t("footer.stayConnectedDescription")}
              </p>

              <form
                className="flex flex-col gap-4 w-full max-w-[min(100%,400px)]"
                onSubmit={handleStayConnected}
              >

                {/* Full Name */}
                <input
                  type="text"
                  placeholder={t("footer.fullName")}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (status !== "idle") setStatus("idle");
                  }}
                  className="
                    w-full min-w-0 h-[54px]
                    rounded-[14px]
                    border border-white/20
                    bg-white/5
                    px-5
                    text-white placeholder:text-white/60
                    outline-none
                    focus:bg-white/10
                  "
                />

                {/* Email + Button — always same row; button after email */}
                <div className="flex flex-row items-center gap-3 w-full min-w-0">

                  <input
                    type="email"
                    placeholder={t("footer.email")}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status !== "idle") setStatus("idle");
                    }}
                    required
                    disabled={status === "loading"}
                    className="
                      flex-1 min-w-0 h-[54px]
                      rounded-[14px]
                      border border-white/20
                      bg-white/5
                      px-5
                      text-white placeholder:text-white/60
                      outline-none
                      focus:bg-white/10
                      box-border
                      disabled:opacity-60
                    "
                  />

                  <button
                    type="submit"
                    aria-label="Submit email"
                    disabled={status === "loading"}
                    className="
                      w-[54px] h-[54px]
                      shrink-0
                      rounded-[14px]
                      bg-white
                      flex items-center justify-center
                      hover:scale-105 transition
                      disabled:opacity-60 disabled:hover:scale-100
                    "
                  >
                    {status === "loading" ? (
                      <span className="w-5 h-5 border-2 border-[#1B4585] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="#1B4585"
                        aria-hidden="true"
                      >
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    )}
                  </button>
                  

                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none w-full">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => {
                      setAcceptedPrivacy(e.target.checked);
                      if (status !== "idle") setStatus("idle");
                    }}
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 w-[18px] h-[18px] shrink-0 rounded-[4px] flex items-center justify-center transition-colors ${
                      acceptedPrivacy
                        ? "bg-[#2563EB] border border-[#2563EB]"
                        : "bg-transparent border border-white/50"
                    }`}
                    aria-hidden="true"
                  >
                    {acceptedPrivacy && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="text-white/90 text-[14px] leading-[1.45]">
                    <span className="block">{t("footer.privacy")}</span>
                    {/* <Link
                      href="/privacy-policy"
                      className="block underline hover:text-white/90 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      privacy policy
                    </Link> */}
                  </span>
                </label>

                {status === "success" && (
                  <p className="text-[#86EFAC] text-[14px] leading-relaxed">
                    {t("footer.success")}
                  </p>
                )}
                {status === "duplicate" && (
                  <p className="text-[#FDE047] text-[14px] leading-relaxed">
                    {t("footer.duplicate")}
                  </p>
                )}
                {status === "error" && (
                  <p className="text-[#FCA5A5] text-[14px] leading-relaxed">
                    {t("footer.error")}
                  </p>
                )}
                {status === "privacy" && (
                  <p className="text-[#FCA5A5] text-[14px] leading-relaxed">
                    {t("footer.privacyError")}
                  </p>
                )}

              </form>
            </div>

          </div>

          {/* DIVIDER */}
          <div className="w-full h-[1px] bg-white/20 mb-8" />

          {/* BOTTOM */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full min-w-0">

            <p className="text-white text-[clamp(0.8125rem,2.5vw,0.9375rem)] md:text-[14px] text-center md:text-left max-w-full break-words leading-relaxed">
              {t("footer.copyright")}{" "}
              {t("footer.poweredBy")}{" "}
              <span className="text-[#FF543E]">
                <a
                  href="https://netopsys.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline break-words"
                >
                  Netopsys Pte. Ltd, Singapore.
                </a>
              </span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 shrink-0">

              <Link
                href="/privacy-policy"
                className="text-white hover:underline transition text-[clamp(0.8125rem,2.5vw,0.9375rem)] whitespace-nowrap"
              >
              {t("footer.privacyPolicy")}
              </Link>
              <span className="text-white">|</span>
           <Link
                href="/terms-of-service"
                className="text-white hover:underline transition text-[clamp(0.8125rem,2.5vw,0.9375rem)] whitespace-nowrap"
              >
              {t("termsConditions.hero.title")}
              </Link>
              {/* <span className="text-white/40" aria-hidden="true">|</span> */}

              {/* <Link
                // href="/terms-of-service"
                className="text-white/80 hover:text-white transition text-[clamp(0.8125rem,2.5vw,0.9375rem)] whitespace-nowrap"
              >
                Terms of service
              </Link> */}

            </div>

          </div>

        </div>
      </div>

    </footer>
  );
}
