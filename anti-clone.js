/*! anti-clone.js — Nugroho Dev Tools
 *  Menjaga agar website hanya jalan di domain resmi (dan localhost saat dev).
 *  Konfigurasi ada di allowed-hosts.json (di-inject otomatis saat `npm run build`).
 *  Untuk hapus localhost: ubah "allowLocalhost" jadi false di allowed-hosts.json lalu build/deploy ulang.
 *  Catatan: ini lapisan client; perlindungan yang sebenarnya ada di backend/anti-clone.js (API). */
(function () {
  /*CFG_START*/ var CFG = {"hosts":["nyr-tools-nyr-dev-tools.vercel.app"],"allowLocalhost":true}; /*CFG_END*/
  var OFFICIAL = "https://" + CFG.hosts[0] + "/";
  var h = String(location.hostname || "").toLowerCase();
  var local = h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
  var ok = CFG.hosts.indexOf(h) !== -1 || (CFG.allowLocalhost && local);

  // 1) Domain salah (hasil clone / salah link) -> blok halaman & arahkan ke link resmi
  if (!ok) {
    try { window.stop(); } catch (e) {}
    document.documentElement.innerHTML =
      '<head><meta charset="utf-8"><title>Link tidak resmi</title></head>' +
      '<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#ffe14d;font:700 1.1rem system-ui,sans-serif;color:#111;text-align:center;padding:20px">' +
      '<div style="background:#fff;border:4px solid #111;box-shadow:8px 8px 0 #111;padding:28px;max-width:480px">' +
      '<div style="font-size:2.4rem">⛔</div><p>Ini bukan link resmi Nugroho Dev Tools.</p>' +
      '<a href="' + OFFICIAL + '" style="display:inline-block;background:#ff7eb6;color:#111;border:3px solid #111;padding:10px 18px;text-decoration:none">Buka situs resmi →</a></div></body>';
    setTimeout(function () { location.replace(OFFICIAL); }, 2500);
    return;
  }

  // 2) Anti-iframe (clickjacking / di-embed situs lain)
  if (window.top !== window.self) {
    try { window.top.location = location.href; } catch (e) { document.documentElement.innerHTML = ""; }
    return;
  }

  // 3) Paksa HTTPS di domain resmi
  if (!local && location.protocol === "http:") { location.replace("https://" + location.host + location.pathname + location.search + location.hash); return; }

  // 4) Info untuk app.js (waktu halaman dibuka -> dikirim sebagai sinyal anti-bot)
  window.__NYR = { t0: Date.now() };
})();
