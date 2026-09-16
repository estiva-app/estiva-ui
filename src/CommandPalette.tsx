import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Autocomplete } from '@base-ui/react/autocomplete'
import type { BaseUIEvent } from '@base-ui/react/types'
import { IconLoader2, IconSearch } from '@tabler/icons-react'
import { cn } from './cn'
import { Button } from './Button'
import { InputChip } from './ChipInput'
import { EmptyState } from './EmptyState'
import { FieldLine } from './Field'
import { Kbd } from './Kbd'
import { EnterHint, MenuItemBody, menuItemClassName } from './Menu'
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
  popupRef: RefObject<HTMLDivElement | null>
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

export function CommandPalette({ open, onOpenChange, label, where, modKey = 'Ctrl', children }: CommandPaletteProps) {
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

  const context = useMemo(() => ({ where, modKey, popupRef }), [where, modKey])

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
               Tab stop — the same reason as DialogShell's card. */
            className="flex w-[658px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-lg border border-border-default bg-bg-elevated shadow-lg outline-none"
          >
            <PaletteContext.Provider value={context}>{children}</PaletteContext.Provider>
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
    <div className="flex h-9 shrink-0 items-center gap-4 border-t border-border-subtle px-5 text-caption text-text-secondary signal:font-mono signal:text-small signal:text-text-muted">
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
  /** The second line — where it is, who said it, when. */
  description?: string
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
  /** The line when there are no rows. Leave it out while rows are still on their way. */
  empty?: string
  /** Above the rows: a `CommandPaletteWorking`, `CommandPaletteAnswer` or `CommandPaletteQuote`. */
  children?: ReactNode
}

type ListGroup = { value: string; items: CommandPaletteRow[] }

