import { Plugin } from "../core/types";

export const echoPlugin: Plugin = {
  name: "echo",
  description: "تکرار متن ورودی",
  commands: [
    {
      name: "echo",
      description: "اکوی متن داده شده",
      usage: "echo <text>",
      async handler(args) {
        return { text: args || "" };
      },
    },
  ],
};
