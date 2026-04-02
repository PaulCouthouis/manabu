import { defineConfig } from "@pandacss/dev"
import { createPreset } from "@park-ui/panda-preset"
import jade from "@park-ui/panda-preset/colors/jade"
import sage from "@park-ui/panda-preset/colors/sage"
import { dialog } from "../ui/src/theme/recipes/dialog"
import { rewardKeyframes } from "../ui/src/theme/keyframes"
import { spinner } from "../ui/src/theme/recipes/spinner"

export default defineConfig({
  preflight: true,
  presets: [createPreset({ accentColor: jade, grayColor: sage, radius: "sm" })],
  include: ["../ui/src/**/*.{ts,tsx}", "../exercises/src/**/*.{ts,tsx}"],
  jsxFramework: "react",
  outdir: "styled-system",
  theme: {
    extend: {
      keyframes: rewardKeyframes,
      recipes: {
        spinner,
      },
      slotRecipes: {
        dialog,
      },
    },
  },
})
