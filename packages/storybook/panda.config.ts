import { defineConfig } from "@pandacss/dev"
import { createPreset } from "@park-ui/panda-preset"
import jade from "@park-ui/panda-preset/colors/jade"
import sage from "@park-ui/panda-preset/colors/sage"

export default defineConfig({
  preflight: true,
  presets: [createPreset({ accentColor: jade, grayColor: sage, radius: "sm" })],
  include: ["../ui/src/**/*.{ts,tsx}", "../exercises/src/**/*.{ts,tsx}"],
  jsxFramework: "react",
  outdir: "styled-system",
})
