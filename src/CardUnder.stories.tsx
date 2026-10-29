import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from './Button'
import { CardUnder } from './CardUnder'
import { ITEM, LOADING, ready, SAID, UNAVAILABLE } from './linked.examples'

const meta = {
  title: 'Links & references/CardUnder',
  component: CardUnder,
  parameters: { layout: 'padded' },
  args: { link: ready(ITEM) },
} satisfies Meta<typeof CardUnder>

export default meta
type Story = StoryObj<typeof meta>

/** Under a box being written in: the ✕ always shows. Press it to remove the card. */
export const WhileWriting: Story = {
  render: (args) => {
    const [removed, setRemoved] = useState(false)
    if (removed) return <Button onClick={() => setRemoved(false)}>Put it back</Button>
    return <CardUnder {...args} onRemove={() => setRemoved(true)} />
  },
}

/** Under text already sent: the ✕ shows on hover or focus, and always on a screen that cannot hover. */
export const AfterSending: Story = {
  render: (args) => {
    const [removed, setRemoved] = useState(false)
    if (removed) return <Button onClick={() => setRemoved(false)}>Put it back</Button>
    return <CardUnder {...args} revealOnHover onRemove={() => setRemoved(true)} />
  },
}

/** To anyone but who wrote it: no ✕. */
export const NoRemove: Story = {}

/** Words a person wrote, as the card. */
export const WordsAPersonWrote: Story = { args: { link: ready(SAID) }, render: (args) => <CardUnder {...args} onRemove={() => {}} /> }

/** Still being looked up: at the card's height, with its ✕. */
export const Loading: Story = { args: { link: LOADING }, render: (args) => <CardUnder {...args} onRemove={() => {}} /> }

/** Deleted, or not this reader's to see. */
export const NotAvailable: Story = { args: { link: UNAVAILABLE }, render: (args) => <CardUnder {...args} onRemove={() => {}} /> }
