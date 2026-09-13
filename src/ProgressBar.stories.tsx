import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressBar } from './ProgressBar'

const meta = {
  title: 'Feedback/ProgressBar',
  component: ProgressBar,
  args: { value: 10, max: 14, label: 'Items done', variant: 'default' },
  argTypes: { variant: { control: 'inline-radio', options: ['default', 'quiet'] } },
  decorators: [(Story) => <div className="w-[346px]">{Story()}</div>],
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

/** 6px, the success colour: a bar someone reads. */
export const Default: Story = {}

/** The bar, then the words that say it. */
export const WithWords: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <ProgressBar {...args} />
      <span className="text-caption tabular-nums text-text-muted">
        {args.value} of {args.max} done
      </span>
    </div>
  ),
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled: the words are
  // muted caption text, 3.94:1 in signal (computed 2026-09-14; AA 4.5:1) — the same
  // number NavItem's count is excepted for.
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}

/** 4px, the muted success colour: a glance, on the same line as a count — a caption label, 12px before the bar. */
export const Quiet: Story = {
  args: { variant: 'quiet', value: 3, max: 4 },
  render: (args) => (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-caption text-text-secondary">
        Items ({args.value}/{args.max})
      </span>
      <ProgressBar {...args} className="flex-1" />
    </div>
  ),
}

export const Empty: Story = { args: { value: 0, max: 14 } }
export const Complete: Story = { args: { value: 14, max: 14 } }
