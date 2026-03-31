import { Flag, Send } from "lucide-react"
import React, { useCallback, useState } from "react"
import { styled } from "styled-system/jsx"
import { IconButton, Input, Tooltip } from "@manabu/ui"

export interface TextSubmitInputProps {
  readonly onSubmit: (text: string) => void
  readonly onSkip?: () => void
  readonly placeholder?: string
  readonly disabled?: boolean
}

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "2",
    width: "100%",
  },
})

function isBlank(text: string): boolean {
  return text.trim() === ""
}

export function TextSubmitInput(props: TextSubmitInputProps) {
  const [text, setText] = useState("")
  const canSubmit = !isBlank(text) && !props.disabled

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (trimmed === "" || props.disabled) {
      return
    }
    props.onSubmit(trimmed)
    setText("")
  }, [text, props.disabled, props.onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <Container>
      {props.onSkip !== undefined && (
        <Tooltip content="Skip">
          <IconButton
            variant="outline"
            height="48px"
            aria-label="Skip"
            disabled={props.disabled}
            onClick={props.onSkip}
          >
            <Flag />
          </IconButton>
        </Tooltip>
      )}
      <Input
        flex="1"
        height="48px"
        placeholder={props.placeholder ?? "Type your answer..."}
        autoFocus
        enterKeyHint="send"
        disabled={props.disabled}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
        }}
        onKeyDown={handleKeyDown}
      />
      <IconButton
        variant="outline"
        height="48px"
        aria-label="Submit"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        <Send />
      </IconButton>
    </Container>
  )
}
