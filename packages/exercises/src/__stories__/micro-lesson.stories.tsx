import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Button } from "@manabu/ui"
import { MicroLesson, type MicroLessonProps } from "~/components/micro-lesson/micro-lesson.js"

// --- Story wrapper ---

function MicroLessonStory(props: { readonly content: string }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true)
        }}
      >
        Open Lesson
      </Button>
      <MicroLesson
        content={props.content}
        open={open}
        onClose={() => {
          setOpen(false)
        }}
      />
    </>
  )
}

// --- Meta ---

const meta: Meta<MicroLessonProps> = {
  title: "Exercises/MicroLesson",
  component: MicroLesson,
}
export default meta

type Story = StoryObj<MicroLessonProps>

// --- Content ---

const shortContent = `## は (topic marker)

Marks the **topic** of the sentence — what the sentence is about.

**Example:** 私**は**学生です。(*I* am a student.)
`

const longContent = `## は (topic marker)

Marks the **topic** of the sentence — what the sentence is about.

**Example:** 私**は**学生です。(*I* am a student.)

## が (subject marker)

Marks the **grammatical subject**, especially for new information or emphasis.

**Example:** 雨**が**降っている。(It *is raining*.)

## を (object marker)

Marks the **direct object** of a transitive verb.

**Example:** 本**を**読む。(Read a *book*.)

## に (target / location)

Indicates **direction**, **time**, or **location of existence**.

**Example:** 東京**に**行く。(Go *to Tokyo*.)

## で (means / place of action)

Indicates **where an action takes place** or the **means** by which it is done.

**Example:** 図書館**で**勉強する。(Study *at the library*.)

## へ (direction)

Indicates **direction of movement**, similar to に but more abstract.

**Example:** 日本**へ**行きたい。(I want to go *to Japan*.)

## と (and / with / quotation)

Used to **list items**, indicate a **companion**, or **quote speech**.

**Example:** 友達**と**映画を見た。(Watched a movie *with* a friend.)

## も (also)

Replaces は/が/を to mean **"also"** or **"too"**.

**Example:** 私**も**行きたい。(*I also* want to go.)

## の (possession / nominalization)

Indicates **possession** or turns a clause into a noun.

**Example:** 私**の**本。(*My* book.)

## か (question)

Marks a **question** at the end of a sentence.

**Example:** これは何です**か**。(What is this?)
`

// --- Stories ---

export const MicroLesson_Short: Story = {
  name: "Short content (no scroll)",
  render: () => {
    return <MicroLessonStory content={shortContent} />
  },
}

export const MicroLesson_Long: Story = {
  name: "Long content (scroll)",
  render: () => {
    return <MicroLessonStory content={longContent} />
  },
}
