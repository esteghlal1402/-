import { Plugin } from "../core/types";

function safeCalc(expression: string): number {
  // Very limited safe evaluator - supports + - * / ( ) and numbers
  if (!/^[-+*/().\d\s]+$/.test(expression)) {
    throw new Error("عبارت نامعتبر است");
  }
  // eslint-disable-next-line no-new-func
  const fn = new Function(`return (${expression})`);
  const result = fn();
  if (typeof result !== "number" || !isFinite(result)) {
    throw new Error("نتیجه نامعتبر است");
  }
  return result;
}

export const calcPlugin: Plugin = {
  name: "calc",
  description: "ماشین حساب ساده",
  commands: [
    {
      name: "calc",
      aliases: ["=", "calcus"],
      usage: "calc <expression>",
      description: "محاسبه یک عبارت ریاضی ساده",
      async handler(args) {
        const expr = args.trim();
        if (!expr) return { error: "عبارت را وارد کنید" };
        try {
          const value = safeCalc(expr);
          return { text: String(value), data: { value } };
        } catch (e: any) {
          return { error: e?.message ?? "خطای محاسبه" };
        }
      },
    },
  ],
};
