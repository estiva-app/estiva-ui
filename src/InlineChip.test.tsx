// @vitest-environment jsdom
/**
 * What the InlineChip page claims, pinned: without `href` it is a label, with
 * one it is a link a router can take; every tone keeps the shape and its own
 * size and colour through `cn()`; the icon sits in its 16px box; and the class
 * function a string-only renderer uses gives the same classes as the component.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { INLINE_CHIP_CLASSES, INLINE_CHIP_TONE_CLASSES, InlineChip, inlineChipClassName } from './InlineChip'

afterEach(cleanup)

const classesOf = (el: Element) => el.getAttribute('class')?.split(' ').filter(Boolean) ?? []

describe('InlineChip', () => {
  it('without href it is a label, not a link', () => {
    render(<InlineChip>Label</InlineChip>)
    const chip = screen.getByText('Label')
    expect(chip.tagName).toBe('SPAN')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('with href it is a link, and a router app takes the click with the href intact', async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    render(
      <InlineChip href="/somewhere" onClick={onClick}>
        Label
      </InlineChip>,
    )
    const link = screen.getByRole('link', { name: 'Label' })
    await userEvent.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(link.getAttribute('href')).toBe('/somewhere')
  })

  it('is one line high and pinned to the top of the line, in every tone', () => {
    for (const tone of Object.keys(INLINE_CHIP_TONE_CLASSES) as (keyof typeof INLINE_CHIP_TONE_CLASSES)[]) {
      const classes = inlineChipClassName(tone).split(' ')
      expect(classes).toContain('align-top')
      expect(classes).toContain('mx-0.5')
      // One height only: 1.4em of the body size, or the same 19.6px written out where the text is smaller.
      const heights = classes.filter((c) => c.startsWith('h-'))
      expect(heights).toEqual([tone === 'quiet' ? 'h-[19.6px]' : 'h-[1.4em]'])
    }
  })

  it('each tone keeps its size and its colour through cn()', () => {
    const neutral = inlineChipClassName('neutral').split(' ')
    expect(neutral).toContain('text-body-2')
    expect(neutral).toContain('text-text-primary')
    const person = inlineChipClassName('person').split(' ')
    expect(person).toContain('text-body-2')
    expect(person).toContain('text-accent-primary')
    const urgent = inlineChipClassName('urgent').split(' ')
    expect(urgent).toContain('text-warning-default')
    // quiet is smaller: its caption size replaces the body size, and its colour survives beside it
    const quiet = inlineChipClassName('quiet').split(' ')
    expect(quiet).toContain('text-caption')
    expect(quiet).not.toContain('text-body-2')
    expect(quiet).toContain('text-text-muted')
  })

  it('the component and the class function give the same classes', () => {
    render(
      <InlineChip tone="person" className="max-w-[24ch]">
        Label
      </InlineChip>,
    )
    expect(classesOf(screen.getByText('Label'))).toEqual(inlineChipClassName('person', 'max-w-[24ch]').split(' '))
    expect(INLINE_CHIP_CLASSES.split(' ').every((c) => classesOf(screen.getByText('Label')).includes(c))).toBe(true)
  })

  it('draws the icon first, in its 16px box', () => {
    render(<InlineChip icon={<svg data-testid="icon" />}>Label</InlineChip>)
    const box = screen.getByTestId('icon').parentElement!
    expect(classesOf(box)).toEqual(expect.arrayContaining(['size-4', 'shrink-0']))
    expect(box.parentElement!.firstElementChild).toBe(box)
  })
})
