"use client";

import { useState, useEffect, useCallback } from "react";

const AUTH_CODE = "Cantaritos1.";
const API = "/api/dashboard";

interface Dumpster {
  id: string;
  size: string;
  status: string;
  address?: string;
  city?: string;
  customer?: string;
  phone?: string;
  service_type?: string;
  delivery_date?: string;
  pickup_date?: string;
  notes?: string;
}

type JobType = "delivery" | "pickup";

interface Job {
  dumpster: Dumpster;
  type: JobType;
}

export default function DriverApp() {
  const [code, setCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API, {
        headers: { "x-dashboard-auth": AUTH_CODE },
      });
      const data = await res.json();
      if (data.dumpsters) {
        const todayJobs: Job[] = [];

        data.dumpsters.forEach((d: Dumpster) => {
          // ALL en-route dumpsters = deliveries (regardless of date)
          if (d.status === "en-route") {
            todayJobs.push({ dumpster: d, type: "delivery" });
          }
          // ALL pickup-scheduled dumpsters = pickups (regardless of date)
          if (d.status === "pickup-scheduled") {
            todayJobs.push({ dumpster: d, type: "pickup" });
          }
        });

        // Sort: en-route first, then pickup-scheduled
        todayJobs.sort((a, b) => {
          const priority: Record<string, number> = { "en-route": 0, "pickup-scheduled": 1 };
          return (priority[a.dumpster.status] || 9) - (priority[b.dumpster.status] || 9);
        });

        setJobs(todayJobs);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [authenticated, fetchData]);

  const getGPS = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsStatus("❌ GPS no disponible");
        resolve(null);
        return;
      }
      setGpsStatus("📡 Obteniendo ubicación...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatus("✅ GPS capturado");
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          setGpsStatus("⚠️ Sin GPS - " + err.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  };

  const handleAction = async (job: Job) => {
    const id = job.dumpster.id;
    setActionLoading(id);
    setGpsStatus("📡 Obteniendo ubicación...");

    try {
      const loc = await getGPS();
      const updates: Record<string, unknown> = {};

      if (job.type === "delivery") {
        updates.status = "deployed";
        if (loc) {
          updates.lat = loc.lat;
          updates.lng = loc.lng;
        }
      } else {
        updates.status = "yard";
        updates.lat = null;
        updates.lng = null;
        updates.customer = "";
        updates.address = "";
        updates.city = "";
        updates.phone = "";
      }

      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-auth": AUTH_CODE },
        body: JSON.stringify({ action: "update", id, ...updates }),
      });

      setSuccessId(id);
      setTimeout(() => {
        setSuccessId(null);
        setGpsStatus("");
        fetchData();
      }, 2000);
    } catch (err) {
      console.error("Action error:", err);
      setGpsStatus("❌ Error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogin = () => {
    if (code === AUTH_CODE) {
      setAuthenticated(true);
      setCodeError("");
    } else {
      setCodeError("Código incorrecto");
    }
  };

  // ── Login Screen ──
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">🚛</div>
          <h1 className="text-2xl font-bold text-white mb-2">TP Dumpsters</h1>
          <p className="text-gray-400 mb-6 text-lg">Driver App</p>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Código de acceso"
            className="w-full px-5 py-4 rounded-xl bg-gray-900 text-white text-center text-xl border border-gray-700 focus:border-red-500 outline-none mb-3"
          />
          {codeError && <p className="text-red-400 mb-3">{codeError}</p>}
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-red-600 text-white text-xl font-bold rounded-xl active:bg-red-700"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // ── Main Driver View ──
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 p-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚛</span>
            <div>
              <h1 className="text-lg font-bold">TP Dumpsters</h1>
              <p className="text-red-200 text-xs">
                {new Date().toLocaleDateString("es-MX", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-bold">
              {jobs.length} {jobs.length === 1 ? "servicio" : "servicios"}
            </div>
          </div>
        </div>
        {gpsStatus && (
          <div className="mt-2 text-center text-sm bg-black/30 rounded-lg py-1">{gpsStatus}</div>
        )}
      </div>

      {/* Jobs List */}
      <div className="p-4 space-y-4 pb-24">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-pulse">📦</div>
            <p className="text-gray-400 text-lg">Cargando servicios...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">¡Sin servicios!</h2>
            <p className="text-gray-400 text-lg">No hay entregas ni recolecciones pendientes hoy</p>
            <button
              onClick={fetchData}
              className="mt-6 px-8 py-3 bg-gray-800 rounded-xl text-gray-300 text-lg active:bg-gray-700"
            >
              🔄 Actualizar
            </button>
          </div>
        ) : (
          jobs.map((job) => {
            const d = job.dumpster;
            const isDelivery = job.type === "delivery";
            const isLoading = actionLoading === d.id;
            const isSuccess = successId === d.id;

            return (
              <div
                key={`${d.id}-${job.type}`}
                className={`rounded-2xl overflow-hidden border-2 transition-all ${
                  isSuccess
                    ? "border-green-500 bg-green-900/30"
                    : isDelivery
                    ? "border-blue-500/50 bg-gray-900"
                    : "border-orange-500/50 bg-gray-900"
                }`}
              >
                {/* Job Header */}
                <div className={`px-4 py-3 flex items-center justify-between ${
                  isDelivery ? "bg-blue-600/30" : "bg-orange-600/30"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{isDelivery ? "📦" : "🏗️"}</span>
                    <span className="font-bold text-lg">
                      {isDelivery ? "ENTREGA" : "RECOLECCIÓN"}
                    </span>
                  </div>
                  <span className="text-sm bg-white/10 px-3 py-1 rounded-full font-mono">
                    {d.id}
                  </span>
                </div>

                {/* Job Details */}
                <div className="p-4 space-y-3">
                  {/* Size Badge */}
                  <div className="flex gap-2">
                    <span className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xl">
                      {d.size} YD
                    </span>
                    {d.service_type && (
                      <span className="bg-gray-800 text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center">
                        {d.service_type}
                      </span>
                    )}
                  </div>

                  {/* Customer */}
                  {d.customer && (
                    <div className="flex items-center gap-2 text-lg">
                      <span>👤</span>
                      <span className="font-semibold">{d.customer}</span>
                    </div>
                  )}

                  {/* Address */}
                  {d.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(d.address + (d.city ? ", " + d.city : ""))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-blue-400 underline text-lg"
                    >
                      <span className="mt-0.5">📍</span>
                      <span>{d.address}{d.city ? `, ${d.city}` : ""}</span>
                    </a>
                  )}

                  {/* Phone - clickable to call */}
                  {d.phone && (
                    <a
                      href={`tel:${d.phone}`}
                      className="flex items-center gap-2 text-green-400 underline text-lg"
                    >
                      <span>📞</span>
                      <span>{d.phone}</span>
                    </a>
                  )}

                  {/* Notes */}
                  {d.notes && (
                    <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-3 text-yellow-200">
                      💬 {d.notes}
                    </div>
                  )}
                </div>

                {/* ACTION BUTTON */}
                {isSuccess ? (
                  <div className="p-4">
                    <div className="w-full py-5 bg-green-600 text-white text-center text-2xl font-bold rounded-xl">
                      ✅ ¡LISTO!
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <button
                      onClick={() => handleAction(job)}
                      disabled={isLoading}
                      className={`w-full py-5 text-white text-2xl font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50 ${
                        isDelivery
                          ? "bg-blue-600 active:bg-blue-700"
                          : "bg-orange-600 active:bg-orange-700"
                      }`}
                    >
                      {isLoading ? (
                        <span className="animate-pulse">📡 Guardando...</span>
                      ) : isDelivery ? (
                        "✅ ENTREGADO"
                      ) : (
                        "✅ RECOGIDO"
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Refresh Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-3 flex justify-center">
        <button
          onClick={fetchData}
          className="px-6 py-3 bg-gray-800 rounded-xl text-gray-300 font-semibold active:bg-gray-700 flex items-center gap-2"
        >
          🔄 Actualizar
        </button>
      </div>
    </div>
  );
}
