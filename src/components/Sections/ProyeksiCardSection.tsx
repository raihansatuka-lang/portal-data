import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PemetaanService } from "@/services/pemetaanService";

interface ProyeksiCardProps {
  projections?: any;
  schoolData?: any;
  jenjangStats?: any[];          // Data dari Home.tsx agar tidak double-fetch
  onFilterChange?: (range: "monthly" | "yearly", month?: number) => void;
  onMonthNav?: (newMonth: string) => void;
  onOpenDetail?: (category: string) => void;
  onOpenJatuhTempoDetail?: (category: string) => void;
  onOpenSchoolReports?: () => void;
  isLoading?: boolean;
}

// Logo Sulawesi Tengah
const SultengCrestLogo: React.FC<{ className?: string }> = ({ className = "w-12 h-14" }) => (
  <img
    src="/images/kabupaten_kota.png/Sulawesi Tengah.png"
    alt="Logo Provinsi Sulawesi Tengah"
    className={`${className} object-contain`}
    onError={(e) => {
      (e.currentTarget as HTMLImageElement).src = "/logo.png";
    }}
  />
);

// Icon sekolah SVG
const SchoolIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L2 9V11H4V20H10V14H14V20H20V11H22V9L12 3ZM12 5.5L18 9.1V10H6V9.1L12 5.5ZM8 12H10V14H8V12ZM14 12H16V14H14V12ZM8 16H10V18H8V16ZM14 16H16V18H14V16Z" />
  </svg>
);

