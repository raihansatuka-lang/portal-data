import { useEffect, useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { PemetaanService } from "@/services/pemetaanService";
import { Skeleton } from "@/components/Elements/Skeleton/Skeleton";

export const Home = () => {
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch landing + statistik kabupaten + jenjang secara paralel
      const [landingRes, statKabRes, statJenjangRes] = await Promise.all([
        PemetaanService.getLanding(),
        PemetaanService.getStatistikKabupaten(),
        PemetaanService.getStatistikJenjang(),
      ]);

      const summary      = landingRes?.data?.summary;
      const cards        = landingRes?.data?.cards ?? [];
      const neracaRekap  = landingRes?.data?.neracaRekap ?? [];
      // Data statistik per kabupaten untuk marker peta
      const kabupatenStats = statKabRes?.data ?? [];
      // Data statistik per jenjang untuk card provinsi
      const jenjangStats = statJenjangRes?.data ?? [];

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
          // Field GTK — belum ada, isi 0
          total_rombel  : 0,
          total_guru    : 0,
          total_tendik  : 0,
          total_pegawai : 0,
        },

        // Statistik per kabupaten → dipakai marker peta
        kabupatenStats,

        // Statistik per jenjang → dipakai ProyeksiCard (card kiri)
        jenjangStats,

        // Cards per kabupaten → dipakai PortalDataCards
        cards,

        // Neraca rekap per jenjang
        neracaRekap,

        // Projections — belum ada endpoint, null agar ProyeksiCard tidak error
        projections: null,
      });
    } catch (error) {
      console.error("Gagal fetch data landing:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
