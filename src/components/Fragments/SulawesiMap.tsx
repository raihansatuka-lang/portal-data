import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, GeoJSON, Marker, Tooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { PemetaanService } from "@/services/pemetaanService";

import indonesiaGeoData from "@/assets/geojson/indonesia-provinces.json";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MapProps {
  kabupatenStats?: KabupatenStat[];
  onSchoolClick?: (school: any) => void;
  onPopupClose?: () => void;
  layer?: "base" | "interactive";
  onlyShowId?: number | null;
  schools?: any[];
  customCenter?: [number, number] | null;
  customZoom?: number | null;
  selectedSchool?: any;
  /** @deprecated pakai kabupatenStats */
  markers?: any[];
  /** @deprecated */
  onViewDetail?: (marker: any) => void;
}

interface KabupatenStat {
  kabupaten: string;
  kode_kabupaten: string;
  total_sekolah: number;
  total_negeri?: number;
  total_swasta?: number;
  total_siswa?: number;
  total_3t?: number;
}

// ─── Konfigurasi Kabupaten/Kota ───────────────────────────────────────────────
// Koordinat sentroid per kode kabupaten (lat, lng) — untuk marker label
const KABUPATEN_CENTROIDS: Record<string, { lat: number; lng: number; nama: string; slug: string }> = {
  "7271": { lat: -0.896,                lng: 119.870,              nama: "Kota Palu",              slug: "cabdis-1" },
  "7210": { lat: -1.270,                lng: 119.950,              nama: "Kab. Sigi",              slug: "cabdis-1" },
  "7203": { lat: -0.6721399295462716,   lng: 119.73936281878127,   nama: "Kab. Donggala",          slug: "cabdis-2" },
  "7208": { lat: -0.804293780887207,    lng: 120.16165506606013,   nama: "Kab. Parigi Moutong",    slug: "cabdis-2" },
  "7202": { lat: -1.540,                lng: 120.700,              nama: "Kab. Poso",              slug: "cabdis-3" },
  "7209": { lat: -0.8715999436657104,   lng: 121.58473086011769,   nama: "Kab. Tojo Una-Una",      slug: "cabdis-3" },
  "7206": { lat: -2.805842830642464,    lng: 122.13486171298135,   nama: "Kab. Morowali",          slug: "cabdis-4" },
  "7212": { lat: -2.050,                lng: 121.350,              nama: "Kab. Morowali Utara",    slug: "cabdis-4" },
  "7201": { lat: -0.9550224577046444,   lng: 122.7851615253373,    nama: "Kab. Banggai",           slug: "cabdis-5" },
  "7207": { lat: -1.3167381544083439,   lng: 123.29373169709486,   nama: "Kab. Banggai Kepulauan", slug: "cabdis-5" },
  "7211": { lat: -1.5902649554508304,   lng: 123.50190081150062,   nama: "Kab. Banggai Laut",      slug: "cabdis-5" },
  "7204": { lat: 1.0459157944383792,    lng: 120.81786711155078,   nama: "Kab. Tolitoli",          slug: "cabdis-6" },
  "7205": { lat: 1.1688317335532588,    lng: 121.42202664454905,   nama: "Kab. Buol",              slug: "cabdis-6" },
};

// ─── Warna & label per Cabang Dinas ──────────────────────────────────────────
export const CABDIS_CONFIG: Record<string, { color: string; label: string; bg: string; ring: string }> = {
  "cabdis-1": { color: "#2563eb", label: "Wilayah 1 — Palu & Sigi",               bg: "bg-blue-600",   ring: "ring-blue-300"   },
  "cabdis-2": { color: "#7c3aed", label: "Wilayah 2 — Donggala & Parigi Moutong", bg: "bg-violet-600", ring: "ring-violet-300" },
  "cabdis-3": { color: "#0891b2", label: "Wilayah 3 — Poso & Tojo Una-Una",       bg: "bg-cyan-600",   ring: "ring-cyan-300"   },
  "cabdis-4": { color: "#059669", label: "Wilayah 4 — Morowali",                  bg: "bg-emerald-600",ring: "ring-emerald-300"},
  "cabdis-5": { color: "#d97706", label: "Wilayah 5 — Banggai",                   bg: "bg-amber-500",  ring: "ring-amber-300"  },
  "cabdis-6": { color: "#dc2626", label: "Wilayah 6 — Tolitoli & Buol",           bg: "bg-red-600",    ring: "ring-red-300"    },
};

