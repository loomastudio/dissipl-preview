/**
 * Fichier : i18n.js
 * Rôle : traduction du site (9 langues, comme les outils).
 *
 * - Le texte français reste dans le HTML : c'est la langue par défaut.
 * - Les autres langues sont dans /i18n/<code>.json (mêmes clés que fr.json).
 * - Balisage :
 *     data-i18n="cle"               → remplace le texte
 *     data-i18n-html="cle"          → remplace le HTML (textes de confiance uniquement)
 *     data-i18n-attr="placeholder:cle;aria-label:cle2"
 * - Le choix est mémorisé (localStorage) ; sinon la langue du navigateur.
 * - Événement "dissipl:lang" sur window après chaque changement.
 *
 * Pages sans balisage : /i18n/pages/<code>.json associe chaque phrase française du site
 * à sa traduction. Les textes, placeholders, titres, boutons et messages (alert/confirm)
 * sont traduits automatiquement, y compris ce que les scripts ajoutent plus tard.
 * Ne jamais traduire un élément : attribut translate="no".
 */

const I18N_VERSION = "20261023d"; // change cette valeur quand un fichier /i18n/*.json change
const STORE_KEY = "dissipl-lang";

export const LANGS = [
  { code: "fr", name: "Français", hello: "Bonjour" },
  { code: "en", name: "English", hello: "Hello" },
  { code: "de", name: "Deutsch", hello: "Hallo" },
  { code: "es", name: "Español", hello: "Hola" },
  { code: "it", name: "Italiano", hello: "Ciao" },
  { code: "pt", name: "Português", hello: "Olá" },
  { code: "ar", name: "العربية", hello: "مرحبا", dir: "rtl" },
  { code: "hi", name: "हिन्दी", hello: "नमस्ते" },
  { code: "zh", name: "中文", hello: "你好" },
];

// Polices pour les écritures que Fredoka / Lexend ne couvrent pas
const SCRIPT_FONTS = {
  ar: "Noto+Sans+Arabic:wght@400;500;600;700",
  hi: "Noto+Sans+Devanagari:wght@400;500;600;700",
  zh: "Noto+Sans+SC:wght@400;500;700",
};

const cache = {};
const phraseCache = {};
let dict = {};
let phrases = {};
let prefixKeys = [];
let current = "fr";

// Texte d'origine (français) de chaque nœud / attribut, et la valeur que nous avons posée
const ORIG_TEXT = new WeakMap();
const SET_TEXT = new WeakMap();
const ORIG_ATTR = new WeakMap();
const SKIP = 'script,style,noscript,textarea,code,pre,svg,[data-i18n],[data-i18n-html],[translate="no"]';
const ATTRS = ["placeholder", "title", "alt", "aria-label"];

function storedLang() {
  try { return localStorage.getItem(STORE_KEY); } catch { return null; }
}

function detectLang() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  const candidates = [fromUrl, storedLang(), ...(navigator.languages || [navigator.language])];
  for (const c of candidates) {
    if (!c) continue;
    const code = c.toLowerCase().slice(0, 2);
    if (LANGS.some((l) => l.code === code)) return code;
  }
  return "fr";
}

async function loadDict(code) {
  if (code === "fr") return {};
  if (cache[code]) return cache[code];
  const res = await fetch(`/dissipl-preview/i18n/${code}.json?v=${I18N_VERSION}`);
  if (!res.ok) throw new Error(`i18n ${code}: HTTP ${res.status}`);
  cache[code] = await res.json();
  return cache[code];
}

