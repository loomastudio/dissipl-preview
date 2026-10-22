/**
 * Fichier : header.nav.js
 * Rôle : gestion du menu, affichage des boutons selon rôle,
 * vérification de session et déconnexion.
 */

export function attachLogoutEvent() {
  const btnAdult = document.getElementById("logoutButton");
  const btnStudent = document.getElementById("logoutStudentButton");
  const btnMobile = document.getElementById("mobileLogoutBtn");

  btnAdult?.addEventListener("click", handleLogout);
  btnStudent?.addEventListener("click", handleLogout);
  btnMobile?.addEventListener("click", handleLogout);
}

// === Vérifie l’état de session ===
export async function checkAuthStatus() {
  try {
    const res = await fetch("/api/session/status", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return updateNavUI(false, null);
    const data = await res.json();

    if (!data.authenticated || !data.user) return updateNavUI(false, null);
    const user = data.user;

    if (
      user.must_change_password &&
      !window.location.pathname.includes("change-password.html")
    ) {
      window.location.href = "/dissipl-preview/change-password.html";
      return;
    }

    updateNavUI(true, user);
  } catch {
    updateNavUI(false, null);
  }
}

// Libellés des rôles dans les 9 langues du site
const ROLE_LABELS = {
  fr: { directeur: "Directeur", professeur: "Professeur", admin: "Admin", user: "Parent", student: "Élève" },
  en: { directeur: "Principal", professeur: "Teacher", admin: "Admin", user: "Parent", student: "Student" },
  de: { directeur: "Schulleitung", professeur: "Lehrkraft", admin: "Admin", user: "Eltern", student: "Schüler/in" },
  es: { directeur: "Director/a", professeur: "Docente", admin: "Admin", user: "Familia", student: "Alumno/a" },
  it: { directeur: "Dirigente", professeur: "Docente", admin: "Admin", user: "Genitore", student: "Studente" },
  pt: { directeur: "Diretor/a", professeur: "Professor/a", admin: "Admin", user: "Encarregado de educação", student: "Aluno/a" },
  ar: { directeur: "المدير", professeur: "المعلم", admin: "المسؤول", user: "ولي الأمر", student: "التلميذ" },
  hi: { directeur: "प्रधानाचार्य", professeur: "शिक्षक", admin: "एडमिन", user: "अभिभावक", student: "विद्यार्थी" },
  zh: { directeur: "校长", professeur: "教师", admin: "管理员", user: "家长", student: "学生" },
};

let lastNavState = null;
window.addEventListener("dissipl:lang", () => {
  if (lastNavState) updateNavUI(lastNavState.isLoggedIn, lastNavState.user);
});

// === Met à jour le menu ===
function updateNavUI(isLoggedIn, user) {
  lastNavState = { isLoggedIn, user };
  const el = (id) => document.getElementById(id);
  const signup = el("signupNavItem");
  const login = el("loginNavItem");
  const profile = el("profileNavItem");
  const logoutAdult = el("logoutNavItem");
  const logoutStudent = el("logoutStudentNavItem");
  // Mobile-only action block inside #mainNav
  const mobileSignup = el("mobileSignupBtn");
  const mobileLogin = el("mobileLoginBtn");
  const mobileProfile = el("mobileProfileLink");
  const mobileLogout = el("mobileLogoutBtn");
  const link = profile ? profile.querySelector("a.nav-link") : null;

  if (!isLoggedIn || !user) {
    signup && (signup.style.display = "block");
    login && (login.style.display = "block");
    profile && (profile.style.display = "none");
    logoutAdult && (logoutAdult.style.display = "none");
    logoutStudent && (logoutStudent.style.display = "none");
    // Mobile actions: show signup/login, hide profile/logout
    mobileSignup && (mobileSignup.style.display = "inline-block");
    mobileLogin && (mobileLogin.style.display = "inline-block");
    mobileProfile && (mobileProfile.style.display = "none");
    mobileLogout && (mobileLogout.style.display = "none");
    return;
  }

  signup && (signup.style.display = "none");
  login && (login.style.display = "none");
  // Mobile actions: hide signup/login like on desktop
  mobileSignup && (mobileSignup.style.display = "none");
  mobileLogin && (mobileLogin.style.display = "none");

  if (user.role === "student") {
    logoutStudent && (logoutStudent.style.display = "block");
    logoutAdult && (logoutAdult.style.display = "none");
    mobileLogout && (mobileLogout.style.display = "inline-block");
  } else {
    logoutStudent && (logoutStudent.style.display = "none");
    logoutAdult && (logoutAdult.style.display = "block");
    mobileLogout && (mobileLogout.style.display = "inline-block");
  }

  if (profile) {
    profile.style.display = "block";
    // Update the href for students to point to their profile page
    const profileLink = profile.querySelector("a.nav-link");
    if (profileLink && user.role === "student") {
      profileLink.setAttribute("href", "/dissipl-preview/student-profile");
    }
  }

  // Mobile: show the profile link (points to /student-profile for students)
  if (mobileProfile) {
    mobileProfile.style.display = "inline-block";
    if (user.role === "student") {
      mobileProfile.setAttribute("href", "/dissipl-preview/student-profile");
    }
  }

  if (link) {
    const displayName = user.pseudo || user.email || user.username || "Profil";
    const lang = (window.DissiplI18n && window.DissiplI18n.lang) || "fr";
    const roles = ROLE_LABELS[lang] || ROLE_LABELS.fr;
    const roleLabel = roles[user.role] || user.role;
    const star = user.premium_active && user.role !== "student" ? " ⭐" : "";
    link.textContent = `${displayName} (${roleLabel})${star}`;
  }
}

// === Déconnexion ===
function handleLogout(e) {
  e.preventDefault();

  console.log('[Logout] Client-side logout initiated');

  fetch("/api/session/logout", { method: "POST", credentials: "include" })
    .then((r) => r.json().catch(() => ({})))
    .then(() => {
      console.log('[Logout] Server logout successful, clearing client cookies');

      // Clear all cookies with proper attributes
      const cookies = document.cookie.split(";");
      cookies.forEach((c) => {
        const name = c.split("=")[0].trim();
        // Clear cookie with multiple path attempts
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax; Secure;`;
        document.cookie = `${name}=; Max-Age=0; path=/;`;
        document.cookie = `${name}=; Max-Age=0; path=/html;`;
      });

      console.log('[Logout] Cookies cleared, updating UI');
      updateNavUI(false);
      setTimeout(() => (window.location.href = "/dissipl-preview/index.html"), 400);
    })
    .catch((err) => console.error("❌ Erreur déconnexion :", err));
}
