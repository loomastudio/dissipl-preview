// profile.director.js
import { err } from "./profile.utils.js";

// Pagination state
let directorIsPremium = false;
let currentTeacherPage = 1;
let totalTeacherPages = 1;
let totalTeachers = 0;

// Store teacher passwords for display (teacherId -> password)
const teacherPasswords = new Map();

// ---------- Fonctions utilitaires ----------
function showDirectorAlert(type, message) {
  const alertBox = document.getElementById("directorActionAlert");
  if (!alertBox) return;

  alertBox.className = `alert alert-${type} mt-3`;
  alertBox.textContent = message;
  alertBox.style.display = "block";

  setTimeout(() => {
    alertBox.style.display = "none";
  }, 5000);
}

function showPremiumRequiredModal() {
  const modal = document.getElementById("premiumRequiredModal");
  if (modal && typeof $ !== "undefined") {
    $(modal).modal("show");
  } else {
    alert("Premium required for this feature.");
  }
}

// ---------- Rendu des professeurs ----------
function renderTeachersTable(payload) {
  const tbody = document.getElementById("teachersTableBody");
  const premiumBadge = document.getElementById("directorPremiumBadge");
  if (!tbody) return;

  const { director, teachers, pagination } = payload || {};

  // Update pagination state
  if (pagination) {
    totalTeachers = pagination.total;
    currentTeacherPage = pagination.page;
    totalTeacherPages = pagination.pages;
  }

  const backendPremium = !!(
    director &&
    (director.is_premium ||
      director.premium_active ||
      director.premium === true)
  );

  // Ne pas écraser à false si la session a déjà dit premium
  if (backendPremium) {
    directorIsPremium = true;
  }

  // Update director premium state with expiration date
  setDirectorPremiumState(backendPremium, director?.premium_end_date);

  tbody.innerHTML = "";
  if (!Array.isArray(teachers) || teachers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted p-3">
          Aucun professeur créé pour le moment.
        </td>
      </tr>`;
    // Hide pagination when no teachers
    const teacherPagination = document.getElementById("teachersPagination");
    if (teacherPagination) teacherPagination.style.display = "none";
    return;
  }

  teachers.forEach((t) => {
    if (t.pseudo && t.pseudo.startsWith("[deleted-")) return;

    const isActive = t.is_active === 1 || t.is_active === true;

    const row = document.createElement("tr");
    // Use plain_password from database or show "Non disponible" - same style as student management
    const passwordHtml = t.plain_password
      ? `<div class="input-group input-group-sm">
          <input type="text" class="form-control" value="${t.plain_password}" readonly id="pwd-${t.id}">
          <div class="input-group-append">
            <button class="btn btn-outline-secondary" type="button" onclick="copyTeacherPassword('${t.id}')">📋</button>
          </div>
        </div>`
      : `<span class="text-muted small">Non disponible</span>`;
    row.innerHTML = `
      <td>${t.pseudo || "-"}</td>
      <td>${t.email || "-"}</td>
      <td>${passwordHtml}</td>
      <td>
        ${
          isActive
            ? `<span class="badge badge-success">Active</span>`
            : `<span class="badge badge-secondary">Inactive</span>`
        }
      </td>
      <td class="text-nowrap">
        <span class="action-icon mr-2 cursor-pointer" data-action="edit" data-id="${t.id}" title="Edit">✏️</span>
        <span class="action-icon cursor-pointer" data-action="delete" data-id="${t.id}" title="Delete">🗑️</span>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Add event listeners for action icons
  tbody.querySelectorAll(".action-icon[data-action]").forEach((icon) => {
    icon.addEventListener("click", onTeacherRowAction);
  });

  // Render pagination and count
  renderTeacherPagination();
  renderTeacherCount();
}

// Render teacher pagination controls
function renderTeacherPagination() {
  const paginationDiv = document.getElementById("teachersPagination");
  const prevBtn = document.getElementById("prevTeacherPage");
  const nextBtn = document.getElementById("nextTeacherPage");
  const pageInfo = document.getElementById("teacherPageInfo");

  if (!paginationDiv || totalTeacherPages <= 1) {
    if (paginationDiv) paginationDiv.style.display = "none";
    return;
  }

  paginationDiv.style.display = "flex";

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentTeacherPage} sur ${totalTeacherPages}`;
  }

  if (prevBtn) {
    prevBtn.disabled = currentTeacherPage <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = currentTeacherPage >= totalTeacherPages || totalTeacherPages === 0;
  }
}

// Render teacher count
function renderTeacherCount() {
  // ⚠️ TESTING PHASE: temporarily raised from 30 to 100 (matches nbAccountProf in director.routes.js).
  // TO RESTORE AFTER TESTING: change 100 back to 30.
  const maxTeachers = 100;
  const remaining = Math.max(0, maxTeachers - totalTeachers);

  // Update bottom count info
  const countInfo = document.getElementById("teacherCountInfo");
  if (countInfo) {
    countInfo.textContent = `Professeurs actifs : ${totalTeachers} / ${maxTeachers} (${remaining} restantes)`;
  }

  // Update header count display
  const headerCount = document.getElementById("teacherCountDisplayHeader");
  if (headerCount) {
    headerCount.innerHTML = `<span class="badge badge-success">${totalTeachers} / ${maxTeachers}</span> <small class="text-muted">(${remaining} restantes)</small>`;
  }
}

// Generate random password for display
function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ---------- Requête liste profs ----------
export function fetchTeachersAndRender(page = 1) {
  return fetch(`/api/director/teachers?page=${page}&limit=10`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then((res) => {
      if (!res.ok) throw new Error("...");
      return res.json();
    })
    .then((data) => renderTeachersTable(data))
    .catch((e) => {
      err("fetchTeachersAndRender error:", e);
      showDirectorAlert("error", "Erreur lors du chargement des professeurs.");
    });
}

// Setup teacher pagination event listeners
export function setupTeacherPagination() {
  const prevBtn = document.getElementById("prevTeacherPage");
  const nextBtn = document.getElementById("nextTeacherPage");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentTeacherPage > 1) {
        currentTeacherPage--;
        fetchTeachersAndRender(currentTeacherPage);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentTeacherPage < totalTeacherPages) {
        currentTeacherPage++;
        fetchTeachersAndRender(currentTeacherPage);
      }
    });
  }
}

// ---------- Formulaire création prof ----------
let teacherCreateInFlight = false;

export function setupCreateTeacherForm() {
  const form = document.getElementById("createTeacherForm");
  const pseudoInput = document.getElementById("teacherPseudo");
  const emailInput = document.getElementById("teacherEmail");
  const passwordInput = document.getElementById("teacherPassword");
  const feedbackBox = document.getElementById("createTeacherFeedback");
  const credsBox = document.getElementById("newTeacherCredentialsBox");
  if (!form) return;

  // This setup runs every time the director section renders. Bind the submit
  // listener only ONCE — duplicate listeners make one click fire several
  // create requests (first succeeds, the rest return 409 and overwrite the
  // success message with a misleading error).
  if (form.dataset.createBound === "1") return;
  form.dataset.createBound = "1";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (teacherCreateInFlight) return;
    teacherCreateInFlight = true;

    const pseudo = (pseudoInput?.value || "").trim();
    const email = (emailInput?.value || "").trim() || null;
    const password = (passwordInput?.value || "").trim() || null;

    if (!pseudo) {
      if (feedbackBox) {
        feedbackBox.className = "alert alert-danger";
        feedbackBox.textContent = "Veuillez entrer un identifiant pour le professeur.";
        feedbackBox.style.display = "block";
      }
      return;
    }

    try {
      // Prevent double-submit: a second click would hit "pseudo already taken"
      // and overwrite the success message with a misleading error
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const res = await fetch("/api/director/teachers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erreur lors de la création.");

      // Store password for new teacher
      if (data.credentials && data.credentials.password_temp && data.teacher?.id) {
        teacherPasswords.set(data.teacher.id, data.credentials.password_temp);
      }

      if (feedbackBox) {
        feedbackBox.className = "alert alert-success";
        feedbackBox.textContent = "✅ Professeur créé avec succès.";
        feedbackBox.style.display = "block";
      }
      if (credsBox && data.credentials) {
        credsBox.innerHTML = `
          <div><strong>Login:</strong> ${data.credentials.login}</div>
          <div><strong>Password:</strong> ${data.credentials.password_temp}</div>
          <div class="small text-muted mt-2">Share these credentials with the teacher.</div>
        `;
        credsBox.style.display = "block";
      }
      if (pseudoInput) pseudoInput.value = "";
      if (emailInput) emailInput.value = "";
      if (passwordInput) passwordInput.value = "";
      fetchTeachersAndRender();
    } catch (e) {
      err("create teacher error:", e);
      if (feedbackBox) {
        feedbackBox.className = "alert alert-danger";
        feedbackBox.textContent = e.message || "Erreur lors de la création du professeur.";
        feedbackBox.style.display = "block";
      }
    } finally {
      teacherCreateInFlight = false;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// ---------- Actions sur les profs ----------
function onTeacherRowAction(e) {
  const icon = e.currentTarget;
  const teacherId = icon.getAttribute("data-id");
  const action = icon.getAttribute("data-action");
  const credsBox = document.getElementById("newTeacherCredentialsBox");
  if (!teacherId || !action) return;

  // Handle edit action
  if (action === "edit") {
    openEditTeacherModal(teacherId);
    return;
  }

  // Handle delete action
  if (action === "delete") {
    const ok = confirm("⚠️ Delete this teacher?");
    if (!ok) return;

    fetch(`/api/director/teachers/${teacherId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);
      showDirectorAlert("success", "Teacher deleted.");
      fetchTeachersAndRender();
    })
    .catch((e) => {
      err("Delete teacher error:", e);
      showDirectorAlert("error", e.message || "Error deleting teacher.");
    });
    return;
  }

  // Handle other actions (reset, disable, enable)
  let url = "";
  let method = "PUT";

  if (action === "reset") url = `/api/director/teachers/${teacherId}/reset-password`;
  else if (action === "disable") url = `/api/director/teachers/${teacherId}/disable`;
  else if (action === "enable") url = `/api/director/teachers/${teacherId}/enable`;

  if (url) {
    fetch(url, {
      method,
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || data.error) throw new Error(data.error || "Action impossible.");

        if (action === "reset" && credsBox && data.credentials) {
          // Store the new password
          teacherPasswords.set(parseInt(teacherId, 10), data.credentials.password_temp);

          credsBox.innerHTML = `
            <div><strong>Login:</strong> ${data.credentials.login}</div>
            <div><strong>New Password:</strong> ${data.credentials.password_temp}</div>
            <div class="small text-muted mt-2">Share these credentials with the teacher.</div>
          `;
          credsBox.style.display = "block";
          showDirectorAlert("success", "Password reset.");
        } else if (action === "disable") {
          showDirectorAlert("success", "Teacher disabled.");
        } else if (action === "enable") {
          showDirectorAlert("success", "Teacher enabled.");
        }

        fetchTeachersAndRender();
      })
      .catch((e) => {
        err("Teacher action error:", e);
        showDirectorAlert("error", e.message || "Error during action.");
      });
  }
}

