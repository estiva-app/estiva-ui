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

/** Peek's Teams: each team's spaces under its name, its chat, its front door, a space it shares. */
export const PeekTeams: Story = {
  name: 'Peek, Teams',
  globals: { theme: 'signal' },
  render: () => <PerApp start={{ type: 'topic', id: 'general' }} />,
}

/** Ship: Desk, then Topics, Projects and Issues, then Teams. */
export const Ship: Story = {
  globals: { theme: 'ship' },
  render: () => <PerApp start={{ type: 'page', id: 'topics' }} />,
}

/** Leaf: a Teams | Topics toggle at the top of the sidebar, then Home, Open work and Starred. */
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