const JENJANG_CONFIG = [
  {
    key: "SMA",
    label: "SMA",
    sublabel: "Sekolah Menengah Atas",
    color: "#10B981",
    bgClass: "from-emerald-50 via-white to-emerald-50",
    borderClass: "border-emerald-100",
    iconBg: "#DCFCE7",
    iconColor: "#15803D",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  {
    key: "SMK",
    label: "SMK",
    sublabel: "Sekolah Menengah Kejuruan",
    color: "#3B82F6",
    bgClass: "from-sky-50 via-white to-sky-50",
    borderClass: "border-sky-100",
    iconBg: "#DBEAFE",
    iconColor: "#1D4ED8",
    pillBg: "bg-sky-50",
    pillText: "text-sky-700",
    dot: "bg-sky-500",
  },
  {
    key: "SLB",
    label: "SLB",
    sublabel: "Sekolah Luar Biasa",
    color: "#F59E0B",
    bgClass: "from-amber-50 via-white to-amber-50",
    borderClass: "border-amber-100",
    iconBg: "#FEF9C3",
    iconColor: "#A16207",
    pillBg: "bg-amber-50",
    pillText: "text-amber-700",
    dot: "bg-amber-500",
  },
];

export const ProyeksiCard: React.FC<ProyeksiCardProps> = ({
  jenjangStats,
  isLoading: externalLoading,
}) => {
  const navigate = useNavigate();
  const [localData, setLocalData] = useState<Record<string, any>>({});
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    // Kalau data sudah di-pass dari parent, pakai itu langsung
    if (jenjangStats && jenjangStats.length > 0) {
      const map: Record<string, any> = {};
      jenjangStats.forEach((item: any) => {
        map[item.bentuk_pendidikan] = item;
      });
      setLocalData(map);
      return;
    }
    // Fallback: fetch sendiri kalau prop tidak tersedia
    setLocalLoading(true);
    PemetaanService.getStatistikJenjang()
      .then((res: any) => {
        if (res?.data) {
          const map: Record<string, any> = {};
          res.data.forEach((item: any) => {
            map[item.bentuk_pendidikan] = item;
          });
          setLocalData(map);
        }
      })
      .catch(console.error)
      .finally(() => setLocalLoading(false));
  }, [jenjangStats]);

  const jenjangData = localData;
  const loading = localLoading;
  const isLoadingState = loading || externalLoading;

  const handleKunjungi = () => {
    navigate("/?jenjang=sma");
  };

  const chartData = JENJANG_CONFIG.map((j) => ({
    name: j.key,
    value: Number(jenjangData[j.key]?.total ?? 0),
    color: j.color,
  }));

  const totalSekolah = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-6 shadow-[0_35px_90px_-35px_rgba(15,23,42,0.35)] sm:p-7 font-poppins"
      style={{ height: "680px" }}
    >
      {/* Background gradient accent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_38%)]" />

      {/* Loading overlay */}
      {isLoadingState && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-md z-50 flex items-center justify-center rounded-[2.5rem] animate-pulse">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Memuat...
            </span>
          </div>
        </div>
      )}

      {/* ── Header: Logo & Nama Instansi ── */}
      <div className="mb-4 flex items-center gap-3 rounded-[1.5rem] border border-white/80 bg-white/80 p-3 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-sm shrink-0">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-slate-200 bg-gradient-to-br from-white to-slate-100 shadow-sm">
          <SultengCrestLogo className="h-12 w-12 drop-shadow-sm" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-blue-600 truncate">
            Provinsi Sulawesi Tengah
          </span>
          <h3 className="text-sm font-extrabold leading-tight tracking-tight text-slate-900">
            Dinas Pendidikan
          </h3>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
            Pengelola SMA, SMK & SLB
          </p>
        </div>
      </div>

      {/* ── Inner Card ── */}
      <div className="flex flex-1 flex-col justify-between gap-3 rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.25)] min-h-0">

        {/* Judul */}
        <div className="text-center shrink-0">
          <div className="mb-1.5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-0.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-blue-600">
            Ringkasan Data Provinsi
          </div>
          <h4 className="text-sm font-extrabold text-slate-900">Pengelolaan SMA Sederajat</h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Seluruh Sulawesi Tengah</p>
        </div>

        {/* ── List Jenjang ── */}
        <div className="flex flex-col gap-2 shrink-0">
          {JENJANG_CONFIG.map((j) => {
            const stat = jenjangData[j.key];
            const total = Number(stat?.total ?? 0);
            const negeri = Number(stat?.total_negeri ?? 0);
            const swasta = Number(stat?.total_swasta ?? 0);
            return (
              <div
                key={j.key}
                className={`flex items-center justify-between rounded-[1.25rem] border ${j.borderClass} bg-gradient-to-r ${j.bgClass} px-3.5 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: j.iconBg, color: j.iconColor }}
                  >
                    <SchoolIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold tracking-wide text-slate-800">{j.label}</span>
                    <p className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                      {negeri}N / {swasta}S
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-sm font-extrabold text-slate-900 shadow-sm">
                  {loading ? "…" : total.toLocaleString("id-ID")}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Donut Chart ── */}
        <div className="relative flex flex-col items-center justify-center shrink-0">
          <div className="relative flex h-[140px] w-[140px] items-center justify-center rounded-full bg-gradient-to-br from-slate-100 via-white to-slate-50 p-2 shadow-[inset_0_8px_16px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
            <div className="absolute inset-3 rounded-full bg-white/90 shadow-sm" />
            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.length > 0 && totalSekolah > 0 ? chartData : [{ name: "kosong", value: 1, color: "#e2e8f0" }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={60}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {(chartData.length > 0 && totalSekolah > 0 ? chartData : [{ color: "#e2e8f0" }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-white px-3 py-2 text-center shadow-md ring-1 ring-slate-100">
                <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-slate-400">Total</p>
                <p className="text-base font-black text-slate-900">{loading ? "…" : totalSekolah}</p>
                <p className="text-[8px] font-medium text-slate-500">Sekolah</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
            {JENJANG_CONFIG.map((j) => (
              <div
                key={j.key}
                className={`flex items-center gap-1.5 rounded-full ${j.pillBg} px-2.5 py-1 text-[10px] font-semibold ${j.pillText}`}
              >
                <span className={`h-2 w-2 rounded-full ${j.dot}`} />
                {j.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Button ── */}
        <button
          onClick={handleKunjungi}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 shrink-0"
        >
          <span>Kunjungi</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
