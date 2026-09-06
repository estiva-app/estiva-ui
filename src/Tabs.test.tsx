// @vitest-environment jsdom
/**
 * What the Tabs page claims about the keyboard, pinned. The keys come from
 * Base UI's Tabs (stage 1 of the migration); before it, every tab was its own
 * Tab stop and the arrow keys did nothing.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Tabs, type TabDef } from './Tabs'

afterEach(cleanup)

type Id = 'one' | 'two' | 'three'
const THREE: TabDef<Id>[] = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two', count: 3 },
  { id: 'three', label: 'Three' },
]

/** A parent that owns the state, as every caller does. */
function Harness({ onChange, initial = 'one' }: { onChange?: (id: Id) => void; initial?: Id }) {
  const [active, setActive] = useState<Id>(initial)
  return (
    <>
      <button type="button">Before</button>
      <Tabs
        tabs={THREE}
        active={active}
        onChange={(id) => {
          onChange?.(id)
          setActive(id)
        }}
      />
      <button type="button">After</button>
    </>
  )
}

const tab = (name: string) => screen.getByRole('tab', { name: new RegExp(`^${name}`) })
const selected = (name: string) => tab(name).getAttribute('aria-selected')
const tabindex = (name: string) => tab(name).getAttribute('tabindex')
const focused = () => document.activeElement

describe('Tabs', () => {
  it('marks the active tab selected, and makes it the only Tab stop in the row', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(selected('One')).toBe('true')
    expect(selected('Two')).toBe('false')
    expect(tabindex('One')).toBe('0')
    expect(tabindex('Two')).toBe('-1')
    expect(tabindex('Three')).toBe('-1')

    await user.tab()
    expect(focused()).toBe(screen.getByRole('button', { name: 'Before' }))
    await user.tab()
    expect(focused()).toBe(tab('One'))
    await user.tab()
    expect(focused()).toBe(screen.getByRole('button', { name: 'After' }))
  })

  it('selects on click and hands back the id', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await user.click(tab('Two'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('two')
    expect(selected('Two')).toBe('true')
    expect(selected('One')).toBe('false')
  })

  it('selects the next and previous tab with the arrow keys, wrapping at the ends', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await user.click(tab('One'))
    onChange.mockClear()

    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe(tab('Two'))
    expect(selected('Two')).toBe('true')
    await user.keyboard('{ArrowRight}')
    expect(selected('Three')).toBe('true')
    await user.keyboard('{ArrowRight}')
    expect(selected('One')).toBe('true')
    await user.keyboard('{ArrowLeft}')
    expect(selected('Three')).toBe('true')
    expect(onChange.mock.calls.map(([id]) => id)).toEqual(['two', 'three', 'one', 'three'])
  })

  it('selects the first and last tab with Home and End', async () => {
    const user = userEvent.setup()
    render(<Harness initial="two" />)
    await user.click(tab('Two'))
    await user.keyboard('{End}')
    expect(selected('Three')).toBe('true')
    await user.keyboard('{Home}')
    expect(selected('One')).toBe('true')
  })

  it('stays quiet when `active` matches no tab: onChange is for a person, not a fallback', () => {
    const onChange = vi.fn()
    render(<Tabs tabs={THREE} active={'nowhere' as Id} onChange={onChange} />)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getAllByRole('tab').map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'false', 'false'])
  })

  it('puts className on the outer box, around the row', () => {
    const { container } = render(<Tabs tabs={THREE} active="one" onChange={() => {}} className="mt-4" />)
    const outer = container.firstElementChild as HTMLElement
    expect(outer.classList.contains('mt-4')).toBe(true)
    expect(outer.querySelector('[role="tablist"]')).not.toBeNull()
  })
})
