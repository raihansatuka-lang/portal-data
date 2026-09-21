import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { CABANG_DATA } from "@/types";
import type { CabangDinasItem } from "@/types";
import { School as SchoolIcon, Search, MapPin, ArrowRight, ChevronLeft, ChevronDown, X, Eye, Plus, Minus, RotateCcw, Award, Map as MapIcon, ListFilter, BarChart3 } from "lucide-react";
import L from "leaflet";
import { PemetaanService } from "@/services/pemetaanService";
import { SulawesiMap, CABDIS_CONFIG } from "@/components/Fragments/SulawesiMap";
import { CabdisProfileCard } from "@/components/Sections/CabdisProfileCard";
import { Skeleton } from "@/components/Elements/Skeleton/Skeleton";

const cleanKecamatanName = (nama: string): string => {
  return (nama || "")
    .replace(/^(kec\.?|kecamatan)\s+/i, "")
    .replace(/,\s*kab\..*$/i, "")
    .trim();
};

const getJenjangColor = (bentukPendidikan: string): string => {
  const upper = (bentukPendidikan || "").toUpperCase();
  if (upper.includes("SMA") || upper.includes("MA")) return "#8b5cf6";
  if (upper.includes("SMK")) return "#3b82f6";
  if (upper.includes("SLB")) return "#f59e0b";
  if (upper.includes("SMTK")) return "#14b8a6";
  return "#64748b";
};

