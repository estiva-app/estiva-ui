import type { Meta, StoryObj } from '@storybook/react-vite'
import { DELETED, GROUP, ITEM, ITEM_ARCHIVED, ITEM_UNREAD, LOADING, PAGE, PLACE, ready, SAID, UNAVAILABLE, WRITTEN_AS_A_URL } from './linked.examples'
import { LinkRow, LinkUnavailable } from './LinkRow'

const meta = {
  title: 'Links & references/LinkRow',
  component: LinkRow,
  parameters: { layout: 'padded' },
  args: { link: ready(ITEM) },
  decorators: [(Story) => <div className="max-w-[480px]">{Story()}</div>],
} satisfies Meta<typeof LinkRow>

export default meta
type Story = StoryObj<typeof meta>

/** A link alone on its line. Hover it for its card. */
export const Default: Story = {}

/** Every kind: the corner says what each one has. */
export const EachKind: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <LinkRow link={ready(ITEM)} />
      <LinkRow link={ready(GROUP)} />
      <LinkRow link={ready(PLACE)} />
      <LinkRow link={ready(PAGE)} />
      <LinkRow link={ready(SAID)} />
    </div>
  ),
}

/** Something unread in its conversation, to a member: the count shows, with its dot. */
export const Unread: Story = { args: { link: ready(ITEM_UNREAD) } }

/** Words a person wrote, on one line: their face, their name, the words cut to fit, the time. */
export const WordsAPersonWrote: Story = { args: { link: ready(SAID) } }

/** Archived: "Archived" in the line under its title. */
export const Archived: Story = { args: { link: ready(ITEM_ARCHIVED) } }

/** Still being looked up: the row in bars, at the row's height. */
export const Loading: Story = { args: { link: LOADING } }

/** Not this reader's to see: one line, and where it may still open. */
export const NotAvailable: Story = { args: { link: UNAVAILABLE } }

/** Deleted, as a trusted deletion naming it says: the same line, its own words, and no way out. */
export const Deleted: Story = { args: { link: DELETED } }

/** Written as a URL that cannot be shown: it stays that URL, a plain link, in the row's place. */
export const WrittenAsAUrl: Story = { args: { link: WRITTEN_AS_A_URL } }

/** The not-available line on its own, as a card or a part draws it too; without `openIn`, no way out. */
export const NotAvailableLine: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <LinkUnavailable kind="issue" noun="Issue" openIn={{ app: 'App one', href: '#elsewhere' }} />
      <LinkUnavailable kind="page" noun="Document" />
    </div>
  ),
}
