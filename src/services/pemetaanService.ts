import { api_pemetaan } from "@/config/api";
import type {
  PemetaanLandingData,
  SekolahListResponse,
  SekolahDetailResponse,
  StatistikKabupatenResponse,
  StatistikJenjangResponse,
  CabangDinasResponse,
} from "@/types";

export const PemetaanService = {
  // ── Public ────────────────────────────────────────────────────────────────

  /** Data ringkasan untuk halaman utama publik */
  getLanding: (): Promise<PemetaanLandingData> =>
    api_pemetaan.get("/v1/portal/landing"),

  /**
   * List sekolah untuk marker peta (max 5000 record).
   * @param params - Filter opsional: jenjang, kode_kabupaten, is_3t
   */
  getSekolah: (params?: {
    jenjang?: string;
    kode_kabupaten?: string;
    is_3t?: boolean;
  }): Promise<SekolahListResponse> =>
    api_pemetaan.get("/v1/sekolah", { params }),

  /**
   * Detail satu sekolah berdasarkan NPSN, termasuk relasi detailSma.
   * @param npsn - Nomor Pokok Sekolah Nasional
   */
  getSekolahDetail: (npsn: string): Promise<SekolahDetailResponse> =>
    api_pemetaan.get(`/v1/sekolah/${npsn}`),

  /** Statistik aggregat per kabupaten/kota */
  getStatistikKabupaten: (): Promise<StatistikKabupatenResponse> =>
    api_pemetaan.get("/v1/statistik/kabupaten"),

  /** Statistik aggregat per jenjang pendidikan */
  getStatistikJenjang: (): Promise<StatistikJenjangResponse> =>
    api_pemetaan.get("/v1/statistik/jenjang"),

  /** Statistik SMA/SMK/SLB dari tabel school_sma (kewenangan Provinsi) */
  getStatistikSmaProvinsi: (): Promise<StatistikJenjangResponse> =>
    api_pemetaan.get("/v1/statistik/sma-provinsi"),

  /** List semua cabang dinas dengan konfigurasi peta */
  getCabangDinas: (): Promise<CabangDinasResponse> =>
    api_pemetaan.get("/v1/cabang-dinas"),

  /**
   * Data peta untuk halaman detail wilayah/cabang dinas.
   * Mengembalikan daftar sekolah di kabupaten wilayah + data cabdis.
   * @param slug - Slug cabdis, contoh: "cabdis-1"
   */
  getRegionDetail: (slug: string): Promise<any> =>
    api_pemetaan.get(`/v1/portal/region-detail?slug=${slug}`),

  /**
   * Data peta & sekolah terdekat untuk halaman detail sekolah.
   * @param npsn - NPSN sekolah
   */
  getSchoolMapData: (npsn: string): Promise<any> =>
    api_pemetaan.get(`/v1/portal/school-map-data/${npsn}`),

  /**
   * Detail lengkap sekolah termasuk stats, polygon gedung.
   * @param npsn - NPSN sekolah
   */
  getSchoolDetail: (npsn: string): Promise<any> =>
    api_pemetaan.get(`/v1/portal/school-detail/${npsn}`),

  // ── Auth ──────────────────────────────────────────────────────────────────

  login: (email: string, password: string): Promise<any> =>
    api_pemetaan.post("/v1/login", { email, password }),

  logout: (): Promise<any> =>
    api_pemetaan.post("/v1/logout"),

  getUser: (): Promise<any> =>
    api_pemetaan.get("/v1/user"),
};
