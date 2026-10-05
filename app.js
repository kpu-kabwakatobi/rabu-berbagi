/* ============ KONFIGURASI (ubah sesuai kebutuhan) ============ */
const CONFIG = {
  // --- Halaman absensi ---
  namaRapat: "Rabu Berbagi Seri XIX",
  tanggal: "7 Oktober 2026",
  tempat: "Kendari",

  // --- Isi sertifikat ---
  instansiBaris1: "KOMISI PEMILIHAN UMUM",
  instansiBaris2: "PROVINSI SULAWESI TENGGARA",
  nomorSertifikat: "013/HM.07-Kt/7407/2026",
  sebagai: "PESERTA",
  pengantarKegiatan: "Dalam Kegiatan",
  judulKegiatan: "RABU BERBAGI SERI XIX",
  subJudul: "",
  penyelenggara: "Komisi Pemilihan Umum Provinsi Sulawei Tenggaraa",
  tanggalSertifikat: "07 Oktober 2026",
  jabatanPenandatangan: "Ketua",
  penandatangan: "Suprihaty Prawaty Nengtiyas",

  // --- Gambar (letakkan file di folder yang sama dengan index.html) ---
  // latar : desain bingkai/ornamen TANPA teks (rasio A4 landscape, mis. 1754x1240 px)
  // logo  : logo instansi (PNG transparan)
  // ttd   : cap + tanda tangan (PNG transparan)
  // Jika file tidak ada, sertifikat tetap dibuat dengan bingkai bawaan.
  gambar: { latar: "template.png", logo: "logo.png", ttd: "ttd.png" },

  // Opsional: URL Google Apps Script Web App untuk menyimpan data ke Google Sheets.
  // Kosongkan ("") jika hanya ingin menyimpan di browser peserta.
  sheetsUrl: ""
};

/* ============ PENYIMPANAN DATA ============ */
const KEY_LIST = "absensi_peserta";
const KEY_AKTIF = "absensi_peserta_aktif";

function ambilDaftar() {
  try { return JSON.parse(localStorage.getItem(KEY_LIST)) || []; }
  catch { return []; }
}

function simpanPeserta(data) {
  const daftar = ambilDaftar();
  // Hindari duplikat berdasarkan email
  const idx = daftar.findIndex(p => p.email.toLowerCase() === data.email.toLowerCase());
  if (idx >= 0) daftar[idx] = data; else daftar.push(data);
  localStorage.setItem(KEY_LIST, JSON.stringify(daftar));
  localStorage.setItem(KEY_AKTIF, data.email.toLowerCase());
}

function ambilPesertaAktif() {
  const email = localStorage.getItem(KEY_AKTIF);
  if (!email) return null;
  return ambilDaftar().find(p => p.email.toLowerCase() === email) || null;
}

async function kirimKeSheets(data) {
  if (!CONFIG.sheetsUrl) return;
  try {
    await fetch(CONFIG.sheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.warn("Gagal mengirim ke Google Sheets:", err);
  }
}

/* ============ SERTIFIKAT (CANVAS A4 LANDSCAPE) ============ */
const CERT_W = 1754, CERT_H = 1240;
const FONT_SANS = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif';
const FONT_SERIF = 'Cinzel, Cambria, Georgia, serif';
const FONT_SCRIPT = '"Great Vibes", "Brush Script MT", cursive';
const MARUN = "#7a1020";

function muatGambar(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Bingkai cadangan bila template.png tidak tersedia
function gambarLatarCadangan(ctx) {
  const g = ctx.createLinearGradient(0, 0, CERT_W, CERT_H);
  g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#f1ece6");
  ctx.fillStyle = g; ctx.fillRect(0, 0, CERT_W, CERT_H);

  const sudut = (x, y, sx, sy) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
    ctx.fillStyle = MARUN;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(430, 0);
    ctx.quadraticCurveTo(200, 90, 90, 330); ctx.lineTo(0, 400); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#d4af37"; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = "#f3d98b"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(30, 40); ctx.lineTo(370, 40);
    ctx.quadraticCurveTo(190, 120, 120, 300); ctx.stroke();
    ctx.restore();
  };
  sudut(0, 0, 1, 1); sudut(CERT_W, 0, -1, 1);
  sudut(0, CERT_H, 1, -1); sudut(CERT_W, CERT_H, -1, -1);
}

function teks(ctx, str, x, y, font, warna) {
  ctx.font = font; ctx.fillStyle = warna || "#000";
  ctx.fillText(str, x, y);
}

// Kecilkan font hingga teks muat dalam lebar maksimum
function teksMuat(ctx, str, x, y, fontFn, ukuran, minUkuran, maxLebar, warna) {
  let s = ukuran;
  ctx.font = fontFn(s);
  while (ctx.measureText(str).width > maxLebar && s > minUkuran) {
    s -= 2; ctx.font = fontFn(s);
  }
  ctx.fillStyle = warna || "#000";
  ctx.fillText(str, x, y);
}

function gambarOrnamenGaris(ctx, cx, y) {
  ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - 135, y); ctx.lineTo(cx - 20, y);
  ctx.moveTo(cx + 20, y); ctx.lineTo(cx + 135, y); ctx.stroke();
  ctx.fillStyle = "#c9a227";
  ctx.beginPath(); ctx.moveTo(cx, y - 9); ctx.lineTo(cx + 10, y);
  ctx.lineTo(cx, y + 9); ctx.lineTo(cx - 10, y); ctx.closePath(); ctx.fill();
}

