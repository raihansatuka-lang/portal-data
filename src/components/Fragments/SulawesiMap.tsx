import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, GeoJSON, Marker, Tooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import indonesiaGeoData from "@/assets/geojson/indonesia-provinces.json";
import { createSchoolPopupHtml } from "@/utils/schoolPopup";

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
  externalHoveredKode?: string | null;
  externalActiveKode?: string | null;
  onKabupatenSelect?: (kode: string | null) => void;
  onKabupatenHover?: (kode: string | null) => void;
  onMapReady?: (map: L.Map) => void;
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
const createKabupatenIcon = (color: string, isActive = false, isMobile = false) => {
  const dotSize = isMobile ? 11 : 16;
  const pingSize = isMobile ? 22 : 30;
  const borderWidth = isMobile ? 2 : 2.5;

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
      ${isActive ? `<div style="position:absolute;width:${pingSize}px;height:${pingSize}px;border-radius:50%;background:${color}35;animation:ping 1.3s cubic-bezier(0,0,.2,1) infinite;"></div>` : ""}
      <div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${color};border:${borderWidth}px solid white;box-shadow:0 1.5px 7px ${color}88;position:relative;z-index:2;transition:all 0.2s;"></div>
    </div>`,
    iconSize: [dotSize, dotSize],
    iconAnchor: [dotSize / 2, dotSize / 2],
    popupAnchor: [0, -dotSize / 2 - 4],
  });
};

const ICON_CACHE: Record<string, L.DivIcon> = {};
const getKabupatenIcon = (color: string, isActive: boolean, isMobile: boolean) => {
  const key = `${color}-${isActive}-${isMobile}`;
  if (!ICON_CACHE[key]) {
    ICON_CACHE[key] = createKabupatenIcon(color, isActive, isMobile);
  }
  return ICON_CACHE[key];
};

const createJenjangSchoolIcon = (jenjang: string, isSelected = false) => {
  const upper = (jenjang || "").toUpperCase();
  let color = "#64748b";
  if (upper.includes("SMA") || upper.includes("MA")) color = "#8b5cf6";
  else if (upper.includes("SMK")) color = "#3b82f6";
  else if (upper.includes("SLB")) color = "#f59e0b";
  else if (upper.includes("SMTK")) color = "#14b8a6";

  const size = isSelected ? 15 : 10;
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
      ${isSelected ? `<div style="position:absolute;width:28px;height:28px;border-radius:50%;background:${color}44;animation:ping 1.3s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ""}
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 7px rgba(0,0,0,0.38);transition:all 0.2s;"></div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

// ─── Sub-component: FlyTo saat sekolah dipilih di Cabdis ──────────────────────
const FlyToSelectedSchool = ({ selectedSchool }: { selectedSchool: any }) => {
  const map = useMap();
  useEffect(() => {
    if (!selectedSchool) return;
    const lat = parseFloat(selectedSchool.latitude ?? selectedSchool.lintang);
    const lng = parseFloat(selectedSchool.longitude ?? selectedSchool.bujur);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      try {
        map.flyTo([lat, lng], Math.max(map.getZoom(), 13), {
          duration: 0.8,
          easeLinearity: 0.25,
        });
      } catch (e) {
        console.warn("FlyTo error:", e);
      }
    }
  }, [selectedSchool, map]);
  return null;
};

