import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { useState, type ReactNode } from 'react'
import { IconArrowUpRight, IconFolder, IconPlus } from '@tabler/icons-react'
import { Button } from './Button'
import { Chip } from './Chip'
import { UnreadDot } from './UnreadDot'
import { MenuItem, MenuSeparator } from './Menu'
import { NavItem } from './NavItem'
import { NavTree, NavTreeSection, type NavTreeGroup, type NavTreeNode } from './NavTree'
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
  title: 'App frame/NavTree',
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

const folder = <IconFolder size={16} stroke={1.5} />

/** A group's `icon`: a folder before its title, the arrow in its place on hover; its rows start under the title. */
export const GroupIcons: Story = {
  args: {
    groups: [
      { id: 'i1', title: 'Group one', icon: folder, menu: groupMenu, defaultOpen: true, nodes: [
        { id: 'i1a', label: 'Item two', href: '#', icon: placeholder, unread: true, menu: rowMenu },
        { id: 'i1b', label: 'Item three', href: '#', icon: placeholder, menu: rowMenu },
      ] },
      { id: 'i2', title: 'Group two', icon: folder, menu: groupMenu, nodes: [{ id: 'i2a', label: 'Item four', href: '#', icon: placeholder }] },
    ],
    selected: 'i1b',
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
            <NavTreeSection title="Group one" trailing={<UnreadDot />} menu={groupMenu}>
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

/*
  Opening a row shows where it lives (Katerina, 30 October): its group and the
  rows above it open, the row is marked, and the column scrolls to it.
*/
function item(n: number, children?: NavTreeNode[]): NavTreeNode {
  return { id: `i${n}`, label: `Item ${n}`, href: '#', icon: placeholder, ...(children ? { children, defaultOpen: false } : {}) }
}

const WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']

/** Eight shut groups, enough for the column to scroll; in the last, Item 31 is two levels in, under Item 29 and Item 30. */
const SHUT_GROUPS: NavTreeGroup[] = WORDS.map((word, g) => ({
  id: `s${g + 1}`,
  title: `Group ${word}`,
  defaultOpen: false,
  nodes: g === 7 ? [item(28), item(29, [item(30, [item(31)])]), item(32)] : [1, 2, 3, 4].map((r) => item(g * 4 + r)),
}))

/** The page beside the column: what opens a row from outside it — a link, a search. */
function Page({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col items-start gap-2 p-6">{children}</div>
}

/** Every group starts shut. Open a row from the page: its group and the rows above it open, and the column scrolls to it. Close that group by hand: it stays closed until another row in it opens. */
export const OpensOntoTheCurrentRow: Story = {
  args: { groups: SHUT_GROUPS, selected: undefined },
  render: function Render(args) {
    const [selected, setSelected] = useState<string | undefined>(undefined)
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar>
          <NavTree
            {...args}
            selected={selected}
            onSelect={(node, event) => {
              event.preventDefault()
              setSelected(node.id)
            }}
          />
        </Sidebar>
        <Page>
          <Button variant="outlined" size="small" onClick={() => setSelected('i31')}>Open Item 31</Button>
          <Button variant="outlined" size="small" onClick={() => setSelected('i10')}>Open Item 10</Button>
          <Button variant="outlined" size="small" onClick={() => setSelected('i2')}>Open Item 2</Button>
        </Page>
      </div>
    )
  },
}

/** A new tab, where nothing is open yet: each button starts the column again, every group shut, and opens onto its row. */
export const InANewTab: Story = {
  args: { groups: SHUT_GROUPS, selected: undefined },
  render: function Render(args) {
    const [tab, setTab] = useState<{ n: number; selected?: string }>({ n: 0 })
    const open = (id: string) => setTab((now) => ({ n: now.n + 1, selected: id }))
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar key={tab.n}>
          <NavTree
            {...args}
            selected={tab.selected}
            onSelect={(node, event) => {
              event.preventDefault()
              setTab((now) => ({ ...now, selected: node.id }))
            }}
          />
        </Sidebar>
        <Page>
          <Button variant="outlined" size="small" onClick={() => open('i31')}>Open Item 31 in a new tab</Button>
          <Button variant="outlined" size="small" onClick={() => open('i14')}>Open Item 14 in a new tab</Button>
        </Page>
      </div>
    )
  },
}

/** The current row sits under a row whose rows are read only when it opens: `selectedParent` opens onto that row and opens it; once its rows are read, the current one is marked. */
export const UnderARowNotReadYet: Story = {
  args: { selected: undefined },
  render: function Render(args) {
    const [selected, setSelected] = useState<string | undefined>(undefined)
    const [open, setOpen] = useState(false)
    const [read, setRead] = useState<NavTreeNode[] | null | undefined>(undefined)
    const openRow = (next: boolean) => {
      setOpen(next)
      if (!next || read !== undefined) return
      setRead(null)
      setTimeout(() => setRead([item(4), item(5), item(6)]), 800)
    }
    const groups: NavTreeGroup[] = [
      { id: 'n1', title: 'Group one', defaultOpen: false, nodes: [item(7), item(8)] },
      { id: 'n2', title: 'Group two', defaultOpen: false, nodes: [item(1), { ...item(2), hasChildren: true, children: read, open, onOpenChange: openRow }, item(3)] },
    ]
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar>
          <NavTree
            {...args}
            groups={groups}
            selected={selected}
            selectedParent={selected === 'i5' ? 'i2' : undefined}
            onSelect={(node, event) => {
              event.preventDefault()
              setSelected(node.id)
            }}
          />
        </Sidebar>
        <Page>
          <Button variant="outlined" size="small" onClick={() => setSelected('i5')}>Open Item 5, under Item 2</Button>
        </Page>
      </div>
    )
  },
}

/** The current item is not a row in the tree: the place it is listed in stays marked, and `selectedParent` opens the group holding the row it is under — that row is not marked. */
export const NotARowHere: Story = {
  args: { groups: SHUT_GROUPS.slice(0, 5), selected: undefined },
  render: function Render(args) {
    const [under, setUnder] = useState<string | undefined>(undefined)
    return (
      <div className="flex h-screen bg-bg-base">
        <Sidebar>
          <NavItem href="#" label="Item list" icon={placeholder} active />
          <NavItem href="#" label="Another list" icon={placeholder} />
          <NavTree {...args} selected={under && `item under ${under}`} selectedParent={under} />
        </Sidebar>
        <Page>
          <Button variant="outlined" size="small" onClick={() => setUnder('i18')}>Open an item under Item 18</Button>
          <Button variant="outlined" size="small" onClick={() => setUnder('i6')}>Open an item under Item 6</Button>
        </Page>
      </div>
    )
  },
}
