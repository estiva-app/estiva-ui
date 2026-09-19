import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSortDescending, IconSquareRounded } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from './Button'
import { CollapsibleSection } from './CollapsibleSection'
import { Divider } from './Divider'
import { Form } from './Form'
import { ListColumn } from './ListColumn'
import { NavItem } from './NavItem'
import { SectionHeader } from './SectionHeader'
import { SkeletonList } from './Skeleton'
import { TextInput } from './TextInput'
import { Toolbar, ToolbarButton } from './Toolbar'

/**
 * The list column of a page: 290px, a line on its right, a header, and a list
 * that scrolls. The rows are the app's own; these stories draw `NavItem`s as
 * stand-ins.
 */
const meta = {
  title: 'Layout/ListColumn',
  component: ListColumn,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Items', children: null },
  argTypes: { children: { control: false }, actions: { control: false }, above: { control: false } },
  // The column beside a main area, inside a surface — where it sits in the frame's card.
  decorators: [
    (Story) => (
      <div className="flex h-screen bg-bg-surface">
        {Story()}
        <div className="min-w-0 flex-1" />
      </div>
    ),
  ],
} satisfies Meta<typeof ListColumn>

export default meta
type Story = StoryObj<typeof meta>

const icon = <IconSquareRounded size={16} stroke={1.5} />
const names = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => <NavItem key={i} href="#" label={`Item ${names[i] ?? i + 1}`} icon={icon} active={i === 1} />)

const actions = (
  <Toolbar aria-label="Item list actions" surface={false}>
    <ToolbarButton tooltip="Sort by" aria-label="Sort by">
      <IconSortDescending size={16} stroke={1.5} />
    </ToolbarButton>
    <ToolbarButton tooltip="New item" aria-label="New item">
      {icon}
    </ToolbarButton>
  </Toolbar>
)

/** A list of one kind of row, 2px apart, with the column's actions in its header. */
export const Default: Story = {
  args: { title: 'Items', actions },
  render: (args) => <ListColumn {...args}>{rows(6)}</ListColumn>,
}

/**
 * Groups. Each is headed by a package part, never by a row drawn by hand: a
 * group that folds is a `CollapsibleSection`; a group that does not fold is a
 * `SectionHeader` over its rows.
 */
export const Sections: Story = {
  args: { title: 'Items' },
  render: (args) => (
    <ListColumn {...args}>
      <CollapsibleSection title="Group one" contentClassName="mt-1 gap-0.5">
        {rows(3)}
      </CollapsibleSection>
      <Divider className="my-2" />
      <SectionHeader
        title="Group two"
        hover="none"
        actions={[{ icon: <IconSortDescending size={16} stroke={1.5} />, tooltip: 'Sort by', onClick: () => {} }]}
      />
      {rows(4)}
    </ListColumn>
  ),
}

/** A row under the header that stays put while the list scrolls: a field that adds to the list. */
export const WithARowAbove: Story = {
  parameters: { controls: { disable: true } },
  render: function RowAbove() {
    const [name, setName] = useState('')
    return (
      <ListColumn
        title="Items"
        above={
          <Form onSubmit={() => setName('')} className="flex items-center gap-2 px-3 pt-3 pb-1">
            <TextInput className="min-w-0 flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="New item name" aria-label="New item name" />
            <Button className="shrink-0" type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </Form>
        }
      >
        {rows(5)}
      </ListColumn>
    )
  },
}

/** More rows than fit: the list scrolls under a header that stays. */
export const ManyRows: Story = {
  args: { title: 'Items', actions },
  render: (args) => <ListColumn {...args}>{rows(80)}</ListColumn>,
}

/** While the list is on its way: a skeleton shaped like the rows. */
export const Loading: Story = {
  args: { title: 'Items' },
  render: (args) => (
    <ListColumn {...args}>
      <SkeletonList rows={8} />
    </ListColumn>
  ),
}

function Broken(): never {
  throw new Error('A row could not draw itself')
}

/**
 * When a row breaks: the column keeps its title and says so in the middle of
 * the room the list had, with Try again. The rest of the page keeps working.
 */
export const WhenARowBreaks: Story = {
  args: { title: 'Items', actions },
  render: (args) => (
    <ListColumn {...args}>
      {rows(2)}
      <Broken />
    </ListColumn>
  ),
}

/** Closed with the rail: it narrows to nothing and fades. Press the button to watch it. */
export const Collapsing: Story = {
  parameters: { controls: { disable: true } },
  render: function Collapsing() {
    const [collapsed, setCollapsed] = useState(false)
    return (
      <>
        <ListColumn title="Items" collapsed={collapsed}>
          {rows(6)}
        </ListColumn>
        <div className="p-4">
          <Button variant="outlined" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? 'Open the column' : 'Close the column'}
          </Button>
        </div>
      </>
    )
  },
}
