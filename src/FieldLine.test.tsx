// @vitest-environment jsdom
/**
 * What the Field line page claims (0.12.2, ADOPTION B24).
 *
 * The line exists because three surfaces in Peek put one under a *group* of
 * controls and had to spell `text-xs text-error-default` by hand — and none of
 * those hand-written spans was announced. Both halves are pinned here: the
 * role, and that the tones are the same classes `Field` draws.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Field, FieldLine } from './Field'
import { TextInput } from './TextInput'

afterEach(cleanup)

describe('FieldLine', () => {
  it('announces an error, and is polite otherwise', () => {
    const { unmount } = render(<FieldLine tone="error">That could not be saved.</FieldLine>)
    expect(screen.getByRole('alert').textContent).toBe('That could not be saved.')
    unmount()

    render(
      <>
        <FieldLine tone="warning">Saved, not announced.</FieldLine>
        <FieldLine>A hint.</FieldLine>
      </>,
    )
    const polite = screen.getAllByRole('status')
    expect(polite.map((el) => el.textContent)).toEqual(['Saved, not announced.', 'A hint.'])
    expect(screen.queryByRole('alert')).toBe(null)
  })

  it('wears the same classes as the line a Field draws', () => {
    // The point of one map: a caller who moves a line out of a Field, or into
    // one, must not see the line change.
    render(
      <>
        <Field label="Label" helper="A hint." error="That could not be saved.">
          <TextInput />
        </Field>
        <FieldLine tone="error">That could not be saved.</FieldLine>
      </>,
    )
    const inField = screen.getAllByText('That could not be saved.')[0]
    const alone = screen.getByRole('alert')
    expect(alone.className).toBe(inField.className)
  })

  it('takes extra classes without losing its tone', () => {
    render(<FieldLine tone="error" className="mt-1">Nope.</FieldLine>)
    const line = screen.getByRole('alert')
    expect(line.className).toContain('mt-1')
    expect(line.className).toContain('text-error-default')
  })
})
