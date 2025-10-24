export type CommandHandler = (args: string, context: BotContext) => Promise<CommandResult>;

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage?: string;
  handler: CommandHandler;
}

export interface Plugin {
  name: string;
  description: string;
  commands: Command[];
  onRegister?: (engine: BotEngine) => void | Promise<void>;
}

export interface CommandResult<T = unknown> {
  text?: string;
  data?: T;
  error?: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  dataDir: string;
  openaiApiKey?: string;
  openaiModel?: string;
  serpApiKey?: string;
}

export interface LLMProvider {
  name: string;
  generate: (prompt: string, options?: { system?: string }) => Promise<string>;
}

export interface BotContext {
  engine: BotEngine;
  config: AppConfig;
  llm?: LLMProvider;
  http: typeof fetch;
  stores: {
    getJsonStore: (name: string) => JsonStore<unknown>;
  };
}

export interface JsonStore<T> {
  getAll: () => Promise<T>;
  setAll: (value: T) => Promise<void>;
}

export interface BotEngineOptions {
  config: AppConfig;
  llm?: LLMProvider;
  http: typeof fetch;
  getJsonStore: (name: string) => JsonStore<unknown>;
}

export interface BotEngine {
  registerPlugin: (plugin: Plugin) => Promise<void>;
  handleText: (input: string) => Promise<CommandResult>;
  listCommands: () => { name: string; description: string; usage?: string; plugin: string }[];
}
