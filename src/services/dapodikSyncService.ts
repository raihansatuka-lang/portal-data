import axios from "axios";

export interface DapodikKabupatenItem {
  id: number;
  no: number;
  kabupaten_kota: string;
  jumlah_sekolah: number;
  jumlah_pd: number;
  jumlah_gtk: number;
  sudah_sinkron: number;
  belum_sinkron: number;
  persentase: number;
  file_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DapodikSummary {
  total_kabupaten: number;
  total_sekolah: number;
  total_pd: number;
  total_gtk: number;
  total_sudah_sinkron: number;
  total_belum_sinkron: number;
  persentase_rata_rata: number;
  last_file_name?: string;
  last_updated_at?: string;
}

export interface DapodikSyncApiResponse {
  status: string;
  message: string;
  data: DapodikKabupatenItem[];
  summary: DapodikSummary;
}

const API_DAPODIK_URL =
  "https://service-pulpen.sekolahkukeren.id/api/v1/portal/sinkronisasi-dapodik-semua";

// In-memory cache agar tidak membebani network pada navigasi antar halaman
let cachedResponse: DapodikSyncApiResponse | null = null;
let fetchPromise: Promise<DapodikSyncApiResponse | null> | null = null;

export const DapodikSyncService = {
  /**
   * Fetch data sinkronisasi Dapodik semua kewenangan se-Sulteng.
   */
  getSinkronisasiSemua: async (): Promise<DapodikSyncApiResponse | null> => {
    if (cachedResponse) return cachedResponse;
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
      try {
        const response = await axios.get<DapodikSyncApiResponse>(API_DAPODIK_URL, {
          timeout: 10000,
        });
        if (response.data && response.data.status === "success") {
          cachedResponse = response.data;
          return response.data;
        }
        return null;
      } catch (err) {
        console.warn("[DapodikSyncService] Gagal memuat data sinkronisasi Dapodik:", err);
        return null;
      } finally {
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  },

  /**
   * Helper pencarian data Dapodik per kabupaten/kota.
   * Toleran terhadap awalan "Kab.", "Kabupaten", "Kota".
   */
  findKabupaten: (
    items: DapodikKabupatenItem[],
    rawKabName?: string | null
  ): DapodikKabupatenItem | null => {
    if (!rawKabName || !items || !items.length) return null;

    const clean = (s: string) =>
      s
        .toLowerCase()
        .replace(/^(kabupaten|kab\.|kota)\s+/i, "")
        .trim();

    const target = clean(rawKabName);
    return items.find((item) => clean(item.kabupaten_kota) === target) || null;
  },
};
