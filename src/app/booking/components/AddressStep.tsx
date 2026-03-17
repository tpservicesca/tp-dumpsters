"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { BookingData } from "./BookingWizard";

interface Props {
  booking: BookingData;
  updateBooking: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ───────── Validation helpers ───────── */
function validateName(name: string): string | null {
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  if (!/^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s'-]+$/.test(name.trim()))
    return "Name contains invalid characters";
  return null;
}

function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "Phone must be at least 10 digits";
  if (digits.length > 15) return "Phone number is too long";
  return null;
}

function validateEmail(email: string): string | null {
  if (!email) return null; // optional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Please enter a valid email";
  return null;
}

function validateZip(zip: string): string | null {
  if (!/^\d{5}(-\d{4})?$/.test(zip)) return "Enter a valid ZIP code (e.g. 94601)";
  return null;
}

/* ───────── Format phone as user types ───────── */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/* ───────── Google Places types ───────── */
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: Record<string, unknown>
          ) => {
            addListener: (event: string, cb: () => void) => void;
            getPlace: () => {
              address_components?: Array<{
                long_name: string;
                short_name: string;
                types: string[];
              }>;
              formatted_address?: string;
            };
          };
        };
      };
    };
    initGooglePlaces?: () => void;
  }
}

const GOOGLE_MAPS_KEY = "AIzaSyBI6Vup5IKvfvlyvdhV_9nipF5FXaVnZ04";

export default function AddressStep({ booking, updateBooking, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const addressInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null);

  // Load Google Places script
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || typeof window === "undefined") return;
    if (document.getElementById("google-places-script")) return;

    const script = document.createElement("script");
    script.id = "google-places-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;

    window.initGooglePlaces = () => {
      if (addressInputRef.current && window.google) {
        initAutocomplete();
      }
    };

    document.head.appendChild(script);

    return () => {
      delete window.initGooglePlaces;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init autocomplete when Google loads
  const initAutocomplete = useCallback(() => {
    if (!addressInputRef.current || !window.google) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        componentRestrictions: { country: "us" },
        types: ["address"],
        fields: ["address_components", "formatted_address"],
      }
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.address_components) return;

      let street = "";
      let city = "";
      let zip = "";

      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes("street_number")) {
          street = component.long_name + " ";
        }
        if (types.includes("route")) {
          street += component.long_name;
        }
        if (types.includes("locality")) {
          city = component.long_name;
        }
        if (types.includes("postal_code")) {
          zip = component.long_name;
        }
      }

      updateBooking({
        address: street || place.formatted_address || "",
        city,
        zipCode: zip,
      });

      // Clear address errors
      setErrors((prev) => ({ ...prev, address: null, city: null, zipCode: null }));
    });
  }, [updateBooking]);

  // Re-init if Google is already loaded
  useEffect(() => {
    if (window.google && addressInputRef.current && !autocompleteRef.current) {
      initAutocomplete();
    }
  }, [initAutocomplete]);

  /* ───────── Validation on blur ───────── */
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    let error: string | null = null;
    switch (field) {
      case "customerName":
        error = validateName(booking.customerName);
        break;
      case "customerPhone":
        error = validatePhone(booking.customerPhone);
        break;
      case "customerEmail":
        error = validateEmail(booking.customerEmail);
        break;
      case "zipCode":
        error = validateZip(booking.zipCode);
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  /* ───────── Phone formatting ───────── */
  const handlePhoneChange = (value: string) => {
    updateBooking({ customerPhone: formatPhone(value) });
  };

  /* ───────── Can proceed? ───────── */
  const allValid =
    booking.address.trim() !== "" &&
    booking.city.trim() !== "" &&
    booking.zipCode.trim() !== "" &&
    booking.customerName.trim().length >= 2 &&
    booking.customerPhone.replace(/\D/g, "").length >= 10 &&
    !validateName(booking.customerName) &&
    !validatePhone(booking.customerPhone) &&
    !validateEmail(booking.customerEmail) &&
    !validateZip(booking.zipCode);

  const inputClass = (field: string, hasError: boolean) =>
    `w-full px-4 py-3 border-2 rounded-xl text-sm font-[var(--font-poppins)] focus:outline-none transition-colors ${
      hasError && touched[field]
        ? "border-red-400 bg-red-50 focus:border-red-500"
        : "border-gray-200 focus:border-tp-red"
    }`;

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
              onBlur={() => handleBlur("customerName")}
              className={inputClass("customerName", !!errors.customerName)}
            />
            {touched.customerName && errors.customerName && (
              <p className="text-xs text-red-500 mt-1 font-[var(--font-poppins)]">
                ⚠️ {errors.customerName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
              Phone number *
            </label>
            <input
              type="tel"
              placeholder="(510) 555-1234"
              value={booking.customerPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => handleBlur("customerPhone")}
              className={inputClass("customerPhone", !!errors.customerPhone)}
              maxLength={14}
            />
            {touched.customerPhone && errors.customerPhone && (
              <p className="text-xs text-red-500 mt-1 font-[var(--font-poppins)]">
                ⚠️ {errors.customerPhone}
              </p>
            )}
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
              onBlur={() => handleBlur("customerEmail")}
              className={inputClass("customerEmail", !!errors.customerEmail)}
            />
            {touched.customerEmail && errors.customerEmail && (
              <p className="text-xs text-red-500 mt-1 font-[var(--font-poppins)]">
                ⚠️ {errors.customerEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="mb-6">
        <h3 className="font-[var(--font-poppins)] font-semibold text-[#333] mb-3 text-sm">
          📍 Delivery address
          {GOOGLE_MAPS_KEY && (
            <span className="text-xs text-[#aaa] font-normal ml-2">
              — Start typing to search
            </span>
          )}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
              Street address *
            </label>
            <input
              ref={addressInputRef}
              type="text"
              placeholder={GOOGLE_MAPS_KEY ? "Start typing your address..." : "123 Main Street"}
              value={booking.address}
              onChange={(e) => updateBooking({ address: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors"
              autoComplete="off"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none transition-colors bg-gray-50"
                readOnly={!!GOOGLE_MAPS_KEY && booking.city !== ""}
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
                onBlur={() => handleBlur("zipCode")}
                className={inputClass("zipCode", !!errors.zipCode)}
                maxLength={10}
              />
              {touched.zipCode && errors.zipCode && (
                <p className="text-xs text-red-500 mt-1 font-[var(--font-poppins)]">
                  ⚠️ {errors.zipCode}
                </p>
              )}
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
          disabled={!allValid}
          className={`px-8 py-3 rounded-lg font-[var(--font-poppins)] font-semibold text-base transition-all duration-200 ${
            allValid
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