export const CabangDinas = ({ slug: propSlug }: { slug?: string }) => {
  const { slug: paramSlug } = useParams();
  const slug = propSlug || paramSlug;
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  // =========================================================================
  // KUSTOMISASI KOORDINAT CENTER & ZOOM PER ID CABDIS (MANUAL ID MAPPING)
  // -------------------------------------------------------------------------
  // Anda dapat memasukkan kustom koordinat [latitude, longitude] dan zoom level
  // secara manual berdasarkan Angka Wilayah Cabang Dinas Anda di bawah ini.
  // Set nilai center atau zoom ke null jika ingin memakai koordinat default.
  // =========================================================================
  const CUSTOM_REGIONAL_CONFIGS: Record<number, { center: [number, number] | null; zoom: number | null }> = {
    1: { center: [-1.44849, 119.909619], zoom: 10 }, // Wilayah 1 (Kota Palu, Sigi)
    2: { center: [-2.14849, 120.309619], zoom: 8 }, // Wilayah 2 (Parigi Moutong, Donggala)
    3: { center: [-3.04849, 121.209619], zoom: 8 }, // Wilayah 3 (Poso, Ampana)
    4: { center: [-4.252631, 121.758189], zoom: 8.4 }, // Wilayah 4 (Morowali, Morowali Utara)
    5: { center: [-1.046066, 122.844154], zoom: null }, // Wilayah 5 (Banggai area)
    6: { center: [-0.029523, 121.074295], zoom: 9 }, // Wilayah 6 (Tolitoli, Buol)
  };

  // Ekstraksi instan nomor wilayah (1-6) dari slug Cabdis (misal cabdis-2 -> 2)
  const numericId = slug ? parseInt(slug.replace("cabdis-", ""), 10) : null;

  // State untuk data semua cabang dinas dari API, dengan fallback ke CABANG_DATA statis
  const [cabangList, setCabangList] = useState<CabangDinasItem[]>([]);
  const currentCabangApi = useMemo(() => {
    return cabangList.find((c) => c.id === numericId) || null;
  }, [cabangList, numericId]);

  const cabangFallback = numericId ? CABANG_DATA.find((c) => c.id === numericId) : undefined;

  // Gunakan data API jika tersedia, fallback ke CABANG_DATA statis
  const cabangConfig = currentCabangApi
    ? {
      id: currentCabangApi.id,
      name: currentCabangApi.nama,
      kabKotas: currentCabangApi.kabupaten_kota ?? cabangFallback?.kabKotas ?? [],
    }
    : cabangFallback
      ? { id: cabangFallback.id, name: cabangFallback.name, kabKotas: cabangFallback.kabKotas }
      : undefined;

  const regionName = queryParams.get("name") || cabangConfig?.name || `Wilayah ${numericId || ""}`;
  const activeCabdisSlug = slug || `cabdis-${numericId}`;
  const activeCabdisCfg = CABDIS_CONFIG[activeCabdisSlug] || CABDIS_CONFIG["cabdis-1"];

  // Koordinat dari API jika tersedia, otherwise fallback ke CUSTOM_REGIONAL_CONFIGS
  const CUSTOM_MAP_CENTER: [number, number] | null = useMemo(() => {
    if (currentCabangApi?.map_lat && currentCabangApi?.map_lng) {
      const lat = parseFloat(String(currentCabangApi.map_lat));
      const lng = parseFloat(String(currentCabangApi.map_lng));
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return [lat, lng];
      }
    }
    if (numericId && CUSTOM_REGIONAL_CONFIGS[numericId]?.center) {
      return CUSTOM_REGIONAL_CONFIGS[numericId].center;
    }
    return null;
  }, [currentCabangApi, numericId]);

  const CUSTOM_MAP_ZOOM: number | null = useMemo(() => {
    const rawZoom = currentCabangApi?.map_zoom ?? (numericId && CUSTOM_REGIONAL_CONFIGS[numericId]?.zoom) ?? 8.5;
    const z = typeof rawZoom === "string" ? parseFloat(rawZoom) : rawZoom;
    return !isNaN(z) ? z : 8.5;
  }, [currentCabangApi, numericId]);

  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedSchoolForMap, setSelectedSchoolForMap] = useState<any>(null);
  const [cabdisDropdownOpen, setCabdisDropdownOpen] = useState(false);
  const [activeJenjangFilter, setActiveJenjangFilter] = useState<string>("semua");
  const [activeKabupatenFilter, setActiveKabupatenFilter] = useState<string | null>(null);
  const [activeAkreditasiFilter, setActiveAkreditasiFilter] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<"map" | "list" | "profile">("map");
  const cabdisDropdownRef = useRef<HTMLDivElement>(null);

  const rawSchools = Array.isArray(data?.schools) ? data.schools : [];
  const filteredSchools = rawSchools.filter((s: any) => {
    const sKabupaten = (s.kabupaten || "").trim();
    const matchesKabupaten = !activeKabupatenFilter || sKabupaten.toLowerCase() === activeKabupatenFilter.toLowerCase();
    const matchesSearch =
      !schoolSearch ||
      s.name?.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      s.kecamatan?.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      s.kabupaten?.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      s.npsn?.toLowerCase().includes(schoolSearch.toLowerCase());
    const rawGrade = String(s.grade || s.bentuk_pendidikan || "").toUpperCase().trim();
    const matchesJenjang = activeJenjangFilter === "semua" || rawGrade.includes(activeJenjangFilter);
    const rawAkreditasi = String(s.akreditasi || "").toUpperCase().trim();
    const matchesAkreditasi = !activeAkreditasiFilter || (() => {
      if (activeAkreditasiFilter === "LAIN") {
        return rawAkreditasi !== "A" && rawAkreditasi !== "B" && rawAkreditasi !== "C";
      }
      return rawAkreditasi === activeAkreditasiFilter;
    })();
    return matchesSearch && matchesJenjang && matchesKabupaten && matchesAkreditasi;
  });

  const handleSelectKabupaten = (kab: string | null) => {
    setActiveKabupatenFilter(kab);
    setSelectedSchoolForMap(null);
    if (!kab) {
      if (mapInstance && CUSTOM_MAP_CENTER) {
        try {
          mapInstance.flyTo(CUSTOM_MAP_CENTER, CUSTOM_MAP_ZOOM ?? 8.5, { duration: 0.8 });
        } catch (e) {
          console.warn("Reset view error:", e);
        }
      }
      return;
    }

    // Filter koordinat sekolah di kabupaten yang dipilih
    const kabSchools = rawSchools.filter(
      (s: any) => (s.kabupaten || "").trim().toLowerCase() === kab.toLowerCase()
    );
    const validCoords = kabSchools
      .map((s: any) => ({
        lat: parseFloat(s.latitude ?? s.lintang),
        lng: parseFloat(s.longitude ?? s.bujur),
      }))
      .filter((c: any) => !isNaN(c.lat) && !isNaN(c.lng) && Math.abs(c.lat) > 0.01 && Math.abs(c.lng) > 0.01);

    if (validCoords.length > 0 && mapInstance) {
      const avgLat = validCoords.reduce((acc: number, c: any) => acc + c.lat, 0) / validCoords.length;
      const avgLng = validCoords.reduce((acc: number, c: any) => acc + c.lng, 0) / validCoords.length;
      try {
        mapInstance.flyTo([avgLat, avgLng], 9.8, {
          duration: 0.8,
          easeLinearity: 0.25,
        });
      } catch (e) {
        console.warn("FlyTo kabupaten error:", e);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cabdisDropdownRef.current && !cabdisDropdownRef.current.contains(e.target as Node)) {
        setCabdisDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const titleWil = numericId ? `Wilayah ${numericId}` : "";
    document.title = `Cabang Dinas ${titleWil} - Dinas Pendidikan Provinsi Sulawesi Tengah`;
  }, [numericId]);

  // 1. Fetch detailed data & reset state when slug changes
  useEffect(() => {
    if (slug) {
      setSelectedSchoolForMap(null);
      setSchoolSearch("");
      setActiveKabupatenFilter(null);
      setActiveJenjangFilter("semua");
      setActiveAkreditasiFilter(null);
      fetchDetail();
    }
  }, [slug]);

  // 2. Fetch overall landing page context on mount
  useEffect(() => {
    fetchCabangDinas();
  }, []);

  /** Ambil data semua cabang dinas dari API pemetaan */
  const fetchCabangDinas = async () => {
    try {
      const res = await PemetaanService.getCabangDinas();
      if (res?.data && Array.isArray(res.data)) {
        setCabangList(res.data);
      }
    } catch (error) {
      // Fallback ke CABANG_DATA statis sudah ditangani di cabangConfig
      console.warn("Gagal fetch cabang dinas dari API, menggunakan data lokal:", error);
    }
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      // ✅ Pakai PemetaanService.getRegionDetail — bukan PortalService
      const res = await PemetaanService.getRegionDetail(slug!);
      if (res?.data) setData(res.data);
    } catch (error) {
      console.error("Failed to fetch region detail", error);
    } finally {
      setLoading(false);
    }
  };


  // Redirect to home jika ID Cabdis tidak dikenal atau gagal terurai
  // Cek numericId valid (1-6); cabangConfig bisa null sementara API sedang loading
  if (!numericId || isNaN(numericId) || numericId < 1 || numericId > 6) {
    return <Navigate to="/" replace />;
  }

  if (loading && !data) {
    return (
      <div className="w-screen h-screen p-10 bg-gray-50 flex flex-col gap-6">
        <Skeleton className="w-full h-[60vh] rounded-[40px] animate-pulse" />
        <div className="flex gap-6 h-[30vh] animate-pulse">
          <Skeleton className="w-1/3 h-full" />
          <Skeleton className="w-1/3 h-full" />
          <Skeleton className="w-1/3 h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden font-poppins bg-slate-50/20 select-none">

      {/* Background */}
      <img
        src="/images/cmd/bc-cmdcenter-bg.webp"
        alt=""
        className="fixed inset-0 object-cover w-full h-full opacity-15 pointer-events-none select-none z-0"
      />

      {/* Main Container — Locked to 100vh GIS Command Center */}
      <main className="w-full h-screen relative z-10 overflow-hidden flex flex-col items-center">

        {/* ═══════════════════════════════════════════════════════════════════
            HEADER RESMI CABANG DINAS (STEP 1)
        ════════════════════════════════════════════════════════════════════ */}
        <header className="absolute top-0 inset-x-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/70 shadow-2xs">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between relative">

            {/* Sisi Kiri: Tombol Kembali ke Beranda & Identitas Wilayah */}
            <div className="flex items-center gap-2 sm:gap-2.5 z-10">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white/90 border border-slate-200/80 shadow-2xs hover:bg-white hover:border-slate-300 hover:text-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                title="Kembali ke Beranda Utama"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Beranda</span>
              </button>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              {/* Badge Identitas Cabang Dinas Aktif */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/70 shadow-2xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-2 ring-offset-1"
                  style={{ background: activeCabdisCfg.color }}
                />
                <span className="text-xs font-extrabold text-slate-800">
                  Wilayah {numericId}
                </span>
                <span className="hidden md:inline text-xs text-slate-400 font-medium">
                  • {activeCabdisCfg.label.split("—")[1]?.trim() || cabangConfig?.name}
                </span>
              </div>
            </div>

            {/* Logo Brand Resmi di Tengah (Proporsional & Sleek) */}
            <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-auto">
              <Link to="/" title="Berani Cerdas - Dinas Pendidikan Provinsi Sulawesi Tengah">
                <img
                  src="/logo.png"
                  alt="Logo Portal Pemetaan"
                  className="h-8 object-contain drop-shadow-2xs hover:scale-105 transition-transform duration-200"
                />
              </Link>
            </div>

            {/* Sisi Kanan: Pindah Cepat Wilayah Cabdis & Data Provinsi */}
            <div className="flex items-center gap-2 z-10">
              {/* Dropdown Ganti Wilayah Cabdis */}
              <div className="relative" ref={cabdisDropdownRef}>
                <button
                  onClick={() => setCabdisDropdownOpen(!cabdisDropdownOpen)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${cabdisDropdownOpen
                      ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                      : "text-slate-700 bg-white/85 hover:bg-white hover:text-blue-700 border border-slate-200/80 shadow-2xs"
                    }`}
                  title="Pindah ke Wilayah Cabang Dinas Lain"
                >
                  <span className="hidden sm:inline">Pindah Wilayah</span>
                  <span className="sm:hidden">Wilayah</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${cabdisDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                      }`}
                  />
                </button>

                {cabdisDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 mb-1 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Pilih Cabang Dinas
                      </span>
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        6 Wilayah
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {Object.entries(CABDIS_CONFIG).map(([cSlug, cCfg]) => {
                        const isCurrent = cSlug === activeCabdisSlug;
                        return (
                          <button
                            key={cSlug}
                            onClick={() => {
                              setCabdisDropdownOpen(false);
                              navigate(`/${cSlug}?name=${encodeURIComponent(cCfg.label)}`);
                            }}
                            className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group cursor-pointer ${isCurrent
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-700 hover:bg-blue-50/70 hover:text-blue-700 hover:pl-3.5"
                              }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs group-hover:scale-125 transition-transform"
                              style={{ background: cCfg.color }}
                            />
                            <span className="truncate">{cCfg.label}</span>
                            {isCurrent && (
                              <span className="ml-auto text-[9px] font-extrabold text-blue-600 bg-white px-1.5 py-0.5 rounded-md border border-blue-200">
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

              <Link
                to="/provinsi"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white/85 hover:bg-white hover:text-blue-700 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 border border-slate-200/80 shadow-2xs transition-all duration-200 hidden sm:inline-flex"
              >
                Data Provinsi
              </Link>
            </div>

          </div>
        </header>

        {/* Mobile Tab Pill Switcher (Map, List, Profile) */}
        <div className="lg:hidden fixed top-16 inset-x-0 z-30 pointer-events-none flex justify-center px-4 py-1.5">
          <div className="pointer-events-auto flex items-center p-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/90 gap-1">
            <button
              onClick={() => setMobileTab("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mobileTab === "map"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta</span>
            </button>
            <button
              onClick={() => setMobileTab("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mobileTab === "list"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Daftar ({filteredSchools.length})</span>
            </button>
            <button
              onClick={() => setMobileTab("profile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mobileTab === "profile"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Profil</span>
            </button>
          </div>
        </div>

        {/* Peta Interaktif */}
        <div className="absolute inset-0 z-5 overflow-hidden">
          <div className="w-full h-full">
            <SulawesiMap
              layer="interactive"
              onlyShowId={numericId}
              markers={[]}
              schools={filteredSchools}
              customCenter={CUSTOM_MAP_CENTER}
              customZoom={CUSTOM_MAP_ZOOM}
              onMapReady={setMapInstance}
              onSchoolClick={(school) => {
                setSchoolSearch(school.name);
                setSelectedSchoolForMap(school);
              }}
              selectedSchool={selectedSchoolForMap}
              onPopupClose={() => {
                setSchoolSearch("");
                setSelectedSchoolForMap(null);
              }}
            />
          </div>
        </div>

        {/* Layout: Panel Kiri (Profil Cabdis) + Area Peta Tengah + Panel Kanan (Daftar Sekolah) */}
        <div className="relative z-10 w-full h-full flex flex-col lg:flex-row pt-28 lg:pt-16 pb-4 px-3 sm:px-4 lg:px-6 gap-3 lg:gap-4 pointer-events-none">

          {/* Sisi Kiri: Panel Profil & Quick Filter Jenjang & Sebaran Wilayah */}
          <div className={`pointer-events-auto transition-all duration-300 ${leftCollapsed ? "w-auto" : "w-full lg:w-[300px] xl:w-[325px]"} h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)] shrink-0 ${
            mobileTab === "profile" ? "block" : "hidden lg:block"
          }`}>
            <CabdisProfileCard
              numericId={numericId}
              cabdisConfig={activeCabdisCfg}
              schools={data?.schools || []}
              summary={data?.summary}
              activeJenjang={activeJenjangFilter}
              onSelectJenjang={(j) => setActiveJenjangFilter(j)}
              activeKabupaten={activeKabupatenFilter}
              onSelectKabupaten={handleSelectKabupaten}
              activeAkreditasi={activeAkreditasiFilter}
              onSelectAkreditasi={(akr) => setActiveAkreditasiFilter(akr)}
              isCollapsed={leftCollapsed}
              onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
            />
          </div>

          {/* Tengah: Area Peta Interaktif & Floating Navigation HUD */}
          <div className={`flex-1 pointer-events-none flex flex-col justify-end items-start pb-4 lg:pb-6 ${
            mobileTab === "map" ? "flex" : "hidden lg:flex"
          }`}>
            {/* Mobile Bottom Quick Status Bar (Only on mobile in map mode) */}
            <div className="lg:hidden pointer-events-auto w-full mb-3 px-1">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-slate-200/90 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">
                    {activeCabdisCfg.label}
                  </p>
                  <p className="text-[10.5px] text-slate-500 font-semibold">
                    <span className="text-blue-600 font-extrabold">{filteredSchools.length}</span> Sekolah Terdaftar
                  </p>
                </div>
                <button
                  onClick={() => setMobileTab("list")}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Lihat Daftar</span>
                </button>
              </div>
            </div>

            <div className="pointer-events-auto flex flex-col gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200/90 transition-all duration-200">
              <button
                type="button"
                onClick={() => {
                  try { mapInstance?.zoomIn(); } catch (e) { console.warn(e); }
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:text-blue-700 hover:bg-blue-50 active:scale-90 transition-all cursor-pointer"
                title="Perbesar Peta (+)"
                aria-label="Zoom In"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="h-px w-5 bg-slate-200/80 mx-auto" />

              <button
                type="button"
                onClick={() => {
                  try { mapInstance?.zoomOut(); } catch (e) { console.warn(e); }
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:text-blue-700 hover:bg-blue-50 active:scale-90 transition-all cursor-pointer"
                title="Perkecil Peta (-)"
                aria-label="Zoom Out"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>

              {CUSTOM_MAP_CENTER && (
                <>
                  <div className="h-px w-5 bg-slate-200/80 mx-auto" />
                  <button
                    type="button"
                    onClick={() => {
                      if (mapInstance && CUSTOM_MAP_CENTER) {
                        try {
                          mapInstance.flyTo(CUSTOM_MAP_CENTER, CUSTOM_MAP_ZOOM ?? 8.5, {
                            duration: 0.8,
                            easeLinearity: 0.25,
                          });
                        } catch (e) {
                          console.warn("Reset view error:", e);
                        }
                      }
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:text-blue-700 hover:bg-blue-50 active:scale-90 transition-all cursor-pointer"
                    title="Reset Tampilan Wilayah"
                    aria-label="Reset View"
                  >
                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Panel Daftar Sekolah */}
          <div className={`w-full lg:w-[320px] xl:w-[350px] pointer-events-auto flex flex-col gap-2.5 h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)] min-h-0 shrink-0 ${
            mobileTab === "list" ? "flex" : "hidden lg:flex"
          }`}>

            {/* Panel Header Seragam Kabupaten & Provinsi */}
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm rounded-2xl p-3.5 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="border-l-4 pl-3 border-blue-600">
                  <div className="font-bold text-sm text-slate-800">Daftar Sekolah &amp; Lembaga</div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Satuan Pendidikan {regionName}
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative mt-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama sekolah atau kecamatan..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2 pl-9 pr-8 text-xs font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                />
                {schoolSearch && (
                  <button
                    type="button"
                    onClick={() => setSchoolSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Counter & Filter Status */}
              <div className="flex items-center justify-between flex-wrap gap-1 mt-2.5 px-1">
                <p className="text-[10px] text-slate-500 font-semibold">
                  Menampilkan <span className="font-bold text-blue-600">{filteredSchools.length}</span> sekolah
                </p>
                <div className="flex items-center flex-wrap gap-1">
                  {activeKabupatenFilter && (
                    <button
                      type="button"
                      onClick={() => handleSelectKabupaten(null)}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      title="Hapus filter kabupaten"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{activeKabupatenFilter}</span>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {activeJenjangFilter !== "semua" && (
                    <button
                      type="button"
                      onClick={() => setActiveJenjangFilter("semua")}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      title="Hapus filter jenjang"
                    >
                      <span>Jenjang: {activeJenjangFilter}</span>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {activeAkreditasiFilter && (
                    <button
                      type="button"
                      onClick={() => setActiveAkreditasiFilter(null)}
                      className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      title="Hapus filter akreditasi"
                    >
                      <Award className="w-2.5 h-2.5 text-amber-600" />
                      <span>Akreditasi {activeAkreditasiFilter === "LAIN" ? "Lainnya" : activeAkreditasiFilter}</span>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Daftar Sekolah — flex-1 + overflow-y-auto = scroll dalam panel */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 scrollbar-hide min-h-0">

              {filteredSchools.length === 0 && !loading && (
                <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/70 backdrop-blur-sm rounded-2xl border border-white/80 shadow-2xs">
                  Tidak ada sekolah cocok
                </div>
              )}

              {filteredSchools.map((school: any, idx: number) => {
                const jenjang = school.grade ?? school.bentuk_pendidikan ?? "";
                const color = getJenjangColor(jenjang);
                const isActive = selectedSchoolForMap?.id === school.id || selectedSchoolForMap?.npsn === school.npsn;
                const hasCoordinates = Boolean(school.latitude && school.longitude);
                const cleanKec = cleanKecamatanName(school.kecamatan ?? "");
                const key = school.npsn ? `${school.npsn}-${idx}` : `s-${idx}`;

                return (
                  <div
                    key={key}
                    onClick={() => {
                      if (hasCoordinates) {
                        setSelectedSchoolForMap(school);
                        if (window.innerWidth < 1024) {
                          setMobileTab("map");
                        }
                      }
                    }}
                    className={`bg-white rounded-2xl p-3.5 border shadow-2xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 shrink-0 ${isActive
                        ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20"
                        : "border-slate-100 hover:border-blue-200"
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
                          {school.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                          <span
                            className="font-bold px-1.5 py-0.2 rounded text-[9px]"
                            style={{ background: `${color}15`, color: color }}
                          >
                            {jenjang}
                          </span>
                          <span>•</span>
                          <span>{school.status ?? "—"}</span>
                          <span>•</span>
                          <span className="truncate">Kec. {cleanKec || "—"}</span>
                        </div>
                        {school.kabupaten && (
                          <div className="flex items-center gap-1 mt-1 text-[9.5px] font-semibold text-slate-500">
                            <MapPin className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                            <span className="truncate">{school.kabupaten}</span>
                          </div>
                        )}
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

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasCoordinates) {
                            setSelectedSchoolForMap(school);
                            if (window.innerWidth < 1024) {
                              setMobileTab("map");
                            }
                          }
                        }}
                        disabled={!hasCoordinates}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${hasCoordinates
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
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200/80 transition-all text-center cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Detail</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sleek Minimal GIS Footer Pill (Non-intrusive) */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-2xs text-[10px] text-slate-500 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>&copy; 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah</span>
        </div>

      </main>
    </div>
  );
};
