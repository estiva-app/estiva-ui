import { useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type FC } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconDownload,
  IconFile,
  IconFileTypeCsv,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypePpt,
  IconFileTypeTxt,
  IconFileTypeXls,
  IconFileTypeZip,
  IconJson,
  IconLoader2,
  IconMarkdown,
  IconX,
} from '@tabler/icons-react'
import { Card } from './Card'
import { IconButton } from './IconButton'
import { Link } from './Link'
import { WithTooltip } from './Tooltip'
import { cn } from './cn'

/**
 * Something attached — a document or an image — drawn as a card.
 *
 * Peek's two attachment components, class for class (UIG-27, Katerina's ruling
 * of 14 September that both apps draw one): `FileAttachmentCard`, the card on
 * something already posted, and `PendingAttachmentChip`, the card in a composer
 * waiting to go. What stays in each app is what only the app can do: fetch the
 * bytes with the reader's own permission, open an image full screen, save a
 * file. The card is told the result — a `src`, an `href`, a `state` — and hands
 * a click back through `onOpen`, `onDownload` and `onRemove`.
 *
 * Two shapes, decided by the file: an **image** with a picture is a 180px
 * thumbnail you can open; anything else is a 240px **row** — a type tile, the
 * name, and what it is. Waiting to be sent (`pending`) it is a 200px row with a
 * remove control on its corner.
 *
 * One change from Peek, by ruling: a file that could not be read has a dashed
 * hairline, as every card that cannot be read does.
 */
export type AttachmentCardState = 'ready' | 'loading' | 'unreadable' | 'uploading' | 'failed' | 'warning'

