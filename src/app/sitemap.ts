import type { MetadataRoute } from "next";

// All city pages - add new cities here and they auto-appear in sitemap
const cities = ["oakland", "pinole", "richmond", "concord", "berkeley", "hayward", "fremont", "walnut-creek", "alameda", "antioch", "san-leandro", "vallejo", "livermore", "lafayette", "pleasanton", "san-ramon", "dublin", "brentwood", "union-city", "newark", "pleasant-hill", "martinez", "pittsburg", "castro-valley", "hercules", "el-cerrito", "danville", "benicia", "oakley", "san-pablo", "orinda", "moraga", "bay-point", "american-canyon", "el-sobrante", "san-francisco", "san-jose", "san-rafael", "novato", "mill-valley", "sausalito", "tiburon", "corte-madera", "larkspur", "san-anselmo", "fairfax", "clayton", "rodeo", "crockett", "discovery-bay", "bethel-island", "contra-costa-county", "marin-county", "fairfield", "san-lorenzo", "emeryville", "piedmont", "alameda-county", "vacaville", "suisun-city", "dixon", "solano-county", "daly-city", "redwood-city", "san-mateo", "south-san-francisco", "pacifica", "san-mateo-county", "sunnyvale", "santa-clara", "mountain-view", "milpitas", "palo-alto", "santa-clara-county"];
const otherPages = ["booking", "contractors", "general-debris", "construction-debris", "roofing"];

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
