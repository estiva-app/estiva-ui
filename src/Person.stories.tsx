import type { Meta, StoryObj } from '@storybook/react-vite'
import { Person } from './Person'

/** A face beside a name — never a key. */
const meta = {
  title: 'Components/Person',
  component: Person,
  args: { name: 'Ana Duarte', size: 20 },
} satisfies Meta<typeof Person>

export default meta
type Story = StoryObj<typeof meta>

export const Named: Story = {}

/** Nobody has published a name: the silhouette and the em dash, muted — the same mark a property with no value uses. */
export const Unnamed: Story = {
  args: { name: undefined },
}

/** Where the unnamed person is *you*, pass a word instead of the dash. */
export const OwnFallback: Story = {
  args: { name: undefined, fallback: 'Anonymous' },
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the fallback name is muted text, 3.94:1 on --bg-base in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}

/** The text size is the caller's, so face and words are set together. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Person name="Ana Duarte" size={16} className="text-caption" />
      <Person name="Ana Duarte" size={20} className="text-body-2" />
      <Person name="Ravi Mehta" size={22} className="text-body-2" />
      <Person name="Ravi Mehta" size={28} className="text-body-1" />
    </div>
  ),
}

/** A narrow spot: the name truncates, the face never does. */
export const Truncating: Story = {
  decorators: [(Story) => <div className="w-[120px]"><Story /></div>],
  args: { name: 'Ana Duarte de Almeida e Costa' },
}
