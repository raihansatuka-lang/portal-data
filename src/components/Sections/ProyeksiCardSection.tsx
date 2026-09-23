import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProyeksiCardProps {
  smaProvinsiStats?: any[];
  isLoading?: boolean;
}

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
    dot: "bg-emerald-500",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
  },
  {
    key: "MA",
    label: "MA",
    sublabel: "Madrasah Aliyah",
    color: "#6366F1",
    bgClass: "from-indigo-50 via-white to-indigo-50",
    borderClass: "border-indigo-100",
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
    bgClass: "from-sky-50 via-white to-sky-50",
    borderClass: "border-sky-100",
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
    bgClass: "from-amber-50 via-white to-amber-50",
    borderClass: "border-amber-100",
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
    bgClass: "from-pink-50 via-white to-pink-50",
    borderClass: "border-pink-100",
    iconBg: "#FCE7F3",
    iconColor: "#BE185D",
    dot: "bg-pink-500",
    pillBg: "bg-pink-50",
    pillText: "text-pink-700",
  },
];

// Icon sekolah SVG
const SchoolIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L2 9V11H4V20H10V14H14V20H20V11H22V9L12 3ZM12 5.5L18 9.1V10H6V9.1L12 5.5ZM8 12H10V14H8V12ZM14 12H16V14H14V12ZM8 16H10V18H8V16ZM14 16H16V18H14V16Z" />
  </svg>
);

export const ProyeksiCard: React.FC<ProyeksiCardProps> = ({
  smaProvinsiStats,
  isLoading: externalLoading,
}) => {
  const navigate = useNavigate();
  const [jenjangData, setJenjangData] = useState<Record<string, any>>({});

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

  return (
    <div className="relative flex h-[860px] flex-col overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-purple-50/40 p-6 shadow-[0_35px_90px_-35px_rgba(15,23,42,0.35)] font-poppins sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.08),_transparent_40%)]" />

      {/* Loading overlay */}
      {externalLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-md z-50 flex items-center justify-center rounded-[2.5rem]">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ── Header — center, identik dengan card kabupaten ── */}
      <div className="mb-4 shrink-0 px-1 text-center">
        <div className="mb-2 inline-flex rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-purple-600">
          Provinsi
        </div>
        <h3 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 sm:text-xl">
          Portal Dinas Pendidikan
        </h3>
        <p className="mt-0.5 text-sm font-medium leading-tight text-slate-700">
          Provinsi Sulawesi Tengah
        </p>
      </div>

      {/* ── Inner Card ── */}
      <div className="flex flex-1 flex-col justify-between gap-3 rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.25)] min-h-0">

        {/* Logo + Identitas — menggantikan badge "Ringkasan Data Provinsi" */}
        <div className="flex flex-col items-center gap-2 text-center shrink-0">
          <div className="flex h-20 w-16 items-center justify-center overflow-hidden rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white to-slate-100 shadow-sm">
            <img
              src="/images/kabupaten_kota.png/Sulawesi Tengah.png"
              alt="Logo Provinsi Sulawesi Tengah"
              className="h-full w-auto object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.png";
              }}
            />
          </div>
          <div>
            <h4 className="mt-1 font-extrabold text-slate-900 text-sm leading-tight">
              Dinas Pendidikan Prov. Sulawesi Tengah
            </h4>
          </div>
        </div>

        {/* ── List Jenjang — tidak scroll, semua tampil ── */}
        <div className="flex flex-col gap-2 shrink-0">
          {activeJenjang.map((j) => {
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: j.iconBg, color: j.iconColor }}
                  >
                    <SchoolIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold tracking-wide text-slate-800">{j.label}</p>
                    <p className="text-[9.5px] text-slate-400 font-semibold leading-none mt-0.5 whitespace-nowrap">
                      {negeri}N · {swasta}S
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-extrabold text-slate-900 shadow-sm border border-slate-100">
                  {total.toLocaleString("id-ID")}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Donut Chart ── */}
        <div className="relative flex flex-col items-center justify-center shrink-0">
          <div className="relative flex h-[130px] w-[130px] items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={130}>
              <PieChart>
                <Pie
                  data={
                    chartData.length > 0 && totalSekolah > 0
                      ? chartData
                      : [{ name: "kosong", value: 1, color: "#e2e8f0" }]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={58}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {(chartData.length > 0 && totalSekolah > 0
                    ? chartData
                    : [{ color: "#e2e8f0" }]
                  ).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-400">Total</p>
                <p className="text-lg font-black text-slate-900 leading-none">{totalSekolah}</p>
                <p className="text-[8px] font-medium text-slate-400">Sekolah</p>
              </div>
            </div>
          </div>

          {/* Chart legend pills */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {activeJenjang.map((j) => (
              <div
                key={j.key}
                className={`flex items-center gap-1 rounded-full ${j.pillBg} px-2 py-0.5 text-[9px] font-semibold ${j.pillText}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${j.dot}`} />
                {j.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Button ── */}
        <button
          onClick={handleKunjungi}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 shrink-0"
        >
          <span>Kunjungi</span>
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
