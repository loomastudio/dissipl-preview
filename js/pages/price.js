// price.js
document.addEventListener("DOMContentLoaded", function () {
  async function checkAuthAndRedirect() {
    try {
      const res = await fetch("/api/session/status", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      // La route renvoie toujours 200 avec { authenticated: false } si non connecté
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();

      if (!data.authenticated || !data.user) {
        $("#authRequiredModal").modal("show");
        return;
      }

      // Forcer le changement de mot de passe si nécessaire
      if (data.user.must_change_password) {
        window.location.href = "change-password.html";
        return;
      }

      // Connecté -> accès aux abonnements
      window.location.href = "subscribe.html";
    } catch (e) {
      console.error("checkAuthAndRedirect error:", e);
      $("#authRequiredModal").modal("show");
    }
  }

  // Boutons qui déclenchent la vérif
  document
    .getElementById("subscribeBtn")
    ?.addEventListener("click", checkAuthAndRedirect);
  document
    .getElementById("subscribeClassic")
    ?.addEventListener("click", checkAuthAndRedirect);
  document
    .getElementById("subscribeProf")
    ?.addEventListener("click", checkAuthAndRedirect);

  // Gestion modales
  const authModal = $("#authRequiredModal");

  function openModalAfterAuthClose(targetModal) {
    authModal.modal("hide");
    authModal.on("hidden.bs.modal", function () {
      $(targetModal).modal("show");
      authModal.off("hidden.bs.modal");
    });
  }

  document
    .getElementById("openHeaderLogin")
    ?.addEventListener("click", function (event) {
      event.preventDefault();
      openModalAfterAuthClose("#loginModal");
    });

  document
    .getElementById("openHeaderRegister")
    ?.addEventListener("click", function (event) {
      event.preventDefault();
      openModalAfterAuthClose("#signupModal");
    });
});
