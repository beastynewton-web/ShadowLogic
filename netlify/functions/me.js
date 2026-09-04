import { response, requireUser } from "./_lib.js";
export default async (req) => {
  const user = await requireUser(req);
  if (!user) return response({ error: "Not signed in" }, 401);
  return response({ user });
};
