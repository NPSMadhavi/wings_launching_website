import { Hero } from "../components/Section/Hero";
import { WhatWeDo } from "../components/Section/WhatWeDo";
import { About } from "../components/Section/About";
import { Howtouse } from "../components/Section/Howtouse";
import { Services } from "../components/Section/Services";
import { OurTeam } from "../components/Section/OurTeam";
import { Needhelp } from "../components/Section/Needhelp";
import { Upcoming } from "../components/Section/Upcoming";
import { Footer } from "../components/Layout/Footer";
import { CursorGlow } from "../components/Layout/CursorGlow";
import { LogoIntro } from "../components/ui/LogoIntro";
import { useState, useLayoutEffect } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { scrollToContactWithRetry, scrollToPartnersWithRetry } from "@/lib/scrollToSection";
import { Partners } from "../components/Section/Partner";
import SEO from "@/components/SEO";

export default function Home() {
  // Skip intro if arriving via hash link (e.g., /#contact) or when
  // a navigation explicitly requested skipping the intro.
  const [showIntro, setShowIntro] = useState(() => {
    try {
      const hasPlayed = !!sessionStorage.getItem("hasPlayedIntro");
      const hasHash = !!window.location.hash;
      const skipFlag = !!sessionStorage.getItem("skipLogoIntro");

      if (skipFlag) sessionStorage.removeItem("skipLogoIntro");

      // Don't show if played before, or if arriving via hash/skip flag
      return !(hasPlayed || hasHash || skipFlag);
    } catch (err) {
      return !window.location.hash;
    }
  });

  const handleIntroComplete = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem("hasPlayedIntro", "1");
    } catch (err) { }
  };

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    try {
      if (sessionStorage.getItem("scrollToHero")) {
        sessionStorage.removeItem("scrollToHero");
        window.history.replaceState(null, "", "/");
        window.scrollTo(0, 0);
        return;
      }

      if (sessionStorage.getItem("scrollToContact")) {
        sessionStorage.removeItem("scrollToContact");
        scrollToContactWithRetry();
        return;
      }

      if (sessionStorage.getItem("scrollToIssues")) {
        sessionStorage.removeItem("scrollToIssues");
        const attempt = () => {
          const el = document.getElementById("issues");
          if (!el) return false;
          const top = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
          return true;
        };
        if (!attempt()) {
          setTimeout(attempt, 100);
          setTimeout(attempt, 350);
          return;
        }
        setTimeout(attempt, 100);
        setTimeout(attempt, 350);
        return;
      }

      if (sessionStorage.getItem("scrollToPartners")) {
        sessionStorage.removeItem("scrollToPartners");
        scrollToPartnersWithRetry();
        return;
      }

      if (window.location.hash) {
        window.history.replaceState(null, "", "/");
      }
      window.scrollTo(0, 0);
    } catch {
      window.scrollTo(0, 0);
    }

    return () => {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "auto";
      }
    };
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      <SEO
        title="WINGS Counselling Centre | Professional Counselling & Therapy Services"
        description="WINGS Counselling Centre provides compassionate, professional counselling, individual & family therapy, youth support, and clinical supervision in Singapore."
        path="/"
        ogImage="/assets/wingsLogo.png"
      />
      {showIntro && <LogoIntro onComplete={handleIntroComplete} />}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary"
      >
        {/* Scroll Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-primary z-[10001] origin-left"
          style={{ scaleX, backgroundColor: "#1B4585" }}
        />

        <CursorGlow />

        <div className="relative z-[2]">
          <main className="flex flex-col">
            <Hero />
            <Partners />
            <WhatWeDo />
            <About />
            <Howtouse />
            <Services />
            <OurTeam />
            <Needhelp />
            <Upcoming />
            
            <Footer />
          </main>
        </div>
      </motion.div>
    </>
  );
}
