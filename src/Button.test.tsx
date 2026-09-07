// @vitest-environment jsdom
/**
 * What the Button page claims, pinned: a native button that does not submit
 * unless told to, `disabled` as before, and `disabledReason` — disabled,
 * still reachable by keyboard, the reason shown on hover (stage 2 of the
 * migration).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormEvent } from 'react'
import { Button } from './Button'

afterEach(cleanup)

describe('Button', () => {
  it('is a native button that does not submit a form unless asked', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((e: FormEvent<HTMLFormElement>) => e.preventDefault())
    const onClick = vi.fn()
    render(
      <form onSubmit={onSubmit}>
        <Button onClick={onClick}>Plain</Button>
        <Button type="submit">Send</Button>
      </form>,
    )
    const plain = screen.getByRole('button', { name: 'Plain' })
    expect(plain.tagName).toBe('BUTTON')
    expect(plain.getAttribute('type')).toBe('button')
    await user.click(plain)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('renders the leading icon before the label', () => {
    render(<Button leadingIcon={<svg data-testid="icon" />}>Label</Button>)
    const button = screen.getByRole('button', { name: 'Label' })
    expect(button.firstElementChild).toBe(screen.getByTestId('icon'))
  })

  it('disabled: a real disabled button, out of the Tab order, that ignores clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <>
        <Button disabled onClick={onClick}>
          Held
        </Button>
        <Button>After</Button>
      </>,
    )
    const held = screen.getByRole('button', { name: 'Held' })
    expect(held.hasAttribute('disabled')).toBe(true)
    await user.click(held)
    expect(onClick).not.toHaveBeenCalled()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }))
  })

  it('disabledReason: disabled, still reachable by Tab, the reason on hover', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabledReason="Sign in first" onClick={onClick}>
        Add
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Add' })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.hasAttribute('disabled')).toBe(false)
    expect(screen.queryByRole('tooltip')).toBeNull()
    await user.hover(button)
    expect(screen.getByRole('tooltip').textContent).toBe('Sign in first')
    await user.unhover(button)
    expect(screen.queryByRole('tooltip')).toBeNull()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
    await user.tab()
    expect(document.activeElement).toBe(button)
  })

  it('Space and Enter are the action, and nothing while disabled with a reason', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { unmount } = render(<Button onClick={onClick}>Go</Button>)
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
    unmount()

    const held = vi.fn()
    render(
      <Button disabledReason="Not now" onClick={held}>
        Go
      </Button>,
    )
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Go' }))
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(held).not.toHaveBeenCalled()
  })

  it('passes native props through', () => {
    render(
      <Button form="f1" aria-pressed="true" data-x="y" className="mt-2">
        Label
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Label' })
    expect(button.getAttribute('form')).toBe('f1')
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.getAttribute('data-x')).toBe('y')
    expect(button.classList.contains('mt-2')).toBe(true)
  })
})
