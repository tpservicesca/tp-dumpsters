"use client";

import { useState } from "react";
import { FaCalendarDays, FaRuler, FaWeightHanging, FaCalendarCheck } from "react-icons/fa6";
import type { BookingData, ServiceSelection } from "./BookingWizard";

interface Props {
  booking: BookingData;
  updateBooking: (updates: Partial<BookingData>) => void;
  onNext: () => void;
}

/* ───────── Data types ───────── */
interface SizeOption {
  size: string;
  price: number;
  dimensions: string;
  weightLimit: string;
  rentalDays: number;
}

interface ServiceCategory {
  service: string;
  icon: string;
  description: string;
  note?: string;
  sizes: SizeOption[];
}

/* ───────── Same pricing data as PricingTable ───────── */
const GENERAL_SIZES: SizeOption[] = [
  { size: "10 Yard", price: 600, dimensions: "12' L × 8' W × 2.5' H", weightLimit: "1 ton", rentalDays: 7 },
  { size: "20 Yard", price: 650, dimensions: "16' L × 8' W × 4' H", weightLimit: "2 tons", rentalDays: 7 },
  { size: "30 Yard", price: 700, dimensions: "16' L × 8' W × 6' H", weightLimit: "3 tons", rentalDays: 7 },
];

const services: ServiceCategory[] = [
  {
    service: "General Debris",
    icon: "🏗️",
    description: "Home remodels, furniture, junk, light demolition",
    note: "⚠️ Mattresses/appliances/tires: $20–$60 each (size dependent, special disposal)",
    sizes: GENERAL_SIZES,
  },
  {
    service: "Household Junk",
    icon: "🏠",
    description: "Garage cleanouts, furniture removal",
    note: "⚠️ Mattresses/appliances/tires: $20–$60 each (size dependent, special disposal)",
    sizes: GENERAL_SIZES,
  },
  {
    service: "Construction Debris",
    icon: "🔨",
    description: "Demolition, remodeling, construction waste",
    sizes: GENERAL_SIZES,
  },
  {
    service: "Roofing",
    icon: "🏚️",
    description: "Shingles, roofing tear-offs, heavy debris",
    sizes: GENERAL_SIZES.map((s) => ({ ...s, price: s.price + 60 })),
  },
  {
    service: "Yard Waste",
    icon: "🌿",
    description: "Landscaping, branches, leaves, yard cleanup",
    sizes: GENERAL_SIZES,
  },
  {
    service: "Mixed Materials",
    icon: "🔀",
    description: "Mixed loads of debris (NOT clean). May include combinations of materials.",
    sizes: [
      { size: "10 Yard", price: 750, dimensions: "12' L × 8' W × 2.5' H", weightLimit: "No weight limit", rentalDays: 3 },
    ],
  },
  {
    service: "Clean Soil / Concrete",
    icon: "🌱",
    description: "Must be 95% pure. No rocks, grass, gravel, mesh, wood, rebar, or garbage.",
    sizes: [
      { size: "10 Yard", price: 600, dimensions: "12' L × 8' W × 2.5' H", weightLimit: "No weight limit", rentalDays: 3 },
    ],
  },
  {
    service: "Brick",
    icon: "🧱",
    description: "Concrete, asphalt, bricks, heavy materials",
    sizes: [
      { size: "10 Yard", price: 750, dimensions: "12' L × 8' W × 2.5' H", weightLimit: "No weight limit", rentalDays: 3 },
    ],
  },
];

