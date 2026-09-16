import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, GeoJSON, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronLeft, School as SchoolIcon, MapPin, Eye, Search, Pencil, Trash2, Plus } from "lucide-react";
import { PemetaanService } from "@/services/pemetaanService";
import { AdminService } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { DeleteConfirmModal } from "@/components/Admin/DeleteConfirmModal";
import type { SekolahMarker, StatistikKabupatenItem } from "@/types";
import { CABDIS_CONFIG } from "@/components/Fragments/SulawesiMap";
import { GeneralDataSection } from "@/components/Sections/GeneralDataSection";

// ─── Mapping kode kabupaten → nama file GeoJSON kecamatan ────────────────────
const KODE_TO_GEOJSON: Record<string, string> = {
  "7271": "palu",
  "7210": "sigi",
  "7203": "donggala",
  "7208": "parigi",
  "7202": "poso",
  "7209": "tojo",
  "7206": "morowali",
  "7212": "morut",
  "7201": "banggai",
  "7207": "bangkep",
  "7204": "tolitoli",
  "7205": "buol",
};

// ─── Mapping kode kabupaten → info lengkap + maxBounds ──────────────────────
// maxBounds: [[lat_min, lng_min], [lat_max, lng_max]] — batas geser peta
const KABUPATEN_INFO: Record<string, {
  nama: string;
  slug: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
}> = {
  "7271": { nama: "Kota Palu",              slug: "cabdis-1", center: [-0.896,  119.870], zoom: 12, bounds: [[-1.35,  119.45], [-0.40,  120.30]] },
  "7210": { nama: "Kab. Sigi",              slug: "cabdis-1", center: [-1.463,  119.963], zoom: 9,  bounds: [[-2.45,  119.20], [-0.50,  120.70]] },
  "7203": { nama: "Kab. Donggala",          slug: "cabdis-2", center: [-0.350,  119.811], zoom: 8,  bounds: [[-1.85,  118.80], [ 1.25,  120.60]] },
  "7208": { nama: "Kab. Parigi Moutong",    slug: "cabdis-2", center: [-0.222,  120.641], zoom: 8,  bounds: [[-1.60,  119.40], [ 1.20,  121.80]] },
  "7202": { nama: "Kab. Poso",              slug: "cabdis-3", center: [-1.671,  120.512], zoom: 9,  bounds: [[-2.65,  119.70], [-0.70,  121.90]] },
  "7209": { nama: "Kab. Tojo Una-Una",      slug: "cabdis-3", center: [-0.873,  121.642], zoom: 9,  bounds: [[-2.00,  120.50], [ 0.30,  122.85]] },
  "7206": { nama: "Kab. Morowali",          slug: "cabdis-4", center: [-2.895,  122.310], zoom: 9,  bounds: [[-4.00,  121.00], [-1.70,  123.60]] },
  "7212": { nama: "Kab. Morowali Utara",    slug: "cabdis-4", center: [-1.852,  121.444], zoom: 9,  bounds: [[-3.00,  120.30], [-0.90,  122.50]] },
  "7201": { nama: "Kab. Banggai",           slug: "cabdis-5", center: [-1.022,  122.659], zoom: 9,  bounds: [[-2.20,  121.50], [ 0.10,  124.00]] },
  "7207": { nama: "Kab. Banggai Kepulauan", slug: "cabdis-5", center: [-1.400,  123.154], zoom: 9,  bounds: [[-2.50,  122.30], [-0.50,  124.50]] },
  "7211": { nama: "Kab. Banggai Laut",      slug: "cabdis-5", center: [-1.590,  123.502], zoom: 10, bounds: [[-2.50,  122.50], [-0.80,  124.50]] },
  "7204": { nama: "Kab. Tolitoli",          slug: "cabdis-6", center: [ 0.981,  120.663], zoom: 9,  bounds: [[ 0.10,  119.60], [ 2.25,  121.95]] },
  "7205": { nama: "Kab. Buol",              slug: "cabdis-6", center: [ 0.996,  121.534], zoom: 9,  bounds: [[ 0.20,  120.40], [ 2.10,  122.60]] },
};

