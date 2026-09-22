/**
 * Unified School Popup Generator for Leaflet Maps
 * Digunakan secara seragam di:
 * 1. ProvinsiDetail.tsx (Peta Sebaran Sekolah Provinsi)
 * 2. KabupatenDetail.tsx (Peta Sebaran Sekolah Kabupaten)
 * 3. SulawesiMap.tsx / CabangDinas.tsx (Peta Wilayah Cabang Dinas)
 */

export interface SchoolPopupInput {
  id?: string | number | null;
  npsn?: string | number | null;
  name?: string | null;
  nama?: string | null;
  grade?: string | null;
  bentuk_pendidikan?: string | null;
  status?: string | null;
  status_sekolah?: string | null;
  akreditasi?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  alamat_jalan?: string | null;
  latitude?: string | number | null;
  lintang?: string | number | null;
  longitude?: string | number | null;
  bujur?: string | number | null;
}

/**
 * Normalisasi data sekolah dari berbagai bentuk API / tipe marker
 */
export const normalizeSchoolPopupData = (s: SchoolPopupInput) => {
  const nama = s.nama || s.name || "Sekolah";
  const npsn = s.npsn ? String(s.npsn) : "";

  // Ambil jenjang asli dari bentuk_pendidikan atau grade
  let rawJenjang = String(s.bentuk_pendidikan || s.grade || "").trim();

  // Jika kosong, deteksi secara cerdas dari nama sekolah
  if (!rawJenjang) {
    const upperNama = nama.toUpperCase();
    if (upperNama.includes("SMK") || upperNama.includes("MAK")) rawJenjang = "SMK";
    else if (upperNama.includes("SLB")) rawJenjang = "SLB";
    else if (upperNama.includes("SMA")) rawJenjang = "SMA";
    else if (upperNama.includes("MAN ") || upperNama.includes("MAS ") || upperNama.startsWith("MA ")) rawJenjang = "MA";
    else if (upperNama.includes("SMP")) rawJenjang = "SMP";
    else if (upperNama.includes("MTS")) rawJenjang = "MTs";
    else if (upperNama.includes("SDN") || upperNama.includes("SDS") || upperNama.includes("SD ")) rawJenjang = "SD";
    else if (upperNama.includes("MIN ") || upperNama.includes("MIS ") || upperNama.startsWith("MI ")) rawJenjang = "MI";
    else if (upperNama.includes("TK ") || upperNama.includes("PAUD") || upperNama.includes("KB ")) rawJenjang = "TK";
    else if (upperNama.includes("PKBM") || upperNama.includes("SKB")) rawJenjang = "PKBM";
    else rawJenjang = "SMA";
  }

  // Format label jenjang yang bersih dan konsisten
  const upper = rawJenjang.toUpperCase();
  let jenjang = rawJenjang;

  if (upper.includes("SMK") || upper.includes("MAK")) {
    jenjang = "SMK";
  } else if (upper.includes("SLB")) {
    jenjang = "SLB";
  } else if (upper === "SMA") {
    jenjang = "SMA";
  } else if (upper === "MA" || upper.includes("ALIAH")) {
    jenjang = "MA";
  } else if (upper === "SMP") {
    jenjang = "SMP";
  } else if (upper === "MTS" || upper.includes("TSANAWIYAH")) {
    jenjang = "MTs";
  } else if (upper === "SD") {
    jenjang = "SD";
  } else if (upper === "MI" || upper.includes("IBTIDAIYAH")) {
    jenjang = "MI";
  } else if (["TK", "KB", "SPS", "TPA", "RA", "PAUD"].includes(upper)) {
    jenjang = upper;
  } else if (upper.includes("PKBM")) {
    jenjang = "PKBM";
  } else if (upper.includes("SKB")) {
    jenjang = "SKB";
  } else if (upper.includes("SMTK")) {
    jenjang = "SMTK";
  } else if (upper.includes("KURSUS") || upper.includes("LKP")) {
    jenjang = "LKP";
  }

  const rawStatus = (s.status_sekolah || s.status || "").trim();
  let status = rawStatus || "—";
  if (rawStatus.toUpperCase() === "NEGERI") status = "Negeri";
  else if (rawStatus.toUpperCase() === "SWASTA") status = "Swasta";

  const akreditasi = s.akreditasi ? String(s.akreditasi).toUpperCase().trim() : null;

  const cleanKec = (s.kecamatan || "")
    .replace(/^(kec\.?|kecamatan)\s+/i, "")
    .replace(/,\s*kab\..*$/i, "")
    .trim();

  const rawKab = (s.kabupaten || "").trim();
  const kab = rawKab.replace(/^(kab\.?|kabupaten|kota)\s+/i, (match) => {
    return match.toLowerCase().includes("kota") ? "Kota " : "Kab. ";
  });

  const alamat = (s.alamat_jalan || "").trim();

  // Susun string lokasi yang rapi
  let location = "";
  if (alamat) {
    location = `${alamat}${cleanKec ? `, Kec. ${cleanKec}` : ""}${kab ? `, ${kab}` : ""}`;
  } else if (cleanKec && kab) {
    location = `Kec. ${cleanKec}, ${kab}`;
  } else if (cleanKec) {
    location = `Kec. ${cleanKec}`;
  } else if (kab) {
    location = kab;
  }

  const rawLat = s.latitude ?? s.lintang;
  const rawLng = s.longitude ?? s.bujur;
  const lat = parseFloat(String(rawLat ?? "0"));
  const lng = parseFloat(String(rawLng ?? "0"));
  const hasCoordinates = !isNaN(lat) && !isNaN(lng) && Math.abs(lat) > 0.01 && Math.abs(lng) > 0.01;

  return {
    nama,
    npsn,
    jenjang,
    status,
    akreditasi,
    location,
    lat,
    lng,
    hasCoordinates,
  };
};

