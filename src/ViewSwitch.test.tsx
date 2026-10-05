// @vitest-environment jsdom
/**
 * What the page claims: one icon is always chosen, pressed; a press on
 * another reports it; a press on the chosen one reports nothing; each icon is
 * named by its label.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewSwitch } from './ViewSwitch'

afterEach(cleanup)

const OPTIONS = [
  { value: 'mine' as const, icon: <span />, label: 'Mine' },
  { value: 'all' as const, icon: <span />, label: 'All folders' },
]

describe('ViewSwitch', () => {
  it('the chosen view is pressed, the other not', () => {
    render(<ViewSwitch options={OPTIONS} value="mine" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Mine' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'All folders' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('a press on another view reports it', async () => {
    const onChange = vi.fn()
    render(<ViewSwitch options={OPTIONS} value="mine" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'All folders' }))
    expect(onChange).toHaveBeenCalledWith('all')
  })

  it('a press on the chosen view reports nothing', async () => {
    const onChange = vi.fn()
    render(<ViewSwitch options={OPTIONS} value="mine" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Mine' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('an option with no icon shows its name in words, and has no tooltip to need', () => {
    render(<ViewSwitch options={[{ value: 'a', label: 'Topics' }, { value: 'b', label: 'Folders' }]} value="a" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Folders' }).textContent).toBe('Folders')
  })

  it('the group is named, "View" unless told', () => {
    render(<ViewSwitch options={OPTIONS} value="mine" onChange={() => {}} />)
    expect(screen.getByRole('group', { name: 'View' })).not.toBeNull()
  })
})
