"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CITY_COORDINATES = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  delhi: { lat: 28.6139, lng: 77.209 },
  newdelhi: { lat: 28.6139, lng: 77.209 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  noida: { lat: 28.5355, lng: 77.391 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  indore: { lat: 22.7196, lng: 75.8577 },
  surat: { lat: 21.1702, lng: 72.8311 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  patna: { lat: 25.5941, lng: 85.1376 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
};

const CITY_KEYS = Object.keys(CITY_COORDINATES).sort(
  (left, right) => right.length - left.length,
);

function normalizeCity(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function getCityMatch(text) {
  const normalized = normalizeCity(text);
  if (!normalized) return null;
  if (CITY_COORDINATES[normalized]) {
    return { key: normalized, ...CITY_COORDINATES[normalized] };
  }
  for (const key of CITY_KEYS) {
    if (normalized.includes(key)) {
      return { key, ...CITY_COORDINATES[key] };
    }
  }
  return null;
}

function buildAppleMapsUrl(city, locationDetail = "") {
  const query = [locationDetail, city].filter(Boolean).join(", ") || city || "Mumbai, India";
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

function buildMapKitScriptUrl() {
  return "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
}

function getEventLabel(point) {
  return `${point.city} · ${point.count}`;
}

async function loadMapKit() {
  if (typeof window === "undefined") return null;
  if (window.mapkit) return window.mapkit;

  return await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-mapkit-js="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.mapkit));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = buildMapKitScriptUrl();
    script.async = true;
    script.defer = true;
    script.dataset.mapkitJs = "true";
    script.onload = () => resolve(window.mapkit);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function MapKitEventsMap({ events = [] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapkitReady, setMapkitReady] = useState(false);
  const [mapkitError, setMapkitError] = useState("");

  const points = useMemo(() => {
    const map = new Map();

    for (const event of events) {
      const candidate = getCityMatch(
        event?.city || event?.location_detail || event?.country || "",
      );
      if (!candidate) continue;

      const key = candidate.key;
      if (!map.has(key)) {
        map.set(key, {
          city: event?.city || candidate.key,
          lat: candidate.lat,
          lng: candidate.lng,
          count: 0,
          events: [],
          appleMapsUrl: buildAppleMapsUrl(
            event?.city || candidate.key,
            event?.location_detail || event?.raw_data?.location_detail || "",
          ),
        });
      }

      const point = map.get(key);
      point.count += 1;
      point.events.push(event);
    }

    return Array.from(map.values()).sort((left, right) => right.count - left.count);
  }, [events]);

  useEffect(() => {
    let cancelled = false;

    async function initializeMapKit() {
      const token =
        process.env.NEXT_PUBLIC_MAPKIT_JS_TOKEN || process.env.MAPKIT_JS_TOKEN || "";
      if (!token) {
        setMapkitError("MapKit token missing");
        return;
      }

      try {
        const mapkit = await loadMapKit();
        if (!mapkit || cancelled) return;

        mapkit.init({
          authorizationCallback(done) {
            done(token);
          },
        });

        setMapkitReady(true);
      } catch (error) {
        if (!cancelled) {
          setMapkitError(error?.message || "Failed to load MapKit");
        }
      }
    }

    initializeMapKit();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapkitReady || !containerRef.current || !window.mapkit) return;

    const mapkit = window.mapkit;
    const map = new mapkit.Map(containerRef.current);
    mapRef.current = map;

    map.showsCompass = mapkit.FeatureVisibility.Hidden;
    map.isRotationEnabled = false;
    map.isScrollEnabled = false;
    map.isZoomEnabled = false;
    map.isPitchEnabled = false;
    map.pointOfInterestFilter = mapkit.PointOfInterestFilter.ExcludingAll;

    const annotations = points.map((point) => {
      const annotation = new mapkit.MarkerAnnotation(
        new mapkit.Coordinate(point.lat, point.lng),
        {
          color: "#f97316",
          title: point.city,
          subtitle: `${point.count} events`,
        },
      );

      annotation.data = point;
      return annotation;
    });

    map.removeAnnotations(map.annotations);
    map.addAnnotations(annotations);

    if (points.length) {
      const center = new mapkit.Coordinate(points[0].lat, points[0].lng);
      map.region = new mapkit.CoordinateRegion(center, new mapkit.CoordinateSpan(8, 8));
    }

    const handleSingleTap = (event) => {
      const annotation = event?.annotation;
      if (!annotation?.data?.appleMapsUrl) return;
      window.open(annotation.data.appleMapsUrl, "_blank", "noopener,noreferrer");
    };

    map.addEventListener("select", handleSingleTap);

    return () => {
      map.removeEventListener("select", handleSingleTap);
      map.destroy();
      mapRef.current = null;
    };
  }, [mapkitReady, points]);

  if (mapkitError && mapkitError !== "MapKit token missing") {
    return (
      <div className="relative h-[450px] overflow-hidden rounded-[48px] border border-white/5 bg-[#0a0c12] p-6 text-sm text-gray-300 shadow-2xl">
        MapKit could not load.
      </div>
    );
  }

  if (mapkitError === "MapKit token missing") {
    return (
      <div className="relative h-[450px] overflow-hidden rounded-[48px] border border-white/5 bg-[#0a0c12] p-8 shadow-2xl">
        <div className="mb-4 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-200">
          Apple MapKit token required
        </div>
        <h3 className="text-2xl font-black tracking-tight text-white">
          MapKit JS is ready, but the token is missing.
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400">
          Add NEXT_PUBLIC_MAPKIT_JS_TOKEN to your environment, then the homepage
          will show real Apple maps with clickable city pins.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {points.slice(0, 4).map((point) => (
            <a
              key={point.city}
              href={point.appleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-orange-500/20"
            >
              {getEventLabel(point)}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[450px] overflow-hidden rounded-[48px] border border-white/5 bg-[#0a0c12] shadow-2xl">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent" />

      <div className="absolute left-5 top-5 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-200 backdrop-blur-md">
        Apple MapKit JS
      </div>

      <div className="absolute left-5 bottom-5 flex max-w-[70%] flex-wrap gap-2">
        {points.slice(0, 4).map((point) => (
          <a
            key={point.city}
            href={point.appleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto rounded-full border border-white/10 bg-black/60 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md transition-colors hover:bg-orange-500/20"
          >
            {point.city} · {point.count}
          </a>
        ))}
      </div>

      <a
        href={points[0]?.appleMapsUrl || buildAppleMapsUrl("Mumbai", "")}
        target="_blank"
        rel="noreferrer"
        className="absolute right-5 bottom-5 rounded-full border border-white/10 bg-black/60 px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-300 backdrop-blur-md transition-colors hover:bg-orange-500/20"
      >
        Open in Apple Maps
      </a>
    </div>
  );
}
