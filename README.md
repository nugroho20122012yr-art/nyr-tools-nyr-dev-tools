# Nugroho Dev — Tools Arsenal

Website kumpulan tools bergaya **Neo Brutalism** · Node.js backend · siap deploy ke **Vercel**.
Dev: **Nugroho Dev** (Dev Nugroho Y.R. Dev)

## Struktur
```
api/[tool].js        -> 1 serverless function untuk semua tool (POST /api/<id>)
backend/             -> kode Node.js (scraper) — hanya jalan di server, tidak pernah dikirim ke browser
  scrapers/          -> modul downloader (dari NodeJs.zip)
  special/           -> tool khusus (play mp3, emoji mix, remove bg, brat, web to zip, tiktok stalk)
  tools.js           -> registry tool -> provider (auto-fallback antar provider)
  guard.js           -> anti-SSRF + rate limit
index.html           -> GERBANG (di luar public): cek link, lalu pindah ke /public/
anti-clone.js        -> proteksi link (client), dipakai gerbang. Host diatur di allowed-hosts.json
public/              -> website utama
  index.html         -> menu tools (HTML + CSS + JS jadi 1 file)
  tools/<id>/index.html -> 1 folder = 1 tool = 1 file
  proxy/proxy.js     -> penjaga link: kalau host bukan link resmi (hasil clone), halaman dilempar ke index.html gerbang anti-clone. Host dari allowed-hosts.json
dist/                -> hasil build untuk Vercel (gerbang + anti-clone.js + public/); backend/api TIDAK ikut, jadi aman. Otomatis dibuat, jangan di-commit
backend/anti-clone.js-> proteksi server (origin, bot, honeypot) untuk API
scripts/             -> generator: tools-meta.js, build.js, src/ (style.css, menu.js, select.js, tool.js = sumber CSS/JS yang digabung ke HTML; select.js = dropdown custom pengganti <select> bawaan browser)
```

## Deploy ke Vercel
1. Upload folder ini ke GitHub (atau `npx vercel` dari folder ini).
2. Import project di vercel.com → Framework: **Other** → Deploy. (Config sudah ada di `vercel.json`.)
3. Selesai. Vercel otomatis `npm install` dan menjalankan `api/` sebagai Node.js function.

## Tambah tool baru
1. Taruh scraper di `backend/scrapers/<nama>/` (export `scrape(url)` yang return `{status, result:{title, thumbnail, downloads:[{type,quality,url}]}}`).
2. Daftarkan di `backend/tools.js` dan `scripts/tools-meta.js` (id harus sama).
3. Jalankan `npm run build` → halaman `public/tools/<id>/index.html` otomatis dibuat.
4. Mau ubah tampilan? Edit `scripts/src/style.css` / `tool.js` / `menu.js`, lalu build ulang (jangan edit file di `public/` langsung, akan tertimpa).

## Catatan
- Scraper bergantung pada website pihak ketiga; kalau mereka berubah/memblokir, provider bisa gagal (sistem otomatis coba provider berikutnya).
- Dibuang dari NodeJs.zip: modul khusus bot WA (reaksi saluran/channel), semua file `.txt` petunjuk bot, dan 3 scraper yang butuh browser (puppeteer/playwright) karena tidak jalan di Vercel.
- Limit Vercel: body request ±4.5MB (gambar maks ~3MB), durasi function 60 detik.
- Gunakan untuk keperluan pribadi dan hormati hak cipta.

## Jalankan lokal
`npm run build` lalu `npx vercel dev` (buka http://localhost:3000). Setelah live di Vercel, set `allowLocalhost` ke `false` di `allowed-hosts.json`.
