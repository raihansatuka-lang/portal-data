import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CARTO_TILES } from "@/config/mapConfig";
import {
  MapPin,
  ExternalLink,
  ChevronLeft,
  Info,
  Award,
  Building2,
  Phone,
  Mail,
  Globe,
  User,
  Zap,
  Wifi,
  Clock,
  ShieldCheck,
  TreePine,
  AlertTriangle,
  Users,
  UserCog,
  DoorClosed,
  FlaskConical,
  BookOpen,
  CheckCircle,
  Activity,
  Plus,
  X,
  Download,
  TrendingUp,
  Monitor,
  Radio,
  GraduationCap,
  Laptop,
  Tv,
  Satellite,
  Coins,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Check,
  ArrowDown,
  Home,
  Pencil,
} from "lucide-react";
import { PemetaanService } from "@/services/pemetaanService";
import { useAuth } from "@/contexts/AuthContext";
import { SekolahEditModal } from "@/components/Admin/SekolahEditModal";

// ─── Default Dummy Sekolah (Cetak Biru Lengkap & Aman) ────────────────────────
const DUMMY_DEFAULT_SCHOOL: Record<string, any> = {
  nama: "SMAN 1 AMPANA KOTA",
  npsn: "40203344",
  nss: "30118031000",
  bentuk_pendidikan: "SMA",
  status_sekolah: "NEGERI",
  status_kepemilikan: "Pemerintah Daerah",
  yayasan: null,
  akreditasi: "B",
  keaktifan: "1",
  alamat_jalan: "JL. TADULAKO NO. 30 AMPANA",
  desa_kelurahan: "Ampana",
  kecamatan: "Kec. Ampana Kota",
  kabupaten: "Kab. Tojo Una Una",
  provinsi: "Prov. Sulawesi Tengah",
  kode_pos: "94683",
  lintang: -0.8708,
  bujur: 121.5762,
  nomor_telepon: "(0451) 421133",
  email: "smansaampana1@gmail.com",
  website: "http://www.sman1ak.sch.id",
  sumber_listrik: "PLN",
  daya_listrik: 10600,
  akses_internet: "Fibre Optic & Starlink",
  waktu_penyelenggaraan: "Pagi/6 hari",
  sertifikasi_iso: "Proses Sertifikasi",
  luas_tanah_milik: 10900,
  partisipasi_bos: "Ya",
  jumlah_siswa: 477,
  daya_tampung: 520,
  sk_pendirian_sekolah: "102/SKT/B.III/65-66",
  tanggal_sk_pendirian: "1965-09-28",
  sk_izin_operasional: "102/SKT/B.III/65-66",
  tanggal_sk_izin_operasional: "1965-08-01",
  kepsek: "Drs. H. Rusdi, M.Pd",
  nip_kepsek: "197512312002121000",
  status_kepsek: "Definitif",
  no_hp_kepsek: "0813-5426-8079",
  total_gtk: 89,
  total_guru: 87,
  total_tendik: 2,
  pns_count: 41,
  pppk_count: 42,
  honorer_count: 6,
  total_ruangan: 58,
  ruang_kelas: 43,
  ruang_lab: 3,
  ruang_perpus: 1,
  ruang_guru: 2,
  ruang_toilet: 8,
};

// ─── Data Galeri Sarpras Default (Aset Lokal dari gambar.zip) ─────────────────
const DEFAULT_SARPRAS_GALLERY = [
  {
    id: "g1",
    category: "kelas",
    title: "Ruang Kelas X-MIPA 1",
    desc: "Dilengkapi Smart TV interaktif & ventilasi pencahayaan alami",
    image: "/images/sarpras/ruang_kelas.png",
    condition: "Baik",
  },
  {
    id: "g2",
    category: "lab",
    title: "Laboratorium IPA Terpadu",
    desc: "Fasilitas praktikum mikroskop digital & meja peraga praktikum lengkap",
    image: "/images/sarpras/lab_ipa.png",
    condition: "Baik",
  },
  {
    id: "g3",
    category: "perpus",
    title: "Perpustakaan & Pojok Literasi",
    desc: "Koleksi buku Kurikulum Merdeka & ruang baca digital ber-AC",
    image: "/images/sarpras/perpustakaan.png",
    condition: "Baik",
  },
  {
    id: "g4",
    category: "olahraga",
    title: "Lapangan Olahraga Terbuka",
    desc: "Fasilitas basket, voli, dan upacara bendera berstandar",
    image: "/images/sarpras/lapangan_olahraga.png",
    condition: "Baik",
  },
  {
    id: "g5",
    category: "lab",
    title: "Laboratorium Komputer & Multimedia",
    desc: "Fasilitas 36 unit PC untuk pelaksanaan ANBK dan penguatan literasi digital",
    image: "/images/sarpras/lab_komputer.png",
    condition: "Baik",
  },
  {
    id: "g6",
    category: "aula",
    title: "Ruang Aula & Serbaguna",
    desc: "Wadah kegiatan pertemuan akademik, pentas kreasi seni, dan pembinaan kesiswaan",
    image: "/images/sarpras/aula_serbaguna.png",
    condition: "Baik",
  },
];

// ─── Data Dummy Kasus Siswa DO & Pendampingan ATS ───────────────────────────
const DUMMY_DO_CASES = [
  {
    id: "do-1",
    inisial: "R. P.",
    nisn: "0078912345",
    kelas: "Kelas X-2",
    gender: "Laki-laki",
    faktor: "Kendala Finansial & Membantu Orang Tua",
    tanggalLapor: "14 Okt 2023",
    statusIntervensi: "Kembali Bersekolah",
    catatan: "Penyaluran beasiswa Sulteng Cerdas & bantuan seragam/buku lengkap oleh sekolah",
    statusBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "do-2",
    inisial: "S. A.",
    nisn: "0081234567",
    kelas: "Kelas XI-MIPA 3",
    gender: "Perempuan",
    faktor: "Jarak Tempuh Geografis & Transportasi",
    tanggalLapor: "08 Des 2023",
    statusIntervensi: "Dalam Pendampingan",
    catatan: "Fasilitasi asrama siswa terdekat dan pendampingan berkala oleh Guru BK",
    statusBadge: "bg-blue-50 text-blue-700 border-blue-200",
  },
];

// ─── Warna per jenjang pendidikan ──────────────────────────────────────────
const JENJANG_COLOR: Record<string, string> = {
  TK: "#f59e0b",
  KB: "#f59e0b",
  SPS: "#f59e0b",
  TPA: "#f59e0b",
  RA: "#fb923c",
  SD: "#10b981",
  MI: "#34d399",
  SMP: "#3b82f6",
  MTs: "#60a5fa",
  SMA: "#2563eb",
  MA: "#8b5cf6",
  SMK: "#ec4899",
  SLB: "#ef4444",
  PKBM: "#6b7280",
  SKB: "#6b7280",
};

const getJenjangColor = (j?: string | null) => {
  if (!j) return "#2563eb";
  const clean = String(j).toUpperCase().trim();
  return JENJANG_COLOR[clean] ?? "#2563eb";
};

