// Generator:
//   public/index.html            = menu (HTML + CSS + JS jadi satu)
//   public/tools/<id>/index.html = 1 folder = 1 tool (juga satu file)
//   dist/                        = hasil akhir untuk Vercel: gerbang (index.html + anti-clone.js di luar public) + public/
const fs = require("fs"), path = require("path");
const { cats, tools } = require("./tools-meta");
const backend = require("../backend/tools").tools; // provider di-require lazy, tidak butuh dependency saat build
const root = path.join(__dirname, "..");
const pub = path.join(root, "public");
const src = (f) => fs.readFileSync(path.join(__dirname, "src", f), "utf8");
// minify ringan (aman): buang komentar baris penuh/blok, indentasi, spasi di CSS
const minCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}").replace(/\s+/g, " ").trim();
const minJs = (s) => s.replace(/^\s*\/\*[\s\S]*?\*\/\s*/g, "").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//")).join("\n");
// anti-clone.js (ROOT) dan public/proxy/proxy.js: inject konfigurasi dari allowed-hosts.json
const cfg = JSON.parse(fs.readFileSync(path.join(root, "allowed-hosts.json"), "utf8"));
const injectCfg = (file) => {
  const code = fs.readFileSync(file, "utf8").replace(/\/\*CFG_START\*\/[\s\S]*?\/\*CFG_END\*\//, "/*CFG_START*/ var CFG = " + JSON.stringify(cfg) + "; /*CFG_END*/");
  fs.writeFileSync(file, code);
};
injectCfg(path.join(root, "anti-clone.js"));
injectCfg(path.join(pub, "proxy", "proxy.js"));
const CSS = `<style>${minCss(src("style.css"))}</style>`;
const SELECT_JS = `<script>${minJs(src("select.js"))}</script>`;
const MENU_JS = `<script>${minJs(src("menu.js"))}</script>`;
const TOOL_JS = `<script>${minJs(src("tool.js"))}</script>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const iconFile = (t) => fs.existsSync(path.join(pub, "icons", t.id + ".webp"));
const iconHtml = (t) => (iconFile(t) ? `<img src="/public/icons/${t.id}.webp" alt="" width="192" height="192" decoding="async">` : t.icon);
const iconMini = (t) => (iconFile(t) ? `<img class="mi" src="/public/icons/${t.id}.webp" alt="" width="24" height="24">` : t.icon);
const COLORS = ["y", "p", "b", "g", "o", "v"];
const col = (i) => COLORS[i % COLORS.length];

const head = (title, desc) => `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="/public/proxy/proxy.js"></script>
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
${CSS}</head>`;

const footer = `<footer class="foot"><b>© 2026 Nugroho Dev</b> — Dev Nugroho Y.R. Dev<span>Gunakan untuk keperluan pribadi &amp; hormati hak cipta pemilik konten.</span></footer>`;
const nav = `<header class="top"><a class="brand" href="/public/"><span>N</span>NUGROHO DEV</a><a class="btn sm" href="/public/#tools">Semua Tools</a></header>`;

function formFor(t) {
  const i = t.in;
  if (i.kind === "image") return `<div class="field"><label for="img">Gambar (PNG/JPG/WEBP, maks ~3MB)</label><input id="img" type="file" accept="image/png,image/jpeg,image/webp"></div>
<div class="row"><div class="field"><label for="mode">Mode</label><select id="mode"><option value="removebg">Hapus Background</option><option value="upscale">Upscale</option></select></div>
<div class="field"><label for="scale">Skala (upscale)</label><select id="scale"><option>2</option><option>4</option><option>8</option></select></div></div>`;
  const label = { url: "Tempel link", username: "Username", text: i.emoji ? "Dua emoji" : "Teks / judul" }[i.kind];
  let extra = "";
  if (i.format) extra = `<div class="field"><label for="format">Format</label><select id="format"><option value="mp3">MP3 (audio)</option><option value="mp4">MP4 (video)</option></select></div>`;
  if (i.quality) extra = `<div class="field"><label for="quality">Kualitas MP3</label><select id="quality"><option>128</option><option>192</option><option>320</option></select></div>`;
  const provs = (backend[t.id] && backend[t.id].providers) || [];
  const picker = provs.length > 1 ? `<div class="field"><label for="provider">Scraper / Provider</label><select id="provider"><option value="auto">Otomatis (coba semua sampai berhasil)</option>${provs.map((p) => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("")}</select><small class="hint">Pilih satu untuk tes scraper itu saja. Kalau error, ganti provider lain atau balik ke Otomatis.</small></div>` : "";
  return `<div class="field"><label for="q">${label}</label><input id="q" type="text" placeholder="${esc(i.placeholder || "")}" autocomplete="off" required></div>${picker}${extra}`;
}

function toolPage(t, idx) {
  return `${head(t.name + " — Nugroho Dev", t.desc)}<body>${nav}
<main class="wrap" data-tool="${t.id}" data-kind="${t.in.kind}"${t.in.emoji ? ' data-emoji="1"' : ""}>
<a class="back" href="/public/#tools">← Kembali ke menu</a>
<section class="card c-${col(idx)} hero-tool"><div class="ico">${iconHtml(t)}</div><div><span class="tag">${esc(cats[t.cat])}</span><h1>${esc(t.name)}</h1><p>${esc(t.desc)}</p></div></section>
<form id="f" class="card" novalidate>${formFor(t)}<input id="hp-field" name="hp-field" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0"><button class="btn" id="go" type="submit">Proses →</button></form>
<div id="out" aria-live="polite"></div>
</main>${footer}${SELECT_JS}${TOOL_JS}</body></html>`;
}

function indexPage() {
  const chips = [`<button class="chip on" data-cat="all">Semua (${tools.length})</button>`].concat(Object.entries(cats).map(([k, v]) => `<button class="chip" data-cat="${k}">${esc(v)}</button>`)).join("");
  const cards = tools.map((t, i) => `<a class="card tool c-${col(i)}" href="/public/tools/${t.id}/" data-cat="${t.cat}" data-name="${esc((t.name + " " + t.desc).toLowerCase())}"><div class="ico">${iconHtml(t)}</div><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p><span class="go">Buka →</span></a>`).join("\n");
  const mq = tools.map((t) => `${iconMini(t)} ${esc(t.name)}`).join("  ✦  ");
  return `${head("Nugroho Dev — Tools Arsenal", "Kumpulan tools web gratis: downloader, converter, dan utilitas. By Nugroho Dev.")}<body>${nav}
<section class="hero"><div class="wrap">
<span class="tag rot">Dev Nugroho Y.R. Dev</span>
<h1>TOOLS<br><em>ARSENAL</em> 🧰</h1>
<p>Satu tempat, ${tools.length} tools. Klik kartu, tempel link, selesai. Tanpa ribet, tanpa login.</p>
<a class="btn" href="#tools">Lihat Semua Tools ↓</a></div></section>
<div class="marq"><div>${mq}  ✦  ${mq}</div></div>
<section class="wrap" id="tools"><div class="bar"><input id="s" type="search" placeholder="Cari tools…" aria-label="Cari tools"><div class="chips">${chips}</div></div>
<div class="grid" id="grid">
${cards}
</div><p id="empty" class="empty" hidden>Tools tidak ditemukan 🔍</p></section>
${footer}${MENU_JS}</body></html>`;
}

const gate = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="/anti-clone.js"></script>
<title>protection</title>
<style>html,body{height:100%;margin:0}body{display:flex;align-items:center;justify-content:center;background:#ffe14d;color:#111;font-family:monospace;font-size:1.1rem;text-align:center;padding:20px}</style>
</head><body>
<p>halaman ini dilindungi oleh anti-clone.js</p>
<noscript><p><a href="/public/">lanjut</a></p></noscript>
<script>if (window.__NYR) setTimeout(function () { location.replace("/public/"); }, 1200);</script>
</body></html>
`;
fs.writeFileSync(path.join(root, "index.html"), gate);
fs.mkdirSync(pub, { recursive: true });
fs.rmSync(path.join(pub, "menu"), { recursive: true, force: true });
fs.rmSync(path.join(pub, "assets"), { recursive: true, force: true });
fs.rmSync(path.join(pub, "anti-clone.js"), { force: true });
fs.writeFileSync(path.join(pub, "index.html"), indexPage());
fs.rmSync(path.join(pub, "tools"), { recursive: true, force: true });
tools.forEach((t, i) => {
  const d = path.join(pub, "tools", t.id);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, "index.html"), toolPage(t, i));
});
console.log(`Built index + ${tools.length} tool pages`);

// ---- dist/: yang disajikan Vercel (backend/api/scripts TIDAK ikut, jadi tidak bisa diakses publik) ----
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.copyFileSync(path.join(root, "index.html"), path.join(dist, "index.html"));
fs.copyFileSync(path.join(root, "anti-clone.js"), path.join(dist, "anti-clone.js"));
fs.cpSync(pub, path.join(dist, "public"), { recursive: true });
console.log("dist/ siap: index.html + anti-clone.js + public/");
