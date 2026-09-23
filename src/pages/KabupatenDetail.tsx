import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CARTO_TILES } from "@/config/mapConfig";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

import {
  ChevronLeft,
  MapPin,
  Eye,
  Search,
  Building2,
  GraduationCap,
  Users,
  Pencil,
  Trash2,
  Plus,
  Layers,
  Briefcase,
  Settings,
  Filter,
  ArrowUpDown,
  ChevronDown,
  X,
} from "lucide-react";
import { PemetaanService } from "@/services/pemetaanService";
import { AdminService } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { DeleteConfirmModal } from "@/components/Admin/DeleteConfirmModal";
import { SekolahEditModal } from "@/components/Admin/SekolahEditModal";
import { GeneralDataSection } from "@/components/Sections/GeneralDataSection";
import { createSchoolPopupHtml } from "@/utils/schoolPopup";
import type { SekolahMarker, StatistikKabupatenItem } from "@/types";

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
  "7211": "bangla",
  "7204": "tolitoli",
  "7205": "buol",
};

// ─── Mapping kode kabupaten → info lengkap + maxBounds ──────────────────────
const KABUPATEN_INFO: Record<string, {
  nama: string;
  slug: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
  logoImg?: string;
}> = {
  "7271": { nama: "Kota Palu", slug: "cabdis-1", center: [-0.896, 119.870], zoom: 12, bounds: [[-1.35, 119.45], [-0.40, 120.30]], logoImg: "/images/kabupaten_kota.png/Kota Palu.png" },
  "7210": { nama: "Kab. Sigi", slug: "cabdis-1", center: [-1.463, 119.963], zoom: 9, bounds: [[-2.45, 119.20], [-0.50, 120.70]], logoImg: "/images/kabupaten_kota.png/Kabupaten Sigi.png" },
  "7203": { nama: "Kab. Donggala", slug: "cabdis-2", center: [-0.350, 119.811], zoom: 8, bounds: [[-1.85, 118.80], [1.25, 120.60]], logoImg: "/images/kabupaten_kota.png/Kabupaten Donggala.png" },
  "7208": { nama: "Kab. Parigi Moutong", slug: "cabdis-2", center: [-0.222, 120.641], zoom: 8, bounds: [[-1.60, 119.40], [1.20, 121.80]], logoImg: "/images/kabupaten_kota.png/Kabupaten Parigi Moutong.png" },
  "7202": { nama: "Kab. Poso", slug: "cabdis-3", center: [-1.671, 120.512], zoom: 9, bounds: [[-2.65, 119.70], [-0.70, 121.90]], logoImg: "/images/kabupaten_kota.png/Kabupaten Poso.png" },
  "7209": { nama: "Kab. Tojo Una-Una", slug: "cabdis-3", center: [-0.873, 121.642], zoom: 9, bounds: [[-2.00, 120.50], [0.30, 122.85]], logoImg: "/images/kabupaten_kota.png/Kabupaten Tojo Una-Una.png" },
  "7206": { nama: "Kab. Morowali", slug: "cabdis-4", center: [-2.895, 122.310], zoom: 9, bounds: [[-4.00, 121.00], [-1.70, 123.60]], logoImg: "/images/kabupaten_kota.png/Kabupaten Morowali.png" },
  "7212": { nama: "Kab. Morowali Utara", slug: "cabdis-4", center: [-1.852, 121.444], zoom: 9, bounds: [[-3.00, 120.30], [-0.90, 122.50]], logoImg: "/images/kabupaten_kota.png/Kabupaten Morowali Utara.png" },
  "7201": { nama: "Kab. Banggai", slug: "cabdis-5", center: [-1.022, 122.659], zoom: 9, bounds: [[-2.20, 121.50], [0.10, 124.00]], logoImg: "/images/kabupaten_kota.png/Kabupaten Banggai.png" },
  "7207": { nama: "Kab. Banggai Kepulauan", slug: "cabdis-5", center: [-1.400, 123.154], zoom: 9, bounds: [[-2.50, 122.30], [-0.50, 124.50]], logoImg: "/images/kabupaten_kota.png/Kabupaten Banggai Kepulauan.png" },
  "7211": { nama: "Kab. Banggai Laut", slug: "cabdis-5", center: [-1.590, 123.502], zoom: 10, bounds: [[-2.50, 122.50], [-0.80, 124.50]], logoImg: "/images/kabupaten_kota.png/Kabupaten Banggai Laut.png" },
  "7204": { nama: "Kab. Tolitoli", slug: "cabdis-6", center: [0.981, 120.663], zoom: 9, bounds: [[0.10, 119.60], [2.25, 121.95]], logoImg: "/images/kabupaten_kota.png/Kabupaten Tolitoli.png" },
  "7205": { nama: "Kab. Buol", slug: "cabdis-6", center: [0.996, 121.534], zoom: 9, bounds: [[0.20, 120.40], [2.10, 122.60]], logoImg: "/images/kabupaten_kota.png/Kabupaten Buol.png" },
};

const KECAMATAN_COLORS = [
  "#2563eb", "#059669", "#7c3aed", "#d97706", "#db2777",
  "#0891b2", "#4f46e5", "#16a34a", "#9333ea", "#ea580c",
  "#0284c7", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899",
  "#06b6d4", "#6366f1", "#22c55e", "#a855f7", "#f97316"
];

