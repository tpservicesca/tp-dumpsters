"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);

  // Photo capture state
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<{ job: Job } | null>(null);
  const [photoCaptured, setPhotoCaptured] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PWA install prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setInstallPrompt(null);
  };

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch(API, {
        headers: { "x-dashboard-auth": AUTH_CODE },
      });
      const data = await res.json();
      if (data.dumpsters) {
        const todayJobs: Job[] = [];

        data.dumpsters.forEach((d: Dumpster) => {
          if (d.status === "en-route") {
            todayJobs.push({ dumpster: d, type: "delivery" });
          }
          if (d.status === "pickup-scheduled") {
            todayJobs.push({ dumpster: d, type: "pickup" });
          }
        });

        todayJobs.sort((a, b) => {
          const priority: Record<string, number> = { "en-route": 0, "pickup-scheduled": 1 };
          return (priority[a.dumpster.status] || 9) - (priority[b.dumpster.status] || 9);
        });

        setJobs(todayJobs);

        // Count completed today (deployed + yard status with today's date)
        const today = new Date().toISOString().slice(0, 10);
        const completed = data.dumpsters.filter((d: Dumpster) => {
          if (d.status === "deployed" && d.delivery_date) {
            return d.delivery_date.startsWith(today);
          }
          return false;
        }).length;
        setCompletedToday(completed);
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

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

  // Photo capture handlers
  const startPhotoCapture = (job: Job) => {
    setShowCamera({ job });
    setPhotoData(null);
    // Must click synchronously within user gesture for mobile browsers
    fileInputRef.current?.click();
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      // User cancelled camera - show option to proceed without photo
      // Don't reset showCamera, let them see the "proceed without photo" option
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoData(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const confirmAction = async () => {
    if (!showCamera) return;
    const job = showCamera.job;
    setShowCamera(null);
    setPhotoData(null);
    setPhotoCaptured(prev => new Set(prev).add(job.dumpster.id));
    await executeAction(job);
  };

  const retakePhoto = () => {
    setPhotoData(null);
    fileInputRef.current?.click();
  };

  const cancelPhoto = () => {
    setShowCamera(null);
    setPhotoData(null);
  };

  const executeAction = async (job: Job) => {
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
        // Add photo note
        const timestamp = new Date().toLocaleString("es-MX");
        updates.notes = job.dumpster.notes
          ? `${job.dumpster.notes} | 📸 Foto capturada ${timestamp}`
          : `📸 Foto capturada ${timestamp}`;
      } else {
        updates.status = "yard";
        updates.lat = null;
        updates.lng = null;
        updates.customer = "";
        updates.address = "";
        updates.city = "";
        updates.phone = "";
        updates.delivery_date = "";
        updates.pickup_date = "";
        updates.service_type = "";
        updates.notes = "";
      }

      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-dashboard-auth": AUTH_CODE },
        body: JSON.stringify({ action: "update", id, ...updates }),
      });

      // Send SMS notification (non-blocking)
      if (job.dumpster.phone) {
        fetch("/api/driver/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-dashboard-auth": AUTH_CODE },
          body: JSON.stringify({
            action: job.type === "delivery" ? "delivered" : "picked-up",
            customerName: job.dumpster.customer || "",
            customerPhone: job.dumpster.phone,
            dumpsterSize: job.dumpster.size,
            address: job.dumpster.address || "",
            city: job.dumpster.city || "",
          }),
        }).catch(() => {
          // SMS failure shouldn't block anything
        });
      }

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
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

  const deliveryCount = jobs.filter(j => j.type === "delivery").length;
  const pickupCount = jobs.filter(j => j.type === "pickup").length;

  // ── Main Driver View ──
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hidden camera input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoCapture}
      />

      {/* Photo preview modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="flex-1 flex items-center justify-center p-4">
            {photoData ? (
              <img src={photoData} alt="Preview" className="max-w-full max-h-[60vh] rounded-xl" />
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-gray-400 text-lg mb-2">Toma una foto del dumpster</p>
                <p className="text-gray-500 text-sm">O procede sin foto</p>
              </div>
            )}
          </div>
          <div className="p-4 space-y-3 pb-8">
            <button
              onClick={confirmAction}
              className="w-full py-5 bg-green-600 text-white text-2xl font-bold rounded-xl active:scale-95 transition-transform"
            >
              ✅ Confirmar {showCamera.job.type === "delivery" ? "Entrega" : "Recolección"}
            </button>
            {photoData ? (
              <button
                onClick={retakePhoto}
                className="w-full py-4 bg-gray-800 text-gray-300 text-lg rounded-xl active:bg-gray-700"
              >
                📸 Tomar otra foto
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-blue-600 text-white text-lg font-bold rounded-xl active:bg-blue-700"
              >
                📸 Abrir cámara
              </button>
            )}
            <button
              onClick={cancelPhoto}
              className="w-full py-4 bg-red-900 text-red-300 text-lg rounded-xl active:bg-red-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Install Banner */}
      {showInstallBanner && (
        <div className="bg-gradient-to-r from-green-700 to-green-600 p-3 flex items-center justify-between sticky top-0 z-[55]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📲</span>
            <span className="font-semibold text-sm">Instalar TP Driver en tu teléfono</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="bg-white text-green-700 px-4 py-2 rounded-lg font-bold text-sm active:bg-gray-100"
            >
              Instalar
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-white/70 text-xl px-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
            <p className="text-red-200 text-[10px] mt-1">
              Actualizado: {formatTime(lastRefresh)}
            </p>
          </div>
        </div>

        {/* Job counters */}
        {jobs.length > 0 && (
          <div className="flex gap-2 mt-2">
            <span className="bg-blue-600/50 px-3 py-1 rounded-full text-sm">
              📦 {deliveryCount} {deliveryCount === 1 ? "entrega" : "entregas"}
            </span>
            <span className="bg-orange-600/50 px-3 py-1 rounded-full text-sm">
              🏗️ {pickupCount} {pickupCount === 1 ? "recolección" : "recolecciones"}
            </span>
            {completedToday > 0 && (
              <span className="bg-green-600/50 px-3 py-1 rounded-full text-sm">
                ✅ {completedToday} {completedToday === 1 ? "completado" : "completados"}
              </span>
            )}
          </div>
        )}

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
            <p className="text-gray-400 text-lg">No hay entregas ni recolecciones pendientes</p>
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
            const hasPhoto = photoCaptured.has(d.id);

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
                  {/* Size Badge + Date */}
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xl">
                      {d.size} YD
                    </span>
                    {d.service_type && (
                      <span className="bg-gray-800 text-gray-300 px-3 py-2 rounded-xl text-sm flex items-center">
                        {d.service_type}
                      </span>
                    )}
                    {isDelivery && d.delivery_date && (
                      <span className="bg-blue-900/50 text-blue-300 px-3 py-2 rounded-xl text-sm flex items-center">
                        📅 {formatDate(d.delivery_date)}
                      </span>
                    )}
                    {!isDelivery && d.pickup_date && (
                      <span className="bg-orange-900/50 text-orange-300 px-3 py-2 rounded-xl text-sm flex items-center">
                        📅 {formatDate(d.pickup_date)}
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

                  {/* Navigation Buttons */}
                  {d.address && (
                    <div className="flex gap-2">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(d.address + (d.city ? ", " + d.city : ""))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-blue-400 py-3 rounded-xl text-lg font-semibold active:bg-gray-700"
                      >
                        🗺️ Ver Mapa
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.address + (d.city ? ", " + d.city : ""))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold active:bg-blue-800"
                      >
                        🧭 Navegar
                      </a>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTON */}
                {isSuccess ? (
                  <div className="p-4">
                    <div className="w-full py-5 bg-green-600 text-white text-center text-2xl font-bold rounded-xl">
                      ✅ ¡LISTO! {hasPhoto && "📸"}
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <button
                      onClick={() => startPhotoCapture(job)}
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
                        "📸 ENTREGADO"
                      ) : (
                        "📸 RECOGIDO"
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
          disabled={refreshing}
          className="px-6 py-3 bg-gray-800 rounded-xl text-gray-300 font-semibold active:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
        >
          {refreshing ? (
            <span className="animate-spin">🔄</span>
          ) : (
            "🔄"
          )}
          {refreshing ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
    </div>
  );
}