// ─── Sub-component: Capture map instance ────────────────────────────────────
const MapReadyHandler = ({ onMapReady }: { onMapReady?: (map: L.Map) => void }) => {
  const map = useMap();
  const calledRef = useRef(false);
  useEffect(() => {
    if (onMapReady && !calledRef.current) {
      calledRef.current = true;
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
};

// ─── Sub-component: sync center/zoom ─────────────────────────────────────────
const ChangeMapView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  const prev = useRef<string>("");
  useEffect(() => {
    const key = `${center[0]},${center[1]},${zoom}`;
    if (key !== prev.current) {
      prev.current = key;
      try {
        map.setView(center, zoom, { animate: true });
      } catch (e) {
        console.warn("ChangeMapView error:", e);
      }
    }
  }, [center, zoom, map]);
  return null;
};

// ─── Sub-component: Pan otomatis saat kabupaten diklik ────────────────────────
const PanToActiveKabupaten = ({
  activeKode,
  defaultCenter,
  isMobile,
}: {
  activeKode: string | null;
  defaultCenter: [number, number];
  isMobile: boolean;
}) => {
  const map = useMap();
  useEffect(() => {
    if (activeKode && KABUPATEN_CENTROIDS[activeKode]) {
      const centroid = KABUPATEN_CENTROIDS[activeKode];
      // Pada mobile, gunakan project/unproject untuk menggeser tepat 80px ke bawah layar
      // agar marker dan popup memiliki ruang lega di bawah header navbar transparan (tinggi 56px)
      const zoom = map.getZoom();
      const targetPoint = map.project([centroid.lat, centroid.lng], zoom);
      const offsetPoint = isMobile ? targetPoint.subtract([0, 80]) : targetPoint;
      const targetLatLng = map.unproject(offsetPoint, zoom);

      map.flyTo(targetLatLng, zoom, {
        duration: 0.45,
        easeLinearity: 0.25,
      });
    } else if (activeKode === null) {
      map.flyTo(defaultCenter, map.getZoom(), {
        duration: 0.45,
        easeLinearity: 0.25,
      });
    }
  }, [activeKode, defaultCenter, isMobile, map]);
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
  externalHoveredKode,
  externalActiveKode,
  onKabupatenSelect,
  onKabupatenHover,
  onMapReady,
}) => {
  const navigate = useNavigate();
  const [cabdisGeoData, setCabdisGeoData] = useState<Record<number, any>>({});
  const [sultengGeo, setSultengGeo]       = useState<any>(null);
  const [internalActiveKode, setInternalActiveKode]   = useState<string | null>(null);
  const [internalHoveredKode, setInternalHoveredKode] = useState<string | null>(null);

  const activeKode  = externalActiveKode  !== undefined ? externalActiveKode  : internalActiveKode;
  const hoveredKode = externalHoveredKode !== undefined ? externalHoveredKode : internalHoveredKode;

  // Deteksi layar mobile untuk optimasi ukuran marker dan popup
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // 1. Peta Sulawesi Tengah per kabupaten — hanya untuk dashboard utama
    if (!onlyShowId) {
      fetch("/geojson/sulteng-light.geojson")
        .then((r) => r.json())
        .then(setSultengGeo)
        .catch(console.error);
    }

    // 2. GeoJSON detail cabdis — HANYA difetch saat halaman detail cabdis
    if (onlyShowId) {
      fetch(`/geojson/cabdis/cabdis${onlyShowId}.geojson`)
        .then((r) => r.json())
        .then((geo) => setCabdisGeoData({ [onlyShowId]: geo }))
        .catch(console.error);
    }
  }, [onlyShowId]);

  const effectiveStats = (kabupatenStats && kabupatenStats.length > 0) ? kabupatenStats : [];

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

  const mapCenter: [number, number] = (customCenter && !isNaN(parseFloat(String(customCenter[0]))) && !isNaN(parseFloat(String(customCenter[1]))))
    ? [parseFloat(String(customCenter[0])), parseFloat(String(customCenter[1]))]
    : [-2.9, 121.5];
  const mapZoom: number = (customZoom && !isNaN(parseFloat(String(customZoom))))
    ? parseFloat(String(customZoom))
    : 7.5;
  const isInteractive = !!onlyShowId;

  // Styles
  const baseStyle    = () => ({ color: "#d1d5db", weight: 0.8, fillColor: "#e2e8f0", fillOpacity: 1 });
  const cabdisStyle  = () => ({ color: "#3b82f6", weight: 1.5, fillColor: "#3b82f6", fillOpacity: 0.08 });

  // Handlers
  const handleSelect = useCallback((kode: string) => {
    const next = activeKode === kode ? null : kode;
    if (externalActiveKode === undefined) {
      setInternalActiveKode(next);
    }
    onKabupatenSelect?.(next);
  }, [activeKode, externalActiveKode, onKabupatenSelect]);

  const handleHover = useCallback((kode: string | null) => {
    if (externalHoveredKode === undefined) {
      setInternalHoveredKode(kode);
    }
    onKabupatenHover?.(kode);
  }, [externalHoveredKode, onKabupatenHover]);

  const navigateToKabupaten = (kode: string) => {
    navigate(`/kabupaten/${kode}`);
  };

  const handlePopupClose = useCallback(() => {
    if (externalActiveKode === undefined) {
      setInternalActiveKode(null);
    }
    onKabupatenSelect?.(null);
  }, [externalActiveKode, onKabupatenSelect]);

  // Data untuk popup kabupaten aktif
  const activeKabData = activeKode ? KABUPATEN_CENTROIDS[activeKode] : null;
  const activeNormName = activeKabData?.nama.toLowerCase().replace(/^kab\.\s*/i, "").replace(/^kota\s*/i, "").replace(/-/g, " ").trim();
  const activeStat    = activeKode ? (statByKode[activeKode] || (activeNormName ? statByKode[activeNormName] : null)) : null;
  const activeColor   = activeKabData ? (CABDIS_CONFIG[activeKabData.slug]?.color ?? "#2563eb") : "#2563eb";

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-transparent">
      <MapContainer
        key={`map-${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
        center={mapCenter}
        zoom={mapZoom}
        minZoom={6}
        maxZoom={18}
        zoomSnap={0.25}
        zoomDelta={0.5}
        zoomControl={false}
        dragging={onlyShowId ? true : false}
        scrollWheelZoom={onlyShowId ? true : false}
        doubleClickZoom={onlyShowId ? true : false}
        touchZoom={onlyShowId ? true : false}
        boxZoom={onlyShowId ? true : false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <MapReadyHandler onMapReady={onMapReady} />
        <ChangeMapView center={mapCenter} zoom={mapZoom} />
        {!onlyShowId && <PanToActiveKabupaten activeKode={activeKode} defaultCenter={mapCenter} isMobile={isMobile} />}

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
              const isHovered = hoveredKode === kode;
              return (
                <Marker
                  key={`kab-${kode}`}
                  position={centroid as L.LatLngExpression}
                  icon={getKabupatenIcon(color, isActive || isHovered, isMobile)}
                  zIndexOffset={isActive || isHovered ? 1000 : 0}
                  eventHandlers={{
                    click: () => handleSelect(kode),
                  }}
                >
                  {/* Tooltip hover */}
                  <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={1}
                    permanent={false}
                    className="kab-tooltip"
                  >
                    <span className="font-bold text-[10px] text-slate-800 whitespace-nowrap">
                      {centroid.nama}
                    </span>
                  </Tooltip>
                </Marker>
              );
            })}

            {/* ━━━ POPUP DETAIL kabupaten (Sleek & Compact) ━━━ */}
            {!onlyShowId && activeKode && activeKabData && (
              <Popup
                key={`popup-${activeKode}-${isMobile ? "m" : "d"}`}
                position={activeKabData}
                minWidth={isMobile ? 180 : 225}
                maxWidth={isMobile ? 220 : 255}
                className="kab-popup"
                closeButton={true}
                autoPan={true}
                autoPanPaddingTopLeft={L.point(16, isMobile ? 65 : 20) as any}
                autoPanPaddingBottomRight={L.point(16, 16) as any}
                eventHandlers={{
                  remove: handlePopupClose,
                }}
              >
                <div className="font-poppins flex flex-col gap-2 p-0.5 min-w-[180px]">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-9 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shadow-2xs">
                      <img
                        src={getRegionLogo(activeKabData.nama)}
                        alt={activeKabData.nama}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 pr-4">
                      <div
                        className="text-[8.5px] font-black uppercase tracking-wider mb-0.5 truncate"
                        style={{ color: activeColor }}
                      >
                        {CABDIS_CONFIG[activeKabData.slug]?.label ? `Wil. ${activeKabData.slug.replace("cabdis-", "")}` : "Kabupaten / Kota"}
                      </div>
                      <div className="font-black text-slate-900 text-xs leading-tight truncate">
                        {activeKabData.nama}
                      </div>
                      <div className="text-[8.5px] text-slate-500 font-semibold mt-0.5 truncate">
                        Sulawesi Tengah
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid 2-kolom ringkas & padat */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex flex-col px-2 py-1 rounded-lg bg-emerald-50/80 border border-emerald-100/90">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700">Total Sekolah</span>
                      <span className="font-black text-slate-900 text-xs leading-tight">
                        {(activeStat?.total_sekolah ?? activeStat?.jumlah_sekolah ?? 0).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex flex-col px-2 py-1 rounded-lg bg-amber-50/80 border border-amber-100/90">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700">Total Siswa</span>
                      <span className="font-black text-slate-900 text-xs leading-tight">
                        {(activeStat?.total_siswa ?? activeStat?.jumlah_siswa ?? 0).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center justify-between px-2 py-1 rounded-lg bg-sky-50/80 border border-sky-100/90">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-sky-700">Negeri / Swasta</span>
                      <span className="font-black text-slate-800 text-[11px]">
                        {(activeStat?.total_negeri ?? activeStat?.negeri ?? 0).toLocaleString("id-ID")}
                        <span className="text-slate-400 font-normal"> / </span>
                        {(activeStat?.total_swasta ?? activeStat?.swasta ?? 0).toLocaleString("id-ID")}
                      </span>
                    </div>

                    {(activeStat?.total_3t ?? 0) > 0 && (
                      <div className="col-span-2 flex items-center justify-between px-2 py-1 rounded-lg bg-rose-50/80 border border-rose-100/90">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-rose-700">Sekolah 3T</span>
                        <span className="font-black text-rose-600 text-[11px]">
                          {activeStat!.total_3t!.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => navigateToKabupaten(activeKode)}
                    className="w-full py-1.5 rounded-lg text-white text-[10.5px] font-black uppercase tracking-wider hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer mt-0.5"
                    style={{ background: `linear-gradient(135deg, ${activeColor}, ${activeColor}dd)` }}
                  >
                    <span>Kunjungi Wilayah</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </Popup>
            )}

            {/* ━━━ SCHOOL MARKERS & FLYTO — halaman cabdis ━━━ */}
            {onlyShowId && (
              <>
                <FlyToSelectedSchool selectedSchool={selectedSchool} />

                <React.Fragment key={`schools-layer-${onlyShowId}`}>
                  {schools.map((school: any, idx: number) => {
                    const lat = parseFloat(school.latitude ?? school.lintang);
                    const lng = parseFloat(school.longitude ?? school.bujur);
                    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

                    // Abaikan koordinat dummy / invalid (0, 0 atau mendekati nol)
                    if (Math.abs(lat) < 0.01 || Math.abs(lng) < 0.01) return null;

                    const jenjang = school.grade ?? school.bentuk_pendidikan ?? "SMA";
                    const isSelected = (selectedSchool?.id === school.id) || (selectedSchool?.npsn === school.npsn);

                    return (
                      <Marker
                        key={`school-${onlyShowId}-${school.npsn || school.id || idx}-${idx}`}
                        position={[lat, lng]}
                        icon={createJenjangSchoolIcon(jenjang, isSelected)}
                        eventHandlers={{ click: () => onSchoolClick?.(school) }}
                      >
                        <Tooltip direction="top" offset={[0, -6]}>
                          <div className="font-poppins text-center py-0.5 max-w-[200px]">
                            <span className="font-bold text-[10.5px] text-slate-900 block leading-tight truncate">
                              {school.name ?? school.nama}
                            </span>
                            <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">
                              {jenjang} • {school.status ?? school.status_sekolah ?? "—"}
                            </span>
                            {school.kabupaten && (
                              <span className="text-[8.5px] text-blue-600 font-semibold block mt-0.5 truncate">
                                {school.kabupaten}
                              </span>
                            )}
                          </div>
                        </Tooltip>
                      </Marker>
                    );
                  })}
                </React.Fragment>

                {/* Popup sekolah yang dipilih (Unified Standard Popup) */}
                {selectedSchool && (() => {
                  const rawLat = selectedSchool.latitude ?? selectedSchool.lintang;
                  const rawLng = selectedSchool.longitude ?? selectedSchool.bujur;
                  const lat = parseFloat(String(rawLat ?? "0"));
                  const lng = parseFloat(String(rawLng ?? "0"));
                  if (isNaN(lat) || isNaN(lng) || Math.abs(lat) < 0.01 || Math.abs(lng) < 0.01) return null;

                  return (
                    <Popup
                      position={[lat, lng]}
                      eventHandlers={{ remove: () => onPopupClose?.() }}
                      offset={[0, -6]}
                      className="custom-school-popup"
                      maxWidth={300}
                      minWidth={250}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: createSchoolPopupHtml(selectedSchool),
                        }}
                      />
                    </Popup>
                  );
                })()}
              </>
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
          border-radius: 16px !important;
          border: 1px solid rgba(0,0,0,.08) !important;
          box-shadow: 0 12px 36px rgba(0,0,0,.15) !important;
          padding: 0 !important;
        }
        .kab-popup .leaflet-popup-content {
          margin: 10px 11px !important;
        }
        .kab-popup .leaflet-popup-tip-container { display: none !important; }
        .kab-popup .leaflet-popup-close-button {
          top: 6px !important;
          right: 6px !important;
          width: 20px !important;
          height: 20px !important;
          font-size: 14px !important;
          line-height: 20px !important;
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
