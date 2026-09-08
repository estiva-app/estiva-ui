import type { Meta, StoryObj } from '@storybook/react-vite'
import { IdentityMenu, IdentityPanelSurface } from './IdentityMenu'

/**
 * The panel itself — no trigger, no bar chrome: the trigger's shapes are
 * PersonTrigger's own stories. In an app, `IdentityMenu` bundles that
 * trigger with this panel.
 *
 * Drawn here on a `MenuPanel`, the menu's surface without its behaviour: a
 * real menu portals and places itself against a trigger, so it cannot stand
 * in a docs page, and the canvas must still show the artifact (Katerina,
 * D25). The rows are the same ones the app gets.
 *
 * Since stage 4 the live panel is a Base UI `Menu`: **the arrow keys walk
 * the actions and step over the identity block, the workspace line and the
 * notes** (Katerina, D22). Those sections are `Menu.Group`s with the heading
 * as their label, so they are announced as named groups rather than as menu
 * items that are not items.
 */
const meta = {
  title: 'Navigation/IdentityMenu',
  component: IdentityPanelSurface,
  args: {
    me: {},
    signedIn: false,
    relayUrl: 'http://localhost:3000',
    onCopyKey: () => {},
    onSignOut: () => {},
    onClose: () => {},
  },
  argTypes: { onClose: { control: false }, className: { control: false } },
} satisfies Meta<typeof IdentityPanelSurface>

export default meta
type Story = StoryObj<typeof meta>

/** A browser-held key: silhouette, "Acting as", and the honest sentence. */
export const Anonymous: Story = {
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the fallback name is muted text, 3.50:1 on --bg-elevated in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}

/** Signed in through Estiva ID, in a build that offers sign-in. */
export const SignedIn: Story = {
  args: {
    me: { name: 'Ana Duarte', email: 'ana@example.com' },
    signedIn: true,
    idBase: 'https://id.estiva.app',
  },
}

/**
 * An app that cannot name a relay or supply a key: those pieces simply are
 * not there — only offer actions that can succeed.
 */
export const MinimalApp: Story = {
  args: {
    me: { name: 'Ana Duarte' },
    signedIn: true,
    idBase: 'https://id.estiva.app',
    relayUrl: undefined,
    onCopyKey: undefined,
  },
}

/**
 * The whole thing, live: the trigger in the top bar and the menu it opens.
 * Click the face, then try the keyboard — ↑ and ↓ walk **the actions only**,
 * stepping over the identity block, the workspace line and the notes (D22);
 * Escape closes it and gives focus back to the trigger.
 */
export const FromItsTrigger: Story = {
  parameters: { controls: { disable: true }, layout: 'padded' },
  render: () => (
    /* A top bar, and room under it for the panel: 288 x ~380. `items-center`
       is how both apps lay their bar out. */
    <div className="h-[560px] w-full">
      <div className="flex h-12 items-center justify-end border-b border-border-subtle px-4">
      <IdentityMenu
        me={{ name: 'Ana Duarte', email: 'ana@example.com' }}
        signedIn
        idBase="https://id.estiva.app"
        relayUrl="http://localhost:3000"
        onCopyKey={() => {}}
        onSignOut={() => {}}
      />
      </div>
    </div>
  ),
}
