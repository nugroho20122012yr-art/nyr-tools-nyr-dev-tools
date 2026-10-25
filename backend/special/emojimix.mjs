/**
 * ============================================================================
 *  Emoji Kitchen Mix
 * ============================================================================
 *
 *  @project    Emoji Kitchen Mix
 *  @author     xemoz_official
 *  @github     xemoz_official
 *  @version    1.0.0
 *  @license    MIT
 *
 *  @source     https://www.gstatic.com/android/keyboard/emojikitchen
 *  @credit     xemoz_official
 *
 *  @description
 *  Menggabungkan dua emoji menjadi satu gambar menggunakan Google Emoji
 *  Kitchen. Script akan mencoba beberapa versi asset Google (20201001,
 *  20220823, 20230301, 20230803) dan urutan emoji (A+B / B+A) sampai
 *  menemukan kombinasi yang tersedia. Mendukung output berupa Buffer
 *  dan data URL base64.
 *
 *  @features
 *    - Auto-detect emoji menggunakan emoji-regex
 *    - Multi-version fallback asset Google
 *    - Multi-order fallback (emoji1+emoji2 / emoji2+emoji1)
 *    - Output Buffer + base64 data URL
 *
 *  @usage
 *    node emojimix.js <emoji1><emoji2>
 *
 *  @example
 *    node emojimix.js "😀😂"
 *    node emojimix.js "🐱🐶"
 *
 *  @disclaimer
 *  Script ini disediakan untuk keperluan edukasi dan riset pribadi.
 *  Pengguna bertanggung jawab penuh atas segala konsekuensi hukum
 *  yang timbul dari penggunaan script ini.
 * ============================================================================
 */

import axios from "axios";
import emojiRegex from "emoji-regex";

/**
 * Emoji Kitchen Mix (Google Emoji)
 * @param {Object} options
 * @param {string} options.emoji - Two emojis to mix (required, e.g. "😀😂")
 */
async function emojimix(options = {}) {
  const { emoji } = options;

  if (!emoji) throw new Error('Parameter "emoji" is required (two emojis)');

  const regex = emojiRegex();
  const emojis = emoji.match(regex);

  if (!emojis || emojis.length < 2) {
    throw new Error("Harus ada dua emoji.");
  }

  const c = (emoji) => "u" + emoji.codePointAt(0).toString(16).padStart(4, "0");

  const api = (e1, e2, v) =>
    `https://www.gstatic.com/android/keyboard/emojikitchen/${v}/${c(e1)}/${c(e1)}_${c(e2)}.png`;

  const versions = ["20201001", "20220823", "20230301", "20230803"];

  for (const v of versions) {
    for (const [e1, e2] of [[emojis[0], emojis[1]], [emojis[1], emojis[0]]]) {
      const url = api(e1, e2, v);
      try {
        const response = await axios.get(url, {
          headers: { "User-Agent": "Postify/1.0.0" },
          responseType: "arraybuffer",
        });
        if (response.status === 200) {
          const buffer = Buffer.from(response.data);
          return {
            buffer: buffer,
            image: `data:image/png;base64,${buffer.toString("base64")}`,
            url: url,
          };
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          console.error(error.message);
        }
        continue;
      }
    }
  }

  throw new Error("Kombinasi emoji tidak tersedia di Google Emoji Kitchen.");
}

export default emojimix;
