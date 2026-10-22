/**
 * Fichier : student.profile.js
 * Rôle : Charge et affiche les informations de l'élève
 */

/**
 * Récupère les informations de l'élève depuis l'API
 */
export async function fetchStudentProfile() {
  try {
    const response = await fetch("/api/student/me", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Non authentifié ou pas un élève
        window.location.href = "/dissipl-preview/index.html";
        return null;
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Erreur récupération profil élève:", error);
    throw error;
  }
}

/**
 * Met à jour l'UI avec les informations de l'élève
 */
export function updateStudentProfile(data) {
  if (!data.success || !data.student) {
    console.error("❌ Données invalides reçues:", data);
    return;
  }

  const student = data.student;

  // Informations de l'élève
  document.getElementById("studentUsername").textContent = student.username || "Non renseigné";
  document.getElementById("studentName").textContent = student.name || "Non renseigné";
  document.getElementById("studentEmail").textContent = student.email || "Non renseigné";

  // Statut Premium
  const premiumStatus = document.getElementById("studentPremiumStatus");
  if (student.is_premium) {
    premiumStatus.textContent = "✅ Actif";
    premiumStatus.className = "badge badge-success";
  } else {
    premiumStatus.textContent = "❌ Inactif";
    premiumStatus.className = "badge badge-secondary";
  }

  // Date d'expiration
  document.getElementById("studentExpiryDate").textContent = student.expires_at
    ? formatDateExpiry(student.expires_at)
    : "Non renseigné";

  // Date de création
  const createdAt = student.created_at ? new Date(student.created_at) : null;
  document.getElementById("studentCreatedAt").textContent = createdAt
    ? formatDateLong(createdAt)
    : "Non renseigné";

  // Informations du professeur
  if (student.professor) {
    document.getElementById("professorName").textContent = student.professor.pseudo || "Non renseigné";
    document.getElementById("professorEmail").textContent = student.professor.email || "Non renseigné";
  }

  // Afficher le contenu approprié pour l'accès aux jeux
  const premiumActiveContent = document.getElementById("premiumActiveContent");
  const premiumInactiveContent = document.getElementById("premiumInactiveContent");

  if (student.is_premium) {
    premiumActiveContent.style.display = "block";
    premiumInactiveContent.style.display = "none";
  } else {
    premiumActiveContent.style.display = "none";
    premiumInactiveContent.style.display = "block";
  }
}

/**
 * Formate une date pour l'affichage (JJ/MM/AAAA)
 * Extrait la date directement de la chaîne ISO pour éviter les problèmes de fuseau horaire
 */
function formatDateExpiry(dateString) {
  // dateString format: "2026-09-10T23:59:59.000Z" or "2026-09-10"
  const datePart = dateString.split("T")[0]; // Get "2026-09-10"
  const [year, month, day] = datePart.split("-"); // Split by "-"
  return `${day}/${month}/${year}`; // Return as "10/09/2026"
}

/**
 * Formate une date longue (Jour Mois Année)
 */
function formatDateLong(date) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("fr-FR", options);
}
