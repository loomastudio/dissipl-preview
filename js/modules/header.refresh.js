/**
 * Fichier : header.refresh.js
 * Rôle : rafraîchit le token de session périodiquement (si activé côté backend).
 */

let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

export function initTokenRefresh() {
  const token = localStorage.getItem("accessToken");
  if (!token) return;
  console.log("🔄 Auto-refresh du token activé toutes les 20 minutes.");
  setInterval(refreshToken, 20 * 60 * 1000);
}

function refreshToken() {
  console.log(
    `🔄 Tentative de refresh token (${
      refreshAttempts + 1
    }/${MAX_REFRESH_ATTEMPTS})`
  );
  fetch("/api/refresh-token", { method: "POST", credentials: "include" })
    .then((r) => {
      if (!r.ok) throw new Error(`Erreur ${r.status}`);
      return r.json();
    })
    .then((data) => {
      if (!data.accessToken) throw new Error("Pas de accessToken");
      localStorage.setItem("accessToken", data.accessToken);
      refreshAttempts = 0;
      console.log("✅ Token rafraîchi.");
    })
    .catch((err) => {
      refreshAttempts++;
      console.error(
        `❌ Échec refresh (${refreshAttempts}/${MAX_REFRESH_ATTEMPTS})`,
        err
      );
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        alert("Votre session a expiré. Veuillez vous reconnecter.");
        localStorage.removeItem("accessToken");
        window.location.href = "/dissipl-preview/index.html";
      }
    });
}
