import readline from "readline";
import { BotEngine } from "../core/types";

export async function createCli(engine: BotEngine): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "» " });
  // eslint-disable-next-line no-console
  console.log("Bot CLI آماده است. برای خروج 'exit' را وارد کنید.");
  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (input.toLowerCase() === "exit") {
      rl.close();
      return;
    }
    const res = await engine.handleText(input);
    if (res.error) {
      // eslint-disable-next-line no-console
      console.error(res.error);
    } else if (res.text) {
      // eslint-disable-next-line no-console
      console.log(res.text);
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(res.data ?? {}, null, 2));
    }
    rl.prompt();
  });

  await new Promise<void>((resolve) => rl.on("close", () => resolve()));
}
