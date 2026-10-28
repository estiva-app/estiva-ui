import type { Meta, StoryObj } from '@storybook/react-vite'
import { Lens } from './Lens'

/**
 * PROTOTYPE (concept/cross-app-navigation): Lens. A file lives in one team,
 * which decides who reads it; a topic, led by a team, lists files from any
 * team. Switch apps from the top bar (the same topic stays open), and switch
 * who you are from the person menu, top right.
 */
const meta = {
  title: 'Prototype/Cross-app navigation/Lens',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Peek: the topic's conversation, with All, Main and Files ▾, and its listed files beside it. */
export const Peek: Story = {
  globals: { theme: 'signal' },
  render: () => <Lens />,
}

/** Ship: the same sidebar; each topic and team lists its projects. */
export const Ship: Story = {
  globals: { theme: 'ship' },
  render: () => <Lens />,
}

/** Leaf: the same sidebar; each topic and team lists its documents. */
export const Leaf: Story = {
  globals: { theme: 'leaf' },
  render: () => <Lens start={{ type: 'topic', id: 'navigation' }} />,
}

/** Katerina, outside Engineering: she sees its front door and Bugs, not its chat or files. */
export const OutsideAPrivateTeam: Story = {
  name: 'Peek, as Katerina',
  globals: { theme: 'signal' },
  render: () => <Lens viewer="katerina" />,
}

/** A space two teams share: Engineering × Design, under both, read by both. */
export const SharedSpace: Story = {
  name: 'A space two teams share',
  globals: { theme: 'signal' },
  render: () => <Lens start={{ type: 'topic', id: 'eng-design' }} />,
}
