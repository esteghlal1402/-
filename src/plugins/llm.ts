import { Plugin } from "../core/types";

export const llmPlugin: Plugin = {
  name: "llm",
  description: "دسترسی مستقیم به LLM (اگر پیکربندی شده باشد)",
  commands: [
    {
      name: "ask",
      usage: "ask <prompt>",
      description: "ارسال پرسش مستقیم به LLM",
      async handler(args, ctx) {
        if (!ctx.llm) return { error: "LLM پیکربندی نشده است" };
        const reply = await ctx.llm.generate(args.trim());
        return { text: reply };
      },
    },
  ],
};
