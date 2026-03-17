import type { Metadata } from "next";
import Header from "@/components/Header";
import SizesSection from "@/components/SizesSection";
import FaqsSection from "@/components/FaqsSection";
import ReviewsSection from "@/components/ReviewsSection";
import WhyUsSection from "@/components/WhyUsSection";
import GallerySection from "@/components/GallerySection";
import FloatingButtons from "@/components/FloatingButtons";
import Footer from "@/components/Footer";
import PinoleHero from "./components/PinoleHero";
import PinoleLocation from "./components/PinoleLocation";

export const metadata: Metadata = {
  title: "Dumpster Rental in Pinole, CA | Same-Day Service - TP Dumpsters",
  description:
    "Affordable dumpster rentals in Pinole, CA. Serving Old Town, Pinole Valley, Tara Hills, Hercules & surrounding areas. Same-day delivery. Bilingual support (EN/ES). Call (510) 650-2083",
  keywords: [
    "dumpster rental Pinole CA",
    "Pinole dumpster rental",
    "roll-off dumpster Pinole",
    "construction dumpster Pinole",
    "Pinole waste removal",
    "dumpster rental 94564",
    "dumpster rental Pinole Valley",
    "Tara Hills dumpster",
    "Hercules dumpster rental",
    "El Sobrante dumpster",
    "West Contra Costa dumpster rental",
    "San Pablo dumpster rental",
  ],
  openGraph: {
    title: "Dumpster Rental in Pinole, CA - TP Dumpsters",
    description:
      "Affordable dumpster rentals in Pinole. 10, 20 & 30 yard dumpsters. Same-day delivery available.",
    url: "https://tpservicesca.com/pinole",
    siteName: "TP Dumpsters",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://tpservicesca.com/pinole",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "TP Dumpsters - Pinole",
  description:
    "Affordable dumpster rentals in Pinole, CA. Serving Pinole and surrounding West Contra Costa communities with same-day delivery.",
  url: "https://tpservicesca.com/pinole",
  telephone: "+1-510-650-2083",
  email: "dumpster@tpservicesca.com",
  image: "/images/logo/TP.png",
  logo: "/images/logo/TP.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pinole",
    addressRegion: "CA",
    postalCode: "94564",
    addressCountry: "US",
  },
  areaServed: [
    {
      "@type": "City",
      name: "Pinole",
      "@id": "https://en.wikipedia.org/wiki/Pinole,_California",
    },
    {
      "@type": "City",
      name: "Hercules",
    },
    {
      "@type": "City",
      name: "El Sobrante",
    },
    {
      "@type": "City",
      name: "San Pablo",
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

export default function PinolePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <PinoleHero />
      {/* Red Divider */}
      <div className="h-[60px] bg-tp-red w-full" />
      <SizesSection />
      <FaqsSection />
      <ReviewsSection />
      <WhyUsSection />
      <GallerySection />
      <PinoleLocation />
      <FloatingButtons />
      <Footer />
    </>
  );
}
