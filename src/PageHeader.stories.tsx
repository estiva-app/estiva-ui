import { useState } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { IconBox, IconDotsVertical, IconLayoutSidebarRight, IconLayoutSidebarRightFilled, IconSquareRounded } from '@tabler/icons-react'
import { Avatar } from './Avatar'
import { Breadcrumb as Trail } from './Breadcrumb'
import { Button } from './Button'
import { MembersPill } from './MembersPill'
import { Menu, MenuItem } from './Menu'
import { PageHeader } from './PageHeader'
import { ScrollArea } from './ScrollArea'
import { Toolbar, ToolbarButton } from './Toolbar'

/**
 * The page under the bar: a stand-in body that scrolls, so the bar is seen
 * against content and its hairline against the page.
 */
const onAPage: Decorator = (Story) => (
  <div className="flex h-screen w-full flex-col bg-bg-surface">
    {Story()}
    <ScrollArea className="min-h-0 flex-1" contentClassName="flex flex-col gap-3 px-4 pt-3 pb-4">
      {Array.from({ length: 3 }, (_, i) => (
        <p key={i} className="max-w-2xl text-body-2 text-text-secondary">
          Paragraph {i + 1}. The page under the bar: what it holds, written out in full the way a real one is, so the bar is seen
          against what it heads.
        </p>
      ))}
    </ScrollArea>
  </div>
)

const meta = {
  title: 'Page structure/PageHeader',
  component: PageHeader,
  // On the page each canvas is its own frame, the bar and a few lines of the page under it; the story alone is full height.
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, height: '200px' } } },
  args: { title: 'Item one' },
  argTypes: {
    leading: { control: false },
    after: { control: false },
    members: { control: false },
    actions: { control: false },
  },
  decorators: [onAPage],
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

const icon = <IconSquareRounded size={16} stroke={1.5} />
const members = <MembersPill members={[{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }, { name: 'Marta Silva' }]} count={4} onClick={() => {}} />
const more = (
  <Menu
    align="right"
    trigger={
      <ToolbarButton tooltip="More" aria-label="More">
        <IconDotsVertical size={16} stroke={1.5} />
      </ToolbarButton>
    }
  >
    <MenuItem label="Item one" />
    <MenuItem label="Item two" />
  </Menu>
)
const actions = (
  <Toolbar aria-label="Page actions" surface={false}>
    <ToolbarButton tooltip="Action" aria-label="Action">
      <IconSquareRounded size={16} stroke={1.5} />
    </ToolbarButton>
    {more}
  </Toolbar>
)

/** The title alone: one line in body-2-strong. */
export const Title: Story = {}

/** An icon before the title, 16px, 8px from it: what kind of page this is, or its state. */
export const WithAnIcon: Story = { args: { leading: icon } }

/** A face before the title: a page that is one person's. */
export const WithAFace: Story = { args: { title: 'Ana Duarte', leading: <Avatar size={16} name="Ana Duarte" /> } }

/** A lock before the title: only its members can open it. Point at the lock for its name. */
export const Private: Story = { args: { private: true } }

/** Something right after the title, never cut short: a small button. */
export const AfterTheTitle: Story = {
  args: {
    after: (
      <Button size="small" href="https://example.com" external leadingIcon={<IconSquareRounded size={14} stroke={1.5} />}>
        Open
      </Button>
    ),
  },
}

/** Quiet counts at the right, a dot between them; words about what is finished in the success colour. */
export const Counts: Story = { args: { leading: icon, meta: ['6 open', { label: '2 done', done: true }] } }

/** When it last changed, 12px italic. Point at it for the exact time. */
export const EditedTime: Story = { args: { time: { label: 'Edited 2 minutes ago', exact: '31 October 2026, 14:02' } } }

/** Who is in it: the members pill, which opens the list. */
export const Members: Story = { args: { members } }

/** The page's buttons at the right edge: a toolbar, 4px apart, the last one a menu. */
export const Actions: Story = { args: { actions } }

function WithAToggle() {
  const [open, setOpen] = useState(true)
  return (
    <PageHeader
      title="Item one"
      members={members}
      actions={
        <Toolbar aria-label="Page actions" surface={false}>
          <ToolbarButton tooltip={open ? 'Hide column' : 'Show column'} aria-label={open ? 'Hide column' : 'Show column'} onClick={() => setOpen(!open)}>
            {open ? <IconLayoutSidebarRightFilled size={16} stroke={1.5} /> : <IconLayoutSidebarRight size={16} stroke={1.5} />}
          </ToolbarButton>
          {more}
        </Toolbar>
      }
    />
  )
}

/** A button that shows and hides the right column: its icon filled while the column is open. Press it. */
export const ColumnToggle: Story = {
  render: () => <WithAToggle />,
}

/** A trail in the title's place: where this page sits, the last crumb where you are. */
export const Breadcrumb: Story = {
  args: {
    title: (
      <Trail
        items={[
          { label: 'Items', href: '#' },
          { label: 'Group one', icon: <IconBox size={16} stroke={1.5} />, href: '#' },
          { label: 'ITM-12', mono: true },
        ]}
      />
    ),
    members,
  },
}

/** A title longer than its room: it is cut short with an ellipsis, and nothing at the right moves. */
export const LongTitle: Story = {
  decorators: [(Story) => <div className="flex w-full max-w-xl flex-col">{Story()}</div>],
  args: {
    leading: icon,
    title: 'Item one, with a name long enough to run out of room well before the buttons at the right',
    meta: ['6 open', { label: '2 done', done: true }],
    members,
    actions,
  },
}

/** Everything at once, in its order: icon, lock, title, button; counts, time, members, buttons. */
export const Everything: Story = {
  args: {
    leading: icon,
    private: true,
    after: (
      <Button size="small" href="https://example.com" external leadingIcon={<IconSquareRounded size={14} stroke={1.5} />}>
        Open
      </Button>
    ),
    meta: ['6 open', { label: '2 done', done: true }],
    time: { label: 'Edited 2 minutes ago', exact: '31 October 2026, 14:02' },
    members,
    actions,
  },
}
