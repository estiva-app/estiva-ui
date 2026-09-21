import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { Lightbox } from './Lightbox'

/** A drawn picture rather than a photograph, so the story needs no network. */
const svg = (w: number, h: number, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#0f1720"/>${body}</svg>`,
  )}`

const WIDE = svg(
  960,
  540,
  `<circle cx="240" cy="180" r="104" fill="#56c8ff"/><rect x="392" y="300" width="440" height="140" rx="24" fill="#4ade8c"/>`,
)

const TALL = svg(
  540,
  960,
  `<rect x="80" y="120" width="380" height="380" rx="32" fill="#b18cff"/><circle cx="270" cy="740" r="140" fill="#ffc94d"/>`,
)

const meta = {
  title: 'Overlays/Lightbox',
  component: Lightbox,
  parameters: {
    layout: 'fullscreen',
    // Portals a full-screen overlay to document.body — render in an iframe on
    // the Docs page so it does not cover the docs.
    docs: { story: { inline: false, height: '520px' } },
  },
  args: {
    src: WIDE,
    alt: 'checkout-flow.png',
    onClose: () => {},
  },
} satisfies Meta<typeof Lightbox>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A wide picture, as large as the screen allows and never larger: it is
 * contained, so nothing is cropped and nothing is stretched.
 */
export const APicture: Story = {}

/** A tall one in the same viewer — the height is what runs out first. */
export const ATallPicture: Story = { args: { src: TALL, alt: 'signup-screen.png' } }

/**
 * **Open it and close it**, which is the whole point of the part.
 *
 * Escape closes it, so does the ✕ and so does a press on the scrim — a press on
 * the picture does not. Focus is trapped while it is open and returns to the
 * button that opened it, which is what neither hand-built viewer did.
 */
export const OpenAndClose: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div className="flex h-screen items-center justify-center">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open the picture
        </Button>
        {open && <Lightbox {...args} onClose={() => setOpen(false)} />}
      </div>
    )
  },
}
