import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { AttachedCard } from './AttachedCard'
import { Button } from './Button'
import { ITEM, LOADING, ready, SAID, UNAVAILABLE } from './linked.examples'

const meta = {
  title: 'Links & references/AttachedCard',
  component: AttachedCard,
  parameters: { layout: 'padded' },
  args: { link: ready(ITEM) },
} satisfies Meta<typeof AttachedCard>

export default meta
type Story = StoryObj<typeof meta>

/** To who wrote it: the round ✕ shows when you point at the card, as a file's does, and always on a screen that cannot hover. Press it to remove the card. */
export const WithRemove: Story = {
  render: (args) => {
    const [removed, setRemoved] = useState(false)
    if (removed) return <Button onClick={() => setRemoved(false)}>Put it back</Button>
    return <AttachedCard {...args} onRemove={() => setRemoved(true)} />
  },
}

/** To anyone but who wrote it: no ✕. */
export const NoRemove: Story = {}

/** Words a person wrote, as the card. */
export const WordsAPersonWrote: Story = { args: { link: ready(SAID) }, render: (args) => <AttachedCard {...args} onRemove={() => {}} /> }

/** Still being looked up: at the card's height, with its ✕. */
export const Loading: Story = { args: { link: LOADING }, render: (args) => <AttachedCard {...args} onRemove={() => {}} /> }

/** Deleted, or not this reader's to see. */
export const NotAvailable: Story = { args: { link: UNAVAILABLE }, render: (args) => <AttachedCard {...args} onRemove={() => {}} /> }
