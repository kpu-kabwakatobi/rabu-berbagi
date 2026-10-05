/* ============ KONFIGURASI (ubah sesuai kebutuhan) ============ */
const CONFIG = {
  namaRapat: "Rabu Berbagi Seri XIX",
  tanggal: "7 Oktober 2026",
  tempat: "Kendari, Sulawesi Selatan",
  penyelenggara: "KPU Provinsi Sulawesi Tenggara",
  penandatangan: "Dr. Asril, S.Sos.,M.Si",
  jabatanPenandatangan: "Ketua Divisi Hukum dan Pengawasan",
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

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = w; y += lineHeight;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y;
}

function gambarSertifikat(canvas, p) {
  canvas.width = CERT_W; canvas.height = CERT_H;
  const ctx = canvas.getContext("2d");
  ctx.textAlign = "center";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CERT_W, CERT_H);

  // Bingkai
  ctx.strokeStyle = "#1e3a8a"; ctx.lineWidth = 18;
  ctx.strokeRect(40, 40, CERT_W - 80, CERT_H - 80);
  ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 5;
  ctx.strokeRect(75, 75, CERT_W - 150, CERT_H - 150);

  const cx = CERT_W / 2;

  ctx.fillStyle = "#1e3a8a";
  ctx.font = "bold 96px Georgia, serif";
  ctx.fillText("SERTIFIKAT", cx, 260);

  ctx.fillStyle = "#444";
  ctx.font = "30px Georgia, serif";
  ctx.fillText("Diberikan kepada:", cx, 350);

  // Nama
  ctx.fillStyle = "#111";
  let size = 84;
  ctx.font = `italic bold ${size}px Georgia, serif`;
  while (ctx.measureText(p.nama).width > CERT_W - 340 && size > 36) {
    size -= 4; ctx.font = `italic bold ${size}px Georgia, serif`;
  }
  ctx.fillText(p.nama, cx, 470);

  ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 450, 500); ctx.lineTo(cx + 450, 500); ctx.stroke();

  ctx.fillStyle = "#333";
  ctx.font = "32px Georgia, serif";
  ctx.fillText(`${p.jabatan} — ${p.subBagian}`, cx, 560);
  ctx.fillText(p.satker, cx, 605);

  ctx.font = "34px Georgia, serif";
  ctx.fillText("sebagai PESERTA dalam kegiatan", cx, 700);

  ctx.fillStyle = "#1e3a8a";
  ctx.font = "bold 50px Georgia, serif";
  const yAkhir = wrapText(ctx, CONFIG.namaRapat, cx, 775, CERT_W - 340, 62);

  ctx.fillStyle = "#333";
  ctx.font = "30px Georgia, serif";
  ctx.fillText(`${CONFIG.tempat}, ${CONFIG.tanggal}`, cx, yAkhir + 70);
  ctx.fillText(`Diselenggarakan oleh ${CONFIG.penyelenggara}`, cx, yAkhir + 112);

  // Tanda tangan
  ctx.font = "28px Georgia, serif";
  ctx.fillText(CONFIG.jabatanPenandatangan, cx, 1020);
  ctx.font = "bold 30px Georgia, serif";
  ctx.fillText(CONFIG.penandatangan, cx, 1130);
  ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = "#333";
  ctx.moveTo(cx - 200, 1105); ctx.lineTo(cx + 200, 1105); ctx.stroke();
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
