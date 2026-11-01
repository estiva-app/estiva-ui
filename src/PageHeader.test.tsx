// @vitest-environment jsdom
/** What the PageHeader page claims, pinned: what a person sees and reaches in the bar, slot by slot. */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IconDotsVertical, IconSquareRounded } from '@tabler/icons-react'
import { Breadcrumb } from './Breadcrumb'
import { Button } from './Button'
import { MembersPill } from './MembersPill'
import { PageHeader } from './PageHeader'
import { Toolbar, ToolbarButton } from './Toolbar'

afterEach(cleanup)

const toolbar = (
  <Toolbar aria-label="Page actions" surface={false}>
    <ToolbarButton tooltip="Action" aria-label="Action">
      <IconSquareRounded size={16} stroke={1.5} />
    </ToolbarButton>
    <ToolbarButton tooltip="More" aria-label="More">
      <IconDotsVertical size={16} stroke={1.5} />
    </ToolbarButton>
  </Toolbar>
)

describe('PageHeader', () => {
  it('shows the title, and nothing else when given nothing else', () => {
    const { container } = render(<PageHeader title="Item one" />)
    expect(container.textContent).toBe('Item one')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('img', { name: 'Private' })).toBeNull()
  })

  it('a private page has a lock named "Private" before its title', () => {
    const { container } = render(<PageHeader title="Item one" private />)
    const lock = screen.getByRole('img', { name: 'Private' })
    // Before the title in reading order.
    expect(lock.compareDocumentPosition(screen.getByText('Item one')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(container.textContent).toBe('Item one')
  })

  it('names the lock in a tooltip when the pointer is on it', async () => {
    const user = userEvent.setup()
    render(<PageHeader title="Item one" private />)
    await user.hover(screen.getByRole('img', { name: 'Private' }))
    expect((await screen.findByRole('tooltip')).textContent).toBe('Private')
  })

  it('draws the counts in the order given, as words', () => {
    render(<PageHeader title="Item one" meta={['6 open', { label: '2 done', done: true }]} />)
    const open = screen.getByText('6 open')
    const done = screen.getByText('2 done')
    expect(open.compareDocumentPosition(done) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows when it last changed, and the exact time in a tooltip under the pointer', async () => {
    const user = userEvent.setup()
    render(<PageHeader title="Item one" time={{ label: 'Edited 2 minutes ago', exact: '31 October 2026, 14:02' }} />)
    const when = screen.getByText('Edited 2 minutes ago')
    expect(screen.queryByRole('tooltip')).toBeNull()
    await user.hover(when)
    expect((await screen.findByRole('tooltip')).textContent).toBe('31 October 2026, 14:02')
  })

  it('the members pill is a button that opens the list', async () => {
    const user = userEvent.setup()
    let opened = 0
    render(<PageHeader title="Item one" members={<MembersPill members={[{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }]} onClick={() => opened++} />} />)
    await user.click(screen.getByRole('button', { name: '2 members' }))
    expect(opened).toBe(1)
  })

  it('the buttons come after everything else, in reading order and in the Tab order', async () => {
    const user = userEvent.setup()
    render(
      <PageHeader
        title="Item one"
        after={<Button size="small">Open</Button>}
        meta={['6 open']}
        members={<MembersPill members={[{ name: 'Ana Duarte' }]} onClick={() => {}} />}
        actions={toolbar}
      />,
    )
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open' }))
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '1 member' }))
    await user.tab()
    // The toolbar is one stop; its first button takes it.
    expect(document.activeElement).toBe(within(screen.getByRole('toolbar', { name: 'Page actions' })).getByRole('button', { name: 'Action' }))
  })

  it('a title that is not a string is drawn as given: a breadcrumb trail stays a trail', () => {
    render(<PageHeader title={<Breadcrumb items={[{ label: 'Items', href: '#' }, { label: 'ITM-12', mono: true }]} />} />)
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(trail).getByRole('link', { name: 'Items' })).toBeTruthy()
    expect(within(trail).getByText('ITM-12').getAttribute('aria-current')).toBe('page')
  })
})
