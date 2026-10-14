import React, { useState, useEffect, useMemo, useRef } from "react";
import { AdminService, type SekolahFormData } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import {
  X,
  Save,
  Loader2,
  Building2,
  MapPin,
  Info,
  AlertCircle,
  Compass,
  Crosshair,
  RotateCcw,
  Check,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CARTO_TILES } from "@/config/mapConfig";

// ─── Custom Pin Marker untuk Leaflet Picker ──────────────────────────────────
const createPickerIcon = () =>
  L.divIcon({
    className: "custom-picker-pin",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
        <div style="width: 32px; height: 32px; border-radius: 50% 50% 50% 0; background: #2563eb; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(37,99,235,0.5); border: 2.5px solid #ffffff;">
          <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
        <div style="width: 12px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: 3px; filter: blur(1px);"></div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 38],
  });

// ─── Sub-komponen Event Map Leaflet ──────────────────────────────────────────
const MapEventsHandler: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
};

const MapRecenterHelper: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom());
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (_) {}
    }, 200);
    return () => clearTimeout(t);
  }, [center, zoom, map]);
  return null;
};

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

const SULTENG_DEFAULT_CENTER: [number, number] = [-0.8917, 119.8707]; // Palu / Sulteng

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
  initialTab?: "identitas" | "lokasi" | "tambahan";
  onClose: () => void;
  onSuccess: (updatedData: Partial<SekolahFormData>) => void;
}

