// @vitest-environment jsdom
/**
 * What the Checkbox page claims, pinned: the keys, the click that never
 * reaches the row, and the second rendering — no `onChange`, a picture of
 * the state that is not a control. The last one is what clears axe's
 * `nested-interactive` on the "inside a row" story (stage 1 of the
 * migration).
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from './Checkbox'

afterEach(cleanup)

describe('Checkbox', () => {
  it('is a checkbox that Space toggles, and Enter does not', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} aria-label="Done" />)
    const box = screen.getByRole('checkbox', { name: 'Done' })
    expect(box.getAttribute('aria-checked')).toBe('false')

    await user.tab()
    expect(document.activeElement).toBe(box)
    await user.keyboard('{Enter}')
    expect(onChange).not.toHaveBeenCalled()
    await user.keyboard(' ')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('toggles on click, and the click never reaches the row', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onRow = vi.fn()
    render(
      <div onClick={onRow}>
        <Checkbox checked onChange={onChange} aria-label="Done" />
      </div>,
    )
    await user.click(screen.getByRole('checkbox', { name: 'Done' }))
    expect(onChange).toHaveBeenCalledWith(false)
    expect(onRow).not.toHaveBeenCalled()
  })

  it('does nothing when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={false} disabled onChange={onChange} aria-label="Done" />)
    const box = screen.getByRole('checkbox', { name: 'Done' })
    expect(box.getAttribute('aria-disabled')).toBe('true')
    await user.click(box)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('with no onChange is a picture of the state, not a control: the row gets the click', async () => {
    const user = userEvent.setup()
    const onRow = vi.fn()
    const { container } = render(
      <button type="button" aria-pressed onClick={onRow}>
        <Checkbox checked aria-label="Ignored" />
        The row is the control
      </button>,
    )
    expect(screen.queryByRole('checkbox')).toBeNull()
    const square = container.querySelector('[aria-hidden="true"]')
    expect(square).not.toBeNull()
    expect(container.querySelectorAll('input, [tabindex], [role="checkbox"]')).toHaveLength(0)
    await user.click(square as HTMLElement)
    expect(onRow).toHaveBeenCalledTimes(1)
  })
})
