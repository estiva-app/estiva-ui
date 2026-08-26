import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSettings } from '@tabler/icons-react'
import { IconButton } from './IconButton'

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  args: { variant: 'muted', disabled: false, children: <IconSettings className="size-4" stroke={1.5} /> },
  argTypes: {
    variant: { control: 'inline-radio', options: ['muted', 'outlined', 'primary'] },
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

/** Every variant × enabled/disabled. */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3">
      {(['muted', 'outlined', 'primary'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-2">
          <IconButton variant={variant}>
            <IconSettings className="size-4" stroke={1.5} />
          </IconButton>
          <IconButton variant={variant} disabled>
            <IconSettings className="size-4" stroke={1.5} />
          </IconButton>
          <span className="text-[12px] leading-[120%] text-text-muted">{variant}</span>
        </div>
      ))}
    </div>
  ),
}
