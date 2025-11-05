import { LLMProvider } from "../../core/types";

export function createOpenAIChatProvider(options: { apiKey: string; model?: string }): LLMProvider {
  const model = options.model ?? "gpt-4o-mini";
  let _clientPromise: Promise<any> | null = null;

  function getClient(): Promise<any> {
    if (!_clientPromise) {
      _clientPromise = (async () => {
        const mod = await import("openai");
        const OpenAI = (mod as any).default ?? mod;
        return new OpenAI({ apiKey: options.apiKey });
      })();
    }
    return _clientPromise;
  }

  return {
    name: "openai",
    async generate(prompt: string, _options?: { system?: string }) {
      const client = await getClient();
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: _options?.system ?? "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      });
      return res.choices?.[0]?.message?.content ?? "";
    },
  };
}
