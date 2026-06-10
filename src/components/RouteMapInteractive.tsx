'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Map, { Source, Layer, Marker, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

type RouteKey = 'all' | 'sunrise' | 'daytime' | 'evening';
type StopKey = 'banff' | 'samson' | 'lakeshore' | 'moraine';

// Base map skin. A clean, low-saturation style makes the colored route lines and
// the draw-on animation pop. Swap this one line to restyle the whole map:
//   light-v11    — clean light grey/cream (current) — best line contrast
//   dark-v11     — dark canvas, lines glow like neon (very premium)
//   standard     — Mapbox's 3D style, muted terrain, keeps mountain character
//   outdoors-v12 — previous busy green topo
const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

interface StopDetails {
  name: string;
  role: string;
  notes: string[];
  tips: string;
  longitude: number;
  latitude: number;
}

const STOPS: Record<StopKey, StopDetails> = {
  banff: {
    name: 'Banff (Townsite)',
    role: 'Primary Origin & Evening Terminal',
    notes: [
      'Sunrise Express departs from Banff at 4:30 AM.',
      'Evening Return arrives back in Banff at 7:15 PM.',
    ],
    tips: 'Perfect starting point for visitors staying in the town of Banff. Overnight parking is available in the public transit hub.',
    longitude: -115.5708, latitude: 51.1784,
  },
  samson: {
    name: 'Samson Mall (Lake Louise Village)',
    role: 'Main Daytime Hub',
    notes: [
      'Samson Mall is the central Lake Louise Village pickup point.',
      'Daytime Circuit departs every 2 hours starting at 7:00 AM.',
    ],
    tips: 'Located in the heart of Lake Louise Village with retail, food, and restroom amenities while you wait.',
    longitude: -116.1773, latitude: 51.4254,
  },
  lakeshore: {
    name: 'Lake Louise Lakeshore',
    role: 'Daytime Stop & Evening Departure',
    notes: [
      'Follow designated loading areas and staff direction.',
      'Evening Return to Banff departs at 6:00 PM.',
    ],
    tips: 'Look for the RockFlower Travels signpost near the public shuttle loops. Staff will guide you to your loading bay.',
    longitude: -116.2166, latitude: 51.4150,
  },
  moraine: {
    name: 'Moraine Lake',
    role: 'Scenic Destination',
    notes: [
      'Sunrise Express arrives at 6:00 AM for premium sunrise viewing.',
      'Private vehicles restricted — our shuttle is guaranteed access.',
    ],
    tips: 'Private vehicles are restricted. Our shuttle is the best way to secure guaranteed, stress-free access to Moraine Lake.',
    longitude: -116.1824, latitude: 51.3276,
  },
};

const ROUTE_META: Record<Exclude<RouteKey, 'all'>, { label: string; icon: string; color: string }> = {
  sunrise: { label: 'Sunrise Express', icon: '🌅', color: '#f59e0b' },
  daytime: { label: 'Daytime Circuit', icon: '☀️', color: '#10b981' },
  evening: { label: 'Evening Return', icon: '🌇', color: '#047857' },
};

type RouteFeature = {
  type: 'Feature';
  properties: { color: string; dashed: boolean };
  geometry: { type: 'LineString'; coordinates: number[][] };
};

// Each drawn segment, as an ordered list of stops. Geometry is resolved to real
// road paths at runtime via the Mapbox Directions API (with a straight fallback).
const ROUTE_SEGMENTS: {
  id: string;
  route: Exclude<RouteKey, 'all'>;
  stops: StopKey[];
  dashed: boolean;
}[] = [
  { id: 'sunrise-main', route: 'sunrise', stops: ['banff', 'moraine'], dashed: false },
  { id: 'sunrise-pos', route: 'sunrise', stops: ['moraine', 'lakeshore', 'samson'], dashed: true },
  { id: 'daytime', route: 'daytime', stops: ['samson', 'lakeshore', 'moraine', 'samson'], dashed: false },
  { id: 'evening', route: 'evening', stops: ['lakeshore', 'banff'], dashed: false },
];

const straightCoords = (stops: StopKey[]): [number, number][] =>
  stops.map((k) => [STOPS[k].longitude, STOPS[k].latitude]);

