"use client";

import { FaCalendarDays, FaPhone } from "react-icons/fa6";
import type { BookingData } from "./BookingWizard";

interface Props {
  booking: BookingData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SummaryStep({ booking, onBack, onSubmit, isSubmitting }: Props) {
  const baseDays = booking.service?.baseDays || 7;

  return (
    <div>
      <h2 className="font-[var(--font-poppins)] text-2xl font-bold text-[#333] mb-2">
        Review your booking
      </h2>
      <p className="text-sm text-[#888] mb-6 font-[var(--font-poppins)]">
        Please confirm all details are correct before submitting.
      </p>

      {/* Service summary */}
      <div className="bg-gray-50 rounded-xl p-5 mb-4">
        <h3 className="font-[var(--font-poppins)] font-semibold text-[#333] mb-3 text-sm uppercase tracking-wider">
          🗑️ Service
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm font-[var(--font-poppins)]">
          <span className="text-[#888]">Type:</span>
          <span className="font-semibold">{booking.service?.serviceType}</span>
          <span className="text-[#888]">Size:</span>
          <span className="font-semibold">{booking.service?.size}</span>
          <span className="text-[#888]">Dimensions:</span>
          <span>{booking.service?.dimensions}</span>
          <span className="text-[#888]">Weight limit:</span>
          <span>{booking.service?.weightLimit}</span>
        </div>
      </div>

      {/* Dates summary */}
      <div className="bg-gray-50 rounded-xl p-5 mb-4">
        <h3 className="font-[var(--font-poppins)] font-semibold text-[#333] mb-3 text-sm uppercase tracking-wider">
          📅 Dates
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm font-[var(--font-poppins)]">
          <span className="text-[#888]">Delivery:</span>
          <span className="font-semibold">{formatDate(booking.deliveryDate)}</span>
          <span className="text-[#888]">Pickup:</span>
          <span className="font-semibold">{formatDate(booking.pickupDate)}</span>
          <span className="text-[#888]">Included days:</span>
          <span>{baseDays} days</span>
          {booking.extraDays > 0 && (
            <>
              <span className="text-amber-600">Extra days:</span>
              <span className="text-amber-600 font-semibold">{booking.extraDays} days</span>
            </>
          )}
        </div>
      </div>

      {/* Address summary */}
      <div className="bg-gray-50 rounded-xl p-5 mb-4">
        <h3 className="font-[var(--font-poppins)] font-semibold text-[#333] mb-3 text-sm uppercase tracking-wider">
          📍 Delivery address
        </h3>
        <div className="text-sm font-[var(--font-poppins)]">
          <p className="font-semibold">{booking.customerName}</p>
          <p>{booking.address}</p>
          <p>{booking.city}, CA {booking.zipCode}</p>
          <p className="text-[#888] mt-1">{booking.customerPhone}</p>
          {booking.customerEmail && (
            <p className="text-[#888]">{booking.customerEmail}</p>
          )}
          {booking.notes && (
            <p className="text-[#888] mt-2 italic">Notes: {booking.notes}</p>
          )}
        </div>
      </div>

      {/* Price summary */}
      <div className="bg-black rounded-xl p-5 mb-6 text-white">
        <h3 className="font-[var(--font-poppins)] font-semibold mb-3 text-sm uppercase tracking-wider">
          💰 Price summary
        </h3>
        <div className="space-y-2 text-sm font-[var(--font-poppins)]">
          <div className="flex justify-between">
            <span className="text-white/70">
              {booking.service?.serviceType} — {booking.service?.size}
            </span>
            <span>${booking.service?.basePrice}</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>{baseDays} days included</span>
            <span>Included</span>
          </div>
          {booking.extraDays > 0 && (
            <div className="flex justify-between text-amber-400">
              <span>{booking.extraDays} extra days × ${booking.extraDayFee}/day</span>
              <span>+${booking.extraDays * booking.extraDayFee}</span>
            </div>
          )}
          <div className="border-t border-white/20 pt-3 mt-3 flex justify-between items-baseline">
            <span className="font-bold text-lg">Total</span>
            <span className="font-[var(--font-oswald)] text-3xl font-bold">
              ${booking.totalPrice}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-white/40 mt-3">
          Delivery, pickup & disposal included. Extra weight: $150/ton (prorated).
        </p>
      </div>

      {/* Terms */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-800 font-[var(--font-poppins)]">
          📋 <strong>Cancellation policy:</strong> Full refund if cancelled 24+ hours before delivery.
          Less than 24 hours: $150 fee. After dispatch: $300 fee.
          Mattresses, appliances & tires incur extra fees ($20–$60 each).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-[var(--font-poppins)] font-semibold text-sm text-[#666] bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          ← Back
        </button>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="tel:+15106502083"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-[var(--font-poppins)] font-semibold text-sm border-2 border-tp-red text-tp-red hover:bg-tp-red hover:text-white transition-colors"
          >
            <FaPhone /> Call to book
          </a>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-[var(--font-poppins)] font-bold text-base bg-tp-red text-white hover:bg-tp-red-dark shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            <FaCalendarDays />
            {isSubmitting ? "Submitting..." : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
