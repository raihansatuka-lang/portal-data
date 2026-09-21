import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ChevronDown, ChevronRight, Info, X, Building2, School, MapPin } from "lucide-react";
import { SulawesiMap, CABDIS_CONFIG } from "../Fragments/SulawesiMap";
import { ProyeksiCardV2 } from "./ProyeksiCardSectionV2";
import { PortalCardSectionV2 } from "./PortalCardSectionV2";
import { GeneralDataSection } from "./GeneralDataSection";

interface Props {
  portalData: any;
  proyeksiLoading?: boolean;
}

// ─── Legend Cabdis Interaktif ──────────────────────────────────────────────────
const CabdisLegend: React.FC<{ onNavigate: (slug: string) => void }> = ({ onNavigate }) => (
  <div className="flex flex-wrap items-center justify-center gap-2.5">
    {Object.entries(CABDIS_CONFIG).map(([slug, cfg]) => (
      <button
        key={slug}
        onClick={() => onNavigate(slug)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-white/85 backdrop-blur-sm hover:bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 group cursor-pointer"
        title={cfg.label}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-150"
          style={{ background: cfg.color }}
        />
        <span className="text-[10.5px] font-extrabold text-slate-700 group-hover:text-slate-900 uppercase tracking-wider whitespace-nowrap transition-colors">
          {slug.replace("cabdis-", "Wil. ")}
        </span>
      </button>
    ))}
  </div>
);

export const PortalHeroSectionV2: React.FC<Props> = ({
  portalData,
  proyeksiLoading = false,
}) => {
  const navigate = useNavigate();

  // State sinkronisasi 2 arah antara Peta dan Kartu
  const [activeKode, setActiveKode] = useState<string | null>(null);
  const [hoveredKode, setHoveredKode] = useState<string | null>(null);

  // State collapse panel agar peta bisa dilihat leluasa
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // State modal informasi kewenangan data sekolah
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // State dropdown Cabang Dinas
  const [cabdisOpen, setCabdisOpen] = useState(false);
  const cabdisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cabdisRef.current && !cabdisRef.current.contains(e.target as Node)) {
        setCabdisOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigateCabdis = (slug: string) => {
    const num = slug.replace("cabdis-", "");
    navigate(`/${slug}?name=${encodeURIComponent(`Wilayah ${num}`)}`);
  };

  const handleToggleAllPanels = () => {
    const shouldCollapse = !leftCollapsed || !rightCollapsed;
    setLeftCollapsed(shouldCollapse);
    setRightCollapsed(shouldCollapse);
  };

  return (
    <section className="relative w-full overflow-hidden font-poppins">

      {/* ═══════════════════════════════════════════════════════════════════
          AREA HERO: Peta Sulawesi Tengah + Header + Panel + Cabdis Legend
      ════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[420px] sm:h-[540px] lg:h-[720px] xl:h-[750px] overflow-hidden">

        {/* LAYER 1 — Peta Sulawesi Tengah Imersif Full-Screen dengan Two-Way Sync */}
        <div className="absolute inset-0 z-10">
          <SulawesiMap
            layer="interactive"
            customCenter={[-1.25, 121.25]}
            customZoom={7.3}
            kabupatenStats={portalData?.kabupatenStats ?? []}
            externalActiveKode={activeKode}
            externalHoveredKode={hoveredKode}
            onKabupatenSelect={(kode) => setActiveKode(kode)}
            onKabupatenHover={(kode) => setHoveredKode(kode)}
          />
        </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 2 — Header Bersih, Ramping & Transparan (Sesuai Arahan Pengguna)
      ════════════════════════════════════════════════════════════════════ */}
      <header className="absolute top-0 inset-x-0 z-40 bg-white/60 backdrop-blur-md border-b border-white/60 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between relative">

          {/* Navigasi Kiri: Beranda, Dropdown Cabang Dinas, dan Data Provinsi */}
          <nav className="flex items-center gap-1.5 sm:gap-2 z-10">
            <Link
              to="/"
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-white/90 border border-slate-200/80 shadow-2xs hover:bg-white hover:border-blue-300 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              Beranda
            </Link>

            {/* Dropdown Wilayah Cabang Dinas */}
            <div className="relative" ref={cabdisRef}>
              <button
                onClick={() => setCabdisOpen(!cabdisOpen)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                  cabdisOpen
                    ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                    : "text-slate-700 bg-white/70 hover:bg-white hover:text-blue-700 hover:shadow-xs border border-transparent hover:border-slate-200/80"
                }`}
              >
                <span className="hidden sm:inline">Cabang Dinas</span>
                <span className="sm:hidden">Cabdis</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    cabdisOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                  }`}
                />
              </button>

              {cabdisOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 mb-1 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Pilih Wilayah Cabdis
                    </span>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      6 Wilayah
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {Object.entries(CABDIS_CONFIG).map(([slug, cfg]) => (
                      <button
                        key={slug}
                        onClick={() => {
                          setCabdisOpen(false);
                          handleNavigateCabdis(slug);
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50/90 hover:text-blue-700 hover:pl-3.5 transition-all duration-200 group cursor-pointer"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs group-hover:scale-150 transition-transform duration-200"
                          style={{ background: cfg.color }}
                        />
                        <span className="truncate">{cfg.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-blue-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/provinsi"
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white/70 hover:bg-white hover:text-blue-700 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 border border-transparent hover:border-slate-200/80 transition-all duration-200"
            >
              Data Provinsi
            </Link>
          </nav>

          {/* Logo Brand Resmi di Tengah (Dead-Center, Hidden on Mobile) */}
          <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-auto">
            <Link to="/" title="Berani Cerdas - Dinas Pendidikan Provinsi Sulawesi Tengah">
              <img
                src="/logo.png"
                alt="Logo Portal Pemetaan"
                className="h-8 sm:h-9 object-contain drop-shadow-2xs hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </Link>
          </div>

          {/* Sisi Kanan: Kontrol Panel & Info Kewenangan */}
          <div className="flex items-center gap-1.5 sm:gap-2 z-10">
            {/* Tombol Panduan Kewenangan Data */}
            <button
              onClick={() => setInfoModalOpen(true)}
              className="group flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100/90 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-200/80 transition-all duration-200 shadow-2xs cursor-pointer"
              title="Panduan Pembagian Data Sekolah (UU No. 23/2014)"
            >
              <Info className="w-3.5 h-3.5 text-blue-600 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
              <span className="hidden md:inline">Info Kewenangan</span>
            </button>

            <button
              onClick={handleToggleAllPanels}
              className="group flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/85 hover:bg-white hover:shadow-xs hover:-translate-y-0.5 active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/80 transition-all duration-200 shadow-2xs cursor-pointer"
              title="Sembunyikan / Tampilkan Panel"
            >
              {leftCollapsed && rightCollapsed ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-600 transition-transform duration-200 group-hover:scale-110" />
                  <span className="hidden sm:inline">Buka Panel</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover:scale-110" />
                  <span className="hidden sm:inline">Sembunyikan Panel</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL PANDUAN PEMBAGIAN DATA SEKOLAH (RAMAH PENGGUNA AWAM)
      ════════════════════════════════════════════════════════════════════ */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 font-poppins">
            {/* Close button */}
            <button
              onClick={() => setInfoModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Panduan Pembagian Data Sekolah
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Berdasarkan UU No. 23 Tahun 2014 tentang Pemerintahan Daerah
                </p>
              </div>
            </div>

            {/* 3 Pillars */}
            <div className="space-y-2.5 my-4">
              {/* Pillar 1: Pemprov */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-50/70 border border-purple-100">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-purple-900 block mb-0.5">
                    1. Panel Kiri — Kewenangan Provinsi
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Menampilkan data jenjang <strong>SMA, SMK, dan SLB</strong> yang dikelola langsung oleh <strong>Dinas Pendidikan Provinsi Sulawesi Tengah</strong> melalui 6 Cabang Dinas.
                  </p>
                </div>
              </div>

              {/* Pillar 2: Pemkab/Pemkot */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <School className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-blue-900 block mb-0.5">
                    2. Panel Kanan — Kewenangan Kabupaten / Kota
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Menampilkan data jenjang <strong>PAUD, SD, dan SMP</strong> yang dikelola oleh masing-masing <strong>Dinas Pendidikan di 13 Kabupaten & Kota</strong>.
                  </p>
                </div>
              </div>

              {/* Pillar 3: Peta GIS */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-emerald-900 block mb-0.5">
                    3. Peta Geospasial Terpadu (Latar Belakang)
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Mengintegrasikan <strong>seluruh satuan pendidikan (semua jenjang)</strong> di Sulawesi Tengah dalam satu peta interaktif terpadu.
                  </p>
                </div>
              </div>
            </div>

            {/* Close CTA */}
            <div className="mt-4">
              <button
                onClick={() => setInfoModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 4 — Card Kiri: Ringkasan Jenjang Provinsi (Proporsional)
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`absolute left-6 top-20 z-30 hidden lg:block transition-all duration-300 ${leftCollapsed ? "w-auto" : "w-[300px] xl:w-[320px]"}`}>
        <ProyeksiCardV2
          smaProvinsiStats={portalData?.smaProvinsiStats}
          isLoading={proyeksiLoading}
          isCollapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 4 — Card Kanan: 13 Kab/Kota + Two-Way Sync (Proporsional)
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`absolute right-6 top-20 z-30 hidden lg:block transition-all duration-300 ${rightCollapsed ? "w-auto" : "w-[300px] xl:w-[320px]"}`}>
        <PortalCardSectionV2
          cards={portalData?.cards ?? []}
          activeKode={activeKode}
          hoveredKode={hoveredKode}
          onHoverKabupaten={(kode) => setHoveredKode(kode)}
          onSelectKabupaten={(kode) => setActiveKode(kode)}
          isCollapsed={rightCollapsed}
          onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
        />
      </div>

        {/* ═══════════════════════════════════════════════════════════════════
            LAYER 4 — Legend Cabdis Floating di Bawah Pulau Peta (Desktop)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 hidden lg:flex justify-center pointer-events-auto">
          <div className="inline-flex flex-col items-center gap-2 px-5 py-2.5 rounded-[1.25rem] bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md hover:shadow-lg transition-all">
            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">
              Peta Wilayah Cabang Dinas — Klik untuk Kunjungi
            </span>
            <CabdisLegend onNavigate={handleNavigateCabdis} />
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          KONTEN BAWAH (Mobile Cards, Data Umum & Footer)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-30 w-full flex flex-col bg-slate-50/70 border-t border-slate-200/60 pt-6">

        {/* Mobile cards & Mobile cabdis legend */}
        <div className="lg:hidden flex flex-col gap-4 sm:gap-5 px-3.5 sm:px-6 pb-6">
          <div className="w-full flex justify-center pb-1">
            <div className="inline-flex flex-col items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xs w-full">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">
                Peta Wilayah Cabang Dinas — Klik untuk Kunjungi
              </span>
              <CabdisLegend onNavigate={handleNavigateCabdis} />
            </div>
          </div>

          <ProyeksiCardV2
            smaProvinsiStats={portalData?.smaProvinsiStats}
            isLoading={proyeksiLoading}
          />
          <PortalCardSectionV2
            cards={portalData?.cards ?? []}
            activeKode={activeKode}
            hoveredKode={hoveredKode}
            onHoverKabupaten={(kode) => setHoveredKode(kode)}
            onSelectKabupaten={(kode) => setActiveKode(kode)}
          />
        </div>

        {/* ── Matriks Data Umum Satuan Pendidikan Asli ── */}
        <div className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 pb-8">
          <GeneralDataSection data={portalData?.summary} />
        </div>

        {/* Footer */}
        <footer className="w-full py-4 text-center text-xs opacity-50 shrink-0">
          &copy; 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah
        </footer>
      </div>

    </section>
  );
};
