import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { userEvent, within } from 'storybook/test'
import { AttachedCard } from './AttachedCard'
import { Button } from './Button'
import { CornerMenu, type CornerMenuLook } from './CornerMenu'
import { LinkRow } from './LinkRow'
import { ITEM, ITEM_NO_SUMMARY, ready } from './linked.examples'

const meta = {
  title: 'Links & references/CornerMenu',
  component: CornerMenu,
  parameters: { layout: 'padded' },
  args: { children: null },
} satisfies Meta<typeof CornerMenu>

export default meta
type Story = StoryObj<typeof meta>

/** One item, a row or a card as its menu says, and gone once removed. */
function Item({ start, linked }: { start: CornerMenuLook; linked: typeof ITEM }) {
  const [look, setLook] = useState(start)
  const [removed, setRemoved] = useState(false)
  if (removed) return <Button onClick={() => setRemoved(false)}>Put it back</Button>
  const link = ready(linked)
  return (
    <CornerMenu menu={{ name: linked.title, look, onLook: setLook, onRemove: () => setRemoved(true) }}>
      {look === 'card' ? <AttachedCard link={link} /> : <LinkRow link={link} />}
    </CornerMenu>
  )
}

/** A card and a row in one list: point at either and its "…" shows over its top-right corner, taking no room. Show as Row or Card changes it; Remove takes it off. */
export const CardAndRow: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Item start="card" linked={ITEM} />
      <Item start="row" linked={ITEM_NO_SUMMARY} />
    </div>
  ),
}

/** The menu open on a card: Show as, the look in use selected, then Remove. */
export const Open: Story = {
  render: () => (
    <div className="h-96">
      <Item start="card" linked={ITEM} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: `More options for ${ITEM.title}` }))
  },
}

/** Where the person cannot arrange the list: no `menu`, no "…". */
export const NoMenu: Story = {
  render: () => (
    <CornerMenu>
      <AttachedCard link={ready(ITEM)} />
    </CornerMenu>
  ),
}
