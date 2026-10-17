// @vitest-environment jsdom
/**
 * The shared reaction row (COMM-2): the pills in the order first chosen, the
 * viewer's lit, who reacted, toggling, and no row when nobody reacted.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ReactionRow, whoReacted } from './ReactionRow'

const OPTIONS = [
  { emoji: '👍', label: 'Makes sense' },
  { emoji: '🙏', label: 'Thank you' },
]
const NAMES: Record<string, string> = { a: 'Person one', b: 'Person two', me: 'Me' }
const nameOf = (id: string) => NAMES[id] ?? 'Someone'

afterEach(() => cleanup())

describe('the pills', () => {
  it('draws each emoji with its count in the order first chosen, the viewer’s pressed', () => {
    render(
      <ReactionRow
        reactions={[
          { emoji: '🙏', by: ['a'] },
          { emoji: '👍', by: ['a', 'me'] },
        ]}
        options={OPTIONS}
        nameOf={nameOf}
        viewer="me"
        onToggle={() => {}}
      />,
    )
    const pills = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-label') !== 'Add a reaction')
    expect(pills.map((p) => p.getAttribute('aria-label'))).toEqual(['Thank you, 1', 'Makes sense, 2'])
    expect(pills.map((p) => p.getAttribute('aria-pressed'))).toEqual(['false', 'true'])
  })

  it('a click toggles your reaction; read-only, the pills are disabled and nothing adds one', () => {
    const onToggle = vi.fn()
    const { rerender } = render(<ReactionRow reactions={[{ emoji: '👍', by: ['a'] }]} options={OPTIONS} nameOf={nameOf} viewer="me" onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'Makes sense, 1' }))
    expect(onToggle).toHaveBeenCalledWith('👍')
    rerender(<ReactionRow reactions={[{ emoji: '👍', by: ['a'] }]} options={OPTIONS} nameOf={nameOf} viewer="me" />)
    expect((screen.getByRole('button', { name: 'Makes sense, 1' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Add a reaction' })).toBeNull()
  })

  it('nobody reacted: no row at all', () => {
    const { container } = render(<ReactionRow reactions={[{ emoji: '👍', by: [] }]} options={OPTIONS} nameOf={nameOf} onToggle={() => {}} />)
    expect(container.innerHTML).toBe('')
  })
})

describe('who reacted', () => {
  it('names the others, then you, with what the emoji means', () => {
    expect(whoReacted({ emoji: '👍', by: ['a', 'me', 'b'] }, nameOf, OPTIONS, 'me')).toBe('Person one, Person two and you reacted with Makes sense')
    expect(whoReacted({ emoji: '🦆', by: ['me'] }, nameOf, OPTIONS, 'me')).toBe('You reacted with 🦆')
  })

  it('says nothing when nobody holds the emoji', () => {
    expect(whoReacted({ emoji: '👍', by: [] }, nameOf, OPTIONS, 'me')).toBe('')
  })

  it('counts the names past eight', () => {
    const many = Array.from({ length: 11 }, (_, i) => `p${i}`)
    expect(whoReacted({ emoji: '👍', by: many }, () => 'P', OPTIONS)).toBe('P, P, P, P, P, P, P, P and 3 more reacted with Makes sense')
  })
})
