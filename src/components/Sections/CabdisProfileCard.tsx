import React, { useState, useMemo, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { School, Building2, Minimize2, Maximize2, X, MapPin, Award, Users, ChevronDown, ChevronUp } from "lucide-react";

interface CabdisProfileCardProps {
  numericId: number;
  cabdisConfig?: any;
  schools: any[];
  summary?: any;
  activeJenjang: string;
  onSelectJenjang: (jenjang: string) => void;
  activeKabupaten?: string | null;
  onSelectKabupaten?: (kab: string | null) => void;
  activeAkreditasi?: string | null;
  onSelectAkreditasi?: (akreditasi: string | null) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const JENJANG_METRICS = [
  {
    key: "SMA",
    label: "SMA",
    fullName: "Sekolah Menengah Atas",
    color: "#8b5cf6",
    bgClass: "from-purple-50 via-white to-purple-50/50",
    borderClass: "border-purple-100",
    iconBg: "#F3E8FF",
    iconColor: "#7E22CE",
    dot: "bg-purple-500",
  },
  {
    key: "SMK",
    label: "SMK",
    fullName: "Sekolah Menengah Kejuruan",
    color: "#3b82f6",
    bgClass: "from-sky-50 via-white to-sky-50/50",
    borderClass: "border-sky-100",
    iconBg: "#DBEAFE",
    iconColor: "#1D4ED8",
    dot: "bg-blue-500",
  },
  {
    key: "SLB",
    label: "SLB",
    fullName: "Sekolah Luar Biasa",
    color: "#f59e0b",
    bgClass: "from-amber-50 via-white to-amber-50/50",
    borderClass: "border-amber-100",
    iconBg: "#FEF3C7",
    iconColor: "#B45309",
    dot: "bg-amber-500",
  },
];

export const CabdisProfileCard: React.FC<CabdisProfileCardProps> = ({
  numericId,
  cabdisConfig,
  schools = [],
  summary,
  activeJenjang,
  onSelectJenjang,
  activeKabupaten = null,
  onSelectKabupaten,
  activeAkreditasi = null,
  onSelectAkreditasi,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [hoveredJenjangKey, setHoveredJenjangKey] = useState<string | null>(null);
  const [hoveredAkreditasiKey, setHoveredAkreditasiKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 14);
      setCanScrollUp(scrollTop > 14);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 150);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [schools, activeJenjang, activeKabupaten, activeAkreditasi]);

  // Hitung data jenjang dari daftar sekolah cabang dinas ini
  const stats: Record<string, { total: number; negeri: number; swasta: number }> = {
    SMA: { total: 0, negeri: 0, swasta: 0 },
    SMK: { total: 0, negeri: 0, swasta: 0 },
    SLB: { total: 0, negeri: 0, swasta: 0 },
  };

  let totalNegeri = 0;
  let totalSwasta = 0;

  schools.forEach((s) => {
    const rawGrade = String(s.grade || s.bentuk_pendidikan || "").toUpperCase().trim();
    const isNegeri = String(s.status || "").toLowerCase().includes("negeri");
    const isSw = String(s.status || "").toLowerCase().includes("swasta") || String(s.name || "").toUpperCase().includes("SWASTA");

    if (isNegeri) totalNegeri++;
    else if (isSw) totalSwasta++;

    const key = rawGrade.includes("SMK") ? "SMK" : rawGrade.includes("SLB") ? "SLB" : rawGrade.includes("SMA") ? "SMA" : null;
    if (key && stats[key]) {
      stats[key].total++;
      if (isNegeri) stats[key].negeri++;
      else if (isSw) stats[key].swasta++;
    }
  });

  const totalSekolah = schools.length;

  // Hitung sebaran sekolah per kabupaten/kota di cabang dinas ini
  const kabStats = useMemo(() => {
    const map: Record<string, { total: number; negeri: number; swasta: number }> = {};
    schools.forEach((s) => {
      const rawKab = s.kabupaten?.trim();
      const kab = rawKab ? rawKab : "Lainnya";
      if (!map[kab]) {
        map[kab] = { total: 0, negeri: 0, swasta: 0 };
      }
      map[kab].total++;
      const isNegeri = String(s.status || "").toLowerCase().includes("negeri");
      if (isNegeri) map[kab].negeri++;
      else map[kab].swasta++;
    });
    const total = schools.length;
    return Object.entries(map)
      .map(([kab, val]) => ({
        nama: kab,
        ...val,
        pct: total > 0 ? Math.round((val.total / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [schools]);

  // Hitung komposisi akreditasi sekolah
  const akreditasiStats = useMemo(() => {
    let a = 0, b = 0, c = 0, tt = 0;
    schools.forEach((s) => {
      const akr = String(s.akreditasi || "").toUpperCase().trim();
      if (akr === "A") a++;
      else if (akr === "B") b++;
      else if (akr === "C") c++;
      else tt++;
    });
    const total = schools.length || 1;
    return {
      a,
      b,
      c,
      tt,
      aPct: Math.round((a / total) * 100),
      bPct: Math.round((b / total) * 100),
      cPct: Math.round((c / total) * 100),
      ttPct: Math.round((tt / total) * 100),
    };
  }, [schools]);

  const chartData = JENJANG_METRICS.map((j) => ({
    name: j.key,
    value: stats[j.key].total,
    color: j.color,
  })).filter((d) => d.value > 0);

  // Label wilayah kerja (kabupaten/kota)
  const wilayahKerja = cabdisConfig?.label?.split("—")[1]?.trim() || cabdisConfig?.kabKotas?.join(", ") || "";

  // ── Render Collapsed Pill ──
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-lg hover:shadow-xl hover:bg-white hover:scale-105 transition-all duration-200 text-left cursor-pointer"
        title="Buka Profil & Statistik Wilayah"
      >
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-2xs group-hover:rotate-6 transition-transform"
          style={{ background: cabdisConfig?.color || "#2563eb" }}
        >
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col pr-1">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600">
            Wilayah {numericId}
          </span>
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
            {totalSekolah} Sekolah Menengah
          </span>
        </div>
        <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
      </button>
    );
  }

  // ── Render Expanded Card ──
  return (
    <div className="relative flex flex-col h-full max-h-[calc(100vh-5.5rem)] overflow-hidden rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 p-4 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.22)] font-poppins transition-all duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.07),_transparent_40%)]" />

      {/* ── Header Kartu Profil ── */}
      <div className="mb-2 shrink-0 px-1 text-center relative">
        <span className="block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 mb-0.5">
          Profil Wilayah
        </span>
        <h3 className="text-base font-extrabold leading-tight tracking-tight text-slate-900 sm:text-lg">
          Cabang Dinas Wilayah {numericId}
        </h3>
        {wilayahKerja && (
          <p className="mt-0.5 text-xs font-semibold leading-tight text-slate-600">
            {wilayahKerja}
          </p>
        )}
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

      {/* ── Scrollable Body with Sleek Visible Scrollbar ── */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 overflow-y-auto pr-1.5 space-y-2.5 cabdis-scrollbar"
      >
        {/* Total Ringkasan Badge */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
              style={{ background: cabdisConfig?.color || "#2563eb" }}
            >
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 leading-tight">
                {totalSekolah} Sekolah
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Kewenangan Prov. Sulteng
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 block">
              {totalNegeri} Negeri
            </span>
            <span className="text-[10px] font-medium text-slate-400 block">
              {totalSwasta} Swasta
            </span>
          </div>
        </div>

        {/* ── List Jenjang Interaktif dengan Quick-Filter ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Pilih Jenjang (Filter)
            </span>
            {activeJenjang !== "semua" && (
              <button
                onClick={() => onSelectJenjang("semua")}
                className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {JENJANG_METRICS.map((j) => {
              const stat = stats[j.key];
              const isSelected = activeJenjang === j.key;
              const isHovered = hoveredJenjangKey === j.key;

              return (
                <div
                  key={j.key}
                  onClick={() => onSelectJenjang(isSelected ? "semua" : j.key)}
                  onMouseEnter={() => setHoveredJenjangKey(j.key)}
                  onMouseLeave={() => setHoveredJenjangKey(null)}
                  className={`group flex items-center justify-between rounded-xl border px-3 py-1.5 transition-all duration-200 cursor-pointer ${isSelected
                      ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-400/50 shadow-sm -translate-y-0.5"
                      : isHovered
                        ? "border-blue-300 bg-white shadow-sm -translate-y-0.5 scale-[1.015]"
                        : `border ${j.borderClass} bg-gradient-to-r ${j.bgClass} shadow-2xs hover:shadow-xs hover:bg-white`
                    }`}
                  title={`Klik untuk memfilter hanya ${j.label}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg shadow-2xs transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3"
                      style={{ background: j.iconBg, color: j.iconColor }}
                    >
                      <School className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-black tracking-wide ${isSelected ? "text-blue-800" : "text-slate-800"}`}>
                          {j.label}
                        </p>
                        {isSelected && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-md">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] text-slate-400 font-semibold leading-none mt-0.5 whitespace-nowrap">
                        {stat.negeri}N · {stat.swasta}S
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-lg px-2.5 py-0.5 text-xs font-black border transition-all duration-200 tabular-nums ${isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs scale-105"
                        : "bg-white/90 text-slate-800 border-slate-200/80 shadow-2xs group-hover:border-blue-200"
                      }`}
                  >
                    {stat.total.toLocaleString("id-ID")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Donut Chart Proporsi Jenjang di Wilayah Ini ── */}
        <div className="flex items-center justify-center gap-3 p-2 rounded-2xl bg-white/90 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="relative flex h-[96px] w-[96px] items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={96}>
              <PieChart>
                <Pie
                  data={chartData.length > 0 ? chartData : [{ name: "kosong", value: 1, color: "#e2e8f0" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={hoveredJenjangKey ? 45 : 43}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={-270}
                  onMouseEnter={(data) => data?.name && setHoveredJenjangKey(data.name)}
                  onMouseLeave={() => setHoveredJenjangKey(null)}
                >
                  {(chartData.length > 0 ? chartData : [{ color: "#e2e8f0", name: "kosong" }]).map((entry, index) => {
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
                    <p className="text-sm font-black text-blue-700 leading-none tabular-nums">
                      {stats[hoveredJenjangKey]?.total ?? 0}
                    </p>
                    <p className="text-[7.5px] font-black uppercase tracking-wider text-blue-500 mt-0.5">
                      {hoveredJenjangKey}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-black text-slate-900 leading-none tabular-nums">
                      {totalSekolah}
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
            {JENJANG_METRICS.map((j) => {
              const isHovered = hoveredJenjangKey === j.key;
              const isSelected = activeJenjang === j.key;
              return (
                <div
                  key={j.key}
                  onClick={() => onSelectJenjang(isSelected ? "semua" : j.key)}
                  onMouseEnter={() => setHoveredJenjangKey(j.key)}
                  onMouseLeave={() => setHoveredJenjangKey(null)}
                  className={`flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded-md transition-all duration-150 cursor-pointer ${isSelected
                      ? "bg-blue-100 font-bold text-blue-900"
                      : isHovered
                        ? "bg-blue-50 font-bold text-blue-800 scale-105"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${j.dot} shrink-0 transition-transform duration-200 ${isHovered || isSelected ? "scale-125 ring-2 ring-blue-300" : ""
                      }`}
                  />
                  <span className="truncate">{j.label}</span>
                  <span className="font-extrabold text-slate-800 ml-auto tabular-nums">
                    {stats[j.key].total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sebaran Kabupaten / Kota (Interactive Filter) ── */}
        {kabStats.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Sebaran Wilayah ({kabStats.length} Kab/Kota)
              </span>
              {activeKabupaten && (
                <button
                  type="button"
                  onClick={() => onSelectKabupaten?.(null)}
                  className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                  Reset
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {kabStats.map((kab) => {
                const isSelected = activeKabupaten === kab.nama;
                return (
                  <button
                    key={kab.nama}
                    type="button"
                    onClick={() => onSelectKabupaten?.(isSelected ? null : kab.nama)}
                    className={`group relative overflow-hidden flex flex-col rounded-xl border p-2 text-left transition-all duration-200 cursor-pointer ${isSelected
                        ? "border-blue-500 bg-blue-50/90 ring-2 ring-blue-400/50 shadow-sm"
                        : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50/70 shadow-2xs"
                      }`}
                    title={`Klik untuk memfilter sekolah di ${kab.nama}`}
                  >
                    <div className="flex items-center justify-between gap-2 z-10">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${isSelected ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"
                            }`}
                        />
                        <span
                          className={`text-xs font-black truncate ${isSelected ? "text-blue-900" : "text-slate-800"
                            }`}
                        >
                          {kab.nama}
                        </span>
                        {isSelected && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-md shrink-0">
                            Dipilih
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-black text-slate-800 tabular-nums">
                          {kab.total}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400">
                          ({kab.pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Sebaran */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-blue-600" : "bg-blue-400/70 group-hover:bg-blue-500"
                          }`}
                        style={{ width: `${Math.max(kab.pct, 4)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Komposisi Akreditasi & Ringkasan Mutu ── */}
        <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" />
              Komposisi Akreditasi
            </span>
            {activeAkreditasi ? (
              <button
                type="button"
                onClick={() => onSelectAkreditasi?.(null)}
                className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
                Reset
              </button>
            ) : (
              <span className="text-[9px] font-bold text-slate-400">
                {totalSekolah} Sekolah
              </span>
            )}
          </div>

          {/* Segmented Akreditasi Bar (Interactive with Hover) */}
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 gap-0.5">
            {akreditasiStats.a > 0 && (
              <div
                style={{ width: `${akreditasiStats.aPct}%` }}
                onClick={() => onSelectAkreditasi?.(activeAkreditasi === "A" ? null : "A")}
                onMouseEnter={() => setHoveredAkreditasiKey("A")}
                onMouseLeave={() => setHoveredAkreditasiKey(null)}
                className={`bg-emerald-500 rounded-full h-full transition-all duration-300 cursor-pointer ${
                  activeAkreditasi && activeAkreditasi !== "A" ? "opacity-30" : "opacity-100"
                } ${hoveredAkreditasiKey === "A" ? "brightness-110 scale-y-125 shadow-xs" : ""}`}
                title={`Akreditasi A: ${akreditasiStats.a} sekolah (${akreditasiStats.aPct}%) - Klik untuk memfilter`}
              />
            )}
            {akreditasiStats.b > 0 && (
              <div
                style={{ width: `${akreditasiStats.bPct}%` }}
                onClick={() => onSelectAkreditasi?.(activeAkreditasi === "B" ? null : "B")}
                onMouseEnter={() => setHoveredAkreditasiKey("B")}
                onMouseLeave={() => setHoveredAkreditasiKey(null)}
                className={`bg-blue-500 rounded-full h-full transition-all duration-300 cursor-pointer ${
                  activeAkreditasi && activeAkreditasi !== "B" ? "opacity-30" : "opacity-100"
                } ${hoveredAkreditasiKey === "B" ? "brightness-110 scale-y-125 shadow-xs" : ""}`}
                title={`Akreditasi B: ${akreditasiStats.b} sekolah (${akreditasiStats.bPct}%) - Klik untuk memfilter`}
              />
            )}
            {akreditasiStats.c > 0 && (
              <div
                style={{ width: `${akreditasiStats.cPct}%` }}
                onClick={() => onSelectAkreditasi?.(activeAkreditasi === "C" ? null : "C")}
                onMouseEnter={() => setHoveredAkreditasiKey("C")}
                onMouseLeave={() => setHoveredAkreditasiKey(null)}
                className={`bg-amber-500 rounded-full h-full transition-all duration-300 cursor-pointer ${
                  activeAkreditasi && activeAkreditasi !== "C" ? "opacity-30" : "opacity-100"
                } ${hoveredAkreditasiKey === "C" ? "brightness-110 scale-y-125 shadow-xs" : ""}`}
                title={`Akreditasi C: ${akreditasiStats.c} sekolah (${akreditasiStats.cPct}%) - Klik untuk memfilter`}
              />
            )}
            {akreditasiStats.tt > 0 && (
              <div
                style={{ width: `${akreditasiStats.ttPct}%` }}
                onClick={() => onSelectAkreditasi?.(activeAkreditasi === "LAIN" ? null : "LAIN")}
                onMouseEnter={() => setHoveredAkreditasiKey("LAIN")}
                onMouseLeave={() => setHoveredAkreditasiKey(null)}
                className={`bg-slate-400 rounded-full h-full transition-all duration-300 cursor-pointer ${
                  activeAkreditasi && activeAkreditasi !== "LAIN" ? "opacity-30" : "opacity-100"
                } ${hoveredAkreditasiKey === "LAIN" ? "brightness-110 scale-y-125 shadow-xs" : ""}`}
                title={`Belum/Lainnya: ${akreditasiStats.tt} sekolah (${akreditasiStats.ttPct}%) - Klik untuk memfilter`}
              />
            )}
          </div>

          {/* Interactive Akreditasi Filter Buttons with Hover */}
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            {[
              {
                key: "A",
                label: "A",
                count: akreditasiStats.a,
                pct: akreditasiStats.aPct,
                activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/50 scale-105",
                defaultClass: "bg-emerald-50/70 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-2xs hover:-translate-y-0.5",
              },
              {
                key: "B",
                label: "B",
                count: akreditasiStats.b,
                pct: akreditasiStats.bPct,
                activeClass: "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/50 scale-105",
                defaultClass: "bg-blue-50/70 text-blue-800 border-blue-200/80 hover:bg-blue-100 hover:border-blue-300 hover:shadow-2xs hover:-translate-y-0.5",
              },
              {
                key: "C",
                label: "C",
                count: akreditasiStats.c,
                pct: akreditasiStats.cPct,
                activeClass: "bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/50 scale-105",
                defaultClass: "bg-amber-50/70 text-amber-800 border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 hover:shadow-2xs hover:-translate-y-0.5",
              },
              {
                key: "LAIN",
                label: "Lain",
                count: akreditasiStats.tt,
                pct: akreditasiStats.ttPct,
                activeClass: "bg-slate-700 text-white border-slate-700 shadow-sm ring-2 ring-slate-400/50 scale-105",
                defaultClass: "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 hover:shadow-2xs hover:-translate-y-0.5",
              },
            ].map((item) => {
              const isSelected = activeAkreditasi === item.key;
              const isHovered = hoveredAkreditasiKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelectAkreditasi?.(isSelected ? null : item.key)}
                  onMouseEnter={() => setHoveredAkreditasiKey(item.key)}
                  onMouseLeave={() => setHoveredAkreditasiKey(null)}
                  className={`group flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected ? item.activeClass : item.defaultClass
                  } ${isHovered && !isSelected ? "scale-105 shadow-2xs" : ""}`}
                  title={`Klik untuk memfilter sekolah Akreditasi ${item.label} (${item.count} sekolah)`}
                >
                  <span className={`text-[8.5px] font-black uppercase tracking-wider ${isSelected ? "text-white" : ""}`}>
                    {item.label}
                  </span>
                  <span className={`text-[10.5px] font-black tabular-nums leading-tight ${isSelected ? "text-white" : "text-slate-800 group-hover:scale-105"}`}>
                    {item.count}
                  </span>
                  <span className={`text-[7px] font-bold ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                    {item.pct}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Siswa & 3T Badges if available */}
          {summary?.total_siswa > 0 && (
            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1 text-slate-600 font-semibold">
                <Users className="w-3 h-3 text-blue-600" />
                <span>Total Siswa:</span>
              </div>
              <span className="font-black text-slate-900 tabular-nums">
                {summary.total_siswa.toLocaleString("id-ID")}
              </span>
            </div>
          )}

          {summary?.total_3t > 0 && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-rose-600 font-semibold">Sekolah 3T:</span>
              <span className="font-black text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded-md tabular-nums">
                {summary.total_3t} Sekolah
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Visual Scroll Affordance (Gradient Shadow & Floating Cue Pill) ── */}
      <div
        className={`pointer-events-none absolute bottom-9 left-2 right-2 h-10 bg-gradient-to-t from-white via-white/80 to-transparent transition-opacity duration-300 z-10 ${canScrollDown ? "opacity-100" : "opacity-0"
          }`}
      />

      {canScrollDown && (
        <button
          type="button"
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
              });
            }
          }}
          className="absolute bottom-11 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 hover:bg-blue-600 text-white shadow-md hover:shadow-xl backdrop-blur-md transition-all duration-200 animate-bounce text-[9.5px] font-black cursor-pointer group"
          title="Klik untuk melihat data mutu & akreditasi"
        >
          <span>Data Mutu Sekolah</span>
          <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* ── Footer Info & Quick Scroll Button ── */}
      <div className="pt-2 border-t border-slate-100 text-center shrink-0 flex items-center justify-between px-1">
        <span className="text-[9px] font-semibold text-slate-400 truncate">
          {canScrollDown ? "Data mutu & akreditasi ada di bawah" : "Pilih filter jenjang / wilayah"}
        </span>
        {canScrollDown ? (
          <button
            type="button"
            onClick={() => {
              scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
              });
            }}
            className="flex items-center gap-0.5 text-[9px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors shrink-0 cursor-pointer ml-1"
          >
            <span>Bawah</span>
            <ChevronDown className="w-3 h-3 stroke-[2.5]" />
          </button>
        ) : canScrollUp ? (
          <button
            type="button"
            onClick={() => {
              scrollRef.current?.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="flex items-center gap-0.5 text-[9px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors shrink-0 cursor-pointer ml-1"
          >
            <span>Ke Atas</span>
            <ChevronUp className="w-3 h-3 stroke-[2.5]" />
          </button>
        ) : null}
      </div>

      {/* Custom Modern Scrollbar Styles */}
      <style>{`
        .cabdis-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .cabdis-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .cabdis-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .cabdis-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .cabdis-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};