function loadScriptFont(code) {
  const fam = SCRIPT_FONTS[code];
  if (!fam || document.getElementById(`font-${code}`)) return;
  const link = document.createElement("link");
  link.id = `font-${code}`;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${fam}&display=swap`;
  document.head.appendChild(link);
}

async function loadPhrases(code) {
  if (code === "fr") return {};
  if (phraseCache[code]) return phraseCache[code];
  try {
    const res = await fetch(`/dissipl-preview/i18n/pages/${code}.json?v=${I18N_VERSION}`);
    phraseCache[code] = res.ok ? await res.json() : {};
  } catch {
    phraseCache[code] = {};
  }
  return phraseCache[code];
}

const norm = (s) => s.replace(/\s+/g, " ").trim();

/** Traduit une phrase française du site (exacte, ou début de phrase suivi d'une valeur). */
export function translatePhrase(fr) {
  if (current === "fr" || typeof fr !== "string") return null;
  const key = norm(fr);
  if (!key) return null;
  if (phrases[key] != null) return phrases[key];
  if (key.length > 14) {
    for (const k of prefixKeys) {
      if (key.startsWith(k) && /^[\s:!.,?]/.test(key.slice(k.length))) return phrases[k] + key.slice(k.length);
    }
  }
  return null;
}

function translateTextNode(node) {
  const p = node.parentElement;
  if (!p || p.closest(SKIP)) return;
  // Le script de la page a peut-être changé ce texte depuis notre passage : c'est le nouveau français
  if (!ORIG_TEXT.has(node) || node.nodeValue !== SET_TEXT.get(node)) ORIG_TEXT.set(node, node.nodeValue);
  const orig = ORIG_TEXT.get(node);
  if (!/[A-Za-zÀ-ÿ]/.test(orig)) return;
  const tr = translatePhrase(orig);
  const value = tr == null ? orig : orig.match(/^\s*/)[0] + tr + orig.match(/\s*$/)[0];
  if (node.nodeValue !== value) node.nodeValue = value;
  SET_TEXT.set(node, value);
}

function translateAttrs(el) {
  if (el.closest(SKIP)) return;
  const own = (el.getAttribute("data-i18n-attr") || "").split(";").map((p) => p.split(":")[0].trim());
  const names = ATTRS.filter((a) => el.hasAttribute(a) && !own.includes(a));
  if (el.tagName === "INPUT" && /^(submit|button|reset)$/i.test(el.type)) names.push("value");
  if (!names.length) return;
  let store = ORIG_ATTR.get(el);
  if (!store) { store = {}; ORIG_ATTR.set(el, store); }
  names.forEach((a) => {
    const cur = a === "value" ? el.value : el.getAttribute(a);
    const rec = store[a];
    if (!rec || cur !== rec.set) store[a] = { orig: cur };
    const orig = store[a].orig;
    const tr = translatePhrase(orig);
    const value = tr == null ? orig : tr;
    if (a === "value") el.value = value; else if (cur !== value) el.setAttribute(a, value);
    store[a].set = value;
  });
}

/** Traduit tous les textes non balisés sous `root` (ou les remet en français). */
function translateTree(root) {
  if (root.nodeType === 3) { translateTextNode(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  const base = root.nodeType === 9 ? root.body : root;
  if (!base) return;
  const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) translateTextNode(n);
  if (base.matches) translateAttrs(base);
  base.querySelectorAll("[placeholder],[title],[alt],[aria-label],input[type=submit],input[type=button]").forEach(translateAttrs);
}

export function t(key, vars) {
  let s = dict[key];
  if (s == null) return null;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  return s;
}

/** Traduit tout ce qui est marqué sous `root` (le français d'origine est gardé pour revenir en arrière). */
export function apply(root = document) {
  const scope = root.querySelectorAll ? root : document;
  const nodes = [];
  if (scope.matches && scope.matches("[data-i18n],[data-i18n-html],[data-i18n-attr]")) nodes.push(scope);
  nodes.push(...scope.querySelectorAll("[data-i18n],[data-i18n-html],[data-i18n-attr]"));

  nodes.forEach((el) => {
    const k = el.getAttribute("data-i18n");
    if (k) {
      if (el.__i18nFr == null) el.__i18nFr = el.textContent;
      el.textContent = t(k) ?? el.__i18nFr;
    }
    const kh = el.getAttribute("data-i18n-html");
    if (kh) {
      if (el.__i18nFrHtml == null) el.__i18nFrHtml = el.innerHTML;
      el.innerHTML = t(kh) ?? el.__i18nFrHtml;
    }
    const ka = el.getAttribute("data-i18n-attr");
    if (ka) {
      el.__i18nFrAttr = el.__i18nFrAttr || {};
      ka.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s && s.trim());
        if (!attr || !key) return;
        if (!(attr in el.__i18nFrAttr)) el.__i18nFrAttr[attr] = el.getAttribute(attr);
        el.setAttribute(attr, t(key) ?? el.__i18nFrAttr[attr] ?? "");
      });
    }
  });
}

export async function setLang(code) {
  if (!LANGS.some((l) => l.code === code)) code = "fr";
  try {
    [dict, phrases] = await Promise.all([loadDict(code), loadPhrases(code)]);
  } catch (err) {
    console.error("❌ Traduction indisponible :", err);
    dict = {};
    phrases = {};
    code = "fr";
  }
  // Débuts de phrase (pour "Compte élève créé avec succès ! Username: bob4567")
  prefixKeys = Object.keys(phrases).filter((k) => k.length >= 12).sort((a, b) => b.length - a.length);
  current = code;
  try { localStorage.setItem(STORE_KEY, code); } catch { /* navigation privée */ }

  const meta = LANGS.find((l) => l.code === code);
  const html = document.documentElement;
  html.lang = code;
  html.dir = meta.dir || "ltr";
  loadScriptFont(code);

  if (html.__i18nTitle == null) html.__i18nTitle = document.title;
  // Seule la page d'accueil (data-i18n-title sur <html>) prend le titre du dictionnaire
  const ownTitle = html.hasAttribute("data-i18n-title") ? t("meta.title") : null;
  document.title = ownTitle ?? translatePhrase(html.__i18nTitle) ?? html.__i18nTitle;
  const desc = document.querySelector('meta[name="description"]:not([data-i18n-attr])');
  if (desc) {
    if (desc.__i18nFr == null) desc.__i18nFr = desc.content;
    desc.content = translatePhrase(desc.__i18nFr) ?? desc.__i18nFr;
  }

  apply(document);
  translateTree(document);
  window.dispatchEvent(new CustomEvent("dissipl:lang", { detail: { lang: code } }));
}

let started = false;
export function initI18n() {
  if (started) return window.DissiplI18n;
  started = true;

  window.DissiplI18n = {
    LANGS,
    t,
    apply,
    setLang,
    translatePhrase,
    get lang() { return current; },
  };

  // Messages des scripts (alert / confirm / prompt) dans la langue choisie
  const wrap = (name) => {
    const native = window[name].bind(window);
    window[name] = (msg, ...rest) => native(translatePhrase(msg) ?? msg, ...rest);
  };
  ["alert", "confirm", "prompt"].forEach(wrap);

  // Le header, le footer et les contenus créés par les scripts arrivent plus tard : on les traduit à l'arrivée.
  new MutationObserver((muts) => {
    if (current === "fr") return;
    muts.forEach((m) => {
      if (m.type === "characterData") {
        if (m.target.nodeValue !== SET_TEXT.get(m.target)) translateTextNode(m.target);
        return;
      }
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) { apply(n); translateTree(n); }
        else if (n.nodeType === 3) translateTextNode(n);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  const start = () => setLang(detectLang());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();

  return window.DissiplI18n;
}
