import { Router } from "express";

const router = Router();

type CongestionLevel = "lancar" | "sedang" | "padat" | "macet_total";

interface TrafficSegmentData {
  id: number;
  name: string;
  from: string;
  to: string;
  level: CongestionLevel;
  speedKmh: number;
  delayMinutes: number;
  lat: number;
  lng: number;
}

const BASE_SEGMENTS: TrafficSegmentData[] = [
  { id: 1, name: "Jl. Gatot Subroto", from: "Simpang Pos", to: "Simpang Karona", level: "padat", speedKmh: 18, delayMinutes: 12, lat: 3.5952, lng: 98.6722 },
  { id: 2, name: "Jl. Sisingamangaraja", from: "Simpang Limun", to: "Masjid Raya", level: "macet_total", speedKmh: 8, delayMinutes: 25, lat: 3.5800, lng: 98.6700 },
  { id: 3, name: "Jl. Adam Malik", from: "Simpang Bandar Selamat", to: "Pintu Air", level: "sedang", speedKmh: 30, delayMinutes: 5, lat: 3.6100, lng: 98.6800 },
  { id: 4, name: "Jl. Iskandar Muda", from: "Simpang Serdang", to: "Sambu", level: "lancar", speedKmh: 50, delayMinutes: 0, lat: 3.5900, lng: 98.6600 },
  { id: 5, name: "Jl. Pandu", from: "Lapangan Merdeka", to: "Medan Plaza", level: "padat", speedKmh: 15, delayMinutes: 18, lat: 3.5850, lng: 98.6750 },
  { id: 6, name: "Jl. Pemuda", from: "Hotel Danau Toba", to: "Gedung Pancasila", level: "sedang", speedKmh: 28, delayMinutes: 7, lat: 3.5970, lng: 98.6690 },
  { id: 7, name: "Jl. Imam Bonjol", from: "Simpang Kampung Keling", to: "Stasiun Besar", level: "macet_total", speedKmh: 6, delayMinutes: 30, lat: 3.5930, lng: 98.6810 },
  { id: 8, name: "Jl. Diponegoro", from: "Titi Kuning", to: "Simpang Bali", level: "lancar", speedKmh: 55, delayMinutes: 0, lat: 3.6200, lng: 98.6900 },
  { id: 9, name: "Jl. Jend. Sudirman", from: "Maimoon Palace", to: "RS Columbia Asia", level: "sedang", speedKmh: 32, delayMinutes: 6, lat: 3.5750, lng: 98.6850 },
  { id: 10, name: "Jl. Brigjen Katamso", from: "Pasar Ikan", to: "Simpang Pos", level: "padat", speedKmh: 20, delayMinutes: 10, lat: 3.5880, lng: 98.6720 },
  { id: 11, name: "Jl. Letjend Suprapto", from: "USU", to: "Ring Road", level: "lancar", speedKmh: 60, delayMinutes: 0, lat: 3.5650, lng: 98.6500 },
  { id: 12, name: "Jl. Gajah Mada", from: "Simpang Balimbingan", to: "Simpang Glugur", level: "padat", speedKmh: 17, delayMinutes: 14, lat: 3.5830, lng: 98.6600 },
  { id: 13, name: "Jl. HM Yamin", from: "Ramayana", to: "SPBU Jl Yamin", level: "sedang", speedKmh: 35, delayMinutes: 4, lat: 3.5910, lng: 98.6780 },
  { id: 14, name: "Jl. Asia", from: "Simpang Asia", to: "Pasar Petisah", level: "macet_total", speedKmh: 10, delayMinutes: 22, lat: 3.5990, lng: 98.6830 },
  { id: 15, name: "Ring Road Medan", from: "Tol Balmera", to: "Interchange Helvetia", level: "lancar", speedKmh: 80, delayMinutes: 0, lat: 3.6050, lng: 98.6400 },
];

function getRandomVariation(base: number, range: number): number {
  return Math.max(0, base + (Math.random() - 0.5) * range);
}

function getSegmentsWithVariation(): Array<TrafficSegmentData & { lastUpdated: string }> {
  const now = new Date().toISOString();
  const minute = new Date().getMinutes();

  return BASE_SEGMENTS.map((seg) => {
    const variation = (minute % 5) * 0.1;
    let level = seg.level;
    let speedKmh = seg.speedKmh;
    let delayMinutes = seg.delayMinutes;

    if (variation > 0.3) {
      const levels: CongestionLevel[] = ["lancar", "sedang", "padat", "macet_total"];
      const idx = levels.indexOf(seg.level);
      if (idx < levels.length - 1 && Math.random() > 0.7) {
        level = levels[idx + 1];
        speedKmh = Math.max(5, speedKmh - 5);
        delayMinutes = delayMinutes + 3;
      }
    }

    return {
      ...seg,
      level,
      speedKmh: Math.round(getRandomVariation(speedKmh, 4)),
      delayMinutes: Math.round(getRandomVariation(delayMinutes, 2)),
      lastUpdated: now,
    };
  });
}

