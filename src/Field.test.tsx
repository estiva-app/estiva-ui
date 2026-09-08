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
 *
 * **Stage 3 (2026-09-07) moved the association to Base UI's `Field`**, so the
 * context and the `useFieldControlId` opt-in are gone. The guard is the same
 * and matters more, because the mechanism is no longer ours to read.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Field } from './Field'
import { TextInput } from './TextInput'
import { Textarea } from './Textarea'
import { Select } from './Select'
import { SearchInput } from './SearchInput'
import { ChipInput } from './ChipInput'
import { Checkbox } from './Checkbox'

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
    // Two Fields on one form is the case a single hardcoded id gets wrong.
    // Asserted because "it works with one field" is the version of this that
    // ships broken.
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

  it('keeps the pair when the caller names the control itself', () => {
    // This reverses on Base UI, and the new behaviour is the better one. Ours
    // made the *Field* win — the control's own id was overridden — because two
    // halves of one association cannot be set from two places and only the
    // Field could set both. Base UI sets both from the control's id instead,
    // so a caller who needs a particular id keeps it and the label follows.
    // What the test guards is unchanged: the pair holds either way.
    render(
      <Field label="Title">
        <TextInput id="chosen-by-the-caller" defaultValue="" />
      </Field>,
    )
    const input = screen.getByLabelText('Title')
    expect(input.tagName).toBe('INPUT')
    expect(input.id).toBe('chosen-by-the-caller')
  })

  it('gives a control outside a Field an id of its own, and nothing else', () => {
    // Also reversed, and worth stating rather than deleting. Ours left a lone
    // control untouched; Base UI's `Input` always generates an id, because it
    // cannot know whether a `Field` will describe it. The id is inert — no
    // label, no `aria-describedby` points at it — so nothing reads differently;
    // an app that asserted on the absence of `id` is the only thing this
    // reaches, and neither app does.
    const { container } = render(<TextInput defaultValue="" />)
    const input = container.querySelector('input')!
    expect(input.getAttribute('id')).toBeTruthy()
    expect(input.getAttribute('aria-labelledby')).toBeNull()
    expect(input.getAttribute('aria-describedby')).toBeNull()
  })

  /**
   * The asterisk is a picture of `required`; `aria-required` is the word for
   * it. Drawing the mark and telling nobody was all this prop did until
   * 2026-09-08 — measured, the control carried neither attribute.
   */
  it('marks a required field, in the mark and in the control', () => {
    render(
      <Field label="Title" required>
        <TextInput defaultValue="" />
      </Field>,
    )
    expect(screen.getByText('*')).toBeTruthy()
    const control = screen.getByLabelText(/Title/)
    expect(control.tagName).toBe('INPUT')
    expect(control.getAttribute('aria-required')).toBe('true')
  })

  it('leaves a control that already says so alone', () => {
    render(
      <Field label="Title" required>
        <TextInput defaultValue="" aria-required={false} />
      </Field>,
    )
    expect(screen.getByLabelText(/Title/).getAttribute('aria-required')).toBe('false')
  })

  /**
   * Every control the package offers, because a promise that holds for two of
   * them is not a promise. `Select`, `ChipInput` and `Checkbox` take fixed
   * prop lists rather than spreading what they are given, so each had to be
   * told — measured 2026-09-08: all three dropped it silently.
   */
  it.each([
    ['TextInput', <TextInput key="t" defaultValue="" />, 'input'],
    ['Textarea', <Textarea key="a" defaultValue="" />, 'textarea'],
    ['SearchInput', <SearchInput key="s" />, 'input'],
    ['Select', <Select key="e" value="a" onChange={() => {}} options={[{ value: 'a', label: 'A' }]} />, '[role="combobox"]'],
    ['ChipInput', <ChipInput key="c" value={[]} onChange={() => {}} options={[]} />, 'input'],
    ['Checkbox', <Checkbox key="k" checked={false} onChange={() => {}} />, '[role="checkbox"]'],
  ])('marks a required %s', (_name, control, selector) => {
    const { container } = render(
      <Field label="Title" required>
        {control}
      </Field>,
    )
    expect(container.querySelector(selector)?.getAttribute('aria-required')).toBe('true')
  })

  it('does not mark a field that is not required', () => {
    render(
      <Field label="Title">
        <TextInput defaultValue="" />
      </Field>,
    )
    expect(screen.getByLabelText(/Title/).hasAttribute('aria-required')).toBe(false)
  })

  it('announces the helper line, which the hand-built spans never did', () => {
    render(
      <Field label="Folder link" helper="Leave empty and the project gets a Folder of its own.">
        <TextInput defaultValue="" />
      </Field>,
    )
    const input = screen.getByLabelText('Folder link')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy!)?.textContent).toBe('Leave empty and the project gets a Folder of its own.')
  })

  it('replaces the helper with the error, and marks the control invalid', () => {
    // Both at once asks the reader to work out which one is live, and the two
    // callers this prop came from both wrote `error ?? helper`. `aria-invalid`
    // is Base UI's now — Ship passed it by hand beside every one of these.
    render(
      <Field label="Folder link" helper="Leave empty and the project gets a Folder of its own." error="That is not a Folder link.">
        <TextInput defaultValue="" />
      </Field>,
    )
    const input = screen.getByLabelText('Folder link')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(screen.queryByText('Leave empty and the project gets a Folder of its own.')).toBeNull()
    const describedBy = input.getAttribute('aria-describedby')
    expect(document.getElementById(describedBy!)?.textContent).toBe('That is not a Folder link.')
  })

  it('renders no line, and no wrapper, when there is neither', () => {
    // The port must not move a pixel for the callers that predate these props,
    // so the control stays a direct child of the Field exactly as before.
    const { container } = render(
      <Field label="Title">
        <TextInput defaultValue="" />
      </Field>,
    )
    const root = container.firstElementChild!
    expect(root.children).toHaveLength(2)
    expect(root.children[1].tagName).toBe('INPUT')
  })
})
