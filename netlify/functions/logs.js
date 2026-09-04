import { response, requireUser } from "./_lib.js";

export default async (req) => {
  const user = await requireUser(req);
  if (!user) return response({ error: "Unauthorized" }, 401);

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) return response({ error: "projectId required" }, 400);

    const runner = process.env.SHADOW_RUNNER_URL;
    const token = process.env.SHADOW_RUNNER_TOKEN;

    if (!runner || !token) return response({
      status: "offline",
      logs: ["Runner not connected. Website preview still works; Node/Discord projects need the optional runner."]
    });

    const r = await fetch(runner.replace(/\/$/, "") + `/v1/logs?projectId=${encodeURIComponent(projectId)}`, {
      headers: { "authorization": `Bearer ${token}` }
    });
    const data = await r.json().catch(() => ({ logs: ["Runner returned an invalid response"] }));
    return response(data, r.status);
  } catch (e) {
    console.error("Logs error:", e);
    return response({ error: "Logs request failed.", detail: e.message }, 500);
  }
};
