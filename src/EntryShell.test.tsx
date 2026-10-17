// @vitest-environment jsdom
/**
 * What the page claims: busy draws the logo alone and says so to assistive
 * technology; a stopped entry draws the line (announced politely, never empty)
 * and, only when given one, the button that runs the caller's action from the
 * tap, and holds it while disabled.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('announces a busy screen as a busy status with its label', () => {
    render(<EntryShell logo={logo} busy busyLabel="Opening" />)
    const status = screen.queryByRole('status', { name: 'Opening' })
    expect(status).not.toBeNull()
    expect(status?.getAttribute('aria-busy')).toBe('true')
  })

  it('names a busy screen "Loading" when no label is given', () => {
    render(<EntryShell logo={logo} busy />)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeNull()
  })

  it('shows the line as a polite status and one button that runs the action when pressed', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<EntryShell logo={logo} message="Why." action={{ label: 'Continue', onClick }} />)
    expect(screen.queryByRole('status')?.textContent).toBe('Why.')
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].textContent).toBe('Continue')
    await user.click(buttons[0])
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not run a disabled action when its button is pressed', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<EntryShell logo={logo} message="Why." action={{ label: 'Continue', onClick, disabled: true }} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows the line and no button when there is nothing the person can do', () => {
    render(<EntryShell logo={logo} message="Only an administrator can clear this." />)
    expect(screen.getByText('Logo')).not.toBeNull()
    expect(screen.getByText('Only an administrator can clear this.')).not.toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('draws no line for an empty message, and the button alone', () => {
    const { container } = render(<EntryShell logo={logo} message="" action={{ label: 'Try again', onClick: () => {} }} />)
    expect(container.querySelector('p')).toBeNull()
    expect(screen.getByRole('button', { name: 'Try again' })).not.toBeNull()
  })
})
