/**
 * An app URL in a document reads as the chip of what it names — SPEC §13.3,
 * "A reference's card", and §7.7.
 *
 * The URL stays the URL: the chip is the `reference` node with `href` set (a
 * URL chip, `ReferenceNode`), which a document writes back as the URL it was,
 * plain text with no card and a `link` mark with one. Never a `nostr:`
 * reference in its place: the URL is how a person addresses the object.
 *
 * What a URL names is the app's to say — its manifests and its relay — so the
 * app hands this extension two functions: `referenceOf`, what it has resolved
 * so far, and `ask`, to look up the URLs it has not. A URL that names nothing,
 * or whose answer has not come back, stays text; when `ask` settles the
 * document is looked at again.
 *
 * The URL being typed stays text while the caret is in it or at its end, so a
 * half-typed address never turns into a chip under the person's fingers.
 */
import { Extension, type Editor } from '@tiptap/core'
import type { Node as PmNode } from '@tiptap/pm/model'
import { Plugin, PluginKey, type EditorState, type Selection, type Transaction } from '@tiptap/pm/state'

export interface LinkChipsOptions {
  /**
   * The `nostr:` reference an app URL names, from what the app has resolved
   * (§7.7) — protocol's `referenceOfLink(url, resolveLink)`. Undefined while it
   * names nothing, or its answer has not come back.
   */
  referenceOf: ((url: string) => string | undefined) | null
  /** Look up what these URLs name. When it settles, the document is looked at again. */
  ask: ((urls: string[]) => Promise<unknown> | void) | null
  /**
   * How many URLs one editor asks about in its life, the first ones; the rest
   * stay text. An app's answer can cost a relay query, and a document pasted
   * full of links must not spend the writer's quota. Default 24.
   */
  limit: number
}

const key = new PluginKey<LinkChipsOptions>('linkChips')

/**
 * A link on words in marker text (skipped), or a bare URL — the grammar of
 * protocol's `urlRunsIn`, which a reader turns into chips by, so what an editor
 * makes a chip is what a reader would.
 */
