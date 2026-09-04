import { response, clearCookie } from "./_lib.js";
export default async () => response({ ok: true }, 200, { "set-cookie": clearCookie("shadow_session") });
