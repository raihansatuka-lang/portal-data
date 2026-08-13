export interface DetailData {
  type: string;
  title: string;
  data: any; // Can be detailed list array or object
}

// ─── Pemetaan API Response Interfaces ────────────────────────────────────────

/** Response dari GET /api/v1/portal/landing */
export interface PemetaanLandingData {
  status: string;
  data: {
    summary: {
      total_sekolah: number;
      total_sd: number;
      total_smp: number;
      total_sma: number;
      total_paud: number;
      total_3t: number;
      total_negeri: number;
      total_swasta: number;
      total_siswa: number;
      semester_id: string | null;
    };
    cards: {
      kabupaten: string;
      kode_kabupaten: string;
      total_sekolah: number;
    }[];
    neracaRekap: {
      bentuk_pendidikan: string;
      jumlah: number;
    }[];
  };
}

/** Satu item sekolah dari GET /api/v1/sekolah (untuk marker peta) */
export interface SekolahMarker {
  npsn: string;
  nama: string;
  bentuk_pendidikan: string;
  alamat_jalan: string;
  kecamatan: string;
  kabupaten: string;
  kode_kabupaten: string;
  lintang: number | null;
  bujur: number | null;
  is_3t: boolean;
  is_sekolah_alam: boolean;
  jumlah_siswa: number;
  daya_tampung: number;
  status_sekolah: string;
}

/** Response dari GET /api/v1/sekolah */
export interface SekolahListResponse {
  status: string;
  total: number;
  data: SekolahMarker[];
}

/** Data detail SMA dari relasi school_sma */
export interface DetailSma {
  id: string;
  name: string;
  grade: string;
  status: string;
  kecamatan: string;
  city: string;
  kepsek: string | null;
  nip_kepsek: string | null;
  no_hp_kepsek: string | null;
  status_kepsek: string | null;
  address: string;
  npsn: string;
  latitude: string | null;
  longitude: string | null;
  polygon: any | null;
}

/** Response dari GET /api/v1/sekolah/:npsn */
export interface SekolahDetailResponse {
  status: string;
  data: {
    npsn: string;
    nama: string;
    bentuk_pendidikan: string;
    status_sekolah: string;
    alamat_jalan: string;
    rt: string | null;
    rw: string | null;
    desa_kelurahan: string | null;
    kecamatan: string;
    kabupaten: string;
    kode_kabupaten: string;
    provinsi: string;
    kode_pos: string | null;
    lintang: number | null;
    bujur: number | null;
    nomor_telepon: string | null;
    email: string | null;
    website: string | null;
    akreditasi: string | null;
    jumlah_siswa: number;
    daya_tampung: number;
    is_3t: boolean;
    is_sekolah_alam: boolean;
    sumber_listrik: string | null;
    akses_internet: string | null;
    waktu_penyelenggaraan: string | null;
    semester_id: string;
    detailSma: DetailSma | null;
  };
}

/** Response dari GET /api/v1/statistik/kabupaten */
export interface StatistikKabupatenItem {
  kabupaten: string;
  kode_kabupaten: string;
  total_sekolah: number;
  total_sma: number;
  total_smp: number;
  total_sd: number;
  total_3t: number;
  total_siswa: number;
  total_daya_tampung: number;
}

export interface StatistikKabupatenResponse {
  status: string;
  data: StatistikKabupatenItem[];
}

/** Response dari GET /api/v1/statistik/jenjang */
export interface StatistikJenjangItem {
  bentuk_pendidikan: string;
  total: number;
  total_negeri: number;
  total_swasta: number;
  total_siswa: number;
}

export interface StatistikJenjangResponse {
  status: string;
  data: StatistikJenjangItem[];
}

/** Response dari GET /api/v1/cabang-dinas */
export interface CabangDinasItem {
  id: number;
  nama: string;
  kode_kabupaten: string[] | null;
  kabupaten_kota: string[] | null;
  map_lat: number | null;
  map_lng: number | null;
  map_zoom: number | null;
}

