import { response, requireUser, projectsStore, filesStore, listProjects, makeId } from "./_lib.js";

export default async (req) => {
  const user = await requireUser(req);
  if (!user) return response({ error: "Unauthorized" }, 401);

  try {
    if (req.method === "GET") return response({ projects: await listProjects() });

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const name = String(body.name || "").trim().slice(0, 60);
      const type = ["node", "web", "other"].includes(body.type) ? body.type : "node";
      if (!name) return response({ error: "Project name required" }, 400);

      const now = new Date().toISOString();
      const project = { id: makeId("prj_"), name, type, status: "stopped", createdAt: now, updatedAt: now };
      await projectsStore().setJSON("project:" + project.id, project);

      const f = filesStore();
      if (type === "node") {
        await f.set(`file:${project.id}:index.js`, `console.log("Shadow Logic project started");\n`);
        await f.set(`file:${project.id}:package.json`, JSON.stringify({
          name: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          version: "1.0.0",
          main: "index.js",
          scripts: { start: "node index.js" }
        }, null, 2));
      } else if (type === "web") {
        await f.set(`file:${project.id}:index.html`, `<!doctype html>
<html>
<head><meta charset="utf-8"><title>${name}</title></head>
<body><h1>${name}</h1><p>Hosted with Shadow Logic.</p></body>
</html>`);
      }
      return response({ project }, 201);
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const projectId = url.searchParams.get("id");
      if (!projectId) return response({ error: "Project id required" }, 400);
      await projectsStore().delete("project:" + projectId);
      const fs = filesStore();
      const { blobs } = await fs.list({ prefix: `file:${projectId}:` });
      for (const b of blobs) await fs.delete(b.key);
      return response({ ok: true });
    }

    return response({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("Projects error:", e);
    return response({ error: "Project request failed.", detail: e.message }, 500);
  }
};
