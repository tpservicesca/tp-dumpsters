"use client";

import { useState } from "react";
import ServiceStep from "./ServiceStep";
import DateStep from "./DateStep";
import AddressStep from "./AddressStep";
import SummaryStep from "./SummaryStep";
import ConfirmationStep from "./ConfirmationStep";

/* ───────── Types ───────── */
export interface ServiceSelection {
  serviceType: string;
  size: string;
  basePrice: number;
  baseDays: number;
  weightLimit: string;
  dimensions: string;
}

export interface BookingData {
  service: ServiceSelection | null;
  deliveryDate: string;
  pickupDate: string;
  extraDays: number;
  extraDayFee: number;
  totalPrice: number;
  address: string;
  city: string;
  zipCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  authorizedCharges: boolean;
}

const EXTRA_DAY_FEE = 30; // $30/day — confirm with business

const initialBooking: BookingData = {
  service: null,
  deliveryDate: "",
  pickupDate: "",
  extraDays: 0,
  extraDayFee: EXTRA_DAY_FEE,
  totalPrice: 0,
  address: "",
  city: "",
  zipCode: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  notes: "",
  authorizedCharges: false,
};

const STEPS = [
  { id: 1, label: "Service", icon: "🗑️" },
  { id: 2, label: "Dates", icon: "📅" },
  { id: 3, label: "Address", icon: "📍" },
  { id: 4, label: "Summary", icon: "📋" },
];

export default function BookingWizard() {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingData>(initialBooking);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const updateBooking = (updates: Partial<BookingData>) => {
    setBooking((prev) => {
      const updated = { ...prev, ...updates };
      // Recalculate total price
      if (updated.service) {
        updated.totalPrice =
          updated.service.basePrice + updated.extraDays * updated.extraDayFee;
      }
      return updated;
    });
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        alert("Error creating payment session. Please call us at (510) 650-2083.");
        setIsSubmitting(false);
      }
    } catch {
      alert("Error creating payment session. Please call us at (510) 650-2083.");
      setIsSubmitting(false);
    }
  };

  if (isConfirmed) {
    return <ConfirmationStep booking={booking} />;
  }

  return (
    <div className="w-[92%] sm:w-[85%] max-w-[900px] mx-auto py-10">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-10 px-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold transition-all duration-300 ${
                  step >= s.id
                    ? "bg-tp-red text-white shadow-lg"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {step > s.id ? "✓" : s.icon}
              </div>
              <span
                className={`text-[10px] sm:text-xs mt-1.5 font-[var(--font-poppins)] font-semibold ${
                  step >= s.id ? "text-tp-red" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                  step > s.id ? "bg-tp-red" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 min-h-[400px]">
        {step === 1 && (
          <ServiceStep
            booking={booking}
            updateBooking={updateBooking}
            onNext={nextStep}
          />
        )}
        {step === 2 && (
          <DateStep
            booking={booking}
            updateBooking={updateBooking}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {step === 3 && (
          <AddressStep
            booking={booking}
            updateBooking={updateBooking}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {step === 4 && (
          <SummaryStep
            booking={booking}
            onBack={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
