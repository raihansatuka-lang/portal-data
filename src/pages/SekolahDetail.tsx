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
  Eye,
  EyeOff,
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
  last_update: "2026-09-16 14:30:00",
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

// ─── Format Waktu Sinkronisasi Data (WITA / UTC+8) ──────────────────────────
const formatSyncTimestamp = (rawDate?: any): { formatted: string; isReal: boolean } => {
  if (!rawDate) {
    return { formatted: "Semester Genap 2025/2026", isReal: false };
  }

  try {
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) {
      return { formatted: String(rawDate), isReal: true };
    }

    // Format dengan Intl ke zona WITA (Makassar)
    const formatted =
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Makassar",
      }).format(dateObj) + " WITA";

    return { formatted, isReal: true };
  } catch {
    return { formatted: String(rawDate), isReal: true };
  }
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

  // Observer otomatis untuk menyesuaikan viewport Leaflet saat kontainer flex meregang
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [map]);

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

// ─── Komponen Proteksi Privasi Nomor Telepon / HP Kepsek ─────────────────────
const ProtectedPhoneContact: React.FC<{
  phone?: string | null;
}> = ({ phone }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!phone || phone === "-" || phone.trim() === "") {
    return (
      <p className="text-xs text-slate-400 font-medium pt-1 flex items-center gap-1.5">
        <Phone className="w-3.5 h-3.5 text-slate-300" />
        <span>Kontak belum tersedia</span>
      </p>
    );
  }

  // Format sensor: sembunyikan 4 digit tengah agar terhindar dari bot scraper
  const cleanDigits = phone.replace(/[^0-9+]/g, "");
  let maskedPhone = phone;
  if (cleanDigits.length >= 8) {
    if (cleanDigits.startsWith("08") || cleanDigits.startsWith("+62") || cleanDigits.startsWith("62")) {
      const prefix = phone.substring(0, 4);
      const suffix = phone.substring(phone.length - 4);
      maskedPhone = `${prefix}-••••-${suffix}`;
    } else {
      const prefix = phone.substring(0, 3);
      const suffix = phone.substring(phone.length - 3);
      maskedPhone = `${prefix}-••••-${suffix}`;
    }
  } else {
    maskedPhone = "••••-••••";
  }

  return (
    <div className="pt-2 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Box Nomor Masked / Unmasked */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-mono font-bold text-slate-700 shadow-2xs">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{isRevealed ? phone : maskedPhone}</span>
        </div>

        {/* Tombol Tampilkan / Sembunyikan Sensor */}
        <button
          type="button"
          onClick={() => setIsRevealed(!isRevealed)}
          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 hover:border-slate-300 active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs"
          title={isRevealed ? "Sembunyikan nomor (sensor)" : "Tampilkan nomor lengkap"}
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-400/50 group-hover:text-slate-600 transition-colors" />
              <span>Tutup</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-slate-400/60 group-hover:text-slate-600 transition-colors" />
              <span>Lihat No. HP</span>
            </>
          )}
        </button>
      </div>

      {/* Catatan Privasi Anti-Spam */}
      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 leading-tight">
        <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
        <span>Nomor disensor untuk melindungi privasi pimpinan dari bot spam & penipuan.</span>
      </p>
    </div>
  );
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
  const [isBlptModalOpen, setIsBlptModalOpen] = useState<boolean>(false);
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
        setIsBlptModalOpen(false);
      }
    };
    if (isRaporModalOpen || isDoModalOpen || isBlptModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRaporModalOpen, isDoModalOpen, isBlptModalOpen]);

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

  // ── Data Rapor Pendidikan 2025 (Riil dari API) ─────────────────────────────
  const rapor = data?.raporPendidikan ?? null;

  const getCapaianStyle = (label?: string | null) => {
    if (!label || label.includes("Tidak Tersedia")) {
      return {
        badge: label || "Belum Ada Data",
        badgeBg: "bg-slate-100 text-slate-600 border-slate-200",
        color: "slate",
        keterangan: "Data belum tersedia",
      };
    }
    const lower = label.toLowerCase();
    if (lower.includes("sangat baik") || lower.includes("membudaya")) {
      return {
        badge: label,
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        color: "emerald",
        keterangan: "Sangat baik & membudaya",
      };
    }
    if (lower.includes("baik")) {
      return {
        badge: label,
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        color: "emerald",
        keterangan: "Memenuhi standar capaian",
      };
    }
    if (lower.includes("sedang") || lower.includes("cukup")) {
      return {
        badge: label,
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        color: "amber",
        keterangan: "Perlu peningkatan bertahap",
      };
    }
    if (lower.includes("kurang") || lower.includes("waspada")) {
      return {
        badge: label,
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
        color: "rose",
        keterangan: "Perlu bimbingan khusus",
      };
    }
    return {
      badge: label,
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      color: "blue",
      keterangan: "Dalam pemantauan",
    };
  };

  const formatPeringkatText = (peringkat?: string | null) => {
    if (!peringkat || peringkat.includes("Tidak Tersedia")) return "—";
    const p = peringkat.toLowerCase();
    if (p.includes("1-20%")) return "20% Teratas";
    if (p.includes("21-40%")) return "Menengah Atas (21-40%)";
    if (p.includes("41-60%")) return "Menengah (41-60%)";
    if (p.includes("61-80%")) return "Menengah Bawah (61-80%)";
    if (p.includes("81-100%")) return "Kelompok Bawah (81-100%)";
    return peringkat;
  };

  const formatDeltaInfo = (perubahan?: string | null, delta?: string | null) => {
    if (!delta || delta === "0" || delta === "—" || delta.includes("Tidak")) return null;
    const per = (perubahan || "").toLowerCase();
    if (per.includes("naik")) {
      return { text: `↑ +${delta}%`, color: "emerald" };
    }
    if (per.includes("turun")) {
      return { text: `↓ -${delta}%`, color: "rose" };
    }
    if (per.includes("tetap")) {
      return { text: `— Tetap`, color: "slate" };
    }
    return { text: delta, color: "slate" };
  };

  const getRaporSummary = () => {
    if (!rapor) {
      return {
        title: "Data Rapor Belum Tercatat",
        desc: `Satuan pendidikan ${school.nama} belum memiliki catatan hasil Asesmen Nasional 2025 di basis data resmi.`,
        statusText: "BELUM TERDATA",
        statusColor: "text-slate-500",
      };
    }
    const lit = (rapor.literasi_label || "").toLowerCase();
    const num = (rapor.numerasi_label || "").toLowerCase();
    if (lit.includes("kurang") || num.includes("kurang")) {
      return {
        title: "Perlu Pendampingan Khusus pada Kemampuan Dasar Siswa",
        desc: `${school.nama} memerlukan program pendampingan dan bimbingan belajar tambahan pada kemampuan literasi dan numerasi siswa.`,
        statusText: "PERLU PENDAMPINGAN",
        statusColor: "text-rose-600",
      };
    }
    if (lit.includes("sedang") || num.includes("sedang")) {
      return {
        title: "Capaian Cukup Baik — Fokus pada Penguatan Bertahap",
        desc: `${school.nama} menunjukkan capaian yang cukup baik, dengan beberapa aspek yang perlu terus ditingkatkan pada tahun pembelajaran berikutnya.`,
        statusText: "PERLU PENINGKATAN",
        statusColor: "text-amber-600",
      };
    }
    return {
      title: "Mutu Pembelajaran & Iklim Belajar Memenuhi Standar Baik",
      desc: `${school.nama} menunjukkan hasil belajar yang baik dan iklim sekolah yang kondusif berdasarkan evaluasi Asesmen Nasional 2025.`,
      statusText: "MEMENUHI STANDAR",
      statusColor: "text-emerald-600",
    };
  };

  const getDynamicPbdRecommendations = () => {
    if (!rapor) {
      return [
        {
          no: 1,
          title: "Keikutsertaan Asesmen Nasional (ANBK)",
          desc: "Pastikan seluruh siswa dan guru berpartisipasi aktif dalam Asesmen Nasional dan Sulingjar periode berikutnya agar data mutu sekolah terdata lengkap.",
          fokus: "Partisipasi Asesmen",
          color: "blue",
        },
      ];
    }
    const recs = [];
    const num = (rapor.numerasi_label || "").toLowerCase();
    const lit = (rapor.literasi_label || "").toLowerCase();
    const kbm = (rapor.kualitas_kbm_label || "").toLowerCase();
    const aman = (rapor.keamanan_label || "").toLowerCase();

    if (num.includes("kurang") || num.includes("sedang")) {
      recs.push({
        no: recs.length + 1,
        title: "Penguatan Kemampuan Berhitung (Numerasi) Siswa",
        desc: "Sediakan jam bimbingan belajar tambahan dan perbanyak latihan soal matematika terapan kontekstual yang dekat dengan kehidupan sehari-hari murid.",
        fokus: "Prioritas Numerasi",
        color: "amber",
      });
    }

    if (lit.includes("kurang") || lit.includes("sedang")) {
      recs.push({
        no: recs.length + 1,
        title: "Pembiasaan Membaca & Pemanfaatan Sudut Buku",
        desc: "Jadwalkan kegiatan membaca mandiri selama 15 menit sebelum jam belajar dan tambah variasi buku bacaan fiksi/nonfiksi yang menarik bagi siswa.",
        fokus: "Prioritas Literasi",
        color: "blue",
      });
    }

    if (aman.includes("waspada") || aman.includes("kurang")) {
      recs.push({
        no: recs.length + 1,
        title: "Pencegahan Perundungan & Pengawasan Lingkungan Sekolah",
        desc: "Perkuat peran Tim Pencegahan dan Penanganan Kekerasan (TPPK) dan sediakan kotak saran/konsultasi guru BK yang mudah diakses siswa.",
        fokus: "Iklim Keamanan",
        color: "rose",
      });
    }

    if (kbm.includes("kurang") || kbm.includes("sedang")) {
      recs.push({
        no: recs.length + 1,
        title: "Peningkatan Metode Mengajar Interaktif di Kelas",
        desc: "Dorong para pendidik untuk saling berbagi metode pengajaran aktif melalui Komunitas Belajar (Kombel) agar suasana kelas lebih komunikatif.",
        fokus: "Kualitas Mengajar",
        color: "indigo",
      });
    }

    if (recs.length === 0) {
      recs.push({
        no: 1,
        title: "Pertahankan Prestasi & Berbagi Pengalaman dengan Sekolah Lain",
        desc: "Seluruh capaian utama sekolah sudah memenuhi kategori Baik. Sekolah dapat menjadi inspirasi dan berbagi metode belajar efektif kepada satuan pendidikan di sekitarnya.",
        fokus: "Praktik Baik",
        color: "emerald",
      });
      recs.push({
        no: 2,
        title: "Pengembangan Minat, Bakat, dan Karakter Murid",
        desc: "Dukung kegiatan ekstrakurikuler serta proyek pembiasaan budi pekerti untuk menjaga lingkungan belajar yang inklusif dan berkarakter.",
        fokus: "Karakter Siswa",
        color: "blue",
      });
    }

    return recs;
  };

  const raporSummary = getRaporSummary();
  const dynamicRecs = getDynamicPbdRecommendations();

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

  // Waktu Pengambilan / Sinkronisasi Data Dinamis (Dapodik / Server)
  const rawSyncTime =
    school.last_update ||
    school.updated_at ||
    school.tanggal_sinkronisasi ||
    school.tanggal_ambil ||
    school.dapodik_sync_at ||
    data?.last_update ||
    data?.updated_at ||
    null;

  const { formatted: syncTimeText, isReal: isRealSyncTime } = formatSyncTimestamp(rawSyncTime);

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

  // Poin 5: BLPT for Education & LMS Sekolahku Keren (Sertifikasi Pendidik)
  const blptSertifGuru = Math.min(totalGuru, Math.max(5, Math.round(totalGuru * 0.28)));
  const blptSertifPct = Math.round((blptSertifGuru / Math.max(1, totalGuru)) * 100);
  const sertifLmsMandiri = Math.round(blptSertifGuru * 0.65);
  const sertifTerkurasi = Math.max(2, blptSertifGuru - sertifLmsMandiri);

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
        <section className="bg-white rounded-2xl p-4 sm:p-7 shadow-xs border border-slate-200/80 hover:border-slate-300/80 hover:shadow-sm transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            {/* School Avatar with Gentle Hover Scale */}
            <div
              className="w-16 h-16 sm:w-22 sm:h-22 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl tracking-wider shadow-inner shrink-0 text-white transition-transform duration-300 hover:scale-105 cursor-default select-none"
              style={{
                backgroundColor: jenjangColor,
              }}
            >
              {jenjang.length >= 3 ? jenjang.substring(0, 3) : jenjang}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
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
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/85 hover:bg-blue-100/80 hover:-translate-y-0.5 transition-all duration-150 rounded-full text-xs font-semibold text-blue-900 border border-blue-200/70 shadow-2xs cursor-default"
                  title={isRealSyncTime ? `Waktu sinkronisasi data Dapodik: ${syncTimeText}` : "Data terdaftar pada semester aktif"}
                >
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    Sinkronisasi: <strong className="font-bold text-blue-950">{syncTimeText}</strong>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            2. RINGKASAN EKSEKUTIF (4 KARTU BENTO UTAMA DENGAN MODERN HOVER)
           ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">

          {/* KARTU 1: SISWA & MONITORING DO (Poin 1) */}
          <div
            onClick={() => scrollToSection("section-monitoring-do")}
            className="group relative bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            title="Klik untuk melihat Section Monitoring Siswa DO"
          >
            {/* Top Accent Highlight Reveal */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-400 tracking-wider truncate">
                  Peserta Didik & DO
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shrink-0">
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-3xl font-black text-slate-900 group-hover:text-blue-700 transition-colors duration-150">
                  {siswaCount.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400">Siswa</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-200 truncate">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                {siswaDoCount} DO ({retensiRate}%)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDoModalOpen(true);
                }}
                className="text-[10px] sm:text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 group/btn cursor-pointer active:scale-95 transition-transform shrink-0"
                title="Buka Rekapitulasi Data ATS"
              >
                <span className="group-hover/btn:underline">Detail ATS</span>
                <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform duration-150" />
              </button>
            </div>
            <div className="mt-2 text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 inline-flex items-center gap-0.5 transition-colors">
                <span>Lihat Detail Section</span>
                <ArrowDown className="w-2.5 h-2.5 group-hover:translate-y-0.5 transition-transform duration-150" />
              </span>
            </div>
          </div>

          {/* KARTU 2: GTK & KOMPOSISI */}
          <div
            onClick={() => scrollToSection("section-transformasi-digital")}
            className="group relative bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            title="Klik untuk melihat Section Transformasi Digital & Pendidik"
          >
            {/* Top Accent Highlight Reveal */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-400 tracking-wider truncate">
                  Guru & Tendik (GTK)
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-3xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors duration-150">
                  {totalGtk}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400">Pegawai</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center text-[9px] sm:text-[11px] font-bold text-slate-600 mb-1 whitespace-nowrap gap-1">
                <span>PNS: {pnsCount}</span>
                <span>PPPK: {pppkCount}</span>
                <span>Hon: {honorerCount}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 sm:h-2 rounded-full overflow-hidden flex">
                <div style={{ width: `${pnsPct}%` }} className="bg-blue-600 h-full" title={`PNS: ${pnsCount}`} />
                <div style={{ width: `${pppkPct}%` }} className="bg-indigo-500 h-full" title={`PPPK: ${pppkCount}`} />
                <div style={{ width: `${honorerPct}%` }} className="bg-amber-400 h-full" title={`Honorer: ${honorerCount}`} />
              </div>
            </div>
            <div className="mt-2 text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 inline-flex items-center gap-0.5 transition-colors">
                <span>Lihat Program GTK</span>
                <ArrowDown className="w-2.5 h-2.5 group-hover:translate-y-0.5 transition-transform duration-150" />
              </span>
            </div>
          </div>

          {/* KARTU 3: SARANA PRASARANA */}
          <div
            onClick={() => scrollToSection("section-galeri-sarpras")}
            className="group relative bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs hover:border-teal-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            title="Klik untuk membuka Galeri Dokumentasi Sarpras"
          >
            {/* Top Accent Highlight Reveal */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-400 tracking-wider truncate">
                  Sarana Prasarana
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-200 shrink-0">
                  <DoorClosed className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-3xl font-black text-slate-900 group-hover:text-teal-700 transition-colors duration-150">
                  {totalRuangan}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400">Ruangan</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-600 font-bold whitespace-nowrap gap-1">
              <span>{ruangKelasCount} Kelas</span>
              <span>•</span>
              <span>{labCount} Lab</span>
              <span>•</span>
              <span>{perpusCount} Perpus</span>
            </div>
            <div className="mt-2 text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-teal-600 inline-flex items-center gap-0.5 transition-colors">
                <span>Buka Galeri Foto Sarpras</span>
                <ArrowDown className="w-2.5 h-2.5 group-hover:translate-y-0.5 transition-transform duration-150" />
              </span>
            </div>
          </div>

          {/* KARTU 4: TOTAL DANA OPERASIONAL (Poin 7) */}
          <div
            onClick={() => scrollToSection("section-alokasi-bos")}
            className="group relative bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
            title="Klik untuk melihat Transparansi Dana BOSNAS & BOSDA"
          >
            {/* Top Accent Highlight Reveal */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase text-slate-400 tracking-wider truncate">
                  Pagu BOS
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shrink-0">
                  <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors duration-150">
                  Rp {((bosRegulerVal + bosdaVal) / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                </span>
                <span className="text-[9px] sm:text-xs font-bold text-slate-400">Jt/Th</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[9.5px] sm:text-xs font-bold">
              <span className="text-slate-500">100% Salur</span>
              <span className="text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-200 text-[9px] sm:text-[10.5px]">
                Serap 95.8%
              </span>
            </div>
            <div className="mt-2 text-right hidden sm:block">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* SISI KIRI: PETA INTERAKTIF (7 Kolom) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
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
            <div className="relative flex-1 min-h-[280px] sm:min-h-[460px] w-full overflow-hidden bg-slate-100">
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
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0">
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
                  <ProtectedPhoneContact phone={school.no_hp_kepsek} />
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
                {school.nomor_telepon && school.nomor_telepon !== "-" && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50 px-1.5 rounded transition-colors">
                    <span className="text-slate-500">Telepon Kantor / TU:</span>
                    <a
                      href={`tel:${school.nomor_telepon}`}
                      className="font-semibold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1"
                      title="Klik untuk menghubungi telepon kantor"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{school.nomor_telepon}</span>
                    </a>
                  </div>
                )}
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
                  Fasilitas Digital & Akses Internet Sekolah
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ketersediaan jaringan internet, sarana digital, dan platform pembelajaran sekolah.
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Terverifikasi Dapodik & BLPT
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

            {/* KARTU C: BLPT FOR EDUCATION & LMS SEKOLAHKU KEREN (Poin 5) */}
            <div className="group relative bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/70 hover:border-amber-300 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    UPTD BLPT Disdik Prov Sulteng
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-1 group-hover:text-amber-700 transition-colors">
                  BLPT for Education
                </h4>
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-2xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                    {blptSertifGuru}
                  </span>
                  <span className="text-xs font-bold text-slate-500">Guru Bersertifikat</span>
                  <span className="ml-auto text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                    {blptSertifPct}% GTK
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  Pendidik telah menyelesaikan diklat kompetensi digital pada platform pembelajaran daerah & pemanfaatan.
                </p>

                {/* Direct Link to LMS Sekolahku Keren */}
                <a
                  href="https://lms.sekolahkukeren.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-2xs hover:shadow-xs transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer group/btn"
                  title="Buka Learning Management System Sekolahku Keren"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Buka LMS Sekolahku Keren</span>
                  <ExternalLink className="w-3 h-3 opacity-80 group-hover/btn:translate-x-0.5 transition-transform" />
                </a>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => setIsBlptModalOpen(true)}
                  className="text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Rincian Sertifikasi</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                <span className="text-emerald-600 font-bold">Aktif LMS</span>
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
                    Rapor Pendidikan (Asesmen Nasional 2025)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluasi resmi capaian mutu belajar siswa dan iklim sekolah dari Kemendikbudristek.
                </p>
              </div>
              <button
                onClick={() => setIsRaporModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all duration-200 border border-blue-200 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 active:scale-95 cursor-pointer self-start sm:self-auto group"
              >
                <span>Lihat Rapor Lengkap</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
              </button>
            </div>

            {/* 6 Dimensi Rapor Mutu Riil */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Kemampuan Literasi",
                  badge: rapor?.literasi_label ?? (rapor ? "Belum Ada" : "—"),
                  style: getCapaianStyle(rapor?.literasi_label),
                  delta: formatDeltaInfo(rapor?.literasi_perubahan, rapor?.literasi_delta),
                  desc: rapor?.literasi_peringkat_prov
                    ? `${formatPeringkatText(rapor.literasi_peringkat_prov)} di Prov. Sulteng`
                    : "Kemampuan membaca & memahami teks",
                },
                {
                  label: "Kemampuan Numerasi",
                  badge: rapor?.numerasi_label ?? (rapor ? "Belum Ada" : "—"),
                  style: getCapaianStyle(rapor?.numerasi_label),
                  delta: formatDeltaInfo(rapor?.numerasi_perubahan, rapor?.numerasi_delta),
                  desc: rapor?.numerasi_peringkat_kab
                    ? `${formatPeringkatText(rapor.numerasi_peringkat_kab)} di Kab/Kota`
                    : "Kemampuan penalaran matematika",
                },
                {
                  label: "Karakter Siswa",
                  badge: rapor?.karakter_label ?? (rapor ? "Belum Ada" : "—"),
                  style: getCapaianStyle(rapor?.karakter_label),
                  delta: formatDeltaInfo(rapor?.karakter_perubahan, rapor?.karakter_delta),
                  desc: rapor?.karakter_peringkat_prov
                    ? `${formatPeringkatText(rapor.karakter_peringkat_prov)} di Prov. Sulteng`
                    : "Sikap & budi pekerti murid",
                },
                {
                  label: "Iklim Keamanan",
                  badge: rapor?.keamanan_label ?? (rapor ? "Belum Ada" : "—"),
                  style: getCapaianStyle(rapor?.keamanan_label),
                  delta: formatDeltaInfo(rapor?.keamanan_perubahan, rapor?.keamanan_delta),
                  desc: "Kondusif & bebas perundungan",
                },
                {
                  label: "Iklim Kebinekaan",
                  badge: rapor?.kebinekaan_label ?? (rapor ? "Belum Ada" : "—"),
                  style: getCapaianStyle(rapor?.kebinekaan_label),
                  delta: formatDeltaInfo(rapor?.kebinekaan_perubahan, rapor?.kebinekaan_delta),
                  desc: "Toleransi & kerukunan warga sekolah",
                },
                {
                  label: "Kualitas Pembelajaran",
                  badge: rapor?.kualitas_kbm_label ?? (rapor ? "Belum Ada" : "—"),
                  style: getCapaianStyle(rapor?.kualitas_kbm_label),
                  delta: formatDeltaInfo(rapor?.kualitas_kbm_perubahan, rapor?.kualitas_kbm_delta),
                  desc: "Metode & interaksi belajar di kelas",
                },
              ].map((dim, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/70 hover:border-blue-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150 cursor-default flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-1 mb-2">
                      <span className="text-[11px] font-bold text-slate-700 leading-tight">
                        {dim.label}
                      </span>
                      {dim.delta && (
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full shrink-0 border ${
                            dim.delta.color === "emerald"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : dim.delta.color === "rose"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {dim.delta.text}
                        </span>
                      )}
                    </div>
                    <div className="mb-2">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border shadow-2xs ${dim.style.badgeBg}`}
                      >
                        {dim.badge}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
                    {dim.desc}
                  </p>
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
                    Status Siswa & Pencegahan Putus Sekolah
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemantauan keaktifan belajar siswa dan penanganan anak rentan putus sekolah.
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
                      Rapor Pendidikan Tahun 2025 — {school.nama}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rapor ? (rapor.literasi_label === 'Kurang' || rapor.numerasi_label === 'Kurang' ? 'bg-rose-50 text-rose-700 border-rose-200' : rapor.numerasi_label === 'Sedang' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      Status: {raporSummary.statusText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Data Resmi Kemendikbudristek RI · Hasil Asesmen Nasional (AN) & Survei Lingkungan Belajar (Sulingjar)
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
              <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-emerald-50/60 rounded-xl p-4 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    RINGKASAN CAPAIAN MUTU SEKOLAH
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {raporSummary.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {raporSummary.desc}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200/60">
                  <div className="text-center px-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      STATUS CAPAIAN
                    </span>
                    <span className={`text-base font-black ${raporSummary.statusColor}`}>
                      {raporSummary.statusText}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center px-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      IKLIM SEKOLAH
                    </span>
                    <span className="text-base font-black text-indigo-600">
                      {rapor?.keamanan_label ? (rapor.keamanan_label.toLowerCase().includes("baik") ? "KONDUSIF" : rapor.keamanan_label.toUpperCase()) : "KONDUSIF"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hasil Asesmen Nasional */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-blue-600" />
                    Hasil Asesmen Nasional (AN) Murid
                  </h5>
                  <span className="text-[11px] text-slate-400">Target Asesmen: Siswa {isMenengah ? "Kelas XI" : "Tingkat Akhir"}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Literasi */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Kemampuan Literasi</span>
                        {formatDeltaInfo(rapor?.literasi_perubahan, rapor?.literasi_delta) && (
                          <span className={`border text-[10px] font-semibold px-2 py-0.5 rounded-full ${formatDeltaInfo(rapor?.literasi_perubahan, rapor?.literasi_delta)?.color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {formatDeltaInfo(rapor?.literasi_perubahan, rapor?.literasi_delta)?.text}
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-black border shadow-2xs ${getCapaianStyle(rapor?.literasi_label).badgeBg}`}>
                          {rapor?.literasi_label ?? "Belum Ada Data"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                        Kemampuan murid dalam memahami, menggunakan, dan merefleksikan bacaan teks.
                      </p>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-500 pt-2.5 border-t border-slate-200/60">
                      <div className="flex justify-between">
                        <span>Peringkat di Prov. Sulteng:</span>
                        <strong className="text-slate-800 font-semibold">{formatPeringkatText(rapor?.literasi_peringkat_prov)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Peringkat di Kab/Kota:</span>
                        <strong className="text-slate-800 font-semibold">{formatPeringkatText(rapor?.literasi_peringkat_kab)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Numerasi */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Kemampuan Numerasi</span>
                        {formatDeltaInfo(rapor?.numerasi_perubahan, rapor?.numerasi_delta) && (
                          <span className={`border text-[10px] font-semibold px-2 py-0.5 rounded-full ${formatDeltaInfo(rapor?.numerasi_perubahan, rapor?.numerasi_delta)?.color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {formatDeltaInfo(rapor?.numerasi_perubahan, rapor?.numerasi_delta)?.text}
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-black border shadow-2xs ${getCapaianStyle(rapor?.numerasi_label).badgeBg}`}>
                          {rapor?.numerasi_label ?? "Belum Ada Data"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                        Kemampuan nalar konsep matematika dan pemecahan masalah kuantitatif.
                      </p>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-500 pt-2.5 border-t border-slate-200/60">
                      <div className="flex justify-between">
                        <span>Peringkat di Prov. Sulteng:</span>
                        <strong className="text-slate-800 font-semibold">{formatPeringkatText(rapor?.numerasi_peringkat_prov)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Peringkat di Kab/Kota:</span>
                        <strong className="text-slate-800 font-semibold">{formatPeringkatText(rapor?.numerasi_peringkat_kab)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Karakter */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">Karakter Siswa</span>
                        {formatDeltaInfo(rapor?.karakter_perubahan, rapor?.karakter_delta) && (
                          <span className={`border text-[10px] font-semibold px-2 py-0.5 rounded-full ${formatDeltaInfo(rapor?.karakter_perubahan, rapor?.karakter_delta)?.color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {formatDeltaInfo(rapor?.karakter_perubahan, rapor?.karakter_delta)?.text}
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-black border shadow-2xs ${getCapaianStyle(rapor?.karakter_label).badgeBg}`}>
                          {rapor?.karakter_label ?? "Belum Ada Data"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                        Sikap kemandirian, gotong royong, nalar kritis, dan budi pekerti peserta didik.
                      </p>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-500 pt-2.5 border-t border-slate-200/60">
                      <div className="flex justify-between">
                        <span>Peringkat di Prov. Sulteng:</span>
                        <strong className="text-slate-800 font-semibold">{formatPeringkatText(rapor?.karakter_peringkat_prov)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Peringkat di Kab/Kota:</span>
                        <strong className="text-slate-800 font-semibold">{formatPeringkatText(rapor?.karakter_peringkat_kab)}</strong>
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
                  <span className="text-[11px] text-slate-400">Instrumen Responden: Guru & Kepala Sekolah</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block mb-1.5">Kualitas Pembelajaran</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${getCapaianStyle(rapor?.kualitas_kbm_label).badgeBg} mb-2`}>
                        {rapor?.kualitas_kbm_label ?? "Belum Ada"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Manajemen kelas tertib, arahan mengajar jelas, dan keaktifan murid di kelas.
                    </p>
                  </div>

                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block mb-1.5">Iklim Keamanan</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${getCapaianStyle(rapor?.keamanan_label).badgeBg} mb-2`}>
                        {rapor?.keamanan_label ?? "Belum Ada"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Bebas dari perundungan (bullying), hukuman fisik, dan rasa aman di sekolah.
                    </p>
                  </div>

                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block mb-1.5">Iklim Kebinekaan</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${getCapaianStyle(rapor?.kebinekaan_label).badgeBg} mb-2`}>
                        {rapor?.kebinekaan_label ?? "Belum Ada"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Toleransi terhadap keragaman agama, suku, dan saling menghargai sesama warga sekolah.
                    </p>
                  </div>

                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block mb-1.5">Iklim Inklusivitas</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${getCapaianStyle(rapor?.inklusivitas_label).badgeBg} mb-2`}>
                        {rapor?.inklusivitas_label ?? "Belum Ada"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Layanan ramah bagi murid dari berbagai latar belakang dan disabilitas.
                    </p>
                  </div>

                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block mb-1.5">Kesiapsiagaan Bencana</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold border ${getCapaianStyle(rapor?.bencana_label).badgeBg} mb-2`}>
                        {rapor?.bencana_label ?? "Belum Ada"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Kesiapan mitigasi dan jalur evakuasi keselamatan sekolah di daerah rawan bencana.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rekomendasi PBD Dinamis */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-amber-500" />
                    Rekomendasi Pembenahan (Perencanaan Berbasis Data)
                  </h5>
                  <span className="text-[11px] text-slate-400">Saran Tindak Lanjut Berdasarkan Capaian Nyata</span>
                </div>
                <div className="space-y-2.5">
                  {dynamicRecs.map((rec) => (
                    <div
                      key={rec.no}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                        rec.color === "rose"
                          ? "bg-rose-50/50 border-rose-200/70"
                          : rec.color === "amber"
                          ? "bg-amber-50/50 border-amber-200/70"
                          : rec.color === "indigo"
                          ? "bg-indigo-50/50 border-indigo-200/70"
                          : rec.color === "emerald"
                          ? "bg-emerald-50/50 border-emerald-200/70"
                          : "bg-blue-50/50 border-blue-200/70"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                          rec.color === "rose"
                            ? "bg-rose-600"
                            : rec.color === "amber"
                            ? "bg-amber-500"
                            : rec.color === "indigo"
                            ? "bg-indigo-600"
                            : rec.color === "emerald"
                            ? "bg-emerald-600"
                            : "bg-blue-600"
                        }`}
                      >
                        {rec.no}
                      </span>
                      <div className="text-xs flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <strong className="text-slate-900 font-bold block">
                            {rec.title}
                          </strong>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-white/80 border border-slate-200/70 text-slate-600">
                            {rec.fokus}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">
                          {rec.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 text-xs">
              <span className="text-slate-400 text-[11px]">
                Sumber: Pusat Asesmen Pendidikan (Pusmendik) · Kemendikbudristek RI Data 2025
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => alert(`Fitur unduh ringkasan rapor mutu untuk sekolah ${school.nama} akan segera hadir!`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-150 cursor-pointer"
                  type="button"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Unduh Ringkasan Mutu</span>
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

                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full min-w-[500px] text-left text-xs">
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

      {/* ── Modal Rincian Sertifikasi Pendidik BLPT & LMS Sekolahku Keren ── */}
      {isBlptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                    Sertifikasi Pendidik BLPT & LMS Sekolahku Keren
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {school.nama} • UPTD BLPT Disdik Provinsi Sulawesi Tengah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBlptModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                type="button"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
              {/* Ringkasan Angka Statistik */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80">
                  <span className="text-slate-500 font-medium block text-[11px]">Guru Bersertifikat</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-amber-900">{blptSertifGuru}</span>
                    <span className="text-[11px] font-bold text-amber-700">/ {totalGuru} Guru</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">{blptSertifPct}% Capaian Sekolah</span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80">
                  <span className="text-slate-500 font-medium block text-[11px]">Chromebook Terkelola</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-blue-900">{chromebookCount}</span>
                    <span className="text-[11px] font-bold text-blue-700">Unit</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">Chrome Device Mgmt (CDM)</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                  <span className="text-slate-500 font-medium block text-[11px]">Status LMS Daerah</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-black text-emerald-900">Terintegrasi</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">lms.sekolahkukeren.id</span>
                </div>
              </div>

              {/* Rincian Bidang Pelatihan & Modul Bersertifikat */}
              <div className="space-y-3">
                <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Daftar Kompetensi & Sertifikasi Pelatihan Digital</span>
                </h5>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  <div className="p-3.5 bg-slate-50/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Pemanfaatan LMS Sekolahku Keren & Kelas Interaktif</p>
                      <p className="text-[11px] text-slate-500">Penyusunan RPP digital, bahan ajar interaktif, dan kuis daring</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs shrink-0">
                      {sertifLmsMandiri} Guru Lulus
                    </span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Optimalisasi Akun Belajar.id & Google Workspace for Education</p>
                      <p className="text-[11px] text-slate-500">Kolaborasi Google Docs, Classroom, Drive Terkelola, dan Form Asesmen</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs shrink-0">
                      {Math.min(totalGuru, Math.round(blptSertifGuru * 0.8))} Guru Lulus
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Pemanfaatan Papan Interaktif Digital (PID / IFP 75" 4K)</p>
                      <p className="text-[11px] text-slate-500">Pengoperasian media visual layar sentuh dalam ruang kelas digital</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-xs shrink-0">
                      {Math.max(2, Math.round(blptSertifGuru * 0.5))} Guru Lulus
                    </span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Asesmen Pembelajaran Berdiferensiasi & Literasi Digital</p>
                      <p className="text-[11px] text-slate-500">Analisis capaian kompetensi siswa kurikulum merdeka via LMS</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs shrink-0">
                      {Math.max(2, Math.round(blptSertifGuru * 0.4))} Guru Lulus
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner Navigasi ke LMS */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-sm">Learning Management System (LMS) Sekolahku Keren</p>
                  <p className="text-[11px] text-amber-100">
                    Platform resmi pembelajaran digital dan peningkatan kompetensi guru binaan Dinas Pendidikan Provinsi Sulawesi Tengah.
                  </p>
                </div>
                <a
                  href="https://lms.sekolahkukeren.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white text-amber-700 hover:bg-amber-50 font-extrabold text-xs shrink-0 inline-flex items-center gap-1.5 shadow-xs hover:shadow transition-all duration-150 active:scale-95 cursor-pointer"
                >
                  <span>Kunjungi LMS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 text-xs">
              <span className="text-slate-400 text-[11px]">
                Data Terintegrasi UPTD BLPT Disdik Provinsi Sulawesi Tengah
              </span>
              <button
                onClick={() => setIsBlptModalOpen(false)}
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
