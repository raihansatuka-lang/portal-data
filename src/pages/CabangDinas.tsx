import { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate, useLocation } from "react-router-dom";
import { CABANG_DATA } from "@/types";
import type { CabangDinasItem } from "@/types";
import { School as SchoolIcon, Search, ChevronLeft, MapPin, Eye } from "lucide-react";
import { PortalService } from "@/services/portalService";
import { PemetaanService } from "@/services/pemetaanService";
import { ProyeksiCard } from "@/components/Sections/ProyeksiCardSection";
import { GeneralDataSection } from "@/components/Sections/GeneralDataSection";
import { ProgressUpdateSection } from "@/components/Sections/ProgressUpdateSection";
import { SulawesiMap } from "@/components/Fragments/SulawesiMap";
import { SchoolDetailSidebar } from "@/components/Fragments/SchoolDetailSidebar";

import { CategoryProjectionSidebar } from "@/components/Fragments/CategoryProjectionSidebar";
import { JatuhTempoSidebar } from "@/components/Fragments/JatuhTempoSidebar";
import { NeracaSidebar } from "@/components/Fragments/NeracaSidebar";
import { SchoolReportSidebar } from "@/components/Fragments/SchoolReportSidebar";
import { BantuanSidebar } from "@/components/Fragments/BantuanSidebar";

