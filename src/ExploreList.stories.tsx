import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { fn } from 'storybook/test'
import { ExploreList, exploreWords, type ExploreRow, type ExploreTab } from './ExploreList'

const icon = <IconSquareRounded size={16} stroke={1.5} aria-hidden />
const words = exploreWords({ one: 'item', many: 'items', a: 'an' })
const faces = [{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }, { name: 'Marta Silva' }]

const row = (id: string, label: string, more: Partial<ExploreRow> = {}): ExploreRow => ({
  id,
  label,
  href: `#${id}`,
  team: 'Team one',
  members: { faces, count: 5 },
  active: '2h ago',
  yours: false,
  archived: false,
  ...more,
})

const yours = [
  row('1', 'Item one', { yours: true, description: 'What item one is about, in a line that is cut short when there is no more room.' }),
  row('2', 'Item two', { yours: true, team: 'Team two', members: { faces: faces.slice(0, 1), count: 1 }, active: 'Yesterday' }),
]
const others = [
  row('3', 'Item three', { description: 'What item three is about.' }),
  row('4', 'Item four', { team: 'Team two', members: { faces: [], count: 0 }, active: '4 days ago' }),
  row('5', 'Item five with a longer name than the others', { members: undefined, active: undefined }),
]
const archived = [row('6', 'Item six', { archived: true, active: 'Oct 2' })]
const lists: Record<ExploreTab, ExploreRow[]> = { all: [...yours, ...others], yours, others, archived }

/** Every place you can open, to find one and join it: tabs with their counts, a search, and Join on a live one you are not in. */
const meta = {
  title: 'Page structure/ExploreList',
  component: ExploreList,
  parameters: { layout: 'fullscreen' },
  args: { lists, tab: 'all', words, icon, onTab: fn(), onRetry: fn(), onJoin: fn() },
  argTypes: { lists: { control: false }, words: { control: false }, icon: { control: false } },
  // The tabs change as they would on a page.
  render: function Render(args) {
    const [tab, setTab] = useState<ExploreTab>(args.tab)
    return <ExploreList {...args} tab={tab} onTab={(next) => (setTab(next), args.onTab(next))} />
  },
  decorators: [
    (Story) => (
      <div className="flex h-screen flex-col bg-bg-surface">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ExploreList>

export default meta
type Story = StoryObj<typeof meta>

/** All: yours and the others, each with its team, who is in it and when it was last active; Join on the ones you are not in. */
export const Default: Story = {}

/** Yours: no Join, you are in each. */
export const Yours: Story = { args: { tab: 'yours' } }

/** Archived: no Join, an archived one takes no one new. */
export const Archived: Story = { args: { tab: 'archived' } }

/** A search that finds nothing says so, with what was asked. */
export const NoMatch: Story = { name: 'No match', args: { query: 'zz' } }

/** Nothing listed at all: every open tab says so. */
export const NothingListed: Story = { name: 'Nothing listed', args: { lists: { all: [], yours: [], others: [], archived: [] } } }

/** A Join on its way: its button waits. */
export const Joining: Story = { args: { joining: new Set(['3']) } }

/** Before the lists are read. */
export const Loading: Story = { args: { lists: 'loading' } }

/** A page that did not load: said in words, with Try again. */
export const Failed: Story = { args: { lists: 'failed' } }

/** Nobody signed in. */
export const SignedOut: Story = { name: 'Signed out', args: { lists: 'signedOut' } }
