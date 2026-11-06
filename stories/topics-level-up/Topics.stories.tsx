import type { Meta, StoryObj } from '@storybook/react-vite'
import { LeafTopics } from './LeafTopics'
import { PeekTopics } from './PeekTopics'
import { ShipTopics } from './ShipTopics'

/** Every screen "Topics: level up the topic experience" changes, app by app. Read me first. */
const meta: Meta = {
  title: 'Prototype/Topics level-up/Screens',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

// Peek — pick the signal theme.
export const PeekATopicsFiles: Story = { name: 'Peek: a topic’s files', render: () => <PeekTopics /> }
export const PeekANewMessageMovesATopic: Story = { name: 'Peek: a new message moves a topic', render: () => <PeekTopics start={{ type: 'home' }} live /> }
export const PeekExploreTopics: Story = { name: 'Peek: Explore topics', render: () => <PeekTopics start={{ type: 'explore' }} /> }
export const PeekAnArchivedTopic: Story = { name: 'Peek: an archived topic', render: () => <PeekTopics start={{ type: 'topic', id: 'comments' }} /> }
export const PeekATopicYouReNotIn: Story = { name: 'Peek: a topic you’re not in', render: () => <PeekTopics start={{ type: 'topic', id: 'hiring' }} /> }
export const PeekATopicWithNoFiles: Story = { name: 'Peek: a topic with no files', render: () => <PeekTopics start={{ type: 'topic', id: 'brand' }} viewer="katerina" /> }
export const PeekLoading: Story = { name: 'Peek: loading', render: () => <PeekTopics read="loading" files="loading" /> }
export const PeekReadFailed: Story = { name: 'Peek: read failed', render: () => <PeekTopics read="failed" files="failed" /> }

// Ship — pick the ship theme.
export const ShipATopicsPage: Story = { name: 'Ship: a topic’s page', render: () => <ShipTopics /> }
export const ShipTopicsPage: Story = { name: 'Ship: Topics (Explore)', render: () => <ShipTopics start={{ type: 'explore' }} /> }
export const ShipNoAccess: Story = { name: 'Ship: a topic you can’t open', render: () => <ShipTopics viewer="katerina" start={{ type: 'topic', id: 'fast' }} /> }
export const ShipLoading: Story = { name: 'Ship: loading', render: () => <ShipTopics read="loading" topic="loading" /> }
export const ShipReadFailed: Story = { name: 'Ship: read failed', render: () => <ShipTopics read="failed" topic="failed" /> }

// Leaf — pick the leaf theme.
export const LeafFiveTopics: Story = { name: 'Leaf: five topics', render: () => <LeafTopics start={{ type: 'topic', id: 'widgets' }} /> }
export const LeafExploreTopics: Story = { name: 'Leaf: Explore topics', render: () => <LeafTopics start={{ type: 'explore' }} /> }
export const LeafNoTopics: Story = { name: 'Leaf: no topics yet', render: () => <LeafTopics none /> }
export const LeafLoading: Story = { name: 'Leaf: loading', render: () => <LeafTopics read="loading" /> }
export const LeafReadFailed: Story = { name: 'Leaf: read failed', render: () => <LeafTopics read="failed" /> }
