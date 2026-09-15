import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import indonesiaGeoData from "@/assets/geojson/indonesia-provinces.json";

import {
  ChevronLeft,
  MapPin,
  Eye,
  Search,
  Building2,
  GraduationCap,
  Users,
  Briefcase,
  Pencil,
  Trash2,
  Plus,
  Compass,
  ArrowUpDown,
  ExternalLink,
  Filter
} from "lucide-react";
import { PemetaanService } from "@/services/pemetaanService";
import { AdminService } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { createSchoolPopupHtml } from "@/utils/schoolPopup";
import { GeneralDataSection } from "@/components/Sections/GeneralDataSection";
import { DeleteConfirmModal } from "@/components/Admin/DeleteConfirmModal";
import { SekolahEditModal } from "@/components/Admin/SekolahEditModal";
import type { SekolahMarker } from "@/types";

// ─── Jenjang Kewenangan Provinsi ──────────────────────────────────────────────
const JENJANG_PROVINSI = ["SMA", "MA", "SMK", "SLB", "SMTK"];

const JENJANG_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  text: string;
  iconBg: string;
  iconColor: string;
  matchKeys: string[];
}> = {
  SMA: { label: "SMA", color: "#8b5cf6", bg: "bg-purple-50", text: "text-purple-700", iconBg: "#EDE9FE", iconColor: "#6D28D9", matchKeys: ["SMA"] },
  MA: { label: "MA", color: "#6366f1", bg: "bg-indigo-50", text: "text-indigo-700", iconBg: "#E0E7FF", iconColor: "#4338CA", matchKeys: ["MA"] },
  SMK: { label: "SMK", color: "#ec4899", bg: "bg-pink-50", text: "text-pink-700", iconBg: "#FCE7F3", iconColor: "#BE185D", matchKeys: ["SMK", "MAK"] },
  SLB: { label: "SLB", color: "#ef4444", bg: "bg-rose-50", text: "text-rose-700", iconBg: "#FFE4E6", iconColor: "#E11D48", matchKeys: ["SLB"] },
  SMTK: { label: "SMTK", color: "#06b6d4", bg: "bg-cyan-50", text: "text-cyan-700", iconBg: "#CFFAFE", iconColor: "#0E7490", matchKeys: ["SMTK"] },
};

// ─── 6 Wilayah Cabang Dinas Pendidikan Provinsi Sulawesi Tengah ───────────────
const CABDIS_INFO: Record<number, {
  id: number;
  slug: string;
  nama: string;
  label: string;
  kabupaten: string[];
  center: [number, number];
  zoom: number;
  color: string;
}> = {
  1: { id: 1, slug: "cabdis-1", nama: "Wilayah I", label: "Kota Palu & Kab. Sigi", kabupaten: ["Kota Palu", "Kab. Sigi"], center: [-1.15, 119.92], zoom: 10, color: "#2563eb" },
  2: { id: 2, slug: "cabdis-2", nama: "Wilayah II", label: "Kab. Donggala & Kab. Parigi Moutong", kabupaten: ["Kab. Donggala", "Kab. Parigi Moutong"], center: [-0.45, 120.25], zoom: 9, color: "#7c3aed" },
  3: { id: 3, slug: "cabdis-3", nama: "Wilayah III", label: "Kab. Poso & Kab. Tojo Una-Una", kabupaten: ["Kab. Poso", "Kab. Tojo Una-Una"], center: [-1.25, 121.20], zoom: 9, color: "#0891b2" },
  4: { id: 4, slug: "cabdis-4", nama: "Wilayah IV", label: "Kab. Morowali & Kab. Morowali Utara", kabupaten: ["Kab. Morowali", "Kab. Morowali Utara"], center: [-2.45, 121.80], zoom: 9, color: "#059669" },
  5: { id: 5, slug: "cabdis-5", nama: "Wilayah V", label: "Kab. Banggai, Bangkep & Balut", kabupaten: ["Kab. Banggai", "Kab. Banggai Kepulauan", "Kab. Banggai Laut"], center: [-1.35, 123.05], zoom: 9, color: "#d97706" },
  6: { id: 6, slug: "cabdis-6", nama: "Wilayah VI", label: "Kab. Tolitoli & Kab. Buol", kabupaten: ["Kab. Tolitoli", "Kab. Buol"], center: [1.02, 121.15], zoom: 9, color: "#dc2626" },
};

