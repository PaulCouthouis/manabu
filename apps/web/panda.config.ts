import { defineConfig } from "@pandacss/dev"
import { createPreset } from "@park-ui/panda-preset"
import jade from "@park-ui/panda-preset/colors/jade"
import sage from "@park-ui/panda-preset/colors/sage"
import { absoluteCenter } from "../../packages/ui/src/theme/recipes/absolute-center"
import { group } from "../../packages/ui/src/theme/recipes/group"

export default defineConfig({
	preflight: true,
	presets: [createPreset({ accentColor: jade, grayColor: sage, radius: "sm" })],
	include: [
		"./app/**/*.{ts,tsx}",
		"../../packages/ui/src/**/*.{ts,tsx}",
	],
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