/**
 * Palet warna jenjang sesuai standar sistem pemetaan Sulteng
 */
export const getJenjangPopupColor = (jenjang: string) => {
  const upper = (jenjang || "").toUpperCase();

  // SD & MI (Emerald Green)
  if (upper === "SD" || upper === "MI" || upper.includes("IBTIDAIYAH")) {
    return {
      text: "#047857",
      bg: "#ecfdf5",
      border: "#a7f3d0",
    };
  }

  // SMP & MTs (Sky / Blue)
  if (upper === "SMP" || upper === "MTS" || upper.includes("TSANAWIYAH")) {
    return {
      text: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
    };
  }

  // TK, PAUD, KB, RA, SPS, TPA (Amber / Yellow)
  if (["TK", "KB", "SPS", "TPA", "RA", "PAUD"].includes(upper)) {
    return {
      text: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
    };
  }

  // SMK / MAK (Pink)
  if (upper.includes("SMK") || upper.includes("MAK")) {
    return {
      text: "#db2777",
      bg: "#fdf2f8",
      border: "#fbcfe8",
    };
  }

  // SLB (Rose / Red)
  if (upper.includes("SLB")) {
    return {
      text: "#e11d48",
      bg: "#fff1f2",
      border: "#fecdd3",
    };
  }

  // MA (Indigo)
  if (upper === "MA" || upper.includes("ALIAH")) {
    return {
      text: "#4338ca",
      bg: "#e0e7ff",
      border: "#c7d2fe",
    };
  }

  // PKBM & SKB (Orange)
  if (upper.includes("PKBM") || upper.includes("SKB") || upper.includes("PAKET")) {
    return {
      text: "#c2410c",
      bg: "#fff7ed",
      border: "#fed7aa",
    };
  }

  // SMTK, Kursus, LKP (Cyan)
  if (upper.includes("SMTK") || upper.includes("KURSUS") || upper.includes("LKP")) {
    return {
      text: "#0e7490",
      bg: "#cffafe",
      border: "#a5f3fc",
    };
  }

  // SMA (Purple) - Default
  return {
    text: "#6d28d9",
    bg: "#ede9fe",
    border: "#ddd6fe",
  };
};

/**
 * Badge HTML Akreditasi seragam & modern
 */
