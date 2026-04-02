import { Array } from "effect"
import { Grid } from "styled-system/jsx"
import { Button } from "@manabu/ui"

export interface ChoicesQCMProps {
  readonly choices: ReadonlyArray<string>
  readonly onSelect: (choice: string) => void
}

export function ChoicesQCM(props: ChoicesQCMProps) {
  return (
    <Grid columns={2} gap="4" width="100%" maxWidth="400px">
      {Array.map(props.choices, (choice) => {
        return (
          <Button
            key={choice}
            variant="solid"
            colorPalette="accent"
            size="xl"
            onClick={() => {
              props.onSelect(choice)
            }}
          >
            {choice}
          </Button>
        )
      })}
    </Grid>
  )
}
