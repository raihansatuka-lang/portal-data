import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

/**
 * AdminBar — floating status capsule di sudut kanan bawah.
 * Mengikuti Design System Portal (clean light glassmorphism, rounded-2xl, Poppins).
 * Hanya muncul saat user terotentikasi sebagai admin dan tidak menabrak header atas / navbar.
 */
export const AdminBar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isAdmin) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const roleLabel: Record<string, string> = {
    admin_provinsi: "Admin Provinsi",
    admin_cabdis: "Admin Cabang Dinas",
    admin_kab_kota: "Admin Kab/Kota",
  };
  const role = user?.roles?.[0] ?? "";

  return (
    <aside aria-label="Status Mode Admin" className="fixed bottom-5 right-5 z-[9999] font-poppins select-none">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-slate-200/50 rounded-full px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:shadow-md active:scale-95 transition-all duration-200 group cursor-pointer"
          title="Tampilkan panel admin"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[11px] font-bold">Admin</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </button>
      ) : (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl shadow-slate-200/60 rounded-2xl px-3.5 py-2 flex items-center gap-3 text-slate-700 transition-all duration-200">
          {/* Status Mode Admin */}
          <div className="flex items-center gap-2 pr-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Mode Admin
              </span>
            </div>
          </div>

          <div className="w-px h-4 bg-slate-200 shrink-0" />

          {/* User & Role Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
              {user?.name}
            </span>
            {role && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
                {roleLabel[role] ?? role}
              </span>
            )}
          </div>

          <div className="w-px h-4 bg-slate-200 shrink-0" />

          {/* Tombol Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Keluar dari sesi admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>

          {/* Tombol Ciutkan (Minimize) */}
          <button
            onClick={() => setIsMinimized(true)}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
            title="Ciutkan bar admin"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </aside>
  );
};
