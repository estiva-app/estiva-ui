import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { EmptyState } from './EmptyState'
import { ItemList, type ItemListRow } from './ItemList'
import { ListSection } from './ListSection'
import { SkeletonList } from './Skeleton'

const icon = <IconSquareRounded size={16} stroke={1.5} aria-hidden />
const rows: ItemListRow[] = [
  { id: '1', label: 'Item one', icon, href: '#one', status: { label: 'In Progress', colour: 'blue' }, people: { person: { name: 'Ana Duarte' } }, progress: { done: 2, total: 9 }, when: 'Ana, 1h ago' },
  { id: '2', label: 'Item two', icon, href: '#two', status: { label: 'Planned', colour: 'neutral' }, people: { person: { name: 'Ravi Mehta' } }, progress: { done: 0, total: 3 }, when: 'Ravi, 2d ago' },
]

/** A list under its heading on a page, with its count. */
const meta = {
  title: 'Page structure/ListSection',
  component: ListSection,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Group one', count: rows.length, children: null },
  argTypes: { children: { control: false } },
  render: (args) => (
    <ListSection {...args}>
      <ItemList aria-label={args.title} rows={rows} />
    </ListSection>
  ),
  decorators: [
    (Story) => (
      <div className="bg-bg-surface px-6 py-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListSection>

export default meta
type Story = StoryObj<typeof meta>

/** The heading with its count, the list 4px under it. */
export const Default: Story = {}

/** While its list is read: no count, and the skeleton in the list's place. */
export const BeingRead: Story = {
  name: 'Being read',
  args: { count: undefined },
  render: (args) => (
    <ListSection {...args}>
      <SkeletonList rows={3} />
    </ListSection>
  ),
}

/** Nothing in it: the empty line in the list's place, for one part of the page. */
export const Empty: Story = {
  args: { count: 0 },
  render: (args) => (
    <ListSection {...args}>
      <EmptyState scope="rows" message="Nothing here yet." />
    </ListSection>
  ),
}
