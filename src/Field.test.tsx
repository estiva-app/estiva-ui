// @vitest-environment jsdom
/**
 * The label names its control — SHA-17.
 *
 * It did not. `Field` rendered a `<label>` with no `htmlFor` and the control as
 * its *sibling*, so there was neither an explicit nor an implicit association:
 * a screen reader announced an unlabelled edit box, and clicking the label
 * focused nothing.
 *
 * These are the first DOM tests in this package, and they exist because the
 * defect cannot be seen without a document. It surfaced in a *consumer's* test
 * — `getByLabelText(/title/i)` in Peek's ActionFormPanel suite, failing with
 * "Found a label with the text of: /title/i, however no form control was found
 * associated to that label". That message is the bug stated precisely, and the
 * consumer worked around it by querying by role. The guard belongs here, where
 * the next primitive added under Field will meet it.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Field } from './Field'
import { TextInput } from './TextInput'
import { Textarea } from './Textarea'

// Testing Library registers its own cleanup only when vitest runs with
// `globals: true`, and this package does not — so the first two tests passed,
// the third found two elements labelled "Title", and the failure read like a
// bug in the component.
afterEach(cleanup)

describe('Field', () => {
  it('names a TextInput, so it is reachable by its label', () => {
    render(
      <Field label="Title">
        <TextInput defaultValue="" />
      </Field>,
    )
    expect(screen.getByLabelText('Title').tagName).toBe('INPUT')
  })

  it('names a Textarea too', () => {
    render(
      <Field label="Description">
        <Textarea defaultValue="" />
      </Field>,
    )
    expect(screen.getByLabelText('Description').tagName).toBe('TEXTAREA')
  })

  it('points the label at the control it wraps, not at some other field', () => {
    // Two Fields on one form is the case a single hardcoded id gets wrong, and
    // `useId` is what makes it right. Asserted because "it works with one
    // field" is the version of this that ships broken.
    const { container } = render(
      <form>
        <Field label="Title">
          <TextInput defaultValue="" />
        </Field>
        <Field label="Description">
          <Textarea defaultValue="" />
        </Field>
      </form>,
    )
    const labels = [...container.querySelectorAll('label')]
    const ids = labels.map((l) => l.getAttribute('for'))
    expect(ids.filter(Boolean)).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    expect(screen.getByLabelText('Title')).toBe(container.querySelector(`#${CSS.escape(ids[0]!)}`))
    expect(screen.getByLabelText('Description')).toBe(container.querySelector(`#${CSS.escape(ids[1]!)}`))
  })

  it('wins over an id the caller put on the control, rather than breaking the pair', () => {
    // The first version of this asserted the opposite — that a control keeps
    // its own id inside a Field — and it failed with this ticket's own error
    // message, because the label went on pointing at the generated id. Two
    // halves of one association cannot be set from two places.
    //
    // So the Field wins, and `htmlFor` below is how a caller chooses. Silently
    // overriding an id is a smaller surprise than silently unlabelling a
    // control, and only one of the two is invisible until somebody uses a
    // screen reader.
    render(
      <Field label="Title">
        <TextInput id="chosen-by-the-caller" defaultValue="" />
      </Field>,
    )
    const input = screen.getByLabelText('Title')
    expect(input.tagName).toBe('INPUT')
    expect(input.id).not.toBe('chosen-by-the-caller')
  })

  it('lets the Field be told the id instead, for the same reason', () => {
    render(
      <Field label="Title" htmlFor="named-outside">
        <TextInput defaultValue="" />
      </Field>,
    )
    expect(screen.getByLabelText('Title').id).toBe('named-outside')
  })

  it('leaves a control outside a Field alone', () => {
    // `useFieldControlId` returns undefined outside a provider, so nothing
    // acquires a stray id — a control with an id it did not ask for is its own
    // small bug.
    const { container } = render(<TextInput defaultValue="" />)
    expect(container.querySelector('input')?.getAttribute('id')).toBeNull()
  })

  it('still marks a required field, which was the only thing it did before', () => {
    render(
      <Field label="Title" required>
        <TextInput defaultValue="" />
      </Field>,
    )
    expect(screen.getByText('*')).toBeTruthy()
    expect(screen.getByLabelText(/Title/).tagName).toBe('INPUT')
  })
})
