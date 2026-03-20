import { defineConfig } from "@pandacss/dev"
import { createPreset } from "@park-ui/panda-preset"
import jade from "@park-ui/panda-preset/colors/jade"
import sage from "@park-ui/panda-preset/colors/sage"
import { absoluteCenter } from "./src/theme/recipes/absolute-center"
import { group } from "./src/theme/recipes/group"

export default defineConfig({
	preflight: true,
	presets: [createPreset({ accentColor: jade, grayColor: sage, radius: "sm" })],
	include: ["./src/**/*.{ts,tsx}"],
	jsxFramework: "react",
	outdir: "styled-system",
	theme: {
		extend: {
			recipes: {
				absoluteCenter,
				group,
			},
		},
	},
})
