import { SimpleBotEngine } from "./core/engine";
import { loadConfig } from "./utils/config";
import { createJsonStoreFactory } from "./utils/store";
import { createCli } from "./adapters/cli";
import { createRestServer } from "./adapters/rest";
import { createOpenAIChatProvider } from "./providers/llm/openai";
import { helpPlugin } from "./plugins/help";
import { echoPlugin } from "./plugins/echo";
import { timePlugin } from "./plugins/time";
import { calcPlugin } from "./plugins/calc";
import { todoPlugin } from "./plugins/todo";
import { webSearchPlugin } from "./plugins/websearch";
import { scrapePlugin } from "./plugins/scrape";
import { llmPlugin } from "./plugins/llm";

async function main() {
  const config = loadConfig();

  const llm = config.openaiApiKey ? createOpenAIChatProvider({ apiKey: config.openaiApiKey, model: config.openaiModel }) : undefined;

  const engine = new SimpleBotEngine({
    config,
    llm,
    http: globalThis.fetch as unknown as typeof fetch,
    getJsonStore: createJsonStoreFactory(config.dataDir),
  });

  await engine.registerPlugin(helpPlugin);
  await engine.registerPlugin(echoPlugin);
  await engine.registerPlugin(timePlugin);
  await engine.registerPlugin(calcPlugin);
  await engine.registerPlugin(todoPlugin);
  await engine.registerPlugin(webSearchPlugin);
  await engine.registerPlugin(scrapePlugin);
  await engine.registerPlugin(llmPlugin);

  const mode = process.argv[2] || process.env.BOT_MODE || "cli";
  if (mode === "server") {
    const app = createRestServer(engine);
    const port = config.port;
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`REST server listening on http://localhost:${port}`);
    });
  } else {
    await createCli(engine);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
