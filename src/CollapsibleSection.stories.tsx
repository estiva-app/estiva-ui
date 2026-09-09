import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconPlus, IconSquareRounded } from '@tabler/icons-react'
import { CollapsibleSection } from './CollapsibleSection'
import { NavItem } from './NavItem'
import { Sidebar } from './Sidebar'

const placeholder = <IconSquareRounded size={16} stroke={1.5} />

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

/** Close it and reload the page: still closed. This browser remembers, under the key. */
export const Remembered: Story = { args: { storageKey: 'estiva-ui.stories.collapsible-section' } }

/** Two sections in the frame's Sidebar under fixed entries: `mt-2` between groups, `shrink-0` so a long list scrolls rather than squashes. */
export const InASidebar: Story = {
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-screen bg-bg-base">{Story()}</div>],
  render: () => (
    <Sidebar>
      <NavItem href="#" label="Item one" icon={placeholder} count={18} countLabel="18 open" active />
      <NavItem href="#" label="Item two" icon={placeholder} count={5} countLabel="5 active" />
      <CollapsibleSection title="Group one" className="mt-2 shrink-0" contentClassName="gap-px">
        <NavItem href="#" label="Item three" count={7} countLabel="7 open" />
        <NavItem href="#" label="Item four" count={2} countLabel="2 open" />
        <NavItem href="#" label="Item five" />
      </CollapsibleSection>
      <CollapsibleSection title="Group two" className="mt-2 shrink-0" contentClassName="gap-px" defaultOpen={false}>
        <NavItem href="#" label="Item six" icon={placeholder} />
        <NavItem href="#" label="Item seven" icon={placeholder} />
      </CollapsibleSection>
    </Sidebar>
  ),
}
