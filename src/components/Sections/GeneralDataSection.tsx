import React, { useEffect, useState } from "react";
import { School, Users, GraduationCap, CheckCircle2, ExternalLink, Clock } from "lucide-react";
import {
  DapodikSyncService,
  type DapodikSyncApiResponse,
} from "@/services/dapodikSyncService";

interface Props {
  data?: any;
  title?: string;
  subtitle?: string;
  kabupatenName?: string;
}

interface MetricItem {
  label: string;
  key: string;
  icon: any;
  gradient?: string;
  shadow?: string;
  bg?: string;
  iconBg?: string;
  iconColor?: string;
  border?: string;
  isHero?: boolean;
  isPercentage?: boolean;
  defaultSub?: string;
  subKey?: string;
}

// ─── Format Timestamp Sinkronisasi (WITA / Asia/Makassar) ─────────────────────
const formatSyncTimestamp = (rawDate?: any): string => {
  if (!rawDate) return "Semester 20261";
  try {
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return String(rawDate);
    return (
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Makassar",
      }).format(dateObj) + " WITA"
    );
  } catch {
    return String(rawDate);
  }
};

const METRIC_CONFIG: MetricItem[] = [
  {
    label: "Total Sekolah",
    key: "total_sekolah",
    icon: School,
    gradient: "from-blue-600 to-indigo-600",
    shadow: "shadow-blue-500/25",
    isHero: true,
    defaultSub: "Satuan Pendidikan Aktif",
    subKey: "sub_sekolah",
  },
  {
    label: "Total Siswa (PD)",
    key: "total_siswa",
    icon: Users,
    bg: "bg-emerald-50/80",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    border: "border-emerald-200/80",
    isHero: false,
    defaultSub: "Peserta Didik Terdaftar",
    subKey: "sub_siswa",
  },
  {
    label: "Guru & Tendik (GTK)",
    key: "total_gtk",
    icon: GraduationCap,
    bg: "bg-amber-50/80",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    border: "border-amber-200/80",
    isHero: false,
    defaultSub: "Pendidik & Kependidikan",
    subKey: "sub_gtk",
  },
  {
    label: "Sinkronisasi Dapodik",
    key: "persentase_sinkron",
    icon: CheckCircle2,
    bg: "bg-indigo-50/80",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    border: "border-indigo-200/80",
    isHero: false,
    isPercentage: true,
    defaultSub: "Progres Sinkronisasi",
    subKey: "sub_sinkron",
  },
];

