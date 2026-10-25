// Keamanan dasar: validasi URL (anti-SSRF) + rate limit sederhana (best effort di serverless)
const dns = require("dns").promises;
const net = require("net");

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const l = ip.toLowerCase();
  return l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || l.startsWith("::ffff:127.") || l.startsWith("::ffff:10.") || l.startsWith("::ffff:192.168.");
};

async function assertPublicUrl(raw) {
  let u;
  try { u = new URL(String(raw).trim()); } catch { throw new Error("URL tidak valid"); }
  if (!/^https?:$/.test(u.protocol)) throw new Error("Hanya URL http/https yang diizinkan");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Host tidak diizinkan");
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Host tidak diizinkan");
  } else {
    const addrs = await dns.lookup(host, { all: true }).catch(() => []);
    if (!addrs.length) throw new Error("Domain tidak bisa di-resolve");
    if (addrs.some((a) => isPrivateIp(a.address))) throw new Error("Host tidak diizinkan");
  }
  return u.toString();
}

const hits = new Map();
function rateLimit(ip, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const rec = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  rec.push(now);
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();
  return rec.length <= limit;
}

module.exports = { assertPublicUrl, rateLimit };
