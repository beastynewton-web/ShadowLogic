import { getStore } from "@netlify/blobs";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import crypto from "node:crypto";

const enc = new TextEncoder();

export function response(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });
}

export function makeCookie(name, value, maxAge = 60 * 60 * 24 * 7) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseCookies(value = "") {
  const out = {};
  value.split(";").forEach(part => {
    const i = part.indexOf("=");
    if (i <= 0) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

export async function signSession(user) {
  const secret = process.env.SHADOW_JWT_SECRET || "";
  if (secret.length < 32) throw new Error("SHADOW_JWT_SECRET is missing or shorter than 32 characters");
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(enc.encode(secret));
}

export async function requireUser(req) {
  const cookies = parseCookies(req.headers.get("cookie") || "");
  const token = cookies.shadow_session;
  if (!token) return null;
  const secret = process.env.SHADOW_JWT_SECRET || "";
  if (secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, enc.encode(secret));
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export const usersStore = () => getStore("shadow-users");
export const projectsStore = () => getStore("shadow-projects");
export const filesStore = () => getStore("shadow-files");

export const hashPassword = p => bcrypt.hash(p, 12);
export const verifyPassword = (p, h) => bcrypt.compare(p, h);

export function makeId(prefix = "") {
  return prefix + crypto.randomBytes(10).toString("hex");
}

export function safePath(value) {
  const p = String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!p || p.includes("..") || p.includes("\0")) return null;
  return p;
}

export async function listProjects() {
  const store = projectsStore();
  const { blobs } = await store.list({ prefix: "project:" });
  const rows = [];
  for (const blob of blobs) {
    const row = await store.get(blob.key, { type: "json", consistency: "strong" });
    if (row) rows.push(row);
  }
  return rows.sort((a,b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}
