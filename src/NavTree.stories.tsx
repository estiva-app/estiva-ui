import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { useState } from 'react'
import { Chip } from './Chip'
import { NavItem } from './NavItem'
import { NavTree, type NavTreeGroup } from './NavTree'
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
