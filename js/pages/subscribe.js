document.addEventListener("DOMContentLoaded", async () => {
  const subscriptionInfo = document.getElementById("subscription-info");
  const subscriptionCard = document.getElementById("subscription-card");
  const subscriptionContainer = document.getElementById(
    "subscriptionContainer"
  );
  const subscriptionHeader = document.getElementById("subscriptionHeader");
  const subscriptionTitle = document.getElementById("subscriptionTitle");
  const subscriptionType = document.getElementById("subscriptionType");
  const subscriptionPrice = document.getElementById("subscriptionPrice");
  const subscribeBtn = document.getElementById("subscribe-btn");

  // Récupération du plan demandé depuis price.html
  const params = new URLSearchParams(location.search);
  const planParam = (params.get("plan") || "").toLowerCase(); // "prof" | "classic" | "discover"

  try {
    const res = await fetch("/api/session/status", {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Erreur serveur");
    const data = await res.json();

    if (!data.authenticated || !data.user) {
      // Au lieu de renvoyer vers index.html, on affiche un message clair
      subscriptionInfo.innerHTML =
        "<p class='text-danger'>Veuillez vous inscrire pour vous abonner.</p>";
      return;
    }

    const user = data.user;

    if (user.must_change_password) {
      window.location.href = "change-password.html";
      return;
    }

    // Normalisation du rôle
    const role = String(user.role || "").toLowerCase(); // "professeur", "directeur", "user", etc.
    const isProfessor = role === "professeur";

    // Choix du plan final:
    // - si plan=prof et que l'utilisateur n'est pas professeur, on bloque proprement
    // - sinon on retombe sur classic par défaut
    let plan = "classic";
    if (planParam === "prof") {
      if (!isProfessor) {
        subscriptionInfo.classList.remove("d-none");
        subscriptionInfo.innerHTML =
          "<p class='text-warning'>Cet abonnement est réservé aux comptes Professeur. Vous êtes connecté en rôle: <strong>" +
          role +
          "</strong>. Retournez aux offres et choisissez Premium Classique.</p>";
        return;
      }
      plan = "prof";
    } else if (planParam === "classic" || planParam === "discover") {
      plan = "classic";
    } else {
      // si quelqu'un arrive sans paramètre, on choisit en fonction du rôle
      plan = isProfessor ? "prof" : "classic";
    }

    // Config d’affichage
    const ui =
      plan === "prof"
        ? {
            title: "🎓 Abonnement Professeur",
            priceText: "2,99€",
            headerClasses: ["bg-warning", "text-dark"],
            borderClasses: ["border-warning"],
            btnClass: "btn-warning",
            productId: "prod_Rqrt7VHQuEp3Td", // tes IDs existants
          }
        : {
            title: "🌟 Abonnement Classique",
            priceText: "0,99€",
            headerClasses: ["bg-success", "text-white"],
            borderClasses: ["border-success"],
            btnClass: "btn-success",
            productId: "prod_RqrrGg17NxdTq3",
          };

    // Mise à jour UI
    subscriptionInfo.classList.add("d-none");
    subscriptionCard.classList.remove("d-none");
    ui.headerClasses.forEach((c) => subscriptionHeader.classList.add(c));
    ui.borderClasses.forEach((c) => subscriptionContainer.classList.add(c));
    subscriptionTitle.textContent = ui.title;
    subscriptionType.textContent = ui.title;
    subscriptionPrice.textContent = ui.priceText;
    subscribeBtn.classList.add(ui.btnClass);

    // Action du bouton: on envoie plan + role, ton backend décidera du price exact
    subscribeBtn.onclick = async () => {
      try {
        const sessionResponse = await fetch("/api/payment/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            plan, // "prof" | "classic"
            role, // "professeur" etc.
            // ajoute ici tout ce que ton backend attend, p.ex. productId si nécessaire:
            productId: ui.productId,
          }),
        });
        const sessionData = await sessionResponse.json();
        if (!sessionResponse.ok || sessionData.error) {
          alert("Erreur: " + (sessionData.error || "création de session"));
          return;
        }
        window.location.href = sessionData.checkoutUrl;
      } catch (err) {
        console.error("Erreur Checkout:", err);
        alert("Une erreur est survenue lors de la création du paiement.");
      }
    };
  } catch (error) {
    console.error("Erreur session:", error);
    subscriptionInfo.innerHTML =
      "<p class='text-danger'>Impossible de récupérer votre session.</p>";
  }
});
