import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/driver",
          "/internal",
          "/booking/success",
          "/thank-you",
          "/quote",
        ],
      },
      {
        userAgent: [
          "ChatGPT-User",
          "OAI-SearchBot",
          "GPTBot",
          "Google-Extended",
          "Googlebot",
          "Bingbot",
          "Applebot",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Bytespider",
          "CCBot",
          "YouBot",
        ],
        allow: "/",
      },
    ],
    sitemap: "https://tpdumpsters.com/sitemap.xml",
  };
}