const ICON_BY_EXTENSION: Record<string, FC<{ size?: number; stroke?: number; className?: string }>> = {
  pdf: IconFileTypePdf,
  doc: IconFileTypeDocx,
  docx: IconFileTypeDocx,
  xls: IconFileTypeXls,
  xlsx: IconFileTypeXls,
  ppt: IconFileTypePpt,
  pptx: IconFileTypePpt,
  csv: IconFileTypeCsv,
  txt: IconFileTypeTxt,
  rtf: IconFileTypeTxt,
  zip: IconFileTypeZip,
  json: IconJson,
  md: IconMarkdown,
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif', 'svg'])

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

const isImage = (name: string, contentType?: string) => IMAGE_EXTENSIONS.has(extensionOf(name)) || (contentType?.startsWith('image/') ?? false)

/** `'2.4 MB'`, `'812 KB'`, `'340 bytes'`. */
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} bytes`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

/** `'PDF'`, `'ZIP'`, `'DOCX'`, `'FILE'`. */
const typeLabelOf = (name: string) => extensionOf(name).toUpperCase() || 'FILE'

const TILE_CLASSES = 'size-9 rounded-md bg-bg-active flex items-center justify-center shrink-0 text-text-secondary'
const NAME_CLASSES = 'text-caption font-medium text-text-primary truncate'
const NOTE_CLASSES = 'text-small tracking-wide leading-tight truncate'

function TypeIcon({ name }: { name: string }) {
  const Icon = ICON_BY_EXTENSION[extensionOf(name)] ?? IconFile
  return <Icon size={20} stroke={1.5} />
}

/**
 * A line that truncates, with its full words on hover only when they are cut off — a name that fits, or a size,
 * shows nothing extra (Katerina, 2026-09-14; Breadcrumb's rule, 2026-09-01). `hint`, when given, is always on hover:
 * it says more than the line, not the same words again.
 *
 * Measured like Breadcrumb's crumbs: on mount, when the line resizes, and when the fonts arrive — a name set in
 * the fallback face can fit and then not, in a line whose box never changes. The wrapper is `flex-col` so the
 * text stretches across it, as wide as it is without one.
 */
function Truncating({ text, hint, className, wrapperClassName }: { text: string; hint?: string; className: string; wrapperClassName?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [cut, setCut] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let live = true
    const measure = () => {
      if (live) setCut(el.scrollWidth > el.clientWidth)
    }
    measure()
    void document.fonts?.ready.then(measure)
    // jsdom has neither layout nor ResizeObserver; without this guard an app cannot render a card in its tests.
    if (typeof ResizeObserver === 'undefined') return () => void (live = false)
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      live = false
      observer.disconnect()
    }
    // `cut` re-runs it: wrapping the line mounts a new element, and that one is the one to watch.
  }, [text, cut])
  const line = (
    <span ref={ref} className={className}>
      {text}
    </span>
  )
  if (!hint && !cut) return line
  return (
    <WithTooltip label={hint ?? text} wrapperClassName={cn('min-w-0 flex-col', wrapperClassName)}>
      {line}
    </WithTooltip>
  )
}

export interface AttachmentCardProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The name it was attached under, extension included: it decides the icon and the type label. */
  name: string
  /** In bytes. */
  size?: number
  /** Its MIME type, where known: an `image/…` type is an image whatever its name. */
  contentType?: string
  /** Where a document opens, in a new tab. Without it the row is dimmed and opens nothing. */
  href?: string
  /** The picture an image card draws. Without it an image is drawn as a row. */
  src?: string
  /** What a click on an image's picture does — the app's full-screen view. */
  onOpen?: () => void
  /** Shows a download control on hover or focus, and calls this. */
  onDownload?: () => void
  /** Waiting to be sent: the composer's 200px row, with a remove control on its corner. */
  pending?: boolean
  /** Removes a pending card. */
  onRemove?: () => void
  /**
   * `ready` · `loading` (an image on its way) · `unreadable` (it could not be read) ·
   * `uploading`, `failed`, `warning` (while pending). Default `ready`.
   */
  state?: AttachmentCardState
  /** The line under the name, in place of its type and size — why it failed, or what the warning is. */
  note?: string
  /** The note's full words, on hover, where the line is short. */
  noteHint?: string
}

export function AttachmentCard({
  name,
  size,
  contentType,
  href,
  src,
  onOpen,
  onDownload,
  pending = false,
  onRemove,
  state = 'ready',
  note,
  noteHint,
  className,
  ...props
}: AttachmentCardProps) {
  const image = isImage(name, contentType)
  const sizeText = size === undefined ? '' : formatBytes(size)

  if (pending) {
    const failed = state === 'failed'
    const warning = state === 'warning'
    return (
      <Card
        fill="elevated"
        className={cn('group relative flex items-center gap-2 w-[200px] p-1.5 pr-3', failed ? 'border-error-default' : warning && 'border-warning-default', className)}
        {...props}
      >
        <div className={cn(TILE_CLASSES, 'overflow-hidden')}>
          {state === 'uploading' ? (
            <IconLoader2 size={16} stroke={1.5} className="animate-spin" />
          ) : failed ? (
            <IconAlertCircle size={16} stroke={1.5} className="text-error-default" />
          ) : warning ? (
            <IconAlertTriangle size={16} stroke={1.5} className="text-warning-default" />
          ) : image && src ? (
            <img src={src} alt={name} className="size-full object-cover" />
          ) : (
            <span className="text-menu font-semibold">{typeLabelOf(name)}</span>
          )}
        </div>
        <div className="flex flex-col gap-[1px] min-w-0">
          <Truncating text={name} className={NAME_CLASSES} />
          <Truncating
            text={(failed || warning ? note : state === 'uploading' ? (note ?? 'Uploading…') : (note ?? sizeText)) ?? ''}
            hint={noteHint}
            className={cn(NOTE_CLASSES, failed ? 'text-error-default' : warning ? 'text-warning-default' : 'text-text-secondary')}
          />
        </div>
        {/* On Base UI's Button, as InputChip's ✕ is (Katerina, 2026-09-14): IconButton is a 24px square
            that fills on hover, and this is Peek's 20px round badge on the card's corner. */}
        {onRemove && (
          <BaseButton
            type="button"
            aria-label={`Remove ${name}`}
            className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-bg-elevated border border-border-strong flex items-center justify-center text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
          >
            <IconX size={11} stroke={1.75} />
          </BaseButton>
        )}
      </Card>
    )
  }

  // Fades in with the card's hover or keyboard focus, and keeps its slot when hidden, so revealing it never shifts the row.
  const download = onDownload ? (
    <IconButton
      variant="muted"
      tooltip="Download"
      aria-label={`Download ${name}`}
      className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity"
      onClick={(event) => {
        event.stopPropagation()
        onDownload()
      }}
    >
      <IconDownload size={16} stroke={1.5} />
    </IconButton>
  ) : null

  if (state === 'loading') {
    return (
      // `role="status"`: a plain box may not carry a name (axe, aria-prohibited-attr), and a
      // status says what it is doing — loading — to a reader that cannot see the pulse.
      <Card role="status" fill="inset" aria-busy="true" aria-label={`Loading ${name}`} className={cn('w-[180px] h-28 animate-pulse', className)} {...props}>
        {null}
      </Card>
    )
  }

  if (state === 'unreadable') {
    return (
      <Card fill="inset" unreadable className={cn('flex items-center gap-2 w-[240px] p-1.5 opacity-70', className)} {...props}>
        <div className={TILE_CLASSES}>
          <TypeIcon name={name} />
        </div>
        <div className="flex flex-col gap-[1px] min-w-0 text-left">
          <Truncating text={name} className={NAME_CLASSES} />
          <span className={cn(NOTE_CLASSES, 'text-text-secondary')}>{note ?? 'Could not be loaded'}</span>
        </div>
      </Card>
    )
  }

  if (image && src) {
    const picture = <img src={src} alt={name} className="w-full h-28 object-cover" />
    return (
      <Card fill="inset" hover="hairline" className={cn('group relative flex flex-col w-[180px] overflow-hidden', className)} {...props}>
        {onOpen ? (
          <BaseButton
            type="button"
            className="block w-full"
            aria-label={`Preview ${name}`}
            onClick={(event) => {
              event.stopPropagation()
              onOpen()
            }}
          >
            {picture}
          </BaseButton>
        ) : (
          <div className="block w-full">{picture}</div>
        )}
        <div className="flex items-center gap-1 pl-2 pr-1 py-1 min-w-0">
          <Truncating text={name} className="flex-1 text-caption text-text-primary truncate" wrapperClassName="flex-1" />
          {download}
        </div>
      </Card>
    )
  }

  const body = (
    <>
      <div className={TILE_CLASSES}>
        <TypeIcon name={name} />
      </div>
      <div className="flex flex-col gap-[1px] min-w-0 text-left">
        <Truncating text={name} className={NAME_CLASSES} />
        <span className={cn(NOTE_CLASSES, 'text-text-secondary')}>{note ?? `${typeLabelOf(name)} · ${sizeText}`}</span>
      </div>
    </>
  )
  return (
    <Card fill="inset" hover={href ? 'hairline' : 'none'} className={cn('group flex items-center gap-2 w-[240px] p-1.5 pr-1', !href && 'opacity-70', className)} {...props}>
      {href ? (
        <Link href={href} external variant="plain" className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={(event) => event.stopPropagation()}>
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-2 min-w-0 flex-1">{body}</div>
      )}
      {download}
    </Card>
  )
}
