import React from "react";
import { Helmet } from "react-helmet-async";

const DOMAIN = "https://wingscc.netopsys.in";
const DEFAULT_IMAGE = "/assets/wingsLogo.png";
const SITE_NAME = "WINGS Counselling Centre";

export function SEO({
  title,
  description,
  path = "",
  ogImage,
  ogType = "website",
  noindex = false,
  jsonLd = null,
}) {
  const fullTitle = title
    ? title.includes("WINGS")
      ? title
      : `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Professional Counselling & Therapy Services`;

  const metaDescription =
    description ||
    "WINGS Counselling Centre provides compassionate, professional counselling, individual & family therapy, youth support, and clinical supervision in Singapore.";

  // Normalize canonical URL path
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const canonicalUrl = `${DOMAIN}${cleanPath}`;

  // Image URL resolution
  let imageUrl = ogImage || DEFAULT_IMAGE;
  if (imageUrl && !imageUrl.startsWith("http")) {
    imageUrl = `${DOMAIN}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";

  return (
    <Helmet>
      {/* Primary HTML Title & Description */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robotsContent} />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

export default SEO;
