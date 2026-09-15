import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminService, type SekolahFormData } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, Save, Loader2 } from "lucide-react";

// ─── Konstanta ────────────────────────────────────────────────────────────────

const JENJANG_OPTIONS = ["TK", "KB", "SPS", "TPA", "RA", "SD", "MI", "SMP", "MTs", "SMA", "MA", "SMK", "SLB", "PKBM", "SKB"];

const CABDIS_KABUPATEN: Record<number, string[]> = {
  1: ["7271", "7210"],         // Palu, Sigi
  2: ["7208", "7203"],         // Parigi Moutong, Donggala
  3: ["7202", "7209"],         // Poso, Tojo Una-Una
  4: ["7206", "7212"],         // Morowali, Morowali Utara
  5: ["7201", "7207", "7211"], // Banggai, Bangkep, Balut
  6: ["7204", "7205"],         // Tolitoli, Buol
};

const KABUPATEN_OPTIONS = [
  { kode: "7271", nama: "Kota Palu" },
  { kode: "7210", nama: "Kab. Sigi" },
  { kode: "7203", nama: "Kab. Donggala" },
  { kode: "7208", nama: "Kab. Parigi Moutong" },
  { kode: "7202", nama: "Kab. Poso" },
  { kode: "7209", nama: "Kab. Tojo Una-Una" },
  { kode: "7206", nama: "Kab. Morowali" },
  { kode: "7212", nama: "Kab. Morowali Utara" },
  { kode: "7201", nama: "Kab. Banggai" },
  { kode: "7207", nama: "Kab. Banggai Kepulauan" },
  { kode: "7211", nama: "Kab. Banggai Laut" },
  { kode: "7204", nama: "Kab. Tolitoli" },
  { kode: "7205", nama: "Kab. Buol" },
];

const EMPTY_FORM: SekolahFormData = {
  nama: "", npsn: "", bentuk_pendidikan: "SD", status_sekolah: "Negeri",
  alamat_jalan: "", kecamatan: "", kabupaten: "", kode_kabupaten: "",
  lintang: "", bujur: "", email: "", nomor_telepon: "", website: "",
  akreditasi: "", jumlah_siswa: "", daya_tampung: "",
  is_3t: false, is_sekolah_alam: false,
};

// ─── Sub-komponen: Field ──────────────────────────────────────────────────────

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all w-full";

// ─── Main Component ───────────────────────────────────────────────────────────