export default function ServiceStep({ booking, updateBooking, onNext }: Props) {
  const [activeServiceIdx, setActiveServiceIdx] = useState(() => {
    if (booking.service) {
      const idx = services.findIndex((s) => s.service === booking.service?.serviceType);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const activeService = services[activeServiceIdx];

  const selectedKey = booking.service
    ? `${booking.service.serviceType}-${booking.service.size}`
    : null;

  const handleSelect = (item: SizeOption) => {
    const service: ServiceSelection = {
      serviceType: activeService.service,
      size: item.size,
      basePrice: item.price,
      baseDays: item.rentalDays,
      weightLimit: item.weightLimit,
      dimensions: item.dimensions,
    };
    updateBooking({ service, extraDays: 0 });
  };

  return (
    <div>
      <h4 className="font-[var(--font-red-hat)] text-sm font-bold text-tp-gold uppercase tracking-[2px] mb-2">
        STEP 1
      </h4>
      <h2 className="font-[var(--font-poppins)] text-[26px] md:text-[32px] font-bold text-[#333] mb-3">
        Choose your dumpster
      </h2>
      <p className="font-[var(--font-poppins)] text-sm text-[#888] mb-8">
        Select the type of waste and dumpster size you need.
      </p>

      {/* Service type tabs — identical to PricingTable */}
      <div className="flex flex-wrap gap-2 mb-8">
        {services.map((svc, idx) => (
          <button
            key={svc.service}
            onClick={() => setActiveServiceIdx(idx)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold font-[var(--font-poppins)] transition-all duration-200 ${
              activeServiceIdx === idx
                ? "bg-tp-red text-white shadow-md"
                : "bg-white text-[#555] border border-[#ddd] hover:border-tp-red hover:text-tp-red"
            }`}
          >
            <span>{svc.icon}</span>
            {svc.service}
          </button>
        ))}
      </div>

      {/* Service description */}
      <div className="bg-white rounded-xl p-4 mb-8 border border-[#eee]">
        <p className="font-[var(--font-poppins)] text-sm text-[#666]">
          <strong>{activeService.icon} {activeService.service}:</strong>{" "}
          {activeService.description}
        </p>
        {activeService.note && (
          <p className="font-[var(--font-poppins)] text-xs text-[#999] mt-2">
            {activeService.note}
          </p>
        )}
      </div>

      {/* Price cards — identical to PricingTable but with select action */}
      <div className={`grid grid-cols-1 ${activeService.sizes.length > 1 ? "md:grid-cols-3" : "md:grid-cols-1 max-w-md mx-auto"} gap-6`}>
        {activeService.sizes.map((item, idx) => {
          const key = `${activeService.service}-${item.size}`;
          const isSelected = selectedKey === key;
          const isPopular = activeService.sizes.length > 1 && idx === 1;
          const isDark = isSelected || isPopular || activeService.sizes.length === 1;

          return (
            <button
              key={key}
              onClick={() => handleSelect(item)}
              className={`relative rounded-2xl overflow-hidden text-left transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "bg-black text-white shadow-xl ring-3 ring-tp-red md:scale-[1.03]"
                  : isPopular
                  ? "bg-black text-white shadow-xl md:scale-[1.03]"
                  : activeService.sizes.length === 1
                  ? "bg-black text-white shadow-xl"
                  : "bg-white text-[#333] shadow-md hover:shadow-lg"
              }`}
            >
              {/* Badge */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 bg-tp-red text-white text-xs font-bold text-center py-1.5 font-[var(--font-poppins)] uppercase tracking-wider">
                  ✓ Selected
                </div>
              )}
              {isPopular && !isSelected && (
                <div className="absolute top-0 left-0 right-0 bg-tp-red text-white text-xs font-bold text-center py-1.5 font-[var(--font-poppins)] uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className={`p-8 ${isSelected || isPopular ? "pt-12" : ""}`}>
                <h3 className="font-[var(--font-poppins)] text-xl font-bold mb-1">
                  {item.size}
                </h3>
                <p className={`text-sm mb-5 ${isDark ? "text-white/70" : "text-[#888]"}`}>
                  {activeService.service}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-xs ${isDark ? "text-white/60" : "text-[#aaa]"}`}>
                    Starting at
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`font-[var(--font-oswald)] text-5xl font-bold ${isDark ? "text-white" : "text-tp-red"}`}>
                    ${item.price}
                  </span>
                </div>

                {/* Details */}
                <ul className={`space-y-3 mb-8 text-sm ${isDark ? "text-white/80" : "text-[#666]"}`}>
                  <li className="flex items-center gap-3">
                    <FaRuler className="text-tp-green flex-shrink-0" />
                    {item.dimensions}
                  </li>
                  <li className="flex items-center gap-3">
                    <FaWeightHanging className="text-tp-green flex-shrink-0" />
                    {item.weightLimit}
                  </li>
                  <li className="flex items-center gap-3">
                    <FaCalendarCheck className="text-tp-green flex-shrink-0" />
                    {item.rentalDays} days rental included
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-tp-green flex-shrink-0">✓</span>
                    Delivery, pickup &amp; disposal included
                  </li>
                </ul>

                {/* Select button */}
                <div
                  className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-lg text-base font-semibold transition-colors duration-300 font-[var(--font-poppins)] ${
                    isSelected
                      ? "bg-tp-green text-white"
                      : "bg-tp-red text-white hover:bg-tp-red-dark"
                  }`}
                >
                  {isSelected ? "✓ Selected" : "Select"}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Extra fees note */}
      {activeService.note && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="font-[var(--font-poppins)] text-sm text-amber-800">
            {activeService.note}
          </p>
        </div>
      )}

      <p className="text-center text-xs text-[#999] mt-6 mb-8 font-[var(--font-poppins)]">
        Extra weight charged at $150/ton (prorated). Extra days: $30/day.
      </p>

      {/* Next button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!booking.service}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-lg font-[var(--font-poppins)] font-semibold text-base transition-all duration-200 ${
            booking.service
              ? "bg-tp-red text-white hover:bg-tp-red-dark shadow-md"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <FaCalendarDays /> Next: Choose dates →
        </button>
      </div>
    </div>
  );
}
