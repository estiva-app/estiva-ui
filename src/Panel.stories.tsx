import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconDotsVertical } from '@tabler/icons-react'
import { IconButton } from './IconButton'
import { Panel } from './Panel'

/**
 * A panel of a page: a header, a body that scrolls whenever it is taller than
 * the panel, and a row fixed under it when there is one. The body's words are
 * stand-ins.
 */
const meta = {
  title: 'Layout/Panel',
  component: Panel,
  parameters: { layout: 'fullscreen' },
  args: { title: 'Details', children: null, bodyClassName: 'flex flex-col gap-3 px-4 pt-3 pb-4' },
  argTypes: { children: { control: false }, actions: { control: false }, footer: { control: false } },
  // A side column of the frame: 380px wide and a fixed height, where a panel sits beside a page.
  decorators: [
    (Story) => (
      <div className="flex h-[560px] w-[380px] flex-col border-l border-border-subtle bg-bg-surface">
        {Story()}
      </div>
    ),
  ],
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

const paragraph = (n: number) => (
  <p key={n} className="text-body-2 text-text-secondary">
    Paragraph {n}. What this item is for, who it is for, and what it leaves for later, written out in full the way a real description is.
  </p>
)
const paragraphs = (count: number) => Array.from({ length: count }, (_, i) => paragraph(i + 1))
const menu = <IconButton tooltip="More" aria-label="More"><IconDotsVertical size={16} stroke={1.5} /></IconButton>

/** A short body: it fits, so there is no bar. */
export const Default: Story = {
  args: { actions: menu },
  render: (args) => <Panel {...args}>{paragraphs(2)}</Panel>,
}

/** A title that opens something: the chevron after it, as ContainerHeader draws it. */
export const WithChevron: Story = {
  args: { chevron: true },
  render: (args) => <Panel {...args}>{paragraphs(2)}</Panel>,
}

/** A body taller than the panel: it scrolls, and the bar shows at rest because there is more below. */
export const ALongBody: Story = {
  args: { actions: menu },
  render: (args) => <Panel {...args}>{paragraphs(14)}</Panel>,
}

/** A row fixed under the body, such as a reply box: the body scrolls above it, and it stays put. */
export const WithAFooter: Story = {
  render: (args) => (
    <Panel
      {...args}
      footer={
        // A stand-in for whatever the footer holds: the part only keeps it in place.
        <div className="border-t border-border-subtle p-3">
          <div className="flex h-10 items-center justify-center rounded-md bg-bg-elevated text-caption text-text-muted">Footer</div>
        </div>
      }
    >
      {paragraphs(12)}
    </Panel>
  ),
}

/** Two panels in one column: the first capped at three fifths, each scrolls in its own room. */
export const TwoInAColumn: Story = {
  render: (args) => (
    <>
      <Panel {...args} title="Details" className="max-h-[60%]">
        {paragraphs(10)}
      </Panel>
      <Panel {...args} title="Activity">
        {paragraphs(6)}
      </Panel>
    </>
  ),
}

function Broken(): never {
  throw new Error('The body could not draw itself')
}

/** A crash inside it stays inside it: the title stays, and the message takes the body's room. */
export const WhenTheBodyBreaks: Story = {
  render: (args) => (
    <Panel {...args}>
      <Broken />
    </Panel>
  ),
}
