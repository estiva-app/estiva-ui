import type { Meta, StoryObj } from '@storybook/react-vite'
import { InlineChip } from './InlineChip'
import { KindIcon, type ThingKind } from './KindIcon'
import { MenuItem, MenuPanel, MenuSection } from './Menu'

const meta = {
  title: 'Primitives/KindIcon',
  component: KindIcon,
  args: { kind: 'topic' },
  argTypes: { kind: { control: 'select', options: ['topic', 'project', 'issue', 'file', 'message'] } },
} satisfies Meta<typeof KindIcon>

export default meta
type Story = StoryObj<typeof meta>

const KINDS: { kind: ThingKind; name: string }[] = [
  { kind: 'topic', name: 'Topic' },
  { kind: 'project', name: 'Project' },
  { kind: 'issue', name: 'Issue' },
  { kind: 'file', name: 'Another app’s file' },
  { kind: 'message', name: 'Message' },
]

export const Default: Story = {}

/** Every kind, at 16px, beside its name. */
export const EveryKind: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-2 text-body-2 text-text-primary">
      {KINDS.map(({ kind, name }) => (
        <div key={kind} className="flex items-center gap-2">
          <KindIcon kind={kind} />
          {name}
        </div>
      ))}
    </div>
  ),
}

/** At 14px inside a chip, the way a sentence names a thing. */
export const InAChip: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <p className="text-body-2 text-text-primary">
      Tracked in <InlineChip icon={<KindIcon kind="issue" size={14} tone="inherit" />}>Ship the block model</InlineChip> and{' '}
      <InlineChip icon={<KindIcon kind="topic" size={14} tone="inherit" />}>Planning</InlineChip> for now.
    </p>
  ),
}

/** At the start of list rows, each saying what it points at. */
export const InAList: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-72">
      <MenuSection label="Files">
        {KINDS.map(({ kind, name }) => (
          <MenuItem key={kind} label={name} leading={<KindIcon kind={kind} />} onClick={() => {}} />
        ))}
      </MenuSection>
    </MenuPanel>
  ),
}
