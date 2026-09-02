import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { NavItem } from './NavItem'
import { SectionLabel } from './SectionLabel'
import { Sidebar } from './Sidebar'

const placeholder = <IconSquareRounded size={16} stroke={1.5} />

const meta = {
  title: 'Frame/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  args: { children: null },
  argTypes: { children: { control: false } },
  decorators: [(Story) => <div className="flex h-screen bg-bg-base">{Story()}</div>],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

/** Entries, then a labelled group — the heading is a SectionLabel in a 32px row. */
export const Composed: Story = {
  render: (args) => (
    <Sidebar {...args}>
      <NavItem href="#" label="Item one" icon={placeholder} count={18} countLabel="18 open" active />
      <NavItem href="#" label="Item two" icon={placeholder} count={5} countLabel="5 active" />
      <div className="mt-2 flex h-8 shrink-0 items-center px-2">
        <SectionLabel>Group</SectionLabel>
      </div>
      <NavItem href="#" label="Item three" count={7} countLabel="7 open" />
      <NavItem href="#" label="Item four" count={2} countLabel="2 open" />
      <NavItem href="#" label="Item five" />
    </Sidebar>
  ),
}

/** The column scrolls on its own — a long list never scrolls the frame away. */
export const Scrolls: Story = {
  render: (args) => (
    <Sidebar {...args}>
      <NavItem href="#" label="Item one" icon={placeholder} count={18} countLabel="18 open" />
      <div className="mt-2 flex h-8 shrink-0 items-center px-2">
        <SectionLabel>Group</SectionLabel>
      </div>
      {Array.from({ length: 16 }, (_, i) => (
        <NavItem key={i} href="#" label={`Item ${i + 2}`} active={i === 2} count={((i * 7) % 9) + 1} countLabel={`${((i * 7) % 9) + 1} open`} />
      ))}
    </Sidebar>
  ),
}
