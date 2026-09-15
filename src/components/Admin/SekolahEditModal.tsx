import React, { useState, useEffect, useMemo } from "react";
import { AdminService, type SekolahFormData } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { X, Save, Loader2, Building2, MapPin, Info } from "lucide-react";

// ─── Konstanta Opsi ──────────────────────────────────────────────────────────

const JENJANG_OPTIONS = [
  "TK", "KB", "SPS", "TPA", "RA",
  "SD", "MI", "SMP", "MTs",
  "SMA", "MA", "SMK", "SLB",
  "PKBM", "SKB",
];

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
  nama: "",
  npsn: "",
  bentuk_pendidikan: "SMA",
  status_sekolah: "Negeri",
  alamat_jalan: "",
  kecamatan: "",
  kabupaten: "",
  kode_kabupaten: "",
  lintang: "",
  bujur: "",
  email: "",
  nomor_telepon: "",
  website: "",
  akreditasi: "",
  jumlah_siswa: "",
  daya_tampung: "",
  is_3t: false,
  is_sekolah_alam: false,
};

// ─── Sub-komponen: Field Input ────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-rose-500 font-semibold mt-0.5">{error}</p>}
  </div>
);

const inputCls =
  "px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white focus:border-blue-400 transition-all w-full text-slate-800 disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed";

// ─── Props Modal ─────────────────────────────────────────────────────────────

interface SekolahEditModalProps {
  isOpen: boolean;
  npsn: string | null;
  onClose: () => void;
  onSuccess: (updatedData: Partial<SekolahFormData>) => void;
}

