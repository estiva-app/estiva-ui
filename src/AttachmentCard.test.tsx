// @vitest-environment jsdom
/**
 * What the AttachmentCard page claims, pinned: the file decides the shape (an
 * image with a picture is a thumbnail, anything else a row); a row with an href
 * opens in a new tab and a row without one is dimmed; the picture hands its
 * click to the app; download and remove are the app's too, and neither click
 * reaches what the card sits in; a pending card says what is happening to it;
 * and a file that could not be read is dashed.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
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
})
