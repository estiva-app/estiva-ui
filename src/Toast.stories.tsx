import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Toast, ToastProvider, useToast } from './Toast'

/** The pill that confirms something happened. Positioning and auto-dismiss live in ToastProvider. */
const meta = {
  title: 'Feedback/Toast',
  component: Toast,
  args: {
    label: 'Changes saved',
    type: 'neutral',
    leadingIcon: true,
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['success', 'brand', 'neutral', 'warning'] },
    onAction: { control: false },
  },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}

export const Success: Story = {
  args: { type: 'success', label: 'Upload complete' },
}

export const Brand: Story = {
  args: { type: 'brand', label: 'Session started' },
}

/** Something that needs saying rather than celebrating — usually with `durationMs: 0` and a Dismiss, because a warning that fades takes itself with it. */
export const Warning: Story = {
  args: { type: 'warning', label: 'Not everything went through' },
}

/** With a right-side action. */
export const WithAction: Story = {
  args: {
    type: 'neutral',
    label: 'Item removed',
    actionLabel: 'Undo',
    onAction: () => {},
  },
}

export const NoIcon: Story = {
  args: { leadingIcon: false, label: 'Copied to clipboard' },
}

/** All four surfaces, with and without an action. */
export const AllTypes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-start gap-2">
      {(['success', 'brand', 'neutral', 'warning'] as const).map((type) => (
        <div key={type} className="flex items-center gap-2">
          <Toast type={type} label="Changes saved" />
          <Toast type={type} label="Changes saved" actionLabel="Undo" onAction={() => {}} />
        </div>
      ))}
    </div>
  ),
}

function ProviderDemo() {
  const { showToast } = useToast()
  return (
    <div className="flex items-center gap-2">
      <Button variant="muted" onClick={() => showToast({ label: 'Changes saved' })}>
        Show a toast
      </Button>
      <Button
        variant="muted"
        onClick={() => showToast({ label: 'Item removed', actionLabel: 'Undo', onAction: () => {} })}
      >
        With an action
      </Button>
    </div>
  )
}

/** The provider in motion: bottom-left, gone after 5 s, a new toast replaces the standing one. */
export const FromTheProvider: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ToastProvider>
      <ProviderDemo />
    </ToastProvider>
  ),
}
