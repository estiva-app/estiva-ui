import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { KindIcon } from './KindIcon'
import { PageHeader } from './PageHeader'
import { TeamChip } from './TeamChip'

/** The chip after a page's name saying which team its thing belongs to. */
const meta = {
  title: 'Links & references/TeamChip',
  component: TeamChip,
  args: { name: 'Team one', href: '#team-one', onClick: fn() },
  argTypes: { onClick: { control: false } },
} satisfies Meta<typeof TeamChip>

export default meta
type Story = StoryObj<typeof meta>

/** Opening the team's page, as Peek and Ship have it. */
export const Default: Story = {}

/** Naming the team and opening nothing, as Leaf has it: Leaf has no team page. */
export const WithNoClick: Story = { name: 'With no click', args: { href: undefined, onClick: undefined } }

/** Where it sits: right after the page's name in its bar, the one chip there. */
export const AfterAPageName: Story = {
  name: 'After a page name',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: (args) => (
    <div className="w-full bg-bg-surface">
      <PageHeader title="Item one" leading={<KindIcon kind="topic" />} after={<TeamChip {...args} />} />
    </div>
  ),
}
