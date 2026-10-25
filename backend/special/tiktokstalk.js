// Port dari tiktokstalker (CLI) -> fungsi yang bisa dipanggil API
const axios = require("axios");
const fmt = (n) => (n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n));

async function tiktokStalk(username) {
  const u = String(username || "").replace("@", "").trim();
  if (!/^[A-Za-z0-9._]{1,40}$/.test(u)) throw new Error("Username tidak valid");
  const res = await axios.get(`https://www.tiktok.com/@${u}`, {
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    maxRedirects: 5,
    validateStatus: (s) => s < 500,
  });
  if (res.status === 404) throw new Error("User tidak ditemukan");
  const m = String(res.data).match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/);
  if (!m) throw new Error("Gagal mengambil data profil (akun tidak ada atau TikTok memblokir request)");
  const info = JSON.parse(m[1])?.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo;
  if (!info?.user) throw new Error("User tidak ditemukan atau akun private");
  const { user, stats = {} } = info;
  return {
    status: true,
    result: {
      title: `${user.nickname || u} (@${user.uniqueId || u})`,
      thumbnail: user.avatarLarger || user.avatarMedium || "",
      type: "profile",
      fields: {
        Username: "@" + (user.uniqueId || u),
        Nickname: user.nickname || "-",
        Bio: user.signature || "-",
        Verified: user.verified ? "Ya" : "Tidak",
        Private: user.secret ? "Ya" : "Tidak",
        Region: user.region || "-",
        Followers: fmt(stats.followerCount || 0),
        Following: fmt(stats.followingCount || 0),
        Likes: fmt(stats.heartCount || 0),
        Video: fmt(stats.videoCount || 0),
        Dibuat: user.createTime ? new Date(user.createTime * 1000).toISOString().slice(0, 10) : "-",
      },
      downloads: [{ type: "link", quality: "Buka profil", url: `https://www.tiktok.com/@${user.uniqueId || u}` }],
    },
  };
}
module.exports = { tiktokStalk };
