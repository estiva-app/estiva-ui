import { createElement, type ReactNode } from 'react'
import { common, createLowlight } from 'lowlight'

/**
 * Colours inside a code block, by language (Katerina, 9 October).
 *
 * highlight.js reads the code and names each word (a keyword, a string, a
 * comment); RichText's class list gives each name its colour from the theme's
 * `syntax-*` tokens. The same instance colours the editor's code block
 * (`CodeBlockColours`), so what is written looks the same as what is read.
 *
 * `common` is highlight.js's 37 everyday languages. A language outside them, or
 * none, leaves the code in one colour.
 */
export const lowlight = createLowlight(common)

interface HastNode {
  type: string
  value?: string
  properties?: { className?: string[] }
  children?: HastNode[]
}

function draw(node: HastNode, key: number): ReactNode {
  if (node.type === 'text') return node.value
  return createElement('span', { key, className: node.properties?.className?.join(' ') }, (node.children ?? []).map(draw))
}

/** The code, its words wrapped in highlight.js's classes; the text as it is when the language is unknown. */
export function codeColours(text: string, language?: string): ReactNode {
  if (!language || !lowlight.registered(language)) return text
  return (lowlight.highlight(language, text).children as HastNode[]).map(draw)
}
