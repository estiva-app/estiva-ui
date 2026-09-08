import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { MenuPanel } from './Menu'
import { PreviewCard } from './PreviewCard'
import { SkeletonBar } from './Skeleton'

/**
 * More of a thing, on hover. A row that shows only a summary gets a card
 * beside it with the rest of what is known about that thing.
 *
 * Not a **Tooltip**: a tooltip is a word for a control and cannot be pointed
 * at; this holds content and you can move into it — which is also the only
 * way to reach a card that scrolls. The canvas draws the surface with
 * `MenuPanel`, since a live card portals and places itself; **`OnARow`** is
 * the live one (Katerina, D25).
 */
const meta = {
  title: 'Overlays/PreviewCard',
  component: PreviewCard,
  decorators: [(Story) => <div className="flex min-h-[240px] w-full items-center justify-center"><Story /></div>],
  args: { content: null, children: null },
  argTypes: { content: { control: false }, children: { control: false } },
} satisfies Meta<typeof PreviewCard>

export default meta
type Story = StoryObj<typeof meta>

/** What a card holds is the caller's: a heading, some named values, a line or
 *  two of detail. Nothing here knows what the thing is. */
function Detail() {
  return (
    <>
      <span className="text-body-2-strong text-text-primary">Item one</span>
      <div className="flex flex-col gap-1.5">
        {[
          ['Label', 'Value'],
          ['Label', 'Another value'],
          ['Label', 'A third'],
        ].map(([k, v], i) => (
          <div key={i} className="flex items-baseline gap-2">
            <span className="w-20 shrink-0 text-caption text-text-secondary">{k}</span>
            <span className="min-w-0 flex-1 truncate text-[12px] leading-[1.45] text-text-primary">{v}</span>
          </div>
        ))}
      </div>
      <span className="text-[12px] leading-[1.45] text-text-secondary">
        A longer line of detail, of the kind a row has no room for and a reader
        may want before deciding to open it.
      </span>
    </>
  )
}

/** The card at rest — the surface, and the kind of thing that goes in it. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-[360px] gap-3 p-3">
      <Detail />
    </MenuPanel>
  ),
}

/** While the content is still arriving. A preview is a read, so it may wait. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-[360px] gap-2 p-3">
      <SkeletonBar className="w-32" />
      <SkeletonBar className="w-full" />
      <SkeletonBar className="w-3/4" />
    </MenuPanel>
  ),
}

/** Live: rest the pointer on the row. The card opens after 350ms beside it,
 *  flips to the other side when that one has no room, and stays up while you
 *  cross into it. */
export const OnARow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PreviewCard content={<Detail />} wrapperClassName="w-[320px]">
      <div className="flex w-full items-center gap-2 rounded-lg border border-border-default px-3 py-2 hover:bg-bg-hover">
        <IconSquareRounded size={16} stroke={1.5} className="shrink-0 text-text-secondary" />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[140%] text-text-primary">Item one</span>
        <span className="text-caption text-text-muted">Label</span>
      </div>
    </PreviewCard>
  ),
}

/** A card taller than its cap scrolls, and you can reach the scrollbar
 *  because the card is not `pointer-events: none`. That is the difference
 *  between this and a tooltip, in one story. */
export const Scrolling: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PreviewCard
      wrapperClassName="w-[320px]"
      content={
        <>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="w-20 shrink-0 text-caption text-text-secondary">Label</span>
              <span className="min-w-0 flex-1 truncate text-[12px] leading-[1.45] text-text-primary">Value {i + 1}</span>
            </div>
          ))}
        </>
      }
    >
      <div className="flex w-full items-center gap-2 rounded-lg border border-border-default px-3 py-2 hover:bg-bg-hover">
        <IconSquareRounded size={16} stroke={1.5} className="shrink-0 text-text-secondary" />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[140%] text-text-primary">Item with more than fits</span>
      </div>
    </PreviewCard>
  ),
}
