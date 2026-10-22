// school-quote.js - Handle school quote request form with package selection

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication first (like profile page)
  fetch("/api/session/status", {
    credentials: "include",
    headers: { Accept: "application/json" }
  })
  .then(res => res.json())
  .then(data => {
    // Redirect if not authenticated
    if (!data.authenticated) {
      alert("Vous devez être connecté pour accéder à cette page.");
      window.location.href = "/dissipl-preview/index.html";
      return;
    }
    // Redirect if admin (admins cannot access quote page)
    if (data.user && data.user.role === 'admin') {
      alert("Accès refusé. Les administrateurs ne peuvent pas accéder à cette page.");
      window.location.href = "/dissipl-preview/index.html";
      return;
    }
    // Continue with rest of the logic if authenticated and not admin
    initQuoteForm();
  })
  .catch(err => {
    console.error("[School Quote] Session check error:", err);
    alert("Erreur de vérification de session. Veuillez vous reconnecter.");
    window.location.href = "/dissipl-preview/index.html";
  });
});

function initQuoteForm() {
  const form = document.getElementById("school-quote-form");
  const tierRadios = document.querySelectorAll('input[name="pricingTier"]');
  const selectedTierInfo = document.getElementById("selectedTierInfo");
  const tierName = document.getElementById("tierName");
  const tierPrice = document.getElementById("tierPrice");
  const tierTeachers = document.getElementById("tierTeachers");
  const quoteError = document.getElementById("quoteError");
  const quoteSuccess = document.getElementById("quoteSuccess");
  const submitBtn = document.getElementById("submit-btn");

  // Pricing tier configuration
  const tierConfig = {
    basic: {
      name: "Forfait Basic",
      price: 200,
      teachers: 15,
      label: "Basic (15 professeurs)"
    },
    premium: {
      name: "Forfait Premium ⭐",
      price: 400,
      teachers: 30,
      label: "Premium (30 professeurs)"
    }
  };

  // Update selected tier info when radio changes
  tierRadios.forEach(radio => {
    radio.addEventListener("change", function() {
      const selectedTier = this.value;
      const config = tierConfig[selectedTier];

      if (config) {
        tierName.textContent = config.name;
        tierPrice.textContent = config.price + "€";
        tierTeachers.textContent = config.teachers;
        selectedTierInfo.style.display = "block";
      }
    });
  });

  // Clear validation errors when user fixes invalid fields
  const requiredFields = ["schoolName", "schoolType", "contactName", "contactEmail"];
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener("input", function() {
        if (this.value.trim()) {
          this.classList.remove("is-invalid");
          // Check if all fields are now valid, hide error if so
          const allValid = requiredFields.every(id => {
            const f = document.getElementById(id);
            return f && f.value.trim();
          });
          if (allValid) {
            quoteError.style.display = "none";
          }
        }
      });
      field.addEventListener("change", function() {
        if (this.value.trim()) {
          this.classList.remove("is-invalid");
        }
      });
    }
  });

  // Handle form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Hide previous messages
    quoteError.style.display = "none";
    quoteSuccess.style.display = "none";

    // Get selected pricing tier
    const selectedTierRadio = document.querySelector('input[name="pricingTier"]:checked');
    if (!selectedTierRadio) {
      quoteError.textContent = "Veuillez sélectionner un forfait.";
      quoteError.style.display = "block";
      return;
    }

    const pricingTier = selectedTierRadio.value;
    const tierData = tierConfig[pricingTier];

    // Gather form data
    const formData = {
      organizationName: document.getElementById("schoolName").value.trim(),
      schoolType: document.getElementById("schoolType").value,
      contactName: document.getElementById("contactName").value.trim(),
      contactEmail: document.getElementById("contactEmail").value.trim(),
      contactPhone: document.getElementById("contactPhone").value.trim(),
      message: document.getElementById("message").value.trim(),
      pricingTier: pricingTier,
      requestedTeacherCount: tierData.teachers,
      estimatedAmount: tierData.price
    };

    // Enhanced field-by-field validation with specific error messages
    const missingFields = [];
    if (!formData.organizationName) missingFields.push("Nom de l'établissement");
    if (!formData.schoolType) missingFields.push("Type d'établissement");
    if (!formData.contactName) missingFields.push("Nom du contact");
    if (!formData.contactEmail) missingFields.push("Email");

    // Clear previous error styling
    document.getElementById("schoolName").classList.remove("is-invalid");
    document.getElementById("schoolType").classList.remove("is-invalid");
    document.getElementById("contactName").classList.remove("is-invalid");
    document.getElementById("contactEmail").classList.remove("is-invalid");

    if (missingFields.length > 0) {
      quoteError.textContent = `Veuillez remplir: ${missingFields.join(', ')}`;
      quoteError.style.display = "block";

      // Highlight missing fields
      if (!formData.organizationName) document.getElementById("schoolName").classList.add("is-invalid");
      if (!formData.schoolType) document.getElementById("schoolType").classList.add("is-invalid");
      if (!formData.contactName) document.getElementById("contactName").classList.add("is-invalid");
      if (!formData.contactEmail) document.getElementById("contactEmail").classList.add("is-invalid");

      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      quoteError.textContent = "Adresse email invalide.";
      quoteError.style.display = "block";
      return;
    }

    // Check if user is authenticated and has premium
    try {
      const sessionResponse = await fetch("/api/session/status", {
        credentials: "include"
      });

      console.log('[School Quote Submit] Session response status:', sessionResponse.status);
      const sessionData = await sessionResponse.json();
      console.log('[School Quote Submit] Session data:', sessionData);

      if (sessionData.authenticated && sessionData.user && sessionData.user.premium_active) {
        quoteError.innerHTML = `
          ⚠️ <strong>Vous avez déjà un abonnement actif.</strong><br>
          <a href="/dissipl-preview/profile" class="alert-link">Voir mon profil</a>
        `;
        quoteError.style.display = "block";
        return;
      }
    } catch (err) {
      console.error("[School Quote Submit] Session check error:", err);
      // Continue with form submission even if session check fails
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Envoi en cours...";

    try {
      const response = await fetch("/api/contact/school-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || data.message || "Erreur lors de l'envoi de la demande.");
      }

      // Success - hide form and show success message
      document.getElementById("quote-form").style.display = "none";
      document.getElementById("success-message").style.display = "block";

    } catch (error) {
      console.error("School quote error:", error);
      quoteError.textContent = error.message || "Une erreur s'est produite. Veuillez réessayer.";
      quoteError.style.display = "block";
    } finally {
      if (!submitBtn.disabled) {
        submitBtn.disabled = false;
        submitBtn.textContent = "📩 Envoyer ma demande de devis";
      }
    }
  });

  // Check if user is authenticated and pre-fill data
  fetch("/api/session/status", {
    credentials: "include"
  })
  .then(res => {
    console.log('[School Quote] Session status response:', res.status, res.statusText);
    if (!res.ok) {
      console.error('[School Quote] Session check failed with status:', res.status);
    }
    return res.json();
  })
  .then(data => {
    console.log('[School Quote] Session data:', {
      authenticated: data.authenticated,
      user: data.user ? { role: data.user.role, email: data.user.email } : null
    });

    if (data.authenticated && data.user) {
      // Pre-fill organization name from director profile if available
      if (data.user.organization_name) {
        const orgNameField = document.getElementById("schoolName");
        if (orgNameField) orgNameField.value = data.user.organization_name;
      }

      // Pre-fill contact info
      if (data.user.pseudo) {
        document.getElementById("contactName").value = data.user.pseudo;
      }
      if (data.user.email) {
        document.getElementById("contactEmail").value = data.user.email;
      }
    } else {
      console.warn('[School Quote] User not authenticated, showing public form');
    }
  })
  .catch(err => {
    console.error("[School Quote] Session check error:", err);
    // Show a warning to the user that session check failed
    const warningDiv = document.createElement("div");
    warningDiv.className = "alert alert-warning";
    warningDiv.innerHTML = "⚠️ Impossible de vérifier votre session. Veuillez vous reconnecter si nécessaire.";
    document.getElementById("quote-form").prepend(warningDiv);
  });
} // Close initQuoteForm function
