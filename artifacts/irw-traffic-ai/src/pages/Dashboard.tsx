import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  useGetTrafficOverview,
  useListTrafficSegments,
  useGetTrafficHotspots,
  useGetTrafficStats,
  getGetTrafficOverviewQueryKey,
  getListTrafficSegmentsQueryKey,
  getGetTrafficHotspotsQueryKey,
  getGetTrafficStatsQueryKey,
} from "@workspace/api-client-react";
import LevelBadge, { SeverityBadge } from "@/components/LevelBadge";

const REFETCH_INTERVAL = 30000;

const levelColor: Record<string, string> = {
  lancar: "#22c55e",
  sedang: "#eab308",
  padat: "#f97316",
  macet_total: "#ef4444",
};

const overallIcon: Record<string, string> = {
  lancar: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  sedang: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  padat: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  macet_total: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

function useTimeSince(iso: string | undefined) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!iso) return;
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  if (elapsed < 60) return `${elapsed} detik yang lalu`;
  return `${Math.floor(elapsed / 60)} menit yang lalu`;
}

export default function Dashboard() {
  const { data: overview, isLoading: ovLoading } = useGetTrafficOverview({
    query: { refetchInterval: REFETCH_INTERVAL, queryKey: getGetTrafficOverviewQueryKey() },
  });
  const { data: segments, isLoading: segLoading } = useListTrafficSegments({
    query: { refetchInterval: REFETCH_INTERVAL, queryKey: getListTrafficSegmentsQueryKey() },
  });
  const { data: hotspots } = useGetTrafficHotspots({
    query: { refetchInterval: REFETCH_INTERVAL, queryKey: getGetTrafficHotspotsQueryKey() },
  });
  const { data: stats } = useGetTrafficStats({
    query: { refetchInterval: REFETCH_INTERVAL, queryKey: getGetTrafficStatsQueryKey() },
  });

  const lastUpdated = useTimeSince(overview?.lastUpdated);

  const overallLevelColor: Record<string, string> = {
    lancar: "text-green-400",
    sedang: "text-yellow-400",
    padat: "text-orange-400",
    macet_total: "text-red-400",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-card flex-shrink-0">
        <div>
          <h1 className="text-sm font-bold text-foreground tracking-wide">Pemantauan Lalu Lintas</h1>
          <p className="text-[11px] text-muted-foreground">Kota Medan, Sumatera Utara</p>
        </div>
        <div className="flex items-center gap-4">
          {overview && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${overallLevelColor[overview.overallLevel] ?? "text-foreground"}`}>
                Status: {overview.overallLevel.replace("_", " ").toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-[11px] text-muted-foreground" data-testid="last-updated">
            Diperbarui: {ovLoading ? "memuat..." : lastUpdated}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Map area */}
        <div className="flex-1 relative overflow-hidden">
          <MapContainer
            center={[3.5952, 98.6722]}
            zoom={13}
            className="w-full h-full"
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Road segments */}
            {segments?.map((seg) => (
              <CircleMarker
                key={seg.id}
                center={[seg.lat, seg.lng]}
                radius={8}
                pathOptions={{
                  color: levelColor[seg.level] ?? "#94a3b8",
                  fillColor: levelColor[seg.level] ?? "#94a3b8",
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1" style={{ minWidth: 160 }}>
                    <div className="font-bold text-sm">{seg.name}</div>
                    <div className="text-gray-500">{seg.from} → {seg.to}</div>
                    <div>Kecepatan: <strong>{seg.speedKmh} km/h</strong></div>
                    {seg.delayMinutes > 0 && (
                      <div>Keterlambatan: <strong>{seg.delayMinutes} menit</strong></div>
                    )}
                    <LevelBadge level={seg.level as "lancar" | "sedang" | "padat" | "macet_total"} size="md" />
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Hotspot markers */}
            {hotspots?.map((h) => (
              <CircleMarker
                key={`hotspot-${h.id}`}
                center={[h.lat, h.lng]}
                radius={14}
                pathOptions={{
                  color: "#ef4444",
                  fillColor: "#ef4444",
                  fillOpacity: 0.25,
                  weight: 2,
                  dashArray: "4 3",
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1" style={{ minWidth: 180 }}>
                    <div className="font-bold text-sm">{h.location}</div>
                    <div className="text-gray-500">{h.description}</div>
                    <div>Est. Bersih: <strong>{h.estimatedClearTime}</strong></div>
                    <SeverityBadge severity={h.severity as "sedang" | "parah" | "sangat_parah"} />
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Map legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-2.5 z-[1000]">
            <div className="text-[10px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider">Level Kemacetan</div>
            {[
              { level: "lancar", label: "Lancar" },
              { level: "sedang", label: "Sedang" },
              { level: "padat", label: "Padat" },
              { level: "macet_total", label: "Macet Total" },
            ].map(({ level, label }) => (
              <div key={level} className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: levelColor[level] }} />
                <span className="text-[11px] text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <aside className="w-72 flex-shrink-0 border-l border-border flex flex-col overflow-hidden bg-card">
          {/* Stats */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">Statistik Lalu Lintas</div>
            {stats ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Lancar", value: `${stats.percentageLancar}%`, color: "text-green-400" },
                    { label: "Sedang", value: `${stats.percentageSedang}%`, color: "text-yellow-400" },
                    { label: "Padat", value: `${stats.percentagePadat}%`, color: "text-orange-400" },
                    { label: "Macet", value: `${stats.percentageMacet}%`, color: "text-red-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-background rounded p-2 text-center">
                      <div className={`text-base font-bold ${color}`}>{value}</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Rata-rata Kecepatan</span>
                    <span className="text-foreground font-medium">{stats.avgSpeedKmh} km/h</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Titik Terparah</span>
                    <span className="text-red-400 font-medium text-right max-w-32 leading-tight">{stats.worstArea}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Rute Terbaik</span>
                    <span className="text-green-400 font-medium text-right max-w-32 leading-tight">{stats.bestRoute}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Jam Puncak</span>
                    <span className="text-foreground font-medium">{stats.peakHour}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-5 bg-muted animate-pulse rounded" />
                ))}
              </div>
            )}
          </div>

          {/* Overview */}
          {overview && (
            <div className="px-4 py-3 border-b border-border">
              <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Ringkasan</div>
              <div className="flex items-start gap-2">
                <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${overallLevelColor[overview.overallLevel]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={overallIcon[overview.overallLevel] ?? overallIcon.sedang} />
                </svg>
                <p className="text-xs text-muted-foreground leading-relaxed">{overview.summary}</p>
              </div>
            </div>
          )}

          {/* Hotspots */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pt-3 pb-1">
              <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Titik Kemacetan Parah</div>
            </div>
            <div className="px-4 py-2 space-y-2">
              {hotspots ? hotspots.slice(0, 4).map((h) => (
                <div key={h.id} className="bg-background rounded-lg p-2.5 border border-border" data-testid={`hotspot-card-${h.id}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground leading-tight flex-1">{h.location}</span>
                    <SeverityBadge severity={h.severity as "sedang" | "parah" | "sangat_parah"} />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{h.description}</p>
                  <div className="text-[10px] text-primary mt-1">Estimasi bersih: {h.estimatedClearTime}</div>
                </div>
              )) : (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Segments list */}
          <div className="border-t border-border">
            <div className="px-4 pt-3 pb-1">
              <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Semua Ruas Jalan</div>
            </div>
            <div className="overflow-y-auto max-h-48 px-4 pb-3 space-y-1">
              {segLoading ? (
                <div className="h-4 bg-muted animate-pulse rounded" />
              ) : (
                segments?.map((seg) => (
                  <div key={seg.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                    <div>
                      <div className="text-[11px] text-foreground font-medium leading-tight">{seg.name}</div>
                      <div className="text-[10px] text-muted-foreground">{seg.speedKmh} km/h</div>
                    </div>
                    <LevelBadge level={seg.level as "lancar" | "sedang" | "padat" | "macet_total"} />
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
