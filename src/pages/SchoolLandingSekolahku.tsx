import { useState, useEffect, Fragment } from "react";
import { useParams, Navigate, useNavigate, useLocation } from "react-router-dom";
import { CABANG_DATA } from "@/types";
import { School as SchoolIcon, Search, ChevronLeft, MapPin, Eye, Plus, Minus, Target, X } from "lucide-react";
import { PortalService } from "@/services/portalService";
import { PemetaanService } from "@/services/pemetaanService";
import { ProyeksiCard } from "@/components/Sections/ProyeksiCardSection";
import { GeneralDataSection } from "@/components/Sections/GeneralDataSection";
import { SulawesiMap } from "@/components/Fragments/SulawesiMap";
import { SchoolDetailSidebar } from "@/components/Fragments/SchoolDetailSidebar";

import { CategoryProjectionSidebar } from "@/components/Fragments/CategoryProjectionSidebar";
import { JatuhTempoSidebar } from "@/components/Fragments/JatuhTempoSidebar";
import { SchoolReportSidebar } from "@/components/Fragments/SchoolReportSidebar";

import { Skeleton } from "@/components/Elements/Skeleton/Skeleton";

import { MapContainer, TileLayer, Marker, Polygon, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";



const getCabdisNumberFromName = (name: string): number => {
  const nameUpper = name?.toUpperCase() || "";
  if (nameUpper.includes("WILAYAH I") || nameUpper.includes("WILAYAH 1")) return 1;
  if (nameUpper.includes("WILAYAH II") || nameUpper.includes("WILAYAH 2")) return 2;
  if (nameUpper.includes("WILAYAH III") || nameUpper.includes("WILAYAH 3")) return 3;
  if (nameUpper.includes("WILAYAH IV") || nameUpper.includes("WILAYAH 4")) return 4;
  if (nameUpper.includes("WILAYAH V") || nameUpper.includes("WILAYAH 5")) return 5;
  if (nameUpper.includes("WILAYAH VI") || nameUpper.includes("WILAYAH 6")) return 6;

  // Try direct digit extraction
  const match = nameUpper.match(/\d+/);
  if (match) return parseInt(match[0], 10);

  return 1; // default fallback
};

// Helper component to capture Leaflet map instance
const MapInstanceCapture = ({ setMap }: { setMap: (map: L.Map | null) => void }) => {
  const map = useMap();
  useEffect(() => {
    setMap(map);
    return () => setMap(null);
  }, [map, setMap]);
  return null;
};


export const SchoolLandingSekolahku = ({ slug: propSlug }: { slug?: string }) => {
  const { slug: paramSlug, id: paramId } = useParams();
  const schoolId = paramId;
  const slug = propSlug || paramSlug;
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const isSchoolMode = !!schoolId;

  // State Management
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [portalData, setPortalData] = useState<any>(null);
  const [selectedSchoolForMap, setSelectedSchoolForMap] = useState<any>(null);

  // Single School Specific States
  const [activeSchool, setActiveSchool] = useState<any>(null);
  const [activeSchoolCabdisId, setActiveSchoolCabdisId] = useState<number | null>(null);
  const [derivedCabdisSlug, setDerivedCabdisSlug] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(isSchoolMode);
  const [schoolDetail, setSchoolDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(isSchoolMode);

  // School Detail Sidebar states
  const [selectedSchoolForDetail, setSelectedSchoolForDetail] = useState<any>(null);
  const [isSchoolDetailOpen, setIsSchoolDetailOpen] = useState(false);

  // Gedung & Ruangan Sidebar states
  const [activeGedung, setActiveGedung] = useState<any>(null);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [isRoomSidebarOpen, setIsRoomSidebarOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isCctvModalOpen, setIsCctvModalOpen] = useState(false);

  // Projections filter states
  const [localMonth, setLocalMonth] = useState(new Date().toISOString().slice(0, 7));
  const [localRange, setLocalRange] = useState<"monthly" | "yearly">("monthly");

  // Sidebar states
  const [activeCategoryDetail, setActiveCategoryDetail] = useState<string | null>(null);
  const [activeJatuhTempoDetail, setActiveJatuhTempoDetail] = useState<string | null>(null);
  const [isSchoolReportsOpen, setIsSchoolReportsOpen] = useState(false);

  const getPhotos = () => {
    if (!activeGedung?.dokumentasi) {
      return [];
    }

    let list: any[] = [];
    if (Array.isArray(activeGedung.dokumentasi)) {
      list = activeGedung.dokumentasi;
    } else if (typeof activeGedung.dokumentasi === 'string') {
      try {
        const parsed = JSON.parse(activeGedung.dokumentasi);
        if (Array.isArray(parsed)) {
          list = parsed;
        } else {
          list = [activeGedung.dokumentasi];
        }
      } catch {
        list = [activeGedung.dokumentasi];
      }
    }

    const urls = list.map((item: any) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item.foto_url || item.url || item.path || item.file_path || item.foto || "";
      }
      return "";
    }).filter((url: string) => url !== "");

    return urls;
  };

  // =========================================================================
  // KUSTOMISASI KOORDINAT CENTER & ZOOM PER ID CABDIS (MANUAL ID MAPPING)
  // -------------------------------------------------------------------------
  const CUSTOM_REGIONAL_CONFIGS: Record<number, { center: [number, number] | null; zoom: number | null }> = {
    1: { center: [-1.44849, 119.909619], zoom: 10 }, // Wilayah 1 (Kota Palu, Sigi)
    2: { center: [-2.14849, 120.309619], zoom: 8 }, // Wilayah 2 (Parigi Moutong, Donggala)
    3: { center: [-3.04849, 121.209619], zoom: 8 }, // Wilayah 3 (Poso, Ampana)
    4: { center: [-4.252631, 121.758189], zoom: 8.4 }, // Wilayah 4 (Morowali, Morowali Utara)
    5: { center: [-1.046066, 122.844154], zoom: null }, // Wilayah 5 (Banggai area)
    6: { center: [-0.029523, 121.074295], zoom: 9 }, // Wilayah 6 (Tolitoli, Buol)
  };

  // 1. Fetch school map data & school details if in school mode
  useEffect(() => {
    if (schoolId) {
      setMapLoading(true);
      setDetailLoading(true);

      // Fetch map data
      PemetaanService.getSchoolMapData(schoolId)
        .then((res) => {
          if (res?.data) {
            const found = res.data.schools?.find((s: any) => s.id === schoolId || s.npsn === schoolId);
            if (found) {
              setActiveSchool(found);
            }
            if (res.data.cabdis) {
              const cabdisId = res.data.cabdis.id ?? 1;
              setActiveSchoolCabdisId(cabdisId);
              setDerivedCabdisSlug(`cabdis-${cabdisId}`);
            }
          }
        })
        .catch((err) => console.error("Failed to fetch school map data", err))
        .finally(() => setMapLoading(false));

      // Fetch detail sekolah dari backend pemetaan
      PemetaanService.getSchoolDetail(schoolId)
        .then((res) => {
          if (res?.data) {
            setSchoolDetail(res.data);
          }
        })
        .catch((err) => console.error("Failed to fetch school details", err))
        .finally(() => setDetailLoading(false));
    }
  }, [schoolId]);

  // Resolving slug & details
  const activeSlug = isSchoolMode ? derivedCabdisSlug : slug;
  const numericId = isSchoolMode ? activeSchoolCabdisId : (slug ? parseInt(slug.replace("cabdis-", ""), 10) : null);
  const cabangConfig = numericId ? CABANG_DATA.find((c) => c.id === numericId) : undefined;
  const regionName = queryParams.get("name") || (isSchoolMode ? activeSchool?.name : cabangConfig?.name) || `Wilayah ${numericId || ""}`;

  // Resolusi nilai kustom center dan zoom berdasarkan ID Cabdis aktif / lokasi sekolah
  const CUSTOM_MAP_CENTER = (numericId && CUSTOM_REGIONAL_CONFIGS[numericId]?.center) || null;
  const CUSTOM_MAP_ZOOM = (numericId && CUSTOM_REGIONAL_CONFIGS[numericId]?.zoom) || null;

  const schoolCenter: [number, number] | null = activeSchool?.latitude && activeSchool?.longitude
    ? [parseFloat(activeSchool.latitude), parseFloat(activeSchool.longitude)]
    : null;

  const MAP_CENTER = isSchoolMode ? schoolCenter : CUSTOM_MAP_CENTER;
  const MAP_ZOOM = isSchoolMode ? 14 : CUSTOM_MAP_ZOOM;

  // Calculate center from schoolDetail polygon if available
  let calculatedCenter: [number, number] | null = null;
  if (schoolDetail?.polygon && Array.isArray(schoolDetail.polygon) && schoolDetail.polygon.length > 0) {
    let latSum = 0;
    let lngSum = 0;
    schoolDetail.polygon.forEach((coord: any) => {
      const lat = parseFloat(coord[0]);
      const lng = parseFloat(coord[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        latSum += lat;
        lngSum += lng;
      }
    });
    calculatedCenter = [latSum / schoolDetail.polygon.length, lngSum / schoolDetail.polygon.length];
  }

  const centerLat = (calculatedCenter ? calculatedCenter[0] : (activeSchool?.latitude ? parseFloat(activeSchool.latitude) : -0.8917)) - 0.0001;
  const centerLng = calculatedCenter ? calculatedCenter[1] : (activeSchool?.longitude ? parseFloat(activeSchool.longitude) : 119.8707);


  const buildingCenterMarkerIcon = L.divIcon({
    html: `<div style="background-color: #2563eb; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(37, 99, 235, 0.6); display: flex; align-items: center; justify-content: center;"><div style="width: 4px; height: 4px; background: white; border-radius: 50%;"></div></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  // Single School Deterministic Data & Summary Mapping
  const schoolName = queryParams.get("name") || activeSchool?.name || schoolDetail?.name || `Sekolah Menengah (ID: ${schoolId})`;
  const schoolD = schoolDetail?.stats || null;

  const schoolSummary = schoolD ? {
    total_sekolah: 1,
    total_rombel: schoolD.rombelCount,
    total_siswa: schoolD.studentCount,
    total_guru: schoolD.totalTeachers,
    total_tendik: schoolD.totalTendik || schoolD.nonPnsCount,
    total_pegawai: 0,
  } : null;


  // 2. Fetch detailed region data when slug or derived slug changes
  useEffect(() => {
    if (activeSlug) {
      // By default, fetch lightweight summary stats without huge employee details list
      fetchDetail(activeSlug, false);
    }
  }, [activeSlug, localMonth, localRange]);

  // 3. Fetch overall landing page context on mount
  useEffect(() => {
    fetchLandingData();
  }, []);

  const fetchDetail = async (cabdisSlug: string, includeDetails = false) => {
    setLoading(true);
    try {
      const res = await PortalService.getRegionDetail({
        slug: cabdisSlug,
        month: localMonth,
        range: localRange,
        include_details: includeDetails ? "1" : "0",
        school_id: isSchoolMode ? schoolId : undefined,
      });
      setData(res);
    } catch (error) {
      console.error("Failed to fetch region detail", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch details on demand only when a sidebar is opened and details aren't in memory
  const hasDetails = !!(data?.projections?.proyeksi?.data_category || data?.projections?.jatuh_tempo?.detail);
  const shouldFetchDetails = !!activeCategoryDetail || !!activeJatuhTempoDetail;

  useEffect(() => {
    if (activeSlug && shouldFetchDetails && !hasDetails && !loading) {
      fetchDetail(activeSlug, true);
    }
  }, [activeSlug, shouldFetchDetails, hasDetails]);

  const fetchLandingData = async () => {
    try {
      const res = await PortalService.getLandingData();
      setPortalData(res?.data || {});
    } catch (error) {
      console.error("Failed to fetch landing data", error);
      setPortalData({});
    }
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

  // Redirect to home jika ID tidak dikenal atau gagal terurai
  if (!isSchoolMode && (!numericId || !cabangConfig)) {
    return <Navigate to="/" replace />;
  }

  // Jika dalam mode sekolah tapi datanya gagal dimuat setelah loading selesai
  if (isSchoolMode && !mapLoading && !activeSchool) {
    return <Navigate to="/" replace />;
  }

  const isPageLoading = isSchoolMode ? (mapLoading || detailLoading || !data || !activeSchool || !schoolDetail) : (loading && !data);

  if (isPageLoading) {
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

      <SchoolReportSidebar
        isOpen={isSchoolReportsOpen}
        onClose={() => setIsSchoolReportsOpen(false)}
        currentMonth={localMonth}
        cabdisSlug={derivedCabdisSlug || slug}
      />

      <SchoolDetailSidebar
        isOpen={isSchoolDetailOpen}
        onClose={() => setIsSchoolDetailOpen(false)}
        school={selectedSchoolForDetail}
      />

      <GedungRoomDetailSidebar
        isOpen={isRoomSidebarOpen}
        onClose={() => setIsRoomSidebarOpen(false)}
        activeGedung={activeGedung}
        setActiveGedung={setActiveGedung}
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        schoolDetail={schoolDetail}
        centerLat={centerLat}
        centerLng={centerLng}
      />

      {/* Main content fix: z-10 for absolute overlays */}
      <main className="w-full bg-transparent min-h-screen relative z-10 overflow-x-hidden flex flex-col items-center justify-start">

        {/* Floating Glassmorphic Header Bar */}
        <div className="glass absolute top-6 left-10 right-10 z-50 rounded-full px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between pointer-events-auto">
          {/* Left side: Back Button + Sulawesi Tengah Logo + School Name */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 md:w-10 md:h-10 bg-indigo-950 hover:bg-indigo-900 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-sm shrink-0"
              title="Kembali"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <h1 className="font-bold text-slate-800 uppercase truncate">
              {isSchoolMode ? schoolName : regionName}
            </h1>
          </div>

          {/* Center: Portal Logo */}
          <div className="flex items-center justify-center shrink-0 mx-2">
            <img src="/logo.png" className="h-11 object-contain" alt="Portal Logo" />
          </div>


          {/* Right side: Map Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
            {/* Zoom In */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                mapInstance?.zoomIn();
              }}
              className="w-8 h-8 md:w-9 md:h-9 bg-indigo-950 hover:bg-indigo-900 text-white rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title="Perbesar Peta"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                mapInstance?.zoomOut();
              }}
              className="w-8 h-8 md:w-9 md:h-9 bg-indigo-950 hover:bg-indigo-900 text-white rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title="Perkecil Peta"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Center / Focus */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (mapInstance) {
                  mapInstance.setView([centerLat, centerLng], 20, { animate: true });
                }
              }}
              className="w-8 h-8 md:w-9 md:h-9 bg-indigo-950 hover:bg-indigo-900 text-white rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title="Fokus ke Sekolah"
            >
              <Target className="w-4 h-4 text-blue-300 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Map Background (BASE) - BEHIND EVERYTHING & SCROLLS UP */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="w-full h-full scale-[1.1] flex items-center justify-center">
            {!isSchoolMode && (
              <SulawesiMap
                layer="base"
                onlyShowId={numericId}
                customCenter={MAP_CENTER}
                customZoom={MAP_ZOOM}
              />
            )}
          </div>
        </div>

        {/* Map Background (INTERACTIVE) - BEHIND THE OVERLAYS & SCROLLS UP */}
        <div className="absolute inset-0 z-5 overflow-hidden">
          <div className="w-full h-full scale-[1.1] flex items-center justify-center">
            {isSchoolMode ? (
              <MapContainer
                key={`school-interactive-map-${centerLat}-${centerLng}`}
                center={[centerLat, centerLng]}
                zoom={20}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={true}
                className="school-leaflet-tiles w-full h-full"
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  maxZoom={20}
                  maxNativeZoom={20}
                />
                <MapInstanceCapture setMap={setMapInstance} />
                {schoolDetail?.polygon && Array.isArray(schoolDetail.polygon) && schoolDetail.polygon.length > 0 && (
                  <Polygon
                    positions={schoolDetail.polygon}
                    pathOptions={{
                      color: "#93c5fd",
                      weight: 2,
                      fillColor: "#eff6ff",
                      fillOpacity: 1.0,
                    }}
                  />
                )}

                {schoolDetail?.gedung_detail?.map((g: any, index: number) => {
                  if (!g.polygon || !Array.isArray(g.polygon) || g.polygon.length === 0) return null;
                  const isActive = g.id === activeGedung?.id;

                  // Calculate center coordinates for marker placement
                  let latSum = 0;
                  let lngSum = 0;
                  g.polygon.forEach((coord: any) => {
                    latSum += parseFloat(coord[0]);
                    lngSum += parseFloat(coord[1]);
                  });
                  const centerCoord: [number, number] = [latSum / g.polygon.length, lngSum / g.polygon.length];

                  return (
                    <Fragment key={`building-group-${g.id || index}`}>
                      <Polygon
                        positions={g.polygon}
                        pathOptions={{
                          color: "#2563eb",
                          weight: 1.5,
                          dashArray: isActive ? undefined : "4, 4",
                          fillColor: isActive ? "#2563eb" : "#dbeafe",
                          fillOpacity: 1.0,
                        }}
                        eventHandlers={{
                          click: (e) => {
                            L.DomEvent.stopPropagation(e);
                            setActiveGedung(g);
                            setActiveRoom(g.ruangan && g.ruangan.length > 0 ? g.ruangan[0] : null);
                          }
                        }}
                      >
                        <Tooltip
                          permanent={true}
                          direction="bottom"
                          offset={[0, 10]}
                          className={`building-tooltip ${isActive ? "active-building-tooltip" : ""}`}
                        >
                          {g.name}
                        </Tooltip>
                      </Polygon>
                      <Marker
                        position={centerCoord}
                        icon={buildingCenterMarkerIcon}
                        eventHandlers={{
                          click: (e) => {
                            L.DomEvent.stopPropagation(e);
                            setActiveGedung(g);
                            setActiveRoom(g.ruangan && g.ruangan.length > 0 ? g.ruangan[0] : null);
                          }
                        }}
                      />
                    </Fragment>
                  );
                })}
              </MapContainer>
            ) : (
              <SulawesiMap
                layer="interactive"
                onlyShowId={numericId}
                markers={isSchoolMode ? [] : (portalData?.summary?.mapMarkers || [])}
                schools={isSchoolMode ? (activeSchool ? [activeSchool] : []) : (data?.schools || [])}
                customCenter={MAP_CENTER}
                customZoom={MAP_ZOOM}
                onSchoolClick={(school) => {
                  if (isSchoolMode) {
                    setSelectedSchoolForDetail(school);
                    setIsSchoolDetailOpen(true);
                  } else {
                    setSchoolSearch(school.name);
                    setSelectedSchoolForMap(school);
                  }
                }}
                selectedSchool={isSchoolMode ? activeSchool : selectedSchoolForMap}
                onPopupClose={() => {
                  if (!isSchoolMode) {
                    setSchoolSearch("");
                    setSelectedSchoolForMap(null);
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Main Content Layout Container */}
        <div className="relative z-10 w-full flex flex-col min-h-screen pt-28 pb-10 px-10 gap-10 pointer-events-none">

          {/* Grid Area */}
          <div className="w-full flex flex-col lg:flex-row gap-8 items-stretch flex-1">

            {/* Left side: Projections and Summary Counters */}
            <div className="flex-[3] flex flex-col gap-6 pointer-events-none">
              <div className="w-full lg:w-1/3 pointer-events-auto">
                <ProyeksiCard
                  isLoading={loading}
                />
              </div>
            </div>

            {/* Right side: School List / School Information Card */}
            <div className="flex-[1] relative min-h-[400px] lg:min-h-0 pointer-events-none">
              <div className="lg:absolute lg:inset-0 flex flex-col gap-4 pointer-events-auto">
                {isSchoolMode ? (
                  /* --- MODE SEKOLAH: INFORMASI UMUM SEKOLAH --- */
                  <div className="w-full flex-1 overflow-y-auto pr-1 scrollbar-hide flex flex-col gap-6">
                    <div className="glass rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-slate-100">

                      {/* Nested Building/Room Detail Card (if clicked) */}
                      {activeGedung && (
                        <div className="glass rounded-3xl p-5 md:p-6 flex flex-col gap-4 relative">
                          {/* Close Button */}
                          <button
                            onClick={() => {
                              setActiveGedung(null);
                              setActiveRoom(null);
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-200/40 p-1.5 rounded-full cursor-pointer transition-colors"
                            title="Tutup Detail"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          {/* Building/Room Title & Description */}
                          <div className="flex flex-col gap-1 pr-6">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-snug">
                              {activeRoom?.name || activeGedung?.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                              {activeRoom?.deskripsi || activeGedung?.deskripsi || "digunakan untuk kegiatan belajar mengajar dan penunjang sekolah."}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2.5">
                            {/* Lihat Foto Button */}
                            <button
                              onClick={() => {
                                setIsPhotoModalOpen(true);
                                setActivePhotoIndex(0);
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-3.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02]"
                            >
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                              <span>Lihat Foto</span>
                            </button>

                            {/* Live CCTV Button */}
                            <button
                              onClick={() => setIsCctvModalOpen(true)}
                              className="flex-1 bg-[#eff6ff] hover:bg-[#dbeafe] text-blue-700 border border-blue-100 rounded-xl py-2.5 px-3.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                            >
                              <svg className="w-4 h-4 text-red-500 animate-pulse shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="2"></circle>
                                <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
                              </svg>
                              <span className="font-extrabold">Live CCTV</span>
                            </button>
                          </div>

                          {/* Detail Informasi */}
                          <div className="flex flex-col gap-2.5 mt-2 border-t border-slate-200/60 pt-4">
                            <h4 className="text-sm font-bold text-slate-800">Detail Informasi</h4>
                            <div className="flex flex-col gap-1">
                              {activeGedung?.ruangan?.map((r: any) => (
                                <div key={r.id} className="flex justify-between items-center py-2 border-b border-slate-100 text-xs font-bold">
                                  <span className="text-slate-400 font-semibold">
                                    <div>Kondisi Infrastruktur</div>
                                    <div>
                                      {r.name}</div>
                                  </span>
                                  <span className="text-slate-800 font-extrabold">{r.status_kelayakan || "Layak"}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center py-2 text-xs font-bold">
                                <span className="text-slate-400 font-semibold">Tahun Pembangunan</span>
                                <span className="text-slate-800 font-extrabold">{activeGedung?.tahun_pembangunan || "-"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Informasi Sekolah Section */}
                      <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-slate-800">Informasi Sekolah</h3>
                        <div className="flex flex-col gap-1 text-xs font-bold text-slate-800">
                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                            <span className="text-slate-400 font-semibold">Nama Sekolah</span>
                            <span className="text-slate-800 font-extrabold text-right ml-4">{schoolName}</span>
                          </div>

                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                            <span className="text-slate-400 font-semibold">Akreditasi</span>
                            <span className="text-slate-800 font-extrabold">{schoolD?.accreditation || "A"}</span>
                          </div>

                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                            <span className="text-slate-400 font-semibold">NPSN</span>
                            <span className="text-slate-800 font-extrabold font-mono">{schoolDetail?.npsn || "-"}</span>
                          </div>

                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                            <span className="text-slate-400 font-semibold">Status Sekolah</span>
                            <span className="text-slate-800 font-extrabold capitalize">
                              Sekolah {(schoolDetail?.status || "Negeri").toLowerCase()}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                            <span className="text-slate-400 font-semibold">Telpon</span>
                            <span className="text-slate-800 font-extrabold">{schoolD?.principalPhone || "-"}</span>
                          </div>

                          <div className="flex justify-between items-center py-2.5">
                            <span className="text-slate-400 font-semibold">Email</span>
                            <span className="text-slate-800 font-extrabold truncate max-w-[200px]">{schoolD?.email || "-"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Social Media Buttons */}
                      <div className="flex items-center justify-center gap-3 mt-2">
                        {/* Instagram */}
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                          </svg>
                        </a>
                        {/* YouTube */}
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                          </svg>
                        </a>
                        {/* Facebook */}
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                          </svg>
                        </a>
                        {/* TikTok */}
                        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                          </svg>
                        </a>
                      </div>

                    </div>
                  </div>
                ) : (
                  /* --- MODE REGIONAL (LAMA): DAFTAR SEKOLAH --- */
                  <>
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
                          const isActive = school.id === schoolId;
                          return (
                            <div
                              key={school.id}
                              className={`glass-card rounded-[1.8rem] p-5 flex flex-col gap-4 border shadow-lg hover:scale-[1.02] transition-transform duration-300 ${isActive
                                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10"
                                : "border-white/60 hover:border-blue-400/80"
                                }`}
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
                                    if (isActive) return;
                                    navigate(`/sekolah2/${school.id}?name=${encodeURIComponent(school.name)}`);
                                  }}
                                  className={`${isActive
                                    ? "bg-blue-600 text-white"
                                    : "bg-blue-50/80 hover:bg-blue-100 text-blue-600"
                                    } text-[10px] font-black uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-blue-100/35`}
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{isActive ? "Sekolah Aktif" : "Cari Koordinat"}</span>
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
                  </>
                )}

              </div>
            </div>

          </div>

          {/* Bottom Area */}
          <div className="w-full flex flex-col lg:flex-row justify-between items-start mt-10 gap-6 pointer-events-none">

            {/* Data Umum Satuan Pendidikan */}
            <div className="flex-1 w-full pointer-events-auto">
              <GeneralDataSection data={schoolSummary || data?.summary} />
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

      {isSchoolMode && (
        <style>{`
          .school-leaflet-tiles .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(8px) !important;
            border: 1px solid rgba(255, 255, 255, 0.6) !important;
            border-radius: 16px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
          }
          .school-leaflet-tiles .leaflet-popup-tip {
            background: rgba(255, 255, 255, 0.9) !important;
          }
          .building-tooltip {
            background: white !important;
            border: 1px solid rgba(59, 130, 246, 0.4) !important;
            border-radius: 6px !important;
            padding: 4px 8px !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            color: #1e293b !important;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15) !important;
          }
          .building-tooltip.active-building-tooltip {
            background: #2563eb !important;
            border: 1px solid #1d4ed8 !important;
            color: white !important;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3) !important;
          }
          .building-tooltip::before {
            display: none !important;
          }
        `}</style>
      )}

      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Modal Card */}
          <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full border border-slate-100 shadow-2xl relative flex flex-col gap-6 animate-fadeIn pointer-events-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Detail Foto</h3>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {getPhotos().length === 0 ? (
              <div className="flex flex-col items-center justify-center aspect-[16/9] w-full rounded-[2rem] bg-slate-50 border border-dashed border-slate-200 p-8 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-base font-extrabold text-slate-700">Tidak Ada Data Foto</h4>
                  <p className="text-xs text-slate-400 font-semibold max-w-sm">Dokumentasi foto untuk gedung ini belum diunggah atau tidak tersedia di database.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Main Photo */}
                <div className="relative aspect-[16/9] w-full rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={getPhotos()[activePhotoIndex]}
                    alt={`Detail Foto ${activePhotoIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                </div>

                {/* Thumbnails */}
                <div className="flex justify-center items-center gap-6 py-2">
                  {getPhotos().map((photo, index) => {
                    const isActive = index === activePhotoIndex;
                    return (
                      <button
                        key={index}
                        onClick={() => setActivePhotoIndex(index)}
                        className="flex flex-col items-center gap-2 group focus:outline-none cursor-pointer"
                      >
                        <div className={`w-28 h-16 rounded-2xl overflow-hidden transition-all duration-300 ${isActive
                          ? "border-2 border-blue-500 scale-105 shadow-md"
                          : "grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                          }`}>
                          <img
                            src={photo}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className={`text-xs font-black tracking-wide ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                          Foto {index + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isCctvModalOpen && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-slate-100 shadow-2xl relative flex flex-col gap-6 animate-fadeIn pointer-events-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Live CCTV</h3>
              <button
                onClick={() => setIsCctvModalOpen(false)}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 animate-pulse">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-base font-extrabold text-slate-800">CCTV Belum Terpasang</h4>
                <p className="text-xs text-slate-500 font-semibold max-w-xs">Perangkat kamera pemantau (CCTV) belum terpasang atau belum dikonfigurasikan di lokasi ini.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface GedungRoomDetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeGedung: any;
  setActiveGedung: (gedung: any) => void;
  activeRoom: any;
  setActiveRoom: (room: any) => void;
  schoolDetail: any;
  centerLat: number;
  centerLng: number;
}

const GedungRoomDetailSidebar: React.FC<GedungRoomDetailSidebarProps> = ({
  isOpen,
  onClose,
  activeGedung,
  setActiveGedung,
  activeRoom,
  setActiveRoom,
  schoolDetail,
  centerLat,
  centerLng,
}) => {
  if (!isOpen || !activeGedung) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[190] cursor-pointer pointer-events-auto"
        onClick={onClose}
      />

      {/* Sidebar container */}
      <div
        className={`fixed inset-y-0 right-0 w-[90%] bg-[#F8FCFF]/98 backdrop-blur-md shadow-2xl z-[200] transform transition-transform duration-500 ease-in-out border-l border-slate-100 flex flex-col pointer-events-auto ${isOpen ? "translate-x-0" : "translate-x-[110%]"
          }`}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[2rem] flex items-center justify-center text-white shadow-xl bg-blue-600 shadow-blue-200">
              <SchoolIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-tight uppercase">
                Detail Ruangan & Gedung: {activeRoom?.name}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                Gedung: {activeGedung?.name} • Kelayakan Ruangan: {activeRoom?.status_kelayakan || "Layak"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-[2rem] border border-slate-100 shadow-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Grid Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 animate-fadeIn">
          {/* Grid Kiri: Peta Denah Sekolah */}
          <div className="flex-1 h-[40vh] lg:h-full relative border-r border-slate-100 bg-slate-100">
            <MapContainer
              key={`sidebar-map-${centerLat}-${centerLng}`}
              center={[centerLat, centerLng]}
              zoom={20}
              zoomControl={true}
              scrollWheelZoom={false}
              dragging={true}
              className="w-full h-full"
              style={{ width: "100%", height: "100%" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                maxZoom={20}
                maxNativeZoom={20}
              />
              {schoolDetail?.polygon && Array.isArray(schoolDetail.polygon) && schoolDetail.polygon.length > 0 && (
                <Polygon
                  positions={schoolDetail.polygon}
                  pathOptions={{
                    color: "#2563eb",
                    weight: 2,
                    fillColor: "#bfdbfe",
                    fillOpacity: 1.0,
                  }}
                />
              )}
              {schoolDetail?.gedung_detail?.map((g: any, index: number) => {
                if (!g.polygon || !Array.isArray(g.polygon) || g.polygon.length === 0) return null;
                const isActive = g.id === activeGedung?.id;
                return (
                  <Polygon
                    key={`sidebar-building-${g.id || index}`}
                    positions={g.polygon}
                    pathOptions={{
                      color: isActive ? "#1e40af" : "#3b82f6",
                      weight: isActive ? 3 : 1.5,
                      fillColor: isActive ? "#2563eb" : "#ffffff",
                      fillOpacity: isActive ? 0.85 : 0.9,
                    }}
                    eventHandlers={{
                      click: (e) => {
                        L.DomEvent.stopPropagation(e);
                        setActiveGedung(g);
                        setActiveRoom(g.ruangan && g.ruangan.length > 0 ? g.ruangan[0] : null);
                      }
                    }}
                  >
                    <Tooltip
                      permanent={true}
                      direction="center"
                      className="building-tooltip"
                    >
                      {g.name}
                    </Tooltip>
                  </Polygon>
                );
              })}
            </MapContainer>
          </div>

          {/* Grid Kanan: Detail & Daftar Ruangan */}
          <div className="flex-1 h-full overflow-y-auto p-8 space-y-6 flex flex-col bg-white">
            {/* Keterangan Gedung */}
            <div className="glass-card rounded-[2rem] p-6 border border-slate-100 bg-[#F8FCFF]/50 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-lg">🏢</span>
                <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Informasi Gedung</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Nama Gedung</span>
                  <span className="text-slate-800 text-sm">{activeGedung?.name || "-"}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Tahun Pembangunan</span>
                  <span className="text-slate-800 text-sm">{activeGedung?.tahun_pembangunan || "-"}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Status Kelayakan</span>
                  <span className={`text-sm uppercase tracking-wide ${activeGedung?.status_kelayakan === 'Layak' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {activeGedung?.status_kelayakan || "Layak"}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Total Ruangan</span>
                  <span className="text-slate-800 text-sm">{activeGedung?.total_ruangan || 0} Ruangan</span>
                </div>
              </div>
            </div>

            {/* Ruangan Aktif Detail */}
            <div className="glass-card rounded-[2rem] p-6 border border-slate-100 bg-[#F8FCFF]/50 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-lg">🔑</span>
                <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Detail Ruangan</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 col-span-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Nama Ruangan</span>
                  <span className="text-slate-800 text-sm">{activeRoom?.name || "-"}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Fungsi / Deskripsi</span>
                  <span className="text-slate-700 text-xs font-semibold leading-relaxed block mt-0.5">{activeRoom?.deskripsi || "Digunakan untuk kegiatan belajar mengajar."}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Kelayakan Ruangan</span>
                  <span className={`text-xs uppercase tracking-wider font-black ${activeRoom?.status_kelayakan === 'Layak' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {activeRoom?.status_kelayakan || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Daftar Semua Ruangan di Gedung Ini */}
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                <span className="text-lg">📋</span>
                <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Daftar Ruangan di Gedung</h4>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[220px] pr-2 space-y-2 scrollbar-thin">
                {activeGedung?.ruangan?.map((r: any) => {
                  const isSelected = r.id === activeRoom?.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActiveRoom(r)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs transition-all cursor-pointer text-left ${isSelected
                        ? "bg-blue-600 text-white border-blue-700 font-bold shadow-lg"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-100 hover:border-slate-200"
                        }`}
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={isSelected ? "text-white font-bold" : "text-slate-800 font-bold"}>{r.name}</span>
                        <span className={`text-[9px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                          Fungsi: {r.deskripsi || "Kelas"}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isSelected
                        ? "bg-white/20 text-white"
                        : (r.status_kelayakan === 'Layak' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')
                        }`}>
                        {r.status_kelayakan}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
