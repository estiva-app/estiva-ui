import type { Meta, StoryObj } from '@storybook/react-vite'
import { Breadcrumb } from './Breadcrumb'

/** A trail of places, ending where you are — or on a mono ref. */
const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
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
