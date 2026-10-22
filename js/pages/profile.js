// profile.js
import { initProfile } from "/dissipl-preview/modules/profile.loader.js";

// Exécution une fois le DOM chargé
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("🚀 Initialisation du profil...");
    initProfile();
  } catch (err) {
    console.error(
      "❌ Erreur critique lors de l'initialisation du profil :",
      err
    );
  }
});
