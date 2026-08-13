import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronRight, Calendar, Clock, ArrowLeft, Play, Search,
  Eye, Mail, Phone,
  Newspaper, Users, Library, Zap,
  CheckCircle, ArrowUpRight, GraduationCap, Award, Building,
  Loader2, MapPin, Globe
} from "lucide-react";
import { PemetaanService } from "@/services/pemetaanService";
import type { SekolahDetailResponse } from "@/types";

// --- Mock Data (konten statis yang belum ada endpoint-nya) ---
const newsItems = [
  { tag: "Prestasi", title: "Raih Juara I Olimpiade Sains Tingkat Provinsi 2022", date: "28 Nov 2022", img: "🏆", readTime: "3 mnt" },
  { tag: "Umum", title: "Lestarikan Keragaman Budaya Nusantara, Eversac Gelar Lomba", date: "1 Des 2022", img: "🎨", readTime: "5 mnt" },
  { tag: "Pendidikan", title: "Perkuat Pendidikan Karakter Kemendikbudristek Gelar PUSAKA", date: "1 Des 2022", img: "📚", readTime: "4 mnt" },
];

const videos = [
  { title: "Hari Pendidikan Nasional Tahun 2022", duration: "10:00", views: "15rb", thumb: "🎓" },
  { title: "Launching Panduan Lalu Lintas", duration: "20:40", views: "12rb", thumb: "🚦" },
  { title: "Webinar Implementasi Kurikulum Merdeka", duration: "08:40", views: "18rb", thumb: "💻" },
];

const facilities = [
  { icon: "🔬", title: "Laboratorium Sains", desc: "Lab terpadu biologi, kimia, dan fisika berstandar nasional." },
  { icon: "💻", title: "Pusat Komputer", desc: "Fasilitas 40 PC iMac dengan koneksi fiber optik 1 Gbps." },
  { icon: "⚽", title: "Sport Center", desc: "Lapangan indoor basket, voli, dan futsal multifungsi." },
];

