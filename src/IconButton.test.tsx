// @vitest-environment jsdom
/**
 * What the IconButton page claims, pinned: the label, the tooltip on hover,
 * and `disabledReason` in place of the tooltip (stage 2 of the migration).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IconButton } from './IconButton'

afterEach(cleanup)

const icon = <svg data-testid="icon" />

describe('IconButton', () => {
  it('is a native button named by its aria-label, type button', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <IconButton aria-label="Edit" onClick={onClick}>
        {icon}
      </IconButton>,
    )
    const button = screen.getByRole('button', { name: 'Edit' })
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('href: a link that looks like the button, with its tooltip', async () => {
    const user = userEvent.setup()
    render(
      <IconButton href="/documents/12" aria-label="Open" tooltip="Open">
        {icon}
      </IconButton>,
    )
    expect(screen.queryByRole('button')).toBeNull()
    const link = screen.getByRole('link', { name: 'Open' })
    expect(link.getAttribute('href')).toBe('/documents/12')
    expect(link.className).toContain('rounded-lg')
    await user.hover(link)
    expect((await screen.findByRole('tooltip')).textContent).toBe('Open')
  })

  it('href while it cannot be used: the button, since a link cannot be disabled', () => {
    render(
      <IconButton href="/documents/12" aria-label="Open" disabledReason="Read only">
        {icon}
      </IconButton>,
    )
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByRole('button', { name: 'Open' }).getAttribute('aria-disabled')).toBe('true')
  })

  it('shows the tooltip on hover, with its shortcut', async () => {
    const user = userEvent.setup()
    render(
      <IconButton aria-label="Edit" tooltip="Edit" tooltipShortcut="E">
        {icon}
      </IconButton>,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
    await user.hover(screen.getByRole('button', { name: 'Edit' }))
    // 300ms before it opens (D23) - it used to be instant.
    expect((await screen.findByRole('tooltip')).textContent).toBe('EditE')
  })

  it('disabledReason: disabled, reachable by Tab, the reason replaces the tooltip', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <IconButton aria-label="Edit" tooltip="Edit" tooltipShortcut="E" disabledReason="Read only" onClick={onClick}>
        {icon}
      </IconButton>,
    )
    const button = screen.getByRole('button', { name: 'Edit' })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.hasAttribute('disabled')).toBe(false)
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
    await user.tab()
    expect(document.activeElement).toBe(button)
    // Already open, in fact: the Tab above focused it, and focus opens
    // with no delay at all.
    await user.hover(button)
    expect((await screen.findByRole('tooltip')).textContent).toBe('Read only')
  })

  it('Space and Enter are the action, and nothing while disabled with a reason', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { unmount } = render(
      <IconButton aria-label="Edit" onClick={onClick}>
        {icon}
      </IconButton>,
    )
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
    unmount()

    const held = vi.fn()
    render(
      <IconButton aria-label="Edit" disabledReason="Read only" onClick={held}>
        {icon}
      </IconButton>,
    )
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(held).not.toHaveBeenCalled()
  })

  it('disabled without a reason: a real disabled button, out of the Tab order', async () => {
    const user = userEvent.setup()
    render(
      <>
        <IconButton aria-label="Edit" disabled>
          {icon}
        </IconButton>
        <button type="button">After</button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Edit' }).hasAttribute('disabled')).toBe(true)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }))
  })

  /*
    A flex parent with no `items-*` stretches its children. `shrink-0` does
    not stop that — it is the other direction — so this button grew to 228px
    tall in a 260px row (Katerina, 2026-09-11). jsdom computes no layout, so
    the class is what can be asserted here; the story beside it is what shows
    the pixels.
  */
  it('keeps its own size in a flex parent that would stretch it', () => {
    render(
      <div className="flex h-[260px]">
        <IconButton aria-label="Edit">{icon}</IconButton>
      </div>,
    )
    expect(screen.getByRole('button', { name: 'Edit' }).className).toContain('self-center')
  })
})
