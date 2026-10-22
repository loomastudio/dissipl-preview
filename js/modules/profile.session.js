// profile.session.js
export async function fetchSession() {
  const res = await fetch("/api/session/status", {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Impossible de récupérer la session");
  return res.json(); // { authenticated, isStudent, user }
}
