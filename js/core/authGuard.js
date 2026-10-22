// usage :
// <script src="/dissipl-preview/authGuard.js"></script>
// <script>
//   authGuard({ requireAdult: true, requirePremium: true });
// </script>

async function authGuard({
  requireAdult = false,
  requirePremium = false,
  requireDirector = false,
} = {}) {
  try {
    const res = await fetch("/api/session/status", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      // impossible de savoir -> on dégage
      window.location.href = "/dissipl-preview/html/index.html?error=connectez-vous";
      return;
    }

    const data = await res.json();

    // pas connecté
    if (!data.authenticated || !data.user) {
      window.location.href = "/dissipl-preview/html/index.html?error=connectez-vous";
      return;
    }

    const user = data.user;
    const role = user.role;

    // 1. élève ?
    if (role === "student") {
      // Si la page est réservée aux ADULTES (ou directeur), on bloque
      if (requireAdult || requireDirector) {
        window.location.href = "/dissipl-preview/index.html?error=acces-prof";
        return;
      }

      // Si la page est PREMIUM, on autorise l'élève SEULEMENT s'il est premium actif
      if (requirePremium && !user.premium_active) {
        window.location.href = "/dissipl-preview/index.html?error=premium";
        return;
      }

      // OK (élève autorisé)
      return;
    }

    // 2. adulte (directeur, professeur, admin, user)
    // si on veut un directeur
    if (requireDirector && role !== "directeur" && role !== "admin") {
      window.location.href = "/dissipl-preview/html/index.html?error=acces-directeur";
      return;
    }

    // si on veut juste "pas élève"
    if (requireAdult) {
      // on est déjà dans le cas adulte ici
    }

    // si on veut premium
    if (requirePremium && !user.premium_active) {
      window.location.href = "/dissipl-preview/html/index.html?error=premium";
      return;
    }

    // sinon ok
    return;
  } catch (err) {
    console.error("authGuard error:", err);
    window.location.href = "/dissipl-preview/html/index.html?error=connectez-vous";
  }
}
