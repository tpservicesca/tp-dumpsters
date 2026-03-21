"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const GOOGLE_MAPS_KEY = "AIzaSyBI6Vup5IKvfvlyvdhV_9nipF5FXaVnZ04";
const ACCESS_CODE = "Cantaritos1.";

const SERVICES = [
  { name: "General Debris", sizes: ["10 Yard", "20 Yard", "30 Yard"] },
  { name: "Household Clean Out", sizes: ["10 Yard", "20 Yard", "30 Yard"] },
  { name: "Construction Debris", sizes: ["10 Yard", "20 Yard", "30 Yard"] },
  { name: "Roofing", sizes: ["10 Yard", "20 Yard", "30 Yard"] },
  { name: "Green Waste", sizes: ["10 Yard", "20 Yard", "30 Yard"] },
  { name: "Clean Soil", sizes: ["10 Yard"] },
  { name: "Clean Concrete", sizes: ["10 Yard"] },
  { name: "Mixed Materials", sizes: ["10 Yard"] },
];

interface InvoiceResult {
  id: string;
  number: string;
  amount: number;
  url: string;
  pdf: string;
  customerName: string;
  serviceType: string;
  size: string;
  quantity: number;
}

export default function QuoteForm() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("+1");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [showBilling, setShowBilling] = useState(false);
  const [serviceType, setServiceType] = useState(SERVICES[0].name);
  const [size, setSize] = useState(SERVICES[0].sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [notes, setNotes] = useState("");

  // Result
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [error, setError] = useState("");

  // Refs
  const deliveryRef = useRef<HTMLInputElement>(null);
  const billingRef = useRef<HTMLInputElement>(null);

  // Available sizes for selected service
  const currentService = SERVICES.find((s) => s.name === serviceType);
  const availableSizes = currentService?.sizes || [];

  // Reset size when service changes
  useEffect(() => {
    if (!availableSizes.includes(size)) {
      setSize(availableSizes[0]);
    }
  }, [serviceType, availableSizes, size]);

  // Load Google Places
  useEffect(() => {
    if (!authenticated || typeof window === "undefined") return;
    if (document.getElementById("gp-internal")) return;

    const script = document.createElement("script");
    script.id = "gp-internal";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=initGooglePlacesInternal`;
    script.async = true;
    window.initGooglePlacesInternal = () => initAutocompletes();
    document.head.appendChild(script);
    return () => { delete window.initGooglePlacesInternal; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const initAutocompletes = useCallback(() => {
    if (!window.google) return;

    const bayArea = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(37.1, -122.6),
      new window.google.maps.LatLng(38.5, -121.5)
    );

    if (deliveryRef.current) {
      const ac = new window.google.maps.places.Autocomplete(deliveryRef.current, {
        componentRestrictions: { country: "us" }, types: ["address"], bounds: bayArea, strictBounds: true,
      });
      ac.addListener("place_changed", () => {
        const p = ac.getPlace();
        if (p.formatted_address) setDeliveryAddress(p.formatted_address);
      });
    }

    if (billingRef.current) {
      const ac = new window.google.maps.places.Autocomplete(billingRef.current, {
        componentRestrictions: { country: "us" }, types: ["address"],
      });
      ac.addListener("place_changed", () => {
        const p = ac.getPlace();
        if (p.formatted_address) setBillingAddress(p.formatted_address);
      });
    }
  }, []);

  // Re-init billing autocomplete when shown
  useEffect(() => {
    if (showBilling && window.google && billingRef.current) {
      const ac = new window.google.maps.places.Autocomplete(billingRef.current, {
        componentRestrictions: { country: "us" }, types: ["address"],
      });
      ac.addListener("place_changed", () => {
        const p = ac.getPlace();
        if (p.formatted_address) setBillingAddress(p.formatted_address);
      });
    }
  }, [showBilling]);

  const handleSubmit = async () => {
    if (!customerName.trim() || !deliveryAddress.trim()) {
      setError("Customer name and delivery address are required");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() ? `${phoneCode} ${customerPhone.trim()}` : undefined,
          deliveryAddress: deliveryAddress.trim(),
          billingAddress: showBilling ? billingAddress.trim() : undefined,
          serviceType,
          size,
          quantity,
          customPrice: useCustomPrice ? Number(customPrice) : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setDeliveryAddress("");
    setBillingAddress("");
    setShowBilling(false);
    setServiceType(SERVICES[0].name);
    setSize(SERVICES[0].sizes[0]);
    setQuantity(1);
    setCustomPrice("");
    setUseCustomPrice(false);
    setNotes("");
    setResult(null);
    setError("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // ───────── ACCESS GATE ─────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <h1 className="font-[var(--font-oswald)] text-2xl font-bold text-center mb-1">🔒 INTERNAL</h1>
          <p className="text-xs text-[#999] text-center mb-6 font-[var(--font-poppins)]">TP Dumpsters Quote Generator</p>
          <input
            type="password"
            placeholder="Access code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (code === ACCESS_CODE) setAuthenticated(true);
                else setCodeError("Invalid code");
              }
            }}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none mb-3"
          />
          {codeError && <p className="text-xs text-red-500 mb-3 font-[var(--font-poppins)]">{codeError}</p>}
          <button
            onClick={() => { if (code === ACCESS_CODE) setAuthenticated(true); else setCodeError("Invalid code"); }}
            className="w-full bg-tp-red text-white py-3 rounded-xl font-semibold font-[var(--font-poppins)] hover:bg-tp-red-dark transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  // ───────── RESULT VIEW ─────────
  if (result) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] p-4 sm:p-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="font-[var(--font-oswald)] text-2xl font-bold mb-1">Invoice Created!</h2>
            <p className="text-sm text-[#888] font-[var(--font-poppins)] mb-6">
              {result.serviceType} — {result.size} {result.quantity > 1 ? `x${result.quantity}` : ""}
            </p>

            <div className="bg-[#1a1a1a] rounded-xl p-5 mb-6">
              <p className="text-white/60 text-xs font-[var(--font-poppins)]">{result.customerName}</p>
              <p className="font-[var(--font-oswald)] text-3xl font-bold text-white mt-1">
                ${result.amount.toFixed(2)}
              </p>
              <p className="text-white/40 text-xs mt-1">Invoice {result.number}</p>
            </div>

            {/* Payment link */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#555] mb-1 text-left font-[var(--font-poppins)]">
                🔗 Payment Link (send to customer)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.url}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-[var(--font-poppins)] bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(result.url)}
                  className="px-4 py-2 bg-tp-red text-white rounded-lg text-xs font-semibold hover:bg-tp-red-dark transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* PDF link */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#555] mb-1 text-left font-[var(--font-poppins)]">
                📄 PDF Invoice
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.pdf}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-[var(--font-poppins)] bg-gray-50"
                />
                <a
                  href={result.pdf}
                  target="_blank"
                  className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-xs font-semibold hover:bg-[#333] transition-colors"
                >
                  Open
                </a>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full bg-gray-100 text-[#333] py-3 rounded-xl font-semibold font-[var(--font-poppins)] hover:bg-gray-200 transition-colors"
            >
              + Create Another Quote
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ───────── FORM ─────────
  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-[#1a1a1a] rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-[var(--font-oswald)] text-xl font-bold text-white tracking-wider">
              TP DUMPSTERS
            </h1>
            <p className="text-[10px] text-white/40">Internal Quote Generator</p>
          </div>
          <span className="text-xs text-white/30 font-[var(--font-poppins)]">⚡ Quick Quote</span>
        </div>
        <div className="h-1 bg-tp-red" />

        <div className="bg-white rounded-b-2xl shadow-lg p-6 sm:p-8">
          {/* Customer info */}
          <h3 className="font-[var(--font-poppins)] font-semibold text-sm text-[#333] mb-3">👤 Customer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <input
              type="text"
              placeholder="Customer name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none"
            />
            <div className="flex gap-1">
              <select
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                className="w-20 px-2 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none bg-white"
              >
                <option value="+1">🇺🇸 +1</option>
                <option value="+52">🇲🇽 +52</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+34">🇪🇸 +34</option>
              </select>
              <input
                type="tel"
                placeholder="10 digits"
                value={customerPhone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setCustomerPhone(digits);
                }}
                maxLength={10}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none"
              />
            </div>
            <input
              type="email"
              placeholder="Email (optional)"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="sm:col-span-2 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none"
            />
          </div>

          {/* Delivery address */}
          <h3 className="font-[var(--font-poppins)] font-semibold text-sm text-[#333] mb-2">📍 Delivery Address *</h3>
          <input
            ref={deliveryRef}
            type="text"
            placeholder="Start typing address..."
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none mb-1"
            autoComplete="off"
          />
          <p className="text-[10px] text-[#bbb] mb-4 font-[var(--font-poppins)]">Bay Area service area</p>

          {/* Billing address */}
          {!showBilling ? (
            <button
              onClick={() => setShowBilling(true)}
              className="text-xs text-tp-red font-semibold font-[var(--font-poppins)] hover:underline mb-6 block"
            >
              + Add different billing address
            </button>
          ) : (
            <div className="mb-6">
              <h3 className="font-[var(--font-poppins)] font-semibold text-sm text-[#333] mb-2">💳 Billing Address</h3>
              <input
                ref={billingRef}
                type="text"
                placeholder="Start typing billing address..."
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none mb-1"
                autoComplete="off"
              />
              <button
                onClick={() => { setShowBilling(false); setBillingAddress(""); }}
                className="text-[10px] text-[#999] font-[var(--font-poppins)] hover:text-tp-red"
              >
                ✕ Remove billing address
              </button>
            </div>
          )}

          {/* Service & Size */}
          <h3 className="font-[var(--font-poppins)] font-semibold text-sm text-[#333] mb-3">🗑️ Service</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none bg-white"
            >
              {SERVICES.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none bg-white"
            >
              {availableSizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#666] font-[var(--font-poppins)] whitespace-nowrap">Qty:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none"
              />
            </div>
          </div>

          {/* Custom price toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={useCustomPrice}
                onChange={(e) => setUseCustomPrice(e.target.checked)}
                className="w-4 h-4 accent-tp-red"
              />
              <span className="text-xs text-[#666] font-[var(--font-poppins)]">Custom price (override default)</span>
            </label>
            {useCustomPrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#333]">$</span>
                <input
                  type="number"
                  placeholder="650"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-32 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none"
                />
                <span className="text-xs text-[#999]">per unit</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <textarea
            placeholder="Notes (optional) — delivery instructions, project details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none resize-none mb-6"
          />

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-700 font-[var(--font-poppins)]">❌ {error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !customerName.trim() || !deliveryAddress.trim()}
            className={`w-full py-4 rounded-xl font-[var(--font-poppins)] font-bold text-base transition-all duration-200 ${
              loading || !customerName.trim() || !deliveryAddress.trim()
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-tp-red text-white hover:bg-tp-red-dark shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Creating Invoice...
              </span>
            ) : (
              "⚡ Create Stripe Invoice"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
