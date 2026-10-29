import type { Meta, StoryObj } from '@storybook/react-vite'
import { LinkChip } from './LinkChip'
import { GROUP, ITEM, PLACE, ready } from './linked.examples'
import { LinkPreview, LinkPreviewOpen } from './LinkPreview'
import { LinkRow } from './LinkRow'

const meta = {
  title: 'Links & references/A link/LinkPreview',
  component: LinkPreview,
  parameters: { layout: 'padded' },
  args: { linked: ITEM, children: null },
} satisfies Meta<typeof LinkPreview>

export default meta
type Story = StoryObj<typeof meta>

/** Hover the chip or the row: the card shows, read only. On a screen that cannot hover there is none, and a tap opens the link. */
export const OnHover: Story = {
  render: () => (
    <div className="flex max-w-[480px] flex-col gap-3">
      <p className="text-body-2 text-text-primary">
        Hover <LinkChip link={ready(ITEM)} /> for its card.
      </p>
      <LinkRow link={ready(GROUP)} />
    </div>
  ),
}

/** Drawn open, for a still picture: the values are words, never pickers. */
export const Open: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      <LinkPreviewOpen linked={ITEM} />
      <LinkPreviewOpen linked={GROUP} />
      <LinkPreviewOpen linked={PLACE} />
    </div>
  ),
}
