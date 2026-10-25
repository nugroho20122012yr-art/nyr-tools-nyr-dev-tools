(() => {
  const make = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  document.querySelectorAll("select").forEach((native) => {
    const key = native.id || "sel" + Math.random().toString(36).slice(2, 7);
    const label = native.id ? document.querySelector('label[for="' + native.id + '"]') : null;
    const wrap = make("div", "sel");
    const btn = make("button", "sel-btn");
    const list = make("ul", "sel-list");
    let act = Math.max(0, native.selectedIndex);
    let typed = "", typedAt = 0;

    btn.type = "button";
    btn.id = key + "-btn";
    btn.disabled = native.disabled;
    btn.setAttribute("role", "combobox");
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", key + "-list");
    list.id = key + "-list";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    if (label) {
      label.id = label.id || key + "-label";
      btn.setAttribute("aria-labelledby", label.id);
      label.addEventListener("click", () => btn.focus());
    }

    const opts = [...native.options].map((o, i) => {
      const li = make("li", "sel-opt");
      li.id = key + "-o" + i;
      li.setAttribute("role", "option");
      li.textContent = o.textContent;
      list.append(li);
      return li;
    });

    const sync = () => {
      const cur = native.options[native.selectedIndex];
      btn.textContent = cur ? cur.textContent : "";
      opts.forEach((li, i) => li.setAttribute("aria-selected", String(i === native.selectedIndex)));
    };

    const setAct = (i) => {
      act = Math.max(0, Math.min(opts.length - 1, i));
      opts.forEach((li, k) => li.classList.toggle("act", k === act));
      btn.setAttribute("aria-activedescendant", opts[act].id);
      const el = opts[act];
      if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
      else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
    };

    const open = () => {
      if (!list.hidden || btn.disabled) return;
      const r = btn.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      wrap.classList.toggle("up", below < 270 && r.top > below);
      list.hidden = false;
      wrap.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      setAct(native.selectedIndex);
    };

    const close = () => {
      if (list.hidden) return;
      list.hidden = true;
      wrap.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.removeAttribute("aria-activedescendant");
    };

    const choose = (i) => {
      if (native.selectedIndex !== i) {
        native.selectedIndex = i;
        native.dispatchEvent(new Event("change", { bubbles: true }));
      }
      sync();
      close();
      btn.focus();
    };

    btn.addEventListener("click", () => (list.hidden ? open() : close()));

    btn.addEventListener("keydown", (e) => {
      const isOpen = !list.hidden;
      const k = e.key;
      if (k === "ArrowDown" || k === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) return open();
        setAct(act + (k === "ArrowDown" ? 1 : -1));
      } else if (k === "Home" && isOpen) { e.preventDefault(); setAct(0); }
      else if (k === "End" && isOpen) { e.preventDefault(); setAct(opts.length - 1); }
      else if ((k === "Enter" || k === " ") && isOpen) { e.preventDefault(); choose(act); }
      else if (k === "Escape" && isOpen) { e.preventDefault(); close(); }
      else if (k === "Tab") close();
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && k !== " ") {
        const now = Date.now();
        typed = now - typedAt > 700 ? k.toLowerCase() : typed + k.toLowerCase();
        typedAt = now;
        const from = typed.length === 1 ? act + 1 : act;
        const hit = opts.findIndex((li, i) => i >= from && li.textContent.toLowerCase().startsWith(typed));
        const any = hit !== -1 ? hit : opts.findIndex((li) => li.textContent.toLowerCase().startsWith(typed));
        if (any !== -1) { if (!isOpen) open(); setAct(any); }
      }
    });

    list.addEventListener("mousedown", (e) => e.preventDefault());
    list.addEventListener("mousemove", (e) => { const i = opts.indexOf(e.target.closest(".sel-opt")); if (i !== -1 && i !== act) setAct(i); });
    list.addEventListener("click", (e) => { const i = opts.indexOf(e.target.closest(".sel-opt")); if (i !== -1) choose(i); });
    document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(); });

    native.classList.add("sel-native");
    native.tabIndex = -1;
    native.setAttribute("aria-hidden", "true");
    native.parentNode.insertBefore(wrap, native);
    wrap.append(native, btn, list);
    sync();
  });
})();
