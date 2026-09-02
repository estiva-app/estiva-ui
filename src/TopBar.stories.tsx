import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconMenu2 } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { IconButton } from './IconButton'
import { PersonTrigger } from './PersonTrigger'
import { SearchInput } from './SearchInput'
import { TopBar } from './TopBar'

/**
 * The bar needs its full width, and it needs content to stand against:
 * the solid manner sits above its content, the floating manner floats
 * over it — no border, no background, clicks passing through.
 */
const meta = {
  title: 'Frame/TopBar',
  component: TopBar,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'floating'] },
    menu: { control: false },
    logo: { control: false },
    search: { control: false },
    right: { control: false },
  },
} satisfies Meta<typeof TopBar>

export default meta
type Story = StoryObj<typeof meta>

const face = <PersonTrigger name="Ana Duarte" />
const menuButton = (
  <IconButton tooltip="Toggle menu" tooltipPlacement="bottom" aria-label="Toggle menu">
    <IconMenu2 size={16} stroke={1.5} />
  </IconButton>
)

/** Solid sits above its content: bar first, page below. */
const Below = ({ children }: { children: ReactNode }) => (
  <div className="flex h-40 flex-col overflow-hidden bg-bg-base">
    {children}
    <div className="flex flex-1 items-center justify-center text-body-2 text-text-muted">content below the bar</div>
  </div>
)

/** Floating stands over its content: the page runs to the top edge underneath. */
const Behind = ({ children }: { children: ReactNode }) => (
  <div className="relative h-40 overflow-hidden bg-bg-base">
    {children}
    <div className="flex h-full items-center justify-center pt-6 text-body-2 text-text-muted">content under the bar</div>
  </div>
)

/** The in-flow manner: hairline, surface, the name on the left. */
export const Solid: Story = {
  render: (args) => (
    <Below>
      <TopBar {...args} logo="Estiva" search={<SearchInput shortcut="⌘ K" className="w-[290px]" />} right={face} />
    </Below>
  ),
}

/** No search yet: the centre slot holds its place, so it drops in later without moving anything. */
export const SolidNoSearch: Story = {
  render: (args) => (
    <Below>
      <TopBar {...args} logo="Estiva" right={face} />
    </Below>
  ),
}

/** The overlay manner: no border, no background, and only the clusters catch the pointer. */
export const Floating: Story = {
  render: (args) => (
    <Behind>
      <TopBar {...args} variant="floating" menu={menuButton} search={<SearchInput shortcut="⌘ K" className="w-[290px]" />} right={face} />
    </Behind>
  ),
}

/** Floating without a search — menu button and identity alone. */
export const FloatingNoSearch: Story = {
  render: (args) => (
    <Behind>
      <TopBar {...args} variant="floating" menu={menuButton} right={face} />
    </Behind>
  ),
}

/** The menu button and the logo side by side — an app whose rail collapses keeps its name next to the way to collapse it. */
export const MenuAndLogo: Story = {
  render: (args) => (
    <Behind>
      <TopBar {...args} variant="floating" menu={menuButton} logo="Estiva" right={face} />
    </Behind>
  ),
}
