import type { MetadataRoute } from "next";

const SITE_URL = "https://www.cdonna.ch";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/internal/API surfaces — never real content to index,
      // and disallowing them explicitly keeps them from ever becoming
      // accidental SEO landing pages (brief §3/§21).
      disallow: ["/app/", "/founder/", "/api/", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
