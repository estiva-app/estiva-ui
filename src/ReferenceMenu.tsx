/**
 * What a link in a document offers its writer: Open, and — alone on its line —
 * Show as Row or Card (SPEC §13.3, "A reference's card"). Card puts its card in
 * the row's place (`embed` `detailed`); Row puts the row back (no `embed`).
 * Nothing writes `compact`. A chip in a sentence, and a person or a Folder alone
 * on its line (which stay chips), offer Open only (`linkPlaceAt`).
 *
 * **Where it opens**: a click on a link while editing opens the menu instead
 * of following it, and a lone-line link just put in — pasted, picked with `[`,
 * or a pasted URL becoming its chip (`LinkChips`) — opens it by itself, so the
 * card can be chosen at once. That menu takes no focus: the person is still
 * writing, and typing on closes it with no card. Enter on a selected link opens
 * it from the keyboard.
 *
 * **Keys while it is open**, handed over by the editor as the `/` menu's are:
 * ↓ and ↑ move through the rows (nothing is highlighted until they do, so
 * Enter after a paste still starts a new line), Enter chooses the highlighted
 * row, Escape closes it. Any edit or caret move closes it.
 *
 * Open does what a click on the chip does when reading: the app's own chip
 * gets the click, so it opens where the app opens it. A chip with nothing to
 * click opens its URL in a new tab; one with neither — a person, a link still
 * loading or not available — offers no Open, and a menu left with nothing in
 * it does not open.
 *
 * Two parts: the extension `ReferenceMenu` holds which chip the menu is open
 * on, and `ReferenceMenuView` draws it beside `EditorContent`. Pair them with
 * `ReferenceNode` and `LinkPlaces`.
 *
 * why: https://github.com/estiva-app/estiva-docs/blob/main/decisions/a-lone-links-chip-menu-offers-row-or-card.md
 */
