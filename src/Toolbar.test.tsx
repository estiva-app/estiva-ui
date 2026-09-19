// @vitest-environment jsdom
/**
 * What the Toolbar page claims, pinned — and the reason the component exists
 * is the first test: a strip of controls is one Tab stop, not one per button.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IconButton } from './IconButton'
import { Toolbar, ToolbarButton, ToolbarInput, ToolbarLink, ToolbarSeparator } from './Toolbar'
import { Menu, MenuItem } from './Menu'
import { Popover } from './Popover'

afterEach(cleanup)

const dot = <span aria-hidden="true">·</span>

function Strip({ label = 'Formatting' }: { label?: string }) {
  return (
    <>
      <button type="button">Before</button>
      <Toolbar aria-label={label}>
        <ToolbarButton aria-label="One">{dot}</ToolbarButton>
        <ToolbarButton aria-label="Two">{dot}</ToolbarButton>
        <ToolbarButton aria-label="Three">{dot}</ToolbarButton>
      </Toolbar>
      <button type="button">After</button>
    </>
  )
}

const focused = () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent

describe('Toolbar', () => {
  it('is a named toolbar', () => {
    render(<Strip />)
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeTruthy()
  })

  /** The whole point. Three buttons, one stop. */
  it('is one Tab stop, whatever it holds', async () => {
    const user = userEvent.setup()
    render(<Strip />)
    screen.getByRole('button', { name: 'Before' }).focus()
    await user.tab()
    expect(focused()).toBe('One')
    await user.tab()
    expect(focused()).toBe('After')
  })

  it('and coming back lands on the toolbar, not inside it', async () => {
    const user = userEvent.setup()
    render(<Strip />)
    screen.getByRole('button', { name: 'After' }).focus()
    await user.tab({ shift: true })
    expect(focused()).toBe('One')
  })

  it('the arrow keys walk it, and wrap', async () => {
    const user = userEvent.setup()
    render(<Strip />)
    screen.getByRole('button', { name: 'One' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe('Two')
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(focused()).toBe('One')
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toBe('Three')
  })

  /**
   * The gap, pinned as a gap. Base UI's composite implements Home and End
   * behind `enableHomeAndEndKeys`, and `Toolbar.Root` does not pass it — so
   * they do nothing here, the page does not claim them, and this test fails
   * the day that changes.
   */
  it('Home and End do nothing, which is Base UI’s choice and is stated', async () => {
    const user = userEvent.setup()
    render(<Strip />)
    screen.getByRole('button', { name: 'Two' }).focus()
    await user.keyboard('{End}')
    expect(focused()).toBe('Two')
    await user.keyboard('{Home}')
    expect(focused()).toBe('Two')
  })

  it('a vertical toolbar walks with ↑ and ↓', async () => {
    const user = userEvent.setup()
    render(
      <Toolbar aria-label="Formatting" orientation="vertical">
        <ToolbarButton aria-label="One">{dot}</ToolbarButton>
        <ToolbarButton aria-label="Two">{dot}</ToolbarButton>
      </Toolbar>,
    )
    expect(screen.getByRole('toolbar').getAttribute('aria-orientation')).toBe('vertical')
    screen.getByRole('button', { name: 'One' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(focused()).toBe('Two')
  })

  it('a button still runs its onClick, and is still an IconButton', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Toolbar aria-label="Formatting">
        <ToolbarButton aria-label="One" onClick={onClick}>{dot}</ToolbarButton>
      </Toolbar>,
    )
    const button = screen.getByRole('button', { name: 'One' })
    expect(button.tagName).toBe('BUTTON')
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  /**
   * A strip whose controls come and go from the arrow keys as their state
   * changes is a strip you cannot learn — and a `disabledReason` you cannot
   * reach is a reason nobody reads.
   */
  it('a disabled control keeps its place in the walk', async () => {
    const user = userEvent.setup()
    render(
      <Toolbar aria-label="Formatting">
        <ToolbarButton aria-label="One">{dot}</ToolbarButton>
        <ToolbarButton aria-label="Two" disabledReason="Not yet">{dot}</ToolbarButton>
        <ToolbarButton aria-label="Three">{dot}</ToolbarButton>
      </Toolbar>,
    )
    screen.getByRole('button', { name: 'One' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe('Two')
    expect(screen.getByRole('button', { name: 'Two' }).getAttribute('aria-disabled')).toBe('true')
  })

  /** The box, which a floating strip needs and Peek had drawn twice. */
  it('draws the elevated box, and drops it on request', () => {
    const withBox = render(<Toolbar aria-label="Formatting"><ToolbarButton aria-label="One">{dot}</ToolbarButton></Toolbar>)
    const panel = withBox.container.firstElementChild as HTMLElement
    expect(panel.className).toContain('bg-bg-elevated')
    expect(panel.querySelector('[role="toolbar"]')).toBeTruthy()
    // The strip stays a row inside a panel that is a column for a menu's rows.
    expect(panel.querySelector('[role="toolbar"]')!.className).not.toContain('flex-col')
    withBox.unmount()

    const bare = render(<Toolbar aria-label="Formatting" surface={false}><ToolbarButton aria-label="One">{dot}</ToolbarButton></Toolbar>)
    expect((bare.container.firstElementChild as HTMLElement).getAttribute('role')).toBe('toolbar')
  })

  it('a separator is a separator, not just a hairline', () => {
    render(
      <Toolbar aria-label="Formatting">
        <ToolbarButton aria-label="One">{dot}</ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton aria-label="Two">{dot}</ToolbarButton>
      </Toolbar>,
    )
    expect(screen.getByRole('separator')).toBeTruthy()
  })

  /** While a field has focus the arrow keys are the caret's, which is what a
   *  field is for; Tab resumes the walk. */
  it('a field in the strip keeps the arrow keys for its caret', async () => {
    const user = userEvent.setup()
    render(
      <Toolbar aria-label="Link">
        <ToolbarButton aria-label="One">{dot}</ToolbarButton>
        <ToolbarInput aria-label="Link address" defaultValue="abc" />
      </Toolbar>,
    )
    const field = screen.getByRole('textbox', { name: 'Link address' }) as HTMLInputElement
    field.focus()
    field.setSelectionRange(3, 3)
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(field)
    expect(field.selectionStart).toBe(2)
  })
})

describe('a link in the strip (F3)', () => {
  it('is a real link, in the walk with the buttons beside it', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Before</button>
        <Toolbar aria-label="Item actions">
          <ToolbarButton aria-label="One">{dot}</ToolbarButton>
          <ToolbarLink href="/somewhere" aria-label="Open" tooltip="Open">{dot}</ToolbarLink>
        </Toolbar>
      </>,
    )
    const link = screen.getByRole('link', { name: 'Open' })
    expect(link.getAttribute('href')).toBe('/somewhere')
    await user.click(screen.getByRole('button', { name: 'Before' }))
    await user.tab()
    expect(focused()).toBe('One')
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(link)
    expect((await screen.findByRole('tooltip')).textContent).toBe('Open')
  })
})

describe('a loose row, for comparison', () => {
  /** The measurement the component exists to change: the same three buttons
   *  outside a toolbar are three Tab stops. */
  it('is one Tab stop per button', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Before</button>
        <div className="flex">
          <IconButton aria-label="One">{dot}</IconButton>
          <IconButton aria-label="Two">{dot}</IconButton>
          <IconButton aria-label="Three">{dot}</IconButton>
        </div>
        <button type="button">After</button>
      </>,
    )
    screen.getByRole('button', { name: 'Before' }).focus()
    const walk: (string | null | undefined)[] = []
    for (let i = 0; i < 4; i++) { await user.tab(); walk.push(focused()) }
    expect(walk).toEqual(['One', 'Two', 'Three', 'After'])
  })
})

