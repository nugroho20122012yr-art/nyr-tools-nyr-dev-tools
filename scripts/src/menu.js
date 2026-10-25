(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const grid = $("#grid");
  if (grid) {
    const s = $("#s"), cards = [...grid.children], empty = $("#empty"); let cat = "all";
    const apply = () => {
      const q = s.value.trim().toLowerCase(); let n = 0;
      cards.forEach((c) => { const ok = (cat === "all" || c.dataset.cat === cat) && (!q || c.dataset.name.includes(q)); c.hidden = !ok; if (ok) n++; });
      empty.hidden = n > 0;
    };
    s.addEventListener("input", apply);
    document.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === b)); cat = b.dataset.cat; apply();
    }));
  }
})();
