import { Plugin } from "../core/types";

async function searchDuckDuckGo(query: string): Promise<string[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const html = await res.text();
  const links = Array.from(html.matchAll(/<a[^>]+class=\"result__a\"[^>]*>(.*?)<\/a>/g)).map((m) => m[1])
    .slice(0, 5)
    .map((t) => t.replace(/<[^>]+>/g, ""));
  return links;
}

export const webSearchPlugin: Plugin = {
  name: "websearch",
  description: "جستجوی وب (DuckDuckGo HTML)",
  commands: [
    {
      name: "search",
      usage: "search <query>",
      description: "جستجو در وب و بازگرداندن عناوین",
      async handler(args) {
        const q = args.trim();
        if (!q) return { error: "عبارت جستجو را وارد کنید" };
        try {
          const results = await searchDuckDuckGo(q);
          if (!results.length) return { text: "نتیجه‌ای یافت نشد" };
          return { text: results.map((t, i) => `${i + 1}. ${t}`).join("\n"), data: results };
        } catch (e: any) {
          return { error: e?.message ?? "خطای جستجو" };
        }
      },
    },
  ],
};
