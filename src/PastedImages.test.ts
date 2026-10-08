// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { PastedImages, pastedImageName, pastedImages, type ClipboardSource } from './PastedImages'

const AT = new Date(2026, 8, 7, 14, 32, 5) // 2026-09-07 14:32:05, local

/** A clipboard as the paste sees it. */
function clipboard(text: string, files: File[] = []): ClipboardSource {
  return { files, getData: (format) => (format === 'text/plain' ? text : '') }
}

const png = (name = 'image.png', type = 'image/png') => new File([new Uint8Array([1, 2, 3])], name, { type })

describe('pastedImages', () => {
  it('names a screenshot after the moment it was pasted', () => {
    expect(pastedImageName('image/png', AT)).toBe('Screenshot 2026-09-07 14-32-05.png')
    expect(pastedImageName('image/jpeg', AT)).toBe('Screenshot 2026-09-07 14-32-05.jpg')
    expect(pastedImageName('image/png', AT, 1)).toBe('Screenshot 2026-09-07 14-32-05 (2).png')
  })

  it('gives an unlisted picture its own extension, so the app can refuse it by name', () => {
    expect(pastedImageName('image/tiff', AT)).toBe('Screenshot 2026-09-07 14-32-05.tiff')
  })

  it('attaches a screenshot, renamed, its bytes and type kept', () => {
    const [file] = pastedImages(clipboard('', [png()]), AT)
    expect(file.name).toBe('Screenshot 2026-09-07 14-32-05.png')
    expect(file.type).toBe('image/png')
    expect(file.size).toBe(3)
  })

  it('leaves the clipboard to the editor when it carries text', () => {
    expect(pastedImages(clipboard('Q3 revenue\t120', [png()]), AT)).toEqual([])
    expect(pastedImages(clipboard('   ', [png()]), AT)).toHaveLength(1)
  })

  it('keeps a real filename', () => {
    const [file] = pastedImages(clipboard('', [png('quarterly-chart.png')]), AT)
    expect(file.name).toBe('quarterly-chart.png')
  })

  it('names several pictures in one paste apart', () => {
    const files = pastedImages(clipboard('', [png(), png(), png('kept.png')]), AT)
    expect(files.map((f) => f.name)).toEqual(['Screenshot 2026-09-07 14-32-05.png', 'Screenshot 2026-09-07 14-32-05 (2).png', 'kept.png'])
  })

  it('ignores anything that is not a picture, and an empty clipboard', () => {
    const pdf = new File([new Uint8Array([1])], 'report.pdf', { type: 'application/pdf' })
    expect(pastedImages(clipboard('', [pdf]), AT)).toEqual([])
    expect(pastedImages(clipboard(''), AT)).toEqual([])
    expect(pastedImages(null, AT)).toEqual([])
  })
})

describe('PastedImages', () => {
  /** A paste event as ProseMirror hands it to `handlePaste`. */
  const paste = (editor: Editor, data: ClipboardSource) => {
    const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent
    Object.defineProperty(event, 'clipboardData', { value: data })
    let handled = false
    editor.view.someProp('handlePaste', (f) => (handled = !!f(editor.view, event, editor.state.doc.slice(0, 0)) || handled))
    return handled
  }

  it('hands a pasted screenshot to the app, named, and stops the editor pasting it', () => {
    const onImages = vi.fn(() => true)
    const editor = new Editor({ extensions: [StarterKit, PastedImages.configure({ onImages })] })
    expect(paste(editor, clipboard('', [png()]))).toBe(true)
    expect(onImages).toHaveBeenCalledWith([expect.objectContaining({ name: expect.stringMatching(/^Screenshot .*\.png$/) })])
    editor.destroy()
  })

  it('lets the editor paste when the app declines, or when there is text', () => {
    const onImages = vi.fn(() => false)
    const editor = new Editor({ extensions: [StarterKit, PastedImages.configure({ onImages })] })
    expect(paste(editor, clipboard('', [png()]))).toBe(false)
    expect(paste(editor, clipboard('a sentence', [png()]))).toBe(false)
    expect(onImages).toHaveBeenCalledTimes(1)
    editor.destroy()
  })
})
