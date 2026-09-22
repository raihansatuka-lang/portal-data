import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ChevronDown, ChevronRight, Info, X, Building2, School, MapPin, Menu } from "lucide-react";
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
  <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 w-full">
    {Object.entries(CABDIS_CONFIG).map(([slug, cfg]) => (
      <button
        key={slug}
        onClick={() => onNavigate(slug)}
        className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-white/85 backdrop-blur-sm hover:bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 group cursor-pointer"
        title={cfg.label}
      >
        <span
          className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-150"
          style={{ background: cfg.color }}
        />
        <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-700 group-hover:text-slate-900 uppercase tracking-wider whitespace-nowrap transition-colors">
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

  // State tab kartu di mobile (Provinsi vs Kab/Kota)
  const [mobileSectionTab, setMobileSectionTab] = useState<"provinsi" | "kabupaten">("provinsi");

  // State menu hamburger mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Deteksi layar mobile untuk posisi tengah & zoom peta optimal
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Center geografis Sulawesi Tengah:
  // - Di mobile: [-0.75, 121.5] dengan zoom 5.9 menampilkan seluruh provinsi (Tolitoli/Buol di utara sampai Morowali di selatan) tepat di tengah layar tanpa terpotong!
  // - Di desktop: [-1.25, 121.25] dengan zoom 7.3
  const mapCenter: [number, number] = isMobile ? [-0.75, 121.5] : [-1.25, 121.25];
  const mapZoom: number = isMobile ? 5.9 : 7.3;

  return (
    <section className="relative w-full overflow-hidden font-poppins">

      {/* ═══════════════════════════════════════════════════════════════════
          AREA HERO: Peta Sulawesi Tengah + Header + Panel + Cabdis Legend
      ════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[360px] sm:h-[460px] lg:h-[720px] xl:h-[750px] overflow-hidden">

        {/* LAYER 1 — Peta Sulawesi Tengah Imersif Full-Screen dengan Two-Way Sync */}
        <div className="absolute inset-0 z-10">
          <SulawesiMap
            layer="interactive"
            customCenter={mapCenter}
            customZoom={mapZoom}
            kabupatenStats={portalData?.kabupatenStats ?? []}
            externalActiveKode={activeKode}
            externalHoveredKode={hoveredKode}
            onKabupatenSelect={(kode) => setActiveKode(kode)}
            onKabupatenHover={(kode) => setHoveredKode(kode)}
          />
        </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 2 — Header Bersih, Ramping & Transparan
      ════════════════════════════════════════════════════════════════════ */}
      <header className="absolute top-0 inset-x-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/60 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between relative">

          {/* ── Desktop Navigasi Kiri (Hidden on Mobile) ── */}
          <nav className="hidden lg:flex items-center gap-2 z-10">
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-white/90 border border-slate-200/80 shadow-2xs hover:bg-white hover:border-blue-300 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              Beranda
            </Link>

            {/* Dropdown Wilayah Cabang Dinas (Desktop) */}
            <div className="relative" ref={cabdisRef}>
              <button
                onClick={() => setCabdisOpen(!cabdisOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                  cabdisOpen
                    ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                    : "text-slate-700 bg-white/70 hover:bg-white hover:text-blue-700 hover:shadow-xs border border-transparent hover:border-slate-200/80"
                }`}
              >
                <span>Cabang Dinas</span>
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
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white/70 hover:bg-white hover:text-blue-700 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 border border-transparent hover:border-slate-200/80 transition-all duration-200"
            >
              Data Provinsi
            </Link>
          </nav>

          {/* ── Mobile Brand Sisi Kiri (Visible on Mobile) ── */}
          <div className="flex lg:hidden items-center z-10 min-w-0 pr-2">
            <Link to="/" className="flex items-center min-w-0" title="Portal Data Pemetaan Sekolah">
              {!logoError ? (
                <img
                  src="/logo.png"
                  alt="Portal Data Pemetaan Sekolah"
                  className="h-6 sm:h-7.5 w-auto max-w-[210px] xs:max-w-[250px] sm:max-w-[280px] object-contain shrink"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                    <School className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight whitespace-nowrap">
                    Portal Data Pemetaan Sekolah
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Logo Brand Resmi di Tengah (Desktop Dead-Center) */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-auto">
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

          {/* Sisi Kanan: Kontrol Panel, Info Kewenangan, & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 z-10 shrink-0">
            {/* Tombol Panduan Kewenangan Data (Visible on sm & up, inside hamburger on mobile) */}
            <button
              onClick={() => setInfoModalOpen(true)}
              className="hidden sm:flex group items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100/90 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-200/80 transition-all duration-200 shadow-2xs cursor-pointer shrink-0"
              title="Panduan Pembagian Data Sekolah (UU No. 23/2014)"
            >
              <Info className="w-3.5 h-3.5 text-blue-600 transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110" />
              <span className="hidden md:inline">Info Kewenangan</span>
            </button>

            {/* Desktop Panel Toggle */}
            <button
              onClick={handleToggleAllPanels}
              className="hidden lg:flex group items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/85 hover:bg-white hover:shadow-xs hover:-translate-y-0.5 active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/80 transition-all duration-200 shadow-2xs cursor-pointer"
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

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-white/90 hover:bg-white border border-slate-200/90 text-slate-700 hover:text-blue-600 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              aria-label="Buka Menu Navigasi"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* ── Mobile Hamburger Dropdown Menu ── */}
        {mobileMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-2xs animate-in fade-in duration-150"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-2xl px-4 py-3.5 animate-in slide-in-from-top-2 duration-200 z-50 flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/90 border border-blue-100/90"
              >
                <School className="w-4 h-4 text-blue-600" />
                <span>Beranda Portal</span>
              </Link>

              <Link
                to="/provinsi"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 border border-slate-200/80 transition-colors"
              >
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Data Tingkat Provinsi (SMA / SMK / SLB)</span>
              </Link>

              {/* Panduan Kewenangan Data Sekolah */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setInfoModalOpen(true);
                }}
                className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50/80 hover:text-blue-700 border border-slate-200/80 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Panduan Kewenangan Data (UU 23/2014)</span>
                </div>
                <span className="text-[9.5px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md shrink-0">
                  Info
                </span>
              </button>

              <div className="pt-2.5 mt-0.5 border-t border-slate-100">
                <span className="block px-1 text-[9.5px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Wilayah Cabang Dinas (Pilih untuk Kunjungi)
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(CABDIS_CONFIG).map(([slug, cfg]) => (
                    <button
                      key={slug}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleNavigateCabdis(slug);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-left bg-slate-50 hover:bg-blue-50/80 border border-slate-200/70 transition-colors cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ background: cfg.color }}
                      />
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {cfg.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
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
        <div className="lg:hidden flex flex-col gap-3.5 px-3.5 sm:px-6 pb-6">
          {/* Legend Cabdis 3x2 Grid */}
          <div className="w-full flex justify-center pb-0.5">
            <div className="inline-flex flex-col items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xs w-full">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 text-center">
                Peta Wilayah Cabang Dinas — Klik untuk Kunjungi
              </span>
              <CabdisLegend onNavigate={handleNavigateCabdis} />
            </div>
          </div>

          {/* Mobile Tab Switcher (Segmented Control) */}
          <div className="flex p-1 bg-slate-200/80 backdrop-blur-md rounded-2xl border border-slate-300/60 shadow-inner">
            <button
              onClick={() => setMobileSectionTab("provinsi")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mobileSectionTab === "provinsi"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Jenjang Provinsi</span>
            </button>
            <button
              onClick={() => setMobileSectionTab("kabupaten")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mobileSectionTab === "kabupaten"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <School className="w-4 h-4" />
              <span>13 Kab / Kota</span>
            </button>
          </div>

          {/* Tab Content (Tanpa Scroll Trap) */}
          {mobileSectionTab === "provinsi" ? (
            <ProyeksiCardV2
              smaProvinsiStats={portalData?.smaProvinsiStats}
              isLoading={proyeksiLoading}
            />
          ) : (
            <PortalCardSectionV2
              cards={portalData?.cards ?? []}
              activeKode={activeKode}
              hoveredKode={hoveredKode}
              onHoverKabupaten={(kode) => setHoveredKode(kode)}
              onSelectKabupaten={(kode) => setActiveKode(kode)}
            />
          )}
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
