// @vitest-environment jsdom
/** What the ErrorBoundary page claims, pinned. Moved in from Peek with the part (UIG-14, D3). */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { ErrorBoundary } from './ErrorBoundary'

afterEach(cleanup)

function Bomb({ defused }: { defused: boolean }) {
  if (!defused) throw new Error('boom')
  return <div>recovered content</div>
}

/** Flips the crash off outside the boundary, so Try again shows a real recovery
 *  (a child still broken would only crash again). */
function Harness() {
  const [defused, setDefused] = useState(false)
  return (
    <>
      <button onClick={() => setDefused(true)}>defuse</button>
      <ErrorBoundary label="test panel">
        <Bomb defused={defused} />
      </ErrorBoundary>
    </>
  )
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs the caught error; keep the output quiet.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the message in place of what crashed', () => {
    render(<Harness />)
    expect(screen.getByText(/Something went wrong in the test panel/)).toBeTruthy()
    expect(screen.queryByText('recovered content')).toBeNull()
  })

  it('keeps the rest of the page working', () => {
    render(<Harness />)
    expect(screen.getByText('defuse')).toBeTruthy()
  })

  it('Try again draws it again', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('defuse'))
    fireEvent.click(screen.getByText('Try again'))
    expect(screen.getByText('recovered content')).toBeTruthy()
    expect(screen.queryByText(/Something went wrong/)).toBeNull()
  })

  it('draws its children untouched when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>healthy</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('healthy')).toBeTruthy()
  })

  it('draws the message inside a frame, when given one', () => {
    render(
      <ErrorBoundary label="list" frame={(message) => <section aria-label="frame">{message}</section>}>
        <Bomb defused={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByLabelText('frame').textContent).toMatch(/Something went wrong in the list/)
  })

  it('says what crashed in the console line', () => {
    render(<Harness />)
    expect(vi.mocked(console.error).mock.calls.some((call) => String(call[0]).startsWith('test panel crashed:'))).toBe(true)
  })
})
