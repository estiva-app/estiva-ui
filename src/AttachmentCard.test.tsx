// @vitest-environment jsdom
/**
 * What the AttachmentCard page claims, pinned: the file decides the shape (an
 * image with a picture is a thumbnail, anything else a row); a row with an href
 * opens in a new tab and a row without one is dimmed; the picture hands its
 * click to the app; download and remove are the app's too, and neither click
 * reaches what the card sits in; a pending card says what is happening to it;
 * and a file that could not be read is dashed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AttachmentCard } from './AttachmentCard'

afterEach(cleanup)

const classesOf = (el: Element | null) => el?.getAttribute('class')?.split(' ').filter(Boolean) ?? []
const rootOf = (container: HTMLElement) => container.firstElementChild!

describe('AttachmentCard', () => {
  it('a document is a row: its type, its name, and what it is', () => {
    const { container } = render(<AttachmentCard name="report.pdf" size={2_412_000} href="https://example.com/r" />)
    expect(classesOf(rootOf(container))).toContain('w-[240px]')
    expect(screen.getByText('report.pdf')).toBeTruthy()
    // 2,412,000 bytes is 2.3 MB by the 1024 steps Peek's own story shows.
    expect(screen.getByText('PDF · 2.3 MB')).toBeTruthy()
  })

  it('a row with an href opens it in a new tab, and its click stays out of what the card sits in', async () => {
    const outside = vi.fn()
    render(
      <div onClick={outside}>
        <AttachmentCard name="report.pdf" size={1000} href="https://example.com/r" />
      </div>,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('https://example.com/r')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    link.addEventListener('click', (event) => event.preventDefault())
    await userEvent.click(link)
    expect(outside).not.toHaveBeenCalled()
  })

  it('a row without an href is dimmed and opens nothing', () => {
    const { container } = render(<AttachmentCard name="report.pdf" size={1000} />)
    expect(classesOf(rootOf(container))).toContain('opacity-70')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('an image with a picture is a thumbnail, and its click is the app’s', async () => {
    const onOpen = vi.fn()
    const { container } = render(<AttachmentCard name="shot.png" src="data:image/png;base64,AA" onOpen={onOpen} />)
    expect(classesOf(rootOf(container))).toContain('w-[180px]')
    await userEvent.click(screen.getByRole('button', { name: 'Preview shot.png' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('an image type wins over a name with no extension', () => {
    const { container } = render(<AttachmentCard name="clipboard" contentType="image/png" src="data:image/png;base64,AA" />)
    expect(classesOf(rootOf(container))).toContain('w-[180px]')
  })

  it('download shows only when the app can do it, and its click is the app’s alone', async () => {
    const onDownload = vi.fn()
    const outside = vi.fn()
    render(<AttachmentCard name="report.pdf" size={1000} href="#" />)
    expect(screen.queryByRole('button', { name: 'Download report.pdf' })).toBeNull()
    cleanup()
    render(
      <div onClick={outside}>
        <AttachmentCard name="report.pdf" size={1000} href="#" onDownload={onDownload} />
      </div>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Download report.pdf' }))
    expect(onDownload).toHaveBeenCalledTimes(1)
    expect(outside).not.toHaveBeenCalled()
  })

  describe('the full words on hover, only when they are cut off', () => {
    // jsdom lays nothing out: a line is "cut off" here when its words are longer than 20 characters.
    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return (this.textContent?.length ?? 0) * 7
      })
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(140)
    })
    afterEach(() => vi.restoreAllMocks())
    // Longer than the tooltip's 300ms wait, so "nothing" means nothing opened.
    const pastTheWait = () => new Promise((resolve) => setTimeout(resolve, 600))

    it.each([
      ['a document', (name: string) => <AttachmentCard name={name} size={1000} href="#" />],
      ['a document without an address', (name: string) => <AttachmentCard name={name} size={1000} />],
      ['an image', (name: string) => <AttachmentCard name={`${name}.png`} src="data:image/png;base64,AA" />],
      ['a file that could not be read', (name: string) => <AttachmentCard name={`${name}.png`} state="unreadable" />],
      ['a pending card', (name: string) => <AttachmentCard pending name={`${name}.png`} size={1} />],
    ])('%s: a name that is cut off shows in full; one that fits shows nothing', async (_, card) => {
      const user = userEvent.setup()
      render(card('2026-Q3-billing-reconciliation-FINAL-v4.xlsx'))
      const long = screen.getByText(/^2026-Q3-billing-reconciliation-FINAL-v4/)
      expect(long.className).toContain('truncate')
      await user.hover(long)
      expect((await screen.findByRole('tooltip')).textContent).toBe(long.textContent)
      cleanup()

      render(card('notes'))
      await user.hover(screen.getByText(/^notes/))
      await pastTheWait()
      expect(screen.queryByRole('tooltip')).toBeNull()
    })

    it('the size never has one', async () => {
      const user = userEvent.setup()
      render(<AttachmentCard pending name="a.png" size={248_000} />)
      await user.hover(screen.getByText('242 KB'))
      await pastTheWait()
      expect(screen.queryByRole('tooltip')).toBeNull()
    })

    it('a note’s hint is always on hover: it says more than the line', async () => {
      const user = userEvent.setup()
      render(<AttachmentCard pending name="a.png" size={1} state="warning" note="Not shared" noteHint="Only this app has a copy of this file." />)
      await user.hover(screen.getByText('Not shared'))
      expect((await screen.findByRole('tooltip')).textContent).toBe('Only this app has a copy of this file.')
    })
  })

  it('an image on its way is a busy placeholder, named as a status', () => {
    const { container } = render(<AttachmentCard name="shot.png" state="loading" />)
    const root = rootOf(container)
    // A name needs a role to hang on: a plain div may not carry aria-label.
    expect(screen.getByRole('status', { name: 'Loading shot.png' })).toBe(root)
    expect(root.getAttribute('aria-busy')).toBe('true')
    expect(classesOf(root)).toContain('animate-pulse')
  })

  it('a file that could not be read says so, with a dashed hairline', () => {
    const { container } = render(<AttachmentCard name="shot.png" state="unreadable" />)
    expect(classesOf(rootOf(container))).toContain('border-dashed')
    expect(screen.getByText('Could not be loaded')).toBeTruthy()
  })

  it('pending: the size when ready, "Uploading…" while not, the reason when it failed, the warning when it is one', () => {
    render(<AttachmentCard pending name="a.png" size={248_000} />)
    expect(screen.getByText('242 KB')).toBeTruthy()
    cleanup()
    render(<AttachmentCard pending name="a.png" size={248_000} state="uploading" />)
    expect(screen.getByText('Uploading…')).toBeTruthy()
    cleanup()
    const failed = render(<AttachmentCard pending name="a.tiff" size={1} state="failed" note="TIFF files aren't supported." />)
    expect(screen.getByText("TIFF files aren't supported.").className).toContain('text-error-default')
    expect(classesOf(rootOf(failed.container))).toContain('border-error-default')
    cleanup()
    const warning = render(<AttachmentCard pending name="a.png" size={1} state="warning" note="Not everyone can see this" />)
    expect(screen.getByText('Not everyone can see this').className).toContain('text-warning-default')
    expect(classesOf(rootOf(warning.container))).toContain('border-warning-default')
  })

  it('a pending card is removed by the app, and the click stays out of what it sits in', async () => {
    const onRemove = vi.fn()
    const outside = vi.fn()
    render(
      <div onClick={outside}>
        <AttachmentCard pending name="a.png" size={1} onRemove={onRemove} />
      </div>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remove a.png' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(outside).not.toHaveBeenCalled()
  })

  it('the ✕ shows when the keyboard reaches it, not only on hover (C4)', async () => {
    render(<AttachmentCard pending name="a.png" size={1} onRemove={() => {}} />)
    const remove = screen.getByRole('button', { name: 'Remove a.png' })
    // Hidden at rest; each of these reveals it. jsdom draws nothing, so the classes are the contract.
    expect(remove.className).toContain('opacity-0')
    for (const reveal of ['group-hover:opacity-100', 'group-focus-within:opacity-100', 'focus-visible:opacity-100']) expect(remove.className).toContain(reveal)
    await userEvent.tab()
    expect(document.activeElement).toBe(remove)
  })

  /* UIG-35: what the two apps were doing around the card, and it now does. */

  it('a picture that needs permission: the card waits, then draws what the app fetched', async () => {
    const fetchImage = vi.fn().mockResolvedValue('blob:the-picture')
    render(<AttachmentCard name="shot.png" contentType="image/png" remoteSrc="relay://shot" fetchImage={fetchImage} />)

    // While it is in flight the card is the loading card, not a gap.
    expect(screen.getByRole('status', { name: 'Loading shot.png' })).toBeTruthy()

    const picture = await screen.findByAltText('shot.png')
    expect(picture.getAttribute('src')).toBe('blob:the-picture')
    expect(fetchImage).toHaveBeenCalledWith('relay://shot')
  })

  it('a document that has to be fetched keeps its row, and opens once the bytes land', async () => {
    const fetchImage = vi.fn().mockResolvedValue('blob:the-file')
    const { container } = render(<AttachmentCard name="report.pdf" size={2_412_000} remoteSrc="relay://report" fetchImage={fetchImage} />)

    // Not the picture's loading card: the row is already saying what the file is.
    expect(screen.getByText('report.pdf')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
    expect(classesOf(rootOf(container))).toContain('w-[240px]')
    expect(screen.queryByRole('link')).toBeNull()

    await vi.waitFor(() => expect(screen.getByRole('link').getAttribute('href')).toBe('blob:the-file'))
  })

  it("the sender's words about a picture are its alt text, and name it in the viewer", async () => {
    render(<AttachmentCard name="shot.png" contentType="image/png" src="blob:thumb" alt="the failing dialog" />)
    expect(screen.getByAltText('the failing dialog')).toBeTruthy()
    // The file's name still sits under the thumbnail: the two say different things.
    expect(screen.getByText('shot.png')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Preview shot.png' }))
    expect(screen.getByRole('dialog', { name: 'the failing dialog' })).toBeTruthy()
  })

  it('a refused request is said, with the unreadable card', async () => {
    render(
      <AttachmentCard name="shot.png" contentType="image/png" remoteSrc="relay://shot" fetchImage={() => Promise.reject(new Error('relay_membership_required'))} />,
    )
    expect(await screen.findByText('Could not be loaded')).toBeTruthy()
  })

  it('a fetcher written inline does not re-fetch on every render', async () => {
    const calls = { n: 0 }
    // A new function identity on every render of the app around it, which is
    // what an inline `fetchImage={…}` is. Only the URL may start a fetch.
    const Harness = ({ tick }: { tick: number }) => (
      <AttachmentCard
        name="shot.png"
        contentType="image/png"
        remoteSrc="relay://shot"
        data-tick={tick}
        fetchImage={() => {
          calls.n += 1
          return Promise.resolve('blob:the-picture')
        }}
      />
    )
    const { rerender } = render(<Harness tick={1} />)
    await screen.findByAltText('shot.png')
    rerender(<Harness tick={2} />)
    rerender(<Harness tick={3} />)
    expect(calls.n).toBe(1)
  })

  it('pressing the picture opens it full screen, and Escape closes it', async () => {
    render(<AttachmentCard name="shot.png" contentType="image/png" src="blob:thumb" />)
    await userEvent.click(screen.getByRole('button', { name: 'Preview shot.png' }))

    const viewer = screen.getByRole('dialog', { name: 'shot.png' })
    expect(viewer).toBeTruthy()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('an app that wants its own viewer still gets the click, and no viewer opens', async () => {
    const onOpen = vi.fn()
    render(<AttachmentCard name="shot.png" contentType="image/png" src="blob:thumb" onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button', { name: 'Preview shot.png' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opening a relay picture fetches the original, and shows the thumbnail until it lands', async () => {
    let landOriginal: (src: string) => void = () => {}
    const fetchImage = vi.fn((url: string) =>
      url === 'relay://original' ? new Promise<string>((resolve) => (landOriginal = resolve)) : Promise.resolve('blob:thumb'),
    )
    render(
      <AttachmentCard name="shot.png" contentType="image/png" remoteSrc="relay://thumb" remoteFullSrc="relay://original" fetchImage={fetchImage} />,
    )
    await screen.findByAltText('shot.png')
    await userEvent.click(screen.getByRole('button', { name: 'Preview shot.png' }))

    // The thumbnail stands in: a moment of a smaller picture beats a moment of an empty screen.
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe('blob:thumb')

    landOriginal('blob:original')
    await vi.waitFor(() => expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe('blob:original'))
  })

  it('the download control saves the original, not the thumbnail on screen', async () => {
    const fetchImage = vi.fn().mockResolvedValue('blob:the-picture')
    render(
      <AttachmentCard name="shot.png" contentType="image/png" remoteSrc="relay://thumb" remoteFullSrc="relay://original" fetchImage={fetchImage} download />,
    )
    await screen.findByAltText('shot.png')
    fetchImage.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Download shot.png' }))
    expect(fetchImage).toHaveBeenCalledWith('relay://original')
  })
})
