<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Absensi Peserta Rapat</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="topbar">
    <div class="wrap">
      <strong>Absensi Rapat</strong>
      <nav>
        <a href="index.html" class="active">Absensi</a>
        <a href="sertifikat.html">Sertifikat</a>
      </nav>
    </div>
  </header>

  <main class="wrap">
    <section class="card">
      <h1 id="judulRapat">Absensi Peserta Rapat</h1>
      <p class="muted" id="infoRapat"></p>

      <form id="formAbsensi" novalidate>
        <label>Nama
          <input type="text" name="nama" placeholder="Nama lengkap (beserta gelar)" required>
        </label>
        <label>Jabatan
          <input type="text" name="jabatan" placeholder="Contoh: Analis Kebijakan" required>
        </label>
        <label>Sub Bagian
          <input type="text" name="subBagian" placeholder="Contoh: Sub Bagian Umum" required>
        </label>
        <label>Satker
          <input type="text" name="satker" placeholder="Satuan kerja" required>
        </label>
        <label>No WA
          <input type="tel" name="noWa" placeholder="08xxxxxxxxxx" inputmode="numeric" required>
        </label>
        <label>Email
          <input type="email" name="email" placeholder="nama@instansi.go.id" required>
        </label>

        <p id="pesan" class="pesan" role="alert"></p>
        <button type="submit" class="btn">Kirim Absensi</button>
      </form>
    </section>
  </main>

  <script src="app.js"></script>
  <script>
    document.getElementById('judulRapat').textContent = 'Absensi: ' + CONFIG.namaRapat;
    document.getElementById('infoRapat').textContent =
      CONFIG.tanggal + ' • ' + CONFIG.tempat;

    const form = document.getElementById('formAbsensi');
    const pesan = document.getElementById('pesan');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      pesan.textContent = '';
      const data = Object.fromEntries(new FormData(form).entries());
      Object.keys(data).forEach(k => data[k] = data[k].trim());

      for (const k in data) {
        if (!data[k]) { pesan.textContent = 'Semua kolom wajib diisi.'; return; }
      }
      if (!/^(\+62|62|0)8[0-9]{7,12}$/.test(data.noWa.replace(/[\s-]/g, ''))) {
        pesan.textContent = 'Nomor WA tidak valid (contoh: 081234567890).'; return;
      }
      if (!/^\S+@\S+\.\S+$/.test(data.email)) {
        pesan.textContent = 'Format email tidak valid.'; return;
      }

      data.waktu = new Date().toISOString();
      const btn = form.querySelector('button');
      btn.disabled = true; btn.textContent = 'Mengirim...';

      simpanPeserta(data);
      await kirimKeSheets(data);
      window.location.href = 'sertifikat.html';
    });
  </script>
</body>
</html>
