import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
  // Prevent Hostinger CDN from caching HTML pages for too long
  // Static assets (JS/CSS) keep immutable cache, but HTML must revalidate
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|images|favicon).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
