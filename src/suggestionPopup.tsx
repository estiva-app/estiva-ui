// @estiva-escape(component-has-a-page, component-has-a-story): draws nothing of its own — it opens a SuggestionMenu from a Tiptap suggestion plugin, and SuggestionMenu's page and stories show it (UIG-31)
import { forwardRef, useRef, useImperativeHandle } from 'react'
import { ReactRenderer } from '@tiptap/react'
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import { SuggestionMenu, type SuggestionMenuHandle, type SuggestionMenuRow, type SuggestionMenuSection } from './SuggestionMenu'

/*
 * Is a type-ahead list open? — Peek's counter (`mention.tsx`), moved here with
 * the lists it counts (UIG-31).
 *
 * A counter rather than a boolean: two suggestion plugins can overlap for a
 * moment while one hands over to the other (`/` choosing "Mention" types `@`).
 * An editor asks before it acts on Enter or Escape, so a key that chose a row
 * does not also send the message or cancel the edit.
 *
 * A list counts while it shows rows, not while its trigger listens: since a
 * space stopped closing one (f586437a), "meet @ 5pm" leaves `@` listening
 * behind a hidden list to the end of the line, and that Enter must still send.
 */
let openCount = 0
let lastClose = 0

/**
 * Open, or closed less than 100ms ago — what an Enter handler asks. Choosing a
 * row with Enter closes the list, and that same Enter must not also send.
 */
export function isSuggestionActive(): boolean {
  return openCount > 0 || Date.now() - lastClose < 100
}

/**
 * Open *now*, with no grace period — what an Escape handler asks. The first
 * Escape closes the list, the second is somebody's deliberate press.
 */
export function isSuggestionOpen(): boolean {
  return openCount > 0
}

/** How a list looks and what fills it — everything but the editor's own wiring. */
export interface SuggestionPopupOptions<T> {
  /** Names the list — "Commands", "People". */
  ariaLabel: string
  /** The box's width, e.g. `w-[300px]`. */
  width: string
  /** The cap before the rows scroll, e.g. `max-h-[400px]`. */
  maxHeight: string
  /** The plugin's items, and the typed query, → the sections to draw. One unlabeled section by default. */
  sections?: (items: T[], query: string) => readonly SuggestionMenuSection<T>[]
  itemKey: (item: T) => string
  row: (item: T) => SuggestionMenuRow
  /**
   * With `refresh`: called with a listener while the list is open; the app
   * calls it when its data has changed (a search landing), and the open list is
   * drawn again for the same query. Returns the unsubscribe, run when the list
   * closes however it closes.
   */
  subscribe?: (listener: () => void) => () => void
  /** The items for a query, as the plugin's `items` answers — asked again when `subscribe` fires. */
  refresh?: (query: string) => T[]
}

type Props<T> = SuggestionProps<T> & { options: SuggestionPopupOptions<T> }

// `forwardRef`, so Tiptap's `ReactRenderer` hands its `ref` through whichever
// way it detects a component that takes one.
const Popup = forwardRef<SuggestionMenuHandle, Props<unknown>>(function Popup({ options, ...props }, handle) {
  const menu = useRef<SuggestionMenuHandle>(null)
  useImperativeHandle(handle, () => ({ onKeyDown: (event) => menu.current?.onKeyDown(event) ?? false }))
  const sections = options.sections ? options.sections(props.items, props.query) : [{ items: props.items }]
  return (
    <SuggestionMenu
      handle={menu}
      rect={props.clientRect?.() ?? null}
      editorElement={props.editor.view.dom}
      ariaLabel={options.ariaLabel}
      width={options.width}
      maxHeight={options.maxHeight}
      sections={sections}
      itemKey={options.itemKey}
      row={options.row}
      onSelect={(item) => props.command(item)}
    />
  )
})

/**
 * The `render` of a Tiptap suggestion plugin, drawn as a `SuggestionMenu` —
 * the popup controller Peek wrote four times (`mention.tsx`, `slashCommands.tsx`),
 * once.
 *
 *     Suggestion({ editor, char: '/', items, command,
 *       render: suggestionPopup({ ariaLabel: 'Commands', width: 'w-[300px]',
 *         maxHeight: 'max-h-[400px]', itemKey, row, sections }) })
 *
 * It mounts the list when the query starts and removes it when it ends: the
 * plugin owns the list's life. Escape closes it and is used up; ↑, ↓ and Enter
 * go to the list; every other key stays the editor's. The list portals itself
 * (the package `Popover`), so the mount point is only a mount point.
 */
export function suggestionPopup<T>(options: SuggestionPopupOptions<T>): NonNullable<SuggestionOptions<T>['render']> {
  return () => {
    let component: ReactRenderer<SuggestionMenuHandle, Props<T>> | null = null
    let container: HTMLDivElement | null = null
    let last: SuggestionProps<T> | null = null
    let unsubscribe: (() => void) | undefined
    let counted = false
    const count = (shown: boolean) => {
      if (shown === counted) return
      counted = shown
      openCount = shown ? openCount + 1 : Math.max(0, openCount - 1)
    }
    const exit = () => {
      unsubscribe?.()
      unsubscribe = undefined
      last = null
      // The grace is for the Enter that picked a row and closed the list, not
      // for a keystroke that only left it with no rows.
      if (counted) lastClose = Date.now()
      count(false)
      if (!component) return
      component.destroy()
      container?.remove()
      component = null
      container = null
    }
    return {
      onStart: (props) => {
        count(props.items.length > 0)
        component = new ReactRenderer<SuggestionMenuHandle, Props<T>>(Popup as never, { props: { ...props, options }, editor: props.editor })
        container = document.createElement('div')
        document.body.appendChild(container)
        container.appendChild(component.element)
        last = props
        const { subscribe, refresh } = options
        if (subscribe && refresh) {
          // The plugin asks for items only when the query changes; an answer
          // landing later draws the open list again with the same props.
          unsubscribe = subscribe(() => {
            if (!last || !component) return
            last = { ...last, items: refresh(last.query) }
            count(last.items.length > 0)
            component.updateProps({ ...last, options })
          })
        }
      },
      onUpdate: (props) => {
        last = props
        count(props.items.length > 0)
        component?.updateProps({ ...props, options })
      },
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === 'Escape') {
          exit()
          return true
        }
        return component?.ref?.onKeyDown(event) ?? false
      },
      onExit: exit,
    }
  }
}
