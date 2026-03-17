"use client";

import { useState } from "react";
import { FaCalendarDays } from "react-icons/fa6";

/* ───────── Data types ───────── */
interface SizePrice {
  size: string;
  price: number | null; // null = not available
}

interface ServicePricing {
  service: string;
  sizes: SizePrice[];
}

interface CityPricing {
  city: string;
  slug: string;
  services: ServicePricing[];
}

/* ───────── Pricing data ───────── */
const pricingData: CityPricing[] = [
  {
    city: "Oakland",
    slug: "oakland",
    services: [
      {
        service: "General Debris",
        sizes: [
          { size: "10 Yard", price: 590 },
          { size: "20 Yard", price: 640 },
          { size: "30 Yard", price: 690 },
        ],
      },
      {
        service: "Clean Soil",
        sizes: [
          { size: "10 Yard", price: 640 },
          { size: "20 Yard", price: 700 },
          { size: "30 Yard", price: 760 },
        ],
      },
    ],
  },
  {
    city: "Pinole",
    slug: "pinole",
    services: [
      {
        service: "General Debris",
        sizes: [
          { size: "10 Yard", price: 600 },
          { size: "20 Yard", price: 650 },
          { size: "30 Yard", price: 700 },
        ],
      },
      {
        service: "Clean Soil",
        sizes: [
          { size: "10 Yard", price: 650 },
          { size: "20 Yard", price: 710 },
          { size: "30 Yard", price: 770 },
        ],
      },
    ],
  },
];

/* ───────── Component ───────── */
interface PricingTableProps {
  /** If provided, show only this city (for city landing pages). Otherwise show city selector. */
  defaultCity?: string;
}

export default function PricingTable({ defaultCity }: PricingTableProps) {
  const cityNames = pricingData.map((c) => c.city);
  const initialCity = defaultCity || cityNames[0];

  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const cityData = pricingData.find((c) => c.city === selectedCity || c.slug === selectedCity);
  const services = cityData?.services || [];
  const serviceNames = services.map((s) => s.service);

  // If no service selected, or current selection doesn't exist in this city, default to first
  const activeService =
    selectedService && serviceNames.includes(selectedService)
      ? selectedService
      : serviceNames[0] || null;

  const activePricing = services.find((s) => s.service === activeService);

  return (
    <section className="py-20 bg-[#f9f9f9]">
      <div className="w-[92%] sm:w-[80%] max-w-[1080px] mx-auto">
        <h4 className="font-[var(--font-red-hat)] text-sm font-bold text-tp-gold uppercase tracking-[2px] mb-2">
          PRICING
        </h4>
        <h2 className="font-[var(--font-poppins)] text-[26px] md:text-[32px] font-bold text-[#333] mb-8">
          Dumpster rental prices{cityData ? ` in ${cityData.city}` : ""}
        </h2>

        {/* City selector — only show if no defaultCity */}
        {!defaultCity && (
          <div className="flex flex-wrap gap-2 mb-6">
            {cityNames.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold font-[var(--font-poppins)] transition-all duration-200 ${
                  selectedCity === city
                    ? "bg-tp-red text-white shadow-md"
                    : "bg-white text-[#555] border border-[#ddd] hover:border-tp-red hover:text-tp-red"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Service type selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {serviceNames.map((service) => (
            <button
              key={service}
              onClick={() => setSelectedService(service)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold font-[var(--font-poppins)] transition-all duration-200 ${
                activeService === service
                  ? "bg-black text-white shadow-md"
                  : "bg-white text-[#555] border border-[#ddd] hover:border-black hover:text-black"
              }`}
            >
              {service}
            </button>
          ))}
        </div>

        {/* Price cards */}
        {activePricing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activePricing.sizes.map((item, idx) => {
              const isPopular = idx === 1; // middle size is "popular"
              return (
                <div
                  key={item.size}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                    isPopular
                      ? "bg-black text-white shadow-xl scale-[1.02]"
                      : "bg-white text-[#333] shadow-md hover:shadow-lg"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 bg-tp-red text-white text-xs font-bold text-center py-1.5 font-[var(--font-poppins)] uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <div className={`p-8 ${isPopular ? "pt-12" : ""}`}>
                    <h3 className="font-[var(--font-poppins)] text-xl font-bold mb-1">
                      {item.size}
                    </h3>
                    <p className={`text-sm mb-6 ${isPopular ? "text-white/70" : "text-[#888]"}`}>
                      {activeService}
                    </p>
                    {item.price !== null ? (
                      <>
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className={`text-sm ${isPopular ? "text-white/70" : "text-[#888]"}`}>
                            Starting at
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className={`font-[var(--font-oswald)] text-5xl font-bold ${isPopular ? "text-white" : "text-tp-red"}`}>
                            ${item.price}
                          </span>
                        </div>
                        <ul className={`space-y-2 mb-8 text-sm ${isPopular ? "text-white/80" : "text-[#666]"}`}>
                          <li className="flex items-center gap-2">
                            <span className="text-tp-green">✓</span> Delivery &amp; pickup included
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-tp-green">✓</span> 5-7 day rental period
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-tp-green">✓</span> No hidden fees
                          </li>
                        </ul>
                        <a
                          href="tel:+15106502083"
                          className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-lg text-base font-semibold transition-colors duration-300 font-[var(--font-poppins)] ${
                            isPopular
                              ? "bg-tp-red text-white hover:bg-tp-red-dark"
                              : "bg-tp-red text-white hover:bg-tp-red-dark"
                          }`}
                        >
                          <FaCalendarDays /> Book Now
                        </a>
                      </>
                    ) : (
                      <p className="text-sm text-[#888]">Not available for this service type</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-[#999] mt-8 font-[var(--font-poppins)]">
          Prices may vary based on location, material weight, and project specifics. Call for a personalized quote.
        </p>
      </div>
    </section>
  );
}
