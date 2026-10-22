/**
 * Fichier : student-profile.js
 * Rôle : Point d'entrée pour la page profil élève
 */

import { fetchStudentProfile, updateStudentProfile } from "/dissipl-preview/modules/student.profile.js";

/**
 * Initialise la page profil élève
 */
async function initStudentProfile() {
  console.log("🎓 Initialisation du profil élève...");

  try {
    // This page is served without server-side auth (CDN-safe), so verify the
    // student session client-side first
    const session = await fetch("/api/session/status", { credentials: "include" }).then((r) => r.json());
    if (!session.authenticated || !session.user || session.user.role !== "student") {
      window.location.href = "/dissipl-preview/?login_required=true";
      return;
    }

    const data = await fetchStudentProfile();
    if (data) {
      updateStudentProfile(data);
      console.log("✅ Profil élève chargé avec succès");
    }
  } catch (error) {
    console.error("❌ Erreur lors du chargement du profil élève:", error);
    // Afficher un message d'erreur à l'utilisateur
    showError("Une erreur est survenue lors du chargement de vos informations. Veuillez réessayer plus tard.");
  }
}

/**
 * Affiche un message d'erreur à l'utilisateur
 */
function showError(message) {
  // Créer ou mettre à jour une alerte d'erreur
  let alertElement = document.getElementById("studentProfileError");
  if (!alertElement) {
    alertElement = document.createElement("div");
    alertElement.id = "studentProfileError";
    alertElement.className = "alert alert-danger";
    const pageContent = document.querySelector(".page-content");
    if (pageContent) {
      pageContent.insertBefore(alertElement, pageContent.firstChild);
    }
  }
  alertElement.textContent = message;
  alertElement.style.display = "block";
}

// Initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", initStudentProfile);
