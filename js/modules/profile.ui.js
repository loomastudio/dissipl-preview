// profile.ui.js
import { setUserId, formatFrDate } from "./profile.utils.js";
import { loadStudents } from "./profile.students.js";
import { loadInvoices } from "./profile.billing.js";
import {
  setupCreateTeacherForm,
  fetchTeachersAndRender,
  setDirectorPremiumState,
} from "./profile.director.js";

export function updateProfile(user) {
  if (!user || typeof user !== "object") return;

  console.log('[Profile Debug] User data:', {
    role: user.role,
    premium_active: user.premium_active,
    premium_inherited: user.premium_inherited,
    current_plan: user.current_plan,
    director_id: user.director_id
  });

  const userEmailEl = document.getElementById("userEmail");
  const createdAtEl = document.getElementById("userCreatedAt");
  const accountTypeEl = document.getElementById("userAccountType");
  const premiumSectionEl = document.getElementById("premiumSection");
  const premiumStatusEl = document.getElementById("userPremiumStatus");
  const premiumEndEl = document.getElementById("userPremiumEndDate");
  const currentPlanDisplayEl = document.getElementById("currentPlanDisplay");
  const progressBarEl = document.getElementById("subscriptionProgressBar");
  const cancelPendingMsg = document.getElementById("cancelPendingMsg");
  const cancelBtn = document.getElementById("cancelSubscriptionBtn");
  const renewBtn = document.getElementById("renewSubscriptionBtn");
  const adminDashboardBtn = document.getElementById("adminDashboardBtn");

  const professorSection = document.getElementById("professorSection");
  const invoiceSection = document.getElementById("invoiceSection");
  const directorSection = document.getElementById("directorTeachersSection");
  const directorInheritanceNotice = document.getElementById("directorInheritanceNotice");

  const role = user.role || "inconnu";
  const hasPremium = !!user.premium_active;
  const premiumEnd = user.premium_end_date || null;
  const isCancelled = !!user.is_cancel;

  if (user.id != null) setUserId(user.id);

  if (userEmailEl)
    userEmailEl.textContent = user.email || user.pseudo || "Non renseigné";
  if (createdAtEl)
    createdAtEl.textContent = user.created_at || "Non disponible";

  if (accountTypeEl) {
    let label = "Inconnu";
    if (role === "directeur") label = "Directeur";
    else if (role === "professeur") label = "Professeur";
    else if (role === "admin") label = "Admin";
    else if (role === "user") label = "Utilisateur";
    else if (role === "student") label = "Élève";
    accountTypeEl.textContent = label;
  }

  // Show admin dashboard button ONLY for admin role (not directeur)
  if (adminDashboardBtn) {
    if (role === "admin") {
      adminDashboardBtn.style.display = "block";
      adminDashboardBtn.onclick = () => {
        window.location.href = "/dissipl-preview/admin";
      };
    } else {
      adminDashboardBtn.style.display = "none";
    }
  }

  if (premiumSectionEl) {
    premiumSectionEl.style.display =
      hasPremium || premiumEnd ? "block" : "none";
  }
  if (premiumStatusEl) {
    if (isCancelled) {
      premiumStatusEl.textContent = "⚠️ Abonnement annulé";
      premiumStatusEl.className = "badge badge-warning";
    } else {
      premiumStatusEl.textContent = hasPremium
        ? user.premium_inherited
          ? "✅ Premium actif (hérité du directeur)"
          : "✅ Premium actif"
        : "❌ Non premium";
      premiumStatusEl.className = "badge badge-light";
    }
  }
  if (premiumEndEl) {
    premiumEndEl.textContent = premiumEnd
      ? formatFrDate(premiumEnd) +
        (user.premium_inherited ? " (date directeur)" : "")
      : "Non disponible";
  }

  // Show director inheritance notice for teachers AND students
  if (directorInheritanceNotice) {
    if ((role === "professeur" || role === "student") && user.premium_inherited && premiumEnd) {
      directorInheritanceNotice.style.display = "block";
      if (role === "student") {
        directorInheritanceNotice.innerHTML = `
          <strong>🏫 Abonnement du Directeur</strong><br>
          <small>Votre accès premium est fourni par le directeur de votre professeur et expire le ${formatFrDate(premiumEnd)}.</small>
        `;
      } else {
        directorInheritanceNotice.innerHTML = `
          <strong>🏫 Abonnement du Directeur</strong><br>
          <small>Votre accès premium est fourni par votre directeur et expire le ${formatFrDate(premiumEnd)}.</small>
        `;
      }
    } else {
      directorInheritanceNotice.style.display = "none";
    }
  }

  // Display subscription type (Parent/Teacher/Institutional)
  if (currentPlanDisplayEl) {
    const currentPlan = user.current_plan || "";
    const planNames = {
      parent: "Parent",
      teacher: "Professeur",
      director: "Institutional Subscription",
      "Institutional Subscription": "Institutional Subscription"
    };

    if (user.is_gift && currentPlan) {
      // Premium granted by the admin — show it as a gift, not a purchased plan
      currentPlanDisplayEl.textContent = "Cadeau de l'admin 🎁";
      currentPlanDisplayEl.className = "badge badge-success";
    } else if (currentPlan && planNames[currentPlan]) {
      currentPlanDisplayEl.textContent = planNames[currentPlan];
      currentPlanDisplayEl.className = "badge badge-" + (currentPlan === "teacher" ? "primary" : "success");
    } else if ((role === "professeur" || role === "student") && user.premium_inherited) {
      // Teacher/Student under director - show inherited plan
      currentPlanDisplayEl.textContent = "Institutional Subscription (via Directeur)";
      currentPlanDisplayEl.className = "badge badge-success";
    } else {
      currentPlanDisplayEl.textContent = "Aucune";
      currentPlanDisplayEl.className = "badge badge-light";
    }
  }

  // Display billing period (monthly/yearly) - hide for institutional subscription and teachers under director
  const billingPeriodEl = document.getElementById("billingPeriodDisplay");
  const billingLabel = billingPeriodEl?.parentElement;

  if (billingPeriodEl && billingLabel) {
    const currentPlan = user.current_plan || "";
    // Individual teachers (no director_id) see billing, teachers under director do not
    const isTeacherUnderDirector = role === "professeur" && user.director_id;

    // Hide billing section for institutional subscription, teachers under director (manual renewal)
    // and admin gifts (the gift is shown in the Formule badge — no billing period applies)
    if (currentPlan === "director" || currentPlan === "Institutional Subscription" || isTeacherUnderDirector || user.is_gift) {
      billingLabel.style.display = "none";
    } else {
      billingLabel.style.display = "";
      const billingPeriod = user.billing_period || "";
      const periodNames = {
        monthly: "Mensuel",
        annual: "Annuel",
        yearly: "Annuel"
      };

      if (billingPeriod && periodNames[billingPeriod]) {
        billingPeriodEl.textContent = periodNames[billingPeriod];
      } else {
        billingPeriodEl.textContent = "--";
      }
    }
  }

  if (progressBarEl) {
    if (premiumEnd && (user.premium_start_date || user.created_at)) {
      const end = new Date(premiumEnd + "T00:00:00");
      // Progress measured over the subscription period (fallback: account creation)
      const start = new Date((user.premium_start_date || user.created_at) + "T00:00:00");
      const now = new Date();
      const totalMs = end - start;
      const leftMs = end - now;
      let percentLeft = 0;
      if (totalMs > 0) {
        percentLeft = Math.floor((leftMs / totalMs) * 100);
        percentLeft = Math.max(0, Math.min(100, percentLeft));
      }
      progressBarEl.style.width = percentLeft + "%";
      progressBarEl.textContent = percentLeft + "% restants";

      progressBarEl.classList.remove("bg-info", "bg-warning", "bg-danger");
      if (percentLeft <= 5) progressBarEl.classList.add("bg-danger");
      else if (percentLeft <= 10) progressBarEl.classList.add("bg-warning");
      else progressBarEl.classList.add("bg-info");
    } else {
      progressBarEl.style.width = "0%";
      progressBarEl.textContent = "0%";
      progressBarEl.classList.remove("bg-info", "bg-warning", "bg-danger");
      progressBarEl.classList.add("bg-info");
    }
  }

  // Handle cancelled subscription UI
  const currentPlan = user.current_plan || "";
  // Hide cancel button for institutional subscriptions AND teachers under director (manual renewal, under director)
  const isInstitutional = currentPlan === "director" || currentPlan === "Institutional Subscription";
  const isTeacher = role === "professeur";
  // Individual teacher (no director) can cancel, teacher under director cannot
  const isTeacherUnderDirector = isTeacher && user.director_id;

  // Admin gifts have no payment attached — nothing for the user to cancel
  const isGift = !!user.is_gift;

  if (isCancelled) {
    if (cancelPendingMsg) {
      cancelPendingMsg.textContent = "⚠️ Abonnement annulé - Premium restant jusqu'à l'expiration";
      cancelPendingMsg.style.display = "block";
    }
    if (cancelBtn) cancelBtn.style.display = "none";
    if (renewBtn) renewBtn.style.display = "none";
  } else {
    if (cancelPendingMsg) cancelPendingMsg.style.display = "none";
    // Hide cancel button for teachers under director, institutional subscriptions and admin gifts
    // Individual teachers (no director_id) CAN cancel their subscription
    if (cancelBtn) cancelBtn.style.display = (hasPremium && !isInstitutional && !isTeacherUnderDirector && !isGift) ? "block" : "none";
    if (renewBtn) renewBtn.style.display = "none";
  }

  // Section élèves: shown for teachers with premium
  if (professorSection) {
    console.log('[Professor Section Debug] Role:', role, 'hasPremium:', hasPremium, 'willShow:', role === "professeur" && hasPremium);
    if (role === "professeur" && hasPremium) {
      professorSection.style.display = "block";
      loadStudents();
    } else {
      professorSection.style.display = "none";
    }
  }

  // Factures visibles pour premium et (admin | user)
  // Directors and teachers have manual renewal - no automated invoices
  if (invoiceSection) {
    const isDirector = role === "directeur";
    const isProf = role === "professeur";
    const isAdmin = role === "admin";
    const isUser = role === "user";

    const canSeeInvoices =
      hasPremium &&
      !isDirector &&  // Exclude directors (institutional packages)
      !isProf &&      // Exclude teachers (under directors)
      (isAdmin || isUser);

    if (canSeeInvoices) {
      invoiceSection.style.display = "block";
      loadInvoices();
    } else {
      invoiceSection.style.display = "none";
    }
  }

  // Section directeur - only show if director has Institutional Subscription (quote package)
  if (directorSection) {
    const isInstitutional = (user.current_plan === "director" || user.current_plan === "Institutional Subscription");
    console.log('[Director Section Debug] Role:', role, 'current_plan:', user.current_plan, 'isInstitutional:', isInstitutional, 'willShow:', role === "directeur" && isInstitutional);
    if (role === "directeur" && isInstitutional) {
      directorSection.style.display = "block";

      // Source fiable depuis /api/session/status
      setDirectorPremiumState(hasPremium);

      setupCreateTeacherForm();
      fetchTeachersAndRender();
    } else {
      directorSection.style.display = "none";
    }
  }
}