// ---------- Edit Teacher Modal ----------
function openEditTeacherModal(teacherId) {
  fetch("/api/director/teachers", {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then((res) => res.json())
    .then((data) => {
      const teacher = data.teachers?.find((t) => t.id === parseInt(teacherId, 10));
      if (!teacher) {
        showDirectorAlert("error", "Teacher not found");
        return;
      }

      document.getElementById("editTeacherId").value = teacher.id;
      document.getElementById("editTeacherEmail").value = teacher.email || "";
      document.getElementById("editTeacherPseudo").value = teacher.pseudo || "";

      const modal = document.getElementById("editTeacherModal");
      if (modal && typeof $ !== "undefined") {
        $(modal).modal("show");
      }

      setupEditTeacherForm();
    })
    .catch((e) => {
      err("Error fetching teacher:", e);
      showDirectorAlert("error", "Error loading teacher data");
    });
}

function setupEditTeacherForm() {
  const form = document.getElementById("editTeacherForm");
  if (!form) return;

  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const teacherId = document.getElementById("editTeacherId").value;
    const email = document.getElementById("editTeacherEmail").value.trim();
    const pseudo = document.getElementById("editTeacherPseudo").value.trim();
    const password = document.getElementById("editTeacherPassword").value.trim();
    const feedbackBox = document.getElementById("editTeacherFeedback");

    if (!email && !pseudo) {
      if (feedbackBox) {
        feedbackBox.className = "alert alert-danger";
        feedbackBox.textContent = "Please enter email or ID.";
        feedbackBox.style.display = "block";
      }
      return;
    }

    try {
      const body = { email, pseudo };
      if (password) body.password = password;

      const res = await fetch(`/api/director/teachers/${teacherId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Error updating teacher");
      }

      // Store password if returned in response
      if (data.credentials && data.credentials.password_temp) {
        teacherPasswords.set(parseInt(teacherId, 10), data.credentials.password_temp);
      }

      // Clear password field
      const passwordField = document.getElementById("editTeacherPassword");
      if (passwordField) passwordField.value = "";

      const modal = document.getElementById("editTeacherModal");
      if (modal && typeof $ !== "undefined") {
        $(modal).modal("hide");
      }

      showDirectorAlert("success", "Teacher updated successfully");
      fetchTeachersAndRender();
    } catch (e) {
      err("Update teacher error:", e);
      if (feedbackBox) {
        feedbackBox.className = "alert alert-danger";
        feedbackBox.textContent = e.message || "Error updating teacher";
        feedbackBox.style.display = "block";
      }
    }
  });
}

export function setDirectorPremiumState(isPremium, endDate = null) {
  directorIsPremium = isPremium;
}

// Copy password to clipboard (global function for onclick) - same as student management
window.copyTeacherPassword = function(teacherId) {
  const input = document.getElementById(`pwd-${teacherId}`);
  if (input) {
    input.select();
    document.execCommand('copy');
    // Visual feedback
    const originalBg = input.style.backgroundColor;
    input.style.backgroundColor = '#d4edda';
    setTimeout(() => {
      input.style.backgroundColor = originalBg;
    }, 500);
  }
};

export function setupDirector() {
  // Initialisation du module directeur
  setupTeacherPagination();
  setupCreateTeacherForm();
}
