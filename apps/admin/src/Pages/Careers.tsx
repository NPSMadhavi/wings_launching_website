import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SiteCheckIcon } from "@/components/ui/SiteIcons";

import { Navbar } from "@/components/Layout/Navbar";
import { Footer } from "@/components/Layout/Footer";
import { careersApplyPath } from "@/lib/careers-routes";
import type { JobPosting } from "@/lib/careers-types";
import { useAuth } from "@/hooks/use-auth";
import { useCandidateAuth } from "@/context/CandidateAuthContext";
import { scrollToPageContentSection } from "@/lib/scrollToSection";
import SEO from "@/components/SEO";

const whyWorkIcons = [
  <svg key="purpose" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M16 3.23C16.71 2.41 17.61 2 18.7 2C19.61 2 20.37 2.33 21 3C21.63 3.67 21.96 4.43 22 5.3C22 6 21.67 6.81 21 7.76C20.33 8.71 19.68 9.5 19.03 10.15C18.38 10.79 17.37 11.74 16 13C14.61 11.74 13.59 10.79 12.94 10.15C11.965 9.19 11.63 8.71 10.97 7.76C10.31 6.81 10 6 10 5.3C10 4.39 10.32 3.63 10.97 3C11.62 2.37 12.4 2.04 13.31 2C14.38 2 15.27 2.41 16 3.23ZM22 19V20L14 22.5L7 20.56V22H1V11H8.97L15.13 13.3C15.6789 13.5071 16.1518 13.8763 16.4858 14.3585C16.8198 14.8408 16.9992 15.4133 17 16H19C20.66 16 22 17.34 22 19ZM5 20V13H3V20H5ZM19.9 18.57C19.74 18.24 19.39 18 19 18H13.65C13.11 18 12.58 17.92 12.07 17.75L9.69 16.96L10.32 15.06L12.7 15.85C13 15.95 15 16 15 16C15 15.63 14.77 15.3 14.43 15.17L8.61 13H7V18.5L13.97 20.41L19.9 18.57Z" fill="#0D4A7A" />
  </svg>,
  <svg key="supportive" xmlns="http://www.w3.org/2000/svg" width="24" height="15" viewBox="0 0 24 15" fill="none">
    <path d="M12 0C12.9283 0 13.8185 0.368749 14.4749 1.02513C15.1313 1.6815 15.5 2.57174 15.5 3.5C15.5 4.42826 15.1313 5.3185 14.4749 5.97487C13.8185 6.63125 12.9283 7 12 7C11.0717 7 10.1815 6.63125 9.52513 5.97487C8.86875 5.3185 8.5 4.42826 8.5 3.5C8.5 2.57174 8.86875 1.6815 9.52513 1.02513C10.1815 0.368749 11.0717 0 12 0ZM5 2.5C5.56 2.5 6.08 2.65 6.53 2.92C6.38 4.35 6.8 5.77 7.66 6.88C7.16 7.84 6.16 8.5 5 8.5C4.20435 8.5 3.44129 8.18393 2.87868 7.62132C2.31607 7.05871 2 6.29565 2 5.5C2 4.70435 2.31607 3.94129 2.87868 3.37868C3.44129 2.81607 4.20435 2.5 5 2.5ZM19 2.5C19.7956 2.5 20.5587 2.81607 21.1213 3.37868C21.6839 3.94129 22 4.70435 22 5.5C22 6.29565 21.6839 7.05871 21.1213 7.62132C20.5587 8.18393 19.7956 8.5 19 8.5C17.84 8.5 16.84 7.84 16.34 6.88C17.2115 5.75423 17.6161 4.33616 17.47 2.92C17.92 2.65 18.44 2.5 19 2.5ZM5.5 12.75C5.5 10.68 8.41 9 12 9C15.59 9 18.5 10.68 18.5 12.75V14.5H5.5V12.75ZM0 14.5V13C0 11.61 1.89 10.44 4.45 10.1C3.86 10.78 3.5 11.72 3.5 12.75V14.5H0ZM24 14.5H20.5V12.75C20.5 11.72 20.14 10.78 19.55 10.1C22.11 10.44 24 11.61 24 13V14.5Z" fill="#0D4A7A" />
  </svg>,
  <svg key="growth" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M17 4C16.7348 4 16.4804 3.89464 16.2929 3.70711C16.1054 3.51957 16 3.26522 16 3C16 2.73478 16.1054 2.48043 16.2929 2.29289C16.4804 2.10536 16.7348 2 17 2H21C21.2652 2 21.5196 2.10536 21.7071 2.29289C21.8946 2.48043 22 2.73478 22 3V7C22 7.26522 21.8946 7.51957 21.7071 7.70711C21.5196 7.89464 21.2652 8 21 8C20.7348 8 20.4804 7.89464 20.2929 7.70711C20.1054 7.51957 20 7.26522 20 7V5.414L14.207 11.207C14.0195 11.3945 13.7652 11.4998 13.5 11.4998C13.2348 11.4998 12.9805 11.3945 12.793 11.207L10 8.414L4.707 13.707C4.5184 13.8892 4.2658 13.99 4.0036 13.9877C3.7414 13.9854 3.49059 13.8802 3.30518 13.6948C3.11977 13.5094 3.0146 13.2586 3.01233 12.9964C3.01005 12.7342 3.11084 12.4816 3.293 12.293L9.293 6.293C9.48053 6.10553 9.73484 6.00021 10 6.00021C10.2652 6.00021 10.5195 6.10553 10.707 6.293L13.5 9.086L18.586 4H17ZM5 18V21C5 21.2652 4.89464 21.5196 4.70711 21.7071C4.51957 21.8946 4.26522 22 4 22C3.73478 22 3.48043 21.8946 3.29289 21.7071C3.10536 21.5196 3 21.2652 3 21V18C3 17.7348 3.10536 17.4804 3.29289 17.2929C3.48043 17.1054 3.73478 17 4 17C4.26522 17 4.51957 17.1054 4.70711 17.2929C4.89464 17.4804 5 17.7348 5 18ZM10 14C10 13.7348 9.89464 13.4804 9.70711 13.2929C9.51957 13.1054 9.26522 13 9 13C8.73478 13 8.48043 13.1054 8.29289 13.2929C8.10536 13.4804 8 13.7348 8 14V21C8 21.2652 8.10536 21.5196 8.29289 21.7071C8.48043 21.8946 8.73478 22 9 22C9.26522 22 9.51957 21.8946 9.70711 21.7071C9.89464 21.5196 10 21.2652 10 21V14ZM14 15C14.2652 15 14.5196 15.1054 14.7071 15.2929C14.8946 15.4804 15 15.7348 15 16V21C15 21.2652 14.8946 21.5196 14.7071 21.7071C14.5196 21.8946 14.2652 22 14 22C13.7348 22 13.4804 21.8946 13.2929 21.7071C13.1054 21.5196 13 21.2652 13 21V16C13 15.7348 13.1054 15.4804 13.2929 15.2929C13.4804 15.1054 13.7348 15 14 15ZM20 11C20 10.7348 19.8946 10.4804 19.7071 10.2929C19.5196 10.1054 19.2652 10 19 10C18.7348 10 18.4804 10.1054 18.2929 10.2929C18.1054 10.4804 18 10.7348 18 11V21C18 21.2652 18.1054 21.5196 18.2929 21.7071C18.4804 21.8946 18.7348 22 19 22C19.2652 22 19.5196 21.8946 19.7071 21.7071C19.8946 21.5196 20 21.2652 20 21V11Z" fill="#0D4A7A" />
  </svg>,
  <svg key="inclusive" xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6" fill="none" className="scale-[3]">
    <path d="M5.5075 2.9125C6.1575 2.2425 6.1575 1.1725 5.5075 0.5025C4.8475 -0.1675 3.8175 -0.1675 3.1675 0.5025L2.9975 0.6725L2.8275 0.5025C2.1775 -0.1675 1.1375 -0.1675 0.4875 0.5025C-0.1625 1.1825 -0.1625 2.2425 0.4875 2.9125L2.9975 5.4925L5.5075 2.9125Z" fill="#0D4A7A" />
  </svg>,
];

