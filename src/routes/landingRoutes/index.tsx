import HomeV2 from '@/pages/HomeV2';
import { CabangDinas } from '@/pages/CabangDinas';
import { KabupatenDetail } from '@/pages/KabupatenDetail';
import { SekolahDetail } from '@/pages/SekolahDetail';
import { ProvinsiDetail } from '@/pages/ProvinsiDetail';

const landingRoutes = [
  {
    path: '',
    element: <HomeV2 />,
  },
  {
    path: 'beranda-v2',
    element: <HomeV2 />,
  },
  {
    path: 'provinsi',
    element: <ProvinsiDetail />,
  },
  {
    path: 'cabdis-1',
    element: <CabangDinas slug="cabdis-1" />,
  },
  {
    path: 'cabdis-2',
    element: <CabangDinas slug="cabdis-2" />,
  },
  {
    path: 'cabdis-3',
    element: <CabangDinas slug="cabdis-3" />,
  },
  {
    path: 'cabdis-4',
    element: <CabangDinas slug="cabdis-4" />,
  },
  {
    path: 'cabdis-5',
    element: <CabangDinas slug="cabdis-5" />,
  },
  {
    path: 'cabdis-6',
    element: <CabangDinas slug="cabdis-6" />,
  },
  {
    path: 'kabupaten/:kodeKabupaten',
    element: <KabupatenDetail />,
  },
  {
    path: 'sekolah/:npsn',
    element: <SekolahDetail />,
  },
];

export default landingRoutes;
