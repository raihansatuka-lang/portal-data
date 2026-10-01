import { useRoutes } from 'react-router-dom';

import LandingRoutes from './landingRoutes';
import { AdminLogin } from '@/pages/Admin/Login';
import { AdminSekolahForm } from '@/pages/Admin/SekolahForm';
import { AdminDashboard } from '@/pages/Admin/AdminDashboard';
import { ProtectedRoute } from '@/components/Admin/ProtectedRoute';

function Router() {
  const routes = [
    ...LandingRoutes,
    // ── Auth ───────────────────────────────────────────────────────────────
    {
      path: 'login',
      element: <AdminLogin />,
    },
    // ── Unified Admin Data Hub (/admin) ───────────────────────────────────
    {
      path: 'admin',
      element: <ProtectedRoute><AdminDashboard /></ProtectedRoute>,
    },
    // ── Admin Form (protected) — diakses dari tombol inline di halaman publik
    {
      path: 'admin/sekolah/create',
      element: <ProtectedRoute><AdminSekolahForm /></ProtectedRoute>,
    },
    {
      path: 'admin/sekolah/:npsn/edit',
      element: <ProtectedRoute><AdminSekolahForm /></ProtectedRoute>,
    },
    {
      path: '*',
      element: <div className="flex items-center justify-center h-screen text-slate-500">Halaman tidak ditemukan.</div>,
    },
  ];

  return useRoutes(routes);
}

export default Router;

