// @vitest-environment jsdom
/**
 * What the PersonTrigger page claims, pinned: a menu button named by the
 * person, `open` on `aria-expanded`, a ref that reaches the button (stage 2
 * of the migration).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { PersonTrigger } from './PersonTrigger'

afterEach(cleanup)

describe('PersonTrigger', () => {
  it('the row is a menu button named by the person, and open shows on it', () => {
    const { rerender } = render(<PersonTrigger name="Ana Duarte" />)
    // The face's initials are text too, so the name reads "AD Ana Duarte"
    // today; that is the Avatar's to settle at its own port (stage 6).
    const button = screen.getByRole('button', { name: /Ana Duarte$/ })
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    expect(button.getAttribute('aria-haspopup')).toBe('menu')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    rerender(<PersonTrigger name="Ana Duarte" open />)
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('the compact face takes the label it is given, and a ref and handlers reach the button', async () => {
    const user = userEvent.setup()
    const ref = createRef<HTMLButtonElement>()
    const onMouseDown = vi.fn()
    const onClick = vi.fn()
    render(<PersonTrigger name="Ana Duarte" compact aria-label="Account menu" ref={ref} onMouseDown={onMouseDown} onClick={onClick} />)
    const button = screen.getByRole('button', { name: 'Account menu' })
    expect(ref.current).toBe(button)
    await user.click(button)
    expect(onMouseDown).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
