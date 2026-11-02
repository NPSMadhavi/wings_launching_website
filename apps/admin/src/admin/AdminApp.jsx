import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SEO from "@/components/SEO";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./Pages/Login";
import AdminLayout from "./components/AdminLayout";

import Dashboard from "./Pages/Dashboard";
import TeamAdmin from "./Pages/TeamAdmin";
import ArticlesAdmin from "./Pages/ArticlesAdmin";
import CareersAdmin from "./Pages/CareersAdmin";
import EventsAdmin from "./Pages/EventsAdmin";
import AppointmentsPage from "./Pages/AppointmentAdmin";
import VolunteerAdmin from "./Pages/VolunteerAdmin";
import CounsellingTypeAdmin from "./Pages/CounsellingtypeAdmin";
import PartnersAdmin from "./Pages/PartnersAdmin";
import TestimonialsAdmin from "./Pages/TestimonialsAdmin";
import SocialMediaAdmin from "./Pages/SocialMediaAdmin";
import VisitorsAdmin from "./Pages/VisitorsAdmin";
import UserManagementAdmin from "./Pages/UserManagementAdmin";
import PrimaryCcMailsAdmin from "./Pages/PrimaryCcMailsAdmin";
import NotifyMailsAdmin from "./Pages/NotifyMailsAdmin";
import EmailsAdmin from "./Pages/EmailsAdmin";

function AdminRoutes() {
  const { token, user } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!token) return;

    if (location === "/" || location === "/admin") {
      if (user && !user.isSuperAdmin && Array.isArray(user.sections) && !user.sections.includes("all")) {
        if (!user.sections.includes("dashboard")) {
          const sectionPathMap = {
            team: "/admin/team",
            articles: "/admin/articles",
            careers: "/admin/careers",
            events: "/admin/events",
            services: "/admin/counselling-types",
            appointments: "/admin/appointments",
            volunteers: "/admin/volunteers",
            partners: "/admin/partners",
            testimonials: "/admin/testimonials",
            "social-media": "/admin/social-media",
            "user-management": "/admin/user-management",
            visitors: "/admin/visitors",
            mails: "/admin/settings/primary-cc-mails",
          };
          const firstAllowed = user.sections.map((s) => sectionPathMap[s]).filter(Boolean)[0];
          if (firstAllowed && location !== firstAllowed) {
            navigate(firstAllowed);
            return;
          }
        }
      }

      if (location === "/") {
        navigate("/admin");
      }
    }
  }, [location, navigate, token, user]);

  if (!token) {
    return <Login />;
  }

  return (
    <AdminLayout>
      <Switch>

        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/team" component={TeamAdmin} />
        <Route path="/admin/articles" component={ArticlesAdmin} />
        <Route path="/admin/careers" component={CareersAdmin} />
        <Route path="/admin/events" component={EventsAdmin} />
        <Route path="/admin/appointments" component={AppointmentsPage} />
        <Route path="/admin/volunteers" component={VolunteerAdmin} />
        <Route path="/admin/counselling-types" component={CounsellingTypeAdmin} />
        <Route path="/admin/partners" component={PartnersAdmin} />
        <Route path="/admin/testimonials" component={TestimonialsAdmin} />
        <Route path="/admin/social-media" component={SocialMediaAdmin} />
        <Route path="/admin/user-management" component={UserManagementAdmin} />
        <Route path="/admin/users-management" component={UserManagementAdmin} />
        <Route path="/admin/visitors" component={VisitorsAdmin} />
        <Route path="/admin/settings/primary-cc-mails" component={PrimaryCcMailsAdmin} />
        <Route path="/admin/settings/notify-mails" component={NotifyMailsAdmin} />
        <Route path="/admin/settings/emails" component={EmailsAdmin} />

        <Route>
          {() => {
            navigate("/admin");
            return null;
          }}
        </Route>

      </Switch>
    </AdminLayout>
  );
}

/* ================= ADMIN APP ================= */
export default function AdminApp() {
  return (
    <AuthProvider>
      <>
        <SEO title="Admin Dashboard | WINGS Counselling Centre" noindex={true} />
        <AdminRoutes />

        {/* 🔥 TOAST CONTAINER ADDED HERE */}
        <ToastContainer position="top-right" autoClose={2000} />
      </>
    </AuthProvider>
  );
}