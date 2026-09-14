import type { ComponentPropsWithRef, FC } from 'react'
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

const TILE = 'size-9 rounded-md bg-bg-active flex items-center justify-center shrink-0 text-text-secondary'
const NAME = 'text-[12px] font-medium leading-[1.3] text-text-primary truncate'
const NOTE = 'text-[10px] leading-[1.2] truncate'

function TypeIcon({ name }: { name: string }) {
  const Icon = ICON_BY_EXTENSION[extensionOf(name)] ?? IconFile
  return <Icon size={20} stroke={1.5} />
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
        <div className={cn(TILE, 'overflow-hidden')}>
          {state === 'uploading' ? (
            <IconLoader2 size={16} stroke={1.5} className="animate-spin" />
          ) : failed ? (
            <IconAlertCircle size={16} stroke={1.5} className="text-error-default" />
          ) : warning ? (
            <IconAlertTriangle size={16} stroke={1.5} className="text-warning-default" />
          ) : image && src ? (
            <img src={src} alt={name} className="size-full object-cover" />
          ) : (
            <span className="text-[9px] font-semibold">{typeLabelOf(name)}</span>
          )}
        </div>
        <div className="flex flex-col gap-[1px] min-w-0">
          {/* The ellipsis is fine as long as the full name can be read on hover (Katerina, 2026-09-07). */}
          <WithTooltip label={name} wrapperClassName="min-w-0">
            <span className={NAME}>{name}</span>
          </WithTooltip>
          <WithTooltip label={noteHint ?? sizeText} wrapperClassName="min-w-0">
            <span className={cn(NOTE, failed ? 'text-error-default' : warning ? 'text-warning-default' : 'text-text-secondary')}>
              {failed || warning ? note : state === 'uploading' ? (note ?? 'Uploading…') : (note ?? sizeText)}
            </span>
          </WithTooltip>
        </div>
        {onRemove && (
          <button
            type="button"
            aria-label={`Remove ${name}`}
            className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-bg-elevated border border-border-strong flex items-center justify-center text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
          >
            <IconX size={11} stroke={1.75} />
          </button>
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
      <Card fill="inset" aria-busy="true" aria-label={`Loading ${name}`} className={cn('w-[180px] h-28 animate-pulse', className)} {...props}>
        {null}
      </Card>
    )
  }

  if (state === 'unreadable') {
    return (
      <Card fill="inset" unreadable className={cn('flex items-center gap-2 w-[240px] p-1.5 opacity-70', className)} {...props}>
        <div className={TILE}>
          <TypeIcon name={name} />
        </div>
        <div className="flex flex-col gap-[1px] min-w-0 text-left">
          <span className={NAME}>{name}</span>
          <span className={cn(NOTE, 'text-text-secondary')}>{note ?? 'Could not be loaded'}</span>
        </div>
      </Card>
    )
  }

  if (image && src) {
    const picture = <img src={src} alt={name} className="w-full h-28 object-cover" />
    return (
      <Card fill="inset" hover="hairline" className={cn('group relative flex flex-col w-[180px] overflow-hidden', className)} {...props}>
        {onOpen ? (
          <button
            type="button"
            className="block w-full"
            aria-label={`Preview ${name}`}
            onClick={(event) => {
              event.stopPropagation()
              onOpen()
            }}
          >
            {picture}
          </button>
        ) : (
          <div className="block w-full">{picture}</div>
        )}
        <div className="flex items-center gap-1 pl-2 pr-1 py-1 min-w-0">
          <span className="flex-1 text-[12px] leading-[1.3] text-text-primary truncate">{name}</span>
          {download}
        </div>
      </Card>
    )
  }

  const body = (
    <>
      <div className={TILE}>
        <TypeIcon name={name} />
      </div>
      <div className="flex flex-col gap-[1px] min-w-0 text-left">
        <span className={NAME}>{name}</span>
        <span className={cn(NOTE, 'text-text-secondary')}>{note ?? `${typeLabelOf(name)} · ${sizeText}`}</span>
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
