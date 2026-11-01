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

Render ke MP4:

```bash
npx remotion render FirstVideo out/first-video.mp4
```

Hasil render masuk ke folder `out/` dan tidak ikut di-commit.

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
  compositions/      satu file per video
public/              aset (gambar, audio, font), dipakai lewat staticFile()
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
- **Jaringan di Claude Code web**: environment cloud secara default memblokir `remotion.media` dan `www.remotion.dev`. Render tetap jalan karena `remotion.config.ts` memakai browser bawaan sandbox, tetapi Claude tidak bisa membaca dokumentasi Remotion online. Untuk membukanya, tambahkan kedua host itu di pengaturan Network access pada environment cloud.
- **`npm audit`** melaporkan beberapa peringatan dari dependensi tooling Remotion. Jangan jalankan `npm audit fix --force`, karena itu akan men-downgrade Remotion.
- **Lisensi**: Remotion gratis untuk tim sampai 3 orang. Untuk penggunaan di perusahaan, baca syaratnya di https://www.remotion.pro/license.
