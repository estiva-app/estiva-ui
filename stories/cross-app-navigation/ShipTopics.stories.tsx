import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShipTopics } from './ShipTopics'

/**
 * PROTOTYPE (concept/cross-app-navigation): Ship's Topics navigation, stage 1
 * (decided 2 Nov, redrawn after Miky's look the same day). Ship's sidebar
 * without Home, Views and Starred, Topics, a topic's page and Projects.
 * Everything is clickable; who you are is in the person menu, top right.
 */
const meta = {
  title: 'Prototype/Cross-app navigation/Ship topics (stage 1)',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'ship' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Each topic with its summary, its projects completed of all, its conversations and what is new for you; Your topics, then Other topics, Archived at the end. */
export const Topics: Story = {
  render: () => <ShipTopics start={{ type: 'topics' }} />,
}

/** Projects as a table: tabs by status, opening on Active, each with its lead and a bar of its issues done. */
export const Projects: Story = {
  render: () => <ShipTopics start={{ type: 'projects' }} />,
}

/** The same projects as cards, on All, where each says its status. */
export const ProjectsAsCards: Story = {
  name: 'Projects as cards',
  render: () => <ShipTopics start={{ type: 'projects' }} projectsTab="all" projectsAs="cards" />,
}

/** A topic's page: its work with status, its documents opening in Leaf, and one archived project and issue behind a link. */
export const ATopic: Story = {
  name: 'A topic',
  render: () => <ShipTopics start={{ type: 'topic', id: 'widgets' }} />,
}

/** A topic whose every project and issue is archived: it has moved under Archived. */
export const AllItsWorkArchived: Story = {
  name: 'All its work archived',
  render: () => <ShipTopics start={{ type: 'topics', archived: true }} />,
}

/** A Folder's Topics: only the topics filed in that Folder, its fold open in the sidebar. */
export const AFoldersTopics: Story = {
  name: 'A Folder’s topics',
  render: () => <ShipTopics start={{ type: 'topics', folder: 'hq' }} />,
}

/** An issue's "Topics: …" line now opens the topic's page in Ship, and its Folder's Issues entry is marked. */
export const FromAnIssue: Story = {
  name: 'From an issue',
  render: () => <ShipTopics start={{ type: 'work', id: 'i-widget-height' }} />,
}

/** As Katerina: the topics she is in come first, Miky's others under Other topics. */
export const AsKaterina: Story = {
  name: 'As Katerina',
  render: () => <ShipTopics viewer="katerina" start={{ type: 'topics' }} />,
}

/** No topic lists a project or issue yet. */
export const NoTopics: Story = {
  name: 'No topics',
  render: () => <ShipTopics start={{ type: 'topics' }} read="none" />,
}

/** The read of every topic and its conversations is on its way. */
export const Loading: Story = {
  render: () => <ShipTopics start={{ type: 'topics' }} read="loading" />,
}

/** The read of every topic failed; Try again loads it. */
export const ReadFailed: Story = {
  name: 'Read failed',
  render: () => <ShipTopics start={{ type: 'topics' }} read="failed" />,
}
