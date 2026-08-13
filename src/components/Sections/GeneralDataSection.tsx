import React from "react";
import { School, LayoutGrid, Users, GraduationCap, UserCog, Briefcase } from "lucide-react";

interface Props {
  data: any;
}

// Konfigurasi 6 metrik sesuai dokumen PRD
const METRIC_CONFIG = [
  {
    label: "Total Sekolah",
    key: "total_sekolah",
    icon: School,
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    border: "border-blue-100",
  },
  {
    label: "Jumlah Rombel",
    key: "total_rombel",
    icon: LayoutGrid,
    bg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    border: "border-indigo-100",
  },
  {
    label: "Total Siswa",
    key: "total_siswa",
    icon: Users,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    border: "border-emerald-100",
  },
  {
    label: "Tenaga Pendidik",
    key: "total_guru",
    icon: GraduationCap,
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    border: "border-amber-100",
  },
  {
    label: "Tenaga Kependidikan",
    key: "total_tendik",
    icon: UserCog,
    bg: "bg-rose-50",
    iconColor: "text-rose-600",
    border: "border-rose-100",
  },
  {
    label: "Pegawai Dinas",
    key: "total_pegawai",
    icon: Briefcase,
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    border: "border-violet-100",
  },
];

export const GeneralDataSection: React.FC<Props> = ({ data }) => {
  return (
    <section className="w-full">
      <div className="rounded-[2rem] bg-white/80 backdrop-blur-md border border-white/80 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)] px-6 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 rounded-full bg-blue-500" />
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
            Data Umum Satuan Pendidikan
          </h2>
          {data?.semester_id && (
            <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Semester {data.semester_id}
            </span>
          )}
        </div>

        {/* 6 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {METRIC_CONFIG.map((m) => {
            const value = data?.[m.key] ?? 0;
            const Icon = m.icon;
            const isZero = value === 0;

            return (
              <div
                key={m.key}
                className={`flex flex-col gap-3 rounded-[1.4rem] border ${m.border} ${m.bg} px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${m.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Value */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 leading-none mb-1">
                    {m.label}
                  </p>
                  <p className={`text-xl font-black leading-tight ${isZero ? "text-slate-300" : "text-slate-900"}`}>
                    {value.toLocaleString("id-ID")}
                  </p>
                  {isZero && (
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                      Belum tersedia
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Catatan data GTK */}
        {(data?.total_guru === 0 || data?.total_tendik === 0) && (
          <p className="mt-4 text-[10px] text-slate-400 font-medium text-center">
            * Data Tenaga Pendidik, Kependidikan, dan Pegawai Dinas akan tersedia setelah integrasi dengan layanan GTK.
          </p>
        )}
      </div>
    </section>
  );
};
