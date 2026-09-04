import fs from "node:fs";

const staticFiles = [
  "index.html",
  "setup.html",
  "project.html",
  "styles.css",
  "app.js",
  "project.js",
];

const functionFiles = [
  "_lib.js",
  "files.js",
  "health.js",
  "login.js",
  "logout.js",
  "logs.js",
  "me.js",
  "projects.js",
  "run.js",
  "setup-status.js",
  "setup.js",
  "stop.js",
];

fs.rmSync("dist", { recursive: true, force: true });
fs.rmSync("netlify/functions", { recursive: true, force: true });
fs.mkdirSync("dist", { recursive: true });
fs.mkdirSync("netlify/functions", { recursive: true });

for (const file of staticFiles) {
  fs.copyFileSync(file, `dist/${file}`);
}

for (const file of functionFiles) {
  fs.copyFileSync(file, `netlify/functions/${file}`);
}

console.log("Shadow Logic build complete.");
