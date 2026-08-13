import React, { useState, useEffect } from "react";
import { X, Map as MapIcon, School, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PortalService } from "@/services/portalService";
import { ProyeksiCard } from "../Sections/ProyeksiCardSection";
import { GeneralDataSection } from "../Sections/GeneralDataSection";
import { ProgressUpdateSection } from "../Sections/ProgressUpdateSection";


// Fix leaflet icon
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});


// Component to handle map bounds
const MapBoundsHandler = ({ geoData }: { geoData: any }) => {
  const map = useMap();
  useEffect(() => {
    if (geoData) {
      const layer = L.geoJSON(geoData);
      map.fitBounds(layer.getBounds(), { padding: [50, 50] });
    }
  }, [geoData, map]);
  return null;
};

interface RegionProjectionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  regionId: string | null;
  regionSlug?: string | null;
  regionName: string;
  currentMonth: string;
  onMonthChange?: (newMonth: string) => void;
}

export const RegionProjectionSidebar: React.FC<
  RegionProjectionSidebarProps
> = ({
  isOpen,
  onClose,
  regionId,
  regionSlug,
  regionName,
  currentMonth,
  onMonthChange,
}) => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [geoData, setGeoData] = useState<any>(null);
    const [localMonth, setLocalMonth] = useState(currentMonth);
    const [localRange, setLocalRange] = useState<"monthly" | "yearly">("monthly");
    const [schoolSearch, setSchoolSearch] = useState("");
    const markerRefs = React.useRef<Record<string, L.Marker>>({});
    console.log(onMonthChange);
    useEffect(() => {
      setLocalMonth(currentMonth);
    }, [currentMonth]);

    useEffect(() => {
      if (isOpen && regionId) {
        fetchDetail();
        fetchGeoData();
      } else if (!isOpen) {
        setData(null);
        setGeoData(null);
      }
    }, [isOpen, regionId, localMonth, localRange]);

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await PortalService.getRegionDetail({
          department_id: regionId!,
          slug: regionSlug || undefined,
          month: localMonth,
          range: localRange,
        });
        setData(res);
      } catch (error) {
        console.error("Failed to fetch region detail", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchGeoData = async () => {
      try {
        const match = regionName.match(/\d+/);
        if (match) {
          const num = match[0];
          const res = await fetch(`/geojson/cabdis/cabdis${num}.geojson`);
          const json = await res.json();
          setGeoData(json);
        }
      } catch (error) {
        console.error("Failed to fetch geojson", error);
      }
    };

    const handleFilterChange = (range: "monthly" | "yearly", month?: number) => {
      setLocalRange(range);
      if (range === "monthly" && month) {
        const y = localMonth
          ? localMonth.split("-")[0]
          : new Date().getFullYear().toString();
        const mStr = month.toString().padStart(2, "0");
        setLocalMonth(`${y}-${mStr}`);
      }
    };

    const negeriIcon = new L.DivIcon({
      html: `<div style="background-color: #2563eb; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
      className: "",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    const swastaIcon = new L.DivIcon({
      html: `<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
      className: "",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    if (!isOpen && !data) return null;

    return (
      <div
        className={`fixed inset-y-0 right-0 w-[95%] bg-[#F8FCFF] shadow-2xl z-[150] transform transition-transform duration-500 ease-in-out border-l border-slate-100 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-[110%]"}`}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <MapIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold">{regionName}</span>
                <button
                  onClick={() => {
                    onClose();
                    const pathNum = regionSlug ? regionSlug.replace("cabdis-", "") : (regionId ? regionId.split("-")[1]?.replace(/^0+/, "") : "");
                    navigate(`/cabdis-${pathNum || "1"}?name=${encodeURIComponent(regionName)}`);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center"
                >
                  Kunjungi
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">Dinas Pendidikan Provinsi Sulawesi Tengah</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-[2rem] border border-white shadow-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          {/* 1. Rekap Data Umum */}
          <div className="drop-shadow-sm">
            <GeneralDataSection data={data?.summary} />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* 2. Proyeksi (Left Card) */}
            <div className="w-full lg:w-[320px] shrink-0 drop-shadow-sm">
              <ProyeksiCard
                isLoading={loading}
              />
            </div>

            {/* 3. Peta (Right Card) */}
            <div className="flex-1 min-h-[550px] rounded-[3rem] overflow-hidden border border-white shadow-xl bg-slate-100 relative">
              <MapContainer
                center={[-1.43, 121.44]}
                zoom={9}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution="&copy; OpenStreetMap"
                />
                {geoData && (
                  <GeoJSON
                    data={geoData}
                    style={{
                      color: "transparent",
                      weight: 0,
                      fillColor: "#3b82f6",
                      fillOpacity: 0.25,
                    }}
                  />
                )}
                <MapBoundsHandler geoData={geoData} />
                {data?.schools?.map(
                  (school: any) =>
                    school.latitude &&
                    school.longitude && (
                      <Marker
                        key={school.id}
                        position={[
                          parseFloat(school.latitude),
                          parseFloat(school.longitude),
                        ]}
                        ref={(ref) => {
                          if (ref) markerRefs.current[school.id] = ref;
                        }}
                        icon={
                          school.name?.toUpperCase().includes("SWASTA")
                            ? swastaIcon
                            : negeriIcon
                        }
                      >
                        <Popup className="rounded-2xl overflow-hidden shadow-2xl border-none">
                          <div className="p-3 bg-white">
                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">
                              {school.name}
                            </h4>
                            <p className="text-[9px] font-bold text-blue-600 uppercase mt-1 flex items-center gap-1">
                              <School className="w-2.5 h-2.5" /> Unit Sekolah
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ),
                )}
              </MapContainer>

              {/* Absolute School List Overlay */}
              <div className="absolute top-6 right-6 bottom-6 w-60 glass-card backdrop-blur-md rounded-[1rem] border border-white shadow-2xl z-[1000] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-100 space-y-4">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Cari sekolah..."
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                  {data?.schools
                    ?.filter((s: any) =>
                      s.name.toLowerCase().includes(schoolSearch.toLowerCase()),
                    )
                    .map((school: any) => (
                      <button
                        key={school.id}
                        onClick={() => {
                          const marker = markerRefs.current[school.id];
                          if (marker) {
                            marker.openPopup();
                          }
                        }}
                        className="w-full p-4 bg-white/50 hover:bg-blue-600 hover:text-white rounded-2xl border border-slate-50 hover:border-blue-600 flex items-center justify-between group transition-all text-left"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold leading-tight line-clamp-1">
                            {school.name}
                          </span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${school.name?.toUpperCase().includes("SWASTA") ? "bg-emerald-500" : "bg-blue-500"} group-hover:bg-white`} />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Progress Laporan */}
          <div className="drop-shadow-sm">
            <ProgressUpdateSection
              summary={data?.school_reports}
              currentMonth={currentMonth}
            />
          </div>
        </div>

        {/* Loading Overlay (Only on first load for this region) */}
        {loading && !data && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[200] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Memuat Data Wilayah...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };
