"use client";

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

const SERVICE_ICONS: Record<string, string> = {
  "General Debris": "🏗️",
  "Clean Soil": "🌱",
  "Clean Concrete": "🧱",
  "Mixed Materials": "🔀",
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "General Debris": "Home remodels, cleanouts, landscaping, light demolition, junk removal",
  "Clean Soil": "Must be 95% pure. No rocks, grass, gravel, mesh, wood, or garbage.",
  "Clean Concrete": "Must be 95% pure. No rebar, no garbage.",
  "Mixed Materials": "Soil & concrete mix. Must be 95% pure.",
};

export default function ServiceStep({ booking, updateBooking, onNext }: Props) {
  const selectedKey = booking.service
    ? `${booking.service.serviceType}-${booking.service.size}`
    : null;

  const handleSelect = (service: ServiceSelection) => {
    updateBooking({ service, extraDays: 0 });
  };

  // Group services by type
  const serviceTypes = [...new Set(SERVICES.map((s) => s.serviceType))];

  return (
    <div>
      <h2 className="font-[var(--font-poppins)] text-2xl font-bold text-[#333] mb-2">
        Choose your service
      </h2>
      <p className="text-sm text-[#888] mb-8 font-[var(--font-poppins)]">
        Select the type of waste and dumpster size you need.
      </p>

      {serviceTypes.map((type) => (
        <div key={type} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{SERVICE_ICONS[type]}</span>
            <h3 className="font-[var(--font-poppins)] text-lg font-semibold text-[#333]">
              {type}
            </h3>
          </div>
          <p className="text-xs text-[#888] mb-3 font-[var(--font-poppins)]">
            {SERVICE_DESCRIPTIONS[type]}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SERVICES.filter((s) => s.serviceType === type).map((service) => {
              const key = `${service.serviceType}-${service.size}`;
              const isSelected = selectedKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelect(service)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-tp-red bg-red-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-tp-red/50 hover:shadow-sm"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-tp-red rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <div className="font-[var(--font-poppins)] font-bold text-lg text-[#333]">
                    {service.size}
                  </div>
                  <div className="font-[var(--font-oswald)] text-2xl font-bold text-tp-red mt-1">
                    ${service.basePrice}
                  </div>
                  <div className="text-xs text-[#888] mt-2 space-y-0.5">
                    <div>📐 {service.dimensions}</div>
                    <div>⚖️ {service.weightLimit}</div>
                    <div>📅 {service.baseDays} days included</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-end mt-6">
        <button
          onClick={onNext}
          disabled={!booking.service}
          className={`px-8 py-3 rounded-lg font-[var(--font-poppins)] font-semibold text-base transition-all duration-200 ${
            booking.service
              ? "bg-tp-red text-white hover:bg-tp-red-dark shadow-md"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Next: Choose dates →
        </button>
      </div>
    </div>
  );
}
