import type { Meta, StoryObj } from '@storybook/react-vite'
import { PartCard } from './PartCard'

const meta = {
  title: 'Links & references/PartCard',
  component: PartCard,
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="max-w-[480px]">{Story()}</div>],
} satisfies Meta<typeof PartCard>

export default meta
type Story = StoryObj<typeof meta>

/** A part of something longer, under the header of what it is part of. */
export const Default: Story = {
  args: {
    state: 'ready',
    kind: 'issue',
    heading: 'Item one',
    partKey: 'ABC-2',
    href: '#part',
    children: (
      <>
        <p className="text-body-2-strong text-text-primary">A heading in the part</p>
        <p className="text-body-2 text-text-secondary">The blocks of the part, as they are now. They change when the text they came from changes.</p>
      </>
    ),
  },
}

/** Still being looked up. */
export const Loading: Story = { args: { state: 'loading', kind: 'issue' } }

/** The part, or what it is part of, is gone or not this reader's to see. */
export const NotAvailable: Story = { args: { state: 'unavailable', kind: 'issue', noun: 'Item', openIn: { app: 'App one', href: '#elsewhere' } } }
