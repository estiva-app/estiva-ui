// @vitest-environment jsdom
/**
 * CodeBlockColours colours a block only by the language it names, as RichText
 * does when the text is read (Katerina, 9 October: never guess).
 */
import { afterEach, describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { CodeBlockColours } from './CodeBlockColours'

let editor: Editor | undefined
afterEach(() => editor?.destroy())

const coloured = (content: string) => {
  editor = new Editor({ element: document.createElement('div'), extensions: [StarterKit.configure({ codeBlock: false }), CodeBlockColours], content })
  return editor.view.dom.querySelectorAll('pre [class*="hljs-"]').length
}

describe('CodeBlockColours', () => {
  it('colours a block that names its language', () => {
    expect(coloured('<pre><code class="language-ts">const done = items.length</code></pre>')).toBeGreaterThan(0)
  })

  it('leaves a block that names no language in one colour, as RichText reads it', () => {
    expect(coloured('<pre><code>const done = items.length</code></pre>')).toBe(0)
  })

  it('leaves a block in a language it does not know in one colour', () => {
    expect(coloured('<pre><code class="language-nothing">const done = items.length</code></pre>')).toBe(0)
  })

  it('keeps the block a code block, with its language', () => {
    coloured('<pre><code class="language-ts">const done = 1</code></pre>')
    expect(editor!.getJSON().content?.[0]).toMatchObject({ type: 'codeBlock', attrs: { language: 'ts' } })
  })
})
