/**
 * The "…" that floats over a row's or a card's top-right corner in a list the
 * person arranges, and the menu it opens: Show as Row or Card, the one in use
 * ticked, then Remove (Miky, 6 Nov, the topics level-up prototype).
 *
 * It sits where `AttachedCard`'s ✕ sits and takes no room of its own: shown
 * while the pointer is over the item, while the "…" has focus or its menu is
 * open, and always on a screen that cannot hover, so a tap reaches it. "Show
 * as", "Row" and "Card" are the words `ReferenceMenu` uses for the same choice.
 *
 * Without `menu` it draws only its child, in the same box: where the person
 * cannot arrange the list, the app passes nothing and no "…" is drawn.
 */
import type { ReactNode } from 'react'
import { IconCheck, IconDotsVertical } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { Menu, MenuItem, MenuSection, MenuSeparator } from './Menu'

/** How an item in a list shows: one line, or its card. */
export type CornerMenuLook = 'row' | 'card'

const LOOKS: { look: CornerMenuLook; label: string }[] = [
  { look: 'row', label: 'Row' },
  { look: 'card', label: 'Card' },
]

export interface CornerMenuOptions {
  /** The item's name: the "…" is "More options for {name}". */
  name: string
  /** How it shows now: ticked under Show as. */
  look: CornerMenuLook
  /** Show as Row or Card was chosen: the other look than `look`. Choosing the one in use calls nothing. */
  onLook: (look: CornerMenuLook) => void
  /** Remove was chosen. */
  onRemove: () => void
}

export interface CornerMenuProps {
  /** The row or the card the "…" floats over. */
  children: ReactNode
  /** The "…" and its menu. Without it only `children` are drawn: where the person cannot arrange the list. */
  menu?: CornerMenuOptions
}

export function CornerMenu({ children, menu }: CornerMenuProps) {
  return (
    // At most 480px, as `AttachedCard`, so the "…" sits on the card's corner and not at the column's edge.
    <div className="group/corner relative max-w-[480px]">
      {children}
      {menu && (
        <div className="absolute -right-2 -top-2 z-10 rounded-md border border-border-strong bg-bg-elevated opacity-0 shadow-sm transition-opacity group-hover/corner:opacity-100 focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100 [@media(hover:none)]:opacity-100">
          <Menu
            align="right"
            trigger={
              <IconButton tooltip="More options" aria-label={`More options for ${menu.name}`}>
                <IconDotsVertical size={16} stroke={1.5} />
              </IconButton>
            }
          >
            <MenuSection label="Show as">
              {LOOKS.map(({ look, label }) => (
                <MenuItem
                  key={look}
                  role="menuitemradio"
                  aria-checked={menu.look === look}
                  label={label}
                  trailing={menu.look === look ? <IconCheck size={16} aria-hidden /> : undefined}
                  onClick={() => {
                    if (menu.look !== look) menu.onLook(look)
                  }}
                />
              ))}
            </MenuSection>
            <MenuSeparator />
            <MenuItem label="Remove" onClick={menu.onRemove} />
          </Menu>
        </div>
      )}
    </div>
  )
}
