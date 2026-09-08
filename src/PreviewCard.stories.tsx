import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'
import { MenuPanel } from './Menu'
import { PreviewCard } from './PreviewCard'
import { SkeletonBar } from './Skeleton'

/**
 * More of a thing, on hover. A row that is only a snippet gets a card beside
 * it with the rest — faces, text, whatever the caller draws.
 *
 * Not a **Tooltip**: a tooltip is a word for a control and cannot be pointed
 * at; this holds content and you can move into it. The canvas draws the
 * surface with `MenuPanel`, since a live card portals and places itself;
 * **`OnARow`** is the live one (Katerina, D25).
 */
const meta = {
  title: 'Overlays/PreviewCard',
  component: PreviewCard,
  decorators: [(Story) => <div className="flex min-h-[240px] w-full items-center justify-center"><Story /></div>],
  args: { content: null, children: null },
  argTypes: { content: { control: false }, children: { control: false } },
} satisfies Meta<typeof PreviewCard>

export default meta
type Story = StoryObj<typeof meta>

function Lines() {
  return (
    <>
      {[
        { name: 'Ana Duarte', when: '2h', text: 'The second pass is in — the numbers hold at the wider column.' },
        { name: 'Bruno Ferreira', when: '1h', text: 'Agreed. I would keep the divider though; it earns its line.' },
      ].map((r) => (
        <div key={r.name} className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Avatar size={16} name={r.name} alt={r.name} />
            <span className="text-[12px] font-medium leading-[1.3] text-text-primary">{r.name}</span>
            <span className="text-[11px] leading-[1.2] text-text-muted">{r.when}</span>
          </div>
          <span className="text-[12px] leading-[1.45] text-text-secondary">{r.text}</span>
        </div>
      ))}
    </>
  )
}

/** The card at rest — the surface and the kind of thing that goes in it. */
export const Default: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-[360px] gap-3 p-3">
      <Lines />
    </MenuPanel>
  ),
}

/** While the content is still arriving. A preview is a read, so it may wait. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MenuPanel className="w-[360px] gap-2 p-3">
      <SkeletonBar className="w-32" />
      <SkeletonBar className="w-full" />
      <SkeletonBar className="w-3/4" />
    </MenuPanel>
  ),
}

/** Live: rest the pointer on the row. The card opens after 350ms beside it,
 *  flips to the other side when that one has no room, and stays up while you
 *  cross into it. */
export const OnARow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <PreviewCard content={<Lines />} wrapperClassName="w-[320px]">
      <div className="flex w-full items-center gap-2 rounded-lg border border-border-default px-3 py-2 hover:bg-bg-hover">
        <Avatar size={20} name="Ana Duarte" alt="Ana Duarte" />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[140%] text-text-primary">
          The second pass is in — the numbers hold
        </span>
        <span className="text-[11px] leading-[1.2] text-text-muted">2h</span>
      </div>
    </PreviewCard>
  ),
}
