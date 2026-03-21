"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const AUTH_CODE = "Cantaritos1.";
const GOOGLE_MAPS_KEY = "AIzaSyBI6Vup5IKvfvlyvdhV_9nipF5FXaVnZ04";

interface Dumpster {
  id: string;
  size: string;
  status: "yard" | "en-route" | "deployed" | "pickup-scheduled";
  address?: string;
  city?: string;
  customer?: string;
  phone?: string;
  serviceType?: string;
  deliveryDate?: string;
  pickupDate?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  updatedAt: string;
}

interface Stats {
  total: number;
  yard: number;
  enRoute: number;
  deployed: number;
  pickupScheduled: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  yard: { label: "In Yard", color: "#16a34a", bg: "#dcfce7", icon: "🏠" },
  "en-route": { label: "En Route", color: "#2563eb", bg: "#dbeafe", icon: "🚛" },
  deployed: { label: "Deployed", color: "#ea580c", bg: "#ffedd5", icon: "📍" },
  "pickup-scheduled": { label: "Pickup Scheduled", color: "#7c3aed", bg: "#ede9fe", icon: "📅" },
};

export default function DashboardApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [dumpsters, setDumpsters] = useState<Dumpster[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, yard: 0, enRoute: 0, deployed: 0, pickupScheduled: 0 });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDumpster, setEditDumpster] = useState<Dumpster | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard", {
        headers: { "x-dashboard-auth": AUTH_CODE },
      });
      const data = await res.json();
      setDumpsters(data.dumpsters || []);
      setStats(data.stats || { total: 0, yard: 0, enRoute: 0, deployed: 0, pickupScheduled: 0 });
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [authenticated, fetchData]);

  const handleLogin = () => {
    if (code === AUTH_CODE) {
      setAuthenticated(true);
      setCodeError("");
    } else {
      setCodeError("Código incorrecto");
    }
  };

  // Get current GPS position
  const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const updateDumpster = async (id: string, updates: Record<string, unknown>) => {
    try {
      // Auto-capture GPS when marking as deployed or en-route
      if (updates.status === "deployed" || updates.status === "en-route") {
        const loc = await getCurrentLocation();
        if (loc) {
          updates.lat = loc.lat;
          updates.lng = loc.lng;
        }
      }

      await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-auth": AUTH_CODE },
        body: JSON.stringify({ action: "update", id, ...updates }),
      });
      await fetchData();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const addDumpster = async (size: string, notes?: string) => {
    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-auth": AUTH_CODE },
        body: JSON.stringify({ action: "add", size, notes }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchData();
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Add error:", err);
    }
  };

  const deleteDumpster = async (id: string) => {
    if (!confirm(`Delete dumpster ${id}?`)) return;
    try {
      await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-auth": AUTH_CODE },
        body: JSON.stringify({ action: "delete", id }),
      });
      await fetchData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filtered = filter === "all" ? dumpsters : dumpsters.filter((d) => d.status === filter);

  // ── Login Screen ──────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-800 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🚛</div>
            <h1 className="text-2xl font-bold text-white">TP Dumpsters</h1>
            <p className="text-gray-400 text-sm">Fleet Dashboard</p>
          </div>
          <input
            type="password"
            placeholder="Access code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:border-red-500 mb-3"
          />
          {codeError && <p className="text-red-400 text-sm text-center mb-3">{codeError}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
          >
            Enter Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚛</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">TP Dumpsters</h1>
            <p className="text-xs text-gray-400">Fleet Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === "list" ? "map" : "list")}
            className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm transition"
          >
            {view === "list" ? "🗺️ Map" : "📋 List"}
          </button>
          <button
            onClick={async () => {
              if (!confirm("¿Sincronizar servicios de hoy desde Google Calendar?")) return;
              try {
                const res = await fetch("/api/calendar-sync", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-dashboard-auth": AUTH_CODE },
                  body: JSON.stringify({}),
                });
                const data = await res.json();
                const msgs = data.results?.map((r: { status: string }) => r.status).join("\n") || "No events";
                alert(`📅 Calendar Sync\n${data.events} events found\n\n${msgs}`);
                await fetchData();
              } catch (err) {
                alert("Error syncing calendar");
                console.error(err);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-bold transition"
          >
            📅 Sync
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-bold transition"
          >
            + Add
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4">
        <StatCard label="Total" value={stats.total} icon="📦" color="#6b7280" active={filter === "all"} onClick={() => setFilter("all")} />
        <StatCard label="In Yard" value={stats.yard} icon="🏠" color="#16a34a" active={filter === "yard"} onClick={() => setFilter("yard")} />
        <StatCard label="En Route" value={stats.enRoute} icon="🚛" color="#2563eb" active={filter === "en-route"} onClick={() => setFilter("en-route")} />
        <StatCard label="Deployed" value={stats.deployed} icon="📍" color="#ea580c" active={filter === "deployed"} onClick={() => setFilter("deployed")} />
        <StatCard label="Pickup" value={stats.pickupScheduled} icon="📅" color="#7c3aed" active={filter === "pickup-scheduled"} onClick={() => setFilter("pickup-scheduled")} />
      </div>

      {/* Content */}
      <div className="px-4 pb-20">
        {loading && dumpsters.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : dumpsters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-300 mb-2">No dumpsters yet</h2>
            <p className="text-gray-500 mb-6">Add your dumpster inventory to start tracking</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-bold transition"
            >
              + Add First Dumpster
            </button>
          </div>
        ) : view === "list" ? (
          <div className="space-y-3">
            {filtered.map((d) => (
              <DumpsterCard
                key={d.id}
                dumpster={d}
                onStatusChange={(status) => updateDumpster(d.id, { status })}
                onEdit={() => setEditDumpster(d)}
                onDelete={() => deleteDumpster(d.id)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-10">No dumpsters with this status</p>
            )}
          </div>
        ) : (
          <MapView dumpsters={filtered} apiKey={GOOGLE_MAPS_KEY} />
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && <AddDumpsterModal onAdd={addDumpster} onClose={() => setShowAddModal(false)} />}

      {/* Edit Modal */}
      {editDumpster && (
        <EditDumpsterModal
          dumpster={editDumpster}
          onSave={async (updates) => {
            await updateDumpster(editDumpster.id, updates);
            setEditDumpster(null);
          }}
          onClose={() => setEditDumpster(null)}
        />
      )}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, active, onClick }: {
  label: string; value: number; icon: string; color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-4 text-left transition border-2"
      style={{
        background: active ? `${color}15` : "#111827",
        borderColor: active ? color : "transparent",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </button>
  );
}

// ── Dumpster Card ────────────────────────────────────────────────────────
function DumpsterCard({ dumpster: d, onStatusChange, onEdit, onDelete }: {
  dumpster: Dumpster;
  onStatusChange: (status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.yard;
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold"
            style={{ background: cfg.bg, color: cfg.color }}>
            {d.size}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{d.id}</p>
            <p className="text-xs text-gray-400">{d.size}-yard dumpster</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-xs font-bold"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
          <button onClick={() => setShowActions(!showActions)} className="text-gray-400 hover:text-white text-lg px-1">⋮</button>
        </div>
      </div>

      {/* Details */}
      {(d.customer || d.address) && (
        <div className="px-4 py-2 text-sm space-y-1">
          {d.customer && <p className="text-gray-300">👤 {d.customer} {d.phone ? `• ${d.phone}` : ""}</p>}
          {d.address && <p className="text-gray-400">📍 {d.address}{d.city ? `, ${d.city}` : ""}</p>}
          {d.serviceType && <p className="text-gray-400">🗑️ {d.serviceType}</p>}
          {d.deliveryDate && <p className="text-gray-400">📦 Delivery: {d.deliveryDate}</p>}
          {d.pickupDate && <p className="text-gray-400">🔄 Pickup: {d.pickupDate}</p>}
          {d.lat && d.lng && <p className="text-green-400 text-xs">📡 GPS: {d.lat.toFixed(4)}, {d.lng.toFixed(4)}</p>}
          {d.notes && <p className="text-gray-500 italic">💬 {d.notes}</p>}
        </div>
      )}

      {/* Quick Status Buttons */}
      <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-gray-800">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          key !== d.status && (
            <button
              key={key}
              onClick={() => onStatusChange(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition hover:opacity-80"
              style={{ background: val.bg, color: val.color }}
            >
              {val.icon} {val.label}
            </button>
          )
        ))}
      </div>

      {/* Actions dropdown */}
      {showActions && (
        <div className="px-4 py-2 flex gap-2 border-t border-gray-800 bg-gray-800/50">
          <button onClick={onEdit} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold">✏️ Edit</button>
          <button onClick={onDelete} className="px-3 py-1.5 bg-red-800 hover:bg-red-900 rounded-lg text-xs font-bold">🗑️ Delete</button>
        </div>
      )}
    </div>
  );
}

// ── Add Dumpster Modal ───────────────────────────────────────────────────
function AddDumpsterModal({ onAdd, onClose }: { onAdd: (size: string, notes?: string) => void; onClose: () => void }) {
  const [size, setSize] = useState("10");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Add Dumpster to Inventory</h2>

        <label className="block text-sm text-gray-400 mb-1">Size</label>
        <div className="flex gap-2 mb-4">
          {["10", "20", "30"].map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`flex-1 py-3 rounded-lg font-bold text-lg transition ${
                size === s ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {s} yd
            </button>
          ))}
        </div>

        <label className="block text-sm text-gray-400 mb-1">Quantity</label>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 bg-gray-800 rounded-lg text-xl hover:bg-gray-700">−</button>
          <span className="text-2xl font-bold w-10 text-center">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-10 h-10 bg-gray-800 rounded-lg text-xl hover:bg-gray-700">+</button>
        </div>

        <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Blue dumpster, new"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white mb-6 focus:outline-none focus:border-red-500"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-bold transition">Cancel</button>
          <button
            onClick={() => {
              for (let i = 0; i < qty; i++) onAdd(size, notes || undefined);
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold transition"
          >
            Add {qty > 1 ? `${qty} Dumpsters` : "Dumpster"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Dumpster Modal ──────────────────────────────────────────────────
function EditDumpsterModal({ dumpster, onSave, onClose }: {
  dumpster: Dumpster;
  onSave: (updates: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [customer, setCustomer] = useState(dumpster.customer || "");
  const [phone, setPhone] = useState(dumpster.phone || "");
  const [address, setAddress] = useState(dumpster.address || "");
  const [city, setCity] = useState(dumpster.city || "");
  const [serviceType, setServiceType] = useState(dumpster.serviceType || "");
  const [deliveryDate, setDeliveryDate] = useState(dumpster.deliveryDate || "");
  const [pickupDate, setPickupDate] = useState(dumpster.pickupDate || "");
  const [notes, setNotes] = useState(dumpster.notes || "");

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Edit {dumpster.id}</h2>

        <div className="space-y-3">
          <Field label="Customer Name" value={customer} onChange={setCustomer} />
          <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
          <Field label="Address" value={address} onChange={setAddress} />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="Service Type" value={serviceType} onChange={setServiceType} placeholder="e.g. General Debris" />
          <Field label="Delivery Date" value={deliveryDate} onChange={setDeliveryDate} type="date" />
          <Field label="Pickup Date" value={pickupDate} onChange={setPickupDate} type="date" />
          <Field label="Notes" value={notes} onChange={setNotes} />
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-bold transition">Cancel</button>
          <button
            onClick={() => onSave({ customer, phone, address, city, serviceType: serviceType || undefined, deliveryDate: deliveryDate || undefined, pickupDate: pickupDate || undefined, notes: notes || undefined })}
            className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
      />
    </div>
  );
}

// ── Map View ─────────────────────────────────────────────────────────────
function MapView({ dumpsters, apiKey }: { dumpsters: Dumpster[]; apiKey: string }) {
  const withLocation = dumpsters.filter((d) => d.lat && d.lng);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (withLocation.length === 0) return;

    const initMap = () => {
      if (!mapRef.current || !(window as unknown as Record<string, unknown>).google) return;
      const g = (window as unknown as Record<string, unknown>).google as Record<string, unknown>;
      const maps = g.maps as Record<string, unknown>;
      const MapClass = maps.Map as new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
      const MarkerClass = maps.Marker as new (opts: Record<string, unknown>) => unknown;
      const InfoClass = maps.InfoWindow as new (opts: Record<string, unknown>) => { open: (map: unknown, marker: unknown) => void };

      const map = new MapClass(mapRef.current!, {
        center: { lat: withLocation[0].lat!, lng: withLocation[0].lng! },
        zoom: 11,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
        mapTypeControl: false,
        streetViewControl: false,
      });

      withLocation.forEach((d) => {
        const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.yard;
        const marker = new MarkerClass({
          position: { lat: d.lat!, lng: d.lng! },
          map,
          title: `${d.id} - ${d.size}yd`,
          icon: {
            path: (maps as Record<string, unknown>).SymbolPath ? ((maps as Record<string, Record<string, unknown>>).SymbolPath.CIRCLE as unknown) : 0,
            scale: 14,
            fillColor: cfg.color,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 3,
          },
          label: { text: d.size, color: "#fff", fontSize: "11px", fontWeight: "bold" },
        });

        const info = new InfoClass({
          content: `<div style="padding:8px;font-family:sans-serif;">
            <strong>${d.id}</strong> (${d.size}yd)<br/>
            <span style="color:${cfg.color};font-weight:bold;">${cfg.icon} ${cfg.label}</span><br/>
            ${d.customer ? `👤 ${d.customer}<br/>` : ""}
            ${d.address ? `📍 ${d.address}${d.city ? `, ${d.city}` : ""}<br/>` : ""}
            ${d.serviceType ? `🗑️ ${d.serviceType}<br/>` : ""}
          </div>`,
        });

        (marker as unknown as Record<string, (event: string, fn: () => void) => void>).addListener("click", () => {
          info.open(map, marker);
        });
      });

      setMapReady(true);
    };

    if ((window as unknown as Record<string, unknown>).google) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, [withLocation, apiKey]);

  if (withLocation.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 flex items-center justify-center" style={{ height: "60vh" }}>
        <div className="text-center">
          <div className="text-5xl mb-4">📍</div>
          <h3 className="text-lg font-bold text-gray-300 mb-2">GPS se activa automáticamente</h3>
          <p className="text-gray-500 max-w-sm">Cuando marques un dumpster como <strong className="text-blue-400">&quot;En Route&quot;</strong> o <strong className="text-orange-400">&quot;Deployed&quot;</strong> desde el teléfono, se captura la ubicación GPS automáticamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 relative" style={{ height: "60vh" }}>
      <div ref={mapRef} className="w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <p className="text-gray-400">Loading map...</p>
        </div>
      )}
    </div>
  );
}
