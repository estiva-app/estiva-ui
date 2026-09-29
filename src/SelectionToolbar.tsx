import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { IconBold, IconCode, IconItalic, IconLink, IconUnderline } from '@tabler/icons-react'
import { Form } from './Form'
import { Popover } from './Popover'
import { TextInput } from './TextInput'
import { Toolbar, ToolbarButton } from './Toolbar'
import { shortcutLabel } from './shortcuts'

/**
 * The selection, kept visible while something else has the focus — Peek's
 * `src/extensions/keptSelection.ts` (PEE-19), moved into the package with the
 * `SelectionToolbar` that needs it (UIG-31, Katerina's ruling 29 September).
 *
 * The toolbar's address field takes the focus, and with it the document's
 * one selection, so the words being linked lost their highlight the moment
 * the field opened (measured 2026-09-07). Linear keeps it, and Katerina asked
 * for the same. The editor's own selection never moved — ProseMirror keeps it
 * while unfocused — so this only *draws* it: an inline decoration over the
 * range, in `bg-selected` — the token Peek's composer paints `::selection` in,
 * mapped through edits and cleared when the field closes.
 *
 * A decoration rather than a second selection, because a document has one
 * and the field needs it. Editor-internal by design (the editor owns its own
 * drawing); nothing here floats, focuses or handles a key.
 */

export interface KeptRange {
  from: number
  to: number
}

/** The plugin's key: read what is being kept, or dispatch a change to it. */
export const keptSelectionKey = new PluginKey<KeptRange | null>('keptSelection')

/** The extension an editor registers so a selection can stay drawn while a field has the focus. */
export const KeptSelection = Extension.create({
  name: 'keptSelection',

  addProseMirrorPlugins() {
    return [
      new Plugin<KeptRange | null>({
        key: keptSelectionKey,
        state: {
          init: () => null,
          apply(tr, previous) {
            const meta = tr.getMeta(keptSelectionKey) as KeptRange | null | undefined
            if (meta !== undefined) return meta
            if (!previous) return null
            // Follow the words through an edit, so applying the link to them
            // (or typing before them) does not leave the highlight behind.
            return { from: tr.mapping.map(previous.from), to: tr.mapping.map(previous.to) }
          },
        },
        props: {
          decorations(state) {
            const range = keptSelectionKey.getState(state)
            if (!range || range.from === range.to) return null
            return DecorationSet.create(state.doc, [
              Decoration.inline(range.from, range.to, { class: 'kept-selection bg-bg-selected' }),
            ])
          },
        },
      }),
    ]
  },
})

/** Draw the selection as it is now, until `releaseSelection`. */
export function keepSelection(editor: Editor) {
  const { from, to } = editor.state.selection
  editor.view.dispatch(editor.state.tr.setMeta(keptSelectionKey, { from, to }))
}

/** Stop drawing it. Nothing kept, nothing dispatched. */
export function releaseSelection(editor: Editor) {
  if (editor.isDestroyed || !keptSelectionKey.getState(editor.state)) return
  editor.view.dispatch(editor.state.tr.setMeta(keptSelectionKey, null))
}

/** What is being drawn, or null. */
export function keptSelection(editor: Editor): KeptRange | null {
  return keptSelectionKey.getState(editor.state) ?? null
}

/** A mark the strip can toggle — the suite's inline vocabulary (SPEC §13.1) less link and reference. */
export type MarkId = 'bold' | 'italic' | 'underline' | 'code'

const MARKS: Record<MarkId, { label: string; keys: string }> = {
  bold: { label: 'Bold', keys: 'Mod-B' },
  italic: { label: 'Italic', keys: 'Mod-I' },
  underline: { label: 'Underline', keys: 'Mod-U' },
  code: { label: 'Code', keys: 'Mod-E' },
}

/**
 * Toggle one mark over the current selection. The core `toggleMark`, which
 * each mark's own `toggleBold` and the like wrap: the package names no Tiptap
 * extension, only the marks the suite's format has (SPEC §13.1).
 */
function toggleMark(editor: Editor, id: MarkId): boolean {
  return editor.chain().focus().toggleMark(id).run()
}

/** The address the selection sits in, or '' — what the link field opens with. */
export function currentLink(editor: Editor): string {
  const href: unknown = editor.getAttributes('link').href
  return typeof href === 'string' ? href : ''
}

/**
 * What somebody typed into the link field → an `href`, or null when it cannot
 * be one. A bare host (`google.com`) gets `https://`. A scheme is kept only when
 * SPEC §13.1 lets a reader follow it (http, https, mailto); `javascript:` and
 * the like are refused here. `localhost:5173` is a host and a port: a scheme is
 * never followed by a digit.
 */
