import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type FC } from 'react'
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
import { Lightbox } from './Lightbox'
import { Link } from './Link'
import { WithTooltip, type WithTooltipProps } from './Tooltip'
import { cn } from './cn'

/**
 * Something attached — a document or an image — drawn as a card.
 *
 * Peek's two attachment components, class for class (UIG-27, Katerina's ruling
 * of 14 September that both apps draw one): `FileAttachmentCard`, the card on
 * something already posted, and `PendingAttachmentChip`, the card in a composer
 * waiting to go. The card is told the result — a `src`, an `href`, a `state` —
 * and hands a click back through `onOpen`, `onDownload` and `onRemove`.
 *
 * **It now does the rest of the job too** (UIG-35, Katerina 20 September):
 * given a `remoteSrc` and the app's `fetchImage`, it fetches a file the reader
 * needs permission for and draws the wait and the refusal; it opens a picture
 * full screen in the package's `Lightbox`; and with `download` it saves the
 * file. Peek and Ship had each written those three around it, 174 and 181 lines
 * that did the same things differently — Ship's pictures never opened at all.
 * What stays an app's is the one thing only it knows: how to fetch with its own
 * authorization.
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
function Truncating({ text, hint, className, wrapperClassName, placement }: { text: string; hint?: string; className: string; wrapperClassName?: string; placement?: WithTooltipProps['placement'] }) {
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
    <WithTooltip label={hint ?? text} placement={placement} wrapperClassName={cn('min-w-0 flex-col', wrapperClassName)}>
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
  /**
   * What the picture shows, where the sender said — Ship carries one on every
   * `imeta`. It is what a screen reader reads and what the viewer is named
   * with; `name` is still the file's name, under the thumbnail. Without it the
   * name does both jobs.
   */
  alt?: string
  /**
   * A file the app has to *fetch* before it can be used — one on a relay, where
   * reading it needs the reader's own authorization (UIG-35). Give `fetchImage`
   * with it. For a picture the card waits, draws it, and says so if it cannot
   * be read, so no app writes that state machine again; for a document the
   * result is where the row opens, and until it lands the row is dimmed rather
   * than pretending to open. Ignored when `src` is set.
   */
  remoteSrc?: string
  /**
   * The full-size picture, fetched only when someone opens it. A thread of
   * screenshots would otherwise pull every original at full size to draw them
   * at 112px. Until it arrives the viewer shows the thumbnail.
   */
  remoteFullSrc?: string
  /** How this app fetches a picture it is allowed to read: a URL in, a URL the
   *  browser can draw out (an object URL, usually). */
  fetchImage?: (url: string) => Promise<string>
  /**
   * What a click on an image's picture does. Without it the card **opens the
   * picture itself**, full screen, in the package's `Lightbox` — which is what
   * both apps wanted and one of them had written by hand.
   */
  onOpen?: () => void
  /** Shows a download control on hover or focus, and calls this. */
  onDownload?: () => void
  /**
   * Shows the download control and **saves the file itself**, under `name`:
   * the original where there is one (`remoteFullSrc`), otherwise what the card
   * is drawing. Use `onDownload` instead when the app must do it another way.
   */
  download?: boolean
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

/**
 * A picture that has to be fetched before it can be drawn.
 *
 * The result remembers which URL it is *about*, so an answer about a file this
 * card is no longer showing is ignored during render rather than erased in an
 * effect afterwards — setting state synchronously in an effect is a second
 * render every time the card is handed a different file. Peek and Ship had
 * written this hook once each; it lives here now (UIG-35).
 */
function useRemoteImage(url: string | undefined, fetchImage?: (url: string) => Promise<string>) {
  const [result, setResult] = useState<{ for?: string; src?: string; failed?: boolean }>({})
  // The fetcher is an app's function and is usually written inline, so it is
  // read through a ref: a new identity on every render must not re-fetch.
  const fetcher = useRef(fetchImage)
  fetcher.current = fetchImage
  useEffect(() => {
    if (!url || !fetcher.current) return
    let live = true
    fetcher.current(url).then(
      (src) => {
        if (live) setResult({ for: url, src })
      },
      () => {
        if (live) setResult({ for: url, failed: true })
      },
    )
    return () => {
      live = false
    }
  }, [url])
  const current = result.for === url
  return { src: current ? result.src : undefined, failed: current ? !!result.failed : false }
}

/** Save a file under its own name: its bytes' object URL, handed to a
 *  temporary `<a download>`. Falls back to opening it when the fetch is
 *  refused — a cross-origin file the browser will not hand over. */
async function saveFile(source: string, name: string): Promise<void> {
  /*
    Bytes already in hand — an object URL from the app's own fetch, or a data
    URL — go straight to the anchor. Fetching them again would ask the browser
    to re-read a blob it is already holding, and `fetch` on a `blob:` URL is
    exactly what a jsdom test cannot do either.
  */
  if (source.startsWith('blob:') || source.startsWith('data:')) {
    handToAnchor(source, name)
    return
  }
  try {
    const res = await fetch(source)
    if (!res.ok) throw new Error(String(res.status))
    const objectUrl = URL.createObjectURL(await res.blob())
    handToAnchor(objectUrl, name)
    URL.revokeObjectURL(objectUrl)
  } catch {
    // A file the browser will not hand over is opened instead, which is the
    // only other thing a person can do with it.
    window.open(source, '_blank', 'noopener')
  }
}

