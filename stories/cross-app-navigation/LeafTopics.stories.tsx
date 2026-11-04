import type { Meta, StoryObj } from '@storybook/react-vite'
import { LeafTopics } from './LeafTopics'

/**
 * PROTOTYPE (concept/cross-app-navigation): Leaf's Topics navigation, stage 2
 * (decided 4 Nov). Leaf's sidebar, Home, Topics and the Folders tree, without
 * Starred, and a topic's own page in Leaf. Everything is clickable; who you are
 * is in the person menu, top right.
 */
const meta = {
  title: 'Prototype/Cross-app navigation/Leaf topics (stage 2)',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'signal' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Five topics, the ones whose files Miky changed last, between Home and the Folders. */
export const FiveTopics: Story = {
  name: 'Five topics',
  render: () => <LeafTopics topics={5} />,
}

/** Seven of Miky's topics: the sixth and seventh behind a quiet More, which opens them in place. */
export const MoreThanFive: Story = {
  name: 'More than five',
  render: () => <LeafTopics />,
}

/** In no topic that lists a file: the Topics section is not drawn, and Leaf reads as today. */
export const NoTopics: Story = {
  name: 'No topics',
  render: () => <LeafTopics topics={0} />,
}

/** Navigation folded open: its pages first, then its project and issues, each opening in Leaf and in the Folders tree. */
export const ATopicFoldedOpen: Story = {
  name: 'A topic folded open',
  render: () => <LeafTopics folded={['navigation']} start={{ type: 'file', id: 'd-navigation' }} />,
}

/** A topic's page: its summary, its pages, projects and issues opening in Leaf, two archived files behind a link, and Conversation in Peek. */
export const ATopicsPage: Story = {
  name: 'A topic’s page',
  render: () => <LeafTopics start={{ type: 'topic', id: 'widgets' }} />,
}

/** Katerina's own topics, in her order: Widgets, Navigation, Brand and Feedback triage. None of Miky's alone. */
export const AsKaterina: Story = {
  name: 'As Katerina',
  render: () => <LeafTopics viewer="katerina" />,
}

/** The topic read on its way: a short skeleton under Topics; the Folders draw as today. */
export const Loading: Story = {
  render: () => <LeafTopics read="loading" />,
}

/** The topic read failed: one line under Topics, in the words Leaf's Folders use. */
export const ReadFailed: Story = {
  name: 'Read failed',
  render: () => <LeafTopics read="failed" />,
}