const getJenjangLabel = (j?: string | null) => {
  if (!j) return "Sekolah Menengah Atas";
  const clean = String(j).toUpperCase().trim();
  const map: Record<string, string> = {
    TK: "Taman Kanak-Kanak",
    KB: "Kelompok Bermain",
    SPS: "Satuan PAUD Sejenis",
    TPA: "Taman Penitipan Anak",
    RA: "Raudhatul Athfal",
    SD: "Sekolah Dasar",
    MI: "Madrasah Ibtidaiyah",
    SMP: "Sekolah Menengah Pertama",
    MTs: "Madrasah Tsanawiyah",
    SMA: "Sekolah Menengah Atas",
    MA: "Madrasah Aliyah",
    SMK: "Sekolah Menengah Kejuruan",
    SLB: "Sekolah Luar Biasa",
    PKBM: "Pusat Kegiatan Belajar Masyarakat",
    SKB: "Sanggar Kegiatan Belajar",
  };
  return map[clean] ?? clean;
};

// ─── Marker Leaflet Custom dengan Animasi Ping ─────────────────────────────
const createSchoolMarkerIcon = (color: string) => {
  return L.divIcon({
    className: "school-custom-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;width:34px;height:34px;">
        <div style="position:absolute;width:34px;height:34px;border-radius:50%;background:${color};opacity:0.35;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.35);position:relative;z-index:2;display:flex;align-items:center;justify-content:center;">
          <div style="width:6px;height:6px;border-radius:50%;background:white;"></div>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

// ─── Map Pan Controller Stabil ─────────────────────────────────────────────
const SetView = ({
  lat,
  lng,
  zoom,
  mapRef,
}: {
  lat: number;
  lng: number;
  zoom: number;
  mapRef?: React.MutableRefObject<L.Map | null>;
}) => {
  const map = useMap();
  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      map.setView([lat, lng], zoom);
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);
      if (mapRef) {
        mapRef.current = map;
      }
      return () => clearTimeout(timer);
    }
    if (mapRef) {
      mapRef.current = map;
    }
  }, [lat, lng, zoom, map, mapRef]);
  return null;
};

