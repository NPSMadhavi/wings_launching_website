import { useAppointment } from "@/context/AppointmentContext";
import { useTranslation } from "react-i18next";
import { SiteClockIcon, SiteMapPinIcon, SITE_ICON_SIZE_LG } from "@/components/ui/SiteIcons";

/* ─── SVG Icons (phone, email — not part of site icon set) ─── */

function OutlinePhoneIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1E3A8A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
    );
}

function OutlineEmailIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1E3A8A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                ry="2"
            ></rect>

            <polyline points="3 7 12 13 21 7"></polyline>
        </svg>
    );
}

function ArrowIcon({ color = "currentColor" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                d="M8 5L16 12L8 19"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function GetInTouch() {
    const { t } = useTranslation();
    const { openModal } = useAppointment();

    // Function to open Google Maps with the exact location
    const openGoogleMaps = () => {
        const address = "179 Bartley Road, Singapore 539784";
        const encodedAddress = encodeURIComponent(address);
        const googleMapsUrl = `https://maps.app.goo.gl/5VSoEKaArFpT1cH7A`;
        window.open(googleMapsUrl, "_blank");
    };

    return (
        <section
            id="contact"
            className="w-full flex flex-col items-center pt-[60px] pb-[60px] box-border scroll-mt-[100px]"
            style={{ background: "#F9F9F9" }}
        >
          <div className="w-full navbar-align-outer">
          <div className="navbar-align-inner flex flex-col items-center">
          <h2
    className="
        text-[clamp(22px,4.8vw,28px)]
        md:text-[35px]
        font-medium
        text-center
        mb-4
        font-['Outfit']
        leading-[1.2]
        text-[#0D4A7A]
    "
>
    {t("getInTouch.title")}
</h2>

            <p
                className="
                    text-black
                    text-center
                    font-['DM_Sans']
                    text-[16px]
                    md:text-[18px]
                    lg:text-[20px]
                    font-normal
                    leading-[1.5]
                    line-clamp-2
                    md:line-clamp-none
                    max-w-[700px]
                    mb-8
                    md:mb-10
                "
            >
                {t("getInTouch.description")}
            </p>

            <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 w-full items-stretch">

                {/* Left Side */}
                <div className="flex flex-col lg:flex-[1.2] xl:flex-[1.3]">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">

                        {/* Address Card */}
                        <div
                            className="w-full h-auto min-h-[180px] rounded-[20px] bg-white border border-[#EAEAEA] p-[24px] flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                        >
                            <div className="w-[45px] h-[45px] rounded-[10px] bg-[#E8F4FD] flex items-center justify-center mb-3">
                                <SiteMapPinIcon size={SITE_ICON_SIZE_LG} color="#1E3A8A" />
                            </div>

                            <h3 className="font-['DM_Sans'] font-semibold text-[20px] m-0 mb-1">
                                {t("getInTouch.address")}
                            </h3>

                            <p className="font-['DM_Sans'] font-normal text-[15px] text-[#333] m-0 leading-relaxed max-w-[240px]">
                                {t("getInTouch.addressValue")}
                            </p>
                        </div>

                        {/* Phone Card */}
                        <div
                            className="w-full h-auto min-h-[180px] rounded-[20px] bg-white border border-[#EAEAEA] p-[24px] flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                        >
                            <div className="w-[45px] h-[45px] rounded-[10px] bg-[#E8F4FD] flex items-center justify-center mb-3">
                                <OutlinePhoneIcon />
                            </div>

                            <h3 className="font-['DM_Sans'] font-semibold text-[20px] m-0 mb-1">
                                {t("getInTouch.phone")}
                            </h3>

                            <p className="font-['DM_Sans'] font-normal text-[15px] text-[#333] m-0 leading-relaxed">
                                (+65) 6383 5745
                            </p>
                        </div>

                        {/* Operating Hours */}
                        <div
                            className="w-full h-auto min-h-[300px] rounded-[20px] bg-white border border-[#EAEAEA] p-[24px] flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                        >
                            <div className="w-[45px] h-[45px] rounded-[10px] bg-[#E8F4FD] flex items-center justify-center mb-0">
                                <SiteClockIcon size={SITE_ICON_SIZE_LG} color="#1E3A8A" />
                            </div>

                            <h3 className="font-['DM_Sans'] font-semibold text-[20px] m-0 mb-4">
                                {t("getInTouch.operatingHours")}
                            </h3>

                            <div className="flex flex-col gap-3">
                                     <div className="flex justify-between items-center gap-2">
                                    <span className="font-['DM_Sans'] font-medium text-[14px] sm:text-[15px] text-[#000] min-w-0 flex-1 leading-tight">
                                        {t("getInTouch.days.monday")}
                                    </span>

                                    <span className="font-['DM_Sans'] font-medium text-[13px] sm:text-[14px] text-[#1B4585] text-right whitespace-nowrap shrink-0">
                                        1:00pm – 8:30pm
                                    </span>
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-['DM_Sans'] font-medium text-[14px] sm:text-[15px] text-[#000] min-w-0 flex-1 leading-tight">
                                        {t("getInTouch.days.tueFri")}
                                    </span>

                                    <span className="font-['DM_Sans'] font-medium text-[13px] sm:text-[14px] text-[#1B4585] text-right whitespace-nowrap shrink-0">
                                        8:30am – 5:30pm
                                    </span>
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-['DM_Sans'] font-medium text-[14px] sm:text-[15px] text-[#000] min-w-0 flex-1 leading-tight">
                                        {t("getInTouch.days.thursday")}
                                    </span>

                                    <span className="font-['DM_Sans'] font-medium text-[13px] sm:text-[14px] text-[#1B4585] text-right whitespace-nowrap shrink-0">
                                        8:30am – 7:30pm
                                    </span>
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-['DM_Sans'] font-medium text-[14px] sm:text-[15px] text-[#000] min-w-0 flex-1 leading-tight">
                                        {t("getInTouch.days.saturday")}
                                    </span>

                                    <span className="font-['DM_Sans'] font-medium text-[13px] sm:text-[14px] text-[#1B4585] text-right whitespace-nowrap shrink-0">
                                        9:00am – 12:30pm
                                    </span>
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                    <span className="font-['DM_Sans'] font-medium text-[14px] sm:text-[15px] text-[#000] min-w-0 flex-1 leading-tight">
                                        {t("getInTouch.days.sunHoliday")}
                                    </span>

                                    <span className="font-['DM_Sans'] font-medium text-[13px] sm:text-[14px] text-[#1B4585] text-right whitespace-nowrap shrink-0">
                                        {t("getInTouch.status.closed")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Email Card */}
                        <div
                            className="w-full h-auto min-h-[300px] rounded-[20px] bg-white border border-[#EAEAEA] p-[24px] flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                        >
                            <div className="w-[45px] h-[45px] rounded-[10px] bg-[#E8F4FD] flex items-center justify-center mb-3">
                                <OutlineEmailIcon />
                            </div>

                            <h3 className="font-['DM_Sans'] font-semibold text-[20px] m-0 mb-2">
                                {t("getInTouch.email")}
                            </h3>

                            <a
                                href="mailto:admin@wingscounselling.org.sg"
                                className="font-['DM_Sans'] font-normal text-[15px] text-[#000] underline m-0 break-all leading-relaxed"
                            >
                                admin@wingscounselling.org.sg
                            </a>
                        </div>
                    </div>

                    {/* Appointment Button — desktop */}
                    <button
                        onClick={() => openModal()}
                        className="
                            hidden
                            lg:flex
                            mt-6
                            bg-[#1B4585]
                            text-white
                            px-8
                            py-3.5
                            rounded-full
                            font-['DM_Sans']
                            font-semibold
                            text-[clamp(15px,0.9vw,18px)]
                            w-fit
                            items-center
                            gap-3
                            shadow-lg                            
                            transition-all
                            duration-300
                            hover:scale-[1.02]
                            active:scale-[0.98]
                        "
                    >
                        {t("getInTouch.bookAppointment")}

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

                {/* Right Side Map - Clickable */}
                <div
                    onClick={openGoogleMaps}
                    className="
                        w-full
                        lg:flex-[1]
                        min-h-[300px]
                        md:min-h-[450px]
                        lg:min-h-0
                        rounded-[20px]
                        relative
                        shadow-[0_8px_30px_rgba(0,0,0,0.05)]
                        bg-center
                        bg-cover
                        overflow-hidden
                        cursor-pointer
                        transition-all
                        duration-300
                        hover:scale-[1.02]
                        hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]
                    "
                    style={{
                        backgroundImage: "url('/assets/Map.jpeg')"
                    }}
                >
                    {/* Map Info Box */}
                    <div className="absolute top-[25px] left-[15px] w-[190px] h-[100px] bg-white rounded-[10px] p-[15px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex flex-col justify-center z-10">
                        <h4 className="font-['DM_Sans'] font-medium text-[13px] text-[#000] m-0 mb-1 leading-tight">
                            {t("getInTouch.mapTitle")}
                        </h4>

                        <p className="font-['DM_Sans'] font-normal text-[11px] text-[#666] m-0 leading-tight">
                            {t("getInTouch.mapTitleShort")}
                        </p>
                    </div>

                    {/* Overlay text on hover */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                            <svg 
                                width="18" 
                                height="18" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    d="M12 2C8.14 2 5 5.14 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.14 15.86 2 12 2Z" 
                                    fill="#FF0000"
                                />
                                <circle cx="12" cy="9" r="3" fill="#FFF" />
                            </svg>
                            <span className="text-[#1B4585] font-['DM_Sans'] font-semibold text-[14px]">
                                {t("getInTouch.openGoogleMaps")}
                            </span>
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    d="M18 13v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" 
                                    stroke="#1B4585" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                                <polyline 
                                    points="15 3 21 3 21 9" 
                                    stroke="#1B4585" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                                <line 
                                    x1="10" 
                                    y1="14" 
                                    x2="21" 
                                    y2="3" 
                                    stroke="#1B4585" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Appointment Button — mobile (after map) */}
                <button
                    onClick={() => openModal()}
                    className="
                        lg:hidden
                        flex
                        items-center
                        gap-3
                        bg-[#1B4585]
                        text-white
                        px-8
                        py-3.5
                        mt-6
                        mb-2
                        rounded-full
                        font-['DM_Sans']
                        font-semibold
                        text-[clamp(13px,0.9vw,16px)]
                        w-fit
                        shadow-lg
                        transition-all
                        duration-300
                        hover:scale-[1.02]
                        active:scale-[0.98]
                    "
                >
                    {t("getInTouch.bookAppointment")}

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
          </div>
          </div>
        </section>
    );
}