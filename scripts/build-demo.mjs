import { spawnSync } from "node:child_process";
const run = (args) => {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: { ...process.env, VITE_DEMO_MODE: "true" },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run(["scripts/build-licenses.mjs"]);
run(["node_modules/typescript/bin/tsc", "--noEmit"]);
run(["node_modules/vite/bin/vite.js", "build", "--outDir", "../../dist-demo"]);
