"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const GOOGLE_MAPS_KEY = "AIzaSyBI6Vup5IKvfvlyvdhV_9nipF5FXaVnZ04";
const ACCESS_CODE = "Cantaritos1.";

interface SizeInfo { price: number; dims: string; weight: string; days: number }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceSizes = { [key: string]: SizeInfo };
interface ServiceDef { name: string; sizes: ServiceSizes }

const SERVICES: ServiceDef[] = [
  { name: "General Debris", sizes: {
    "10 Yard": { price: 599, dims: "12'L × 8'W × 2.5'H", weight: "1 ton", days: 7 },
    "20 Yard": { price: 649, dims: "16'L × 8'W × 4'H", weight: "2 tons", days: 7 },
    "30 Yard": { price: 749, dims: "16'L × 8'W × 6'H", weight: "3 tons", days: 7 },
  }},
  { name: "Clean Soil", sizes: {
    "10 Yard": { price: 599, dims: "12'L × 8'W × 2.5'H", weight: "No weight limit", days: 3 },
  }},
  { name: "Clean Concrete", sizes: {
    "10 Yard": { price: 599, dims: "12'L × 8'W × 2.5'H", weight: "No weight limit", days: 3 },
  }},
  { name: "Mixed Materials", sizes: {
    "10 Yard": { price: 749, dims: "12'L × 8'W × 2.5'H", weight: "No weight limit", days: 3 },
  }},
];

interface InvoiceResult {
  id: string;
  number: string;
  amount: number;
  url: string;
  pdf: string;
  customerName: string;
  customerEmail: string | null;
  serviceType: string;
  size: string;
  quantity: number;
  customerPhone: string | null;
  sentEmail: boolean;
  sentSms: boolean;
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
  const [size, setSize] = useState(Object.keys(SERVICES[0].sizes)[0]);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [notes, setNotes] = useState("");

  // Result
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [error, setError] = useState("");

