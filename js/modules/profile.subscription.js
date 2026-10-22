// profile.subscription.js
export function setupSubscriptionButtons() {
  document
    .getElementById("cancelSubscriptionBtn")
    ?.addEventListener("click", () => {
      if (!confirm("⚠️ Annuler le renouvellement automatique ?")) return;

      fetch("/api/payment/cancel-subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
        .then((r) => r.json())
        .then((data) => {
          console.log("cancel-subscription:", data);
          if (data.cancelled) {
            alert("✅ Abonnement annulé avec succès !");
            location.reload();
          } else if (data.error) {
            alert("❌ Erreur: " + data.error);
          } else {
            alert("📌 Réponse reçue: " + JSON.stringify(data));
          }
        })
        .catch((err) => {
          console.error("❌ cancel-subscription:", err);
          alert("Erreur lors de l'annulation: " + err.message);
        });
    });

  document
    .getElementById("renewSubscriptionBtn")
    ?.addEventListener("click", () => {
      if (!confirm("🔄 Réactiver le renouvellement automatique ?")) return;

      fetch("/api/payment/renew-subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
        .then((r) => r.json())
        .then((data) => {
          console.log("renew-subscription:", data);
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else if (data.error) {
            alert("❌ Erreur: " + data.error);
          } else {
            alert("📌 Réponse reçue: " + JSON.stringify(data));
          }
        })
        .catch((err) => {
          console.error("❌ renew-subscription:", err);
          alert("Erreur lors de la réactivation: " + err.message);
        });
    });
}
