import type { MetadataRoute } from "next";

const SITE_URL = "https://www.cdonna.com";

const routes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/discovery", changeFrequency: "monthly", priority: 0.8 },
  { path: "/donna-ai", changeFrequency: "weekly", priority: 0.9 },
  { path: "/independence", changeFrequency: "monthly", priority: 0.7 },
  { path: "/for-vendors", changeFrequency: "monthly", priority: 0.6 },
  { path: "/for-partners", changeFrequency: "monthly", priority: 0.6 },
  { path: "/early-access", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/imprint", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
