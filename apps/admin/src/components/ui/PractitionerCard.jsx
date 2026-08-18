import { motion } from "framer-motion";

export function resolveImageUrl(url) {
  if (!url) return "/assets/placeholder-image.jpg";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

export function getPractitionerDesignation(practitioner) {
  const title = practitioner.title?.trim();
  return title || "";
}

export default function PractitionerCard({ practitioner }) {
  const designation = getPractitionerDesignation(practitioner);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className="bg-white rounded-[12px] border border-[#E8E8E8] shadow-sm text-left flex flex-col h-full hover:-translate-y-1 hover:shadow-md transition-all duration-300 p-3"
    >
      <div className="w-full h-[260px] sm:h-[300px] md:h-[340px] overflow-hidden rounded-[12px] bg-[#E8EEF5] flex items-center justify-center">
        <img
          src={resolveImageUrl(practitioner.photoUrl)}
          alt={practitioner.name}
          className="w-full h-full object-contain object-center rounded-[12px]"
          style={{ imageRendering: "-webkit-optimize-contrast" }}
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = "/assets/placeholder-image.jpg";
          }}
        />
      </div>

      <div className="pt-3 pb-1">
        <h3 className="font-['DM_Sans'] font-bold text-[#0D4A7A] text-[13px] min-[375px]:text-[14px] sm:text-[19px] md:text-[20px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {practitioner.name}
        </h3>
        {designation && (
          <p className="mt-1 font-['DM_Sans'] font-normal text-[#777777] text-[13px] sm:text-[14px] md:text-[15px] leading-snug line-clamp-2">
            {designation}
          </p>
        )}
      </div>
    </motion.article>
  );
}
