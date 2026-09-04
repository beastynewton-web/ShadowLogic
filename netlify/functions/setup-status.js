import { response, usersStore } from "./_lib.js";
export default async () => {
  try {
    const owner = await usersStore().get("owner", { type: "json", consistency: "strong" });
    return response({ ownerExists: Boolean(owner) });
  } catch (e) {
    return response({ error: "Could not read owner storage", detail: e.message }, 500);
  }
};
