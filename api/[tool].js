// Satu serverless function untuk semua tool: POST /api/<tool-id>
// Semua kode scraper hanya ada di server (/backend), tidak pernah dikirim ke browser.
const { tools } = require("../backend/tools");
const { assertPublicUrl, rateLimit } = require("../backend/guard");
const { checkRequest } = require("../backend/anti-clone");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const send = (code, body) => res.status(code).json(body);

  if (req.method !== "POST") return send(405, { status: false, message: "Gunakan method POST" });
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  const blocked = checkRequest(req, body);
  if (blocked) return send(403, { status: false, message: blocked });
  delete body._hp; delete body._t;
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "x").split(",")[0].trim();
  if (!rateLimit(ip)) return send(429, { status: false, message: "Terlalu banyak request, coba lagi sebentar lagi" });

  const id = String(req.query.tool || "");
  const tool = Object.prototype.hasOwnProperty.call(tools, id) ? tools[id] : null;
  if (!tool) return send(404, { status: false, message: "Tool tidak ditemukan" });

  try {
    if (tool.kind === "custom") {
      if (tool.needsUrl) body.url = await assertPublicUrl(body.url);
      return send(200, await tool.run(body));
    }

    const url = await assertPublicUrl(body.url);
    const format = tool.format && body.format === "mp3" ? "mp3" : "mp4";
    const wanted = typeof body.provider === "string" ? body.provider : "auto";
    const list = wanted === "auto" ? tool.providers : tool.providers.filter((p) => p.name === wanted);
    if (!list.length) return send(400, { status: false, message: "Provider tidak dikenal" });
    const errors = [];
    for (const p of list) {
      try {
        const fn = p.load();
        const out = tool.format ? await (p.name === "ytmp3" ? fn(url, format) : fn(url, { format })) : await fn(url);
        if (out && out.status !== false && (out.result || out.data)) return send(200, { ...out, provider: p.name });
        errors.push(`${p.name}: ${out?.message || "tidak ada hasil"}`);
      } catch (e) {
        errors.push(`${p.name}: ${e.message}`);
      }
    }
    return send(502, { status: false, message: list.length > 1 ? "Semua provider gagal. Pastikan link publik & benar, atau pilih provider manual untuk dites satu per satu." : `Provider ${list[0].name} gagal. Coba provider lain atau pilih Otomatis.`, detail: errors });
  } catch (e) {
    return send(400, { status: false, message: e.message || "Request gagal" });
  }
};

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }
