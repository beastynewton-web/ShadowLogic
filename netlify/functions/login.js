import { response, usersStore, verifyPassword, signSession, makeCookie } from "./_lib.js";

export default async (req) => {
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const owner = await usersStore().get("owner", { type: "json", consistency: "strong" });
    if (!owner) return response({ error: "Owner account has not been created yet. Open /setup.html." }, 404);

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const ok = email === owner.email && await verifyPassword(password, owner.passwordHash);
    if (!ok) return response({ error: "Incorrect email or password." }, 401);

    const token = await signSession(owner);
    return response({ ok: true, user: { id: owner.id, email: owner.email, role: owner.role } }, 200, {
      "set-cookie": makeCookie("shadow_session", token)
    });
  } catch (e) {
    console.error("Login error:", e);
    return response({ error: "Login failed.", detail: e.message }, 500);
  }
};
