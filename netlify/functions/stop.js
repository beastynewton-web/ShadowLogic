import { response, requireUser, projectsStore } from "./_lib.js";

export default async (req) => {
  const user = await requireUser(req);
  if (!user) return response({ error: "Unauthorized" }, 401);
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const project = await projectsStore().get("project:" + body.projectId, { type: "json", consistency: "strong" });
    if (!project) return response({ error: "Project not found" }, 404);

    const runner = process.env.SHADOW_RUNNER_URL;
    const token = process.env.SHADOW_RUNNER_TOKEN;
    if (!runner || !token) return response({ error: "Runner is not connected." }, 503);

    const r = await fetch(runner.replace(/\/$/, "") + "/v1/stop", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${token}` },
      body: JSON.stringify({ projectId: project.id })
    });
    const data = await r.json().catch(() => ({ ok: r.ok }));

    if (r.ok) {
      project.status = "stopped";
      project.updatedAt = new Date().toISOString();
      await projectsStore().setJSON("project:" + project.id, project);
    }
    return response(data, r.status);
  } catch (e) {
    console.error("Stop error:", e);
    return response({ error: "Stop request failed.", detail: e.message }, 500);
  }
};
