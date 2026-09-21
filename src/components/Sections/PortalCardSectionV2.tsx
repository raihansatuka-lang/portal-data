import React, { useRef, useEffect, useState } from "react";
import { ChevronRight, Layers, School, Search, Minimize2, Maximize2, X, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PemetaanService } from "@/services/pemetaanService";

interface PortalDataCardsProps {
  cards?: any[];
  onViewRegionDetail?: (region: any) => void;
  activeKode?: string | null;
  hoveredKode?: string | null;
  onHoverKabupaten?: (kode: string | null) => void;
  onSelectKabupaten?: (kode: string | null) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const BACKEND_TO_BPS: Record<string, string> = {
  "180400": "7201", // Banggai
  "180100": "7207", // Banggai Kepulauan
  "181100": "7211", // Banggai Laut
  "180500": "7205", // Buol
  "180200": "7203", // Donggala
  "180700": "7206", // Morowali
  "181200": "7212", // Morowali Utara
  "180800": "7208", // Parigi Moutong
  "180300": "7202", // Poso
  "181000": "7210", // Sigi
  "180900": "7209", // Tojo Una-Una
  "180600": "7204", // Tolitoli
  "186000": "7271", // Kota Palu
};

const KAB_NAMES_TO_BPS: Record<string, string> = {
  "palu": "7271",
  "sigi": "7210",
  "donggala": "7203",
  "parigi moutong": "7208",
  "poso": "7202",
  "tojo una una": "7209",
  "tojo una-una": "7209",
  "morowali": "7206",
  "morowali utara": "7212",
  "banggai": "7201",
  "banggai kepulauan": "7207",
  "banggai laut": "7211",
  "tolitoli": "7204",
  "buol": "7205",
};

const getBpsCode = (item: any): string => {
  const raw = String(item.kode_kabupaten ?? item.kode ?? "").trim();
  if (BACKEND_TO_BPS[raw]) return BACKEND_TO_BPS[raw];
  if (raw.length === 4) return raw;
  const name = (item.kabupaten || item.nama || "")
    .toLowerCase()
    .replace(/^kab\.\s*/i, "")
    .replace(/^kota\s*/i, "")
    .trim();
  return KAB_NAMES_TO_BPS[name] || "";
};

const getRegionLogo = (kabupaten: string) => {
  const isKota = kabupaten.toLowerCase().startsWith("kota");
  let name = kabupaten.replace(/^Kab\.\s*/i, "").replace(/^Kota\s*/i, "").trim();
  if (name.toLowerCase() === "tojo una una") {
    name = "Tojo Una-Una";
  }
  const prefix = isKota ? "Kota" : "Kabupaten";
  return `/images/kabupaten_kota.png/${encodeURIComponent(`${prefix} ${name}`)}.png`;
};

export const PortalCardSectionV2: React.FC<PortalDataCardsProps> = ({
  cards = [],
  onViewRegionDetail,
  activeKode,
  hoveredKode,
  onHoverKabupaten,
  onSelectKabupaten,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [statCards, setStatCards] = useState<any[]>([]);
  const [loadingStat, setLoadingStat] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (cards && cards.length > 0) {
      setStatCards(cards);
      return;
    }
    setLoadingStat(true);
    PemetaanService.getStatistikKabupaten()
      .then((res) => {
        const raw = res?.data;
        if (Array.isArray(raw)) {
          setStatCards(raw);
        } else if (raw && typeof raw === "object") {
          setStatCards(Object.values(raw));
        }
      })
      .catch(console.error)
      .finally(() => setLoadingStat(false));
  }, [cards]);

  // Auto-scroll ke item aktif saat user klik peta
  useEffect(() => {
    if (activeKode && itemRefs.current[activeKode]) {
      itemRefs.current[activeKode]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeKode]);

  const handleKunjungi = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const bps = getBpsCode(item);
    const kodeKab = bps || item.kode_kabupaten || "";
    if (kodeKab) {
      navigate(`/kabupaten/${kodeKab}?wewenang=true`);
    }
  };

  const safeCards = Array.isArray(statCards) ? statCards : Object.values(statCards ?? {});
  const activeCard = activeKode ? safeCards.find((c) => getBpsCode(c) === activeKode) : null;
  const sortedCards = [...safeCards].sort((a, b) => {
    const nameA = (a.kabupaten || a.nama || "").toLowerCase();
    const nameB = (b.kabupaten || b.nama || "").toLowerCase();
    if (nameA.includes("kota palu")) return -1;
    if (nameB.includes("kota palu")) return 1;
    return 0;
  });

