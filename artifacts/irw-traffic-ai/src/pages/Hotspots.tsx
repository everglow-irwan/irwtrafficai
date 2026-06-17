import {
  useGetTrafficHotspots,
  useGetTrafficOverview,
  useListTrafficSegments,
  getGetTrafficHotspotsQueryKey,
  getGetTrafficOverviewQueryKey,
  getListTrafficSegmentsQueryKey,
} from "@workspace/api-client-react";
import LevelBadge, { SeverityBadge } from "@/components/LevelBadge";

const REFETCH_INTERVAL = 30000;

const severityOrder: Record<string, number> = {
  sangat_parah: 0,
  parah: 1,
  sedang: 2,
};

export default function Hotspots() {
  const { data: hotspots, isLoading: hLoading } = useGetTrafficHotspots({
    query: { refetchInterval: REFETCH_INTERVAL, queryKey: getGetTrafficHotspotsQueryKey() },
  });
  const { data: overview } = useGetTrafficOverview({
    query: { refetchInterval: REFETCH_INTERVAL, queryKey: getGetTrafficOverviewQueryKey() },
  });
  const { data: segments, isLoading: segLoading } = useListTrafficSegments({
    query: { refetchInterval: REFETCH_INTERVAL, queryKey: getListTrafficSegmentsQueryKey() },
  });

  const sorted = [...(hotspots ?? [])].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3),
  );

  const badSegments = (segments ?? []).filter(
    (s) => s.level === "macet_total" || s.level === "padat",
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <header className="px-5 py-3 border-b border-border bg-card flex-shrink-0">
        <h1 className="text-sm font-bold text-foreground">Titik Kemacetan Parah</h1>
        <p className="text-[11px] text-muted-foreground">Pantauan real-time kemacetan di Kota Medan</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Overview bar */}
        {overview && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Lancar", value: overview.lancarCount, color: "border-green-500/30 bg-green-500/5", textColor: "text-green-400" },
              { label: "Sedang", value: overview.sedangCount, color: "border-yellow-500/30 bg-yellow-500/5", textColor: "text-yellow-400" },
              { label: "Padat", value: overview.padatCount, color: "border-orange-500/30 bg-orange-500/5", textColor: "text-orange-400" },
              { label: "Macet Total", value: overview.macetCount, color: "border-red-500/30 bg-red-500/5", textColor: "text-red-400" },
            ].map(({ label, value, color, textColor }) => (
              <div key={label} className={`rounded-lg border p-3 ${color}`}>
                <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Hotspots */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Titik Macet Teridentifikasi ({sorted.length})
          </h2>
          {hLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((h, idx) => (
                <div
                  key={h.id}
                  className="bg-card border border-border rounded-lg p-4 flex gap-4"
                  data-testid={`hotspot-item-${h.id}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-red-400">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-foreground leading-snug">{h.location}</h3>
                      <SeverityBadge severity={h.severity as "sedang" | "parah" | "sangat_parah"} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{h.description}</p>
                    <div className="flex items-center gap-4 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-muted-foreground">
                          {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-primary font-medium">Est. bersih: {h.estimatedClearTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Padat/macet segments */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Ruas Jalan Padat & Macet ({badSegments.length})
          </h2>
          {segLoading ? (
            <div className="h-16 bg-muted animate-pulse rounded-lg" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {badSegments.map((seg) => (
                <div
                  key={seg.id}
                  className="bg-card border border-border rounded-lg p-3"
                  data-testid={`segment-bad-${seg.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground leading-tight">{seg.name}</span>
                    <LevelBadge level={seg.level as "lancar" | "sedang" | "padat" | "macet_total"} />
                  </div>
                  <div className="text-[11px] text-muted-foreground">{seg.from} → {seg.to}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span className="text-foreground">{seg.speedKmh} km/h</span>
                    {seg.delayMinutes > 0 && (
                      <span className="text-orange-400">+{seg.delayMinutes} mnt</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
