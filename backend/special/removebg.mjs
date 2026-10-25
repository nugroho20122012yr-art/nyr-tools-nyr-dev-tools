/**
 * ============================================================================
 *  RemoveBG / Upscale
 * ============================================================================
 *
 *  @project    RemoveBG / Upscale
 *  @author     xemoz_official
 *  @github     xemoz_official
 *  @version    1.0.0
 *  @license    MIT
 *
 *  @source     https://api.yunusek.org
 *  @credit     xemoz_official
 *
 *  @description
 *  Hapus background gambar dan upscale resolusi menggunakan API publik
 *  dari api.yunusek.org. Mendukung input berupa URL, base64, atau Buffer.
 *  Tersedia dua mode: removebg (hapus background, opsional high-res) dan
 *  upscale (perbesar resolusi hingga skala tertentu).
 *
 *  @modes
 *    - removebg   : Menghapus background gambar (highRes opsional)
 *    - upscale    : Memperbesar resolusi gambar (scale 2/4/8)
 *
 *  @usage
 *    node removebg.js <mode> <image>
 *
 *  @example
 *    node removebg.js removebg https://example.com/foto.jpg
 *    node removebg.js upscale https://example.com/foto.jpg 4
 *
 *  @disclaimer
 *  Script ini disediakan untuk keperluan edukasi dan riset pribadi.
 *  Pengguna bertanggung jawab penuh atas segala konsekuensi hukum
 *  yang timbul dari penggunaan script ini.
 * ============================================================================
 */

import axios from "axios";
import FormData from "form-data";

/**
 * Remove Background API (Yunusek)
 * @param {Object} options
 * @param {string|Buffer} options.image - Image URL, base64, or Buffer (required)
 * @param {string} [options.mode="removebg"] - Mode: "removebg" or "upscale"
 * @param {string} [options.scale="2"] - Scale for upscale mode
 * @param {boolean} [options.highRes=false] - High resolution mode for removebg
 */
async function removebg(options = {}) {
  const {
    image,
    mode = "removebg",
    scale = "2",
    highRes = false,
  } = options;

  if (!image) throw new Error('Parameter "image" is required');

  const baseURL = "https://api.yunusek.org";
  const client = axios.create({
    baseURL,
    headers: {
      "User-Agent": "okhttp/4.9.2",
      "Accept-Encoding": "gzip",
    },
  });

  async function resolveImage(input) {
    if (Buffer.isBuffer(input)) return input;
    if (typeof input === "string") {
      if (input.startsWith("http")) {
        const res = await axios.get(input, { responseType: "arraybuffer" });
        return Buffer.from(res.data);
      }
      if (input.includes("base64,")) return Buffer.from(input.split(",")[1], "base64");
      return Buffer.from(input, "base64");
    }
    throw new Error("Invalid image format");
  }

  async function request(endpoint, fields = {}, imageBuffer) {
    const form = new FormData();
    form.append("image", imageBuffer, {
      filename: "image.png",
      contentType: "image/png",
    });
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, String(value));
    }
    const res = await client.post(endpoint, form, {
      headers: form.getHeaders(),
      responseType: "arraybuffer",
    });
    return {
      buffer: Buffer.from(res.data),
      contentType: res.headers["content-type"] || "image/png",
    };
  }

  const activeMode = (mode || "removebg").toLowerCase();
  const buf = await resolveImage(image);

  if (activeMode === "removebg") {
    return await request("/api/remove-background", {
      high_res: highRes ? "true" : "false",
    }, buf);
  }

  if (activeMode === "upscale") {
    return await request("/api/upscale", {
      scale: String(scale),
    }, buf);
  }

  throw new Error('Invalid mode (use "removebg" or "upscale")');
}

export default removebg;