router.get("/traffic/overview", (req, res) => {
  const segments = getSegmentsWithVariation();
  const counts = { lancar: 0, sedang: 0, padat: 0, macet_total: 0 };
  for (const seg of segments) {
    counts[seg.level]++;
  }

  const macetPercent = ((counts.macet_total + counts.padat) / segments.length) * 100;
  let overallLevel: CongestionLevel = "lancar";
  if (macetPercent > 60) overallLevel = "macet_total";
  else if (macetPercent > 40) overallLevel = "padat";
  else if (macetPercent > 20) overallLevel = "sedang";

  const summaries: Record<CongestionLevel, string> = {
    lancar: "Kondisi lalu lintas Kota Medan secara umum lancar. Beberapa ruas jalan terpantau padat.",
    sedang: "Lalu lintas Kota Medan sedang. Perjalanan mungkin sedikit terhambat di beberapa titik.",
    padat: "Kemacetan signifikan terjadi di beberapa titik utama Kota Medan. Disarankan mencari rute alternatif.",
    macet_total: "Kemacetan parah melanda beberapa ruas utama Kota Medan. Hindari pusat kota jika memungkinkan.",
  };

  res.json({
    overallLevel,
    totalRoads: segments.length,
    lancarCount: counts.lancar,
    sedangCount: counts.sedang,
    padatCount: counts.padat,
    macetCount: counts.macet_total,
    lastUpdated: new Date().toISOString(),
    summary: summaries[overallLevel],
  });
});

router.get("/traffic/segments", (_req, res) => {
  res.json(getSegmentsWithVariation());
});

router.get("/traffic/hotspots", (_req, res) => {
  const now = new Date().toISOString();
  res.json([
    {
      id: 1,
      location: "Simpang Jl. Sisingamangaraja - Jl. Imam Bonjol",
      description: "Kemacetan parah akibat penyempitan jalan dan padatnya kendaraan menuju pusat kota.",
      severity: "sangat_parah",
      lat: 3.5865,
      lng: 98.6755,
      estimatedClearTime: "± 45 menit",
      reportedAt: now,
    },
    {
      id: 2,
      location: "Jl. Imam Bonjol depan Pasar Petisah",
      description: "Antrian panjang akibat aktivitas pasar dan angkot yang berhenti sembarangan.",
      severity: "sangat_parah",
      lat: 3.5930,
      lng: 98.6810,
      estimatedClearTime: "± 30 menit",
      reportedAt: now,
    },
    {
      id: 3,
      location: "Jl. Asia - Simpang Pos",
      description: "Kemacetan parah akibat volume kendaraan tinggi dan penyempitan di simpang.",
      severity: "parah",
      lat: 3.5990,
      lng: 98.6830,
      estimatedClearTime: "± 20 menit",
      reportedAt: now,
    },
    {
      id: 4,
      location: "Jl. Gatot Subroto - Karona",
      description: "Arus kendaraan padat pada jam sibuk. Lampu merah panjang.",
      severity: "parah",
      lat: 3.5952,
      lng: 98.6722,
      estimatedClearTime: "± 15 menit",
      reportedAt: now,
    },
    {
      id: 5,
      location: "Simpang Jl. Pandu - Pemuda",
      description: "Volume kendaraan tinggi, marka jalan tidak terlihat jelas.",
      severity: "sedang",
      lat: 3.5910,
      lng: 98.6770,
      estimatedClearTime: "± 10 menit",
      reportedAt: now,
    },
  ]);
});

router.get("/traffic/stats", (_req, res) => {
  const segments = getSegmentsWithVariation();
  const total = segments.length;
  const counts = { lancar: 0, sedang: 0, padat: 0, macet_total: 0 };
  let totalSpeed = 0;
  for (const seg of segments) {
    counts[seg.level]++;
    totalSpeed += seg.speedKmh;
  }

  res.json({
    totalSegments: total,
    percentageLancar: Math.round((counts.lancar / total) * 100),
    percentageSedang: Math.round((counts.sedang / total) * 100),
    percentagePadat: Math.round((counts.padat / total) * 100),
    percentageMacet: Math.round((counts.macet_total / total) * 100),
    worstArea: "Jl. Sisingamangaraja & Jl. Imam Bonjol",
    bestRoute: "Ring Road Medan via Tol Balmera",
    peakHour: "07:00–09:00 & 16:30–18:30 WIB",
    avgSpeedKmh: Math.round(totalSpeed / total),
  });
});

export default router;
