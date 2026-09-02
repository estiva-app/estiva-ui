import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconMenu2, IconAperture } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { PersonTrigger } from './PersonTrigger'
import { SearchInput } from './SearchInput'
import { TopBar } from './TopBar'

/**
 * The bar needs its full width; frame stories render edge to edge. The
 * floating variant stands over a block of content, so the overlay manner —
 * no border, no background, clicks passing through — is visible.
 */
const meta = {
  title: 'Frame/TopBar',
  component: TopBar,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'floating'] },
    menu: { control: false },
    brand: { control: false },
    search: { control: false },
    right: { control: false },
  },
} satisfies Meta<typeof TopBar>

export default meta
type Story = StoryObj<typeof meta>

const face = <PersonTrigger compact name="Ana Duarte" aria-label="Account" size={36} />
const burger = (
  <IconButton tooltip="Toggle menu" tooltipPlacement="bottom" aria-label="Toggle menu">
    <IconMenu2 size={16} stroke={1.5} />
  </IconButton>
)

/** The in-flow manner: hairline, surface, brand on the left. */
export const Solid: Story = {
  render: (args) => <TopBar {...args} brand="Estiva" search={<SearchInput shortcut="⌘ K" className="w-[290px]" />} right={face} />,
}

/** No search yet: the centre slot holds its place, so it drops in later without moving anything. */
export const SolidNoSearch: Story = {
  render: (args) => <TopBar {...args} brand="Estiva" right={face} />,
}

/** The overlay manner over content: no border, no background, and only the clusters catch the pointer. */
export const Floating: Story = {
  render: (args) => (
    <div className="relative h-40 overflow-hidden bg-bg-base">
      <TopBar {...args} variant="floating" menu={burger} search={<SearchInput shortcut="⌘ K" className="w-[290px]" />} right={face} />
      <div className="flex h-full items-end justify-center pb-6 text-body-2 text-text-muted">content under the bar</div>
    </div>
  ),
}

/** The burger and the brand side by side — an app whose rail collapses keeps its mark next to the way to collapse it. */
export const BurgerAndBrand: Story = {
  render: (args) => (
    <div className="relative h-40 overflow-hidden bg-bg-base">
      <TopBar
        {...args}
        variant="floating"
        menu={burger}
        brand={<IconAperture size={20} stroke={1.5} className="text-text-primary" />}
        right={face}
      />
    </div>
  ),
}