export const SchoolLandingV3 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  const schoolName = queryParams.get("name") || `SMA Negeri (ID: ${id})`;

  // ── State data sekolah dari API ────────────────────────────────────────────
  const [sekolahData, setSekolahData] = useState<SekolahDetailResponse["data"] | null>(null);
  const [sekolahLoading, setSekolahLoading] = useState(true);

  // Derived data dari API dengan fallback graceful
  const npsn         = sekolahData?.npsn ?? id ?? "-";
  const kecamatan    = sekolahData?.kecamatan ?? "-";
  const kabupaten    = sekolahData?.kabupaten ?? "-";
  const email        = sekolahData?.email ?? "-";
  const telepon      = sekolahData?.nomor_telepon ?? "-";
  const website      = sekolahData?.website ?? null;
  const akreditasi   = sekolahData?.akreditasi ?? "-";
  const studentCount = sekolahData?.jumlah_siswa ?? 0;
  const dayaTampung  = sekolahData?.daya_tampung ?? 0;
  const statusSekolah = sekolahData?.status_sekolah ?? "-";
  const bentukPendidikan = sekolahData?.bentuk_pendidikan ?? "-";
  const alamat       = sekolahData?.alamat_jalan ?? "-";
  const is3T         = sekolahData?.is_3t ?? false;
  const aksesInternet = sekolahData?.akses_internet ?? "-";

  // Dari detailSma
  const kepsek       = sekolahData?.detailSma?.kepsek ?? "-";
  const nipKepsek    = sekolahData?.detailSma?.nip_kepsek ?? "-";
  const hpKepsek     = sekolahData?.detailSma?.no_hp_kepsek ?? null;
  const statusKepsek = sekolahData?.detailSma?.status_kepsek ?? "-";

  // Komposisi guru dari detailSma (belum tersedia dari backend, akan diisi nanti)
  // const pnsCount = 0;
  // const totalTeachers = 0;

  const [scrolled, setScrolled] = useState(false);

  // ── Fetch detail sekolah dari API pemetaan ─────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setSekolahLoading(true);
    PemetaanService.getSekolahDetail(id)
      .then((res) => {
        if (res?.data) setSekolahData(res.data);
      })
      .catch((err) => console.error("Gagal fetch detail sekolah:", err))
      .finally(() => setSekolahLoading(false));
  }, [id]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const fullAddress = [alamat !== "-" ? alamat : null, kecamatan !== "-" ? `Kec. ${kecamatan}` : null, kabupaten !== "-" ? kabupaten : null, "Sulawesi Tengah"].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[#050B14] text-white font-poppins selection:bg-blue-500 selection:text-white">
      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0A1128]/90 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(-1)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-white text-lg leading-none block">{schoolName}</span>
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Portal Resmi</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Beranda", id: "hero" },
              { label: "Profil", id: "profil" },
              { label: "Berita", id: "berita" },
              { label: "Galeri & Video", id: "media" },
              { label: "Fasilitas", id: "fasilitas" },
            ].map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="text-xs font-bold text-white/70 hover:text-white uppercase tracking-wider transition-colors">
                {item.label}
              </button>
            ))}
          </div>

          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold uppercase transition-all">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Tahun Ajaran 2025/2026
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight">
              Pendidikan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Berkualitas</span> Untuk Masa Depan.
            </h1>
            
            <p className="text-lg text-white/60 leading-relaxed max-w-xl">
              Selamat datang di {schoolName}. Kami berkomitmen mencetak generasi unggul yang berkarakter, inovatif, dan siap bersaing di era digital berlandaskan budaya Nusantara.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button onClick={() => scrollTo("profil")} className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2">
                Jelajahi Profil <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => scrollTo("berita")} className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-wider text-sm transition-all flex items-center gap-2">
                <Newspaper className="w-4 h-4" /> Berita Terbaru
              </button>
            </div>
          </div>
          
          <div className="relative lg:h-[600px] flex items-center justify-center">
            {/* Abstract 3D/Glassmorphism Representation */}
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-purple-600/30 rounded-3xl backdrop-blur-3xl border border-white/10 transform rotate-6 animate-[pulse_4s_ease-in-out_infinite]" />
              <div className="absolute inset-4 bg-[#0A1128] rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col">
                <div className="h-1/2 bg-gradient-to-br from-blue-500/20 to-transparent p-8 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/70">
                      {sekolahLoading ? "..." : akreditasi !== "-" ? `Akreditasi ${akreditasi}` : "Akreditasi -"}
                    </span>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">
                      {sekolahLoading ? <Loader2 className="w-6 h-6 animate-spin text-white/30" /> : studentCount.toLocaleString("id-ID")}
                    </div>
                    <div className="text-xs text-white/50 uppercase font-bold tracking-wider">Siswa Aktif</div>
                  </div>
                </div>
                <div className="h-1/2 bg-white/5 p-8 flex gap-4">
                   <div className="flex-1 bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center text-center">
                      <Award className="w-6 h-6 text-indigo-400 mb-2" />
                      <div className="text-xl font-black text-white">
                        {sekolahLoading ? "..." : dayaTampung.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Daya Tampung</div>
                   </div>
                   <div className="flex-1 bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-center items-center text-center">
                      <Building className="w-6 h-6 text-emerald-400 mb-2" />
                      <div className="text-xl font-black text-white">
                        {sekolahLoading ? "..." : studentCount > 0 ? Math.round(studentCount / 32) : "-"}
                      </div>
                      <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Rombel</div>
                   </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -right-8 top-1/4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl animate-[bounce_3s_ease-in-out_infinite]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">NPSN Aktif</div>
                    <div className="text-xs text-white/60">{sekolahLoading ? "..." : npsn}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PROFIL & STATISTIK SECTION --- */}
      <section id="profil" className="py-24 bg-[#080E1A] relative border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-wider">Sekilas Profil</h2>
            <p className="text-white/60 text-sm leading-relaxed">Informasi umum dan statistik utama pendidik dan peserta didik.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 bg-gradient-to-br from-white/[0.03] to-transparent p-8 rounded-3xl border border-white/10 flex flex-col justify-center">
                <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-2">Visi Kami</h3>
                <p className="text-xl font-medium text-white/90 leading-relaxed italic mb-8">
                  "Mewujudkan generasi penerus bangsa yang unggul dalam IPTEK, berkarakter kuat, berakhlak mulia, dan berdaya saing global."
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">👨‍💼</div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase font-black tracking-wider">Kepala Sekolah</div>
                      <div className="text-sm font-bold text-white">{sekolahLoading ? "Memuat..." : kepsek}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-2xl">📍</div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase font-black tracking-wider">Lokasi</div>
                      <div className="text-sm font-bold text-white">
                        {sekolahLoading ? "..." : kecamatan !== "-" ? `Kec. ${kecamatan}` : kabupaten}
                      </div>
                    </div>
                  </div>
                </div>
             </div>
             
             <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 p-8 rounded-3xl border border-blue-500/20 flex flex-col">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" /> Info Dapodik
                </h3>
                <div className="flex-1 flex flex-col justify-center gap-4">
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span className="text-white/70 font-medium">Status Sekolah</span>
                       <span className="font-bold text-white">{sekolahLoading ? "..." : statusSekolah}</span>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span className="text-white/70 font-medium">Jumlah Siswa</span>
                       <span className="font-bold text-white">{sekolahLoading ? "..." : studentCount.toLocaleString("id-ID")}</span>
                     </div>
                     <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full transition-all duration-700"
                         style={{ width: dayaTampung > 0 ? `${Math.min((studentCount / dayaTampung) * 100, 100)}%` : "0%" }} />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span className="text-white/70 font-medium">Daya Tampung</span>
                       <span className="font-bold text-white">{sekolahLoading ? "..." : dayaTampung.toLocaleString("id-ID")}</span>
                     </div>
                     <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: "100%" }} />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span className="text-white/70 font-medium">Akses Internet</span>
                       <span className="font-bold text-white text-right text-xs max-w-[120px] leading-snug">
                         {sekolahLoading ? "..." : aksesInternet}
                       </span>
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- BERITA & PENGUMUMAN --- */}
      <section id="berita" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wider">Berita & Informasi</h2>
              <p className="text-white/60 text-sm">Kabar terbaru, prestasi, dan pengumuman sekolah.</p>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider">
              Lihat Semua Berita <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsItems.map((news, i) => (
              <div key={i} className="group bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all hover:-translate-y-1">
                <div className="h-48 bg-white/5 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
                  {news.img}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3 text-[10px] font-black uppercase tracking-wider">
                    <span className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded">{news.tag}</span>
                    <span className="text-white/40 flex items-center gap-1"><Calendar className="w-3 h-3" /> {news.date}</span>
                  </div>
                  <h3 className="text-lg font-black text-white/90 leading-snug mb-4 group-hover:text-blue-400 transition-colors">
                    {news.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs font-bold text-white/50 uppercase">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {news.readTime}</span>
                    <span className="text-blue-400 group-hover:underline">Baca Artikel</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MEDIA & VIDEO --- */}
      <section id="media" className="py-24 bg-[#080E1A] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
           <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-wider">Galeri & Video</h2>
            <p className="text-white/60 text-sm leading-relaxed">Dokumentasi kegiatan dan materi pembelajaran visual.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative group cursor-pointer h-[400px]">
              <div className="absolute inset-0 flex items-center justify-center text-9xl opacity-20 transition-transform duration-700 group-hover:scale-110">🎓</div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#080E1A] via-transparent to-transparent opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform">
                   <Play className="w-8 h-8 text-white ml-1" />
                 </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                 <div className="flex gap-3 mb-3 text-xs text-white/60 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> 15rb</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 10:00</span>
                </div>
                <h3 className="text-2xl font-black text-white leading-tight">Hari Pendidikan Nasional Tahun 2022</h3>
              </div>
            </div>

            <div className="flex flex-col gap-6">
               {videos.slice(1).map((vid, i) => (
                 <div key={i} className="flex gap-6 items-center p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/5">
                    <div className="w-32 h-24 rounded-xl bg-white/5 flex items-center justify-center text-3xl shrink-0 relative overflow-hidden">
                       {vid.thumb}
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Play className="w-6 h-6 text-white" />
                       </div>
                       <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-black">{vid.duration}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white/90 leading-snug mb-2 group-hover:text-blue-400 transition-colors">{vid.title}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-white/50 font-bold uppercase tracking-wider">
                         <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {vid.views}</span>
                         <span className="text-blue-400">Tonton Video</span>
                      </div>
                    </div>
                 </div>
               ))}
               <button className="mt-auto py-4 rounded-xl border border-white/10 text-xs font-black text-white/70 uppercase hover:bg-white/5 transition-colors text-center">
                 Lihat Semua Video
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FASILITAS & PERPUSTAKAAN --- */}
      <section id="fasilitas" className="py-24 relative overflow-hidden">
         <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
           <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-wider">Fasilitas & Layanan</h2>
            <p className="text-white/60 text-sm leading-relaxed">Mendukung kegiatan belajar mengajar dengan fasilitas modern.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {facilities.map((fac, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-3xl mb-6 shadow-inner">
                     {fac.icon}
                   </div>
                   <h3 className="text-lg font-black text-white mb-3">{fac.title}</h3>
                   <p className="text-sm text-white/50 leading-relaxed mb-6">{fac.desc}</p>
                   <button className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                     Lihat Detail <ChevronRight className="w-3.5 h-3.5" />
                   </button>
                </div>
             ))}
          </div>

          {/* Perpustakaan Digital Card */}
          <div className="mt-8 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex-1">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-black uppercase mb-4">
                 <Library className="w-3.5 h-3.5" /> e-Library Terintegrasi
               </div>
               <h3 className="text-2xl lg:text-3xl font-black text-white mb-3">Perpustakaan Digital Sekolah</h3>
               <p className="text-white/60 text-sm leading-relaxed max-w-xl mb-6">
                 Akses ribuan koleksi buku pelajaran, jurnal, dan karya ilmiah siswa darimana saja. Dilengkapi modul Kurikulum Merdeka.
               </p>
               <button className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors flex items-center gap-2">
                 <Search className="w-4 h-4" /> Jelajahi Koleksi
               </button>
             </div>
             <div className="w-full md:w-auto flex gap-4 shrink-0">
               <div className="w-24 h-32 bg-white/10 rounded-xl flex items-center justify-center text-4xl shadow-xl -rotate-6 transform hover:rotate-0 transition-transform">📕</div>
               <div className="w-24 h-32 bg-white/10 rounded-xl flex items-center justify-center text-4xl shadow-xl z-10 hover:-translate-y-2 transition-transform">📘</div>
               <div className="w-24 h-32 bg-white/10 rounded-xl flex items-center justify-center text-4xl shadow-xl rotate-6 transform hover:rotate-0 transition-transform">📗</div>
             </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#03060A] pt-20 pb-10 border-t border-white/5">
         <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
               <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-black text-white text-lg tracking-wide">{schoolName}</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed pr-4">
                    {sekolahData?.alamat_jalan ?? "-"}
                  </p>
                  <div className="space-y-2 text-xs font-medium text-white/60">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-400" /> {sekolahData?.email ?? "-"}</div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-blue-400" /> {sekolahData?.nomor_telepon ?? "-"}</div>
                  </div>
               </div>

               <div>
                 <h4 className="text-sm font-black text-white uppercase tracking-wider mb-6">Tautan Utama</h4>
                 <ul className="space-y-3 text-xs font-medium text-white/50">
                   {["Profil Sekolah", "PPDB Online 2026", "Prestasi Siswa", "Direktori Guru", "Fasilitas"].map((link, i) => (
                     <li key={i}><a href="#" className="hover:text-blue-400 transition-colors">{link}</a></li>
                   ))}
                 </ul>
               </div>

               <div>
                 <h4 className="text-sm font-black text-white uppercase tracking-wider mb-6">Terkait</h4>
                 <ul className="space-y-3 text-xs font-medium text-white/50">
                   {["Dinas Pendidikan Sulteng", "Kemdikbud Ristek", "Portal ASN Smart", "BOS Nasional"].map((link, i) => (
                     <li key={i}><a href="#" className="hover:text-blue-400 transition-colors">{link}</a></li>
                   ))}
                 </ul>
               </div>

               <div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                     <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Pusat Bantuan</div>
                     <h4 className="text-base font-black text-white mb-4">Butuh Informasi?</h4>
                     <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase transition-colors">
                       Hubungi Kami
                     </button>
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">
               <p>© 2026 {schoolName}. All rights reserved.</p>
               <div className="flex gap-6">
                 <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                 <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};
