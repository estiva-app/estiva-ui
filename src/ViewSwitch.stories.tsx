import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconFolders, IconLayoutGrid, IconLayoutList, IconMessages, IconSquareRounded } from '@tabler/icons-react'
import { EmptyState } from './EmptyState'
import { ListColumn } from './ListColumn'
import { ViewSwitch, type ViewSwitchOption } from './ViewSwitch'

/** Two or three views of one place, as icons in one box. Hover an icon for its name; the chosen one is pressed. */
const meta = {
  title: 'Navigation/ViewSwitch',
  component: ViewSwitch,
  args: { options: [], value: 'a', onChange: () => {} },
} satisfies Meta<typeof ViewSwitch>

export default meta
type Story = StoryObj<typeof meta>

function Demo<T extends string>({ options, initial }: { options: ViewSwitchOption<T>[]; initial: T }) {
  const [value, setValue] = useState<T>(initial)
  return <ViewSwitch options={options} value={value} onChange={setValue} />
}

const TWO: ViewSwitchOption<'one' | 'two'>[] = [
  { value: 'one', icon: <IconMessages size={16} stroke={1.5} />, label: 'View one' },
  { value: 'two', icon: <IconFolders size={16} stroke={1.5} />, label: 'View two' },
]

/** Two views. Click the other icon, or Tab in and use the arrow keys. */
export const Two: Story = { render: () => <Demo options={TWO} initial="one" /> }

/** Three views — the most it takes; more, or words, are Tabs. */
export const Three: Story = {
  render: () => (
    <Demo
      initial="list"
      options={[
        { value: 'list', icon: <IconLayoutList size={16} stroke={1.5} />, label: 'List' },
        { value: 'grid', icon: <IconLayoutGrid size={16} stroke={1.5} />, label: 'Grid' },
        { value: 'board', icon: <IconSquareRounded size={16} stroke={1.5} />, label: 'Board' },
      ]}
    />
  ),
}

/** Where it lives: a column's header, beside the actions. The title names the view that is showing. */
export const InAHeader: Story = {
  render: function Render() {
    const [value, setValue] = useState<'one' | 'two'>('one')
    return (
      <div className="flex h-64 bg-bg-surface">
        <ListColumn title={value === 'one' ? 'View one' : 'View two'} actions={<ViewSwitch options={TWO} value={value} onChange={setValue} />}>
          <EmptyState scope="section" message={value === 'one' ? 'The first view.' : 'The second view.'} />
        </ListColumn>
      </div>
    )
  },
}
