import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { useLayoutEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";

import Home from "@/Pages/Home";
import TeamPage from "@/Pages/TeamPage";
import Careers from "@/Pages/Careers";
import JobDetail from "@/Pages/job-detail";
import Apply from "@/Pages/apply";
import Auth from "@/Pages/auth";
import Profile from "@/Pages/profile";
import AboutUs from "@/Pages/AboutUs";
import ServicePage from "@/Pages/ServicePage";
import EventsPage from "@/Pages/EventsPage";
import ArticlePage from "@/Pages/ArticlePage";
import CandidatePortalPage from "@/Pages/CandidatePortal";
import AdminApp from "@/admin/AdminApp";
import NotFound from "@/Pages/Not-Found";
import CareersRegister from "@/Pages/CareersRegister";
import CareersVerify from "@/Pages/CareersVerify";
import PartnerPage from "@/Pages/PartnerPage";

import RelationshipArticlePage from "@/Pages/RelationshipArticlePage";
import ParentingArticlePage from "@/Pages/ParentingArticlePage";
import GriefArticlePage from "@/Pages/GriefArticlePage";
import MentalArticlePage from "@/Pages/MentalArticlePage";

import { CandidateAuthProvider } from "@/context/CandidateAuthContext";
import { AppointmentProvider, useAppointment } from "@/context/AppointmentContext";
import { Navbar } from "@/components/Layout/Navbar";
import { AppointmentModal } from "@/components/modals/AppointmentModal";
import  WhatWeDoPage  from "@/Pages/WhatWeDoPage";
import SubServicePage from "./Pages/SubServicePage";
import SubServiceDetailPage from "./Pages/SubServices/SubServiceDetailPage";
import AnxietyArticlePage from "./Pages/GroundingTechniques";
import Volunteer from "./Pages/Volunteer";
import { VolunteerRegistrationModal } from "./components/modals/VolunteerRegistrationModal";

import Familysupport from "./Pages/SubServices/SubFamilysupport";
import Marital from "./Pages/SubServices/SubMarital";
import PreSchool from "./Pages/SubServices/SubPreschool";
import Youth from "./Pages/SubServices/SubYouth";
import Adult from "./Pages/SubServices/SubAdult";

import ClinicalSupervision from "./Pages/SubServices/SubClinicalSupervision";
import PersonalTherapy from "./Pages/SubServices/SubPersonaltherapy";
import FamilyParenting from "./Pages/SubServices/SubFamilyParenting";

import Schooloutreach from "./Pages/SubServices/SubSchooloutreach";
import Workplace from "./Pages/SubServices/SubWorkplace";
import Community from "./Pages/SubServices/SubCommunity";
import Skill from "./Pages/SubServices/SubSkill";
import UnsubscribeConfirm from "./Pages/UnsubscribeConfirm";
import UnsubscribeSuccess from "./Pages/UnsubscribeSuccess";
import PrivacyPolicy from "@/Pages/PrivacyPolicy";
import TermsAndConditions from "@/Pages/TermsAndConditions";
import { scrollToPageContentSection } from "@/lib/scrollToSection";
import { CandidateAuthModal } from "@/components/modals/CandidateAuthModal";

import ContentProtection from "@/components/ContentProtection";


/* ---------------- Scroll To Top ---------------- */
function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    if (location === "/") return;

    const hash = window.location.hash.replace("#", "");
    if (
      location === "/services" &&
      ["counselling", "supervision", "training"].includes(hash)
    ) {
      return;
    }

    if (!scrollToPageContentSection(location)) {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return null;
}

/* ---------------- Shared Navbar ---------------- */
function SharedNavbar() {
  const [location] = useLocation();

  const isInterviewBooking = location.startsWith("/candidate/interview-booking/");
  const hidden =
    location.startsWith("/admin") ||
    location.startsWith("/unsubscribe") ||
    ((location === "/candidate" || location.startsWith("/candidate/")) && !isInterviewBooking);

  if (hidden) return null;

  return <Navbar />;
}

function VolunteerFormPage() {
  const [, navigate] = useLocation();

  return (
    <VolunteerRegistrationModal
      isOpen
      onClose={() => navigate("/volunteer")}
    />
  );
}

/* ---------------- React Query Client ---------------- */
/* ---------------- Router ---------------- */
function Router() {
  return (
    <Switch>
      <Route path={/^\/admin(?:\/.*)?$/} component={AdminApp} />

      <Route path="/about-us" component={AboutUs} />
      <Route path="/terms-of-service" component={TermsAndConditions} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/privacypolicy">
        <Redirect to="/privacy-policy" />
      </Route>
      <Route path="/services/sub/:id" component={SubServiceDetailPage} />
      <Route path="/services" component={ServicePage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/articles" component={ArticlePage} />
      <Route path="/article/:slug" component={AnxietyArticlePage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/partners" component={PartnerPage} />
      <Route path="/career/apply/:id" component={Apply} />
      <Route path="/career/register" component={CareersRegister} />
      <Route path="/career/verify" component={CareersVerify} />
      <Route path="/career" component={Careers} />
      <Route path="/career/:id" component={JobDetail} />
      {/* Legacy redirects — keep old /careers/* URLs working */}
      <Route path="/careers/apply/:id" component={Apply} />
      <Route path="/careers/register" component={CareersRegister} />
      <Route path="/careers/verify" component={CareersVerify} />
      <Route path="/careers" component={Careers} />
      <Route path="/careers/:id" component={JobDetail} />
      <Route path="/apply/:id" component={Apply} />
      <Route path="/auth" component={Auth} />
      <Route path="/profile" component={Profile} />
      <Route path="/candidate/interview-booking/:applicationId" component={CandidatePortalPage} />
      <Route path="/candidate" component={CandidatePortalPage} />
      <Route path="/candidate-portal">
        <Redirect to="/candidate" />
      </Route>
      <Route path="/support/:slug" component={WhatWeDoPage} />
      <Route path="/StressAnxiety">
        <Redirect to="/support/stress-anxiety" />
      </Route>
      <Route path="/SubService" component={SubServicePage} />
      <Route path="/SubServicePage">
        <Redirect to="/SubService" />
      </Route>
      <Route path="/GroundingTechniques" component={AnxietyArticlePage} />
      <Route path="/RelationshipArticlePage" component={RelationshipArticlePage} />
      <Route path="/ParentingArticlePage" component={ParentingArticlePage} />
      <Route path="/GriefArticlePage" component={GriefArticlePage} />
      <Route path="/MentalArticlePage" component={MentalArticlePage} />
      <Route path="/volunteer" component={Volunteer} />
      <Route path="/volunteerform" component={VolunteerFormPage} />
      <Route path="/unsubscribe/success" component={UnsubscribeSuccess} />
      <Route path="/unsubscribe/:token" component={UnsubscribeConfirm} />

      {/* Subservices */}

      <Route path="/Familysupport" component={Familysupport} />
      <Route path="/FamilyParenting" component={FamilyParenting} />
      <Route path="/SubPersonaltherapy">
        <Redirect to="/Personaltherapy" />
      </Route>
<Route path="/Marital" component={Marital} />
<Route path="/Pre-school" component={PreSchool} />
<Route path="/Youth" component={Youth} />
<Route path="/Adult" component={Adult} />

<Route path="/Schooloutreach" component={Schooloutreach} />
<Route path="/Workplace" component={Workplace} />
<Route path="/Community" component={Community} />
<Route path="/Skill" component={Skill} />
<Route path="/Clinicalsupervision" component={ClinicalSupervision}/>
<Route path="/Personaltherapy" component={PersonalTherapy}/>


      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ModalContainer() {
  const { isModalOpen, closeModal, preSelectedService } = useAppointment();
  return (
    <AppointmentModal
      isOpen={isModalOpen}
      onClose={closeModal}
      preSelectedService={preSelectedService}
    />
  );
}

/* ---------------- App Root ---------------- */
export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CandidateAuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppointmentProvider>

                <div className="page-wrapper">
                  <ContentProtection />

                <ScrollToTop />
                <SharedNavbar />
                <Router />
                </div>

                <ModalContainer />
                <CandidateAuthModal />

              </AppointmentProvider>
            </WouterRouter>

              <Toaster />
          </CandidateAuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
