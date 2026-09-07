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

  it('shows the tooltip on hover, with its shortcut', async () => {
    const user = userEvent.setup()
    render(
      <IconButton aria-label="Edit" tooltip="Edit" tooltipShortcut="E">
        {icon}
      </IconButton>,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
    await user.hover(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('tooltip').textContent).toBe('EditE')
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
    await user.hover(button)
    expect(screen.getByRole('tooltip').textContent).toBe('Read only')
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
})
