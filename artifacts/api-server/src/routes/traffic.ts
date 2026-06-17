import { Router } from "express";
import {
  fetchFlowSegment,
  fetchIncidents,
  speedToLevel,
  type CongestionLevel,
} from "../services/tomtom.js";
import { logger } from "../logger.js";

const router = Router();

interface BaseSegment {
  id: number;
  name: string;
  from: string;
  to: string;
  lat: number;
  lng: number;
  fallbackLevel: CongestionLevel;
  fallbackSpeed: number;
  fallbackDelay: number;
}

const BASE_SEGMENTS: BaseSegment[] = [
  { id: 1,  name: "Jl. Gatot Subroto",     from: "Simpang Pos",            to: "Simpang Karona",       lat: 3.5952, lng: 98.6722, fallbackLevel: "padat",      fallbackSpeed: 18, fallbackDelay: 12 },
  { id: 2,  name: "Jl. Sisingamangaraja",  from: "Simpang Limun",          to: "Masjid Raya",          lat: 3.5800, lng: 98.6700, fallbackLevel: "macet_total", fallbackSpeed: 8,  fallbackDelay: 25 },
  { id: 3,  name: "Jl. Adam Malik",        from: "Simpang Bandar Selamat", to: "Pintu Air",            lat: 3.6100, lng: 98.6800, fallbackLevel: "sedang",     fallbackSpeed: 30, fallbackDelay: 5  },
  { id: 4,  name: "Jl. Iskandar Muda",     from: "Simpang Serdang",        to: "Sambu",                lat: 3.5900, lng: 98.6600, fallbackLevel: "lancar",     fallbackSpeed: 50, fallbackDelay: 0  },
  { id: 5,  name: "Jl. Pandu",             from: "Lapangan Merdeka",       to: "Medan Plaza",          lat: 3.5850, lng: 98.6750, fallbackLevel: "padat",      fallbackSpeed: 15, fallbackDelay: 18 },
  { id: 6,  name: "Jl. Pemuda",            from: "Hotel Danau Toba",       to: "Gedung Pancasila",     lat: 3.5970, lng: 98.6690, fallbackLevel: "sedang",     fallbackSpeed: 28, fallbackDelay: 7  },
  { id: 7,  name: "Jl. Imam Bonjol",       from: "Simpang Kampung Keling", to: "Stasiun Besar",        lat: 3.5930, lng: 98.6810, fallbackLevel: "macet_total", fallbackSpeed: 6,  fallbackDelay: 30 },
  { id: 8,  name: "Jl. Diponegoro",        from: "Titi Kuning",            to: "Simpang Bali",         lat: 3.6200, lng: 98.6900, fallbackLevel: "lancar",     fallbackSpeed: 55, fallbackDelay: 0  },
  { id: 9,  name: "Jl. Jend. Sudirman",    from: "Maimoon Palace",         to: "RS Columbia Asia",     lat: 3.5750, lng: 98.6850, fallbackLevel: "sedang",     fallbackSpeed: 32, fallbackDelay: 6  },
  { id: 10, name: "Jl. Brigjen Katamso",   from: "Pasar Ikan",             to: "Simpang Pos",          lat: 3.5880, lng: 98.6720, fallbackLevel: "padat",      fallbackSpeed: 20, fallbackDelay: 10 },
  { id: 11, name: "Jl. Letjend Suprapto",  from: "USU",                    to: "Ring Road",            lat: 3.5650, lng: 98.6500, fallbackLevel: "lancar",     fallbackSpeed: 60, fallbackDelay: 0  },
  { id: 12, name: "Jl. Gajah Mada",        from: "Simpang Balimbingan",    to: "Simpang Glugur",       lat: 3.5830, lng: 98.6600, fallbackLevel: "padat",      fallbackSpeed: 17, fallbackDelay: 14 },
  { id: 13, name: "Jl. HM Yamin",          from: "Ramayana",               to: "SPBU Jl Yamin",        lat: 3.5910, lng: 98.6780, fallbackLevel: "sedang",     fallbackSpeed: 35, fallbackDelay: 4  },
  { id: 14, name: "Jl. Asia",              from: "Simpang Asia",           to: "Pasar Petisah",        lat: 3.5990, lng: 98.6830, fallbackLevel: "macet_total", fallbackSpeed: 10, fallbackDelay: 22 },
  { id: 15, name: "Ring Road Medan",       from: "Tol Balmera",            to: "Interchange Helvetia", lat: 3.6050, lng: 98.6400, fallbackLevel: "lancar",     fallbackSpeed: 80, fallbackDelay: 0  },
];

