import type { Meta, StoryObj } from '@storybook/react-vite'
import { Banner } from './Banner'

const meta = {
  title: 'Feedback/Banner',
  component: Banner,
  parameters: { layout: 'fullscreen' },
  args: { tone: 'ok', children: 'Public key copied.' },
  argTypes: { tone: { control: 'inline-radio', options: ['ok', 'error', 'info', 'warning'] } },
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

export const Ok: Story = {}

/** An error announces itself (`role="alert"`); the rest are polite. */
export const Error: Story = { args: { tone: 'error', children: 'The last read failed — reconnecting.' } }

export const Info: Story = { args: { tone: 'info', children: 'A new version is available. Reload when convenient.' } }

export const Warning: Story = { args: { tone: 'warning', children: 'This workspace is read-only until sign-in.' } }

/** All four tones, stacked. */
export const AllTones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2">
      <Banner tone="ok">Public key copied.</Banner>
      <Banner tone="info">A new version is available. Reload when convenient.</Banner>
      <Banner tone="warning">This workspace is read-only until sign-in.</Banner>
      <Banner tone="error">The last read failed — reconnecting.</Banner>
    </div>
  ),
}
