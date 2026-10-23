/**
 * Fichier : header.fx.js
 * Rôle : animations du header (surligneur glissant, panneaux, sélecteur de langue,
 * menu mobile, masquage au défilement).
 */

const TINTS = ["#E6F3EA", "#E5EDF9", "#FBE7E7", "#FBF2DC"];

/** Same tab icon on every page (older pages still link the previous logo). */
function useSiteIcons() {
  const set = (rel, href, type) => {
    let link = document.head.querySelector(`link[rel="${rel}"]`);
    if (!link) { link = document.createElement("link"); link.rel = rel; document.head.appendChild(link); }
    link.href = href;
    if (type) link.type = type;
  };
  set("icon", "/dissipl-preview/assets/images/favicon-32.png", "image/png");
  set("apple-touch-icon", "/dissipl-preview/assets/images/apple-touch-icon.png");
}

export function initHeaderFx(root = document) {
  useSiteIcons();
  const header = root.querySelector("#dxHeader");
  if (!header) return;

  const nav = header.querySelector("#mainNav");
  const list = header.querySelector(".dx-list");
  const glider = header.querySelector(".dx-glider");
  const burger = header.querySelector("#dxBurger");
  const lang = header.querySelector("#dxLang");
  const desktop = window.matchMedia("(min-width: 1101px)");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const topLinks = [...list.querySelectorAll(":scope > li > .dx-link")];

  /* --- Page active --- */
  const path = location.pathname.replace(/^\/dissipl-preview/, "").replace(/\/+$/, "") || "/";
  let active = null;
  topLinks.forEach((a) => {
    const matches = (a.dataset.match || "").split(",").map((s) => s.trim().replace(/\/+$/, "") || "/");
    if (matches.includes(path)) { a.classList.add("is-active"); active = a; }
  });

  /* --- Surligneur qui glisse sous le lien survolé --- */
  function glideTo(el) {
    if (!el || !desktop.matches) { glider.classList.remove("on"); return; }
    // Measure from the glider's own container (the nav), not the centred list
    const lb = glider.offsetParent.getBoundingClientRect(), b = el.getBoundingClientRect();
    glider.style.width = b.width + "px";
    glider.style.transform = `translateX(${b.left - lb.left}px)`;
    glider.classList.add("on");
  }
  topLinks.forEach((a) => {
    a.addEventListener("pointerenter", () => glideTo(a));
    a.addEventListener("focus", () => glideTo(a));
  });
  list.addEventListener("pointerleave", () => {
    if (!list.querySelector(".dx-has-panel.open")) glider.classList.remove("on");
  });

  /* --- Panneaux (Outils, Ressources) --- */
  const panels = [...list.querySelectorAll(".dx-has-panel")];
  function closePanels(except) {
    panels.forEach((li) => {
      if (li === except) return;
      li.classList.remove("open");
      li.querySelector(":scope > .dx-link").setAttribute("aria-expanded", "false");
    });
  }
  function openPanel(li, open) {
    closePanels(li);
    li.classList.toggle("open", open);
    li.querySelector(":scope > .dx-link").setAttribute("aria-expanded", open ? "true" : "false");
  }
  panels.forEach((li) => {
    const trigger = li.querySelector(":scope > .dx-link");
    let timer;
    trigger.addEventListener("click", () => openPanel(li, !li.classList.contains("open")));
    if (finePointer) {
      li.addEventListener("pointerenter", () => {
        if (!desktop.matches) return;
        clearTimeout(timer);
        timer = setTimeout(() => openPanel(li, true), 70);
      });
      li.addEventListener("pointerleave", () => {
        if (!desktop.matches) return;
        clearTimeout(timer);
        timer = setTimeout(() => { li.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); }, 220);
      });
    }
  });

  /* --- Sélecteur de langue --- */
  const langBtn = lang.querySelector(".dx-lang-btn");
  const langMenu = lang.querySelector(".dx-lang-menu");
  const langCode = lang.querySelector("#dxLangCode");
  const i18n = window.DissiplI18n;

  function setLangOpen(open) {
    lang.classList.toggle("open", open);
    langBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) (langMenu.querySelector('[aria-selected="true"]') || langMenu.querySelector("button"))?.focus();
  }
  function renderLangs() {
    if (!i18n) return;
    const cur = i18n.lang;
    langCode.textContent = cur.toUpperCase();
    langMenu.innerHTML = "";
    i18n.LANGS.forEach((l, idx) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dx-lang-opt";
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", l.code === cur ? "true" : "false");
      b.setAttribute("lang", l.code);
      if (l.dir) b.setAttribute("dir", l.dir);
      b.style.setProperty("--i", idx);
      b.style.setProperty("--t", TINTS[idx % TINTS.length]);
      const code = document.createElement("span"); code.className = "code"; code.textContent = l.code.toUpperCase();
      const name = document.createElement("span"); name.textContent = l.name;
      const hello = document.createElement("span"); hello.className = "hello"; hello.textContent = l.hello;
      b.append(code, name, hello);
      b.addEventListener("click", async () => {
        setLangOpen(false);
        await i18n.setLang(l.code);
        langBtn.focus();
      });
      li.appendChild(b);
      langMenu.appendChild(li);
    });
  }
  renderLangs();
  window.addEventListener("dissipl:lang", renderLangs);
  langBtn.addEventListener("click", () => setLangOpen(!lang.classList.contains("open")));
  langMenu.addEventListener("keydown", (e) => {
    const opts = [...langMenu.querySelectorAll("button")];
    const i = opts.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
  });

  /* --- Menu mobile (révélation circulaire depuis le bouton) --- */
  function setMobileOpen(open) {
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    const key = open ? "nav.close" : "nav.menu";
    burger.setAttribute("aria-label", (i18n && i18n.t(key)) || (open ? "Fermer le menu" : "Ouvrir le menu"));
    document.body.classList.toggle("dx-lock", open);
    header.classList.remove("is-hidden");
    if (!open) closePanels();
  }
  burger.addEventListener("click", () => setMobileOpen(!nav.classList.contains("open")));
  nav.querySelectorAll("a[href]").forEach((a) => a.addEventListener("click", () => {
    if (!desktop.matches) setMobileOpen(false);
  }));
  desktop.addEventListener("change", () => { setMobileOpen(false); glideTo(null); });

  /* --- Fermer au clic extérieur / Échap --- */
  document.addEventListener("click", (e) => {
    if (!lang.contains(e.target)) setLangOpen(false);
    if (desktop.matches && !list.contains(e.target)) closePanels();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (lang.classList.contains("open")) { setLangOpen(false); langBtn.focus(); }
    closePanels();
    if (nav.classList.contains("open")) { setMobileOpen(false); burger.focus(); }
  });

  /* --- Défilement : header compact, caché en descendant, visible en remontant --- */
  let lastY = window.scrollY, ticking = false;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 12);
    const busy = nav.classList.contains("open") || lang.classList.contains("open") || list.querySelector(".dx-has-panel.open");
    if (!busy && desktop.matches && y > 240 && y > lastY + 4) header.classList.add("is-hidden");
    else if (y < lastY - 4 || y < 240) header.classList.remove("is-hidden");
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* --- /?login_required=true : ouvre directement la connexion --- */
  if (new URLSearchParams(location.search).get("login_required") && window.$) {
    setTimeout(() => window.$("#loginModal").modal("show"), 300);
  }
}
