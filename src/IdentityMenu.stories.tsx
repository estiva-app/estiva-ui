import type { Meta, StoryObj } from '@storybook/react-vite'
import { IdentityPanel } from './IdentityMenu'

/**
 * The menu itself, standing in flow (`static` beats the anchoring, as the
 * Menu stories do it) — no trigger, no bar chrome: the trigger's shapes are
 * PersonTrigger's own stories. In an app, `IdentityMenu` bundles that
 * trigger with this panel.
 */
const meta = {
  title: 'Navigation/IdentityMenu',
  component: IdentityPanel,
  args: {
    me: {},
    signedIn: false,
    relayUrl: 'http://localhost:3000',
    onCopyKey: () => {},
    onSignOut: () => {},
    onClose: () => {},
    className: 'static',
  },
  argTypes: { onClose: { control: false }, className: { control: false } },
} satisfies Meta<typeof IdentityPanel>

export default meta
type Story = StoryObj<typeof meta>

/** A browser-held key: silhouette, "Acting as", and the honest sentence. */
export const Anonymous: Story = {}

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
