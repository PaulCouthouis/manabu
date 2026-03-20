import path from "node:path"
import { fileURLToPath } from "node:url"
import type { StorybookConfig } from "@storybook/react-vite"

const dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: "@storybook/react-vite",
  viteFinal(config) {
    config.resolve ??= {}
    config.resolve.alias ??= {}
    Object.assign(config.resolve.alias, {
      "styled-system": path.resolve(dirname, "../styled-system"),
      "@": path.resolve(dirname, "../src"),
    })
    return config
  },
}
export default config
