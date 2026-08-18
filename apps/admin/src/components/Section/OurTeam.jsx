import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";

export function OurTeam() {
    const { t } = useTranslation();
    const [team, setTeam] = useState([]);

    const sectionRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

    // FETCH TEAM API
    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const response = await axios.get("/api/team");

            const payload = response.data;

            const members = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload?.team)
                        ? payload.team
                        : Array.isArray(payload?.members)
                            ? payload.members
                            : [];

            setTeam(members);
        } catch (error) {
            console.error("Error fetching team:", error);
            setTeam([]);
        }
    };

    // DRAG TO SCROLL
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        let isDragging = false;
        let startX = 0;
        let scrollStart = 0;

        const onMouseDown = (e) => {
            if (e.button !== 0) return;

            isDragging = true;
            startX = e.pageX;
            scrollStart = scrollContainer.scrollLeft;
            scrollContainer.style.cursor = "grabbing";
            scrollContainer.style.userSelect = "none";
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            e.preventDefault();
            scrollContainer.scrollLeft = scrollStart - (e.pageX - startX);
        };

        const stopDragging = () => {
            if (!isDragging) return;

            isDragging = false;
            scrollContainer.style.cursor = "grab";
            scrollContainer.style.userSelect = "";
        };

        scrollContainer.addEventListener("mousedown", onMouseDown);
        scrollContainer.addEventListener("mousemove", onMouseMove);
        scrollContainer.addEventListener("mouseup", stopDragging);
        scrollContainer.addEventListener("mouseleave", stopDragging);
        document.addEventListener("mouseup", stopDragging);

        return () => {
            scrollContainer.removeEventListener("mousedown", onMouseDown);
            scrollContainer.removeEventListener("mousemove", onMouseMove);
            scrollContainer.removeEventListener("mouseup", stopDragging);
            scrollContainer.removeEventListener("mouseleave", stopDragging);
            document.removeEventListener("mouseup", stopDragging);
        };
    }, []);

    // AUTO SCROLL
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;

        if (!scrollContainer) return;

        let animationId;
        let isHovering = false;
        let scrollDirection = 1;
        let lastTimestamp = 0;

        const SCROLL_SPEED = 35;

        const autoScroll = (currentTime) => {
            if (!scrollContainer) return;

            if (!isHovering) {
                if (lastTimestamp === 0) {
                    lastTimestamp = currentTime;
                    animationId = requestAnimationFrame(autoScroll);
                    return;
                }

                const delta = Math.min(100, currentTime - lastTimestamp) / 1000;

                const scrollAmount = SCROLL_SPEED * delta;

                const atRightEdge =
                    scrollContainer.scrollLeft + scrollContainer.clientWidth >=
                    scrollContainer.scrollWidth - 20;

                const atLeftEdge = scrollContainer.scrollLeft <= 20;

                if (atRightEdge) {
                    scrollDirection = -1;
                } else if (atLeftEdge) {
                    scrollDirection = 1;
                }

                scrollContainer.scrollLeft += scrollDirection * scrollAmount;
            }

            lastTimestamp = currentTime;

            animationId = requestAnimationFrame(autoScroll);
        };

        const handleMouseEnter = () => {
            isHovering = true;
        };

        const handleMouseLeave = () => {
            isHovering = false;
            lastTimestamp = 0;
        };

        animationId = requestAnimationFrame(autoScroll);

        scrollContainer.addEventListener("mouseenter", handleMouseEnter);

        scrollContainer.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationId);

            scrollContainer.removeEventListener("mouseenter", handleMouseEnter);

            scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return (
        <motion.section
            id="team"
            ref={sectionRef}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full flex flex-col items-center pt-[60px] pb-[60px] overflow-hidden bg-[#F9F9F9]"
        >
            {/* Background Motion */}
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{ y: bgY }}
            />

            <div className="w-full flex flex-col items-center">

                {/* Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="
                        text-[clamp(22px,4.8vw,28px)]
                        md:text-[35px]
                        text-center
                        mb-4
                        font-['Outfit']
                        font-medium
                        leading-[1.2]
                    "
                    style={{ color: "#0D4A7A" }}
                >
                    {t("team.title")}
                </motion.h2>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-black text-center font-['DM_Sans'] text-[16px] md:text-[18px] lg:text-[20px] font-normal leading-[1.5] line-clamp-none md:line-clamp-none max-w-[700px] mb-10 md:mb-[60px] px-5"
                >
                    {t("team.description")}
                </motion.p>

                {/* TEAM CARDS */}
                <div
                    ref={scrollContainerRef}
                    className="w-full overflow-x-auto scrollbar-hide cursor-grab"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        WebkitOverflowScrolling: "touch"
                    }}
                >
                    <div className="flex gap-4 md:gap-6 w-max px-4 pt-[10px] pb-[10px]">

                        {(Array.isArray(team) ? team : []).map((member) => {
                            return (
                                <div
                                    key={member.id}
                                    className="w-[280px] md:w-[350px] flex-shrink-0 flex flex-col"
                                >
                                    {/* CARD */}
                                    <div
                                        className="relative w-full h-[320px] md:h-[420px] rounded-[10px] shadow-sm overflow-hidden bg-white bg-no-repeat bg-contain bg-bottom"
                                        style={{
                                            backgroundImage: `url('${member.photoUrl}')`
                                        }}
                                    >
                                        {/* GRADIENT OVERLAY */}
                                        <div
                                            className="absolute inset-0 z-10"
                                            style={{
                                                background:
                                                    "linear-gradient(180deg, rgba(0, 0, 0, 0.00) 76%, rgba(0, 0, 0, 0.80) 100%)"
                                            }}
                                        />

                                        {/* DEFAULT CONTENT */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 z-10">
                                            {/* NAME */}
                                            <h3 className="text-white text-xl md:text-[23px] font-medium mb-3 font-['DM_Sans']">
                                                {member.name}
                                            </h3>

                                            {/* ROLE */}
                                            <p className="text-white text-sm md:text-[15px] font-medium font-['DM_Sans']">
                                                {member.title}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}