export const getAkreditasiPopupBadge = (akr: string | null): string => {
  if (akr === "A") {
    return `<span style="display:inline-flex;align-items:center;gap:3px;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:2px 7.5px;border-radius:6px;font-size:9.5px;font-weight:800;letter-spacing:0.02em;white-space:nowrap;">★ Akreditasi A</span>`;
  }
  if (akr === "B") {
    return `<span style="display:inline-flex;align-items:center;gap:3px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:2px 7.5px;border-radius:6px;font-size:9.5px;font-weight:800;letter-spacing:0.02em;white-space:nowrap;">★ Akreditasi B</span>`;
  }
  if (akr === "C") {
    return `<span style="display:inline-flex;align-items:center;gap:3px;background:#fffbeb;color:#b45309;border:1px solid #fde68a;padding:2px 7.5px;border-radius:6px;font-size:9.5px;font-weight:800;letter-spacing:0.02em;white-space:nowrap;">★ Akreditasi C</span>`;
  }
  return `<span style="display:inline-flex;align-items:center;gap:3px;background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;padding:2px 7.5px;border-radius:6px;font-size:9px;font-weight:700;white-space:nowrap;">Belum Terakreditasi</span>`;
};

/**
 * Generator HTML Popup Sekolah yang Elegan & Seragam
 */
export const createSchoolPopupHtml = (input: SchoolPopupInput): string => {
  const s = normalizeSchoolPopupData(input);
  const color = getJenjangPopupColor(s.jenjang);
  const akrBadge = getAkreditasiPopupBadge(s.akreditasi);
  const gmapsUrl = s.hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`
    : null;

  return `
    <div style="font-family:'Poppins',system-ui,-apple-system,sans-serif;padding:10px 12px 9px;min-width:210px;max-width:275px;background:#ffffff;border-radius:16px;box-sizing:border-box;">
      
      <!-- Top Row: Jenjang, Status & Akreditasi Badge -->
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;padding-right:22px;">
        <span style="background:${color.bg};color:${color.text};border:1px solid ${color.border};font-size:9.5px;font-weight:900;padding:2px 6px;border-radius:5px;text-transform:uppercase;letter-spacing:0.02em;line-height:1.2;white-space:nowrap;">
          ${s.jenjang}
        </span>
        <span style="font-size:9.5px;font-weight:700;color:#64748b;white-space:nowrap;">
          ${s.status}
        </span>
        <div style="margin-left:auto;flex-shrink:0;">
          ${akrBadge}
        </div>
      </div>

      <!-- School Name -->
      <h3 style="font-size:12px;font-weight:900;color:#0f172a;line-height:1.3;margin:0 0 4px 0;word-break:break-word;">
        ${s.nama}
      </h3>

      <!-- Location -->
      ${s.location ? `
        <p style="font-size:9.5px;color:#64748b;margin:0 0 8px 0;line-height:1.35;display:flex;align-items:flex-start;gap:3.5px;">
          <span style="overflow:hidden;text-overflow:ellipsis;">${s.location}</span>
        </p>
      ` : ''}

      <!-- Footer: NPSN Chip, Rute & Detail Button -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f1f5f9;padding-top:7px;margin-top:2px;">
        <span style="font-size:9px;font-weight:700;color:#64748b;font-family:monospace;background:#f8fafc;padding:1.5px 5.5px;border-radius:5px;border:1px solid #e2e8f0;">
          NPSN: ${s.npsn || '—'}
        </span>
        
        <div style="display:flex;align-items:center;gap:6px;">
          ${gmapsUrl ? `
            <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="font-size:9.5px;font-weight:700;color:#64748b;text-decoration:none;display:inline-flex;align-items:center;gap:2px;padding:2.5px 5px;border-radius:5px;transition:all 0.15s;" onmouseover="this.style.color='#2563eb';" onmouseout="this.style.color='#64748b';" title="Buka Petunjuk Arah di Google Maps">
              <span>Rute</span>
              <span style="font-size:8.5px;color:#94a3b8;">↗</span>
            </a>
          ` : ''}

          ${s.npsn ? `
            <a href="/sekolah/${s.npsn}" style="display:inline-flex;align-items:center;gap:2.5px;font-size:10px;font-weight:800;color:#2563eb;text-decoration:none;background:#eff6ff;padding:2.5px 8px;border-radius:6px;border:1px solid #bfdbfe;transition:all 0.2s;" onmouseover="this.style.background='#2563eb';this.style.color='#ffffff';" onmouseout="this.style.background='#eff6ff';this.style.color='#2563eb';">
              <span>Detail</span>
              <span style="font-size:11px;font-weight:900;">→</span>
            </a>
          ` : ''}
        </div>
      </div>

    </div>
  `;
};