export function normalizeHref(raw: string): string | null {
  const s = raw.trim()
  if (!s || /\s/.test(s)) return null
  if (/^(https?:|mailto:)/i.test(s)) return s
  if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s)) return null
  return `https://${s}`
}

/**
 * Apply the link field to the selection. Empty removes the link; an address
 * sets it, over the whole link when the caret sits inside one. `false` means
 * the text could not be an address, and the field should stay open.
 */
export function applyLink(editor: Editor, raw: string): boolean {
  const chain = editor.chain().focus().extendMarkRange('link')
  // The core commands the Link extension's `setLink` and `unsetLink` wrap, with
  // the same meta; `normalizeHref` has already refused what it would refuse.
  if (!raw.trim()) return chain.unsetMark('link', { extendEmptyMarkRange: true }).setMeta('preventAutolink', true).run()
  const href = normalizeHref(raw)
  if (!href) return false
  return chain.setMark('link', { href }).setMeta('preventAutolink', true).run()
}

/**
 * Bold / italic / underline / link over selected text — Peek's
 * `SelectionToolbar` (PEE-18, PEE-19), moved into the package at Katerina's
 * word (29 September, UIG-31) when Ship's description became its second user.
 * Unchanged but for two props: `marks`, which buttons the strip has (Peek's
 * three by default; Ship adds code), and `link`, whether it has the Link button
 * and its field (Peek's editor has a link mark; an editor without one leaves it
 * off). The editor must register `KeptSelection` when `link` is on.
 *
 * The marks apply to a run you have already written, which is why they are
 * not in the `/` menu: typing `/` replaces the selection, so by definition
 * there is nothing selected to apply them to.
 *
 * **The chrome is the shared `Popover`, anchored** (P26). It was a `Menu`, and
 * it never was one: a menu gives its contents roving focus and typeahead,
 * which would fight the link field this panel exists for. An anchored
 * `Popover` is the mode built for exactly this — it takes no focus, so the
 * caret stays in the text. It is laid out as a row instead of a column
 * through `className`, which `cn` merges last. The panel still portals out of
 * the composer, so no overflow clips it, and Floating UI clamps it on screen.
 *
 * **The anchor is the selection's own point** since 0.12.2. This toolbar is
 * *centred* over the selection (her design, PEE-19, after Linear), and the
 * package's `Popover` aligns left or right only — Base UI has `center`, the
 * package does not expose it (ADOPTION **B21**). So the placement arithmetic
 * and the hand-measured `SIZE` box stay for now, and the rect handed over is
 * positioned so the panel lands on the same pixel it always has: the
 * package's own 4px gap is subtracted from this file's 8px, and the rect's
 * left edge is the panel's. When `align="center"` exists, `SIZE`, `GAP` and
 * `placement` all go and the anchor becomes the selection's own rect.
 *
 * **Two faces** (PEE-19 — Katerina, 2026-09-07, after Linear). `marks` is the
 * row of four buttons. `link` is one text field for the address: it opens from
 * the Link button, and opens by itself when the settled selection sits inside
 * a link, with that link's address in it. There is no open, embed or delete
 * button, by her call: the field is the whole control.
 *
 * **What applies the field** (her rule, same day): Enter, and clicking away —
 * anywhere outside the toolbar, the editor included. Enter on an empty field
 * removes the link; clicking away with an empty field changes nothing, since
 * removing is deliberate and leaving is not. Escape drops what was typed and
 * puts the caret back. Once applied, the caret lands after the link, and
 * typing goes on as plain text — the mark is not inclusive (editorKit).
 *
 * While the field has focus the editor has not, so everything below that
 * hides the toolbar on blur or on an empty editor selection stands down in
 * `link` mode. The editor keeps its selection while unfocused; `focus()` in
 * the apply command puts it back.
 *
 * **Why it waits.** Showing on every selection change put the toolbar under the
 * pointer mid-drag, and made it blink on a plain click — ProseMirror restores
 * the previous selection when the editor takes focus and collapses it a tick
 * later, so there is a real, non-empty range in between. Both go away by
 * refusing to show while the pointer is down and re-reading the selection after
 * a short settle rather than trusting the event that woke us.
 */

const ICONS: Record<MarkId, typeof IconBold> = {
  bold: IconBold,
  italic: IconItalic,
  underline: IconUnderline,
  code: IconCode,
}

type Mode = 'marks' | 'link'

/** How long a selection must stand still before the toolbar appears. */
const SETTLE_MS = 250
const GAP = 8
/** The gap the package's `Popover` adds of its own, subtracted above so the
 *  panel keeps this file's 8px. Read from `Popover.tsx`, not guessed. */
