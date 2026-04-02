import { defineKeyframes } from "@pandacss/dev"

export const rewardKeyframes = defineKeyframes({
  rewardReveal: {
    "0%": { opacity: "0", transform: "scale(0.5)" },
    "40%": { opacity: "1", transform: "scale(1.05)" },
    "60%": { transform: "scale(1)" },
    "100%": { transform: "scale(1)" },
  },
  rewardGlow: {
    "0%": { boxShadow: "0 0 0 0 var(--colors-jade-7)" },
    "50%": { boxShadow: "0 0 32px 12px var(--colors-jade-7)" },
    "100%": { boxShadow: "0 0 0 0 var(--colors-jade-7)" },
  },
})
