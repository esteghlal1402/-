import { Plugin } from "../core/types";

export const helpPlugin: Plugin = {
  name: "help",
  description: "نمایش راهنما و دستورات",
  commands: [
    {
      name: "help",
      aliases: ["?"],
      description: "نمایش لیست دستورات یا راهنمای یک دستور",
      usage: "help [command]",
      async handler(args, ctx) {
        const q = args.trim();
        const items = ctx.engine.listCommands();
        if (!q) {
          const lines = [
            "دستورات موجود:",
            ...items.map((c) => `- ${c.name}: ${c.description}${c.usage ? ` (استفاده: ${c.usage})` : ""}`),
          ];
          return { text: lines.join("\n") };
        }
        const found = items.find((c) => c.name === q);
        if (!found) return { error: `دستور '${q}' یافت نشد.` };
        return { text: `${found.name}: ${found.description}${found.usage ? `\nاستفاده: ${found.usage}` : ""}` };
      },
    },
  ],
};
