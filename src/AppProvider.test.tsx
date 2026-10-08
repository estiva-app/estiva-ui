// @vitest-environment jsdom
/**
 * What AppProvider promises, pinned: a face handed no picture asks the app for
 * one, and a picture handed in still wins; a plain click on a link to the
 * app's own address changes page through the app instead of loading it, and
 * every other click is left to the browser; without a provider, nothing changes.
 */
import { type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProvider } from './AppProvider'
import { Avatar } from './Avatar'
import { Chip } from './Chip'
import { IconButton } from './IconButton'
import { InlineChip } from './InlineChip'
import { Link } from './Link'
import { NavItem } from './NavItem'
import { Person } from './Person'
import { RailItem } from './RailItem'

afterEach(cleanup)

const imgOf = (container: HTMLElement) => container.querySelector('img')

describe('pictures', () => {
  const pictureFor = (name: string) => (name === 'Ana Duarte' ? 'https://pictures.test/ana.png' : null)

  it("asks the app for a face's picture when none is handed in", () => {
    const { container } = render(
      <AppProvider pictureFor={pictureFor}>
        <Avatar name="Ana Duarte" />
      </AppProvider>,
    )
    expect(imgOf(container)?.getAttribute('src')).toBe('https://pictures.test/ana.png')
  })

  it('keeps a picture that is handed in', () => {
    const { container } = render(
      <AppProvider pictureFor={pictureFor}>
        <Avatar name="Ana Duarte" src="https://pictures.test/own.png" />
      </AppProvider>,
    )
    expect(imgOf(container)?.getAttribute('src')).toBe('https://pictures.test/own.png')
  })

  it('draws the initials when the app has no picture either', () => {
    const { container } = render(
      <AppProvider pictureFor={pictureFor}>
        <Avatar name="Ravi Mehta" />
      </AppProvider>,
    )
    expect(imgOf(container)).toBeNull()
    expect(container.textContent).toBe('RM')
  })

  it('reaches a face drawn through another part', () => {
    const { container } = render(
      <AppProvider pictureFor={pictureFor}>
        <Person name="Ana Duarte" />
      </AppProvider>,
    )
    expect(imgOf(container)?.getAttribute('src')).toBe('https://pictures.test/ana.png')
  })

  it('asks nothing without a provider', () => {
    const { container } = render(<Avatar name="Ana Duarte" />)
    expect(imgOf(container)).toBeNull()
  })
})

describe('changing page', () => {
  const inApp = (navigate: (href: string) => void, children: ReactNode) => render(<AppProvider navigate={navigate}>{children}</AppProvider>)

  it.each([
    ['Link', <Link href="/topics">Topics</Link>],
    ['NavItem', <NavItem href="/topics" label="Topics" />],
    ['RailItem', <RailItem href="/topics" icon={<i />} label="Topics" />],
    ['Chip', <Chip href="/topics" label="Topics" />],
    ['InlineChip', <InlineChip href="/topics">Topics</InlineChip>],
    ['IconButton', <IconButton href="/topics" aria-label="Topics" tooltip="Topics"><i /></IconButton>],
  ])('%s: a plain click goes through the app', async (_name, part) => {
    const navigate = vi.fn()
    inApp(navigate, part)
    await userEvent.click(screen.getByRole('link'))
    expect(navigate).toHaveBeenCalledWith('/topics')
  })

  it("hands over the path when the href is the app's whole address", async () => {
    const navigate = vi.fn()
    inApp(navigate, <Link href={`${window.location.origin}/message/1?thread=2#r3`}>Message</Link>)
    await userEvent.click(screen.getByRole('link'))
    expect(navigate).toHaveBeenCalledWith('/message/1?thread=2#r3')
  })

  it("runs the caller's own onClick first", async () => {
    const order: string[] = []
    inApp(() => order.push('navigate'), <Link href="/topics" onClick={() => order.push('caller')}>Topics</Link>)
    await userEvent.click(screen.getByRole('link'))
    expect(order).toEqual(['caller', 'navigate'])
  })

  it('leaves a click the caller already handled', async () => {
    const navigate = vi.fn()
    inApp(navigate, <Link href="/topics" onClick={(event) => event.preventDefault()}>Topics</Link>)
    await userEvent.click(screen.getByRole('link'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Cmd', { metaKey: true }],
    ['Shift', { shiftKey: true }],
    ['Alt', { altKey: true }],
    ['the middle button', { button: 1 }],
  ])('leaves a click with %s to the browser', (_name, init) => {
    const navigate = vi.fn()
    inApp(navigate, <Link href="/topics">Topics</Link>)
    const link = screen.getByRole('link')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init })
    link.dispatchEvent(event)
    expect(navigate).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it.each([
    ['another site', <Link href="https://elsewhere.test/topics">Topics</Link>],
    ['another scheme', <Link href="folder:1234">Topics</Link>],
    ['a new tab', <Link href="/topics" external>Topics</Link>],
    ['a download', <Link href="/file.pdf" download>File</Link>],
  ])('leaves a link to %s to the browser', (_name, part) => {
    const navigate = vi.fn()
    inApp(navigate, part)
    const link = screen.getByRole('link')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('stops the page load it replaces', () => {
    inApp(() => {}, <Link href="/topics">Topics</Link>)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    screen.getByRole('link').dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('changes nothing without a provider', () => {
    render(<Link href="/topics">Topics</Link>)
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    screen.getByRole('link').dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('keeps the address on the link, for a new tab', () => {
    inApp(() => {}, <NavItem href="/topics" label="Topics" />)
    expect(screen.getByRole('link').getAttribute('href')).toBe('/topics')
  })

})