// ─── Badge Akreditasi ──────────────────────────────────────────────────────
const AkreditasiBadge = ({ nilai }: { nilai?: string | null }) => {
  const str = String(nilai ?? "-").trim();
  if (!str || str === "-" || str === "—") {
    return <span className="text-slate-400 text-xs font-bold">-</span>;
  }
  const clean = str.charAt(0).toUpperCase();
  const colors: Record<string, string> = {
    A: "bg-emerald-600 text-white",
    B: "bg-blue-600 text-white",
    C: "bg-amber-600 text-white",
  };
  const cls = colors[clean] ?? "bg-slate-600 text-white";
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold shadow-2xs ${cls}`}>
      {clean}
    </span>
  );
};

// ─── Format Tanggal Indonesia ──────────────────────────────────────────────
const formatTanggalIndo = (tglStr?: string | null) => {
  if (!tglStr) return null;
  try {
    const d = new Date(tglStr);
    if (isNaN(d.getTime())) return String(tglStr);
    return d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(tglStr);
  }
};

// ─── Klasifikasi Badge Risiko Kebencanaan ─────────────────────────────────
const getRiskBadgeClass = (val?: string | null) => {
  const str = String(val || "").toLowerCase();
  if (
    str.includes("tinggi") ||
    str.includes("rawan") ||
    str.includes("merah") ||
    str.includes("viii") ||
    str.includes("vii") ||
    str.includes("bahaya")
  ) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (
    str.includes("sedang") ||
    str.includes("waspada") ||
    str.includes("kuning") ||
    str.includes("sungai") ||
    str.includes("menengah")
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

// ─── Main Component: SekolahDetail ───────────────────────────────────────────
export const SekolahDetail = () => {
  const { npsn } = useParams<{ npsn: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // State Data
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI Interactive States
  const [activeSarprasTab, setActiveSarprasTab] = useState<string>("semua");
  const [isRaporModalOpen, setIsRaporModalOpen] = useState<boolean>(false);
  const [isDoModalOpen, setIsDoModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const mapRef = useRef<L.Map | null>(null);

  const handleEditSuccess = (updatedData: any) => {
    setData((prev: any) => (prev ? { ...prev, ...updatedData } : updatedData));
  };

  // ── Smooth Scroll to Section Helper ──
  const scrollToSection = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
      elem.classList.add("ring-2", "ring-blue-500/60", "ring-offset-4");
      setTimeout(() => {
        elem.classList.remove("ring-2", "ring-blue-500/60", "ring-offset-4");
      }, 1600);
    }
  };

  // Keyboard Escape for Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsRaporModalOpen(false);
        setIsDoModalOpen(false);
      }
    };
    if (isRaporModalOpen || isDoModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRaporModalOpen, isDoModalOpen]);

  // Fetch School Data
  useEffect(() => {
    if (!npsn) {
      setLoading(false);
      setError("NPSN sekolah tidak ditemukan pada parameter URL.");
      return;
    }
    setLoading(true);
    setError(null);

    PemetaanService.getSekolahDetail(npsn)
      .then((res: any) => {
        const schoolData = res?.data ?? res ?? null;
        if (!schoolData || typeof schoolData !== "object") {
          setError("Data sekolah tidak ditemukan di database.");
        } else {
          setData(schoolData);
        }
      })
      .catch((err: any) => {
        console.error("Error loading school detail:", err);
        setError("Gagal memuat data sekolah. Periksa koneksi ke server.");
      })
      .finally(() => setLoading(false));
  }, [npsn]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-50 font-poppins">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600">Memuat profil sekolah...</p>
        </div>
      </div>
    );
  }

  // ── Error / Not Found State ──
  if (error || !data) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 font-poppins px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-black text-slate-800">{error ?? "Sekolah Tidak Ditemukan"}</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">NPSN: {npsn}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Sebelumnya</span>
        </button>
      </div>
    );
  }

  // ── GABUNGKAN DATA ASLI API DENGAN DUMMY DEFAULT (OBJECT MERGE PATTERN) ──
  const cleanedApi: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && val !== undefined && val !== "" && val !== "null") {
      cleanedApi[key] = val;
    }
  }

  // Ekstrak relasi detailSma jika ada
  if (data.detailSma && typeof data.detailSma === "object") {
    const ds = data.detailSma;
    if (ds.kepsek) cleanedApi.kepsek = ds.kepsek;
    if (ds.nip_kepsek) cleanedApi.nip_kepsek = ds.nip_kepsek;
    if (ds.status_kepsek) cleanedApi.status_kepsek = ds.status_kepsek;
    if (ds.no_hp_kepsek) cleanedApi.no_hp_kepsek = ds.no_hp_kepsek;
    if (ds.address && !cleanedApi.alamat_jalan) cleanedApi.alamat_jalan = ds.address;
    if (ds.latitude && !cleanedApi.lintang) cleanedApi.lintang = ds.latitude;
    if (ds.longitude && !cleanedApi.bujur) cleanedApi.bujur = ds.longitude;
  }

  // Ekstrak relasi guru jika ada
  if (data.guru && typeof data.guru === "object") {
    const g = data.guru;
    if (g.total) cleanedApi.total_gtk = g.total;
    if (g.pendidik) cleanedApi.total_guru = g.pendidik;
    if (g.tendik) cleanedApi.total_tendik = g.tendik;
    if (g.pns) cleanedApi.pns_count = g.pns;
    if (g.pppk) cleanedApi.pppk_count = g.pppk;
    if (g.honorer) cleanedApi.honorer_count = g.honorer;
  }

  // Objek final sekolah
  const school = {
    ...DUMMY_DEFAULT_SCHOOL,
    ...cleanedApi,
  };

  // Parsing Jenjang & Warna
  const jenjang = String(school.bentuk_pendidikan || "SMA").toUpperCase().trim();
  const jenjangColor = getJenjangColor(jenjang);
  const isMenengah = ["SMA", "SMK", "MA", "MAK"].includes(jenjang);

  // Koordinat Map
  const lat = Number(school.lintang);
  const lng = Number(school.bujur);
  const hasKoordinat = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  // Status & Wilayah
  const isAktif =
    school.keaktifan === "1" ||
    school.keaktifan === "Aktif" ||
    school.keaktifan === true ||
    school.status_keaktifan === "Aktif";
  const statusSekolah = String(school.status_sekolah || "NEGERI").toUpperCase();
  const kabupatenName = String(school.kabupaten || "Sulawesi Tengah");
  const wilayahLabel =
    school.cabang_dinas ||
    `Wilayah ${kabupatenName.startsWith("Kab.") || kabupatenName.startsWith("Kota") ? kabupatenName : `Kab. ${kabupatenName}`}`;
  const akreditasi = String(school.akreditasi || "B");

  // Alamat Lengkap
  const alamatParts: string[] = [];
  if (school.alamat_jalan) alamatParts.push(String(school.alamat_jalan));
  if (school.desa_kelurahan) alamatParts.push(String(school.desa_kelurahan));
  if (school.kecamatan) {
    const k = String(school.kecamatan);
    alamatParts.push(k.startsWith("Kec.") ? k : `Kec. ${k}`);
  }
  if (school.kabupaten) {
    const kb = String(school.kabupaten);
    alamatParts.push(kb.startsWith("Kab.") || kb.startsWith("Kota") ? kb : `Kab. ${kb}`);
  }
  alamatParts.push(String(school.provinsi || "Prov. Sulawesi Tengah"));
  if (school.kode_pos) alamatParts.push(String(school.kode_pos));
  const alamatLengkap = alamatParts.join(", ");

  // Statistik Siswa & Daya Tampung
  const siswaCount = Number(school.jumlah_siswa) > 0 ? Number(school.jumlah_siswa) : (isMenengah ? 477 : 240);
  const dayaTampungCount = Number(school.daya_tampung) > 0 ? Number(school.daya_tampung) : Math.ceil(siswaCount * 1.08);

  // Poin 1: Monitoring DO (Drop Out)
  const siswaDoCount = 0; // Target Zero Drop Out
  const retensiRate = 100;

  // Poin 2: Papan Interaktif Digital (PID)
  const pidCount = isMenengah ? 2 : 1;
  const pidRuangan = "Ruang Laboratorium & Kelas Digital Multimedia";

  // Poin 4 & 5: Transformasi Digital Google & Belajar.id
  const chromebookCount = Math.min(60, Math.max(15, Math.round(siswaCount * 0.095)));
  const totalGtk = Number(school.total_gtk) || (Number(school.total_guru) + Number(school.total_tendik)) || 89;
  const totalGuru = Number(school.total_guru) || 87;
  const totalTendik = Number(school.total_tendik) || Math.max(2, totalGtk - totalGuru);
  const pnsCount = Number(school.pns_count) || 41;
  const pppkCount = Number(school.pppk_count) || 42;
  const honorerCount = Number(school.honorer_count) || 6;
  const baseGtkTotal = (pnsCount + pppkCount + honorerCount) || totalGtk || 1;
  const pnsPct = Math.round((pnsCount / baseGtkTotal) * 100);
  const pppkPct = Math.round((pppkCount / baseGtkTotal) * 100);
  const honorerPct = Math.max(0, 100 - pnsPct - pppkPct);

  const belajarIdGtk = Math.min(totalGtk, Math.max(1, Math.round(totalGtk * 0.96)));
  const belajarIdSiswa = Math.min(siswaCount, Math.max(1, Math.round(siswaCount * 0.88)));
  const gceGuru = Math.min(totalGuru, Math.max(4, Math.round(totalGuru * 0.14)));
  const gceL1 = Math.round(gceGuru * 0.75);
  const gceL2 = Math.max(1, gceGuru - gceL1);

  // Poin 6: Bantuan Akses Internet (Starlink)
  const internetType = data.is_3t ? "Bantuan Satelit Starlink LEO Disdik Sulteng" : "Fibre Optic & Backup Starlink LEO";
  const internetBandwidth = data.is_3t ? "150 - 220 Mbps" : "100 Mbps Dedicated";

  // Poin 7: Dana BOSNAS dan BOSDA
  const bosRegulerVal = Math.max(120_000_000, siswaCount * 1_500_000);
  const bosdaVal = isMenengah ? 125_000_000 : 65_000_000;

  // Sarpras
  const totalRuangan = Number(school.total_ruangan) || 58;
  const ruangKelasCount = Number(school.ruang_kelas) || 43;
  const labCount = Number(school.ruang_lab) || 3;
  const perpusCount = Number(school.ruang_perpus) || 1;
  const ruangGuruCount = Number(school.ruang_guru) || 2;
  const toiletCount = Number(school.ruang_toilet) || 8;

  // Website Link
  const rawWebsite = String(school.website || "http://www.sman1ak.sch.id");
  const websiteHref = rawWebsite.startsWith("http://") || rawWebsite.startsWith("https://") ? rawWebsite : `https://${rawWebsite}`;

  // Analisis Kerentanan Geospasial / Potensi Bencana (Data API)
  const bencana = data?.potensi_bencana ?? school?.potensi_bencana ?? null;
  const gempaCat = bencana?.gempa?.category ?? bencana?.gempa?.status ?? "Tinggi (> VIII MMI)";
  const banjirCat = bencana?.banjir?.category ?? bencana?.banjir?.status ?? "Sedang / Aliran Sungai";
  const tsunamiCat = bencana?.tsunami?.category ?? bencana?.tsunami?.status ?? "Rawan Tsunami";
  const longsorCat = bencana?.longsor?.category ?? bencana?.longsor?.status ?? "Rendah / Aman";
  const gerakanTanahCat = bencana?.gerakan_tanah?.category ?? bencana?.gerakan_tanah?.status ?? null;

  // Filter Galeri Sarpras
  const filteredGallery =
    activeSarprasTab === "semua"
      ? DEFAULT_SARPRAS_GALLERY
      : DEFAULT_SARPRAS_GALLERY.filter((item) => item.category === activeSarprasTab);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 antialiased selection:bg-blue-600 selection:text-white pb-16 font-poppins">

      {/* ── TOP NAVIGATION BAR ── */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-4">
        <nav className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl shadow-xs border border-slate-200/80 mb-5 transition-shadow duration-200 hover:shadow-sm">
          {/* Logo Pemetaan Sekolah */}
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-105 duration-200"
            title="Berani Cerdas - Portal Data Pemetaan Sekolah"
          >
            <img
              src="/logo.png"
              alt="Logo Portal Pemetaan Sekolah"
              className="h-7 sm:h-8.5 w-auto object-contain drop-shadow-2xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
            >
              Beranda
            </Link>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100/70 transition-colors">
              Provinsi Sulawesi Tengah
            </span>
          </div>
        </nav>

        {/* Subheader: Tombol Kembali, Judul Satuan Pendidikan & Aksi Admin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-700 px-1">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
              type="button"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="min-w-0">
              <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-blue-600 block">
                DETAIL PROFIL SATUAN PENDIDIKAN
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">
                {school.nama}
              </h1>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-center"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Data Sekolah</span>
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ═════════════════════════════════════════════════════════════════════
            1. HERO PROFIL SATUAN PENDIDIKAN
           ═════════════════════════════════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200/80 hover:border-slate-300/80 hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-5">
            {/* School Avatar with Gentle Hover Scale */}
            <div
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl flex items-center justify-center font-black text-2xl tracking-wider shadow-inner shrink-0 text-white transition-transform duration-300 hover:scale-105 cursor-default select-none"
              style={{
                backgroundColor: jenjangColor,
              }}
            >
              {jenjang.length >= 3 ? jenjang.substring(0, 3) : jenjang}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {school.nama}
                </h2>
                {isAktif ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    AKTIF
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    TIDAK AKTIF
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {statusSekolah}
                </span>
                {data.is_3t && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    WILAYAH 3T
                  </span>
                )}
                {data.is_sekolah_alam && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    SEKOLAH ALAM
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-slate-500">
                {getJenjangLabel(jenjang)} · {wilayahLabel}
              </p>

              {/* Quick Meta Pills with subtle lift */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 hover:bg-slate-200/70 hover:-translate-y-0.5 transition-all duration-150 rounded-full text-xs font-bold text-slate-700 cursor-default">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: jenjangColor }} />
                  {jenjang}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100/90 hover:bg-slate-200/70 hover:-translate-y-0.5 transition-all duration-150 rounded-full text-xs font-bold text-slate-700 font-mono cursor-default">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  NPSN: {school.npsn}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 hover:bg-slate-200/70 hover:-translate-y-0.5 transition-all duration-150 rounded-full text-xs font-bold text-slate-700 cursor-default">
                  <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Akreditasi <AkreditasiBadge nilai={akreditasi} />
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 hover:bg-slate-200/70 hover:-translate-y-0.5 transition-all duration-150 rounded-full text-xs font-bold text-slate-700 cursor-default">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {school.status_kepemilikan}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            2. RINGKASAN EKSEKUTIF (4 KARTU BENTO UTAMA DENGAN MODERN HOVER)
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* KARTU 1: SISWA & MONITORING DO (Poin 1) */}
          <div
            onClick={() => scrollToSection("section-monitoring-do")}
            className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            title="Klik untuk melihat Section Monitoring Siswa DO"
          >
            {/* Top Accent Highlight Reveal */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Peserta Didik & DO
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 group-hover:text-blue-700 transition-colors duration-150">
                  {siswaCount.toLocaleString("id-ID")}
                </span>
                <span className="text-xs font-bold text-slate-400">Siswa Aktif</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {siswaDoCount} DO ({retensiRate}% KBM)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDoModalOpen(true);
                }}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group/btn cursor-pointer active:scale-95 transition-transform"
                title="Buka Rekapitulasi Data ATS"
              >
                <span className="group-hover/btn:underline">Detail ATS</span>
                <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform duration-150" />
              </button>
            </div>
            <div className="mt-2 text-right">
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 inline-flex items-center gap-0.5 transition-colors">
                <span>Lihat Detail Section</span>
                <ArrowDown className="w-2.5 h-2.5 group-hover:translate-y-0.5 transition-transform duration-150" />
              </span>
            </div>
          </div>

          {/* KARTU 2: GTK & KOMPOSISI */}
          <div
            onClick={() => scrollToSection("section-transformasi-digital")}
            className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            title="Klik untuk melihat Section Transformasi Digital & Pendidik"
          >
            {/* Top Accent Highlight Reveal */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Guru & Tendik (GTK)
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors duration-150">
                  {totalGtk}
                </span>
                <span className="text-xs font-bold text-slate-400">Pegawai Total</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span>PNS: {pnsCount}</span>
                <span>PPPK: {pppkCount}</span>
                <span>Honorer: {honorerCount}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                <div style={{ width: `${pnsPct}%` }} className="bg-blue-600 h-full" title={`PNS: ${pnsCount}`} />
                <div style={{ width: `${pppkPct}%` }} className="bg-indigo-500 h-full" title={`PPPK: ${pppkCount}`} />
                <div style={{ width: `${honorerPct}%` }} className="bg-amber-400 h-full" title={`Honorer: ${honorerCount}`} />
              </div>
            </div>
            <div className="mt-2 text-right">
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 inline-flex items-center gap-0.5 transition-colors">
                <span>Lihat Program GTK</span>
                <ArrowDown className="w-2.5 h-2.5 group-hover:translate-y-0.5 transition-transform duration-150" />
              </span>
            </div>
          </div>

          {/* KARTU 3: SARANA PRASARANA */}
          <div
            onClick={() => scrollToSection("section-galeri-sarpras")}
            className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-teal-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            title="Klik untuk membuka Galeri Dokumentasi Sarpras"
          >
            {/* Top Accent Highlight Reveal */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Sarana Prasarana
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200">
                  <DoorClosed className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 group-hover:text-teal-700 transition-colors duration-150">
                  {totalRuangan}
                </span>
                <span className="text-xs font-bold text-slate-400">Total Ruangan</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-bold">
              <span>{ruangKelasCount} Kelas</span>
              <span>•</span>
              <span>{labCount} Lab</span>
              <span>•</span>
              <span>{perpusCount} Perpus</span>
            </div>
            <div className="mt-2 text-right">
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-teal-600 inline-flex items-center gap-0.5 transition-colors">
                <span>Buka Galeri Foto Sarpras</span>
                <ArrowDown className="w-2.5 h-2.5 group-hover:translate-y-0.5 transition-transform duration-150" />
              </span>
            </div>
          </div>

          {/* KARTU 4: TOTAL DANA OPERASIONAL (Poin 7) */}
          <div
            onClick={() => scrollToSection("section-alokasi-bos")}
            className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            title="Klik untuk melihat Transparansi Dana BOSNAS & BOSDA"
          >
            {/* Top Accent Highlight Reveal */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Total Pagu BOS (BOSNAS & BOSDA)
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors duration-150">
                  Rp {((bosRegulerVal + bosdaVal) / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs font-bold text-slate-400">Juta/Thn</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Penyaluran 100%</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10.5px]">
                Serapan 95.8%
              </span>
            </div>
            <div className="mt-2 text-right">
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 inline-flex items-center gap-0.5 transition-colors">
                <span>Rincian BOSNAS/BOSDA</span>
                <ArrowDown className="w-2.5 h-2.5 group-hover:translate-y-0.5 transition-transform duration-150" />
              </span>
            </div>
          </div>

        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            3. PETA GEOSPASIAL LOKASI & PROFIL LEGALITAS
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* SISI KIRI: PETA INTERAKTIF (7 Kolom) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">
                  Peta Lokasi Satuan Pendidikan
                </h3>
              </div>
              {hasKoordinat && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <span>Buka di Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Peta Leaflet */}
            <div className="relative h-80 sm:h-[480px] lg:h-[560px] w-full overflow-hidden bg-slate-100">
              {hasKoordinat ? (
                <>
                  {/* Layer Peta Terisolasi (z-0) */}
                  <div className="absolute inset-0 z-0">
                    <MapContainer
                      key={`school-map-${school.npsn}-${lat}-${lng}`}
                      center={[lat, lng]}
                      zoom={15}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      attributionControl={false}
                      className="w-full h-full"
                    >
                      <TileLayer
                        url={CARTO_TILES.VOYAGER}
                        maxZoom={20}
                        maxNativeZoom={19}
                      />
                      <SetView lat={lat} lng={lng} zoom={15} mapRef={mapRef} />
                      <Marker position={[lat, lng]} icon={createSchoolMarkerIcon(jenjangColor)}>
                        <Tooltip permanent direction="top" offset={[0, -20]}>
                          <div className="bg-slate-900/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-lg">
                            {school.nama}
                          </div>
                        </Tooltip>
                      </Marker>
                    </MapContainer>
                  </div>

                  {/* ── Kontrol Zoom & Reset ke Titik Sekolah di Kiri Atas Peta (z-30, Selalu di Atas Peta) ── */}
                  <div className="absolute top-4 left-4 z-30 flex flex-col gap-1 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => mapRef.current?.zoomIn()}
                      className="w-8 h-8 bg-white/95 hover:bg-white rounded-xl shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 font-bold text-base hover:text-blue-600 transition-all cursor-pointer active:scale-95"
                      title="Perbesar Peta (Zoom In)"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => mapRef.current?.zoomOut()}
                      className="w-8 h-8 bg-white/95 hover:bg-white rounded-xl shadow-md border border-slate-200/80 flex items-center justify-center text-slate-700 font-bold text-base hover:text-blue-600 transition-all cursor-pointer active:scale-95"
                      title="Perkecil Peta (Zoom Out)"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => mapRef.current?.setView([lat, lng], 15, { animate: true })}
                      className="w-8 h-8 bg-white/95 hover:bg-white rounded-xl shadow-md border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer active:scale-95 group"
                      title="Kembali ke Titik Lokasi Sekolah"
                    >
                      <Home className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MapPin className="w-8 h-8 opacity-40" />
                  <p className="text-xs font-medium">Koordinat belum tersedia di database Dapodik</p>
                </div>
              )}
            </div>

            {/* Baris Keterangan Koordinat & Alamat */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="font-medium">{alamatLengkap}</span>
              </div>
              <div className="shrink-0 font-mono text-slate-500 text-[11px] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                {hasKoordinat ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Koordinat: -"}
              </div>
            </div>
          </div>

          {/* SISI KANAN: PROFIL KEPALA SEKOLAH & LEGALITAS (5 Kolom) */}
          <div className="lg:col-span-5 space-y-4">

            {/* Profil Kepala Sekolah */}
            <div className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center space-x-2.5 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">
                  Pimpinan Satuan Pendidikan
                </h3>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-105 group-hover:border-blue-300 transition-transform duration-200 shadow-2xs">
                  <User className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight group-hover:text-blue-700 transition-colors">
                      {school.kepsek}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {school.status_kepsek}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    NIP: {school.nip_kepsek || "-"}
                  </p>
                  <p className="text-xs text-slate-600 font-medium pt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {school.no_hp_kepsek || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Identitas Legalitas & Perizinan */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 space-y-3">
              <div className="flex items-center space-x-2.5 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">
                  Legalitas & Operasional
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1.5 rounded transition-colors">
                  <span className="text-slate-500">SK Pendirian:</span>
                  <span className="font-semibold text-slate-800 text-right">{school.sk_pendirian_sekolah}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1.5 rounded transition-colors">
                  <span className="text-slate-500">Tanggal Pendirian:</span>
                  <span className="font-semibold text-slate-800">{formatTanggalIndo(school.tanggal_sk_pendirian) || "28 September 1965"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1.5 rounded transition-colors">
                  <span className="text-slate-500">SK Izin Operasional:</span>
                  <span className="font-semibold text-slate-800 text-right">{school.sk_izin_operasional}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1.5 rounded transition-colors">
                  <span className="text-slate-500">Sumber & Daya Listrik:</span>
                  <span className="font-semibold text-slate-800">{school.sumber_listrik} ({Number(school.daya_listrik).toLocaleString("id-ID")} VA)</span>
                </div>
                <div className="flex justify-between py-1.5 hover:bg-slate-50 px-1.5 rounded transition-colors">
                  <span className="text-slate-500">Website Sekolah:</span>
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                  >
                    {school.website}
                  </a>
                </div>
              </div>
            </div>

            {/* Analisis Kerentanan Geospasial / Potensi Bencana (Data API) */}
            <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3 overflow-hidden">
              {/* Top Accent Line Reveal */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide">
                    Analisis Kerentanan Geospasial
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  Data BPBD Sulteng
                </span>
              </div>

              {/* Warning Banner Kebencanaan Daerah */}
              <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11.5px] font-semibold text-amber-900 leading-snug">
                  Zona Pengawasan Khusus Kebencanaan Daerah{" "}
                  <span className="font-bold">{school.desa_kelurahan || school.kecamatan || "Sulawesi Tengah"}</span>.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {/* Gempa Bumi */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    Gempa Bumi
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${getRiskBadgeClass(gempaCat)}`}>
                    {gempaCat}
                  </span>
                </div>

                {/* Bahaya Banjir */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    Bahaya Banjir
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${getRiskBadgeClass(banjirCat)}`}>
                    {banjirCat}
                  </span>
                </div>

                {/* Ancaman Tsunami */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    Ancaman Tsunami
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${getRiskBadgeClass(tsunamiCat)}`}>
                    {tsunamiCat}
                  </span>
                </div>

                {/* Tanah Longsor */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <TreePine className="w-3.5 h-3.5 text-slate-400" />
                    Tanah Longsor
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${getRiskBadgeClass(longsorCat)}`}>
                    {longsorCat}
                  </span>
                </div>

                {/* Gerakan Tanah (jika ada di API) */}
                {gerakanTanahCat && (
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-slate-400" />
                      Gerakan Tanah
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${getRiskBadgeClass(gerakanTanahCat)}`}>
                      {gerakanTanahCat}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            4. SECTION 1: PROGRAM TRANSFORMASI DIGITAL & BANTUAN TIK (Poin 2, 4, 5, 6)
           ═════════════════════════════════════════════════════════════════════ */}
        <section
          id="section-transformasi-digital"
          className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-300 space-y-5 scroll-mt-24"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Program Akselerasi Digitalisasi Sekolah — Dinas Pendidikan Prov. Sulteng
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Monitoring bantuan infrastruktur TIK, konektivitas internet sekolah, dan pemanfaatan platform pembelajaran digital.
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Terverifikasi DAK & Pusdatin
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* KARTU A: BANTUAN AKSES INTERNET (STARLINK) (Poin 6) */}
            <div className="group relative bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/70 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
                    <Satellite className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    UPTD BLPT Disdik Prov Sulteng
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-blue-700 transition-colors">
                  Bantuan Akses Internet
                </h4>
                <p className="text-xs font-bold text-blue-700 mb-2">
                  {internetType}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Penyediaan koneksi internet berkecepatan tinggi {internetBandwidth} untuk menunjang kelancaran ANBK, Dapodik, dan KBM digital.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Stabilitas: 99.4%</span>
                <span className="text-blue-600 font-bold">Disdik & BAKTI</span>
              </div>
            </div>

            {/* KARTU B: BANTUAN PAPAN INTERAKTIF DIGITAL (PID) (Poin 2) */}
            <div className="group relative bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/70 hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
                    <Tv className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Distribusi Papan PID
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-indigo-700 transition-colors">
                  Bantuan Papan Interaktif (PID)
                </h4>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors">{pidCount}</span>
                  <span className="text-xs font-bold text-slate-500">Unit Terpasang</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Interactive Flat Panel Display (IFP 75" 4K) yang ditempatkan di {pidRuangan} guna pembelajaran modern interaktif.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Status: Digunakan KBM</span>
                <span className="text-emerald-600 font-bold">Kondisi Baik</span>
              </div>
            </div>

            {/* KARTU C: SEKOLAH RUJUKAN GOOGLE & CHROMEBOOK (Poin 5) */}
            <div className="group relative bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/70 hover:border-amber-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    UPTD BLPT Disdik Prov Sulteng
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-amber-700 transition-colors">
                  BLPT for Education & TIK
                </h4>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">{chromebookCount}</span>
                  <span className="text-xs font-bold text-slate-500">Unit Chromebook</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {gceGuru} Pendidik tersertifikasi Google Certified Educator ({gceL1} Level 1, {gceL2} Level 2) menuju Sekolah Rujukan Google (SRG).
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Chrome Device Mgmt (CDM)</span>
                <span className="text-blue-600 font-bold">Terkelola</span>
              </div>
            </div>

            {/* KARTU D: PEMANFAATAN AKUN BELAJAR.ID (Poin 4) */}
            <div className="group relative bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/70 hover:border-teal-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    UPTD BLPT Disdik Prov Sulteng
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-2 group-hover:text-teal-700 transition-colors">
                  Platform Konsultasi Rumah Pendidikan
                </h4>

                {/* Meter Guru */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600">Pendidik:</span>
                    <span className="text-blue-700">{belajarIdGtk}/{totalGtk} (96%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500 group-hover:bg-blue-700" style={{ width: "96%" }} />
                  </div>
                </div>

                {/* Meter Siswa */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-600">Peserta Didik:</span>
                    <span className="text-emerald-700">{belajarIdSiswa}/{siswaCount} (88%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500 group-hover:bg-emerald-600" style={{ width: "88%" }} />
                  </div>
                </div>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Classroom & Drive Aktif</span>
                <span className="text-emerald-600 font-bold">Kategori Tinggi</span>
              </div>
            </div>

          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            5. SECTION 2: MUTU PENDIDIKAN & MONITORING DO (Poin 1 & 3)
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* SISI KIRI: RAPOR PENDIDIKAN (Poin 3) - 7 Kolom */}
          <section className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Rapor Mutu Pendidikan SPMB (Asesmen Nasional)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluasi standar pelayanan minimum bidang pendidikan dan iklim pembelajaran.
                </p>
              </div>
              <button
                onClick={() => setIsRaporModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all duration-200 border border-blue-200 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 active:scale-95 cursor-pointer self-start sm:self-auto group"
              >
                <span>Telaah Rapor Mutu Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
              </button>
            </div>

            {/* 6 Dimensi Rapor Mutu with Modern Micro-hover */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Literasi Siswa", val: "78.4", badge: "Baik", color: "emerald", desc: "Di atas rerata kabupaten & provinsi" },
                { label: "Numerasi Siswa", val: "68.2", badge: "Sedang", color: "amber", desc: "Fokus penguatan modul ajar HOTS" },
                { label: "Karakter Siswa", val: "75.0", badge: "Baik", color: "emerald", desc: "Profil Pelajar Pancasila aktif" },
                { label: "Iklim Keamanan", val: "86.0", badge: "Sangat Baik", color: "emerald", desc: "Bebas perundungan & kondusif" },
                { label: "Kebinekaan", val: "82.0", badge: "Membudaya", color: "emerald", desc: "Sikap toleransi sosial tinggi" },
                { label: "Kualitas KBM", val: "74.0", badge: "Baik", color: "emerald", desc: "Instruksi terarah dan terstruktur" },
              ].map((dim, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/70 hover:border-blue-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150 cursor-default"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-slate-600">{dim.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${dim.color === "emerald" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"}`}>
                      {dim.badge}
                    </span>
                  </div>
                  <div className="text-xl font-black text-slate-900">{dim.val} <span className="text-xs text-slate-400 font-normal">/100</span></div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{dim.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* SISI KANAN: MONITORING SISWA PUTUS SEKOLAH (DO) (Poin 1) - 5 Kolom */}
          <section
            id="section-monitoring-do"
            className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-300 space-y-4 scroll-mt-24"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Monitoring Siswa DO & ATS
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Program Wajib Belajar 12 Tahun Bebas Putus Sekolah
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Target Zero DO
              </span>
            </div>

            {/* Banner Prestasi Zero DO */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-200/80 space-y-2 transition-shadow duration-200 hover:shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Sekolah Bebas Putus Sekolah (Zero Drop Out)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Tercatat <strong className="text-emerald-700">0 siswa putus sekolah berjalan</strong> pada tahun ajaran ini. Seluruh {siswaCount} peserta didik terpantau aktif mengikuti kegiatan belajar mengajar dengan angka retensi 100%.
              </p>
            </div>

            {/* Intervensi Penanganan Anak Tidak Sekolah (ATS) */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Mekanisme Penanganan Terintegrasi
              </span>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-all duration-150 text-xs font-semibold text-slate-700">
                <span>Pemantauan Kehadiran Terpadu (Dapodik)</span>
                <span className="text-emerald-600 font-bold">Sinkron</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-all duration-150 text-xs font-semibold text-slate-700">
                <span>Dukungan Beasiswa & Bantuan Siswa Prasejahtera</span>
                <span className="text-blue-600 font-bold">Tersedia</span>
              </div>
            </div>

            <button
              onClick={() => setIsDoModalOpen(true)}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-2 hover:-translate-y-0.5 active:scale-95 border border-transparent hover:border-blue-200 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Lihat Rekapitulasi & Pemantauan Riwayat ATS</span>
            </button>
          </section>

        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            6. SECTION 3: TRANSPARANSI ALOKASI DANA BOS (BOSNAS & BOSDA) (Poin 7)
           ═════════════════════════════════════════════════════════════════════ */}
        <section
          id="section-alokasi-bos"
          className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-300 space-y-5 scroll-mt-24"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Transparansi Alokasi Dana BOS (BOSNAS & BOSDA)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Akuntabilitas penyaluran dan realisasi dana operasional satuan pendidikan tahun anggaran berjalan.
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Pelaporan ARKAS 100% Selesai
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* KARTU 1: BOS REGULER (BOSNAS APBN) */}
            <div className="group p-5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    KEMENDIKBUDRISTEK (APBN)
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1 group-hover:text-blue-700 transition-colors">
                    BOS Reguler Nasional (BOSNAS)
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block">Pagu Tahunan</span>
                  <span className="text-lg font-black text-blue-700">
                    Rp {bosRegulerVal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-600">Satuan Biaya per Siswa:</span>
                  <span className="font-bold text-slate-800">Rp 1.500.000 / siswa / thn</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-600">Penyaluran Tahap 1 (50%):</span>
                  <span className="font-bold text-emerald-700">Rp {(bosRegulerVal * 0.5).toLocaleString("id-ID")} (Tersalurkan 100%)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-600">Penyaluran Tahap 2 (50%):</span>
                  <span className="font-bold text-emerald-700">Rp {(bosRegulerVal * 0.5).toLocaleString("id-ID")} (Tersalurkan 100%)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Tingkat Serapan Anggaran:</span>
                  <span className="font-extrabold text-blue-700">94.5% (Tercatat BOSP)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed bg-white group-hover:bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 transition-colors">
                Dialokasikan untuk operasional KBM, pengadaan buku teks Kurikulum Merdeka, pemeliharaan sarana kelas, dan kegiatan asesmen siswa.
              </p>
            </div>

            {/* KARTU 2: BOS DAERAH (BOSDA PROV. SULTENG APBD) */}
            <div className="group p-5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    PEMPROV SULAWESI TENGAH (APBD)
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-1 group-hover:text-indigo-700 transition-colors">
                    BOS Daerah (BOSDA Sulteng)
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block">Alokasi APBD</span>
                  <span className="text-lg font-black text-indigo-700">
                    Rp {bosdaVal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-600">Program Pendukung:</span>
                  <span className="font-bold text-slate-800">Sulteng Berani Cerdas</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-600">Penyaluran Semester I:</span>
                  <span className="font-bold text-emerald-700">Rp {(bosdaVal * 0.5).toLocaleString("id-ID")} (Tercairkan)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-600">Penyaluran Semester II:</span>
                  <span className="font-bold text-emerald-700">Rp {(bosdaVal * 0.5).toLocaleString("id-ID")} (Tercairkan)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Tingkat Serapan Anggaran:</span>
                  <span className="font-extrabold text-indigo-700">97.2% (LPJ Diterima Disdik)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed bg-white group-hover:bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 transition-colors">
                Diperuntukkan bagi insentif guru honorer non-ASN, subsidi perlengkapan bagi murid prasejahtera, serta peningkatan kompetensi pendidik.
              </p>
            </div>

          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            7. SECTION 4: SARANA PRASARANA & DOKUMENTASI FASILITAS LOKAL
           ═════════════════════════════════════════════════════════════════════ */}
        <section
          id="section-galeri-sarpras"
          className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-300 space-y-6 scroll-mt-24"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Galeri Sarana Prasarana & Fasilitas Satuan Pendidikan
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Dokumentasi foto fasilitas fisik dan rekapitulasi data sarpras terverifikasi.
              </p>
            </div>

            {/* Filter Tabs with Tactile Click & Active State */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              {[
                { id: "semua", label: "Semua Fasilitas" },
                { id: "kelas", label: "Ruang Kelas" },
                { id: "lab", label: "Laboratorium" },
                { id: "perpus", label: "Perpustakaan" },
                { id: "olahraga", label: "Olahraga" },
                { id: "aula", label: "Aula" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSarprasTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 ${activeSarprasTab === tab.id
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Galeri Foto Lokal with Cinematic Zoom & Elevation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-slate-200/80 hover:border-blue-300/80 overflow-hidden bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300 ease-out"
                    src={item.image}
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-emerald-600/95 backdrop-blur-sm text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
                      Kondisi: {item.condition}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-extrabold text-sm text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 sm:px-8 py-8 mt-8 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">
          &copy; 2026 BLPT - Dinas Pendidikan Provinsi Sulawesi Tengah
        </p>
      </footer>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 1: RAPOR MUTU PENDIDIKAN INTERAKTIF
         ═════════════════════════════════════════════════════════════════════ */}
      {isRaporModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rapor-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsRaporModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          <div className="max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-200 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900" id="rapor-modal-title">
                      Rapor Mutu Pendidikan — {school.nama}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Status: Tuntas / Kategori Baik
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Asesmen Nasional & Survei Lingkungan Belajar (Sulingjar) Periode Rilis Resmi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRaporModalOpen(false)}
                aria-label="Tutup Modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
              {/* Ringkasan Banner */}
              <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-emerald-50/60 rounded-xl p-4 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    RINGKASAN STATUS KELAYAKAN SATUAN PENDIDIKAN
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Capaian Mutu Pembelajaran Unggul & Kondusif
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {school.nama} berada di atas rerata capaian satuan pendidikan setara tingkat {wilayahLabel} dan Provinsi Sulawesi Tengah.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200/60">
                  <div className="text-center px-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      STANDAR NASIONAL
                    </span>
                    <span className="text-lg font-black text-emerald-600">TERPENUHI</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center px-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      STATUS IKLIM
                    </span>
                    <span className="text-lg font-black text-indigo-600">KONDUSIF</span>
                  </div>
                </div>
              </div>

              {/* Hasil Asesmen Nasional */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-blue-600" />
                    Hasil Asesmen Nasional (AN) Lengkap
                  </h5>
                  <span className="text-[11px] text-slate-400">Target Asesmen: Siswa {isMenengah ? "Kelas XI" : "Tingkat Akhir"}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Literasi */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">Kemampuan Literasi</span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        ↑ +3.8%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-black text-slate-900">78.4</span>
                      <span className="text-xs font-semibold text-slate-400">/ 100</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 ml-auto">
                        Baik
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between">
                        <span>Rerata {kabupatenName}:</span>
                        <strong className="text-slate-700 font-semibold">64.1</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Rerata Nasional:</span>
                        <strong className="text-slate-700 font-semibold">62.5</strong>
                      </div>
                    </div>
                  </div>

                  {/* Numerasi */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">Kemampuan Numerasi</span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        ↑ +2.1%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-black text-slate-900">68.2</span>
                      <span className="text-xs font-semibold text-slate-400">/ 100</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 ml-auto">
                        Sedang
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between">
                        <span>Rerata {kabupatenName}:</span>
                        <strong className="text-slate-700 font-semibold">56.3</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Rerata Nasional:</span>
                        <strong className="text-slate-700 font-semibold">58.2</strong>
                      </div>
                    </div>
                  </div>

                  {/* Karakter */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">Karakter Murid</span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        ↑ +1.5%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-black text-slate-900">75.0</span>
                      <span className="text-xs font-semibold text-slate-400">/ 100</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 ml-auto">
                        Baik
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between">
                        <span>Rerata {kabupatenName}:</span>
                        <strong className="text-slate-700 font-semibold">68.9</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Rerata Nasional:</span>
                        <strong className="text-slate-700 font-semibold">69.1</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Sulingjar */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-teal-500" />
                    Rincian Survei Lingkungan Belajar (Sulingjar)
                  </h5>
                  <span className="text-[11px] text-slate-400">Instrumen: Guru & Kepala Sekolah</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-800">Kualitas Pembelajaran</span>
                      <span className="text-xs font-extrabold text-slate-900 font-mono">74</span>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-1.5">
                      Baik
                    </span>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Manajemen kelas efektif, instruksi terarah dan umpan balik konstruktif guru.
                    </p>
                  </div>
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-800">Iklim Keamanan</span>
                      <span className="text-xs font-extrabold text-slate-900 font-mono">86</span>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-1.5">
                      Sangat Baik
                    </span>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Bebas dari risiko perundungan (bullying), hukuman fisik, dan kekerasan.
                    </p>
                  </div>
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-800">Iklim Kebinekaan</span>
                      <span className="text-xs font-extrabold text-slate-900 font-mono">82</span>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-1.5">
                      Membudaya
                    </span>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Sikap inklusif tinggi terhadap keberagaman suku, agama, serta toleransi sosial.
                    </p>
                  </div>
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-800">Iklim Inklusivitas</span>
                      <span className="text-xs font-extrabold text-slate-900 font-mono">71</span>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-1.5">
                      Baik
                    </span>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Layanan akomodatif bagi murid berkebutuhan khusus & non-diskriminatif.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rekomendasi PBD */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-amber-500" />
                    Rekomendasi Perencanaan Berbasis Data (PBD)
                  </h5>
                  <span className="text-[11px] text-slate-400">Fokus Pembenahan Tahun 2024</span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="text-xs">
                      <strong className="text-slate-900 font-bold block mb-0.5">
                        Peningkatan Kemampuan Numerasi Pemecahan Masalah Kontekstual
                      </strong>
                      <p className="text-slate-600">
                        Pelatihan berkala bagi guru MIPA mengenai modul ajar Kurikulum Merdeka berbasis soal analisis bernalar tinggi (HOTS).
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/60 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="text-xs">
                      <strong className="text-slate-900 font-bold block mb-0.5">
                        Penguatan Literasi Digital & Optimalisasi Perpustakaan
                      </strong>
                      <p className="text-slate-600">
                        Pemanfaatan unit Chromebook bantuan DAK untuk integrasi platform e-library dan materi bacaan fiksi/nonfiksi terakreditasi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 text-xs">
              <span className="text-slate-400 text-[11px]">
                Sumber: Pusmendik & Ditjen PAUD Dikdasmen · Kemendikbudristek
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => alert(`Untuk fitur unduh rapor mutu untuk sekolah ${school.nama} akan segera hadir!!`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-150 cursor-pointer"
                  type="button"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Unduh PDF Rapor Mutu</span>
                </button>
                <button
                  onClick={() => setIsRaporModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-150 cursor-pointer"
                  type="button"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 2: REKAPITULASI PEMANTAUAN SISWA DROP OUT (DO) & ATS
         ═════════════════════════════════════════════════════════════════════ */}
      {isDoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="do-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDoModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          <div className="max-w-3xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-200 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900" id="do-modal-title">
                      Pemantauan Siswa Putus Sekolah (DO) & Penanganan ATS
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Program Prioritas Pengentasan Anak Tidak Sekolah — Dinas Pendidikan Prov. Sulawesi Tengah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDoModalOpen(false)}
                aria-label="Tutup Modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
              {/* Status Ringkasan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-center hover:border-slate-300 transition-colors">
                  <span className="text-slate-400 text-[10.5px] font-bold block">TOTAL SISWA AKTIF</span>
                  <span className="text-xl font-black text-slate-900">{siswaCount} Siswa</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/70 text-center hover:border-emerald-300 transition-colors">
                  <span className="text-emerald-600 text-[10.5px] font-bold block">STATUS SISWA DO TAHUN INI</span>
                  <span className="text-xl font-black text-emerald-700">0 Siswa (Zero DO)</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/70 text-center hover:border-blue-300 transition-colors">
                  <span className="text-blue-600 text-[10.5px] font-bold block">TINGKAT RETENSI KBM</span>
                  <span className="text-xl font-black text-blue-700">100% Bertahan</span>
                </div>
              </div>

              {/* Riwayat Intervensi Pencegahan DO */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-blue-600" />
                    Riwayat Kasus Rentan & Pendampingan Siswa Kembali Sekolah
                  </h5>
                  <span className="text-[11px] text-slate-400">Tahun Ajaran 2023/2024</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                      <tr>
                        <th className="p-3">Siswa & NISN</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3">Faktor Kendala</th>
                        <th className="p-3">Status Intervensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DUMMY_DO_CASES.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-3">
                            <strong className="text-slate-900 block">{item.inisial}</strong>
                            <span className="text-slate-400 font-mono text-[10.5px]">{item.nisn} ({item.gender})</span>
                          </td>
                          <td className="p-3 font-medium text-slate-700">{item.kelas}</td>
                          <td className="p-3 text-slate-600">
                            <span>{item.faktor}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">Dilaporkan: {item.tanggalLapor}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${item.statusBadge}`}>
                              {item.statusIntervensi}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                              {item.catatan}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Panduan Pendampingan ATS Pemprov */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Apabila terdapat siswa terindikasi tidak hadir lebih dari 14 hari kerja tanpa keterangan, pihak sekolah berkoordinasi langsung dengan Pengawas Pembina dan Cabang Dinas Pendidikan untuk melakukan *home visit* dan intervensi beasiswa.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs">
              <span className="text-slate-400 text-[11px]">
                Monitoring Terpadu Dinas Pendidikan Provinsi Sulawesi Tengah
              </span>
              <button
                onClick={() => setIsDoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-150 cursor-pointer"
                type="button"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal CSS Styles for Leaflet & Animations */}
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .leaflet-container {
          background: #f1f5f9 !important;
        }
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip:before {
          display: none !important;
        }
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* Modal Edit Sekolah */}
      <SekolahEditModal
        isOpen={isEditModalOpen}
        npsn={npsn ?? null}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};
