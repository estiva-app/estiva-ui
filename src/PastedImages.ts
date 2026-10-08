import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/** As much of a `DataTransfer` as the paste reads. */
export interface ClipboardSource {
  files?: ArrayLike<File> | null
  getData(format: string): string
}

/** MIME type → the extension a pasted picture is named with. */
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/svg+xml': 'svg',
}

/** Names a browser invents for a clipboard picture. A made-up one is better. */
const GENERIC_STEMS = new Set(['image', 'blob', 'unknown', 'untitled', 'screenshot'])

/*
  An unlisted type keeps its own subtype rather than becoming `png`, so a
  picture the app does not accept is refused by the app's own message instead
  of arriving disguised as one it does.
*/
function extensionFor(contentType: string): string {
  const type = contentType.toLowerCase()
  return IMAGE_EXTENSIONS[type] ?? type.split('/')[1]?.split('+')[0] ?? 'png'
}

/** `'Screenshot 2026-09-07 14-32-05.png'`: sortable, and readable on a file card. */
export function pastedImageName(contentType: string, at: Date = new Date(), index = 0): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp =
    `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ` +
    `${pad(at.getHours())}-${pad(at.getMinutes())}-${pad(at.getSeconds())}`
  const nth = index > 0 ? ` (${index + 1})` : ''
  return `Screenshot ${stamp}${nth}.${extensionFor(contentType)}`
}

/** A real filename is kept; `image.png`, `blob` and '' are not names. */
function hasUsableName(name: string): boolean {
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return false
  return !GENERIC_STEMS.has(name.slice(0, dot).toLowerCase())
}

/**
 * The pictures on the clipboard, named — `[]` when there is nothing to attach.
 *
 * **Text wins.** A copy from a spreadsheet or a document puts a rendered
 * picture of the selection beside the text; attaching the picture instead of
 * pasting the text is wrong every time. So a clipboard holding text is left to
 * the editor, and a screenshot, which holds none, lands here. Pictures only:
 * any other file comes through the app's own file picker.
 */
export function pastedImages(source: ClipboardSource | null | undefined, at: Date = new Date()): File[] {
  if (!source) return []
  if (source.getData('text/plain').trim() !== '') return []
  const images = Array.from(source.files ?? []).filter((f) => f.type.toLowerCase().startsWith('image/'))
  let generated = 0
  return images.map((file) =>
    hasUsableName(file.name)
      ? file
      : new File([file], pastedImageName(file.type, at, generated++), { type: file.type, lastModified: file.lastModified }),
  )
}

export interface PastedImagesOptions {
  /**
   * The pictures a paste carried, named. Return `true` when the app took them
   * (an upload started), `false` to let the editor paste as it would have —
   * for a box that cannot upload right now.
   */
  onImages: (files: File[]) => boolean
}

/**
 * Pasting a picture attaches it: a screenshot pasted into the editor reaches
 * the app as named files, the way the app's own file picker would hand them.
 * Text on the clipboard wins (see {@link pastedImages}).
 */
export const PastedImages = Extension.create<PastedImagesOptions>({
  name: 'pastedImages',
  addOptions() {
    return { onImages: () => false }
  },
  addProseMirrorPlugins() {
    const options = this.options
    return [
      new Plugin({
        key: new PluginKey('pastedImages'),
        props: {
          handlePaste: (_view, event) => {
            const files = pastedImages(event.clipboardData)
            return files.length > 0 && options.onImages(files)
          },
        },
      }),
    ]
  },
})