const KODE_TO_CABDIS: Record<string, number> = {
  "7271": 1,
  "7210": 1,
  "7203": 2,
  "7208": 2,
  "7202": 3,
  "7209": 3,
  "7206": 4,
  "7212": 4,
  "7201": 5,
  "7207": 5,
  "7211": 5,
  "7204": 6,
  "7205": 6,
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

const createPopupHtml = (s: SekolahMarker) => createSchoolPopupHtml(s);

// ─── Centroid 13 Kabupaten/Kota Sulawesi Tengah ─────────────────────────────
const KABUPATEN_CENTROIDS: Record<string, { lat: number; lng: number; nama: string }> = {
  "7271": { lat: -0.896, lng: 119.870, nama: "Kota Palu" },
  "7210": { lat: -1.350, lng: 119.963, nama: "Kab. Sigi" },
  "7203": { lat: -0.450, lng: 119.780, nama: "Kab. Donggala" },
  "7208": { lat: -0.420, lng: 120.450, nama: "Kab. Parigi Moutong" },
  "7202": { lat: -1.600, lng: 120.650, nama: "Kab. Poso" },
  "7209": { lat: -0.873, lng: 121.642, nama: "Kab. Tojo Una-Una" },
  "7206": { lat: -2.750, lng: 122.150, nama: "Kab. Morowali" },
  "7212": { lat: -1.950, lng: 121.400, nama: "Kab. Morowali Utara" },
  "7201": { lat: -1.022, lng: 122.750, nama: "Kab. Banggai" },
  "7207": { lat: -1.400, lng: 123.154, nama: "Kab. Banggai Kepulauan" },
  "7211": { lat: -1.650, lng: 123.502, nama: "Kab. Banggai Laut" },
  "7204": { lat: 0.981, lng: 120.750, nama: "Kab. Tolitoli" },
  "7205": { lat: 1.050, lng: 121.450, nama: "Kab. Buol" },
};

// ─── Sub-Komponen: Floating Centroid Badges Layer ────────────────────────────
const CentroidBadgesLayer = ({
  kabCounts,
  onSelectKab,
}: {
  kabCounts: Record<string, number>;
  onSelectKab: (kode: string) => void;
}) => {
  const map = useMap();
  const onSelectKabRef = useRef(onSelectKab);
  onSelectKabRef.current = onSelectKab;

  useEffect(() => {
    if (!map) return;
    const group = L.layerGroup();

    Object.entries(KABUPATEN_CENTROIDS).forEach(([kode, item]) => {
      const cabId = KODE_TO_CABDIS[kode] || 1;
      const cab = CABDIS_INFO[cabId];
      const count = kabCounts[kode] || 0;

      const badgeIcon = L.divIcon({
        className: "",
        html: `
          <div class="centroid-badge" style="display:inline-flex;align-items:center;gap:5px;">
            <span style="width:7px;height:7px;border-radius:50%;background:${cab?.color || '#2563eb'};flex-shrink:0;"></span>
            <span>${item.nama}</span>
            <span style="color:#64748b;font-weight:700;font-size:9px;">${count}</span>
          </div>
        `,
        iconAnchor: [55, 14],
      });

      const marker = L.marker([item.lat, item.lng], { icon: badgeIcon });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectKabRef.current(kode);
      });

      group.addLayer(marker);
    });

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, kabCounts]);

  return null;
};

// ─── Sub-Komponen: Marker Cluster Layer ──────────────────────────────────────
const MarkerClusterMapLayer = ({
  schools,
  hoveredJenjang,
  onSchoolClick,
  clusterRef,
  markerMapRef,
}: {
  schools: SekolahMarker[];
  hoveredJenjang: string | null;
  onSchoolClick: (school: SekolahMarker) => void;
  clusterRef: React.MutableRefObject<any>;
  markerMapRef: React.MutableRefObject<Record<string, L.Marker>>;
}) => {
  const map = useMap();
  const onSchoolClickRef = useRef(onSchoolClick);
  useEffect(() => { onSchoolClickRef.current = onSchoolClick; });

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
      const isDimmed = hoveredJenjang !== null && hoveredJenjang !== jenjang;
      marker.setIcon(createMarkerIcon(jenjang, isDimmed));
    });
  }, [hoveredJenjang, schools, markerMapRef]);

  return null;
};