  const filteredCards = sortedCards.filter((c) => {
    const name = (c.kabupaten || c.nama || "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // ── Render Collapsed Pill ──
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-lg hover:shadow-xl hover:bg-white hover:scale-105 transition-all duration-200 text-right cursor-pointer"
        title="Buka Daftar Kabupaten & Kota"
      >
        <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        <div className="flex flex-col pl-1">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600">
            Wilayah
          </span>
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
            13 Kab / Kota
          </span>
        </div>
        <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 group-hover:rotate-6 transition-transform">
          <MapPin className="w-4 h-4" />
        </div>
      </button>
    );
  }

  // ── Render Expanded Card ──
  return (
    <div className="relative flex flex-col h-[460px] sm:h-[520px] lg:h-[calc(100vh-6.5rem)] lg:max-h-[620px] lg:min-h-[480px] overflow-hidden rounded-2xl sm:rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-3.5 sm:p-5 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.25)] font-poppins transition-all duration-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.08),_transparent_40%)]" />

      {/* ── Header Kartu (Editorial Style - Opsi 2) ── */}
      <div className="mb-3 shrink-0 px-1 text-center relative">
        <span className="block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 mb-1">
          Tingkat Wilayah
        </span>
        <h3 className="text-base font-extrabold leading-tight tracking-tight text-slate-900 sm:text-lg">
          Portal Dinas Pendidikan
        </h3>
        <p className="mt-0.5 text-xs font-semibold leading-tight text-slate-600">
          Kabupaten dan Kota Sulawesi Tengah
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

      {/* ── Search Input Ringkas ── */}
      <div className="relative mb-2 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Cari kabupaten / kota..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/95 border border-slate-200 rounded-xl py-2 pl-8.5 pr-8 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 shadow-2xs transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── Active Selection Banner with Reset ── */}
      {activeKode && activeCard && (
        <div className="mb-2.5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-50/90 border border-blue-200/80 text-blue-900 shadow-2xs shrink-0 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-black uppercase tracking-wider text-blue-600 leading-none">
                Wilayah Terpilih
              </span>
              <span className="text-xs font-extrabold text-slate-800 truncate leading-tight mt-0.5">
                {activeCard.kabupaten ?? activeCard.nama}
              </span>
            </div>
          </div>
          <button
            onClick={() => onSelectKabupaten?.(null)}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 px-2 py-1 rounded-lg border border-slate-200 hover:border-red-200 transition-all cursor-pointer shrink-0 ml-2 shadow-2xs"
            title="Batalkan pilihan wilayah"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* ── Scrollable list with Two-Way Interactivity ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-hide rounded-xl"
      >
        {loadingStat && (
          <div className="py-12 text-center text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
            Memuat data wilayah...
          </div>
        )}

        {!loadingStat && filteredCards.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-400 font-bold">
            Tidak ada wilayah "{search}"
          </div>
        )}

        {filteredCards.map((item, idx) => {
          const bpsCode = getBpsCode(item);
          const isItemActive = activeKode && bpsCode === activeKode;
          const isItemHovered = hoveredKode && bpsCode === hoveredKode;

          return (
            <div
              key={idx}
              ref={(el) => {
                if (bpsCode) itemRefs.current[bpsCode] = el;
              }}
              onMouseEnter={() => bpsCode && onHoverKabupaten?.(bpsCode)}
              onMouseLeave={() => onHoverKabupaten?.(null)}
              onClick={() => bpsCode && onSelectKabupaten?.(isItemActive ? null : bpsCode)}
              className={`group relative flex flex-col gap-2.5 rounded-2xl border p-3.5 transition-all duration-300 ease-out cursor-pointer ${isItemActive
                ? "border-blue-500 bg-blue-50/70 ring-4 ring-blue-400/25 shadow-lg -translate-y-1"
                : isItemHovered
                  ? "border-blue-400 bg-white ring-2 ring-blue-200/60 shadow-md -translate-y-1"
                  : "border-slate-200/80 bg-white/90 hover:bg-white hover:border-blue-300 hover:shadow-[0_12px_28px_-8px_rgba(37,99,235,0.18)] hover:-translate-y-1"
                }`}
            >
              {/* Header Item */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-12 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50 p-1 group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-sm group-hover:border-blue-200 transition-all duration-300">
                  <img
                    src={getRegionLogo(item.kabupaten ?? item.nama ?? "")}
                    alt={item.kabupaten}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                      Kabupaten / Kota
                    </span>
                    {isItemActive && (
                      <span className="text-[8px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-md">
                        Aktif di Peta
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate group-hover:text-blue-700 transition-colors">
                    {item.kabupaten ?? item.nama}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {(item.total_paud_smp ?? 0).toLocaleString("id-ID")}{" "}
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5">Sekolah PAUD-SMP</span>
                  </p>
                </div>
              </div>

              {/* Mini Stats Breakdown dengan Hover Tactile */}
              <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-100/80 text-center">
                <div className="rounded-lg bg-yellow-50/80 border border-yellow-100/70 py-1 px-1 hover:bg-yellow-100 hover:scale-105 transition-all duration-150 cursor-default">
                  <span className="block text-[8px] font-bold text-yellow-800 uppercase">PAUD</span>
                  <span className="text-[10px] font-black text-slate-800 tabular-nums">
                    {(item.total_paud ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="rounded-lg bg-emerald-50/80 border border-emerald-100/70 py-1 px-1 hover:bg-emerald-100 hover:scale-105 transition-all duration-150 cursor-default">
                  <span className="block text-[8px] font-bold text-emerald-800 uppercase">SD</span>
                  <span className="text-[10px] font-black text-slate-800 tabular-nums">
                    {(item.total_sd ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="rounded-lg bg-blue-50/80 border border-blue-100/70 py-1 px-1 hover:bg-blue-100 hover:scale-105 transition-all duration-150 cursor-default">
                  <span className="block text-[8px] font-bold text-blue-800 uppercase">SMP</span>
                  <span className="text-[10px] font-black text-slate-800 tabular-nums">
                    {(item.total_smp ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Action row dengan Interactive Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9.5px] text-slate-400 font-medium">
                  Negeri: <strong className="text-slate-600 font-semibold">{item.total_negeri ?? 0}</strong> • Swasta: <strong className="text-slate-600 font-semibold">{item.total_swasta ?? 0}</strong>
                </span>

                <button
                  onClick={(e) => handleKunjungi(e, item)}
                  className="flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 px-2.5 py-1 rounded-lg shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  <span>Detail</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer status count ── */}
      <div className="pt-2.5 border-t border-slate-100 text-center shrink-0">
        <span className="text-[10px] font-semibold text-slate-400">
          Menampilkan {filteredCards.length} dari 13 Kabupaten & Kota
        </span>
      </div>
    </div>
  );
};
