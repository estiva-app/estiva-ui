import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconPlus } from '@tabler/icons-react'
import { Chip } from './Chip'
import { CollapsibleSection } from './CollapsibleSection'
import { NavItem } from './NavItem'

/** A section that opens and closes: the header's title is the toggle, and the rows slide. */
const meta = {
  title: 'Navigation/CollapsibleSection',
  component: CollapsibleSection,
  decorators: [(Story) => <div className="w-[280px]"><Story /></div>],
  args: { title: 'Section', contentClassName: 'gap-px', children: null },
  argTypes: { children: { control: false }, actions: { control: false } },
  render: (args) => (
    <CollapsibleSection {...args}>
      <NavItem href="#" label="Item one" count={7} countLabel="7 open" />
      <NavItem href="#" label="Item two" count={2} countLabel="2 open" />
      <NavItem href="#" label="Item three" />
    </CollapsibleSection>
  ),
} satisfies Meta<typeof CollapsibleSection>

export default meta
type Story = StoryObj<typeof meta>

/** Open, as a section is unless told otherwise. Click the title, or focus it and press Enter or Space. */
export const Default: Story = {}

/** Starts closed. Ctrl+F for "Item two" opens it: the rows are hidden until found, not gone. */
export const Closed: Story = { args: { defaultOpen: false } }

/** Actions beside the title, revealed on hover or focus; a click on one never toggles the section. */
export const WithActions: Story = {
  args: { actions: [{ icon: <IconPlus size={16} stroke={1.5} />, tooltip: 'Add', onClick: () => {} }] },
}

/** A count beside the title, held on screen whether the section is open or closed. */
export const WithTrailing: Story = {
  args: { trailing: <Chip type="brand" label="2" /> },
}

/** Close it and reload the page: still closed. This browser remembers, under the key. */
export const Remembered: Story = { args: { storageKey: 'estiva-ui.stories.collapsible-section' } }

