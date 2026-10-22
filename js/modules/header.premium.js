/**
 * Fichier : header.premium.js
 * Rôle : bloque l’accès aux pages premium si l’utilisateur n’est pas abonné.
 */

export function blockRedirectIfNotPremium() {
  console.log("🔍 Vérification premium en place...");

  document.querySelectorAll(".gp-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = link.getAttribute("href");

      fetch("/api/session/status", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.authenticated || !data.user)
            throw new Error("Non connecté");
          const u = data.user;

          if (u.role === "student" && !u.premium_active)
            throw new Error("Non Premium");
          if (u.role !== "student" && !u.premium_active)
            throw new Error("Non Premium");

          window.location.href = target;
        })
        .catch(() => {
          if (window.jQuery && $("#premiumRequiredModal").length) {
            $("#premiumRequiredModal").modal("show");
          } else {
            alert("Cette fonctionnalité est réservée aux comptes Premium.");
          }
        });
    });
  });

  console.log("✅ Events Premium attachés.");
}
