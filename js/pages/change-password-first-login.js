console.log("🟡 change-password-first-login.js chargé");

document
  .getElementById("changePwdForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document
      .getElementById("currentPassword")
      .value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    const errBox = document.getElementById("changePwdError");
    const okBox = document.getElementById("changePwdSuccess");

    errBox.style.display = "none";
    okBox.style.display = "none";

    if (!currentPassword || !newPassword || !confirmPassword) {
      errBox.textContent = "Tous les champs sont obligatoires.";
      errBox.style.display = "block";
      return;
    }

    if (newPassword !== confirmPassword) {
      errBox.textContent =
        "Les deux nouveaux mots de passe ne correspondent pas.";
      errBox.style.display = "block";
      return;
    }

    // ici on envoie vers TA route déjà existante :
    // /api/me/update-password ou /api/user/:id/update-password
    // tu avais déjà `/api/user/:userId/update-password` dans ton profile.js
    // mais ici on ne connait pas l'id → on fait une route spéciale "moi"
    try {
      const res = await fetch("/api/me/change-password-first-login", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        errBox.textContent =
          data.error || "Erreur lors du changement de mot de passe.";
        errBox.style.display = "block";
        return;
      }

      okBox.textContent = "Mot de passe changé. Vous allez être redirigé.";
      okBox.style.display = "block";

      // tu peux décider où aller
      setTimeout(() => {
        window.location.href = "/dissipl-preview/profile.html";
      }, 1200);
    } catch (err) {
      console.error(err);
      errBox.textContent = "Erreur réseau.";
      errBox.style.display = "block";
    }
  });
