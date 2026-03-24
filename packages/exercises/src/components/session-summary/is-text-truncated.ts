export interface Measurable {
  readonly scrollWidth: number
  readonly clientWidth: number
}

export function isTextTruncated(element: Measurable): boolean {
  return element.scrollWidth > element.clientWidth
}
