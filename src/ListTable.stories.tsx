import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { AvatarGroup } from './AvatarGroup'
import { Button } from './Button'
import { ListTable, ListTableRow, type ListTableColumn } from './ListTable'
import { MetaText } from './MetaText'

const icon = <IconSquareRounded size={16} stroke={1.5} />
const columns: ListTableColumn[] = [
  { label: 'Group', width: 'large' },
  { label: 'Members', width: 'small', keep: 'low' },
  { label: 'Active', width: 'medium', keep: 'low' },
]
const people = [{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }, { name: 'Marta Silva' }, { name: 'Jo Kim' }]
const rows = [
  { id: '1', title: 'Item one', description: 'What item one is about, in a line that is cut short when there is no more room.', group: 'Group one', members: people, active: '2 hours ago', join: true },
  { id: '2', title: 'Item two', description: 'What item two is about.', group: 'Group two', members: people.slice(0, 2), active: 'Yesterday', join: false },
  { id: '3', title: 'Item three with a longer name than the others', group: 'Group one', members: people.slice(0, 1), active: '4 days ago', join: true },
]

function Rows() {
  return (
    <>
      {rows.map((row) => (
        <ListTableRow
          key={row.id}
          href="#"
          label={row.title}
          {...(row.description ? { description: row.description } : {})}
          icon={icon}
          cells={[
            row.group,
            <>
              <AvatarGroup members={row.members} size={20} />
              <MetaText>{row.members.length}</MetaText>
            </>,
            row.active,
          ]}
          end={
            row.join ? (
              <Button size="small" variant="outlined">
                Join
              </Button>
            ) : undefined
          }
        />
      ))}
    </>
  )
}

const meta = {
  title: 'Page structure/ListTable',
  component: ListTable,
  args: { 'aria-label': 'Items', columns, end: true, children: null },
  argTypes: { columns: { control: false }, children: { control: false } },
  render: (args) => (
    <div className="bg-bg-surface p-6">
      <ListTable {...args}>
        <Rows />
      </ListTable>
    </div>
  ),
} satisfies Meta<typeof ListTable>

export default meta
type Story = StoryObj<typeof meta>

/** Rows under column headings: each row leads to its item, its end is its own button. Point at a row: a fill, 8px corners, no edge. */
export const Default: Story = {}

/** On a wide page: the name stops at 384px, its facts beside it, the end at the right edge. */
export const OnAWidePage: Story = {
  render: (args) => (
    <div className="w-full bg-bg-surface p-6">
      <ListTable {...args}>
        <Rows />
      </ListTable>
    </div>
  ),
}

/** In a narrow box (576px): Members and Active (`keep: 'low'`) give way first, and the names keep their room. */
export const Narrow: Story = {
  render: (args) => (
    <div className="max-w-xl bg-bg-surface p-6">
      <ListTable {...args}>
        <Rows />
      </ListTable>
    </div>
  ),
}

/** Narrower still (448px): every column gives way; the name and the end stay. */
export const Narrowest: Story = {
  render: (args) => (
    <div className="max-w-md bg-bg-surface p-6">
      <ListTable {...args}>
        <Rows />
      </ListTable>
    </div>
  ),
}

/** No facts to show: no headings, only the rows, each its own control at the end. A heading over the part names the list. */
export const NoColumns: Story = {
  args: { columns: [] },
  render: (args) => (
    <div className="bg-bg-surface p-6">
      <ListTable {...args}>
        {rows.map((row) => (
          <ListTableRow key={row.id} href="#" label={row.title} icon={icon} cells={[]} end={row.join ? <Button size="small" variant="outlined">Join</Button> : undefined} />
        ))}
      </ListTable>
    </div>
  ),
}

/** Its facts with no headings over them, under a heading that names the list: a team's page. Screen readers still read them. */
export const NoHeadings: Story = {
  args: { headings: false },
}

/** A dash in a cell not read yet. */
export const NotReadYet: Story = {
  render: (args) => (
    <div className="bg-bg-surface p-6">
      <ListTable {...args}>
        <ListTableRow href="#" label="Item one" icon={icon} cells={[undefined, undefined, undefined]} />
      </ListTable>
    </div>
  ),
}

/** A row from another app or site: it opens in a new tab (`external`), as the kit's `Link` does. */
export const OpensInANewTab: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="w-full bg-bg-surface p-6">
      <ListTable {...args} end={false}>
        <ListTableRow href="https://example.com/item" external label="Item from another place" icon={icon} cells={['Group one', '', '2 hours ago']} />
        <ListTableRow href="#" label="Item here" icon={icon} cells={['Group one', '', 'Yesterday']} />
      </ListTable>
    </div>
  ),
}

/**
 * Rows under a row, in the same columns, shut until opened. Point at "Item one": its icon turns into the arrow, and only
 * the arrow folds; the row still opens its own thing. "Item two" starts open, its rows 24px in under the tree's line.
 */
export const RowsUnderARow: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="w-full bg-bg-surface p-6">
      <ListTable {...args} end={false}>
        <ListTableRow href="#" label="Item one" icon={icon} cells={['Group one', '', '2 hours ago']}>
          <ListTableRow href="#" label="Part one" icon={icon} cells={['Group one', '', '3 hours ago']} />
          <ListTableRow href="#" label="Part two" icon={icon} cells={['Group one', '', 'Yesterday']} />
        </ListTableRow>
        <ListTableRow href="#" label="Item two" icon={icon} cells={['Group two', '', 'Yesterday']} defaultOpen>
          <ListTableRow href="#" label="Part three" icon={icon} cells={['Group two', '', '4 days ago']} />
        </ListTableRow>
        <ListTableRow href="#" label="Item three" icon={icon} cells={['Group one', '', 'Last week']} />
      </ListTable>
    </div>
  ),
}

/**
 * Several kinds in one set of columns: an empty string is a fact this row's kind does not have, drawn as nothing; an
 * absent cell is a fact not read yet, drawn as a dash.
 */
export const FactsARowDoesNotHave: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="w-full bg-bg-surface p-6">
      <ListTable {...args} end={false}>
        <ListTableRow href="#" label="Item with every fact" icon={icon} cells={['Group one', '3', '2 hours ago']} />
        <ListTableRow href="#" label="Item of a kind with no members" icon={icon} cells={['Group one', '', '2 hours ago']} />
        <ListTableRow href="#" label="Item not read yet" icon={icon} cells={[undefined, undefined, undefined]} />
      </ListTable>
    </div>
  ),
}
