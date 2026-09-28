import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link } from './Link'
import { Card } from './Card'
import { Chip } from './Chip'

const meta = {
  title: 'Navigation/Link',
  component: Link,
  args: { href: '#', variant: 'text', external: false, children: 'a link' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['text', 'quiet', 'underlined', 'plain'] },
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

/** Inside written text: the info colour, always underlined. Hover dims it. */
export const Text: Story = {
  render: (args) => (
    <p className="max-w-[480px] text-body-2 text-text-primary">
      A sentence can hold <Link {...args} /> in the middle of it, and the words around it read on.
    </p>
  ),
}

/** A title, or a small time, that is also a link: it keeps its text's colour and size, and underlines on hover. */
export const Quiet: Story = {
  args: { variant: 'quiet', children: 'Item one' },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <p className="text-body-2 font-semibold text-text-primary">
        <Link {...args} />
      </p>
      <p className="text-caption text-text-secondary">
        <Link {...args}>2:14 PM</Link>
      </p>
    </div>
  ),
}

/** Beside a note, a short way to open the thing somewhere else: the note's colour, always underlined. Hover brightens it. */
export const Underlined: Story = {
  args: { variant: 'underlined', external: true, children: 'Open it there ↗' },
  render: (args) => (
    <p className="max-w-[480px] text-caption text-text-secondary">
      This can’t be shown here. <Link {...args} />
    </p>
  ),
}

/** No look of its own: what it wraps draws itself — a box, a row. */
export const Plain: Story = {
  args: { variant: 'plain', children: undefined },
  render: (args) => (
    <Link {...args} className="block w-[280px]">
      <Card hover="hairline" className="p-3"><div className="text-body-2 text-text-primary">
        Item one
      </div></Card>
    </Link>
  ),
}

/** Another site or app: a new tab, and `noopener noreferrer`. It looks the same; the difference is where it opens. */
export const External: Story = {
  args: { external: true, children: 'a page elsewhere' },
  render: (args) => (
    <p className="max-w-[480px] text-body-2 text-text-primary">
      Read <Link {...args} /> in a new tab.
    </p>
  ),
}

const ROWS = [
  { key: 'A-1', title: 'Item one', group: 'Group', time: '2h' },
  { key: 'A-2', title: 'Item two', group: 'Group', time: '1d' },
  { key: 'A-3', title: 'Item three', time: '3d' },
]

/**
 * A row that is one link: click anywhere on it, or Tab to it and the ring goes
 * round the whole row. The chip is a second link, and opens something else.
 */
export const Cover: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-full max-w-xl flex-col">
      {ROWS.map((row) => (
        <div key={row.key} className="relative flex h-9 items-center gap-3 rounded-md px-3 transition-colors hover:bg-bg-hover">
          <Link href="#" variant="plain" cover className="flex min-w-0 flex-1 items-center gap-3">
            <span className="w-10 shrink-0 font-mono text-caption text-text-muted">{row.key}</span>
            <span className="min-w-0 flex-1 truncate text-body-2 text-text-primary">{row.title}</span>
          </Link>
          {row.group && <Chip href="#" label={row.group} />}
          <span className="w-8 shrink-0 text-right text-caption text-text-muted">{row.time}</span>
        </div>
      ))}
    </div>
  ),
}

/** The same in a table: the row is `relative`, the title a `quiet` link that covers it. */
export const CoverInTable: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <table className="w-full max-w-xl text-body-2">
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.key} className="relative border-b border-border-subtle last:border-b-0 hover:bg-bg-hover">
            <td className="w-14 px-3 py-2 font-mono text-caption text-text-muted">{row.key}</td>
            <td className="px-3 py-2 text-text-primary">
              <Link href="#" variant="quiet" cover>{row.title}</Link>
            </td>
            <td className="w-16 px-3 py-2 text-right text-caption text-text-muted">{row.time}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}

/** The four looks, each where it belongs. */
export const AllVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-[480px] flex-col gap-4">
      <p className="text-body-2 text-text-primary">
        <span className="text-text-secondary">text — </span>a sentence with <Link href="#">a link</Link> in it.
      </p>
      <p className="text-body-2 font-semibold text-text-primary">
        <span className="font-normal text-text-secondary">quiet — </span>
        <Link href="#" variant="quiet">
          Item one
        </Link>
      </p>
      <p className="text-caption text-text-secondary">
        underlined — This can’t be shown here.{' '}
        <Link href="#" variant="underlined" external>
          Open it there ↗
        </Link>
      </p>
      <div className="flex flex-col gap-1">
        <span className="text-body-2 text-text-secondary">plain —</span>
        <Link href="#" variant="plain" className="block w-[280px]">
          <Card hover="hairline" className="p-3"><div className="text-body-2 text-text-primary">
            Item one
          </div></Card>
        </Link>
      </div>
    </div>
  ),
}

/** `truncate`: a title that is a link, on one line. Its size and colour come from the box around it. */
export const Truncate: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-[200px] text-body-2 text-text-primary">
      <Link href="#" variant="quiet" truncate className="block">
        Assignee avatar and full name is missing in the files panel
      </Link>
    </div>
  ),
}
