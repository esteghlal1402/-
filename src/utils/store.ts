import fs from "fs/promises";
import path from "path";
import { JsonStore } from "../core/types";

export function createJsonStoreFactory(baseDir: string) {
  return function getJsonStore<T = unknown>(name: string): JsonStore<T> {
    const filePath = path.join(baseDir, `${name}.json`);

    async function readFile(): Promise<T> {
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        return JSON.parse(raw) as T;
      } catch (err: any) {
        if (err?.code === "ENOENT") {
          return {} as T;
        }
        throw err;
      }
    }

    async function writeFile(value: T): Promise<void> {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      const data = JSON.stringify(value, null, 2);
      await fs.writeFile(filePath, data, "utf-8");
    }

    return {
      getAll: readFile,
      setAll: writeFile,
    };
  };
}
