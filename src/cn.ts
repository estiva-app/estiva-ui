import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Peek's `cn`: clsx for the conditionals, tailwind-merge for the conflicts.
 *
 * Remember the pitfall the README records: a custom text-size class in a
 * merged list is dropped when a `text-{colour}` follows it. Inside this
 * package, sizes are arbitrary values (`text-[12px]`), never the token class.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
