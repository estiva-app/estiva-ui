// @vitest-environment jsdom
/**
 * What the Link page claims, pinned: it is a real anchor with a real address;
 * `external` opens a new tab that cannot reach back; a router app takes the
 * click through `onClick` and the address survives it; each look is its own
 * class list and `plain` carries none; a ref reaches the anchor.
 */
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link } from './Link'

afterEach(cleanup)

const classesOf = (el: Element) => el.getAttribute('class')?.split(' ').filter(Boolean) ?? []

describe('Link', () => {
  it('is an anchor with its address', () => {
    render(<Link href="/documents">Documents</Link>)
    const link = screen.getByRole('link', { name: 'Documents' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/documents')
  })

  it('stays in the same tab unless it is external', () => {
    render(<Link href="/documents">Documents</Link>)
    const link = screen.getByRole('link', { name: 'Documents' })
    expect(link.getAttribute('target')).toBeNull()
    expect(link.getAttribute('rel')).toBeNull()
  })

  it('external opens a new tab that cannot reach back into this page', () => {
    render(
      <Link href="https://example.com" external>
        Example
      </Link>,
    )
    const link = screen.getByRole('link', { name: 'Example' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('a router app takes the click through onClick, and the href stays a real address', async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    render(
      <Link href="/documents" onClick={onClick}>
        Documents
      </Link>,
    )
    await userEvent.click(screen.getByRole('link', { name: 'Documents' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Documents' }).getAttribute('href')).toBe('/documents')
  })

  it('text is the info colour, always underlined, and is the default', () => {
    render(<Link href="#">Label</Link>)
    const classes = classesOf(screen.getByRole('link'))
    expect(classes).toContain('text-info-default')
    expect(classes).toContain('underline')
    expect(classes).toContain('underline-offset-2')
  })

  it('quiet sets no colour and no size of its own, and underlines on hover', () => {
    render(
      <Link href="#" variant="quiet">
        Label
      </Link>,
    )
    expect(classesOf(screen.getByRole('link'))).toEqual(['hover:underline'])
  })

  it('underlined sets no colour at rest, is always underlined, and brightens on hover', () => {
    render(
      <Link href="#" variant="underlined">
        Label
      </Link>,
    )
    expect(classesOf(screen.getByRole('link'))).toEqual(['underline', 'underline-offset-2', 'hover:text-text-primary'])
  })

  it('plain carries no class at all, so what it wraps draws itself', () => {
    render(
      <Link href="#" variant="plain">
        Label
      </Link>,
    )
    expect(classesOf(screen.getByRole('link'))).toEqual([])
  })

  it('a ref reaches the anchor', () => {
    const ref = createRef<HTMLAnchorElement>()
    render(
      <Link href="#" ref={ref}>
        Label
      </Link>,
    )
    expect(ref.current?.tagName).toBe('A')
  })
})
