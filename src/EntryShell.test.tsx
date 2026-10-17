// @vitest-environment jsdom
/**
 * The three states the page claims: busy draws the logo alone, a stopped entry
 * draws the line and, only when given one, the button that runs the caller's
 * action from the tap.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EntryShell } from './EntryShell'

afterEach(cleanup)

const logo = <span>Logo</span>

describe('EntryShell', () => {
  it('shows only the logo while entry is busy, even when given a line and an action', () => {
    render(<EntryShell logo={logo} busy message="Why." action={{ label: 'Continue', onClick: () => {} }} />)
    expect(screen.getByText('Logo')).not.toBeNull()
    expect(screen.queryByText('Why.')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows the line and one button that runs the action when it is pressed', () => {
    const onClick = vi.fn()
    render(<EntryShell logo={logo} message="Why." action={{ label: 'Continue', onClick }} />)
    expect(screen.getByText('Why.')).not.toBeNull()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].textContent).toBe('Continue')
    fireEvent.click(buttons[0])
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows the line and no button when there is nothing the person can do', () => {
    render(<EntryShell logo={logo} message="Only an administrator can clear this." />)
    expect(screen.getByText('Logo')).not.toBeNull()
    expect(screen.getByText('Only an administrator can clear this.')).not.toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
