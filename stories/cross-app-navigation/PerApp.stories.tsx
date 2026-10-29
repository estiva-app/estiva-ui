import type { Meta, StoryObj } from '@storybook/react-vite'
import { PerApp } from './PerApp'

/**
 * PROTOTYPE (concept/cross-app-navigation): Miky's sketch of 28 October. The
 * same model as Lens; each app draws its own navigation, and the Desk is the
 * same in all three. Switch apps from the top bar, and who you are from the
 * person menu, top right.
 */
const meta = {
  title: 'Prototype/Cross-app navigation/Per app (sketch)',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Peek: a rail of Desk, Topics, Teams and People, and the list column beside it. */
export const Peek: Story = {
  globals: { theme: 'signal' },
  render: () => <PerApp />,
}

/** Activity behind a dot by the title, the column only the files: to compare with Peek's (Miky, 29 Oct). */
export const PeekActivityDot: Story = {
  name: 'Peek, Activity dot',
  globals: { theme: 'signal' },
  render: () => <PerApp activity="dot" start={{ type: 'topic', id: 'widgets' }} />,
}

/** Peek's Desk as today's Peek draws it: the Desk's rows in the list column, the conversation open beside it. */
export const PeekDesk: Story = {
  name: 'Peek, Desk',
  globals: { theme: 'signal' },
  render: () => <PerApp start={{ type: 'home' }} />,
}

/** Peek's Teams: each team's chat (#), its topics (Bugs, a front door), and a space it shares with another team. */
export const PeekTeams: Story = {
  name: 'Peek, Teams',
  globals: { theme: 'signal' },
  render: () => <PerApp start={{ type: 'topic', id: 'general' }} />,
}

/** Ship: Home, then Topics, Projects and Issues, then Teams, each with its Topics, Projects, Issues and Views. */
export const Ship: Story = {
  globals: { theme: 'ship' },
  render: () => <PerApp start={{ type: 'page', id: 'topics' }} />,
}

/** Leaf: Home, Open work and Starred, then a Teams | Topics toggle heading the tree it switches. */
export const Leaf: Story = {
  globals: { theme: 'leaf' },
  render: () => <PerApp start={{ type: 'file', id: 'd-navigation' }} />,
}

/** The Desk, the same in every app: what waits on you, what you run, what just happened. */
export const Desk: Story = {
  globals: { theme: 'ship' },
  render: () => <PerApp start={{ type: 'home' }} />,
}

/** Katerina, outside Engineering and Marketing: she sees their front doors, not their chats. */
export const OutsideAPrivateTeam: Story = {
  name: 'Peek, as Katerina',
  globals: { theme: 'signal' },
  render: () => <PerApp viewer="katerina" start={{ type: 'topic', id: 'mkt-door' }} />,
}
