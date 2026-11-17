// js/pages/assistant-widget.js
// Fenêtre de discussion de l'assistant pédagogique, en bas à droite de l'accueil.
// Le bouton est léger ; l'assistant (assistant.js + sa base de connaissances) ne se charge qu'à l'ouverture.
// Comme sur la page /assistant, tout reste dans le navigateur : rien n'est envoyé ni enregistré.

const VERSION = "20261118";
const base = new URL("/dissipl-preview/", import.meta.url).pathname;

const TXT = {
  fr: { short: "Assistant pédagogique", open: "Une question ? L'assistant pédagogique vous répond", title: "Assistant pédagogique DISSIPL", full: "Ouvrir en grand", close: "Fermer", placeholder: "Écrivez votre question…", send: "Envoyer", newChat: "Nouvelle conversation" },
  en: { short: "Teaching assistant", open: "A question? The teaching assistant answers", title: "DISSIPL teaching assistant", full: "Open full page", close: "Close", placeholder: "Type your question…", send: "Send", newChat: "New conversation" },
};
const lang = () => {
  let c = "fr";
  try { c = localStorage.getItem("dissipl-lang") || (navigator.language || "fr").slice(0, 2); } catch { /* navigation privée */ }
  return c === "fr" ? "fr" : "en";
};

const css = document.createElement("link");
css.rel = "stylesheet";
css.href = `${base}css/assistant.css?v=${VERSION}`;
document.head.appendChild(css);

const icon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>`;

const launch = document.createElement("button");
launch.type = "button";
launch.className = "asw-launch";
launch.setAttribute("aria-haspopup", "dialog");
document.body.appendChild(launch);

const panel = document.createElement("section");
panel.className = "asw-panel";
panel.hidden = true;
panel.setAttribute("role", "dialog");
panel.setAttribute("translate", "no");
panel.innerHTML = `
  <div class="asw-head">${icon}<strong></strong><a href="${base}assistant" class="asw-full"></a>
    <button type="button" class="asw-new" aria-label="">↺</button><button type="button" class="asw-close" aria-label="">✕</button></div>
  <div class="asw-log" aria-live="polite"><div class="asw-msgs"></div></div>
  <form class="asw-form" autocomplete="off"><textarea rows="1" maxlength="1500" aria-label="Question"></textarea><button type="submit"></button></form>`;
document.body.appendChild(panel);

function texts() {
  const t = TXT[lang()];
  launch.innerHTML = `<span class="asw-dot" aria-hidden="true"></span>${icon}<span class="asw-label">${t.short}</span>`;
  launch.setAttribute("aria-label", t.open);
  launch.title = t.open;
  panel.setAttribute("aria-label", t.title);
  panel.querySelector("strong").textContent = t.title;
  panel.querySelector(".asw-full").textContent = t.full;
  panel.querySelector(".asw-close").setAttribute("aria-label", t.close);
  panel.querySelector(".asw-close").title = t.close;
  panel.querySelector(".asw-new").setAttribute("aria-label", t.newChat);
  panel.querySelector(".asw-new").title = t.newChat;
  panel.querySelector("textarea").placeholder = t.placeholder;
  panel.querySelector(".asw-form button").textContent = t.send;
}
texts();
window.addEventListener("dissipl:lang", texts);

// sur mobile, l'accueil a une barre « Essayer gratuitement » en bas : le bouton passe au-dessus
const sticky = document.getElementById("stickyCta");
if (sticky) {
  const sync = () => launch.style.bottom = sticky.classList.contains("show") && getComputedStyle(sticky).display !== "none" ? (sticky.offsetHeight + 12) + "px" : "";
  new MutationObserver(sync).observe(sticky, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", sync);
}

let api = null;
async function open() {
  launch.hidden = true;
  panel.hidden = false;
  const box = panel.querySelector("textarea");
  if (!api) {
    const mod = await import(`./assistant.js?v=${VERSION}`);
    api = await mod.mount({
      log: panel.querySelector(".asw-msgs"),
      input: box,
      form: panel.querySelector(".asw-form"),
      compact: true,
      scrollBox: panel.querySelector(".asw-log"),
    });
    if (api) api.greet();
  }
  box.focus();
}
function close() {
  panel.hidden = true;
  launch.hidden = false;
  launch.focus();
}
launch.addEventListener("click", open);
panel.querySelector(".asw-close").addEventListener("click", close);
panel.querySelector(".asw-new").addEventListener("click", () => { if (api) { api.reset(); api.greet(); } });
panel.addEventListener("keydown", (ev) => { if (ev.key === "Escape") close(); });
