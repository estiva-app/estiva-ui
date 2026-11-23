import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { ItemList, type ItemListRow } from './ItemList'
import { ListSection } from './ListSection'

const icon = <IconSquareRounded size={16} stroke={1.5} aria-hidden />
const people = [{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }, { name: 'Marta Silva' }]

/** Rows of one kind that has every fact. */
const full: ItemListRow[] = [
  { id: '1', label: 'Item one', icon, href: '#one', description: 'What item one is about, in a line that is cut short when there is no more room.', status: { label: 'In Progress', colour: 'blue' }, people: { person: people[0]! }, progress: { done: 2, total: 9 }, when: 'Ana, 1h ago' },
  { id: '2', label: 'Item two', icon, href: '#two', status: { label: 'Planned', colour: 'neutral' }, people: { person: people[1]! }, progress: { done: 0, total: 3 }, when: 'Ravi, 2d ago' },
  { id: '3', label: 'Item three', icon, href: '#three', status: { label: 'Completed', colour: 'green' }, people: { person: people[2]! }, progress: { done: 5, total: 5 }, when: 'Marta, Oct 19' },
]

/** Rows of a kind with people in it and when it was last active, and no status or progress. */
const places: ItemListRow[] = [
  { id: '4', label: 'Item four', icon, href: '#four', description: 'What item four is about.', status: null, people: { members: { faces: people, count: 6 } }, progress: null, when: '2h ago' },
  { id: '5', label: 'Item five', icon, href: '#five', status: null, people: { members: { faces: [], count: 0 } }, progress: null, when: 'Yesterday' },
]

/** Rows of a kind with a status and a person, and no progress. */
const plain: ItemListRow[] = [
  { id: '6', label: 'Item six', icon, href: '#six', description: 'In item one', status: { label: 'In Progress', colour: 'blue' }, people: { person: people[1]! }, progress: null, when: 'Ravi, 3h ago' },
  { id: '7', label: 'Item seven', icon, href: '#seven', status: { label: 'Cancelled', colour: 'muted' }, people: null, progress: null, when: 'Ana, Oct 2' },
]

/** Items in four columns, Status, People, Progress and When, the same for every kind. */
const meta = {
  title: 'Page structure/ItemList',
  component: ItemList,
  parameters: { layout: 'fullscreen' },
  args: { 'aria-label': 'Group one', rows: full },
  argTypes: { rows: { control: false } },
  decorators: [
    (Story) => (
      <div className="bg-bg-surface px-6 py-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ItemList>

export default meta
type Story = StoryObj<typeof meta>

/** One list: each row its status in words, one face, its progress as the small ring, and who changed it last and when. */
export const Default: Story = {}

/** Several lists on one page, each under its heading: each fact stays in one column down the page, whatever the kind. */
export const SeveralOnAPage: Story = {
  name: 'Several on a page',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      <ListSection title="Group one" count={places.length}>
        <ItemList aria-label="Group one" rows={places} />
      </ListSection>
      <ListSection title="Group two" count={full.length}>
        <ItemList aria-label="Group two" rows={full} />
      </ListSection>
      <ListSection title="Group three" count={plain.length}>
        <ItemList aria-label="Group three" rows={plain} />
      </ListSection>
    </div>
  ),
}

/** Facts not read yet: the dash in each, until they land. A fact the kind has not stays empty. */
export const NotReadYet: Story = {
  name: 'Not read yet',
  args: {
    rows: [
      { id: '1', label: 'Item one', icon, href: '#one' },
      { id: '2', label: 'Item two', icon, href: '#two', status: null, progress: null },
    ],
  },
}

/** Rows under a row, in the same columns: shut until the row's arrow opens them. Another app's row opens in a new tab. */
export const RowsUnderARow: Story = {
  name: 'Rows under a row',
  args: {
    rows: [
      {
        id: '1',
        label: 'Item one',
        icon,
        href: 'https://example.com/one',
        external: true,
        description: 'Another app',
        status: null,
        people: { person: people[0]! },
        progress: null,
        when: 'Ana, 1h ago',
        rows: [
          { id: '2', label: 'Item two', icon, href: 'https://example.com/two', external: true, status: null, people: { person: people[1]! }, progress: null, when: 'Ravi, 1d ago' },
          { id: '3', label: 'Item three', icon, href: 'https://example.com/three', external: true, status: null, people: { person: people[2]! }, progress: null, when: 'Marta, 3d ago' },
        ],
      },
    ],
  },
}
