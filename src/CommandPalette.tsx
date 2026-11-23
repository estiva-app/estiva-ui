import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
// @estiva-escape(no-hand-rolled-behaviour): a lit row's preview goes beside the window, inside the dialog (LitPreview, below)
import { createPortal } from 'react-dom'
import { Dialog } from '@base-ui/react/dialog'
import { Autocomplete } from '@base-ui/react/autocomplete'
import type { BaseUIEvent } from '@base-ui/react/types'
import { IconLoader2, IconSearch, IconSparkles } from '@tabler/icons-react'
import { cn } from './cn'
import { MONO_CAPTION_CLASSES } from './looks'
import { Button } from './Button'
import { Card } from './Card'
import { Chip } from './Chip'
import { InputChip } from './ChipInput'
import { EmptyState } from './EmptyState'
import { FieldLine } from './Field'
import { FIELDS_CLASSES, Form } from './Form'
import { Kbd } from './Kbd'
import { EnterHint, MenuItemBody, MenuPanel, menuItemClassName } from './Menu'
import { ScrollArea } from './ScrollArea'
import { SectionLabel } from './SectionLabel'
import { SkeletonBar } from './Skeleton'

/**
 * A window that searches and runs things: a field, rows in groups, and a
 * footer naming the keys that work right now. Built the way Base UI's own
 * command palette example is — `Dialog` with an `Autocomplete` inside it,
 * the list drawn inline — which is migration decision D8, brought forward
 * by UIG-29 (Katerina, 15–16 September 2026).
 *
 * **Why not `DialogShell`.** A palette has no title bar, no close button and
 * no button row; its top is a field and its bottom is a key footer. Built on
 * the shell it would be the shell with every slot switched off and a second
 * card drawn inside it. `SearchInput` and `ChipInput` do not fit either: the
 * field here drives a list that is always open and never a popup.
 *
 * **What it owns, and what the caller owns** (Katerina, 16 September, P1 and
 * P2). Every key is this component's: the arrows and Enter are Base UI's,
 * and Tab to go in, Ctrl+Backspace to forget, Backspace to go back, Ctrl+Enter
 * to submit and where focus goes are written here, once, so the footer can be
 * written from the same state and never name a key that does nothing. The
 * caller owns the words, which rows exist, what each one does, and the levels
 * — a palette shows one level at a time, a `CommandPaletteSearch` or a
 * `CommandPaletteForm`, and the caller decides which.
 */

/* ── The window ─────────────────────────────────────────────────────────── */

interface PaletteContextValue {
  where?: string
  modKey: string
  escWord: string
  popupRef: RefObject<HTMLDivElement | null>
  /** Beside the box, where a lit row's `preview` is drawn. */
  previewSlot: HTMLDivElement | null
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

function usePalette(part: string) {
  const palette = useContext(PaletteContext)
  if (!palette) throw new Error(`[@estiva-app/ui] ${part} must be inside a CommandPalette.`)
  return palette
}

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The window's name for a screen reader — there is no title on screen. */
  label: string
  /** The footer's left side: where the palette was opened from. */
  where?: string
  /**
   * How the footer spells the modifier in `Ctrl+Backspace` and `Ctrl+Enter` —
   * `Cmd` on a Mac. The keys answer to Ctrl and Cmd either way; the package
   * does not guess the platform, the app says it.
   */
  modKey?: string
  /**
   * What the footer says Esc does. Default "close". An app that keeps what the palette holds when it is dismissed,
   * and shows it again on the next open, says "hide" while there is something to keep. The word only: Esc and a
   * click outside call `onOpenChange(false)` either way, and what is kept is the app's.
   */
  escWord?: string
  /** One level: a `CommandPaletteSearch` or a `CommandPaletteForm`. */
  children: ReactNode
}

/** The field a level starts on: the search field, or the form's first control. */
const CONTROL = 'input:not([type="hidden"]):not([tabindex="-1"]), textarea, button:not([tabindex="-1"]), [role="combobox"]'

function firstControl(popup: HTMLElement | null): HTMLElement | null {
  if (!popup) return null
  const field = popup.querySelector<HTMLElement>('[data-command-palette-field]')
  if (field) return field
  return popup.querySelector<HTMLElement>('[data-command-palette-fields]')?.querySelector<HTMLElement>(CONTROL) ?? null
}

