/**
 * Fichier : header.auth.js
 * Rôle : gère l’inscription, la connexion et la récupération de mot de passe.
 */

// === INSCRIPTION ===
export function setupSignupForm() {
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

      alert("✅ Inscription réussie ! Vous pouvez maintenant vous connecter.");
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

      window.location.reload();
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

function showError(el, msg) {
  if (!el) return;
  el.style.display = "block";
  el.textContent = msg;
}
