const WORD_MAX_LENGTH = 4

export function isSentence(text: string): boolean {
  return text.length > WORD_MAX_LENGTH
}
