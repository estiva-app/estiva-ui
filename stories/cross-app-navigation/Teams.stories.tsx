import type { Meta, StoryObj } from '@storybook/react-vite'
import { Teams } from './Teams'

/**
 * PROTOTYPE (concept/cross-app-navigation): Teams and following, from Miky's
 * answers of 2 November. A team's chat, its spaces and the topics it leads;
 * its members, with agents apart; the one switch before a place's title, one
 * people icon drawn three ways (Not following, Important outline, All solid); Add; who follows a place; and the Move dialog's
 * "Keep it a space". Switch who you are from the person menu, top right; the
 * bar under a conversation says something as someone else, to see what lights.
 */
const meta = {
  title: 'Prototype/Cross-app navigation/Teams and following',
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'signal' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Miky, in every team: each team's section, its chat, spaces and the topics it leads. Marketing has nothing yet. */
export const TeamSections: Story = {
  name: 'A team’s section',
  render: () => <Teams />,
}

/** Katerina follows Engineering without being in it: it sits under Following, apart from My teams; its spaces at Important, its topics listed but not followed, no chat. */
export const FollowingATeam: Story = {
  name: 'Following a team, as Katerina',
  render: () => <Teams viewer="katerina" start={{ type: 'place', id: 'bug' }} />,
}

/** A team's page: its places, its members, its agents apart and marked; Join, Follow, Leave, Add. */
export const TeamPeople: Story = {
  name: 'A team’s people',
  render: () => <Teams start={{ type: 'team', id: 'eng' }} />,
}

/** Steer, as Katerina: neither in it nor following it, under Other teams, with Join and Follow. */
export const OtherTeam: Story = {
  name: 'A team you are not in',
  render: () => <Teams viewer="katerina" start={{ type: 'team', id: 'steer' }} />,
}

/** A topic Engineering leads that Katerina is not in: the switch says Not following; Miky can add her. */
export const NotFollowing: Story = {
  name: 'The switch: not following',
  render: () => <Teams viewer="katerina" start={{ type: 'place', id: 'teams-release' }} />,
}

/** Miky follows bug at All: every reply lights. Open Who follows to see All and Important apart. */
export const WhoFollows: Story = {
  name: 'Who follows a place',
  render: () => <Teams start={{ type: 'place', id: 'bug' }} />,
}

/** Navigation shows on Topics and in Design's section: read it in one row, and the dot clears in both. */
export const TwoRows: Story = {
  name: 'A topic in two rows, one dot',
  render: () => <Teams rail="topics" start={{ type: 'place', id: 'widgets' }} />,
}

/** Design review is a space of Design: ⋯ → Move to another team… "Keep it a space" is ticked. */
export const Move: Story = {
  name: 'Move, keeping a space',
  render: () => <Teams start={{ type: 'place', id: 'design-review' }} />,
}

export const Loading: Story = {
  render: () => <Teams state="loading" />,
}

export const Error: Story = {
  render: () => <Teams state="error" />,
}

/** A link to a conversation you are not in. */
export const NoAccess: Story = {
  name: 'No access',
  render: () => <Teams viewer="katerina" start={{ type: 'link', id: 'dm-miky-agent' }} />,
}
