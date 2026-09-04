import { response, usersStore, hashPassword, signSession, makeCookie, makeId } from "./_lib.js";

export default async (req) => {
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  try {
    const jwtSecret = process.env.SHADOW_JWT_SECRET || "";
    const expectedSetupKey = process.env.SHADOW_SETUP_KEY || "";

    if (jwtSecret.length < 32) {
      return response({ error: "SHADOW_JWT_SECRET is missing or shorter than 32 characters in Netlify Environment Variables." }, 500);
    }
    if (!expectedSetupKey) {
      return response({ error: "SHADOW_SETUP_KEY is missing from Netlify Environment Variables." }, 500);
    }

    const store = usersStore();
    const existing = await store.get("owner", { type: "json", consistency: "strong" });
    if (existing) return response({ error: "Owner account already exists. Go back to the login page." }, 409);

    const body = await req.json().catch(() => ({}));
    const setupKey = String(body.setupKey || "");
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (setupKey !== expectedSetupKey) return response({ error: "Invalid setup key. It must exactly match SHADOW_SETUP_KEY in Netlify." }, 403);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return response({ error: "Enter a valid email address." }, 400);
    if (password.length < 10) return response({ error: "Password must be at least 10 characters." }, 400);

    // Build session BEFORE writing owner to prevent a half-created account.
    const user = {
      id: makeId("usr_"),
      email,
      role: "owner",
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString()
    };
    const token = await signSession(user);

    await store.setJSON("owner", user);

    return response({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role }
    }, 200, { "set-cookie": makeCookie("shadow_session", token) });

  } catch (e) {
    console.error("Shadow Logic setup error:", e);
    return response({
      error: "Setup function failed.",
      detail: e?.message || String(e)
    }, 500);
  }
};
