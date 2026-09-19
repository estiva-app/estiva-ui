// @vitest-environment jsdom
/**
 * A part with a set height keeps it in a scrolling column (UIG-15; UIG-14 cards
 * T1, M4, M6). A scrolling flex column squashes any child that may shrink:
 * measured in Chrome, a 32px SectionHeader went to 24px, a Skeleton row to 18px,
 * a Button to 18px. jsdom draws nothing, so this pins the class that prevents it;
 * the measurement is in the record.
 *
 * Rows that span their column refuse to shrink (`shrink-0`). Controls, which
 * mostly sit in rows, keep a minimum height instead: `shrink-0` would also stop
 * a row from narrowing them.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Button } from './Button'
import { PersonTrigger } from './PersonTrigger'
import { RailItem } from './RailItem'
import { Reaction } from './Reaction'
import { SectionHeader } from './SectionHeader'
import { Select } from './Select'
import { SkeletonRow } from './Skeleton'
import { TextInput } from './TextInput'

afterEach(cleanup)

const classes = (el: Element | null) => (el?.getAttribute('class') ?? '').split(' ')

describe('a part with a set height keeps it in a scrolling column', () => {
  it('SectionHeader: shrink-0', () => {
    const { container } = render(<SectionHeader title="Group" />)
    expect(classes(container.querySelector('[class*="h-[32px]"]'))).toContain('shrink-0')
  })

  it('SkeletonRow: shrink-0', () => {
    const { container } = render(<SkeletonRow />)
    expect(classes(container.firstElementChild)).toContain('shrink-0')
  })

  it('RailItem: a set 48px, and shrink-0', () => {
    render(<RailItem href="#" label="Item" icon={<span />} />)
    const tile = classes(screen.getByRole('link'))
    expect(tile).toContain('h-12')
    expect(tile).toContain('shrink-0')
  })

  it('Button: a minimum height at each size', () => {
    render(
      <>
        <Button>Default</Button>
        <Button size="small">Small</Button>
      </>,
    )
    expect(classes(screen.getByRole('button', { name: 'Default' }))).toContain('min-h-8')
    expect(classes(screen.getByRole('button', { name: 'Small' }))).toContain('min-h-6')
  })

  it('Select and TextInput, small: a minimum height', () => {
    render(
      <>
        <Select size="small" value="a" onChange={() => {}} options={[{ value: 'a', label: 'A' }]} ariaLabel="Pick" />
        <TextInput size="small" aria-label="Type" />
      </>,
    )
    expect(classes(screen.getByRole('combobox', { name: 'Pick' }))).toContain('min-h-6')
    expect(classes(screen.getByRole('textbox', { name: 'Type' }))).toContain('min-h-6')
  })

  it('PersonTrigger and Reaction: a minimum height', () => {
    render(
      <>
        <PersonTrigger name="Ana Duarte" />
        <Reaction emoji="👍" count={2} aria-label="Thumbs up" />
      </>,
    )
    expect(classes(screen.getByRole('button', { name: /Ana Duarte/ }))).toContain('min-h-8')
    expect(classes(screen.getByRole('button', { name: 'Thumbs up' }))).toContain('min-h-6')
  })
})
