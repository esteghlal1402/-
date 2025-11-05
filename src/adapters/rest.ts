import express from "express";
import type { BotEngine } from "../core/types";

export function createRestServer(engine: BotEngine) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/commands", (_req, res) => {
    res.json(engine.listCommands());
  });

  app.post("/api/command", async (req, res) => {
    const { input } = req.body ?? {};
    if (!input || typeof input !== "string") {
      res.status(400).json({ error: "input باید رشته باشد" });
      return;
    }
    const result = await engine.handleText(input);
    res.json(result);
  });

  return app;
}
