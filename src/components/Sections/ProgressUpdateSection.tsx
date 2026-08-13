import React, { useMemo } from "react";
import { ChevronRight } from "lucide-react";

interface Props {
  summary?: any;
  currentMonth?: string;
  onClick?: () => void;
}

export const ProgressUpdateSection: React.FC<Props> = ({
  summary,
  currentMonth,
  onClick,
}) => {
  const monthLabel = useMemo(() => {
    if (!currentMonth) return "";
    const [y, m] = currentMonth.split("-");
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    return `${months[parseInt(m) - 1]} ${y}`;
  }, [currentMonth]);

  const percentage = summary?.percentage ?? summary?.persen ?? 0;
  const finished   = summary?.finished   ?? summary?.sudah_update   ?? 0;
  const pending    = summary?.pending    ?? summary?.belum_update    ?? 0;

  return (
    <div
      onClick={onClick}
      className="w-full glass ring-2 !ring-white rounded-[1.5rem] px-5 py-4 flex flex-col gap-3 cursor-pointer group hover:shadow-xl hover:shadow-blue-500/10 transition-all border border-transparent hover:border-blue-100/60"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
            Progress Laporan Bulanan Sekolah
          </h3>
          {monthLabel && (
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {monthLabel}
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 rounded-full bg-slate-200/60 overflow-hidden flex">
        <div
          className="h-full bg-emerald-500 rounded-l-full transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="h-full bg-amber-400 rounded-r-full transition-all duration-700"
          style={{ width: `${100 - percentage}%` }}
        />
      </div>

      {/* Stat row */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/80 border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sudah Update</span>
            <span className="text-sm font-extrabold text-slate-800 mt-0.5 tabular-nums">
              {finished.toLocaleString("id-ID")}
              <span className="text-xs text-emerald-600 font-bold ml-1">({percentage}%)</span>
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-100">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Belum Update</span>
            <span className="text-sm font-extrabold text-slate-800 mt-0.5 tabular-nums">
              {pending.toLocaleString("id-ID")}
              <span className="text-xs text-amber-600 font-bold ml-1">({(100 - percentage).toFixed(0)}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
