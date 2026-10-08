/** The editor's code block, coloured by language like RichText's (`@estiva-app/ui/editor`). */
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { lowlight } from './codeColours'

/**
 * A code block in the editor, with the colours RichText reads it in (Katerina,
 * 9 October): the same highlight.js languages, the same classes, and the
 * editor's root wears `richTextClassName`, which colours them.
 *
 * It replaces the starter kit's code block: `StarterKit.configure({ codeBlock: false })`,
 * then add `CodeBlockColours`. The block keeps its name, `codeBlock`, and its
 * `language` attribute, so nothing already written changes.
 */
export const CodeBlockColours = CodeBlockLowlight.configure({ lowlight })
