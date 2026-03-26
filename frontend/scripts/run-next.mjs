import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const projectRootEnv = resolve(process.cwd(), "..", ".env");
const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const args = process.argv.slice(2);
const command = args[0];
const shouldCleanNext = process.env.ENROLL_CLEAN_NEXT === "1";
const envArgs = existsSync(projectRootEnv) ? ["--env-file", projectRootEnv] : [];

if (command === "dev" && shouldCleanNext) {
  const nextDir = resolve(process.cwd(), ".next");

  if (existsSync(nextDir)) {
    try {
      rmSync(nextDir, { recursive: true, force: true });
      console.log("[dev] Cleared frontend/.next cache");
    } catch (error) {
      console.warn("[dev] Could not clear .next cache:", error instanceof Error ? error.message : error);
    }
  }
}

const child = spawn(process.execPath, [...envArgs, nextBin, ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
