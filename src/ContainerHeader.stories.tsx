import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { IconEdit, IconSortDescending, IconX } from '@tabler/icons-react'
import { ContainerHeader } from './ContainerHeader'
import { IconButton } from './IconButton'

// The top of a column: a surface with a hairline, so the bar's own hairline and height can be seen.
const inColumn: Decorator = (Story) => <div className="w-96 overflow-hidden rounded-lg border border-border-default bg-bg-surface">{Story()}</div>

const meta = {
  title: 'Navigation/ContainerHeader',
  component: ContainerHeader,
  args: { title: 'Items' },
  argTypes: { actions: { control: false } },
  decorators: [inColumn],
} satisfies Meta<typeof ContainerHeader>

export default meta
type Story = StoryObj<typeof meta>

/** A string title, one line, alone. */
export const Default: Story = {}

/** A chevron after the title, for a title that opens something. */
export const WithChevron: Story = { args: { title: 'All items', chevron: true } }

/** The column's own buttons at the right edge: IconButtons with tooltips. */
export const WithActions: Story = {
  args: {
    title: 'All items',
    chevron: true,
    actions: (
      <>
        <IconButton tooltip="Sort by" aria-label="Sort by">
          <IconSortDescending size={16} stroke={1.5} />
        </IconButton>
        <IconButton tooltip="New item" aria-label="New item">
          <IconEdit size={16} stroke={1.5} />
        </IconButton>
      </>
    ),
  },
}

/** A title that is not a string — a name over its caption — takes the room left and is drawn as given. */
export const WithRichTitle: Story = {
  args: {
    title: (
      <div className="min-w-0">
        <p className="truncate text-body-2-strong text-text-primary">Quarterly plan</p>
        <p className="truncate text-caption text-text-muted">In Project Alpha</p>
      </div>
    ),
    actions: (
      <IconButton tooltip="Close" aria-label="Close">
        <IconX size={16} stroke={1.5} />
      </IconButton>
    ),
  },
}
