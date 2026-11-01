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
import { createPortal } from 'react-dom'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
    const expected = { surface: ['bg-bg-surface', 'border-border-default'], elevated: ['bg-bg-elevated', 'border-border-default'], inset: ['bg-bg-wash', 'border-border-subtle'], none: ['border-border-subtle'] } as const
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
    expect(active).not.toContain('border-accent-outline')
    expect(active.some((c) => c.startsWith('hover:'))).toBe(false)
  })

  it('hovered holds the hover look without the pointer: a feed card stays lit, a link card keeps its stronger hairline', () => {
    const feed = classesOf(card(<Card hover="fill" quietUntilHover hovered onClick={() => {}}>Item one</Card>))
    expect(feed).toContain('bg-bg-hover')
    expect(feed).toContain('border-border-default')
    expect(feed).not.toContain('bg-bg-surface')
    expect(feed).not.toContain('border-transparent')
    cleanup()
    const link = classesOf(card(<Card href="#" hovered>Item one</Card>))
    expect(link).toContain('border-border-strong')
    cleanup()
    const inset = classesOf(card(<Card fill="inset" href="#" hovered>Item one</Card>))
    expect(inset).toContain('border-border-default')
    expect(inset).not.toContain('border-border-subtle')
    cleanup()
    // Nothing to hold on a card that does not answer the pointer.
    const still = classesOf(card(<Card hovered>Item one</Card>))
    expect(still).toContain('bg-bg-surface')
    expect(still).not.toContain('bg-bg-hover')
  })

  it('hovered is ignored by the one you are on and the one being changed; attention still colours the hairline', () => {
    const selected = classesOf(card(<Card hover="fill" hovered selected>Item one</Card>))
    expect(selected).toContain('bg-bg-selected')
    expect(selected).not.toContain('bg-bg-hover')
    cleanup()
    const active = classesOf(card(<Card hover="fill" hovered active>Item one</Card>))
    expect(active).toContain('border-accent-primary')
    expect(active).not.toContain('bg-bg-hover')
    cleanup()
    const urgent = classesOf(card(<Card hover="fill" quietUntilHover hovered attention="warning">Item one</Card>))
    expect(urgent).toContain('bg-bg-hover')
    expect(urgent).toContain('border-warning-outline')
    expect(urgent).not.toContain('border-border-default')
  })

  it('the one you are on can still be clicked, and says so; the one being changed does not', () => {
    expect(classesOf(card(<Card hover="fill" selected onClick={() => {}}>Item one</Card>))).toContain('cursor-pointer')
    cleanup()
    expect(classesOf(card(<Card hover="fill" active onClick={() => {}}>Item one</Card>))).not.toContain('cursor-pointer')
  })

  it('attention recolours the hairline, at rest and on hover', () => {
    const classes = classesOf(card(<Card hover="fill" quietUntilHover attention="warning">Item one</Card>))
    expect(classes).toContain('border-warning-outline')
    expect(classes).toContain('hover:border-warning-outline')
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

/*
  A card that opens what it stands for on a press (`onPress`): ConversationCard's press, which every card now has. A
  press on what acts by itself inside it is that control's; so is a press in a menu the card opened, which lands
  outside it in the page but reaches it through React's tree (Peek's Screener row, which worked this out by hand).
*/
describe('Card, pressed', () => {
  it('opens on a press anywhere on it', () => {
    const onPress = vi.fn()
    render(<Card hover="fill" onPress={onPress}><p>Item one</p></Card>)
    fireEvent.click(screen.getByText('Item one'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('a press on a button, a link or a field inside it is theirs, not the card’s', () => {
    const onPress = vi.fn()
    const onAct = vi.fn()
    render(
      <Card hover="fill" onPress={onPress}>
        <p>Item one</p>
        <button type="button" onClick={onAct}>Act</button>
        <a href="#somewhere">Go</a>
        <input aria-label="Field" />
        <span role="button" tabIndex={0}>Also acts</span>
        <span data-interactive="">Its own</span>
      </Card>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Act' }))
    fireEvent.click(screen.getByRole('link', { name: 'Go' }))
    fireEvent.click(screen.getByRole('textbox', { name: 'Field' }))
    fireEvent.click(screen.getByRole('button', { name: 'Also acts' }))
    fireEvent.click(screen.getByText('Its own'))
    expect(onAct).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('a press in a menu it opened, outside it in the page, is not a press on it', () => {
    const onPress = vi.fn()
    render(
      <Card hover="fill" onPress={onPress}>
        <p>Item one</p>
        {createPortal(<div role="menu"><span>Later today</span></div>, document.body)}
      </Card>,
    )
    fireEvent.click(screen.getByText('Later today'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('a double click, or words picked on it, is not a press', () => {
    const onPress = vi.fn()
    render(<Card hover="fill" onPress={onPress}><p>Item one</p></Card>)
    fireEvent.click(screen.getByText('Item one'), { detail: 2 })
    const words = document.createRange()
    words.selectNodeContents(screen.getByText('Item one'))
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(words)
    fireEvent.click(screen.getByText('Item one'), { detail: 1 })
    window.getSelection()?.removeAllRanges()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('Tab stops on it, and Enter or Space opens it; a key on a control inside it is the control’s', async () => {
    const onPress = vi.fn()
    render(
      <Card hover="fill" onPress={onPress}>
        <p>Item one</p>
        <button type="button">Act</button>
      </Card>,
    )
    await userEvent.tab()
    const pressable = screen.getByText('Item one').closest('div')!
    expect(document.activeElement).toBe(pressable)
    fireEvent.keyDown(pressable, { key: 'Enter' })
    fireEvent.keyDown(pressable, { key: ' ' })
    expect(onPress).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Act' }), { key: 'Enter' })
    expect(onPress).toHaveBeenCalledTimes(2)
  })

  it('shows it can be pressed, and a card with nothing to press is no Tab stop', () => {
    expect(classesOf(card(<Card hover="fill" onPress={() => {}}>Item one</Card>))).toContain('cursor-pointer')
    cleanup()
    expect(card(<Card hover="fill">Item one</Card>).getAttribute('tabindex')).toBeNull()
  })
})
