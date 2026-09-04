import { response } from "./_lib.js";

export default async () => {
  const jwt = process.env.SHADOW_JWT_SECRET || "";
  const setup = process.env.SHADOW_SETUP_KEY || "";
  return response({
    ok: true,
    service: "Shadow Logic",
    jwtConfigured: jwt.length >= 32,
    setupKeyConfigured: setup.length > 0,
    runnerConfigured: Boolean(process.env.SHADOW_RUNNER_URL && process.env.SHADOW_RUNNER_TOKEN)
  });
};