export interface SegmentResult {
  id: number;
  name: string;
  from: string;
  to: string;
  lat: number;
  lng: number;
  level: CongestionLevel;
  speedKmh: number;
  freeFlowSpeedKmh: number;
  delayMinutes: number;
  confidence: number;
  source: "tomtom" | "fallback";
  lastUpdated: string;
}

async function fetchAllSegments(): Promise<SegmentResult[]> {
  const now = new Date().toISOString();
  const results = await Promise.allSettled(
    BASE_SEGMENTS.map(async (seg): Promise<SegmentResult> => {
      const flow = await fetchFlowSegment(seg.lat, seg.lng);
      if (flow) {
        const level = speedToLevel(flow.currentSpeed, flow.freeFlowSpeed, flow.roadClosure);
        const delaySeconds = Math.max(0, flow.currentTravelTime - flow.freeFlowTravelTime);
        return {
          id: seg.id,
          name: seg.name,
          from: seg.from,
          to: seg.to,
          lat: seg.lat,
          lng: seg.lng,
          level,
          speedKmh: Math.round(flow.currentSpeed),
          freeFlowSpeedKmh: Math.round(flow.freeFlowSpeed),
          delayMinutes: Math.round(delaySeconds / 60),
          confidence: flow.confidence,
          source: "tomtom",
          lastUpdated: now,
        };
      }
      return {
        id: seg.id,
        name: seg.name,
        from: seg.from,
        to: seg.to,
        lat: seg.lat,
        lng: seg.lng,
        level: seg.fallbackLevel,
        speedKmh: seg.fallbackSpeed,
        freeFlowSpeedKmh: seg.fallbackSpeed * 2,
        delayMinutes: seg.fallbackDelay,
        confidence: 0,
        source: "fallback",
        lastUpdated: now,
      };
    }),
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const seg = BASE_SEGMENTS[i];
    return {
      id: seg.id, name: seg.name, from: seg.from, to: seg.to,
      lat: seg.lat, lng: seg.lng,
      level: seg.fallbackLevel, speedKmh: seg.fallbackSpeed,
      freeFlowSpeedKmh: seg.fallbackSpeed * 2,
      delayMinutes: seg.fallbackDelay,
      confidence: 0, source: "fallback" as const,
      lastUpdated: new Date().toISOString(),
    };
  });
}

router.get("/traffic/segments", async (req, res) => {
  const segments = await fetchAllSegments();
  res.json(segments);
});

router.get("/traffic/overview", async (req, res) => {
  const segments = await fetchAllSegments();
  const counts = { lancar: 0, sedang: 0, padat: 0, macet_total: 0 };
  for (const seg of segments) counts[seg.level]++;

  const macetPercent = ((counts.macet_total + counts.padat) / segments.length) * 100;
  let overallLevel: CongestionLevel = "lancar";
  if (macetPercent > 60) overallLevel = "macet_total";
  else if (macetPercent > 40) overallLevel = "padat";
  else if (macetPercent > 20) overallLevel = "sedang";

  const summaries: Record<CongestionLevel, string> = {
    lancar:      "Kondisi lalu lintas Kota Medan secara umum lancar. Beberapa ruas jalan terpantau padat.",
    sedang:      "Lalu lintas Kota Medan sedang. Perjalanan mungkin sedikit terhambat di beberapa titik.",
    padat:       "Kemacetan signifikan terjadi di beberapa titik utama Kota Medan. Disarankan mencari rute alternatif.",
    macet_total: "Kemacetan parah melanda beberapa ruas utama Kota Medan. Hindari pusat kota jika memungkinkan.",
  };

  const tomtomCount = segments.filter((s) => s.source === "tomtom").length;

  res.json({
    overallLevel,
    totalRoads: segments.length,
    lancarCount: counts.lancar,
    sedangCount: counts.sedang,
    padatCount: counts.padat,
    macetCount: counts.macet_total,
    lastUpdated: new Date().toISOString(),
    summary: summaries[overallLevel],
    dataSource: tomtomCount > 0 ? "tomtom" : "fallback",
    tomtomSegments: tomtomCount,
  });
});

