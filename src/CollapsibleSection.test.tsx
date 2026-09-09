// @vitest-environment jsdom
/**
 * What the page claims: the title toggles by click and by key and says its
 * state; the rows are hidden, not removed, while closed; a `storageKey` is
 * read on mount and written on change. The slide is Chrome's to show
 * (measured 2026-09-09).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CollapsibleSection } from './CollapsibleSection'

afterEach(cleanup)
beforeEach(() => window.localStorage.clear())

const rows = (
  <>
    <a href="#">Item one</a>
    <a href="#">Item two</a>
  </>
)

const title = () => screen.getByRole('button', { name: 'Section' })

describe('CollapsibleSection', () => {
  it('is open by default: the title says so, and the rows are there', () => {
    render(<CollapsibleSection title="Section">{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Item one').closest('[hidden]')).toBeNull()
  })

  it('a click on the title closes it, and the rows are hidden rather than gone', async () => {
    render(<CollapsibleSection title="Section">{rows}</CollapsibleSection>)
    await userEvent.click(title())
    expect(title().getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Item one').closest('[hidden]')).not.toBeNull()
  })

  it('Enter and Space on the title toggle it', async () => {
    render(<CollapsibleSection title="Section">{rows}</CollapsibleSection>)
    title().focus()
    await userEvent.keyboard('{Enter}')
    expect(title().getAttribute('aria-expanded')).toBe('false')
    await userEvent.keyboard(' ')
    expect(title().getAttribute('aria-expanded')).toBe('true')
  })

  it('starts closed with defaultOpen false', () => {
    render(<CollapsibleSection title="Section" defaultOpen={false}>{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('false')
  })

  it('an action beside the title acts without toggling', async () => {
    const add = vi.fn()
    render(
      <CollapsibleSection title="Section" actions={[{ icon: <i />, tooltip: 'Add', onClick: add }]}>
        {rows}
      </CollapsibleSection>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(add).toHaveBeenCalledTimes(1)
    expect(title().getAttribute('aria-expanded')).toBe('true')
  })

  it('remembers under storageKey: written on change, read on mount', async () => {
    const { unmount } = render(<CollapsibleSection title="Section" storageKey="test.section">{rows}</CollapsibleSection>)
    await userEvent.click(title())
    expect(window.localStorage.getItem('test.section')).toBe('closed')
    unmount()
    render(<CollapsibleSection title="Section" storageKey="test.section">{rows}</CollapsibleSection>)
    expect(title().getAttribute('aria-expanded')).toBe('false')
  })

  it('the caller can own the state', async () => {
    const onOpenChange = vi.fn()
    render(<CollapsibleSection title="Section" open={false} onOpenChange={onOpenChange}>{rows}</CollapsibleSection>)
    await userEvent.click(title())
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(title().getAttribute('aria-expanded')).toBe('false')
  })
})
