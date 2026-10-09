/** The editor's code block, coloured by language like RichText's (`@estiva-app/ui/editor`). */
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { lowlight } from './codeColours'

/*
  The editor library guesses a language for a block that names none, or names
  one it does not know, and colours it by the guess. RichText never guesses, so
  that block was coloured while written and plain once read. A block is
  coloured only by the language it names, while written and when read
  (Katerina, 9 October: never guess).
*/
const namedOnly = {
  highlight: (language: string, value: string) => lowlight().highlight(language, value),
  highlightAuto: (value: string) => ({ type: 'root' as const, children: [{ type: 'text' as const, value }], data: { language: undefined, relevance: 0 } }),
  listLanguages: () => lowlight().listLanguages(),
  registered: (language: string) => lowlight().registered(language),
}

/**
 * A code block in the editor, with the colours RichText reads it in (Katerina,
 * 9 October): the same highlight.js languages, the same classes, and the
 * editor's root wears `richTextClassName`, which colours them.
 *
 * It replaces the starter kit's code block: `StarterKit.configure({ codeBlock: false })`,
 * then add `CodeBlockColours`. The block keeps its name, `codeBlock`, and its
 * `language` attribute, so nothing already written changes.
 */
export const CodeBlockColours = CodeBlockLowlight.configure({ lowlight: namedOnly })