router.get("/traffic/hotspots", async (req, res) => {
  const now = new Date().toISOString();

  const [segments, incidents] = await Promise.all([
    fetchAllSegments(),
    fetchIncidents(),
  ]);

  if (incidents.length > 0) {
    const severityMap: Record<number, "sedang" | "parah" | "sangat_parah"> = {
      0: "sedang", 1: "sedang", 2: "parah", 3: "parah", 4: "sangat_parah",
    };
    const estimateMap: Record<number, string> = {
      0: "± 5 menit", 1: "± 15 menit", 2: "± 25 menit", 3: "± 40 menit", 4: "± 60+ menit",
    };

    const hotspots = incidents
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 8)
      .map((inc, idx) => ({
        id: idx + 1,
        location: inc.description.length > 60 ? inc.description.slice(0, 60) + "…" : inc.description,
        description: `Insiden lalu lintas terdeteksi TomTom. Keterlambatan ±${Math.round(inc.delay / 60)} menit.`,
        severity: severityMap[Math.min(inc.severity, 4)] ?? "parah",
        lat: inc.lat,
        lng: inc.lng,
        estimatedClearTime: estimateMap[Math.min(inc.severity, 4)] ?? "± 30 menit",
        reportedAt: now,
        source: "tomtom",
      }));

    if (hotspots.length > 0) {
      res.json(hotspots);
      return;
    }
  }

  // Fallback: derive hotspots from macet segments
  const macetSegs = segments
    .filter((s) => s.level === "macet_total" || s.level === "padat")
    .sort((a, b) => a.speedKmh - b.speedKmh)
    .slice(0, 5);

  const severityFromLevel: Record<CongestionLevel, "sedang" | "parah" | "sangat_parah"> = {
    lancar: "sedang", sedang: "sedang", padat: "parah", macet_total: "sangat_parah",
  };

  res.json(
    macetSegs.map((seg, idx) => ({
      id: idx + 1,
      location: `${seg.name} (${seg.from} → ${seg.to})`,
      description: `Kecepatan ${seg.speedKmh} km/h (normal ${seg.freeFlowSpeedKmh} km/h). Keterlambatan ${seg.delayMinutes} menit.`,
      severity: severityFromLevel[seg.level],
      lat: seg.lat,
      lng: seg.lng,
      estimatedClearTime: seg.delayMinutes > 20 ? "± 45 menit" : seg.delayMinutes > 10 ? "± 20 menit" : "± 10 menit",
      reportedAt: now,
      source: seg.source,
    })),
  );
});

router.get("/traffic/stats", async (req, res) => {
  const segments = await fetchAllSegments();
  const total = segments.length;
  const counts = { lancar: 0, sedang: 0, padat: 0, macet_total: 0 };
  let totalSpeed = 0;

  for (const seg of segments) {
    counts[seg.level]++;
    totalSpeed += seg.speedKmh;
  }

  const worstSeg = [...segments].sort((a, b) => a.speedKmh - b.speedKmh)[0];
  const bestSeg = [...segments].sort((a, b) => b.speedKmh - a.speedKmh)[0];

  res.json({
    totalSegments: total,
    percentageLancar: Math.round((counts.lancar / total) * 100),
    percentageSedang: Math.round((counts.sedang / total) * 100),
    percentagePadat: Math.round((counts.padat / total) * 100),
    percentageMacet: Math.round((counts.macet_total / total) * 100),
    worstArea: worstSeg ? `${worstSeg.name} (${worstSeg.speedKmh} km/h)` : "—",
    bestRoute: bestSeg ? `${bestSeg.name} (${bestSeg.speedKmh} km/h)` : "—",
    peakHour: "07:00–09:00 & 16:30–18:30 WIB",
    avgSpeedKmh: Math.round(totalSpeed / total),
    dataSource: segments.some((s) => s.source === "tomtom") ? "TomTom Real-time" : "Simulasi",
  });
});

export default router;
