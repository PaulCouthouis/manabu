import path from "node:path"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [tanstackStart({ srcDirectory: "app" })],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
      "styled-system": path.resolve(__dirname, "styled-system"),
    },
  },
})
