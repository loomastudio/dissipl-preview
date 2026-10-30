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
} from "./header.auth.js?v=20261030a";
import { attachLogoutEvent, checkAuthStatus } from "./header.nav.js?v=20261022-nav";
import { blockRedirectIfNotPremium } from "./header.premium.js";
import { initTokenRefresh } from "./header.refresh.js";
import { initHeaderFx } from "./header.fx.js?v=20261023b";

const HEADER_HTML_VERSION = "20261029-gramm"; // change cette valeur quand tu modifies headerTest2.html

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
    // Show crossed eye icon (eye-off) - cleaner design
    eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a11.64 11.64 0 0 1 5.94-3.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a11.64 11.64 0 0 0-5.94-3.06M3 3l3.69 3.69M20.49 20.49l-3.69-3.69"></path>';
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

      // Exposer les fonctions globales requises par onclick="..."
      // (le header est injecté dynamiquement, ces fonctions doivent exister
      //  sinon le menu mobile ne s'ouvre pas du tout sur smartphone)
      if (typeof window.toggleMobileMenu !== "function") {
        window.toggleMobileMenu = function toggleMobileMenu() {
          const btn = document.querySelector(".mobile-menu-toggle");
          const nav = document.getElementById("mainNav");
          if (!btn || !nav) return;

          const open = !nav.classList.contains("mobile-open");
          nav.classList.toggle("mobile-open", open);
          btn.classList.toggle("is-active", open);
          btn.setAttribute("aria-expanded", open ? "true" : "false");
          document.body.classList.toggle("mobile-menu-active", open);

          if (!open) {
            nav
              .querySelectorAll(".nav-item-dropdown.sub-open")
              .forEach((li) => li.classList.remove("sub-open"));
          }
        };
      }

      if (typeof window.toggleSubMenu !== "function") {
        window.toggleSubMenu = function toggleSubMenu(anchorEl) {
          const nav = document.getElementById("mainNav");
          const li = anchorEl?.closest?.(".nav-item-dropdown");
          if (!nav || !li) return;

          // Ferme les autres dropdowns (comportement accordéon sur mobile)
          nav.querySelectorAll(".nav-item-dropdown.sub-open").forEach((other) => {
            if (other !== li) other.classList.remove("sub-open");
          });

          li.classList.toggle("sub-open");
        };
      }

      // Réinitialiser les triggers Bootstrap après injection du header
      // (nécessaire car le header est chargé dynamiquement)
      if (typeof window.$ !== "undefined") {
        window
          .$("#header-placeholder [data-toggle=\"modal\"]")
          .each(function () {
            const $trigger = window.$(this);
            const target = $trigger.attr("data-target");
            $trigger.off("click").on("click", function (e) {
              e.preventDefault();
              if (target) window.$(target).modal("show");
            });
          });
      }

      // Menu animé, sélecteur de langue, menu mobile
      initHeaderFx(headerPlaceholder);

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
