import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconPlus } from '@tabler/icons-react'
import { Button } from './Button'

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Button', variant: 'muted', size: 'default', disabled: false },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'outlined', 'muted', 'destructive', 'resolve'] },
    size: { control: 'inline-radio', options: ['default', 'small'] },
    leadingIcon: { control: false },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { variant: 'primary' } }
export const Outlined: Story = { args: { variant: 'outlined' } }
export const Muted: Story = { args: { variant: 'muted' } }
/** The muted button in the error colour — for "Delete …" and its kind. Ship's addition. */
export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete project' } }
export const Small: Story = { args: { variant: 'primary', size: 'small' } }
export const WithLeadingIcon: Story = { args: { variant: 'primary', leadingIcon: <IconPlus stroke={1.5} className="size-4" /> } }
/** Disabled is for a control that is momentarily unavailable — say why, with `disabledReason`. A control someone may never use is absent, not disabled. */
export const Disabled: Story = { args: { variant: 'primary', disabled: true } }

/** Disabled with its reason: hover to read it; Tab still reaches the button. */
export const WithAReason: Story = { args: { variant: 'primary', disabledReason: 'Sign in to add items' } }

/** Every variant × size × icon × disabled combination on one canvas. */
/* The box it is dropped into cannot change its height: a Button states `h-8`
   (or `h-6` when small), and a stretching parent only stretches a child whose
   height is `auto`. The row below says no `items-*` at all, which is the box
   that drew an IconButton 228px tall — this stays 32. */
export const InATallRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex h-[260px] w-[240px] justify-center rounded-lg border border-border-subtle p-4">
      <Button variant="outlined">Button</Button>
    </div>
  ),
}

/* And the caller says where it sits. This column asks for the left; a Button
   carries no `align-self` of its own, so the left is what it gets. */
export const InAColumnThatAsksForTheLeft: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[240px] flex-col items-start gap-2 rounded-lg border border-border-subtle p-4">
      <Button variant="outlined" size="small">
        Copy link
      </Button>
      <Button variant="outlined" size="small">
        Pair with another Folder…
      </Button>
    </div>
  ),
}

export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {(['primary', 'outlined', 'muted', 'destructive'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          {(['default', 'small'] as const).map((size) => (
            <div key={size} className="flex items-center gap-2">
              <Button variant={variant} size={size}>
                Button
              </Button>
              <Button variant={variant} size={size} leadingIcon={<IconPlus stroke={1.5} className={size === 'small' ? 'size-3.5' : 'size-4'} />}>
                Button
              </Button>
              <Button variant={variant} size={size} disabled>
                Button
              </Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}

/** `resolve`: primary, and in Signal outlined at rest and green when pointed at — Resolve. */
export const Resolve: Story = { args: { variant: 'resolve', children: 'Resolve' } }
