import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { AppConfig } from "../core/types";

dotenv.config();

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function loadConfig(): AppConfig {
  const port = Number(process.env.PORT ?? 3000);
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
  ensureDir(dataDir);

  return {
    port,
    nodeEnv,
    dataDir,
    openaiApiKey: process.env.OPENAI_API_KEY || undefined,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    serpApiKey: process.env.SERP_API_KEY || undefined,
  };
}
