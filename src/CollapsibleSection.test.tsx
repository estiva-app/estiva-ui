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
import { MenuItem } from './Menu'

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

/** What it hands its header (0.56.0): the folder's ⋮, the ⋮'s name, and the icon before the title. */
describe('CollapsibleSection, its header', () => {
  it('passes menu and menuLabel on: the ⋮ is named by menuLabel and opens the menu', async () => {
    render(<CollapsibleSection title="Section" menu={<MenuItem label="Rename" />} menuLabel="Section options">{rows}</CollapsibleSection>)
    await userEvent.click(screen.getByRole('button', { name: 'Section options' }))
    expect(await screen.findByRole('menuitem', { name: 'Rename' })).not.toBeNull()
    // The ⋮ acts; it does not fold the section.
    expect(title().getAttribute('aria-expanded')).toBe('true')
  })

  it('with menu and no menuLabel, the ⋮ is named for the title', () => {
    render(<CollapsibleSection title="Section" menu={<MenuItem label="Rename" />}>{rows}</CollapsibleSection>)
    expect(screen.getByRole('button', { name: 'More options for Section' })).not.toBeNull()
  })

  it('passes icon on: it is drawn inside the title’s toggle, before the words', () => {
    render(<CollapsibleSection title="Section" icon={<span data-testid="icon" />}>{rows}</CollapsibleSection>)
    const icon = screen.getByTestId('icon')
    expect(title().contains(icon)).toBe(true)
    expect(icon.compareDocumentPosition(screen.getByText('Section')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
