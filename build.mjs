import fs from "node:fs";
fs.rmSync("dist", { recursive: true, force: true });
fs.cpSync("public", "dist", { recursive: true });
console.log("Shadow Logic build complete.");