// Fetch a road-following path between ordered waypoints. Returns null on any
// failure so callers fall back to a straight line.
async function fetchRoadRoute(
  coords: [number, number][],
  token: string,
): Promise<[number, number][] | null> {
  try {
    const path = coords.map((c) => `${c[0]},${c[1]}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${path}?geometries=geojson&overview=full&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const line = data?.routes?.[0]?.geometry?.coordinates;
    return Array.isArray(line) && line.length > 1 ? (line as [number, number][]) : null;
  } catch {
    return null;
  }
}

function getLineLength(coords: number[][]) {
  let len = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const dx = coords[i+1][0] - coords[i][0];
    const dy = coords[i+1][1] - coords[i][1];
    len += Math.sqrt(dx*dx + dy*dy);
  }
  return len;
}

function sliceLine(coords: number[][], progress: number) {
  if (progress <= 0) return [coords[0], coords[0]];
  if (progress >= 1) return coords;

  const totalLen = getLineLength(coords);
  const targetLen = totalLen * progress;
  
  let currentLen = 0;
  const result = [coords[0]];
  
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i+1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const segLen = Math.sqrt(dx*dx + dy*dy);
    
    if (currentLen + segLen >= targetLen) {
      const remainingLen = targetLen - currentLen;
      const ratio = remainingLen / segLen;
      result.push([
        p1[0] + dx * ratio,
        p1[1] + dy * ratio
      ]);
      break;
    } else {
      result.push(p2);
      currentLen += segLen;
    }
  }
  
  return result;
}

export default function RouteMapInteractive() {
  const mapRef = useRef<MapRef>(null);
  const [filter, setFilter] = useState<RouteKey>('all');
  const [activeStop, setActiveStop] = useState<StopKey | null>(null);
  const [progress, setProgress] = useState(1);
  const [roadCoords, setRoadCoords] = useState<Record<string, [number, number][]>>({});
  const animationRef = useRef<number>(undefined);
  const didInitRef = useRef(false);

  const isVisible = useCallback(
    (route: Exclude<RouteKey, 'all'>) => filter === 'all' || filter === route,
    [filter],
  );

  // Resolve real road geometry for every segment once on mount (routes are static).
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        ROUTE_SEGMENTS.map(async (seg) => {
          const road = await fetchRoadRoute(straightCoords(seg.stops), token);
          return [seg.id, road] as const;
        }),
      );
      if (cancelled) return;
      const next: Record<string, [number, number][]> = {};
      for (const [id, road] of entries) {
        if (road) next[id] = road;
      }
      setRoadCoords(next);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const hasRoads = Object.keys(roadCoords).length > 0;
    const firstMount = !didInitRef.current;
    didInitRef.current = true;

    // On first mount before road geometry arrives, render fully-drawn and static
    // so we don't flash a straight line that then snaps to the road shape. This
    // effect re-runs once roads load, animating the proper road draw.
    if (firstMount && !hasRoads) {
      setProgress(1);
      return;
    }

    setProgress(0);
    const start = performance.now();
    const duration = 1800; // draw-on duration

    const animate = (time: number) => {
      const elapsed = time - start;
      const t = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);

      setProgress(easeOut);

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [filter, roadCoords]);

  // Generate GeoJSON for the visible routes, drawn progressively along real roads.
  const routeData = useMemo(() => {
    const features: RouteFeature[] = ROUTE_SEGMENTS.filter((seg) => isVisible(seg.route)).map(
      (seg) => {
        const full = roadCoords[seg.id] ?? straightCoords(seg.stops);
        return {
          type: 'Feature' as const,
          properties: { color: ROUTE_META[seg.route].color, dashed: seg.dashed },
          geometry: {
            type: 'LineString' as const,
            coordinates: sliceLine(full, progress),
          },
        };
      },
    );

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [isVisible, progress, roadCoords]);

  // Smoothly fly to a stop when selected
  useEffect(() => {
    if (activeStop && mapRef.current) {
      const s = STOPS[activeStop];
      mapRef.current.flyTo({
        center: [s.longitude, s.latitude],
        zoom: 13,
        duration: 1500,
        pitch: 60,
      });
    } else if (mapRef.current) {
      // Fit to all bounds
      mapRef.current.fitBounds(
        [
          [-116.25, 51.15], // SW corner
          [-115.50, 51.45], // NE corner
        ],
        { padding: 50, duration: 1500, pitch: 0 }
      );
    }
  }, [activeStop, filter]);

  return (
    <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* Map */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card-hover)]">
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 bg-mist-50/60 p-4">
          <FilterPill active={filter === 'all'} onClick={() => { setFilter('all'); setActiveStop(null); }}>All routes</FilterPill>
          {(Object.keys(ROUTE_META) as Exclude<RouteKey, 'all'>[]).map((k) => (
            <FilterPill key={k} active={filter === k} onClick={() => { setFilter(k); setActiveStop(null); }} color={ROUTE_META[k].color}>
              <span aria-hidden className="mr-1.5">{ROUTE_META[k].icon}</span>
              {ROUTE_META[k].label}
            </FilterPill>
          ))}
        </div>

        {/* Mapbox */}
        <div className="relative aspect-[5/4] w-full bg-mist-50">
          <Map
            ref={mapRef}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            initialViewState={{
              longitude: -115.89,
              latitude: 51.30,
              zoom: 9.5,
            }}
            mapStyle={MAP_STYLE}
            terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
            interactive={true}
          >
            <Source
              id="mapbox-dem"
              type="raster-dem"
              url="mapbox://mapbox.mapbox-terrain-dem-v1"
              tileSize={512}
              maxzoom={14}
            />

            <Source id="routes" type="geojson" data={routeData}>
              {/* Glow casing — a wide, blurred halo beneath each solid line so the
                  draw-on animation reads clearly against any basemap. */}
              <Layer
                id="routes-glow"
                type="line"
                filter={['==', 'dashed', false]}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': ['get', 'color'],
                  // Thicken with zoom so the glow holds up when zoomed in.
                  'line-width': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 22],
                  'line-opacity': 0.3,
                  'line-blur': 6,
                }}
              />
              {/* White underlay — a thin bright edge that separates the colored core
                  from the glow and gives the line a crisp, premium finish. */}
              <Layer
                id="routes-underlay"
                type="line"
                filter={['==', 'dashed', false]}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': '#ffffff',
                  'line-width': ['interpolate', ['linear'], ['zoom'], 8, 7, 14, 14],
                  'line-opacity': 0.9,
                }}
              />
              {/* Solid core line */}
              <Layer
                id="routes-line"
                type="line"
                filter={['==', 'dashed', false]}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': ['get', 'color'],
                  'line-width': ['interpolate', ['linear'], ['zoom'], 8, 4.5, 14, 9],
                  'line-opacity': 1,
                }}
              />
              {/* Dashed positioning legs */}
              <Layer
                id="routes-dashed"
                type="line"
                filter={['==', 'dashed', true]}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-color': ['get', 'color'],
                  'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3.5, 14, 6],
                  'line-opacity': 0.85,
                  'line-dasharray': [1.4, 1.8],
                }}
              />
            </Source>

            {/* Traveling markers — ride the leading edge of each route while it draws
                (ports terrae Animated Lines' `showMarker` behavior to react-map-gl) */}
            {progress < 0.999 &&
              routeData.features
                .filter((f) => !f.properties.dashed)
                .map((f, i) => {
                  const coords = f.geometry.coordinates as [number, number][];
                  const tip = coords[coords.length - 1];
                  if (!tip) return null;
                  return (
                    <Marker key={`tip-${f.properties.color}-${i}`} longitude={tip[0]} latitude={tip[1]}>
                      <span className="relative grid place-items-center">
                        {/* Pulsing halo */}
                        <span
                          className="absolute size-5 animate-ping rounded-full"
                          style={{ backgroundColor: f.properties.color, opacity: 0.5 }}
                        />
                        {/* Comet head */}
                        <span
                          className="relative block size-4 rounded-full ring-2 ring-white"
                          style={{
                            backgroundColor: f.properties.color,
                            boxShadow: `0 0 12px 2px ${f.properties.color}, 0 1px 4px rgba(0,0,0,0.35)`,
                          }}
                        />
                      </span>
                    </Marker>
                  );
                })}

            {(Object.keys(STOPS) as StopKey[]).map((key) => {
              const s = STOPS[key];
              const isActive = activeStop === key;
              return (
                <Marker
                  key={key}
                  longitude={s.longitude}
                  latitude={s.latitude}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setActiveStop(isActive ? null : key);
                  }}
                >
                  <div className="flex cursor-pointer flex-col items-center group">
                    <div className="mb-1 rounded-md bg-white px-2 py-0.5 text-xs font-bold text-mist-900 shadow-md ring-1 ring-mist-200 transition-transform group-hover:-translate-y-1">
                      {labelFor(key)}
                    </div>
                    <div className={`size-5 rounded-full ring-2 ring-white transition-all ${isActive ? 'bg-sunrise-500 scale-125' : 'bg-evergreen-700 group-hover:scale-110 group-hover:bg-sunrise-400'}`} />
                  </div>
                </Marker>
              );
            })}
          </Map>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 bg-mist-50/60 px-4 py-3 text-xs text-mist-700">
          <LegendItem color={ROUTE_META.sunrise.color} label="Sunrise Express" />
          <LegendItem color={ROUTE_META.daytime.color} label="Daytime Circuit" />
          <LegendItem color={ROUTE_META.evening.color} label="Evening Return" />
          <LegendItem color={ROUTE_META.sunrise.color} label="Positioning leg" dashed />
        </div>
      </div>

      {/* Sidebar */}
      <aside className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card-hover)]">
        {activeStop ? (
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sunrise-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sunrise-700">
              <span aria-hidden>📍</span> Station
            </span>
            <h3 className="mt-3 font-display text-2xl font-extrabold text-mist-900">
              {STOPS[activeStop].name}
            </h3>
            <p className="mt-1 text-sm font-medium text-mist-500">
              {STOPS[activeStop].role}
            </p>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                Pickup & stop notes
              </p>
              <ul className="mt-2 space-y-2 text-sm text-mist-700">
                {STOPS[activeStop].notes.map((note, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-sunrise-500" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 rounded-xl bg-mist-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                Travel tip
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-mist-700">
                {STOPS[activeStop].tips}
              </p>
            </div>

            <button
              onClick={() => setActiveStop(null)}
              className="mt-6 w-full rounded-lg border border-mist-200 py-2.5 text-sm font-medium text-mist-700 transition hover:bg-mist-50"
            >
              Back to overview
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <h3 className="font-display text-lg font-bold text-mist-900">
              Stations on the network
            </h3>
            <p className="mt-1 text-sm text-mist-500">
              Tap any stop on the map — or pick one here — for loading bays and travel tips.
            </p>

            <ul className="mt-5 grid gap-2">
              {(Object.keys(STOPS) as StopKey[]).map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setActiveStop(key)}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition hover:bg-mist-50"
                  >
                    <span>
                      <span className="block font-display text-sm font-bold text-mist-900">
                        {STOPS[key].name}
                      </span>
                      <span className="block text-xs text-mist-500">
                        {STOPS[key].role}
                      </span>
                    </span>
                    <span aria-hidden className="text-mist-400 transition group-hover:translate-x-0.5 group-hover:text-sunrise-500">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function labelFor(key: StopKey): string {
  return ({
    banff: 'Banff',
    samson: 'Samson Mall',
    lakeshore: 'Lake Louise Lakeshore',
    moraine: 'Moraine Lake',
  } as const)[key];
}

function FilterPill({
  active, onClick, children, color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sunrise-400/40 ${
        active
          ? 'border-evergreen-800 bg-evergreen-800 text-white'
          : 'border-mist-200 bg-white text-mist-700 hover:border-mist-300 hover:bg-mist-50'
      }`}
      style={active && color ? { borderColor: color, backgroundColor: color, color: 'white' } : undefined}
    >
      {children}
    </button>
  );
}

function LegendItem({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="22" height="6" aria-hidden>
        <line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={dashed ? '4 3' : undefined} />
      </svg>
      <span>{label}</span>
    </span>
  );
}
