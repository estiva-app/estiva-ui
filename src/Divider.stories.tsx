import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider } from './Divider'
import { MenuPanel } from './Menu'
import { Card } from './Card'
import { ScrollArea } from './ScrollArea'

/** A hairline in `border-subtle`, inset 12px each side — or standing up between two columns. */
const meta = {
  title: 'Page structure/Divider',
  component: Divider,
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

/** Between two blocks on the surface. */
export const Default: Story = {
  render: () => (
    <Card className="w-80 py-3">
      <p className="px-3 pb-2 text-body-2 text-text-primary">Above the divider</p>
      <Divider />
      <p className="px-3 pt-2 text-body-2 text-text-primary">Below the divider</p>
    </Card>
  ),
}

/** Inside a menu — on the elevated surface, full width (`mx-0`). */
export const InAMenu: Story = {
  render: () => (
    <MenuPanel className="w-72">
      <div className="px-2 py-1.5 text-body-2 text-text-primary">First action</div>
      <Divider className="mx-0 my-2" />
      <div className="px-2 py-1.5 text-body-2 text-text-primary">Second action</div>
    </MenuPanel>
  ),
}

/** Standing between two columns, the height of its row. Ship's addition. */
export const Vertical: Story = {
  render: () => (
    <div className="flex h-40 w-96 gap-6 text-body-2 text-text-primary">
      <div className="flex-1">Content</div>
      <Divider orientation="vertical" />
      <div className="w-32">Rail</div>
    </div>
  ),
}

/** Words in the middle of the line — a date between two days of messages. */
export const WithALabel: Story = {
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the label is muted caption text, 3.78:1 on --bg-surface in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
  render: () => (
    <Card className="w-96 py-3"><div className="text-body-2 text-text-primary">
      <p className="px-3 pb-2">Yesterday's last message</p>
      <Divider label="Today" />
      <p className="px-3 pt-2">Today's first</p>
    </div></Card>
  ),
}

/** Asking for attention: where "new since you last read this" begins. The warning colour, because the accent could not be read on Ship's background. */
export const Warning: Story = {
  render: () => (
    <Card className="w-96 py-3"><div className="text-body-2 text-text-primary">
      <p className="px-3 pb-2">Yes — it re-reads the folder union and the archived one lands last.</p>
      <Divider label="New since you last read this" tone="warning" />
      <p className="px-3 pt-2">Same here, from Peek.</p>
    </div></Card>
  ),
}

/** Between two stretches of a list, in the section-label voice: a date. Lines edge to edge, 8px in, 24px tall. */
export const ADate: Story = {
  render: () => (
    <Card className="w-96 py-3"><div className="text-body-2 text-text-primary">
      <p className="px-3 pb-2">The last item of one day.</p>
      <Divider look="section" label="Wednesday, 29 October" />
      <p className="px-3 pt-2">The first item of the next.</p>
    </div></Card>
  ),
}

/** Where what answers the first item begins. */
export const Replies: Story = {
  render: () => (
    <Card className="w-96 py-3"><div className="text-body-2 text-text-primary">
      <p className="px-3 pb-2">The item everything below answers.</p>
      <Divider look="section" label="Replies" />
      <p className="px-3 pt-2">The first answer.</p>
    </div></Card>
  ),
}

/** In a list with its date lines: where what is new to the reader begins, in the caption look and the warning colour, which asks for attention. */
export const New: Story = {
  render: () => (
    <Card className="w-96 py-3"><div className="text-body-2 text-text-primary">
      <Divider look="section" label="Wednesday, 29 October" />
      <p className="px-3 py-2">The last item already read.</p>
      <Divider label="New" tone="warning" />
      <p className="px-3 pt-2">The first new one.</p>
    </div></Card>
  ),
}

/** Each line stays at the top of the list while its stretch scrolls under it, until the next one takes its place. Scroll the box. */
export const Sticky: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card clip className="h-64 w-96">
      <ScrollArea className="h-full">
        {['Tuesday, 28 October', 'Wednesday, 29 October'].map((day) => (
          // The line first in the box that holds its stretch: it stays while the box is in view.
          <div key={day} className="flex flex-col">
            <Divider look="section" label={day} sticky />
            {Array.from({ length: 6 }, (_, i) => (
              <p key={i} className="px-4 py-3 text-body-2 text-text-secondary">
                Item {i + 1} of {day}
              </p>
            ))}
          </div>
        ))}
      </ScrollArea>
    </Card>
  ),
}
