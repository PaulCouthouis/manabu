import { styled } from "styled-system/jsx"

export const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100dvh",
    overflow: "hidden",
  },
})

export const ExerciseZone = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  variants: {
    gap: {
      "6": { gap: "6" },
    },
  },
})

export const TranscriptText = styled("span", {
  base: {
    fontSize: "2xl",
    color: "fg.muted",
    fontStyle: "italic",
    textAlign: "center",
  },
})

export const SuccessOverlay = styled("div", {
  base: {
    position: "absolute",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bg: "transparent",
    color: "colorPalette.11",
    colorPalette: "accent",
  },
})

export const AcceptedTranscript = styled("span", {
  base: {
    position: "absolute",
    bottom: "4",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "lg",
    color: "colorPalette.11",
    colorPalette: "accent",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
})

export const StimulusGroup = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
})

export const FeedbackOverlay = styled("div", {
  base: {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2",
    pt: "4",
    whiteSpace: "nowrap",
  },
})

export const MeaningText = styled("span", {
  base: {
    fontSize: "3xl",
    fontWeight: "semibold",
    textAlign: "center",
    lineHeight: "relaxed",
    px: "4",
  },
})

export const RewardWord = styled("span", {
  base: {
    fontSize: "4xl",
    fontWeight: "bold",
    textAlign: "center",
  },
})

export const RewardSentence = styled("span", {
  base: {
    fontSize: "2xl",
    fontWeight: "medium",
    textAlign: "center",
    lineHeight: "relaxed",
  },
})

export const RecorderWrapper = styled("div", {
  base: {
    width: "100%",
  },
})
