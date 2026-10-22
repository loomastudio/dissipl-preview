// profile.utils.js
export const log = (...a) => console.log("📄[profile]", ...a);
export const warn = (...a) => console.warn("⚠️[profile]", ...a);
export const err = (...a) => console.error("❌[profile]", ...a);

export function setUserId(id) {
  window.userId = id;
}
export function getUserId() {
  return window.userId;
}

export function formatFrDate(iso) {
  if (!iso) return "Non disponible";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR");
}

export function showError(msg) {
  const box = document.getElementById("profileError");
  if (box) {
    box.textContent = msg;
    box.style.display = "block";
  } else {
    alert(msg);
  }
}

export function showSuccess(msg) {
  const box = document.getElementById("profileSuccess");
  if (box) {
    box.textContent = msg;
    box.style.display = "block";
  } else {
    alert(msg);
  }
}
