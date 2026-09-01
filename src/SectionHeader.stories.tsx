import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconPlus, IconSortDescending } from '@tabler/icons-react'
import { SectionHeader } from './SectionHeader'

/** The 32px row a section starts with. Hover it: the row fills, and its actions appear. */
const meta = {
  title: 'Navigation/SectionHeader',
  component: SectionHeader,
  decorators: [(Story) => <div className="w-[280px]"><Story /></div>],
  args: { title: 'Starred' },
} satisfies Meta<typeof SectionHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = {}

/** The chevron makes the whole row the toggle; click it. */
export const Collapsible: Story = {
  args: { title: 'Your documents', chevron: true },
  render: (args) => {
    const [expanded, setExpanded] = useState(true)
    return (
      <div className="flex flex-col gap-1">
        <SectionHeader {...args} isExpanded={expanded} onToggle={() => setExpanded((v) => !v)} />
        {expanded &&
          ['Quarterly plan', 'Reading list'].map((row) => (
            <div key={row} className="rounded-lg px-2 py-1.5 text-[14px] leading-[140%] text-text-primary hover:bg-bg-hover">
              {row}
            </div>
          ))}
      </div>
    )
  },
}

/** Peek's add/sort pair, in its original order — revealed on hover, and a click on one never toggles the section. */
export const WithActions: Story = {
  args: {
    title: 'Sections',
    chevron: true,
    actions: [
      { icon: <IconSortDescending size={16} stroke={1.5} />, tooltip: 'Sort by', onClick: () => {} },
      { icon: <IconPlus size={16} stroke={1.5} />, tooltip: 'Add', onClick: () => {} },
    ],
  },
}

/** Actions without the collapse — a fixed section that still offers Add on hover. */
export const ActionsOnly: Story = {
  args: {
    title: 'Pinned',
    actions: [{ icon: <IconPlus size={16} stroke={1.5} />, tooltip: 'Add', onClick: () => {} }],
  },
}
