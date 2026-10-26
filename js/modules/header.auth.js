/**
 * Fichier : header.auth.js
 * Rôle : gère l’inscription, la connexion et la récupération de mot de passe.
 */

// === ABONNEMENT : le chemin le plus court ===
// "S'abonner" (prices page, homepage plans) opens the sign-up form at once; the account is
// logged in right after sign-up and the chosen plan goes straight on to payment.
const PENDING_PLAN = "dissipl_pending_plan";
const PLAN_ROLE = { parent: "user", teacher: "professeur" };

function rememberPlan(plan, billing) {
  try { sessionStorage.setItem(PENDING_PLAN, JSON.stringify({ plan, billing: billing || "monthly" })); } catch (e) {}
}

function pendingPlan() {
  try { return JSON.parse(sessionStorage.getItem(PENDING_PLAN) || "null"); } catch (e) { return null; }
}

// once logged in: the prices page starts the payment of the remembered plan
function continueAfterAuth() {
  const onPrice = /\/price(\.html)?$/.test(location.pathname);
  if (pendingPlan() && !onPrice) window.location.href = "/dissipl-preview/price";
  else window.location.reload();
}

export function startSubscription(plan, billing) {
  rememberPlan(plan, billing);
  const role = document.getElementById("signupRole");
  if (role && PLAN_ROLE[plan]) role.value = PLAN_ROLE[plan];
  const note = document.getElementById("signupPlanNote");
  if (note) note.style.display = "block";
  if (window.jQuery && document.getElementById("signupModal")) {
    const open = document.querySelector(".modal.show");
    switchModal(open ? "#" + open.id : null, "#signupModal");
  } else {
    window.location.href = "/dissipl-preview/price";
  }
}

// === INSCRIPTION ===
export function setupSignupForm() {
  window.dissiplStartSubscription = startSubscription;
  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.signupEmail.value.trim().toLowerCase();
    const password = form.signupPassword.value;
    const confirmPassword = form.signupConfirmPassword.value;
    const role = form.signupRole.value;
    const acceptCGU = form.acceptCGU.checked;
    const errorBox = document.getElementById("signupError");

    if (errorBox) {
      errorBox.style.display = "none";
      errorBox.innerText = "";
    }

    if (!email || !password || !confirmPassword || !role || !acceptCGU) {
      return showError(
        errorBox,
        "⚠ Tous les champs doivent être remplis et les CGU acceptées."
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showError(errorBox, "⚠ Veuillez entrer un email valide.");
    }
    if (password.length < 8) {
      return showError(
        errorBox,
        "⚠ Le mot de passe doit contenir au moins 8 caractères."
      );
    }
    if (password !== confirmPassword) {
      return showError(errorBox, "⚠ Les mots de passe ne correspondent pas.");
    }

    const btn = form.querySelector("button[type='submit']");
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Création en cours...";
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, acceptCGU }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.error || "Erreur lors de l'inscription.");

      // log the new account in at once (no second form to fill in)
      const login = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifiant: email, password }),
      }).catch(() => null);
      if (login && login.ok) {
        if (btn) btn.innerText = "Connexion...";
        continueAfterAuth();
        return;
      }
      // fallback: the login window, email already filled in
      const loginId = document.getElementById("loginIdentifiant");
      if (loginId) loginId.value = email;
      switchModal("#signupModal", "#loginModal");
    } catch (err) {
      showError(errorBox, err.message || "Erreur inconnue.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = "S'inscrire";
      }
    }
  });
}

// === CONNEXION ===
export function setupLoginForm() {
  // "Créer un compte" / "Connexion" links that swap the login and sign-up windows
  document.querySelectorAll("[data-auth-switch]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const from = link.closest(".modal");
      switchModal(from ? "#" + from.id : null, link.getAttribute("data-auth-switch"));
    });
  });

  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const identifiant = form.loginIdentifiant.value.trim();
    const password = form.loginPassword.value;
    const errorBox = document.getElementById("loginError");

    if (errorBox) {
      errorBox.style.display = "none";
      errorBox.textContent = "";
    }

    if (!identifiant || !password) {
      return showError(errorBox, "⚠ Identifiant et mot de passe requis.");
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifiant, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue.");

      continueAfterAuth();
    } catch (err) {
      showError(errorBox, err.message || "Erreur lors de la connexion.");
    }
  });
}

// === MOT DE PASSE OUBLIÉ ===
export function setupForgotPasswordForm() {
  const forgotButton = document.getElementById("forgotPasswordButton");
  const forgotModal = document.getElementById("forgotPasswordModal");
  const loginModal = document.getElementById("loginModal");

  if (forgotButton) {
    forgotButton.addEventListener("click", () => {
      if (window.jQuery) {
        if (loginModal && loginModal.classList.contains("show")) {
          $("#loginModal").modal("hide");
          $(loginModal).on("hidden.bs.modal", function () {
            $("#forgotPasswordModal").modal("show");
            document.getElementById("forgotPasswordEmail")?.focus();
          });
        } else {
          $("#forgotPasswordModal").modal("show");
          document.getElementById("forgotPasswordEmail")?.focus();
        }
      }
    });
  }

  const form = document.getElementById("forgotPasswordForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.forgotPasswordEmail.value.trim();
    const errorBox = document.getElementById("forgotPasswordError");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showError(errorBox, "❌ Adresse email invalide.");
    }

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      alert(data.message || "✅ Si un compte existe, un email a été envoyé.");
      $("#forgotPasswordModal").modal("hide");
    } catch (err) {
      showError(errorBox, "❌ Une erreur est survenue.");
    }
  });
}

// closes one window, then opens the other (Bootstrap needs the first one fully closed)
function switchModal(fromSel, toSel) {
  if (!window.jQuery) return;
  const from = fromSel ? $(fromSel) : null;
  if (from && from.hasClass("show")) {
    from.one("hidden.bs.modal", () => $(toSel).modal("show"));
    from.modal("hide");
  } else {
    $(toSel).modal("show");
  }
}

function showError(el, msg) {
  if (!el) return;
  el.style.display = "block";
  el.textContent = msg;
}
