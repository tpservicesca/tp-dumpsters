import type { Metadata } from "next";
import Link from "next/link";
import { FaCalendarDays, FaPhone, FaMapLocationDot } from "react-icons/fa6";
import Header from "@/components/Header";
import SizesSection from "@/components/SizesSection";
import FloatingButtons from "@/components/FloatingButtons";
import Footer from "@/components/Footer";
import CountyMapWrapper from "./components/CountyMapWrapper";

// ── SEO Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Dumpster Rental in Contra Costa County, CA | TP Dumpsters",
  description:
    "Affordable dumpster rental across all Contra Costa County cities. 10, 20 & 30 yard roll-off containers with same-day delivery. Serving Concord, Walnut Creek, Richmond, Antioch, Martinez & 20+ more cities. Call (510) 650-2083.",
  keywords: [
    "dumpster rental Contra Costa County",
    "roll-off dumpster Contra Costa",
    "Concord dumpster rental",
    "Walnut Creek dumpster rental",
    "Richmond dumpster rental",
    "Antioch dumpster rental",
    "Martinez dumpster rental",
    "Contra Costa County waste removal",
    "construction dumpster Bay Area",
    "cheap dumpster rental Contra Costa",
    "same day dumpster delivery Contra Costa",
    "TP Dumpsters",
  ],
  openGraph: {
    title: "Dumpster Rental in Contra Costa County, CA | TP Dumpsters",
    description:
      "Serving 26+ cities across Contra Costa County. Same-day delivery, transparent pricing, bilingual support. Book online or call (510) 650-2083.",
    url: "https://tpdumpsters.com/contra-costa-county",
    siteName: "TP Dumpsters",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/hero/red-dumpster-construction.png",
        width: 1200,
        height: 630,
        alt: "TP Dumpsters serving Contra Costa County",
      },
    ],
  },
  alternates: {
    canonical: "https://tpdumpsters.com/contra-costa-county",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

// ── City Data ───────────────────────────────────────────────────────────────
const CITIES = [
  { name: "Concord", slug: "concord", tagline: "Largest City" },
  { name: "Walnut Creek", slug: "walnut-creek", tagline: "Downtown Hub" },
  { name: "Richmond", slug: "richmond", tagline: "West County" },
  { name: "Antioch", slug: "antioch", tagline: "East County" },
  { name: "Pittsburg", slug: "pittsburg", tagline: "Delta Gateway" },
  { name: "Brentwood", slug: "brentwood", tagline: "Growing Community" },
  { name: "San Ramon", slug: "san-ramon", tagline: "Tri-Valley" },
  { name: "Danville", slug: "danville", tagline: "Historic Town" },
  { name: "Martinez", slug: "martinez", tagline: "County Seat" },
  { name: "Pleasant Hill", slug: "pleasant-hill", tagline: "Central County" },
  { name: "Pinole", slug: "pinole", tagline: "Home Base 🏠" },
  { name: "Hercules", slug: "hercules", tagline: "Waterfront City" },
  { name: "Lafayette", slug: "lafayette", tagline: "Lamorinda" },
  { name: "El Cerrito", slug: "el-cerrito", tagline: "West County" },
  { name: "Oakley", slug: "oakley", tagline: "East County" },
  { name: "Orinda", slug: "orinda", tagline: "Lamorinda" },
  { name: "Moraga", slug: "moraga", tagline: "Lamorinda" },
  { name: "San Pablo", slug: "san-pablo", tagline: "West County" },
  { name: "El Sobrante", slug: "el-sobrante", tagline: "West County" },
  { name: "Bay Point", slug: "bay-point", tagline: "Central County" },
  { name: "Clayton", slug: "clayton", tagline: "Mt. Diablo Foothills" },
  { name: "Rodeo", slug: "rodeo", tagline: "North County" },
  { name: "Crockett", slug: "crockett", tagline: "Carquinez Strait" },
  { name: "Discovery Bay", slug: "discovery-bay", tagline: "Delta Community" },
  { name: "Bethel Island", slug: "bethel-island", tagline: "Delta Community" },
  { name: "Castro Valley", slug: "castro-valley", tagline: "Alameda County" },
];

// ── FAQs ────────────────────────────────────────────────────────────────────
const countyFaqs = [
  {
    q: "What cities in Contra Costa County do you serve?",
    a: "We serve all 26+ cities and communities across Contra Costa County including Concord, Walnut Creek, Richmond, Antioch, Martinez, Pittsburg, Brentwood, San Ramon, Danville, Pleasant Hill, Pinole, Hercules, Lafayette, El Cerrito, Oakley, and many more. If you're in Contra Costa County, we deliver.",
  },
  {
    q: "How much does a dumpster rental cost in Contra Costa County?",
    a: "Pricing starts at $600 for a 10-yard dumpster (7-day rental, 1 ton included), $650 for a 20-yard (2 tons), and $700 for a 30-yard (3 tons). No hidden fees, no surprise charges. Additional tonnage is $90/ton.",
  },
  {
    q: "Do you offer same-day delivery in Contra Costa County?",
    a: "Yes! We offer same-day delivery to most Contra Costa County cities when you call before noon. Our central location in Pinole allows us to reach cities from Richmond to Brentwood quickly and efficiently.",
  },
  {
    q: "What sizes of dumpsters are available?",
    a: "We offer three sizes: 10-yard (ideal for small cleanouts, concrete, soil), 20-yard (perfect for remodels and medium projects), and 30-yard (best for large renovations, construction, and estate cleanouts).",
  },
  {
    q: "Do I need a permit for a dumpster in Contra Costa County?",
    a: "If the dumpster is placed on your private property (driveway, yard), no permit is needed. For street placement, permit requirements vary by city — Concord, Walnut Creek, and Richmond each have their own rules. We'll guide you through the process for your specific city.",
  },
  {
    q: "How long can I keep the dumpster?",
    a: "Standard rental is 7 days, included in the base price. Need more time? Extensions are available at $15/day. Just let us know and we'll keep the dumpster as long as your project needs.",
  },
  {
    q: "What can I put in the dumpster?",
    a: "Most construction and household debris is accepted: wood, drywall, concrete, roofing, furniture, appliances, yard waste, and general junk. Hazardous materials, paint, tires, batteries, and electronics are not accepted. Ask us if you're unsure!",
  },
  {
    q: "Do you offer bilingual support?",
    a: "¡Sí! We provide full bilingual support in English and Spanish. Our team communicates clearly in both languages so every customer feels comfortable throughout the rental process.",
  },
  {
    q: "Can I book a dumpster online?",
    a: "Absolutely! Book online at tpdumpsters.com/booking and receive an instant 5% discount. You can also call us at (510) 650-2083 for personalized service.",
  },
  {
    q: "What's the difference between your dumpster sizes?",
    a: "The 10-yard holds about 3 pickup truck loads — great for a bathroom remodel or small cleanout. The 20-yard holds about 6 truck loads — ideal for kitchen remodels or roofing. The 30-yard holds about 9 truck loads — perfect for whole-home renovations or new construction.",
  },
];

// ── JSON-LD ─────────────────────────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "TP Dumpsters - Contra Costa County",
  description:
    "Affordable dumpster rental across all Contra Costa County cities. Same-day delivery, transparent pricing, bilingual support.",
  url: "https://tpdumpsters.com/contra-costa-county",
  telephone: "+1-510-650-2083",
  email: "dumpster@tpservicesca.com",
  image: "/images/logo/TP.png",
  logo: "/images/logo/TP.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pinole",
    addressRegion: "CA",
    addressCountry: "US",
  },
  areaServed: CITIES.map((c) => ({ "@type": "City", name: c.name })),
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
        itemOffered: { "@type": "Service", name: "10 Yard Dumpster Rental", description: "Compact roll-off for tight spaces, soil, concrete, and small cleanups." },
        price: "600",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "20 Yard Dumpster Rental", description: "Mid-size roll-off for remodels, roofing, and medium cleanouts." },
        price: "650",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "30 Yard Dumpster Rental", description: "Large roll-off for full renovations, construction, and estate cleanouts." },
        price: "700",
        priceCurrency: "USD",
      },
    ],
  },
};

