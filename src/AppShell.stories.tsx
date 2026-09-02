import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconBox, IconListDetails, IconHome, IconInbox, IconMenu2, IconUsers } from '@tabler/icons-react'
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
  parameters: { layout: 'fullscreen' },
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
  decorators: [(Story) => <div className="h-[480px] overflow-hidden">{Story()}</div>],
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

const identity = <PersonTrigger compact name="Ana Duarte" aria-label="Account" size={36} />
const menuButton = (
  <IconButton tooltip="Toggle menu" tooltipPlacement="bottom" aria-label="Toggle menu">
    <IconMenu2 size={16} stroke={1.5} />
  </IconButton>
)

const sidebar = (
  <Sidebar>
    <NavItem href="#" label="Documents" icon={<IconListDetails size={16} stroke={1.5} />} count={18} countLabel="18 open" active />
    <NavItem href="#" label="Collections" icon={<IconBox size={16} stroke={1.5} />} count={5} countLabel="5 active" />
  </Sidebar>
)

const rail = (
  <Rail>
    <RailItem href="#" label="Home" icon={<IconHome size={16} stroke={1.5} />} active />
    <RailItem href="#" label="Inbox" icon={<IconInbox size={16} stroke={1.5} />} />
    <RailItem href="#" label="People" icon={<IconUsers size={16} stroke={1.5} />} />
  </Rail>
)

/** The structured frame: solid bar, sidebar, content beside it. */
export const Solid: Story = {
  render: (args) => (
    <AppShell {...args} logo="Estiva" search={<SearchInput shortcut="⌘ K" className="w-[290px]" />} identity={identity} nav={sidebar}>
      <div className="flex h-full items-center justify-center">
        <EmptyState message="No documents yet. Create the first one." />
      </div>
    </AppShell>
  ),
}

/** The banner belongs to the content area — at its top, never across the navigation. */
export const SolidWithBanner: Story = {
  render: (args) => (
    <AppShell {...args} logo="Estiva" identity={identity} nav={sidebar} banner={<Banner tone="ok">Public key copied.</Banner>}>
      <div className="flex h-full items-center justify-center">
        <EmptyState message="No documents yet. Create the first one." />
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
      search={<SearchInput shortcut="⌘ K" className="w-[290px]" />}
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
