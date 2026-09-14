import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card } from './Card'

const Body = ({ title = 'Item one', line = 'A line about the item.' }: { title?: string; line?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-body-2-strong text-text-primary">{title}</span>
    <span className="text-caption text-text-secondary">{line}</span>
  </div>
)

const meta = {
  title: 'Primitives/Card',
  component: Card,
  args: { fill: 'surface', className: 'w-[280px] p-3', children: <Body /> },
  argTypes: {
    fill: { control: 'inline-radio', options: ['surface', 'elevated', 'inset', 'none'] },
    hover: { control: 'inline-radio', options: ['none', 'hairline', 'fill'] },
    attention: { control: 'inline-radio', options: [undefined, 'accent', 'warning'] },
    children: { control: false },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/** On the page: the surface fill and the default hairline. */
export const Surface: Story = {}

/** On something already filled — a column of cards: the elevated fill and the default hairline. */
export const Elevated: Story = {
  args: { fill: 'elevated', className: 'p-2' },
  render: (args) => (
    <div className="flex w-[300px] flex-col gap-2 rounded-lg border border-border-default bg-bg-surface p-2">
      <Card {...args} />
      <Card {...args} children={<Body title="Item two" />} />
    </div>
  ),
}

/** Inside something filled: the inset fill and the subtle hairline. */
export const Inset: Story = {
  args: { fill: 'inset' },
  render: (args) => (
    <div className="flex w-[320px] flex-col gap-2 rounded-lg bg-bg-surface p-4">
      <span className="text-body-2 text-text-primary">Text, then a card inside it.</span>
      <Card {...args} />
    </div>
  ),
}

/** A hairline alone: the subtle one, no fill. */
export const HairlineOnly: Story = { args: { fill: 'none' } }

/** The whole card is a link: point at it and its hairline goes one step stronger. */
export const AsALink: Story = { args: { href: '#' } }

/** Cards in a feed: each lights up when pointed at, with no hairline until then. One is selected, one asks to be looked at, one is urgent. */
export const InAFeed: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[320px] flex-col gap-2">
      <Card hover="fill" quietUntilHover onClick={() => {}} className="p-3">
        <Body />
      </Card>
      <Card hover="fill" quietUntilHover selected onClick={() => {}} className="p-3">
        <Body title="Item two" line="Selected." />
      </Card>
      <Card hover="fill" quietUntilHover attention="accent" onClick={() => {}} className="p-3">
        <Body title="Item three" line="Something new in it." />
      </Card>
      <Card hover="fill" quietUntilHover attention="warning" onClick={() => {}} className="p-3">
        <Body title="Item four" line="Something urgent in it." />
      </Card>
    </div>
  ),
}

/** Being changed in place: the selected fill and the accent hairline. */
export const Active: Story = { args: { active: true, hover: 'fill' } }

/** It stands for something that could not be read: the hairline is dashed. */
export const Unreadable: Story = {
  args: { unreadable: true, children: <span className="text-body-2 text-text-secondary">This can’t be shown here.</span> },
}

/** The four fills, each where it belongs. */
export const AllFills: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      <Card className="w-[200px] p-3">
        <Body title="surface" line="On the page." />
      </Card>
      <div className="rounded-lg bg-bg-surface p-2">
        <Card fill="elevated" className="w-[200px] p-3">
          <Body title="elevated" line="On a filled column." />
        </Card>
      </div>
      <div className="rounded-lg bg-bg-surface p-2">
        <Card fill="inset" className="w-[200px] p-3">
          <Body title="inset" line="Inside something filled." />
        </Card>
      </div>
      <Card fill="none" className="w-[200px] p-3">
        <Body title="none" line="A hairline alone." />
      </Card>
    </div>
  ),
}
