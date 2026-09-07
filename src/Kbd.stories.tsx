import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kbd } from './Kbd'
import { MenuItem, MenuPanel, MenuSection } from './Menu'
import { Tooltip } from './Tooltip'

const meta = {
  title: 'Primitives/Kbd',
  component: Kbd,
  args: { children: 'Cmd+K' },
  argTypes: { children: { control: 'text' } },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** A single trigger character, the way a command menu names its own key. */
export const TriggerCharacter: Story = { args: { children: '/' } }

/** A chord. Whoever passes it decides the platform's spelling. */
export const Chord: Story = { args: { children: 'Ctrl+Alt+1' } }

/** A named key. */
export const NamedKey: Story = { args: { children: 'Esc' } }

/** The four side by side. */
export const Row: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-2">
      {['/', 'Cmd+K', 'Ctrl+Alt+1', 'Esc'].map((k) => (
        <Kbd key={k}>{k}</Kbd>
      ))}
    </div>
  ),
}

/** Where it appears on its own: a menu row's `shortcut`, and a tooltip's. */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-start gap-6">
      <MenuPanel className="w-[220px]">
        <MenuSection label="Format">
          <MenuItem label="Heading" shortcut="#" />
          <MenuItem label="Quote" shortcut=">" />
          <MenuItem label="Numbered list" shortcut="1." />
        </MenuSection>
      </MenuPanel>
      <div className="flex flex-col gap-2">
        <Tooltip label="Bold" shortcut="Cmd+B" />
        <Tooltip label="Italic" shortcut="Ctrl+I" />
        <Tooltip label="Comment" />
      </div>
    </div>
  ),
}
