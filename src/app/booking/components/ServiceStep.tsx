"use client";

import { useState } from "react";
import { FaCalendarDays, FaRuler, FaWeightHanging, FaCalendarCheck } from "react-icons/fa6";
import type { BookingData, ServiceSelection } from "./BookingWizard";

interface Props {
  booking: BookingData;
  updateBooking: (updates: Partial<BookingData>) => void;
  onNext: () => void;
}

const SERVICES: ServiceSelection[] = [
  {
    serviceType: "General Debris",
    size: "10 Yard",
    basePrice: 600,
    baseDays: 7,
    weightLimit: "1 ton",
    dimensions: "12' L × 8' W × 2.5' H",
  },
  {
    serviceType: "General Debris",
    size: "20 Yard",
    basePrice: 650,
    baseDays: 7,
    weightLimit: "2 tons",
    dimensions: "16' L × 8' W × 4' H",
  },
  {
    serviceType: "General Debris",
    size: "30 Yard",
    basePrice: 700,
    baseDays: 7,
    weightLimit: "3 tons",
    dimensions: "16' L × 8' W × 6' H",
  },
  {
    serviceType: "Clean Soil",
    size: "10 Yard",
    basePrice: 600,
    baseDays: 3,
    weightLimit: "No weight limit",
    dimensions: "12' L × 8' W × 2.5' H",
  },
  {
    serviceType: "Clean Concrete",
    size: "10 Yard",
    basePrice: 600,
    baseDays: 3,
    weightLimit: "No weight limit",
    dimensions: "12' L × 8' W × 2.5' H",
  },
  {
    serviceType: "Mixed Materials",
    size: "10 Yard",
    basePrice: 750,
    baseDays: 3,
    weightLimit: "No weight limit",
    dimensions: "12' L × 8' W × 2.5' H",
  },
];

const SERVICE_TABS = [
  { type: "General Debris", icon: "🏗️", desc: "Home remodels, cleanouts, landscaping, light demolition, junk removal" },
  { type: "Clean Soil", icon: "🌱", desc: "Must be 95% pure. No rocks, grass, gravel, mesh, wood, or garbage." },
  { type: "Clean Concrete", icon: "🧱", desc: "Must be 95% pure. No rebar, no garbage." },
  { type: "Mixed Materials", icon: "🔀", desc: "Soil & concrete mix. Must be 95% pure." },
];

export default function ServiceStep({ booking, updateBooking, onNext }: Props) {
  const [activeTab, setActiveTab] = useState(
    booking.service?.serviceType || "General Debris"
  );

  const selectedKey = booking.service
    ? `${booking.service.serviceType}-${booking.service.size}`
    : null;

  const handleSelect = (service: ServiceSelection) => {
    updateBooking({ service, extraDays: 0 });
  };

  const activeTabInfo = SERVICE_TABS.find((t) => t.type === activeTab)!;
  const tabServices = SERVICES.filter((s) => s.serviceType === activeTab);

  return (
    <div>
      <h2 className="font-[var(--font-poppins)] text-2xl font-bold text-[#333] mb-2">
        Choose your service
      </h2>
      <p className="text-sm text-[#888] mb-6 font-[var(--font-poppins)]">
        Select the type of waste and dumpster size you need.
      </p>

      {/* Service type tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SERVICE_TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold font-[var(--font-poppins)] transition-all duration-200 ${
              activeTab === tab.type
                ? "bg-tp-red text-white shadow-md"
                : "bg-gray-100 text-[#555] hover:bg-gray-200"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.type}
          </button>
        ))}
      </div>

      {/* Service description */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
        <p className="font-[var(--font-poppins)] text-sm text-[#666]">
          <strong>{activeTabInfo.icon} {activeTabInfo.type}:</strong>{" "}
          {activeTabInfo.desc}
        </p>
      </div>

      {/* Size cards */}
      <div className={`grid grid-cols-1 ${tabServices.length > 1 ? "sm:grid-cols-3" : "sm:grid-cols-1 max-w-sm mx-auto"} gap-4 mb-6`}>
        {tabServices.map((service, idx) => {
          const key = `${service.serviceType}-${service.size}`;
          const isSelected = selectedKey === key;
          const isPopular = tabServices.length > 1 && idx === 1;

          return (
            <button
              key={key}
              onClick={() => handleSelect(service)}
              className={`relative rounded-2xl overflow-hidden text-left transition-all duration-300 ${
                isSelected
                  ? "bg-black text-white shadow-xl ring-2 ring-tp-red"
                  : isPopular
                  ? "bg-black text-white shadow-lg"
                  : "bg-white text-[#333] shadow-md hover:shadow-lg border border-gray-100"
              }`}
            >
              {/* Selected badge */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 bg-tp-red text-white text-xs font-bold text-center py-1 font-[var(--font-poppins)] uppercase tracking-wider">
                  ✓ Selected
                </div>
              )}
              {/* Popular badge */}
              {isPopular && !isSelected && (
                <div className="absolute top-0 left-0 right-0 bg-tp-gold text-black text-xs font-bold text-center py-1 font-[var(--font-poppins)] uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className={`p-6 ${isSelected || isPopular ? "pt-9" : ""}`}>
                <h3 className="font-[var(--font-poppins)] text-lg font-bold mb-1">
                  {service.size}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-1 mt-2">
                  <span className={`text-xs ${isSelected || isPopular ? "text-white/60" : "text-[#aaa]"}`}>
                    Starting at
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className={`font-[var(--font-oswald)] text-4xl font-bold ${isSelected ? "text-white" : isPopular ? "text-white" : "text-tp-red"}`}>
                    ${service.basePrice}
                  </span>
                </div>

                {/* Details */}
                <ul className={`space-y-2 text-sm ${isSelected || isPopular ? "text-white/80" : "text-[#666]"}`}>
                  <li className="flex items-center gap-2">
                    <FaRuler className="text-tp-green flex-shrink-0 text-xs" />
                    {service.dimensions}
                  </li>
                  <li className="flex items-center gap-2">
                    <FaWeightHanging className="text-tp-green flex-shrink-0 text-xs" />
                    {service.weightLimit}
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCalendarCheck className="text-tp-green flex-shrink-0 text-xs" />
                    {service.baseDays} days included
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-tp-green flex-shrink-0 text-xs">✓</span>
                    Delivery &amp; pickup included
                  </li>
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      {/* Extra fees note */}
      {activeTab === "General Debris" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
          <p className="font-[var(--font-poppins)] text-xs text-amber-800">
            ⚠️ Mattresses/appliances/tires: $20–$60 each (size dependent, special disposal)
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!booking.service}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-[var(--font-poppins)] font-semibold text-base transition-all duration-200 ${
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