// ── Page Component ──────────────────────────────────────────────────────────
export default function ContraCostaCountyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      {/* ═══ HERO ═══ */}
      <section className="hero-bg relative min-h-screen flex flex-col justify-center items-center pt-[15vh] pb-[6vh] text-center">
        <div className="absolute inset-0 bg-black/50 z-[1]" />
        <div className="relative z-[2] px-5 pb-10">
          <div className="mb-6">
            <h3 className="inline-block bg-tp-gold-dark text-white px-6 py-2 text-[13px] md:text-base font-bold rounded-[3px] font-[var(--font-poppins)]">
              Serving 26+ Cities Across Contra Costa County
            </h3>
          </div>
          <h1 className="font-[var(--font-oswald)] text-[26px] sm:text-[3rem] lg:text-[4.5rem] font-extrabold text-white uppercase leading-[1.1] mb-4 tracking-wide">
            CONTRA COSTA COUNTY<br />DUMPSTER RENTAL
          </h1>
          <h2 className="font-[var(--font-poppins)] text-base sm:text-[1.5rem] lg:text-[1.8rem] font-semibold text-white italic mb-2">
            One Call Covers the Entire County
          </h2>
          <p className="font-[var(--font-poppins)] text-sm sm:text-lg text-white/90 mb-8 max-w-3xl mx-auto">
            Concord • Walnut Creek • Richmond • Antioch • Martinez • Pittsburg • San Ramon • Danville • Pinole & More
          </p>
          <div className="flex flex-col items-center sm:flex-row sm:justify-center gap-4 flex-wrap">
            <a
              href="/booking"
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-7 py-3 rounded-lg text-lg font-semibold bg-tp-red text-white hover:bg-tp-red-dark transition-all duration-300 font-[var(--font-poppins)]"
            >
              <FaCalendarDays /> Book Online — 5% Off
            </a>
            <a
              href="tel:+15106502083"
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-7 py-3 rounded-lg text-lg font-semibold bg-transparent text-white border-2 border-tp-red hover:bg-tp-red hover:text-white transition-all duration-300 font-[var(--font-poppins)]"
            >
              <FaPhone /> (510) 650-2083
            </a>
          </div>
        </div>

        {/* Hero Feature Cards */}
        <div className="relative z-[2] flex flex-col lg:flex-row justify-center gap-5 lg:gap-10 w-[90%] lg:w-[80%] max-w-[1080px] mx-auto px-6 py-6 md:px-8 lg:px-10 lg:py-8 bg-white/15 backdrop-blur-[10px] rounded-[10px] mt-5 -mb-[30px]">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#fbeaea] rounded-full flex items-center justify-center">
              <FaMapLocationDot className="text-tp-red text-xl" />
            </div>
            <div>
              <h4 className="text-white font-[var(--font-poppins)] text-base font-bold mb-1">26+ Cities Served</h4>
              <p className="text-white/85 text-[13px] leading-relaxed">Full Contra Costa County coverage</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#fbeaea] rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="#E02B20"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div>
              <h4 className="text-white font-[var(--font-poppins)] text-base font-bold mb-1">Same-Day Delivery</h4>
              <p className="text-white/85 text-[13px] leading-relaxed">Call before noon for today&apos;s drop-off</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#fbeaea] rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="#E02B20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div>
              <h4 className="text-white font-[var(--font-poppins)] text-base font-bold mb-1">Bilingual Support</h4>
              <p className="text-white/85 text-[13px] leading-relaxed">English &amp; Spanish — Hablamos Español</p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-[60px] bg-tp-red w-full" />

      {/* ═══ INTERACTIVE MAP ═══ */}
      <section className="py-16 bg-[#0d1117]">
        <div className="w-[90%] max-w-[1100px] mx-auto">
          <h2 className="font-[var(--font-oswald)] text-[28px] md:text-[36px] font-bold text-white text-center uppercase mb-3 tracking-wide">
            Our Service Area
          </h2>
          <p className="font-[var(--font-poppins)] text-white/70 text-center mb-10 max-w-2xl mx-auto">
            Click any marker to learn more about dumpster rental in that city. We deliver to every corner of Contra Costa County.
          </p>
          <CountyMapWrapper />
        </div>
      </section>

      {/* ═══ CITY GRID ═══ */}
      <section className="py-16 bg-[#f8f8f8]">
        <div className="w-[90%] max-w-[1200px] mx-auto">
          <h2 className="font-[var(--font-oswald)] text-[28px] md:text-[36px] font-bold text-[#1a1a1a] text-center uppercase mb-3 tracking-wide">
            Cities We Serve in Contra Costa County
          </h2>
          <p className="font-[var(--font-poppins)] text-[#666] text-center mb-10 max-w-2xl mx-auto">
            Select a city below to view local pricing, delivery info, and availability for your area.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/${city.slug}`}
                className="group block bg-white rounded-xl border border-gray-200 hover:border-tp-red hover:shadow-lg transition-all duration-300 p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-[var(--font-poppins)] text-[16px] font-bold text-[#1a1a1a] group-hover:text-tp-red transition-colors">
                      {city.name}
                    </h3>
                    <p className="text-[12px] text-[#999] font-[var(--font-poppins)] mt-0.5">{city.tagline}</p>
                  </div>
                  <span className="text-tp-red opacity-0 group-hover:opacity-100 transition-opacity text-lg font-bold">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING OVERVIEW ═══ */}
      <SizesSection />

      {/* ═══ FAQs ═══ */}
      <section className="py-16 bg-white">
        <div className="w-[90%] max-w-[900px] mx-auto">
          <h2 className="font-[var(--font-oswald)] text-[28px] md:text-[36px] font-bold text-[#1a1a1a] text-center uppercase mb-3 tracking-wide">
            Contra Costa County Dumpster Rental FAQs
          </h2>
          <p className="font-[var(--font-poppins)] text-[#666] text-center mb-10">
            Common questions about renting a dumpster in Contra Costa County
          </p>
          <div className="space-y-4">
            {countyFaqs.map((faq, i) => (
              <details key={i} className="group bg-[#f8f8f8] rounded-xl border border-gray-200 overflow-hidden">
                <summary className="cursor-pointer flex items-center justify-between p-5 font-[var(--font-poppins)] font-semibold text-[15px] text-[#1a1a1a] hover:text-tp-red transition-colors list-none">
                  {faq.q}
                  <svg className="w-5 h-5 text-tp-red transition-transform group-open:rotate-180 flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-sm text-[#666] leading-[1.7] font-[var(--font-poppins)]">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SEO CONTENT ═══ */}
      <section className="py-16 bg-[#f8f8f8]">
        <div className="w-[85%] max-w-[900px] mx-auto">
          <h2 className="font-[var(--font-poppins)] text-[24px] md:text-[30px] font-bold text-[#1a1a1a] mb-6 text-center">
            Your Trusted Dumpster Rental Partner in Contra Costa County
          </h2>
          <div className="space-y-4 text-[#555] text-base leading-[1.8] font-[var(--font-poppins)]">
            <p>
              Contra Costa County is one of the most dynamic and diverse counties in the San Francisco Bay Area, stretching from the waterfront communities of Richmond and El Cerrito in the west to the rapidly growing cities of Brentwood and Discovery Bay in the east. With a population of over one million residents, the county sees constant residential construction, home renovation, and commercial development — all of which generate waste that needs efficient, reliable removal.
            </p>
            <p>
              TP Dumpsters is proud to serve every city and community in Contra Costa County with affordable roll-off dumpster rentals. Whether you&apos;re a homeowner in Walnut Creek remodeling a kitchen, a contractor managing a multi-unit development in Concord, or a property manager clearing out units in Antioch, we have the right size dumpster for your project. Our fleet includes 10-yard, 20-yard, and 30-yard containers — designed to handle everything from small garage cleanouts to large-scale construction debris.
            </p>
            <p>
              Based in Pinole, we&apos;re centrally located to reach communities across the county quickly. Our same-day delivery service ensures your project stays on schedule, and our transparent pricing means no surprise fees. From the historic county seat of Martinez to the Lamorinda communities of Lafayette, Orinda, and Moraga, from the Tri-Valley cities of San Ramon and Danville to the Delta communities of Oakley and Bethel Island — one call to TP Dumpsters covers it all.
            </p>
            <p>
              We understand that navigating dumpster permits can be confusing, especially when each city in Contra Costa County has its own regulations. That&apos;s why our bilingual team (English and Spanish) is ready to help guide you through the process, answer your questions, and ensure your rental experience is smooth from start to finish. Whether you&apos;re cleaning up after a storm, demolishing a deck, or tackling a full home renovation, TP Dumpsters delivers reliability, affordability, and outstanding customer service throughout Contra Costa County.
            </p>
            <p className="text-center font-semibold text-[#1a1a1a] mt-6">
              Ready to get started? <a href="/booking" className="text-tp-red hover:underline">Book online for 5% off</a> or call{" "}
              <a href="tel:+15106502083" className="text-tp-red font-semibold hover:underline">(510) 650-2083</a> today.
            </p>
          </div>
        </div>
      </section>

      <FloatingButtons />
      <Footer />
    </>
  );
}
