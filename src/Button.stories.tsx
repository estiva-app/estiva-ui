import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconPlus } from '@tabler/icons-react'
import { Button } from './Button'

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Button', variant: 'muted', size: 'default', disabled: false },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'outlined', 'muted', 'destructive'] },
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
/** Disabled is for a control that is momentarily unavailable — say why, with a tooltip. A control someone may never use is absent, not disabled. */
export const Disabled: Story = { args: { variant: 'primary', disabled: true } }

/** Every variant × size × icon × disabled combination on one canvas. */
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
