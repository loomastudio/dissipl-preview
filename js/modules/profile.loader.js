// profile.loader.js
/**
 * Rôle: orchestre le chargement de la session, la mise à jour UI
 * et l’initialisation des sous-modules.
 */

import { fetchSession } from "./profile.session.js";
import { updateProfile } from "./profile.ui.js";
import { setupStudents } from "./profile.students.js";
import { setupAccountForms } from "./profile.account.js";
import { setupBilling } from "./profile.billing.js";
import { setupDirector } from "./profile.director.js";
import { setupSubscriptionButtons } from "./profile.subscription.js";
import { log, warn } from "./profile.utils.js";

export async function initProfile() {
  log("profile.loader init");

  try {
    const data = await fetchSession();

    if (!data.authenticated) {
      alert("Vous devez être connecté pour accéder à cette page.");
      window.location.href = "index.html";
      return;
    }

    if (data.isStudent) {
      // Redirect students to their specific profile page
      window.location.href = "/dissipl-preview/student-profile";
      return;
    }

    const user = data.user;
    updateProfile(user);

    // Initialiser les sous-modules et leurs écouteurs
    setupStudents();
    setupAccountForms();
    setupBilling();
    setupSubscriptionButtons();

    // Only setup director module for directeur role
    if (user.role === "directeur") {
      setupDirector();
    }
  } catch (err) {
    warn("Utilisateur déconnecté ou erreur session:", err);
    alert("Vous devez être connecté pour accéder à cette page.");
    window.location.href = "index.html";
  }
}