const KECAMATAN_COLORS = [
  "#0000FF", "#0047AB", "#89CFF0", "#A4DDED", "#AFDBF5",
  "#0070FF", "#1E90FF", "#7BAFD4", "#87D3F8", "#4682b4",
  "#007FFF", "#318CE7", "#73C2FB", "#45B1E8", "#3E8EDE",
  "#1F75FE", "#6CB4EE", "#87CEFA", "#87CEEB", "#4B92DB",
];

// ─── Warna marker per jenjang pendidikan ─────────────────────────────────────
const JENJANG_COLOR: Record<string, string> = {
  "TK":    "#f59e0b", // Kuning — TK/PAUD
  "KB":    "#f59e0b", // Kuning — Kelompok Bermain
  "SPS":   "#f59e0b", // Kuning — Satuan PAUD Sejenis
  "TPA":   "#f59e0b", // Kuning — Taman Penitipan Anak
  "RA":    "#fb923c", // Orange — Raudhatul Athfal (TK Islam)
  "SD":    "#10b981", // Hijau — SD
  "MI":    "#34d399", // Hijau muda — Madrasah Ibtidaiyah
  "SMP":   "#3b82f6", // Biru — SMP
  "MTs":   "#60a5fa", // Biru muda — Madrasah Tsanawiyah
  "SMA":   "#8b5cf6", // Ungu — SMA
  "MA":    "#a78bfa", // Ungu muda — Madrasah Aliyah
  "SMK":   "#ec4899", // Pink — SMK
  "SLB":   "#ef4444", // Merah — SLB
  "PKBM":  "#6b7280", // Abu — PKBM
  "SKB":   "#6b7280", // Abu — SKB
};

// Legenda jenjang yang ditampilkan (kelompok utama)
const JENJANG_LEGEND = [
  { label: "PAUD / TK", color: "#f59e0b", keys: ["TK", "KB", "SPS", "TPA"] },
  { label: "RA (TK Islam)", color: "#fb923c", keys: ["RA"] },
  { label: "SD", color: "#10b981", keys: ["SD"] },
  { label: "MI", color: "#34d399", keys: ["MI"] },
  { label: "SMP", color: "#3b82f6", keys: ["SMP"] },
  { label: "MTs", color: "#60a5fa", keys: ["MTs"] },
  { label: "SMA", color: "#8b5cf6", keys: ["SMA"] },
  { label: "MA", color: "#a78bfa", keys: ["MA"] },
  { label: "SMK", color: "#ec4899", keys: ["SMK"] },
  { label: "SLB", color: "#ef4444", keys: ["SLB"] },
  { label: "Lainnya", color: "#6b7280", keys: ["PKBM", "SKB", "Kursus"] },
];

const getJenjangColor = (bentukPendidikan: string): string => {
  return JENJANG_COLOR[bentukPendidikan] ?? "#6b7280";
};

const createSchoolIcon = (bentukPendidikan: string) => {
  const color = getJenjangColor(bentukPendidikan);
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 10px; height: 10px; border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
};

// Cache icon per jenjang agar tidak dibuat ulang tiap render
const ICON_CACHE: Record<string, L.DivIcon> = {};

