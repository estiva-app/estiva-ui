import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from './cn'

/**
 * One tile of an icon rail: the icon in its hover tile, a 9px label
 * under it (Peek's NavItem, 2026-09-02, verbatim — minus the router).
 *
 * The original computed its own active state from the route and rendered
 * a router link; neither belongs in a shared component. This one takes
 * `active` and renders an anchor — a router app keeps a thin wrapper
 * that does its own matching and intercepts the click.
 *
 * Active is `bg-selected` on the tile — some themes also give the icon
 * their interactive colour.
 */
export interface RailItemProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
  href: string
  /** 16px, stroke 1.5. */
  icon: ReactNode
  label: string
  active?: boolean
  className?: string
}

export function RailItem({ href, icon, label, active = false, className, ...props }: RailItemProps) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn('group flex w-full flex-col items-center gap-0.5 px-2 py-0.5', className)}
      {...props}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-lg p-2 transition-colors',
          active ? 'bg-bg-selected' : 'group-hover:bg-bg-hover',
        )}
      >
        <span
          className={cn(
            'flex items-center transition-colors',
            active ? 'text-text-primary signal:text-[color:var(--text-interactive)]' : 'text-text-secondary',
          )}
        >
          {icon}
        </span>
      </div>
      <span className={cn('text-center text-[9px] font-medium leading-[115%]', active ? 'text-text-primary' : 'text-text-secondary')}>
        {label}
      </span>
    </a>
  )
}
