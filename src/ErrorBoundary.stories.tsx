import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from './Button'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * A part of the page that crashes shows this in its place, and the rest of the
 * page keeps working. Try again draws the part again.
 */
const meta = {
  title: 'Feedback/ErrorBoundary',
  component: ErrorBoundary,
  parameters: { layout: 'fullscreen' },
  args: { label: 'panel', children: null },
  argTypes: { children: { control: false }, frame: { control: false } },
} satisfies Meta<typeof ErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

function Broken(): never {
  throw new Error('This part could not draw itself')
}

/** A panel that crashed, beside one that did not. */
export const InAPanel: Story = {
  args: { label: 'panel' },
  render: (args) => (
    <div className="flex h-screen bg-bg-surface">
      <div className="flex w-72 flex-col border-r border-border-subtle">
        <ErrorBoundary {...args}>
          <Broken />
        </ErrorBoundary>
      </div>
      <div className="flex flex-1 items-center justify-center text-body-2 text-text-secondary">The rest of the page keeps working.</div>
    </div>
  ),
}

/** Try again draws the part again: here the part is mended first, so it comes back. */
export const TryAgain: Story = {
  parameters: { controls: { disable: true } },
  render: function Mend() {
    const [mended, setMended] = useState(false)
    function Part() {
      if (!mended) throw new Error('This part could not draw itself')
      return <p className="p-4 text-body-2 text-text-primary">The part is back.</p>
    }
    return (
      <div className="flex h-screen flex-col bg-bg-surface">
        <div className="p-4">
          <Button variant="outlined" onClick={() => setMended(true)}>
            Mend the part
          </Button>
        </div>
        <div className="flex flex-1 flex-col border-t border-border-subtle">
          <ErrorBoundary label="panel">
            <Part />
          </ErrorBoundary>
        </div>
      </div>
    )
  },
}