describe('a ToolbarButton with a reason, as a trigger', () => {
  /*
    Found by Ship's adoption (2026-09-08, Finding 39): the message's tools put
    "React" (a Popover trigger) and "…" (a Menu trigger) on one strip, and with
    a `disabledReason` both came out `aria-disabled="false"`. The part that
    renders the trigger writes its own disabled state over the button's.
  */
  it('stays disabled, reachable, and closed as a Popover trigger', async () => {
    const user = userEvent.setup()
    render(
      <Toolbar aria-label="Tools">
        <Popover
          ariaLabel="Reactions"
          trigger={
            <ToolbarButton aria-label="React" disabledReason="Sign in to react.">
              {dot}
            </ToolbarButton>
          }
        >
          <p>the picker</p>
        </Popover>
      </Toolbar>,
    )
    const button = screen.getByRole('button', { name: 'React' })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.getAttribute('tabindex')).toBe('0')
    await user.click(button)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('stays disabled, reachable, and closed as a Menu trigger', async () => {
    const user = userEvent.setup()
    render(
      <Toolbar aria-label="Tools">
        <Menu
          trigger={
            <ToolbarButton aria-label="More" disabledReason="Sign in first.">
              {dot}
            </ToolbarButton>
          }
        >
          <MenuItem label="Delete" onClick={() => {}} />
        </Menu>
      </Toolbar>,
    )
    const button = screen.getByRole('button', { name: 'More' })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.getAttribute('tabindex')).toBe('0')
    await user.click(button)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
