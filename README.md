# video

Repo untuk membuat video dengan [Remotion](https://www.remotion.dev/) + Claude Code.

## Rencana
- [x] Setup Remotion
- [x] Sambungkan ke Claude Code
- [x] Buat video pertama (`FirstVideo`)

## Mulai cepat

Butuh Node.js 20.19+ atau 22.13+ (cek dengan `node -v`).

```bash
npm install
npm run dev
```

`npm run dev` membuka Remotion Studio (preview video) di http://localhost:3000.

Render ke MP4 (format: `npx remotion render <id> out/<nama>.mp4`):

```bash
npx remotion render LangitBiru out/langit-biru.mp4 --image-format=png
```

Hasil render masuk ke folder `out/` dan tidak ikut di-commit.

## Video yang sudah ada

- `FirstVideo`: kartu judul 5 detik. Render: `npx remotion render FirstVideo out/first-video.mp4`.
- `LangitBiru`: penjelasan "Kenapa langit berwarna biru?", sekitar 2 menit, landscape 1920x1080, delapan scene. Dijelaskan oleh suara narator (bahasa Indonesia), tanpa subtitle di layar, dengan musik latar orisinal di bawahnya. Render sekitar 5 menit, dan `--image-format=png` membuat gambar vektornya lebih tajam. Naskahnya ada di `scripts/narration/naskah.md`. Kalau naskah diubah, suara dan panjang video dibuat ulang oleh `scripts/narration/make_narration.py` (cara pakainya ada di bagian atas file itu), atau minta Claude yang menjalankannya.

## Bikin video dengan Claude Code

Repo ini sudah disambungkan ke Claude Code lewat dua hal:

1. **Skill resmi Remotion** di `.agents/skills/` (`.claude/skills` adalah symlink ke sana, supaya terbaca Claude Code). Skill ini mengajari Claude cara menulis kode Remotion yang benar (animasi, timing, font, audio, caption, dll).
2. **`CLAUDE.md`**: aturan kerja khusus repo ini, yaitu struktur folder, perintah yang dipakai, dan alur kerjanya (render, cek frame, lalu kirim MP4).

Jalankan Claude Code di folder repo ini (atau buka repo ini di Claude Code web), lalu minta videonya dengan bahasa biasa. Contoh:

- "Buat video intro 10 detik untuk channel masak, judul 'Resep Mudah', latar oranye, dengan animasi teks."
- "Ubah `FirstVideo`: ganti judulnya jadi ... dan tambahkan transisi fade ke scene kedua."
- "Buat versi vertikal 1080x1920 untuk Reels."

Di Claude Code web, Studio tidak bisa dibuka dari browser kamu. Karena itu Claude me-render sendiri, mengecek beberapa frame, lalu mengirim file MP4-nya ke chat. Kalau dijalankan lokal, pakai `npm run dev` untuk preview langsung.

## Struktur

```
src/
  index.ts           entry point (registerRoot)
  Root.tsx           daftar semua <Composition>
  compositions/      satu file per video (folder kalau banyak scene)
public/              aset (gambar, audio, font), dipakai lewat staticFile()
scripts/music/       pembuat musik latar (Python + numpy)
scripts/narration/   naskah narasi dan pembuat suaranya
out/                 hasil render (di-gitignore)
.agents/skills/      skill resmi Remotion (jangan diedit manual)
.claude/skills       symlink ke .agents/skills
skills-lock.json     sumber dan hash skill
CLAUDE.md            instruksi untuk Claude Code
remotion.config.ts   konfigurasi Remotion
```

## Catatan

- **Upgrade**: `npx remotion upgrade` meng-upgrade Remotion sekaligus skill-nya. Itu hanya bekerja kalau skill tetap berada di `.agents/skills`.
- **Windows**: `.claude/skills` adalah symlink Git. Aktifkan Developer Mode dan `git config core.symlinks true` sebelum clone. Kalau tidak, symlink-nya berubah jadi file teks biasa dan skill tidak terbaca Claude Code.
- **Jaringan di Claude Code web**: environment cloud secara default memblokir `remotion.media` dan `www.remotion.dev`. Render tetap jalan karena `remotion.config.ts` memakai browser bawaan sandbox, tetapi Claude tidak bisa membaca dokumentasi Remotion online. Untuk membukanya, tambahkan kedua host itu di pengaturan Network access pada environment cloud. Di sandbox yang sama, browser untuk render juga tidak bisa memuat file dari internet (font Google gagal dengan error sertifikat). Karena itu fontnya disimpan lokal di `public/fonts/`, dan gambar atau audio sebaiknya juga ditaruh di `public/`.
- **Font**: Nunito (lisensi SIL Open Font License, teks lisensinya ada di `public/fonts/Nunito-OFL.txt`).
- **Lisensi suara narator**: suaranya dibuat dengan model suara Piper `id_ID-news_tts-medium` yang jalan offline. Lisensi model itu **belum bisa diverifikasi** (model card di dalam paketnya tertukar dengan model bahasa lain). Cek dulu sebelum video diunggah ke publik, terutama kalau dimonetisasi. Alternatifnya, ganti dengan rekaman suara sendiri: simpan MP3 bernama sama dengan id kalimatnya di `public/audio/narration/`, lalu jalankan generator dengan `--from-audio`. Musik latarnya buatan sendiri dan bebas lisensi.
- **`npm audit`** melaporkan beberapa peringatan dari dependensi tooling Remotion. Jangan jalankan `npm audit fix --force`, karena itu akan men-downgrade Remotion.
- **Lisensi**: Remotion gratis untuk tim sampai 3 orang. Untuk penggunaan di perusahaan, baca syaratnya di https://www.remotion.pro/license.