export function CommandPaletteSearch({ query, onQueryChange, placeholder, groups, chip, pending, empty, children }: CommandPaletteSearchProps) {
  const { modKey, popupRef } = usePalette('CommandPaletteSearch')
  const back = useBack(chip, popupRef)
  const items = useMemo<ListGroup[]>(() => groups.filter((g) => g.rows.length > 0).map((g) => ({ value: g.label, items: g.rows })), [groups])
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
  */
  const inputRef = useRef<HTMLInputElement>(null)
  const reported = useRef<{ id?: string; reason?: string }>({})
  const settled = useRef<{ id?: string; query: string; level?: string } | null>(null)
  useLayoutEffect(() => {
    const before = settled.current
    const now = reported.current
    if (before?.id && now.reason === 'none' && now.id !== before.id && before.query === query && before.level === chip?.label) {
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
    ...(lit ? ([lit.onGoIn ? ['Tab', 'go in'] : ['Enter', 'open']] as Key[]) : []),
    ...(lit?.onForget ? ([[`${modKey}+Backspace`, 'forget']] as Key[]) : []),
    // Backspace goes back from the start of the field; it is named while the
    // field is empty, when that is what it will do.
    ...(chip && query === '' ? ([['Backspace', 'back']] as Key[]) : []),
    ['Esc', 'close'],
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
        onQueryChange(value)
      }}
      itemToStringValue={(row) => (row as CommandPaletteRow).label}
      /* The first row is always lit, so Enter always has something to do;
         the highlight stays where it is when the pointer leaves; and the
         arrows stop at the ends rather than wrapping (the key list). */
      autoHighlight="always"
      keepHighlight
      loopFocus={false}
      onItemHighlighted={(row, details) => {
        const id = (row as CommandPaletteRow | undefined)?.id
        reported.current = { id, reason: details.reason }
        setLitId(id)
      }}
    >
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle px-5">
        <IconSearch size={16} stroke={1.5} className="shrink-0 text-text-secondary" />
        {chip && <LevelChip chip={chip} onBack={back} />}
        <Autocomplete.Input
          ref={inputRef}
          data-command-palette-field=""
          placeholder={placeholder}
          /* Named by what it asks for. Chrome would fall back to the
             placeholder by itself; said outright, the name does not depend
             on a fallback (ChipInput's field lost its name to one, Finding 6). */
          aria-label={placeholder}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-input-value text-text-primary outline-none placeholder:text-text-muted"
        />
      </div>

      {/* The rows' box is a menu's (P4, Katerina 16 September): 8px in from
          the edge, so the lit row's fill sits where it sits in every menu,
          and the tiles line up with the magnifier at 21px. */}
      <ScrollArea viewportClassName="max-h-[420px]" contentClassName="flex flex-col p-2">
        {children != null && <div className="flex flex-col gap-2 px-3 pb-2 pt-3">{children}</div>}

        <Autocomplete.List className="flex flex-col">
          {(group: ListGroup) => (
            <Autocomplete.Group key={group.value} items={group.items} className="flex flex-col">
              {/* A heading labels the rows, it is not one of them: read
                  secondary, as in a menu (MenuSection). */}
              <Autocomplete.GroupLabel className="flex h-7 shrink-0 items-center px-3">
                <SectionLabel className="text-text-secondary">{group.value}</SectionLabel>
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
        <Autocomplete.Empty className="flex items-center px-3 [&:not(:empty)]:min-h-10">
          {empty && <EmptyState scope="section" message={empty} />}
        </Autocomplete.Empty>
      </ScrollArea>

      <Footer keys={keys} />
    </Autocomplete.Root>
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

export function CommandPaletteForm({ chip, icon, submitLabel, onSubmit, submitWaits, working, error, children }: CommandPaletteFormProps) {
  const { modKey, popupRef } = usePalette('CommandPaletteForm')
  const back = useBack(chip, popupRef)
  const frameRef = useRef<HTMLDivElement>(null)
  const busy = !!working
  const busyRef = useRef(busy)
  busyRef.current = busy
  const returnTo = useRef<HTMLElement | null>(null)

  /** A field that says it needs something: Base UI marks the `Field` itself. */
  const firstInvalid = () => frameRef.current?.querySelector<HTMLElement>('[data-invalid]')?.querySelector<HTMLElement>(CONTROL) ?? null

  const submit = () => {
    if (busyRef.current || submitWaits) return
    const active = document.activeElement
    returnTo.current = active instanceof HTMLElement && frameRef.current?.contains(active) ? active : null
    onSubmit()
    // If the caller marked fields instead of starting, the first of them
    // takes focus: the key list's "focus goes to the first".
    requestAnimationFrame(() => {
      if (!busyRef.current) firstInvalid()?.focus()
    })
  }

  /*
    The lock must not lose focus.

    Locking disables the fields, and a disabled field drops focus to the page
    — measured in the prototype, where after Ctrl+Enter no key but Esc ever
    worked again, even after the error came back. So while the form works,
    focus sits on the form's own box, where its keys still arrive; when it
    stops, focus goes to the first field that needs something, or back where
    it was, or to the first field.
  */
  useLayoutEffect(() => {
    if (busy) {
      frameRef.current?.focus()
      return
    }
    if (document.activeElement !== frameRef.current) return
    const was = returnTo.current
    const target = firstInvalid() ?? (was?.isConnected && !(was as HTMLButtonElement).disabled ? was : null) ?? firstControl(popupRef.current)
    target?.focus()
    // Runs when the lock changes, and reads the DOM it leaves behind.
  }, [busy])

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

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      submit()
      return
    }
    if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey && backWorksFrom(e.target as Element)) {
      e.preventDefault()
      back()
    }
  }

  const keys: Key[] = [
    ...(!busy && !submitWaits ? ([[`${modKey}+Enter`, lowerFirst(submitLabel)]] as Key[]) : []),
    ...(backNamed ? ([['Backspace', 'back']] as Key[]) : []),
    ['Esc', 'close'],
  ]

  return (
    <div ref={frameRef} tabIndex={-1} onKeyDown={onKeyDown} onFocus={measure} onBlur={measure} onInput={measure} className="flex min-h-0 flex-col outline-none">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle px-5">
        {icon != null && <span className="flex shrink-0 items-center text-text-secondary">{icon}</span>}
        <LevelChip chip={chip} onBack={back} />
      </div>
      <ScrollArea viewportClassName="max-h-[420px]" contentClassName="flex flex-col px-5 py-4">
        {/* `contents`: the fieldset only locks; the fields lay out as if it
            were not there. */}
        <fieldset data-command-palette-fields="" disabled={busy} className="contents">
          <div className="flex flex-col gap-4">{children}</div>
        </fieldset>
      </ScrollArea>
      <div className="flex shrink-0 items-center gap-3 px-5 pb-4">
        <div className="min-w-0 flex-1">
          {working ? <FieldLine>{working.line}</FieldLine> : error ? <FieldLine tone="error">{error}</FieldLine> : null}
        </div>
        <Button
          variant="primary"
          onClick={submit}
          disabled={busy}
          disabledReason={busy ? undefined : submitWaits}
          leadingIcon={busy ? <IconLoader2 size={16} stroke={1.5} className="animate-spin" /> : undefined}
        >
          {working ? working.button : submitLabel}
        </Button>
      </div>
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
              <sup key={j} className="ml-0.5 font-mono text-small text-accent-primary">
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
