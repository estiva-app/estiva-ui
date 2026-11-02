import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { userEvent, within } from 'storybook/test'
import { EditableText, type EditableTextAnswer } from './EditableText'
import { FieldLine } from './Field'

const meta = {
  title: 'Forms & fields/EditableText',
  component: EditableText,
  args: {
    value: 'Team charter',
    placeholder: 'Add a title',
    label: 'Title',
    onCommit: (): EditableTextAnswer => true,
    className: 'text-body-1 font-medium',
  },
  argTypes: { onCommit: { control: false } },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof EditableText>

export default meta
type Story = StoryObj<typeof meta>

/** Click the text: it becomes a field. Enter commits, Escape cancels, blur commits. */
export const Title: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <EditableText
        {...args}
        value={value}
        onCommit={(next) => {
          setValue(next)
          return true
        }}
      />
    )
  },
}

/** Shift+Enter is a new line; Enter still commits. */
export const Multiline: Story = {
  args: {
    value: 'A longer piece of text.\nIt keeps its lines.',
    placeholder: 'Add a description',
    label: 'Description',
    multiline: true,
    className: 'text-body-2',
  },
}

/** Empty shows the placeholder, muted — still clickable. */
export const Empty: Story = {
  args: { value: '' },
  // axe color-contrast is off here until PLAN.md stage 0.10 is ruled:
  // the placeholder is muted text, 3.94:1 on --bg-base in signal (AA 4.5:1).
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}

/** For a reader who cannot write: the value alone, no edit affordance. */
export const ReadOnly: Story = { args: { readOnly: true } }

/**
 * A commit that resolves `false` keeps the field open with the text in it —
 * an edit is never silently lost. Try committing anything here.
 */
export const RefusedCommit: Story = {
  args: { onCommit: () => false },
}

const inADialogsWidth = (Story: () => React.ReactNode) => <div className="w-[522px]">{Story()}</div>
const NAME = {
  manner: 'buttons',
  value: 'Folders: Universal navigation concept',
  label: 'Name',
  placeholder: 'Untitled',
  editLabel: 'Rename',
  required: true,
  className: undefined,
} as const
const SUMMARY_TEXT = 'Where we work out how people move between Folders, files and apps, before the navigation rework starts.'
const SUMMARY = {
  manner: 'buttons',
  multiline: true,
  value: SUMMARY_TEXT,
  label: 'Summary',
  placeholder: 'No summary yet.',
  fieldPlaceholder: 'What is it for, in a sentence?',
  editLabel: 'Edit',
  addLabel: 'Add a summary',
  clean: (draft: string) => draft.replace(/\s+/g, ' ').trim(),
  className: undefined,
} as const

/** `buttons`: the text with Rename beside it. Rename opens a field with Save and Cancel; Enter saves, Escape abandons. */
export const ButtonsName: Story = {
  name: 'Buttons: a name',
  args: NAME,
  decorators: [inADialogsWidth],
}

/** `buttons`, opened as the field, holding the value: what a menu's Rename opens. */
export const ButtonsOpen: Story = {
  name: 'Buttons: open',
  args: { ...NAME, defaultEditing: true },
  decorators: [inADialogsWidth],
}

/** `buttons`, refused: the field stays with the text, and the reason is said under it. */
export const ButtonsRefused: Story = {
  name: 'Buttons: refused',
  args: { ...NAME, defaultEditing: true, onCommit: () => ({ kind: 'error', message: 'The relay refused the rename: relay_membership_required.' }) },
  decorators: [inADialogsWidth],
  play: async ({ canvasElement }) => {
    const name = within(canvasElement).getByRole('textbox', { name: 'Name' })
    await userEvent.type(name, ' two{Enter}')
  },
}

/** `buttons`, saved with a warning: the field closes, and the warning is said under the text. */
export const ButtonsWarning: Story = {
  name: 'Buttons: saved with a warning',
  args: { ...NAME, defaultEditing: true, onCommit: () => ({ kind: 'warning', message: 'Saved here; another app shows the old name until it reloads.' }) },
  decorators: [inADialogsWidth],
  play: ButtonsRefused.play,
}

/** `buttons` and `multiline`: the text wraps, Edit beside it; the field's Save and Cancel go under it. */
export const ButtonsSummary: Story = {
  name: 'Buttons: a summary',
  args: SUMMARY,
  decorators: [inADialogsWidth],
}

/** `buttons`, empty: the placeholder as the kit's empty line (12px, muted), and the add words with a plus. */
export const ButtonsEmpty: Story = {
  name: 'Buttons: empty',
  args: { ...SUMMARY, value: '' },
  decorators: [inADialogsWidth],
  parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } },
}

/** `buttons`, with a note under the field as it is typed: a count past 240. */
export const ButtonsNote: Story = {
  name: 'Buttons: a note while typing',
  args: {
    ...SUMMARY,
    defaultEditing: true,
    value: `${SUMMARY_TEXT} ${SUMMARY_TEXT} ${SUMMARY_TEXT}`,
    draftNote: (draft: string) =>
      draft.length > 240 ? <FieldLine tone="warning">{`${draft.length} characters. A summary reads best in one or two sentences, under 240.`}</FieldLine> : null,
  },
  decorators: [inADialogsWidth],
}

/** `buttons`, for a reader who cannot write: the text, and no button. */
export const ButtonsReadOnly: Story = {
  name: 'Buttons: read-only',
  args: { ...SUMMARY, readOnly: true },
  decorators: [inADialogsWidth],
}
