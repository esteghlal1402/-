import { Plugin } from "../core/types";

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to fetch: ${res.status}`);
  return await res.text();
}

function extractText(html: string): string {
  // remove scripts/styles and tags to get rough text
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const text = noScript.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, 5000);
}

export const scrapePlugin: Plugin = {
  name: "scrape",
  description: "اسکرپ ساده صفحات وب",
  commands: [
    {
      name: "scrape",
      usage: "scrape <url>",
      description: "دریافت متن خام از یک آدرس",
      async handler(args) {
        const url = args.trim();
        if (!url) return { error: "آدرس را وارد کنید" };
        try {
          const html = await fetchText(url);
          const text = extractText(html);
          return { text, data: { length: text.length } };
        } catch (e: any) {
          return { error: e?.message ?? "خطای اسکرپ" };
        }
      },
    },
  ],
};