// ─── Sub-Komponen: SetMapView ─────────────────────────────────────────────────
const SetMapView = ({
  center,
  zoom,
  mapRef,
}: {
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

// ─── Main Component: ProvinsiDetail ───────────────────────────────────────────
export const ProvinsiDetail = () => {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);
  const markerMapRef = useRef<Record<string, L.Marker>>({});

  // ── State Data ───────────────────────────────────────────────────────────
  const [allSekolah, setAllSekolah] = useState<SekolahMarker[]>([]);
  const [smaStats, setSmaStats] = useState<any[]>([]);
  const [kabStats, setKabStats] = useState<any[]>([]);
  const [sultengGeo, setSultengGeo] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── State UI & Filters ───────────────────────────────────────────────────
  const [mapMode, setMapMode] = useState<"cabdis" | "titik">("cabdis");
  const [selectedSchool, setSelectedSchool] = useState<SekolahMarker | null>(null);
  const [selectedCabdis, setSelectedCabdis] = useState<number | null>(null);
  const [selectedKabKode, setSelectedKabKode] = useState<string | null>(null);
  const [hoveredKabKode, setHoveredKabKode] = useState<string | null>(null);
  const [filterJenjang, setFilterJenjang] = useState<string>("semua");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAkreditasi, setFilterAkreditasi] = useState<string>("");
  const [schoolSearch, setSchoolSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("az");
  const [hoveredJenjang, setHoveredJenjang] = useState<string | null>(null);

  // ── Admin State ──────────────────────────────────────────────────────────
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
    setLoadingData(true);
    setError(null);

    Promise.all([
      PemetaanService.getStatistikSmaProvinsi(),
      PemetaanService.getStatistikKabupaten(),
      PemetaanService.getSekolah({ jenjang: "" }),
    ])
      .then(([smaRes, kabRes, sekolahRes]) => {
        setSmaStats(smaRes?.data ?? []);
        setKabStats(kabRes?.data ?? []);

        // Filter hanya sekolah menengah kewenangan provinsi
        const filtered = (sekolahRes?.data ?? []).filter((s: SekolahMarker) =>
          JENJANG_PROVINSI.includes(s.bentuk_pendidikan ?? "")
        );
        setAllSekolah(filtered);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setError("Gagal memuat data provinsi. Periksa koneksi ke server.");
      })
      .finally(() => setLoadingData(false));

    setLoadingGeo(true);
    fetch("/geojson/sulteng-light.geojson")
      .then((r) => r.json())
      .then(setSultengGeo)
      .catch(() => setSultengGeo(null))
      .finally(() => setLoadingGeo(false));
  }, []);

  // ── Filtered Sekolah (Memoized) ──────────────────────────────────────────
  const filteredSekolah = useMemo(() => {
    return allSekolah
      .filter((s) => {
        // Filter Cabang Dinas
        if (selectedCabdis !== null) {
          const cabId = KODE_TO_CABDIS[String(s.kode_kabupaten ?? "")];
          if (cabId !== selectedCabdis) return false;
        }

        // Filter Kabupaten spesifik jika dipilih
        if (selectedKabKode !== null) {
          if (String(s.kode_kabupaten ?? "") !== selectedKabKode) return false;
        }

        // Filter Jenjang Chips
        if (filterJenjang !== "semua") {
          const matchKeys = JENJANG_CONFIG[filterJenjang]?.matchKeys ?? [filterJenjang];
          if (!matchKeys.includes(s.bentuk_pendidikan ?? "")) return false;
        }

        // Filter Status
        if (filterStatus && s.status_sekolah?.toLowerCase() !== filterStatus.toLowerCase()) {
          return false;
        }

        // Filter Akreditasi
        if (filterAkreditasi === "null") {
          if (s.akreditasi && s.akreditasi !== "Belum" && s.akreditasi !== "-") return false;
        } else if (filterAkreditasi && s.akreditasi?.toUpperCase() !== filterAkreditasi.toUpperCase()) {
          return false;
        }

        // Search text
        if (schoolSearch.trim()) {
          const q = schoolSearch.toLowerCase();
          const matchNama = s.nama?.toLowerCase().includes(q);
          const matchNpsn = s.npsn?.toLowerCase().includes(q);
          const matchKab = s.kabupaten?.toLowerCase().includes(q);
          if (!matchNama && !matchNpsn && !matchKab) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "az") return (a.nama ?? "").localeCompare(b.nama ?? "");
        if (sortBy === "za") return (b.nama ?? "").localeCompare(a.nama ?? "");
        if (sortBy === "akr") {
          const rank: Record<string, number> = { A: 1, B: 2, C: 3, TT: 4, Belum: 5 };
          const aRank = rank[a.akreditasi ?? "Belum"] ?? 6;
          const bRank = rank[b.akreditasi ?? "Belum"] ?? 6;
          return aRank - bRank;
        }
        return 0;
      });
  }, [allSekolah, selectedCabdis, selectedKabKode, filterJenjang, filterStatus, filterAkreditasi, schoolSearch, sortBy]);

  // ── Computed: Agregat Statistik Utama ─────────────────────────────────────
  const totalStats = useMemo(() => {
    const map: Record<string, any> = {};
    smaStats.forEach((s: any) => { map[s.bentuk_pendidikan] = s; });
    const total = smaStats.reduce((acc, s) => acc + Number(s.total ?? 0), 0);
    const total3t = allSekolah.filter((s) => s.is_3t).length;
    return { total, map, total3t };
  }, [smaStats, allSekolah]);

  // ── Computed: Total Sekolah per Kabupaten ────────────────────────────────
  const kabCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allSekolah.forEach((s) => {
      const k = String(s.kode_kabupaten ?? "");
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [allSekolah]);

  // ── Computed: Distribusi per Cabang Dinas ────────────────────────────────
  const cabdisDistribusi = useMemo(() => {
    const list = Object.values(CABDIS_INFO).map((cab) => {
      // Hitung sekolah di cabdis ini
      const schoolsInCab = allSekolah.filter(
        (s) => KODE_TO_CABDIS[String(s.kode_kabupaten ?? "")] === cab.id
      );

      const per_jenjang: Record<string, number> = { SMA: 0, MA: 0, SMK: 0, SLB: 0, SMTK: 0 };
      schoolsInCab.forEach((s) => {
        const j = s.bentuk_pendidikan ?? "";
        if (per_jenjang[j] !== undefined) per_jenjang[j] += 1;
      });

      return {
        ...cab,
        total: schoolsInCab.length,
        per_jenjang,
      };
    });

    return list.sort((a, b) => a.id - b.id);
  }, [allSekolah]);

  const maxCabdisTotal = useMemo(
    () => Math.max(...cabdisDistribusi.map((c) => c.total), 1),
    [cabdisDistribusi]
  );

  // ── Computed: Data Umum Satuan Pendidikan Provinsi (Section 5) ────────────
  const provinsiGeneralData = useMemo(() => {
    const targetSchools = (selectedCabdis !== null || selectedKabKode !== null || filterJenjang !== "semua" || schoolSearch.trim() !== "")
      ? filteredSekolah
      : allSekolah;

    const totalSiswa = targetSchools.reduce((acc, s) => acc + (s.jumlah_siswa || 0), 0);

    return {
      total_sekolah: targetSchools.length,
      total_rombel: 0,
      total_siswa: totalSiswa,
      total_guru: 0,
      total_tendik: 0,
      total_pegawai: 0,
      semester_id: "20261",
    };
  }, [allSekolah, filteredSekolah, selectedCabdis, selectedKabKode, filterJenjang, schoolSearch]);

  const generalDataSubtitle = useMemo(() => {
    if (selectedCabdis !== null) {
      const cab = CABDIS_INFO[selectedCabdis];
      return `Ringkasan data kewenangan provinsi untuk ${cab?.nama ?? `Wilayah ${selectedCabdis}`} (${cab?.label ?? ''})`;
    }
    if (selectedKabKode !== null) {
      const kab = KABUPATEN_CENTROIDS[selectedKabKode];
      return `Ringkasan data kewenangan provinsi untuk ${kab?.nama ?? selectedKabKode}`;
    }
    return "Ringkasan agregat data pokok pendidikan menengah & khusus (SMA/SMK/SLB) se-Sulawesi Tengah";
  }, [selectedCabdis, selectedKabKode]);

  // ── Fly to School ────────────────────────────────────────────────────────
  const handleFocusSchool = useCallback((school: SekolahMarker) => {
    const lat = parseFloat(String(school.lintang ?? ""));
    const lng = parseFloat(String(school.bujur ?? ""));
    if (!lat || !lng || isNaN(lat) || isNaN(lng) || !mapRef.current) return;

    setSelectedSchool(school);
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

  // ── Fly to Kabupaten ──────────────────────────────────────────────────────
  const handleFocusKabupaten = useCallback((kode: string) => {
    const item = KABUPATEN_CENTROIDS[kode];
    if (!item || !mapRef.current) return;

    if (selectedKabKode === kode) {
      setSelectedKabKode(null);
      setSelectedCabdis(null);
      mapRef.current.flyTo([-1.4, 121.2], 7.5, { animate: true, duration: 1 });
    } else {
      setSelectedKabKode(kode);
      const cabId = KODE_TO_CABDIS[kode];
      if (cabId) setSelectedCabdis(cabId);
      mapRef.current.flyTo([item.lat, item.lng], 9.5, { animate: true, duration: 1.2 });
    }
  }, [selectedKabKode]);

  // ── Fly to Cabang Dinas Wilayah ───────────────────────────────────────────
  const handleFocusCabdis = useCallback((cabdisId: number) => {
    const cab = CABDIS_INFO[cabdisId];
    if (!cab || !mapRef.current) return;

    if (selectedCabdis === cabdisId && selectedKabKode === null) {
      // Reset jika diklik lagi
      setSelectedCabdis(null);
      setSelectedKabKode(null);
      mapRef.current.flyTo([-1.4, 121.2], 7.5, { animate: true, duration: 1 });
    } else {
      setSelectedCabdis(cabdisId);
      setSelectedKabKode(null);
      mapRef.current.flyTo(cab.center, cab.zoom, { animate: true, duration: 1.2 });
    }
  }, [selectedCabdis, selectedKabKode]);

  // ── Reset Map View ────────────────────────────────────────────────────────
  const handleResetMap = useCallback(() => {
    setSelectedCabdis(null);
    setSelectedKabKode(null);
    mapRef.current?.setView([-1.4, 121.2], 7.5, { animate: true });
  }, []);

  // ── GeoJSON Thematic Style per Kabupaten / Cabang Dinas ───────────────────
  const getKabupatenStyle = useCallback((feature: any) => {
    const kode = String(feature?.properties?.KODE_KAB ?? "");
    const cabId = KODE_TO_CABDIS[kode] || 1;
    const cab = CABDIS_INFO[cabId];
    const isSelectedCab = selectedCabdis === cabId;
    const isSelectedKab = selectedKabKode === kode;
    const isHovered = hoveredKabKode === kode;
    const color = cab?.color || "#2563eb";

    return {
      color: "#ffffff",
      weight: isHovered ? 3 : (isSelectedKab || isSelectedCab) ? 2.5 : 1.8,
      fillColor: color,
      fillOpacity: isHovered
        ? 0.85
        : (isSelectedKab || isSelectedCab)
          ? 0.75
          : mapMode === "cabdis"
            ? 0.58
            : 0.15,
    };
  }, [selectedCabdis, selectedKabKode, hoveredKabKode, mapMode]);

  // ── Style Vector Indonesia (Muted Silhouette, Tanpa Watermark / API Key) ───
  const getIndonesiaBaseStyle = useCallback(() => ({
    color: "#cbd5e1",
    weight: 0.8,
    fillColor: "#e2e8f0",
    fillOpacity: 0.85,
  }), []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 font-poppins bg-slate-50 text-slate-700">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 flex items-center justify-center text-rose-600 text-2xl font-bold">
          !
        </div>
        <p className="text-xl font-extrabold text-slate-900">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen font-poppins bg-[#f8fafc] overflow-x-hidden antialiased pb-16 selection:bg-blue-600 selection:text-white">

      {/* ══ SECTION 1: CLEAN LIGHT GLASS HEADER (Model C: Logo Center) ═══════ */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4">

          {/* Top Sub-Row: Breadcrumb (Left), Brand Logo (Center), & Actions (Right) */}
          <div className="relative flex items-center justify-between gap-4 mb-3 pb-2.5 border-b border-slate-100">

            {/* Breadcrumbs on Left */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 min-w-0 z-10">
              <Link to="/" className="hover:text-blue-600 transition-colors shrink-0">
                Beranda
              </Link>
              <span className="text-slate-300">›</span>
              <span className="text-blue-600 font-extrabold truncate">Portal Provinsi</span>
            </div>

            {/* Official Brand Logo di Tengah-Tengah Navbar (Model C) */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto">
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
            <div className="flex items-center gap-2.5 shrink-0 z-10">
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin/sekolah/create?from=/provinsi")}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Sekolah</span>
                </button>
              )}

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Kembali</span>
              </button>
            </div>
          </div>

          {/* Main Header Row: Lambang Resmi Provinsi & Title (Paling Kiri) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3.5 sm:gap-4.5">

              {/* Lambang Provinsi Sulawesi Tengah di Paling Kiri */}
              <div className="w-12 h-14 sm:w-14 sm:h-16 bg-white rounded-2xl border border-slate-200/90 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src="/images/kabupaten_kota.png/Sulawesi Tengah.png"
                  alt="Lambang Sulawesi Tengah"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              {/* Text Information Langsung di Samping Logo */}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/70 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                  Kewenangan Pemerintah Provinsi Sulawesi Tengah
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                  Dinas Pendidikan Provinsi Sulawesi Tengah
                </h1>
                <p className="text-slate-500 text-xs font-medium mt-0.5 line-clamp-1">
                  Pengelolaan &amp; Pemetaan Satuan Pendidikan Menengah (SMA, SMK, SLB &amp; Sederajat) — 13 Kabupaten/Kota
                </p>
              </div>

            </div>

            {/* Quick Cabdis Indicator */}
            {selectedCabdis && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shrink-0">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span className="text-xs font-bold text-blue-800">
                  Filter Aktif: {CABDIS_INFO[selectedCabdis]?.nama} ({CABDIS_INFO[selectedCabdis]?.label})
                </span>
                <button
                  onClick={() => handleFocusCabdis(selectedCabdis)}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-900 uppercase ml-1 cursor-pointer"
                >
                  ✕ Lepas
                </button>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* ══ SECTION 2: STAT CARDS (Clean Light Bento Grid) ═════════════════ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">

          {/* Card 1: Total Sekolah Menengah */}
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4.5 text-white shadow-md shadow-blue-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-85 bg-white/15 px-2 py-0.5 rounded-full">
                Total Sekolah
              </span>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight mb-0.5">
                {loadingData ? "..." : totalStats.total.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] opacity-80 font-semibold">
                SMA, MA, SMK, SLB &amp; SMTK
              </p>
            </div>
          </div>

          {/* Card 2: SMA / MA */}
          <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs"
                style={{ background: JENJANG_CONFIG.SMA.iconBg, color: JENJANG_CONFIG.SMA.iconColor }}
              >
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${JENJANG_CONFIG.SMA.text} ${JENJANG_CONFIG.SMA.bg} px-2 py-0.5 rounded-full border border-purple-200/60`}>
                SMA / MA
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">
                {loadingData ? "..." : ((Number(totalStats.map["SMA"]?.total ?? 0)) + (Number(totalStats.map["MA"]?.total ?? 0))).toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                SMA: {totalStats.map["SMA"]?.total ?? 0} · MA: {totalStats.map["MA"]?.total ?? 0}
              </p>
            </div>
          </div>

          {/* Card 3: SMK / MAK */}
          <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs"
                style={{ background: JENJANG_CONFIG.SMK.iconBg, color: JENJANG_CONFIG.SMK.iconColor }}
              >
                <Briefcase className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${JENJANG_CONFIG.SMK.text} ${JENJANG_CONFIG.SMK.bg} px-2 py-0.5 rounded-full border border-pink-200/60`}>
                SMK / Vokasi
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">
                {loadingData ? "..." : Number(totalStats.map["SMK"]?.total ?? 0).toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {totalStats.map["SMK"]?.total_negeri ?? 0}N · {totalStats.map["SMK"]?.total_swasta ?? 0}S
              </p>
            </div>
          </div>

          {/* Card 4: SLB (Pendidikan Khusus) */}
          <div className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs"
                style={{ background: JENJANG_CONFIG.SLB.iconBg, color: JENJANG_CONFIG.SLB.iconColor }}
              >
                <Users className="w-4.5 h-4.5" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${JENJANG_CONFIG.SLB.text} ${JENJANG_CONFIG.SLB.bg} px-2 py-0.5 rounded-full border border-rose-200/60`}>
                SLB
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">
                {loadingData ? "..." : Number(totalStats.map["SLB"]?.total ?? 0).toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {totalStats.map["SLB"]?.total_negeri ?? 0}N · {totalStats.map["SLB"]?.total_swasta ?? 0}S
              </p>
            </div>
          </div>

          {/* Card 5: Wilayah 3T / Terpencil */}
          <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4.5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-50 text-cyan-600 shadow-2xs">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200/60">
                Sekolah 3T
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">
                {loadingData ? "..." : totalStats.total3t.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Afirmasi Terdepan / Terluar
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ══ SECTION 3: PETA (2/3) + PANEL LENGKAP FILTER & LIST (1/3) ═══════ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-[620px]">

          {/* Peta dengan Akselerasi Canvas & Cluster Super Smooth */}
          <div className="lg:col-span-2 relative h-[500px] lg:h-full rounded-[1.5rem] overflow-hidden shadow-md border border-slate-200 bg-slate-100">
            <img
              src="/images/cmd/bc-cmdcenter-bg.webp"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none z-0"
            />

            <div className="absolute inset-0 z-0">
              <MapContainer
                key={`map-provinsi-v2-${mapMode}`}
                center={[-1.4, 121.2]}
                zoom={7.5}
                minZoom={6}
                maxZoom={18}
                preferCanvas={true}
                zoomControl={false}
                scrollWheelZoom={true}
                doubleClickZoom={true}
                closePopupOnClick={false}
                attributionControl={false}
                maxBounds={[[-4.8, 118.0], [2.8, 125.0]]}
                maxBoundsViscosity={0.6}
                style={{ width: "100%", height: "100%", background: "transparent" }}
              >
                <SetMapView center={[-1.4, 121.2]} zoom={7.5} mapRef={mapRef} />

                {/* Vector Basemap: Peta Indonesia Vector (100% Offline, Bebas Watermark / API Key) */}
                <GeoJSON
                  key="indonesia-base-layer"
                  data={indonesiaGeoData as any}
                  style={getIndonesiaBaseStyle}
                  interactive={false}
                />

                {/* GeoJSON Poligon 13 Kabupaten Tematik 6 Cabang Dinas */}
                {!loadingGeo && sultengGeo && (
                  <GeoJSON
                    key={`sulteng-geo-${mapMode}-${selectedCabdis}-${selectedKabKode}`}
                    data={sultengGeo}
                    style={getKabupatenStyle}
                    onEachFeature={(feature, layer) => {
                      const kode = String(feature?.properties?.KODE_KAB ?? "");
                      const kabName = feature?.properties?.NAMOBJ || "Kabupaten";
                      const cabId = KODE_TO_CABDIS[kode] || 1;
                      const cab = CABDIS_INFO[cabId];
                      const count = kabCounts[kode] || 0;

                      layer.bindTooltip(`
                        <div style="font-family:'Poppins',sans-serif;font-size:11px;padding:2px;">
                          <div style="font-weight:900;font-size:12px;color:#fff;">${kabName}</div>
                          <div style="color:${cab?.color || '#3b82f6'};font-weight:700;margin-top:2px;">🏛️ ${cab?.nama || ''} — ${cab?.label || ''}</div>
                          <div style="font-size:10px;color:#94a3b8;margin-top:4px;">${count} Sekolah Menengah · Klik untuk fokus</div>
                        </div>
                      `, {
                        sticky: true,
                        className: "custom-region-tooltip",
                        opacity: 1
                      });

                      layer.on({
                        mouseover: (e: any) => {
                          setHoveredKabKode(kode);
                          const l = e.target;
                          l.setStyle({ weight: 3, fillOpacity: 0.85 });
                          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            l.bringToFront();
                          }
                        },
                        mouseout: (e: any) => {
                          setHoveredKabKode(null);
                          const l = e.target;
                          l.setStyle(getKabupatenStyle(feature));
                        },
                        click: () => {
                          handleFocusKabupaten(kode);
                        }
                      });
                    }}
                  />
                )}

                {/* Mode 1: Floating Centroid Badges (Tanpa Cluster Acak) */}
                {mapMode === "cabdis" && (
                  <CentroidBadgesLayer
                    kabCounts={kabCounts}
                    onSelectKab={handleFocusKabupaten}
                  />
                )}

                {/* Mode 2: Titik Sebaran Sekolah (Cluster Modern) */}
                {mapMode === "titik" && !loadingData && (
                  <MarkerClusterMapLayer
                    schools={filteredSekolah}
                    hoveredJenjang={hoveredJenjang}
                    onSchoolClick={(school) => setSelectedSchool(school)}
                    clusterRef={clusterRef}
                    markerMapRef={markerMapRef}
                  />
                )}
              </MapContainer>
            </div>

            {/* Floating Dual-Mode Switch (Top Center) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-slate-200/90 flex items-center gap-1">
                <button
                  onClick={() => setMapMode("cabdis")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${mapMode === "cabdis"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Peta Wilayah Cabdis</span>
                </button>
                <button
                  onClick={() => setMapMode("titik")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${mapMode === "titik"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Sebaran Titik</span>
                </button>
              </div>
            </div>

            {/* Floating Zoom & Map Controls (Top Left) */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
              <button
                onClick={() => mapRef.current?.zoomIn()}
                className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-50 transition-all cursor-pointer"
                title="Perbesar"
              >
                +
              </button>
              <button
                onClick={() => mapRef.current?.zoomOut()}
                className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-50 transition-all cursor-pointer"
                title="Perkecil"
              >
                −
              </button>
              <button
                onClick={handleResetMap}
                className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all cursor-pointer"
                title="Reset Tampilan Seluruh Sulawesi Tengah"
              >
                <Compass className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Legenda di Kiri Bawah */}
            <div className="absolute bottom-4 left-4 z-10 max-w-[calc(100%-2rem)]">
              {mapMode === "cabdis" ? (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-lg border border-slate-200/80 max-w-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">6 Wilayah Cabang Dinas</span>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Resmi Disdik</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px]">
                    {Object.values(CABDIS_INFO).map((c) => {
                      const isFocused = selectedCabdis === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleFocusCabdis(c.id)}
                          className={`flex items-center gap-1.5 text-left transition-all cursor-pointer px-1 py-0.5 rounded-lg ${isFocused ? "bg-slate-100 font-black scale-105" : "hover:opacity-100 opacity-85"
                            }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0 shadow-2xs" style={{ background: c.color }} />
                          <span className="font-bold text-slate-700 truncate">{c.nama}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg border border-slate-200/80 flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Jenjang:</span>
                  {JENJANG_PROVINSI.map((j) => {
                    const cfg = JENJANG_CONFIG[j];
                    if (!cfg) return null;
                    const count = allSekolah.filter((s) => s.bentuk_pendidikan === j).length;
                    const isActive = filterJenjang === j;

                    return (
                      <button
                        key={j}
                        onClick={() => setFilterJenjang(filterJenjang === j ? "semua" : j)}
                        onMouseEnter={() => setHoveredJenjang(j)}
                        onMouseLeave={() => setHoveredJenjang(null)}
                        className={`flex items-center gap-1.5 transition-all cursor-pointer px-1.5 py-0.5 rounded-lg ${isActive ? "bg-slate-100 font-black" : "opacity-85 hover:opacity-100"
                          }`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-2xs"
                          style={{ background: cfg.color }}
                        />
                        <span className="text-[10px] font-bold text-slate-700">{j}</span>
                        <span className="text-[9px] font-semibold text-slate-400">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Loading Overlay */}
            {(loadingData || loadingGeo) && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/40 backdrop-blur-xs">
                <div className="bg-white rounded-2xl px-6 py-3.5 flex items-center gap-3 shadow-xl border border-slate-100">
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-700">Memuat Peta Sekolah Menengah...</span>
                </div>
              </div>
            )}
          </div>

          {/* Panel Kanan: Filter Komprehensif & Daftar Sekolah (Desain Seragam Kabupaten) */}
          <div className="bg-white rounded-[1.5rem] p-4 shadow-md border border-slate-200 flex flex-col gap-3 h-[580px] lg:h-full min-h-0 overflow-hidden">

            {/* Header Panel dengan Border Biru & Icon Filter */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
              <div className="border-l-4 pl-3 border-blue-600">
                <div className="font-bold text-sm text-slate-800">Daftar Sekolah &amp; Lembaga</div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {selectedKabKode
                    ? `Satuan Pendidikan ${KABUPATEN_CENTROIDS[selectedKabKode]?.nama}`
                    : selectedCabdis
                      ? `Satuan Pendidikan ${CABDIS_INFO[selectedCabdis]?.nama}`
                      : "Satuan Pendidikan Provinsi Sulawesi Tengah"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(selectedKabKode || selectedCabdis) && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 flex items-center gap-1">
                    <span>{selectedKabKode ? KABUPATEN_CENTROIDS[selectedKabKode]?.nama : (selectedCabdis ? CABDIS_INFO[selectedCabdis]?.nama : "")}</span>
                    <button
                      onClick={() => {
                        setSelectedKabKode(null);
                        setSelectedCabdis(null);
                      }}
                      className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                      title="Hapus filter wilayah"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <Filter className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Filter Jenjang Chips (Gabungan Semua Jenjang) */}
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {[
                { key: "semua", label: "Semua" },
                { key: "SMA", label: "SMA" },
                { key: "SMK", label: "SMK" },
                { key: "SLB", label: "SLB" },
                { key: "MA", label: "MA" },
                { key: "SMTK", label: "SMTK" },
              ].filter((item) => {
                if (item.key === "semua") return true;
                const matchKeys = JENJANG_CONFIG[item.key]?.matchKeys ?? [item.key];
                return allSekolah.some((s) => matchKeys.includes(s.bentuk_pendidikan ?? ""));
              }).map((item) => {
                const active = filterJenjang === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setFilterJenjang(item.key)}
                    className={`px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider border transition-all cursor-pointer ${active
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-white"
                      }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Filter Group: Status & Akreditasi */}
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

            {/* Search Input + Sort Dropdown */}
            <div className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah, NPSN, kab..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {schoolSearch && (
                  <button
                    onClick={() => setSchoolSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="relative shrink-0 flex items-center">
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Urutkan Sekolah"
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none"
                >
                  <option value="az">A → Z</option>
                  <option value="za">Z → A</option>
                  <option value="akr">Akreditasi</option>
                </select>
              </div>
            </div>

            {/* Info Counter + Reset */}
            <div className="flex items-center justify-between px-1 shrink-0">
              <span className="text-[11px] text-slate-500 font-semibold">
                Menampilkan <span className="font-bold text-blue-600">{filteredSekolah.length}</span> dari {allSekolah.length} sekolah
              </span>
              {(filterJenjang !== "semua" || filterStatus || filterAkreditasi || schoolSearch || selectedCabdis !== null || selectedKabKode !== null) && (
                <button
                  onClick={() => {
                    setFilterJenjang("semua");
                    setFilterStatus("");
                    setFilterAkreditasi("");
                    setSchoolSearch("");
                    setSelectedCabdis(null);
                    setSelectedKabKode(null);
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Daftar Sekolah Scrollable */}
            <div className="overflow-y-auto flex flex-col gap-2.5 scrollbar-hide flex-1 min-h-0 pr-1">
              {loadingData && (
                <div className="text-center py-8 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Memuat data...
                </div>
              )}
              {!loadingData && filteredSekolah.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-50 rounded-2xl border border-slate-100">
                  Tidak ada sekolah cocok
                </div>
              )}
              {!loadingData && filteredSekolah.map((school, idx) => {
                const jenjang = school.bentuk_pendidikan ?? "";
                const color = getJenjangColor(jenjang);
                const isActive = selectedSchool?.npsn === school.npsn;
                const hasCoordinates = !!(school.lintang && school.bujur);
                const key = school.npsn ? `${school.npsn}-${idx}` : `s-${idx}`;

                return (
                  <div
                    key={key}
                    onClick={() => handleFocusSchool(school)}
                    className={`bg-white rounded-2xl p-3 border shadow-2xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 shrink-0 ${isActive ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20" : "border-slate-100 hover:border-blue-200"
                      }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                        style={{ background: `${color}18`, color: color }}
                      >
                        {jenjang}
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
                          <span className="truncate">{school.kabupaten ?? "—"}</span>
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

                    <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusSchool(school);
                        }}
                        disabled={!hasCoordinates}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${hasCoordinates
                          ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                          }`}
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Lokasi</span>
                      </button>

                      <Link
                        to={`/sekolah/${school.npsn}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200/80 transition-all text-center"
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

      {/* ══ SECTION 4: 6 WILAYAH CABANG DINAS INTERAKTIF (SIGNATURE PROVINSI) ═ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Distribusi 6 Wilayah Cabang Dinas Pendidikan
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sebaran dan pengawasan satuan pendidikan menengah berdasarkan wilayah kerja Cabang Dinas
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Klik "Sorot Peta" untuk fokus ke wilayah</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cabdisDistribusi.map((cab) => {
            const isFocused = selectedCabdis === cab.id;
            const barWidth = Math.round((cab.total / maxCabdisTotal) * 100);

            return (
              <div
                key={cab.id}
                className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md ${isFocused
                  ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "border-slate-200/90 hover:border-blue-300 shadow-2xs"
                  }`}
              >
                {/* Cabdis Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ background: cab.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider">{cab.nama}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">{cab.label}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-slate-900">{cab.total.toLocaleString("id-ID")}</p>
                    <p className="text-[9px] text-slate-400 font-medium">sekolah</p>
                  </div>
                </div>

                {/* Progress Bar Total */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, background: cab.color }}
                  />
                </div>

                {/* Mini Breakdown per Jenjang */}
                <div className="flex flex-col gap-1.5 mb-4">
                  {JENJANG_PROVINSI.filter((j) => (cab.per_jenjang[j] ?? 0) > 0).map((j) => {
                    const cfg = JENJANG_CONFIG[j];
                    const count = cab.per_jenjang[j] ?? 0;
                    const pct = cab.total > 0 ? Math.round((count / cab.total) * 100) : 0;
                    return (
                      <div key={j} className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 w-8 font-bold">{j}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: cfg?.color ?? "#64748b" }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 w-7 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions: Sorot Peta & Link Halaman Cabdis */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleFocusCabdis(cab.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${isFocused
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{isFocused ? "Fokus Aktif" : "Sorot Peta"}</span>
                  </button>

                  <Link
                    to={`/${cab.slug}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-all text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Detail Cabdis</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ SECTION 5: DATA UMUM SATUAN PENDIDIKAN PROVINSI ═════════════════ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-12">
        <GeneralDataSection
          data={provinsiGeneralData}
          title="Data Umum Satuan Pendidikan Provinsi"
          subtitle={generalDataSubtitle}
        />
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 sm:px-8 py-8 mt-12 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400">
          &copy; 2026 Balai Layanan Pemetaan Pendidikan (BLPT) — Dinas Pendidikan Provinsi Sulawesi Tengah
        </p>
      </footer>

      {/* Modal Hapus Sekolah */}
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

        /* Cluster Marker Modern */
        .marker-cluster {
          background-clip: padding-box;
          border-radius: 50%;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        .marker-cluster div {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
        }
        .marker-cluster-small  { background-color: rgba(59,130,246,0.25); }
        .marker-cluster-small div  { background-color: rgba(37,99,235,0.9); box-shadow: 0 2px 6px rgba(37,99,235,0.4); }
        .marker-cluster-medium { background-color: rgba(99,102,241,0.25); }
        .marker-cluster-medium div { background-color: rgba(79,70,229,0.9); box-shadow: 0 2px 6px rgba(79,70,229,0.4); }
        .marker-cluster-large  { background-color: rgba(139,92,246,0.25); }
        .marker-cluster-large div  { background-color: rgba(109,40,217,0.9); box-shadow: 0 2px 6px rgba(109,40,217,0.4); }
      `}</style>
    </div>
  );
};
