import type { Meta, StoryObj } from '@storybook/react-vite'
import { AttachmentCard } from './AttachmentCard'

const svg = (w: number, h: number, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#0f1720"/>${body}</svg>`,
  )}`

/** Placeholder pictures — no real data in a story. */
const WIDE = svg(480, 270, `<circle cx="120" cy="90" r="52" fill="#56c8ff"/><rect x="196" y="150" width="220" height="70" rx="12" fill="#4ade8c"/>`)
const TALL = svg(270, 480, `<rect x="40" y="60" width="190" height="190" rx="16" fill="#b18cff"/><circle cx="135" cy="370" r="70" fill="#ffc94d"/>`)
const SHOT = svg(
  480,
  270,
  `<rect x="24" y="24" width="200" height="80" rx="10" fill="#56c8ff"/><rect x="24" y="128" width="320" height="26" rx="8" fill="#39414f"/><rect x="24" y="172" width="240" height="26" rx="8" fill="#39414f"/><circle cx="404" cy="196" r="46" fill="#4ade8c"/>`,
)

const noop = () => {}

const meta = {
  title: 'Components/AttachmentCard',
  component: AttachmentCard,
  parameters: { layout: 'padded' },
  args: { name: 'Q3-billing-summary.pdf', size: 2_412_000, href: 'https://example.com/f', onDownload: noop },
  argTypes: {
    state: { control: 'inline-radio', options: ['ready', 'loading', 'unreadable', 'uploading', 'failed', 'warning'] },
  },
} satisfies Meta<typeof AttachmentCard>

export default meta
type Story = StoryObj<typeof meta>

/** A document: a type tile, the name, and what it is. Hover it for the download control. */
export const Document: Story = {}

/** An image: its own picture, 180px wide, opening full screen on a click. */
export const Image: Story = { args: { name: 'checkout-flow.png', size: 840_000, contentType: 'image/png', src: WIDE, onOpen: noop, href: undefined } }

/** A tall picture keeps the card's height: it is cropped to fit, not stretched. */
export const TallImage: Story = { args: { name: 'signup-screen.png', size: 1_180_000, contentType: 'image/png', src: TALL, onOpen: noop, href: undefined } }

/** Without an address it is dimmed and opens nothing. */
export const WithoutAnAddress: Story = { args: { name: 'annual-report.pdf', size: 4_800_000, href: undefined, onDownload: undefined } }

/** Tabler's file-type icons at stroke 1.5. A type with no icon of its own lands on the plain file glyph rather than a wrong one. */
export const EveryType: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-2">
      {['proposal.pdf', 'contract.docx', 'forecast.xlsx', 'kickoff.pptx', 'export.csv', 'notes.txt', 'README.md', 'manifest.json', 'assets.zip', 'photo.heic'].map((name) => (
        <AttachmentCard key={name} name={name} size={300_000} href="https://example.com/f" onDownload={noop} />
      ))}
    </div>
  ),
}

/** A name longer than the card truncates, so every card in a row keeps the same two lines. The full name is on hover, because it is cut off. */
export const LongName: Story = { args: { name: '2026-Q3-billing-reconciliation-and-invoice-summary-FINAL-v4.xlsx', size: 3_100_000 } }

/** Several together, in one flow: images and rows are different widths on purpose. */
export const SeveralTogether: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-2">
      <AttachmentCard name="checkout-flow.png" size={840_000} contentType="image/png" src={WIDE} onOpen={noop} onDownload={noop} />
      <AttachmentCard name="Q3-billing-summary.pdf" size={2_412_000} href="https://example.com/f" onDownload={noop} />
      <AttachmentCard name="raw-events.csv" size={96_000} href="https://example.com/f" onDownload={noop} />
    </div>
  ),
}

/** An image on its way. */
export const Loading: Story = { args: { name: 'checkout-flow.png', contentType: 'image/png', state: 'loading', href: undefined } }

/** It could not be read: said, not left as a gap, with the dashed hairline every unreadable card has. */
export const Unreadable: Story = { args: { name: 'checkout-flow.png', contentType: 'image/png', state: 'unreadable', href: undefined } }

/** Waiting to be sent, and ready: its own thumbnail and its size. Hover it for the remove control. */
export const Pending: Story = {
  args: { pending: true, name: 'Screenshot 2026-09-07 14-32-05.png', size: 248_000, contentType: 'image/png', src: SHOT, onRemove: noop, href: undefined, onDownload: undefined },
}

/** Waiting to be sent: a document shows its type in the tile. */
export const PendingDocument: Story = { args: { ...Pending.args, name: 'Q3-billing-summary.pdf', contentType: 'application/pdf', size: 2_412_000, src: undefined } }

export const Uploading: Story = { args: { ...Pending.args, state: 'uploading', src: undefined } }

/** It could not be attached: the reason, in place of the size. */
export const Failed: Story = { args: { ...Pending.args, state: 'failed', name: 'Screenshot 2026-09-07 14-32-05.tiff', note: "TIFF files aren't supported.", src: undefined } }

/** Attached, with something the sender should know: a warning, not an error — nothing failed. The full words are on hover. */
export const Warning: Story = { args: { ...Pending.args, state: 'warning', note: 'Not everyone can see this', noteHint: 'Only this app has a copy of this file.' } }
