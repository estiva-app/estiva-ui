import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { useState } from 'react'
import { IconArrowUpRight, IconPlus } from '@tabler/icons-react'
import { Chip } from './Chip'
import { UnreadDot } from './UnreadDot'
import { MenuItem, MenuSeparator } from './Menu'
import { NavItem } from './NavItem'
import { NavTree, NavTreeSection, type NavTreeGroup } from './NavTree'
import { Sidebar } from './Sidebar'

const placeholder = <IconSquareRounded size={16} stroke={1.5} />
const hint = <Chip type="neutral" label="Label" />

/** Three groups; the open one holds rows under rows, hints and counts, and long labels to see what fits. */
const GROUPS: NavTreeGroup[] = [
  { id: 'g1', title: 'Group one', nodes: [{ id: 'a', label: 'Item two', href: '#', icon: placeholder }] },
  {
    id: 'g2',
    title: 'A group with a longer name',
    nodes: [
      { id: 'b', label: 'Item three', href: '#', icon: placeholder, count: 1, countLabel: '1 open' },
      {
        id: 'c',
        label: 'An item whose label runs longer than the column',
        href: '#',
        icon: placeholder,
        children: [
          { id: 'c1', label: 'An item one level in, also long', href: '#', icon: placeholder, count: 2, countLabel: '2 open' },
          { id: 'c2', label: 'Item four', href: '#', icon: placeholder, children: [{ id: 'c21', label: 'An item two levels in, long too', href: '#', icon: placeholder }] },
        ],
      },
      { id: 'd', label: 'An item with a hint and a long label', href: '#', icon: placeholder, hint, count: 3, countLabel: '3 open' },
      { id: 'e', label: 'Item five', href: '#', icon: placeholder, hint },
      { id: 'f', label: 'An item with a hint and a count', href: '#', icon: placeholder, hint, count: 12, countLabel: '12 open' },
    ],
  },
  { id: 'g3', title: 'Group three', nodes: [{ id: 'g', label: 'Item six', href: '#', icon: placeholder }] },
]

const meta = {
  title: 'Frame/NavTree',
  component: NavTree,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Groups', groups: GROUPS, selected: 'b', emptyMessage: 'Nothing here yet.' },
  argTypes: { groups: { control: false } },
  // In the Sidebar, under a first row, as it sits in an app; a click marks the row it was on.
  render: function Render(args) {
    const [selected, setSelected] = useState(args.selected)
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar>
          <NavItem href="#" label="Item one" icon={placeholder} />
          <NavTree
            {...args}
            selected={selected}
            onSelect={(node, event) => {
              event.preventDefault()
              setSelected(node.id)
            }}
          />
        </Sidebar>
      </div>
    )
  },
} satisfies Meta<typeof NavTree>

export default meta
type Story = StoryObj<typeof meta>

/** Only the group holding the current row starts open. Point at a row with rows under it: its icon becomes the arrow. Point at a row with a hint: the chip shows. */
export const Default: Story = {}

/** The current row is two levels in: its group opens, and the rows above it are open too. */
export const CurrentDeep: Story = { args: { selected: 'c21' } }

/** No quiet label over the groups. */
export const NoTitle: Story = { args: { title: undefined } }

/** The first read is on its way. */
export const Loading: Story = { args: { groups: null } }

/** No groups: the caller's words, level with the rows. */
export const Empty: Story = { args: { groups: [] } }

/** Close a group and reload the page: still closed. This browser remembers each group, under the key. */
export const Remembered: Story = { args: { storageKey: 'estiva-ui.stories.nav-tree' } }

/** Actions beside the label and on each group, a group's dot, and unread rows — one urgent. */
export const WithActionsAndUnread: Story = {
  args: {
    titleActions: [{ icon: <IconPlus size={16} stroke={1.5} />, tooltip: 'New', onClick: () => {} }],
    groups: [
      { id: 'u1', title: 'Group one', trailing: <UnreadDot />, actions: [{ icon: <IconArrowUpRight size={16} stroke={1.5} />, tooltip: 'Open', onClick: () => {} }], defaultOpen: true, nodes: [
        { id: 'u1a', label: 'Item two', href: '#', icon: placeholder, unread: true },
        { id: 'u1b', label: 'Item three', href: '#', icon: placeholder, unread: true, urgent: true },
        { id: 'u1c', label: 'Item four', href: '#', icon: placeholder },
      ] },
      { id: 'u2', title: 'Group two', actions: [{ icon: <IconArrowUpRight size={16} stroke={1.5} />, tooltip: 'Open', onClick: () => {} }], nodes: [{ id: 'u2a', label: 'Item five', href: '#', icon: placeholder }] },
    ],
    selected: 'u1c',
  },
}

const groupMenu = (
  <>
    <MenuItem label="Add" />
    <MenuItem label="Rename" />
    <MenuItem label="Archive…" />
    <MenuSeparator />
    <MenuItem label="Delete" destructive />
  </>
)
const rowMenu = (
  <>
    <MenuItem label="Move…" />
    <MenuItem label="Rename" />
  </>
)

/** A group's `menu`: its "More options", after its dot. Each row has its own. Hover a group's title. */
export const GroupMenus: Story = {
  args: {
    groups: [
      { id: 'm1', title: 'Group one', trailing: <UnreadDot />, menu: groupMenu, defaultOpen: true, nodes: [
        { id: 'm1a', label: 'Item two', href: '#', icon: placeholder, unread: true, menu: rowMenu },
        { id: 'm1b', label: 'Item three', href: '#', icon: placeholder, menu: rowMenu },
      ] },
      { id: 'm2', title: 'Group two', menu: groupMenu, nodes: [{ id: 'm2a', label: 'Item four', href: '#', icon: placeholder, menu: rowMenu }] },
    ],
    selected: 'm1b',
  },
}

/** Read as it opens: a group still being read, a group with nothing in it, a row whose rows are read when it opens, and one that could not be read. */
export const ReadAsItOpens: Story = {
  args: {
    groups: [
      { id: 'l1', title: 'Being read', defaultOpen: true, nodes: null },
      { id: 'l2', title: 'Empty', defaultOpen: true, nodes: [], message: 'Nothing in this yet.' },
      { id: 'l3', title: 'Rows read on open', defaultOpen: true, nodes: [
        { id: 'l3a', label: 'Item with rows not read yet', href: '#', icon: placeholder, hasChildren: true, defaultOpen: false },
        { id: 'l3b', label: 'Item whose rows failed', href: '#', icon: placeholder, hasChildren: true, childrenMessage: 'This could not be read.' },
      ] },
    ],
    selected: undefined,
  },
}

/** Groups the app draws itself, as `NavTree`'s children: each a `NavTreeSection` with `NavItem` rows — for groups and rows that each read their own data. */
export const AppDrawnGroups: Story = {
  args: { groups: undefined },
  render: function Render(args) {
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar>
          <NavTree title={args.title}>
            <NavTreeSection title="Group one" trailing={<UnreadDot />}>
              <NavItem href="#" label="Item one" icon={placeholder} unread />
              <NavItem href="#" label="Item two" icon={placeholder} active>
                <NavItem href="#" label="Item three" icon={placeholder} />
              </NavItem>
            </NavTreeSection>
            <NavTreeSection title="Group two" loading />
            <NavTreeSection title="Group three" message="Nothing in this yet." />
          </NavTree>
        </Sidebar>
      </div>
    )
  },
}