const createSchoolIconHighlight = (bentukPendidikan: string, dimmed: boolean) => {
  const color = getJenjangColor(bentukPendidikan);
  const size = dimmed ? 7 : 11;
  const opacity = dimmed ? 0.25 : 1;
  return L.divIcon({
    className: "",
    html: `<div style="
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
      opacity: ${opacity};
      transition: all 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const SetMapView = ({ center, zoom, mapRef }: {
  center: [number, number];
  zoom: number;
  mapRef: React.MutableRefObject<L.Map | null>;
}) => {
  const map = useMap();
  const applied = useRef(false);
  useEffect(() => {
    if (!applied.current) {
      applied.current = true;
      map.setView(center, zoom);
    }
    mapRef.current = map;
  }, [center, zoom, map, mapRef]);
  return null;
};

// ─── Main Page Component ──────────────────────────────────────────────────────
export const KabupatenDetailOld = () => {
  const { kodeKabupaten } = useParams<{ kodeKabupaten: string }>();
  const navigate = useNavigate();
  
  // Baca query parameter ?wewenang=true dari URL
  const searchParams = new URLSearchParams(window.location.search);
  const initialWewenang = searchParams.get("wewenang") === "true";

  const kode = kodeKabupaten ?? "";
  const info = KABUPATEN_INFO[kode];

  const [kecamatanGeo, setKecamatanGeo] = useState<any>(null);
  const [indonesiaGeo, setIndonesiaGeo] = useState<any>(null);
  const [allSekolah, setAllSekolah] = useState<SekolahMarker[]>([]); // Raw data dari API (semua jenjang)
  const [stats, setStats] = useState<StatistikKabupatenItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SekolahMarker | null>(null);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [hoveredKecamatan, setHoveredKecamatan] = useState<string | null>(null);
  const [hoveredJenjang, setHoveredJenjang] = useState<string | null>(null);
  const [kecamatanColorMap, setKecamatanColorMap] = useState<Record<string, string>>({});
  const [filterWewenang, setFilterWewenang] = useState(initialWewenang); // Toggle filter
  const mapRef = useRef<L.Map | null>(null);

  // ─── Admin state ──────────────────────────────────────────────────────────
  const { isAdmin } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<SekolahMarker | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget?.npsn) return;
    setDeleting(true);
    try {
      await AdminService.deleteSekolah(deleteTarget.npsn);
      setAllSekolah(prev => prev.filter(s => s.npsn !== deleteTarget.npsn));
      setDeleteTarget(null);
      if (selectedSchool?.npsn === deleteTarget.npsn) setSelectedSchool(null);
    } catch (err: any) {
      alert(err?.data?.message ?? "Gagal menghapus sekolah.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!kode) return;

    const geoFile = KODE_TO_GEOJSON[kode];
    if (geoFile) {
      setGeoLoading(true);
      fetch(`/geojson/kabupaten/${geoFile}.geojson`)
        .then((r) => r.json())
        .then((geo) => {
          setKecamatanGeo(geo);
          const colorMap: Record<string, string> = {};
          (geo.features ?? []).forEach((f: any, i: number) => {
            const nama = f.properties?.NAMOBJ ?? `Kecamatan ${i + 1}`;
            colorMap[nama] = KECAMATAN_COLORS[i % KECAMATAN_COLORS.length];
          });
          setKecamatanColorMap(colorMap);
        })
        .catch(() => setKecamatanGeo(null))
        .finally(() => setGeoLoading(false));
    } else {
      setGeoLoading(false);
    }

    // Removed: indonesia-provinces.json fetch (1.2MB tidak perlu, background image cukup)

    setLoading(true);
    setError(null);
    Promise.all([
      PemetaanService.getSekolah({ kode_kabupaten: kode }), // Fetch semua jenjang (PAUD–SMA)
      PemetaanService.getStatistikKabupaten(),
    ])
      .then(([sekolahRes, statRes]) => {
        setAllSekolah(sekolahRes.data ?? []); // Simpan raw data
        const found = (statRes.data ?? []).find(
          (s) => String(s.kode_kabupaten) === kode
        );
        setStats(found ?? null);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setError("Gagal memuat data sekolah. Periksa koneksi ke server.");
      })
      .finally(() => setLoading(false));
  }, [kode]); // Hanya re-fetch saat kode kabupaten berubah

  // ─── Filter client-side berdasarkan toggle wewenang ──────────────────────────
  const WEWENANG_JENJANG = ["PAUD", "TK", "KB", "TPA", "SPS", "RA", "SD", "MI", "SMP", "MTs"];
  const sekolahList = useMemo(() => {
    if (filterWewenang) {
      return allSekolah.filter((s) => WEWENANG_JENJANG.includes(s.bentuk_pendidikan ?? ""));
    }
    return allSekolah;
  }, [allSekolah, filterWewenang]);

  const indonesiaStyle = useCallback(() => ({
    color: "#d1d5db",
    weight: 0.8,
    fillColor: "#e2e8f0",
    fillOpacity: 1,
  }), []);

  const getKecamatanStyle = useCallback((feature: any) => {
    const nama = feature?.properties?.NAMOBJ ?? "";
    const color = kecamatanColorMap[nama] ?? KECAMATAN_COLORS[0];
    const isHovered = hoveredKecamatan === nama;
    return {
      color: "#ffffff",
      weight: isHovered ? 2.5 : 1.5,
      fillColor: color,
      fillOpacity: isHovered ? 0.85 : 0.55,
    };
  }, [kecamatanColorMap, hoveredKecamatan]);

  if (!info) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 font-poppins text-slate-500">
        <p className="text-lg font-bold">Kabupaten tidak ditemukan</p>
        <button onClick={() => navigate("/")} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const generalData = {
    total_sekolah: sekolahList.length, // Counter dinamis berdasarkan filter
    total_rombel: 0,
    total_siswa: stats?.total_siswa ?? 0,
    total_guru: 0,
    total_tendik: 0,
    total_pegawai: 0,
    semester_id: null,
  };

  const kecamatanList = Object.keys(kecamatanColorMap);
  const filteredSchools = selectedSchool
    ? sekolahList.filter((s) =>
        s.npsn === selectedSchool.npsn ||
        (!s.npsn && s.nama === selectedSchool.nama)
      )
    : sekolahList.filter((s) =>
        s.nama?.toLowerCase().includes(schoolSearch.toLowerCase())
      );

  return (
    <div className="w-screen font-poppins bg-slate-50/20 overflow-x-hidden">

      {/* ── BARIS 1: PETA FULLSCREEN (100vh) ─────────────────────────────── */}
      <div className="relative w-full" style={{ height: "100vh" }}>

        {/* Background image */}
        <img
          src="/images/cmd/bc-cmdcenter-bg.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none z-0"
        />

        {/* Peta Leaflet — mengisi penuh baris 1 */}
        <div className="absolute inset-0 z-0">
          <MapContainer
            center={info.center}
            zoom={info.zoom}
            minZoom={7}
            maxZoom={18}
            zoomControl={false}
            dragging={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            attributionControl={false}
            maxBounds={info.bounds}
            maxBoundsViscosity={0.6}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          >
            <SetMapView center={info.center} zoom={info.zoom} mapRef={mapRef} />

            {/* Removed: Indonesia provinces GeoJSON layer (tidak perlu, background image sudah cukup) */}

            {!geoLoading && kecamatanGeo && (
              <GeoJSON
                key={`${kode}-${hoveredKecamatan}`}
                data={kecamatanGeo}
                style={getKecamatanStyle}
                onEachFeature={(feature, layer) => {
                  const nama = feature?.properties?.NAMOBJ ?? "Kecamatan";
                  layer.bindTooltip(nama, {
                    permanent: false,
                    direction: "center",
                    className: "kec-tooltip",
                    opacity: 1,
                  });
                  layer.on({
                    mouseover: () => setHoveredKecamatan(nama),
                    mouseout: () => setHoveredKecamatan(null),
                  });
                }}
              />
            )}

            {!loading && sekolahList.map((school, index) => {
              const lat = parseFloat(String(school.lintang ?? ""));
              const lng = parseFloat(String(school.bujur ?? ""));
              if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
              const jenjang = school.bentuk_pendidikan ?? "";

              const isJenjangHovered = hoveredJenjang !== null &&
                JENJANG_LEGEND.find(j => j.label === hoveredJenjang)?.keys.includes(jenjang);
              const isDimmed = hoveredJenjang !== null && !isJenjangHovered;

              const icon = createSchoolIconHighlight(jenjang, !!isDimmed);
              const uniqueKey = school.npsn ? `marker-${school.npsn}-${index}` : `marker-${index}`;
              return (
                <Marker
                  key={`${uniqueKey}-${hoveredJenjang ?? "none"}`}
                  position={[lat, lng]}
                  icon={icon}
                  eventHandlers={{ click: () => {
                    setSelectedSchool(school);
                    setSchoolSearch(""); // clear search saat marker diklik
                  }}}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                    <span className="text-[10px] font-bold text-slate-800 whitespace-nowrap">
                      {school.nama}
                    </span>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Logo tengah atas */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <img src="/logo.png" className="w-100 opacity-90" alt="Logo" />
        </div>

        {/* Tombol kembali + Zoom control — kiri atas */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
          {/* Tombol kembali */}
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 rounded-2xl border border-white shadow-lg transition-all backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Zoom control */}
          <div className="flex flex-col gap-1 mt-1">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="w-9 h-9 bg-white/90 hover:bg-white rounded-xl shadow-md border border-white/60 flex items-center justify-center text-slate-600 hover:text-slate-800 font-bold text-base transition-all backdrop-blur-sm"
            >
              +
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="w-9 h-9 bg-white/90 hover:bg-white rounded-xl shadow-md border border-white/60 flex items-center justify-center text-slate-600 hover:text-slate-800 font-bold text-base transition-all backdrop-blur-sm"
            >
              −
            </button>
            <button
              onClick={() => mapRef.current?.setView(info.center, info.zoom, { animate: true })}
              title="Reset tampilan"
              className="w-9 h-9 bg-white/90 hover:bg-white rounded-xl shadow-md border border-white/60 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all backdrop-blur-sm text-sm"
            >
              ⌂
            </button>
          </div>
        </div>

        {/* ── PANEL KIRI — Legend Kecamatan + Legend Jenjang ───────────── */}
        {kecamatanList.length > 0 && (
          <div
            className="absolute top-6 left-20 z-10 w-52 flex flex-col gap-3"
            style={{ maxHeight: "calc(100vh - 3rem)" }}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Legend Kecamatan — scrollable di dalamnya */}
            <div className="glass-card rounded-[1.5rem] p-4 border border-white/60 shadow-lg flex flex-col gap-2 min-h-0">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
                Legend Kecamatan
              </p>
              <div
                className="overflow-y-auto flex flex-col gap-1 scrollbar-hide"
                style={{ maxHeight: "35vh" }}
              >
                {kecamatanList.map((nama) => {
                  const isHovered = hoveredKecamatan === nama;
                  return (
                    <div
                      key={nama}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
                        isHovered ? "bg-blue-50 scale-[1.03]" : "hover:bg-slate-50"
                      }`}
                      onMouseEnter={() => setHoveredKecamatan(nama)}
                      onMouseLeave={() => setHoveredKecamatan(null)}
                    >
                      <div
                        className={`w-3 h-3 rounded-sm shrink-0 border transition-all ${
                          isHovered ? "border-blue-400 scale-110" : "border-white"
                        }`}
                        style={{ background: kecamatanColorMap[nama] }}
                      />
                      <span className={`text-[11px] font-semibold truncate transition-colors ${
                        isHovered ? "text-blue-600" : "text-slate-600"
                      }`}>
                        {nama}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Indikator kalau ada lebih banyak item */}
              {kecamatanList.length > 8 && (
                <p className="text-[10px] text-slate-400 text-center shrink-0 pt-1 border-t border-slate-100">
                  scroll untuk lihat semua ({kecamatanList.length} kecamatan)
                </p>
              )}
            </div>

            {/* Legend Jenjang — selalu tampil penuh, tidak scroll */}
            <div className="glass-card rounded-[1.5rem] p-4 border border-white/60 shadow-lg flex flex-col gap-2 shrink-0">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Legend Jenjang
              </p>
              <div className="flex flex-col gap-1">
                {JENJANG_LEGEND.filter(j => {
                  // Filter 1: Hanya tampilkan jenjang yang ada sekolahnya
                  const hasSchools = sekolahList.some(s => j.keys.includes(s.bentuk_pendidikan ?? ""));
                  if (!hasSchools) return false;
                  
                  // Filter 2: Jika filterWewenang aktif, hide jenjang SMA/MA/SMK/SLB
                  if (filterWewenang) {
                    const isProvinsiLevel = ["SMA", "MA", "SMK", "SLB"].some(k => j.keys.includes(k));
                    return !isProvinsiLevel;
                  }
                  
                  return true;
                }).map((item) => {
                  const isHovered = hoveredJenjang === item.label;
                  const isDimmed = hoveredJenjang !== null && !isHovered;
                  return (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
                        isHovered ? "bg-slate-50 scale-[1.03]" : "hover:bg-slate-50"
                      } ${isDimmed ? "opacity-40" : "opacity-100"}`}
                      onMouseEnter={() => setHoveredJenjang(item.label)}
                      onMouseLeave={() => setHoveredJenjang(null)}
                    >
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 border-2 border-white shadow-sm transition-all ${
                          isHovered ? "scale-125" : ""
                        }`}
                        style={{ background: item.color }}
                      />
                      <span className={`text-[11px] font-semibold transition-colors ${
                        isHovered ? "text-slate-800" : "text-slate-500"
                      }`}>
                        {item.label}
                      </span>
                      {/* Jumlah sekolah jenjang ini */}
                      <span className={`ml-auto text-[10px] font-bold transition-colors ${
                        isHovered ? "text-slate-600" : "text-slate-300"
                      }`}>
                        {sekolahList.filter(s => item.keys.includes(s.bentuk_pendidikan ?? "")).length}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PANEL KANAN — Filter + Search + List Sekolah ──────────────── */}
        <div
          className="absolute top-6 right-6 z-10 w-72 flex flex-col gap-3"
          style={{ maxHeight: "calc(100vh - 3rem)" }}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <div className="border-l-4 pl-4 border-blue-600 shrink-0">
            <div className="font-bold text-base text-slate-800">Sekolah</div>
            <div className="text-xs font-medium text-slate-400">Daftar Sekolah {info.nama}</div>
          </div>

          {/* Tombol Tambah Sekolah — hanya admin */}
          {isAdmin && (
            <button
              onClick={() => navigate(`/admin/sekolah/create?kode_kabupaten=${kode}`)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider border border-emerald-600 transition-all shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Sekolah
            </button>
          )}

          {/* Filter Tampilan - Horizontal Compact */}
          <div className="glass-card rounded-2xl p-3 border border-white/60 shadow-lg shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterWewenang(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                  !filterWewenang
                    ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  !filterWewenang ? "bg-white" : "bg-slate-300"
                }`} />
                <div className="text-center">
                  <p className="text-[10px] font-bold leading-tight">Semua</p>
                  <p className="text-[8px] opacity-75">PAUD–SMA</p>
                </div>
              </button>
              <button
                onClick={() => setFilterWewenang(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                  filterWewenang
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  filterWewenang ? "bg-white" : "bg-slate-300"
                }`} />
                <div className="text-center">
                  <p className="text-[10px] font-bold leading-tight">Wewenang</p>
                  <p className="text-[8px] opacity-75">PAUD–SMP</p>
                </div>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative group shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={selectedSchool ? "Klik '← Lihat Semua' untuk cari..." : "Cari sekolah..."}
              value={selectedSchool ? "" : schoolSearch}
              disabled={!!selectedSchool}
              onChange={(e) => setSchoolSearch(e.target.value)}
              className={`w-full bg-white/90 backdrop-blur-sm border border-white/80 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all shadow-md ${
                selectedSchool ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
          </div>

          {/* Counter + tombol reset */}
          {!loading && !error && (
            <div className="flex items-center justify-between px-1 shrink-0">
              <div className="text-[11px] text-slate-400 font-semibold">
                {selectedSchool
                  ? <span className="text-blue-600 font-bold">1 sekolah dipilih</span>
                  : <span>{filteredSchools.length} dari {sekolahList.length} sekolah</span>
                }
              </div>
              {selectedSchool && (
                <button
                  onClick={() => {
                    setSelectedSchool(null);
                    setSchoolSearch("");
                  }}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors"
                >
                  ← Lihat Semua
                </button>
              )}
            </div>
          )}
          {loading && (
            <div className="text-[11px] text-amber-500 font-semibold px-1 shrink-0">
              Memuat data...
            </div>
          )}
          {error && (
            <div className="text-[11px] text-red-500 bg-red-50 p-2 rounded-xl shrink-0">
              {error}
            </div>
          )}

          {/* Card list — scrollable */}
          <div className="overflow-y-auto flex flex-col gap-2.5 scrollbar-hide">
            {filteredSchools.map((school, index) => {
              const isSwasta = school.status_sekolah === "Swasta";
              const isActive = selectedSchool?.npsn === school.npsn;
              const uniqueKey = school.npsn ? `${school.npsn}-${index}` : `school-${index}`;

              return (
                <div
                  key={uniqueKey}
                  onClick={() => setSelectedSchool(school)}
                  className={`glass-card rounded-2xl p-4 flex flex-col gap-3 border shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.01] shrink-0 ${
                    isActive ? "border-blue-400/80 bg-blue-50/60" : "border-white/70 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: getJenjangColor(school.bentuk_pendidikan ?? "") + "20",
                          color: getJenjangColor(school.bentuk_pendidikan ?? ""),
                        }}
                      >
                        <SchoolIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                          {school.nama}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                          {school.bentuk_pendidikan} · {school.status_sekolah}
                        </p>
                      </div>
                    </div>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white shadow-sm"
                      style={{ background: getJenjangColor(school.bentuk_pendidikan ?? "") }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const lat = parseFloat(String(school.lintang ?? ""));
                        const lng = parseFloat(String(school.bujur ?? ""));
                        if (lat && lng && !isNaN(lat) && !isNaN(lng) && mapRef.current) {
                          mapRef.current.setView([lat, lng], 15, { animate: true });
                          setSelectedSchool(school);
                        }
                      }}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100 transition-all"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Cari Koordinat</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (school.npsn) navigate(`/sekolah/${school.npsn}`);
                      }}
                      className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Klik Detail</span>
                    </button>
                  </div>

                  {/* Tombol admin — hanya muncul kalau login */}
                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100/80">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (school.npsn) navigate(`/admin/sekolah/${school.npsn}/edit`);
                        }}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100 transition-all"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(school);
                        }}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-black uppercase tracking-wider border border-red-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {!loading && filteredSchools.length === 0 && !error && (
              <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-8">
                Tidak ada sekolah ditemukan
              </p>
            )}
          </div>
        </div>

        {/* Loading overlay */}
        {(loading || geoLoading) && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl px-6 py-4 flex items-center gap-3 shadow-xl border border-slate-100">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm font-bold text-slate-700">Memuat peta...</span>
            </div>
          </div>
        )}
      </div>
      {/* ── END BARIS 1 ───────────────────────────────────────────────────── */}

      {/* ── BARIS 2: SECTION DATA UMUM ───────────────────────────────────── */}
      <div className="relative w-full bg-slate-50 px-10 py-10">
        <img
          src="/images/cmd/bc-cmdcenter-bg.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
        />
        <div className="relative z-10">
          <GeneralDataSection data={generalData} />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 text-center bg-slate-50">
        <p className="text-xs text-slate-400">
          &copy; 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah
        </p>
      </footer>

      {/* Modal hapus sekolah */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        nama={deleteTarget?.nama ?? ""}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        .leaflet-container { background: transparent !important; }
        .kec-tooltip {
          background: rgba(255,255,255,0.95) !important;
          border: 1px solid rgba(37,99,235,0.2) !important;
          border-radius: 8px !important;
          padding: 4px 10px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15) !important;
          white-space: nowrap !important;
          font-family: 'Poppins', sans-serif !important;
        }
        .kec-tooltip::before { display: none !important; }
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        /* Sembunyikan zoom control bawaan Leaflet */
        .leaflet-control-zoom { display: none !important; }
      `}</style>
    </div>
  );
};
