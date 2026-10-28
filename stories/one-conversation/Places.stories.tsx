import type { Meta, StoryObj } from '@storybook/react-vite'
import { CONVERSATION, WITH_QUOTES } from './fixtures'
import { LeafColumn, PeekPane, Phone, ShipSidebar, dmTitle } from './Places'

/**
 * PROTOTYPE (concept/one-conversation): one conversation, placed by each app.
 * Every place draws the same cards, thread, menu, Resolve and deleted line;
 * only the width, where a thread opens and the theme differ. Everything is
 * live: react, reply, resolve with a note, reopen, edit and delete your own
 * (Person one's). Write "refuse" in a send or an edit to see it refused.
 */
const meta = {
  title: 'Prototype/One conversation/Places',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Peek: the comments in the main pane, and the thread in the 380 px column beside it. */
export const PeekTopic: Story = {
  globals: { theme: 'signal' },
  render: () => <PeekPane comments={CONVERSATION} title="Item one" />,
}

/** Peek: a conversation between two people. The same cards, and Resolve too. */
export const PeekDirect: Story = {
  name: 'Peek, between two people',
  globals: { theme: 'signal' },
  render: () => <PeekPane comments={CONVERSATION} title={dmTitle} />,
}

/** Ship: the 384 px column beside the page, as in Leaf; a thread opens under its comment. */
export const ShipPage: Story = {
  name: 'Ship sidebar',
  globals: { theme: 'ship' },
  render: () => <ShipSidebar comments={WITH_QUOTES} />,
}

/** Leaf: the 384 px column beside the page; a thread opens under its comment. */
export const LeafPage: Story = {
  name: 'Leaf column',
  globals: { theme: 'leaf' },
  render: () => <LeafColumn comments={WITH_QUOTES} />,
}

/** A phone, 375 px: a thread opens under its comment, the box at the bottom. */
export const PhoneWidth: Story = {
  name: 'Phone',
  globals: { theme: 'ship' },
  render: () => <Phone comments={CONVERSATION} />,
}
