import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { EntryShell } from './EntryShell'

// A stand-in for an app's mark, at the 40px an app's logo badge is drawn at here.
const logo = (
  <div role="img" aria-label="Logo" className="flex size-10 items-center justify-center rounded-xl bg-accent-muted text-accent-text">
    <IconSquareRounded size={16} stroke={1.5} />
  </div>
)

const proceed = { label: 'Continue with passkey', onClick: () => {} }
const retry = { label: 'Try again', onClick: () => {} }

/**
 * Every state of the screen, one per reason entry can stop. The lines are the
 * ones the apps pass today, from `@estiva-app/identity`, so the lengths are
 * real; the package itself has no words of its own here.
 */
const meta = {
  title: 'Frame/EntryShell',
  component: EntryShell,
  parameters: { layout: 'fullscreen' },
  args: { logo },
  argTypes: { logo: { control: false } },
} satisfies Meta<typeof EntryShell>

export default meta
type Story = StoryObj<typeof meta>

/** The screen people see when nobody is signed in: the logo, the line, one button. */
export const NoSession: Story = {
  args: { message: 'Continue with your passkey to enter.', action: proceed },
}

/** Entry is being decided: the logo alone, pulsing, revealed after 150ms so a fast entry flashes nothing. */
export const Checking: Story = {
  args: { busy: true },
}

/** The second wait of the same entry, deliberately identical to Checking: two loading screens for one entry is the bug. */
export const Entering: Story = {
  args: { busy: true },
}

/** The sign-in ran out while the app was open. The same button, a line that says what happened. */
export const SessionExpired: Story = {
  args: { message: 'Your Estiva ID session ended. Continue with your passkey.', action: proceed },
}

/** A silent attempt came straight back; the app stops trying on its own and hands over. */
export const LoopGuard: Story = {
  args: { message: 'Continue with your passkey to enter.', action: proceed },
}

export const ExchangeFailed: Story = {
  args: { message: 'That sign-in did not complete. Try again.', action: retry },
}

export const Network: Story = {
  args: { message: 'Could not reach Estiva ID. Check your connection and try again.', action: retry },
}

export const Timeout: Story = {
  args: { message: 'Estiva ID did not answer in time. Try again.', action: retry },
}

/** Nothing the person can do would help, so no button: the longest line, wrapped at its width. */
export const TokenRejected: Story = {
  args: {
    message:
      'Signed in to Estiva ID, but this app could not verify the token. That is a configuration problem rather than an expired session — signing in again will not fix it.',
  },
}

/** Also no button: only an administrator can clear this one. */
export const IdentityInactive: Story = {
  args: { message: 'This identity is not active. An administrator needs to restore it.' },
}
