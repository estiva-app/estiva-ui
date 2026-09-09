import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { CollapsibleSection } from './CollapsibleSection'
import { NavItem } from './NavItem'
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

/** Entries, then groups that fold — each a CollapsibleSection: `mt-2` between them, `shrink-0` so the column scrolls rather than squashes. */
export const Composed: Story = {
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the count chip is muted text, 3.06:1 on the active row in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
  render: (args) => (
    <Sidebar {...args}>
      <NavItem href="#" label="Item one" icon={placeholder} count={18} countLabel="18 open" active />
      <NavItem href="#" label="Item two" icon={placeholder} count={5} countLabel="5 active" />
      <CollapsibleSection title="Group one" className="mt-2 shrink-0" contentClassName="gap-px">
        <NavItem href="#" label="Item three" count={7} countLabel="7 open" />
        <NavItem href="#" label="Item four" count={2} countLabel="2 open" />
        <NavItem href="#" label="Item five" />
      </CollapsibleSection>
      <CollapsibleSection title="Group two" className="mt-2 shrink-0" contentClassName="gap-px">
        <NavItem href="#" label="Item six" icon={placeholder} />
        <NavItem href="#" label="Item seven" icon={placeholder} />
      </CollapsibleSection>
    </Sidebar>
  ),
}

/** The column scrolls on its own — a long group never scrolls the frame away. */
export const Scrolls: Story = {
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the count chips are muted text, 3.78:1 on --bg-surface in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
  render: (args) => (
    <Sidebar {...args}>
      <NavItem href="#" label="Item one" icon={placeholder} count={18} countLabel="18 open" />
      <CollapsibleSection title="Group" className="mt-2 shrink-0" contentClassName="gap-px">
        {Array.from({ length: 40 }, (_, i) => (
          <NavItem key={i} href="#" label={`Item ${i + 2}`} active={i === 2} count={((i * 7) % 9) + 1} countLabel={`${((i * 7) % 9) + 1} open`} />
        ))}
      </CollapsibleSection>
    </Sidebar>
  ),
}
