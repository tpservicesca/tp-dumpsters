"use client";

import type { BookingData } from "./BookingWizard";

interface Props {
  booking: BookingData;
  updateBooking: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function AddressStep({ booking, updateBooking, onNext, onBack }: Props) {
  const canProceed =
    booking.address.trim() !== "" &&
    booking.city.trim() !== "" &&
    booking.zipCode.trim() !== "" &&
    booking.customerName.trim() !== "" &&
    booking.customerPhone.trim() !== "";

  return (
    <div>
      <h2 className="font-[var(--font-poppins)] text-2xl font-bold text-[#333] mb-2">
        Delivery address & contact
      </h2>
      <p className="text-sm text-[#888] mb-8 font-[var(--font-poppins)]">
        Where should we deliver the dumpster?
      </p>

      {/* Contact info */}
      <div className="mb-6">
        <h3 className="font-[var(--font-poppins)] font-semibold text-[#333] mb-3 text-sm">
          👤 Your information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
              Full name *
            </label>
            <input
              type="text"
              placeholder="John Smith"
              value={booking.customerName}
              onChange={(e) => updateBooking({ customerName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
              Phone number *
            </label>
            <input
              type="tel"
              placeholder="(510) 555-1234"
              value={booking.customerPhone}
              onChange={(e) => updateBooking({ customerPhone: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
              Email (optional — for confirmation)
            </label>
            <input
              type="email"
              placeholder="john@email.com"
              value={booking.customerEmail}
              onChange={(e) => updateBooking({ customerEmail: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="mb-6">
        <h3 className="font-[var(--font-poppins)] font-semibold text-[#333] mb-3 text-sm">
          📍 Delivery address
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
              Street address *
            </label>
            <input
              type="text"
              placeholder="123 Main Street"
              value={booking.address}
              onChange={(e) => updateBooking({ address: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
                City *
              </label>
              <input
                type="text"
                placeholder="Oakland"
                value={booking.city}
                onChange={(e) => updateBooking({ city: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
                ZIP code *
              </label>
              <input
                type="text"
                placeholder="94601"
                value={booking.zipCode}
                onChange={(e) => updateBooking({ zipCode: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
          Special instructions (optional)
        </label>
        <textarea
          placeholder="Driveway on the left side, gate code 1234, etc."
          value={booking.notes}
          onChange={(e) => updateBooking({ notes: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors resize-none"
        />
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-[var(--font-poppins)] font-semibold text-sm text-[#666] bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-8 py-3 rounded-lg font-[var(--font-poppins)] font-semibold text-base transition-all duration-200 ${
            canProceed
              ? "bg-tp-red text-white hover:bg-tp-red-dark shadow-md"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Next: Review & confirm →
        </button>
      </div>
    </div>
  );
}
