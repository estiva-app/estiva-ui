import { Extension, type Mark } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import StarterKit from '@tiptap/starter-kit'

/*
 * Links in the kit's editors: a URL pasted over words, the link mark that holds
 * it, and a bare address drawn as a link. `CommentBox` and `DocumentEditor`
 * share the paste and the mark's end, so a link on words is made the same way
 * wherever it is written.
 */

/** A link a message can carry on words, `[words](url)`: no `)` and no space in it (conversation's `composerText`). */
const LINK_ON_WORDS_TARGET = /^https?:\/\/[^\s)]+$/

/**
 * A URL pasted over words links them, as in Peek, when the message can carry
 * them as a link on words: plain words on one line, no chip, no line break, no
 * bracket, no code. Otherwise the words stay and the URL goes in after them,
 * so neither is lost. Ahead of StarterKit's own link-on-paste.
 */
export const PasteOverWords = Extension.create({
  name: 'commentBoxPasteOverWords',
  priority: 1001,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('commentBoxPasteOverWords'),
        props: {
          handlePaste: (view, event) => {
            // A URL copied with the end of its sentence names what it names without it, as LinkChips reads one.
            const url = (event.clipboardData?.getData('text/plain').trim() ?? '').replace(/[.,;:!?]+$/, '')
            const { state } = view
            const { schema } = state
            if (state.selection.empty || !schema.marks.link || !/^https?:\/\/\S+$/.test(url)) return false
            // Select-all spans the document itself: read it as the text it holds.
            const { $from, $to, from, to } = TextSelection.between(state.selection.$from, state.selection.$to)
            let plain = $from.sameParent($to) && $from.parent.isTextblock && !$from.parent.type.spec.code
            state.doc.nodesBetween(from, to, (node) => {
              // A quote or a list around the line holds it, and is not in the words: look inside.
              if (!node.isInline) return true
              if (!node.isText || node.marks.some((m) => m.type.spec.code || m.type.name === 'code')) plain = false
              return false
            })
            if (plain && LINK_ON_WORDS_TARGET.test(url) && !/[[\]\n]/.test(state.doc.textBetween(from, to))) {
              // The caret goes after the link: left selected, the words open the selection strip's Link field,
              // which takes focus and the next Enter, so a box needed two to send (COMM-8).
              const tr = state.tr.addMark(from, to, schema.marks.link.create({ href: url }))
              view.dispatch(tr.setSelection(TextSelection.create(tr.doc, to)).removeStoredMark(schema.marks.link))
              return true
            }
            const before = state.doc.textBetween(Math.max(to - 1, $to.start()), to, '', '￼')
            const inserted = before && !/\s/.test(before) ? ` ${url}` : url
            const tr = state.tr.insertText(inserted, to)
            view.dispatch(tr.setSelection(TextSelection.create(tr.doc, to + inserted.length)).scrollIntoView())
            return true
          },
        },
      }),
    ]
  },
})

/** StarterKit with a link that ends where its words end: what is typed after linked words is not linked (Peek's `inclusive: false`). */
export const BoxKit = StarterKit.extend({
  addExtensions() {
    return (this.parent?.() ?? []).map((extension) => (extension.name === 'link' ? extension.extend({ inclusive: () => false }) : extension))
  },
})

/**
 * {@link BoxKit} for a document: the same link, which also keeps `extra` —
 * every key a saved link carries that this version does not know — so a save
 * writes it back. ProseMirror drops an attribute its schema does not name, and
 * the key with it. Protocol's `toEditorDocument(doc, { links: true })` fills it.
 */
export const DocumentKit = StarterKit.extend({
  addExtensions() {
    return (this.parent?.() ?? []).map((extension) =>
      extension.name === 'link'
        ? (extension as Mark).extend({
            inclusive: () => false,
            addAttributes() {
              return { ...this.parent?.(), extra: { default: null, rendered: false, parseHTML: () => null } }
            },
          })
        : extension,
    )
  },
})

/*
 * A bare address looks like a link while you write it, and a click opens it, as
 * a link in a read page does (Katerina, 30 September: the always-editable
 * description had made its links unclickable). Ship's `LinkDecoration`, moved
 * into the kit with the document editor.
 *
 * A decoration, not a mark: the address is saved as the text it is, byte for
 * byte. The patterns are `RichText`'s, so the editor marks what the reader links.
 */
const LINK_SPLIT = /\[[^[\]\n]+\]\((?:https?:\/\/|mailto:)[^\s)]+\)|https?:\/\/[^\s]+/g
/** Punctuation after a bare address ends the sentence, not the address. */
const TRAILING = /[.,;:!?)\]]+$/
/** A link's look in an editor: the package `Link variant="text"`, spelled out for a mark's element and a decoration's range. */
export const LINK_CLASS = 'text-info-default underline underline-offset-2 cursor-pointer'

/** What a click may open: an address a reader may follow (SPEC §13.1), never `javascript:` and the like. */
const OPENABLE = /^(https?:\/\/|mailto:)/i

/** How a link mark is drawn in a document: the link look, a mark {@link BareLinks} recognises, and a new tab that cannot reach this one. */
export const LINK_MARK_ATTRIBUTES = { class: LINK_CLASS, 'data-link-mark': '', target: '_blank', rel: 'noopener noreferrer nofollow' }
/** `[words](url)` names its address in the brackets; a bare address is its own. */
const LINK_TARGET = /\]\(([^\s)]+)\)$/

export const BareLinks = Extension.create({
  name: 'bareLinks',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('bareLinks'),
        props: {
          // The one way a click opens an address: a bare one's decoration, or, while editing, a link on words (read only,
          // the link is a plain anchor and opens itself). Only its own attributes are read — never a chip's — and only an
          // address a reader may follow opens, always without handing the new tab this window.
          handleClick: (view, _pos, event) => {
            if (event.button !== 0) return false
            const target = event.target as HTMLElement | null
            const bare = target?.closest?.('[data-bare-link]')?.getAttribute('data-bare-link')
            const onWords = view.editable ? target?.closest?.('a[data-link-mark]')?.getAttribute('href') : null
            const href = bare ?? onWords
            if (!href || !OPENABLE.test(href)) return false
            window.open(href, '_blank', 'noopener,noreferrer')
            return true
          },
          decorations: ({ doc }) => {
            const found: Decoration[] = []
            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return
              // A code run is literal, so an address quoted as an example is not a link; one already linked is the mark's.
              if (node.marks.some((mark) => mark.type.name === 'code' || mark.type.name === 'link')) return
              for (const match of node.text.matchAll(LINK_SPLIT)) {
                if (match.index === undefined) continue
                const text = match[0].startsWith('[') ? match[0] : match[0].replace(TRAILING, '')
                const href = text.startsWith('[') ? (LINK_TARGET.exec(text)?.[1] ?? '') : text
                found.push(Decoration.inline(pos + match.index, pos + match.index + text.length, { class: LINK_CLASS, ...(href ? { 'data-bare-link': href } : {}) }))
              }
            })
            return found.length ? DecorationSet.create(doc, found) : null
          },
        },
      }),
    ]
  },
})