export const GeneralDataSection: React.FC<Props> = ({
  data,
  title,
  subtitle,
  kabupatenName,
}) => {
  const [dapodikSync, setDapodikSync] = useState<DapodikSyncApiResponse | null>(null);

  const displayTitle =
    !title || title.includes("Data Umum")
      ? kabupatenName
        ? `Data Dapodik ${kabupatenName}`
        : "Data Dapodik Sulawesi Tengah"
      : title;

  useEffect(() => {
    DapodikSyncService.getSinkronisasiSemua().then((res) => {
      if (res) setDapodikSync(res);
    });
  }, []);

  // Resolusi data riil dari API Dapodik
  const resolvedData: Record<string, any> = React.useMemo(() => {
    // Mode Khusus: Jika data spesifik satu sekolah (contoh: mode sekolah)
    if (data?.total_sekolah === 1) {
      return {
        total_sekolah: 1,
        total_siswa: data.total_siswa ?? 0,
        total_gtk: data.total_gtk ?? ((data.total_guru || 0) + (data.total_tendik || 0)),
        persentase_sinkron: 100,
        sub_sekolah: "Satuan Pendidikan Terpilih",
        sub_siswa: "Siswa Aktif Dapodik",
        sub_gtk: "Guru & Tendik Sekolah",
        sub_sinkron: "Status Dapodik Aktif",
        last_update: data.last_update || data.updated_at || null,
        semester_id: data.semester_id || "20261",
      };
    }

    // 1. Konteks Kabupaten / Kota: cari record spesifik kabupaten di array data API
    if (kabupatenName && dapodikSync?.data?.length) {
      const kabItem = DapodikSyncService.findKabupaten(dapodikSync.data, kabupatenName);
      if (kabItem) {
        return {
          total_sekolah: kabItem.jumlah_sekolah,
          total_siswa: kabItem.jumlah_pd,
          total_gtk: kabItem.jumlah_gtk,
          persentase_sinkron: kabItem.persentase,
          sub_sekolah: `Semua Jenjang ${kabItem.kabupaten_kota}`,
          sub_siswa: "Peserta Didik Terdaftar",
          sub_gtk: "Pendidik & Kependidikan",
          sub_sinkron: `${Number(kabItem.sudah_sinkron).toLocaleString("id-ID")} dari ${Number(kabItem.jumlah_sekolah).toLocaleString("id-ID")} Sekolah`,
          last_update: kabItem.updated_at || kabItem.created_at || null,
          semester_id: data?.semester_id || "20261",
        };
      }
    }

    // 2. Konteks Provinsi / Dashboard: gunakan summary agregat se-Sulteng dari API
    if (dapodikSync?.summary) {
      const s = dapodikSync.summary;
      return {
        total_sekolah: s.total_sekolah,
        total_siswa: s.total_pd,
        total_gtk: s.total_gtk,
        persentase_sinkron: s.persentase_rata_rata,
        sub_sekolah: "Semua Jenjang se-Sulteng",
        sub_siswa: "Peserta Didik Terdaftar",
        sub_gtk: "Pendidik & Kependidikan",
        sub_sinkron: `${Number(s.total_sudah_sinkron).toLocaleString("id-ID")} dari ${Number(s.total_sekolah).toLocaleString("id-ID")} Sekolah`,
        last_update: s.last_updated_at || null,
        semester_id: data?.semester_id || "20261",
      };
    }

    // 3. Fallback: gunakan data props bawaan
    const fallbackGtk = (data?.total_guru || 0) + (data?.total_tendik || 0);
    return {
      total_sekolah: data?.total_sekolah ?? data?.jumlah_sekolah ?? 7961,
      total_siswa: data?.total_siswa ?? data?.total_pd ?? data?.jumlah_pd ?? 686690,
      total_gtk: data?.total_gtk ?? data?.jumlah_gtk ?? (fallbackGtk > 0 ? fallbackGtk : 76331),
      persentase_sinkron: data?.persentase_sinkron ?? data?.persentase ?? 97.5,
      sub_sekolah: data?.sub_sekolah || "Satuan Pendidikan Aktif",
      sub_siswa: data?.sub_siswa || "Peserta Didik Terdaftar",
      sub_gtk: data?.sub_gtk || "Pendidik & Kependidikan",
      sub_sinkron: data?.sub_sinkron || "Progres Sinkronisasi Dapodik",
      last_update: data?.last_updated_at || data?.updated_at || null,
      semester_id: data?.semester_id || "20261",
    };
  }, [data, kabupatenName, dapodikSync]);

  return (
    <section className="w-full">
      <div className="rounded-[2rem] bg-white/85 backdrop-blur-md border border-white/80 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.15)] px-6 py-5">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-blue-500 shrink-0" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
                {displayTitle}
              </h2>
              {subtitle && (
                <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Badge Last Update Sinkronisasi Dapodik */}
          {resolvedData.last_update ? (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Pembaruan: {formatSyncTimestamp(resolvedData.last_update)}</span>
            </div>
          ) : resolvedData.semester_id ? (
            <span className="ml-auto text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-lg">
              Semester {resolvedData.semester_id}
            </span>
          ) : null}
        </div>

        {/* 4 Cards Grid Simetris */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRIC_CONFIG.map((m) => {
            const rawVal = resolvedData[m.key] ?? 0;
            const Icon = m.icon;
            const subText = m.subKey ? resolvedData[m.subKey] : m.defaultSub;

            // Card Hero: Total Sekolah
            if (m.isHero) {
              return (
                <div
                  key={m.key}
                  className={`group flex flex-col justify-between rounded-[1.4rem] bg-gradient-to-br ${m.gradient} shadow-lg ${m.shadow} p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:scale-[1.01] cursor-default min-h-[128px]`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 leading-none">
                      {m.label}
                    </p>
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl sm:text-3xl font-black text-white leading-tight tabular-nums">
                      {Number(rawVal).toLocaleString("id-ID")}
                    </p>
                    {subText && (
                      <p className="text-[10px] text-blue-200/90 font-medium mt-1 truncate">
                        {subText}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            // Card Standar: Siswa, GTK, Sinkronisasi
            return (
              <div
                key={m.key}
                className={`group flex flex-col justify-between rounded-[1.4rem] border ${m.border} ${m.bg} p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-slate-300/80 hover:bg-white cursor-default min-h-[128px]`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 leading-none">
                    {m.label}
                  </p>
                  <div
                    className={`w-9 h-9 rounded-xl ${m.iconBg} flex items-center justify-center ${m.iconColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-2xs`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tabular-nums transition-transform duration-200 origin-left group-hover:scale-[1.02]">
                    {m.isPercentage
                      ? `${Number(rawVal).toFixed(1)}%`
                      : Number(rawVal).toLocaleString("id-ID")}
                  </p>
                  {subText && (
                    <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                      {subText}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note & Link Sumber Resmi Dapodik Kemendikdasmen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-5 pt-4 border-t border-slate-100 text-xs">
          <p className="text-[11px] text-slate-400 font-medium">
            * Data agregat mencakup seluruh jenjang kewenangan pendidikan se-Sulawesi Tengah.
          </p>
          <a
            href="https://dapo.kemendikdasmen.go.id/progres/180000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-[11px] hover:underline transition-colors shrink-0 group"
            title="Buka Data Progres Sinkronisasi Dapodik Resmi Kemendikdasmen"
          >
            <span>Sumber : Data Dapodik Sulawesi Tengah</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};
