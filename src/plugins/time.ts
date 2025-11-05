import { Plugin } from "../core/types";

export const timePlugin: Plugin = {
  name: "time",
  description: "نمایش زمان فعلی",
  commands: [
    {
      name: "time",
      description: "زمان فعلی را نمایش می‌دهد",
      async handler() {
        const now = new Date();
        return { text: now.toLocaleString("fa-IR") };
      },
    },
  ],
};
