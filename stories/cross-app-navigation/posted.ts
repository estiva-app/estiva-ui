import { useSyncExternalStore } from 'react'
import type { Message } from './fixtures'

/**
 * Messages one app writes for another in this prototype, by the topic they
 * went to: an Update Ship shares when a project is completed shows in Peek.
 * Kept for the story's life; a reload forgets it.
 */
let posted: Record<string, Message[]> = {}
/** A project's status, once someone changed it here. */
let statuses: Record<string, string> = {}
const listeners = new Set<() => void>()

export function post(topics: string[], m: Message) {
  posted = { ...posted, ...Object.fromEntries(topics.map((t) => [t, [...(posted[t] ?? []), m]])) }
  listeners.forEach((l) => l())
}

export function setStatus(file: string, status: string) {
  statuses = { ...statuses, [file]: status }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const usePosted = () => useSyncExternalStore(subscribe, () => posted)
export const useStatuses = () => useSyncExternalStore(subscribe, () => statuses)
