// @vitest-environment jsdom
/**
 * What the Tooltip page claims, pinned.
 *
 * The page said "it shows on hover only — there is no focus or touch trigger"
 * for as long as the component was hand-written, and that sentence was the
 * reason `disabledReason` could not be read without a mouse. Stage 4 put it on
 * Base UI's `Tooltip`; these are the tests that let the sentence be deleted.
 *
 * The motion (D26) is not here: jsdom runs no transitions, so it is proved in
 * a browser instead and the numbers live in the page.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IconSquareRounded } from '@tabler/icons-react'
import { Tooltip, TooltipProvider, WithTooltip } from './Tooltip'
import { Button } from './Button'
import { IconButton } from './IconButton'

afterEach(cleanup)

describe('Tooltip, the surface', () => {
  it('is a tooltip, and draws the shortcut after the label', () => {
    render(<Tooltip label="Bold" shortcut="Cmd+B" />)
    const tip = screen.getByRole('tooltip')
    expect(tip.textContent).toBe('BoldCmd+B')
  })

  it('takes a caller class without losing its own', () => {
    render(<Tooltip label="Bold" className="w-40" />)
    const tip = screen.getByRole('tooltip')
    expect(tip.className).toContain('w-40')
    expect(tip.className).toContain('bg-bg-elevated')
  })
})

describe('WithTooltip', () => {
  it('wraps its child in the inline-flex wrapper, and the child is untouched', () => {
    const { container } = render(
      <WithTooltip label="Add to starred">
        <button type="button">Star</button>
      </WithTooltip>,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.tagName).toBe('DIV')
    expect(wrapper.className).toContain('inline-flex')
    expect(wrapper.className).toContain('shrink-0')
    expect(wrapper.firstElementChild?.tagName).toBe('BUTTON')
  })

  it('takes wrapperClassName, which is what keeps a truncating label truncating', () => {
    const { container } = render(
      <WithTooltip label="A long name" wrapperClassName="min-w-0 shrink">
        <span className="truncate">A long name</span>
      </WithTooltip>,
    )
    expect((container.firstElementChild as HTMLElement).className).toContain('min-w-0')
  })

  it('opens on hover and closes when the pointer leaves', async () => {
    const user = userEvent.setup()
    render(
      <WithTooltip label="Add to starred">
        <button type="button">Star</button>
      </WithTooltip>,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
    await user.hover(screen.getByRole('button', { name: 'Star' }))
    // The 300ms wait is D23; it was instant before.
    expect((await screen.findByRole('tooltip')).textContent).toBe('Add to starred')
    await user.unhover(screen.getByRole('button', { name: 'Star' }))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('closes on Escape while it is up', async () => {
    const user = userEvent.setup()
    render(
      <WithTooltip label="Add to starred">
        <button type="button">Star</button>
      </WithTooltip>,
    )
    await user.tab()
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('a click on the trigger closes it — the tooltip has said its piece', async () => {
    const user = userEvent.setup()
    render(
      <WithTooltip label="Add to starred">
        <button type="button">Star</button>
      </WithTooltip>,
    )
    const star = screen.getByRole('button', { name: 'Star' })
    await user.hover(star)
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    await user.click(star)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  /** The gap the page wrote down about itself, and the reason Tooltip went first. */
  it('opens when the control inside it is reached by keyboard', async () => {
    const user = userEvent.setup()
    render(
      <WithTooltip label="Add to starred">
        <button type="button">Star</button>
      </WithTooltip>,
    )
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Star' }))
    expect((await screen.findByRole('tooltip')).textContent).toBe('Add to starred')
  })

  it('closes again when focus moves on', async () => {
    const user = userEvent.setup()
    render(
      <>
        <WithTooltip label="Add to starred">
          <button type="button">Star</button>
        </WithTooltip>
        <button type="button">Next</button>
      </>,
    )
    await user.tab()
    expect(await screen.findByRole('tooltip')).toBeTruthy()
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})

describe('a control that IS its own trigger', () => {
  /**
   * The finding stage 3 ended on: an `IconButton` carrying a tooltip returned
   * `WithTooltip`'s wrapper `<div>` as its root, so a `Dialog.Close` composed
   * onto the wrapper instead of the button. The root is the button now.
   */
  it('IconButton with a tooltip has the button as its root, not a wrapper', () => {
    const { container } = render(
      <IconButton aria-label="Settings" tooltip="Settings">
        <IconSquareRounded size={16} stroke={1.5} />
      </IconButton>,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.tagName).toBe('BUTTON')
    expect(root).toBe(screen.getByRole('button', { name: 'Settings' }))
  })

  it('Button with a disabledReason has the button as its root too', () => {
    const { container } = render(<Button disabledReason="Sign in first">Add</Button>)
    expect((container.firstElementChild as HTMLElement).tagName).toBe('BUTTON')
  })

  /** Disabled-with-a-reason must still be hoverable, or the reason never shows:
   *  `pointer-events-none` is dropped in that one case and Base UI swallows the
   *  click instead. */
  it('a disabled-with-a-reason button keeps its pointer events, and its click does nothing', async () => {
    const user = userEvent.setup()
    let clicks = 0
    render(
      <Button disabledReason="Sign in first" onClick={() => { clicks += 1 }}>
        Add
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Add' })
    expect(button.className).not.toContain('pointer-events-none')
    await user.click(button)
    expect(clicks).toBe(0)
  })

  it('a plainly disabled button keeps pointer-events-none', () => {
    render(<Button disabled>Add</Button>)
    expect(screen.getByRole('button', { name: 'Add' }).className).toContain('pointer-events-none')
  })
})

describe('TooltipProvider', () => {
  /** The grouping itself is a matter of timers in a real browser; what jsdom
   *  can say is that a tooltip under a provider behaves the same as one
   *  without, which is the promise the page makes to an app that forgets it. */
  it('changes nothing about whether a tooltip opens', async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider>
        <WithTooltip label="Add to starred">
          <button type="button">Star</button>
        </WithTooltip>
      </TooltipProvider>,
    )
    await user.hover(screen.getByRole('button', { name: 'Star' }))
    expect((await screen.findByRole('tooltip')).textContent).toBe('Add to starred')
  })
})
