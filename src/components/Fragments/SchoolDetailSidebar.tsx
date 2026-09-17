import React, { useState } from "react";

import { X, School, User, Phone, MapPin, Info, Copy, Check, Layers, Award, Users, TrendingUp, Calendar, GraduationCap, UserCheck, Eye, EyeOff } from "lucide-react";

interface SchoolDetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  school: any;
}

// Deterministic mock generator based on school attributes for highly consistent and realistic dummy data
const getMockPrincipal = (schoolId: string, schoolName: string) => {
  const names = [
    "Drs. H. Ahmad Fauzi, M.Pd.",
    "Dr. I Wayan Sudarta, S.Pd., M.Si.",
    "Siti Rahmawati, S.Pd., M.Pd.",
    "Hendra Wijaya, S.T., M.Kom.",
    "Ni Made Lestari, M.Pd.",
    "Drs. Syarifuddin, M.Si.",
    "Sri Wahyuni, S.Pd., M.Hum.",
    "Dr. Irwan Setiawan, M.Pd.",
    "Andi Hermawan, S.Pd., M.T.",
    "Hj. Nurhayati, S.Pd., M.Pd."
  ];

  const statuses = [
    "PNS (Pembina Utama Muda, IV/c)",
    "PNS (Pembina Tingkat I, IV/b)",
    "PNS (Pembina, IV/a)",
    "PNS (Penata Tingkat I, III/d)",
    "PPPK (Ahli Madya)",
    "PPPK (Ahli Muda)"
  ];

  let hash = 0;
  const idStr = String(schoolId || schoolName || "");
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const name = names[hash % names.length];
  const status = statuses[hash % statuses.length];
  
  const birthYear = 1965 + (hash % 20); // 1965 to 1985
  const birthMonth = String(1 + (hash % 12)).padStart(2, "0");
  const birthDay = String(1 + (hash % 28)).padStart(2, "0");
  const recruitYear = birthYear + 25 + (hash % 5);
  const recruitMonth = String(1 + (hash % 12)).padStart(2, "0");
  const gender = (hash % 2) + 1;
  const seqNum = String(100 + (hash % 900));
  const nip = `${birthYear}${birthMonth}${birthDay}${recruitYear}${recruitMonth}${gender}${seqNum}`;
  const phone = `0812-${4000 + (hash % 5000)}-${1000 + (hash % 8000)}`;

  return { name, status, nip, phone };
};

// Deterministic school stats generator for rich educational, deadline, and service projection UI data
const getMockSchoolStats = (schoolId: string, schoolName: string) => {
  let hash = 0;
  const idStr = String(schoolId || schoolName || "");
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  // 1. General Education Stats
  const totalTeachers = 15 + (hash % 45); // 15 to 60 teachers
  const pnsPercentage = 50 + (hash % 35); // 50% to 85%
  const pnsCount = Math.round((totalTeachers * pnsPercentage) / 100);
  const nonPnsCount = totalTeachers - pnsCount;
  const certifiedPercentage = 40 + (hash % 45); // 40% to 85%
  const certifiedCount = Math.round((totalTeachers * certifiedPercentage) / 100);
  
  const abkRatios = ["SEIMBANG / IDEAL", "KEKURANGAN GURU", "KELEBIHAN GURU"];
  const abkStatus = abkRatios[hash % abkRatios.length];
  const abkColor = abkStatus.includes("IDEAL") 
    ? "text-emerald-600 bg-emerald-50 border border-emerald-100" 
    : (abkStatus.includes("KEKURANGAN") ? "text-rose-600 bg-rose-50 border border-rose-100" : "text-amber-600 bg-amber-50 border border-amber-100");

  // 2. Upcoming Due Dates (Jatuh Tempo)
  const teacherNames = [
    "Budi Santoso, S.Pd.", "Siti Aminah, M.Pd.", "Drs. Mulyono", 
    "Rina Wijayanti, S.S.", "Agus Setiawan, S.Pd.", "Dewi Lestari, S.Kom.",
    "I Made Yoga, M.Pd.", "Sri Wahyuningsih, S.Pd.", "Faisal Akbar, S.T.",
    "Hj. Kartini, M.Pd.", "Yusuf Habibie, S.Pd.", "Luh Putu Astuti, S.Pd."
  ];

  const dueDates = [
    {
      name: teacherNames[hash % teacherNames.length],
      type: "KGB (Gaji Berkala)",
      time: "12 Hari Lagi",
      date: "04 Juni 2026",
      status: "warning"
    },
    {
      name: teacherNames[(hash + 1) % teacherNames.length],
      type: "Kenaikan Pangkat",
      time: "24 Hari Lagi",
      date: "16 Juni 2026",
      status: "info"
    },
    {
      name: teacherNames[(hash + 2) % teacherNames.length],
      type: "Batas Usia Pensiun",
      time: "3 Bulan Lagi",
      date: "01 September 2026",
      status: "danger"
    }
  ];

  // 3. Service Projections (Proyeksi Pelayanan)
  const months = ["Juni", "Juli", "Agustus", "September"];
  const kgbProjections = months.map((m, idx) => ({
    month: m,
    kgb: 1 + ((hash + idx) % 5),
    pangkat: ((hash + idx * 2) % 3)
  }));

  return {
    totalTeachers,
    pnsCount,
    nonPnsCount,
    certifiedCount,
    certifiedPercentage,
    abkStatus,
    abkColor,
    dueDates,
    kgbProjections
  };
};

