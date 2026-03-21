import type { Metadata } from "next";
import Header from "@/components/Header";
import SizesSection from "@/components/SizesSection";
import FaqsSection from "@/components/FaqsSection";
import CityFaqsSection from "@/components/CityFaqsSection";
import AboutCitySection from "@/components/AboutCitySection";
import ErrorBoundary from "@/components/ErrorBoundary";
import DynamicReviews from "@/components/DynamicReviews";
import WhyUsSection from "@/components/WhyUsSection";
import DynamicGallery from "@/components/DynamicGallery";
import FloatingButtons from "@/components/FloatingButtons";
import Footer from "@/components/Footer";
import BerkeleyHero from "./components/BerkeleyHero";
import ServiceAreaMap from "@/components/ServiceAreaMap";
import BerkeleyLocation from "./components/BerkeleyLocation";

const berkeleyFaqs = [
  {
    question: "Do I need a permit to place a dumpster on the street in Berkeley?",
    answer: (
      <p className="text-sm text-[#666] leading-[1.7] mb-2.5">
        Yes — if you&apos;re placing a dumpster on a public street or sidewalk in Berkeley, you&apos;ll need a
        temporary obstruction permit from the City of Berkeley Public Works. Placing it on your own private
        driveway or property typically requires no permit. We can help walk you through the process.
      </p>
    ),
  },
  {
    question: "Can you fit a dumpster on Berkeley's narrow streets?",
    answer: (
      <p className="text-sm text-[#666] leading-[1.7] mb-2.5">
        Absolutely. We deliver to <strong>tight Berkeley streets daily</strong> — including the hills of
        North Berkeley, narrow lanes in Elmwood, and compact driveways near campus. Our drivers are skilled
        at precise placement, and our 10-yard dumpster is ideal for homes with limited space.
      </p>
    ),
  },
  {
    question: "How fast can I get a dumpster delivered in Berkeley?",
    answer: (
      <p className="text-sm text-[#666] leading-[1.7] mb-2.5">
        We offer <strong>same-day delivery</strong> throughout Berkeley when you call before noon. Downtown
        Berkeley, Rockridge, Claremont, and the Elmwood district are all within our fastest delivery zones.
        Call early for guaranteed same-day service.
      </p>
    ),
  },
  {
    question: "What size dumpster do I need for a Berkeley home remodel?",
    answer: (
      <p className="text-sm text-[#666] leading-[1.7] mb-2.5">
        For a typical kitchen or bathroom remodel in Berkeley, a <strong>20-yard dumpster</strong> is the most
        popular choice. For smaller projects like a garage cleanout or concrete work, the 10-yard is perfect.
        Full home renovations or estate cleanouts usually call for the 30-yard.
      </p>
    ),
  },
  {
    question: "Do you recycle construction waste from Berkeley projects?",
    answer: (
      <p className="text-sm text-[#666] leading-[1.7] mb-2.5">
        Yes! We share Berkeley&apos;s commitment to sustainability. We sort and divert recyclable materials —
        including wood, metal, concrete, and cardboard — away from the landfill whenever possible. Ask us about
        our recycling-focused disposal for your project.
      </p>
    ),
  },
  {
    question: "How much does a dumpster rental cost in Berkeley?",
    answer: (
      <p className="text-sm text-[#666] leading-[1.7] mb-2.5">
        Our Berkeley dumpster rental prices start at <strong>$599 for a 10-yard</strong> dumpster
        (7-day rental, 1 ton included). 20-yard starts at $649 and 30-yard at $749.
        Transparent pricing with no hidden fees. Call <strong>(510) 650-2083</strong> for
        an exact quote based on your project.
      </p>
    ),
  },
];

