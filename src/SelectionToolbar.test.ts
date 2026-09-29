// @vitest-environment jsdom
/**
 * The selection toolbar's helpers (UIG-31), carried over with it: how a key is
 * named in a tooltip, and what the address field does to the text. Drawing the
 * strip needs a real selection standing still, which jsdom cannot make; the
 * stories show it in a browser.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { KeptSelection, applyLink, currentLink, normalizeHref } from './SelectionToolbar'
import { shortcutLabel } from './shortcuts'

let editor: Editor

beforeEach(() => {
  editor = new Editor({ extensions: [StarterKit, KeptSelection], content: '<p>read the linked words first</p>' })
})

afterEach(() => {
  editor.destroy()
})

describe('shortcutLabel', () => {
  it('says Cmd on Apple platforms', () => {
    expect(shortcutLabel('Mod-B', true)).toBe('Cmd+B')
    expect(shortcutLabel('Mod-Shift-B', true)).toBe('Cmd+Shift+B')
  })

  it('says Ctrl everywhere else', () => {
    expect(shortcutLabel('Mod-B', false)).toBe('Ctrl+B')
    expect(shortcutLabel('Mod-Shift-B', false)).toBe('Ctrl+Shift+B')
  })

  it('upper-cases a single-character key so Ctrl+b never reaches a tooltip', () => {
    expect(shortcutLabel('Mod-b', false)).toBe('Ctrl+B')
  })
})

describe('the marks the strip can toggle are in a standard editor', () => {
  it.each(['bold', 'italic', 'underline', 'code', 'link'])('%s', (mark) => {
    expect(Object.keys(editor.schema.marks)).toContain(mark)
  })
})

describe('normalizeHref — what typing in the field becomes', () => {
  const cases: Array<[string, string | null]> = [
    ['https://example.com/a/b', 'https://example.com/a/b'],
    ['http://example.com', 'http://example.com'],
    ['mailto:someone@example.com', 'mailto:someone@example.com'],
    ['example.com', 'https://example.com'],
    ['  www.example.com/a?b=c  ', 'https://www.example.com/a?b=c'],
    ['localhost:5173/page', 'https://localhost:5173/page'],
    ['javascript:alert(1)', null],
    ['ftp://files.example.com', null],
    ['two words', null],
    ['', null],
    ['   ', null],
  ]
  it.each(cases)('%j → %j', (raw, href) => {
    expect(normalizeHref(raw)).toBe(href)
  })
})

describe('applyLink — over "linked words" in "read the linked words first"', () => {
  /** The one linked run in the document, or null. */
  const linkOf = (): { text: string; href: string } | null => {
    let found: { text: string; href: string } | null = null
    editor.state.doc.descendants((node) => {
      const link = node.marks.find((m) => m.type.name === 'link')
      if (node.isText && link) found = { text: node.text ?? '', href: link.attrs.href as string }
    })
    return found
  }

  beforeEach(() => {
    editor.commands.setTextSelection({ from: 10, to: 22 })
  })

  it('an address links the selected words, completing a bare host', () => {
    expect(applyLink(editor, 'example.com')).toBe(true)
    expect(linkOf()).toEqual({ text: 'linked words', href: 'https://example.com' })
    expect(currentLink(editor)).toBe('https://example.com')
  })

  it('an empty field removes the link', () => {
    applyLink(editor, 'https://example.com')
    expect(applyLink(editor, '')).toBe(true)
    expect(linkOf()).toBeNull()
    expect(currentLink(editor)).toBe('')
  })

  it('a scheme a reader may not follow is refused, and nothing changes', () => {
    expect(applyLink(editor, 'javascript:alert(1)')).toBe(false)
    expect(linkOf()).toBeNull()
  })

  it('the caret inside a link re-addresses the whole link', () => {
    applyLink(editor, 'https://example.com')
    editor.commands.setTextSelection(15)
    expect(currentLink(editor)).toBe('https://example.com')
    expect(applyLink(editor, 'https://example.org')).toBe(true)
    expect(linkOf()).toEqual({ text: 'linked words', href: 'https://example.org' })
  })
})
