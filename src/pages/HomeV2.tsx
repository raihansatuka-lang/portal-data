import { useEffect, useState } from "react";
import { PemetaanService } from "@/services/pemetaanService";
import { Skeleton } from "@/components/Elements/Skeleton/Skeleton";
import { PortalHeroSectionV2 } from "@/components/Sections/PortalHeroSectionV2";
import { TrackingSidebar } from "@/components/Fragments/TrackingSidebar";
import { DetailSidebar } from "@/components/Fragments/DetailSidebar";
import { ServiceDetailModal } from "@/components/Fragments/ServiceDetailModal";
import { GtkDrilldownSidebar } from "@/components/Fragments/GtkDrilldownSidebar";
import { GtkDetailSidebar } from "@/components/Analytics/GtkDetailSidebar";
import { CategoryProjectionSidebar } from "@/components/Fragments/CategoryProjectionSidebar";
import { SchoolReportSidebar } from "@/components/Fragments/SchoolReportSidebar";
import { JatuhTempoSidebar } from "@/components/Fragments/JatuhTempoSidebar";
import { RegionProjectionSidebar } from "@/components/Fragments/RegionProjectionSidebar";
import type { DetailData } from "@/types";

export const HomeV2 = () => {
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState<any>(null);

  // Sidebar & Modal states
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [activeDetail, setActiveDetail] = useState<{
    type: "subject" | "region";
    id: string | number;
    title: string;
  } | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isServiceDetailOpen, setIsServiceDetailOpen] = useState(false);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [isSchoolReportsOpen, setIsSchoolReportsOpen] = useState(false);
  const [selectedCabdisForSummary, setSelectedCabdisForSummary] = useState<any>(null);
  const [activeCategoryDetail, setActiveCategoryDetail] = useState<string | null>(null);
  const [activeJatuhTempoDetail, setActiveJatuhTempoDetail] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Portal Pemetaan Sekolah - Dinas Pendidikan Provinsi Sulawesi Tengah";
    const fetchData = async () => {
      try {
        const [landingRes, statKabRes, statSmaRes] = await Promise.all([
          PemetaanService.getLanding(),
          PemetaanService.getStatistikKabupaten(),
          PemetaanService.getStatistikSmaProvinsi(),
        ]);

        const summary = landingRes?.data?.summary;
        const cards = Array.isArray(landingRes?.data?.cards) ? landingRes.data.cards : [];
        const kabupatenStats = Array.isArray(statKabRes?.data) ? statKabRes.data : [];
        const smaProvinsiStats = Array.isArray(statSmaRes?.data) ? statSmaRes.data : [];

        setPortalData({
          summary: {
            total_sekolah: summary?.total_sekolah ?? 0,
            total_sd: summary?.total_sd ?? 0,
            total_smp: summary?.total_smp ?? 0,
            total_sma: summary?.total_sma ?? 0,
            total_paud: summary?.total_paud ?? 0,
            total_3t: summary?.total_3t ?? 0,
            total_negeri: summary?.total_negeri ?? 0,
            total_swasta: summary?.total_swasta ?? 0,
            total_siswa: summary?.total_siswa ?? 0,
            semester_id: summary?.semester_id,
            total_rombel: 0,
            total_guru: 0,
            total_tendik: 0,
            total_pegawai: 0,
          },
          kabupatenStats,
          cards,
          smaProvinsiStats,
          projections: null,
        });
      } catch (error) {
        console.error("Gagal fetch data landing V2:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen p-10 bg-gray-50 flex flex-col gap-6 font-poppins">
        <Skeleton className="w-full h-[60vh] rounded-[40px]" />
        <div className="flex gap-6 h-[30vh]">
          <Skeleton className="w-1/3 h-full rounded-3xl" />
          <Skeleton className="w-1/3 h-full rounded-3xl" />
          <Skeleton className="w-1/3 h-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-y-auto text-content font-poppins selection:bg-blue-600 selection:text-white scroll-smooth scrollbar-hide">
      {/* Background Wallpaper */}
      <img
        src="/images/cmd/bc-cmdcenter-bg.webp"
        alt="Portal Background"
        className="fixed inset-0 object-cover object-center w-full h-full opacity-15 pointer-events-none select-none z-0"
      />

      {/* Sidebars & Modals */}
      <GtkDetailSidebar
        isOpen={!!activeDetail}
        onClose={() => setActiveDetail(null)}
        type={activeDetail?.type || "subject"}
        id={activeDetail?.id || ""}
        title={activeDetail?.title || ""}
      />

      <DetailSidebar
        isOpen={!!detailData}
        onClose={() => setDetailData(null)}
        detailData={detailData}
      />

      <TrackingSidebar
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />

      <ServiceDetailModal
        isOpen={isServiceDetailOpen}
        onClose={() => setIsServiceDetailOpen(false)}
        initialTab="guru_sma"
      />

      <GtkDrilldownSidebar
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        filters={{
          kabupaten_kota: "",
          cabdis: "",
          sekolah: "",
        }}
        onFilterChange={() => {}}
      />

      <CategoryProjectionSidebar
        isOpen={!!activeCategoryDetail}
        onClose={() => setActiveCategoryDetail(null)}
        data={{}}
        initialCategory={activeCategoryDetail || "berkala"}
        currentMonth={currentMonth}
        onMonthChange={(m) => setCurrentMonth(m)}
        isLoading={false}
      />

      <JatuhTempoSidebar
        isOpen={!!activeJatuhTempoDetail}
        onClose={() => setActiveJatuhTempoDetail(null)}
        data={{}}
        initialCategory={activeJatuhTempoDetail || "semua"}
        isLoading={false}
      />

      <RegionProjectionSidebar
        isOpen={!!selectedCabdisForSummary}
        onClose={() => setSelectedCabdisForSummary(null)}
        regionId={selectedCabdisForSummary?.id}
        regionSlug={selectedCabdisForSummary?.slug}
        regionName={selectedCabdisForSummary?.name}
        currentMonth={currentMonth}
        onMonthChange={(m) => setCurrentMonth(m)}
      />

      <SchoolReportSidebar
        isOpen={isSchoolReportsOpen}
        onClose={() => setIsSchoolReportsOpen(false)}
        currentMonth={currentMonth}
      />

      {/* Main V2 Content */}
      <main className="w-full bg-transparent min-h-screen relative z-10 overflow-x-hidden">
        <PortalHeroSectionV2
          portalData={portalData}
          onViewRegionDetail={(marker) => {
            const slug = marker.slug ?? "cabdis-1";
            window.location.href = `/${slug}?name=${encodeURIComponent(marker.name ?? marker.kabupaten ?? "")}`;
          }}
          onProyeksiFilterChange={() => {}}
          onOpenProyeksiDetail={(cat) => setActiveCategoryDetail(cat)}
          onOpenJatuhTempoDetail={(cat) => setActiveJatuhTempoDetail(cat)}
          onOpenSchoolReports={() => setIsSchoolReportsOpen(true)}
          proyeksiLoading={false}
          currentMonth={currentMonth}
        />
      </main>
    </div>
  );
};
export default HomeV2;
