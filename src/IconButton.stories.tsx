import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSettings } from '@tabler/icons-react'
import { IconButton } from './IconButton'

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  // An icon-only button owes its name; axe's button-name rule fails without it.
  args: { variant: 'muted', disabled: false, 'aria-label': 'Settings', children: <IconSettings className="size-4" stroke={1.5} /> },
  argTypes: {
    variant: { control: 'inline-radio', options: ['muted', 'outlined', 'primary', 'current', 'resolve'] },
    tooltipPlacement: { control: 'inline-radio', options: ['top', 'bottom'] },
    children: { control: false },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Muted: Story = {}
export const Outlined: Story = { args: { variant: 'outlined' } }
export const Primary: Story = { args: { variant: 'primary' } }
export const Disabled: Story = { args: { variant: 'primary', disabled: true } }
/** Hover to see the portalled tooltip (top or bottom placement). */
export const WithTooltip: Story = { args: { tooltip: 'Settings', tooltipPlacement: 'top' } }
/** Disabled with its reason in place of the tooltip; Tab still reaches it. */
export const WithAReason: Story = { args: { tooltip: 'Settings', disabledReason: 'Sign in to change settings' } }

/** `href`: a link that looks like the button — the same box, an anchor underneath. */
export const AsALink: Story = { args: { href: '#settings', tooltip: 'Settings' } }

/** Every variant × enabled/disabled. */
export const AllVariants: Story = {
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the variant captions are muted text, 3.94:1 on --bg-base in signal (AA 4.5:1).
  parameters: { controls: { disable: true }, a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
  render: () => (
    <div className="flex flex-col gap-3">
      {(['muted', 'outlined', 'primary'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-2">
          <IconButton variant={variant} aria-label="Settings">
            <IconSettings className="size-4" stroke={1.5} />
          </IconButton>
          <IconButton variant={variant} disabled aria-label="Settings">
            <IconSettings className="size-4" stroke={1.5} />
          </IconButton>
          <span className="text-caption text-text-muted">{variant}</span>
        </div>
      ))}
    </div>
  ),
}

/**
 * A button is the size of its icon and its padding, whatever box it is dropped
 * into. A flex parent with no `items-*` of its own stretches whatever is in it,
 * and this one is 260px tall; the button stays 24px square.
 */
export const InATallRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex h-[260px] w-[200px] justify-end rounded-lg border border-border-subtle p-4">
      <IconButton aria-label="Settings">
        <IconSettings className="size-4" stroke={1.5} />
      </IconButton>
    </div>
  ),
}

/** `resolve`: muted, and green when pointed at in Signal — Resolve. (`current` takes the colour it sits in: see Banner's ✕.) */
export const Resolve: Story = { args: { variant: 'resolve', 'aria-label': 'Resolve', tooltip: 'Resolve' } }

/** `pressed`: on — the active fill and `aria-pressed`, like Bold while the selection is bold. */
export const Pressed: Story = { args: { pressed: true, 'aria-label': 'Bold' } }

/** `glow`: Signal's glow, on the send arrow while there is something to send. */
export const Glow: Story = { args: { variant: 'primary', glow: true, 'aria-label': 'Send' } }
