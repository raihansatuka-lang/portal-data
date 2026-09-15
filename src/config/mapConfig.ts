/**
 * Konfigurasi Basemap Peta (CARTO)
 * API Key terdaftar untuk pemetaan pendidikan Sulawesi Tengah.
 */
export const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY || 'cb1_3m2p_1_d68f0f09f75ccf55a3e8124e';

export const CARTO_TILES = {
  VOYAGER: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
  LIGHT: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
  DARK: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
};
