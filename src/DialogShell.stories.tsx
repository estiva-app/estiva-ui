import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import { Button } from './Button'
import { Chip } from './Chip'
import { DialogShell } from './DialogShell'
import { IconButton } from './IconButton'
import { Field } from './Field'
import { TextInput } from './TextInput'
import { Textarea } from './Textarea'

const meta = {
  title: 'Overlays/DialogShell',
  component: DialogShell,
  parameters: {
    layout: 'fullscreen',
    // Portals a fixed overlay to document.body — render in an iframe on the
    // Docs page so it doesn't escape over the docs content.
    docs: { story: { inline: false, height: '600px' } },
  },
  argTypes: { children: { control: false }, footer: { control: false } },
  args: { title: 'Dialog title', onClose: () => {} },
} satisfies Meta<typeof DialogShell>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The reusable dialog scaffold. A new dialog is just the header title, a body
 * (fields wrapped in `Field`), and a footer of buttons — the portal, backdrop,
 * card, and chrome all come from `DialogShell`.
 */
export const Default: Story = {
  args: {
    bodyClassName: 'flex flex-col gap-6',
    footer: (
      <>
        <Button variant="muted">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </>
    ),
    children: (
      <>
        <Field label="Title" required>
          <TextInput placeholder="What is this about?" />
        </Field>
        <Field label="Notes">
          <Textarea placeholder="Optional notes…" className="h-[80px]" />
        </Field>
      </>
    ),
  },
}

/**
 * **`headerContent` replaces the title text** — a back button beside it, a
 * count after it — and the ✕ stays. The dialog is then named by its `title`
 * anyway, since there is no longer a heading to point at.
 *
 * There used to be a `Confirmation` story here. It hand-built what
 * `ConfirmDialog` *is* — same question, same two buttons — and hand-built it
 * wrongly: a plain dialog, so a press on the backdrop dismissed the question,
 * which is exactly what D20 stopped. A story showing the thing the page's own
 * "When not" tells you not to build is worse than no story (Katerina,
 * 2026-09-08). These two show what this shell does that `ConfirmDialog`
 * cannot.
 */
export const WithHeaderContent: Story = {
  args: {
    headerContent: (
      <div className="flex items-center gap-2">
        <IconButton aria-label="Back" tooltip="Back">
          <IconArrowLeft size={16} stroke={1.5} />
        </IconButton>
        <span className="text-h4 text-text-primary">Item one</span>
        <Chip label="3" />
      </div>
    ),
    footer: (
      <>
        <Button variant="muted">Cancel</Button>
        <Button variant="primary">Save</Button>
      </>
    ),
    children: <p className="text-body-2 leading-[1.4] text-text-primary">The header is the caller's, and the ✕ is still the dialog's.</p>,
  },
}

/**
 * **No footer.** The body keeps the card's own bottom edge — a roster, a list,
 * anything that simply ends rather than asking a question. There is no divider
 * under the body either, because there is nothing to divide it from.
 */
export const WithoutAFooter: Story = {
  args: {
    title: 'Item one',
    footer: null,
    bodyClassName: 'flex flex-col gap-3',
    children: (
      <>
        {['Item one', 'Item two', 'Item three'].map((label) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-body-2 text-text-primary">{label}</span>
            <span className="text-caption text-text-secondary">Value</span>
          </div>
        ))}
      </>
    ),
  },
}

/**
 * Open it, then close it with the ✕, the backdrop, or Escape. Tab around while
 * it is open: focus cannot leave the card, and when the dialog closes it
 * returns to the button that opened it. Neither was true before stage 3.
 */
export const OpenAndClose: Story = {
  args: { footer: null, children: null },
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div className="flex h-screen items-center justify-center">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        {open && (
          <DialogShell
            {...args}
            onClose={() => setOpen(false)}
            footer={
              <>
                <Button variant="muted" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setOpen(false)}>
                  Confirm
                </Button>
              </>
            }
          >
            <p className="text-body-2 text-text-primary">Escape closes this too.</p>
          </DialogShell>
        )}
      </div>
    )
  },
}

/**
 * **A body that scrolls in the package's bar.** `bodyMaxHeight` is the cap;
 * without it the body grows to its content, as every dialog written before
 * 0.12.2 does. The bar is drawn over the padding rather than beside it, so the
 * text column keeps its width when the content overflows.
 */
export const ScrollingBody: Story = {
  args: {
    title: 'A long list',
    bodyMaxHeight: 'max-h-[240px]',
    bodyClassName: 'flex flex-col gap-2',
    footer: (
      <>
        <Button variant="muted">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </>
    ),
    children: (
      <>
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="text-body-2 text-text-primary">
            Item {i + 1}
          </span>
        ))}
      </>
    ),
  },
}
