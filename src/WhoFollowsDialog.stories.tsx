import type { Meta, StoryObj } from '@storybook/react-vite'
import { WhoFollowsDialog } from './WhoFollowsDialog'

const people = [
  { id: 'ana', label: 'Ana Duarte' },
  { id: 'ravi', label: 'Ravi Mehta' },
  { id: 'marta', label: 'Marta Silva' },
  { id: 'jonas', label: 'Jonas Weber' },
]

const meta = {
  title: 'People/WhoFollowsDialog',
  component: WhoFollowsDialog,
  args: {
    title: 'Item one',
    all: [{ id: 'ana', name: 'Ana Duarte', caption: 'Chose it' }],
    important: [
      { id: 'me', name: 'You', caption: 'In Group one' },
      { id: 'ravi', name: 'Ravi Mehta', caption: 'Added by Ana Duarte' },
    ],
    candidates: people,
    onAdd: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof WhoFollowsDialog>

export default meta
type Story = StoryObj<typeof meta>

/** All, then Important, each counted, and "Add someone" on top. */
export const Default: Story = {}

/** Nobody at All yet. */
export const NobodyAtAll: Story = { args: { all: [] } }

/** No `onAdd`: the list alone, with nobody to add from here. */
export const ListOnly: Story = { args: { onAdd: undefined } }

/** Opened from a menu's "Add someone…": straight on the add layer, whose back arrow returns to the list. */
export const Adding: Story = { args: { initialView: 'add' } }
