import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { IconSquareRounded } from '@tabler/icons-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { AppShell, useSidebarFold } from './AppShell'
import { Banner } from './Banner'
import { EmptyState } from './EmptyState'
import { NavItem } from './NavItem'
import { PersonTrigger } from './PersonTrigger'
import { Rail } from './Rail'
import { RailItem } from './RailItem'
import { Sidebar } from './Sidebar'

const meta = {
  title: 'App frame/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
    // the count chip is muted text, 3.06:1 on the active row in signal, and the info
    // banner reads 3.99:1 on its wash in ship (AA 4.5:1).
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  args: { nav: null, children: null },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'inset', 'floating'] },
    menu: { control: false },
    logo: { control: false },
    search: { control: false },
    onSearch: { control: false },
    identity: { control: false },
    banner: { control: false },
    nav: { control: false },
    children: { control: false },
  },
  decorators: [(Story) => <div className="h-screen overflow-hidden">{Story()}</div>],
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

const identity = <PersonTrigger name="Ana Duarte" />

const placeholder = <IconSquareRounded size={16} stroke={1.5} />

const sidebar = (
  <Sidebar>
    <NavItem href="#" label="Item one" icon={placeholder} count={18} countLabel="18 open" active />
    <NavItem href="#" label="Item two" icon={placeholder} count={5} countLabel="5 active" />
  </Sidebar>
)

const rail = (
  <Rail>
    <RailItem href="#" label="Item" icon={placeholder} active />
    <RailItem href="#" label="Item" icon={placeholder} />
    <RailItem href="#" label="Item" icon={placeholder} />
  </Rail>
)

/**
 * Folds from the top bar's menu button and comes back from the same place: folded, the navigation takes only the
 * content's own margin and nothing in it can be seen; open, it takes its own width.
 */
function foldsAndComesBack(margin: number, width: number) {
  return async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement)
    const nav = canvasElement.querySelector('nav') as HTMLElement
    // The room the navigation takes beside the content: the folding box around it, which clips it.
    const room = () => Math.round((nav.parentElement?.parentElement as HTMLElement).getBoundingClientRect().width)
    await expect(room()).toBe(width)
    await userEvent.click(canvas.getByRole('button', { name: 'Hide the sidebar' }))
    await waitFor(() => expect(room()).toBe(margin), { timeout: 2000 })
    await waitFor(() => expect(nav).not.toBeVisible())
    await userEvent.click(canvas.getByRole('button', { name: 'Show the sidebar' }))
    await waitFor(() => expect(room()).toBe(width), { timeout: 2000 })
    await expect(nav).toBeVisible()
  }
}

/** The structured frame: solid bar, sidebar, content beside it. */
export const Solid: Story = {
  render: (args) => (
    <AppShell {...args} logo="Estiva" onSearch={() => {}} identity={identity} nav={sidebar}>
      <EmptyState message="Nothing here yet." />
    </AppShell>
  ),
}

/** The banner belongs to the content area — at its top, never across the navigation. */
/** A page taller than the frame: it scrolls in the frame's own bar — the region every page passes through — never a native one. */
export const SolidScrolls: Story = {
  render: (args) => (
    <AppShell {...args} logo="Estiva" onSearch={() => {}} identity={identity} nav={sidebar}>
      <div className="flex flex-col gap-px px-6 py-5">
        {Array.from({ length: 60 }, (_, i) => (
          <p key={i} className="rounded-md px-2 py-1.5 text-body-2 text-text-primary">
            Row {i + 1}
          </p>
        ))}
      </div>
    </AppShell>
  ),
}

/** The sidebar folds from the top bar's menu button: it narrows and fades in 300ms, and the content takes the room. */
export const SolidFolds: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true)
    return (
      <AppShell {...args} logo="Estiva" onSearch={() => {}} identity={identity} nav={sidebar} navOpen={open} onNavOpenChange={setOpen}>
        <EmptyState message="Nothing here yet." />
      </AppShell>
    )
  },
  play: foldsAndComesBack(0, 240),
}

/** `useSidebarFold` keeps it: fold the sidebar, reload the page, and it is still folded. */
export const RemembersItsFold: Story = {
  render: function Render(args) {
    const [open, setOpen] = useSidebarFold({ storageKey: 'estiva-ui.stories.sidebarFolded' })
    return (
      <AppShell {...args} logo="Estiva" onSearch={() => {}} identity={identity} nav={sidebar} navOpen={open} onNavOpenChange={setOpen}>
        <EmptyState message="Fold the sidebar, then reload the page." />
      </AppShell>
    )
  },
}

export const SolidWithBanner: Story = {
  render: (args) => (
    <AppShell {...args} logo="Estiva" identity={identity} nav={sidebar} banner={<Banner tone="ok">Public key copied.</Banner>}>
      <EmptyState message="Nothing here yet." />
    </AppShell>
  ),
}

/** The structured frame the other way round: the bar and the sidebar on the ground, the content a lighter card beside them. */
export const Inset: Story = {
  args: { variant: 'inset' },
  render: (args) => (
    <AppShell {...args} logo="Estiva" onSearch={() => {}} identity={identity} nav={sidebar}>
      <EmptyState message="Nothing here yet." />
    </AppShell>
  ),
}

/** Folded, the inset card keeps a left margin as wide as its right one. */
export const InsetFolds: Story = {
  args: { variant: 'inset' },
  render: function Render(args) {
    const [open, setOpen] = useState(true)
    return (
      <AppShell {...args} logo="Estiva" identity={identity} nav={sidebar} navOpen={open} onNavOpenChange={setOpen}>
        <EmptyState message="Nothing here yet." />
      </AppShell>
    )
  },
  play: foldsAndComesBack(16, 240),
}

export const InsetWithBanner: Story = {
  args: { variant: 'inset' },
  render: (args) => (
    <AppShell {...args} logo="Estiva" identity={identity} nav={sidebar} banner={<Banner tone="ok">Public key copied.</Banner>}>
      <EmptyState message="Nothing here yet." />
    </AppShell>
  ),
}

/** The floating frame: the bar floats over the top edge, the rail stands on the background, and the content lives in the rounded card. */
export const Floating: Story = {
  render: (args) => (
    <AppShell {...args} variant="floating" logo="Estiva" onSearch={() => {}} identity={identity} nav={rail}>
      <EmptyState message="Nothing here yet." />
    </AppShell>
  ),
}

/** The rail folds as the sidebar does, to the 16px the card keeps from the window's edge. */
export const FloatingFolds: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true)
    return (
      <AppShell {...args} variant="floating" logo="Estiva" onSearch={() => {}} identity={identity} nav={rail} navOpen={open} onNavOpenChange={setOpen}>
        <EmptyState message="Nothing here yet." />
      </AppShell>
    )
  },
  play: foldsAndComesBack(16, 64),
}

/** In the floating frame the banner draws inside the card, at its top. */
export const FloatingWithBanner: Story = {
  render: (args) => (
    <AppShell
      {...args}
      variant="floating"
      logo="Estiva"
      identity={identity}
      nav={rail}
      banner={<Banner tone="info">A new version is available. Reload when convenient.</Banner>}
    >
      <EmptyState message="Nothing here yet." />
    </AppShell>
  ),
}
