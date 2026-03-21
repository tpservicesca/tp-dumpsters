import type { MetadataRoute } from "next";

// All city pages - add new cities here and they auto-appear in sitemap
const cities = ["oakland", "pinole", "richmond", "concord", "berkeley", "hayward", "fremont", "walnut-creek", "alameda", "antioch", "san-leandro", "vallejo", "livermore", "lafayette", "pleasanton", "san-ramon", "dublin", "brentwood", "union-city", "newark", "pleasant-hill", "martinez", "pittsburg"];
const otherPages = ["booking", "contractors"];

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

  const otherPageEntries: MetadataRoute.Sitemap = otherPages.map((page) => ({
    url: `${baseUrl}/${page}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...otherPageEntries, ...cityPages];
}
