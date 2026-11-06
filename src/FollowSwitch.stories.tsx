import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { FollowSwitch, LevelIcon, type FollowChoice, type FollowLevel } from './FollowSwitch'

const meta = {
  title: 'People/FollowSwitch',
  component: FollowSwitch,
  args: { level: 'important', label: 'Item one', onChoose: () => {} },
} satisfies Meta<typeof FollowSwitch>

export default meta
type Story = StoryObj<typeof meta>

/** Following at Important: a dashed circle. Open it to pick another level. */
export const Important: Story = {}

/** Following at All: a full circle. */
export const All: Story = { args: { level: 'all' } }

/** Not following: a dashed circle with a plus, muted. */
export const NotFollowing: Story = { args: { level: undefined } }

/** Chose against a group's default: "Back to Group one’s default" is offered under the levels. */
export const AgainstADefault: Story = { args: { level: 'all', backTo: 'Group one' } }

/** A group's own place: people rather than circles. */
export const People: Story = { args: { level: 'important', people: true } }

/** No `onChoose`: it shows the level and cannot be changed. */
export const ReadOnly: Story = { args: { level: undefined, onChoose: undefined } }

/** Every icon, as a list draws them: Not following, Important and All, in circles and in people. */
export const Icons: Story = {
  render: () => (
    <div className="flex flex-col gap-3 text-text-secondary">
      {[false, true].map((people) => (
        <div key={String(people)} className="flex items-center gap-4">
          {([undefined, 'important', 'all'] as const).map((level) => (
            <LevelIcon key={level ?? 'off'} level={level} people={people} />
          ))}
        </div>
      ))}
    </div>
  ),
}

/** Live: pick a level and the icon follows. */
export const Live: Story = {
  render: (args) => {
    const [level, setLevel] = useState<FollowLevel | undefined>('important')
    const choose = (choice: FollowChoice) => setLevel(choice === 'off' ? undefined : choice === 'default' ? 'important' : choice)
    return <FollowSwitch {...args} level={level} onChoose={choose} />
  },
}
