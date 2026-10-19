import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { PEOPLE, STATUS_OPTIONS } from './linked.examples'
import { CommentCount, LinkPickers, ProgressRing, StatusMark } from './LinkParts'

const meta = {
  title: 'Components/LinkParts',
  component: LinkPickers,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LinkPickers>

export default meta
type Story = StoryObj<typeof meta>

/** A status and an owner, changed from the card. */
export const Pickers: Story = {
  render: () => {
    const [status, setStatus] = useState('todo')
    const [owner, setOwner] = useState<string | undefined>(undefined)
    return (
      <LinkPickers
        status={{ value: status, options: STATUS_OPTIONS, onChange: setStatus }}
        owner={{ value: owner, options: PEOPLE, onChange: setOwner }}
        ownerLabel="Owner"
      />
    )
  },
}

/** To a reader who may not change them, and in the hover preview: the same values, as words. */
export const PickersReadOnly: Story = {
  args: { status: { value: 'doing', options: STATUS_OPTIONS }, owner: { value: 'b', options: PEOPLE } },
}

/** Nobody owns it yet, read only. */
export const NoOwner: Story = {
  args: { status: { value: 'todo', options: STATUS_OPTIONS }, owner: { value: undefined, options: PEOPLE } },
}

/** The count of what was said, opening where it is read. With something unread, to a member: brighter, with a dot. */
export const Conversation: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CommentCount conversation={{ count: 4, href: '#conversation' }} />
      <CommentCount conversation={{ count: 5, href: '#conversation', unread: true }} />
    </div>
  ),
}

/** A status as its shape, and progress as a ring. */
export const Marks: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {STATUS_OPTIONS.map((option) => (
        <StatusMark key={option.value} status={{ label: option.label, colour: option.colour! }} />
      ))}
      <ProgressRing done={2} total={5} />
      <ProgressRing done={5} total={5} />
    </div>
  ),
}
