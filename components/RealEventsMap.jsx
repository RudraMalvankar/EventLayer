"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CITY_COORDINATES = {
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  delhi: [28.6139, 77.209],
  newdelhi: [28.6139, 77.209],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  gurugram: [28.4595, 77.0266],
  gurgaon: [28.4595, 77.0266],
  noida: [28.5355, 77.391],
  jaipur: [26.9124, 75.7873],
  indore: [22.7196, 75.8577],
  surat: [21.1702, 72.8311],
  kochi: [9.9312, 76.2673],
  coimbatore: [11.0168, 76.9558],
  bhubaneswar: [20.2961, 85.8245],
  lucknow: [26.8467, 80.9462],
  chandigarh: [30.7333, 76.7794],
  visakhapatnam: [17.6868, 83.2185],
  patna: [25.5941, 85.1376],
  bhopal: [23.2599, 77.4126],
};

const CITY_KEYS = Object.keys(CITY_COORDINATES).sort(
  (left, right) => right.length - left.length,
);

function normalizeCity(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function getCityCoords(city) {
  const normalized = normalizeCity(city);
  if (!normalized) return null;

  if (CITY_COORDINATES[normalized]) return CITY_COORDINATES[normalized];

  for (const key of CITY_KEYS) {
    if (normalized.includes(key)) return CITY_COORDINATES[key];
  }

  return null;
}

function getLocationCandidates(event) {
  return [
    event?.city,
    event?.location_detail,
    event?.location,
    event?.raw_data?.city,
    event?.raw_data?.location_detail,
    event?.raw_data?.location,
    event?.country,
  ].filter(Boolean);
}

function getEventDateLabel(value) {
  if (!value) return "Date TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildAppleMapsUrl({ city, locationDetail }) {
  const query = [locationDetail, city].filter(Boolean).join(", ") || city || "Mumbai, India";
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

function getMarkerIcon(city, count) {
  return L.divIcon({
    className: "",
    html: `
      <div class="flex items-center gap-3 rounded-full px-3 py-2" style="transform: translateY(-6px);">
        <div class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style="background: linear-gradient(180deg,#ff8a50,#ff6b00); color: white; box-shadow: 0 6px 18px rgba(255,107,0,0.24);">
          ${count}
        </div>
        <div class="text-sm font-semibold text-slate-900" style="text-shadow: 0 1px 0 rgba(255,255,255,0.6);">${city}</div>
      </div>
    `,
    iconSize: [160, 44],
    iconAnchor: [80, 44],
  });
}

function MapBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((point) => point.coords));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);

  return null;
}

export function RealEventsMap({ events = [] }) {
  const points = useMemo(() => {
    const cityMap = new Map();

    for (const event of events) {
      const coords =
        getLocationCandidates(event)
          .map((candidate) => getCityCoords(candidate))
          .find(Boolean) || null;
      if (!coords) continue;

      const candidateText =
        getLocationCandidates(event).find((value) => getCityCoords(value)) ||
        event?.city ||
        event?.location_detail ||
        event?.raw_data?.location ||
        event?.country ||
        "unknown";
      const key = normalizeCity(candidateText) || String(event.id || event.title);
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          city: candidateText,
          coords,
          appleMapsUrl: buildAppleMapsUrl({
            city: event?.city || candidateText,
            locationDetail: event?.location_detail || event?.raw_data?.location_detail || "",
          }),
          events: [],
        });
      }

      cityMap.get(key).events.push(event);
    }

    return Array.from(cityMap.values()).sort(
      (a, b) => b.events.length - a.events.length,
    );
  }, [events]);

  const totalEvents = points.reduce((sum, point) => sum + point.events.length, 0);

  return (
    <div className="relative h-[450px] overflow-hidden rounded-[48px] border border-white/5 bg-[#0a0c12] shadow-2xl group">
      <MapContainer
        center={[19.076, 72.8777]}
        zoom={4}
        scrollWheelZoom={false}
        className="absolute inset-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &amp; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {points.length ? <MapBounds points={points} /> : null}
        {points.map((point) => (
          <Marker
            key={point.city}
            position={point.coords}
            icon={getMarkerIcon(point.city, point.events.length)}
            eventHandlers={{
              click: () => {
                window.open(point.appleMapsUrl, "_blank", "noopener,noreferrer");
              },
            }}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -6]}
              className="!rounded-full !border-0 !bg-transparent !shadow-none"
            >
              <span className="rounded-full border border-orange-300 bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-[0_10px_24px_rgba(249,115,22,0.24)]">
                {point.city} · {point.events.length}
              </span>
            </Tooltip>
            <Popup>
              <div className="min-w-[220px] space-y-2">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
                  {point.city}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {point.events.length} live event
                  {point.events.length === 1 ? "" : "s"}
                </div>
                <div className="space-y-2">
                  {point.events.slice(0, 4).map((event) => (
                    <div
                      key={event.id || event.event_url || event.title}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="text-sm font-semibold text-slate-900">
                        {event.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {event.platform || "event"} · {getEventDateLabel(event.start_date)}
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href={point.appleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-orange-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600"
                >
                  Open in Apple Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent" />

      <div className="absolute left-5 top-5 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-200 backdrop-blur-md">
        Live events map
      </div>

      <div className="absolute left-5 bottom-5 flex max-w-[60%] flex-wrap gap-2">
        {points.slice(0, 4).map((point) => (
          <div
            key={point.city}
            className="rounded-full border border-white/10 bg-black/60 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md"
          >
            {point.city} · {point.events.length}
          </div>
        ))}
      </div>

      <div className="absolute right-5 bottom-5 rounded-full border border-white/10 bg-black/60 px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-300 backdrop-blur-md">
        {points.length} city clusters · {totalEvents} events
      </div>
    </div>
  );
}
