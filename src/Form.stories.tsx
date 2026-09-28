import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { Button } from './Button'
import { Field } from './Field'
import { Form } from './Form'
import { TextInput } from './TextInput'
import { Textarea } from './Textarea'

const meta = {
  title: 'Inputs/Form',
  component: Form,
  parameters: { layout: 'padded' },
  args: { onSubmit: fn(), busy: false, 'aria-label': 'Example', children: null },
  argTypes: { children: { control: false }, onSubmit: { control: false } },
  decorators: [(Story) => <div className="w-96"><Story /></div>],
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

const fields = (error?: string) => (
  <>
    <Field label="Label" required>
      <TextInput placeholder="Placeholder" />
    </Field>
    <Field label="Label" error={error}>
      <Textarea placeholder="Placeholder" className="h-20" />
    </Field>
    <div className="flex justify-end">
      <Button variant="primary" type="submit">
        Send
      </Button>
    </div>
  </>
)

/** A list of fields: the form stacks them 24px apart itself. */
export const Default: Story = { render: (args) => <Form {...args}>{fields()}</Form> }

/** Sending: every field and button inside is switched off at once. */
export const Busy: Story = { args: { busy: true }, render: (args) => <Form {...args}>{fields()}</Form> }

/** A field showing its error. The form does not send while it shows. */
export const WithError: Story = { render: (args) => <Form {...args}>{fields('That is not a valid value.')}</Form> }

/**
 * **`layout="free"`**: a form that is not a list of fields, here a field and
 * its button, places nothing, and lays itself out through `className`.
 */
export const Free: Story = {
  args: { layout: 'free', className: 'flex items-center gap-2' },
  render: (args) => (
    <Form {...args}>
      <TextInput placeholder="Add a name" aria-label="Name" className="min-w-0 flex-1" />
      <Button variant="primary" type="submit">
        Add
      </Button>
    </Form>
  ),
}

/**
 * Live. Press Enter in the first field, or Send: the form is busy for a
 * second and a half, and focus comes back to where it was.
 */
export const WhileSending: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const [busy, setBusy] = useState(false)
    return (
      <Form
        {...args}
        busy={busy}
        onSubmit={async () => {
          setBusy(true)
          await new Promise((resolve) => setTimeout(resolve, 1500))
          setBusy(false)
        }}
      >
        {fields()}
      </Form>
    )
  },
}