const berkeleyAbout = {
  cityName: "Berkeley",
  intro:
    "Berkeley is a vibrant city known for its world-class university, historic Craftsman homes, and a community deeply committed to sustainability. From remodeling century-old bungalows in Elmwood to new construction near the waterfront, Berkeley homeowners and contractors need a dumpster service that understands the city's unique character. TP Dumpsters delivers reliable, eco-conscious waste removal across every Berkeley neighborhood — from the flats to the hills.",
  highlights: [
    "Experienced navigating Berkeley's narrow, hilly streets",
    "Eco-friendly disposal practices that match Berkeley's green values",
    "Same-day delivery to all Berkeley neighborhoods including Rockridge & Claremont",
    "Trusted by Berkeley contractors, remodelers, and homeowners",
    "Bilingual team (English & Spanish) for clear communication",
  ],
  commonProjects: [
    "Historic home renovations and Craftsman bungalow remodels in Elmwood & North Berkeley",
    "Kitchen and bathroom remodels in Rockridge and Claremont",
    "UC Berkeley area student housing cleanouts and property turnovers",
    "Landscaping and yard debris removal in the Berkeley Hills",
    "Concrete and foundation work in South Berkeley and West Berkeley",
    "Estate cleanouts and downsizing projects across Albany and Kensington",
  ],
  closingText:
    "Whether you're a contractor renovating a historic home or a homeowner clearing out the garage, TP Dumpsters makes waste removal in Berkeley simple and sustainable. We offer transparent pricing, same-day delivery, and the local expertise you need. Call us at (510) 650-2083 for a free quote.",
};

export const metadata: Metadata = {
  title: "Dumpster Rental in Berkeley, CA | Same-Day Delivery - TP Dumpsters",
  description:
    "Affordable dumpster rentals in Berkeley, CA. 10, 20 & 30 yard roll-off dumpsters. Same-day delivery to Downtown Berkeley, Rockridge, Elmwood & all neighborhoods. Eco-friendly disposal. Call (510) 650-2083",
  keywords: [
    "dumpster rental Berkeley CA",
    "Berkeley dumpster rental",
    "roll-off dumpster Berkeley",
    "construction dumpster Berkeley",
    "Berkeley waste removal",
    "dumpster rental 94702",
    "dumpster rental 94704",
    "dumpster rental Rockridge",
    "Elmwood dumpster rental",
    "North Berkeley dumpster rental",
    "Albany dumpster rental",
    "Kensington dumpster rental",
    "cheap dumpster Berkeley CA",
    "junk removal Berkeley",
  ],
  openGraph: {
    title: "Dumpster Rental in Berkeley, CA - TP Dumpsters",
    description:
      "Fast, affordable dumpster rentals in Berkeley. 10, 20 & 30 yard dumpsters. Same-day delivery. Call (510) 650-2083",
    url: "https://tpdumpsters.com/berkeley",
    siteName: "TP Dumpsters",
    locale: "en_US",
    type: "website",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://tpdumpsters.com/berkeley" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "TP Dumpsters - Berkeley",
  description:
    "Affordable, reliable dumpster rentals in Berkeley, CA. Same-day delivery to all Berkeley neighborhoods and surrounding areas.",
  url: "https://tpdumpsters.com/berkeley",
  telephone: "+1-510-650-2083",
  email: "dumpster@tpservicesca.com",
  image: "/images/logo/TP.png",
  logo: "/images/logo/TP.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Berkeley",
    addressRegion: "CA",
    addressCountry: "US",
  },
  areaServed: [
    { "@type": "City", name: "Berkeley" },
    { "@type": "City", name: "Albany" },
    { "@type": "City", name: "Kensington" },
    { "@type": "City", name: "El Cerrito" },
  ],
  priceRange: "$$",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "07:00",
    closes: "18:00",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Dumpster Rental Sizes",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "10 Yard Dumpster Rental", description: "Compact dumpster for tight spaces, soil, concrete, and small cleanups. 7-day rental, 1 ton included." },
        price: "599",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "20 Yard Dumpster Rental", description: "Versatile mid-size dumpster for remodels, roofing, and medium cleanouts. 7-day rental, 2 tons included." },
        price: "649",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "30 Yard Dumpster Rental", description: "Large dumpster for full renovations, construction debris, and estate cleanouts. 7-day rental, 3 tons included." },
        price: "749",
        priceCurrency: "USD",
      },
    ],
  },
};

export default function BerkeleyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <BerkeleyHero />
      <div className="h-[60px] bg-tp-red w-full" />
      <AboutCitySection {...berkeleyAbout} />
      <SizesSection />
      <ErrorBoundary>
        <CityFaqsSection cityName="Berkeley" faqs={berkeleyFaqs} />
      </ErrorBoundary>
      <FaqsSection />
      <DynamicReviews />
      <WhyUsSection />
      <DynamicGallery />
      <ServiceAreaMap />
      <BerkeleyLocation />
      <FloatingButtons />
      <Footer />
    </>
  );
}
