// profile.students.js
import { showError, err } from "./profile.utils.js";

// Pagination state
let currentPage = 1;
let totalPages = 1;
let totalStudents = 0;
// Loaded student objects (from the list API) — used by the edit modal so it
// fills REAL data (email vs username) instead of parsing table cells
let loadedStudents = [];

export function setupStudents() {
  // Bind listeners only once — this setup may run again when the profile
  // re-renders, and duplicate listeners fire duplicate create requests
  if (setupStudents.bound) return;
  setupStudents.bound = true;

  // Open create modal button
  document
    .getElementById("openCreateStudentModal")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      resetCreateForm();
      $("#createStudentModal").modal("show");
    });

  // Auto-suggest a simple username from the student's name
  // (e.g. "Lina Martin" -> "lina.martin") until the teacher edits it manually
  const nameInput = document.getElementById("studentName");
  const usernameInput = document.getElementById("studentUsername");
  let usernameAutoFilled = true;

  const slugifyName = (value) =>
    (value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 30);

  nameInput?.addEventListener("input", () => {
    if (!usernameAutoFilled) return;
    const slug = slugifyName(nameInput.value);
    if (slug && usernameInput) usernameInput.value = slug;
  });

  usernameInput?.addEventListener("input", () => {
    const expected = slugifyName(nameInput?.value || "");
    if (usernameInput.value !== expected) usernameAutoFilled = false;
  });

  // Reset auto-suggest when the form is cleared
  document
    .getElementById("openCreateStudentModal")
    ?.addEventListener("click", () => {
      usernameAutoFilled = true;
    });

  // Create student form
  const createForm = document.getElementById("createStudentForm");
  createForm?.addEventListener("submit", handleCreateSubmit);

  // Edit student form
  const editForm = document.getElementById("editStudentForm");
  editForm?.addEventListener("submit", handleEditSubmit);

  // Pagination buttons
  document
    .getElementById("prevPage")
    ?.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        loadStudents(currentPage);
      }
    });

  document
    .getElementById("nextPage")
    ?.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadStudents(currentPage);
      }
    });

  // PDF download
  document
    .getElementById("downloadStudentPDF")
    ?.addEventListener("click", () => {
      window.location.href = "/api/students/pdf";
    });

  // Initial load
  loadStudents(1);
}

function resetCreateForm() {
  const form = document.getElementById("createStudentForm");
  if (form) form.reset();
  hideAlert("createStudentError");
  hideAlert("createStudentSuccess");
}

function resetEditForm() {
  const form = document.getElementById("editStudentForm");
  if (form) form.reset();
  document.getElementById("editStudentId").value = "";
  hideAlert("editStudentError");
  hideAlert("editStudentSuccess");
}

function hideAlert(alertId) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.style.display = "none";
    alert.textContent = "";
  }
}

function showAlert(alertId, message) {
  const alert = document.getElementById(alertId);
  if (alert) {
    alert.textContent = message;
    alert.style.display = "block";
  }
}

async function handleCreateSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = {
    name: formData.get("name"),
    username: (formData.get("username") || "").trim().toLowerCase(),
    email: formData.get("email"),
    password: formData.get("password"), // Required
  };

  hideAlert("createStudentError");
  hideAlert("createStudentSuccess");

  // Prevent double-submit (a second click would show a misleading
  // "email already used" error over a successful creation)
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch("/api/students/create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (result.error) {
      showAlert("createStudentError", `Erreur : ${result.error}`);
      return;
    }

    // Show success message
    showAlert(
      "createStudentSuccess",
      `Compte élève créé avec succès ! Username: ${result.student.username}, Mot de passe: ${result.student.password}`
    );

    // Close modal after a short delay
    setTimeout(() => {
      $("#createStudentModal").modal("hide");
      resetCreateForm();
      loadStudents(currentPage);
    }, 2000);
  } catch (error) {
    err("createStudent error:", error);
    showAlert(
      "createStudentError",
      "Une erreur est survenue lors de la création du compte élève."
    );
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const studentId = parseInt(formData.get("id"));
  const data = {};

  // Only include fields that have values.
  // Email is ALWAYS sent: an empty value explicitly removes the student's email.
  if (formData.get("name")) {
    data.name = formData.get("name");
  }
  data.email = formData.get("email") || "";
  if (formData.get("password")) {
    data.password = formData.get("password");
  }

  hideAlert("editStudentError");
  hideAlert("editStudentSuccess");

  try {
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (result.error) {
      showAlert("editStudentError", `Erreur : ${result.error}`);
      return;
    }

    showAlert("editStudentSuccess", "Compte élève mis à jour avec succès !");

    setTimeout(() => {
      $("#editStudentModal").modal("hide");
      resetEditForm();
      loadStudents(currentPage);
    }, 1500);
  } catch (error) {
    err("editStudent error:", error);
    showAlert(
      "editStudentError",
      "Une erreur est survenue lors de la modification du compte élève."
    );
  }
}

function openEditModal(studentId, studentData) {
  const form = document.getElementById("editStudentForm");
  if (!form) return;

  resetEditForm();

  // Fill form with existing data
  document.getElementById("editStudentId").value = studentId;
  document.getElementById("editStudentName").value = studentData.name || "";
  document.getElementById("editStudentUsername").value =
    studentData.username || "";
  document.getElementById("editStudentEmail").value = studentData.email || "";
  // Password left empty (user can enter new one if desired)

  $("#editStudentModal").modal("show");
}

