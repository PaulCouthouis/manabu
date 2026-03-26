import path from "node:path"
import { fileURLToPath } from "node:url"
import type { StorybookConfig } from "@storybook/react-vite"

const dirname = path.dirname(fileURLToPath(import.meta.url))
const uiDir = path.resolve(dirname, "../../ui")
const exercisesDir = path.resolve(dirname, "../../exercises")

const config: StorybookConfig = {
  stories: [
    "../../ui/src/**/*.mdx",
    "../../ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../exercises/src/**/*.mdx",
    "../../exercises/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: ["@storybook/addon-vitest", "@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  viteFinal(config) {
    config.resolve ??= {}
    config.resolve.alias ??= {}
    Object.assign(config.resolve.alias, {
      "styled-system": path.resolve(uiDir, "styled-system"),
      "@": path.resolve(uiDir, "src"),
      "~": path.resolve(exercisesDir, "src"),
    })
    return config
  },
}
export default config