// ─── Config Lengkap Jenjang Pendidikan (Formal & Non-Formal) ───────────────────
const JENJANG_CONFIG: Record<string, { label: string; color: string; bg: string; text: string; iconBg: string; iconColor: string; matchKeys: string[] }> = {
  TK: { label: "PAUD / TK", color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-700", iconBg: "#FEF3C7", iconColor: "#D97706", matchKeys: ["TK", "KB", "SPS", "TPA", "RA"] },
  SD: { label: "SD / MI", color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "#DCFCE7", iconColor: "#15803D", matchKeys: ["SD", "MI"] },
  SMP: { label: "SMP / MTs", color: "#3b82f6", bg: "bg-sky-50", text: "text-sky-700", iconBg: "#DBEAFE", iconColor: "#1D4ED8", matchKeys: ["SMP", "MTs"] },
  SMA: { label: "SMA / MA", color: "#8b5cf6", bg: "bg-purple-50", text: "text-purple-700", iconBg: "#EDE9FE", iconColor: "#6D28D9", matchKeys: ["SMA", "MA"] },
  SMK: { label: "SMK", color: "#ec4899", bg: "bg-pink-50", text: "text-pink-700", iconBg: "#FCE7F3", iconColor: "#BE185D", matchKeys: ["SMK", "MAK"] },
  SLB: { label: "SLB", color: "#ef4444", bg: "bg-rose-50", text: "text-rose-700", iconBg: "#FFE4E6", iconColor: "#E11D48", matchKeys: ["SLB"] },
  PKBM: { label: "PKBM / SKB", color: "#d97706", bg: "bg-orange-50", text: "text-orange-700", iconBg: "#FFEDD5", iconColor: "#C2410C", matchKeys: ["PKBM", "SKB", "Paket A", "Paket B", "Paket C"] },
  Kursus: { label: "LKP / Kursus", color: "#0891b2", bg: "bg-cyan-50", text: "text-cyan-700", iconBg: "#CFFAFE", iconColor: "#0E7490", matchKeys: ["Kursus", "LKP"] },
};

const KAB_JENJANG_KEYS = ["TK", "KB", "SPS", "TPA", "RA", "SD", "MI", "SMP", "MTs", "PKBM", "SKB", "Kursus", "LKP"];

const cleanKecamatanName = (nama: string): string => {
  if (!nama) return "";
  return nama
    .replace(/^(kecamatan|kec\.?)\s+/i, "")
    .trim();
};

const normalizeKecKey = (nama: string): string => {
  return cleanKecamatanName(nama).toLowerCase();
};

const getJenjangColor = (bentukPendidikan: string): string => {
  for (const key of Object.keys(JENJANG_CONFIG)) {
    if (JENJANG_CONFIG[key].matchKeys.includes(bentukPendidikan)) {
      return JENJANG_CONFIG[key].color;
    }
  }
  return "#6b7280";
};

const createMarkerIcon = (bentukPendidikan: string, dimmed = false) => {
  const color = getJenjangColor(bentukPendidikan);
  const size = dimmed ? 7 : 11;
  const opacity = dimmed ? 0.25 : 1;
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      box-shadow: 0 0 5px rgba(0,0,0,0.35);
      opacity: ${opacity};
      transition: all 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ─── Modern Minimalist Popup HTML ─────────────────────────────────────────────
const createPopupHtml = (s: SekolahMarker) => createSchoolPopupHtml(s);

// ─── Sub-component: Optimized Marker Cluster Map Layer ────────────────────────
const MarkerClusterMapLayer = ({
  schools,
  hoveredJenjang,
  onSchoolClick,
  clusterRef,
  markerMapRef,
}: {
  schools: SekolahMarker[];
  hoveredJenjang: string | null;
  onSchoolClick: (s: SekolahMarker) => void;
  clusterRef: React.MutableRefObject<any>;
  markerMapRef: React.MutableRefObject<Record<string, L.Marker>>;
}) => {
  const map = useMap();
  const onSchoolClickRef = useRef(onSchoolClick);
  onSchoolClickRef.current = onSchoolClick;

  useEffect(() => {
    if (!map) return;

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 35,
      disableClusteringAtZoom: 14,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      chunkedLoading: true,
      chunkInterval: 50,
      chunkDelay: 10,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount();
        let sizeClass = "small";
        if (count > 50) sizeClass = "large";
        else if (count > 15) sizeClass = "medium";
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${sizeClass}`,
          iconSize: [36, 36],
        });
      },
    });

    clusterRef.current = cluster;
    markerMapRef.current = {};

    schools.forEach((school) => {
      const lat = parseFloat(String(school.lintang ?? ""));
      const lng = parseFloat(String(school.bujur ?? ""));
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const jenjang = school.bentuk_pendidikan ?? "";
      const icon = createMarkerIcon(jenjang, false);

      const marker = L.marker([lat, lng], { icon });

      marker.bindPopup(() => createPopupHtml(school), {
        maxWidth: 300,
        minWidth: 250,
        offset: [0, -5],
        className: "custom-school-popup",
        autoPan: true,
        autoPanPadding: [40, 40],
        closeButton: true,
        closeOnClick: false,
      });

      marker.bindTooltip(
        `<span style="font-size:10px;font-weight:700;color:#0f172a;">${school.nama}</span>`,
        { direction: "top", offset: [0, -8], opacity: 1 }
      );

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSchoolClickRef.current(school);
      });

      markerMapRef.current[school.npsn] = marker;
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
    };
  }, [map, schools, clusterRef, markerMapRef]);

  useEffect(() => {
    if (!markerMapRef.current) return;
    schools.forEach((s) => {
      const marker = markerMapRef.current[s.npsn];
      if (!marker) return;
      const jenjang = s.bentuk_pendidikan ?? "";
      const matchKeys = hoveredJenjang ? (JENJANG_CONFIG[hoveredJenjang]?.matchKeys ?? [hoveredJenjang]) : [];
      const isDimmed = hoveredJenjang !== null && !matchKeys.includes(jenjang);
      marker.setIcon(createMarkerIcon(jenjang, isDimmed));
    });
  }, [hoveredJenjang, schools, markerMapRef]);

  return null;
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

// ─── Main Component: KabupatenDetail ──────────────────────────────────────────
export const KabupatenDetail = () => {
  const { kodeKabupaten } = useParams<{ kodeKabupaten: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);
  const markerMapRef = useRef<Record<string, L.Marker>>({});
  const schoolCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const kode = kodeKabupaten ?? "";
  const info = KABUPATEN_INFO[kode];

  // ── State Dropdown Ganti Kabupaten ─────────────────────────────────────────
  const [kabupatenDropdownOpen, setKabupatenDropdownOpen] = useState(false);
  const [kabupatenSearch, setKabupatenSearch] = useState("");
  const kabupatenDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (kabupatenDropdownRef.current && !kabupatenDropdownRef.current.contains(e.target as Node)) {
        setKabupatenDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchKabupaten = (targetKode: string) => {
    setKabupatenDropdownOpen(false);
    setKabupatenSearch("");
    if (targetKode !== kode) {
      navigate(`/kabupaten/${targetKode}`);
    }
  };

  // ── State Data ───────────────────────────────────────────────────────────
  const [allSekolah, setAllSekolah] = useState<SekolahMarker[]>([]);
  const [stats, setStats] = useState<StatistikKabupatenItem | null>(null);
  const [kecamatanGeo, setKecamatanGeo] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── State UI & Complete Filters ──────────────────────────────────────────
  // Default filterWewenang adalah "semua" (Semua Jenjang), kecuali terdapat query param ?wewenang=true atau ?wewenang=kab
  const initialWewenang = searchParams.get("wewenang") === "true" || searchParams.get("wewenang") === "kab" ? "kab" : "semua";
  const [filterWewenang, setFilterWewenang] = useState<"kab" | "semua">(initialWewenang);

  useEffect(() => {
    const w = searchParams.get("wewenang");
    if (w === "true" || w === "kab") {
      setFilterWewenang("kab");
    } else if (w === "false" || w === "semua") {
      setFilterWewenang("semua");
    }
  }, [searchParams]);

  const [selectedSchool, setSelectedSchool] = useState<SekolahMarker | null>(null);
  const [filterJenjang, setFilterJenjang] = useState<string>("semua");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAkreditasi, setFilterAkreditasi] = useState<string>("");
  const [schoolSearch, setSchoolSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("az");
  const [showKecamatanPolygon, setShowKecamatanPolygon] = useState<boolean>(true);
  const [showLegendMobile, setShowLegendMobile] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");

  // Hover states
  const [hoveredJenjang, setHoveredJenjang] = useState<string | null>(null);
  const [kecamatanColorMap, setKecamatanColorMap] = useState<Record<string, string>>({});

  // ── Admin state ──────────────────────────────────────────────────────────
  const { isAdmin } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<SekolahMarker | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTargetNpsn, setEditTargetNpsn] = useState<string | null>(null);

  const handleEditSuccess = (updatedData: any) => {
    if (!editTargetNpsn) return;
    setAllSekolah((prev) =>
      prev.map((s) => (s.npsn === editTargetNpsn ? { ...s, ...updatedData } : s))
    );
    if (selectedSchool?.npsn === editTargetNpsn) {
      setSelectedSchool((prev: any) => (prev ? { ...prev, ...updatedData } : null));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.npsn) return;
    setDeleting(true);
    try {
      await AdminService.deleteSekolah(deleteTarget.npsn);
      setAllSekolah((prev) => prev.filter((s) => s.npsn !== deleteTarget.npsn));
      setDeleteTarget(null);
      if (selectedSchool?.npsn === deleteTarget.npsn) setSelectedSchool(null);
    } catch (err: any) {
      alert(err?.data?.message ?? "Gagal menghapus sekolah.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Fetch Data API & GeoJSON ─────────────────────────────────────────────
  useEffect(() => {
    if (!kode) return;

    const geoFile = KODE_TO_GEOJSON[kode];
    if (geoFile) {
      setLoadingGeo(true);
      fetch(`/geojson/kabupaten/${geoFile}.geojson`)
        .then((r) => r.json())
        .then((geo) => {
          setKecamatanGeo(geo);
          const colorMap: Record<string, string> = {};
          (geo.features ?? []).forEach((f: any, i: number) => {
            const raw = f.properties?.NAMOBJ ?? `Kecamatan ${i + 1}`;
            const clean = cleanKecamatanName(raw);
            const key = normalizeKecKey(raw);
            const color = KECAMATAN_COLORS[i % KECAMATAN_COLORS.length];
            colorMap[raw] = color;
            colorMap[clean] = color;
            colorMap[key] = color;
          });
          setKecamatanColorMap(colorMap);
        })
        .catch(() => setKecamatanGeo(null))
        .finally(() => setLoadingGeo(false));
    } else {
      setLoadingGeo(false);
    }

    setLoadingData(true);
    setError(null);
    Promise.all([
      PemetaanService.getSekolah({ kode_kabupaten: kode }),
      PemetaanService.getStatistikKabupaten(),
    ])
      .then(([sekolahRes, statRes]) => {
        setAllSekolah(sekolahRes.data ?? []);
        const found = (statRes.data ?? []).find(
          (s) => String(s.kode_kabupaten) === kode
        );
        setStats(found ?? null);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setError("Gagal memuat data sekolah. Periksa koneksi ke server.");
      })
      .finally(() => setLoadingData(false));
  }, [kode]);

  // ── Base Sekolah terfilter wewenang ──────────────────────────────────────
  const baseSekolahList = useMemo(() => {
    if (filterWewenang === "kab") {
      return allSekolah.filter((s) => KAB_JENJANG_KEYS.includes(s.bentuk_pendidikan ?? ""));
    }
    return allSekolah;
  }, [allSekolah, filterWewenang]);

  // ── Computed: Stat Cards Breakdown (Total, TK, SD, SMP, SMA) ────────────
  const totalStats = useMemo(() => {
    const total = baseSekolahList.length;

    const getGroupStats = (groupKey: string) => {
      const matchKeys = JENJANG_CONFIG[groupKey]?.matchKeys ?? [];
      const list = baseSekolahList.filter((s) => matchKeys.includes(s.bentuk_pendidikan ?? ""));
      const negeri = list.filter((s) => s.status_sekolah?.toLowerCase() === "negeri").length;
      const swasta = list.filter((s) => s.status_sekolah?.toLowerCase() === "swasta").length;
      return { total: list.length, negeri, swasta };
    };

    const tkStats = getGroupStats("TK");
    const sdStats = getGroupStats("SD");
    const smpStats = getGroupStats("SMP");

    const getSmaStats = () => {
      const matchKeys = JENJANG_CONFIG["SMA"]?.matchKeys ?? ["SMA", "MA"];
      const list = allSekolah.filter((s) => matchKeys.includes(s.bentuk_pendidikan ?? ""));
      const negeri = list.filter((s) => s.status_sekolah?.toLowerCase() === "negeri").length;
      const swasta = list.filter((s) => s.status_sekolah?.toLowerCase() === "swasta").length;
      return { total: list.length, negeri, swasta };
    };
    const smaStats = getSmaStats();

    const akrA = baseSekolahList.filter((s) => s.akreditasi?.toUpperCase() === "A").length;
    const sekolah3T = baseSekolahList.filter((s) => s.is_3t).length;

    return { total, tk: tkStats, sd: sdStats, smp: smpStats, sma: smaStats, akrA, sekolah3T };
  }, [baseSekolahList, allSekolah]);

  // ── Computed: Data Umum Satuan Pendidikan (Section 5) ────────────────────
  const generalData = useMemo(() => {
    return {
      total_sekolah: totalStats.total || (stats?.total_sekolah ?? allSekolah.length),
      total_rombel: stats?.total_rombel ?? 0,
      total_siswa: stats?.total_siswa || allSekolah.reduce((acc, s) => acc + (s.jumlah_siswa || 0), 0),
      total_guru: stats?.total_guru ?? 0,
      total_tendik: stats?.total_tendik ?? 0,
      total_pegawai: stats?.total_pegawai ?? 0,
      semester_id: "20261",
    };
  }, [totalStats.total, stats, allSekolah]);

  // ── Computed: Filtered & Sorted Sekolah untuk List Panel ─────────────────
  const filteredSekolah = useMemo(() => {
    return baseSekolahList
      .filter((s) => {
        if (filterJenjang !== "semua") {
          const matchKeys = JENJANG_CONFIG[filterJenjang]?.matchKeys ?? [filterJenjang];
          if (!matchKeys.includes(s.bentuk_pendidikan ?? "")) return false;
        }

        if (filterStatus && s.status_sekolah?.toLowerCase() !== filterStatus.toLowerCase()) {
          return false;
        }

        if (filterAkreditasi === "null") {
          if (s.akreditasi && s.akreditasi !== "Belum" && s.akreditasi !== "-") return false;
        } else if (filterAkreditasi && s.akreditasi?.toUpperCase() !== filterAkreditasi.toUpperCase()) {
          return false;
        }

        if (schoolSearch.trim()) {
          const q = schoolSearch.toLowerCase();
          const matchNama = s.nama?.toLowerCase().includes(q);
          const matchNpsn = s.npsn?.toLowerCase().includes(q);
          const matchKec = s.kecamatan?.toLowerCase().includes(q);
          if (!matchNama && !matchNpsn && !matchKec) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "az") {
          return (a.nama ?? "").localeCompare(b.nama ?? "");
        }
        if (sortBy === "za") {
          return (b.nama ?? "").localeCompare(a.nama ?? "");
        }
        if (sortBy === "akr") {
          const rank: Record<string, number> = { A: 1, B: 2, C: 3, TT: 4, Belum: 5 };
          const aRank = rank[a.akreditasi ?? "Belum"] ?? 6;
          const bRank = rank[b.akreditasi ?? "Belum"] ?? 6;
          return aRank - bRank;
        }
        return 0;
      });
  }, [baseSekolahList, filterJenjang, filterStatus, filterAkreditasi, schoolSearch, sortBy]);

  // ── Computed: Distribusi per Kecamatan (Normalized Key) ──────────────────
  const kecamatanDistribusi = useMemo(() => {
    const map: Record<string, {
      key: string;
      nama: string;
      color: string;
      total: number;
      per_jenjang: Record<string, number>;
    }> = {};

    (kecamatanGeo?.features ?? []).forEach((f: any, i: number) => {
      const raw = f.properties?.NAMOBJ ?? `Kecamatan ${i + 1}`;
      const clean = cleanKecamatanName(raw);
      const key = normalizeKecKey(raw);
      const color = kecamatanColorMap[key] ?? kecamatanColorMap[raw] ?? KECAMATAN_COLORS[i % KECAMATAN_COLORS.length];

      map[key] = {
        key,
        nama: clean,
        color,
        total: 0,
        per_jenjang: { TK: 0, SD: 0, SMP: 0, SMA: 0, SMK: 0, SLB: 0, PKBM: 0, Kursus: 0 },
      };
    });

    baseSekolahList.forEach((s) => {
      const raw = s.kecamatan?.trim() || "Lainnya";
      const clean = cleanKecamatanName(raw);
      const key = normalizeKecKey(raw);

      if (!map[key]) {
        const color = kecamatanColorMap[key] ?? KECAMATAN_COLORS[Object.keys(map).length % KECAMATAN_COLORS.length];
        map[key] = {
          key,
          nama: clean,
          color,
          total: 0,
          per_jenjang: { TK: 0, SD: 0, SMP: 0, SMA: 0, SMK: 0, SLB: 0, PKBM: 0, Kursus: 0 },
        };
      }

      map[key].total += 1;

      const b = s.bentuk_pendidikan ?? "";
      if (["TK", "KB", "SPS", "TPA", "RA"].includes(b)) map[key].per_jenjang.TK += 1;
      else if (["SD", "MI"].includes(b)) map[key].per_jenjang.SD += 1;
      else if (["SMP", "MTs"].includes(b)) map[key].per_jenjang.SMP += 1;
      else if (["SMA", "MA"].includes(b)) map[key].per_jenjang.SMA += 1;
      else if (b === "SMK" || b === "MAK") map[key].per_jenjang.SMK += 1;
      else if (b === "SLB") map[key].per_jenjang.SLB += 1;
      else if (["PKBM", "SKB", "Paket A", "Paket B", "Paket C"].includes(b)) map[key].per_jenjang.PKBM += 1;
      else if (["Kursus", "LKP"].includes(b)) map[key].per_jenjang.Kursus += 1;
    });

    return Object.values(map)
      .filter((k) => k.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [baseSekolahList, kecamatanGeo, kecamatanColorMap]);

  const maxKecamatanTotal = useMemo(
    () => Math.max(...kecamatanDistribusi.map((k) => k.total), 1),
    [kecamatanDistribusi]
  );

  // ── Interaksi: Fly to school, uncluster, and open popup ──────────────────
  const handleFocusSchool = useCallback((school: SekolahMarker) => {
    const lat = parseFloat(String(school.lintang ?? ""));
    const lng = parseFloat(String(school.bujur ?? ""));
    if (!lat || !lng || isNaN(lat) || isNaN(lng) || !mapRef.current) return;

    setSelectedSchool(school);

    if (window.innerWidth < 1024) {
      setMobileTab("map");
    }

    if (window.innerWidth < 1024 && mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    mapRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1 });

    setTimeout(() => {
      const marker = markerMapRef.current[school.npsn];
      if (marker && clusterRef.current) {
        clusterRef.current.zoomToShowLayer(marker, () => {
          marker.openPopup();
        });
      } else if (marker) {
        marker.openPopup();
      }
    }, 750);
  }, []);

  // ── Two-Way Sync: Auto-scroll sidebar list to selected school card ────────
  useEffect(() => {
    if (selectedSchool?.npsn) {
      const el = schoolCardRefs.current[selectedSchool.npsn];
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedSchool?.npsn]);

  // ── GeoJSON Style (Direct Leaflet Events) ─────────────────────────────────
  const getKecamatanStyle = useCallback((feature: any) => {
    const raw = feature?.properties?.NAMOBJ ?? "";
    const key = normalizeKecKey(raw);
    const color = kecamatanColorMap[key] ?? kecamatanColorMap[raw] ?? KECAMATAN_COLORS[0];
    return {
      color: "#ffffff",
      weight: 1.2,
      fillColor: color,
      fillOpacity: 0.45,
    };
  }, [kecamatanColorMap]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 font-poppins text-slate-500">
        <p className="text-lg font-bold">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 font-poppins bg-slate-50 text-slate-700">
        <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
          !
        </div>
        <p className="text-xl font-extrabold text-slate-900">Kabupaten/Kota Tidak Ditemukan</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
        >
          ← Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen font-poppins bg-[#f8fafc] overflow-x-hidden antialiased pb-16 selection:bg-blue-600 selection:text-white">

      {/* ══ SECTION 1: CLEAN LIGHT GLASS HEADER (Executive GIS Style) ═════ */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 sm:py-4">

          {/* Top Sub-Row: Breadcrumb (Left), Logo Brand (Center), & Actions (Right) */}
          <div className="relative flex items-center justify-between gap-3 sm:gap-4 mb-2.5 sm:mb-3 pb-2 sm:pb-2.5 border-b border-slate-100">

            {/* Breadcrumbs on Left */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-slate-500 min-w-0 z-10">
              <Link to="/" className="hover:text-blue-600 transition-colors shrink-0">
                Beranda
              </Link>
              <span className="text-slate-300">›</span>
              <span className="text-blue-600 font-extrabold truncate max-w-[130px] sm:max-w-none">{info.nama}</span>
            </div>

            {/* Official Brand Logo di Tengah-Tengah Navbar (Model C) */}
            <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-auto">
              <Link to="/" className="transition-transform hover:scale-105" title="Berani Cerdas - Portal Data Pemetaan Sekolah">
                <img
                  src="/logo.png"
                  alt="Logo Portal Data Pendidikan"
                  className="h-7 sm:h-8.5 w-auto object-contain drop-shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </Link>
            </div>

            {/* Action Buttons on Right */}
            <div className="flex items-center gap-2 shrink-0 z-10">
              {isAdmin && (
                <button
                  onClick={() => navigate(`/admin/sekolah/create?kode_kabupaten=${kode}&from=/kabupaten/${kode}`)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tambah Sekolah</span>
                </button>
              )}

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Kembali</span>
              </button>
            </div>
          </div>

          {/* Main Header Row: District Emblem & Title (Kiri) + Switcher Kabupaten (Kanan) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 pt-1">
            <div className="flex items-center gap-3 sm:gap-4.5">

              {/* District Emblem di Paling Kiri */}
              {info.logoImg && (
                <div className="w-10 h-11 sm:w-13 sm:h-14 bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={info.logoImg}
                    alt={info.nama}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Text Information Langsung di Samping Logo Daerah */}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200/60 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                  <span className="truncate max-w-[200px] sm:max-w-none">
                    {filterWewenang === "kab" ? "Kewenangan Kabupaten / Kota" : "Semua Jenjang Satuan Pendidikan"}
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                  Dinas Pendidikan {info.nama}
                </h1>
                <p className="text-slate-500 text-xs font-medium mt-0.5 line-clamp-1">
                  Pengelolaan &amp; Pemetaan Sekolah — Wilayah {info.nama}
                </p>
              </div>

            </div>

            {/* ── Dropdown Switcher Kabupaten / Kota ── */}
            <div className="relative shrink-0 self-start sm:self-center w-full sm:w-auto" ref={kabupatenDropdownRef}>
              <button
                onClick={() => setKabupatenDropdownOpen(!kabupatenDropdownOpen)}
                className={`group flex items-center justify-between sm:justify-start gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs w-full sm:w-auto ${kabupatenDropdownOpen
                  ? "bg-blue-600 text-white shadow-blue-600/25 ring-2 ring-blue-200"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-blue-300 hover:shadow-sm"
                  }`}
                title="Pilih dan Ganti Kabupaten / Kota"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
                    {info.logoImg ? (
                      <img src={info.logoImg} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <MapPin className={`w-3.5 h-3.5 ${kabupatenDropdownOpen ? "text-white" : "text-blue-600"}`} />
                    )}
                  </div>
                  <div className="text-left flex flex-col min-w-0">
                    <span className={`text-[8.5px] uppercase tracking-wider font-extrabold ${kabupatenDropdownOpen ? "text-blue-100" : "text-slate-400"}`}>
                      Pilih Wilayah Lain
                    </span>
                    <span className="leading-tight font-black truncate max-w-[160px] sm:max-w-[170px]">
                      {info.nama}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${kabupatenDropdownOpen ? "rotate-180 text-white" : "text-slate-400 group-hover:text-blue-600"
                    }`}
                />
              </button>

              {/* Popover Menu Dropdown */}
              {kabupatenDropdownOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-80 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">
                      Ganti Kabupaten / Kota
                    </span>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      13 Wilayah
                    </span>
                  </div>

                  {/* Search Mini */}
                  <div className="relative mb-2 px-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari kabupaten / kota..."
                      value={kabupatenSearch}
                      onChange={(e) => setKabupatenSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>

                  {/* List 13 Kabupaten */}
                  <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin">
                    {Object.entries(KABUPATEN_INFO)
                      .filter(([, kInfo]) =>
                        kInfo.nama.toLowerCase().includes(kabupatenSearch.toLowerCase())
                      )
                      .map(([kKode, kInfo]) => {
                        const isCurrent = kKode === kode;
                        return (
                          <button
                            key={kKode}
                            onClick={() => handleSwitchKabupaten(kKode)}
                            className={`flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${isCurrent
                              ? "bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs"
                              : "text-slate-700 hover:bg-blue-50/60 hover:text-blue-700 hover:pl-3"
                              }`}
                          >
                            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                              {kInfo.logoImg ? (
                                <img src={kInfo.logoImg} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate leading-tight font-extrabold">{kInfo.nama}</p>
                              <p className="text-[9px] text-slate-400 font-medium">Wilayah {kInfo.slug.replace("cabdis-", "")}</p>
                            </div>
                            {isCurrent && (
                              <span className="text-[9px] font-extrabold text-blue-600 bg-white px-1.5 py-0.5 rounded-md border border-blue-200 shrink-0">
                                Aktif
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* ══ SECTION 2: STAT CARDS (Clean Light Bento Grid) ═════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4 sm:mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">

          {/* Card 1: Total Sekolah */}
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-3.5 sm:p-4.5 text-white shadow-md shadow-blue-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-85 bg-white/15 px-2 py-0.5 rounded-full">
                Total Sekolah
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black tracking-tight mb-0.5">
                {loadingData ? "..." : totalStats.total.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] sm:text-[11px] opacity-80 font-semibold">
                {filterWewenang === "kab" ? "PAUD–SMP & Dikmas" : "Semua Jenjang"}
              </p>
            </div>
          </div>

          {/* Card 2: TK / PAUD */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4.5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-2xs"
                style={{ background: JENJANG_CONFIG.TK.iconBg, color: JENJANG_CONFIG.TK.iconColor }}
              >
                <GraduationCap className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <span className={`text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest ${JENJANG_CONFIG.TK.text} ${JENJANG_CONFIG.TK.bg} px-2 py-0.5 rounded-full border border-amber-200/60`}>
                PAUD / TK
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {loadingData ? "..." : totalStats.tk.total.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 whitespace-nowrap">
                {totalStats.tk.negeri}N · {totalStats.tk.swasta}S
              </p>
            </div>
          </div>

          {/* Card 3: SD / MI */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4.5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-2xs"
                style={{ background: JENJANG_CONFIG.SD.iconBg, color: JENJANG_CONFIG.SD.iconColor }}
              >
                <GraduationCap className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <span className={`text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest ${JENJANG_CONFIG.SD.text} ${JENJANG_CONFIG.SD.bg} px-2 py-0.5 rounded-full border border-emerald-200/60`}>
                SD / MI
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {loadingData ? "..." : totalStats.sd.total.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 whitespace-nowrap">
                {totalStats.sd.negeri}N · {totalStats.sd.swasta}S
              </p>
            </div>
          </div>

          {/* Card 4: SMP / MTs */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4.5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-2xs"
                style={{ background: JENJANG_CONFIG.SMP.iconBg, color: JENJANG_CONFIG.SMP.iconColor }}
              >
                <GraduationCap className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <span className={`text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest ${JENJANG_CONFIG.SMP.text} ${JENJANG_CONFIG.SMP.bg} px-2 py-0.5 rounded-full border border-sky-200/60`}>
                SMP / MTs
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {loadingData ? "..." : totalStats.smp.total.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 whitespace-nowrap">
                {totalStats.smp.negeri}N · {totalStats.smp.swasta}S
              </p>
            </div>
          </div>

          {/* Card 5: SMA / MA */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4.5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-2xs"
                style={{ background: JENJANG_CONFIG.SMA.iconBg, color: JENJANG_CONFIG.SMA.iconColor }}
              >
                <GraduationCap className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <span className={`text-[8.5px] sm:text-[9px] font-black uppercase tracking-widest ${JENJANG_CONFIG.SMA.text} ${JENJANG_CONFIG.SMA.bg} px-2 py-0.5 rounded-full border border-purple-200/60`}>
                SMA Sederajat
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {loadingData ? "..." : totalStats.sma.total.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 whitespace-nowrap">
                {totalStats.sma.negeri}N · {totalStats.sma.swasta}S
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ══ SECTION 3: PETA (2/3) + PANEL LENGKAP FILTER & LIST (1/3) ═══════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4 sm:mt-6">

        {/* Mobile View Switcher Tab (Peta vs Daftar) */}
        <div className="lg:hidden flex items-center justify-center mb-3">
          <div className="flex items-center p-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/90 gap-1 w-full sm:w-auto">
            <button
              onClick={() => setMobileTab("map")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mobileTab === "map"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Peta Wilayah</span>
            </button>
            <button
              onClick={() => setMobileTab("list")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mobileTab === "list"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Daftar Sekolah ({filteredSekolah.length})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4 h-auto lg:h-[660px] xl:h-[700px]">

          {/* Peta dengan Akselerasi Canvas & Cluster Super Smooth */}
          <div ref={mapContainerRef} className={`lg:col-span-2 relative h-[420px] sm:h-[480px] lg:h-full rounded-2xl sm:rounded-[1.5rem] overflow-hidden shadow-md border border-slate-200 bg-slate-100 ${
            mobileTab === "map" ? "block" : "hidden lg:block"
          }`}>
            <img
              src="/images/cmd/bc-cmdcenter-bg.webp"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none z-0"
            />

            <div className="absolute inset-0 z-0">
              <MapContainer
                key={`map-kabupaten-${kode}`}
                center={info.center}
                zoom={info.zoom}
                minZoom={7}
                maxZoom={18}
                preferCanvas={true}
                zoomControl={false}
                scrollWheelZoom={true}
                doubleClickZoom={true}
                closePopupOnClick={false}
                attributionControl={false}
                maxBounds={info.bounds}
                maxBoundsViscosity={0.6}
                style={{ width: "100%", height: "100%", background: "transparent" }}
              >
                <SetMapView center={info.center} zoom={info.zoom} mapRef={mapRef} />

                <TileLayer
                  url={CARTO_TILES.VOYAGER}
                  maxZoom={20}
                  maxNativeZoom={19}
                  opacity={0.65}
                />

                {!loadingGeo && kecamatanGeo && showKecamatanPolygon && (
                  <GeoJSON
                    key={`geo-${kode}`}
                    data={kecamatanGeo}
                    style={getKecamatanStyle}
                    onEachFeature={(feature, layer) => {
                      const raw = feature?.properties?.NAMOBJ ?? "Kecamatan";
                      const clean = cleanKecamatanName(raw);
                      layer.bindTooltip(
                        `<span class="font-bold text-slate-800 text-xs">${clean}</span>`,
                        {
                          permanent: false,
                          direction: "center",
                          className: "custom-kecamatan-tooltip",
                          opacity: 1,
                        }
                      );
                      layer.on({
                        mouseover: (e: any) => {
                          const l = e.target;
                          l.setStyle({ weight: 2.5, fillOpacity: 0.7 });
                          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            l.bringToBack();
                          }
                        },
                        mouseout: (e: any) => {
                          const l = e.target;
                          l.setStyle({ weight: 1.2, fillOpacity: 0.45 });
                        },
                      });
                    }}
                  />
                )}

                {!loadingData && (
                  <MarkerClusterMapLayer
                    schools={filteredSekolah}
                    hoveredJenjang={hoveredJenjang}
                    onSchoolClick={(school) => {
                      setSelectedSchool(school);
                      if (school.npsn && schoolCardRefs.current[school.npsn]) {
                        schoolCardRefs.current[school.npsn]?.scrollIntoView({
                          behavior: "smooth",
                          block: "nearest",
                        });
                      }
                    }}
                    clusterRef={clusterRef}
                    markerMapRef={markerMapRef}
                  />
                )}
              </MapContainer>
            </div>

            {/* ── Kontrol Zoom & Reset di Kiri Atas Peta ── */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 flex flex-col gap-1">
              <button
                onClick={() => mapRef.current?.zoomIn()}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-white/95 rounded-xl shadow border border-white/60 flex items-center justify-center text-slate-600 font-bold text-sm sm:text-base hover:bg-white transition-all cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => mapRef.current?.zoomOut()}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-white/95 rounded-xl shadow border border-white/60 flex items-center justify-center text-slate-600 font-bold text-sm sm:text-base hover:bg-white transition-all cursor-pointer"
                title="Zoom Out"
              >
                −
              </button>
              <button
                onClick={() => mapRef.current?.setView(info.center, info.zoom, { animate: true })}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-white/95 rounded-xl shadow border border-white/60 flex items-center justify-center text-slate-500 hover:text-blue-600 text-xs sm:text-sm hover:bg-white transition-all cursor-pointer"
                title="Reset tampilan"
              >
                ⌂
              </button>
            </div>

            {/* ── Toggle Poligon Batas Kecamatan di Kanan Atas Peta ── */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
              <button
                onClick={() => setShowKecamatanPolygon(!showKecamatanPolygon)}
                className={`group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[10.5px] sm:text-xs font-bold transition-all duration-200 cursor-pointer shadow-md backdrop-blur-md border ${showKecamatanPolygon
                    ? "bg-white/95 text-blue-700 border-blue-200/90 hover:bg-white hover:border-blue-300 shadow-blue-500/10"
                    : "bg-white/90 text-slate-500 border-slate-200 hover:bg-white hover:text-slate-800"
                  }`}
                title={showKecamatanPolygon ? "Klik untuk menyembunyikan poligon batas kecamatan" : "Klik untuk menampilkan poligon batas kecamatan"}
              >
                <Layers className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${showKecamatanPolygon ? "text-blue-600" : "text-slate-400"
                  }`} />
                <span className="hidden sm:inline">Poligon Kecamatan</span>
                <span
                  className={`text-[8.5px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-md transition-colors ${showKecamatanPolygon
                      ? "bg-blue-100/80 text-blue-700"
                      : "bg-slate-100 text-slate-400"
                    }`}
                >
                  {showKecamatanPolygon ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            {/* Legenda Dinamis di Peta (Termasuk PKBM & Kursus - Di atas action bar di mobile) */}
            <div className="absolute bottom-16 sm:bottom-4 left-3 sm:left-4 z-10 max-w-[calc(100%-24px)] sm:max-w-md">
              <button
                onClick={() => setShowLegendMobile(!showLegendMobile)}
                className="sm:hidden flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-md text-[10px] font-bold text-slate-700 mb-1.5 cursor-pointer"
              >
                <Layers className="w-3 h-3 text-blue-600" />
                <span>{showLegendMobile ? "Tutup Legenda" : "Legenda Jenjang"}</span>
              </button>
              <div className={`${showLegendMobile ? "flex" : "hidden"} sm:flex bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-md border border-white/70 flex-wrap gap-x-2.5 sm:gap-x-3.5 gap-y-1.5 max-h-36 sm:max-h-none overflow-y-auto`}>
                {Object.keys(JENJANG_CONFIG).filter((jKey) => {
                  const matchKeys = JENJANG_CONFIG[jKey].matchKeys;
                  return baseSekolahList.some((s) => matchKeys.includes(s.bentuk_pendidikan ?? ""));
                }).map((jKey) => {
                  const cfg = JENJANG_CONFIG[jKey];
                  const isActive = filterJenjang === jKey;
                  return (
                    <button
                      key={jKey}
                      onClick={() => setFilterJenjang(filterJenjang === jKey ? "semua" : jKey)}
                      onMouseEnter={() => setHoveredJenjang(jKey)}
                      onMouseLeave={() => setHoveredJenjang(null)}
                      className={`flex items-center gap-1.5 transition-all cursor-pointer ${isActive ? "opacity-100 scale-105 font-black text-blue-600" : "opacity-80 hover:opacity-100"
                        }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
                        style={{ background: cfg.color }}
                      />
                      <span className="text-[10px] font-bold text-slate-700">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Status Bar khusus Mobile saat di Mode Peta */}
            <div className="lg:hidden absolute bottom-3 inset-x-3 z-20 pointer-events-none flex justify-center">
              <button
                onClick={() => setMobileTab("list")}
                className="pointer-events-auto bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/90 shadow-lg flex items-center gap-2 text-xs font-extrabold text-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>{filteredSekolah.length} Sekolah Terdaftar</span>
                <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg ml-1 text-[11px]">Buka Daftar →</span>
              </button>
            </div>

            {(loadingData || loadingGeo) && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl border border-slate-100">
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-700">Memuat peta & cluster sekolah...</span>
                </div>
              </div>
            )}
          </div>

          {/* Panel Kanan: Filter Komprehensif & Daftar Sekolah (Terikat Tinggi Peta) */}
          <div className={`bg-white rounded-2xl sm:rounded-[1.5rem] p-3.5 sm:p-4 shadow-md border border-slate-200 flex flex-col gap-2.5 h-[560px] sm:h-[600px] lg:h-full min-h-0 overflow-hidden ${
            mobileTab === "list" ? "flex" : "hidden lg:flex"
          }`}>

            {/* Header Panel dengan Border Biru & Icon Filter */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
              <div className="border-l-4 pl-3 border-blue-600">
                <div className="font-bold text-sm text-slate-800">Daftar Sekolah &amp; Lembaga</div>
                <div className="text-[11px] text-slate-400 font-medium">Satuan Pendidikan {info.nama}</div>
              </div>
              <Filter className="w-4 h-4 text-slate-400" />
            </div>

            {/* 1. Toggle Wewenang (Semua Jenjang diutamakan pertama kali) */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl shrink-0">
              <button
                onClick={() => setFilterWewenang("semua")}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterWewenang === "semua"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Semua Jenjang
              </button>
              <button
                onClick={() => setFilterWewenang("kab")}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterWewenang === "kab"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Kab/Kota (PAUD–SMP)
              </button>
            </div>

            {/* 2. Filter Jenjang Chips (Dinamis sesuai data yang ada) */}
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {[
                { key: "semua", label: "Semua" },
                { key: "TK", label: "PAUD / TK" },
                { key: "SD", label: "SD" },
                { key: "SMP", label: "SMP" },
                ...(filterWewenang === "semua" ? [
                  { key: "SMA", label: "SMA" },
                  { key: "SMK", label: "SMK" },
                  { key: "SLB", label: "SLB" },
                ] : []),
                { key: "PKBM", label: "PKBM" },
                { key: "Kursus", label: "Kursus" },
              ].filter((item) => {
                if (item.key === "semua") return true;
                const matchKeys = JENJANG_CONFIG[item.key]?.matchKeys ?? [item.key];
                return baseSekolahList.some((s) => matchKeys.includes(s.bentuk_pendidikan ?? ""));
              }).map((item) => {
                const active = filterJenjang === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setFilterJenjang(item.key)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${active
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-white"
                      }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* 3. Dropdown Filters: Status & Akreditasi */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter Status Sekolah"
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="">Status: Semua</option>
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
              </select>

              <select
                value={filterAkreditasi}
                onChange={(e) => setFilterAkreditasi(e.target.value)}
                aria-label="Filter Akreditasi Sekolah"
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="">Akreditasi: Semua</option>
                <option value="A">Akreditasi A</option>
                <option value="B">Akreditasi B</option>
                <option value="C">Akreditasi C</option>
                <option value="null">Belum Terakreditasi</option>
              </select>
            </div>

            {/* 4. Search Input + Sort Dropdown */}
            <div className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama sekolah / NPSN / kec..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {schoolSearch && (
                  <button
                    onClick={() => setSchoolSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative shrink-0 flex items-center">
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Urutkan Sekolah"
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none shadow-2xs"
                  title="Urutkan Daftar Sekolah"
                >
                  <option value="az">A → Z</option>
                  <option value="za">Z → A</option>
                  <option value="akr">Akreditasi (A-C)</option>
                </select>
              </div>
            </div>

            {/* 5. Info Counter + Reset */}
            <div className="flex items-center justify-between px-1 shrink-0 pt-0.5">
              <span className="text-[11px] text-slate-500 font-semibold">
                Menampilkan <span className="font-bold text-blue-600">{filteredSekolah.length}</span> dari {baseSekolahList.length} sekolah &amp; lembaga
              </span>
              {(filterJenjang !== "semua" || filterStatus || filterAkreditasi || schoolSearch) && (
                <button
                  onClick={() => {
                    setFilterJenjang("semua");
                    setFilterStatus("");
                    setFilterAkreditasi("");
                    setSchoolSearch("");
                  }}
                  className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* 6. Daftar Sekolah Scrollable dengan Batasan Rapi */}
            <div className="overflow-y-auto flex flex-col gap-2 scrollbar-hide flex-1 min-h-0 pr-1 pb-1">
              {loadingData && (
                <div className="text-center py-8 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Memuat...
                </div>
              )}
              {!loadingData && filteredSekolah.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-50 rounded-2xl border border-slate-100">
                  Tidak ada sekolah yang cocok
                </div>
              )}
              {!loadingData && filteredSekolah.map((school, idx) => {
                const jenjang = school.bentuk_pendidikan ?? "";
                const color = getJenjangColor(jenjang);
                const isActive = selectedSchool?.npsn === school.npsn;
                const hasCoordinates = !!(school.lintang && school.bujur);
                const cleanKec = cleanKecamatanName(school.kecamatan ?? "");
                const key = school.npsn ? `${school.npsn}-${idx}` : `s-${idx}`;

                return (
                  <div
                    key={key}
                    ref={(el) => {
                      if (school.npsn) schoolCardRefs.current[school.npsn] = el;
                    }}
                    onClick={() => handleFocusSchool(school)}
                    className={`bg-slate-50/70 hover:bg-white rounded-2xl p-3 border shadow-2xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 shrink-0 ${isActive ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20" : "border-slate-100 hover:border-blue-200"
                      }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-xs"
                        style={{ background: `${color}18`, color: color }}
                      >
                        {jenjang.substring(0, 3)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-800 leading-snug line-clamp-1">
                          {school.nama}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                          <span
                            className="font-bold px-1.5 py-0.2 rounded text-[9px]"
                            style={{ background: `${color}15`, color: color }}
                          >
                            {jenjang}
                          </span>
                          <span>•</span>
                          <span>{school.status_sekolah ?? "—"}</span>
                          <span>•</span>
                          <span className="truncate">Kec. {cleanKec || "—"}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shrink-0 ${school.akreditasi === "A"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : school.akreditasi === "B"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : school.akreditasi === "C"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}>
                        {school.akreditasi ?? "—"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusSchool(school);
                        }}
                        disabled={!hasCoordinates}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${hasCoordinates
                          ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs"
                          : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          }`}
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Lokasi</span>
                      </button>

                      <Link
                        to={`/sekolah/${school.npsn}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200/80 transition-all text-center"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Detail</span>
                      </Link>
                    </div>

                    {isAdmin && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-slate-200 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (school.npsn) setEditTargetNpsn(school.npsn);
                          }}
                          className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-wider border border-blue-200 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(school);
                          }}
                          className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-bold uppercase tracking-wider border border-red-200 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ══ SECTION 4: DISTRIBUSI PER KECAMATAN ════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 sm:mt-8">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Distribusi Satuan Pendidikan per Kecamatan</h2>
          <p className="text-xs text-slate-500 font-medium">Sebaran sekolah dan lembaga pendidikan di seluruh wilayah kecamatan {info.nama}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {kecamatanDistribusi.map((kec) => {
            const barWidth = Math.round((kec.total / maxKecamatanTotal) * 100);
            return (
              <div
                key={kec.key}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ background: kec.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider truncate">Kec. {kec.nama}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{info.nama}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base sm:text-lg font-black text-slate-900">{kec.total.toLocaleString("id-ID")}</p>
                    <p className="text-[9px] text-slate-400 font-medium">satuan pend.</p>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, background: kec.color }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  {[
                    { label: "TK", count: kec.per_jenjang.TK, color: JENJANG_CONFIG.TK.color },
                    { label: "SD", count: kec.per_jenjang.SD, color: JENJANG_CONFIG.SD.color },
                    { label: "SMP", count: kec.per_jenjang.SMP, color: JENJANG_CONFIG.SMP.color },
                    ...(filterWewenang === "semua" ? [
                      { label: "SMA", count: kec.per_jenjang.SMA, color: JENJANG_CONFIG.SMA.color },
                      { label: "SMK", count: kec.per_jenjang.SMK, color: JENJANG_CONFIG.SMK.color },
                      { label: "SLB", count: kec.per_jenjang.SLB, color: JENJANG_CONFIG.SLB.color },
                    ] : []),
                    { label: "PKBM", count: kec.per_jenjang.PKBM, color: JENJANG_CONFIG.PKBM.color },
                    { label: "Kursus", count: kec.per_jenjang.Kursus, color: JENJANG_CONFIG.Kursus.color },
                  ].filter((item) => item.count > 0).map((item) => {
                    const pct = kec.total > 0 ? Math.round((item.count / kec.total) * 100) : 0;
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 w-10 font-bold">{item.label}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: item.color }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 w-7 text-right">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {loadingData && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="h-1.5 bg-slate-200 rounded mb-3" />
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-1.5 bg-slate-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ SECTION 5: DATA UMUM SATUAN PENDIDIKAN ══════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 sm:mt-10">
        <GeneralDataSection
          data={generalData}
          title={`Data Dapodik ${info.nama}`}
          subtitle={`Ringkasan agregat data pokok seluruh jenjang satuan pendidikan ${info.nama}`}
          kabupatenName={info.nama}
        />
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 mt-8 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">
          &copy; 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah
        </p>
      </footer>

      {/* Modal Konfirmasi Hapus */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        nama={deleteTarget?.nama ?? ""}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal Edit Sekolah */}
      <SekolahEditModal
        isOpen={!!editTargetNpsn}
        npsn={editTargetNpsn}
        onClose={() => setEditTargetNpsn(null)}
        onSuccess={handleEditSuccess}
      />

      <style>{`
        .leaflet-container { background: transparent !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        .marker-cluster {
          background-clip: padding-box;
          border-radius: 50%;
        }
        .marker-cluster div {
          width: 28px;
          height: 28px;
          margin-left: 4px;
          margin-top: 4px;
          text-align: center;
          border-radius: 50%;
          color: white;
          font-weight: 900;
          font-size: 11px;
          line-height: 28px;
          font-family: 'Poppins', sans-serif;
        }
        .marker-cluster-small  { background-color: rgba(59,130,246,0.25); }
        .marker-cluster-small div  { background-color: rgba(37,99,235,0.9); box-shadow: 0 2px 6px rgba(37,99,235,0.4); }
        .marker-cluster-medium { background-color: rgba(99,102,241,0.25); }
        .marker-cluster-medium div { background-color: rgba(79,70,229,0.9); box-shadow: 0 2px 6px rgba(79,70,229,0.4); }
        .marker-cluster-large  { background-color: rgba(139,92,246,0.25); }
        .marker-cluster-large div  { background-color: rgba(109,40,217,0.9); box-shadow: 0 2px 6px rgba(109,40,217,0.4); }

        .custom-kecamatan-tooltip {
          background: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid rgba(37, 99, 235, 0.3) !important;
          border-radius: 8px !important;
          padding: 3px 8px !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15) !important;
        }
        .custom-kecamatan-tooltip::before { display: none !important; }
      `}</style>
    </div>
  );
};
export default KabupatenDetail;