async function gambarSertifikat(canvas, p) {
  canvas.width = CERT_W; canvas.height = CERT_H;
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

  // Pastikan font web sudah termuat sebelum menggambar
  try {
    await Promise.all([
      document.fonts.load('700 90px "Cinzel"'),
      document.fonts.load('400 100px "Great Vibes"')
    ]);
  } catch (e) { /* lanjut dengan font cadangan */ }

  const [latar, logo, ttd] = await Promise.all([
    muatGambar(CONFIG.gambar.latar),
    muatGambar(CONFIG.gambar.logo),
    muatGambar(CONFIG.gambar.ttd)
  ]);

  if (latar) ctx.drawImage(latar, 0, 0, CERT_W, CERT_H);
  else gambarLatarCadangan(ctx);

  const cx = CERT_W / 2;

  // Logo
  if (logo) {
    const h = 125, w = h * (logo.width / logo.height);
    ctx.drawImage(logo, cx - w / 2, 55, w, h);
  }

  // Kop
  teks(ctx, CONFIG.instansiBaris1, cx, 213, `700 29px ${FONT_SANS}`);
  teks(ctx, CONFIG.instansiBaris2, cx, 245, `700 29px ${FONT_SANS}`);

  // Judul
  teks(ctx, "SERTIFIKAT", cx, 315, `700 84px ${FONT_SERIF}`);
  gambarOrnamenGaris(ctx, cx, 352);
  teks(ctx, "Nomor : " + CONFIG.nomorSertifikat, cx, 392, `700 28px ${FONT_SANS}`);

  // Penerima
  teks(ctx, "Diberikan Kepada", cx, 442, `700 28px ${FONT_SANS}`);
  teksMuat(ctx, p.nama, cx, 545, s => `400 ${s}px ${FONT_SCRIPT}`, 108, 48, 1150, MARUN);
  ctx.strokeStyle = MARUN; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(376, 578); ctx.lineTo(1479, 578); ctx.stroke();

  // Keterangan
  teks(ctx, "Atas Partisipasinya Sebagai", cx, 612, `700 27px ${FONT_SANS}`);
  teks(ctx, CONFIG.sebagai, cx, 665, `700 50px ${FONT_SERIF}`);
  teks(ctx, CONFIG.pengantarKegiatan, cx, 710, `700 27px ${FONT_SANS}`);
  teksMuat(ctx, CONFIG.judulKegiatan, cx, 758, s => `700 ${s}px ${FONT_SERIF}`, 40, 24, 1300, MARUN);
  teks(ctx, CONFIG.subJudul, cx, 794, `400 22px ${FONT_SANS}`);
  teks(ctx, "Yang diselenggarakan oleh " + CONFIG.penyelenggara, cx, 838, `700 29px ${FONT_SANS}`);
  teks(ctx, "Pada Tanggal " + CONFIG.tanggalSertifikat, cx, 874, `700 29px ${FONT_SANS}`);

  // Penandatangan
  teks(ctx, CONFIG.jabatanPenandatangan, cx, 920, `700 27px ${FONT_SANS}`);
  if (ttd) {
    const maxW = 470, maxH = 225;
    const r = Math.min(maxW / ttd.width, maxH / ttd.height);
    const w = ttd.width * r, h = ttd.height * r;
    ctx.drawImage(ttd, cx - w / 2 - 25, 935, w, h);
  }
  teks(ctx, CONFIG.penandatangan, cx, 1165, `700 29px ${FONT_SANS}`);
}

function namaFile(p, ext) {
  return "Sertifikat_" + p.nama.replace(/[^a-z0-9]+/gi, "_") + "." + ext;
}

function unduhPNG(canvas, p) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = namaFile(p, "png");
  a.click();
}

function unduhPDF(canvas, p) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 297, 210);
  pdf.save(namaFile(p, "pdf"));
}
