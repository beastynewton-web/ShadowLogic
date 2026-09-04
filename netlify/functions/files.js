import { response, requireUser, filesStore, projectsStore, safePath } from "./_lib.js";

export default async (req) => {
  const user = await requireUser(req);
  if (!user) return response({ error: "Unauthorized" }, 401);

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) return response({ error: "projectId required" }, 400);

    const project = await projectsStore().get("project:" + projectId, { type: "json", consistency: "strong" });
    if (!project) return response({ error: "Project not found" }, 404);

    const store = filesStore();

    if (req.method === "GET") {
      const requested = url.searchParams.get("path");
      if (requested) {
        const path = safePath(requested);
        if (!path) return response({ error: "Invalid path" }, 400);
        const content = await store.get(`file:${projectId}:${path}`, { type: "text", consistency: "strong" });
        if (content === null) return response({ error: "File not found" }, 404);
        return response({ path, content });
      }
      const { blobs } = await store.list({ prefix: `file:${projectId}:` });
      const names = blobs.map(b => b.key.slice(`file:${projectId}:`.length)).sort();
      return response({ files: names });
    }

    if (req.method === "PUT") {
      const body = await req.json().catch(() => ({}));
      const path = safePath(body.path);
      if (!path) return response({ error: "Invalid path" }, 400);
      const content = String(body.content ?? "");
      if (new TextEncoder().encode(content).length > 1024 * 1024) {
        return response({ error: "File too large. Maximum 1 MiB in this starter." }, 413);
      }
      await store.set(`file:${projectId}:${path}`, content);
      project.updatedAt = new Date().toISOString();
      await projectsStore().setJSON("project:" + projectId, project);
      return response({ ok: true, path });
    }

    if (req.method === "DELETE") {
      const path = safePath(url.searchParams.get("path"));
      if (!path) return response({ error: "Invalid path" }, 400);
      await store.delete(`file:${projectId}:${path}`);
      return response({ ok: true });
    }

    return response({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("Files error:", e);
    return response({ error: "File request failed.", detail: e.message }, 500);
  }
};
