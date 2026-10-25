// Registry tool -> provider. Provider di-require secara lazy (cold start lebih cepat).
// Kalau satu provider gagal, otomatis lanjut ke provider berikutnya.
const S = "./scrapers/";
const pick = (dir, names) => names.map((n) => ({ name: n, load: () => require(S + dir + "/" + n).scrape }));

const tools = {
  tiktok:      { kind: "url", providers: pick("tiktok", ["snaptik", "ssstik", "tikdownloader", "tiktokio"]) },
  instagram:   { kind: "url", providers: pick("instagram", ["indown", "snapsave", "direct"]) },
  facebook:    { kind: "url", providers: pick("facebook", ["snapsave"]) },
  twitter:     { kind: "url", providers: pick("twitter", ["tweeload", "tvd", "savetwt", "direct"]) },
  youtube:     { kind: "url", providers: pick("youtube", ["ytmp3", "ytmp3gg"]), format: true },
  ytplaylist:  { kind: "url", providers: pick("youtube", ["playlist"]) },
  spotify:     { kind: "url", providers: pick("spotify", ["spotmate", "spotidown", "soundloaders", "spotisaver"]) },
  soundcloud:  { kind: "url", providers: pick("soundcloud", ["klickaud"]) },
  applemusic:  { kind: "url", providers: pick("applemusic", ["aplmate"]) },
  bandcamp:    { kind: "url", providers: pick("bandcamp", ["bandcampdownloader", "direct"]) },
  bilibili:    { kind: "url", providers: pick("bilibili", ["direct"]) },
  douyin:      { kind: "url", providers: pick("douyin", ["direct"]) },
  pinterest:   { kind: "url", providers: pick("pinterest", ["pindown", "direct"]) },
  pixiv:       { kind: "url", providers: pick("pixiv", ["ajax"]) },
  reddit:      { kind: "url", providers: pick("reddit", ["rapidsave"]) },
  rednote:     { kind: "url", providers: pick("rednote", ["direct"]) },
  threads:     { kind: "url", providers: pick("threads", ["threadster"]) },
  terabox:     { kind: "url", providers: pick("terabox", ["sechno"]) },
  mediafire:   { kind: "url", providers: pick("resolver", ["mediafire"]) },
  sfile:       { kind: "url", providers: pick("resolver", ["sfile"]) },
  unshorten:   { kind: "url", providers: pick("resolver", ["unshorten"]) },
  bypass:      { kind: "url", providers: pick("resolver", ["safelinku", "sub2unlock", "rekonise"]) },
  tiktokstalk: { kind: "custom", run: async ({ username }) => require("./special/tiktokstalk").tiktokStalk(username) },
  play:        { kind: "custom", run: async ({ query, quality }) => {
                   const q = String(query || "").trim();
                   if (q.length < 2 || q.length > 150) throw new Error("Judul lagu 2-150 karakter");
                   const { default: ytmp3 } = await import("./special/playmp3.mjs");
                   const r = await ytmp3(q, { quality: ["128", "192", "320"].includes(String(quality)) ? String(quality) : "128" });
                   const d = r.download || {};
                   const link = d.url || d.downloadUrl || d.link || d.download || (typeof d === "string" ? d : "");
                   return { status: true, result: { title: r.video?.title || q, thumbnail: r.video?.thumbnail || "", type: "audio",
                     author: { name: r.video?.author || "" }, downloads: link ? [{ type: "audio", quality: `MP3 ${quality || 128}kbps`, url: link }] : [], raw: link ? undefined : d } };
                 } },
  emojimix:    { kind: "custom", run: async ({ emoji }) => {
                   const { default: emojimix } = await import("./special/emojimix.mjs");
                   const r = await emojimix({ emoji: String(emoji || "") });
                   return { status: true, result: { title: "Emoji Mix", thumbnail: r.image, type: "image", downloads: [{ type: "image", quality: "PNG", url: r.url }] } };
                 } },
  removebg:    { kind: "custom", run: async ({ image, mode, scale }) => {
                   if (!/^data:image\/(png|jpe?g|webp);base64,/.test(String(image || ""))) throw new Error("Upload gambar PNG/JPG/WEBP");
                   if (String(image).length > 4_200_000) throw new Error("Gambar terlalu besar (maks ~3MB)");
                   const { default: removebg } = await import("./special/removebg.mjs");
                   const m = mode === "upscale" ? "upscale" : "removebg";
                   const r = await removebg({ image, mode: m, scale: ["2", "4", "8"].includes(String(scale)) ? String(scale) : "2" });
                   const data = `data:${r.contentType};base64,${r.buffer.toString("base64")}`;
                   return { status: true, result: { title: m === "upscale" ? "Gambar di-upscale" : "Background dihapus", thumbnail: data, type: "image", downloads: [{ type: "image", quality: "Simpan gambar", url: data, filename: m + ".png" }] } };
                 } },
  brat:        { kind: "custom", run: async ({ text }) => {
                   const t = String(text || "").trim();
                   if (!t || t.length > 200) throw new Error("Teks 1-200 karakter");
                   const { bratVid } = require("./special/bratvid");
                   const buf = await bratVid(t);
                   if (buf.length > 3_300_000) throw new Error("Hasil video terlalu besar untuk dikirim lewat API");
                   const data = `data:video/mp4;base64,${buf.toString("base64")}`;
                   return { status: true, result: { title: "Brat Video", thumbnail: "", type: "video", video: data, downloads: [{ type: "video", quality: "MP4", url: data, filename: "brat.mp4" }] } };
                 } },
  webtozip:    { kind: "custom", needsUrl: true, run: async ({ url }) => {
                   const { copySite } = require("./special/webtozip");
                   const r = await copySite(url);
                   return { status: true, result: { title: "Website berhasil di-copy", thumbnail: "", type: "file", fields: { "File disalin": String(r.copiedFilesAmount) }, downloads: [{ type: "zip", quality: "Download ZIP", url: r.download }] } };
                 } },
};

module.exports = { tools };