import { useCallback, useEffect, useReducer } from 'react'
import { Extension, type Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { NodeSelection, Plugin, PluginKey, TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state'
import { ReplaceStep } from '@tiptap/pm/transform'
import type { EditorView } from '@tiptap/pm/view'
import { IconCheck, IconExternalLink } from '@tabler/icons-react'
import { CHIPS_MADE } from './LinkChips'
import { linkPlaceAt } from './LinkPlaces'
import { MenuItem, MenuSection, MenuSeparator } from './Menu'
import { Popover } from './Popover'
import { setReferenceCardAt } from './ReferenceCards'

interface MenuState {
  /** The chip's position. */
  pos: number
  /** The highlighted row of `rowsOf`, or -1 for none. */
  active: number
}

const key = new PluginKey<MenuState | null>('referenceMenu')

/** How a lone-line link can show. */
type ShowAs = 'row' | 'card'

const SHOW_AS: { as: ShowAs; label: string }[] = [
  { as: 'row', label: 'Row' },
  { as: 'card', label: 'Card' },
]

/** A row of the menu: Open, or a way to show the link. */
type Row = 'open' | ShowAs

/** The chip's own control to click, or null. */
function chipTarget(view: EditorView, pos: number): HTMLElement | null {
  const dom = view.nodeDOM(pos)
  return dom instanceof HTMLElement ? dom.querySelector<HTMLElement>('a[href], button') : null
}

/** An http(s) URL chip's URL, or ''. */
function webHref(view: EditorView, pos: number): string {
  const href = view.state.doc.nodeAt(pos)?.attrs.href
  return typeof href === 'string' && /^https?:\/\//i.test(href) ? href : ''
}

/**
 * The menu's rows: Open when there is something to open — the link's own
 * control as the app drew it, or its URL — and Row and Card when it is alone
 * on its line and is neither a person nor a Folder (`linkPlaceAt`). A person,
 * and a link still loading or not available, draw nothing to click: no Open
 * (Katerina, 30 Oct). The view asks again as the app's drawing changes.
 */
function rowsOf(view: EditorView, pos: number): Row[] {
  const open: Row[] = chipTarget(view, pos) || webHref(view, pos) ? ['open'] : []
  return linkPlaceAt(view.state.doc, pos) === 'chip' ? open : [...open, ...SHOW_AS.map((show) => show.as)]
}

/** A chip node, or null. */
function chipAt(state: EditorState, pos: number) {
  const node = state.doc.nodeAt(pos)
  return node && node.type.name === 'reference' ? node : null
}

/**
 * The chip this transaction just put right before the caret — a paste, a `[`
 * pick (which adds a space after it), or a URL becoming its chip — or null.
 * An undo, and a document loaded over the editor, put nothing in.
 */
function justPlaced(tr: Transaction, state: EditorState): number | null {
  if (!tr.docChanged || tr.getMeta('history$') || tr.getMeta('preventUpdate')) return null
  // A whole document set over the editor — someone else's edit loaded — is not something the person put in.
  const whole = tr.steps.some((step) => step instanceof ReplaceStep && step.from === 0 && step.to === tr.before.content.size)
  if (whole && tr.getMeta('uiEvent') !== 'paste') return null
  // A URL becoming its chip opens the menu only when it was pasted, with the caret still right after it.
  const made = tr.getMeta(CHIPS_MADE) as { pasted: boolean } | undefined
  if (made && !made.pasted) return null
  const { selection } = state
  if (!selection.empty) return null
  let at = selection.from
  let before = selection.$from.nodeBefore
  if (!made && before?.isText && before.text === ' ') {
    at -= 1
    before = state.doc.resolve(at).nodeBefore
  }
  if (!before || before.type.name !== 'reference' || !before.attrs.uri) return null
  const pos = at - before.nodeSize
  const old = tr.mapping.invert().map(pos)
  const was = tr.before.nodeAt(old)
  // The same chip as before the step — a key pressed after it, a card set on it — is not new. One put in just before
  // an identical chip pushes that chip along, so it no longer maps onto `pos` (code review).
  if (was && was.type.name === 'reference' && was.attrs.uri === before.attrs.uri && tr.mapping.map(old, 1) === pos) return null
  // Only a link alone on its line has a card to choose; in a sentence the menu would offer Open alone.
  if (linkPlaceAt(state.doc, pos) === 'chip') return null
  return pos
}

function dispatchMenu(view: EditorView, next: MenuState | null): void {
  view.dispatch(view.state.tr.setMeta(key, next))
}

// True while Open hands the click to the chip, so the chip's own click is not taken for a click that opens the menu.
let passing = false

/** Opens what the chip at `pos` names, as a click on it does when reading. */
function openChip(view: EditorView, pos: number): void {
  const target = chipTarget(view, pos)
  if (target) {
    passing = true
    try {
      target.click()
    } finally {
      passing = false
    }
    return
  }
  const href = webHref(view, pos)
  if (href) window.open(href, '_blank', 'noopener,noreferrer')
}

/** Runs `row` of the menu open on the chip at `pos`, and closes it. */
function choose(editor: Editor, pos: number, row: Row | undefined): void {
  dispatchMenu(editor.view, null)
  if (row === 'open') openChip(editor.view, pos)
  else if (row) setReferenceCardAt(editor, pos, row === 'card' ? 'detailed' : 'none')
}

/** Whether the menu is open, for an editor's own Escape: while it is, Escape closes it rather than leaving. */
export function isReferenceMenuOpen(state: EditorState): boolean {
  return !!key.getState(state)
}

/**
 * A click on the chip at `pos`, from its node view: while editing, with the
 * menu installed, it opens the menu, and the caller stops the click there.
 * Returns false when the click should go on to the chip.
 */
export function referenceMenuClick(editor: Editor, pos: number): boolean {
  if (passing || editor.isDestroyed || !editor.isEditable || key.getState(editor.state) === undefined) return false
  // A chip with nothing to open and no card to choose has no menu: the click goes on to it.
  if (!chipAt(editor.state, pos) || rowsOf(editor.view, pos).length === 0) return false
  editor.view.dispatch(caretAfter(editor.state, pos).setMeta(key, { pos, active: -1 }))
  return true
}

/**
 * The caret right after the chip, as a paste leaves it: a selected chip would
 * bring up the selection toolbar beside the menu, and typing would replace it.
 */
function caretAfter(state: EditorState, pos: number): Transaction {
  const node = state.doc.nodeAt(pos)
  return state.tr.setSelection(TextSelection.create(state.doc, pos + (node?.nodeSize ?? 1)))
}

/** Which chip the menu is open on: see the module comment. */
export const ReferenceMenu = Extension.create({
  name: 'referenceMenu',
  // Before the editor's own keys, so Enter on a highlighted row is the row's, not a new line.
  priority: 1000,
  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      new Plugin<MenuState | null>({
        key,
        state: {
          init: () => null,
          apply: (tr, value, before, after) => {
            const meta = tr.getMeta(key) as MenuState | null | undefined
            if (meta !== undefined) return meta
            const placed = justPlaced(tr, after)
            if (placed !== null) return { pos: placed, active: -1 }
            if (!value) return null
            const pos = tr.mapping.map(value.pos)
            if (!chipAt(after, pos)) return null
            // What another plugin appends — an id, a trailing line — is not the person typing on, and nor is a URL
            // elsewhere becoming its chip when its answer comes back (code review).
            if (tr.docChanged && !tr.getMeta('appendedTransaction') && tr.getMeta(CHIPS_MADE) === undefined) return null
            const onChip = after.selection instanceof NodeSelection && after.selection.from === pos
            if (tr.selectionSet && !after.selection.eq(before.selection) && !onChip) return null
            return pos === value.pos ? value : { ...value, pos }
          },
        },
        props: {
          handleDOMEvents: {
            // Focus gone, the keys no longer reach the menu, and a card chosen now would miss the save on leaving (code review).
            blur: (view) => {
              if (key.getState(view.state)) dispatchMenu(view, null)
              return false
            },
          },
          handleKeyDown: (view, event) => {
            // With a modifier, a key is the editor's: Shift+↓ extends the selection, Mod+Enter is not a pick.
            if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return false
            const open = key.getState(view.state)
            if (!open) {
              // Enter on a selected chip: the menu, from the keyboard, its first row highlighted.
              const { selection } = view.state
              if (event.key !== 'Enter' || !view.editable || !(selection instanceof NodeSelection) || selection.node.type.name !== 'reference') return false
              if (rowsOf(view, selection.from).length === 0) return false
              view.dispatch(caretAfter(view.state, selection.from).setMeta(key, { pos: selection.from, active: 0 }))
              return true
            }
            const rows = rowsOf(view, open.pos)
            if (event.key === 'Escape') {
              dispatchMenu(view, null)
              return true
            }
            if (rows.length === 0) return false
            if (event.key === 'ArrowDown') {
              dispatchMenu(view, { ...open, active: (open.active + 1) % rows.length })
              return true
            }
            if (event.key === 'ArrowUp') {
              dispatchMenu(view, { ...open, active: open.active <= 0 ? rows.length - 1 : open.active - 1 })
              return true
            }
            if (event.key === 'Enter' && open.active >= 0) {
              choose(editor, open.pos, rows[open.active])
              return true
            }
            return false
          },
        },
      }),
    ]
  },
})

