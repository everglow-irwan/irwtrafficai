import { logger } from "../lib/logger.js";

export type CongestionLevel = "lancar" | "sedang" | "padat" | "macet_total";

export interface FlowResult {
  currentSpeed: number;
  freeFlowSpeed: number;
  currentTravelTime: number;
  freeFlowTravelTime: number;
  confidence: number;
  roadClosure: boolean;
}

export interface IncidentResult {
  id: string;
  lat: number;
  lng: number;
  description: string;
  severity: number;
  type: number;
  delay: number;
}

const TOMTOM_BASE = "https://api.tomtom.com";
const CACHE_TTL_MS = 30_000;

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const flowCache = new Map<string, CacheEntry<FlowResult>>();
let incidentCache: CacheEntry<IncidentResult[]> | null = null;

function isStale<T>(entry: CacheEntry<T> | null | undefined): boolean {
  if (!entry) return true;
  return Date.now() - entry.fetchedAt > CACHE_TTL_MS;
}

function getApiKey(): string {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) throw new Error("TOMTOM_API_KEY not set");
  return key;
}

export function speedToLevel(currentSpeed: number, freeFlowSpeed: number, roadClosure: boolean): CongestionLevel {
  if (roadClosure || currentSpeed <= 0) return "macet_total";
  const ratio = freeFlowSpeed > 0 ? currentSpeed / freeFlowSpeed : 1;
  if (ratio >= 0.80) return "lancar";
  if (ratio >= 0.60) return "sedang";
  if (ratio >= 0.35) return "padat";
  return "macet_total";
}

export async function fetchFlowSegment(lat: number, lng: number): Promise<FlowResult | null> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = flowCache.get(cacheKey);
  if (!isStale(cached)) return cached!.data;

  try {
    const key = getApiKey();
    const url =
      `${TOMTOM_BASE}/traffic/services/4/flowSegmentData/absolute/10/json` +
      `?point=${lat},${lng}&unit=KMPH&openLr=false&key=${key}`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      logger.warn({ status: resp.status, url }, "TomTom flow API non-200");
      return null;
    }

    const json = (await resp.json()) as {
      flowSegmentData?: {
        currentSpeed: number;
        freeFlowSpeed: number;
        currentTravelTime: number;
        freeFlowTravelTime: number;
        confidence: number;
        roadClosure: boolean;
      };
    };

    const fsd = json.flowSegmentData;
    if (!fsd) return null;

    const result: FlowResult = {
      currentSpeed: fsd.currentSpeed,
      freeFlowSpeed: fsd.freeFlowSpeed,
      currentTravelTime: fsd.currentTravelTime,
      freeFlowTravelTime: fsd.freeFlowTravelTime,
      confidence: fsd.confidence,
      roadClosure: fsd.roadClosure,
    };

    flowCache.set(cacheKey, { data: result, fetchedAt: Date.now() });
    return result;
  } catch (err) {
    logger.warn({ err, lat, lng }, "TomTom flow fetch error");
    return null;
  }
}

export async function fetchIncidents(): Promise<IncidentResult[]> {
  if (!isStale(incidentCache)) return incidentCache!.data;

  try {
    const key = getApiKey();
    // Medan bounding box: minLon,minLat,maxLon,maxLat
    const bbox = "98.610,3.510,98.760,3.690";
    const fields =
      "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}";

    const url =
      `${TOMTOM_BASE}/traffic/services/5/incidentDetails` +
      `?bbox=${bbox}&fields=${encodeURIComponent(fields)}&language=id-ID&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11,14&key=${key}`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) {
      logger.warn({ status: resp.status }, "TomTom incidents API non-200");
      return [];
    }

    const json = (await resp.json()) as {
      incidents?: Array<{
        type: string;
        geometry: { coordinates: number[] | number[][] };
        properties: {
          id: string;
          iconCategory: number;
          magnitudeOfDelay: number;
          events?: Array<{ description: string }>;
          from?: string;
          to?: string;
          delay?: number;
        };
      }>;
    };

    const results: IncidentResult[] = [];

    for (const inc of json.incidents ?? []) {
      let lat: number;
      let lng: number;

      const coords = inc.geometry.coordinates;
      if (Array.isArray(coords[0])) {
        const mid = Math.floor((coords as number[][]).length / 2);
        lng = (coords as number[][])[mid][0];
        lat = (coords as number[][])[mid][1];
      } else {
        lng = (coords as number[])[0];
        lat = (coords as number[])[1];
      }

      const desc =
        inc.properties.events?.[0]?.description ??
        `Insiden lalu lintas (kategori ${inc.properties.iconCategory})`;

      results.push({
        id: inc.properties.id,
        lat,
        lng,
        description: desc,
        severity: inc.properties.magnitudeOfDelay ?? 0,
        type: inc.properties.iconCategory,
        delay: inc.properties.delay ?? 0,
      });
    }

    incidentCache = { data: results, fetchedAt: Date.now() };
    return results;
  } catch (err) {
    logger.warn({ err }, "TomTom incidents fetch error");
    return [];
  }
}