import { Skeleton } from "@/components/Elements/Skeleton/Skeleton";

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

  // State untuk data cabang dinas dari API, dengan fallback ke CABANG_DATA statis
  const [cabangApiData, setCabangApiData] = useState<CabangDinasItem | null>(null);
  const cabangFallback = numericId ? CABANG_DATA.find((c) => c.id === numericId) : undefined;

  // Gunakan data API jika tersedia, fallback ke CABANG_DATA statis
  const cabangConfig = cabangApiData
    ? {
        id: cabangApiData.id,
        name: cabangApiData.nama,
        kabKotas: cabangApiData.kabupaten_kota ?? cabangFallback?.kabKotas ?? [],
      }
    : cabangFallback
      ? { id: cabangFallback.id, name: cabangFallback.name, kabKotas: cabangFallback.kabKotas }
      : undefined;

  const regionName = queryParams.get("name") || cabangConfig?.name || `Wilayah ${numericId || ""}`;

  // Koordinat dari API jika tersedia, otherwise fallback ke CUSTOM_REGIONAL_CONFIGS
  const CUSTOM_MAP_CENTER: [number, number] | null =
    (cabangApiData?.map_lat && cabangApiData?.map_lng)
      ? [cabangApiData.map_lat, cabangApiData.map_lng]
      : (numericId && CUSTOM_REGIONAL_CONFIGS[numericId]?.center) || null;

  const CUSTOM_MAP_ZOOM: number | null =
    cabangApiData?.map_zoom
      ?? (numericId && CUSTOM_REGIONAL_CONFIGS[numericId]?.zoom)
      ?? null;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [portalData, setPortalData] = useState<any>(null);
  const [selectedSchoolForMap, setSelectedSchoolForMap] = useState<any>(null);

  // School Detail Sidebar states
  const [selectedSchoolForDetail, setSelectedSchoolForDetail] = useState<any>(null);
  const [isSchoolDetailOpen, setIsSchoolDetailOpen] = useState(false);

  // Projections filter states
  const [localMonth, setLocalMonth] = useState(new Date().toISOString().slice(0, 7));
  const [localRange, setLocalRange] = useState<"monthly" | "yearly">("monthly");

  // Sidebar states
  const [activeCategoryDetail, setActiveCategoryDetail] = useState<string | null>(null);
  const [activeJatuhTempoDetail, setActiveJatuhTempoDetail] = useState<string | null>(null);
  const [isNeracaOpen, setIsNeracaOpen] = useState(false);
  const [isSchoolReportsOpen, setIsSchoolReportsOpen] = useState(false);
  const [isBantuanOpen, setIsBantuanOpen] = useState(false);

  // 1. Fetch detailed data when slug or projection filters change
  useEffect(() => {
    if (slug) {
      // By default, fetch lightweight summary stats without huge employee details list
      fetchDetail(false);
    }
  }, [slug, localMonth, localRange]);

  // 2. Fetch overall landing page context on mount
  useEffect(() => {
    fetchCabangDinas();
  }, []);

  /** Ambil data cabang dinas dari API pemetaan untuk koordinat & nama akurat */
  const fetchCabangDinas = async () => {
    try {
      const res = await PemetaanService.getCabangDinas();
      if (res?.data && numericId) {
        const found = res.data.find((c) => c.id === numericId);
        if (found) setCabangApiData(found);
      }
    } catch (error) {
      // Fallback ke CABANG_DATA statis sudah ditangani di cabangConfig
      console.warn("Gagal fetch cabang dinas dari API, menggunakan data lokal:", error);
    }
  };

  const fetchDetail = async (includeDetails = false) => {
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

  // Fetch details on demand only when a sidebar is opened
  const shouldFetchDetails = !!activeCategoryDetail || !!activeJatuhTempoDetail;
  useEffect(() => {
    if (slug && shouldFetchDetails && !loading) {
      fetchDetail();
    }
  }, [slug, shouldFetchDetails]);

  const fetchLandingData = async () => {
    // CabangDinas tidak butuh landing data global
    setPortalData({});
  };

  const handleProyeksiFilterChange = (range: "monthly" | "yearly", month?: number) => {
    setLocalRange(range);
    if (range === "monthly" && month) {
      const y = localMonth
        ? localMonth.split("-")[0]
        : new Date().getFullYear().toString();
      const mStr = month.toString().padStart(2, "0");
      setLocalMonth(`${y}-${mStr}`);
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
    <div className="relative w-screen h-screen overflow-y-auto text-content font-poppins selection:bg-primary selection:text-white scroll-smooth scrollbar-hide bg-slate-50/20">
      {/* Background Image fix: Gunakan z-0 agar posisinya di layar paling dasar */}
      <img
        src="/images/cmd/bc-cmdcenter-bg.webp"
        alt="Portal Background"
        className="fixed inset-0 object-cover object-center w-full h-full opacity-15 pointer-events-none select-none z-0"
      />

      {/* Sidebars */}
      <CategoryProjectionSidebar
        isOpen={!!activeCategoryDetail}
        onClose={() => setActiveCategoryDetail(null)}
        data={data?.projections?.proyeksi?.data_category?.kurang_dari_90 || {}}
        initialCategory={activeCategoryDetail || "berkala"}
        currentMonth={localMonth}
        onMonthChange={(newMonth) => setLocalMonth(newMonth)}
        isLoading={loading}
      />

      <JatuhTempoSidebar
        isOpen={!!activeJatuhTempoDetail}
        onClose={() => setActiveJatuhTempoDetail(null)}
        data={data?.projections?.jatuh_tempo || {}}
        initialCategory={activeJatuhTempoDetail || "semua"}
        isLoading={loading}
      />

      <NeracaSidebar
        isOpen={isNeracaOpen}
        onClose={() => setIsNeracaOpen(false)}
        initialNeracaData={portalData?.neraca}
        initialNeracaRekapData={portalData?.neracaRekap}
        defaultFilters={{ kabupaten_kota: regionName, cabdis_slug: slug }}
      />

      <BantuanSidebar
        isOpen={isBantuanOpen}
        onClose={() => setIsBantuanOpen(false)}
      />

      <SchoolReportSidebar
        isOpen={isSchoolReportsOpen}
        onClose={() => setIsSchoolReportsOpen(false)}
        currentMonth={localMonth}
        cabdisSlug={slug}
      />

      <SchoolDetailSidebar
        isOpen={isSchoolDetailOpen}
        onClose={() => setIsSchoolDetailOpen(false)}
        school={selectedSchoolForDetail}
      />

      {/* Main content fix: z-10 for absolute overlays */}
      <main className="w-full bg-transparent min-h-screen relative z-10 overflow-x-hidden flex flex-col items-center justify-start">

        {/* Center Logo header */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-start z-10 pointer-events-none">
          <img src="/logo.png" className="w-[50%]" alt="Logo" />
        </div>

        {/* Map Background (BASE) - BEHIND EVERYTHING & SCROLLS UP */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="w-full h-full scale-[1.1] flex items-center justify-center">
            <SulawesiMap
              layer="base"
              onlyShowId={numericId}
              customCenter={CUSTOM_MAP_CENTER}
              customZoom={CUSTOM_MAP_ZOOM}
            />
          </div>
        </div>

        {/* Map Background (INTERACTIVE) - BEHIND THE OVERLAYS & SCROLLS UP */}
        <div className="absolute inset-0 z-5 overflow-hidden">
          <div className="w-full h-full scale-[1.1] flex items-center justify-center">
            <SulawesiMap
              layer="interactive"
              onlyShowId={numericId}
              markers={[]}
              schools={data?.schools || []}
              customCenter={CUSTOM_MAP_CENTER}
              customZoom={CUSTOM_MAP_ZOOM}
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

        {/* Main Content Layout Container */}
        <div className="relative z-10 w-full flex flex-col min-h-screen py-10 px-10 gap-10 pointer-events-none">

          {/* Header Bar */}
          <header className="w-full flex items-center gap-4 pointer-events-auto hidden">
            <button
              onClick={() => navigate("/")}
              className="p-4 bg-white/80 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-[2rem] border border-white shadow-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
                {regionName}
              </h1>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">
                Dinas Pendidikan Provinsi Sulawesi Tengah • Wilayah Kerja: {cabangConfig?.kabKotas.join(", ")}
              </p>
            </div>
          </header>

          {/* Grid Area */}
          <div className="w-full flex flex-col lg:flex-row gap-8 items-stretch flex-1">

            {/* Left side: Projections and Summary Counters */}
            <div className="flex-[3] flex flex-col gap-6 pointer-events-none">
              <div className="w-full lg:w-1/3 pointer-events-auto">
                <ProyeksiCard
                  projections={data?.projections}
                  onFilterChange={handleProyeksiFilterChange}
                  onOpenDetail={(cat) => setActiveCategoryDetail(cat)}
                  onOpenJatuhTempoDetail={(cat) => setActiveJatuhTempoDetail(cat)}
                  isLoading={loading}
                />
              </div>
              <div className="pointer-events-auto">
                <GeneralDataSection data={data?.summary} />
              </div>
            </div>

            {/* Right side: School List Overlay */}
            <div className="flex-[1] relative min-h-[400px] lg:min-h-0 pointer-events-none">
              <div className="lg:absolute lg:inset-0 flex flex-col gap-6 pointer-events-auto">

                {/* School List Title */}
                <div className="flex flex-col gap-1 text-left border-l-3 pl-4 border-[#2563EB] shrink-0 text-slate-800">
                  <div className="font-bold">Sekolah</div>
                  <div className="text-sm font-medium text-slate-400">
                    Daftar Sekolah {regionName}
                  </div>
                </div>

                {/* Search Bar Overlay */}
                <div className="relative group shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Cari sekolah..."
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    className="w-full bg-white/80 border border-white rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all shadow-md"
                  />
                </div>

                {/* Scrollable School Cards */}
                <div className="flex-1 lg:overflow-y-auto lg:pr-2 scrollbar-hide hover:scrollbar-thumb-gray-400 flex flex-col gap-4">
                  {data?.schools
                    ?.filter((s: any) =>
                      s.name?.toLowerCase().includes(schoolSearch.toLowerCase())
                    )
                    .map((school: any) => {
                      const isSwasta = school.name?.toUpperCase().includes("SWASTA");
                      return (
                        <div
                          key={school.id}
                          className="glass-card rounded-[1.8rem] p-5 flex flex-col gap-4 border border-white/60 shadow-lg hover:scale-[1.02] transition-transform duration-300 hover:border-blue-400/80"
                        >
                          {/* Upper Section */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSwasta ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                <SchoolIcon className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-slate-800 leading-snug line-clamp-1">
                                  {school.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  {isSwasta ? "SWASTA" : "NEGERI"}
                                </span>
                              </div>
                            </div>
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSwasta ? "bg-emerald-500" : "bg-blue-500"}`} />
                          </div>

                          {/* Action Buttons Row */}
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              onClick={() => {
                                if (school.latitude && school.longitude) {
                                  setSchoolSearch(school.name);
                                  setSelectedSchoolForMap(school);
                                }
                              }}
                              className="bg-blue-50/80 hover:bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-blue-100/35"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Cari Koordinat</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedSchoolForDetail(school);
                                setIsSchoolDetailOpen(true);
                              }}
                              className="bg-slate-50/80 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-slate-100"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Klik Detail</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {data?.schools?.filter((s: any) =>
                    s.name?.toLowerCase().includes(schoolSearch.toLowerCase())
                  ).length === 0 && (
                      <div className="py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Tidak ada sekolah ditemukan
                      </div>
                    )}
                </div>

              </div>
            </div>

          </div>

          {/* Bottom Area */}
          <div className="w-full flex flex-col lg:flex-row justify-between items-start mt-10 gap-6 pointer-events-none">            {/* Neraca Buttons */}
            <div className="flex gap-4 shrink-0 pointer-events-auto">
              <div
                className="w-64 p-6 rounded-[2.5rem] bg-gradient-to-br from-[#2588EB] via-[#3b82f6] to-[#10B981] text-white flex flex-col gap-4 cursor-pointer hover:scale-105 transition-transform shadow-xl shadow-blue-500/20"
                onClick={() => setIsNeracaOpen(true)}
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-sm">Neraca Pendidikan</div>
                  <p className="text-xs text-white/80 font-medium leading-relaxed">Data Dapodik GTK & Kepegawaian Daerah</p>
                </div>
                <button
                  className="w-full py-3 bg-blue-700/30 rounded-2xl text-xs font-semibold border border-white/10 hover:bg-white/20 transition-colors mt-auto cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNeracaOpen(true);
                  }}
                >
                  Lihat Neraca
                </button>
              </div>

              <div
                className="w-64 p-6 rounded-[2.5rem] bg-gradient-to-b from-[#8B5CF6] to-[#A78BFA] text-white flex flex-col gap-4 cursor-pointer hover:scale-105 transition-transform shadow-xl shadow-violet-500/20"
                onClick={() => setIsBantuanOpen(true)}
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-sm">Customer Center / Bantuan</div>
                  <p className="text-xs text-white/80 font-medium leading-relaxed">Layanan Bantuan & SOP Pulpen</p>
                </div>
                <button
                  className="w-full py-3 bg-violet-700/50 rounded-2xl text-xs font-semibold border border-white/10 hover:bg-violet-50 transition-colors mt-auto cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBantuanOpen(true);
                  }}
                >
                  Lihat Bantuan
                </button>
              </div>
            </div>

            {/* School Progress Reports */}
            <div className="flex-1 w-full pointer-events-auto">
              <ProgressUpdateSection
                summary={data?.school_reports}
                currentMonth={localMonth}
                onClick={() => setIsSchoolReportsOpen(true)}
              />
            </div>

          </div>

          {/* Footer Area */}
          <footer className="py-0 flex flex-col items-center gap-6 opacity-50 mt-10 shrink-0">
            <p className="text-center text-xs">
              &copy; 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah
            </p>
          </footer>

        </div>
      </main>

    </div>
  );
};
