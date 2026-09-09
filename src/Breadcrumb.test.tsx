// @vitest-environment jsdom
/**
 * What the Breadcrumb page claims, pinned: a crumb with an href is a link
 * (even the last one), the last crumb without one is where you are, the
 * separators are never read aloud — and a router app can take the click,
 * which is the one prop the trail lacked (ADOPTION S15, 2026-09-08).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Breadcrumb } from './Breadcrumb'

afterEach(cleanup)

describe('Breadcrumb', () => {
  it('a crumb with an href is a link, and the last one without is where you are', () => {
    render(<Breadcrumb items={[{ label: 'Documents', href: '/documents' }, { label: 'DOC-12', mono: true }]} />)
    expect(screen.getByRole('link', { name: 'Documents' }).getAttribute('href')).toBe('/documents')
    const here = screen.getByText('DOC-12')
    expect(here.tagName).toBe('SPAN')
    expect(here.getAttribute('aria-current')).toBe('page')
  })

  it('a last crumb with an href is still a link — a page may end its trail on somewhere to go', () => {
    render(<Breadcrumb items={[{ label: 'Documents', href: '/documents' }, { label: 'Quarterly plan', href: '/documents/12' }]} />)
    const last = screen.getByRole('link', { name: 'Quarterly plan' })
    expect(last.getAttribute('href')).toBe('/documents/12')
    expect(last.getAttribute('aria-current')).toBeNull()
  })

  it('a router app takes the click through onClick, and the href stays a real address', async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    render(<Breadcrumb items={[{ label: 'Documents', href: '/documents', onClick }, { label: 'DOC-12' }]} />)
    await userEvent.click(screen.getByRole('link', { name: 'Documents' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Documents' }).getAttribute('href')).toBe('/documents')
  })

  it('the separators are drawn but never read aloud', () => {
    render(<Breadcrumb items={[{ label: 'Documents', href: '/documents' }, { label: 'DOC-12' }]} />)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' }).textContent).toContain('/')
    expect(screen.queryByText('/', { ignore: '[aria-hidden="true"]' })).toBeNull()
  })
})

describe('Breadcrumb with an icon', () => {
  it('draws the icon before the crumb, and the trail still reads as its labels', () => {
    render(<Breadcrumb items={[{ label: 'Documents', href: '#' }, { label: 'Quarterly plan', icon: <i data-testid="kind" /> }]} />)
    const icon = screen.getByTestId('kind').parentElement!
    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(icon.nextElementSibling).toBe(screen.getByText('Quarterly plan'))
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' }).textContent).toBe('Documents/Quarterly plan')
  })
})