function handToAnchor(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function AttachmentCard({
  name,
  size,
  contentType,
  href,
  src,
  alt,
  remoteSrc,
  remoteFullSrc,
  fetchImage,
  onOpen,
  onDownload,
  download = false,
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

  /*
    The picture, and the state that goes with fetching one. A `src` the app
    already has needs none of this; `remoteSrc` is the case where reading the
    file is a request, with a wait and a way to fail.
  */
  const remote = useRemoteImage(src ? undefined : remoteSrc, fetchImage)
  const picture = image ? (src ?? remote.src) : undefined
  const fetching = !src && !!remoteSrc && !!fetchImage
  /*
    The wait and the refusal are drawn for a **picture**. A document that has to
    be fetched keeps the row it always had and simply has nowhere to open yet:
    its name, its type and its size are already on screen and are what the
    reader is looking at, where an image without its bytes is a blank card.
  */
  const drawnState: AttachmentCardState =
    state !== 'ready' ? state : image && fetching ? (remote.failed ? 'unreadable' : picture ? 'ready' : 'loading') : state
  // Where a document opens: what the app passed, or the bytes it fetched.
  const address = href ?? (!image && fetching ? remote.src : undefined)

  // Full screen. The original is fetched only once somebody opens it, and the
  // thumbnail stands in until it arrives: a moment of a smaller picture beats a
  // moment of an empty screen.
  const [opened, setOpened] = useState(false)
  const full = useRemoteImage(opened ? remoteFullSrc : undefined, fetchImage)
  const openable = image && !!picture && !pending
  const openPicture = onOpen ?? (openable ? () => setOpened(true) : undefined)
  const viewer =
    opened && picture ? <Lightbox src={full.src ?? picture} alt={alt ?? name} onClose={() => setOpened(false)} /> : null

  /*
    Saving. `download` is the card doing it, which is what both apps were doing
    around it; `onDownload` stays for an app that must do it another way. The
    original is saved where there is one — never the thumbnail on screen — and
    it is fetched here rather than reusing the viewer's copy, so a file can be
    saved without ever being opened.
  */
  const saveHere = download
    ? () => {
        const source = remoteFullSrc ?? remoteSrc
        if (source && fetchImage) {
          void fetchImage(source).then(
            (resolved) => saveFile(resolved, name),
            // Without this a refused read is an unhandled rejection in the page
            // rather than a download that did not happen.
            () => {},
          )
          return
        }
        const local = address ?? picture
        if (local) void saveFile(local, name)
      }
    : undefined
  const saving = onDownload ?? saveHere

  if (pending) {
    const failed = state === 'failed'
    const warning = state === 'warning'
    return (
      // @estiva-escape: a failed or warning file's strong hairline is AttachmentCard's own state; Card's attention hairlines are the soft ones (UIG-9, Katerina 17 September)
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
          {/* Below, not above: above, a cut name's tooltip covered the ✕ on the corner (UIG-14, C4). */}
          <Truncating text={name} className={NAME_CLASSES} placement={onRemove ? 'bottom' : undefined} />
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
            // Shows with the card's hover and with keyboard focus, as Download does: hover-only left it invisible to
            // the keyboard that had reached it (UIG-14, C4, Katerina 19 September).
            className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-bg-elevated border border-border-strong flex items-center justify-center text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity"
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
  const downloadControl = saving ? (
    // @estiva-escape: Download shows when its card is pointed at or focused, AttachmentCard's own action; IconButton has no reveal on its card's hover (UIG-9, Katerina 17 September)
    <IconButton
      variant="muted"
      tooltip="Download"
      aria-label={`Download ${name}`}
      className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity"
      onClick={(event) => {
        event.stopPropagation()
        saving()
      }}
    >
      <IconDownload size={16} stroke={1.5} />
    </IconButton>
  ) : null

  if (drawnState === 'loading') {
    return (
      // `role="status"`: a plain box may not carry a name (axe, aria-prohibited-attr), and a
      // status says what it is doing — loading — to a reader that cannot see the pulse.
      // @estiva-escape: the loading pulse is AttachmentCard's own state; Card has no loading state (UIG-9, Katerina 17 September)
      <Card role="status" fill="inset" aria-busy="true" aria-label={`Loading ${name}`} className={cn('w-[180px] h-28 animate-pulse', className)} {...props}>
        {null}
      </Card>
    )
  }

  if (drawnState === 'unreadable') {
    return (
      // @estiva-escape: a file that could not be read is faded as well as dashed, AttachmentCard's own state; Card has no faded state (UIG-9, Katerina 17 September)
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

  if (image && picture) {
    const thumbnail = <img src={picture} alt={alt ?? name} className="w-full h-28 object-cover" />
    return (
      <>
        <Card fill="inset" hover="hairline" clip className={cn('group relative flex flex-col w-[180px]', className)} {...props}>
          {openPicture ? (
            <BaseButton
              type="button"
              className="block w-full"
              aria-label={`Preview ${name}`}
              onClick={(event) => {
                event.stopPropagation()
                openPicture()
              }}
            >
              {thumbnail}
            </BaseButton>
          ) : (
            <div className="block w-full">{thumbnail}</div>
          )}
          <div className="flex items-center gap-1 pl-2 pr-1 py-1 min-w-0">
            <Truncating text={name} className="flex-1 text-caption text-text-primary truncate" wrapperClassName="flex-1" />
            {downloadControl}
          </div>
        </Card>
        {viewer}
      </>
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
    // @estiva-escape: a file that cannot be opened is faded, AttachmentCard's own state; Card has no faded state (UIG-9, Katerina 17 September)
    <Card fill="inset" hover={address ? 'hairline' : 'none'} className={cn('group flex items-center gap-2 w-[240px] p-1.5 pr-1', !address && 'opacity-70', className)} {...props}>
      {address ? (
        <Link href={address} external variant="plain" className="flex items-center gap-2 min-w-0 flex-1" onClick={(event) => event.stopPropagation()}>
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-2 min-w-0 flex-1">{body}</div>
      )}
      {downloadControl}
    </Card>
  )
}
