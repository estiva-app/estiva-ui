import type { Meta, StoryObj } from '@storybook/react-vite'
import { LinkChip } from './LinkChip'
import { DELETED, GROUP, ITEM, LOADING, PAGE, PLACE, ready, SAID, UNAVAILABLE, WRITTEN_AS_A_URL } from './linked.examples'

const meta = {
  title: 'Links & references/LinkChip',
  component: LinkChip,
  parameters: { layout: 'padded' },
  args: { link: ready(ITEM) },
} satisfies Meta<typeof LinkChip>

export default meta
type Story = StoryObj<typeof meta>

/** In a sentence. Hover it for its card. */
export const InASentence: Story = {
  render: (args) => (
    <p className="max-w-[560px] text-body-2 text-text-primary">
      A sentence that links <LinkChip {...args} /> in the middle of its words, and goes on after it.
    </p>
  ),
}

/** Every kind, by its icon; words a person wrote lead with their face. */
export const EachKind: Story = {
  render: () => (
    <p className="max-w-[560px] text-body-2 leading-7 text-text-primary">
      <LinkChip link={ready(ITEM)} /> <LinkChip link={ready(GROUP)} /> <LinkChip link={ready(PLACE)} /> <LinkChip link={ready(PAGE)} /> <LinkChip link={ready(SAID)} />
    </p>
  ),
}

/** Still being looked up: the icon, known from the address, and a bar. */
export const Loading: Story = { args: { link: LOADING } }

/** Deleted, or not this reader's to see: said in words. */
export const NotAvailable: Story = { args: { link: UNAVAILABLE } }

/** No card on hover: where a card would cover what the reader is choosing from. */
export const WithoutPreview: Story = { args: { preview: false } }

/** Deleted, as a trusted deletion naming it says: told apart from not available. */
export const Deleted: Story = { args: { link: DELETED } }

/** Written as a URL that cannot be shown: it stays that URL, a plain link, as a message draws one. */
export const WrittenAsAUrl: Story = { args: { link: WRITTEN_AS_A_URL } }
