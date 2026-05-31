"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

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
  navimumbai: [19.033, 73.0297],
  thane: [19.2183, 72.9781],
  online: [20.5937, 78.9629],
};

const CITY_KEYS = Object.keys(CITY_COORDINATES).sort(
  (a, b) => b.length - a.length,
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
    event?.country,
  ].filter(Boolean);
}

function jitterCoords([lat, lng], index) {
  const offset = 0.015 * (index % 5);
  const angle = index * 1.7;
  return [lat + Math.sin(angle) * offset, lng + Math.cos(angle) * offset];
}

function getMarkerIcon(count) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:9999px;background:linear-gradient(135deg,#ff8a50,#ff4500);color:white;font-weight:800;font-size:14px;box-shadow:0 8px 24px rgba(255,69,0,0.45);border:2px solid rgba(255,255,255,0.35);">
        ${count}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function MapController({ points, selectedKey }) {
  const map = useMap();

  useEffect(() => {
    if (selectedKey) {
      const point = points.find((p) => p.key === selectedKey);
      if (point) {
        map.flyTo(point.coords, 10, { duration: 0.8 });
        return;
      }
    }
    if (!points.length) {
      map.setView([19.076, 72.8777], 5);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => p.coords));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
  }, [map, points, selectedKey]);

  return null;
}

function ClusterLayer({ points, onSelect }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
    });

    points.forEach((point, index) => {
      const coords = jitterCoords(point.coords, index);
      const marker = L.marker(coords, {
        icon: getMarkerIcon(point.events.length),
      });

      const listHtml = point.events
        .slice(0, 4)
        .map(
          (ev) =>
            `<li style="margin:6px 0;font-size:12px;color:#ddd"><strong style="color:#ff8a50">${ev.title || "Event"}</strong></li>`,
        )
        .join("");

      marker.bindPopup(`
        <div style="min-width:180px;font-family:system-ui,sans-serif">
          <div style="font-weight:800;color:#ff6b00;margin-bottom:4px">${point.city}</div>
          <div style="font-size:12px;color:#888;margin-bottom:8px">${point.events.length} event${point.events.length === 1 ? "" : "s"}</div>
          <ul style="padding-left:16px;margin:0">${listHtml}</ul>
          <button type="button" id="el-map-open-${point.key}" style="margin-top:10px;width:100%;padding:8px;border:none;border-radius:999px;background:#ff6b00;color:white;font-weight:700;font-size:11px;cursor:pointer">View events</button>
        </div>
      `);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`el-map-open-${point.key}`);
        btn?.addEventListener("click", () => onSelect(point.key), { once: true });
      });

      marker.on("click", () => onSelect(point.key));
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, points, onSelect]);

  return null;
}

export function RealEventsMap({ events = [] }) {
  const [selectedKey, setSelectedKey] = useState(null);

  const points = useMemo(() => {
    const cityMap = new Map();

    for (const event of events) {
      const coords =
        getLocationCandidates(event)
          .map((c) => getCityCoords(c))
          .find(Boolean) || null;
      if (!coords) continue;

      const label =
        getLocationCandidates(event).find((v) => getCityCoords(v)) ||
        event?.city ||
        "Unknown";
      const key = normalizeCity(label) || String(event.id);
      if (!cityMap.has(key)) {
        cityMap.set(key, { key, city: label, coords, events: [] });
      }
      cityMap.get(key).events.push(event);
    }

    return Array.from(cityMap.values()).sort(
      (a, b) => b.events.length - a.events.length,
    );
  }, [events]);

  const selected = points.find((p) => p.key === selectedKey) || null;
  const totalEvents = points.reduce((s, p) => s + p.events.length, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="relative h-[480px] overflow-hidden rounded-[40px] border border-white/10 bg-[#0a0c12] shadow-2xl">
        <MapContainer
          center={[19.076, 72.8777]}
          zoom={5}
          scrollWheelZoom
          className="absolute inset-0 z-0 h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapController points={points} selectedKey={selectedKey} />
          <ClusterLayer points={points} onSelect={setSelectedKey} />
        </MapContainer>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] flex justify-between p-5">
          <span className="rounded-full border border-orange-500/30 bg-black/60 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-orange-300 backdrop-blur-md">
            Interactive map
          </span>
          <span className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-300 backdrop-blur-md">
            {points.length} cities · {totalEvents} events
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] bg-gradient-to-t from-[#030407] via-[#030407]/80 to-transparent p-5 pt-16">
          <div className="pointer-events-auto flex flex-wrap gap-2">
            {points.slice(0, 6).map((point) => (
              <button
                key={point.key}
                type="button"
                onClick={() => setSelectedKey(point.key)}
                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition ${
                  selectedKey === point.key
                    ? "border-orange-500 bg-orange-500/20 text-orange-300"
                    : "border-white/10 bg-black/50 text-white hover:border-orange-500/40"
                }`}
              >
                {point.city} · {point.events.length}
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="flex max-h-[480px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0c12]">
        <div className="border-b border-white/5 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
            {selected ? selected.city : "Pick a city"}
          </p>
          <h3 className="mt-1 text-lg font-black text-white">
            {selected
              ? `${selected.events.length} events nearby`
              : "Tap a pin or chip"}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selected ? (
            selected.events.slice(0, 8).map((ev) => (
              <Link
                key={ev.id || ev.event_url}
                href={ev.id ? `/events/${ev.id}` : ev.event_url || "#"}
                className="block rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:border-orange-500/30 hover:bg-orange-500/5"
              >
                <p className="text-sm font-bold text-white line-clamp-2">
                  {ev.title}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {ev.platform} · {ev.city || "Online"}
                </p>
              </Link>
            ))
          ) : (
            <p className="p-4 text-sm text-gray-500">
              Zoom, pan, and click clusters to explore events by city. Scroll
              wheel zoom is enabled.
            </p>
          )}
        </div>
        {selected && (
          <div className="border-t border-white/5 p-4">
            <Link
              href={`/events?city=${encodeURIComponent(selected.city)}`}
              className="block w-full rounded-full bg-orange-500 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-orange-600"
            >
              Open all in {selected.city} →
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

export default RealEventsMap;