// ─── Helper logo kabupaten ──────────────────────────────────────────────────
const getRegionLogo = (kabupaten: string) => {
  const isKota = kabupaten.toLowerCase().startsWith("kota");
  const name = kabupaten.replace(/^Kab\.\s*/i, "").replace(/^Kota\s*/i, "").trim();
  const prefix = isKota ? "Kota" : "Kabupaten";
  return `/images/kabupaten_kota.png/${encodeURIComponent(`${prefix} ${name}`)}.png`;
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const createKabupatenIcon = (color: string, isActive = false) =>
  L.divIcon({
    className: "",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
      ${isActive ? `<div style="position:absolute;width:34px;height:34px;border-radius:50%;background:${color}33;animation:ping 1.4s cubic-bezier(0,0,.2,1) infinite;"></div>` : ""}
      <div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 10px ${color}99;position:relative;z-index:2;"></div>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -14],
  });

const ICON_CACHE: Record<string, L.DivIcon> = {};
const getKabupatenIcon = (color: string, isActive: boolean) => {
  const key = `${color}-${isActive}`;
  if (!ICON_CACHE[key]) {
    ICON_CACHE[key] = createKabupatenIcon(color, isActive);
  }
  return ICON_CACHE[key];
};

const schoolNegeriIcon = L.divIcon({
  html: `<div style="background:#2563eb;width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.3)"></div>`,
  className: "",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const schoolSwastaIcon = L.divIcon({
  html: `<div style="background:#10b981;width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.3)"></div>`,
  className: "",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// ─── Sub-component: sync center/zoom ─────────────────────────────────────────
const ChangeMapView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  const prev = useRef<string>("");
  useEffect(() => {
    const key = `${center[0]},${center[1]},${zoom}`;
    if (key !== prev.current) {
      prev.current = key;
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

// ─── Sub-component: Pan otomatis saat kabupaten diklik ────────────────────────
const PanToActiveKabupaten = ({
  activeKode,
  defaultCenter,
}: {
  activeKode: string | null;
  defaultCenter: [number, number];
}) => {
  const map = useMap();
  useEffect(() => {
    if (activeKode && KABUPATEN_CENTROIDS[activeKode]) {
      const centroid = KABUPATEN_CENTROIDS[activeKode];
      map.flyTo([centroid.lat, centroid.lng], map.getZoom(), {
        duration: 0.5,
        easeLinearity: 0.25,
      });
    } else if (activeKode === null) {
      map.flyTo(defaultCenter, map.getZoom(), {
        duration: 0.5,
        easeLinearity: 0.25,
      });
    }
  }, [activeKode, defaultCenter, map]);
  return null;
};

// ─── GeoJSON Layer interaktif per kabupaten ───────────────────────────────────
interface KabupatenGeoJSONProps {
  sultengGeo: any;
  statByKode: Record<string, KabupatenStat>;
  hoveredKode: string | null;
  activeKode: string | null;
  onHover: (kode: string | null) => void;
  onSelect: (kode: string) => void;
}

const KabupatenGeoJSON: React.FC<KabupatenGeoJSONProps> = ({
  sultengGeo,
  statByKode,
  hoveredKode,
  activeKode,
  onHover,
  onSelect,
}) => {
  // Kita buat GeoJSON layer per kabupaten supaya styling bisa individu
  if (!sultengGeo?.features) return null;

  return (
    <>
      {sultengGeo.features.map((feature: any, idx: number) => {
        const kode = feature?.properties?.KODE_KAB ?? "";
        const centroid = KABUPATEN_CENTROIDS[kode];
        const cabdis = centroid?.slug ?? "cabdis-1";
        const color = CABDIS_CONFIG[cabdis]?.color ?? "#2563eb";

        const isHovered = hoveredKode === kode;
        const isActive  = activeKode  === kode;

        const style = {
          color: "#ffffff",
          weight: isHovered || isActive ? 2.5 : 1.5,
          fillColor: color,
          fillOpacity: isActive ? 0.85 : isHovered ? 0.75 : 0.55,
          className: "sulteng-polygon",
        };

        return (
          <GeoJSON
            key={`kab-${kode}-${idx}`}
            data={feature}
            style={() => style}
            eventHandlers={{
              mouseover: (e) => {
                e.target.setStyle({ fillOpacity: 0.78, weight: 2.5 });
                onHover(kode);
              },
              mouseout: (e) => {
                e.target.setStyle(style);
                onHover(null);
              },
              click: () => {
                if (kode) onSelect(kode);
              },
            }}
          />
        );
      })}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const SulawesiMap: React.FC<MapProps> = ({
  kabupatenStats = [],
  onSchoolClick,
  onPopupClose,
  layer = "base",
  onlyShowId = null,
  schools = [],
  customCenter = null,
  customZoom = null,
  selectedSchool,
}) => {
  const navigate = useNavigate();
  const [cabdisGeoData, setCabdisGeoData] = useState<Record<number, any>>({});
  const [sultengGeo, setSultengGeo]       = useState<any>(null);
  const [activeKode, setActiveKode]       = useState<string | null>(null);
  const [hoveredKode, setHoveredKode]     = useState<string | null>(null);

  // Load geojson
  useEffect(() => {
    fetch("/geojson/sulteng.geojson")
      .then((r) => r.json())
      .then(setSultengGeo)
      .catch(console.error);

    const loadCabdis = async () => {
      const data: Record<number, any> = {};
      for (let i = 1; i <= 6; i++) {
        try {
          const res = await fetch(`/geojson/cabdis/cabdis${i}.geojson`);
          data[i] = await res.json();
        } catch {/* skip */}
      }
      setCabdisGeoData(data);
    };
    loadCabdis();
  }, []);

  const [fallbackStats, setFallbackStats] = useState<any[]>([]);

  useEffect(() => {
    if (!kabupatenStats || kabupatenStats.length === 0) {
      PemetaanService.getStatistikKabupaten()
        .then((res) => {
          if (res?.data) setFallbackStats(res.data);
        })
        .catch(console.error);
    }
  }, [kabupatenStats]);

  const effectiveStats = (kabupatenStats && kabupatenStats.length > 0) ? kabupatenStats : fallbackStats;

  // Konversi kode backend (6-digit Kemendikbud) → kode BPS (4-digit GeoJSON)
  const BACKEND_TO_BPS: Record<string, string> = {
    "180400": "7201", // Banggai
    "180100": "7207", // Banggai Kepulauan
    "181100": "7211", // Banggai Laut
    "180500": "7205", // Buol
    "180200": "7203", // Donggala
    "180700": "7206", // Morowali
    "181200": "7212", // Morowali Utara
    "180800": "7208", // Parigi Moutong
    "180300": "7202", // Poso
    "181000": "7210", // Sigi
    "180900": "7209", // Tojo Una-Una
    "180600": "7204", // Tolitoli
    "186000": "7271", // Kota Palu
  };

  // Build lookup: kode BPS (4-digit) → stat
  const statByKode: Record<string, any> = {};
  effectiveStats.forEach((s: any) => {
    // 1. Kode BPS langsung (jika sudah format 4 digit)
    const rawKode = String(s.kode_kabupaten ?? s.kode ?? "").trim();
    if (rawKode) {
      statByKode[rawKode] = s;
      // 2. Konversi kode backend → BPS
      const bpsKode = BACKEND_TO_BPS[rawKode];
      if (bpsKode) statByKode[bpsKode] = s;
    }

    // 3. Nama kabupaten (normalisasi: lowercase, hapus prefix, hapus tanda hubung)
    const nameStr = s.kabupaten ?? s.nama;
    if (nameStr) {
      const norm = nameStr.toLowerCase()
        .replace(/^kab\.\s*/i, "")
        .replace(/^kota\s*/i, "")
        .replace(/-/g, " ")  // "tojo una-una" → "tojo una una"
        .trim();
      statByKode[norm] = s;
    }
  });

  const mapCenter: [number, number] = customCenter ?? [-1.20, 121.0];
  const mapZoom   = customZoom ?? 7.6;
  const isInteractive = !!onlyShowId;

  // Styles
  const baseStyle    = () => ({ color: "#d1d5db", weight: 0.8, fillColor: "#e2e8f0", fillOpacity: 1 });
  const cabdisStyle  = () => ({ color: "#3b82f6", weight: 1.5, fillColor: "#3b82f6", fillOpacity: 0.08 });

  // Handlers
  const handleSelect = useCallback((kode: string) => {
    setActiveKode(prev => prev === kode ? null : kode);
  }, []);

  const handleHover = useCallback((kode: string | null) => {
    setHoveredKode(kode);
  }, []);

  const navigateToCabdis = (slug: string, nama: string) => {
    navigate(`/${slug}?name=${encodeURIComponent(nama)}`);
  };

  const handlePopupClose = useCallback(() => {
    setActiveKode(null);
  }, []);

  // Data untuk popup kabupaten aktif
  const activeKabData = activeKode ? KABUPATEN_CENTROIDS[activeKode] : null;
  const activeNormName = activeKabData?.nama.toLowerCase().replace(/^kab\.\s*/i, "").replace(/^kota\s*/i, "").replace(/-/g, " ").trim();
  const activeStat    = activeKode ? (statByKode[activeKode] || (activeNormName ? statByKode[activeNormName] : null)) : null;
  const activeColor   = activeKabData ? (CABDIS_CONFIG[activeKabData.slug]?.color ?? "#2563eb") : "#2563eb";

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-transparent">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomSnap={0.1}
        zoomDelta={0.1}
        zoomControl={isInteractive && !!onlyShowId}
        dragging={onlyShowId ? true : false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <ChangeMapView center={mapCenter} zoom={mapZoom} />
        <PanToActiveKabupaten activeKode={activeKode} defaultCenter={mapCenter} />

        {/* ── BASE: Peta Indonesia abu-abu ── */}
        {layer === "base" && (
          <GeoJSON data={indonesiaGeoData as any} style={baseStyle} interactive={false} />
        )}

        {/* ── INTERACTIVE ── */}
        {layer === "interactive" && (
          <>
            {/* Background Indonesia */}
            <GeoJSON data={indonesiaGeoData as any} style={baseStyle} interactive={false} />

            {/* ━━━ DASHBOARD UTAMA: polygon per kabupaten ━━━ */}
            {!onlyShowId && sultengGeo && (
              <KabupatenGeoJSON
                sultengGeo={sultengGeo}
                statByKode={statByKode}
                hoveredKode={hoveredKode}
                activeKode={activeKode}
                onHover={handleHover}
                onSelect={handleSelect}
              />
            )}

            {/* ━━━ HALAMAN CABDIS: polygon kabupaten wilayah ━━━ */}
            {onlyShowId && Object.entries(cabdisGeoData).map(([num, geo]) => {
              if (parseInt(num) !== onlyShowId) return null;
              return (
                <GeoJSON
                  key={`cabdis-${num}`}
                  data={geo}
                  style={cabdisStyle}
                  interactive={false}
                />
              );
            })}

            {/* ━━━ MARKER per kabupaten — dashboard utama ━━━ */}
            {!onlyShowId && Object.entries(KABUPATEN_CENTROIDS).map(([kode, centroid]) => {
              const color    = CABDIS_CONFIG[centroid.slug]?.color ?? "#2563eb";
              const isActive = activeKode === kode;
              return (
                <Marker
                  key={`kab-${kode}`}
                  position={centroid as L.LatLngExpression}
                  icon={getKabupatenIcon(color, isActive)}
                  zIndexOffset={isActive ? 1000 : 0}
                  eventHandlers={{
                    click: () => handleSelect(kode),
                  }}
                >
                  {/* Tooltip hover */}
                  <Tooltip
                    direction="top"
                    offset={[0, -14]}
                    opacity={1}
                    permanent={false}
                    className="kab-tooltip"
                  >
                    <span className="font-bold text-[11px] text-slate-800 whitespace-nowrap">
                      {centroid.nama}
                    </span>
                  </Tooltip>
                </Marker>
              );
            })}

            {/* ━━━ POPUP DETAIL kabupaten ━━━ */}
            {!onlyShowId && activeKode && activeKabData && (
              <Popup
                key={`popup-${activeKode}`}
                position={activeKabData}
                minWidth={230}
                maxWidth={270}
                className="kab-popup"
                closeButton={false}
                eventHandlers={{
                  remove: handlePopupClose,
                }}
              >
                <div className="font-poppins flex flex-col gap-3 p-1 min-w-[220px]">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 flex items-center justify-center shadow-sm">
                      <img
                        src={getRegionLogo(activeKabData.nama)}
                        alt={activeKabData.nama}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: activeColor }}>
                        Kabupaten / Kota
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs leading-snug truncate">
                        {activeKabData.nama}
                      </div>
                      <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
                        {CABDIS_CONFIG[activeKabData.slug]?.label ?? ""}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Sekolah</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {(activeStat?.total_sekolah ?? activeStat?.jumlah_sekolah ?? 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-50 border border-sky-100">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Negeri / Swasta</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {(activeStat?.total_negeri ?? activeStat?.negeri ?? 0).toLocaleString("id-ID")}
                        <span className="text-slate-400 font-normal"> / </span>
                        {(activeStat?.total_swasta ?? activeStat?.swasta ?? 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Siswa</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {(activeStat?.total_siswa ?? activeStat?.jumlah_siswa ?? 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    {(activeStat?.total_3t ?? 0) > 0 && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50 border border-rose-100">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sekolah 3T</span>
                        <span className="font-extrabold text-rose-600 text-sm">
                          {activeStat!.total_3t!.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => navigateToCabdis(activeKabData.slug, activeKabData.nama)}
                    className="w-full py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider shadow-md transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)` }}
                  >
                    Kunjungi Wilayah
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </Popup>
            )}

            {/* ━━━ SCHOOL MARKERS — halaman cabdis ━━━ */}
            {onlyShowId && schools.map((school: any) => {
              const lat = parseFloat(school.latitude ?? school.lintang);
              const lng = parseFloat(school.longitude ?? school.bujur);
              if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
              const isSwasta = school.name?.toUpperCase().includes("SWASTA") ||
                school.status_sekolah === "Swasta";
              return (
                <Marker
                  key={school.id ?? school.npsn}
                  position={[lat, lng]}
                  icon={isSwasta ? schoolSwastaIcon : schoolNegeriIcon}
                  eventHandlers={{ click: () => onSchoolClick?.(school) }}
                >
                  <Tooltip direction="top" offset={[0, -4]}>
                    <span className="font-bold text-[10px] text-slate-800">
                      {school.name ?? school.nama}
                    </span>
                  </Tooltip>
                </Marker>
              );
            })}

            {/* Popup sekolah yang dipilih */}
            {onlyShowId && selectedSchool && (
              <Popup
                position={[
                  parseFloat(selectedSchool.latitude ?? selectedSchool.lintang),
                  parseFloat(selectedSchool.longitude ?? selectedSchool.bujur),
                ]}
                eventHandlers={{ remove: () => onPopupClose?.() }}
              >
                <div className="px-2 py-1.5 flex flex-col gap-0.5 text-slate-800 font-poppins">
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-0.5">Sekolah Aktif</p>
                  <p className="text-xs font-bold uppercase leading-snug">{selectedSchool.name ?? selectedSchool.nama}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">NPSN: {selectedSchool.npsn ?? "—"}</p>
                </div>
              </Popup>
            )}
          </>
        )}
      </MapContainer>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-container {
          background: transparent !important;
        }
        .leaflet-popup {
          pointer-events: auto !important;
        }
        /* Tooltip kabupaten */
        .kab-tooltip {
          background: white !important;
          border: 1px solid #f1f5f9 !important;
          border-radius: 10px !important;
          padding: 4px 10px !important;
          font-size: 11px !important;
          box-shadow: 0 4px 14px rgba(0,0,0,.1) !important;
          white-space: nowrap !important;
        }
        .kab-tooltip::before { display: none !important; }
        /* Popup kabupaten */
        .kab-popup .leaflet-popup-content-wrapper {
          border-radius: 20px !important;
          border: 1px solid rgba(0,0,0,.06) !important;
          box-shadow: 0 16px 48px rgba(0,0,0,.15) !important;
          padding: 0 !important;
        }
        .kab-popup .leaflet-popup-content {
          margin: 14px !important;
        }
        .kab-popup .leaflet-popup-tip-container { display: none !important; }
        .kab-popup .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          width: 22px !important;
          height: 22px !important;
          font-size: 16px !important;
          line-height: 22px !important;
          background: #f8fafc !important;
          border-radius: 50% !important;
          color: #94a3b8 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        /* Smooth polygon transition */
        .sulteng-polygon {
          transition: fill-opacity 0.15s ease, stroke-width 0.15s ease !important;
        }
        .sulteng-polygon:hover {
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
};
