// @vitest-environment jsdom
/**
 * What the Card page claims, pinned (Katerina's rulings, 14 September): every
 * card has 8px corners and a hairline that follows its fill; a card with an
 * href is a link whose hairline goes one step stronger on hover; a feed card
 * lights up; the one you are on, or the one being changed, does not answer the
 * pointer; attention recolours the hairline; a card that cannot be read is
 * dashed; and the caller's className — placement, padding, layout — lands last.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from './Card'

afterEach(cleanup)

const classesOf = (el: Element) => el.getAttribute('class')?.split(' ').filter(Boolean) ?? []
const card = (ui: React.ReactElement) => {
  render(ui)
  return screen.getByText('Item one').closest('div, a')!
}

describe('Card', () => {
  it('has 8px corners and a hairline in every fill', () => {
    for (const fill of ['surface', 'elevated', 'inset', 'none'] as const) {
      const classes = classesOf(card(<Card fill={fill}>Item one</Card>))
      expect(classes).toContain('rounded-lg')
      expect(classes).toContain('border')
      cleanup()
    }
  })

  it('the hairline follows the fill: default on surface and elevated, subtle on inset and none', () => {
    const expected = { surface: ['bg-bg-surface', 'border-border-default'], elevated: ['bg-bg-elevated', 'border-border-default'], inset: ['bg-bg-inset', 'border-border-subtle'], none: ['border-border-subtle'] } as const
    for (const [fill, classes] of Object.entries(expected)) {
      const actual = classesOf(card(<Card fill={fill as keyof typeof expected}>Item one</Card>))
      for (const c of classes) expect(actual).toContain(c)
      if (fill === 'none') expect(actual.some((c) => c.startsWith('bg-'))).toBe(false)
      cleanup()
    }
  })

  it('is still by default: nothing answers the pointer, and nothing eases', () => {
    const classes = classesOf(card(<Card>Item one</Card>))
    expect(classes.some((c) => c.startsWith('hover:'))).toBe(false)
    expect(classes).not.toContain('transition-colors')
    cleanup()
    expect(classesOf(card(<Card href="#">Item one</Card>))).toContain('transition-colors')
  })

  it('with an href it is a link, its hairline one step stronger on hover, and a router takes the click', async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault())
    render(
      <Card href="/somewhere" onClick={onClick as never}>
        Item one
      </Card>,
    )
    const link = screen.getByRole('link', { name: 'Item one' })
    expect(link.getAttribute('href')).toBe('/somewhere')
    expect(classesOf(link)).toContain('hover:border-border-strong')
    await userEvent.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
    cleanup()
    expect(classesOf(card(<Card fill="inset" href="#">Item one</Card>))).toContain('hover:border-border-default')
  })

  it('a feed card lights up on hover, and can keep its hairline hidden until then', () => {
    const classes = classesOf(card(<Card hover="fill" quietUntilHover onClick={() => {}}>Item one</Card>))
    expect(classes).toContain('border-transparent')
    expect(classes).toContain('hover:bg-bg-hover')
    expect(classes).toContain('hover:border-border-default')
    expect(classes).toContain('cursor-pointer')
  })

  it('the one you are on, and the one being changed, do not answer the pointer', () => {
    const selected = classesOf(card(<Card hover="fill" quietUntilHover selected>Item one</Card>))
    expect(selected).toContain('bg-bg-selected')
    expect(selected).toContain('border-border-subtle')
    expect(selected.some((c) => c.startsWith('hover:'))).toBe(false)
    cleanup()
    const active = classesOf(card(<Card hover="fill" active attention="accent">Item one</Card>))
    expect(active).toContain('border-accent-primary')
    expect(active).not.toContain('border-accent-muted')
    expect(active.some((c) => c.startsWith('hover:'))).toBe(false)
  })

  it('attention recolours the hairline, at rest and on hover', () => {
    const classes = classesOf(card(<Card hover="fill" quietUntilHover attention="warning">Item one</Card>))
    expect(classes).toContain('border-warning-muted')
    expect(classes).toContain('hover:border-warning-muted')
    expect(classes).not.toContain('border-transparent')
  })

  it('a card that cannot be read is dashed, and keeps its fill', () => {
    const classes = classesOf(card(<Card unreadable>Item one</Card>))
    expect(classes).toContain('border-dashed')
    expect(classes).toContain('bg-bg-surface')
  })

  it("the caller's className lands last", () => {
    const classes = classesOf(card(<Card href="#" className="flex flex-col gap-2 p-3">Item one</Card>))
    expect(classes).toContain('flex')
    expect(classes).not.toContain('block')
    expect(classes).toContain('p-3')
  })
})
