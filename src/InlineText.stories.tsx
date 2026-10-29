import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { FieldLine } from './Field'
import { InlineText, type InlineTextHandle } from './InlineText'

/**
 * A page's title and the line under it, edited where they stand. Click into
 * either and type: no box, nothing moves. Enter saves and goes on down the
 * page; Escape or clicking away saves too.
 */
const meta = {
  title: 'Writing/InlineText',
  component: InlineText,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-[560px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InlineText>

export default meta
type Story = StoryObj

const LINE = 'A line of plain text under the title, saying in a sentence what this is about.'
const LONG = 'A line of plain text under the title that goes on for longer than a line should, so it wraps the way the text around it does and the reader sees all of it, without anything cut off at the edge or hidden behind a control.'

/** A title, the line under it, and the text below: Enter in the title goes to the line, Enter in the line goes to the text. */
function Page({ title = 'Item one', line = LINE, refuse = false, readOnly = false, heading = false }: { title?: string; line?: string; refuse?: boolean; readOnly?: boolean; heading?: boolean }) {
  const lineRef = useRef<InlineTextHandle>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [saved, setSaved] = useState({ title, line })
  const [refused, setRefused] = useState(false)
  return (
    <div className="flex flex-col">
      <InlineText
        variant={heading ? 'heading' : 'title'}
        label="Title"
        placeholder="Untitled"
        value={saved.title}
        readOnly={readOnly}
        onCommit={(next) => (setSaved((s) => ({ ...s, title: next })), true)}
        onEnter={() => lineRef.current?.focus('start')}
      />
      <InlineText
        ref={lineRef}
        variant="summary"
        label="Summary"
        placeholder="Add a line"
        clearable
        value={saved.line}
        readOnly={readOnly}
        onText={(text) => text !== null && setRefused(false)}
        onCommit={(next) => {
          if (refuse) {
            setRefused(true)
            return false
          }
          setSaved((s) => ({ ...s, line: next }))
          return true
        }}
        onEnter={() => textRef.current?.focus()}
      />
      {refused && <FieldLine tone="error">Not saved: the change was refused. Your text is still here.</FieldLine>}
      <p ref={textRef} tabIndex={-1} className="mt-4 text-body-1 text-text-primary outline-none">
        The text of the page starts here. Nothing above it moves while you write in the title or the line under it.
      </p>
    </div>
  )
}

export const Default: Story = { render: () => <Page /> }

/** A document's title, at the largest heading size: `variant="heading"`, as Leaf's file page draws it. */
export const DocumentHeading: Story = { render: () => <Page title="Document one" heading /> }

/** Nothing written yet: what each is for, muted, in its place. */
export const Empty: Story = { render: () => <Page title="" line="" /> }

/** A long line wraps like the text around it. */
export const Long: Story = { render: () => <Page line={LONG} /> }

/** The save is refused: the text stays where you wrote it, and the app says why under it. */
export const Refused: Story = { render: () => <Page refuse /> }

/** Someone who cannot change it: the same text, in the same place. */
export const ReadOnly: Story = { render: () => <Page readOnly /> }
