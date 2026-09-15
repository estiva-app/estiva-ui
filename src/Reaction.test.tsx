// @vitest-environment jsdom
/**
 * What the Reaction page claims, pinned: a toggle named by its label, the emoji
 * kept out of the name, "yours" carried as `aria-pressed`, and the keys a
 * native button answers to.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Reaction } from './Reaction'

afterEach(cleanup)

describe('Reaction', () => {
  it('is a button named by its label, never by the emoji or the bare count', () => {
    render(<Reaction emoji="👍" count={2} aria-label="Makes sense, 2" />)
    const button = screen.getByRole('button', { name: 'Makes sense, 2' })
    expect(button.getAttribute('type')).toBe('button')
    expect(button.querySelector('[aria-hidden="true"]')?.textContent).toBe('👍')
    expect(button.textContent).toBe('👍2')
  })

  it('says whether the reaction is yours as a pressed state', () => {
    const { rerender } = render(<Reaction emoji="👍" count={2} aria-label="Makes sense, 2" />)
    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.hasAttribute('data-pressed')).toBe(false)
    rerender(<Reaction emoji="👍" count={3} aria-label="Makes sense, 3" pressed />)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.hasAttribute('data-pressed')).toBe(true)
  })

  it('a press calls onClick and leaves the pressed state to the caller', async () => {
    const onClick = vi.fn()
    render(<Reaction emoji="👍" count={2} aria-label="Makes sense, 2" onClick={onClick} />)
    const button = screen.getByRole('button')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(button.getAttribute('aria-pressed')).toBe('false')
  })

  it('Tab reaches it; Enter and Space press it', async () => {
    const onClick = vi.fn()
    render(<Reaction emoji="👍" count={2} aria-label="Makes sense, 2" onClick={onClick} />)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button'))
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('disabled: not reachable by Tab, and a press does nothing', async () => {
    const onClick = vi.fn()
    render(<Reaction emoji="👍" count={2} aria-label="Makes sense, 2" onClick={onClick} disabled />)
    const button = screen.getByRole('button')
    expect((button as HTMLButtonElement).disabled).toBe(true)
    await userEvent.tab()
    expect(document.activeElement).not.toBe(button)
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
