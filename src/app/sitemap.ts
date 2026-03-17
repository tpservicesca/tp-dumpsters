import type { MetadataRoute } from "next";

// All city pages - add new cities here and they auto-appear in sitemap
const cities = ["oakland", "pinole"];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://tpdumpsters.com";
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];

  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${baseUrl}/${city}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...cityPages];
}