const POPOVER_GAP = 4

export interface SelectionToolbarProps {
  /** The editor whose selection the strip follows. `null` while it loads. */
  editor: Editor | null
  /** Which marks the strip toggles, in order. Default bold, italic, underline. */
  marks?: readonly MarkId[]
  /** The Link button and its address field. Needs a link mark in the editor and `KeptSelection`. Default off. */
  link?: boolean
}

export function SelectionToolbar({ editor, marks = ['bold', 'italic', 'underline'], link = false }: SelectionToolbarProps) {
  /** The selection's top edge and horizontal centre; the face decides the rest. */
  const [anchor, setAnchor] = useState<{ top: number; centre: number } | null>(null)
  const [mode, setMode] = useState<Mode>('marks')
  const [url, setUrl] = useState('')
  // Re-render as marks turn on and off while the caret moves through the
  // selection, so the pressed states stay honest.
  const [, setTick] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerDown = useRef(false)
  const field = useRef<HTMLInputElement>(null)
  /** What the field holds while it is open; null while it is closed. The
   *  listeners below are bound once, so they read this rather than state. */
  const draft = useRef<string | null>(null)
  // Read by the same listeners. Kept in an effect, declared before the focus
  // effect below so the ref already says `link` when the field's focus blurs
  // the editor.
  const modeRef = useRef<Mode>('marks')
  useEffect(() => {
    modeRef.current = mode
  }, [mode])
  // Read by `settle`, which is bound once: words already a link open the field only when there is one.
  const linkOn = useRef(link)
  linkOn.current = link

  const hide = useCallback(() => {
    clearTimeout(timer.current)
    draft.current = null
    if (editor) releaseSelection(editor)
    setAnchor(null)
    setMode('marks')
  }, [editor])

  /**
   * Leaving the field applies it (Enter or a click away). An address links the
   * words and the caret moves past them; an empty field on the way out is a
   * shrug, not a removal. Idempotent: the outside click reaches this twice,
   * once from the editor press and once from the Menu's own listener.
   */
  const commit = useCallback(() => {
    const text = draft.current
    if (text === null || !editor) return
    draft.current = null
    if (text.trim() && applyLink(editor, text)) {
      editor.commands.setTextSelection(editor.state.selection.to)
    }
    hide()
  }, [editor, hide])

  /** Read the selection as it is *now* and place the toolbar, or hide it. */
  const settle = useCallback(() => {
    if (!editor || editor.isDestroyed) return
    // Keeping the selection drawn is itself a transaction, which schedules
    // this; by then the field has the focus, and reading `hasFocus()` here
    // would close it.
    if (modeRef.current === 'link') return
    const { state, view } = editor
    const { empty, from, to } = state.selection
    if (empty || from === to || !view.hasFocus() || pointerDown.current) {
      setAnchor(null)
      setMode('marks')
      return
    }
    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)
    const centre = (Math.min(start.left, end.left) + Math.max(start.right, end.right)) / 2
    // Words that are already a link open on the field, with their address in it.
    const inLink = linkOn.current && editor.isActive('link')
    const address = inLink ? currentLink(editor) : ''
    draft.current = inLink ? address : null
    // The field is about to take the focus; the words stay highlighted.
    if (inLink) keepSelection(editor)
    setMode(inLink ? 'link' : 'marks')
    setUrl(address)
    setAnchor({ top: start.top, centre })
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const schedule = () => {
      // The field owns the keyboard and the focus; the editor's own events
      // stand down until it closes.
      if (modeRef.current === 'link') return
      setTick((t) => t + 1)
      clearTimeout(timer.current)
      // A collapsed selection hides at once — waiting to hide is what made the
      // click blink. Only *showing* is deferred.
      if (editor.state.selection.empty) {
        setAnchor(null)
        return
      }
      timer.current = setTimeout(settle, SETTLE_MS)
    }

    // The field taking focus is the one blur that must not hide us.
    const onBlur = () => {
      if (modeRef.current !== 'link') hide()
    }

    // Only a press *inside the editor* starts a selection. A press on the
    // toolbar itself must not hide it — doing so unmounted the button before
    // its click could land, so nothing ever applied.
    const startsSelection = (e: MouseEvent) =>
      e.target instanceof Node && editor.view.dom.contains(e.target)

    const onPointerDown = (e: MouseEvent) => {
      if (!startsSelection(e)) return
      // A press in the editor while the field is open is a click away: apply
      // first, before the editor moves the caret under the press.
      commit()
      pointerDown.current = true
      hide()
    }
    const onPointerUp = () => {
      if (!pointerDown.current) return
      pointerDown.current = false
      schedule()
    }

    editor.on('selectionUpdate', schedule)
    editor.on('transaction', schedule)
    editor.on('blur', onBlur)
    // @estiva-escape(no-hand-rolled-behaviour): watches presses in the editor to follow a text selection; the Popover it opens in has no trigger to own that (Peek's UIG-8 escape, moved here with the part, UIG-31)
    document.addEventListener('mousedown', onPointerDown, true)
    document.addEventListener('mouseup', onPointerUp, true)

    return () => {
      clearTimeout(timer.current)
      editor.off('selectionUpdate', schedule)
      editor.off('transaction', schedule)
      editor.off('blur', onBlur)
      document.removeEventListener('mousedown', onPointerDown, true)
      document.removeEventListener('mouseup', onPointerUp, true)
    }
  }, [editor, settle, hide, commit])

  // The field takes focus once it is on screen. Not `autoFocus`, and not in
  // the same frame: the Menu renders once hidden to measure itself, and a
  // hidden input cannot take focus — measured 2026-09-07, the field opened
  // unfocused on a re-selected link. An address already in it is selected
  // whole, so typing replaces it.
  useEffect(() => {
    if (mode !== 'link' || !anchor) return
    const frame = requestAnimationFrame(() => {
      field.current?.focus()
      field.current?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [mode, anchor])

  if (!editor || !anchor) return null

  const openField = () => {
    const address = currentLink(editor)
    draft.current = address
    keepSelection(editor)
    setUrl(address)
    setMode('link')
  }
  /** Enter. Unlike a click away, an empty field here means remove. */
  const submit = () => {
    if (!url.trim()) {
      applyLink(editor, '')
      hide()
      editor.commands.focus()
      return
    }
    commit()
  }
  const discard = () => {
    hide()
    editor.commands.focus()
  }

  /* A zero-sized rect at the selection's own top edge and centre. The panel's
     width is no longer this file's business: `align="center"` puts the
     panel's middle over this point (B21, package 0.12.2), so the measured
     `SIZE` table and the placement arithmetic that stood in for it are gone.
     The top is this file's GAP less the package's own 4, so the panel keeps
     the 8px it has always had. */
  const anchorRect = new DOMRect(anchor.centre, anchor.top - (GAP - POPOVER_GAP), 0, 0)

  return (
    <Popover
      anchor={anchorRect}
      open
      side="top"
      align="center"
      onOpenChange={(next) => {
        if (!next) commit()
      }}
      ariaLabel="Text formatting"
      // The panel gives up its column; the strip inside draws the row. The 4px
      // around it is `contentClassName`'s: on `className` it was added to the
      // package's 8px from 0.12.6 on, and the toolbar grew 8px a side
      // (Katerina, 2026-09-13; migration docs D68, Finding 60). This is the
      // package's own `Popover/A toolbar` story, class for class.
      className="w-auto min-w-0"
      contentClassName="p-1"
    >
      {mode === 'link' ? (
        /* One field, so no strip: a toolbar of one control is a toolbar in
           name only, and `ToolbarInput` cannot take the ref this field is
           focused by (ADOPTION B25). */
        // The package Form (UIG-7): Enter applies the link. `free` and `flex`: one field, which keeps its own height.
        <Form onSubmit={submit} layout="free" className="flex">
        <TextInput
          ref={field}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            draft.current = e.target.value
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              // Before the Menu's own Escape, which would apply instead.
              e.stopPropagation()
              discard()
            }
          }}
          placeholder="Enter link URL"
          aria-label="Link URL"
          className="w-[264px]"
        />
        </Form>
      ) : (
        /* Four marks and a link button: one Tab stop, ← → along them (D29). */
        <Toolbar aria-label="Text formatting" surface={false}>
          {marks.map((id) => {
            const Icon = ICONS[id]
            const active = editor.isActive(id)
            return (
              <ToolbarButton
                key={id}
                aria-label={MARKS[id].label}
                pressed={active}
                tooltip={MARKS[id].label}
                tooltipShortcut={shortcutLabel(MARKS[id].keys)}
                // Keep the selection: focus must not leave the editor on press.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggleMark(editor, id)}
              >
                <Icon size={16} stroke={1.5} />
              </ToolbarButton>
            )
          })}
          {link && (
            <ToolbarButton
              aria-label="Link"
              tooltip="Link"
              onMouseDown={(e) => e.preventDefault()}
              onClick={openField}
            >
              <IconLink size={16} stroke={1.5} />
            </ToolbarButton>
          )}
        </Toolbar>
      )}
    </Popover>
  )
}