export const SekolahEditModal: React.FC<SekolahEditModalProps> = ({
  isOpen,
  npsn,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [form, setForm] = useState<SekolahFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"identitas" | "lokasi" | "tambahan">("identitas");

  // Periksa batasan kewenangan role admin
  const role = user?.role || user?.roles?.[0] || "";
  const isKabLocked = role === "admin_kab_kota" && !!user?.kode_kabupaten;

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

  // Load data sekolah saat modal dibuka
  useEffect(() => {
    if (!isOpen || !npsn) {
      setForm(EMPTY_FORM);
      setErrors({});
      setActiveTab("identitas");
      return;
    }

    setFetching(true);
    setErrors({});

    AdminService.getSekolahDetail(npsn)
      .then((res: any) => {
        const d = res?.data ?? res;
        setForm({
          nama:              d.nama ?? "",
          npsn:              d.npsn ?? npsn,
          bentuk_pendidikan: d.bentuk_pendidikan ?? "SMA",
          status_sekolah:    d.status_sekolah ?? "Negeri",
          alamat_jalan:      d.alamat_jalan ?? "",
          kecamatan:         d.kecamatan ?? "",
          kabupaten:         d.kabupaten ?? "",
          kode_kabupaten:    d.kode_kabupaten ?? "",
          lintang:           d.lintang ?? "",
          bujur:             d.bujur ?? "",
          email:             d.email ?? "",
          nomor_telepon:     d.nomor_telepon ?? "",
          website:           d.website ?? "",
          akreditasi:        d.akreditasi ?? "",
          jumlah_siswa:      d.jumlah_siswa ?? "",
          daya_tampung:      d.daya_tampung ?? "",
          is_3t:             !!d.is_3t,
          is_sekolah_alam:   !!d.is_sekolah_alam,
        });
      })
      .catch((err: any) => {
        alert(err?.data?.message ?? err?.message ?? "Gagal memuat data sekolah.");
        onClose();
      })
      .finally(() => setFetching(false));
  }, [isOpen, npsn]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !saving) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, onClose]);

  const set = (field: keyof SekolahFormData, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      const copy = { ...e };
      delete copy[field];
      return copy;
    });
  };

  const handleKodeKabupaten = (kode: string) => {
    const found = KABUPATEN_OPTIONS.find((k) => k.kode === kode);
    setForm((f) => ({
      ...f,
      kode_kabupaten: kode,
      kabupaten: found?.nama ?? f.kabupaten,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npsn) return;
    setErrors({});
    setSaving(true);

    try {
      await AdminService.updateSekolah(npsn, form);
      onSuccess(form);
      onClose();
    } catch (err: any) {
      const serverErrors = err?.data?.errors ?? err?.errors;
      if (serverErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(serverErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      } else {
        alert(err?.data?.message ?? err?.message ?? "Gagal menyimpan perubahan.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150 font-poppins"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="bg-white rounded-[1.5rem] border border-slate-200/90 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-edit-sekolah-title"
      >
        {/* ── Header Modal ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="modal-edit-sekolah-title" className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate">
                Edit Data Satuan Pendidikan
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                NPSN: <span className="font-bold text-slate-600">{npsn}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex border-b border-slate-100 px-6 pt-2 bg-white shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("identitas")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "identitas"
                ? "border-blue-600 text-blue-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Identitas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lokasi")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "lokasi"
                ? "border-blue-600 text-blue-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Lokasi &amp; Peta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tambahan")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "tambahan"
                ? "border-blue-600 text-blue-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Data Tambahan</span>
          </button>
        </div>

        {/* ── Content Form ── */}
        {fetching ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Memuat rincian sekolah...</p>
          </div>
        ) : (
          <form id="edit-sekolah-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {/* TAB 1: IDENTITAS */}
            {activeTab === "identitas" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
                <div className="sm:col-span-2">
                  <Field label="Nama Sekolah" required error={errors.nama}>
                    <input
                      className={inputCls}
                      value={form.nama}
                      onChange={(e) => set("nama", e.target.value)}
                      required
                      placeholder="SMAN 1 Ampana Kota"
                    />
                  </Field>
                </div>

                <Field label="NPSN" required>
                  <input
                    className={inputCls}
                    value={form.npsn}
                    disabled
                    title="NPSN adalah identitas permanen dan tidak bisa diubah"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">NPSN permanen (read-only).</p>
                </Field>

                <Field label="Jenjang Pendidikan" required>
                  <select
                    className={inputCls}
                    value={form.bentuk_pendidikan}
                    onChange={(e) => set("bentuk_pendidikan", e.target.value)}
                    required
                  >
                    {JENJANG_OPTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status Sekolah" required>
                  <select
                    className={inputCls}
                    value={form.status_sekolah}
                    onChange={(e) => set("status_sekolah", e.target.value)}
                    required
                  >
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                  </select>
                </Field>

                <Field label="Akreditasi">
                  <select
                    className={inputCls}
                    value={form.akreditasi}
                    onChange={(e) => set("akreditasi", e.target.value)}
                  >
                    <option value="">- Belum Terakreditasi -</option>
                    <option value="A">Akreditasi A</option>
                    <option value="B">Akreditasi B</option>
                    <option value="C">Akreditasi C</option>
                  </select>
                </Field>
              </div>
            )}

            {/* TAB 2: LOKASI & PETA */}
            {activeTab === "lokasi" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
                <div className="sm:col-span-2">
                  <Field label="Alamat Jalan" error={errors.alamat_jalan}>
                    <input
                      className={inputCls}
                      value={form.alamat_jalan}
                      onChange={(e) => set("alamat_jalan", e.target.value)}
                      placeholder="Jl. Pendidikan No. 10"
                    />
                  </Field>
                </div>

                <Field label="Kecamatan" error={errors.kecamatan}>
                  <input
                    className={inputCls}
                    value={form.kecamatan}
                    onChange={(e) => set("kecamatan", e.target.value)}
                    placeholder="Ampana Kota"
                  />
                </Field>

                <Field label="Kabupaten / Kota" required error={errors.kode_kabupaten}>
                  <select
                    className={inputCls}
                    value={form.kode_kabupaten}
                    onChange={(e) => handleKodeKabupaten(e.target.value)}
                    required
                    disabled={isKabLocked}
                  >
                    <option value="">- Pilih Kabupaten -</option>
                    {availableKabupaten.map((k) => (
                      <option key={k.kode} value={k.kode}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                  {isKabLocked && (
                    <p className="text-[10px] text-slate-400 font-medium">Terkunci otomatis sesuai kewenangan akun Anda.</p>
                  )}
                </Field>

                <Field label="Lintang (Latitude)" error={errors.lintang}>
                  <input
                    className={inputCls}
                    type="number"
                    step="any"
                    value={form.lintang}
                    onChange={(e) => set("lintang", e.target.value)}
                    placeholder="-0.8715"
                  />
                </Field>

                <Field label="Bujur (Longitude)" error={errors.bujur}>
                  <input
                    className={inputCls}
                    type="number"
                    step="any"
                    value={form.bujur}
                    onChange={(e) => set("bujur", e.target.value)}
                    placeholder="121.5847"
                  />
                </Field>
              </div>
            )}

            {/* TAB 3: DATA TAMBAHAN */}
            {activeTab === "tambahan" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
                <Field label="Email Sekolah" error={errors.email}>
                  <input
                    className={inputCls}
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="info@sekolah.sch.id"
                  />
                </Field>

                <Field label="Nomor Telepon" error={errors.nomor_telepon}>
                  <input
                    className={inputCls}
                    value={form.nomor_telepon}
                    onChange={(e) => set("nomor_telepon", e.target.value)}
                    placeholder="0451-xxxxxx"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Website Sekolah" error={errors.website}>
                    <input
                      className={inputCls}
                      type="url"
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://sman1ampana.sch.id"
                    />
                  </Field>
                </div>

                <Field label="Jumlah Siswa" error={errors.jumlah_siswa}>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    value={form.jumlah_siswa}
                    onChange={(e) => set("jumlah_siswa", e.target.value)}
                    placeholder="0"
                  />
                </Field>

                <Field label="Daya Tampung" error={errors.daya_tampung}>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    value={form.daya_tampung}
                    onChange={(e) => set("daya_tampung", e.target.value)}
                    placeholder="0"
                  />
                </Field>
              </div>
            )}
          </form>
        )}

        {/* ── Sticky Footer Aksi ── */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            form="edit-sekolah-form"
            disabled={saving || fetching}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
