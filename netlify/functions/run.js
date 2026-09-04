import { response, requireUser, projectsStore, filesStore } from "./_lib.js";

async function snapshot(projectId) {
  const store = filesStore();
  const { blobs } = await store.list({ prefix: `file:${projectId}:` });
  const files = {};
  for (const b of blobs) {
    const path = b.key.slice(`file:${projectId}:`.length);
    files[path] = await store.get(b.key, { type: "text", consistency: "strong" });
  }
  return files;
}

export default async (req) => {
  const user = await requireUser(req);
  if (!user) return response({ error: "Unauthorized" }, 401);
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const project = await projectsStore().get("project:" + body.projectId, { type: "json", consistency: "strong" });
    if (!project) return response({ error: "Project not found" }, 404);

    if (project.type === "web") {
      return response({ ok: true, mode: "preview", message: "Web project ready for browser preview." });
    }

    const runner = process.env.SHADOW_RUNNER_URL;
    const token = process.env.SHADOW_RUNNER_TOKEN;
    if (!runner || !token) {
      return response({
        error: "Persistent runner is not connected. Netlify hosts the panel, but Discord bots need the included runner on a VPS/VM."
      }, 503);
    }

    const r = await fetch(runner.replace(/\/$/, "") + "/v1/run", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${token}` },
      body: JSON.stringify({ projectId: project.id, files: await snapshot(project.id) })
    });
    const data = await r.json().catch(() => ({ error: "Runner returned an invalid response" }));
    if (!r.ok) return response(data, r.status);

    project.status = "running";
    project.updatedAt = new Date().toISOString();
    await projectsStore().setJSON("project:" + project.id, project);
    return response(data);
  } catch (e) {
    console.error("Run error:", e);
    return response({ error: "Run request failed.", detail: e.message }, 500);
  }
};
