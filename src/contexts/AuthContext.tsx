import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { AdminService } from "@/services/adminService";
import { setAccessTokenCookie, clearAccessTokenCookie, getAccessTokenCookie } from "@/utils/cookie";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  roles?: string[];
  cabang_dinas_id?: number | null;
  kode_kabupaten?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Cek sesi saat pertama load
  useEffect(() => {
    const token = getAccessTokenCookie();
    if (!token) { setLoading(false); return; }

    AdminService.getUser()
      .then((res: any) => setUser(res?.data ?? res))
      .catch(() => clearAccessTokenCookie())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await AdminService.login(email, password);
    const token = res?.data?.token ?? res?.token;
    if (!token) throw new Error("Token tidak ditemukan");
    setAccessTokenCookie(token);
    const userRes: any = await AdminService.getUser();
    setUser(userRes?.data ?? userRes);
  };

  const logout = async () => {
    try { await AdminService.logout(); } catch (_) { /* abaikan error */ }
    clearAccessTokenCookie();
    setUser(null);
  };

  const isAdmin = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
};
