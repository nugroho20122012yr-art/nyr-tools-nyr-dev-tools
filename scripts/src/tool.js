(() => {
  const T0 = Date.now();
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const safeUrl = (u) => /^(https?:\/\/|data:(image|video|audio)\/)/i.test(String(u || "")) ? u : "";

  const main = $("main[data-tool]"); if (!main) return;
  const tool = main.dataset.tool, kind = main.dataset.kind, out = $("#out"), form = $("#f"), go = $("#go");

  const readImage = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error("Gagal membaca file")); r.readAsDataURL(file); });

  async function payload() {
    const v = (id) => ($("#" + id) ? $("#" + id).value.trim() : "");
    if (kind === "url") return { url: v("q"), format: v("format") || undefined, provider: v("provider") || "auto" };
    if (kind === "username") return { username: v("q") };
    if (kind === "image") {
      const f = $("#img").files[0]; if (!f) throw new Error("Pilih gambar dulu");
      if (f.size > 3 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 3MB");
      return { image: await readImage(f), mode: v("mode"), scale: v("scale") };
    }
    if (tool === "emojimix") return { emoji: v("q") };
    if (tool === "brat") return { text: v("q") };
    return { query: v("q"), quality: v("quality") || undefined };
  }

  function fail(msg, detail) {
    out.replaceChildren(); const c = el("div", "card err"); c.append(el("b", "", "❌ Gagal: "), document.createTextNode(msg));
    if (detail && detail.length) { const p = el("p", "meta", detail.join(" · ")); c.append(p); }
    out.append(c);
  }

  function render(d) {
    const r = d.result || d.data || {}; out.replaceChildren();
    const c = el("div", "card res");
    const media = el("div");
    if (r.video && safeUrl(r.video)) { const v = el("video"); v.controls = true; v.src = r.video; media.append(v); }
    else if (safeUrl(r.thumbnail)) { const i = el("img"); i.alt = "Preview"; i.referrerPolicy = "no-referrer"; i.src = r.thumbnail; media.append(i); }
    const info = el("div");
    info.append(el("h2", "", r.title || "Hasil"));
    const who = r.author && (r.author.name || r.author.username || (typeof r.author === "string" ? r.author : ""));
    const bits = [r.type, who, d.provider && "via " + d.provider].filter(Boolean);
    if (bits.length) info.append(el("p", "meta", bits.join(" · ")));
    if (r.fields) { const t = el("table", "kv"); Object.entries(r.fields).forEach(([k, val]) => { const tr = el("tr"); tr.append(el("td", "", k), el("td", "", val)); t.append(tr); }); info.append(t); }
    const list = Array.isArray(r.downloads) ? r.downloads : [];
    list.forEach((x, i) => {
      const u = safeUrl(x.url || x.link); if (!u) return;
      const a = el("a", "btn dl", "📥 " + ([x.type, x.quality || x.label].filter(Boolean).join(" ") || "Download " + (i + 1)));
      a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer";
      if (u.startsWith("data:")) a.download = x.filename || "hasil"; info.append(a);
    });
    if (!list.length && !r.fields) info.append(el("p", "meta", "Tidak ada link download di hasil. Coba link lain."));
    c.append(media, info); out.append(c);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); go.disabled = true; out.replaceChildren(el("div", "card load", "Sedang memproses"));
    try {
      const body = await payload();
      const res = await fetch("/api/" + tool, { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "nyr-tools" }, body: JSON.stringify(Object.assign(body, { _hp: ($("#hp-field") || {}).value || "", _t: Date.now() - T0 })) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || d.status === false) return fail(d.message || "Terjadi kesalahan (" + res.status + ")", d.detail);
      render(d);
    } catch (err) { fail(err.message || "Koneksi bermasalah"); }
    finally { go.disabled = false; }
  });
})();
