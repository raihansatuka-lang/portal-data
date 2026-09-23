import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChevronRight, Minimize2, Maximize2, Building2, School } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProyeksiCardV2Props {
  smaProvinsiStats?: any[];
  isLoading?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const JENJANG_CONFIG = [
  {
    key: "SMA",
    label: "SMA",
    sublabel: "Sekolah Menengah Atas",
    color: "#10B981",
    bgClass: "from-emerald-50 via-white to-emerald-50/60",
    borderClass: "border-emerald-100/90",
    iconBg: "#DCFCE7",
    iconColor: "#15803D",
    dot: "bg-emerald-500",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
  },
  {
    key: "MA",
    label: "MA",
    sublabel: "Madrasah Aliyah",
    color: "#6366F1",
    bgClass: "from-indigo-50 via-white to-indigo-50/60",
    borderClass: "border-indigo-100/90",
    iconBg: "#E0E7FF",
    iconColor: "#4338CA",
    dot: "bg-indigo-500",
    pillBg: "bg-indigo-50",
    pillText: "text-indigo-700",
  },
  {
    key: "SMK",
    label: "SMK",
    sublabel: "Sekolah Menengah Kejuruan",
    color: "#3B82F6",
    bgClass: "from-sky-50 via-white to-sky-50/60",
    borderClass: "border-sky-100/90",
    iconBg: "#DBEAFE",
    iconColor: "#1D4ED8",
    dot: "bg-sky-500",
    pillBg: "bg-sky-50",
    pillText: "text-sky-700",
  },
  {
    key: "SLB",
    label: "SLB",
    sublabel: "Sekolah Luar Biasa",
    color: "#F59E0B",
    bgClass: "from-amber-50 via-white to-amber-50/60",
    borderClass: "border-amber-100/90",
    iconBg: "#FEF9C3",
    iconColor: "#A16207",
    dot: "bg-amber-500",
    pillBg: "bg-amber-50",
    pillText: "text-amber-700",
  },
  {
    key: "SMTK",
    label: "SMTK",
    sublabel: "Menengah Teologi Kristen",
    color: "#EC4899",
    bgClass: "from-pink-50 via-white to-pink-50/60",
    borderClass: "border-pink-100/90",
    iconBg: "#FCE7F3",
    iconColor: "#BE185D",
    dot: "bg-pink-500",
    pillBg: "bg-pink-50",
    pillText: "text-pink-700",
  },
];

export const ProyeksiCardV2: React.FC<ProyeksiCardV2Props> = ({
  smaProvinsiStats,
  isLoading: externalLoading,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const [jenjangData, setJenjangData] = useState<Record<string, any>>({});
  const [hoveredJenjangKey, setHoveredJenjangKey] = useState<string | null>(null);

  useEffect(() => {
    if (smaProvinsiStats && smaProvinsiStats.length > 0) {
      const map: Record<string, any> = {};
      smaProvinsiStats.forEach((item: any) => {
        map[item.bentuk_pendidikan] = item;
      });
      setJenjangData(map);
    }
  }, [smaProvinsiStats]);

  const handleKunjungi = () => {
    navigate("/provinsi");
  };

  const activeJenjang = JENJANG_CONFIG.filter(
    (j) => Number(jenjangData[j.key]?.total ?? 0) > 0
  );

  const chartData = activeJenjang.map((j) => ({
    name: j.key,
    value: Number(jenjangData[j.key]?.total ?? 0),
    color: j.color,
  }));

  const totalSekolah = chartData.reduce((sum, d) => sum + d.value, 0);

  // ── Render Collapsed Pill ──
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-lg hover:shadow-xl hover:bg-white hover:scale-105 transition-all duration-200 text-left cursor-pointer"
        title="Buka Ringkasan Data Provinsi"
      >
        <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 group-hover:rotate-6 transition-transform">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col pr-1">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-600">
            Provinsi
          </span>
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
            Ringkasan Data
          </span>
        </div>
        <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
      </button>
    );
  }

  // ── Render Expanded Card ──
  return (
    <div className="relative flex flex-col h-auto lg:h-[calc(100vh-6.5rem)] lg:max-h-[620px] lg:min-h-[480px] overflow-visible lg:overflow-hidden rounded-2xl sm:rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-purple-50/30 p-3.5 sm:p-5 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.25)] font-poppins transition-all duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.08),_transparent_40%)]" />

      {/* Loading overlay */}
      {externalLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-[2rem]">
          <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ── Header Kartu (Editorial Style - Opsi 2) ── */}
      <div className="mb-3 shrink-0 px-1 text-center relative">
        <span className="block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 mb-1">
          Tingkat Provinsi
        </span>
        <h3 className="text-base font-extrabold leading-tight tracking-tight text-slate-900 sm:text-lg">
          Portal Dinas Pendidikan
        </h3>
        <p className="mt-0.5 text-xs font-semibold leading-tight text-slate-600">
          Provinsi Sulawesi Tengah
        </p>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute right-0 top-0 w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Sembunyikan Panel"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Scrollable Body (Auto Height on Mobile, Scrollable on Desktop) ── */}
      <div className="flex-1 overflow-visible lg:overflow-y-auto pr-0 lg:pr-1 space-y-3 scrollbar-hide">
        {/* Identitas Dinas Pendidikan Prov. Sulteng */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
          <div className="w-10 h-12 shrink-0 flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1">
            <img
              src="/images/kabupaten_kota.png/Sulawesi Tengah.png"
              alt="Logo Provinsi Sulawesi Tengah"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.png";
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-800 text-xs leading-tight">
              Dinas Pendidikan Prov. Sulteng
            </h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Menaungi {totalSekolah.toLocaleString("id-ID")} Sekolah (SMA, SMK, & SLB)
            </p>
          </div>
        </div>

        {/* ── List Jenjang Interaktif ── */}
        <div className="flex flex-col gap-1.5">
          {activeJenjang.map((j) => {
            const stat = jenjangData[j.key];
            const total = Number(stat?.total ?? 0);
            const negeri = Number(stat?.total_negeri ?? 0);
            const swasta = Number(stat?.total_swasta ?? 0);
            const isHovered = hoveredJenjangKey === j.key;

            return (
              <div
                key={j.key}
                onMouseEnter={() => setHoveredJenjangKey(j.key)}
                onMouseLeave={() => setHoveredJenjangKey(null)}
                className={`group flex items-center justify-between rounded-xl border px-3 py-2 transition-all duration-200 cursor-pointer ${isHovered
                  ? "border-purple-300 bg-white shadow-md -translate-y-0.5 scale-[1.015] ring-2 ring-purple-100"
                  : `border ${j.borderClass} bg-gradient-to-r ${j.bgClass} shadow-2xs hover:shadow-sm hover:-translate-y-0.5 hover:bg-white`
                  }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3"
                    style={{ background: j.iconBg, color: j.iconColor }}
                  >
                    <School className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className={`text-xs font-black tracking-wide transition-colors duration-200 ${isHovered ? "text-purple-700" : "text-slate-800"}`}>
                      {j.label}
                    </p>
                    <p className="text-[9.5px] text-slate-400 font-semibold leading-none mt-0.5 whitespace-nowrap">
                      {negeri}N · {swasta}S
                    </p>
                  </div>
                </div>
                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-black border transition-all duration-200 tabular-nums ${isHovered
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs scale-105"
                  : "bg-white/90 text-slate-800 border-slate-200/80 shadow-2xs group-hover:border-purple-200"
                  }`}>
                  {total.toLocaleString("id-ID")}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Donut Chart Interaktif & Responsif terhadap Hover ── */}
        <div className="flex items-center justify-center gap-3 p-2.5 rounded-2xl bg-white/90 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="relative flex h-[104px] w-[104px] items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
              <PieChart>
                <Pie
                  data={
                    chartData.length > 0 && totalSekolah > 0
                      ? chartData
                      : [{ name: "kosong", value: 1, color: "#e2e8f0" }]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={hoveredJenjangKey ? 48 : 46}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={-270}
                  onMouseEnter={(data) => data?.name && setHoveredJenjangKey(data.name)}
                  onMouseLeave={() => setHoveredJenjangKey(null)}
                >
                  {(chartData.length > 0 && totalSekolah > 0
                    ? chartData
                    : [{ color: "#e2e8f0", name: "kosong" }]
                  ).map((entry, index) => {
                    const isMuted = hoveredJenjangKey && hoveredJenjangKey !== entry.name;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={isMuted ? 0.35 : 1}
                        className="transition-all duration-200 cursor-pointer outline-none"
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Dynamic Center Tooltip */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-200">
              <div className="text-center animate-in fade-in zoom-in-90 duration-150">
                {hoveredJenjangKey ? (
                  <>
                    <p className="text-sm font-black text-purple-700 leading-none tabular-nums">
                      {Number(jenjangData[hoveredJenjangKey]?.total ?? 0).toLocaleString("id-ID")}
                    </p>
                    <p className="text-[7.5px] font-black uppercase tracking-wider text-purple-500 mt-0.5">
                      {hoveredJenjangKey}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-black text-slate-900 leading-none tabular-nums">
                      {totalSekolah.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[7px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      Total
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Legend Beside Donut */}
          <div className="flex flex-col gap-1 min-w-[110px]">
            {activeJenjang.map((j) => {
              const isHovered = hoveredJenjangKey === j.key;
              return (
                <div
                  key={j.key}
                  onMouseEnter={() => setHoveredJenjangKey(j.key)}
                  onMouseLeave={() => setHoveredJenjangKey(null)}
                  className={`flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded-md transition-all duration-150 cursor-pointer ${isHovered
                    ? "bg-purple-50 font-bold text-purple-900 scale-105"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${j.dot} shrink-0 transition-transform duration-200 ${isHovered ? "scale-125 ring-2 ring-purple-300" : ""
                      }`}
                  />
                  <span className="truncate">{j.label}</span>
                  <span className="font-extrabold text-slate-800 ml-auto tabular-nums">
                    {Number(jenjangData[j.key]?.total ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer Button CTA dengan Animasi Hover ── */}
      <div className="pt-3 border-t border-slate-100 shrink-0">
        <button
          onClick={handleKunjungi}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-600/25 hover:shadow-md hover:shadow-blue-600/35 hover:-translate-y-0.5 transition-all duration-200 active:scale-98 cursor-pointer"
        >
          <span>Kunjungi Portal Provinsi</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
