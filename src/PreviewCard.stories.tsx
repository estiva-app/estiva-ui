import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { MenuPanel } from './Menu'
import { PreviewCard } from './PreviewCard'
import { SkeletonBar } from './Skeleton'

/**
 * More of a thing, on hover.
 *
 * A list shows one line per thing because a list has to. This is where the
 * rest of that thing goes: a card that opens beside the row when the pointer
 * rests on it, so the reader can decide whether to open the thing without
 * opening it.
 *
 * The canvas draws the surface with `MenuPanel`, since a live card portals and
 * places itself; **`OnARow`** and **`Scrolling`** are the live ones (D25).
 */
const meta = {
  title: 'Overlays/PreviewCard',
  component: PreviewCard,
  decorators: [(Story) => <div className="flex min-h-[260px] w-full items-center justify-center"><Story /></div>],
  args: { content: null, children: null },
  argTypes: { content: { control: false }, children: { control: false } },
} satisfies Meta<typeof PreviewCard>

export default meta
type Story = StoryObj<typeof meta>

/** A heading, a few named values and a paragraph — the shape most previews
 *  take. What goes in is entirely the caller's. */
function Detail() {
  return (
    <>
      <span className="text-body-2-strong text-text-primary">Item one</span>
      <div className="flex flex-col gap-1.5">
        {[
          ['Label', 'Value'],
          ['Label', 'Another value'],
          ['Label', 'A third value'],
        ].map(([k, v], i) => (
          <div key={i} className="flex items-baseline gap-2">
            <span className="w-20 shrink-0 text-caption text-text-secondary">{k}</span>
            <span className="min-w-0 flex-1 truncate text-[12px] leading-[1.45] text-text-primary">{v}</span>
          </div>
        ))}
      </div>
      <span className="text-[12px] leading-[1.45] text-text-secondary">
        This is the card. It opened because the pointer came to rest on the row
        and stayed there for 350ms, and it will close 200ms after the pointer
        leaves — long enough to move into the card without losing it.
      </span>
    </>
  )
}

function Row({ label, note }: { label: string; note?: string }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-border-default px-3 py-2 hover:bg-bg-hover">
      <IconSquareRounded size={16} stroke={1.5} className="shrink-0 text-text-secondary" />
      <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{label}</span>
      {note && <span className="shrink-0 text-caption text-text-muted">{note}</span>}
    </div>
  )
}

/** The card at rest, so its anatomy can be read without hovering anything. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-[360px] gap-3 p-3">
      <Detail />
    </MenuPanel>
  ),
}

/**
 * While the content is still arriving.
 *
 * A skeleton rather than a spinner, on purpose: a preview has a known shape,
 * and drawing that shape says "this is what is coming" where a spinner only
 * says "wait". It also keeps the card the size it is about to be, so nothing
 * jumps when the content lands.
 */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    /* The skeleton is the shape of `Default`, line for line: a heading, three
       label/value rows, and two lines of detail. That is what makes it a
       skeleton rather than a placeholder — the card is the size it is about to
       be, so nothing moves when the content lands. */
    <MenuPanel className="w-[360px] gap-3 p-3">
      <SkeletonBar className="h-4 w-24" />
      <div className="flex flex-col gap-1.5">
        {['w-16', 'w-24', 'w-20'].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonBar className="w-20 shrink-0" />
            <SkeletonBar className={w} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <SkeletonBar className="w-full" />
        <SkeletonBar className="w-2/3" />
      </div>
    </MenuPanel>
  ),
}

/** Live. Rest the pointer on the row and read what the card says. */
export const OnARow: Story = {
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the row's note is muted caption text, 3.93:1 on --bg-base in signal (AA 4.5:1).
  parameters: { controls: { disable: true }, a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
  render: () => (
    <PreviewCard content={<Detail />} wrapperClassName="w-[320px]">
      <Row label="Item one" note="Label" />
    </PreviewCard>
  ),
}

/**
 * A card taller than its cap scrolls, **and you can reach the scrollbar** —
 * which is the whole difference between this and a tooltip. Rest the pointer
 * on the row, move into the card, and scroll it.
 */
export const Scrolling: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PreviewCard
      wrapperClassName="w-[320px]"
      content={
        <>
          <span className="text-body-2-strong text-text-primary">Item with more than fits</span>
          <span className="text-[12px] leading-[1.45] text-text-secondary">
            There is more here than the card's 300px cap allows, so it scrolls.
            You can reach that scrollbar because the pointer can enter this card.
            A tooltip cannot be entered, so a tooltip that scrolled would be a
            tooltip nobody could read to the end.
          </span>
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="w-20 shrink-0 text-caption text-text-secondary">Label</span>
              <span className="min-w-0 flex-1 truncate text-[12px] leading-[1.45] text-text-primary">Value {i + 1}</span>
            </div>
          ))}
        </>
      }
    >
      <Row label="Item with more than fits" />
    </PreviewCard>
  ),
}

/**
 * The side is a preference, not a promise: it flips when the side you asked
 * for has no room. This one asks for the right in a row pinned to the right
 * edge, so it opens on the left.
 */
export const FlippedAtAnEdge: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => (
    <div className="flex h-[260px] w-full items-center justify-end p-4">
      <PreviewCard content={<Detail />} wrapperClassName="w-[320px]">
        <Row label="A row against the right edge" />
      </PreviewCard>
    </div>
  ),
}
