// profile.account.js
import { getUserId, showError } from "./profile.utils.js";

export function setupAccountForms() {
  // Changement d'email
  document
    .getElementById("changeEmailButton")
    ?.addEventListener("click", () => {
      // nécessite Bootstrap et jQuery présents sur la page
      $("#changeEmailModal").modal("show");
    });

  document.getElementById("emailForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const newEmail = document.getElementById("newEmail").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }

    const userId = getUserId();
    fetch(`/api/user/${userId}/update-email`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.message === "Email mis à jour avec succès.") {
          alert("✅ Email mis à jour !");
          location.reload();
        } else {
          alert("❌ Erreur : " + (data.error || "Réponse inattendue"));
        }
      })
      .catch((err) => {
        console.error("❌ Changement email :", err);
        alert("Une erreur est survenue lors du changement d'email.");
      });
  });

  // Changement mot de passe
  const changePasswordForm = document.getElementById("changePasswordForm");
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const oldPassword = document.getElementById("oldPassword").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();
      const confirmPassword = document
        .getElementById("confirmPassword")
        .value.trim();

      const changePasswordError = document.getElementById(
        "changePasswordError"
      );
      if (changePasswordError) {
        changePasswordError.style.display = "none";
        changePasswordError.innerHTML = "";
      }

      if (!oldPassword || !newPassword || !confirmPassword) {
        if (changePasswordError) {
          changePasswordError.style.display = "block";
          changePasswordError.innerHTML = "⚠️ Remplissez tous les champs.";
        }
        return;
      }

      if (newPassword !== confirmPassword) {
        if (changePasswordError) {
          changePasswordError.style.display = "block";
          changePasswordError.innerHTML =
            "⚠️ Les mots de passe ne correspondent pas.";
        }
        return;
      }

      const userId = getUserId();
      fetch(`/api/user/${userId}/update-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.message === "Mot de passe mis à jour avec succès.") {
            alert("✅ Mot de passe mis à jour !");
          } else {
            if (changePasswordError) {
              changePasswordError.style.display = "block";
              changePasswordError.innerHTML = data.error || "Erreur inconnue.";
            } else {
              alert("❌ " + (data.error || "Erreur inconnue."));
            }
          }
        })
        .catch((error) => {
          console.error("❌ Erreur changement de mot de passe :", error);
          if (changePasswordError) {
            changePasswordError.style.display = "block";
            changePasswordError.innerHTML =
              "Une erreur est survenue lors du changement de mot de passe.";
          } else {
            alert("Une erreur est survenue.");
          }
        });
    });
  }

  // Suppression du compte
  document.getElementById("deleteAccountBtn")?.addEventListener("click", () => {
    const password = prompt(
      "🛑 Entrez votre mot de passe pour confirmer la suppression :"
    );
    if (!password) {
      alert("Suppression annulée.");
      return;
    }

    fetch(`/api/user/${getUserId()}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          alert("✅ Votre compte a été supprimé.");
          window.location.href = "index.html";
        } else {
          alert("❌ Erreur : " + (data.error || "Réponse inattendue"));
        }
      })
      .catch((error) => {
        console.error("❌ Erreur suppression compte :", error);
        alert("Une erreur est survenue.");
      });
  });
}