export function CommandPalette({ open, onOpenChange, label, where, modKey = 'Ctrl', escWord = 'close', children }: CommandPaletteProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  /*
    Focus never falls out of a level.

    Measured in the prototype: when Enter picks a row that then leaves the
    list, or a level is swapped for another, the element that had focus is
    gone, and focus lands on the page or on the dialog's own box. Every key
    after that goes nowhere — Esc still closes, and nothing else works. So
    after every render, a frame later, focus that is nowhere goes to the
    level's first control. Focus that is somewhere — a list opened from a
    field, which is portalled out of this box — is left alone.
  */
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      const popup = popupRef.current
      const active = document.activeElement
      if (popup && (!active || active === document.body || active === popup)) firstControl(popup)?.focus()
    })
    return () => cancelAnimationFrame(frame)
  })

  const [previewSlot, setPreviewSlot] = useState<HTMLDivElement | null>(null)
  const context = useMemo(() => ({ where, modKey, escWord, popupRef, previewSlot }), [where, modKey, escWord, previewSlot])

  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center pt-[16vh]">
          <Dialog.Popup
            ref={popupRef}
            aria-label={label}
            initialFocus={() => firstControl(popupRef.current) ?? true}
            onFocus={(e) => {
              if (e.target === popupRef.current) firstControl(popupRef.current)?.focus()
            }}
            /* `outline-none`: the box is a programmatic focus target, not a
               Tab stop — the same reason as DialogShell's card. The window is
               the box inside it, so a preview can sit beside the box and still
               be inside the dialog: a click on it is not a click outside. */
            className="relative flex w-[658px] max-w-[calc(100vw-32px)] outline-none"
          >
            {/* @estiva-escape(no-copied-look): A3 (Katerina, 24 September: leave CommandPalette alone): the palette's window keeps its own border */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border-default bg-bg-elevated shadow-lg">
              <PaletteContext.Provider value={context}>{children}</PaletteContext.Provider>
            </div>
            {/* The lit row's preview: 12px to the right of the box, level with its top (KIN-3, Miky's 5 November prototype). */}
            <div ref={setPreviewSlot} className="absolute left-full top-0 ml-3 flex w-[280px] flex-col empty:hidden" />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ── The parts every level shares ───────────────────────────────────────── */

/**
 * The level you are in, drawn as a chip before the field. Removing it goes
 * back, and so does Backspace at the start of the field — one meaning for the
 * chip, whichever way you reach it.
 */
export interface CommandPaletteChip {
  label: string
  /** Before the label, 16px — an icon, a mark. */
  leading?: ReactNode
  onBack: () => void
}

function LevelChip({ chip, onBack }: { chip: CommandPaletteChip; onBack: () => void }) {
  return <InputChip label={chip.label} leading={chip.leading} onRemove={onBack} removeLabel={`Leave ${chip.label}`} truncate className="max-w-[272px] shrink-0" />
}

/** Going back leaves focus in the level you land on, whichever way you went. */
function useBack(chip: CommandPaletteChip | undefined, popupRef: RefObject<HTMLDivElement | null>) {
  return () => {
    if (!chip) return
    chip.onBack()
    requestAnimationFrame(() => firstControl(popupRef.current)?.focus())
  }
}

type Key = [key: string, word: string]

function Footer({ keys }: { keys: Key[] }) {
  const { where } = usePalette('The footer')
  return (
    <div className={cn('flex h-9 shrink-0 items-center gap-4 border-t border-border-subtle px-5', MONO_CAPTION_CLASSES, 'signal:text-text-muted leaf:font-mono leaf:text-small')}>
      <span className="min-w-0 flex-1 truncate">{where}</span>
      {keys.map(([key, word]) => (
        <span key={key} className="flex shrink-0 items-center gap-1.5">
          <Kbd>{key}</Kbd> {word}
        </span>
      ))}
    </div>
  )
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/* ── A level of rows ────────────────────────────────────────────────────── */

export interface CommandPaletteRow {
  /** Unique in the level. The footer follows the lit row by it. */
  id: string
  label: string
  /** The second line — where it is, who said it, when; a file's summary. */
  description?: string
  /** After the label, muted: where a file sits (an issue's ref and project) when its second line is its summary. */
  aside?: string
  /** A 16px icon, drawn on the row's 32px tile. */
  icon?: ReactNode
  /** Instead of `icon`: something with a look of its own — a face, a status mark — in the same 32px space, with no tile. */
  leading?: ReactNode
  /** Enter, or a click. */
  onSelect: () => void
  /** The row leads to more rows: Tab, or → at the end of the text, goes in, and the row shows a chevron. */
  onGoIn?: () => void
  /** The row is the person's own history: Ctrl+Backspace forgets it. */
  onForget?: () => void
  /**
   * What the row stands for, drawn beside the box while the row is lit — the card a link to it draws, read only.
   * Mounted only once the row has stayed lit for a moment, so arrowing past a row draws (and reads) nothing for it;
   * never in a prompt, and never where the window has no room beside the box.
   */
  preview?: ReactNode
}

export interface CommandPaletteGroup {
  /** The heading over the rows. A group with no rows is not drawn. */
  label: string
  rows: CommandPaletteRow[]
}

export interface CommandPaletteSearchProps {
  query: string
  onQueryChange: (query: string) => void
  placeholder: string
  groups: CommandPaletteGroup[]
  /** The level you are in. Without one, this is the first level and there is nowhere to go back to. */
  chip?: CommandPaletteChip
  /** A line under the rows while more are on their way — "Searching…". */
  pending?: string
  /**
   * Quiet lines under the rows, for what a person should know about them and
   * cannot act on — "2 more where you cannot open them", "the search was
   * refused, so this list is incomplete". Plain lines, never rows: the arrows
   * do not stop on them.
   */
  notes?: string[]
  /** The line when there are no rows. Leave it out while rows are still on their way. */
  empty?: string
  /** Above the rows: a `CommandPaletteWorking`, `CommandPaletteAnswer` or `CommandPaletteQuote`. */
  children?: ReactNode
  /**
   * The field as a prompt rather than a search: it grows to three lines, the
   * sparkles lead it, and no row is lit until an arrow key lights one — so
   * Enter sends what was written (`onSubmit`), and Shift+Enter is a new line.
   * The caller decides when the words stopped being a search.
   */
  prompt?: CommandPalettePrompt
  /**
   * What a prompt written here would be about, named in a chip above the
   * field. Not the back `chip`: it scopes nothing and goes nowhere.
   */
  about?: string
}

export interface CommandPalettePrompt {
  /** Enter, with no row lit. */
  onSubmit: () => void
  /** The footer's word for what Enter does — "ask". */
  submitWord: string
}

type ListGroup = { value: string; items: CommandPaletteRow[] }

/** The palette as a search: a query field, rows in labelled groups walked with
 *  the arrow keys, and what to show while nothing has arrived and when nothing
 *  matches. */
export function CommandPaletteSearch({ query, onQueryChange, placeholder, groups, chip, pending, notes = [], empty, children, prompt, about }: CommandPaletteSearchProps) {
  const { modKey, escWord, popupRef } = usePalette('CommandPaletteSearch')
  const back = useBack(chip, popupRef)
  /*
    The moment the field becomes a prompt, the search's first row is still lit:
    Base UI lit it for the change that brought the third word (a paste brings
    all three at once), before it was told to light nothing. It has no public
    way to clear a highlight, but it drops one whose row is gone — so the list
    is empty for the one render in which the mode turns, and the rows come
    back, unlit, before anything is painted.

    The same one render takes a prompt's highlight away when ↑ leaves the
    first row (`unlighting`), which is the way back to Enter sending the words.
  */
  const [settledPrompt, setSettledPrompt] = useState(!!prompt)
  const [unlighting, setUnlighting] = useState(false)
  const turning = (!!prompt && !settledPrompt) || unlighting
  useLayoutEffect(() => {
    if (settledPrompt !== !!prompt) setSettledPrompt(!!prompt)
    if (unlighting) setUnlighting(false)
  }, [prompt, settledPrompt, unlighting])
  const items = useMemo<ListGroup[]>(
    () => (turning ? [] : groups.filter((g) => g.rows.length > 0).map((g) => ({ value: g.label, items: g.rows }))),
    [groups, turning],
  )
  const rows = items.flatMap((g) => g.items)

  /*
    The lit row, followed by id rather than held as an object: a caller that
    builds its rows again on every render hands Base UI new objects with the
    same ids, and a key must run the handler of the row on screen now, not
    of the one that was lit a render ago.
  */
  const [litId, setLitId] = useState<string | undefined>()
  const lit = litId === undefined ? undefined : rows.find((r) => r.id === litId)

  /*
    The lit row stays lit when rows arrive above it (F7).

    Base UI keeps the highlight's *position*, not its row: measured, with the
    second row lit, two rows arriving above it handed the highlight to
    whatever now sat second, and Enter would have opened that. Base UI has no
    public way to set the highlight, so the palette walks it back with the
    arrow keys, exactly as a person would. It does so only when Base UI moved
    the highlight by itself ("none") — never after an arrow, the pointer, or
    typing, which starts again from the first row.

    And only once the person has moved the highlight on this level. Until then
    the lit row is simply the first one, and a row that arrives above it — a
    thread's own rows, a moment after opening — becomes the first one.
  */
  // Base UI types its field as an input; it is drawn as a textarea (below), and only what the two share is used.
  const inputRef = useRef<HTMLInputElement>(null)
  const reported = useRef<{ id?: string; reason?: string }>({})
  const settled = useRef<{ id?: string; query: string; level?: string } | null>(null)
  /** The person has moved the highlight since the text or the level last changed. */
  const moved = useRef(false)
  useLayoutEffect(() => {
    const before = settled.current
    const now = reported.current
    const sameLevel = before?.query === query && before?.level === chip?.label
    if (!sameLevel) moved.current = false
    if (moved.current && before?.id && now.reason === 'none' && now.id !== before.id && sameLevel) {
      const ids = rows.map((r) => r.id)
      const want = ids.indexOf(before.id)
      const at = now.id === undefined ? -1 : ids.indexOf(now.id)
      const input = inputRef.current
      if (input && want !== -1 && at !== -1) {
        const key = want > at ? 'ArrowDown' : 'ArrowUp'
        for (let step = 0; step < Math.abs(want - at); step++) {
          input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
        }
      }
    }
    settled.current = { id: reported.current.id, query, level: chip?.label }
  })

  const onKeyDown = (e: BaseUIEvent<KeyboardEvent<HTMLInputElement>>) => {
    if (e.key === 'Enter') {
      /*
        The field is a textarea so that it can grow without being swapped for
        another element mid-word. As a search it is still one line: Enter
        never writes a line break there. As a prompt, Shift+Enter does, and
        Enter with no row lit sends the words.
      */
      // The Enter that confirms an input method's word belongs to the input method.
      if (e.nativeEvent.isComposing) {
        e.preventBaseUIHandler()
        return
      }
      if (prompt && e.shiftKey) {
        e.preventBaseUIHandler()
        return
      }
      if (prompt && !lit) {
        e.preventDefault()
        e.preventBaseUIHandler()
        prompt.onSubmit()
        return
      }
      if (!lit || e.shiftKey) e.preventDefault()
      return
    }
    if (prompt && e.key === 'ArrowUp' && !e.shiftKey) {
      // In a prompt ↑ walks back out of the rows: from the first one to the
      // words, where Enter sends again; and with no row lit it moves the text
      // cursor up a line, never down to the last row.
      if (!lit) {
        e.preventBaseUIHandler()
        return
      }
      if (rows[0]?.id === lit.id) {
        e.preventDefault()
        e.preventBaseUIHandler()
        setUnlighting(true)
        return
      }
    }
    if (e.key === 'Home' || e.key === 'End') {
      // Home and End move the text cursor and nothing else (the key list).
      // Base UI also sends the highlight to the first or last row (measured),
      // so its handling stops here and the field's own takes over.
      e.preventBaseUIHandler()
      return
    }
    const field = e.currentTarget
    const collapsed = field.selectionStart === field.selectionEnd
    const atStart = collapsed && field.selectionStart === 0
    const atEnd = collapsed && field.selectionEnd === field.value.length
    if (e.key === 'Backspace' && (e.ctrlKey || e.metaKey)) {
      // Forgetting is for a row that can be forgotten; anywhere else the key
      // deletes a word, as it does in any field.
      if (lit?.onForget) {
        e.preventDefault()
        lit.onForget()
      }
      return
    }
    if (e.key === 'Backspace' && atStart && chip && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      back()
      return
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab never walks out of the field at a level of rows: it goes in, or
      // it does nothing (the key list).
      e.preventDefault()
      lit?.onGoIn?.()
      return
    }
    if (e.key === 'ArrowRight' && atEnd && lit?.onGoIn && !e.shiftKey) {
      e.preventDefault()
      lit.onGoIn()
    }
  }

  const keys: Key[] = [
    ...(rows.length > 1 ? ([['↑↓', 'move']] as Key[]) : []),
    ...(lit ? ([lit.onGoIn ? ['Tab', 'go in'] : ['Enter', 'open']] as Key[]) : prompt ? ([['Enter', prompt.submitWord]] as Key[]) : []),
    ...(lit?.onForget ? ([[`${modKey}+Backspace`, 'forget']] as Key[]) : []),
    // Backspace goes back from the start of the field; it is named while the
    // field is empty, when that is what it will do.
    ...(chip && query === '' ? ([['Backspace', 'back']] as Key[]) : []),
    ['Esc', escWord],
  ]

  return (
    <Autocomplete.Root
      items={items}
      mode="none"
      inline
      open
      value={query}
      onValueChange={(value, details) => {
        // Pressing a row would write the row's name into the field.
        if (details.reason === 'item-press') return
        // A search is one line, whatever was pasted into it.
        onQueryChange(prompt ? value : value.replace(/\s*\n\s*/g, ' '))
      }}
      itemToStringValue={(row) => (row as CommandPaletteRow).label}
      /* The first row is always lit, so Enter always has something to do;
         the highlight stays where it is when the pointer leaves; and the
         arrows stop at the ends rather than wrapping (the key list). */
      autoHighlight={prompt ? false : 'always'}
      /* In a prompt a row the pointer only passed over goes dark again, or
         Enter would open it instead of sending the words. */
      keepHighlight={!prompt}
      loopFocus={false}
      onItemHighlighted={(row, details) => {
        const id = (row as CommandPaletteRow | undefined)?.id
        reported.current = { id, reason: details.reason }
        if (details.reason !== 'none') moved.current = true
        setLitId(id)
      }}
    >
      {about && (
        <div className="flex shrink-0 px-5 pt-3">
          <Chip label={about} />
        </div>
      )}
      <div className={cn('flex shrink-0 gap-3 border-b border-border-subtle px-5', prompt ? 'items-start py-3' : 'h-12 items-center')}>
        {prompt ? (
          <IconSparkles size={16} stroke={1.5} className="mt-1 shrink-0 text-text-secondary" />
        ) : (
          <IconSearch size={16} stroke={1.5} className="shrink-0 text-text-secondary" />
        )}
        {chip && <LevelChip chip={chip} onBack={back} />}
        {/* @estiva-escape(no-copied-look): A5 (Katerina, 24 September: leave CommandPalette alone): the palette's search field keeps its own classes */}
        <Autocomplete.Input
          ref={inputRef}
          data-command-palette-field=""
          placeholder={placeholder}
          /* Named by what it asks for. Chrome would fall back to the
             placeholder by itself; said outright, the name does not depend
             on a fallback (ChipInput's field lost its name to one, Finding 6). */
          aria-label={placeholder}
          onKeyDown={onKeyDown}
          /* A textarea at one line or three, never an input swapped for one:
             the caret and the focus stay where they are as the field grows. */
          render={<textarea rows={prompt ? 3 : 1} />}
          className={cn(
            'min-w-0 flex-1 resize-none bg-transparent text-input-value text-text-primary outline-none transition-[height] duration-200 placeholder:text-text-muted',
            prompt ? 'h-[4.5rem]' : 'h-6 overflow-hidden whitespace-nowrap',
          )}
        />
      </div>

      {/* The rows' box is a menu's (P4, Katerina 16 September): 8px in from
          the edge, so the lit row's fill sits where it sits in every menu,
          and the tiles line up with the magnifier at 21px. */}
      <ScrollArea viewportClassName="max-h-[420px]" contentClassName="flex flex-col p-2">
        {children != null && <div className="flex flex-col gap-2 px-3 pb-2 pt-3">{children}</div>}

        <Autocomplete.List className="flex flex-col">
          {(group: ListGroup) => (
            <Autocomplete.Group key={group.value} items={group.items} className="flex flex-col gap-0.5">
              {/* A heading labels the rows, it is not one of them: read
                  secondary, as in a menu (MenuSection). 2px under it and
                  between its rows, as every list has (Katerina, 5 October). */}
              <Autocomplete.GroupLabel className="flex h-7 shrink-0 items-center px-3">
                <SectionLabel tone="secondary">{group.value}</SectionLabel>
              </Autocomplete.GroupLabel>
              <Autocomplete.Collection>
                {(row: CommandPaletteRow) => (
                  /* The menu row, as the list's own option — the way Select
                     puts it on `Select.Item`. One row, two parts. */
                  <Autocomplete.Item key={row.id} value={row} onClick={() => row.onSelect()} className={menuItemClassName({ size: 'tall' })}>
                    <MenuItemBody
                      size="tall"
                      label={row.label}
                      description={row.description}
                      aside={row.aside}
                      leading={<RowLeading row={row} />}
                      submenu={!!row.onGoIn}
                      hint={row.onGoIn ? <Kbd>Tab</Kbd> : <EnterHint />}
                    />
                  </Autocomplete.Item>
                )}
              </Autocomplete.Collection>
            </Autocomplete.Group>
          )}
        </Autocomplete.List>

        {/* Both lines stay mounted, as Base UI asks, so a screen reader hears
            them change; they take no room while they say nothing. */}
        <Autocomplete.Status className="flex items-center gap-2 px-3 [&:not(:empty)]:h-8">
          {pending && (
            <>
              <IconLoader2 size={12} stroke={1.5} className="shrink-0 animate-spin text-text-muted" />
              <span className="text-caption text-text-muted">{pending}</span>
            </>
          )}
        </Autocomplete.Status>
        {notes.map((note) => (
          <div key={note} className="flex min-h-8 items-center px-3">
            <FieldLine>{note}</FieldLine>
          </div>
        ))}
        <Autocomplete.Empty className="flex items-center px-3 [&:not(:empty)]:min-h-10">
          {empty && <EmptyState scope="section" message={empty} />}
        </Autocomplete.Empty>
      </ScrollArea>

      <Footer keys={keys} />
      <LitPreview row={prompt || turning ? undefined : lit} />
    </Autocomplete.Root>
  )
}

/** How long a row stays lit before its preview is drawn: arrowing through a list passes rows faster than this. */
const PREVIEW_PAUSE_MS = 200
/** The narrowest window with room for the 280px preview and its 12px gap beside the centred 658px box. */
const ROOM_BESIDE = '(min-width: 1280px)'

function subscribeRoom(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia(ROOM_BESIDE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Whether the window has room beside the box. Without `matchMedia` (a test, a server) it is taken to. */
function useRoomBeside(): boolean {
  return useSyncExternalStore(
    subscribeRoom,
    () => (typeof window === 'undefined' || !window.matchMedia ? true : window.matchMedia(ROOM_BESIDE).matches),
    () => true,
  )
}

/**
 * The lit row's preview, beside the box. Drawn after the row has stayed lit for a pause, and gone the moment it is not
 * lit — never the card of a row that was lit a moment ago. Where the window is too narrow it is not drawn at all, rather
 * than covering the box or pushing it aside.
 */
function LitPreview({ row }: { row: CommandPaletteRow | undefined }) {
  const { previewSlot } = usePalette('CommandPaletteSearch')
  const room = useRoomBeside()
  const id = row?.preview != null ? row.id : undefined
  const [shownId, setShownId] = useState<string | undefined>()
  useEffect(() => {
    if (id === undefined) return
    const timer = setTimeout(() => setShownId(id), PREVIEW_PAUSE_MS)
    return () => clearTimeout(timer)
  }, [id])
  if (!room || !previewSlot || id === undefined || shownId !== id) return null
  /*
    504px: the box at its tallest — the 48px field, the rows' 420px and the 36px footer — so a long card scrolls
    rather than hanging below the box.
  */
  // @estiva-escape(no-hand-rolled-behaviour): the pane sits beside the window, outside its clipped box but inside the dialog, so a click on it is not a click outside; no Base UI part draws a pane beside a popup
  return createPortal(
    <MenuPanel data-command-palette-preview="" className="w-full p-0">
      <ScrollArea viewportClassName="max-h-[504px]">{row?.preview}</ScrollArea>
    </MenuPanel>,
    previewSlot,
  )
}

/** Every row leads with the same 32px space, so labels line up whatever leads them. */
function RowLeading({ row }: { row: CommandPaletteRow }) {
  if (row.icon != null) {
    return <span className="flex size-8 items-center justify-center rounded-sm bg-bg-inset text-text-secondary">{row.icon}</span>
  }
  return <span className="flex size-8 items-center justify-center">{row.leading}</span>
}

/* ── A level that is a form ─────────────────────────────────────────────── */

export interface CommandPaletteFormProps {
  /** Names what the form makes, and goes back when removed. */
  chip: CommandPaletteChip
  /** Before the chip, 16px — the mark of whatever the form writes to. */
  icon?: ReactNode
  /** The button's word, and the footer's beside Ctrl+Enter. */
  submitLabel: string
  onSubmit: () => void
  /** Why submitting has to wait — nothing changed yet. The button says it on hover, and Ctrl+Enter does nothing. */
  submitWaits?: string
  /** While the thing is being made: the fields lock, the button reads `button`, and `line` says what is happening. */
  working?: { button: string; line: string }
  /** What went wrong, beside the button. */
  error?: string
  /** The fields, each in a `Field`. */
  children: ReactNode
}

const TEXT_TYPES = new Set(['', 'text', 'search', 'email', 'url', 'tel', 'password', 'number'])

/** A field you type into — not a list, and not a chip field, whose Backspace takes a chip. */
function isTextField(el: Element | null): el is HTMLInputElement | HTMLTextAreaElement {
  if (el instanceof HTMLTextAreaElement) return true
  return el instanceof HTMLInputElement && TEXT_TYPES.has(el.getAttribute('type') ?? '') && el.getAttribute('role') !== 'combobox' && el.tabIndex >= 0
}

/** The palette as a form: fields, one submit button, and Ctrl+Enter — both ways
 *  in run Base UI's field check. It shows what it is working on and what failed,
 *  and sends focus to the first field that needs something. */
export function CommandPaletteForm({ chip, icon, submitLabel, onSubmit, submitWaits, working, error, children }: CommandPaletteFormProps) {
  const { modKey, escWord, popupRef } = usePalette('CommandPaletteForm')
  const back = useBack(chip, popupRef)
  const frameRef = useRef<HTMLDivElement>(null)
  const busy = !!working
  const busyRef = useRef(busy)
  busyRef.current = busy

  /** A field that says it needs something: Base UI marks the `Field` itself. */
  const firstInvalid = () => frameRef.current?.querySelector<HTMLElement>('[data-invalid]')?.querySelector<HTMLElement>(CONTROL) ?? null

  /*
    The form's one way in: its button (type="submit") and Ctrl+Enter both
    arrive here through the package Form's submit, so Base UI's field check
    runs for both. The guard stays: a waiting button is focusable while
    disabled, so it is not the browser that stops it.
  */
  const submit = () => {
    if (busyRef.current || submitWaits) return
    onSubmit()
    // If the caller marked fields instead of starting, the first of them
    // takes focus: the key list's "focus goes to the first".
    requestAnimationFrame(() => {
      if (!busyRef.current) firstInvalid()?.focus()
    })
  }

  /*
    The lock must not lose focus — measured in the prototype, where after
    Ctrl+Enter no key but Esc ever worked again. The package Form does it now
    (UIG-7): while it works, focus sits on the form, where its keys still
    arrive; when it stops, focus goes to the first field that needs something,
    or back where it was, or to the first field.
  */

  /*
    Backspace goes back only where nothing typed is lost: from an empty text
    field, or from anywhere in a form that has no text field at all (a form
    that is one list). In a list inside a form with text fields it does
    nothing, so walking the form with Tab never throws the draft away.
  */
  const backWorksFrom = (el: Element | null) => {
    const frame = frameRef.current
    if (!frame || busy || !el || !frame.contains(el)) return false
    if (isTextField(el)) return el.value === ''
    return ![...frame.querySelectorAll('input, textarea')].some(isTextField)
  }

  // The footer names Backspace only where it works, so it follows focus and typing.
  const [backNamed, setBackNamed] = useState(false)
  const measure = () => setBackNamed(backWorksFrom(document.activeElement))
  useLayoutEffect(measure)

  // Ctrl+Enter is the Form's; plain Enter in a field sends nothing here (`enterSends={false}`).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey && backWorksFrom(e.target as Element)) {
      e.preventDefault()
      back()
    }
  }

  const keys: Key[] = [
    ...(!busy && !submitWaits ? ([[`${modKey}+Enter`, lowerFirst(submitLabel)]] as Key[]) : []),
    ...(backNamed ? ([['Backspace', 'back']] as Key[]) : []),
    ['Esc', escWord],
  ]

  return (
    <div ref={frameRef} tabIndex={-1} onKeyDown={onKeyDown} onFocus={measure} onBlur={measure} onInput={measure} className="flex min-h-0 flex-col outline-none">
      {/* @estiva-escape(no-handmade-header): the palette's own input bar, the twin of its search row; the level chip stands where the field was */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle px-5">
        {icon != null && <span className="flex shrink-0 items-center text-text-secondary">{icon}</span>}
        <LevelChip chip={chip} onBack={back} />
      </div>
      {/* The package Form, from the fields to the button (UIG-7). The chip row
          stays outside it, so its ✕ still goes back while the form works; the
          button row is inside it, so focus that was on the button is held.
          The fields are found through data-command-palette-fields. The form is
          `free`, a scrolling body over a button row; the fields inside stack as
          every form's do, 24px apart (Katerina, 28 September: they were 16). */}
      <Form data-command-palette-fields="" busy={busy} enterSends={false} onSubmit={submit} layout="free" className="flex min-h-0 flex-col">
        <ScrollArea viewportClassName="max-h-[420px]" contentClassName="flex flex-col px-5 py-4">
          <div className={FIELDS_CLASSES}>{children}</div>
        </ScrollArea>
        <div className="flex shrink-0 items-center gap-3 px-5 pb-4">
          <div className="min-w-0 flex-1">
            {working ? <FieldLine>{working.line}</FieldLine> : error ? <FieldLine tone="error">{error}</FieldLine> : null}
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={busy}
            disabledReason={busy ? undefined : submitWaits}
            leadingIcon={busy ? <IconLoader2 size={16} stroke={1.5} className="animate-spin" /> : undefined}
          >
            {working ? working.button : submitLabel}
          </Button>
        </div>
      </Form>
      <Footer keys={keys} />
    </div>
  )
}

/* ── What sits above the rows ───────────────────────────────────────────── */

const BAR_WIDTHS = ['w-4/5', 'w-3/5', 'w-2/3']

export interface CommandPaletteWorkingProps {
  /** What is happening — "Reading 12 messages…". */
  children: ReactNode
  /** Grey bars under the line, where the result will be. Default 2. */
  bars?: 0 | 1 | 2 | 3
}

/** A line saying what is being worked on, with grey bars where the result will land. */
export function CommandPaletteWorking({ children, bars = 2 }: CommandPaletteWorkingProps) {
  return (
    <div role="status" className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-caption text-text-secondary">
        <IconLoader2 size={14} stroke={1.5} className="shrink-0 animate-spin" />
        {children}
      </span>
      {BAR_WIDTHS.slice(0, bars).map((width) => (
        <SkeletonBar key={width} className={cn('h-3', width)} />
      ))}
    </div>
  )
}

export interface CommandPaletteAnswerProps {
  /**
   * The answer's text. A blank line starts a new paragraph, and a number in
   * square brackets — `[1]` — is drawn as a small mark pointing at the row of
   * the same number below.
   */
  children: string
  /** A quiet line under the answer — what a key will do now. */
  note?: string
}

/** A written answer, with marks that point at the rows it came from. */
export function CommandPaletteAnswer({ children, note }: CommandPaletteAnswerProps) {
  const paragraphs = children.split(/\n\s*\n/).filter((p) => p.trim() !== '')
  return (
    <div className="flex flex-col gap-2">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="whitespace-pre-wrap text-body-2 text-text-primary">
          {/* A mark belongs to the word before it: the space a writer leaves
              before "[1]" would stand between them as a gap. */}
          {paragraph.split(/\s*(\[\d+\])/).map((part, j) =>
            /^\[\d+\]$/.test(part) ? (
              <sup key={j} className="ml-0.5 font-mono text-small text-accent-text">
                {part.slice(1, -1)}
              </sup>
            ) : (
              part
            ),
          )}
        </p>
      ))}
      {note && <FieldLine>{note}</FieldLine>}
    </div>
  )
}

