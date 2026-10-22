// js/modules/header.loader.js
/**
 * Fichier : header.loader.js
 * Rôle : charge /html/headerTest2.html dans le placeholder,
 * puis initialise les sous-modules (auth, nav, premium, refresh).
 */

import {
  setupSignupForm,
  setupLoginForm,
  setupForgotPasswordForm,
} from "./header.auth.js";
import { attachLogoutEvent, checkAuthStatus } from "./header.nav.js";
import { blockRedirectIfNotPremium } from "./header.premium.js";
import { initTokenRefresh } from "./header.refresh.js";

const HEADER_HTML_VERSION = "20250822-header-fix-v2"; // change cette valeur quand tu modifies headerTest2.html

// Password visibility toggle function (global scope)
window.togglePasswordVisibility = function(fieldId) {
  const passwordInput = document.getElementById(fieldId);
  if (!passwordInput) return;

  const wrapper = passwordInput.parentElement;
  const toggleBtn = wrapper.querySelector('.password-toggle-btn');
  if (!toggleBtn) return;

  const eyeIcon = toggleBtn.querySelector('svg');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    // Show crossed eye icon (eye-off)
    eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a11.64 11.64 0 0 1 5.94-3.06m1.64-1.64a11.64 11.64 0 0 0 5.94-3.06m-10.06 10.06L3 3m18 0l-3.69 3.69"></path>';
  } else {
    passwordInput.type = 'password';
    // Show normal eye icon
    eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
  }
};

console.log("✅ togglePasswordVisibility function registered globally");

export function initHeader() {
  console.log("✅ header.loader.js initialisé !");
  const headerPlaceholder = document.getElementById("header-placeholder");

  if (!headerPlaceholder) {
    console.error("❌ Élément #header-placeholder introuvable !");
    return;
  }

  // Charger le fragment HTML du header (versionné pour contourner le cache)
  fetch(`/dissipl-preview/html/headerTest2.html?v=${HEADER_HTML_VERSION}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      return response.text();
    })
    .then((data) => {
      headerPlaceholder.innerHTML = data;
      console.log("✅ /html/headerTest2.html injecté !");

      // Initialisation des sous-modules
      attachLogoutEvent();
      setupSignupForm();
      setupLoginForm();
      setupForgotPasswordForm();
      blockRedirectIfNotPremium();
      checkAuthStatus();
      initTokenRefresh();
    })
    .catch((error) =>
      console.error("❌ Erreur lors du chargement du header :", error)
    );
}