export interface CabangDinasResponse {
  status: string;
  data: CabangDinasItem[];
}

export interface CabangConfig {
  id: number;
  name: string;
  kabKotas: string[];
  totalPegawai: number;
  mapCenter: [number, number];
  mapZoom: number;
}

export interface LandingData {
  summary: {
    totalPegawai: number;
    totalSekolah: number;
    totalSkTerbit: number;
    tenagaPendidik: number;
    tenagaKependidikan: number;
  };
  projections: {
    purnaTugas: { yearly: number; monthly: number };
    kontrakHabis: { yearly: number; monthly: number };
    berkala: { yearly: number };
    pangkat: { yearly: number };
  };
  activityLog: { name: string; timestamp: number; user_name?: string }[];
  rekapStatus: Record<string, number>;
  serviceTimes: {
    submit_to_review: number;
    review_to_dinas: number;
    dinas_to_bkd: number;
    total_avg: number;
    monthly_trend: { label: string; value: number }[];
  };
  genderData: number[];
  cabdisDistribution: { name: string; total: number }[];
}

export interface GtkLandingData {
  regions: any;
  stats: {
    total_guru: number;
    total_sekolah: number;
    total_kab_kota: number;
    hours_distribution: {
      kurang_18: number;
      antara_18_24: number;
      lebih_24: number;
    };
    abk_recap?: {
      total_abk: number;
      total_existing: number;
      recap: {
        ideal: number;
        kelebihan: number;
        kekurangan: number;
      };
      percentage: number;
    };
  };
  subjects: {
    name: string;
    total_guru: number;
    kurang_18: number;
    antara_18_24: number;
    lebih_24: number;
    absorption_rate: number;
  }[];
  drilldown?: {
    id: string;
    name: string;
    stats: {
      total_abk: number;
      total_existing: number;
      recap: {
        ideal: number;
        kelebihan: number;
        kekurangan: number;
      };
      percentage: number;
    };
    // For school level subject details
    abk?: number;
    existing?: number;
    gap?: number;
    status?: string;
  }[];
  list: {
    data: {
      sekolah: string;
      mapel: string;
      kabupaten_kota: string;
      jumlah_guru: number;
      total_jam: number;
    }[];
    total: number;
    current_page: number;
    last_page: number;
  };
  options: {
    kabupaten_kota: string[];
    bidang_studi: string[];
  };
}

export const CABANG_DATA: CabangConfig[] = [
  {
    id: 1,
    name: "Wilayah 1",
    kabKotas: ["Kota Palu", "Sigi"],
    totalPegawai: 3500,
    mapCenter: [-1.23, 119.95],
    mapZoom: 9,
  }, // Palu Sigi area
  {
    id: 2,
    name: "Wilayah 2",
    kabKotas: ["Parigi Moutong", "Donggala"],
    totalPegawai: 2100,
    mapCenter: [-0.35, 119.98],
    mapZoom: 8,
  }, // Donggala
  {
    id: 3,
    name: "Wilayah 3",
    kabKotas: ["Poso", "Ampana"],
    totalPegawai: 2450,
    mapCenter: [-1.4, 120.75],
    mapZoom: 8,
  }, // Poso
  {
    id: 4,
    name: "Wilayah 4",
    kabKotas: ["Morowali", "Morowali Utara"],
    totalPegawai: 1900,
    mapCenter: [-2.1158, 121.8492],
    mapZoom: 8,
  }, // Morowali
  {
    id: 5,
    name: "Wilayah 5",
    kabKotas: ["Banggai", "Banggai Kepulauan", "Banggai Laut"],
    totalPegawai: 2500,
    mapCenter: [-1.2, 123.0],
    mapZoom: 8,
  }, // Banggai area
  {
    id: 6,
    name: "Wilayah 6",
    kabKotas: ["Tolitoli", "Buol"],
    totalPegawai: 1835,
    mapCenter: [1.0503, 121.2],
    mapZoom: 8,
  }, // Tolitoli/Buol
];
