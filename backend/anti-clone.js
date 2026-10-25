// Proteksi sisi server: hanya origin resmi yang boleh memakai API (anti-clone / anti-bot).
// Daftar host dibaca dari allowed-hosts.json (sama dengan yang dipakai anti-clone.js di browser).
const cfg = require("../allowed-hosts.json");

const BOT_UA = /(curl|wget|python-requests|python-urllib|aiohttp|httpx|go-http|java\/|okhttp|libwww|scrapy|node-fetch|axios|undici|postman|insomnia|httpie|headless|phantomjs|selenium|puppeteer|playwright|bot\b|spider|crawler)/i;

const hostOf = (v) => { try { return new URL(v).hostname.toLowerCase(); } catch { return ""; } };
const isLocal = (h) => h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
const hostAllowed = (h) => !!h && (cfg.hosts.includes(h) || (cfg.allowLocalhost && isLocal(h)));

// return null kalau lolos, atau string alasan penolakan
function checkRequest(req, body) {
  const h = req.headers || {};
  const origin = hostOf(h.origin);
  const referer = hostOf(h.referer);
  if (!origin || !hostAllowed(origin)) return "Origin tidak diizinkan";
  if (referer && !hostAllowed(referer)) return "Referer tidak diizinkan";
  if (h["sec-fetch-site"] && h["sec-fetch-site"] !== "same-origin") return "Request lintas situs ditolak";
  if (!h["user-agent"] || BOT_UA.test(h["user-agent"])) return "Client tidak diizinkan";
  if (h["x-requested-with"] !== "nyr-tools") return "Header tidak valid";
  if (body && body._hp) return "Terdeteksi bot";                       // honeypot terisi
  if (body && Number(body._t) < 600) return "Terlalu cepat, coba lagi"; // form dikirim < 0,6 detik setelah halaman dibuka
  return null;
}

module.exports = { checkRequest, hostAllowed };