export const SchoolDetailSidebar: React.FC<SchoolDetailSidebarProps> = ({
  isOpen,
  onClose,
  school,
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedNip, setCopiedNip] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState(false);

  if (!isOpen || !school) return null;

  const isSwasta = school.name?.toUpperCase().includes("SWASTA");

  // Get deterministic principal info
  const principal = getMockPrincipal(school.id || "", school.name || "");
  const kepsekName = school.kepsek || principal.name;
  const kepsekStatus = school.status_kepsek || principal.status;
  const kepsekNip = school.nip_kepsek || principal.nip;
  const kepsekPhone = school.no_hp_kepsek || principal.phone;

  // Fallbacks for address & kecamatan
  const mockNpsn = school.npsn || `697${Math.abs(parseInt(principal.nip.substring(0, 5), 10) || 54321)}`;
  const mockKecamatan = school.kecamatan || "Kecamatan Palu Timur";
  const mockAddress = school.address || `Jl. Pendidikan Trans Sulawesi No. ${Math.abs(parseInt(principal.nip.substring(5, 7), 10) || 45)}, ${mockKecamatan}, Sulawesi Tengah`;

  // Get deterministic stats
  const stats = getMockSchoolStats(school.id || "", school.name || "");

  const copyToClipboard = (text: string, type: "coords" | "nip") => {
    navigator.clipboard.writeText(text);
    if (type === "coords") {
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } else {
      setCopiedNip(true);
      setTimeout(() => setCopiedNip(false), 2000);
    }
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-[95%] sm:w-[550px] bg-[#F8FCFF]/95 backdrop-blur-md shadow-2xl z-[150] transform transition-transform duration-500 ease-in-out border-l border-slate-100 flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-[110%]"
      }`}
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-[2rem] flex items-center justify-center text-white shadow-xl ${
            isSwasta ? "bg-emerald-600 shadow-emerald-200" : "bg-blue-600 shadow-blue-200"
          }`}>
            <School className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 leading-tight line-clamp-1 uppercase">
              {school.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isSwasta ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
              }`}>
                {isSwasta ? "SWASTA" : "NEGERI"}
              </span>
              {school.grade && (
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {school.grade}
                </span>
              )}
            </div>
            
            {/* Modern Navigation Button */}
            <button
              onClick={() => {
                onClose();
  const url = `/sekolah2/${school.id || "1"}?name=${encodeURIComponent(
    school.name
  )}`;

  window.open(url, "_blank");
              }}
              className="mt-3.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <School className="w-3.5 h-3.5" />
              <span>Kunjungi Website Sekolah</span>
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-[2rem] border border-slate-100 shadow-lg transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
        
        {/* Section 1: NPSN & ID Card */}
        <div className="glass-card rounded-[2rem] p-6 border border-white bg-white/60 shadow-lg space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
            <Info className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-700">Informasi Sekolah</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NPSN</span>
              <span className="font-black text-slate-800 tracking-wider text-sm">{mockNpsn}</span>
            </div>
            <div className="space-y-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kecamatan</span>
              <span className="font-black text-slate-800 text-xs uppercase line-clamp-1">{mockKecamatan}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Kepala Sekolah Details Card */}
        <div className="glass-card rounded-[2rem] p-6 border border-white bg-white/60 shadow-lg space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
            <User className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-700">Kepala Sekolah</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                <User className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap</span>
                <span className="font-bold text-slate-800 text-sm">{kepsekName}</span>
                {kepsekStatus && (
                  <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase mt-1">
                    {kepsekStatus}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">NIP</span>
                  <span className="font-black text-slate-700 tracking-wider text-xs">{kepsekNip}</span>
                </div>
                {kepsekNip && (
                  <button
                    onClick={() => copyToClipboard(kepsekNip, "nip")}
                    className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    {copiedNip ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-black">Salin Berhasil</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin NIP</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kontak Pimpinan</span>
                    <button
                      type="button"
                      onClick={() => setRevealedPhone(!revealedPhone)}
                      className="group text-[10px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {revealedPhone ? (
                        <>
                          <EyeOff className="w-3 h-3 text-slate-400/50 group-hover:text-slate-600 transition-colors" />
                          <span>Tutup</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-slate-400/60 group-hover:text-slate-600 transition-colors" />
                          <span>Lihat No. HP</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="font-bold font-mono text-slate-700 tracking-wider text-xs block mt-1">
                    {revealedPhone || !kepsekPhone
                      ? kepsekPhone
                      : kepsekPhone.length >= 8
                      ? `${kepsekPhone.substring(0, 4)}-••••-${kepsekPhone.substring(kepsekPhone.length - 4)}`
                      : "••••-••••"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Lokasi & Koordinat */}
        <div className="glass-card rounded-[2rem] p-6 border border-white bg-white/60 shadow-lg space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
            <MapPin className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-700">Detail Lokasi</h4>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Lengkap</span>
              <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">
                {mockAddress}
              </p>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Titik Koordinat</span>
                <span className="font-black text-slate-700 tracking-tight text-[11px] block mt-0.5">
                  {school.latitude && school.longitude 
                    ? `${school.latitude}, ${school.longitude}` 
                    : "Koordinat belum terpetakan"}
                </span>
              </div>
              {school.latitude && school.longitude && (
                <button
                  onClick={() => copyToClipboard(`${school.latitude}, ${school.longitude}`, "coords")}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl shadow transition-all cursor-pointer"
                  title="Salin Koordinat"
                >
                  {copiedCoords ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Data Umum Pendidikan */}
        <div className="glass-card rounded-[2rem] p-6 border border-white bg-white/60 shadow-lg space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-700">Data Umum Pendidikan</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total GTK</span>
                <span className="font-black text-slate-800 text-sm">{stats.totalTeachers} Guru</span>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status PNS</span>
                <span className="font-black text-slate-800 text-[10px] leading-tight">{stats.pnsCount} PNS / {stats.nonPnsCount} Hon</span>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 col-span-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sertifikasi Guru</span>
                  <span className="text-[10px] font-black text-emerald-600">{stats.certifiedPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200/50 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${stats.certifiedPercentage}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center col-span-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Kebutuhan Guru (ABK)</span>
              <span className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wide inline-block text-center ${stats.abkColor}`}>
                {stats.abkStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Jatuh Tempo Kepegawaian */}
        <div className="glass-card rounded-[2rem] p-6 border border-white bg-white/60 shadow-lg space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-700">Jatuh Tempo Kepegawaian</h4>
          </div>

          <div className="space-y-3">
            {stats.dueDates.map((item, idx) => {
              const borderColors: Record<string, string> = {
                warning: "border-l-amber-500 bg-amber-50/20",
                info: "border-l-blue-500 bg-blue-50/20",
                danger: "border-l-rose-500 bg-rose-50/20"
              };
              const tagColors: Record<string, string> = {
                warning: "bg-amber-50 text-amber-600 border border-amber-100",
                info: "bg-blue-50 text-blue-600 border border-blue-100",
                danger: "bg-rose-50 text-rose-600 border border-rose-100"
              };

              return (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border-l-4 border-slate-100 flex items-center justify-between ${borderColors[item.status]}`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-800 block">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{item.type}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400 font-black">{item.date}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ${tagColors[item.status]}`}>
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 6: Proyeksi Pelayanan */}
        <div className="glass-card rounded-[2rem] p-6 border border-white bg-white/60 shadow-lg space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-700">Proyeksi Pelayanan KGB & Pangkat</h4>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimasi Kasus Administrasi (4 Bulan ke Depan)</span>
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {stats.kgbProjections.map((proj, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">{proj.month} 2026</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      <span className="text-blue-600">{proj.kgb} KGB</span> • <span className="text-indigo-600">{proj.pangkat} Pkt</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/40 rounded-full h-2 flex overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${(proj.kgb / 8) * 100}%` }} title="KGB" />
                    <div className="bg-indigo-500 h-full transition-all border-l border-white/50" style={{ width: `${(proj.pangkat / 8) * 100}%` }} title="Kenaikan Pangkat" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase px-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                <span>KGB (Berkala)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
                <span>Kenaikan Pangkat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Visual Report Progress (Premium Design Element) */}
        <div className="glass-card rounded-[2rem] p-6 border border-white bg-white/60 shadow-lg space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
            <Layers className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-700">Laporan Bulanan Kepegawaian</h4>
          </div>

          <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Kelengkapan Berkas</span>
              <span className="font-black text-blue-600">85% Lengkap</span>
            </div>
            <div className="w-full bg-slate-200/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                style={{ width: "85%" }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Aktif di Dapodik / ASN Smart</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer / Copyright */}
      <div className="p-6 border-t border-slate-100 bg-white/80 shrink-0 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        Sistem Informasi Kepegawaian Dinas Pendidikan Sulteng
      </div>
    </div>
  );
};
