import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'

/** A picture, or initials on the person's own colour, or a silhouette. Nothing here comes from an app. */
const meta = {
  title: 'Primitives/Avatar',
  component: Avatar,
  args: { name: 'Ana Duarte', size: 36 },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

/** Two words, two letters, on a colour chosen from the name. */
export const Initials: Story = {}

/** No name, no picture: the silhouette. Never a key, never a `?`. */
export const Unnamed: Story = { args: { name: undefined } }

/** A picture — here an inline SVG, so the story needs nothing from anywhere. */
export const WithPicture: Story = {
  args: {
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="%2346c08a"/><circle cx="5" cy="4" r="2" fill="%23fff"/></svg>',
  },
}

/** A picture that fails to load falls back to the initials, not a hole. */
export const BrokenPicture: Story = { args: { src: 'http://localhost:1/nothing-here.png' } }

/** Peek's size scale, plus the smaller ones Ship uses in rows and menus. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="flex items-end gap-3">
      {[16, 20, 22, 24, 28, 32, 36].map((size) => (
        <div key={size} className="flex flex-col items-center gap-1">
          <Avatar {...args} size={size} />
          <span className="text-[12px] leading-[120%] text-text-muted">{size}</span>
        </div>
      ))}
    </div>
  ),
}

/** The same eight people always get the same eight colours. */
export const Palette: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex gap-2">
      {['Ana Duarte', 'Ravi Mehta', 'Mara Sato', 'Jonas Weber', 'Lin Chen', 'Sofia Rossi', 'Tomás Silva', 'Aiko Tanaka'].map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </div>
  ),
}
