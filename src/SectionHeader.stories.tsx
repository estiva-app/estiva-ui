import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconPlus, IconSortDescending } from '@tabler/icons-react'
import { Chip } from './Chip'
import { SectionHeader } from './SectionHeader'

/** The 32px row a section starts with. Hover it: the row fills, and its actions appear. A section that folds is CollapsibleSection, whose header this is. */
const meta = {
  title: 'Navigation/SectionHeader',
  component: SectionHeader,
  decorators: [(Story) => <div className="w-[280px]"><Story /></div>],
  args: { title: 'Section', showActions: 'hover' },
  argTypes: { showActions: { control: 'inline-radio', options: ['hover', 'always'] }, chevron: { control: false }, isExpanded: { control: false }, trailing: { control: false } },
} satisfies Meta<typeof SectionHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = {}

/** `chevron`: the header of a section that folds. The title becomes the toggle, and the chevron turns with it. CollapsibleSection draws this for you. */
export const Folding: Story = {
  args: { chevron: true, isExpanded: true, onToggle: () => {} },
}

/** Actions beside the title, in the order given — revealed on hover or focus. */
export const WithActions: Story = {
  args: {
    actions: [
      { icon: <IconSortDescending size={16} stroke={1.5} />, tooltip: 'Sort by', onClick: () => {} },
      { icon: <IconPlus size={16} stroke={1.5} />, tooltip: 'Add', onClick: () => {} },
    ],
  },
}

/** The actions held on screen — `showActions="always"` — for a section whose affordance should not hide. */
export const PersistentActions: Story = {
  args: {
    showActions: 'always',
    actions: [{ icon: <IconPlus size={16} stroke={1.5} />, tooltip: 'Add', onClick: () => {} }],
  },
}

/** `hover="none"`: actions always shown, and the row stays still under the pointer — only the buttons light up. */
export const StillOnHover: Story = {
  args: {
    showActions: 'always',
    hover: 'none',
    actions: [{ icon: <IconPlus size={16} stroke={1.5} />, tooltip: 'Add', onClick: () => {} }],
  },
}

/** A count beside the title, held on screen while the actions come and go. */
export const WithTrailing: Story = {
  args: {
    trailing: <Chip type="brand" label="2" />,
    actions: [{ icon: <IconPlus size={16} stroke={1.5} />, tooltip: 'Add', onClick: () => {} }],
  },
}
