import { useEffect, useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PemetaanService } from "@/services/pemetaanService";
import { Skeleton } from "@/components/Elements/Skeleton/Skeleton";

export const Home = () => {
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [landingRes, statKabRes, statSmaRes] = await Promise.all([
          PemetaanService.getLanding(),
          PemetaanService.getStatistikKabupaten(),
          PemetaanService.getStatistikSmaProvinsi(),
        ]);

        const summary          = landingRes?.data?.summary;
        const cards            = Array.isArray(landingRes?.data?.cards)
                                   ? landingRes.data.cards
                                   : [];
        const kabupatenStats   = Array.isArray(statKabRes?.data)
                                   ? statKabRes.data
                                   : [];
        const smaProvinsiStats = Array.isArray(statSmaRes?.data)
                                   ? statSmaRes.data
                                   : [];

        setPortalData({
          summary: {
            total_sekolah : summary?.total_sekolah ?? 0,
            total_sd      : summary?.total_sd      ?? 0,
            total_smp     : summary?.total_smp     ?? 0,
            total_sma     : summary?.total_sma     ?? 0,
            total_paud    : summary?.total_paud    ?? 0,
            total_3t      : summary?.total_3t      ?? 0,
            total_negeri  : summary?.total_negeri  ?? 0,
            total_swasta  : summary?.total_swasta  ?? 0,
            total_siswa   : summary?.total_siswa   ?? 0,
            semester_id   : summary?.semester_id,
            total_rombel  : 0,
            total_guru    : 0,
            total_tendik  : 0,
            total_pegawai : 0,
          },
          kabupatenStats,
          cards,
          smaProvinsiStats,
          projections: null,
        });
      } catch (error) {
        console.error("Gagal fetch data landing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen p-10 bg-gray-50 flex flex-col gap-6">
        <Skeleton className="w-full h-[60vh] rounded-[40px]" />
        <div className="flex gap-6 h-[30vh]">
          <Skeleton className="w-1/3 h-full" />
          <Skeleton className="w-1/3 h-full" />
          <Skeleton className="w-1/3 h-full" />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      portalData={portalData}
      onFilterChange={() => {}}
      onProyeksiFilterChange={() => {}}
      proyeksiLoading={false}
    />
  );
};
