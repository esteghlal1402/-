import { AppConfig, BotContext, BotEngine, BotEngineOptions, Command, CommandResult, Plugin } from "./types";

function tokenize(input: string): { command?: string; args: string } {
  const trimmed = input.trim();
  if (!trimmed) return { args: "" };
  const [first, ...rest] = trimmed.split(/\s+/);
  return { command: first.toLowerCase(), args: rest.join(" ") };
}

export class SimpleBotEngine implements BotEngine {
  private config: AppConfig;
  private llm?: BotEngineOptions["llm"];
  private http: typeof fetch;
  private getJsonStore: BotEngineOptions["getJsonStore"];

  private plugins: Map<string, Plugin> = new Map();
  private commands: Map<string, { plugin: Plugin; command: Command }> = new Map();

  constructor(options: BotEngineOptions) {
    this.config = options.config;
    this.llm = options.llm;
    this.http = options.http;
    this.getJsonStore = options.getJsonStore;
  }

  async registerPlugin(plugin: Plugin): Promise<void> {
    this.plugins.set(plugin.name, plugin);
    for (const cmd of plugin.commands) {
      this.commands.set(cmd.name, { plugin, command: cmd });
      for (const alias of cmd.aliases ?? []) {
        this.commands.set(alias, { plugin, command: cmd });
      }
    }
    await plugin.onRegister?.(this);
  }

  listCommands(): { name: string; description: string; usage?: string; plugin: string }[] {
    const seen = new Set<string>();
    const list: { name: string; description: string; usage?: string; plugin: string }[] = [];
    for (const [name, { plugin, command }] of this.commands) {
      if (seen.has(command.name)) continue;
      seen.add(command.name);
      list.push({ name: command.name, description: command.description, usage: command.usage, plugin: plugin.name });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  async handleText(input: string): Promise<CommandResult> {
    const { command, args } = tokenize(input);

    if (!command) {
      return { text: "دستوری وارد نشده است. 'help' را تایپ کنید." };
    }

    const match = this.commands.get(command);
    if (!match) {
      // fallback to llm if exists
      if (this.llm) {
        const content = await this.llm.generate(input);
        return { text: content };
      }
      return { error: `دستور '${command}' یافت نشد. برای لیست دستورات 'help' را تایپ کنید.` };
    }

    const context: BotContext = {
      engine: this,
      config: this.config,
      llm: this.llm,
      http: this.http,
      stores: {
        getJsonStore: this.getJsonStore as any,
      },
    };

    try {
      return await match.command.handler(args, context);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `خطا: ${message}` };
    }
  }
}
