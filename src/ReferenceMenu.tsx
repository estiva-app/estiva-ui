/**
 * What a chip in a document offers its writer — Open, and its card: none,
 * compact or detailed (SPEC §13.3, "A reference's card").
 *
 * **Where it opens** (Miky, 14 Oct): a click on a chip while editing opens the
 * menu instead of following the chip, and a chip just put in — pasted, picked
 * with `[`, or a pasted URL becoming its chip (`LinkChips`) — opens it by
 * itself, so the card can be chosen at once. That menu takes no focus: the
 * person is still writing, and typing on closes it with no card. Enter on a
 * selected chip opens it from the keyboard.
 *
 * **Keys while it is open**, handed over by the editor as the `/` menu's are:
 * ↓ and ↑ move through the rows (nothing is highlighted until they do, so
 * Enter after a paste still starts a new line), Enter chooses the highlighted
 * row, Escape closes it. Any edit or caret move closes it.
 *
 * Open does what a click on the chip does when reading: the app's own chip
 * gets the click, so it opens where the app opens it. A chip with nothing to
 * click opens its URL in a new tab.
 *
 * Two parts: the extension `ReferenceMenu` holds which chip the menu is open
 * on, and `ReferenceMenuView` draws it beside `EditorContent`. Pair them with
 * `ReferenceNode` and `ReferenceCards`.
 */
import { useCallback } from 'react'
import { Extension, type Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { NodeSelection, Plugin, PluginKey, TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state'
import { ReplaceStep } from '@tiptap/pm/transform'
import type { EditorView } from '@tiptap/pm/view'
import { IconCheck } from '@tabler/icons-react'
import { CHIPS_MADE } from './LinkChips'
import { MenuItem, MenuSection, MenuSeparator } from './Menu'
import { Popover } from './Popover'
import { setReferenceCardAt, type ReferenceCardLayout } from './ReferenceCards'

interface MenuState {
  /** The chip's position. */
  pos: number
  /** The highlighted row, or -1 for none. Row 0 is Open; rows 1–3 the cards. */
  active: number
}

const key = new PluginKey<MenuState | null>('referenceMenu')

const LAYOUTS: { layout: ReferenceCardLayout; label: string }[] = [
  { layout: 'none', label: 'None' },
  { layout: 'compact', label: 'Compact' },
  { layout: 'detailed', label: 'Detailed' },
]

/** A chip whose URL names nothing yet has no card to choose: Open only. */
function rowsOf(state: EditorState, pos: number): number {
  return state.doc.nodeAt(pos)?.attrs.uri ? 1 + LAYOUTS.length : 1
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
  const was = tr.before.nodeAt(tr.mapping.invert().map(pos))
  // The same chip as before the step — a key pressed after it, a card set on it — is not new.
  if (was && was.type.name === 'reference' && was.attrs.uri === before.attrs.uri) return null
  return pos
}

function dispatchMenu(view: EditorView, next: MenuState | null): void {
  view.dispatch(view.state.tr.setMeta(key, next))
}

// True while Open hands the click to the chip, so the chip's own click is not taken for a click that opens the menu.
let passing = false

/** Opens what the chip at `pos` names, as a click on it does when reading. */
function openChip(view: EditorView, pos: number): void {
  const dom = view.nodeDOM(pos)
  const node = view.state.doc.nodeAt(pos)
  const target = dom instanceof HTMLElement ? dom.querySelector<HTMLElement>('a[href], button') : null
  if (target) {
    passing = true
    try {
      target.click()
    } finally {
      passing = false
    }
    return
  }
  const href = typeof node?.attrs.href === 'string' ? node.attrs.href : ''
  if (/^https?:\/\//i.test(href)) window.open(href, '_blank', 'noopener,noreferrer')
}

/** Runs row `row` of the menu open on the chip at `pos`, and closes it. */
function choose(editor: Editor, pos: number, row: number): void {
  dispatchMenu(editor.view, null)
  if (row === 0) openChip(editor.view, pos)
  else {
    const card = LAYOUTS[row - 1]
    if (card) setReferenceCardAt(editor, pos, card.layout)
  }
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
  if (!chipAt(editor.state, pos)) return false
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
            // What another plugin appends — an id, a trailing line — is not the person typing on.
            if (tr.docChanged && !tr.getMeta('appendedTransaction')) return null
            const onChip = after.selection instanceof NodeSelection && after.selection.from === pos
            if (tr.selectionSet && !after.selection.eq(before.selection) && !onChip) return null
            return pos === value.pos ? value : { ...value, pos }
          },
        },
        props: {
          handleKeyDown: (view, event) => {
            const open = key.getState(view.state)
            if (!open) {
              // Enter on a selected chip: the menu, from the keyboard, its first row highlighted.
              const { selection } = view.state
              if (event.key !== 'Enter' || !view.editable || !(selection instanceof NodeSelection) || selection.node.type.name !== 'reference') return false
              view.dispatch(caretAfter(view.state, selection.from).setMeta(key, { pos: selection.from, active: 0 }))
              return true
            }
            const rows = rowsOf(view.state, open.pos)
            if (event.key === 'Escape') {
              dispatchMenu(view, null)
              return true
            }
            if (event.key === 'ArrowDown') {
              dispatchMenu(view, { ...open, active: (open.active + 1) % rows })
              return true
            }
            if (event.key === 'ArrowUp') {
              dispatchMenu(view, { ...open, active: open.active <= 0 ? rows - 1 : open.active - 1 })
              return true
            }
            if (event.key === 'Enter' && open.active >= 0) {
              choose(editor, open.pos, open.active)
              return true
            }
            return false
          },
        },
      }),
    ]
  },
})

