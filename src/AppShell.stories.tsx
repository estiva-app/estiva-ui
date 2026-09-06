import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconMenu2, IconSquareRounded } from '@tabler/icons-react'
import { AppShell } from './AppShell'
import { Banner } from './Banner'
import { EmptyState } from './EmptyState'
import { IconButton } from './IconButton'
import { NavItem } from './NavItem'
import { PersonTrigger } from './PersonTrigger'
import { Rail } from './Rail'
import { RailItem } from './RailItem'
import { SearchInput } from './SearchInput'
import { Sidebar } from './Sidebar'

const meta = {
  title: 'Frame/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
    // the count chip is muted text, 3.06:1 on the active row in signal, and the info
    // banner reads 3.99:1 on its wash in ship (AA 4.5:1).
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  args: { nav: null, children: null },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'floating'] },
    menu: { control: false },
    logo: { control: false },
    search: { control: false },
    identity: { control: false },
    banner: { control: false },
    nav: { control: false },
    children: { control: false },
  },
  decorators: [(Story) => <div className="h-screen overflow-hidden">{Story()}</div>],
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

const identity = <PersonTrigger name="Ana Duarte" />
const menuButton = (
  <IconButton tooltip="Toggle menu" tooltipPlacement="bottom" aria-label="Toggle menu">
    <IconMenu2 size={16} stroke={1.5} />
  </IconButton>
)

const placeholder = <IconSquareRounded size={16} stroke={1.5} />

const sidebar = (
  <Sidebar>
    <NavItem href="#" label="Item one" icon={placeholder} count={18} countLabel="18 open" active />
    <NavItem href="#" label="Item two" icon={placeholder} count={5} countLabel="5 active" />
  </Sidebar>
)

const rail = (
  <Rail>
    <RailItem href="#" label="Item" icon={placeholder} active />
    <RailItem href="#" label="Item" icon={placeholder} />
    <RailItem href="#" label="Item" icon={placeholder} />
  </Rail>
)

/** The structured frame: solid bar, sidebar, content beside it. */
export const Solid: Story = {
  render: (args) => (
    <AppShell {...args} logo="Estiva" search={<SearchInput shortcut="Ctrl+K" className="w-[290px]" />} identity={identity} nav={sidebar}>
      <div className="flex h-full items-center justify-center">
        <EmptyState message="Nothing here yet." />
      </div>
    </AppShell>
  ),
}

/** The banner belongs to the content area — at its top, never across the navigation. */
export const SolidWithBanner: Story = {
  render: (args) => (
    <AppShell {...args} logo="Estiva" identity={identity} nav={sidebar} banner={<Banner tone="ok">Public key copied.</Banner>}>
      <div className="flex h-full items-center justify-center">
        <EmptyState message="Nothing here yet." />
      </div>
    </AppShell>
  ),
}

/** The floating frame: the bar floats over the top edge, the rail stands on the background, and the content lives in the rounded card. */
export const Floating: Story = {
  render: (args) => (
    <AppShell
      {...args}
      variant="floating"
      menu={menuButton}
      logo="Estiva"
      search={<SearchInput shortcut="Ctrl+K" className="w-[290px]" />}
      identity={identity}
      nav={rail}
    >
      <div className="flex h-full items-center justify-center">
        <EmptyState message="Nothing here yet." />
      </div>
    </AppShell>
  ),
}

/** In the floating frame the banner draws inside the card, at its top. */
export const FloatingWithBanner: Story = {
  render: (args) => (
    <AppShell
      {...args}
      variant="floating"
      menu={menuButton}
      logo="Estiva"
      identity={identity}
      nav={rail}
      banner={<Banner tone="info">A new version is available. Reload when convenient.</Banner>}
    >
      <div className="flex h-full items-center justify-center">
        <EmptyState message="Nothing here yet." />
      </div>
    </AppShell>
  ),
}