  // Scheduling
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Zelle");
  const [scheduling, setScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  // Refs
  const deliveryRef = useRef<HTMLInputElement>(null);
  const billingRef = useRef<HTMLInputElement>(null);

  const [showPreview, setShowPreview] = useState(false);

  // Customer search autocomplete
  const [searchResults, setSearchResults] = useState<Array<{
    id: string; name: string; phone: string; email: string;
    address: string; city: string; zipCode: string;
    lastService: string; lastSize: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const WINDOWS = [
    { id: "morning", label: "🌅 Morning", time: "7:00 AM - 11:00 AM" },
    { id: "midday", label: "☀️ Midday", time: "11:00 AM - 3:00 PM" },
    { id: "afternoon", label: "🌆 Afternoon", time: "3:00 PM - 7:00 PM" },
  ];

  // Available sizes for selected service
  const currentService = SERVICES.find((s) => s.name === serviceType);
  const availableSizes = currentService ? Object.keys(currentService.sizes) : [];
  const currentSizeInfo: SizeInfo | null = currentService ? currentService.sizes[size] || null : null;
  const unitPrice = useCustomPrice && customPrice ? Number(customPrice) : (currentSizeInfo?.price || 0);
  const totalAmount = unitPrice * quantity;

  // Reset size when service changes
  useEffect(() => {
    if (!availableSizes.includes(size)) {
      setSize(availableSizes[0]);
    }
  }, [serviceType, availableSizes, size]);

  // Auto-calculate pickup date when delivery date changes
  useEffect(() => {
    if (!deliveryDate) return;
    const longServices = ["General Debris", "Household Clean Out", "Construction Debris", "Roofing", "Green Waste"];
    const daysToAdd = longServices.includes(serviceType) ? 7 : 3;
    const d = new Date(deliveryDate + "T12:00:00");
    d.setDate(d.getDate() + daysToAdd);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setPickupDate(`${yyyy}-${mm}-${dd}`);
  }, [deliveryDate, serviceType]);

  const handleSchedule = async () => {
    if (!deliveryDate || !deliveryWindow || !pickupDate) {
      setScheduleError("Please fill in delivery date, window, and pickup date");
      return;
    }
    setScheduling(true);
    setScheduleError("");

    try {
      const parts = deliveryAddress.split(",").map(s => s.trim());
      const city = parts.length >= 3 ? parts[parts.length - 2].replace(/\s*(CA|California)\s*/i, "").trim() : "";
      const zipMatch = deliveryAddress.match(/\b(\d{5})\b/);
      const zipCode = zipMatch ? zipMatch[1] : "";

      const res = await fetch("/api/manual-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-auth": "Cantaritos1.",
        },
        body: JSON.stringify({
          customerName,
          customerPhone: customerPhone ? `${phoneCode} ${customerPhone}` : "",
          customerEmail: customerEmail || "",
          serviceType,
          dumpsterSize: size.replace(" Yard", ""),
          address: deliveryAddress,
          city,
          zipCode,
          deliveryDate,
          deliveryWindow,
          pickupDate,
          totalPrice: totalAmount,
          paymentMethod,
          notes: notes || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule booking");
      setScheduled(true);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setScheduling(false);
    }
  };

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

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`, {
        headers: { "x-dashboard-auth": "Cantaritos1." },
      });
      const data = await res.json();
      setSearchResults(data.customers || []);
      setShowSuggestions(data.customers?.length > 0);
    } catch {
      setSearchResults([]);
    }
  };

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
    setSize(Object.keys(SERVICES[0].sizes)[0]);
    setQuantity(1);
    setCustomPrice("");
    setUseCustomPrice(false);
    setNotes("");
    setResult(null);
    setError("");
    setDeliveryDate("");
    setDeliveryWindow("");
    setPickupDate("");
    setPaymentMethod("Zelle");
    setScheduling(false);
    setScheduled(false);
    setScheduleError("");
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
            <p className="text-sm text-[#888] font-[var(--font-poppins)] mb-3">
              {result.serviceType} — {result.size} {result.quantity > 1 ? `x${result.quantity}` : ""}
            </p>
            <div className="space-y-2 mb-6">
              {result.sentEmail ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <p className="text-xs text-green-700 font-[var(--font-poppins)]">
                    📧 Invoice sent to <strong>{result.customerEmail}</strong>
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <p className="text-xs text-amber-700 font-[var(--font-poppins)]">
                    📧 No email — send payment link manually
                  </p>
                </div>
              )}
              {result.sentSms ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <p className="text-xs text-green-700 font-[var(--font-poppins)]">
                    📱 SMS sent to <strong>{result.customerPhone}</strong>
                  </p>
                </div>
              ) : result.customerPhone ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <p className="text-xs text-amber-700 font-[var(--font-poppins)]">
                    📱 SMS failed — send payment link manually
                  </p>
                </div>
              ) : null}
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-5 mb-6">
              <p className="text-white/60 text-xs font-[var(--font-poppins)]">{result.customerName}</p>
              <p className="font-[var(--font-oswald)] text-3xl font-bold text-white mt-1">
                ${result.amount.toFixed(2)}
              </p>
              <p className="text-white/40 text-xs mt-1">Invoice {result.number}</p>
            </div>

            {/* PDF Invoice - PRIMARY (send to customer) */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#555] mb-1 text-left font-[var(--font-poppins)]">
                📄 PDF Invoice — Send this to the customer
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.pdf}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-[var(--font-poppins)] bg-gray-50"
                />
                <button
                  onClick={() => copyToClipboard(result.pdf)}
                  className="px-4 py-2 bg-tp-red text-white rounded-lg text-xs font-semibold hover:bg-tp-red-dark transition-colors"
                >
                  Copy
                </button>
                <a
                  href={result.pdf}
                  target="_blank"
                  className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-xs font-semibold hover:bg-[#333] transition-colors"
                >
                  Open
                </a>
              </div>
            </div>

            {/* Online Payment link - secondary */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#555] mb-1 text-left font-[var(--font-poppins)]">
                🔗 Online Payment Page (alternate)
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
                  className="px-4 py-2 bg-gray-200 text-[#333] rounded-lg text-xs font-semibold hover:bg-gray-300 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full bg-gray-100 text-[#333] py-3 rounded-xl font-semibold font-[var(--font-poppins)] hover:bg-gray-200 transition-colors"
            >
              + Create Another Quote
            </button>
          </div>

          {/* Schedule Booking Section */}
          {scheduled ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mt-6 text-center">
              <span className="text-4xl">📅</span>
              <h3 className="font-bold text-lg text-green-800 mt-2 font-[var(--font-poppins)]">Booking Scheduled!</h3>
              <p className="text-sm text-green-600 font-[var(--font-poppins)] mt-1">
                Delivery: {new Date(deliveryDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — {WINDOWS.find(w => w.id === deliveryWindow)?.time || deliveryWindow}
              </p>
              <p className="text-sm text-green-600 font-[var(--font-poppins)]">
                Pickup: {new Date(pickupDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <p className="text-xs text-green-500 mt-2 font-[var(--font-poppins)]">Events created in Google Calendar ✅</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📅</span>
                </div>
                <div>
                  <h3 className="font-[var(--font-poppins)] font-bold text-lg text-[#333]">Schedule Booking</h3>
                  <p className="text-xs text-[#999] font-[var(--font-poppins)]">Create calendar events for delivery &amp; pickup</p>
                </div>
              </div>

              {/* Delivery Date */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
                  📦 Delivery Date *
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none"
                />
              </div>

              {/* Delivery Window */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#555] mb-2 font-[var(--font-poppins)]">
                  🕐 Delivery Window *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {WINDOWS.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setDeliveryWindow(w.id)}
                      className={`py-3 px-2 rounded-xl border-2 text-center transition-all ${
                        deliveryWindow === w.id
                          ? "border-tp-red bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-sm font-semibold font-[var(--font-poppins)]">{w.label}</span>
                      <span className="block text-[10px] text-[#999] font-[var(--font-poppins)]">{w.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pickup Date */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
                  🚛 Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none"
                />
                {deliveryDate && (
                  <p className="text-[10px] text-[#bbb] mt-1 font-[var(--font-poppins)]">
                    Auto-calculated based on service type
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#555] mb-1 font-[var(--font-poppins)]">
                  💳 Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none bg-white"
                >
                  <option value="Zelle">Zelle</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Stripe Invoice">Stripe Invoice</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Schedule Error */}
              {scheduleError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-red-700 font-[var(--font-poppins)]">❌ {scheduleError}</p>
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleSchedule}
                disabled={scheduling || !deliveryDate || !deliveryWindow}
                className={`w-full py-4 rounded-xl font-[var(--font-poppins)] font-bold text-base transition-all duration-200 ${
                  scheduling || !deliveryDate || !deliveryWindow
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {scheduling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Scheduling...
                  </span>
                ) : (
                  "✅ Confirm & Schedule"
                )}
              </button>
            </div>
          )}
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
            <div className="relative">
              <input
                type="text"
                placeholder="Customer name *"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (searchTimeout) clearTimeout(searchTimeout);
                  const t = setTimeout(() => searchCustomers(e.target.value), 300);
                  setSearchTimeout(t);
                }}
                onFocus={() => { if (searchResults.length > 0) setShowSuggestions(true); }}
                onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none"
              />
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-tp-red rounded-xl shadow-2xl z-50 max-h-[300px] overflow-y-auto">
                  {searchResults.map((customer, i) => (
                    <button
                      key={`${customer.id}-${i}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCustomerName(customer.name);
                        if (customer.phone) {
                          const digits = customer.phone.replace(/\D/g, "");
                          if (digits.startsWith("52")) {
                            setPhoneCode("+52");
                            setCustomerPhone(digits.slice(2));
                          } else if (digits.startsWith("1")) {
                            setPhoneCode("+1");
                            setCustomerPhone(digits.slice(1));
                          } else {
                            setCustomerPhone(digits.slice(-10));
                          }
                        }
                        if (customer.email) setCustomerEmail(customer.email);
                        if (customer.address) setDeliveryAddress(customer.address);
                        setShowSuggestions(false);
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-tp-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-tp-red text-sm font-bold">{customer.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-[var(--font-poppins)] font-semibold text-sm text-[#333] truncate">{customer.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-[#999] font-[var(--font-poppins)]">
                            {customer.phone && <span>📱 {customer.phone}</span>}
                            {customer.lastService && <span>• 🗑️ {customer.lastService}</span>}
                          </div>
                          {customer.address && (
                            <p className="text-[10px] text-[#bbb] font-[var(--font-poppins)] truncate">📍 {customer.address}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
            <div className="sm:col-span-2">
              <input
                type="email"
                placeholder="Email — invoice will be sent automatically"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-[var(--font-poppins)] focus:border-tp-red focus:outline-none"
              />
              <p className="text-[10px] text-green-600 mt-1 font-[var(--font-poppins)]">
                📧 If provided, the invoice is sent to the customer automatically
              </p>
            </div>
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

          {/* Preview */}
          {showPreview && currentSizeInfo && (
            <div className="bg-[#1a1a1a] rounded-xl p-5 mb-6 text-white">
              <h3 className="font-[var(--font-poppins)] font-semibold text-xs uppercase tracking-wider text-white/50 mb-3">
                📋 Invoice Preview
              </h3>
              <div className="space-y-2 text-sm font-[var(--font-poppins)]">
                <div className="flex justify-between">
                  <span className="text-white/70">Customer</span>
                  <span className="font-semibold">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Delivery</span>
                  <span className="text-xs text-right max-w-[60%]">{deliveryAddress}</span>
                </div>
                {showBilling && billingAddress && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Billing</span>
                    <span className="text-xs text-right max-w-[60%]">{billingAddress}</span>
                  </div>
                )}
                <div className="border-t border-white/10 my-2" />
                <div className="flex justify-between">
                  <span className="text-white/70">Service</span>
                  <span>{serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Size</span>
                  <span>{size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Dimensions</span>
                  <span>{currentSizeInfo.dims}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Weight limit</span>
                  <span>{currentSizeInfo.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Rental period</span>
                  <span>{currentSizeInfo.days} days</span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Quantity</span>
                    <span>{quantity} units</span>
                  </div>
                )}
                <div className="border-t border-white/10 my-2" />
                <div className="flex justify-between">
                  <span className="text-white/70">Unit price</span>
                  <span>${unitPrice.toFixed(2)}{useCustomPrice ? " (custom)" : ""}</span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between text-white/50 text-xs">
                    <span>${unitPrice.toFixed(2)} × {quantity}</span>
                    <span></span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-white/20">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-[var(--font-oswald)] text-2xl font-bold text-tp-red">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              {customerEmail && (
                <p className="text-[10px] text-green-400 mt-3">📧 Will be sent to: {customerEmail}</p>
              )}
              {customerPhone && (
                <p className="text-[10px] text-green-400 mt-1">📱 SMS to: {phoneCode} {customerPhone}</p>
              )}
            </div>
          )}

          {/* Buttons */}
          {!showPreview ? (
            <button
              onClick={() => {
                if (!customerName.trim() || !deliveryAddress.trim()) {
                  setError("Customer name and delivery address are required");
                  return;
                }
                setError("");
                setShowPreview(true);
              }}
              disabled={!customerName.trim() || !deliveryAddress.trim()}
              className={`w-full py-4 rounded-xl font-[var(--font-poppins)] font-bold text-base transition-all duration-200 ${
                !customerName.trim() || !deliveryAddress.trim()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#1a1a1a] text-white hover:bg-[#333] shadow-lg hover:shadow-xl"
              }`}
            >
              👁️ Preview Invoice
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-4 rounded-xl font-[var(--font-poppins)] font-semibold text-sm bg-gray-100 text-[#666] hover:bg-gray-200 transition-colors"
              >
                ← Edit
              </button>
              <button
                onClick={() => { setShowPreview(false); handleSubmit(); }}
                disabled={loading}
                className={`flex-[2] py-4 rounded-xl font-[var(--font-poppins)] font-bold text-base transition-all duration-200 ${
                  loading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-tp-red text-white hover:bg-tp-red-dark shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Creating...
                  </span>
                ) : (
                  "⚡ Confirm & Create Invoice"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