export interface CommandPaletteQuoteProps {
  /** Text written for someone to use — shown as it will be used, line breaks kept. */
  children: string
}

/** Text written to be used elsewhere, set off by a rule at its left edge. */
export function CommandPaletteQuote({ children }: CommandPaletteQuoteProps) {
  return <p className="whitespace-pre-wrap border-l-2 border-border-default pl-3 text-body-2 text-text-primary">{children}</p>
}

export interface CommandPaletteProposalProps {
  /** Where it would be made: the app and the action — "App › New item". */
  source: string
  /** The app's mark before the source, as small as the line (about 10px). */
  mark?: ReactNode
  /** What would be made, in a sentence. */
  children: string
}

/**
 * Something the palette offers to make, before anything is made: a card with
 * where it would be made on top, then what it would be. A card because it is a
 * thing about to exist, not text to read or use; the source first because two
 * apps may offer something alike (UIG-40, Katerina 28 September: the look Peek's
 * launcher already had, now drawn by the palette, ruling P4).
 */
export function CommandPaletteProposal({ source, mark, children }: CommandPaletteProposalProps) {
  return (
    <Card fill="surface" className="flex flex-col gap-1 p-3">
      <span className="flex items-center gap-2 text-caption text-text-secondary">
        {mark}
        {source}
      </span>
      <span className="text-body-2 text-text-primary">{children}</span>
    </Card>
  )
}
