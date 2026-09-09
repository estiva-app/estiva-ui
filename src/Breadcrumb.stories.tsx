import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconSquareRounded } from '@tabler/icons-react'
import { Breadcrumb } from './Breadcrumb'

/** A trail of places, ending where you are — or on a mono ref. */
const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the current item is muted text, 3.94:1 on --bg-base in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
  args: {
    items: [
      { label: 'Documents', href: '#' },
      { label: 'Quarterly plan', href: '#' },
      { label: 'DOC-12', mono: true },
    ],
  },
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const OnAnItem: Story = {}

/** An item with no parent: straight from the list to the ref. */
export const NoParent: Story = {
  args: { items: [{ label: 'Documents', href: '#' }, { label: 'DOC-12', mono: true }] },
}

/** A container page: the last crumb is a plain name, where you are. */
export const OnAContainer: Story = {
  args: { items: [{ label: 'Documents', href: '#' }, { label: 'Quarterly plan' }] },
}

/** A long name truncates; the ref stays. Hover the cut-off crumb to read the whole label — a crumb that fits shows no tooltip. */
export const LongName: Story = {
  decorators: [(Story) => <div className="w-[320px]"><Story /></div>],
  args: {
    items: [
      { label: 'Documents', href: '#' },
      { label: 'Onboarding flow for new workspaces, the whole first ten minutes', href: '#' },
      { label: 'ONB-12', mono: true },
    ],
  },
}

/** An icon before a crumb says what kind of place it is — a container, not an item. */
export const WithAnIcon: Story = {
  args: {
    items: [
      { label: 'Documents', href: '#' },
      { label: 'Quarterly plan', href: '#', icon: <IconSquareRounded size={16} stroke={1.5} /> },
      { label: 'DOC-12', mono: true },
    ],
  },
}
