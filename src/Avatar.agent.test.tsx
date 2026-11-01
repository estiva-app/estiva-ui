// @vitest-environment jsdom
/**
 * An agent's face (Katerina, 1 November): a robot where a person's initials would be, wherever a face is drawn, and
 * its picture when it has one. Before, every agent showed "C" for "Claude (steered by …)", like a person.
 *
 * jsdom never loads an image, so the picture tests fire the `<img>`'s own events.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'
import { MembersDialog } from './MembersDialog'
import { Person } from './Person'

afterEach(cleanup)

const AGENT = 'Agent (steered by Ana Duarte)'
const tile = (container: HTMLElement) => container.firstElementChild as HTMLElement

describe('an agent’s face', () => {
  it('is a robot, not its initials', () => {
    const { container } = render(<Avatar name={AGENT} bot />)
    expect(tile(container).textContent).toBe('')
    expect(tile(container).querySelector('svg path')).not.toBeNull()
  })

  it('a person with the same kind of name still gets initials', () => {
    const { container } = render(<Avatar name={AGENT} />)
    expect(tile(container).textContent).toBe('A')
  })

  it('its picture still wins, and the robot shows if the picture fails', () => {
    const { container } = render(<Avatar name={AGENT} bot src="https://example.test/agent.png" />)
    const img = tile(container).querySelector('img')!
    fireEvent.load(img)
    expect(tile(container).querySelector('svg')).toBeNull()
    cleanup()
    const failed = render(<Avatar name={AGENT} bot src="https://example.test/agent.png" />)
    fireEvent.error(tile(failed.container).querySelector('img')!)
    expect(tile(failed.container).querySelector('svg path')).not.toBeNull()
    expect(tile(failed.container).textContent).toBe('')
  })

  it('beside its name in a Person, the name is said once and no letter is drawn', () => {
    const { container } = render(<Person name={AGENT} bot />)
    expect(container.textContent).toBe(AGENT)
  })

  it('in the members list, the agent’s row has the robot and the person’s row their initials', () => {
    render(
      <MembersDialog
        members={[
          { id: 'ana', name: 'Ana Duarte' },
          { id: 'agent', name: AGENT, bot: true },
        ]}
        onClose={() => {}}
      />,
    )
    const rowOf = (name: string) => screen.getByText(name).closest('div.flex.h-12') as HTMLElement
    expect(rowOf('Ana Duarte').textContent).toBe('ADAna Duarte')
    expect(rowOf(AGENT).textContent).toBe(AGENT)
    expect(rowOf(AGENT).querySelector('svg path')).not.toBeNull()
  })
})
