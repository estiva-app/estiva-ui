import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconLock } from '@tabler/icons-react'
import { Tabs, type TabDef } from './Tabs'

/** A row of tabs; the selected one is a neutral fill, never the accent tint. */
const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

function Demo<T extends string>({ tabs, size, initial }: { tabs: TabDef<T>[]; size?: 'default' | 'small'; initial: T }) {
  const [active, setActive] = useState<T>(initial)
  return <Tabs tabs={tabs} active={active} onChange={setActive} size={size} />
}

/** A count is the sidebar's number — mono, muted, tabular — not a chip (Katerina, 2026-09-01). */
export const WithCounts: Story = {
  args: { tabs: [], active: 'active', onChange: () => {} },
  render: () => (
    <Demo
      initial="active"
      tabs={[
        { id: 'active', label: 'Active', count: 5 },
        { id: 'archived', label: 'Archived', count: 2 },
      ]}
    />
  ),
}

/** A count of 0 is still drawn — "Assigned to me 0" is an answer, not an absence. */
export const WithAZero: Story = {
  args: { tabs: [], active: 'all', onChange: () => {} },
  render: () => (
    <Demo
      initial="all"
      tabs={[
        { id: 'all', label: 'All', count: 31 },
        { id: 'open', label: 'Open', count: 21 },
        { id: 'mine', label: 'Assigned to me', count: 0 },
      ]}
    />
  ),
}

/** A plain pair — a view switch. */
export const NoCounts: Story = {
  args: { tabs: [], active: 'table', onChange: () => {} },
  render: () => (
    <Demo
      initial="table"
      tabs={[
        { id: 'table', label: 'Table' },
        { id: 'board', label: 'Board' },
      ]}
    />
  ),
}

/** A leading icon, 16px stroke 1.5 — as Peek draws them. */
export const WithAnIcon: Story = {
  args: { tabs: [], active: 'open', onChange: () => {} },
  render: () => (
    <Demo
      initial="open"
      tabs={[
        { id: 'open', label: 'Open' },
        { id: 'locked', label: 'Locked', icon: <IconLock size={16} stroke={1.5} /> },
      ]}
    />
  ),
}

/** `small` is Peek's TopicTabs geometry, 12px. */
export const Small: Story = {
  args: { tabs: [], active: 'conversations', onChange: () => {} },
  render: () => (
    <Demo
      size="small"
      initial="conversations"
      tabs={[
        { id: 'conversations', label: 'Conversations' },
        { id: 'huddles', label: 'Huddles', icon: <IconLock size={16} stroke={1.5} /> },
        { id: 'timeline', label: 'Timeline' },
      ]}
    />
  ),
}