export default function Careers() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];

  useEffect(() => {
    scrollToPageContentSection("/career");
  }, []);

  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useCandidateAuth();

  const whyWorkCardsRaw = t("careers.whyWork.cards", { returnObjects: true });
  const whyWorkCards = Array.isArray(whyWorkCardsRaw) ? whyWorkCardsRaw : [];

  const { data: jobs, isLoading: jobsLoading } = useQuery<JobPosting[]>({
    queryKey: [`/api/jobs?active=true&lang=${encodeURIComponent(lang)}`],
  });

  // Fetch this candidate's applications to show per-job "Already Applied" badges
  const { data: myApplications } = useQuery<{ jobRef?: string | null }[]>({
    queryKey: ["/api/candidate/applications"],
    enabled: isAuthenticated,
  });

  const appliedJobRefs = new Set(
    (myApplications || [])
      .map((application) => application.jobRef)
      .filter((jobRef): jobRef is string => Boolean(jobRef))
  );

  const hasAppliedToJob = (job: JobPosting) =>
    isAuthenticated && appliedJobRefs.has(job.jobId);

  const jobsByDepartment =
    jobs?.reduce((acc, job) => {
      const department = job.department || "General";
      if (!acc[department]) acc[department] = [];
      acc[department].push(job);
      return acc;
    }, {} as Record<string, JobPosting[]>) || {};

  const departmentsWithJobs = Object.entries(jobsByDepartment).map(
    ([department, departmentJobs]) => ({ department, jobs: departmentJobs as JobPosting[] })
  );

  return (
    <div className="min-h-screen bg-[#FAFAF5] overflow-x-hidden font-sans">
      <SEO
        title="Careers & Opportunities | WINGS Counselling Centre"
        description="Explore career opportunities at WINGS Counselling Centre and join our dedicated team of counsellors, therapists, and mental health professionals."
        path="/career"
        ogImage="/assets/careersection.png"
      />
      <Navbar />

      {/* Hero */}
      <section
        className="relative w-full flex flex-col items-center justify-center overflow-hidden shrink-0"
        style={{
          background:
            'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.72)), url("/assets/careersection.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "480px",
          height: "clamp(480px, 55vw, 790px)",
        }}
      >
        {/* Content */}
        <div className="relative z-10 w-full h-full navbar-align-outer">
          <motion.div
            className="
              navbar-align-inner
              h-full
              flex
              flex-col
              items-center
              justify-center
              text-center
            "
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: "easeOut",
            }}
          >
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="
                text-white
                font-['Outfit']
                font-semibold
                text-center
                mb-6
                md:pt-[80px]
                text-[32px] sm:text-[44px] md:text-[45px] lg:text-[60px]
                leading-[1.15]
              "
              style={{
                maxWidth: "850px",
              }}
            >
              {t("careers.hero.title")}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="
                text-white
                text-center
                font-['DM_Sans']
                font-normal
                text-[16px]
                sm:text-[18px]
                md:text-[20px]
                leading-[1.6]
                mb-10
              "
              style={{
                maxWidth: "760px",
              }}
            >
              {t("careers.hero.description")}
            </motion.p>

            {/* Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                document
                  .getElementById("open-positions")
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
              }}
              className="
                inline-flex
                items-center
                justify-center
                gap-[10px]
                border-none
                cursor-pointer
                rounded-full
                bg-[#1B4585]
                px-[32px]
                py-[16px]
                transition-all
                duration-300
              "
              style={{
                boxShadow: "0 8px 24px rgba(27,69,133,0.35)",
              }}
            >
              <span
                className="
                  text-center
                  font-['Plus_Jakarta_Sans']
                  text-[16px]
                  md:text-[18px]
                  font-semibold
                  leading-[28px]
                  text-[#F5F9FF]
                "
              >
                {t("careers.hero.button")}
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
          </motion.div>
        </div>
      </section>

      {/* Job listings */}
      <section
        id="open-positions"
        className="w-full pt-[70px] pb-[80px] bg-[#F7F7F5]"
      >
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-12">

              {/* Left */}
              <div>
                <h2
                  className="
                    text-[#0D4A7A]
                    font-['Outfit']
                    text-[28px]
                    md:text-[35px]
                    font-medium
                    leading-normal
                    mb-3
                  "
                >
                  {t("careers.jobs.title")}
                </h2>

                <p
                  className="
                    text-[#0D4A7A]
                    font-['DM_Sans']
                    text-[16px]
                    md:text-[20px]
                    font-medium
                    leading-normal
                  "
                >
                  {t("careers.jobs.description")}
                </p>
              </div>

             
            </div>

            {/* Loading */}
            {jobsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="
                      w-full
                      rounded-[20px]
                      bg-white
                      shadow-[0_4px_4px_rgba(0,0,0,0.10)]
                      p-8
                      animate-pulse
                    "
                  >
                    <div className="h-5 w-[180px] bg-gray-200 rounded-full mb-5" />
                    <div className="h-8 w-[280px] bg-gray-200 rounded mb-4" />
                    <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-[80%] bg-gray-200 rounded mb-6" />

                    <div className="flex gap-4">
                      <div className="h-5 w-[120px] bg-gray-200 rounded" />
                      <div className="h-5 w-[120px] bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : departmentsWithJobs.length > 0 ? (

              <div className="flex flex-col gap-6">

                {departmentsWithJobs.flatMap((section) =>
                  section.jobs.map((job, index) => (

                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.08,
                      }}
                      className="
                        w-full
                        rounded-[20px]
                        bg-white
                        shadow-[0_4px_4px_rgba(0,0,0,0.10)]
                        px-6
                        md:px-8
                        py-7
                        flex
                        flex-col
                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                        gap-8
                        hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)]
                        transition-all
                        duration-300
                      "
                    >

                      {/* Left Content */}
                      <div className="flex-1">

                        {/* Job ID */}
                        <div
                          className="
                            inline-flex
                            items-center
                            justify-center
                            px-[16px]
                            py-[6px]
                            rounded-full
                            border
                            border-[#1E3A8A]
                            mb-5
                          "
                        >
                          <span
                            className="
                              text-[#1E3A8A]
                              text-center
                              font-['DM_Sans']
                              text-[12px]
                              md:text-[14px]
                              font-medium
                              leading-[16px]
                            "
                          >
                            {job.jobId}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          className="
                            text-black
                            font-['DM_Sans']
                            text-[24px]
                            md:text-[22px]
                            font-medium
                            leading-normal
                            mb-4
                          "
                        >
                          {job.title}
                        </h3>

                        {/* Description */}
                        <p
                          className="
                            text-black
                            font-['DM_Sans']
                            text-[15px]
                            md:text-[18px]
                            font-normal
                            leading-[1.6]
                            max-w-[1100px]
                            mb-6
                          "
                        >
                          {job.description}
                        </p>

                        {/* Bottom Meta */}
                        <div className="flex flex-wrap items-center gap-6">

                          {/* Location */}
                          <div className="flex items-center gap-2">

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="13"
                              height="19"
                              viewBox="0 0 13 19"
                              fill="none"
                            >
                              <path
                                d="M6.41667 8.70833C5.80888 8.70833 5.22598 8.46689 4.79621 8.03712C4.36644 7.60735 4.125 7.02445 4.125 6.41667C4.125 5.80888 4.36644 5.22598 4.79621 4.79621C5.22598 4.36644 5.80888 4.125 6.41667 4.125C7.02445 4.125 7.60735 4.36644 8.03712 4.79621C8.46689 5.22598 8.70833 5.80888 8.70833 6.41667C8.70833 6.71761 8.64906 7.01561 8.53389 7.29365C8.41872 7.57169 8.24992 7.82432 8.03712 8.03712C7.82432 8.24992 7.57169 8.41872 7.29365 8.53389C7.01561 8.64906 6.71761 8.70833 6.41667 8.70833ZM6.41667 0C4.71486 0 3.08276 0.67604 1.8794 1.8794C0.67604 3.08276 0 4.71486 0 6.41667C0 11.2292 6.41667 18.3333 6.41667 18.3333C6.41667 18.3333 12.8333 11.2292 12.8333 6.41667C12.8333 4.71486 12.1573 3.08276 10.9539 1.8794C9.75058 0.67604 8.11847 0 6.41667 0Z"
                                fill="#0D4A7A"
                              />
                            </svg>

                            <span
                              className="
                                text-[#0D4A7A]
                                font-['DM_Sans']
                                text-[15px]
                                md:text-[16px]
                                font-normal
                              "
                            >
                              {job.location}
                            </span>
                          </div>

                          {/* Experience */}
                          <div className="flex items-center gap-2">

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="22"
                              height="22"
                              viewBox="0 0 22 22"
                              fill="none"
                            >
                              <path
                                d="M11.0007 1.83337C16.0634 1.83337 20.1673 5.93729 20.1673 11C20.1673 16.0628 16.0634 20.1667 11.0007 20.1667C5.9379 20.1667 1.83398 16.0628 1.83398 11C1.83398 5.93729 5.9379 1.83337 11.0007 1.83337ZM11.9173 11V6.41671C11.9173 6.17359 11.8207 5.94043 11.6488 5.76853C11.4769 5.59662 11.2438 5.50004 11.0007 5.50004C10.7575 5.50004 10.5244 5.59662 10.3525 5.76853C10.1806 5.94043 10.084 6.17359 10.084 6.41671V11C10.084 11.2432 10.1806 11.4763 10.3525 11.6482L13.1026 14.3981C13.2826 14.5782 13.5267 14.6793 13.7813 14.6793C14.0359 14.6793 14.28 14.5782 14.46 14.3981C14.64 14.2181 14.7412 13.974 14.7412 13.7194C14.7412 13.4648 14.64 13.2207 14.46 13.0406L11.9173 10.4979V11Z"
                                fill="#0D4A7A"
                              />
                            </svg>

                            <span
                              className="
                                text-[#0D4A7A]
                                font-['DM_Sans']
                                text-[15px]
                                md:text-[16px]
                                font-normal
                              "
                            >
                              {job.employmentType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Buttons */}
                      <div className="flex flex-col gap-3 w-full lg:w-[175px] xl:w-[185px] shrink-0 justify-center">

                        {/* View Details */}
                        <Link href={`/career/${job.jobId}`} className="w-full flex">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="
                              flex
                              items-center
                              justify-center
                              gap-1.5
                              w-full
                              min-h-[45px]
                              py-2
                              px-4
                              rounded-full
                              border
                              border-[#0D4A7A]
                              bg-white
                              group
                              transition-all
                              duration-300
                            "
                          >

                            <span
                              className="
                                text-[#0D4A7A]
                                text-center
                                font-['DM_Sans']
                                text-[12px]
                                sm:text-[13px]
                                md:text-[14px]
                                font-medium
                                leading-[1.25]
                                break-words
                                line-clamp-2
                                transition-all
                              "
                            >
                              {t("careers.jobs.viewDetails")}
                            </span>
                          </motion.button>
                        </Link>

                        {hasAppliedToJob(job) ? (
                          <div
                            className="
                              flex
                              items-center
                              justify-center
                              gap-1.5
                              w-full
                              min-h-[45px]
                              py-2
                              px-4
                              rounded-full
                              bg-green-100
                              text-green-700
                              font-semibold
                              font-['DM_Sans']
                              text-[12px]
                              sm:text-[13px]
                              md:text-[14px]
                              leading-[1.25]
                            "
                          >
                            <SiteCheckIcon size={16} color="#15803d" className="shrink-0" />
                            <span className="break-words line-clamp-2">{t("careers.jobs.alreadyApplied")}</span>
                          </div>
                        ) : (
                          <Link
                            href={isAuthenticated ? careersApplyPath(job.jobId) : "#"}
                            className="w-full flex"
                            onClick={(e) => {
                              if (!isAuthenticated) {
                                e.preventDefault();
                                openAuthModal(careersApplyPath(job.jobId));
                              } else {
                                sessionStorage.setItem("careerApplyStage", "form");
                                sessionStorage.setItem("returnTo", careersApplyPath(job.jobId));
                              }
                            }}
                          >
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="
                                flex
                                items-center
                                justify-center
                                gap-1.5
                                w-full
                                min-h-[45px]
                                py-2
                                px-4
                                rounded-full
                                bg-[#0D4A7A]
                                transition-all
                                duration-300
                              "
                            >
                              <span
                                className="
                                  text-[#F5F9FF]
                                  text-center
                                  font-['DM_Sans']
                                  text-[12px]
                                  sm:text-[13px]
                                  md:text-[14px]
                                  font-medium
                                  leading-[1.25]
                                  break-words
                                  line-clamp-2
                                "
                              >
                                {t("careers.jobs.applyNow")}
                              </span>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="shrink-0"
                              >
                                <path
                                  d="M9 18L15 12L9 6"
                                  stroke="white"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </motion.button>
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <h3 className="text-2xl font-semibold text-[#0D4A7A] mb-3">
                  {t("careers.jobs.noOpenPositions.title")}
                </h3>

                <p className="text-gray-600 font-['DM_Sans']">
                  {t("careers.jobs.noOpenPositions.description")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Work With WINGS Section */}
      <section
        className="w-full pt-[70px] pb-[85px]"
        style={{ background: "#DDE4EA" }}
      >
        <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner">
            <div className="flex flex-col items-center text-center mb-[58px]">
              <h2
                className="
                  text-[#0D4A7A]
                  font-['Outfit']
                  font-[500]
                  text-[34px]
                  sm:text-[42px]
                  md:text-[54px]
                  leading-[1.1]
                  mb-5
                "
              >
                {t("careers.whyWork.title")}
              </h2>

              <p
                className="
                  text-black
                  font-['DM_Sans']
                  text-[16px]
                  md:text-[20px]
                  font-[400]
                  leading-[1.5]
                  max-w-[760px]
                "
              >
                {t("careers.whyWork.description")}
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-4
                gap-[18px]
              "
            >
              {whyWorkCards.map((card, index) => (
                <div
                  key={index}
                  className="
                    bg-white
                    rounded-[12px]
                    px-[18px]
                    py-[20px]
                    min-h-[205px]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                  "
                >
                  <div
                    className="
                      w-[42px]
                      h-[42px]
                      rounded-[10px]
                      flex
                      items-center
                      justify-center
                      mb-5
                    "
                    style={{
                      background: "#EAF2FB",
                    }}
                  >
                    {whyWorkIcons[index]}
                  </div>

                  <h3
                    className="
                      text-black
                      font-['DM_Sans']
                      text-[20px]
                      font-[700]
                      leading-normal
                      mb-4
                    "
                  >
                    {card.title}
                  </h3>

                  <p
                    className="
                      text-black/70
                      font-['DM_Sans']
                      text-[16px]
                      font-[400]
                      leading-[1.55]
                    "
                  >
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}