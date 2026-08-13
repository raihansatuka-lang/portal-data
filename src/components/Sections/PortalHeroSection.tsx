import React from "react";
import { useNavigate } from "react-router-dom";
import { SulawesiMap, CABDIS_CONFIG } from "../Fragments/SulawesiMap";
import { ProyeksiCard } from "./ProyeksiCardSection";
import { PortalDataCards } from "./PortalCardSection";

interface Props {
  portalData: any;
  onViewRegionDetail: (marker: any) => void;
  onProyeksiFilterChange?: (range: "monthly" | "yearly", month?: number) => void;
  onOpenProyeksiDetail?: (category: string) => void;
  onOpenJatuhTempoDetail?: (category: string) => void;
  proyeksiLoading?: boolean;
}

// ─── Legend Cabdis ────────────────────────────────────────────────────────────
const CabdisLegend: React.FC<{ onNavigate: (slug: string) => void }> = ({ onNavigate }) => (
  <div className="flex flex-wrap items-center justify-center gap-2">
    {Object.entries(CABDIS_CONFIG).map(([slug, cfg]) => (
      <button
        key={slug}
        onClick={() => onNavigate(slug)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/60 bg-white/70 backdrop-blur-sm hover:bg-white/95 hover:shadow-md transition-all duration-200 group cursor-pointer"
        title={cfg.label}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm group-hover:scale-125 transition-transform"
          style={{ background: cfg.color }}
        />
        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
          {slug.replace("cabdis-", "Wil. ")}
        </span>
      </button>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const PortalHeroSection: React.FC<Props> = ({
  portalData,
  onViewRegionDetail,
  onProyeksiFilterChange,
  onOpenProyeksiDetail,
  onOpenJatuhTempoDetail,
  proyeksiLoading,
}) => {
  const navigate = useNavigate();

  const handleViewRegionDetail = (region: any) => {
    if (onViewRegionDetail) {
      onViewRegionDetail(region);
    } else {
      const slug = region.slug ?? "cabdis-1";
      navigate(`/${slug}?name=${encodeURIComponent(region.name ?? region.kabupaten ?? "")}`);
    }
  };

  const handleNavigateCabdis = (slug: string) => {
    const num = slug.replace("cabdis-", "");
    navigate(`/${slug}?name=${encodeURIComponent(`Wilayah ${num}`)}`);
  };

  const schoolSummary = portalData?.school_reports;

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: "100vh" }}>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 1 — Peta interaktif Sulawesi Tengah (Full Screen Background)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-10">
        <SulawesiMap
          layer="interactive"
          kabupatenStats={portalData?.kabupatenStats ?? []}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 2 — Logo di tengah atas
      ════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <img src="/logo.png" className="h-12 object-contain" alt="Logo Portal" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 3 — Card Kiri (Floating, z-30, tidak menutupi peta)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="absolute left-6 top-24 z-30 w-[280px] xl:w-[300px] hidden lg:block">
        <ProyeksiCard
          jenjangStats={portalData?.jenjangStats ?? []}
          isLoading={proyeksiLoading}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 3 — Cards Kanan (Floating, z-30, tidak menutupi peta)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="absolute right-6 top-24 z-30 w-[280px] xl:w-[300px] hidden lg:block">
        <PortalDataCards
          cards={portalData?.cards ?? []}
          onViewRegionDetail={handleViewRegionDetail}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 4 — Spacer untuk mengalokasikan ruang peta (push konten ke bawah)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-0 w-full" style={{ height: "70vh", minHeight: "580px" }} aria-hidden="true" />

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 5 — Content bawah (bisa di-scroll)
      ════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-30 w-full flex flex-col">

        {/* Mobile cards (tampil di mobile, hidden di desktop) */}
        <div className="lg:hidden flex flex-col gap-5 px-6 pb-6">
          <ProyeksiCard
            jenjangStats={portalData?.jenjangStats ?? []}
            isLoading={proyeksiLoading}
          />
          <PortalDataCards
            cards={portalData?.cards ?? []}
            onViewRegionDetail={handleViewRegionDetail}
          />
        </div>

        {/* ── Legend Cabdis — di tengah ── */}
        <div className="w-full flex justify-center px-6 pb-5">
          <div className="inline-flex flex-col items-center gap-2 px-5 py-3 rounded-[1.5rem] bg-white/75 backdrop-blur-md border border-white/70 shadow-lg">
            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">
              Peta Wilayah Cabang Dinas — Klik untuk Kunjungi
            </span>
            <CabdisLegend onNavigate={handleNavigateCabdis} />
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full py-4 text-center text-xs opacity-40 shrink-0">
          &copy; 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah
        </footer>
      </div>
    </section>
  );
};
