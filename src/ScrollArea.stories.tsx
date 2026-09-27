import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from './Card'
import { ScrollArea } from './ScrollArea'

/** A region that scrolls without taking width for its scrollbar. */
const meta = {
  title: 'Layout/ScrollArea',
  component: ScrollArea,
  parameters: { controls: { disable: true } },
  args: { children: null },
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

const rows = Array.from({ length: 40 }, (_, i) => `Row ${i + 1}`)

/** A list taller than its box. The bar shows at rest, because there is more to scroll to. */
export const Default: Story = {
  render: () => (
    <Card className="h-[240px] w-[280px]">
    <ScrollArea className="h-full" contentClassName="p-2">
      <ul className="flex flex-col gap-px">
        {rows.map((row) => (
          <li key={row} className="rounded-md px-2 py-1.5 text-body-2 text-text-primary">
            {row}
          </li>
        ))}
      </ul>
    </ScrollArea>
    </Card>
  ),
}

/** Rows that stick to the top as the list moves under them. The bar stays above them. */
export const StickyHeadings: Story = {
  render: () => (
    <Card className="h-[240px] w-[280px]">
    <ScrollArea className="h-full">
      {['Group one', 'Group two'].map((group) => (
        <div key={group} className="flex flex-col">
          <p className="sticky top-0 z-10 bg-bg-surface px-4 py-2 text-caption text-text-secondary">{group}</p>
          {rows.slice(0, 8).map((row) => (
            <p key={row} className="px-4 py-1.5 text-body-2 text-text-primary">
              {row}
            </p>
          ))}
        </div>
      ))}
    </ScrollArea>
    </Card>
  ),
}

/** Nothing to scroll: the region draws exactly as a plain box would, and no bar. */
export const Fits: Story = {
  render: () => (
    <Card className="h-[240px] w-[280px]">
    <ScrollArea className="h-full" contentClassName="p-2">
      <ul className="flex flex-col gap-px">
        {rows.slice(0, 4).map((row) => (
          <li key={row} className="rounded-md px-2 py-1.5 text-body-2 text-text-primary">
            {row}
          </li>
        ))}
      </ul>
    </ScrollArea>
    </Card>
  ),
}

/** A row wider than its box — a table, a board. */
export const Horizontal: Story = {
  render: () => (
    <Card className="w-[280px]">
    <ScrollArea orientation="horizontal" contentClassName="p-2">
      <div className="flex w-max gap-2">
        {rows.slice(0, 12).map((row) => (
          <div key={row} className="w-[120px] shrink-0 rounded-md bg-bg-inset px-2 py-1.5 text-body-2 text-text-primary">
            {row}
          </div>
        ))}
      </div>
    </ScrollArea>
    </Card>
  ),
}

/** Both ways, with the corner where the two bars would meet. */
export const Both: Story = {
  render: () => (
    <Card className="h-[240px] w-[280px]">
    <ScrollArea orientation="both" className="h-full" contentClassName="p-2">
      <div className="flex w-max flex-col gap-px">
        {rows.map((row) => (
          <div key={row} className="w-[480px] rounded-md px-2 py-1.5 text-body-2 text-text-primary">
            {row} — a line long enough to run past the box
          </div>
        ))}
      </div>
    </ScrollArea>
    </Card>
  ),
}

/** A sideways region inside a scrolling page — a table in a content column. A wheel down over it moves the page; a swipe sideways moves the region. */
export const SidewaysInsideAPage: Story = {
  render: () => (
    <Card className="h-[240px] w-[280px]">
    <ScrollArea className="h-full" contentClassName="p-2">
      <div className="flex flex-col gap-px">
        {rows.slice(0, 3).map((row) => (
          <p key={row} className="rounded-md px-2 py-1.5 text-body-2 text-text-primary">
            {row}
          </p>
        ))}
        <div className="my-1 rounded-md border border-border-default">
        <ScrollArea orientation="horizontal" contentClassName="p-2">
          <div className="flex w-max gap-2">
            {rows.slice(0, 12).map((row) => (
              <div key={row} className="w-[120px] shrink-0 rounded-md bg-bg-inset px-2 py-1.5 text-body-2 text-text-primary">
                {row}
              </div>
            ))}
          </div>
        </ScrollArea>
        </div>
        {rows.slice(3).map((row) => (
          <p key={row} className="rounded-md px-2 py-1.5 text-body-2 text-text-primary">
            {row}
          </p>
        ))}
      </div>
    </ScrollArea>
    </Card>
  ),
}
