import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { LinkCard, LinkCardLoading } from './LinkCard'
import { loadingShapeOf, type Linked } from './linked'
import { GROUP, ITEM, ITEM_NO_SUMMARY, ITEM_READ_ONLY, ITEM_UNREAD, PAGE, PLACE, ready, SAID, UNAVAILABLE } from './linked.examples'

const meta = {
  title: 'Components/LinkCard',
  component: LinkCard,
  parameters: { layout: 'padded' },
  args: { link: ready(ITEM) },
  decorators: [(Story) => <div className="max-w-[480px]">{Story()}</div>],
} satisfies Meta<typeof LinkCard>

export default meta
type Story = StoryObj<typeof meta>

/** Its status and owner change from the card: pick one. */
export const Default: Story = {
  render: () => {
    const [status, setStatus] = useState('doing')
    const [owner, setOwner] = useState<string>('a')
    const linked: Linked = { ...ITEM, status: { ...ITEM.status!, value: status, onChange: setStatus }, owner: { ...ITEM.owner!, value: owner, onChange: setOwner } }
    return <LinkCard link={ready(linked)} />
  },
}

/** To a reader who may not change it: the same two values, as words. */
export const ReadOnly: Story = { args: { link: ready(ITEM_READ_ONLY) } }

/** Something unread in its conversation, to a member: the count is brighter, with a dot. */
export const Unread: Story = { args: { link: ready(ITEM_UNREAD) } }

/** No summary: the title alone. */
export const NoSummary: Story = { args: { link: ready(ITEM_NO_SUMMARY) } }

/** A group: its progress, its lead, and each item inside, which opens on its own. */
export const WithItems: Story = { args: { link: ready(GROUP) } }

/** A place people talk: its members and its newest conversation. */
export const WithLatest: Story = { args: { link: ready(PLACE) } }

/** A page of text: who wrote it, and when. */
export const WithAuthors: Story = { args: { link: ready(PAGE) } }

/** Words a person wrote: their face, the time as the link, and the words. */
export const WordsAPersonWrote: Story = { args: { link: ready(SAID) } }

/** Still being looked up, beside the card it becomes: the same height. */
export const Loading: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[ITEM, GROUP, PLACE, PAGE].map((linked) => (
        // Each at a card's full width, as under a message: a narrower column wraps the summary.
        <div key={linked.id} className="grid w-[968px] grid-cols-[480px_480px] items-start gap-2">
          <LinkCardLoading kind={linked.kind} shape={loadingShapeOf(linked)} />
          <LinkCard link={ready(linked)} />
        </div>
      ))}
    </div>
  ),
}

/** Nothing remembered of it: the kind's usual card. */
export const LoadingByKind: Story = { args: { link: { state: 'loading', kind: 'issue' } } }

/** Deleted, or not this reader's to see: one line. */
export const NotAvailable: Story = { args: { link: UNAVAILABLE } }
