import { Plugin } from "../core/types";

type TodoItem = { id: string; title: string; done: boolean; createdAt: string; updatedAt: string };
interface TodoState { items: TodoItem[] }

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const todoPlugin: Plugin = {
  name: "todo",
  description: "مدیریت کارها (TODO)",
  commands: [
    {
      name: "todo.add",
      aliases: ["todo+"],
      usage: "todo.add <title>",
      description: "افزودن کار جدید",
      async handler(args, ctx) {
        const store = ctx.stores.getJsonStore("todo") as any;
        const state = ((await store.getAll()) as TodoState) || { items: [] };
        const now = new Date().toISOString();
        const item: TodoItem = { id: uid(), title: args.trim(), done: false, createdAt: now, updatedAt: now };
        state.items = [...(state.items || []), item];
        await store.setAll(state);
        return { text: `افزوده شد: ${item.title}`, data: item };
      },
    },
    {
      name: "todo.list",
      aliases: ["todos"],
      description: "نمایش لیست کارها",
      async handler(_args, ctx) {
        const store = ctx.stores.getJsonStore("todo") as any;
        const state = ((await store.getAll()) as TodoState) || { items: [] };
        const lines = (state.items || []).map((t) => `${t.done ? "[x]" : "[ ]"} ${t.title} (#${t.id})`);
        return { text: lines.join("\n") || "چیزی برای نمایش نیست" };
      },
    },
    {
      name: "todo.done",
      usage: "todo.done <id>",
      description: "تکمیل کردن یک آیتم",
      async handler(args, ctx) {
        const id = args.trim();
        const store = ctx.stores.getJsonStore("todo") as any;
        const state = ((await store.getAll()) as TodoState) || { items: [] };
        const item = state.items.find((i) => i.id === id);
        if (!item) return { error: "یافت نشد" };
        item.done = true;
        item.updatedAt = new Date().toISOString();
        await store.setAll(state);
        return { text: `انجام شد: ${item.title}` };
      },
    },
    {
      name: "todo.rm",
      usage: "todo.rm <id>",
      description: "حذف آیتم",
      async handler(args, ctx) {
        const id = args.trim();
        const store = ctx.stores.getJsonStore("todo") as any;
        const state = ((await store.getAll()) as TodoState) || { items: [] };
        const before = state.items.length;
        state.items = state.items.filter((i) => i.id !== id);
        await store.setAll(state);
        return { text: before === state.items.length ? "یافت نشد" : "حذف شد" };
      },
    },
  ],
};
