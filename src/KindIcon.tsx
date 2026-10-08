import { IconBox, IconCircleDashed, IconFile, IconListDetails, IconMessage } from '@tabler/icons-react'
import { cn } from './cn'

/**
 * What a thing is, as the apps name it: a topic, a project, an issue, another
 * app's file, or a message.
 *
 * The one part that names Estiva's own kinds of thing (Katerina, 8 October):
 * every app draws the same icon for the same kind, so the table lives here once
 * instead of in each app.
 */
export type ThingKind = 'topic' | 'project' | 'issue' | 'file' | 'message'

const ICONS = {
  topic: IconCircleDashed,
  project: IconBox,
  issue: IconListDetails,
  file: IconFile,
  message: IconMessage,
} satisfies Record<ThingKind, unknown>

/*
  The event kinds behind them (SPEC §6.7 and each app's manifest). Numbers
  rather than an import: this package depends on no protocol code.
*/
const KIND_MESSAGE = 9
const KIND_CHANNEL = 39000
const KIND_BARE_FILE = 30840
const KIND_PROJECT = 30850
const KIND_ISSUE = 30851

/**
 * The kind of thing behind an event kind: a message is a message, a channel or
 * a bare file is a topic, a project and an issue are themselves, and anything
 * else is another app's file.
 */
export function thingKindOf(eventKind: number | undefined): ThingKind {
  if (eventKind === KIND_MESSAGE) return 'message'
  if (eventKind === KIND_CHANNEL || eventKind === KIND_BARE_FILE) return 'topic'
  if (eventKind === KIND_PROJECT) return 'project'
  if (eventKind === KIND_ISSUE) return 'issue'
  return 'file'
}

export interface KindIconProps {
  kind: ThingKind
  /** 16 in a row or a list; 14 inside a chip. Default 16. */
  size?: 14 | 16
  /**
   * `secondary`: the quieter grey a list row's icon wears. `inherit`: the ink
   * of what holds it — a chip, a selected row. Default `secondary`.
   */
  tone?: 'secondary' | 'inherit'
  /** Space and position only. */
  className?: string
}

const TONE_CLASSES = { secondary: 'text-text-secondary', inherit: '' } as const

/** The icon before a thing's name that says what kind of thing it is. */
export function KindIcon({ kind, size = 16, tone = 'secondary', className }: KindIconProps) {
  const Icon = ICONS[kind]
  return <Icon size={size} stroke={1.5} className={cn('shrink-0', TONE_CLASSES[tone], className)} aria-hidden />
}
