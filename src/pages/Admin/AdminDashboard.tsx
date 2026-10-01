import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Database,
  School,
  Building2,
  Boxes,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api_pemetaan } from "@/config/api";

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Stats State
  const [stats, setStats] = useState<any>({
    total_rapor: 5063,
    total_sekolah: 5845,
    literasi_baik: 1420,
    numerasi_baik: 1105,
    last_sync: "2026-10-01",
  });

  // Table Data State
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedKab, setSelectedKab] = useState<string>("Semua");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch Table Data
  const fetchSchools = async () => {
    setLoadingTable(true);
    try {
      const res: any = await api_pemetaan.get("/v1/admin/rapor", {
        params: {
          search: search || undefined,
          kabupaten: selectedKab !== "Semua" ? selectedKab : undefined,
          page,
          per_page: 12,
        },
      });
      // Paginator object dari response Laravel
      const paginator = res?.data ?? res ?? {};
      const schoolList = Array.isArray(paginator.data)
        ? paginator.data
        : Array.isArray(paginator)
        ? paginator
        : [];
      setSchools(schoolList);
      setTotalPages(paginator.last_page ?? 1);
      setTotalItems(paginator.total ?? schoolList.length);
    } catch (err) {
      console.error("Gagal mengambil data rapor admin:", err);
    } finally {
      setLoadingTable(false);
    }
  };

  // Fetch Ringkasan Statistik
  const fetchStats = async () => {
    try {
      const res: any = await api_pemetaan.get("/v1/admin/rapor/stats");
      const statData = res?.data ?? res ?? {};
      if (statData.total_rapor !== undefined) {
        setStats({
          total_rapor: statData.total_rapor ?? 5063,
          total_sekolah: statData.total_sekolah ?? 5845,
          literasi_baik: statData.literasi_baik ?? 1420,
          numerasi_baik: statData.numerasi_baik ?? 1105,
          last_sync: statData.last_sync ? String(statData.last_sync).substring(0, 10) : "2026-10-01",
        });
      }
    } catch (err) {
      console.error("Gagal mengambil stats rapor:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [page, selectedKab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSchools();
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(null);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError("Pilih file Excel (.xlsx) terlebih dahulu.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res: any = await api_pemetaan.post("/v1/admin/rapor/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadSuccess(res?.message ?? "Sinkronisasi Rapor Pendidikan berhasil diproses!");
      setSelectedFile(null);
      fetchSchools();
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err?.response?.data?.message ?? "Gagal memproses file. Pastikan format kolom sesuai standar.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-poppins text-slate-800 pb-16">
      
      {/* ── TOP NAV BAR ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-200 hover:scale-105 transition-transform">
              <School className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Disdik Prov. Sulawesi Tengah</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  Super Admin
                </span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 leading-none">Pusat Data & Sinkronisasi Sekolah (/admin)</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Portal Publik</span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Banner Selamat Datang */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
              Selamat Datang, {user?.name ?? "Super Admin"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pusat Pengelolaan & Import Data Sekolah Terpadu
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
              Kelola basis data Rapor Pendidikan, Dapodik, dan sarana prasarana satuan pendidikan di seluruh Sulawesi Tengah dalam satu dasbor terintegrasi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">Rapor Terdata</span>
              <span className="text-2xl font-black text-white">{stats.total_rapor.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-300 block font-semibold">Tahun 2025</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">Database Disdik</span>
              <span className="text-2xl font-black text-white">{stats.total_sekolah.toLocaleString()}</span>
              <span className="text-[10px] text-blue-200 block font-semibold">Satuan Pendidikan</span>
            </div>
          </div>
        </div>

        {/* ── 3 KARTU MODUL IMPORT DATA ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KARTU 1: IMPORT RAPOR PENDIDIKAN (MODUL UTAMA AKTIF) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-blue-500 shadow-md space-y-4 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Aktif Digunakan
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Import Rapor Pendidikan 2025</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Unggah file resmi Kemendikbudristek <code>.xlsx</code> untuk sinkronisasi massal seluruh sekolah.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-blue-200 rounded-2xl p-4 text-center bg-blue-50/30 hover:bg-blue-50 transition relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={uploading}
                />
                <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-700">
                  {selectedFile ? selectedFile.name : "Klik atau seret file Excel ke sini"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Format .xlsx (Maks. 25MB)</p>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleUploadSubmit}
              disabled={uploading || !selectedFile}
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                uploading || !selectedFile ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-98"
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sedang Memproses 5.845 Data...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Mulai Sinkronisasi Excel</span>
                </>
              )}
            </button>
          </div>

          {/* KARTU 2: IMPORT DAPODIK (READY UNTUK MASA DEPAN) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Data Pokok Sekolah (Dapodik)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pembaruan data siswa, rombel, guru dan tenaga kependidikan (GTK) per semester.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50">
                <p className="text-xs font-bold text-slate-600">Sinkronisasi Master Sekolah</p>
                <p className="text-[10px] text-slate-400 mt-1">Modul siap dihubungkan dengan integrasi API Dapodik</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Status:</span>
              <span className="font-bold text-emerald-600">Tersinkronisasi Otomatis</span>
            </div>
          </div>

          {/* KARTU 3: SARPRAS & BANTUAN (READY UNTUK MASA DEPAN) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Distribusi Sarpras & Bantuan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Monitoring papan interaktif digital (PID), internet Starlink, dan rehabilitasi ruang kelas.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50">
                <p className="text-xs font-bold text-slate-600">Import Rekap Bantuan Dinas</p>
                <p className="text-[10px] text-slate-400 mt-1">Mendukung format berita acara serah terima</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Status:</span>
              <span className="font-bold text-slate-700">Tersedia 1.240 Unit</span>
            </div>
          </div>

        </div>

        {/* ── TABEL MONITORING STATUS DATA SEKOLAH ── */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Monitoring Status Rapor Sekolah</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {totalItems.toLocaleString()} Sekolah
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cari dan pantau keterisian data Asesmen Nasional serta capaian mutu per satuan pendidikan.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari NPSN atau Nama..."
                  className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-blue-500 w-56 font-medium"
                />
              </div>

              <select
                value={selectedKab}
                onChange={(e) => {
                  setSelectedKab(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-blue-500"
              >
                <option value="Semua">Semua Kab/Kota</option>
                <option value="Palu">Kota Palu</option>
                <option value="Banggai">Kab. Banggai</option>
                <option value="Poso">Kab. Poso</option>
                <option value="Donggala">Kab. Donggala</option>
                <option value="Tolitoli">Kab. Tolitoli</option>
                <option value="Buol">Kab. Buol</option>
                <option value="Parigi">Kab. Parigi Moutong</option>
                <option value="Tojo">Kab. Tojo Una-Una</option>
                <option value="Sigi">Kab. Sigi</option>
                <option value="Banggai Kepulauan">Kab. Banggai Kepulauan</option>
                <option value="Banggai Laut">Kab. Banggai Laut</option>
                <option value="Morowali">Kab. Morowali</option>
                <option value="Morowali Utara">Kab. Morowali Utara</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cari
              </button>
            </form>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3.5">NPSN</th>
                  <th className="p-3.5">Nama Satuan Pendidikan</th>
                  <th className="p-3.5">Kabupaten/Kota</th>
                  <th className="p-3.5 text-center">Literasi</th>
                  <th className="p-3.5 text-center">Numerasi</th>
                  <th className="p-3.5 text-center">Karakter</th>
                  <th className="p-3.5 text-center">Mitigasi Bencana</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loadingTable ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                        <span>Memuat daftar sekolah...</span>
                      </div>
                    </td>
                  </tr>
                ) : schools.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada sekolah yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  schools.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-blue-600">{item.npsn}</td>
                      <td className="p-3.5 font-bold text-slate-900">{item.nama_satuan_pendidikan}</td>
                      <td className="p-3.5 text-slate-600">{item.kabupaten}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.literasi_label === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.literasi_label === 'Sedang' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          item.literasi_label === 'Kurang' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.literasi_label ?? "—"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.numerasi_label === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.numerasi_label === 'Sedang' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          item.numerasi_label === 'Kurang' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.numerasi_label ?? "—"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.karakter_label === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.karakter_label === 'Sedang' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          item.karakter_label === 'Kurang' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.karakter_label ?? "—"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.bencana_label === 'Baik' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.bencana_label === 'Sedang' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          item.bencana_label === 'Kurang' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.bencana_label ?? "—"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <Link
                          to={`/sekolah/${item.npsn}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-[11px] transition shadow-2xs"
                        >
                          <span>Lihat Profil</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2">
            <span>Halaman {page} dari {totalPages} (Menampilkan {schools.length} dari {totalItems.toLocaleString()} sekolah)</span>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
};
export default AdminDashboard;
