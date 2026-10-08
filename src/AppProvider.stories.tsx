import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { IconFolder, IconMessage } from '@tabler/icons-react'
import { AppProvider } from './AppProvider'
import { Link } from './Link'
import { MembersPill } from './MembersPill'
import { NavItem } from './NavItem'
import { Person } from './Person'

/** One picture the app "knows": Ana's. Inline, so the story needs nothing from anywhere. */
const ANA = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="%2346c08a"/><circle cx="5" cy="4" r="2" fill="%23fff"/></svg>'
const pictureFor = (name: string) => (name === 'Ana Duarte' ? ANA : undefined)

const meta = {
  title: 'Frame/AppProvider',
  component: AppProvider,
  args: { children: null },
  argTypes: { children: { control: false }, pictureFor: { control: false }, navigate: { control: false } },
} satisfies Meta<typeof AppProvider>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The app knows Ana's picture and nobody else's. No part below is handed a
 * picture: each face asks the app, and Ravi, whom it does not know, keeps
 * his initials.
 */
export const Pictures: Story = {
  render: () => (
    <AppProvider pictureFor={pictureFor}>
      <div className="flex flex-col items-start gap-3 text-body-2 text-text-primary">
        <Person name="Ana Duarte" />
        <Person name="Ravi Mehta" />
        <MembersPill members={[{ name: 'Ana Duarte' }, { name: 'Ravi Mehta' }]} onClick={() => {}} />
      </div>
    </AppProvider>
  ),
}

/**
 * A click on a row or a link goes through the app's `navigate`, and the page
 * is not loaded again. The line under them says where the last click went.
 */
export const ChangingPage: Story = {
  render: function ChangingPage() {
    const [at, setAt] = useState('/topics')
    return (
      <AppProvider navigate={setAt}>
        <div className="flex w-60 flex-col gap-px">
          <NavItem href="/topics" label="Topics" icon={<IconMessage size={16} stroke={1.5} />} active={at === '/topics'} />
          <NavItem href="/folders" label="Folders" icon={<IconFolder size={16} stroke={1.5} />} active={at === '/folders'} />
        </div>
        <p className="mt-3 text-body-2 text-text-secondary">
          <Link href="/people" variant="underlined">People</Link> · now at <span className="font-mono">{at}</span>
        </p>
      </AppProvider>
    )
  },
}