async function handleDelete(studentId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce compte élève ?")) {
    return;
  }

  try {
    const res = await fetch(`/api/students/${studentId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const result = await res.json();

    if (result.error) {
      alert(`Erreur : ${result.error}`);
      return;
    }

    // Reload the list
    loadStudents(currentPage);
  } catch (error) {
    err("deleteStudent error:", error);
    alert("Une erreur est survenue lors de la suppression du compte élève.");
  }
}

function formatExpiryDate(expiresAt) {
  if (!expiresAt) return "-";
  // Extract date directly from ISO string to avoid timezone conversion
  // Format: YYYY-MM-DDTHH:mm:ss.sssZ
  const datePart = expiresAt.split('T')[0]; // Get YYYY-MM-DD part
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
}

export function loadStudents(page = 1) {
  currentPage = page;

  fetch(`/api/students/list?page=${page}&limit=10`, {
    method: "GET",
    credentials: "include",
  })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      renderStudentTable(data.students || data); // Handle both array and paginated response
      renderPagination(data.total, data.page, data.pages);
      renderStudentCount(data.total, data.maxStudents || 30);
    })
    .catch((e) => {
      err("Erreur chargement comptes élèves :", e);
      const tbody = document.getElementById("studentsTableBody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-danger">
              Erreur lors du chargement des élèves
            </td>
          </tr>`;
      }
    });
}

function renderStudentTable(students) {
  const tbody = document.getElementById("studentsTableBody");
  if (!tbody) return;

  loadedStudents = Array.isArray(students) ? students : [];

  tbody.innerHTML = "";

  if (!Array.isArray(students) || students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted p-4">
          <div class="font-size-16">Aucun compte élève actif</div>
          <small class="text-muted">Cliquez sur "Nouvel élève" pour créer un compte</small>
        </td>
      </tr>`;
    return;
  }

  students.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="align-middle">
        <div class="font-weight-semibold">${student.name || "Élève"}</div>
      </td>
      <td class="align-middle">
        <div class="font-weight-bold text-primary">${student.email || student.username || "-"}</div>
      </td>
      <td class="align-middle">
        ${student.plain_password
          ? `<div class="input-group input-group-sm">
              <input type="text" class="form-control" value="${student.plain_password}" readonly id="pwd-${student.id}">
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" type="button" onclick="copyPassword('${student.id}')">
                  📋
                </button>
              </div>
            </div>`
          : `<span class="text-muted small">Non disponible</span>`
        }
      </td>
      <td class="align-middle">
        <span class="badge ${isExpiringSoon(student.expires_at) ? 'badge-warning' : 'badge-success'}">
          ${formatExpiryDate(student.expires_at)}
        </span>
      </td>
      <td class="align-middle text-nowrap">
        <span class="action-icon mr-2 cursor-pointer" data-action="edit" data-id="${student.id}" title="Modifier">✏️</span>
        <span class="action-icon cursor-pointer" data-action="delete" data-id="${student.id}" title="Supprimer">🗑️</span>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Add event listeners for action icons
  tbody.querySelectorAll(".action-icon[data-action]").forEach((icon) => {
    icon.addEventListener("click", onStudentRowAction);
  });
}

// Check if expiry date is within 7 days
function isExpiringSoon(expiresAt) {
  if (!expiresAt) return false;
  const expiryDate = new Date(expiresAt);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

// Copy password to clipboard (global function for onclick)
window.copyPassword = function(studentId) {
  const input = document.getElementById(`pwd-${studentId}`);
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

function onStudentRowAction(e) {
  const icon = e.currentTarget;
  const action = icon.dataset.action;
  const studentId = parseInt(icon.dataset.id);

  if (action === "edit") {
    // Use the REAL student object (from the loaded list) — the table's
    // identifiant column shows username when no email exists, so parsing
    // cells would wrongly put the username into the email field
    const student = loadedStudents.find((s) => s.id === studentId);
    if (!student) {
      showAlert(
        "editStudentError",
        "Élève introuvable. Rechargez la liste et réessayez."
      );
      return;
    }

    openEditModal(studentId, {
      name: student.name,
      email: student.email || "",
      username: student.username,
    });
  } else if (action === "delete") {
    handleDelete(studentId);
  }
}

function renderPagination(total, page, pages) {
  totalStudents = total;
  totalPages = pages;
  currentPage = page;

  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  if (pageInfo) {
    if (total === 0) {
      pageInfo.textContent = "Aucun élève";
    } else {
      pageInfo.textContent = `Page ${page} sur ${pages} (${total} élève${total > 1 ? "s" : ""})`;
    }
  }

  if (prevBtn) {
    prevBtn.disabled = page <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = page >= pages || pages === 0;
  }
}

/**
 * Affiche le compteur d'élèves (X / 30)
 */
function renderStudentCount(total, max) {
  const countElement = document.getElementById("studentCountDisplay");
  if (!countElement) return;

  const remaining = max - total;
  const percentage = Math.round((total / max) * 100);

  // Déterminer la couleur en fonction de l'utilisation
  let badgeClass = "badge-success";
  if (percentage >= 90) {
    badgeClass = "badge-danger";
  } else if (percentage >= 70) {
    badgeClass = "badge-warning";
  }

  countElement.innerHTML = `
    <span class="${badgeClass}">${total} / ${max} élèves</span>
    <small class="text-muted ml-2">(${remaining} restante${remaining > 1 ? "s" : ""})</small>
  `;
}
