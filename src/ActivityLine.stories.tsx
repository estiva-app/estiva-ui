import type { Meta, StoryObj } from '@storybook/react-vite'
import { IconArrowBackUp, IconAt, IconMoodSmile } from '@tabler/icons-react'
import { ActivityLine } from './ActivityLine'
import { MenuSection } from './Menu'

const mark = { reply: <IconArrowBackUp size={16} stroke={1.5} />, mention: <IconAt size={16} stroke={1.5} className="text-accent-text" />, reaction: <IconMoodSmile size={16} stroke={1.5} /> }

const meta = {
  title: 'Conversation/ActivityLine',
  component: ActivityLine,
  args: { person: { name: 'Ana Duarte' }, did: 'replied to you', time: '2h', mark: mark.reply, where: 'Group one › Item one', words: 'The words someone wrote, cut to one line when there is no more room for them.' },
  argTypes: { mark: { control: false }, person: { control: false } },
  // A line sits in a list as wide as a card or a popover.
  render: (args) => (
    <div className="flex w-80 flex-col gap-0.5 rounded-lg bg-bg-elevated p-1">
      <ActivityLine {...args} />
    </div>
  ),
} satisfies Meta<typeof ActivityLine>

export default meta
type Story = StoryObj<typeof meta>

/** One line: the mark beside the first line, who and what, when; under it where and the words. Point at it: a fill, no edge. */
export const Default: Story = {}

/** Seen already, as an Earlier line: the name in the secondary text. */
export const Seen: Story = { args: { seen: true } }

/** Only the words, with no place named: a line on the place's own list. */
export const NoPlace: Story = { args: { where: undefined } }

/** A link: Cmd- or Ctrl-click opens a new tab. */
export const AsALink: Story = { args: { href: '#' } }

/** New and Earlier, each a menu section of lines, headings and lines on one edge, as a page's dot lists them. */
export const AList: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-1 rounded-lg bg-bg-elevated p-1">
      <MenuSection label="New">
        <ActivityLine person={{ name: 'Ana Duarte' }} did="mentioned you" time="5m" mark={mark.mention} words="Can you look at this before Friday?" />
        <ActivityLine person={{ name: 'Ravi Mehta' }} did="reacted 👍 to your message" time="1h" mark={mark.reaction} words="Item two is ready." />
      </MenuSection>
      <MenuSection label="Earlier">
        <ActivityLine person={{ name: 'Marta Silva' }} did="replied to you" time="Fri" mark={mark.reply} words="Agreed, let’s keep it." seen />
      </MenuSection>
    </div>
  ),
}
