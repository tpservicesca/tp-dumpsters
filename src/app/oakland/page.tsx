import type { Metadata } from "next";
import Header from "@/components/Header";
import SizesSection from "@/components/SizesSection";
import FaqsSection from "@/components/FaqsSection";
import ReviewsSection from "@/components/ReviewsSection";
import WhyUsSection from "@/components/WhyUsSection";
import GallerySection from "@/components/GallerySection";
import FloatingButtons from "@/components/FloatingButtons";
import Footer from "@/components/Footer";
import OaklandHero from "./components/OaklandHero";
import OaklandLocation from "./components/OaklandLocation";

export const metadata: Metadata = {
  title: "Dumpster Rental in Oakland, CA | Same-Day Service - TP Dumpsters",
  description:
    "Fast, reliable dumpster rentals in Oakland, CA. Serving Downtown, East Oakland, West Oakland, Fruitvale & all ZIP codes. Same-day delivery. Bilingual support (EN/ES). Call (510) 650-2083",
  keywords: [
    "dumpster rental Oakland CA",
    "Oakland dumpster rental",
    "roll-off dumpster Oakland",
    "construction dumpster Oakland",
    "Oakland waste removal",
    "dumpster rental 94601",
    "dumpster rental 94606",
    "dumpster rental Downtown Oakland",
    "East Oakland dumpster",
    "West Oakland dumpster rental",
    "Fruitvale dumpster",
    "Temescal dumpster rental",
  ],
  openGraph: {
    title: "Dumpster Rental in Oakland, CA - TP Dumpsters",
    description:
      "Fast, reliable dumpster rentals in Oakland. 10, 20 & 30 yard dumpsters. Same-day delivery available.",
    url: "https://tpservicesca.com/oakland",
    siteName: "TP Dumpsters",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://tpservicesca.com/oakland",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "TP Dumpsters - Oakland",
  description:
    "Fast, reliable dumpster rentals in Oakland, CA. Serving all Oakland neighborhoods with same-day delivery.",
  url: "https://tpservicesca.com/oakland",
  telephone: "+1-510-650-2083",
  email: "dumpster@tpservicesca.com",
  image: "/images/logo/TP.png",
  logo: "/images/logo/TP.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Oakland",
    addressRegion: "CA",
    addressCountry: "US",
  },
  areaServed: [
    {
      "@type": "City",
      name: "Oakland",
      "@id": "https://en.wikipedia.org/wiki/Oakland,_California",
    },
  ],
  priceRange: "$$",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    opens: "07:00",
    closes: "18:00",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Dumpster Rental Sizes",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "10 Yard Dumpster Rental",
          description:
            "Compact dumpster ideal for tight spaces and heavy debris like soil, concrete, and bricks.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "20 Yard Dumpster Rental",
          description:
            "Versatile dumpster for kitchen/bathroom remodels, roofing projects, and yard cleanups.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "30 Yard Dumpster Rental",
          description:
            "Extra capacity dumpster for whole-home cleanouts, large renovations, and construction debris.",
        },
      },
    ],
  },
};

export default function OaklandPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <OaklandHero />
      {/* Red Divider */}
      <div className="h-[60px] bg-tp-red w-full" />
      <SizesSection />
      <FaqsSection />
      <ReviewsSection />
      <WhyUsSection />
      <GallerySection />
      <OaklandLocation />
      <FloatingButtons />
      <Footer />
    </>
  );
}