/** What the panel draws: the chip the menu is open on, and its card. */
interface Shown {
  pos: number
  active: number
  named: boolean
  layout: ReferenceCardLayout
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
      const node = chipAt(ed.state, open.pos)
      if (!node) return null
      const embed = node.attrs.embed
      // An unknown layout draws compact (§13.3), so it reads as compact here.
      const layout: ReferenceCardLayout = embed === 'detailed' ? 'detailed' : typeof embed === 'string' && embed !== '' && embed !== 'none' ? 'compact' : 'none'
      return { pos: open.pos, active: open.active, named: !!node.attrs.uri, layout }
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

  const dom = shown && editor && !editor.isDestroyed ? editor.view.nodeDOM(shown.pos) : null
  const anchor = dom instanceof HTMLElement ? dom : null
  const run = (row: number) => {
    if (editor && shown) choose(editor, shown.pos, row)
  }

  return (
    // finalFocus={false}: focus never left the text.
    <Popover
      anchor={anchor}
      open={!!shown && !!anchor}
      onOpenChange={(next) => {
        if (!next && editor && !editor.isDestroyed && key.getState(editor.state)) dispatchMenu(editor.view, null)
      }}
      side="bottom"
      align="left"
      ariaLabel="Reference"
      finalFocus={false}
    >
      {shown && (
        <div ref={keepFocus} role="menu" aria-label="Reference" className="flex flex-col gap-0.5">
          <MenuItem
            role="menuitem"
            tabIndex={-1}
            label="Open"
            selected={shown.active === 0}
            onMouseDown={(event) => {
              event.preventDefault()
              run(0)
            }}
          />
          {shown.named && (
            <>
              <MenuSeparator />
              <div role="group" aria-label="Card">
                <MenuSection label="Card">
                  {LAYOUTS.map(({ layout, label }, i) => (
                    <MenuItem
                      key={layout}
                      role="menuitemradio"
                      aria-checked={shown.layout === layout}
                      tabIndex={-1}
                      label={label}
                      selected={shown.active === i + 1}
                      trailing={shown.layout === layout ? <IconCheck size={16} aria-hidden /> : undefined}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        run(i + 1)
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
