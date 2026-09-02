import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconBox, IconListDetails } from '@tabler/icons-react'
import { NavItem } from './NavItem'
import { SectionLabel } from './SectionLabel'
import { Sidebar } from './Sidebar'

const meta = {
  title: 'Frame/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  args: { children: null },
  argTypes: { children: { control: false } },
  decorators: [(Story) => <div className="flex h-96 bg-bg-base">{Story()}</div>],
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

/** Entries, then a labelled group — the heading is a SectionLabel in a 32px row. */
export const Composed: Story = {
  render: (args) => (
    <Sidebar {...args}>
      <NavItem href="#" label="Documents" icon={<IconListDetails size={16} stroke={1.5} />} count={18} countLabel="18 open" active />
      <NavItem href="#" label="Collections" icon={<IconBox size={16} stroke={1.5} />} count={5} countLabel="5 active" />
      <div className="mt-2 flex h-8 items-center px-2">
        <SectionLabel>Collections</SectionLabel>
      </div>
      <NavItem href="#" label="Quarterly plan" count={7} countLabel="7 open" />
      <NavItem href="#" label="Design system" count={2} countLabel="2 open" />
      <NavItem href="#" label="Archive sweep" />
    </Sidebar>
  ),
}

const MANY_COLLECTIONS = [
  'Annual report',
  'Brand refresh',
  'Customer voices',
  'Design system',
  'Field notes',
  'Hiring plan',
  'Launch checklist',
  'Market study',
  'Onboarding flow',
  'Partnerships',
  'Pricing review',
  'Quarterly plan',
  'Research backlog',
  'Roadmap drafts',
  'Support playbook',
  'Website rewrite',
]

/** The column scrolls on its own — a long list never scrolls the frame away. */
export const Scrolls: Story = {
  render: (args) => (
    <Sidebar {...args}>
      <NavItem href="#" label="Documents" icon={<IconListDetails size={16} stroke={1.5} />} count={18} countLabel="18 open" />
      <div className="mt-2 flex h-8 items-center px-2">
        <SectionLabel>Collections</SectionLabel>
      </div>
      {MANY_COLLECTIONS.map((name, i) => (
        <NavItem key={name} href="#" label={name} active={i === 3} count={((i * 7) % 9) + 1} countLabel={`${((i * 7) % 9) + 1} open`} />
      ))}
    </Sidebar>
  ),
}
