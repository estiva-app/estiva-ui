import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { userEvent, within } from 'storybook/test'
import { ReplyCard, type ReplyCardProps } from './ConversationCard'
import { AT, Column, EditBox, Files, ONE, SHORT, SOME, WithCard, YOU, useReactions } from './conversation.examples'
import type { ReactionCount } from './ReactionRow'

/** One reply, live: point at it to react, and on your own edit or delete it. */
const meta = {
  title: 'Conversation/ReplyCard',
  component: ReplyCard,
  parameters: { layout: 'padded' },
  args: { author: ONE, time: '11:40 AM', children: SHORT },
  decorators: [(Story) => <Column>{Story()}</Column>],
} satisfies Meta<typeof ReplyCard>

export default meta
type Story = StoryObj<typeof meta>

function Live({ start, ...props }: ReplyCardProps & { start?: readonly ReactionCount[] }) {
  const reacting = useReactions(start)
  const [gone, setGone] = useState(false)
  if (gone) return null
  return (
    <ReplyCard
      {...props}
      reactions={props.readOnly ? { ...reacting, onToggle: undefined } : reacting}
      onDelete={() => setGone(true)}
      editor={props.own ? (done) => <EditBox text={SHORT} done={done} /> : undefined}
    />
  )
}

/** Someone's reply. */
export const Reply: Story = { render: (args) => <Live {...args} /> }

/** Yours: Edit and Delete in its ⋯ menu. */
export const Yours: Story = { render: (args) => <Live {...args} author={YOU} own /> }

/** Edited since it was sent. */
export const Edited: Story = { render: (args) => <Live {...args} edited="Edited 11:52 AM" /> }

/** Not read yet. */
export const New: Story = { render: (args) => <Live {...args} isNew /> }

/** Urgent and not read yet. */
export const Urgent: Story = { render: (args) => <Live {...args} isNew urgent /> }

/** With reactions. */
export const Reactions: Story = { render: (args) => <Live {...args} start={SOME} /> }

/** Pictures and files under the words. */
export const WithFiles: Story = { name: 'Files', render: (args) => <Live {...args} files={<Files />} /> }

/** A card its author attached. */
export const Card: Story = { render: (args) => <Live {...args}><WithCard /></Live> }

/** Its time is a link to it, "Link to this" on hover: the story points at it. */
export const Linked: Story = {
  name: 'Time is a link',
  render: (args) => <Live {...args} timeHref="#reply" />,
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('link', { name: '11:40 AM' }))
  },
}

/** With its moment, `at`: the time says the exact date and time under the pointer. The story points at it. */
export const ExactTime: Story = {
  name: 'Exact time',
  render: (args) => <Live {...args} at={AT + 32 * 60_000} />,
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByText('11:40 AM'))
  },
}

/** Its time a link, with its moment: the exact time, then where the link goes. The story points at it. */
export const LinkedExactTime: Story = {
  name: 'Time is a link, exact time',
  render: (args) => <Live {...args} at={AT + 32 * 60_000} timeHref="#reply" />,
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole('link', { name: '11:40 AM' }))
  },
}

/** Points at the reply and opens its ⋯ by the name it is given. */
async function openMenu(canvasElement: HTMLElement, name: string) {
  await userEvent.hover(within(canvasElement).getByText(SHORT))
  await userEvent.click(within(canvasElement).getByRole('button', { name }))
}

/**
 * Yours, in an app's own words: the ⋯ named "Message actions", its Delete row "Delete message", and the question
 * asking about a message. The story points at it and opens the menu.
 */
export const InAnAppsWords: Story = {
  name: "In an app's words",
  render: (args) => <Live {...args} author={YOU} own noun="message" deleteLabel="Delete message" moreLabel="Message actions" />,
  play: async ({ canvasElement }) => openMenu(canvasElement, 'Message actions'),
}

/** The delete question in the app's noun: "Delete this message?", answered by "Delete message". The story asks it. */
export const DeleteInAnAppsWords: Story = {
  name: "In an app's words, deleting",
  render: (args) => <Live {...args} author={YOU} own noun="message" deleteLabel="Delete message" moreLabel="Message actions" />,
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement, 'Message actions')
    await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole('menuitem', { name: 'Delete message' }))
  },
}

/** Nothing can be changed: no strip, reactions only shown. */
export const ReadOnly: Story = { name: 'Read-only', render: (args) => <Live {...args} readOnly start={SOME} /> }