export const AdminSekolahForm = () => {
  const navigate  = useNavigate();
  const { npsn }  = useParams<{ npsn: string }>();
  const isEdit    = !!npsn;
  const { user }  = useAuth();

  const [form, setForm]         = useState<SekolahFormData>(EMPTY_FORM);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Track asal kabupaten/halaman untuk back navigation
  const [backUrl, setBackUrl] = useState<string>("/");

  // Periksa batasan role user
  const role = user?.role || user?.roles?.[0] || "";
  const isKabLocked = role === "admin_kab_kota" && !!user?.kode_kabupaten;

  // Filter pilihan kabupaten sesuai kewenangan akun
  const availableKabupaten = useMemo(() => {
    return KABUPATEN_OPTIONS.filter((k) => {
      if (role === "admin_kab_kota" && user?.kode_kabupaten) {
        return k.kode === user.kode_kabupaten;
      }
      if (role === "admin_cabdis" && user?.cabang_dinas_id) {
        const allowed = CABDIS_KABUPATEN[user.cabang_dinas_id] ?? [];
        return allowed.includes(k.kode);
      }
      return true;
    });
  }, [role, user]);

  // Sync kabupaten name when kode changes
  const handleKodeKabupaten = (kode: string) => {
    const found = KABUPATEN_OPTIONS.find(k => k.kode === kode);
    setForm(f => ({ ...f, kode_kabupaten: kode, kabupaten: found?.nama ?? f.kabupaten }));
  };

  // Load data untuk mode edit atau inisialisasi mode create
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    const kodeKab = params.get("kode_kabupaten");

    if (!isEdit) {
      if (fromParam) {
        setBackUrl(fromParam);
      } else if (kodeKab) {
        setBackUrl(`/kabupaten/${kodeKab}`);
      }

      // Pre-fill kabupaten jika ada dari URL atau jika role terkunci ke 1 kabupaten
      const initialKode = kodeKab || (isKabLocked ? user?.kode_kabupaten : null);
      if (initialKode) {
        handleKodeKabupaten(initialKode);
      }
      return;
    }

    setFetching(true);
    AdminService.getSekolahDetail(npsn!)
      .then((res: any) => {
        const d = res?.data ?? res;
        setForm({
          nama:               d.nama ?? "",
          npsn:               d.npsn ?? "",
          bentuk_pendidikan:  d.bentuk_pendidikan ?? "SD",
          status_sekolah:     d.status_sekolah ?? "Negeri",
          alamat_jalan:       d.alamat_jalan ?? "",
          kecamatan:          d.kecamatan ?? "",
          kabupaten:          d.kabupaten ?? "",
          kode_kabupaten:     d.kode_kabupaten ?? "",
          lintang:            d.lintang ?? "",
          bujur:              d.bujur ?? "",
          email:              d.email ?? "",
          nomor_telepon:      d.nomor_telepon ?? "",
          website:            d.website ?? "",
          akreditasi:         d.akreditasi ?? "",
          jumlah_siswa:       d.jumlah_siswa ?? "",
          daya_tampung:       d.daya_tampung ?? "",
          is_3t:              !!d.is_3t,
          is_sekolah_alam:    !!d.is_sekolah_alam,
        });

        // Set backUrl berdasarkan query param from atau kode_kabupaten sekolah
        if (fromParam) {
          setBackUrl(fromParam);
        } else if (d.kode_kabupaten) {
          setBackUrl(`/kabupaten/${d.kode_kabupaten}`);
        }
      })
      .catch(() => alert("Gagal memuat data sekolah."))
      .finally(() => setFetching(false));
  }, [npsn, isEdit, isKabLocked, user]);

  const set = (field: keyof SekolahFormData, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const copy = { ...e }; delete copy[field]; return copy; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      if (isEdit) {
        await AdminService.updateSekolah(npsn!, form);
      } else {
        await AdminService.createSekolah(form);
      }
      navigate(backUrl); // Redirect ke kabupaten asal
    } catch (err: any) {
      // Tangani Laravel validation errors (422)
      const serverErrors = err?.data?.errors ?? err?.errors;
      if (serverErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(serverErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      } else {
        alert(err?.data?.message ?? err?.message ?? "Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(backUrl)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800">
            {isEdit ? "Edit Sekolah" : "Tambah Sekolah Baru"}
          </h1>
          {isEdit && <p className="text-xs text-slate-400 mt-0.5">NPSN: {npsn}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* ── Identitas Sekolah ─── */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
            Identitas Sekolah
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Nama Sekolah" required>
                <input className={inputCls} value={form.nama} onChange={e => set("nama", e.target.value)} required placeholder="SDN 1 Palu" />
                {errors.nama && <p className="text-[11px] text-red-500 font-semibold">{errors.nama}</p>}
              </Field>
            </div>

            <Field label="NPSN" required>
              <input className={inputCls} value={form.npsn} onChange={e => set("npsn", e.target.value)}
                required placeholder="40200001" disabled={isEdit}
                title={isEdit ? "NPSN tidak bisa diubah" : ""}
              />
              {errors.npsn && <p className="text-[11px] text-red-500 font-semibold">{errors.npsn}</p>}
            </Field>

            <Field label="Jenjang" required>
              <select className={inputCls} value={form.bentuk_pendidikan} onChange={e => set("bentuk_pendidikan", e.target.value)} required>
                {JENJANG_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </Field>

            <Field label="Status" required>
              <select className={inputCls} value={form.status_sekolah} onChange={e => set("status_sekolah", e.target.value)} required>
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
              </select>
            </Field>

            <Field label="Akreditasi">
              <select className={inputCls} value={form.akreditasi} onChange={e => set("akreditasi", e.target.value)}>
                <option value="">- Pilih -</option>
                {["A", "B", "C", "Belum Terakreditasi"].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* ── Lokasi ─── */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
            Lokasi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Alamat Jalan">
                <input className={inputCls} value={form.alamat_jalan} onChange={e => set("alamat_jalan", e.target.value)} placeholder="Jl. Pendidikan No. 1" />
              </Field>
            </div>

            <Field label="Kecamatan">
              <input className={inputCls} value={form.kecamatan} onChange={e => set("kecamatan", e.target.value)} placeholder="Palu Timur" />
            </Field>

            <Field label="Kabupaten/Kota" required>
              <select
                className={inputCls}
                value={form.kode_kabupaten}
                onChange={e => handleKodeKabupaten(e.target.value)}
                required
                disabled={isKabLocked}
              >
                <option value="">- Pilih Kabupaten -</option>
                {availableKabupaten.map(k => <option key={k.kode} value={k.kode}>{k.nama}</option>)}
              </select>
              {errors.kode_kabupaten && <p className="text-[11px] text-red-500 font-semibold">{errors.kode_kabupaten}</p>}
              {isKabLocked && (
                <p className="text-[10.5px] text-slate-400 font-medium">Terkunci otomatis sesuai kewenangan akun admin Anda.</p>
              )}
            </Field>

            <Field label="Lintang (Latitude)">
              <input className={inputCls} type="number" step="any" value={form.lintang} onChange={e => set("lintang", e.target.value)} placeholder="-0.896" />
              {errors.lintang && <p className="text-[11px] text-red-500 font-semibold">{errors.lintang}</p>}
            </Field>

            <Field label="Bujur (Longitude)">
              <input className={inputCls} type="number" step="any" value={form.bujur} onChange={e => set("bujur", e.target.value)} placeholder="119.870" />
              {errors.bujur && <p className="text-[11px] text-red-500 font-semibold">{errors.bujur}</p>}
            </Field>
          </div>
        </section>

        {/* ── Data Tambahan ─── */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
            Data Tambahan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input className={inputCls} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="sekolah@disdik.sulteng.go.id" />
            </Field>

            <Field label="Nomor Telepon">
              <input className={inputCls} value={form.nomor_telepon} onChange={e => set("nomor_telepon", e.target.value)} placeholder="0451-xxxxxx" />
            </Field>

            <Field label="Jumlah Siswa">
              <input className={inputCls} type="number" min="0" value={form.jumlah_siswa} onChange={e => set("jumlah_siswa", e.target.value)} placeholder="0" />
            </Field>

            <Field label="Daya Tampung">
              <input className={inputCls} type="number" min="0" value={form.daya_tampung} onChange={e => set("daya_tampung", e.target.value)} placeholder="0" />
            </Field>

            {/* Checkbox flags */}
            <div className="flex items-center gap-3 py-1">
              <input type="checkbox" id="is_3t" checked={!!form.is_3t} onChange={e => set("is_3t", e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer" />
              <label htmlFor="is_3t" className="text-sm font-semibold text-slate-600 cursor-pointer">
                Sekolah 3T (Terdepan/Terluar/Tertinggal)
              </label>
            </div>

            <div className="flex items-center gap-3 py-1">
              <input type="checkbox" id="is_sekolah_alam" checked={!!form.is_sekolah_alam} onChange={e => set("is_sekolah_alam", e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer" />
              <label htmlFor="is_sekolah_alam" className="text-sm font-semibold text-slate-600 cursor-pointer">
                Sekolah Alam
              </label>
            </div>
          </div>
        </section>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
};