const LINK_OR_URL = /(\[[^[\]\n]+\]\((?:https?:\/\/|mailto:)[^\s)]+\))|(https?:\/\/[^\s<>"'`]+)/g
const TRAILING = new Set(['.', ',', ';', ':', '!', '?', ')', ']'])

/** Each URL and where it sits; `end` is where its run ends before trailing punctuation is trimmed, which typing may yet continue. */
function urlRuns(text: string): { url: string; from: number; to: number; end: number }[] {
  if (!text.includes('://')) return []
  const out: { url: string; from: number; to: number; end: number }[] = []
  for (const m of text.matchAll(LINK_OR_URL)) {
    if (m[1]) continue
    const start = m.index
    if (text.slice(Math.max(0, start - 2), start) === '](' || text[start - 1] === '[') continue
    let end = m[0].length
    while (end > 0 && TRAILING.has(m[0][end - 1])) end--
    out.push({ url: m[0].slice(0, end), from: start, to: start + end, end: start + m[0].length })
  }
  return out
}

interface Found {
  /** Text URLs that name something: made chips. */
  chips: { from: number; to: number; url: string; uri: string; marks: string[] }[]
  /** URL chips whose URL is answered now: given their reference. */
  fills: { pos: number; uri: string }[]
  /** Every URL still waiting for an answer, or naming nothing. */
  open: string[]
}

/** What to change in a document, and what to ask. `selection` null treats no URL as being typed. */
export function findLinkChips(doc: PmNode, selection: Selection | null, referenceOf: LinkChipsOptions['referenceOf']): Found {
  const found: Found = { chips: [], fills: [], open: [] }
  const open = new Set<string>()
  doc.descendants((node, pos) => {
    // A fence is literal (§13.1): its URLs are text.
    if (node.type.spec.code) return false
    if (node.type.name === 'reference') {
      const href = typeof node.attrs.href === 'string' ? node.attrs.href : ''
      if (href && !node.attrs.uri) {
        const uri = referenceOf?.(href)
        if (uri) found.fills.push({ pos, uri })
        else open.add(href)
      }
      return false
    }
    if (!node.isText || !node.text) return true
    // A URL in code is literal, and one already linked on purpose is the link's.
    if (node.marks.some((m) => m.type.spec.code || m.type.name === 'code' || m.type.name === 'link')) return false
    for (const run of urlRuns(node.text)) {
      const from = pos + run.from
      const to = pos + run.to
      // Being typed or selected: the caret inside it or at its end (`https://a.` is still being typed), or a
      // selection over any of it. A caret before it is not.
      if (selection && selection.to > from && selection.from <= pos + run.end) continue
      const uri = referenceOf?.(run.url)
      if (uri) found.chips.push({ from, to, url: run.url, uri, marks: node.marks.map((m) => m.type.name) })
      else open.add(run.url)
    }
    return false
  })
  found.open = [...open]
  return found
}

function apply(state: EditorState, found: Found): Transaction | null {
  if (!found.chips.length && !found.fills.length) return null
  const type = state.schema.nodes.reference
  if (!type) return null
  const tr = state.tr
  // A fill keeps the node's size, so the chips' positions still hold; the chips go last first.
  for (const { pos, uri } of found.fills) {
    const node = tr.doc.nodeAt(pos)
    if (node) tr.setNodeMarkup(pos, undefined, { ...node.attrs, uri })
  }
  for (const chip of [...found.chips].reverse()) {
    tr.replaceWith(chip.from, chip.to, type.create({ uri: chip.uri, href: chip.url, marks: chip.marks }))
  }
  // Not a step of the person's: undo takes back what they typed, not the chip it became.
  return tr.setMeta('addToHistory', false)
}

/**
 * Look at the document again — after the app learned what more URLs name some
 * other way. Dispatches only when there is a chip to make: an empty
 * transaction would wake every other plugin (a trailing paragraph appears).
 */
export function refreshLinkChips(editor: Editor): void {
  if (editor.isDestroyed) return
  const options = key.getState(editor.state)
  if (!options) return
  const tr = apply(editor.state, findLinkChips(editor.state.doc, editor.state.selection, options.referenceOf))
  if (tr) editor.view.dispatch(tr)
}

/**
 * Turns the app URLs in a document into URL chips. Pair it with `ReferenceNode`;
 * `ReferenceCards` then draws a card a URL chip asks for.
 */
export const LinkChips = Extension.create<LinkChipsOptions>({
  name: 'linkChips',
  addOptions() {
    return { referenceOf: null, ask: null, limit: 24 }
  },
  addProseMirrorPlugins() {
    const options = this.options
    const editor = this.editor
    return [
      new Plugin<LinkChipsOptions>({
        key,
        // The options, where `refreshLinkChips` can read them from the state alone.
        state: { init: () => options, apply: (_tr, value) => value },
        appendTransaction: (trs, _old, state) => {
          if (!trs.some((tr) => tr.docChanged || tr.selectionSet)) return null
          return apply(state, findLinkChips(state.doc, state.selection, options.referenceOf))
        },
        view: (view) => {
          // Each URL is asked once; one whose ask failed is forgotten, so a later look asks again.
          const asked = new Set<string>()
          // The URL being typed is not asked about: each prefix of it would spend one of `limit`, and a query.
          const look = (state: EditorState) => {
            if (!options.ask) return
            const { open } = findLinkChips(state.doc, state.selection, options.referenceOf)
            const fresh = open.filter((url) => !asked.has(url)).slice(0, Math.max(0, options.limit - asked.size))
            if (!fresh.length) return
            for (const url of fresh) asked.add(url)
            const forget = () => {
              for (const url of fresh) asked.delete(url)
            }
            let answer: Promise<unknown> | void
            try {
              answer = options.ask(fresh)
            } catch {
              forget()
              return
            }
            void Promise.resolve(answer).then(() => refreshLinkChips(editor), forget)
          }
          look(view.state)
          // Once the view is up, so a dispatch lands: what the app already knows turns into chips on open.
          queueMicrotask(() => {
            try {
              refreshLinkChips(editor)
            } catch {
              // Unmounted before it ran.
            }
          })
          return {
            update: (next, prev) => {
              // A caret leaving a URL finishes it, so a move is looked at as an edit is.
              if (next.state.doc !== prev.doc || !next.state.selection.eq(prev.selection)) look(next.state)
            },
          }
        },
      }),
    ]
  },
})