/** What the panel draws: the link the menu is open on, and how it shows. */
interface Shown {
  pos: number
  active: number
  shownAs: ShowAs
}

export interface ReferenceMenuViewProps {
  editor: Editor | null
}

/** The menu `ReferenceMenu` holds, hung under its chip. Render it always, beside `EditorContent`. */
export function ReferenceMenuView({ editor }: ReferenceMenuViewProps) {
  const shown = useEditorState({
    editor,
    selector: ({ editor: ed }): Shown | null => {
      if (!ed || ed.isDestroyed) return null
      const open = key.getState(ed.state)
      if (!open) return null
      if (!chipAt(ed.state, open.pos)) return null
      // `compact` and a value this version does not know draw the row (§13.3), so they read as Row here.
      return { pos: open.pos, active: open.active, shownAs: linkPlaceAt(ed.state.doc, open.pos) === 'card' ? 'card' : 'row' }
    },
  })
  // A press anywhere in the panel keeps focus in the text, as a row's does: the editor saves and ends its menus when it loses focus.
  const keepFocus = useCallback((list: HTMLDivElement | null) => {
    const panel = list?.closest('[role="dialog"]')
    if (!panel) return
    const keep = (event: Event) => event.preventDefault()
    panel.addEventListener('mousedown', keep)
    return () => panel.removeEventListener('mousedown', keep)
  }, [])

  const live = shown && editor && !editor.isDestroyed ? editor : null
  const dom = live && shown ? live.view.nodeDOM(shown.pos) : null
  const anchor = dom instanceof HTMLElement ? dom : null
  // Whether there is something to open is the app's drawing, which can arrive after the menu (right after a `[` pick)
  // or change under it (a link that loads): the rows are asked again when it does.
  const [, redraw] = useReducer((count: number) => count + 1, 0)
  useEffect(() => {
    if (!anchor || typeof MutationObserver === 'undefined') return
    const observer = new MutationObserver(redraw)
    observer.observe(anchor, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] })
    return () => observer.disconnect()
  }, [anchor])
  const rows = live && shown ? rowsOf(live.view, shown.pos) : []
  const opens = rows[0] === 'open'
  const showAs = rows.includes('card')
  const run = (row: Row) => {
    if (editor && shown) choose(editor, shown.pos, row)
  }

  return (
    // finalFocus={false}: focus never left the text.
    <Popover
      anchor={anchor}
      open={!!shown && !!anchor && rows.length > 0}
      onOpenChange={(next) => {
        if (!next && editor && !editor.isDestroyed && key.getState(editor.state)) dispatchMenu(editor.view, null)
      }}
      side="bottom"
      align="left"
      ariaLabel="Link"
      finalFocus={false}
    >
      {shown && (
        <div ref={keepFocus} role="menu" aria-label="Link" className="flex flex-col gap-0.5">
          {/* Only when there is something to open: the chip's own control, or its URL (code review). */}
          {opens && (
            <MenuItem
              role="menuitem"
              tabIndex={-1}
              label="Open"
              leading={<IconExternalLink size={16} />}
              selected={shown.active === 0}
              onMouseDown={(event) => {
                event.preventDefault()
                run('open')
              }}
            />
          )}
          {showAs && (
            <>
              {opens && <MenuSeparator />}
              <div role="group" aria-label="Show as">
                <MenuSection label="Show as">
                  {SHOW_AS.map(({ as, label }, i) => (
                    <MenuItem
                      key={as}
                      role="menuitemradio"
                      aria-checked={shown.shownAs === as}
                      tabIndex={-1}
                      label={label}
                      selected={shown.active === i + (opens ? 1 : 0)}
                      trailing={shown.shownAs === as ? <IconCheck size={16} aria-hidden /> : undefined}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        run(as)
                      }}
                    />
                  ))}
                </MenuSection>
              </div>
            </>
          )}
        </div>
      )}
    </Popover>
  )
}
