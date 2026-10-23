// js/core/header.js

import { initI18n } from "/dissipl-preview/js/modules/i18n.js?v=20261023d";

// Traduction : démarre tout de suite (le français reste dans le HTML)
initI18n();

document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("🚀 Initialisation du header...");

    const mod = await import("/dissipl-preview/js/modules/header.loader.20260819-eyeicon.js?v=20261023b");

    if (!mod || typeof mod.initHeader !== "function") {
      console.error("❌ initHeader introuvable dans le loader", mod);
      return;
    }

    mod.initHeader();
  } catch (err) {
    console.error("❌ Erreur critique lors de l'initialisation du header :", err);
  }
});
