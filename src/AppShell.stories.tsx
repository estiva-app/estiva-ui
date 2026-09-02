import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconBox, IconListDetails, IconNote, IconMessage2 } from '@tabler/icons-react'
import { AppShell } from './AppShell'
import { Banner } from './Banner'
import { EmptyState } from './EmptyState'
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
  args: { sidebar: null, children: null },
  argTypes: { menu: { control: false }, brand: { control: false }, search: { control: false }, identity: { control: false }, banner: { control: false }, sidebar: { control: false }, children: { control: false } },
  decorators: [(Story) => <div className="h-[480px] overflow-hidden">{Story()}</div>],
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

const identity = <PersonTrigger compact name="Ana Duarte" aria-label="Account" size={36} />

const sidebar = (
  <Sidebar>
    <NavItem href="#" label="Documents" icon={<IconListDetails size={16} stroke={1.5} />} count={18} countLabel="18 open" active />
    <NavItem href="#" label="Collections" icon={<IconBox size={16} stroke={1.5} />} count={5} countLabel="5 active" />
  </Sidebar>
)

/** The four regions: header, banner slot (empty here), sidebar, main. */
export const Complete: Story = {
  render: (args) => (
    <AppShell {...args} brand="Estiva" search={<SearchInput shortcut="⌘ K" className="w-[290px]" />} identity={identity} sidebar={sidebar}>
      <div className="flex h-full items-center justify-center">
        <EmptyState message="No documents yet. Create the first one." />
      </div>
    </AppShell>
  ),
}

/** The banner sits between the bar and the columns, full width. */
export const WithABanner: Story = {
  render: (args) => (
    <AppShell {...args} brand="Estiva" identity={identity} sidebar={sidebar} banner={<Banner tone="ok">Public key copied.</Banner>}>
      <div className="flex h-full items-center justify-center">
        <EmptyState message="No documents yet. Create the first one." />
      </div>
    </AppShell>
  ),
}

/** The sidebar slot takes a Rail just as well — an icon-rail app in the same frame. */
export const WithARail: Story = {
  render: (args) => (
    <AppShell {...args} brand="Estiva" identity={identity}
      sidebar={
        <Rail>
          <RailItem href="#" label="Desk" icon={<IconNote size={16} stroke={1.5} />} active />
          <RailItem href="#" label="Topics" icon={<IconMessage2 size={16} stroke={1.5} />} />
        </Rail>
      }
    >
      <div className="flex h-full items-center justify-center">
        <EmptyState message="Nothing here yet." />
      </div>
    </AppShell>
  ),
}