export const SekolahEditModal: React.FC<SekolahEditModalProps> = ({
  isOpen,
  npsn,
  initialTab = "identitas",
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [form, setForm] = useState<SekolahFormData>(EMPTY_FORM);
  const [initialCoords, setInitialCoords] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"identitas" | "lokasi" | "tambahan">("identitas");
  const [coordPaste, setCoordPaste] = useState("");
  const [pasteSuccess, setPasteSuccess] = useState(false);

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

  // Hitung jumlah error di setiap tab agar ada indikator visual
  const tabErrors = useMemo(() => {
    const identitasKeys = ["nama", "bentuk_pendidikan", "status_sekolah", "akreditasi"];
    const lokasiKeys = ["alamat_jalan", "kecamatan", "kabupaten", "kode_kabupaten", "lintang", "bujur"];
    const tambahanKeys = ["email", "nomor_telepon", "website", "jumlah_siswa", "daya_tampung"];

    return {
      identitas: Object.keys(errors).filter((k) => identitasKeys.includes(k)).length,
      lokasi: Object.keys(errors).filter((k) => lokasiKeys.includes(k)).length,
      tambahan: Object.keys(errors).filter((k) => tambahanKeys.includes(k)).length,
    };
  }, [errors]);

  // Load data sekolah saat modal dibuka
  useEffect(() => {
    if (!isOpen || !npsn) {
      setForm(EMPTY_FORM);
      setErrors({});
      setGeneralError(null);
      setCoordPaste("");
      setActiveTab("identitas");
      return;
    }

    setFetching(true);
    setErrors({});
    setGeneralError(null);
    setCoordPaste("");
    setActiveTab(initialTab);

    AdminService.getSekolahDetail(npsn)
      .then((res: any) => {
        const d = res?.data ?? res;
        const rawStatus = (d.status_sekolah ?? "Negeri").toString().trim();
        const normStatus = rawStatus.toUpperCase() === "SWASTA" ? "Swasta" : "Negeri";

        const latVal = d.lintang !== null && d.lintang !== undefined ? String(d.lintang) : "";
        const lngVal = d.bujur !== null && d.bujur !== undefined ? String(d.bujur) : "";

        setInitialCoords({ lat: latVal, lng: lngVal });

        setForm({
          nama:              d.nama ?? "",
          npsn:              d.npsn ?? npsn,
          bentuk_pendidikan: d.bentuk_pendidikan ?? "SMA",
          status_sekolah:    normStatus,
          alamat_jalan:      d.alamat_jalan ?? "",
          kecamatan:         d.kecamatan ?? "",
          kabupaten:         d.kabupaten ?? "",
          kode_kabupaten:    d.kode_kabupaten ?? "",
          lintang:           latVal,
          bujur:             lngVal,
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
  }, [isOpen, npsn, initialTab]);

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
    if (generalError) setGeneralError(null);
  };

  const handleKodeKabupaten = (kode: string) => {
    const found = KABUPATEN_OPTIONS.find((k) => k.kode === kode);
    setForm((f) => ({
      ...f,
      kode_kabupaten: kode,
      kabupaten: found?.nama ?? f.kabupaten,
    }));
  };

  // Koordinat numerik untuk map
  const numLat = form.lintang !== "" && form.lintang !== null && !isNaN(Number(form.lintang)) ? Number(form.lintang) : null;
  const numLng = form.bujur !== "" && form.bujur !== null && !isNaN(Number(form.bujur)) ? Number(form.bujur) : null;
  const hasCoords = numLat !== null && numLng !== null && (numLat !== 0 || numLng !== 0);

  const mapCenter: [number, number] = hasCoords ? [numLat!, numLng!] : SULTENG_DEFAULT_CENTER;

  // Handler saat admin klik atau geser marker pada peta
  const handleMapLocationPick = (lat: number, lng: number) => {
    set("lintang", String(lat));
    set("bujur", String(lng));
  };

  // Handler tempel koordinat dari Google Maps
  const handleApplyCoordPaste = () => {
    if (!coordPaste.trim()) return;
    // Format umum: "-0.891721, 119.870712" atau "-0.891721 119.870712"
    const cleaned = coordPaste.trim().replace(/[°]/g, "");
    const parts = cleaned.split(/[\s,]+/);
    if (parts.length >= 2) {
      const pLat = parseFloat(parts[0]);
      const pLng = parseFloat(parts[1]);
      if (!isNaN(pLat) && !isNaN(pLng) && pLat >= -90 && pLat <= 90 && pLng >= -180 && pLng <= 180) {
        set("lintang", String(pLat.toFixed(6)));
        set("bujur", String(pLng.toFixed(6)));
        setCoordPaste("");
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
        return;
      }
    }
    alert("Format koordinat tidak valid. Contoh yang didukung: -0.891721, 119.870712");
  };

  // Reset koordinat ke semula saat modal dibuka
  const handleResetCoords = () => {
    set("lintang", initialCoords.lat);
    set("bujur", initialCoords.lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npsn) return;
    setErrors({});
    setGeneralError(null);
    setSaving(true);

    // Sanitasi data sebelum dikirim agar tidak gagal validasi backend
    const cleanedPayload: Partial<SekolahFormData> = {
      ...form,
      status_sekolah: form.status_sekolah?.toUpperCase() === "SWASTA" ? "Swasta" : "Negeri",
      lintang: form.lintang !== "" && form.lintang !== null && form.lintang !== undefined ? Number(form.lintang) : (null as any),
      bujur: form.bujur !== "" && form.bujur !== null && form.bujur !== undefined ? Number(form.bujur) : (null as any),
      jumlah_siswa: form.jumlah_siswa !== "" && form.jumlah_siswa !== null && form.jumlah_siswa !== undefined ? Number(form.jumlah_siswa) : (0 as any),
      daya_tampung: form.daya_tampung !== "" && form.daya_tampung !== null && form.daya_tampung !== undefined ? Number(form.daya_tampung) : (0 as any),
      website: form.website ? form.website.trim() : "",
      email: form.email ? form.email.trim() : "",
    };

    try {
      await AdminService.updateSekolah(npsn, cleanedPayload);
      onSuccess(cleanedPayload);
      onClose();
    } catch (err: any) {
      const serverErrors = err?.data?.errors ?? err?.errors;
      if (serverErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(serverErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);

        // Auto-switch ke tab tempat error pertama terjadi agar terlihat oleh user
        const firstErrKey = Object.keys(mapped)[0];
        if (["nama", "bentuk_pendidikan", "status_sekolah", "akreditasi"].includes(firstErrKey)) {
          setActiveTab("identitas");
        } else if (["alamat_jalan", "kecamatan", "kabupaten", "kode_kabupaten", "lintang", "bujur"].includes(firstErrKey)) {
          setActiveTab("lokasi");
        } else if (["email", "nomor_telepon", "website", "jumlah_siswa", "daya_tampung"].includes(firstErrKey)) {
          setActiveTab("tambahan");
        }

        setGeneralError(`Terdapat kesalahan pengisian data (${Object.values(mapped)[0]}).`);
      } else {
        const msg = err?.data?.message ?? err?.message ?? "Gagal menyimpan perubahan.";
        setGeneralError(msg);
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
        className="bg-white rounded-[1.5rem] border border-slate-200/90 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200"
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
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === "identitas"
                ? "border-blue-600 text-blue-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Identitas</span>
            {tabErrors.identitas > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" title="Terdapat error pada tab ini" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lokasi")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === "lokasi"
                ? "border-blue-600 text-blue-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Lokasi &amp; Peta</span>
            {tabErrors.lokasi > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" title="Terdapat error pada tab ini" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tambahan")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === "tambahan"
                ? "border-blue-600 text-blue-600 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Data Tambahan</span>
            {tabErrors.tambahan > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" title="Terdapat error pada tab ini" />
            )}
          </button>
        </div>

        {/* ── Banner Error Global jika Gagal Simpan ── */}
        {generalError && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-150 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Gagal Menyimpan Perubahan:</p>
              <p className="text-[11px] text-rose-600 mt-0.5">{generalError}</p>
            </div>
            <button
              type="button"
              onClick={() => setGeneralError(null)}
              className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Content Form ── */}
        {fetching ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Memuat rincian sekolah...</p>
          </div>
        ) : (
          <form id="edit-sekolah-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4">
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

                <Field label="Jenjang Pendidikan" required error={errors.bentuk_pendidikan}>
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

                <Field label="Status Sekolah" required error={errors.status_sekolah}>
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

                <Field label="Akreditasi" error={errors.akreditasi}>
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

                {/* ── Bagian Visual: Peta Interaktif Leaflet Picker ── */}
                <div className="sm:col-span-2 flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      <span>Atur Lokasi Koordinat pada Peta</span>
                    </label>
                    {initialCoords.lat && (
                      <button
                        type="button"
                        onClick={handleResetCoords}
                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Kembalikan ke koordinat awal"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Koordinat</span>
                      </button>
                    )}
                  </div>

                  {/* Alat Cepat: Tempel Koordinat dari Google Maps */}
                  <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <Crosshair className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                    <input
                      type="text"
                      placeholder="Tempel koordinat Google Maps (contoh: -0.891721, 119.870712)..."
                      value={coordPaste}
                      onChange={(e) => setCoordPaste(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoordPaste();
                        }
                      }}
                      className="text-xs bg-transparent border-none outline-none flex-1 text-slate-700 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoordPaste}
                      className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                        pasteSuccess
                          ? "bg-emerald-600 text-white"
                          : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {pasteSuccess ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Diterapkan!</span>
                        </>
                      ) : (
                        <span>Terapkan</span>
                      )}
                    </button>
                  </div>

                  {/* Leaflet Map Canvas */}
                  <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0">
                    <MapContainer
                      center={mapCenter}
                      zoom={hasCoords ? 15 : 8}
                      scrollWheelZoom={true}
                      attributionControl={false}
                      className="w-full h-full"
                    >
                      <TileLayer
                        url={CARTO_TILES.VOYAGER}
                        maxZoom={20}
                        maxNativeZoom={19}
                      />
                      <MapEventsHandler onPick={handleMapLocationPick} />
                      <MapRecenterHelper center={mapCenter} zoom={hasCoords ? 15 : 8} />

                      {hasCoords && (
                        <Marker
                          position={[numLat!, numLng!]}
                          draggable={true}
                          icon={createPickerIcon()}
                          eventHandlers={{
                            dragend: (e) => {
                              const marker = e.target;
                              const pos = marker.getLatLng();
                              handleMapLocationPick(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
                            },
                          }}
                        />
                      )}
                    </MapContainer>

                    {/* Hint overlay */}
                    <div className="absolute inset-x-0 bottom-2.5 z-[1000] flex justify-center pointer-events-none px-3">
                      <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg text-center">
                        {hasCoords
                          ? " Klik peta atau geser pin biru ke titik bangunan sekolah"
                          : " Klik pada peta untuk meletakkan titik pin koordinat"}
                      </span>
                    </div>
                  </div>
                </div>

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
                      type="text"
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

                <div className="sm:col-span-2 pt-2 flex items-center gap-6 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.is_3t}
                      onChange={(e) => set("is_3t", e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Wilayah 3T (Tertinggal, Terdepan, Terluar)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!form.is_sekolah_alam}
                      onChange={(e) => set("is_sekolah_alam", e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Sekolah Alam</span>
                  </label>
                </div>
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
