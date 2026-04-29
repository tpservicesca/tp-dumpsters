"use client";

import { useMemo } from "react";
import type { BookingData } from "./BookingWizard";

// Window start hours (Pacific time) — used for the 6h-advance-notice rule.
const DELIVERY_WINDOWS = [
  { id: "morning", emoji: "🌅", label: "Morning", time: "7:00 AM - 11:00 AM", startHour: 7 },
  { id: "midday", emoji: "☀️", label: "Midday", time: "11:00 AM - 3:00 PM", startHour: 11 },
  { id: "afternoon", emoji: "🌆", label: "Afternoon", time: "3:00 PM - 7:00 PM", startHour: 15 },
] as const;

const ADVANCE_NOTICE_HOURS = 6;

function getWindowLabel(windowId: string): string {
  const w = DELIVERY_WINDOWS.find((w) => w.id === windowId);
  return w ? `${w.label} (${w.time})` : "";
}

interface Props {
  booking: BookingData;
  updateBooking: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Returns YYYY-MM-DD using LOCAL time. toISOString() converts to UTC and
// rolls over to the next day for evening hours in PST, breaking min-date logic.
function localDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T12:00:00");
  date.setDate(date.getDate() + days);
  return localDateStr(date);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

// 0=Sunday in JS Date.getDay()
function isSunday(dateStr: string): boolean {
  return new Date(dateStr + "T12:00:00").getDay() === 0;
}

// Days TP Dumpsters is fully booked / blacked out. Add YYYY-MM-DD strings here
// when Asaí or Cristofer say the fleet is at capacity for that day. Remove
// them after the date passes.
const FULLY_BOOKED_DATES = new Set<string>([
  "2026-04-28", // Tue — fleet at capacity (per Cristofer 2026-04-28)
  "2026-04-29", // Wed — fleet at capacity (per Cristofer 2026-04-28)
  "2026-04-30", // Thu — fleet at capacity (per Cristofer 2026-04-28)
  "2026-05-01", // Fri — fleet at capacity (per Cristofer 2026-04-28); Saturday opens
]);

function isFullyBooked(dateStr: string): boolean {
  return FULLY_BOOKED_DATES.has(dateStr);
}

// Skip forward day-by-day until we land on a day that is neither Sunday nor
// fully-booked. Used when the user types/auto-selects a blocked date.
function nextAvailableDay(dateStr: string): string {
  let d = dateStr;
  for (let i = 0; i < 14; i++) {
    if (!isSunday(d) && !isFullyBooked(d)) return d;
    d = addDays(d, 1);
  }
  return d;
}

// True when `windowId` on `dateStr` is at least ADVANCE_NOTICE_HOURS in the
// future from now. Used to gate same-day windows when it's already too late.
function windowMeetsAdvanceNotice(dateStr: string, windowId: string): boolean {
  const w = DELIVERY_WINDOWS.find((x) => x.id === windowId);
  if (!w) return false;
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(w.startHour, 0, 0, 0);
  const ms = target.getTime() - Date.now();
  return ms >= ADVANCE_NOTICE_HOURS * 3600 * 1000;
}

export default function DateStep({ booking, updateBooking, onNext, onBack }: Props) {
  const baseDays = booking.service?.baseDays || 7;

  // Minimum delivery date = today (local time). Same-day allowed when there
  // is enough advance notice for at least one delivery window (see below).
  const minDeliveryDate = useMemo(() => localDateStr(new Date()), []);

  // Auto-calculated minimum pickup date
  const minPickupDate = booking.deliveryDate
    ? addDays(booking.deliveryDate, baseDays)
    : "";

  // Block Sundays. If user picks a Sunday, bump to the next day (Monday) and
  // surface a friendly message.
  const sundayWarning = booking.deliveryDate && isSunday(booking.deliveryDate);
  const fullyBookedWarning = booking.deliveryDate && isFullyBooked(booking.deliveryDate);

  // When delivery date changes, auto-set pickup to minimum and reset window.
  // If they picked a Sunday or a fully-booked day, jump to the next available.
  const handleDeliveryChange = (date: string) => {
    let chosen = date;
    if (chosen && (isSunday(chosen) || isFullyBooked(chosen))) {
      chosen = nextAvailableDay(addDays(chosen, 1));
    }
    const autoPickup = addDays(chosen, baseDays);
    const totalDays = baseDays;
    const extra = Math.max(0, totalDays - baseDays);
    updateBooking({
      deliveryDate: chosen,
      deliveryWindow: "",
      pickupDate: autoPickup,
      extraDays: extra,
    });
  };

  const handlePickupChange = (date: string) => {
    if (!booking.deliveryDate) return;
    let chosen = date;
    if (chosen && isSunday(chosen)) {
      chosen = addDays(chosen, 1);
    }
    const totalDays = daysBetween(booking.deliveryDate, chosen);
    const extra = Math.max(0, totalDays - baseDays);
    updateBooking({
      pickupDate: chosen,
      extraDays: extra,
    });
  };

  const totalDays = booking.deliveryDate && booking.pickupDate
    ? daysBetween(booking.deliveryDate, booking.pickupDate)
    : 0;

  const canProceed = booking.deliveryDate && booking.deliveryWindow && booking.pickupDate && totalDays >= baseDays;

  return (
    <div>
      <h2 className="font-[var(--font-poppins)] text-2xl font-bold text-[#333] mb-2">
        Choose your dates
      </h2>
      <p className="text-sm text-[#888] mb-4 font-[var(--font-poppins)]">
        {booking.service?.serviceType} — {booking.service?.size} includes{" "}
        <strong>{baseDays} days</strong> of rental.
      </p>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <p className="text-sm text-blue-800 font-[var(--font-poppins)]">
          ℹ️ <strong>Pickup date is set automatically</strong> based on your rental period ({baseDays} days).
          Need more time? You can select a later pickup date below — extra days are <strong>$49/day</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Delivery date */}
        <div>
          <label className="block text-sm font-semibold text-[#333] mb-2 font-[var(--font-poppins)]">
            📅 Delivery date
          </label>
          <input
            type="date"
            min={minDeliveryDate}
            value={booking.deliveryDate}
            onChange={(e) => handleDeliveryChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors"
          />
          {sundayWarning && (
            <p className="text-xs text-amber-700 mt-1.5">
              ⚠️ No delivery on Sundays — moved to the next available day.
            </p>
          )}
          {fullyBookedWarning && (
            <p className="text-xs text-amber-700 mt-1.5">
              ⚠️ Our fleet is fully booked that day — we moved you to the next available date.
            </p>
          )}
          {booking.deliveryDate && (
            <p className="text-xs text-[#888] mt-1.5">
              {formatDate(booking.deliveryDate)}
              {booking.deliveryWindow && (
                <span className="text-tp-red font-semibold ml-1">
                  — {getWindowLabel(booking.deliveryWindow)}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Pickup date */}
        <div>
          <label className="block text-sm font-semibold text-[#333] mb-2 font-[var(--font-poppins)]">
            📅 Pickup date
            <span className="text-xs text-green-600 font-normal ml-2">✓ Auto-set</span>
          </label>
          <input
            type="date"
            min={minPickupDate}
            value={booking.pickupDate}
            onChange={(e) => handlePickupChange(e.target.value)}
            disabled={!booking.deliveryDate}
            className={`w-full px-4 py-3 border-2 rounded-xl text-base font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors ${
              !booking.deliveryDate
                ? "border-gray-100 bg-gray-50 text-gray-300"
                : "border-gray-200 bg-white"
            }`}
          />
          {booking.pickupDate && (
            <p className="text-xs text-[#888] mt-1.5">
              {formatDate(booking.pickupDate)}
              {booking.extraDays > 0 && (
                <span className="text-amber-600 font-semibold ml-1">
                  (+{booking.extraDays} extra day{booking.extraDays > 1 ? "s" : ""} = +${booking.extraDays * booking.extraDayFee})
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Delivery window selector */}
      {booking.deliveryDate && (
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#333] mb-3 font-[var(--font-poppins)]">
            🕐 Choose a delivery time window
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DELIVERY_WINDOWS.map((w) => {
              const isSelected = booking.deliveryWindow === w.id;
              const meetsNotice = windowMeetsAdvanceNotice(booking.deliveryDate, w.id);
              const disabled = !meetsNotice;
              return (
                <button
                  key={w.id}
                  type="button"
                  disabled={disabled}
                  title={disabled ? `Need at least ${ADVANCE_NOTICE_HOURS} hours of advance notice` : undefined}
                  onClick={() => !disabled && updateBooking({ deliveryWindow: w.id })}
                  className={`flex flex-col items-center justify-center px-4 py-4 rounded-xl border-2 transition-all duration-200 font-[var(--font-poppins)] ${
                    disabled
                      ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
                      : isSelected
                      ? "border-tp-red bg-red-50 shadow-md cursor-pointer"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <span className="text-2xl mb-1">{w.emoji}</span>
                  <span className={`font-semibold text-sm ${disabled ? "text-gray-400" : isSelected ? "text-tp-red" : "text-[#333]"}`}>
                    {w.label}
                  </span>
                  <span className={`text-xs mt-0.5 ${disabled ? "text-gray-400" : isSelected ? "text-tp-red/70" : "text-[#888]"}`}>
                    {w.time}
                  </span>
                  {disabled && (
                    <span className="text-[10px] text-gray-400 mt-1">Too late today</span>
                  )}
                </button>
              );
            })}
          </div>
          {DELIVERY_WINDOWS.every((w) => !windowMeetsAdvanceNotice(booking.deliveryDate, w.id)) && (
            <p className="text-xs text-amber-700 mt-2">
              ⚠️ All delivery windows for this day need {ADVANCE_NOTICE_HOURS}+ hours of advance notice. Please choose a later date.
            </p>
          )}
        </div>
      )}

      {/* Pricing breakdown */}
      {booking.deliveryDate && booking.pickupDate && (
        <div className="bg-gray-50 rounded-xl p-5 mb-8">
          <h3 className="font-[var(--font-poppins)] font-semibold text-[#333] mb-3">
            📊 Price breakdown
          </h3>
          <div className="space-y-2 text-sm font-[var(--font-poppins)]">
            <div className="flex justify-between">
              <span className="text-[#666]">
                {booking.service?.serviceType} — {booking.service?.size}
              </span>
              <span className="font-semibold">${booking.service?.basePrice}</span>
            </div>
            <div className="flex justify-between text-[#888]">
              <span>Included rental: {baseDays} days</span>
              <span>Included</span>
            </div>
            {booking.extraDays > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>
                  Extra days: {booking.extraDays} × ${booking.extraDayFee}/day
                </span>
                <span className="font-semibold">
                  +${booking.extraDays * booking.extraDayFee}
                </span>
              </div>
            )}
            {booking.onlineDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>💰 Online booking discount (5%)</span>
                <span className="font-semibold">-${booking.onlineDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between">
              <span className="font-bold text-[#333] text-base">Total</span>
              <div className="text-right">
                {booking.onlineDiscount > 0 && (
                  <span className="text-sm text-[#999] line-through mr-2">${booking.subtotal}</span>
                )}
                <span className="font-bold text-tp-red text-xl font-[var(--font-oswald)]">
                  ${booking.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[#aaa] mt-3">
            Total rental: {totalDays} days. Extra weight charged at $125/ton (prorated).
          </p>
        </div>
      )}

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
          Next: Delivery address →
        </button>
      </div>
    </div>
  );
}
